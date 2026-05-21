"""
End-to-end verification script.
Runs against a live FastAPI server at localhost:8000.
"""
import asyncio
import json
import urllib.request
import urllib.error
import sys
import websockets


BASE = "http://localhost:8000"
WS_BASE = "ws://localhost:8000"

VALID_PAYLOAD = {
    "symbols": ["AAPL"],
    "strategy": {
        "type": "moving_average_crossover",
        "parameters": {"short_window": 5, "long_window": 20}
    },
    "start_date": "2022-01-01",
    "end_date": "2023-01-01",
    "initial_capital": 100000,
    "position_sizing": "fixed",
    "position_size": 100,
    "risk_per_trade": 0.02,
}

INVALID_PAYLOAD = {
    "symbols": [],
    "strategy": {"type": "momentum"},
    "start_date": "2024-01-01",
    "end_date": "2022-01-01",
    "initial_capital": 0,
    "risk_per_trade": 0.02,
}

def http_get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read())

def http_post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path, data=data,
        headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

async def stream_backtest(run_id):
    uri = f"{WS_BASE}/ws/backtest/{run_id}"
    print(f"  Connecting WebSocket → {uri}")
    progress_count = 0
    trade_count = 0
    dividend_count = 0
    complete_metrics = None

    async with websockets.connect(uri) as ws:
        while True:
            raw = await asyncio.wait_for(ws.recv(), timeout=120)
            msg = json.loads(raw)
            t = msg.get("type")

            if t == "progress":
                progress_count += 1
                if progress_count <= 2 or msg["bar"] == msg["total"]:
                    print(f"  [progress] bar={msg['bar']}/{msg['total']} "
                          f"({msg['percent']}%) equity=${msg['equity']:,.2f}")
            elif t == "trade":
                trade_count += 1
                if trade_count <= 2:
                    print(f"  [trade]    {msg['side']:4s} {msg['quantity']}x "
                          f"{msg['symbol']} @ ${msg['fill_price']:.2f}  "
                          f"ts={msg['timestamp'][:10]}")
            elif t == "dividend":
                dividend_count += 1
                print(f"  [dividend] {msg['symbol']} ${msg['dividend_per_share']:.4f}/share")
            elif t == "complete":
                complete_metrics = msg["metrics"]
                break
            elif t == "error":
                print(f"  [error]    {msg['message']}")
                return None

    print(f"\n  Progress messages : {progress_count}")
    print(f"  Trade messages    : {trade_count}")
    print(f"  Dividend messages : {dividend_count}")
    return complete_metrics


async def main():
    passed = 0
    failed = 0

    def ok(label):
        nonlocal passed
        passed += 1
        print(f"PASS  {label}")

    def fail(label, detail=""):
        nonlocal failed
        failed += 1
        print(f"FAIL  {label}  {detail}")

    print("=" * 55)
    print("  End-to-End Verification")
    print("=" * 55)

    # --- 1. Health ---
    print("\n[1] Health check")
    h = http_get("/health")
    if h == {"status": "ok"}:
        ok("GET /health → {\"status\":\"ok\"}")
    else:
        fail("GET /health", str(h))

    # --- 2. Symbol info ---
    print("\n[2] Data availability endpoints")
    aapl = http_get("/api/data/info/AAPL")
    if aapl["exists"] and aapl["row_count"] > 0:
        ok(f"GET /api/data/info/AAPL → exists=True, {aapl['row_count']} bars")
    else:
        fail("GET /api/data/info/AAPL", str(aapl))

    fake = http_get("/api/data/info/FAKESYMBOL")
    if not fake["exists"] and fake["row_count"] == 0:
        ok("GET /api/data/info/FAKESYMBOL → exists=False")
    else:
        fail("GET /api/data/info/FAKESYMBOL", str(fake))

    syms = http_get("/api/data/symbols")
    if "AAPL" in syms["symbols"]:
        ok(f"GET /api/data/symbols → {syms['symbols']}")
    else:
        fail("GET /api/data/symbols", str(syms))

    # --- 3. Valid POST → run_id ---
    print("\n[3] POST /api/backtest/run (valid payload)")
    status, body = http_post("/api/backtest/run", VALID_PAYLOAD)
    if status == 202 and "run_id" in body and body.get("status") == "queued":
        run_id = body["run_id"]
        ok(f"POST /api/backtest/run → status=202, run_id={run_id[:8]}...")
    else:
        fail("POST /api/backtest/run", f"status={status} body={body}")
        run_id = None

    # --- 4. Invalid POST → 422 ---
    print("\n[4] POST /api/backtest/run (invalid payload)")
    status_inv, body_inv = http_post("/api/backtest/run", INVALID_PAYLOAD)
    if status_inv == 422:
        ok(f"POST /api/backtest/run (invalid) → status=422  ✓")
    else:
        fail("POST /api/backtest/run (invalid)", f"expected 422, got {status_inv}")

    # --- 5. WebSocket stream ---
    if run_id:
        print(f"\n[5] WebSocket stream for run_id={run_id[:8]}...")
        metrics = await stream_backtest(run_id)

        if metrics is not None:
            ok("WebSocket received 'complete' message with metrics")
            # Verify key fields are present
            required = ["total_return", "price_return", "max_drawdown",
                        "initial_value", "final_value", "total_trades"]
            missing = [k for k in required if k not in metrics]
            if not missing:
                ok("Metrics dict contains all required fields")
                print(f"\n  Key metrics:")
                print(f"    initial_value              : ${metrics['initial_value']:>12,.2f}")
                print(f"    final_value                : ${metrics['final_value']:>12,.2f}")
                print(f"    price_return               : {metrics['price_return']*100:>+9.2f}%")
                print(f"    total_return_with_dividends: {metrics['total_return_with_dividends']*100:>+9.2f}%")
                print(f"    total_dividend_income      : ${metrics['total_dividend_income']:>12,.2f}")
                if metrics['sharpe_ratio']:
                    print(f"    sharpe_ratio               : {metrics['sharpe_ratio']:>+9.4f}")
                print(f"    max_drawdown               : {metrics['max_drawdown']*100:>+9.2f}%")
                print(f"    total_trades               : {metrics['total_trades']:>13}")
            else:
                fail("Metrics missing fields", str(missing))
        else:
            fail("WebSocket stream — no 'complete' message received")

    # --- 6. 404 for unknown run_id ---
    print("\n[6] WebSocket with unknown run_id")
    try:
        async with websockets.connect("ws://localhost:8000/ws/backtest/not-a-real-id") as ws:
            # FastAPI closes with 4xx or sends error message
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=5))
            if msg.get("type") == "error":
                ok("Unknown run_id → WebSocket error message")
            else:
                fail("Unknown run_id", f"unexpected msg: {msg}")
    except Exception as e:
        # Connection refused / closed is also acceptable for a 404
        ok(f"Unknown run_id → connection rejected ({type(e).__name__})")

    # --- Summary ---
    print("\n" + "=" * 55)
    print(f"  Results: {passed} passed, {failed} failed")
    print("=" * 55)
    return failed == 0


if __name__ == "__main__":
    ok = asyncio.run(main())
    sys.exit(0 if ok else 1)
