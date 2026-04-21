"""In-memory SSE broadcast channel.

Publishers push typed events; subscribers receive them via async generator.
Slow consumers are dropped when their queue overflows (max 200 items).
"""
from __future__ import annotations

import asyncio
import json
import time
from collections import deque
from typing import AsyncGenerator


class SSEBroker:
    def __init__(self, history_size: int = 500, queue_size: int = 200):
        self._subscribers: set[asyncio.Queue] = set()
        self._history: deque[dict] = deque(maxlen=history_size)
        self._queue_size = queue_size
        self._lock = asyncio.Lock()

    async def publish(self, event: str, data: dict | None = None) -> None:
        payload = {"event": event, "ts": int(time.time()), "data": data or {}}
        self._history.append(payload)
        dead: list[asyncio.Queue] = []
        async with self._lock:
            for q in self._subscribers:
                try:
                    q.put_nowait(payload)
                except asyncio.QueueFull:
                    dead.append(q)
            for q in dead:
                self._subscribers.discard(q)

    async def subscribe(self, *, replay: int = 0) -> AsyncGenerator[str, None]:
        q: asyncio.Queue = asyncio.Queue(maxsize=self._queue_size)
        async with self._lock:
            self._subscribers.add(q)
        try:
            if replay > 0:
                recent = list(self._history)[-replay:]
                for payload in recent:
                    yield _format_sse(payload)
            while True:
                try:
                    payload = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield _format_sse(payload)
                except asyncio.TimeoutError:
                    # heartbeat to keep connection open via intermediary proxies
                    yield ": heartbeat\n\n"
        finally:
            async with self._lock:
                self._subscribers.discard(q)

    def subscriber_count(self) -> int:
        return len(self._subscribers)


def _format_sse(payload: dict) -> str:
    return f"event: {payload['event']}\ndata: {json.dumps(payload)}\n\n"
