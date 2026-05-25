"""
api/schemas.py — Pydantic request/response models for the Strategy Research Terminal.

These are the API-level contracts between the Next.js frontend and the FastAPI backend.
They mirror the engine's BacktestConfig but are decoupled from it intentionally:
  - API schemas use camelCase-compatible field names with JSON aliases
  - Validation here is for API surface; BacktestConfig.validate() is the engine gate
  - The conversion from schema → BacktestConfig happens in websocket/manager.py

Key contracts enforced here (verified against engine/config.py):
  - position_sizing: "fixed" | "percentage" | "risk_based"
  - position_size (percentage mode): (0, 100] — pass 10.0 for 10%, NOT 0.10
  - risk_per_trade: fraction in (0, 0.20] — 0.02 = 2%
  - interval: one of the 7 supported values
  - symbols: non-empty list
  - initial_capital: > 0
  - start_date < end_date
"""

from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Valid values — sourced from STRATEGY_REGISTRY keys and engine constants
# ---------------------------------------------------------------------------

VALID_STRATEGY_TYPES = {
    "moving_average_crossover",
    "momentum",
    "mean_reversion",
    "rsi",
    "macd",
    "breakout",
    "bollinger_bands",
    "dual_momentum",
    "trend_following",
    "volume_weighted_mean_reversion",
    "custom",  # python_code path — passes through to engine as-is
}

VALID_INTERVALS = {"1d", "1h", "30m", "15m", "5m", "2m", "1m"}

VALID_POSITION_SIZING = {"fixed", "percentage", "risk_based"}


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------

class StrategyConfigSchema(BaseModel):
    """
    Strategy configuration — maps directly to engine.config.StrategyConfig.

    For preset/LLM strategies: populate `type` + `parameters`.
    For custom Python strategies: populate `python_code` (type = "custom").
    """
    type: str = Field(
        ...,
        description="Strategy type key from STRATEGY_REGISTRY, or 'custom' for python_code path.",
        examples=["momentum", "moving_average_crossover"],
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Keyword arguments passed to the strategy constructor.",
        examples=[{"lookback": 20, "threshold": 0.02}],
    )
    python_code: Optional[str] = Field(
        default=None,
        description="Custom Python strategy code. Only used when type='custom'.",
    )

    @field_validator("type")
    @classmethod
    def type_must_be_known(cls, v: str) -> str:
        if v not in VALID_STRATEGY_TYPES:
            raise ValueError(
                f"Unknown strategy type '{v}'. "
                f"Valid types: {sorted(VALID_STRATEGY_TYPES)}"
            )
        return v


class BacktestRequestSchema(BaseModel):
    """
    Full backtest request — the primary input from the frontend.

    Sent via POST /api/backtest/run.
    The returned run_id is used to connect the WebSocket stream.

    Position sizing contract (mirrors engine/config.py):
      position_sizing='fixed'      → position_size = number of shares (e.g. 100)
      position_sizing='percentage' → position_size = % of equity (e.g. 10.0 = 10%)
      position_sizing='risk_based' → risk_per_trade = fraction (e.g. 0.02 = 2%)
    """
    symbols: List[str] = Field(
        ...,
        min_length=1,
        description="List of ticker symbols to backtest. Must not be empty.",
        examples=[["AAPL", "MSFT"]],
    )
    strategy: StrategyConfigSchema

    start_date: date = Field(
        ...,
        description="Backtest start date (inclusive). Must be before end_date.",
    )
    end_date: date = Field(
        ...,
        description="Backtest end date (inclusive). Cannot be in the future.",
    )
    interval: str = Field(
        default="1d",
        description="Bar interval. Intraday intervals have data history limits.",
        examples=["1d", "1h", "30m"],
    )
    initial_capital: float = Field(
        default=100_000.0,
        gt=0,
        description="Starting capital in dollars. Must be positive.",
    )

    # Position sizing
    position_sizing: str = Field(
        default="risk_based",
        description="Order manager type: 'fixed' | 'percentage' | 'risk_based'.",
    )
    position_size: float = Field(
        default=100.0,
        description=(
            "For 'fixed': number of shares. "
            "For 'percentage': percentage of equity, e.g. 10.0 = 10% (NOT 0.10)."
        ),
    )
    risk_per_trade: float = Field(
        default=0.02,
        description=(
            "Fraction of equity to risk per trade. Must be in (0, 0.20]. "
            "e.g. 0.02 = 2%. This is what the frontend Risk Slider controls."
        ),
    )
    stop_fraction: float = Field(
        default=0.02,
        gt=0,
        description="ATR fallback stop distance as a fraction of price.",
    )

    # Transaction costs — applied per fill
    commission_model: str = Field(
        default="flat",
        description="Commission model to apply: 'flat' | 'per_share' | 'percentage'.",
    )
    commission_value: float = Field(
        default=0.0,
        ge=0,
        description="Commission value based on model.",
    )
    slippage_bps: float = Field(
        default=0.0,
        ge=0,
        description="Slippage in basis points.",
    )

    # Optional
    benchmark_symbol: Optional[str] = Field(
        default="SPY",
        description="Benchmark ticker for alpha calculation. Set null to disable.",
    )
    include_dividends: bool = Field(
        default=True,
        description="Whether to load and process dividend events.",
    )

    # ------------------------------------------------------------------
    # Field validators
    # ------------------------------------------------------------------

    @field_validator("symbols")
    @classmethod
    def symbols_must_be_non_empty_uppercase(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("symbols list cannot be empty.")
        # Deduplicate, uppercase, strip whitespace
        seen = set()
        result = []
        for s in v:
            s = s.strip().upper()
            if s and s not in seen:
                seen.add(s)
                result.append(s)
        if not result:
            raise ValueError("symbols list has no valid tickers after cleaning.")
        return result

    @field_validator("interval")
    @classmethod
    def interval_must_be_valid(cls, v: str) -> str:
        if v not in VALID_INTERVALS:
            raise ValueError(
                f"Invalid interval '{v}'. Valid values: {sorted(VALID_INTERVALS)}"
            )
        return v

    @field_validator("position_sizing")
    @classmethod
    def position_sizing_must_be_valid(cls, v: str) -> str:
        if v not in VALID_POSITION_SIZING:
            raise ValueError(
                f"position_sizing must be one of {sorted(VALID_POSITION_SIZING)}. Got '{v}'."
            )
        return v

    @field_validator("risk_per_trade")
    @classmethod
    def risk_per_trade_in_range(cls, v: float) -> float:
        if not (0 < v <= 0.20):
            raise ValueError(
                f"risk_per_trade must be in (0, 0.20]. Got {v}. "
                f"Pass a fraction: 0.02 = 2%, not 2.0."
            )
        return v

    # ------------------------------------------------------------------
    # Model-level validators (cross-field)
    # ------------------------------------------------------------------

    @model_validator(mode="after")
    def validate_dates_and_sizing(self) -> "BacktestRequestSchema":
        # Date ordering
        if self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date.")
        if self.end_date > date.today():
            raise ValueError("end_date cannot be in the future.")

        # Percentage mode: position_size must be in (0, 100]
        # Also reject suspicious fraction values (≤ 1.0) to catch the common
        # mistake of passing 0.10 instead of 10.0 for 10%.
        if self.position_sizing == "percentage":
            if not (0 < self.position_size <= 100):
                raise ValueError(
                    "For position_sizing='percentage', position_size must be in (0, 100]. "
                    f"Got {self.position_size}. "
                    "Pass a percentage value: 10.0 means 10%, not 0.10."
                )
            if self.position_size <= 1.0:
                raise ValueError(
                    f"position_size={self.position_size} looks like a fraction, not a percentage. "
                    "For 10%, pass 10.0, not 0.10. "
                    "The engine divides by 100 internally."
                )

        # Fixed mode: position_size must be a positive integer quantity
        if self.position_sizing == "fixed":
            if self.position_size <= 0:
                raise ValueError(
                    "For position_sizing='fixed', position_size must be a positive number of shares."
                )

        return self


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class BacktestRunResponse(BaseModel):
    """Response from POST /api/backtest/run."""
    run_id: str = Field(..., description="UUID identifying this backtest run.")
    status: str = Field(default="queued", description="Initial run status.")
    fetched_symbols: List[str] = Field(
        default_factory=list,
        description="Symbols that were auto-fetched from the pipeline before this run.",
    )


class SymbolInfoResponse(BaseModel):
    """
    Response from GET /api/data/info/{symbol}.

    The frontend uses this to set ticker chip states:
      exists=True  → data cached locally (✓ green chip)
      exists=False, fetchable=True  → valid yfinance ticker, will be fetched at run-time (✓ green chip)
      exists=False, fetchable=False → invalid ticker (✗ red chip)
    """
    symbol: str
    exists: bool
    fetchable: bool = Field(False, description="True if the ticker is valid on yfinance (even without local data).")
    start: Optional[str] = Field(None, description="Earliest available date (ISO format).")
    end: Optional[str] = Field(None, description="Latest available date (ISO format).")
    row_count: int = Field(0, description="Total number of bars available.")
    has_dividends: bool = Field(False, description="Whether a dividend file exists.")
    dividend_start: Optional[str] = Field(None, description="Earliest dividend date (ISO).")
    dividend_end: Optional[str] = Field(None, description="Latest dividend date (ISO).")


class ValidationErrorResponse(BaseModel):
    """Response when validation fails before launching a backtest."""
    valid: bool = False
    errors: List[str] = Field(..., description="List of human-readable validation errors.")


class BacktestStatusResponse(BaseModel):
    """Response from GET /api/backtest/{id}/status (future use)."""
    run_id: str
    status: str  # "queued" | "running" | "complete" | "error"
    progress: Optional[float] = None  # 0–100
    error: Optional[str] = None
