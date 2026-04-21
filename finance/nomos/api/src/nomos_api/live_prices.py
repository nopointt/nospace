"""Live price poller.

Polls CCXT every N seconds for configured pairs and publishes price_update
events via the SSE broker. Caches latest snapshot for synchronous reads.
"""
from __future__ import annotations

import asyncio
import logging
import time

from .sse import SSEBroker

log = logging.getLogger("nomos.live_prices")


class LivePriceCache:
    def __init__(self, sse: SSEBroker, pairs: list[str], poll_seconds: int = 5):
        self.sse = sse
        self.pairs = pairs
        self.poll_seconds = poll_seconds
        self._latest: dict[str, dict] = {}
        self._task: asyncio.Task | None = None
        self._exchange = None

    def _ccxt_exchange(self):
        if self._exchange is None:
            import ccxt

            ex = ccxt.binance({"enableRateLimit": True})
            # testnet doesn't need auth for public tickers; but use prod endpoints
            self._exchange = ex
        return self._exchange

    def latest(self, pairs: list[str] | None = None) -> dict[str, dict]:
        if pairs is None:
            return dict(self._latest)
        return {p: self._latest[p] for p in pairs if p in self._latest}

    def prices_only(self) -> dict[str, float]:
        return {p: snap["price"] for p, snap in self._latest.items() if "price" in snap}

    async def _tick(self) -> None:
        ex = self._ccxt_exchange()
        loop = asyncio.get_event_loop()
        try:
            tickers = await loop.run_in_executor(None, ex.fetch_tickers, self.pairs)
        except Exception as exc:  # noqa: BLE001
            log.warning("fetch_tickers failed: %s", exc)
            return
        now = int(time.time())
        for pair, t in tickers.items():
            price = t.get("last") or t.get("close")
            if price is None:
                continue
            snapshot = {
                "pair": pair,
                "price": float(price),
                "bid": t.get("bid"),
                "ask": t.get("ask"),
                "change_pct": t.get("percentage"),
                "volume": t.get("quoteVolume"),
                "ts": now,
            }
            self._latest[pair] = snapshot
            await self.sse.publish("price_update", snapshot)

    async def _loop(self) -> None:
        while True:
            try:
                await self._tick()
            except Exception as exc:  # noqa: BLE001
                log.warning("price tick error: %s", exc)
            await asyncio.sleep(self.poll_seconds)

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
