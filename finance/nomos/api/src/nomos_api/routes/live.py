from fastapi import APIRouter, Depends, Query
from sse_starlette.sse import EventSourceResponse

from ..auth import require_bearer, require_bearer_or_query
from ..deps import get_live_prices, get_sse
from ..live_prices import LivePriceCache
from ..sse import SSEBroker

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/prices")
async def prices(
    pairs: str | None = Query(None, description="Comma-separated, e.g. BTC/USDT,ETH/USDT"),
    cache: LivePriceCache = Depends(get_live_prices),
) -> dict:
    if pairs is None:
        return cache.latest()
    return cache.latest([p.strip() for p in pairs.split(",") if p.strip()])


@router.get("/stream", )
async def stream(
    replay: int = Query(0, ge=0, le=500),
    sse: SSEBroker = Depends(get_sse),
) -> EventSourceResponse:
    return EventSourceResponse(sse.subscribe(replay=replay))
