# Strategy Research Terminal — Agent Index & Implementation Plan
### Read this first. Every agent working on this codebase starts here.

---

## What This Document Is

This is the operational guide for building the Strategy Research Terminal. It tells an agent:
- What has already been built and is not to be touched
- What needs to be built next and in what order
- Where every file lives
- What every contract is
- What done means for each task

The master architecture document (`AI_Quant_Terminal_Master_Document_v2.md`) contains the full design. This document is the execution layer on top of it.

---

## Current Build Status

```
Backtester-Oriented-Market-Data-Pipeline    ✓ COMPLETE — DO NOT MODIFY
Event-Driven-Backtesting-Engine             ✓ COMPLETE — DO NOT MODIFY
strategy-research-terminal/backend          ✗ NOT STARTED — BUILD THIS NEXT
strategy-research-terminal/frontend         ✗ NOT STARTED — BUILD AFTER BACKEND
```

---

## Repository Locations

```
/Users/khushalarora/Documents/Career/Trading-System-Workspace/
├── market-data-pipeline/
│   ├── Backtester-Oriented-Market-Data-Pipeline/    ← Pipeline repo
│   └── Event-Driven-Backtesting-Engine/             ← Engine repo
└── strategy-research-terminal/                      ← Create this
    ├── backend/
    └── frontend/
```

---

## Agent Task Index

Jump directly to any task using these line references.

| Task | Description | Phase | Line |
|---|---|---|---|
| TASK-01 | Create FastAPI project structure | 3 | ~80 |
| TASK-02 | Environment variables + path config | 3 | ~120 |
| TASK-03 | Pydantic schemas | 3 | ~155 |
| TASK-04 | Data availability endpoints | 3 | ~220 |
| TASK-05 | Validation layer | 3 | ~265 |
| TASK-06 | Backtest launch endpoint | 3 | ~320 |
| TASK-07 | WebSocket streaming handler | 3 | ~375 |
| TASK-08 | End-to-end backend test | 3 | ~450 |
| TASK-09 | Next.js project setup | 4.1 | ~490 |
| TASK-10 | Zustand store | 4.1 | ~530 |
| TASK-11 | Strategy box component | 4.2 | ~570 |
| TASK-12 | Universe box + ticker chips | 4.2 | ~630 |
| TASK-13 | Date range + interval + risk slider | 4.2 | ~690 |
| TASK-14 | Run button + loading state | 4.2 | ~730 |
| TASK-15 | Backend connection — REST | 4.3 | ~760 |
| TASK-16 | Backend connection — WebSocket | 4.3 | ~800 |
| TASK-17 | Equity curve chart (live) | 4.4 | ~850 |
| TASK-18 | Progress bar | 4.4 | ~890 |
| TASK-19 | Metrics panel | 4.5 | ~920 |
| TASK-20 | Trade log | 4.5 | ~960 |
| TASK-21 | Ticker chip data availability | 4.6 | ~990 |
| TASK-22 | Toast notification system | 4.6 | ~1030 |
| TASK-23 | Preset strategies dropdown | 4.7 | ~1065 |
| TASK-24 | Python code editor (Monaco) | 4.8 | ~1100 |
| TASK-25 | LLM provider abstraction | 4.9 | ~1130 |
| TASK-26 | Strategy resolver | 4.9 | ~1175 |
| TASK-27 | Universe resolver | 4.9 | ~1220 |
| TASK-28 | AI report generator | 4.10 | ~1260 |
| TASK-29 | Drawdown + Rolling Sharpe charts | 4.10 | ~1295 |
| TASK-30 | Universe notes footer + final polish | 4.10 | ~1325 |

---

---

# Phase 3 — FastAPI Backend

## Rules for this phase

- Import the engine as a Python module. Do not subprocess it.
- Always set `data_dir` explicitly. Never rely on the default path resolution.
- The engine's `run()` is blocking. Always run it in `loop.run_in_executor()`.
- Validate every config with `BacktestConfig.validate()` before touching the engine.
- The engine already emits `progress`, `trade`, `dividend` messages. Forward them unchanged.
- Add `complete` and `error` message types in the FastAPI layer only.

---

## TASK-01 — Create FastAPI project structure

**What to build:**

```
strategy-research-terminal/
└── backend/
    ├── main.py
    ├── api/
    │   ├── __init__.py
    │   ├── routes.py
    │   └── schemas.py
    ├── orchestrator/
    │   ├── __init__.py
    │   └── launcher.py
    ├── websocket/
    │   ├── __init__.py
    │   └── manager.py
    ├── validation/
    │   ├── __init__.py
    │   └── config_validator.py
    └── requirements.txt
```

**`requirements.txt` contents:**
```
fastapi
uvicorn[standard]
pydantic
websockets
python-multipart
python-dotenv
```

**`main.py` skeleton:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

app = FastAPI(title="Strategy Research Terminal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}
```

**Done when:** `uvicorn main:app --reload` starts without error. `/health` returns `{"status": "ok"}`.

---

## TASK-02 — Environment variables + path config

**What to build:**

Create `backend/.env`:
```bash
DATA_DIR=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Backtester-Oriented-Market-Data-Pipeline/data
ENGINE_PATH=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Event-Driven-Backtesting-Engine
PIPELINE_PATH=/Users/khushalarora/Documents/Career/Trading-System-Workspace/market-data-pipeline/Backtester-Oriented-Market-Data-Pipeline
```

Create `backend/config.py`:
```python
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATA_DIR      = os.environ["DATA_DIR"]
ENGINE_PATH   = os.environ["ENGINE_PATH"]
PIPELINE_PATH = os.environ["PIPELINE_PATH"]

# Add both repos to sys.path so engine and pipeline are importable
if ENGINE_PATH not in sys.path:
    sys.path.insert(0, ENGINE_PATH)
if PIPELINE_PATH not in sys.path:
    sys.path.insert(0, PIPELINE_PATH)

# Validate at startup — fail loudly, not silently at request time
if not os.path.isdir(DATA_DIR):
    raise RuntimeError(f"DATA_DIR does not exist: {DATA_DIR}")
if not os.path.isdir(ENGINE_PATH):
    raise RuntimeError(f"ENGINE_PATH does not exist: {ENGINE_PATH}")
```

Import `config` at the top of `main.py` so path setup runs at startup.

**Done when:** Starting FastAPI with a bad `DATA_DIR` raises a `RuntimeError` immediately, not on first request.

---

## TASK-03 — Pydantic schemas

**File:** `backend/api/schemas.py`

```python
from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional, Dict, Any


class StrategyConfigSchema(BaseModel):
    type: str
    parameters: Dict[str, Any] = {}
    python_code: Optional[str] = None


class BacktestRequestSchema(BaseModel):
    symbols: List[str]
    strategy: StrategyConfigSchema
    start_date: date
    end_date: date
    interval: str = "1d"
    initial_capital: float = 100_000.0
    position_sizing: str = "risk_based"
    position_size: float = 100.0
    risk_per_trade: float = 0.02
    stop_fraction: float = 0.02
    benchmark_symbol: Optional[str] = "SPY"
    include_dividends: bool = True


class BacktestRunResponse(BaseModel):
    run_id: str
    status: str = "queued"


class SymbolInfoResponse(BaseModel):
    symbol: str
    exists: bool
    start: Optional[str]
    end: Optional[str]
    row_count: int
    has_dividends: bool
    dividend_start: Optional[str]
    dividend_end: Optional[str]


class ValidationErrorResponse(BaseModel):
    valid: bool
    errors: List[str]
```

**Done when:** All schemas import without error. Run `python -c "from api.schemas import BacktestRequestSchema; print('ok')"`.

---

## TASK-04 — Data availability endpoints

**File:** `backend/api/routes.py`

```python
import uuid
from fastapi import APIRouter, HTTPException
from api.schemas import SymbolInfoResponse, BacktestRequestSchema, BacktestRunResponse
import config  # triggers path setup

from market_data.api import get_symbol_info, get_symbols

router = APIRouter()


@router.get("/data/info/{symbol}", response_model=SymbolInfoResponse)
def get_data_info(symbol: str):
    """
    Return data availability metadata for a symbol.
    Called by the frontend on every ticker chip add.
    """
    info = get_symbol_info(symbol.upper(), data_dir=config.DATA_DIR)
    return SymbolInfoResponse(symbol=symbol.upper(), **info)


@router.get("/data/symbols")
def list_symbols():
    """Return all symbols with available OHLCV data."""
    return {"symbols": get_symbols(data_dir=config.DATA_DIR)}
```

**Done when:**
- `GET /api/data/info/AAPL` returns correct metadata for AAPL
- `GET /api/data/info/FAKESYMBOL` returns `{ "exists": false, ... }`
- `GET /api/data/symbols` returns a list of available symbols

---

## TASK-05 — Validation layer

**File:** `backend/validation/config_validator.py`

```python
from datetime import date
from typing import List
from api.schemas import BacktestRequestSchema
import config

from market_data.api import get_symbol_info
from engine.strategy import STRATEGY_REGISTRY

INTRADAY_LIMITS = {
    "1m": 7, "2m": 60, "5m": 60, "15m": 60,
    "30m": 60, "1h": 730,
}

def validate_backtest_request(req: BacktestRequestSchema) -> List[str]:
    """
    Return a list of validation errors.
    Empty list means the config is valid and safe to run.
    """
    errors = []

    # Symbols
    if not req.symbols:
        errors.append("symbols list cannot be empty.")

    for symbol in req.symbols:
        info = get_symbol_info(symbol, data_dir=config.DATA_DIR)
        if not info["exists"]:
            errors.append(f"No data found for symbol '{symbol}'.")

    # Dates
    if req.start_date >= req.end_date:
        errors.append("start_date must be before end_date.")
    if req.end_date > date.today():
        errors.append("end_date cannot be in the future.")

    # Interval vs date range
    if req.interval in INTRADAY_LIMITS:
        from datetime import timedelta
        max_days = INTRADAY_LIMITS[req.interval]
        if (req.end_date - req.start_date).days > max_days:
            errors.append(
                f"Interval '{req.interval}' only supports {max_days} days of history. "
                f"Reduce your date range."
            )

    # Capital
    if req.initial_capital <= 0:
        errors.append("initial_capital must be positive.")

    # Position sizing
    valid_sizing = {"fixed", "percentage", "risk_based"}
    if req.position_sizing not in valid_sizing:
        errors.append(f"position_sizing must be one of {valid_sizing}.")
    if req.position_sizing == "percentage" and not (0 < req.position_size <= 100):
        errors.append(
            "position_size must be in (0, 100] for percentage mode. "
            "Pass 10.0 for 10%, not 0.10."
        )

    # Risk
    if not (0 < req.risk_per_trade <= 0.20):
        errors.append("risk_per_trade must be in (0, 0.20].")

    # Strategy
    if req.strategy.type not in STRATEGY_REGISTRY and not req.strategy.python_code:
        errors.append(
            f"Unknown strategy type '{req.strategy.type}'. "
            f"Available: {list(STRATEGY_REGISTRY.keys())}"
        )

    return errors
```

**Done when:** Calling `validate_backtest_request()` with bad inputs returns a list of descriptive error strings. Valid inputs return an empty list.

---

## TASK-06 — Backtest launch endpoint

**File:** `backend/api/routes.py` (add to existing)

```python
import asyncio
from typing import Dict
from fastapi import APIRouter, HTTPException

# In-memory run registry — maps run_id → config
_run_registry: Dict[str, BacktestRequestSchema] = {}


@router.post("/backtest/run", response_model=BacktestRunResponse)
def launch_backtest(req: BacktestRequestSchema):
    """
    Validate and register a backtest run. Returns a run_id.
    The actual execution happens when the client connects via WebSocket.
    """
    from validation.config_validator import validate_backtest_request

    errors = validate_backtest_request(req)
    if errors:
        raise HTTPException(status_code=422, detail={"errors": errors})

    run_id = str(uuid.uuid4())
    _run_registry[run_id] = req
    return BacktestRunResponse(run_id=run_id)


def get_run_config(run_id: str) -> BacktestRequestSchema:
    """Retrieve a registered run config by ID."""
    if run_id not in _run_registry:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    return _run_registry[run_id]
```

**Done when:**
- `POST /api/backtest/run` with valid payload returns `{ "run_id": "...", "status": "queued" }`
- `POST /api/backtest/run` with invalid payload returns `422` with error list

---

## TASK-07 — WebSocket streaming handler

**File:** `backend/websocket/manager.py`

```python
import asyncio
import sys
from typing import Callable

from fastapi import WebSocket
import config  # noqa — triggers sys.path setup

from engine.config import BacktestConfig, StrategyConfig
from run_backtest import run_backtest_from_config


def _build_engine_config(req) -> BacktestConfig:
    """Convert the Pydantic request schema to the engine's BacktestConfig."""
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
        position_size    = req.position_size,
        risk_per_trade   = req.risk_per_trade,
        stop_fraction    = req.stop_fraction,
        benchmark_symbol = req.benchmark_symbol,
        include_dividends= req.include_dividends,
    )


async def run_and_stream(websocket: WebSocket, req) -> None:
    """
    Run the backtest engine in a thread pool and stream results
    to the WebSocket client via an asyncio queue.

    Engine emits: progress, trade, dividend
    We add:       complete, error
    """
    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def emit(message: dict) -> None:
        """Called synchronously from the engine thread."""
        asyncio.run_coroutine_threadsafe(queue.put(message), loop)

    def run_engine() -> dict:
        """Runs in thread pool executor. Returns serialized MetricsResult."""
        try:
            engine_config = _build_engine_config(req)
            result = run_backtest_from_config(
                config        = engine_config,
                emit_callback = emit,
                data_dir      = config.DATA_DIR,
            )
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
                "total_dividend_income":      result.total_dividend_income,
                "initial_value":              result.initial_value,
                "final_value":                result.final_value,
                "benchmark_return":           result.benchmark_return,
                "alpha":                      result.alpha,
            }
        except Exception as e:
            return {"error": str(e)}

    # Launch engine in thread pool (non-blocking)
    future = loop.run_in_executor(None, run_engine)

    # Stream queue messages to client
    engine_done = False
    while True:
        try:
            message = await asyncio.wait_for(queue.get(), timeout=0.1)
            await websocket.send_json(message)
        except asyncio.TimeoutError:
            # Check if engine finished
            if future.done() and queue.empty():
                result = future.result()
                if "error" in result:
                    await websocket.send_json({"type": "error", "message": result["error"]})
                else:
                    await websocket.send_json({"type": "complete", "metrics": result})
                break
        except Exception as e:
            await websocket.send_json({"type": "error", "message": str(e)})
            break
```

**File:** `backend/main.py` (add WebSocket route)

```python
from fastapi import WebSocket, WebSocketDisconnect
from api.routes import get_run_config
from websocket.manager import run_and_stream

@app.websocket("/ws/backtest/{run_id}")
async def websocket_backtest(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        req = get_run_config(run_id)
        await run_and_stream(websocket, req)
    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()
```

**Done when:**
1. `POST /api/backtest/run` with valid AAPL config returns a `run_id`
2. Connect WebSocket to `/ws/backtest/{run_id}`
3. Receive a stream of `progress` messages, at least one `trade` message, a `complete` message with metrics
4. Disconnect cleanly

---

## TASK-08 — End-to-end backend test

**What to verify before touching the frontend:**

```bash
# 1. Start the server
cd backend && uvicorn main:app --reload --port 8000

# 2. Health check
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# 3. Symbol info
curl http://localhost:8000/api/data/info/AAPL
# Expected: {"symbol":"AAPL","exists":true,"start":"...","end":"...","row_count":...}

curl http://localhost:8000/api/data/info/FAKESYMBOL
# Expected: {"symbol":"FAKESYMBOL","exists":false,...}

# 4. Launch backtest
curl -X POST http://localhost:8000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL"],
    "strategy": {"type": "moving_average_crossover", "parameters": {"short_window": 5, "long_window": 20}},
    "start_date": "2022-01-01",
    "end_date": "2024-01-01",
    "initial_capital": 100000,
    "position_sizing": "fixed",
    "position_size": 100
  }'
# Expected: {"run_id":"<uuid>","status":"queued"}

# 5. Connect WebSocket (use websocat or wscat)
# websocat ws://localhost:8000/ws/backtest/<run_id>
# Expected: stream of progress messages, then complete message with metrics

# 6. Validation test
curl -X POST http://localhost:8000/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{"symbols":[],"strategy":{"type":"momentum"},"start_date":"2024-01-01","end_date":"2022-01-01","initial_capital":0}'
# Expected: 422 with errors list
```

**Done when:** All 6 checks pass. The backend is verified before the frontend touches it.

---

---

# Phase 4 — Next.js Frontend

## Rules for this phase

- Every phase is tested against the real FastAPI backend before moving to the next.
- No mocking the API. If the backend isn't running, the frontend isn't testable.
- State lives in Zustand. Components read from the store, not from each other.
- WebSocket messages update the store directly. Components react to store changes.
- LLM calls happen client-side using the user's API key. The backend never sees the API key.

---

## TASK-09 — Next.js project setup

```bash
cd strategy-research-terminal
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir
cd frontend
npm install zustand recharts @monaco-editor/react lucide-react
npx shadcn@latest init
npx shadcn@latest add button input slider tabs card badge toast
```

**Create `frontend/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

**Create folder structure:**
```
frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── input/
│   ├── charts/
│   ├── analytics/
│   ├── report/
│   ├── notifications/
│   └── editor/
├── store/
│   └── terminalStore.ts
├── hooks/
│   ├── useBacktest.ts
│   └── useWebSocket.ts
├── llm/
│   ├── providers.ts
│   ├── strategyResolver.ts
│   ├── universeResolver.ts
│   └── reportGenerator.ts
├── constants/
│   └── presetStrategies.ts
└── types/
    └── index.ts
```

**Done when:** `npm run dev` runs on port 3000 with no errors.

---

## TASK-10 — Zustand store

**File:** `frontend/store/terminalStore.ts`

```typescript
import { create } from 'zustand'

export type RunStatus = 'idle' | 'resolving' | 'validating' | 'running' | 'complete' | 'error'
export type Interval = '1d' | '1h' | '30m' | '15m' | '5m' | '2m' | '1m'
export type StrategyMode = 'nl' | 'python'
export type UniverseMode = 'nl' | 'tickers'

export interface TickerSymbol {
  symbol: string
  status: 'loading' | 'ok' | 'partial' | 'error'
  availableFrom?: string
  availableTo?: string
  rowCount?: number
}

export interface EquityPoint {
  timestamp: string
  equity: number
}

export interface Trade {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  fill_price: number
  timestamp: string
}

export interface BacktestMetrics {
  total_return: number
  price_return: number
  total_return_with_dividends: number
  cagr: number | null
  sharpe_ratio: number | null
  max_drawdown: number
  volatility: number | null
  win_rate: number | null
  total_trades: number
  total_dividend_income: number
  initial_value: number
  final_value: number
  benchmark_return: number | null
  alpha: number | null
}

interface TerminalState {
  // Input
  strategyInput: string
  strategyMode: StrategyMode
  strategyConfig: object | null
  universeInput: string
  universeMode: UniverseMode
  symbols: TickerSymbol[]
  startDate: string
  endDate: string
  interval: Interval
  capital: number
  riskPerTrade: number       // fraction: 0.005–0.10

  // Run state
  runId: string | null
  status: RunStatus
  progress: number
  errorMessage: string | null

  // Live results
  equityCurve: EquityPoint[]
  trades: Trade[]
  currentEquity: number

  // Final results
  metrics: BacktestMetrics | null
  report: string | null

  // Actions
  setStrategyInput: (v: string) => void
  setStrategyMode: (m: StrategyMode) => void
  setStrategyConfig: (c: object | null) => void
  setUniverseInput: (v: string) => void
  setUniverseMode: (m: UniverseMode) => void
  addSymbol: (s: TickerSymbol) => void
  removeSymbol: (symbol: string) => void
  updateSymbol: (symbol: string, update: Partial<TickerSymbol>) => void
  setStartDate: (d: string) => void
  setEndDate: (d: string) => void
  setInterval: (i: Interval) => void
  setCapital: (c: number) => void
  setRiskPerTrade: (r: number) => void
  setRunId: (id: string | null) => void
  setStatus: (s: RunStatus) => void
  setProgress: (p: number) => void
  appendEquityPoint: (p: EquityPoint) => void
  appendTrade: (t: Trade) => void
  setCurrentEquity: (e: number) => void
  setMetrics: (m: BacktestMetrics) => void
  setReport: (r: string) => void
  setError: (msg: string) => void
  resetRun: () => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
  strategyInput: '',
  strategyMode: 'nl',
  strategyConfig: null,
  universeInput: '',
  universeMode: 'tickers',
  symbols: [],
  startDate: '',
  endDate: '',
  interval: '1d',
  capital: 100_000,
  riskPerTrade: 0.02,
  runId: null,
  status: 'idle',
  progress: 0,
  errorMessage: null,
  equityCurve: [],
  trades: [],
  currentEquity: 0,
  metrics: null,
  report: null,

  setStrategyInput: (v) => set({ strategyInput: v }),
  setStrategyMode: (m) => set({ strategyMode: m }),
  setStrategyConfig: (c) => set({ strategyConfig: c }),
  setUniverseInput: (v) => set({ universeInput: v }),
  setUniverseMode: (m) => set({ universeMode: m }),
  addSymbol: (s) => set((state) => ({
    symbols: state.symbols.find(x => x.symbol === s.symbol)
      ? state.symbols
      : [...state.symbols, s]
  })),
  removeSymbol: (symbol) => set((state) => ({
    symbols: state.symbols.filter(s => s.symbol !== symbol)
  })),
  updateSymbol: (symbol, update) => set((state) => ({
    symbols: state.symbols.map(s => s.symbol === symbol ? { ...s, ...update } : s)
  })),
  setStartDate: (d) => set({ startDate: d }),
  setEndDate: (d) => set({ endDate: d }),
  setInterval: (i) => set({ interval: i }),
  setCapital: (c) => set({ capital: c }),
  setRiskPerTrade: (r) => set({ riskPerTrade: r }),
  setRunId: (id) => set({ runId: id }),
  setStatus: (s) => set({ status: s }),
  setProgress: (p) => set({ progress: p }),
  appendEquityPoint: (p) => set((state) => ({ equityCurve: [...state.equityCurve, p] })),
  appendTrade: (t) => set((state) => ({ trades: [...state.trades, t] })),
  setCurrentEquity: (e) => set({ currentEquity: e }),
  setMetrics: (m) => set({ metrics: m }),
  setReport: (r) => set({ report: r }),
  setError: (msg) => set({ status: 'error', errorMessage: msg }),
  resetRun: () => set({
    runId: null, status: 'idle', progress: 0, errorMessage: null,
    equityCurve: [], trades: [], currentEquity: 0, metrics: null, report: null,
  }),
}))
```

**Done when:** Import compiles without TypeScript errors.

---

## TASK-11 — Strategy box component

**File:** `frontend/components/input/StrategyBox.tsx`

Two tabs: Natural Language and Python Code. NL tab is a textarea. Python tab is a placeholder (Monaco added in TASK-24).

Preset strategies dropdown below the box. Clicking a preset sets `strategyConfig` directly in the store without going through the LLM.

**Behaviour:**
- Tab switch saves the current input to the correct store field
- Preset dropdown appears in both tabs but only works meaningfully in NL mode
- Strategy config is null until either: preset selected, or LLM resolution completes, or Python code is submitted

**Done when:** User can type in the NL tab, switch to Python tab without losing NL input, select a preset and see it reflected in the store.

---

## TASK-12 — Universe box + ticker chips

**File:** `frontend/components/input/UniverseBox.tsx`
**File:** `frontend/components/input/TickerChip.tsx`

Two tabs: Describe (NL) and Tickers (manual).

Tickers tab:
- Input accepts typing + paste of comma-separated symbols
- On enter/comma: call `GET /api/data/info/{symbol}` and add chip with loading state
- Update chip to `ok`, `partial`, or `error` based on response
- Partial: show `⚠` indicator with tooltip showing available date range
- Error: show `✗` indicator, chip still visible but flagged
- `×` button removes chip

Chip visual states:
```
AAPL ✓  ×          — data available
PLTR ⚠  ×          — partial history (hover shows from date)
FAKE ✗  ×          — no data found
TSLA ⋯  ×          — loading
```

Deduplication: silently ignore if symbol already exists in list.

**Done when:** Adding AAPL shows `✓`, adding FAKESYMBOL shows `✗`, adding PLTR (if data starts 2020) shows `⚠` with date tooltip.

---

## TASK-13 — Date range + interval + risk slider

**File:** `frontend/components/input/DateRangePicker.tsx`
**File:** `frontend/components/input/IntervalSelector.tsx`
**File:** `frontend/components/input/RiskSlider.tsx`

**DateRangePicker:**
- Two inputs: start date, end date. DD/MM/YYYY format.
- Quick preset buttons: 1Y, 3Y, 5Y, 10Y, Custom
- Clicking preset populates both fields (end = today, start = today minus period)
- Inline validation: end before start shows error
- Future end date hard-capped at today

**IntervalSelector:**
- Dropdown with 7 options. Show data limit alongside each:

```
1 Day     (full history)
1 Hour    (last 2 years)
30 Min    (last 60 days)
15 Min    (last 60 days)
5 Min     (last 60 days)
2 Min     (last 60 days)
1 Min     (last 7 days)
```

- On intraday selection: auto-constrain start date, fire toast

**RiskSlider:**
- Range: 0.5% to 10%
- Default: 2%
- Step: 0.5%
- Display current value as percentage next to slider
- Updates `riskPerTrade` in store as fraction (e.g. slider at 2% → store value `0.02`)

**Done when:** All three components render, update the Zustand store correctly, and the slider shows the correct value.

---

## TASK-14 — Run button + loading state

**File:** `frontend/components/input/RunButton.tsx`

States:
- `idle` → "▶ Run Backtest" (enabled)
- `resolving` → "Resolving strategy..." (spinner, disabled)
- `validating` → "Validating..." (spinner, disabled)
- `running` → "Running... 45%" (progress, disabled)
- `complete` → "▶ Run Backtest" (re-enabled, shows results below)
- `error` → "▶ Run Backtest" (re-enabled, error shown in toast)

Disabled when: no symbols added, no dates set, status is not idle.

**Done when:** Button correctly reflects all status states from the Zustand store.

---

## TASK-15 — Backend connection: REST

**File:** `frontend/hooks/useBacktest.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function launchBacktest(payload: object): Promise<string> {
  const res = await fetch(`${API_URL}/api/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err.detail))
  }
  const data = await res.json()
  return data.run_id
}

export async function getSymbolInfo(symbol: string) {
  const res = await fetch(`${API_URL}/api/data/info/${symbol}`)
  return res.json()
}
```

Build the payload construction function that maps Zustand store state to `BacktestRequestSchema`:
- `riskPerTrade` from store is already a fraction — send it as-is to `risk_per_trade`
- `position_sizing` defaults to `"risk_based"` unless user explicitly chose fixed/percentage

**Done when:** Clicking Run with valid inputs calls `POST /api/backtest/run` and stores the `run_id`.

---

## TASK-16 — Backend connection: WebSocket

**File:** `frontend/hooks/useWebSocket.ts`

```typescript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL

export function connectBacktest(runId: string, store: TerminalStoreActions) {
  const ws = new WebSocket(`${WS_URL}/ws/backtest/${runId}`)

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)

    if (msg.type === 'progress') {
      store.setProgress(msg.percent)
      store.setCurrentEquity(msg.equity)
      store.appendEquityPoint({ timestamp: msg.timestamp, equity: msg.equity })
    }
    else if (msg.type === 'trade') {
      store.appendTrade(msg)
    }
    else if (msg.type === 'complete') {
      store.setMetrics(msg.metrics)
      store.setStatus('complete')
      ws.close()
    }
    else if (msg.type === 'error') {
      store.setError(msg.message)
      ws.close()
    }
  }

  ws.onerror = () => store.setError('WebSocket connection failed.')
  ws.onclose = () => { if (store.status === 'running') store.setError('Connection closed unexpectedly.') }

  return ws
}
```

**Done when:** With FastAPI running, clicking Run streams live equity updates into the store and the status reaches `complete` with metrics populated.

---

## TASK-17 — Equity curve chart (live streaming)

**File:** `frontend/components/charts/EquityCurve.tsx`

- Uses Recharts `LineChart`
- Data source: `equityCurve` from Zustand store
- Updates live as WebSocket messages arrive
- Toggle: Price Return / Total Return
- When benchmark data available: second line for SPY
- Tooltip shows: date, equity value, % return from start
- Trade markers: vertical reference lines at trade timestamps

**Done when:** Chart renders and animates in real time during a backtest run.

---

## TASK-18 — Progress bar

**File:** Part of `frontend/components/input/RunButton.tsx` or standalone.

- Shows percentage during `running` status
- Sourced from `progress` in Zustand store
- Disappears when `complete`

**Done when:** Progress bar fills from 0 to 100 during a run.

---

## TASK-19 — Metrics panel

**File:** `frontend/components/analytics/MetricsPanel.tsx`

Display all fields from `BacktestMetrics`. Show when `status === 'complete'`.

```
Initial Value        $100,000.00
Final Value          $134,200.00
Price Return         +29.8%
Dividend Income      $4,200.00
Total Return         +34.2%
CAGR                 +8.4%
Sharpe Ratio         1.48
Max Drawdown         4.21%
Volatility           12.3%
Win Rate             63.4%
Total Trades         42
Benchmark Return     +28.1%
Alpha                +6.1%
```

`null` fields show as "—". Negative returns in red, positive in green.

**Done when:** All metrics display correctly after a completed backtest.

---

## TASK-20 — Trade log

**File:** `frontend/components/analytics/TradeLog.tsx`

Scrollable table. Populates live during run from `trades` in Zustand store.

Columns: Date | Symbol | Side | Qty | Price

Side: BUY in green, SELL in red/amber.

**Done when:** Trade log populates in real time as trades stream in during a backtest.

---

## TASK-21 — Ticker chip data availability

Already partially built in TASK-12. Complete the integration:

- On chip add: call `GET /api/data/info/{symbol}`, update chip state
- If `exists: false` → error state, warn user, block run
- If data start is after the selected backtest start date → partial state with `⚠`
- Toast: "PLTR has data from Sep 2020 — included from that date onwards"
- Hover tooltip on `⚠` chip: shows exact available range

**Done when:** The chip system correctly reflects all three states (ok, partial, error) with the right toasts.

---

## TASK-22 — Toast notification system

**File:** `frontend/components/notifications/ToastManager.tsx`

Bottom-right, non-blocking. Uses shadcn/ui `toast` or a custom implementation.

Auto-dismiss after 6 seconds. Stays if hovered.

Multiple toasts queue rather than stack all at once.

Triggered by:
- Partial history on ticker add
- Date range auto-constraint from interval selection
- Deduplication (symbol already in list)
- Universe too large (>100 symbols)
- Market holiday date adjustment

**Done when:** All trigger conditions fire the correct toast messages.

---

## TASK-23 — Preset strategies dropdown

**File:** `frontend/constants/presetStrategies.ts`

```typescript
export const PRESET_STRATEGIES = {
  moving_average_crossover: {
    label: "Moving Average Crossover",
    description: "Buy when short MA crosses above long MA",
    defaultConfig: {
      type: "moving_average_crossover",
      parameters: { short_window: 20, long_window: 50 }
    }
  },
  momentum: {
    label: "Momentum",
    description: "Buy when rate of change exceeds threshold",
    defaultConfig: {
      type: "momentum",
      parameters: { lookback: 20, threshold: 0.02 }
    }
  },
  mean_reversion: {
    label: "Mean Reversion",
    description: "Buy dips below Bollinger Band lower band",
    defaultConfig: {
      type: "mean_reversion",
      parameters: { window: 20, num_std: 2.0 }
    }
  },
  rsi: {
    label: "RSI",
    description: "Buy oversold, sell overbought via RSI",
    defaultConfig: {
      type: "rsi",
      parameters: { period: 14, oversold: 30, overbought: 70 }
    }
  },
  macd: {
    label: "MACD",
    description: "Buy on MACD signal line crossover",
    defaultConfig: {
      type: "macd",
      parameters: { fast: 12, slow: 26, signal: 9 }
    }
  },
  breakout: {
    label: "Breakout",
    description: "Buy new N-bar highs, sell new N-bar lows",
    defaultConfig: {
      type: "breakout",
      parameters: { lookback: 52 }
    }
  },
  bollinger_bands: {
    label: "Bollinger Band Squeeze",
    description: "Buy breakout after low-volatility squeeze",
    defaultConfig: {
      type: "bollinger_bands",
      parameters: { window: 20, num_std: 2.0, squeeze_factor: 0.02 }
    }
  },
  dual_momentum: {
    label: "Dual Momentum",
    description: "Absolute + relative momentum combined",
    defaultConfig: {
      type: "dual_momentum",
      parameters: { lookback: 20, avg_lookback: 5 }
    }
  },
  trend_following: {
    label: "Trend Following",
    description: "Buy when EMA slope is rising",
    defaultConfig: {
      type: "trend_following",
      parameters: { period: 50 }
    }
  },
  volume_weighted_mean_reversion: {
    label: "Volume-Weighted Mean Reversion",
    description: "Buy when price deviates below VWAP",
    defaultConfig: {
      type: "volume_weighted_mean_reversion",
      parameters: { window: 20, threshold: 0.02 }
    }
  },
}
```

Dropdown in `StrategyBox` maps these to clickable options. Selecting one sets `strategyConfig` in the store directly — no LLM call.

**Done when:** All 10 presets appear in dropdown. Selecting one populates `strategyConfig` immediately and clicking Run executes the correct strategy.

---

## TASK-24 — Python code editor (Monaco)

**File:** `frontend/components/editor/StrategyEditor.tsx`

Renders in the Python tab of `StrategyBox`. Uses `@monaco-editor/react`.

Settings:
- Language: Python
- Theme: matches site dark/light theme
- Min height: 200px, resizable

On submit: the python_code string is sent as `strategy.python_code` in the backtest request. `strategy.type` is set to `"custom"` (the backend must handle this — add a passthrough for `python_code` in the validation layer).

Note: Custom Python strategy execution is not yet wired in the engine. The field exists in `StrategyConfig.python_code` but the engine needs a dynamic execution path added for this to work end-to-end. For now, submitting Python code will reach the backend but the engine will fall back to an error from `build_strategy()`. This is a known limitation to be addressed after the LLM layer is working.

**Done when:** Monaco editor renders in the Python tab with syntax highlighting. Code typed in the editor is stored in the Zustand store.

---

## TASK-25 — LLM provider abstraction

**File:** `frontend/llm/providers.ts`

```typescript
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMProvider {
  name: string
  complete(messages: LLMMessage[], systemPrompt: string): Promise<string>
}

export function getProvider(provider: string, apiKey: string): LLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey)
    case 'anthropic':
      return new AnthropicProvider(apiKey)
    case 'groq':
      return new GroqProvider(apiKey)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}
```

Each provider implements `complete()` using `fetch()` to the provider's API. API key stored in component state or localStorage — never sent to the FastAPI backend.

**Done when:** At least one provider (e.g. Groq) successfully completes a test prompt and returns a string response.

---

## TASK-26 — Strategy resolver

**File:** `frontend/llm/strategyResolver.ts`

System prompt must tell the LLM:
- Return only valid JSON, no markdown, no preamble
- Use only these strategy types: `moving_average_crossover | momentum | mean_reversion | rsi | macd | breakout | bollinger_bands | dual_momentum | trend_following | volume_weighted_mean_reversion`
- Never use parameter names not in the schema
- Default to sensible values when the user doesn't specify

```typescript
const SYSTEM_PROMPT = `
You are a quantitative trading strategy parser.
Convert the user's strategy description into a JSON config.
Return ONLY valid JSON with no markdown or explanation.

Schema:
{
  "type": "<strategy_type>",
  "parameters": { <param>: <value>, ... }
}

Valid strategy types and their parameters:
- moving_average_crossover: short_window (int), long_window (int)
- momentum: lookback (int), threshold (float)
- mean_reversion: window (int), num_std (float)
- rsi: period (int), oversold (float), overbought (float)
- macd: fast (int), slow (int), signal (int)
- breakout: lookback (int)
- bollinger_bands: window (int), num_std (float), squeeze_factor (float)
- dual_momentum: lookback (int), avg_lookback (int)
- trend_following: period (int)
- volume_weighted_mean_reversion: window (int), threshold (float)

If the user input is ambiguous, pick the closest matching strategy with sensible defaults.
`

export async function resolveStrategy(
  input: string,
  provider: LLMProvider
): Promise<object> {
  const response = await provider.complete(
    [{ role: 'user', content: input }],
    SYSTEM_PROMPT
  )
  try {
    return JSON.parse(response)
  } catch {
    throw new Error(`LLM returned invalid JSON: ${response}`)
  }
}
```

**Done when:** Typing "momentum strategy with 20 day lookback" returns `{"type":"momentum","parameters":{"lookback":20,"threshold":0.02}}`.

---

## TASK-27 — Universe resolver

**File:** `frontend/llm/universeResolver.ts`

System prompt tells LLM to return a JSON array of well-known, real ticker symbols only. No hallucinated tickers.

```typescript
const SYSTEM_PROMPT = `
You are a stock universe resolver.
Convert the user's description into a JSON array of real US stock ticker symbols.
Return ONLY a valid JSON array of strings. No markdown, no explanation.
Limit to 20 symbols maximum.
Only include real, currently listed stocks traded on NYSE or NASDAQ.
Example output: ["AAPL","MSFT","NVDA","GOOGL"]
`
```

After resolution, the frontend calls `GET /api/data/info/{symbol}` for each returned symbol to check availability before adding chips.

**Done when:** "large cap US tech stocks" returns an array of real, recognizable symbols.

---

## TASK-28 — AI report generator

**File:** `frontend/llm/reportGenerator.ts`

Called after `status === 'complete'` and metrics are available.

Sends only the metrics summary to the LLM — never raw trade data or price series.

System prompt instructs LLM to write a professional quantitative research report in markdown covering: strategy observations, performance strengths, weaknesses, risk commentary, benchmark comparison, market context.

Output rendered by `frontend/components/report/AIReport.tsx` using a markdown renderer (e.g. `react-markdown`).

**Done when:** After a completed backtest, clicking "Generate Report" produces a markdown report that renders correctly.

---

## TASK-29 — Drawdown + Rolling Sharpe charts

**File:** `frontend/components/charts/DrawdownChart.tsx`
**File:** `frontend/components/charts/RollingSharpChart.tsx`

Both use `equityCurve` from the store to compute derived series.

DrawdownChart: compute running drawdown from peak at each point. Display as area chart below zero.

RollingSharpChart: compute Sharpe over a rolling 60-bar window. Display as line chart.

Both render after run completes. Neither streams live (compute from final `equityCurve`).

**Done when:** Both charts render with meaningful data after a backtest.

---

## TASK-30 — Universe notes footer + final polish

Add to the results panel:

```
Universe Notes:
— PLTR: data available from Sep 2020, included from that date onwards
— All other symbols: full backtest period (2022–2024)
— Prices: split-adjusted close. Source: Yahoo Finance.
```

Source the notes from `symbols` in the store (partial chips).

Final polish checklist:
- All toasts firing for correct conditions
- Benchmark overlay on equity curve (if `benchmark_return` not null)
- Price return / total return toggle working
- Error states render informatively, not just a blank screen
- Run can be re-triggered after completion without refresh
- Previous results cleared on new run (`resetRun()`)

**Done when:** Full end-to-end flow works: NL input → LLM → FastAPI → Engine → WebSocket → live chart → metrics → AI report.

---

---

# Final Verification Checklist

Run this after TASK-30 before considering the project complete:

```
□ Natural language strategy input → correct strategy config generated
□ Natural language universe input → correct symbol list generated
□ Preset strategy selection → no LLM call, correct config sent
□ Manual ticker entry → correct data availability shown on chips
□ Partial history ticker → ⚠ chip, toast, footnote in results
□ Unknown ticker → ✗ chip, run blocked
□ Date validation → end before start blocked, future end blocked
□ Intraday interval → date range auto-constrained, toast shown
□ Risk slider at 1% vs 5% → different position sizes, different results
□ Run Backtest → progress bar fills, equity chart updates live
□ Trade tape populates during run
□ Dividend income shows in metrics (use AAPL over multi-year period)
□ Total return > price return when dividends present
□ Complete message → full metrics panel appears
□ AI report generates and renders as markdown
□ Determinism: same config run twice → identical final metrics
□ Backend not running → clear error, not blank screen
□ 108 engine tests still pass (run from engine repo)
```

---

*Implementation Plan v1.0 — Phases 1 and 2 complete. Start at TASK-01.*
