"""Monitor: summarize runner activity over last N hours.

Usage:
    python monitor.py            # last 3h (default)
    python monitor.py 1          # last 1h
    python monitor.py 0.5        # last 30min
    python monitor.py 24         # last 24h
"""

from __future__ import annotations

import json
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

REPO_ROOT = Path("C:/Users/noadmin/nospace")


def load_config() -> dict:
    with open(Path(__file__).parent / "config.json", "r", encoding="utf-8") as f:
        return json.load(f)


def fmt_duration(seconds: float) -> str:
    if seconds < 60:
        return f"{int(seconds)}s"
    if seconds < 3600:
        return f"{int(seconds/60)}m"
    if seconds < 86400:
        return f"{seconds/3600:.1f}h"
    return f"{seconds/86400:.1f}d"


def summarize(hours: float) -> str:
    cfg = load_config()
    journal_path = REPO_ROOT / cfg["paths"]["journal"]
    state_path = REPO_ROOT / cfg["paths"]["portfolio_state"]
    halt_path = REPO_ROOT / cfg["paths"]["halt_flag"]

    if not journal_path.exists():
        return "No journal yet. Runner not started or never ticked."

    since = int(time.time() - hours * 3600)
    events = []
    with open(journal_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                e = json.loads(line)
                if e.get("ts", 0) >= since:
                    events.append(e)
            except json.JSONDecodeError:
                continue

    counts = Counter(e.get("event", "?") for e in events)
    real_trades = [e for e in events if e.get("event") == "order_filled"]
    virtual_trades = [e for e in events if e.get("event") == "virtual_filled"]
    errors = [e for e in events if e.get("event") == "order_error"]
    halts = [e for e in events if e.get("event") == "halt_block"]
    dedups = [e for e in events if e.get("event") == "signal_dedup"]
    cooldowns = [e for e in events if e.get("event") == "signal_cooldown"]
    signals = [e for e in events if e.get("event") in ("order_filled", "virtual_filled", "halt_block")]

    trades_by_strat: dict[str, dict] = defaultdict(lambda: {"buys": 0, "sells": 0, "volume": 0.0, "virtual": False})
    for t in real_trades + virtual_trades:
        s = t.get("strategy", "?")
        trades_by_strat[s]["virtual"] = (t.get("event") == "virtual_filled")
        if t.get("side") == "buy":
            trades_by_strat[s]["buys"] += 1
        else:
            trades_by_strat[s]["sells"] += 1
        cost = t.get("cost") or (t.get("amount", 0) * t.get("price", 0))
        trades_by_strat[s]["volume"] += float(cost or 0)

    # Portfolio state
    state = {}
    if state_path.exists():
        state = json.loads(state_path.read_text(encoding="utf-8"))

    halt_active = halt_path.exists()

    lines = [
        f"=== Nomos Runner Monitor — last {fmt_duration(hours*3600)} ===",
        f"Now: {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}",
        f"Window start: {time.strftime('%m-%d %H:%M', time.gmtime(since))}",
        "",
        f"Total events in window: {len(events)}",
    ]
    for evt, n in counts.most_common():
        lines.append(f"  {evt}: {n}")

    lines.append("")
    lines.append(
        f"REAL: {len(real_trades)} | VIRTUAL: {len(virtual_trades)} | "
        f"DEDUP: {len(dedups)} | COOLDOWN: {len(cooldowns)} | "
        f"ERRORS: {len(errors)} | HALTS: {len(halts)}"
    )
    lines.append("")

    if trades_by_strat:
        lines.append("By strategy:")
        for s in sorted(trades_by_strat.keys()):
            d = trades_by_strat[s]
            kind = "[virt]" if d["virtual"] else "[real]"
            lines.append(f"  {kind} {s}: buys={d['buys']} sells={d['sells']} volume=${d['volume']:,.2f}")
        lines.append("")

    if state:
        lines.append(
            f"Balance: USDT={state.get('current_balance_usdt', 0):,.2f}  "
            f"BTC={state.get('current_balance_btc', 0):.6f}  "
            f"ETH={state.get('current_balance_eth', 0):.6f}"
        )
        lines.append("")

    if halt_active:
        lines.append(f"*** HALT ACTIVE *** ({halt_path.read_text(encoding='utf-8')[:200]})")
        lines.append("")

    if errors:
        lines.append("Recent errors (last 5):")
        for e in errors[-5:]:
            ts = time.strftime("%H:%M:%S", time.gmtime(e.get("ts", 0)))
            lines.append(f"  {ts} {e.get('strategy', '?')} {e.get('pair', '?')}: {e.get('error', '')[:80]}")
        lines.append("")

    if signals[-10:]:
        lines.append("Recent signals (last 10):")
        for e in signals[-10:]:
            ts = time.strftime("%H:%M:%S", time.gmtime(e.get("ts", 0)))
            evt = e.get("event", "?")
            strat = e.get("strategy", "?")
            pair = e.get("pair", "?")
            detail = ""
            if evt == "order_filled":
                detail = f"{e.get('side', '?').upper()} {e.get('amount', 0)} @ {e.get('price', 0)}"
            elif evt == "halt_block":
                detail = f"BLOCKED: {e.get('reason', '')}"
            lines.append(f"  {ts} [{evt}] {strat} {pair} — {detail}")

    return "\n".join(lines)


def main() -> int:
    hours = 3.0
    if len(sys.argv) > 1:
        try:
            hours = float(sys.argv[1])
        except ValueError:
            print(f"invalid hours: {sys.argv[1]}")
            return 1
    print(summarize(hours))
    return 0


if __name__ == "__main__":
    sys.exit(main())
