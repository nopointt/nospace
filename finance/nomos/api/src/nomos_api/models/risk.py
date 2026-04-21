from pydantic import BaseModel


class RiskSnapshot(BaseModel):
    updated_at: int
    daily_pnl_pct: float = 0.0
    weekly_pnl_pct: float = 0.0
    total_pnl_pct: float = 0.0
    halt_active: bool = False
    halt_reason: str | None = None
    daily_threshold_pct: float
    weekly_threshold_pct: float
    total_threshold_pct: float


class HaltRequest(BaseModel):
    reason: str
