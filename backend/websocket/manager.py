"""
websocket/manager.py — WebSocket streaming handler for the Strategy Research Terminal.

Bridges the synchronous, blocking engine with FastAPI's async WebSocket layer using:
  - asyncio.Queue for message passing from thread → event loop
  - loop.run_in_executor() to run the engine in a thread pool (non-blocking)
  - asyncio.run_coroutine_threadsafe() to put messages onto the queue from the thread
  - threading.Event for disconnect signaling (thread-safe, unlike asyncio.Event)

Message flow:
    Engine thread → emit() → asyncio.run_coroutine_threadsafe → asyncio.Queue
    Event loop   → queue.get() → websocket.send_json()

Disconnect handling (deliberate design decision):
    When a client disconnects mid-run:
      1. The `disconnected` threading.Event is set.
      2. All subsequent emit() calls become no-ops (fast path, no queue put).
      3. The engine continues to completion in the thread pool.
      4. The asyncio.Queue and future are garbage collected after the coroutine exits.

    Rationale: The engine's run() loop is synchronous — there is no cooperative
    cancellation point. Calling future.cancel() after run_in_executor() does NOT
    interrupt a running synchronous function. The cleanest option is to let it
    finish silently. CPU cost is paid once either way.

emit_callback message types (from engine.py, forwarded unchanged):
    { "type": "progress", "bar": int, "total": int, "percent": float,
      "equity": float, "timestamp": str }
    { "type": "trade", "symbol": str, "side": str, "quantity": int,
      "fill_price": float, "timestamp": str }
    { "type": "dividend", "symbol": str, "dividend_per_share": float,
      "timestamp": str }

Messages added by this layer:
    { "type": "complete", "metrics": { ...MetricsResult fields... } }
    { "type": "error", "message": str }
"""

import asyncio
import threading
from typing import Optional

from fastapi import WebSocket

import config  # noqa: F401 — triggers sys.path setup before engine imports

from engine.config import BacktestConfig, StrategyConfig
from run_backtest import run_backtest_from_config


# ---------------------------------------------------------------------------
# Config conversion
# ---------------------------------------------------------------------------

def _build_engine_config(req) -> BacktestConfig:
    """
    Convert a BacktestRequestSchema (Pydantic) to the engine's BacktestConfig.

    This is the bridge between the API layer and the engine contract.
    All field names and units must match engine/config.py exactly.
    """
    return BacktestConfig(
        symbols          = req.symbols,
        strategy         = StrategyConfig(
            type         = req.strategy.type,
            parameters   = req.strategy.parameters,
            python_code  = req.strategy.python_code,
        ),
        start_date       = req.start_date,
        end_date         = req.end_date,
        interval         = req.interval,
        initial_capital  = req.initial_capital,
        position_sizing  = req.position_sizing,
        position_size    = req.position_size,    # percentage mode: 10.0 = 10%, /100 inside run_backtest_from_config
        risk_per_trade   = req.risk_per_trade,   # fraction: 0.02 = 2%
        stop_fraction    = req.stop_fraction,
        benchmark_symbol = req.benchmark_symbol,
        include_dividends= req.include_dividends,
        commission_model = req.commission_model,
        commission_value = req.commission_value,
        slippage_bps     = req.slippage_bps,
    )


def _serialize_metrics(result) -> dict:
    """
    Serialize a MetricsResult dataclass to a JSON-safe dict.

    All fields verified against engine/metrics.py MetricsResult definition.
    Optional fields (sharpe_ratio, cagr, etc.) may be None — JSON null is fine.
    """
    return {
        "total_return":               result.total_return,
        "price_return":               result.price_return,
        "total_return_with_dividends":result.total_return_with_dividends,
        "cagr":                       result.cagr,
        "sharpe_ratio":               result.sharpe_ratio,
        "max_drawdown":               result.max_drawdown,
        "volatility":                 result.volatility,
        "win_rate":                   result.win_rate,
        "total_trades":               result.total_trades,
        "avg_trade_return":           result.avg_trade_return,
        "total_dividend_income":      result.total_dividend_income,
        "initial_value":              result.initial_value,
        "final_value":                result.final_value,
        "benchmark_return":           result.benchmark_return,
        "alpha":                      result.alpha,
        "total_commission_paid":      result.total_commission_paid,
    }


# ---------------------------------------------------------------------------
# Engine thread function
# ---------------------------------------------------------------------------

def _run_engine_in_thread(req, emit_fn, shutdown_event: threading.Event) -> dict:
    """
    Blocking engine execution — runs in thread pool executor.

    Returns a dict with:
      { "ok": True,  "metrics": {...} }   on success
      { "ok": False, "error": "..." }     on failure
    """
    try:
        engine_config = _build_engine_config(req)
        result = run_backtest_from_config(
            config        = engine_config,
            emit_callback = emit_fn,
            data_dir      = config.DATA_DIR,
            shutdown_event= shutdown_event,
        )
        return {"ok": True, "metrics": _serialize_metrics(result)}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


# ---------------------------------------------------------------------------
# Main streaming coroutine
# ---------------------------------------------------------------------------

async def run_and_stream(
    websocket: WebSocket,
    req,
    user_id: Optional[str] = None,
) -> None:
    """
    Run the backtest engine in a thread pool and stream all results live.

    Lifecycle:
        1. Create asyncio.Queue, threading.Event (disconnected flag), and paused_event.
        2. Define emit() — called from engine thread, bridges to the async queue.
           Cooperatively blocks/sleeps if paused_event is set.
        3. Launch engine via loop.run_in_executor() — non-blocking.
        4. Launch background task to listen for client WS actions (pause/resume/stop).
        5. Drain queue in a loop, forwarding each message to the WebSocket.
        6. When future is done AND queue is empty → send 'complete' or 'error'.
        7. On any disconnect/send error → set disconnected flag, exit cleanly.
    """
    queue: asyncio.Queue = asyncio.Queue()
    loop  = asyncio.get_running_loop()

    # threading.Events for thread-safe cross-loop signaling
    disconnected = threading.Event()
    paused_event = threading.Event()
    
    # Store equity curve data points
    equity_curve = []
    trades = []

    # ------------------------------------------------------------------
    # emit() — the engine's callback, called synchronously from thread pool
    # ------------------------------------------------------------------
    def emit(message: dict) -> None:
        """
        Bridge synchronous engine thread → async event loop queue.

        Fast-path: if client has disconnected, drop the message immediately.
        """
        if disconnected.is_set():
            return  # deliberate no-op: client gone, engine still running

        # Cooperative pausing check — block the thread if paused
        import time
        while paused_event.is_set() and not disconnected.is_set():
            time.sleep(0.05)

        if disconnected.is_set():
            return

        # Schedule queue.put() on the event loop from this thread
        asyncio.run_coroutine_threadsafe(queue.put(message), loop)

    # ------------------------------------------------------------------
    # Launch engine — non-blocking (runs in default ThreadPoolExecutor)
    # ------------------------------------------------------------------
    future = loop.run_in_executor(None, _run_engine_in_thread, req, emit, disconnected)

    # ------------------------------------------------------------------
    # Background task to read incoming client control messages
    # ------------------------------------------------------------------
    async def read_client_messages():
        try:
            while not disconnected.is_set():
                data = await websocket.receive_json()
                action = data.get("action")
                if action == "pause":
                    paused_event.set()
                    # Broadcast status update
                    await websocket.send_json({"type": "status_update", "status": "paused"})
                elif action == "resume":
                    paused_event.clear()
                    # Broadcast status update
                    await websocket.send_json({"type": "status_update", "status": "running"})
                elif action == "stop":
                    disconnected.set()
                    paused_event.clear()  # break any pausing locks
                    break
        except Exception:
            pass

    reader_task = asyncio.create_task(read_client_messages())

    # ------------------------------------------------------------------
    # Stream loop — drain queue and forward to WebSocket
    # ------------------------------------------------------------------
    try:
        while True:
            try:
                # Wait up to 100ms for next message.
                message = await asyncio.wait_for(queue.get(), timeout=0.1)
                
                # Accumulate equity curve points if progress update
                if message.get("type") == "progress":
                    equity_curve.append({
                        "timestamp": message.get("timestamp"),
                        "equity": message.get("equity")
                    })
                elif message.get("type") == "trade":
                    trades.append({
                        "symbol": message.get("symbol"),
                        "side": message.get("side"),
                        "quantity": message.get("quantity"),
                        "fill_price": message.get("fill_price"),
                        "timestamp": message.get("timestamp")
                    })
                
                await websocket.send_json(message)

            except asyncio.TimeoutError:
                # No message arrived within timeout window.
                # Check if engine is finished AND queue is fully drained.
                if future.done() and queue.empty():
                    result = future.result()

                    if result["ok"]:
                        db_run_id = None
                        if user_id:
                            try:
                                from db.database import AsyncSessionLocal
                                from db.models import BacktestRun
                                async with AsyncSessionLocal() as db:
                                    metrics = result["metrics"]
                                    run = BacktestRun(
                                        user_id         = user_id,
                                        symbols         = req.symbols,
                                        strategy_type   = req.strategy.type,
                                        strategy_params = req.strategy.parameters or {},
                                        start_date      = req.start_date,
                                        end_date        = req.end_date,
                                        interval        = req.interval,
                                        initial_capital = req.initial_capital,
                                        position_sizing = req.position_sizing,
                                        risk_per_trade  = req.risk_per_trade,
                                        benchmark_symbol= req.benchmark_symbol,
                                        status          = "complete",
                                        equity_curve    = equity_curve,
                                        trades          = trades,
                                        total_return    = metrics.get("total_return"),
                                        price_return    = metrics.get("price_return"),
                                        cagr            = metrics.get("cagr"),
                                        sharpe_ratio    = metrics.get("sharpe_ratio"),
                                        max_drawdown    = metrics.get("max_drawdown"),
                                        volatility      = metrics.get("volatility"),
                                        win_rate        = metrics.get("win_rate"),
                                        total_trades    = metrics.get("total_trades"),
                                        final_value     = metrics.get("final_value"),
                                        dividend_income = metrics.get("total_dividend_income"),
                                        benchmark_return = metrics.get("benchmark_return"),
                                        alpha           = metrics.get("alpha"),
                                    )
                                    db.add(run)
                                    await db.commit()
                                    await db.refresh(run)
                                    db_run_id = str(run.id)
                            except Exception as e:
                                print(f"[manager] Warning: could not save run to DB: {e}")

                        await websocket.send_json({
                            "type":    "complete",
                            "metrics": result["metrics"],
                            "db_run_id": db_run_id,
                        })
                    else:
                        await websocket.send_json({
                            "type":    "error",
                            "message": result["error"],
                        })
                    break  # normal exit — both sides done

    except Exception as send_error:
        disconnected.set()
        paused_event.clear()

        try:
            await websocket.send_json({
                "type":    "error",
                "message": f"Connection error: {send_error}",
            })
        except Exception:
            pass  # client already disconnected — nothing to send

    finally:
        # Always set flags and cancel client WS reader on exit
        disconnected.set()
        paused_event.clear()
        try:
            reader_task.cancel()
        except Exception:
            pass
