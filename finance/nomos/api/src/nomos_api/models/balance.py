from pydantic import BaseModel, Field


class Balance(BaseModel):
    updated_at: int
    usdt: float = 0.0
    btc: float = 0.0
    eth: float = 0.0
    bnb: float = 0.0
    total_usd: float = 0.0


class PortfolioAsset(BaseModel):
    symbol: str
    free: float
    locked: float = 0.0
    usd_value: float
    allocation_pct: float


class PortfolioSnapshot(BaseModel):
    updated_at: int
    total_usd: float
    assets: list[PortfolioAsset] = Field(default_factory=list)
