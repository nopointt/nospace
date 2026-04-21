import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from ..auth import require_bearer
from ..deps import get_journal
from ..journal import JournalReader
from ..models import Trade

router = APIRouter(prefix="/api", tags=["trades"], dependencies=[Depends(require_bearer)])


@router.get("/trades", response_model=list[Trade])
async def list_trades(
    strategy: str | None = None,
    pair: str | None = None,
    side: str | None = None,
    since_ts: int | None = None,
    include_virtual: bool = True,
    limit: int = Query(100, ge=1, le=1000),
    journal: JournalReader = Depends(get_journal),
) -> list[Trade]:
    return journal.trades(
        strategy=strategy,
        pair=pair,
        side=side,
        since_ts=since_ts,
        include_virtual=include_virtual,
        limit=limit,
    )


@router.get("/trades.csv")
async def trades_csv(
    strategy: str | None = None,
    pair: str | None = None,
    side: str | None = None,
    since_ts: int | None = None,
    include_virtual: bool = True,
    journal: JournalReader = Depends(get_journal),
) -> StreamingResponse:
    trades = journal.trades(
        strategy=strategy,
        pair=pair,
        side=side,
        since_ts=since_ts,
        include_virtual=include_virtual,
    )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        ["ts", "strategy", "pair", "side", "amount", "price", "cost", "virtual", "order_id"]
    )
    for t in trades:
        writer.writerow(
            [t.ts, t.strategy, t.pair, t.side, t.amount, t.price, t.cost, t.virtual, t.order_id or ""]
        )
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nomos-trades.csv"},
    )


@router.get("/journal/events")
async def journal_events(
    events: str = Query(
        "tick_hold,order_filled,virtual_filled,halt_block,order_error",
        description="Comma-separated event types",
    ),
    since_ts: int | None = None,
    limit: int = Query(500, ge=1, le=5000),
    journal: JournalReader = Depends(get_journal),
) -> list[dict]:
    wanted = {e.strip() for e in events.split(",") if e.strip()}
    entries = journal.filter(events=wanted, since_ts=since_ts, limit=limit)
    return [e.model_dump() for e in entries]
