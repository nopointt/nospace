from fastapi import APIRouter, Depends

from ..auth import require_bearer
from ..deps import get_live_prices, get_portfolio
from ..live_prices import LivePriceCache
from ..models import Balance, PortfolioSnapshot
from ..portfolio import PortfolioAggregator

router = APIRouter(prefix="/api", tags=["balance"], dependencies=[Depends(require_bearer)])


@router.get("/balance", response_model=Balance)
async def get_balance(
    portfolio: PortfolioAggregator = Depends(get_portfolio),
) -> Balance:
    return portfolio.balance_from_trades()


@router.get("/portfolio", response_model=PortfolioSnapshot)
async def get_portfolio_snapshot(
    portfolio: PortfolioAggregator = Depends(get_portfolio),
    live: LivePriceCache = Depends(get_live_prices),
) -> PortfolioSnapshot:
    return portfolio.snapshot(live_prices=live.prices_only())
