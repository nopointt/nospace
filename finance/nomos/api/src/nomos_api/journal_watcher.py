"""Tail journal.jsonl and publish new entries to the SSE broker."""
from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path

from .sse import SSEBroker

log = logging.getLogger("nomos.journal_watcher")


class JournalWatcher:
    def __init__(self, path: Path, sse: SSEBroker, poll_ms: int = 1000):
        self.path = path
        self.sse = sse
        self.poll_ms = poll_ms
        self._task: asyncio.Task | None = None
        self._last_size = 0

    async def _tick(self) -> None:
        if not self.path.exists():
            return
        try:
            size = self.path.stat().st_size
        except OSError:
            return
        if size < self._last_size:
            # file rotated or truncated
            self._last_size = 0
        if size == self._last_size:
            return
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                f.seek(self._last_size)
                new = f.read()
            self._last_size = size
        except OSError as exc:
            log.warning("journal read failed: %s", exc)
            return
        for line in new.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            await self.sse.publish(_map_event(entry), entry)

    async def _loop(self) -> None:
        if self.path.exists():
            try:
                self._last_size = self.path.stat().st_size
            except OSError:
                self._last_size = 0
        while True:
            try:
                await self._tick()
            except Exception as exc:  # noqa: BLE001
                log.warning("journal watcher error: %s", exc)
            await asyncio.sleep(self.poll_ms / 1000)

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


def _map_event(entry: dict) -> str:
    ev = entry.get("event", "journal")
    if ev in ("order_filled", "virtual_filled"):
        return "trade"
    if ev in ("runner_start", "runner_stop"):
        return "runner_state"
    if ev == "halt_block":
        return "halt_changed"
    return "journal"
