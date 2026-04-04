# session-scratch.md
> Active · Axis · 2026-04-04 · session 231
> Last processed checkpoint: #0

<!-- ENTRY:2026-04-04:CHECKPOINT:1:provizor:provizor-unit-economics AXIS -->
## 2026-04-04 — checkpoint 1 [Axis]

**Decisions:**
- D-01..D-07: Проект Provizor создан (автоматизация 5 аптек Алимхана, Казахстан)
- 4 домена: Telegram-бот (Care as a Service), аналитика ассортимента, ценообразование, unit-экономика
- Стратегия: MLP на данных Алимхана → SaaS для других аптек
- ICE приоритизация: APT-13 (Unit Economics) → APT-01 (Discovery) → APT-02 (Bot MVP)
- Стек: Bun + Hono + PostgreSQL + SolidJS + Tailwind CSS 4 (как Contexter)
- 1С интеграция: OData/HTTP Services, batch hourly sync
- Hero metric: CIS Profitability % (не Gross Margin)
- Мультиканальная маржа = подтверждённый white space (0 из 6 конкурентов считают)
- Рабочее название: Provizor (не финальное)

**Files changed:**
- `development/provizor/` — полная структура проекта создана (memory, chronicle, contexts)
- `development/provizor/memory/STATE.md` — position, decisions, blockers, metrics
- `development/provizor/memory/provizor-about.md` — L1: identity, 4 домена, трафик, стек
- `development/provizor/memory/provizor-roadmap.md` — L2: 15 эпиков, critical path, ICE
- `development/provizor/memory/provizor-discovery.md` — L3: APT-01 (paused)
- `development/provizor/memory/provizor-unit-economics.md` — L3: APT-13 (active)
- `development/provizor/docs/original-inputs.md` — 5 голосовых транскрипций + правки
- `docs/research/provizor-seed-ue-frameworks.md` — SEED 1: frameworks, 25+ metrics
- `docs/research/provizor-seed-analytics-tools.md` — SEED 2: tools, UI patterns
- `docs/research/provizor-seed-business-logic.md` — SEED 3: business logic, mental model
- `docs/research/provizor-deep-ue-model.md` — DEEP-0: 40 формул, 12 таблиц PG, UI hierarchy (1,646 строк)
- `docs/research/provizor-deep-kz-regulation.md` — DEEP-1: госреестр, июльское правило, сценарии
- `docs/research/provizor-deep-competitive-audit.md` — DEEP-3: gap analysis vs 6 конкурентов
- `~/.claude/commands/startaxis.md` — +provizor в project map
- `~/.claude/commands/continueaxis.md` — +provizor
- `~/.claude/commands/startsatoshi.md` — +provizor
- `~/.claude/commands/continuesatoshi.md` — +provizor
- `~/.claude/rules/provizor-context.md` — conditional auto-load
- `~/.claude/rules/reglaments-index.md` — +provizor в 3 таблицы
- `~/.claude/reglaments/research.md` — +Date Anchoring standard
- `nospace/docs/system-guide.md` — +provizor в 4 таблицы
- `~/.claude/projects/.../memory/project_provizor.md` — auto-memory pointer
- `~/.claude/projects/.../memory/MEMORY.md` — +Provizor protocol section

**Completed:**
- Проект Provizor создан с полной инфраструктурой
- 5 голосовых транскрибированы и структурированы
- 15 эпиков по 4 доменам + кросс-доменные
- ICE приоритизация эпиков
- 3 SEED ресёрча (frameworks, tools, business logic)
- 3 DEEP ресёрча (formula model, KZ regulation, competitive audit)
- Стек зафиксирован

**In progress:**
- APT-13 Unit Economics — ресёрч завершён, Phase 0 (демо-калькулятор) готов к реализации

**Opened:**
- Phase 0: демо-калькулятор для встречи с Алимханом (5 апреля)
- Визуальный roadmap для Алимхана
- Telegram бот MVP (если успеем)
- Action items для встречи: получить 1С данные, комиссии агрегаторов, создать bot token

**Notes:**
- Контекст: 29% (287K/1M) — есть запас
- Все ресёрчи достаточны для Phase 0. Phase 1 потребует DEEP-2 (1С OData schema) после контакта с Первый БИТ КЗ
- Госреестр: api.dari.kz (JSON API) — можно интегрировать
- OTC деругулируются с июля 2025 — позитив для маржи Алимхана
- Разброс 4.2 млн₸/мес между сценариями регулируемой доли → mix management = рычаг
<!-- /ENTRY -->

<!-- ENTRY:2026-04-04:CLOSE:2:provizor:provizor-unit-economics AXIS -->
## 2026-04-04 — сессия 2 CLOSE [Axis]

**Decisions:**
- D-08: Стек финализирован → React 19 + TailAdmin + Recharts (вместо SolidJS — ecosystem advantage для dashboard)
- D-09: Hero metric = CIS Profitability % (F-18)
- D-10: ICE приоритизация: APT-13 → APT-01 → APT-02
- D-11: 1С интеграция через OData/HTTP Services, batch hourly sync
- D-12: Госреестр = ndda.kz + api.dari.kz (JSON API)
- D-13: OTC деругулируются с июля 2025 (5,936 → 5,408 SKU)
- Мультиканальная маржа = confirmed white space (DEEP-3)
- Phase 0 для встречи = статический SPA-калькулятор (без бэкенда)

**Files changed (post-checkpoint):**
- `memory/STATE.md` — обновлён: phase, status, decisions D-08..D-13, blockers
- `memory/provizor-unit-economics.md` — обновлён: phases restructured, research marked complete, Phase 1 tasks
- `memory/provizor-about.md` — Tech Stack updated: React 19 + TailAdmin
- `~/.claude/commands/checkpointaxis.md` — +provizor scratch path
- `~/.claude/commands/checkpointaxis-fast.md` — +provizor scratch path
- `~/.claude/commands/closeaxis.md` — +provizor в 6 таблиц

**Completed:**
- DEEP-1 (KZ Regulation) — госреестр найден, сценарное моделирование
- DEEP-3 (Competitive Audit) — 6 конкурентов, gap analysis, white space confirmed
- Opus review DEEP-0 — 3 замечания (minor), approved for implementation
- STATE.md + L3 обновлены до актуального состояния
- Все skills обновлены с provizor paths (7 files)
- Полная верификация: 18-point checklist passed

**Opened:**
- Phase 1: Build Demo — React 19 + TailAdmin + Recharts SPA
- 4 секции: Hero CIS Profitability, P&L Calculator, KZ Markup Checker, Channel Margin
- Deploy на Hetzner

**Notes:**
- Следующая сессия = чистый код, без ресёрчей
- DEEP-0 (1,646 строк) = implementation-ready spec для Phase 1
- Контекст сессии при закрытии: ~35%
<!-- /ENTRY -->
