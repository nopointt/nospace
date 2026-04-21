---
# nomos-phase1.md — Phase 1: Foundation
> Layer: L3 | Status: IN PROGRESS | Started: 2026-03-19
> Last updated: 2026-04-22 (session 5 CLOSE — runner migrated to Hetzner docker service, Phase 2 Waves 0-4 done)
---

## Goal

Build working paper trading infrastructure. Prove the system works in plus before touching real money.

## Sub-phases

### Phase 1A — Research & Setup (DONE)

| ID | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Legal + instruments research | DONE | Two research files written |
| 1.2 | Project structure (L1-L4) | DONE | `nospace/finance/nomos/` |
| 1.3 | Rename Praxis → Satoshi | DONE | identity, skills, MEMORY.md — all updated |
| 1.4 | Deep research: trading agent system | DONE | 4 agents, 4,475 lines, 6 files in docs/research/ |
| 1.5 | Write Satoshi skills | DONE | start/checkpoint/close/continue/fast-checkpoint |

### Phase 1B — Demo Machine (CURRENT)

Goal: запустить paper trading pipeline на демо-счёте, гонять 2-3 дня, собрать статистику.

| ID | Task | Status | Notes |
|---|---|---|---|
| 1.6 | MCP setup: CCXT Binance testnet | DONE | CCXT MCP v4.0.0, testnet keys in ~/.tlos/binance-testnet |
| 1.7 | MCP setup: market data | DONE | CoinGecko (HTTP) + Crypto.com (HTTP) + crypto-indicators (76 ind, stdio) |
| 1.8 | Freqtrade Docker: dry-run | DONE | Container running, API at :8080, $260 USDT wallet |
| 1.9 | Basic strategy: EMA crossover + RSI | DONE | NomosBasicStrategy.py, 5m timeframe, BTC/ETH |
| 1.10 | Claude Code agent definitions | DONE | scanner + analyst + risk-gate in nomos/agents/ |
| 1.11 | Trading memory + sync | DONE | journal.jsonl + portfolio-state.json + scoreboard.md + sync-trades.py |
| 1.12 | Paper trading: 7-day run | IN PROGRESS | **Migrated to Hetzner docker service `nomos-runner` in session 5 (2026-04-22)**. Writes to `/opt/nomos/memory/trading/journal.jsonl` (shared volume with nomos-api). `restart: unless-stopped`. Runs until 2026-04-28. |
| 1.13 | Evaluate results | PENDING | After 1.12 finishes: compare vs buy-and-hold, decide Phase 1C go/no-go |

### Phase 1C — First Real Money (LATER)

| ID | Task | Status | Notes |
|---|---|---|---|
| 1.14 | Register on Binance KZ | TODO | KYC with nopoint ИИН |
| 1.15 | Emergency reserve plan | TODO | $50 USDT untouchable reserve |
| 1.16 | First DCA purchase | TODO | BTC 60% / ETH 30% / USDT 10% split |
| 1.17 | Portfolio DB setup | TODO | SQLite — every trade logged |
| 1.18 | Risk rules codified | TODO | 3% daily / 8% weekly / 20% total → halt |

### Phase 1D — Signal Integration (LATER)

| ID | Task | Status | Notes |
|---|---|---|---|
| 1.19 | Telegram signal parser | TODO | Telethon listener → parse signals from group |
| 1.20 | Signal verification agent | TODO | Claude Code verifies each signal (TA + sentiment + risk) |
| 1.21 | Signal scoreboard | TODO | Track group's real win rate over time |

## Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-19 | Crypto only (no stocks/bonds) | Blocked accounts, only path available |
| 2026-03-19 | Self-custody for safety | Bailiffs can't seize private keys |
| 2026-03-19 | Binance P2P via girlfriend Kaspi | Cheapest on-ramp (0% + 1-3% spread) |
| 2026-03-19 | Debt not priority | Will repay from profits later |
| 2026-03-19 | Praxis renamed to Satoshi | Finance-specific identity |
| 2026-03-23 | Demo first, no real money | Prove system works in plus before investing |
| 2026-03-23 | Claude Code + Freqtrade hybrid | Claude = reasoning/strategy, Freqtrade = execution/backtesting |
| 2026-03-23 | DCA = primary strategy at $260 | Only proven strategy for small capital (backtest: +202% over 5yr BTC) |
| 2026-03-23 | Telegram signals = later phase | First build core pipeline, then add signals as input |
| 2026-03-23 | Risk rules: 3%/8%/20% halt | Daily/weekly/total drawdown limits |
| 2026-03-23 | Contexter = primary income source | Trading = compound engine for Contexter profits, not primary income |
| 2026-03-23 | 50% Contexter revenue → Nomos | Reinvest half of MRR into trading capital |
| 2026-03-23 | Target: $128K trading capital in 36mo | Via Contexter MRR ramp ($0→$15K) + 20% trading returns + $200/mo cash |
| 2026-03-23 | Remizov ODE = experimental edge | Returns-based ODE (v2), needs 2-3 more iterations. Unique approach |
| 2026-03-23 | 10 strategies backtested | MACD Trend best (+1.97%), Remizov v2 generates trades but needs tuning |
| 2026-04-21 | Abandoned Freqtrade/Docker, switched to pure Python+CCXT runner | Docker ate 2-3GB RAM. New stack: ~50MB. Port of 3 strategies (Basic/MACD/Remizov v2) with pandas+numpy indicators (no ta-lib) |
| 2026-04-21 | Cramer Mode enabled for paper run | Contrarian mirror executor — every signal flipped with separate tag. Validates whether strategies beat inversion |
| 2026-04-21 | Per-strategy TIMEFRAME (5m/1h) instead of uniform 4h | Compromise for faster signal density in paper mode. 4h strategies on 1h may need threshold tuning |
| 2026-04-21 | Runner: position-aware state machine (FLAT↔LONG per strategy+pair) | Fixed stateless flip-flop bug — signals were emitted every tick without position awareness |
| 2026-04-21 | Runner: 15-min cooldown между ордерами одной strategy+pair | Defense in depth beyond state machine — avoid rapid re-entries |
| 2026-04-21 | Cramer Mode → virtual-only (no real orders) | Fixed zero-out bug — Cramer на том же testnet аккаунте обнулял primary strategy |
| 2026-04-21 | Phase 2 Observability Dashboard opened | New epic `nomos-phase2.md` — parallel track to Phase 1B runner. Specs in `phase2-dashboard/` |

## Research Artifacts

| File | Lines | Content |
|---|---|---|
| `docs/research/nomos-trading-agent-architecture.md` | 1,594 | 40+ MCP servers, multi-agent pipeline, CCXT, Freqtrade, step-by-step |
| `docs/research/nomos-trading-agent-cases.md` | 1,049 | 6 Claude Code cases, 7 GitHub projects, Polymarket, academic papers |
| `docs/research/nomos-trading-agent-strategies.md` | 875 | DCA/Grid/DeFi/Staking/CopyTrading + risk management |
| `docs/research/nomos-trading-agent-legal-tools.md` | 691 | KZ tax/legal, Kaspi risks, 9 tool comparison |
| `docs/research/nomos-trading-agent-research.md` | 149 | Seed research (initial WebSearch) |
| `docs/research/nomos-remizov-trading-research.md` | 1,008 | Remizov ODE method, 9 strategy ideas, 7 Python functions |

## Acceptance Criteria — Phase 1B

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | Freqtrade runs in Docker, dry-run mode | `docker ps` shows freqtrade container running |
| AC-2 | At least 1 MCP server connected to Claude Code | `claude mcp list` shows Binance or CoinGecko |
| AC-3 | Paper trades executing automatically | Freqtrade logs show simulated trades |
| AC-4 | P&L tracked per trade | JSON/SQLite file with entry/exit/result for each trade |
| AC-5 | 48+ hours of continuous paper trading | Log timestamps span 2+ days |
| AC-6 | Results evaluated against buy-and-hold | Comparison table in evaluation report |
