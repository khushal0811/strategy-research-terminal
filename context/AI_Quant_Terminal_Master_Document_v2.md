# Strategy Research Terminal — Master Architecture & Build Document
### Version 2.0 — Updated after Pipeline and Engine completion

---

## Index

> Use these line references to navigate this document directly.

| Section | Title | Line |
|---|---|---|
| 1 | Overall Architecture | 31 |
| 2 | Core Philosophy & Boundaries | 126 |
| 3 | Full System Component Map | 148 |
| 4 | UI/UX Design Decisions | 174 |
| 5 | Current State — Market Data Pipeline | 363 |
| 6 | Current State — Backtesting Engine | 400 |
| 7 | What Is Done — Pipeline & Engine Completion Summary | 460 |
| 8 | Not Started — FastAPI Backend Layer | 530 |
| 9 | Not Started — LLM Orchestration Layer | 650 |
| 10 | Not Started — Next.js Frontend | 760 |
| 11 | Not Started — WebSocket Streaming | 900 |
| 12 | Edge Cases & Handling Strategy | 950 |
| 13 | Build Order — Phase 3 Onwards | 1060 |
| 14 | Repository Structure (Target State) | 1110 |
| 15 | Key Contracts Locked Down | 1160 |

---

---

# Section 1 — Overall Architecture

## What We Are Building

The Strategy Research Terminal is an AI-assisted quantitative research and backtesting platform. It is NOT an autonomous trading bot. It is a professional-grade research environment where users describe trading ideas in natural language or code, and the platform simulates them deterministically over historical market data.

## The Single Most Important Principle

```
AI handles interpretation and orchestration.
Infrastructure handles execution and computation.
```

The backtesting engine and market data pipeline are completely pure. They receive structured configuration and return structured results. They contain no AI, no natural language processing, no prompt logic of any kind.

All AI, LLM calls, universe resolution, strategy interpretation, and natural language parsing happen exclusively in the frontend and orchestration layer.

## High-Level System Diagram

```
                          USER
                            │
                            ▼
              ┌─────────────────────────────┐
              │      Next.js Frontend        │
              │                             │
              │  ┌─────────┐ ┌───────────┐  │
              │  │Strategy │ │ Universe  │  │
              │  │  Box    │ │   Box     │  │
              │  │NL/Python│ │NL/Tickers │  │
              │  └─────────┘ └───────────┘  │
              │                             │
              │  ┌──────────────────────┐   │
              │  │ Date Range + Interval│   │
              │  │ Capital + Params     │   │
              │  │ Risk Per Trade Slider│   │
              │  └──────────────────────┘   │
              └──────────────┬──────────────┘
                             │
                    LLM Resolver (Frontend)
                    (NL → Structured Config)
                             │
                             ▼
              ┌─────────────────────────────┐
              │      FastAPI Backend         │  ← NOT STARTED
              │                             │
              │  Validation Layer           │
              │  Backtest Launcher          │
              │  WebSocket Manager          │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │   Event-Driven Backtesting   │  ← COMPLETE ✓
              │         Engine              │
              │  (Pure, Deterministic)       │
              │                             │
              │  10 Strategies + Registry   │
              │  3 OrderManagers            │
              │  emit_callback streaming    │
              │  Full metrics suite         │
              │  BacktestConfig contract    │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │   Market Data Pipeline       │  ← COMPLETE ✓
              │  (Pure Infrastructure)       │
              │                             │
              │  auto_adjust=True           │
              │  Dividend ingestion         │
              │  get_data_info() API        │
              │  Intraday support           │
              │  DividendEvent streaming    │
              └─────────────────────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │     WebSocket Stream         │  ← NOT STARTED
              │  Live equity curve          │
              │  Trade tape                 │
              │  Progress updates           │
              └──────────────┬──────────────┘
                             │
                             ▼
                    Next.js Realtime UI        ← NOT STARTED
                    Charts, Analytics,
                    AI Report
```

---

# Section 2 — Core Philosophy & Boundaries

## What Each Layer Is Allowed To Do

| Layer | Allowed | Not Allowed |
|---|---|---|
| Market Data Pipeline | Fetch, normalize, store, stream data | Know about strategies, AI, backtests |
| Backtesting Engine | Consume config, simulate events, compute metrics | AI, NL parsing, orchestration |
| FastAPI Backend | Validate config, launch engine, stream results | LLM calls, strategy interpretation |
| LLM / Orchestration | Parse NL, generate configs, summarize results | Execute trades, modify fills, touch engine |
| Next.js Frontend | Render UI, call LLM, display results | Compute portfolio state, modify simulation |

## The Strategy Rule

The engine accepts structured strategy configuration only. All predefined strategies (top 10 dropdown) and user-defined Python strategies are resolved and validated in the frontend before being sent to the engine. The engine does not know or care where the strategy config came from.

## The Universe Rule

Universe resolution — whether from natural language ("large cap US tech") or a manually typed ticker list — is fully resolved in the frontend into a plain list of symbols before anything is sent to the backend. The backend receives only `["AAPL", "MSFT", "NVDA"]`.

---

# Section 3 — Full System Component Map

## Three Physical Repos

```
trading-system-workspace/
├── Backtester-Oriented-Market-Data-Pipeline/   ← Repo 1 — COMPLETE ✓
├── Event-Driven-Backtesting-Engine/             ← Repo 2 — COMPLETE ✓
└── strategy-research-terminal/                  ← Repo 3 — NOT STARTED
    ├── backend/
    │   ├── main.py               FastAPI app entry point
    │   ├── api/                  Routes + Pydantic schemas
    │   ├── orchestrator/         Backtest launch + lifecycle
    │   ├── websocket/            Streaming manager
    │   └── validation/           Config validation layer
    └── frontend/
        ├── app/                  Next.js app router
        ├── components/           UI components
        ├── hooks/                Data fetching + WebSocket hooks
        ├── store/                Zustand state management
        ├── charts/               Recharts visualizations
        ├── llm/                  LLM resolver + prompt templates
        └── constants/            Preset strategies
```

---

# Section 4 — UI/UX Design Decisions

## Input Panel Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  STRATEGY                           UNIVERSE                    │
│  ┌──────────────────────────┐       ┌──────────────────────┐   │
│  │ [ Natural Language ]     │       │ [ Describe ]         │   │
│  │ [ Python Code    ] ←tab  │       │ [ Tickers   ] ←tab   │   │
│  │                          │       │                      │   │
│  │  Describe your strategy  │       │  e.g. AAPL  MSFT ×   │   │
│  │  or select from presets  │       │       NVDA ×         │   │
│  │                          │       │                      │   │
│  │  [Preset Strategies ▾]   │       │                      │   │
│  └──────────────────────────┘       └──────────────────────┘   │
│                                                                 │
│  START DATE      END DATE        INTERVAL        CAPITAL        │
│  [ DD/MM/YYYY ]  [ DD/MM/YYYY ]  [ 1 Day ▾ ]    [ $100,000 ]   │
│                                                                 │
│  Quick range: [ 1Y ] [ 3Y ] [ 5Y ] [ 10Y ] [ Custom ]          │
│                                                                 │
│  RISK PER TRADE                                                 │
│  0.5% ──●───────────────────────────────── 10%                 │
│         2%                                                      │
│                                                                 │
│                              [ ▶ Run Backtest ]                 │
└─────────────────────────────────────────────────────────────────┘
```

## Strategy Box — Two Modes

**Natural Language Tab:**
- Free text input
- LLM resolver converts to structured JSON config
- Sends structured config to engine

**Python Code Tab:**
- Monaco/CodeMirror embedded editor
- Syntax highlighting
- User defines signal logic directly
- Bypasses LLM entirely
- Config validated syntactically before sending

## Preset Strategies Dropdown

Sits below the strategy box. Populated entirely in the frontend as constants. Selecting a preset populates the strategy box. All 10 are implemented in the engine already.

1. Moving Average Crossover
2. Momentum (Rate of Change)
3. Mean Reversion (Bollinger Bands)
4. RSI Overbought/Oversold
5. MACD Signal Line Cross
6. Breakout (N-bar high/low)
7. Bollinger Bands Squeeze
8. Dual Momentum
9. Trend Following (EMA Slope)
10. Volume Weighted Mean Reversion

## Universe Box — Two Modes

**Describe Tab:**
- Free text: "large cap US tech stocks"
- LLM resolver returns explicit symbol list
- Symbols populate ticker chip view for review before running

**Tickers Tab:**
- Tag/chip input
- Type or paste comma-separated symbols
- Each symbol becomes a removable chip
- Data availability checked immediately on add via `get_symbol_info()`:

```
AAPL ✓   MSFT ✓   PLTR ⚠ (from Sep 2020)   ×
```

## Date Range & Interval

**Date boxes:**
- DD/MM/YYYY format
- Calendar picker + direct typing supported
- End date cannot precede start date (inline validation)
- End date hard capped at today

**Quick presets:**
- Clicking 1Y/3Y/5Y/10Y instantly populates both date boxes

**Interval dropdown:**

```
Interval
──────────────────────────────
● 1 Day     (full history)
  1 Hour    (last 2 years)
  30 Min    (last 60 days)
  15 Min    (last 60 days)
  5 Min     (last 60 days)
  2 Min     (last 60 days)
  1 Min     (last 7 days)
```

Selecting intraday automatically constrains the date range and fires a toast notification.

## Risk Per Trade Slider

Range: 0.5% to 10%, default 2%. Sits between date row and Run button.

Controls `risk_per_trade` in `BacktestConfig`. Maps to `RiskBasedOrderManager`.

**Contract:** Frontend sends `risk_per_trade` as a fraction (e.g. `0.02` for 2%). The engine's `BacktestConfig` validates it must be in `(0, 0.20]`.

```
RISK PER TRADE
0.5% ──●───────────────────────────────── 10%
       2%
```

## Toast Notification System

Non-blocking, bottom-right, auto-dismiss 6-8 seconds. Stays on hover.

Used for: partial ticker history, date range adjustments, market holiday rolls, deduplication, universe size warnings.

## Analytics Output Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  EQUITY CURVE          [ Price Return ] [ Total Return ]        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Live streaming, one point per bar                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  METRICS                          TRADE LOG                     │
│  Total Return      +34.2%         Date    Symbol  Side  P&L    │
│  Price Return      +29.8%         ...                          │
│  Dividend Income   $12,450                                      │
│  CAGR              +8.4%                                        │
│  Sharpe Ratio       1.48                                        │
│  Max Drawdown       4.21%                                       │
│  Volatility        12.3%                                        │
│  Win Rate          63.4%                                        │
│  Total Trades        42                                         │
│  Benchmark (SPY)   +28.1%                                       │
│  Alpha             +6.1%                                        │
│                                                                 │
│  AI RESEARCH REPORT                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Markdown rendered AI analysis                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

# Section 5 — Current State: Market Data Pipeline

## Status: COMPLETE ✓

All changes from the modifications document have been implemented and verified.

## What Is Built and Working

- `auto_adjust=True` confirmed in `ingestion.py` — splits handled automatically
- `fetch_dividends()` and `fetch_multiple_dividends()` — dividend ingestion working
- `save_dividends_to_parquet()` and `load_dividends_from_parquet()` — dividend storage working
- `get_data_info()` in `storage.py` — lightweight metadata query using PyArrow column projection
- `DividendEvent` dataclass in `events.py`
- `stream_dividends()` and `stream_multiple_with_dividends()` — merged chronological streaming
- `get_symbol_info()` exposed in `api.py` — frontend availability checking ready
- `stream_multi_symbol_with_dividends()` exposed in `api.py`
- `--dividends` flag added to `scripts/fetch_data.py` CLI
- Intraday column detection in `normalization.py` made robust
- Minimum versions pinned in `requirements.txt`

## Data Schema

```
timestamp   UTC timezone-aware datetime
symbol      string
open        float
high        float
low         float
close       float
volume      float
```

Dividend files: `<symbol>_dividends.parquet`

```
timestamp              UTC datetime
symbol                 string
dividend_per_share     float
```

## Key Design Decision

The pipeline receives only explicit symbol lists. It has no concept of universe resolution, AI, or strategies. That stays in the frontend.

---

# Section 6 — Current State: Backtesting Engine

## Status: COMPLETE ✓

All 12 changes from the modifications document have been implemented, tested, and verified. 108 tests pass.

## What Is Built and Working

**Events:**
- All 5 event types: `MARKET`, `SIGNAL`, `ORDER`, `FILL`, `DIVIDEND`
- `DividendEvent` dataclass

**DataHandler:**
- Loads OHLCV + dividend Parquet files
- `include_dividends` parameter
- `heapq.merge` chronological streaming — market bars before dividends on same timestamp
- `bar_count` and `dividend_count` properties

**Portfolio:**
- Every-bar equity snapshots in `bar_history`
- Fill-level snapshots in `history` (backwards compatible)
- `on_dividend_event()` — credits income for long positions only
- `total_dividend_income` property
- `last_price()` for order manager lookups

**OrderManagers:**
- `FixedSizeOrderManager` — unchanged, backwards compatible
- `PercentageOrderManager` — percentage of equity sizing
- `RiskBasedOrderManager` — risk-per-trade sizing (drives the frontend slider)

**Strategies — all 10 implemented:**
- `MovingAverageCrossover`
- `MomentumStrategy`
- `MeanReversionStrategy`
- `RSIStrategy`
- `MACDStrategy`
- `BreakoutStrategy`
- `BollingerBandsStrategy`
- `DualMomentumStrategy`
- `TrendFollowingStrategy`
- `VolumeWeightedMeanReversionStrategy`
- `STRATEGY_REGISTRY` — all 10 mapped
- `build_strategy()` — factory function for config-based instantiation

**Metrics — full suite:**
- `total_return`, `price_return`, `total_return_with_dividends`
- `sharpe_ratio`, `max_drawdown`, `volatility`
- `cagr`, `win_rate`, `total_trades`, `avg_trade_return`
- `total_dividend_income`, `benchmark_return`, `alpha`

**Engine:**
- `emit_callback` interface — emits `progress`, `trade`, `dividend` messages
- `emit_frequency` parameter
- Routes `DividendEvent` correctly — skips price update, goes directly to portfolio
- `run()` returns full `MetricsResult`

**Config:**
- `BacktestConfig` and `StrategyConfig` dataclasses
- `validate()` with clear error messages
- Position sizing contract locked down and documented

**Runner:**
- `run_backtest()` — original CLI function, unchanged
- `run_backtest_from_config()` — FastAPI entry point, accepts `BacktestConfig` + `emit_callback`

## The Position Sizing Contract (Locked)

| Field | Mode | Unit | Example |
|---|---|---|---|
| `position_size` | `fixed` | shares | `100` = 100 shares |
| `position_size` | `percentage` | % of equity | `10.0` = 10% |
| `risk_per_trade` | `risk_based` | fraction | `0.02` = 2% |

---

# Section 7 — What Is Done: Completion Summary

## Pipeline ✓

Everything in `PIPELINE_MODIFICATIONS.md` is implemented. The pipeline is production-ready infrastructure. It will not need to change for the frontend build.

## Engine ✓

Everything in `ENGINE_MODIFICATIONS.md` is implemented. 108 tests pass across 11 test groups covering: events, data handler, portfolio, order managers, strategies, execution, metrics, engine loop, config, determinism, and stress testing.

## What this means for Phase 3

The FastAPI layer can call `run_backtest_from_config()` directly. The engine contract is clean, tested, and documented. The only unknown the frontend build will encounter is in the FastAPI and WebSocket layers — not in the backend computation.

**One important note for Phase 3:** `data_dir` in `run_backtest_from_config()` defaults to a relative path resolution. Set it explicitly from an environment variable in FastAPI config rather than relying on the default. The working directory of a FastAPI server process may differ from what the default resolves to.

---

# Section 8 — Not Started: FastAPI Backend Layer

## Purpose

The FastAPI backend is the bridge between the Next.js frontend and the Python engine. It is the only new Python code that needs to be written.

## Project Structure

```
strategy-research-terminal/backend/
├── main.py                  FastAPI app entry point
├── api/
│   ├── routes.py            REST endpoints
│   └── schemas.py           Pydantic request/response models
├── orchestrator/
│   └── launcher.py          Engine run lifecycle manager
├── websocket/
│   └── manager.py           WebSocket connection + streaming
├── validation/
│   └── config_validator.py  Pre-engine validation
└── requirements.txt
```

## REST Endpoints

```
POST   /api/backtest/run          Launch a backtest, return run_id
GET    /api/backtest/{id}/status  Get run status
GET    /api/data/info/{symbol}    Get symbol data availability
GET    /api/data/symbols          List all available symbols
GET    /health                    Health check
```

## WebSocket Endpoint

```
WS     /ws/backtest/{run_id}      Stream live results
```

**Message types the engine already emits (ready to forward):**

```json
{ "type": "progress", "bar": 450, "total": 1000, "percent": 45.0,
  "equity": 112430.0, "timestamp": "2021-03-15T00:00:00" }

{ "type": "trade", "symbol": "AAPL", "side": "BUY",
  "quantity": 100, "fill_price": 142.5, "timestamp": "..." }

{ "type": "dividend", "symbol": "AAPL",
  "dividend_per_share": 0.24, "timestamp": "..." }
```

**Additional messages the FastAPI layer must emit:**

```json
{ "type": "complete", "metrics": { ... } }
{ "type": "error", "message": "..." }
```

## Pydantic Request Schema

```python
class StrategyConfigSchema(BaseModel):
    type: str
    parameters: dict = {}
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
```

## WebSocket Architecture

```
Next.js WebSocket Client
        ↕
FastAPI WebSocket Handler
        ↕
asyncio.Queue
        ↕
Engine emit_callback (synchronous, runs in thread pool)
        ↕
BacktestEngine.run() (blocking, in executor)
```

```python
@app.websocket("/ws/backtest/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await websocket.accept()
    queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def emit(message: dict):
        asyncio.run_coroutine_threadsafe(queue.put(message), loop)

    # Run engine in thread pool — non-blocking
    executor_task = loop.run_in_executor(
        None, run_engine_with_callback, config, emit
    )

    while True:
        message = await queue.get()
        await websocket.send_json(message)
        if message["type"] in ("complete", "error"):
            break
```

## Validation Layer

Before any engine launch, validate:
- All symbols exist in data store for the date range
- `start_date < end_date`
- Interval matches data availability limits
- Strategy type in `STRATEGY_REGISTRY` (or python_code provided)
- `initial_capital > 0`
- `risk_per_trade` in `(0, 0.20]`

Return structured validation errors — never crash silently.

## Environment Variables

```bash
DATA_DIR=/path/to/pipeline/data
ENGINE_PATH=/path/to/Event-Driven-Backtesting-Engine
PIPELINE_PATH=/path/to/Backtester-Oriented-Market-Data-Pipeline
```

## Tech Stack

```
fastapi
uvicorn[standard]
pydantic
websockets
python-multipart
```

---

# Section 9 — Not Started: LLM Orchestration Layer

## Purpose

Lives entirely in the Next.js frontend. Converts natural language inputs into structured backtest configurations. Never touches the engine or pipeline directly.

## Provider Abstraction

```typescript
interface LLMProvider {
  resolveStrategy(prompt: string): Promise<StrategyConfig>
  resolveUniverse(prompt: string): Promise<string[]>
  generateReport(metrics: BacktestMetrics): Promise<string>
}
```

Supported: OpenAI, Anthropic, Groq, Gemini. Users provide their own API keys.

## Strategy Resolver

**Input:** `"momentum strategy with 20 day lookback"`

**Output:**
```json
{
  "type": "momentum",
  "parameters": { "lookback": 20, "threshold": 0.02 }
}
```

Prompt must instruct LLM to return valid JSON only, use strategy types from `STRATEGY_REGISTRY`, never hallucinate parameter names, default to sensible values when not specified.

Valid strategy types the LLM must output:
```
moving_average_crossover | momentum | mean_reversion | rsi | macd
breakout | bollinger_bands | dual_momentum | trend_following
volume_weighted_mean_reversion
```

## Universe Resolver

**Input:** `"large cap US tech stocks"`

**Output:** `["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN"]`

After resolution, frontend checks data availability for each symbol via `GET /api/data/info/{symbol}`.

## Report Generator

Sends only metrics summary to LLM — never raw trade data or price series.

**Input:**
```json
{
  "strategy": "Momentum (20-day lookback)",
  "total_return": 0.342,
  "cagr": 0.084,
  "sharpe_ratio": 1.48,
  "max_drawdown": 0.0421,
  "win_rate": 0.634,
  "benchmark_return": 0.281,
  "alpha": 0.061,
  "total_dividend_income": 12450.0
}
```

**Output:** Markdown research report.

## Preset Strategy Constants

All 10 predefined strategies stored as frontend constants. Selecting a preset skips the LLM entirely.

```typescript
const PRESET_STRATEGIES = {
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
  // ... all 10
}
```

---

# Section 10 — Not Started: Next.js Frontend

## Tech Stack

```
Framework:      Next.js 14+ (App Router)
Styling:        Tailwind CSS
State:          Zustand
Charts:         Recharts
Code Editor:    Monaco Editor
WebSocket:      Native browser WebSocket
UI Components:  shadcn/ui
LLM:            Fetch to provider APIs (client-side, user's API key)
```

## Page Structure

```
/          Research Terminal (main page — input + results)
```

Single page. Results appear below or alongside the input panel after run.

## Component Architecture

```
components/
├── input/
│   ├── StrategyBox.tsx          Strategy input (NL + Python tabs)
│   ├── UniverseBox.tsx          Universe input (NL + Ticker tabs)
│   ├── TickerChip.tsx           Chip with availability indicator
│   ├── DateRangePicker.tsx      Start/end + quick presets
│   ├── IntervalSelector.tsx     Dropdown with limits shown inline
│   ├── RiskSlider.tsx           0.5%–10% risk per trade slider
│   └── RunButton.tsx            Launch + loading state
├── charts/
│   ├── EquityCurve.tsx          Live streaming chart (price/total toggle)
│   ├── DrawdownChart.tsx        Underwater equity
│   └── RollingSharpChart.tsx    Rolling Sharpe over time
├── analytics/
│   ├── MetricsPanel.tsx         All numeric metrics
│   ├── TradeLog.tsx             Scrollable live trade tape
│   └── BenchmarkComparison.tsx  Strategy vs SPY
├── report/
│   └── AIReport.tsx             Markdown rendered AI analysis
├── notifications/
│   └── ToastManager.tsx         Bottom-right toast system
└── editor/
    └── StrategyEditor.tsx       Monaco editor wrapper
```

## Zustand State Shape

```typescript
interface TerminalState {
  // Input
  strategyInput: string
  strategyMode: "nl" | "python"
  strategyConfig: StrategyConfig | null
  universeInput: string
  universeMode: "nl" | "tickers"
  symbols: TickerSymbol[]           // with availability metadata
  startDate: Date | null
  endDate: Date | null
  interval: Interval
  capital: number
  riskPerTrade: number              // 0.005–0.10, default 0.02

  // Run state
  runId: string | null
  status: "idle" | "resolving" | "validating" | "running" | "complete" | "error"
  progress: number

  // Live results (streaming)
  equityCurve: EquityPoint[]
  trades: Trade[]
  currentEquity: number

  // Final results
  metrics: BacktestMetrics | null
  report: string | null
}
```

## Backtest Run Flow

```
1. User clicks Run
2. If NL strategy → call LLM resolver → get StrategyConfig
3. If NL universe → call LLM resolver → get symbol list
4. Check data availability for all symbols (GET /api/data/info/{symbol})
5. Show partial history warnings (toasts + chip indicators)
6. POST /api/backtest/run → receive run_id
7. Connect WebSocket /ws/backtest/{run_id}
8. Stream equity curve, trades, progress live
9. On "complete" message: display full metrics
10. Call LLM report generator with metrics summary
11. Render markdown report
```

## Equity Curve

- One point per bar (bar_history from engine)
- Toggle between price return and total return
- SPY benchmark overlay as secondary line
- Hover tooltip: date, equity, drawdown
- Vertical markers at trade events

## Universe Notes Footer

All results include:
```
Universe Notes:
— PLTR: data from Sep 2020, included from that date
— All other symbols: full backtest period
— Prices: split-adjusted close. Source: Yahoo Finance.
```

---

# Section 11 — Not Started: WebSocket Streaming

## Architecture

Already fully designed — see Section 8. The engine emits `progress`, `trade`, and `dividend` messages via `emit_callback`. FastAPI wraps this in an `asyncio.Queue` and forwards to the browser WebSocket connection.

## Key Implementation Note

The engine's `run()` is synchronous and blocking. It must run in a thread pool executor (`loop.run_in_executor`) so it does not block FastAPI's async event loop. The `emit_callback` bridges the synchronous engine thread to the async queue using `asyncio.run_coroutine_threadsafe`.

---

# Section 12 — Edge Cases & Handling Strategy

## Data Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| Ticker partial history | `get_symbol_info()` on chip add | Partial inclusion + toast + report footnote |
| Delisted ticker | Data availability query returns short range | Toast warning, offer to exclude |
| No data for ticker | `get_symbol_info()` returns `exists: false` | Error chip indicator, blocked from run |
| Stock split | `auto_adjust=True` in pipeline | Handled automatically, transparent |
| Dividends | Separate dividend parquet | `DividendEvent` in engine, income tracked separately |

## Date Range Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| End before start | Inline date validation | Inline error, run blocked |
| Future end date | Compare to today | Hard cap at today |
| Market holiday as start | Check trading calendar | Silent roll to next trading day + toast |
| Range too short for strategy | Strategy warmup period > date range | Warning before run |
| Intraday + long date range | Interval × date range check | Auto-constrain date range + toast |

## Strategy Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| No signals generated | Trade log empty after run | Clear message in results panel |
| Parameter conflict | Validation layer (`BacktestConfig.validate()`) | Inline error before run |
| Zero capital | Schema validation | Blocked with error |
| Unknown strategy type | `build_strategy()` raises `ValueError` | Surfaced as validation error |

## Universe Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| Duplicate tickers | Deduplication on add | Silent dedup + toast |
| Universe too large (500+) | Count on resolve | Warning toast, suggest limiting |

## System Edge Cases

| Edge Case | Detection | Handling |
|---|---|---|
| WebSocket disconnect mid-run | Connection close event | Results buffered, reconnect recovers |
| Engine crash | Exception in thread | Error message emitted to WebSocket |
| Concurrent runs | Run ID tracking | Each run gets independent state |
| `data_dir` path mismatch | FastAPI startup check | Fail loudly at startup, not silently at runtime |

---

# Section 13 — Build Order: Phase 3 Onwards

## Current Status

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Pipeline changes | ✓ COMPLETE |
| Phase 2 | Engine changes + 108 tests | ✓ COMPLETE |
| Phase 3 | FastAPI backend + WebSocket | NOT STARTED |
| Phase 4 | Next.js frontend (phases 1-10) | NOT STARTED |
| Phase 5 | LLM layer | NOT STARTED |
| Phase 6 | Polish + edge cases | NOT STARTED |

## Phase 3 — FastAPI Backend (Next)

Build in this order:

1. Create `strategy-research-terminal/backend/` structure
2. Set up `main.py` with FastAPI app, CORS, health check
3. Set environment variables for `DATA_DIR`, `ENGINE_PATH`, `PIPELINE_PATH`
4. Define all Pydantic schemas in `schemas.py`
5. Build `GET /api/data/info/{symbol}` — calls `get_symbol_info()` from pipeline
6. Build `GET /api/data/symbols` — calls `get_available_symbols()` from pipeline
7. Build validation layer — `config_validator.py`
8. Build `POST /api/backtest/run` — validates config, stores in run registry, returns `run_id`
9. Build WebSocket handler `/ws/backtest/{run_id}` with async queue + thread executor
10. Wire `run_backtest_from_config()` into the WebSocket handler via `emit_callback`
11. Add `complete` and `error` message types to the WebSocket stream
12. Test end-to-end: `curl` the REST endpoint, `websocat` the WebSocket, verify messages

**Milestone:** Full backtest runs end-to-end via API with live streaming. Verified before touching the frontend.

## Phase 4 — Next.js Frontend

Build in phases, each tested against the real FastAPI backend:

**Phase 4.1 — Project setup**
- `npx create-next-app` with TypeScript, Tailwind
- Install: `shadcn/ui`, `zustand`, `recharts`, `@monaco-editor/react`
- Set up Zustand store with full state shape
- Set up environment variable for `NEXT_PUBLIC_API_URL`

**Phase 4.2 — Input panel (no LLM yet)**
- `StrategyBox` with NL tab only (Python tab placeholder)
- `UniverseBox` with Tickers tab only (NL tab placeholder)
- `DateRangePicker` with quick presets
- `IntervalSelector` dropdown with limits
- `RiskSlider` 0.5%–10%
- `RunButton`
- Hard-code a test config to verify backend connection

**Phase 4.3 — Backend connection**
- Wire `POST /api/backtest/run`
- Connect WebSocket `/ws/backtest/{run_id}`
- Parse all message types: `progress`, `trade`, `dividend`, `complete`, `error`
- Update Zustand store from WebSocket messages

**Phase 4.4 — Live charts**
- `EquityCurve` with real streaming data
- Progress bar during run
- Trade markers on chart

**Phase 4.5 — Analytics panel**
- `MetricsPanel` with all fields from `MetricsResult`
- `TradeLog` scrollable live tape
- Price return / total return toggle

**Phase 4.6 — Ticker chips + availability**
- `TickerChip` with `GET /api/data/info/{symbol}` on add
- Partial history indicator (⚠)
- `ToastManager` for notifications

**Phase 4.7 — Preset strategies**
- `PRESET_STRATEGIES` constants file
- Dropdown populates strategy box
- No LLM involved

**Phase 4.8 — Python code editor**
- Monaco editor in Python tab of `StrategyBox`
- Syntax highlighting
- Direct config passthrough (bypasses LLM)

**Phase 4.9 — LLM layer**
- Provider abstraction (`providers.ts`)
- `strategyResolver.ts` — NL strategy to config
- `universeResolver.ts` — NL universe to symbols
- Wire NL tabs to resolvers

**Phase 4.10 — Report + polish**
- `reportGenerator.ts` — metrics to markdown
- `AIReport` markdown renderer
- `DrawdownChart`
- Benchmark overlay on equity curve
- Universe notes footer
- All remaining toasts and edge case handling

## Phase 5 — Final verification

- Run full end-to-end test: natural language input → LLM → FastAPI → Engine → WebSocket → live chart → AI report
- All 108 engine tests still pass
- Frontend loads in under 3 seconds
- WebSocket streams first update within 500ms of run start

---

# Section 14 — Repository Structure (Target State)

```
trading-system-workspace/
│
├── Backtester-Oriented-Market-Data-Pipeline/      ← COMPLETE ✓
│   ├── market_data/
│   │   ├── api.py              get_symbol_info(), stream_multi_symbol_with_dividends()
│   │   ├── ingestion.py        auto_adjust=True, fetch_dividends()
│   │   ├── events.py           MarketEvent, DividendEvent, stream_multiple_with_dividends()
│   │   ├── normalization.py    robust date column detection
│   │   └── storage.py          get_data_info(), dividend parquet functions
│   ├── scripts/
│   │   └── fetch_data.py       --dividends flag
│   └── data/
│       ├── AAPL.parquet
│       ├── AAPL_dividends.parquet
│       └── ...
│
├── Event-Driven-Backtesting-Engine/               ← COMPLETE ✓
│   ├── engine/
│   │   ├── config.py           BacktestConfig, StrategyConfig, contract documented
│   │   ├── events.py           5 event types including DividendEvent
│   │   ├── event_queue.py      FIFO queue, unchanged
│   │   ├── data_handler.py     dividend loading, heapq merge streaming
│   │   ├── strategy.py         10 strategies, STRATEGY_REGISTRY, build_strategy()
│   │   ├── order_manager.py    Fixed, Percentage, RiskBased managers
│   │   ├── execution.py        SimulatedExecutionEngine, slippage hook
│   │   ├── portfolio.py        bar_history, dividend income, last_price()
│   │   ├── metrics.py          full suite: CAGR, vol, win rate, alpha, dividends
│   │   └── engine.py           emit_callback, DividendEvent routing
│   ├── tests/                  108 tests, all passing
│   └── run_backtest.py         run_backtest(), run_backtest_from_config()
│
└── strategy-research-terminal/                    ← NOT STARTED
    ├── backend/
    │   ├── main.py
    │   ├── api/
    │   │   ├── routes.py
    │   │   └── schemas.py
    │   ├── orchestrator/
    │   │   └── launcher.py
    │   ├── validation/
    │   │   └── config_validator.py
    │   ├── websocket/
    │   │   └── manager.py
    │   └── requirements.txt
    └── frontend/
        ├── app/
        │   └── page.tsx
        ├── components/
        │   ├── input/
        │   ├── charts/
        │   ├── analytics/
        │   ├── report/
        │   ├── notifications/
        │   └── editor/
        ├── hooks/
        ├── store/
        │   └── terminalStore.ts
        ├── llm/
        │   ├── providers.ts
        │   ├── strategyResolver.ts
        │   ├── universeResolver.ts
        │   └── reportGenerator.ts
        └── constants/
            └── presetStrategies.ts
```

---

# Section 15 — Key Contracts Locked Down

These are the decisions that cannot change without breaking the system. Any agent working on this codebase must respect these.

## Engine Entry Point

```python
from run_backtest import run_backtest_from_config
from engine.config import BacktestConfig, StrategyConfig

results = run_backtest_from_config(
    config=BacktestConfig(...),
    emit_callback=lambda msg: ...,   # optional
    data_dir="/explicit/path/to/data"
)
```

`data_dir` must be set explicitly. Do not rely on the default.

## Position Sizing Contract

| Field | Mode | Unit | Example |
|---|---|---|---|
| `position_size` | `fixed` | shares | `100` |
| `position_size` | `percentage` | % of equity (0–100] | `10.0` = 10% |
| `risk_per_trade` | `risk_based` | fraction (0–0.20] | `0.02` = 2% |

The `/100.0` division happens inside `run_backtest_from_config()`. The FastAPI layer sends percentage values, not fractions, for `position_size` in percentage mode.

## Strategy Config Contract

```json
{
  "type": "momentum",
  "parameters": { "lookback": 20, "threshold": 0.02 }
}
```

`type` must match a key in `STRATEGY_REGISTRY`. Unknown types raise `ValueError` from `build_strategy()`.

## WebSocket Message Contract

The engine emits these — FastAPI forwards them unchanged:

```
progress  → { type, bar, total, percent, equity, timestamp }
trade     → { type, symbol, side, quantity, fill_price, timestamp }
dividend  → { type, symbol, dividend_per_share, timestamp }
```

FastAPI adds these:

```
complete  → { type: "complete", metrics: { ...MetricsResult fields... } }
error     → { type: "error", message: "..." }
```

## Pipeline API Contract

```python
from market_data.api import (
    get_symbol_info,          # { exists, start, end, row_count, has_dividends, ... }
    get_symbols,              # List[str] of available symbols
    stream_multi_symbol_with_dividends,  # Generator[MarketEvent | DividendEvent]
)
```

## Data Directory Convention

```
data/
├── AAPL.parquet                    OHLCV, split-adjusted
├── AAPL_dividends.parquet          dividend history
├── MSFT.parquet
└── ...
```

`get_available_symbols()` excludes `_dividends` files automatically.

---

*Document version 2.0 — Pipeline and Engine complete. Phase 3 (FastAPI) is next.*
