from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import date, datetime
import uuid

class RunListItem(BaseModel):
    id: uuid.UUID
    created_at: datetime
    symbols: List[str]
    strategy_type: str
    start_date: date
    end_date: date
    interval: str
    initial_capital: float
    total_return: Optional[float]
    sharpe_ratio: Optional[float]
    max_drawdown: Optional[float]
    total_trades: Optional[int]
    final_value: Optional[float]
    status: str

    class Config:
        from_attributes = True

class RunDetail(RunListItem):
    strategy_params: dict
    position_sizing: str
    risk_per_trade: Optional[float]
    benchmark_symbol: Optional[str]
    price_return: Optional[float]
    cagr: Optional[float]
    volatility: Optional[float]
    win_rate: Optional[float]
    dividend_income: Optional[float]
    benchmark_return: Optional[float]
    alpha: Optional[float]
    equity_curve: Optional[Any]
    ai_report: Optional[str]
    trades: Optional[Any]
