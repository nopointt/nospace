"""Executor: places orders via CCXT on behalf of a tagged strategy."""

from __future__ import annotations

import traceback


class Executor:
    def __init__(self, client, journal, strategy_tag: str, allocation_usd: float):
        self.client = client
        self.journal = journal
        self.tag = strategy_tag
        self.allocation_usd = allocation_usd

    def place(self, pair: str, action: str, last_price: float, meta: dict) -> None:
        if action not in ("BUY", "SELL"):
            return

        base, quote = pair.split("/")
        amount = round(self.allocation_usd / last_price, 6)

        if amount <= 0:
            self.journal.append({
                "event": "skip",
                "strategy": self.tag,
                "pair": pair,
                "reason": "amount<=0",
                "last_price": last_price,
                "allocation_usd": self.allocation_usd,
            })
            return

        side = "buy" if action == "BUY" else "sell"
        try:
            order = self.client.create_order(pair, "market", side, amount)
            self.journal.append({
                "event": "order_filled",
                "strategy": self.tag,
                "pair": pair,
                "side": side,
                "amount": amount,
                "price": order.get("average") or order.get("price") or last_price,
                "cost": order.get("cost"),
                "order_id": order.get("id"),
                "meta": meta,
            })
        except Exception as e:
            self.journal.append({
                "event": "order_error",
                "strategy": self.tag,
                "pair": pair,
                "side": side,
                "amount": amount,
                "error": str(e),
                "error_type": type(e).__name__,
            })
            print(f"[executor] order error on {pair} {side}: {e}", flush=True)
            traceback.print_exc()
