from typing import Any

from pydantic import BaseModel, Field


class JournalEntry(BaseModel):
    ts: int
    event: str
    strategy: str | None = None
    pair: str | None = None
    timeframe: str | None = None
    side: str | None = None
    amount: float | None = None
    price: float | None = None
    cost: float | None = None
    order_id: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)
