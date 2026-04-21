"""Read-only journal.jsonl accessor.

Journal is append-only JSONL. Events produced by runner: tick_hold, order_filled,
virtual_filled, order_error, halt_block, skip, signal_dedup, signal_cooldown,
tick_error, runner_start, runner_stop.

Trade events = order_filled (real) and virtual_filled (Cramer). All have
strategy/pair/side/amount/price/cost fields.
"""
from __future__ import annotations

import json
import os
from collections.abc import Iterator
from pathlib import Path
from typing import Any

from .models import JournalEntry, Trade

TRADE_EVENTS = {"order_filled", "virtual_filled"}


class JournalReader:
    def __init__(self, path: Path):
        self.path = path

    def _iter_raw(self) -> Iterator[dict[str, Any]]:
        if not self.path.exists():
            return
        with open(self.path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue

    def read_all(self) -> list[JournalEntry]:
        return [JournalEntry(**e) for e in self._iter_raw()]

    def read_since(self, ts: int) -> list[JournalEntry]:
        return [JournalEntry(**e) for e in self._iter_raw() if e.get("ts", 0) >= ts]

    def filter(
        self,
        *,
        events: set[str] | None = None,
        since_ts: int | None = None,
        limit: int | None = None,
    ) -> list[JournalEntry]:
        result: list[JournalEntry] = []
        for raw in self._iter_raw():
            if events is not None and raw.get("event") not in events:
                continue
            if since_ts is not None and raw.get("ts", 0) < since_ts:
                continue
            result.append(JournalEntry(**raw))
        if limit is not None:
            result = result[-limit:]
        return result

    def tail(self, n: int = 100) -> list[JournalEntry]:
        entries = self.read_all()
        return entries[-n:] if len(entries) > n else entries

    def trades(
        self,
        *,
        strategy: str | None = None,
        pair: str | None = None,
        side: str | None = None,
        since_ts: int | None = None,
        include_virtual: bool = True,
        limit: int | None = None,
    ) -> list[Trade]:
        out: list[Trade] = []
        for raw in self._iter_raw():
            event = raw.get("event")
            if event not in TRADE_EVENTS:
                continue
            if not include_virtual and event == "virtual_filled":
                continue
            if strategy is not None and raw.get("strategy") != strategy:
                continue
            if pair is not None and raw.get("pair") != pair:
                continue
            if side is not None and raw.get("side") != side:
                continue
            if since_ts is not None and raw.get("ts", 0) < since_ts:
                continue
            if raw.get("amount") is None or raw.get("price") is None:
                continue
            out.append(
                Trade(
                    ts=raw["ts"],
                    strategy=raw["strategy"],
                    pair=raw["pair"],
                    side=raw["side"],
                    amount=float(raw["amount"]),
                    price=float(raw["price"]),
                    cost=float(raw.get("cost") or raw["amount"] * raw["price"]),
                    order_id=raw.get("order_id"),
                    virtual=(event == "virtual_filled"),
                    meta=raw.get("meta", {}) or {},
                )
            )
        if limit is not None:
            out = out[-limit:]
        return out

    def latest_ts(self) -> int | None:
        if not self.path.exists():
            return None
        # seek to end, read last non-empty line (efficient for large files)
        with open(self.path, "rb") as f:
            try:
                f.seek(-2, os.SEEK_END)
                while f.read(1) != b"\n":
                    f.seek(-2, os.SEEK_CUR)
            except OSError:
                f.seek(0)
            last_line = f.readline().decode("utf-8").strip()
        if not last_line:
            return None
        try:
            return int(json.loads(last_line).get("ts", 0)) or None
        except (json.JSONDecodeError, ValueError):
            return None
