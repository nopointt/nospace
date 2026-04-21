"""Append-only JSONL journal for all runner events."""

from __future__ import annotations

import json
import time
from pathlib import Path
from threading import Lock


class Journal:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def append(self, entry: dict) -> None:
        entry = {"ts": int(time.time()), **entry}
        line = json.dumps(entry, ensure_ascii=False, separators=(",", ":"))
        with self._lock:
            with open(self.path, "a", encoding="utf-8") as f:
                f.write(line + "\n")

    def read_all(self) -> list[dict]:
        if not self.path.exists():
            return []
        entries = []
        with open(self.path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return entries

    def read_since(self, ts_from: int) -> list[dict]:
        return [e for e in self.read_all() if e.get("ts", 0) >= ts_from]
