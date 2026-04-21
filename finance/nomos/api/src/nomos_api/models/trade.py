from typing import Any, Literal

from pydantic import BaseModel, Field


class Trade(BaseModel):
    ts: int
    strategy: str
    pair: str
    side: Literal["buy", "sell"]
    amount: float
    price: float
    cost: float
    order_id: str | None = None
    virtual: bool = Field(default=False, description="True when event=virtual_filled (Cramer)")
    meta: dict[str, Any] = Field(default_factory=dict)
