"""Portfolio aggregation from journal + live prices."""
from __future__ import annotations

import json
import time
from collections import defaultdict
from pathlib import Path

from .journal import JournalReader
from .models import Balance, PortfolioAsset, PortfolioSnapshot


class PortfolioAggregator:
    def __init__(self, journal: JournalReader, portfolio_state_path: Path):
        self.journal = journal
        self.portfolio_state_path = portfolio_state_path

    def _load_portfolio_state(self) -> dict:
        if not self.portfolio_state_path.exists():
            return {}
        try:
            return json.loads(self.portfolio_state_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}

    def balance_from_trades(self, usdt_start: float = 10000.0) -> Balance:
        """Reconstruct balance by replaying all trades from the journal.

        This is the authoritative source when portfolio-state.json is missing
        or stale. Uses only real (non-virtual) order_filled events.
        """
        holdings: dict[str, float] = defaultdict(float)
        holdings["USDT"] = usdt_start

        last_price: dict[str, float] = {}

        for t in self.journal.trades(include_virtual=False):
            base, quote = t.pair.split("/")
            last_price[base] = t.price
            if t.side == "buy":
                holdings[quote] -= t.cost
                holdings[base] += t.amount
            elif t.side == "sell":
                holdings[quote] += t.cost
                holdings[base] -= t.amount

        total_usd = holdings.get("USDT", 0.0)
        for sym, qty in holdings.items():
            if sym == "USDT":
                continue
            total_usd += qty * last_price.get(sym, 0.0)

        return Balance(
            updated_at=int(time.time()),
            usdt=holdings.get("USDT", 0.0),
            btc=holdings.get("BTC", 0.0),
            eth=holdings.get("ETH", 0.0),
            bnb=holdings.get("BNB", 0.0),
            total_usd=total_usd,
        )

    def snapshot(
        self,
        *,
        usdt_start: float = 10000.0,
        live_prices: dict[str, float] | None = None,
    ) -> PortfolioSnapshot:
        bal = self.balance_from_trades(usdt_start=usdt_start)

        # override price with live if available
        prices = live_prices or {}
        total_usd = bal.usdt
        per_asset: list[PortfolioAsset] = [
            PortfolioAsset(symbol="USDT", free=bal.usdt, usd_value=bal.usdt, allocation_pct=0.0)
        ]
        for sym, qty in (("BTC", bal.btc), ("ETH", bal.eth), ("BNB", bal.bnb)):
            if qty == 0.0:
                continue
            price = prices.get(f"{sym}/USDT", 0.0)
            value = qty * price if price else 0.0
            total_usd += value
            per_asset.append(
                PortfolioAsset(symbol=sym, free=qty, usd_value=value, allocation_pct=0.0)
            )

        for asset in per_asset:
            asset.allocation_pct = (asset.usd_value / total_usd * 100) if total_usd else 0.0

        return PortfolioSnapshot(
            updated_at=int(time.time()),
            total_usd=total_usd,
            assets=per_asset,
        )
