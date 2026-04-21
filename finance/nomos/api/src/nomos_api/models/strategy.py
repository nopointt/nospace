from typing import Literal

from pydantic import BaseModel, Field


class StrategyStats(BaseModel):
    name: str
    type: Literal["real", "virtual"] = "real"
    enabled: bool = True
    timeframe: str | None = None
    pairs: list[str] = Field(default_factory=list)
    trades: int = 0
    buys: int = 0
    sells: int = 0
    volume_usd: float = 0.0
    last_signal_ts: int | None = None
    last_signal_action: str | None = None
    position_state: dict[str, Literal["LONG", "FLAT"]] = Field(default_factory=dict)


class StrategyToggleRequest(BaseModel):
    enabled: bool
