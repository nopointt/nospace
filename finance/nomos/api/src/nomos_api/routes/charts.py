from fastapi import APIRouter, Depends, HTTPException, Query

from ..auth import require_bearer
from ..deps import get_journal
from ..journal import JournalReader
from ..models import Trade

router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/ohlcv")
async def ohlcv(
    pair: str = Query("BTC/USDT"),
    tf: str = Query("1h"),
    limit: int = Query(500, ge=1, le=1500),
) -> list[list[float]]:
    import ccxt

    try:
        ex = ccxt.binance({"enableRateLimit": True})
        return ex.fetch_ohlcv(pair, timeframe=tf, limit=limit)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, detail=f"ccxt fetch_ohlcv failed: {exc}")


@router.get("/trades", response_model=list[Trade])
async def chart_trades(
    pair: str = Query("BTC/USDT"),
    since_ts: int | None = None,
    include_virtual: bool = True,
    journal: JournalReader = Depends(get_journal),
) -> list[Trade]:
    return journal.trades(pair=pair, since_ts=since_ts, include_virtual=include_virtual)
