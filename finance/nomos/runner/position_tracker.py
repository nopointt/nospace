"""Position tracker: derives per-(strategy,pair) position state from journal.

State machine per (strategy, pair):
  FLAT  → BUY  → LONG
  LONG  → SELL → FLAT
Repeat BUY while LONG: skip (no-op).
Repeat SELL while FLAT: skip (no-op).

Reads only `order_filled` and `virtual_filled` events. Ignores HOLD ticks.
"""

from __future__ import annotations

from collections import defaultdict


def build_state(journal_entries: list[dict]) -> dict[tuple[str, str], str]:
    """Returns {(strategy, pair): 'LONG' | 'FLAT'} from journal history."""
    state: dict[tuple[str, str], str] = defaultdict(lambda: "FLAT")
    for e in journal_entries:
        if e.get("event") not in ("order_filled", "virtual_filled"):
            continue
        key = (e.get("strategy", ""), e.get("pair", ""))
        side = e.get("side")
        if side == "buy":
            state[key] = "LONG"
        elif side == "sell":
            state[key] = "FLAT"
    return dict(state)


def should_skip(current_state: str, action: str) -> tuple[bool, str]:
    """Returns (skip: bool, reason: str)."""
    if action == "BUY" and current_state == "LONG":
        return True, "already_long"
    if action == "SELL" and current_state == "FLAT":
        return True, "already_flat"
    return False, ""


def last_entry_ts(journal_entries: list[dict], strategy: str, pair: str) -> int:
    """Timestamp of last order for (strategy, pair), or 0 if none."""
    for e in reversed(journal_entries):
        if e.get("event") in ("order_filled", "virtual_filled"):
            if e.get("strategy") == strategy and e.get("pair") == pair:
                return int(e.get("ts", 0))
    return 0
