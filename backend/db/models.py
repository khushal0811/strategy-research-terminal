import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Date, JSON, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base


def _utc_now():
    """Timezone-aware UTC now — replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username   = Column(String(50), unique=True, nullable=False, index=True)
    email      = Column(String(255), unique=True, nullable=False)
    password   = Column(String(255), nullable=False)   # bcrypt hash
    created_at = Column(DateTime(timezone=True), default=_utc_now)
    is_active  = Column(Boolean, default=True)

    # Transaction cost settings — stored per user, applied to every backtest
    commission_model  = Column(String(20), default="flat")   # flat | per_share | percentage
    commission_value  = Column(Float, default=0.0)            # $1.00 | $0.005 | 0.001
    slippage_bps      = Column(Float, default=0.0)            # basis points


class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id        = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at     = Column(DateTime(timezone=True), default=_utc_now)

    # Config snapshot
    symbols        = Column(ARRAY(String), nullable=False)
    strategy_type  = Column(String(100), nullable=False)
    strategy_params= Column(JSON, nullable=False, default={})
    start_date     = Column(Date, nullable=False)
    end_date       = Column(Date, nullable=False)
    interval       = Column(String(10), nullable=False, default="1d")
    initial_capital= Column(Float, nullable=False)
    position_sizing= Column(String(20), nullable=False)
    risk_per_trade = Column(Float, nullable=True)
    benchmark_symbol = Column(String(20), nullable=True)

    # Results
    status         = Column(String(20), default="complete")
    total_return   = Column(Float, nullable=True)
    price_return   = Column(Float, nullable=True)
    cagr           = Column(Float, nullable=True)
    sharpe_ratio   = Column(Float, nullable=True)
    max_drawdown   = Column(Float, nullable=True)
    volatility     = Column(Float, nullable=True)
    win_rate       = Column(Float, nullable=True)
    total_trades   = Column(Integer, nullable=True)
    final_value    = Column(Float, nullable=True)
    dividend_income= Column(Float, nullable=True)
    benchmark_return = Column(Float, nullable=True)
    alpha          = Column(Float, nullable=True)

    # Full equity curve as JSON array of {timestamp, equity} objects
    equity_curve   = Column(JSON, nullable=True)

    # Full list of trades as JSON array of {symbol, side, quantity, fill_price, timestamp}
    trades         = Column(JSON, nullable=True)

    # AI report markdown
    ai_report      = Column(Text, nullable=True)
