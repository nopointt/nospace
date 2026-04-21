# Nomos Paper Trading Runner

Lightweight Python runner for paper trading on Binance testnet. No Docker, no Freqtrade — just CCXT + pandas.

## Quick start

```bash
# 1. Install deps (one-time)
pip install ccxt pandas numpy

# 2. Start the runner in background (PowerShell)
cd finance/nomos/runner
Start-Process python -ArgumentList "runner.py" -WindowStyle Hidden -RedirectStandardOutput "..\memory\trading\runner.stdout.log" -RedirectStandardError "..\memory\trading\runner.stderr.log"

# 3. Check status anytime
python monitor.py 3    # last 3h summary
python monitor.py 24   # last 24h

# 4. Stop the runner
Get-Process python | Where-Object { $_.CommandLine -match "runner.py" } | Stop-Process
```

## Files

| File | Purpose |
|---|---|
| `config.json` | All tunables: pairs, timeframe, allocations, risk rules |
| `runner.py` | Main loop, orchestrator |
| `ccxt_client.py` | Binance testnet client factory |
| `executor.py` | Places market orders |
| `cramer_mirror.py` | Flips BUY<->SELL for contrarian comparison |
| `risk_gate.py` | Drawdown-based halt logic |
| `journal.py` | Append-only JSONL trade log |
| `scoreboard.py` | Updates scoreboard.md + portfolio-state.json |
| `monitor.py` | CLI summary tool (run anytime) |
| `strategies/basic_ema_rsi.py` | EMA cross + RSI — 5m |
| `strategies/macd_trend.py` | MACD cross + ADX filter — 1h |
| `strategies/remizov_v2.py` | ODE damping + trend slope — 1h |
| `strategies/_indicators.py` | EMA/RSI/MACD/ADX/ODE-fit helpers |

## How to halt manually

```bash
echo "manual halt: reason" > ../memory/trading/halt.flag
```

All new trades will be blocked. Remove the file to resume.

## Output paths

- `finance/nomos/memory/trading/journal.jsonl` — all events (append-only)
- `finance/nomos/memory/trading/scoreboard.md` — human-readable summary (auto-updated)
- `finance/nomos/memory/trading/portfolio-state.json` — current state snapshot
- `finance/nomos/memory/trading/runner.stdout.log` — stdout
- `finance/nomos/memory/trading/runner.stderr.log` — stderr

## Risk rules (from config)

- Daily drawdown >= 3% → halt
- Weekly drawdown >= 8% → halt
- Total drawdown >= 20% → halt

## Strategies

All three run in parallel. Cramer Mode mirrors each signal with the opposite action (separate tag `_cramer`).

## Known limitations (MVP)

- Stateless signals: strategies emit BUY/SELL each tick without position tracking. Multiple BUYs on the same pair can accumulate. Future: position-aware state.
- No stoploss/trailing-stop management (Freqtrade feature). Paper mode only — acceptable for infra validation, not for production.
- 5m / 1h timeframes tested; other timeframes require new strategy config.
