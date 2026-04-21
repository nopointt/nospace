"""Cramer mirror: VIRTUAL execution of flipped BUY<->SELL signals.

Does NOT place real orders. Writes `virtual_filled` events to journal
at the signal's last_price, using Cramer's dedicated allocation. This
avoids Cramer and primary strategy cancelling each other on the same
real exchange account.
"""

from __future__ import annotations


class CramerMirror:
    def __init__(self, cfg: dict):
        self.cfg = cfg

    def flip(self, action: str) -> str:
        if action == "BUY":
            return "SELL"
        if action == "SELL":
            return "BUY"
        return "HOLD"

    def record_virtual(
        self,
        journal,
        strategy_tag: str,
        pair: str,
        action: str,
        price: float,
        allocation_usd: float,
        meta: dict,
    ) -> None:
        if action not in ("BUY", "SELL"):
            return
        amount = round(allocation_usd / price, 6) if price > 0 else 0.0
        if amount <= 0:
            return
        side = "buy" if action == "BUY" else "sell"
        journal.append({
            "event": "virtual_filled",
            "strategy": strategy_tag,
            "pair": pair,
            "side": side,
            "amount": amount,
            "price": price,
            "cost": round(amount * price, 6),
            "meta": meta,
        })
