---
# nomos-roadmap.md — Nomos Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start
> Last updated: 2026-03-19
---

## Phases

### Phase 1 — Foundation (current)
> Setup infrastructure, first buy, learn basics

- [x] Define project scope and constraints
- [x] Legal research (KZ 2025-2026)
- [x] Instruments research
- [x] Create project structure (L1-L4)
- [x] Rename Praxis → Satoshi (identity, skills, MEMORY.md)
- [x] Research trading bot best practices (6 research files, 5,366 lines)
- [x] Write Satoshi instruction (skill /startsatoshi + checkpoint/close/continue)
- [x] Trading infra: 4 MCP servers + Freqtrade Docker + 10 strategies
- [x] Remizov ODE research (Opus, 1,008 lines)
- [x] Backtest all strategies (180 days, market -49%)
- [x] Playwright tests (10/10 pass)
- [ ] Build RAG knowledge base (finance/trading library)
- [ ] First real purchase: register Binance, buy first USDT+BTC
- [ ] Setup portfolio tracking (DB)
- [ ] Emergency reserve strategy
- [ ] Contexter income → Nomos pipeline (50% MRR reinvested)

### Phase 2 — Observability Dashboard (current parallel track)
> Web dashboard for runner + portfolio + trading intelligence. Deploys to nomos.contexter.cc.

- [ ] Backend: FastAPI on Hetzner (reuse Contexter VPS)
- [ ] Frontend: Vite + SolidJS + Tailwind, light Bauhaus theme
- [ ] Design tokens: adapt Contexter system, Bauhaus primary triad (red/blue/yellow)
- [ ] 8 pages: Overview, Strategies, Trades, Portfolio, Charts, Risk, Remizov ODE, Settings
- [ ] Runner control: start/stop/config via web (not just read-only)
- [ ] Live prices via CCXT, SSE/WebSocket push
- [ ] Deploy: CF Pages frontend + docker-compose service on Hetzner

See `phase2-dashboard/` for full specs.

### Phase 3 — DCA Machine
> Monthly routine, portfolio growth, learn markets

- [ ] Establish monthly DCA routine (75K KZT → crypto)
- [ ] Split strategy: conservative (USDT/staking) + growth (BTC/ETH)
- [ ] Portfolio tracking automation
- [ ] Market monitoring setup
- [ ] Learn: candlesticks, support/resistance, market cycles
- [ ] First staking position

### Phase 4 — Active Management
> Beyond DCA: signals, rebalancing, opportunities

- [ ] Entry/exit signal system (Satoshi-powered)
- [ ] Portfolio rebalancing rules
- [ ] Altcoin research framework
- [ ] Risk management rules (stop-loss, position sizing)
- [ ] DeFi yield exploration (AAVE, Compound)

### Phase 5 — Automation (Satoshi Bot)
> Automate what works

- [ ] Auto-DCA setup (if platform supports)
- [ ] Price alerts and notifications
- [ ] Portfolio dashboard
- [ ] Automated reporting
- [ ] API integrations (Binance API, price feeds)

### Phase 6 — Scale
> Post-debt freedom, expanded instruments

- [ ] Debt repaid → accounts unblocked
- [ ] Open brokerage account (Freedom Finance)
- [ ] ETF/stocks allocation
- [ ] Diversify beyond crypto
- [ ] Tax optimization

## Priorities (March 2026)

1. **Satoshi identity + instruction** — so future sessions start correctly
2. **RAG knowledge base** — can't advise well without deep knowledge
3. **First real purchase** — theory without practice is useless
