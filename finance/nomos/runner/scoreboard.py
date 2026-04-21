"""Scoreboard updater: aggregates journal into scoreboard.md + portfolio-state.json.

Computes per-strategy and total P&L from `order_filled` events. Queries CCXT
for current balance. Writes Markdown summary table.
"""

from __future__ import annotations

import json
import time
from collections import defaultdict
from pathlib import Path


class Scoreboard:
    def __init__(self, md_path: Path, state_path: Path, start_capital: float):
        self.md_path = md_path
        self.state_path = state_path
        self.start_capital = start_capital
        self.md_path.parent.mkdir(parents=True, exist_ok=True)

    def update(self, journal, client) -> None:
        entries = journal.read_all()
        stats = self._compute_stats(entries)
        balance = self._fetch_balance(client)

        state = {
            "updated_at": int(time.time()),
            "start_capital": self.start_capital,
            "current_balance_usdt": balance["USDT"],
            "current_balance_btc": balance["BTC"],
            "current_balance_eth": balance["ETH"],
            "by_strategy": stats["by_strategy"],
            "totals": stats["totals"],
            "halt_active": stats["halt_active"],
        }
        self.state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

        md = self._render_md(stats, balance, entries)
        self.md_path.write_text(md, encoding="utf-8")

    def _compute_stats(self, entries: list[dict]) -> dict:
        by_strat: dict[str, dict] = defaultdict(lambda: {
            "trades": 0, "buys": 0, "sells": 0, "volume_usd": 0.0, "virtual": False,
        })
        halt_active = False
        total_trades = 0
        total_volume = 0.0
        virtual_trades = 0
        virtual_volume = 0.0
        dedup_count = 0
        cooldown_count = 0

        for e in entries:
            evt = e.get("event")
            if evt in ("order_filled", "virtual_filled"):
                strat = e.get("strategy", "?")
                by_strat[strat]["trades"] += 1
                by_strat[strat]["virtual"] = (evt == "virtual_filled")
                if e.get("side") == "buy":
                    by_strat[strat]["buys"] += 1
                else:
                    by_strat[strat]["sells"] += 1
                cost = e.get("cost") or (e.get("amount", 0) * e.get("price", 0))
                by_strat[strat]["volume_usd"] += float(cost or 0)
                if evt == "order_filled":
                    total_trades += 1
                    total_volume += float(cost or 0)
                else:
                    virtual_trades += 1
                    virtual_volume += float(cost or 0)
            elif evt == "halt_block":
                halt_active = True
            elif evt == "signal_dedup":
                dedup_count += 1
            elif evt == "signal_cooldown":
                cooldown_count += 1

        return {
            "by_strategy": dict(by_strat),
            "totals": {
                "trades": total_trades,
                "volume_usd": total_volume,
                "virtual_trades": virtual_trades,
                "virtual_volume": virtual_volume,
                "dedup": dedup_count,
                "cooldown": cooldown_count,
            },
            "halt_active": halt_active,
        }

    def _fetch_balance(self, client) -> dict:
        try:
            bal = client.fetch_balance()
            return {
                "USDT": float(bal.get("USDT", {}).get("free", 0)),
                "BTC": float(bal.get("BTC", {}).get("free", 0)),
                "ETH": float(bal.get("ETH", {}).get("free", 0)),
            }
        except Exception:
            return {"USDT": 0.0, "BTC": 0.0, "ETH": 0.0}

    def _render_md(self, stats: dict, balance: dict, entries: list[dict]) -> str:
        updated = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime())
        lines = [
            "# Nomos Trading Scoreboard",
            f"> Auto-updated: {updated}",
            "",
            "## Summary",
            "",
            "| Metric | Value |",
            "|---|---|",
            f"| Mode | paper (testnet) |",
            f"| Start Capital | ${self.start_capital:,.2f} |",
            f"| USDT (free) | {balance['USDT']:,.2f} |",
            f"| BTC (free) | {balance['BTC']:.6f} |",
            f"| ETH (free) | {balance['ETH']:.6f} |",
            f"| Real Trades | {stats['totals']['trades']} |",
            f"| Real Volume | ${stats['totals']['volume_usd']:,.2f} |",
            f"| Virtual Trades (Cramer) | {stats['totals']['virtual_trades']} |",
            f"| Virtual Volume | ${stats['totals']['virtual_volume']:,.2f} |",
            f"| Signals Deduped | {stats['totals']['dedup']} |",
            f"| Signals Cooldown | {stats['totals']['cooldown']} |",
            f"| Halt Active | {'YES' if stats['halt_active'] else 'NO'} |",
            "",
            "## By Strategy",
            "",
            "| Strategy | Type | Trades | Buys | Sells | Volume USD |",
            "|---|---|---|---|---|---|",
        ]
        for strat, s in sorted(stats["by_strategy"].items()):
            kind = "virtual" if s["virtual"] else "real"
            lines.append(
                f"| {strat} | {kind} | {s['trades']} | {s['buys']} | {s['sells']} | ${s['volume_usd']:,.2f} |"
            )
        if not stats["by_strategy"]:
            lines.append("| -- | -- | 0 | 0 | 0 | $0.00 |")

        lines += ["", "## Recent Events (last 20)", ""]
        interesting = ("order_filled", "virtual_filled", "order_error", "halt_block", "runner_start", "runner_stop")
        recent = [e for e in entries if e.get("event") in interesting][-20:]
        for e in recent:
            ts = time.strftime("%m-%d %H:%M", time.gmtime(e.get("ts", 0)))
            evt = e.get("event", "?")
            strat = e.get("strategy", "-")
            pair = e.get("pair", "-")
            detail = ""
            if evt in ("order_filled", "virtual_filled"):
                detail = f"{e.get('side', '?').upper()} {e.get('amount', 0)} @ {e.get('price', 0)}"
            elif evt == "order_error":
                detail = f"ERROR: {e.get('error', '')[:60]}"
            elif evt == "halt_block":
                detail = f"blocked: {e.get('reason', '?')}"
            lines.append(f"- `{ts}` [{evt}] {strat} {pair} — {detail}")

        return "\n".join(lines) + "\n"
