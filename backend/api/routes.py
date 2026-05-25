"""
api/routes.py — REST endpoints for the Strategy Research Terminal backend.

Endpoints implemented here:
    GET  /api/data/info/{symbol}    — Symbol data availability metadata
    GET  /api/data/symbols          — List all available symbols
    POST /api/backtest/run          — Validate + register a backtest run

WebSocket endpoint lives in main.py (requires async context).

Run registry:
    In-memory dict mapping run_id → BacktestRequestSchema.
    The WebSocket handler retrieves the config via get_run_config().
    Runs are never deleted — for a production system this would use Redis or a DB.
"""

import uuid
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException, Header

import config  # noqa: F401 — triggers sys.path setup before any pipeline imports

from market_data.api import get_symbol_info, get_symbols

from api.schemas import (
    BacktestRequestSchema,
    BacktestRunResponse,
    SymbolInfoResponse,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# In-memory run registry — run_id → BacktestRequestSchema
# Populated by POST /api/backtest/run, consumed by WebSocket handler
# ---------------------------------------------------------------------------
_run_registry: Dict[str, BacktestRequestSchema] = {}


# ---------------------------------------------------------------------------
# Data availability endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/data/info/{symbol}",
    response_model=SymbolInfoResponse,
    summary="Symbol data availability",
    tags=["data"],
)
def get_data_info(symbol: str) -> SymbolInfoResponse:
    """
    Return data availability metadata for a single symbol.

    Called by the frontend on every ticker chip add to determine chip state:
      - exists=True  → data cached locally (✓ green chip)
      - exists=False, fetchable=True  → valid yfinance ticker, fetched at run-time (✓ green chip)
      - exists=False, fetchable=False → invalid ticker (✗ red chip)

    When no local data exists, a lightweight yfinance probe (1-day history)
    determines whether the ticker is valid. Actual data fetching happens
    later when the user clicks Run via ensure_symbols_available().

    Args:
        symbol: Ticker symbol (case-insensitive — normalised to uppercase internally).

    Returns:
        SymbolInfoResponse with exists, fetchable, start, end, row_count, etc.
    """
    symbol = symbol.strip().upper()
    info = get_symbol_info(symbol, data_dir=config.DATA_DIR)

    # If local data exists, it's both existing and fetchable
    if info.get("exists"):
        return SymbolInfoResponse(symbol=symbol, fetchable=True, **info)

    # No local data — probe yfinance to check if the ticker is valid.
    # This is a lightweight call (1 day of data) just to confirm the symbol exists.
    import yfinance as yf

    try:
        probe = yf.Ticker(symbol).history(period="5d")
        is_fetchable = probe is not None and not probe.empty
    except Exception:
        is_fetchable = False

    return SymbolInfoResponse(symbol=symbol, fetchable=is_fetchable, **info)


@router.get(
    "/data/symbols",
    summary="List available symbols",
    tags=["data"],
)
def list_symbols() -> dict:
    """
    Return all symbols that have OHLCV data available in the data directory.

    Excludes dividend-only files (e.g. AAPL_dividends.parquet).
    Used by the frontend to populate autocomplete / universe suggestions.

    Returns:
        { "symbols": ["AAPL", "MSFT", ...] }
    """
    symbols = get_symbols(data_dir=config.DATA_DIR)
    return {"symbols": symbols, "count": len(symbols)}


# ---------------------------------------------------------------------------
# Backtest launch endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/backtest/run",
    response_model=BacktestRunResponse,
    status_code=202,
    summary="Launch a backtest",
    tags=["backtest"],
)
async def launch_backtest(
    req: BacktestRequestSchema,
    authorization: Optional[str] = Header(None),
) -> BacktestRunResponse:
    """
    Validate, fetch missing data, and register a backtest run. Returns a run_id.

    The actual computation starts when the client connects to:
        WS /ws/backtest/{run_id}

    Execution order:
        1. Pydantic schema validation (automatic, before this function)
        2. config_validator.validate_backtest_request() — dates, intraday limits, strategy
        3. Pipeline fetch: download fresh data for all symbols via yfinance
        4. Register in _run_registry and return run_id

    Returns:
        BacktestRunResponse with run_id, status="queued", and fetched_symbols list

    Raises:
        422: Schema validation failure (Pydantic, automatic)
        422: Pipeline fetch failure (bad ticker, network error, empty data)
        422: Business logic validation failure (config_validator)
    """
    from pipeline.fetcher import ensure_symbols_available
    from validation.config_validator import validate_backtest_request

    # Resolve user settings if token is provided
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            from auth.utils import get_current_user_from_token
            from db.database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                user = await get_current_user_from_token(token, db)
        except Exception:
            pass

    if user:
        if req.commission_model == "flat" and req.commission_value == 0.0:
            req.commission_model = user.commission_model
            req.commission_value = user.commission_value
        if req.slippage_bps == 0.0:
            req.slippage_bps = user.slippage_bps

    # ------------------------------------------------------------------
    # Step 1: Business-logic validation (dates, capital, strategy, intraday limits).
    # Runs first to catch obvious errors BEFORE making network calls.
    # ------------------------------------------------------------------
    errors = validate_backtest_request(req)
    if errors:
        raise HTTPException(
            status_code=422,
            detail={"valid": False, "errors": errors},
        )

    # ------------------------------------------------------------------
    # Step 2: Fetch fresh data for all symbols via yfinance.
    # Always overwrites local parquet files with data matching the exact
    # interval and date range the user requested.
    # ------------------------------------------------------------------
    try:
        symbols_to_fetch = list(req.symbols)
        if req.benchmark_symbol and req.benchmark_symbol not in symbols_to_fetch:
            symbols_to_fetch.append(req.benchmark_symbol)

        newly_fetched = ensure_symbols_available(
            symbols           = symbols_to_fetch,
            start_date        = req.start_date,
            end_date          = req.end_date,
            interval          = req.interval,
            data_dir          = config.DATA_DIR,
            include_dividends = req.include_dividends,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail={"valid": False, "errors": [str(exc)]},
        )

    run_id = str(uuid.uuid4())
    _run_registry[run_id] = req
    return BacktestRunResponse(run_id=run_id, status="queued", fetched_symbols=newly_fetched)


def get_run_config(run_id: str) -> BacktestRequestSchema:
    """
    Retrieve a registered run config by ID.

    Called by the WebSocket handler in main.py before launching the engine.

    Raises:
        HTTPException 404: If run_id not found (expired or never registered).
    """
    if run_id not in _run_registry:
        raise HTTPException(
            status_code=404,
            detail=f"Run '{run_id}' not found. POST /api/backtest/run first.",
        )
    return _run_registry[run_id]
