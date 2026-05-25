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

async def run_and_stream(websocket: WebSocket, req) -> None:
    """
    Run the backtest engine in a thread pool and stream all results live.

    Lifecycle:
        1. Create asyncio.Queue and threading.Event (disconnected flag).
        2. Define emit() — called from engine thread, bridges to the async queue.
        3. Launch engine via loop.run_in_executor() — non-blocking.
        4. Drain queue in a loop, forwarding each message to the WebSocket.
        5. When future is done AND queue is empty → send 'complete' or 'error'.
        6. On any disconnect/send error → set disconnected flag, exit cleanly.

    Args:
        websocket : Accepted FastAPI WebSocket connection.
        req       : BacktestRequestSchema — the validated run config.
    """
    queue: asyncio.Queue = asyncio.Queue()
    loop  = asyncio.get_event_loop()

    # threading.Event — NOT asyncio.Event — because emit() is called from a
    # thread pool worker. threading.Event.is_set() and .set() are thread-safe.
    disconnected = threading.Event()

    # ------------------------------------------------------------------
    # emit() — the engine's callback, called synchronously from thread pool
    # ------------------------------------------------------------------
    def emit(message: dict) -> None:
        """
        Bridge synchronous engine thread → async event loop queue.

        Fast-path: if client has disconnected, drop the message immediately.
        This makes emit() a no-op for the remainder of the engine run after
        a disconnect — no queue growth, no exceptions, no crash.
        """
        if disconnected.is_set():
            return  # deliberate no-op: client gone, engine still running
        # Schedule queue.put() on the event loop from this thread
        asyncio.run_coroutine_threadsafe(queue.put(message), loop)

    # ------------------------------------------------------------------
    # Launch engine — non-blocking (runs in default ThreadPoolExecutor)
    # ------------------------------------------------------------------
    future = loop.run_in_executor(None, _run_engine_in_thread, req, emit, disconnected)

    # ------------------------------------------------------------------
    # Stream loop — drain queue and forward to WebSocket
    # ------------------------------------------------------------------
    try:
        while True:
            try:
                # Wait up to 100ms for next message.
                # Short timeout keeps the loop responsive for engine completion.
                message = await asyncio.wait_for(queue.get(), timeout=0.1)
                await websocket.send_json(message)

            except asyncio.TimeoutError:
                # No message arrived within timeout window.
                # Check if engine is finished AND queue is fully drained.
                # Both must be true — the engine may have enqueued messages
                # just before finishing that haven't been processed yet.
                if future.done() and queue.empty():
                    result = future.result()

                    if result["ok"]:
                        await websocket.send_json({
                            "type":    "complete",
                            "metrics": result["metrics"],
                        })
                    else:
                        await websocket.send_json({
                            "type":    "error",
                            "message": result["error"],
                        })
                    break  # normal exit — both sides done

    except Exception as send_error:
        # Catches WebSocketDisconnect, ConnectionClosedError, and any send failure.
        #
        # DELIBERATE DECISION: set disconnected flag so emit() becomes a no-op.
        # The engine continues to completion in the thread pool — we cannot stop it.
        # The queue and future will be garbage collected when this coroutine exits.
        #
        # We do NOT call future.cancel() because:
        #   - run_in_executor() wraps a sync function in a thread
        #   - cancel() on the Future only prevents it from starting if not yet running
        #   - once running, the thread cannot be interrupted from outside
        disconnected.set()

        # Attempt to send an error message — may fail if client is already gone.
        # Swallow the exception either way.
        try:
            await websocket.send_json({
                "type":    "error",
                "message": f"Connection error: {send_error}",
            })
        except Exception:
            pass  # client already disconnected — nothing to send

    finally:
        # Always set the flag on exit regardless of how we got here.
        # Ensures any lingering emit() calls in the engine thread are silent.
        disconnected.set()
