# 2efd3500+4-scratch.md
> Active · Satoshi · 2026-04-21

## Сессия 4 — Runner bugfix + Phase 2 Dashboard specs

### Часть 1 — Runner bugfix

Monitor через 2h после запуска показал 2 бага:
- **Stateless flip-flop**: Remizov v2 генерил BUY↔SELL каждый tick без отслеживания позиций (10 BUY + 6 SELL за 2h)
- **Cramer zero-out**: Cramer исполнял зеркальные ордера на том же testnet-аккаунте → обнулял Remizov, balance не двигался

**Фикс:**
- `position_tracker.py` (NEW) — state machine FLAT↔LONG per (strategy, pair)
- `runner.py` — dedup check + 15-min cooldown перед dispatch
- `cramer_mirror.py` (rewrite) — теперь `record_virtual()` пишет `virtual_filled` в journal, НЕ трогает testnet
- `scoreboard.py`, `monitor.py` — раздельный учёт real vs virtual, dedup/cooldown counters

**Верификация после рестарта (80 min):** 1 real trade (Remizov SELL 0.01635 BTC @ $76,452 → USDT+$1,250), 1 virtual Cramer, 1 signal_dedup, 0 errors. Balance корректно сдвинулся впервые.

### Часть 2 — Phase 2 Dashboard specs

Nopoint запросил полный web-дашборд: `nomos.contexter.cc` (CF Pages) + `api.nomos.contexter.cc` (Hetzner). Light theme, классический Bauhaus palette (yellow/red/blue triad), дизайн-систему скопировать из Contexter.

Qdrant проверен: ✅ up, collections `bauhaus_knowledge` + personas доступны.

Written 6 spec files + roadmap update. Session 4 — только planning, следующая сессия = implementation.

<!-- ENTRY:2026-04-21:CLOSE:4:nomos:nomos-phase1+phase2 [SATOSHI] -->
## 2026-04-21 — session 4 CLOSE [Satoshi]

**Decisions:**
- Runner bugfix: stateless → position-aware state machine (FLAT↔LONG per strategy+pair)
- Cramer Mode → virtual-only (record `virtual_filled` in journal, no real orders)
- 15-min cooldown между ордерами одной strategy+pair
- **Phase 2 Dashboard opened** (new epic nomos-phase2) — parallel track к Phase 1B
- D-01: Hetzner = тот же VPS 46.62.220.214 (shared с Contexter)
- D-02: Frontend = Vite + SolidJS + Tailwind 4 (как Contexter)
- D-03: Light theme + классический Bauhaus primary triad (yellow/red/blue), warm off-white ground
- D-04: Backend = FULL (read + control) — runner start/stop/config через web
- D-05: Contexter design tokens = structural base, Nomos меняет только палитру
- D-06: Bauhaus RAG = Qdrant localhost:6333 (dev); каждый колор-токен цитирует RAG source
- D-07: Live prices = backend polls CCXT → SSE push на frontend
- D-08: Runner control = backend spawns/kills runner.py subprocess, PID в файле
- D-09: Auth = single-user bearer token, localStorage
- D-10: Telegram alerts = reuse Contexter bot + chat_id 620190856
- Roadmap: Phase 2 (Observability Dashboard) inserted, shifted DCA→3, Active→4, Automation→5, Scale→6

**Files changed (session 4):**

Runner fix:
- `finance/nomos/runner/position_tracker.py` — NEW (state machine FLAT/LONG, should_skip, last_entry_ts)
- `finance/nomos/runner/runner.py` — added dedup + cooldown checks + virtual Cramer dispatch
- `finance/nomos/runner/cramer_mirror.py` — rewrote: `record_virtual()` (не трогает testnet)
- `finance/nomos/runner/scoreboard.py` — separate real/virtual stats, dedup/cooldown counters
- `finance/nomos/runner/monitor.py` — show real/virtual/dedup/cooldown breakdown

Phase 2 specs:
- `finance/nomos/memory/nomos-roadmap.md` — Phase 2 added, others shifted
- `finance/nomos/memory/nomos-phase2.md` — NEW L3 (24 tasks in 4 sub-phases, 8 AC)
- `finance/nomos/memory/phase2-dashboard/CONTEXT.md` — NEW (10 locked decisions D-01..D-10)
- `finance/nomos/memory/phase2-dashboard/spec-backend.md` — NEW (FastAPI + uv, 30+ endpoints, SSE, Docker)
- `finance/nomos/memory/phase2-dashboard/spec-frontend.md` — NEW (SolidJS + Vite + Tailwind, 9 pages, API client)
- `finance/nomos/memory/phase2-dashboard/spec-design-tokens.md` — NEW (Bauhaus palette + RAG citations, Tailwind config)
- `finance/nomos/memory/phase2-dashboard/spec-infra.md` — NEW (DNS, CF Pages, Hetzner Caddy, deploy scripts, rollback)

**Portfolio:**
- Paper/testnet: 1 real trade после рестарта (Remizov SELL 0.01635 BTC @ $76,452.96 → +$1,250 USDT)
- Balance сдвинулся впервые с начала runner: USDT 10000→11250, BTC 1.000000→0.983650
- Virtual Cramer: 1 запись в journal (BUY 0.01635 @ $76,452.95, не трогает testnet)
- Real money: нет. Phase 1C не начата.

**Completed:**
- Bug diagnosis через reglament (4-phase protocol)
- 3 фикса в runner: position tracker + cooldown + virtual Cramer
- Рестарт runner с фиксами (PID 13940, 165MB)
- Верификация в live (journal events корректные)
- Monitor показывает раздельно real/virtual/dedup/cooldown
- Phase 2 Dashboard full spec pipeline (roadmap → L3 → CONTEXT → 4 specs)
- 10 locked decisions задокументировано

**Opened:**
- Phase 2A scaffolding (tasks 2.1-2.6) — ready to execute next session
- **X-01 (blocker):** runner на Windows vs Hetzner — нужно решить в task 2.1 до backend dev
- **X-02:** monorepo vs separate repo (default: stay in nospace/)
- **X-03:** CI/CD (default: manual scripts)
- Phase 1B 7-day run продолжается до 2026-04-28 (runner крутится в background)
- Remizov v2 timefrime tune (частые SELL на 1h) — вопрос остаётся открытым

**Notes:**
- B8 reglament triggered 2x: bug-diagnosis + deploy — оба загружены ДО work
- Qdrant docker `kernel-qdrant-1` up (nopoint запустил), v1.13.0, collections OK
- Contexter design system found at `nospace/design/contexter/` — 20 файлов, используется как база
- Deploy pattern взят из Contexter `ops/deploy.sh` + `ops/deploy-web.sh`
- Credentials located: `~/.tlos/cf-api-token`, `~/.tlos/hetzner-api-token`
- Runner продолжает работать после /close — 7-day run на testnet не прерывается
- Next session: `/startsatoshi` → Phase 2A scaffolding с G3 агентами (Backend + Frontend параллельно)
