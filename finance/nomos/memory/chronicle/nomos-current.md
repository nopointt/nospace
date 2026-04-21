# Nomos Chronicle — Working Set
> Last ~1200 lines. Older entries → nomos-chronicle.md

---

## 2026-03-19 — Session 0 (Satoshi, project creation)

- Nomos project created in `nospace/finance/nomos/`
- Legal research completed: bailiffs can seize bank/brokerage accounts, self-custody crypto is enforcement-resistant
- Instruments research completed: P2P cash → crypto via girlfriend Kaspi is cheapest on-ramp
- Key constraints documented: blocked accounts, cash only, crypto path
- Decision: Praxis renamed to Satoshi (Axis/Logos/Satoshi triad)
- Phase 1 (Foundation) started: next steps = Satoshi identity, RAG KB, first purchase

### Session 0 — Full Checkpoint (from scratch 21a40d46+0)

- **First Nomos session.** Satoshi born (ex-Praxis). Full project setup from zero.
- Project name: Nomos (Greek nomos = law/distribution)
- Orchestrator renamed: Praxis → Satoshi (Axis/Logos/Satoshi triad)
- Domain: `nospace/finance/nomos/` (finance is separate from development/)
- On-ramp: cash → girlfriend's Kaspi → Binance P2P → exchange → self-custody
- Debt (700K KZT total) is NOT priority
- Satoshi is multi-project (nomos is first)
- All skills modeled after Axis (newest, most polished)
- Created: L1, L2, L3, chronicle, 5 skills (start/checkpoint/close/continue/fast-checkpoint)
- Research Block 1 (Legal): bailiffs CAN seize exchange crypto (new 2025-2026 laws), CANNOT seize self-custody
- Research Block 2 (Instruments): P2P cheapest, gold too expensive, USD for emergency, DCA recommended
- SubAgent WebSearch/WebFetch permissions DENIED — research must be done from main context
- 13 stale Axis eidolons in registry (Axis cleanup needed)
- Portfolio: not started. No positions. No exchange account.
<!-- ENTRY:2026-03-23:CLOSE:2:nomos:nomos-phase1 [SATOSHI] -->
## 2026-03-23 — session 2 CLOSE [Satoshi]

**Decisions:**
- Demo first, no real money until system proves profitable
- Claude Code + Freqtrade hybrid architecture (Claude=reasoning, Freqtrade=execution)
- DCA = primary strategy for small capital ($260)
- Contexter = primary income source, trading = compound engine for Contexter profits
- 50% Contexter revenue → Nomos trading capital
- Target: $128K trading capital in 36 months via Contexter MRR ramp
- Remizov ODE method = experimental edge, needs 2-3 more iterations
- Risk rules: 3% daily / 8% weekly / 20% total → halt
- Telegram signals deferred to Phase 1D

**Files created (30+):**
- `docs/research/nomos-trading-agent-*.md` (6 files, 5,366 lines total) — deep research by 4 parallel agents (1 Opus + 3 Sonnet)
- `docs/research/nomos-remizov-trading-research.md` (1,008 lines) — Opus deep research on ODE/Remizov
- `finance/nomos/tools/freqtrade/` — full Docker setup, config, 10 strategies
- `finance/nomos/tools/sync-trades.py` — Freqtrade→journal sync
- `finance/nomos/tools/test-trading-infra.spec.ts` — 10 Playwright tests (all pass)
- `finance/nomos/agents/nomos-{scanner,analyst,risk}.md` — 3 agent definitions
- `finance/nomos/memory/trading/` — journal.jsonl, portfolio-state.json, scoreboard.md
- `finance/nomos/tools/crypto-indicators-mcp/` — 76 indicators + 23 strategies
- `finance/nomos/config/ccxt-accounts.json` — Binance testnet
- `~/.tlos/binance-testnet` — testnet API keys (chmod 600)

**Files modified:**
- `finance/nomos/memory/nomos-phase1.md` — full rewrite with sub-phases 1A-1D
- `finance/nomos/memory/chronicle/nomos-current.md` — session 0 scratch processed
- `~/.claude/projects/.../memory/MEMORY.md` — Remizov pointer
- `~/.claude/projects/.../memory/project_nomos_remizov_hypothesis.md` — new

**MCP servers added (4):**
- CoinGecko (HTTP, mcp.api.coingecko.com) — verified connected
- Crypto.com (HTTP) — verified connected
- crypto-indicators (stdio, 76 tools) — verified via JSON-RPC
- CCXT Binance testnet (stdio, v4.0.0) — verified via JSON-RPC

**Portfolio:**
- No real trades. Paper trading only.
- Freqtrade dry-run: $260 USDT wallet, 0 trades executed (waiting for signal)
- Bot stopped at session close (docker compose stop)

**Completed:**
- Phase 1A fully complete (research + setup)
- Phase 1B mostly complete (infra, strategies, testing)
- Deep research: 4 agents, 5,366 lines across 6 files
- Remizov research: 1,008 lines, 2 strategies, v2 fix with feedback loop
- 10 strategies written + backtested on 30/90/180 days
- Playwright: 10/10 tests passing
- Business model: Contexter → Nomos pipeline modeled (36mo projection)

**Backtesting results (10 strategies, 180 days, market -49%):**
- NomosMACDTrend: +1.97% (best, 2 trades, 100% WR)
- NomosEMA4h: +1.32% (4 trades, 75% WR)
- NomosHybrid: -0.41% (3 trades)
- NomosRemizovTrend v2: -0.95% Q1, -6.2% full (36 trades)
- NomosRemizovOscillator v2: -1.21% Q1, -7.62% full (89 trades)
- All others: -3.4% to -37.7%
- ALL strategies beat buy-and-hold (-49%) by wide margin

**Opened:**
- Remizov v3: MACD + ODE filter combination (most promising next step)
- FreqAI parameter optimization
- Strategy tuning on bull market data
- Contexter MVP shipping (primary revenue priority)

**Notes:**
- BTC $68,180 at session time. Market under pressure (Trump Iran ultimatum)
- 92.4% of Polymarket wallets unprofitable — survivorship bias is real
- Most LLM agents fail to beat buy-and-hold in academic benchmarks
- Realistic trading returns: 12-22% annual (not 25-50% as initially estimated)
- On $260 capital, bot profit is negligible — Contexter income is the real lever
- Remizov: ODE on returns works (R2 0.55-0.90), on prices doesn't (R2 ≈ 0). Damping coefficient p genuinely separates market regimes
- Eidolons this session: 5 agents (research-architecture Opus, research-cases, research-strategies, research-legal-tools, remizov-research Opus×2)

<!-- ENTRY:2026-04-21:CLOSE:3:nomos:nomos-phase1 [SATOSHI] -->
## 2026-04-21 — session 3 CLOSE [Satoshi]

**Decisions:**
- Abandoned Freqtrade/Docker for paper trading (ест 2-3GB RAM при уже низких ресурсах)
- New stack: Python + CCXT runner (~50-100MB), no Docker dependency
- All 3 strategies in parallel (MACD Trend, Basic EMA+RSI, Remizov v2) + Cramer Mirror Mode
- Horizon 7 days (2026-04-21 → 2026-04-28), monitor cadence 3h
- Per-strategy TIMEFRAME support (5m for Basic, 1h for MACD/Remizov — compromise from Freqtrade's 4h)
- Risk halt rules codified in config: 3%/8%/20% drawdown → halt.flag
- Stateless signals for MVP — position tracking deferred to v2
- Allocations: $2500 per strategy × 3 + $2500 Cramer = $10K total

**Files changed:**
- `finance/nomos/runner/` — 13 новых файлов (runner.py, config.json, ccxt_client.py, executor.py, journal.py, risk_gate.py, cramer_mirror.py, scoreboard.py, monitor.py, README.md + strategies/{__init__,_indicators,basic_ema_rsi,macd_trend,remizov_v2}.py)
- `finance/nomos/memory/trading/journal.jsonl` — создан, live append-only log
- `finance/nomos/memory/trading/scoreboard.md` — теперь auto-updated by runner
- `finance/nomos/memory/trading/portfolio-state.json` — теперь auto-updated by runner
- `finance/nomos/memory/trading/runner.{stdout,stderr}.log` — live logs
- `finance/nomos/memory/scratches/2efd3500+3-scratch.md` — этот scratch

**Portfolio:**
- Paper/testnet only (не реальные деньги)
- Starting: $10K USDT + 1 BTC + 1 ETH + 1 BNB (Binance testnet default allocation)
- Live orders: 4 ордера исполнены (2 single-tick test + 2 runner tick), все Remizov SELL + Cramer BUY на BTC/USDT (~$2500 volume per pair per tick)
- Real money: нет. Фаза 1C не начата.

**Completed:**
- Весь runner stack построен и работает
- 3 стратегии ported from Freqtrade (EMA/RSI/MACD/ADX/ODE на чистом pandas+numpy)
- Single-tick verified live на testnet — order IDs 7517797, 7517799, 7519492, 7519495
- Runner запущен в background (PID 9280)
- Monitor script для on-demand summary

**Opened:**
- 7-day run в прогрессе (2026-04-21 → 2026-04-28)
- Monitor check каждые 3h до finish
- Decision pending после 7-day: Phase 1C (real money) vs runner improvements (position tracking, stop-loss)
- Remizov v2 генерит частые SELL-сигналы на 1h (p<0) — нужен tune порогов или switch на 4h
- Phase 1B AC-5: "48+ hours continuous paper trading" → будет выполнен через ~2 дня runner аптайма

**Notes:**
- Disk был 2.2GB свободно на входе — nopoint очистил до 9GB вручную (Docker не запускали)
- CCXT 4.5.50, pandas 3.0.2, numpy 2.4.2 установлены глобально (Python 3.14)
- Testnet ключи в ~/.tlos/binance-testnet валидны (canTrade=True, 454 non-zero assets)
- Chronicle #2 Freqtrade Docker подход ЗАМЕНЁН этой сессией
- Session 3 = новая архитектура без Docker/Freqtrade

<!-- ENTRY:2026-04-21:CLOSE:4:nomos:nomos-phase1+phase2 [SATOSHI] -->
## 2026-04-21 — session 4 CLOSE [Satoshi]

**Decisions:**
- Runner bugfix: stateless → position-aware state machine (FLAT↔LONG per strategy+pair)
- Cramer Mode → virtual-only (record `virtual_filled` в journal, no real orders)
- 15-min cooldown между ордерами одной strategy+pair
- **Phase 2 Dashboard opened** (new epic nomos-phase2) — parallel track к Phase 1B
- D-01: Hetzner = тот же VPS 46.62.220.214 (shared с Contexter)
- D-02: Frontend = Vite + SolidJS + Tailwind 4
- D-03: Light theme + классический Bauhaus primary triad (yellow/red/blue), warm off-white ground
- D-04: Backend = FULL (read + control)
- D-05: Contexter design tokens = structural base, Nomos меняет только палитру
- D-06: Bauhaus RAG = Qdrant localhost:6333 (dev); каждый колор-токен цитирует RAG source
- D-07: Live prices = backend polls CCXT → SSE push
- D-08: Runner control = backend spawns/kills runner.py subprocess
- D-09: Auth = single-user bearer token, localStorage
- D-10: Telegram alerts = reuse Contexter bot + chat_id 620190856
- Roadmap: Phase 2 inserted, DCA→3, Active→4, Automation→5, Scale→6

**Files changed:**
- Runner fix (5 files): position_tracker.py NEW, runner.py + cramer_mirror.py + scoreboard.py + monitor.py edited
- Phase 2 specs (7 files): nomos-roadmap.md updated, nomos-phase2.md + phase2-dashboard/{CONTEXT,spec-backend,spec-frontend,spec-design-tokens,spec-infra}.md NEW

**Portfolio:**
- Paper/testnet: 1 real trade после рестарта (Remizov SELL 0.01635 BTC @ $76,452.96 → +$1,250 USDT)
- Balance двинулся впервые: USDT 10000→11250, BTC 1.000000→0.983650
- 1 virtual Cramer запись (не трогает testnet)
- Real money: нет

**Completed:**
- Bug diagnosis через 4-phase reglament (A4)
- Runner фиксы: position tracker + 15-min cooldown + virtual Cramer
- Runner перезапущен (PID 13940, 165MB), 80 min uptime к closeу
- Monitor показывает real/virtual/dedup/cooldown раздельно
- Phase 2 Dashboard: полный spec pipeline — roadmap → L3 epic (24 задачи) → CONTEXT (10 D-nn) → 4 specs (backend/frontend/tokens/infra)

**Opened:**
- Phase 2A scaffolding (tasks 2.1-2.6) — ready для next session
- **Blocker X-01:** runner на Windows vs Hetzner — решить в task 2.1 до начала backend
- X-02: monorepo vs separate repo (default monorepo)
- X-03: CI/CD (default manual scripts)
- Phase 1B 7-day run активен до 2026-04-28
- Remizov v2 tune (частые SELL сигналы на 1h) — остаётся открытым

**Notes:**
- B8 reglament triggered 2x: bug-diagnosis + deploy — оба загружены ДО work
- Qdrant kernel-qdrant-1 up, v1.13.0, bauhaus_knowledge ready
- Contexter design system found at `design/contexter/` (20 files) — structural reuse
- Deploy pattern из Contexter `ops/deploy*.sh`
- Credentials: `~/.tlos/cf-api-token`, `~/.tlos/hetzner-api-token`, SSH root@46.62.220.214
- Runner продолжает работать после close — 7-day run не прерывается
- Next session: `/startsatoshi` → Phase 2A scaffolding, G3 Backend + Frontend параллельно
