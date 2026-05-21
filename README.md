# Strategy Research Terminal

A real-time quantitative research platform that connects a Next.js frontend to an event-driven backtesting engine via FastAPI and WebSocket streaming. Users configure strategy parameters, select stock universes, and watch live equity curves, trade executions, and performance metrics render in real time.

Built as the user-facing interface layer for the [Event-Driven Backtesting Engine](https://github.com/khushal0811/Event-Driven-Backtesting-Engine) and [Market Data Pipeline](https://github.com/khushal0811/Backtester-Oriented-Market-Data-Pipeline).

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Strategy │  │  Universe  │  │   Live Dashboard  │ │
│  │   Input  │  │  Selector  │  │  (Charts, Trades, │ │
│  │  (NL/Py) │  │ (NL/Chips) │  │   Metrics, AI)   │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│       │              │                  │            │
│       ▼              ▼                  ▲            │
│  ┌─────────┐   ┌──────────┐    ┌───────┴────────┐    │
│  │  Groq   │   │ POST /api│    │ WS /ws/backtest│    │
│  │  LLM    │   │ /backtest│    │   /{run_id}    │    │
│  │ Resolver│   │  /run    │    └───────┬────────┘    │
│  └─────────┘   └────┬─────┘           │              │
└──────────────────────┼─────────────────┼─────────────┘
                       │                 │
                       ▼                 ▲
┌──────────────────────┴─────────────────┴──────────────┐
│                  FastAPI Backend                      │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Pydantic  │  │   Config     │  │   WebSocket   │  │
│  │  Schema    │→ │  Validator   │→ │    Manager    │  │
│  │ Validation │  │ (Biz Logic)  │  │ (Thread→Queue)│  │
│  └────────────┘  └──────────────┘  └───────┬───────┘  │
│                                            │          │
│  ┌────────────┐                    ┌───────▼───────┐  │
│  │  Pipeline  │ ← yfinance ←───── │  run_backtest  │  │
│  │  Fetcher   │                    │ _from_config  │  │
│  └────────────┘                    └───────────────┘  │
└───────────────────────────────────────────────────────┘
```

---

## Features

- **Natural Language Strategy Input** — Describe a strategy in plain English; Groq LLM maps it to one of 10 built-in preset strategies with tuned parameters
- **Custom Python Strategies** — Write strategy code directly in the browser editor
- **Ticker Validation** — Real-time yfinance validation when adding tickers, with green/red chip feedback
- **Live Streaming** — Equity curve, trade fills, and dividend events stream in real time via WebSocket
- **Performance Analytics** — Total return, CAGR, Sharpe ratio, max drawdown, volatility, win rate, alpha vs benchmark
- **AI-Generated Reports** — Post-backtest analysis summaries via Groq LLM
- **Dark/Light Mode** — Full theme support with system-aware defaults

---

## Project Structure

```
strategy-research-terminal/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment config + sys.path setup
│   ├── api/
│   │   ├── routes.py              # REST endpoints (data info, backtest launch)
│   │   └── schemas.py             # Pydantic request/response models
│   ├── pipeline/
│   │   └── fetcher.py             # On-demand yfinance data fetching bridge
│   ├── validation/
│   │   └── config_validator.py    # Pre-engine business logic validation
│   ├── websocket/
│   │   └── manager.py             # Thread→async queue bridge for live streaming
│   ├── test_e2e.py                # End-to-end verification script
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Environment variables (not committed)
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Main dashboard layout
│   │   ├── layout.tsx             # Root layout + fonts
│   │   └── api/llm/route.ts       # Server-side LLM proxy
│   ├── components/
│   │   ├── input/                 # Strategy, Universe, DateRange, Interval, SimParams, RunButton
│   │   ├── charts/                # EquityCurve, DrawdownChart, RollingSharpeChart
│   │   ├── analytics/             # MetricsPanel, TradeLog, UniverseNotes
│   │   ├── sections/              # SystemOverlay, ArchitecturePanel, HowItWorks
│   │   ├── report/                # AIReport
│   │   └── ui/                    # Shared UI primitives (Button, Slider, etc.)
│   ├── hooks/
│   │   ├── useBacktest.ts         # Backtest API client + payload builder
│   │   └── useWebSocket.ts        # WebSocket connection manager
│   ├── llm/
│   │   ├── providers.ts           # Groq LLM provider + JSON cleaner
│   │   ├── strategyResolver.ts    # NL → strategy config resolver
│   │   ├── universeResolver.ts    # NL → ticker list resolver
│   │   └── reportGenerator.ts     # Post-backtest AI report generator
│   ├── store/
│   │   └── terminalStore.ts       # Zustand global state
│   └── types/
│       └── index.ts               # Shared TypeScript interfaces
├── context/                       # Design docs (not committed)
├── .gitignore
└── LICENSE
```

---

## Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Both sibling repos cloned under the same parent directory:

```
market-data-pipeline/
├── Backtester-Oriented-Market-Data-Pipeline/
├── Event-Driven-Backtesting-Engine/
└── strategy-research-terminal/         ← this repo
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATA_DIR=/absolute/path/to/Backtester-Oriented-Market-Data-Pipeline/data
ENGINE_PATH=/absolute/path/to/Event-Driven-Backtesting-Engine
PIPELINE_PATH=/absolute/path/to/Backtester-Oriented-Market-Data-Pipeline
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/data/info/{symbol}` | GET | Symbol data availability + yfinance validation |
| `/api/data/symbols` | GET | List all locally available symbols |
| `/api/backtest/run` | POST | Validate config, fetch data, register run → returns `run_id` |
| `/ws/backtest/{run_id}` | WS | Stream live progress, trades, dividends, final metrics |
| `/api/llm` | POST | Server-side Groq LLM proxy |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| State | Zustand |
| Charts | Recharts |
| Backend | FastAPI, Pydantic, uvicorn |
| Engine | Event-Driven Backtesting Engine (Python) |
| Data | Market Data Pipeline → yfinance → Parquet |
| LLM | Groq API (Llama 3) |
| Streaming | WebSocket + asyncio.Queue thread bridge |

---

## License

MIT — see [LICENSE](LICENSE).
