"""
Nomos Trade Sync — pulls trades from Freqtrade API and updates journal + scoreboard.
Run periodically or after each trading cycle.

Usage: python sync-trades.py
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import urllib.request

BASE = Path("C:/Users/noadmin/nospace/finance/nomos")
JOURNAL = BASE / "memory/trading/journal.jsonl"
PORTFOLIO = BASE / "memory/trading/portfolio-state.json"
SCOREBOARD = BASE / "memory/trading/scoreboard.md"
FT_URL = "http://localhost:8080/api/v1"


def get_token():
    req = urllib.request.Request(
        f"{FT_URL}/token/login",
        method="POST",
    )
    import base64
    creds = base64.b64encode(b"nomos:nomos-demo").decode()
    req.add_header("Authorization", f"Basic {creds}")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data["access_token"]


def api_get(endpoint, token):
    req = urllib.request.Request(f"{FT_URL}/{endpoint}")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def load_journal():
    if not JOURNAL.exists():
        return []
    trades = []
    for line in JOURNAL.read_text().strip().split("\n"):
        if line.strip():
            trades.append(json.loads(line))
    return trades


def save_journal_entry(entry):
    with open(JOURNAL, "a") as f:
        f.write(json.dumps(entry) + "\n")


def update_portfolio(trades, balance_data):
    existing = json.loads(PORTFOLIO.read_text()) if PORTFOLIO.exists() else {}

    closed = [t for t in trades if t.get("close_date")]
    wins = [t for t in closed if t.get("pnl", 0) > 0]
    losses = [t for t in closed if t.get("pnl", 0) <= 0]
    total_pnl = sum(t.get("pnl", 0) for t in closed)

    initial = existing.get("initial_capital", 260.0)
    current = initial + total_pnl
    max_dd = min(existing.get("max_drawdown", 0), total_pnl) if total_pnl < 0 else existing.get("max_drawdown", 0)

    state = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "mode": "dry_run",
        "initial_capital": initial,
        "current_balance": round(current, 2),
        "currency": "USDT",
        "open_positions": [t.get("pair") for t in trades if not t.get("close_date")],
        "total_trades": len(closed),
        "winning_trades": len(wins),
        "losing_trades": len(losses),
        "total_pnl": round(total_pnl, 2),
        "max_drawdown": round(max_dd, 2),
        "daily_pnl": round(sum(
            t.get("pnl", 0) for t in closed
            if t.get("close_date", "")[:10] == datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ), 2),
        "weekly_pnl": round(total_pnl, 2),
        "halted": False,
        "halt_reason": None,
    }

    # Check halt conditions
    if abs(state["daily_pnl"]) >= initial * 0.03 and state["daily_pnl"] < 0:
        state["halted"] = True
        state["halt_reason"] = f"Daily loss limit hit: ${state['daily_pnl']}"
    if abs(state["weekly_pnl"]) >= initial * 0.08 and state["weekly_pnl"] < 0:
        state["halted"] = True
        state["halt_reason"] = f"Weekly loss limit hit: ${state['weekly_pnl']}"
    if abs(state["max_drawdown"]) >= initial * 0.20:
        state["halted"] = True
        state["halt_reason"] = f"Max drawdown limit hit: ${state['max_drawdown']}"

    PORTFOLIO.write_text(json.dumps(state, indent=2))
    return state


def update_scoreboard(state, trades):
    closed = [t for t in trades if t.get("close_date")]
    wins = [t for t in closed if t.get("pnl", 0) > 0]
    losses = [t for t in closed if t.get("pnl", 0) <= 0]

    win_rate = f"{len(wins)/len(closed)*100:.1f}%" if closed else "--"
    avg_win = f"${sum(t['pnl'] for t in wins)/len(wins):.2f}" if wins else "--"
    avg_loss = f"${sum(t['pnl'] for t in losses)/len(losses):.2f}" if losses else "--"
    pnl_pct = (state["total_pnl"] / state["initial_capital"]) * 100
    dd_pct = (abs(state["max_drawdown"]) / state["initial_capital"]) * 100

    trade_rows = ""
    for i, t in enumerate(closed, 1):
        pnl_p = (t["pnl"] / state["initial_capital"]) * 100
        trade_rows += f"| {i} | {t.get('close_date','')[:16]} | {t['pair']} | LONG | {t.get('open_rate',0):.2f} | {t.get('close_rate',0):.2f} | ${t['pnl']:.2f} | {pnl_p:+.2f}% | ${state['initial_capital']+sum(c['pnl'] for c in closed[:i]):.2f} |\n"

    if not trade_rows:
        trade_rows = "| -- | -- | -- | -- | -- | -- | -- | -- | -- |\n"

    md = f"""# Nomos Trading Scoreboard
> Auto-updated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}

## Summary

| Metric | Value |
|---|---|
| Mode | dry_run |
| Started | 2026-03-23 |
| Initial Capital | ${state['initial_capital']:.2f} |
| Current Balance | ${state['current_balance']:.2f} |
| Total P&L | ${state['total_pnl']:.2f} ({pnl_pct:+.2f}%) |
| Total Trades | {state['total_trades']} |
| Win Rate | {win_rate} |
| Avg Win | {avg_win} |
| Avg Loss | {avg_loss} |
| Max Drawdown | ${abs(state['max_drawdown']):.2f} ({dd_pct:.2f}%) |
| Open Positions | {len(state['open_positions'])} |

## Trade Log

| # | Date | Pair | Direction | Entry | Exit | P&L | P&L % | Balance |
|---|---|---|---|---|---|---|---|---|
{trade_rows}
## Halt Status
Active: {'YES - ' + state['halt_reason'] if state['halted'] else 'NO'}
"""
    SCOREBOARD.write_text(md)


def main():
    token = get_token()

    # Get trades from Freqtrade
    ft_trades = api_get("trades?limit=100", token)
    all_trades = ft_trades.get("trades", [])

    # Load existing journal
    journal = load_journal()
    known_ids = {t.get("ft_trade_id") for t in journal}

    # Sync new/updated trades
    synced_trades = []
    for t in all_trades:
        entry = {
            "ft_trade_id": t["trade_id"],
            "pair": t["pair"],
            "open_date": t.get("open_date"),
            "close_date": t.get("close_date"),
            "open_rate": t.get("open_rate"),
            "close_rate": t.get("close_rate"),
            "stake_amount": t.get("stake_amount"),
            "pnl": t.get("profit_abs", 0),
            "pnl_pct": t.get("profit_pct", 0),
            "exit_reason": t.get("exit_reason"),
            "duration": t.get("trade_duration"),
        }
        synced_trades.append(entry)

        if t["trade_id"] not in known_ids:
            save_journal_entry(entry)
            known_ids.add(t["trade_id"])

    # Get balance
    balance = api_get("balance", token)

    # Update portfolio state
    state = update_portfolio(synced_trades, balance)

    # Update scoreboard
    update_scoreboard(state, synced_trades)

    print(f"Synced {len(all_trades)} trades. Balance: ${state['current_balance']:.2f}. P&L: ${state['total_pnl']:.2f}")
    if state["halted"]:
        print(f"HALTED: {state['halt_reason']}")


if __name__ == "__main__":
    main()
