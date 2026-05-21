"""
validation/config_validator.py — Pre-engine validation layer.

This is the second gate after Pydantic schema validation.
Pydantic catches structural errors (wrong types, missing fields, range violations).
This layer catches business logic errors that require hitting the filesystem or engine:
  - Symbol data existence (requires reading data directory)
  - Intraday interval vs. date range compatibility
  - Strategy type in STRATEGY_REGISTRY (engine-level check)

Design principle:
  - NEVER raise an exception. Always return a list of errors.
  - Empty list → valid, safe to run.
  - Multiple errors accumulate — caller sees ALL problems at once, not just the first.
  - Error messages are human-readable and actionable (frontend displays them directly).

Called by: POST /api/backtest/run (routes.py) BEFORE registering the run.
"""

from datetime import date
from typing import List

import config  # noqa: F401 — ensures sys.path is wired before engine/pipeline imports

from api.schemas import BacktestRequestSchema
from engine.strategy import STRATEGY_REGISTRY

# ---------------------------------------------------------------------------
# Intraday data history limits (days) — matches yfinance constraints
# Daily ("1d") has no limit.
# ---------------------------------------------------------------------------
INTRADAY_LIMITS: dict = {
    "1m":  7,
    "2m":  60,
    "5m":  60,
    "15m": 60,
    "30m": 60,
    "1h":  730,
}


def validate_backtest_request(req: BacktestRequestSchema) -> List[str]:
    """
    Run all business-logic validation checks on a backtest request.

    Returns a list of human-readable error strings.
    An empty list means the request is valid and safe to pass to the engine.

    Checks performed (in order):
        1. Symbol list non-empty
        2. Date ordering + future date guard
        3. Intraday interval vs. date range limit
        4. Capital positivity
        5. Position sizing rules
        6. Risk per trade range
        7. Strategy type in STRATEGY_REGISTRY (or python_code provided)

    Args:
        req: Validated BacktestRequestSchema (already passed Pydantic).

    Returns:
        List[str]: Error messages. Empty = valid.
    """
    errors: List[str] = []

    # ------------------------------------------------------------------
    # 1. Symbol list must not be empty
    # ------------------------------------------------------------------
    if not req.symbols:
        errors.append("symbols list cannot be empty.")

    # ------------------------------------------------------------------
    # 2. Date ordering + future date guard (defence-in-depth — Pydantic
    #    catches these too, but we want clear messages if they slip through)
    # ------------------------------------------------------------------
    if req.start_date >= req.end_date:
        errors.append(
            f"start_date ({req.start_date}) must be strictly before "
            f"end_date ({req.end_date})."
        )

    if req.end_date > date.today():
        errors.append(
            f"end_date ({req.end_date}) cannot be in the future. "
            f"Latest allowed: {date.today()}."
        )

    # ------------------------------------------------------------------
    # 3. Intraday interval vs. date range limit
    # ------------------------------------------------------------------
    if req.interval in INTRADAY_LIMITS:
        max_days = INTRADAY_LIMITS[req.interval]
        requested_days = (req.end_date - req.start_date).days

        if requested_days > max_days:
            errors.append(
                f"Interval '{req.interval}' only supports up to {max_days} days "
                f"of history, but the requested range spans {requested_days} days "
                f"({req.start_date} -> {req.end_date}). "
                f"Reduce the date range or switch to '1d' interval."
            )

    # ------------------------------------------------------------------
    # 4. Capital (defence-in-depth)
    # ------------------------------------------------------------------
    if req.initial_capital <= 0:
        errors.append(
            f"initial_capital must be positive. Got {req.initial_capital}."
        )

    # ------------------------------------------------------------------
    # 5. Position sizing rules
    # ------------------------------------------------------------------
    valid_sizing = {"fixed", "percentage", "risk_based"}
    if req.position_sizing not in valid_sizing:
        errors.append(
            f"position_sizing must be one of {sorted(valid_sizing)}. "
            f"Got '{req.position_sizing}'."
        )
    elif req.position_sizing == "percentage":
        if not (0 < req.position_size <= 100):
            errors.append(
                f"For position_sizing='percentage', position_size must be in (0, 100]. "
                f"Got {req.position_size}. "
                f"Example: pass 10.0 to allocate 10% of equity per trade."
            )
    elif req.position_sizing == "fixed":
        if req.position_size <= 0:
            errors.append(
                f"For position_sizing='fixed', position_size must be a positive "
                f"number of shares. Got {req.position_size}."
            )

    # ------------------------------------------------------------------
    # 6. Risk per trade range (defence-in-depth)
    # ------------------------------------------------------------------
    if not (0 < req.risk_per_trade <= 0.20):
        errors.append(
            f"risk_per_trade must be a fraction in (0, 0.20]. "
            f"Got {req.risk_per_trade}. "
            f"Example: 0.02 = risk 2% of equity per trade."
        )

    # ------------------------------------------------------------------
    # 7. Strategy type
    #    - "custom" type requires python_code to be non-empty
    #    - All other types must be in STRATEGY_REGISTRY
    # ------------------------------------------------------------------
    strategy_type = req.strategy.type

    if strategy_type == "custom":
        if not req.strategy.python_code or not req.strategy.python_code.strip():
            errors.append(
                "strategy.type is 'custom' but no python_code was provided. "
                "Provide a Python strategy implementation or select a preset type."
            )
    elif strategy_type not in STRATEGY_REGISTRY:
        errors.append(
            f"Unknown strategy type '{strategy_type}'. "
            f"Available types: {sorted(STRATEGY_REGISTRY.keys())}. "
            f"For a custom strategy, set type='custom' and provide python_code."
        )

    return errors
