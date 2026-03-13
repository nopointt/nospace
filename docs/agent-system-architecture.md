# nospace — Agent System Architecture v4
> Status: АКТУАЛЬНО — обновлено 2026-03-12 (roadmap v4 rebuild)
> Автор: nopoint + Assistant
> Tags: [architecture, agents, memory, langgraph, letta, cma, tlos]

---

## 1. Принцип

**Вся агент-система работает внутри tLOS как его ядро (L2 Kernel).**
nopoint общается только с Orchestrator через tLOS Omnibar. Вся декомпозиция — внутренняя.
Никаких внешних облачных зависимостей — self-hosted, local-first, sovereign.

---

## 2. Иерархия агентов

```
nopoint
  └── Orchestrator (Eidolon)             ← Claude Sonnet, LangGraph supervisor node
        ├── Chief/Development            ← mini-orchestrator, домен разработки
        │     ├── Lead/Frontend
        │     ├── Lead/Backend
        │     ├── Lead/Testing
        │     ├── Lead/Security
        │     └── Lead/Infra
        │           └── Senior  →  G3 Session (Coach ↔ Player/Worker)
        ├── Chief/Marketing
        ├── Chief/Research
        └── Chief/[другие домены по мере роста]
```

### Роли

| Уровень | Агент | Задача | Статус |
|---|---|---|---|
| L0 | nopoint | Намерения. Общается только с Orchestrator через tLOS Omnibar | — |
| L1 | **Orchestrator (Eidolon)** | Claude Sonnet. Принимает намерение, маршрутизирует по доменам | ✅ LIVE (tlos-claude-bridge) |
| L2 | **Chief Agent** | Mini-orchestrator домена. Декомпозирует задачи на Leads | ⬜ NOT IMPLEMENTED |
| L3 | **Lead** | Sub-domain. Планирует G3-сессии, компилирует Special memory | ⬜ NOT IMPLEMENTED |
| L4 | **Senior** | Пишет спеки на основе Special memory, запускает G3 | ⬜ NOT IMPLEMENTED |
| L5 | **G3: Coach + Player** | Dialectical Autocoding. Coach верифицирует, Player реализует | ✅ LIVE (manual, CLI agents) |

> **Важно:** Сейчас работает только L1 (Eidolon) + L5 (G3 вручную через Orchestrator как Coach).
> Уровни L2–L4 — архитектурный план, реализация не начата.

---

## 3. G3 — Dialectical Autocoding

Запускается Senior-ом (сейчас — Orchestrator вручную). Cyclic subgraph в LangGraph.

```
Senior → [spec] → Coach
                     ↓
                  Player (Worker)
                     ↓
                  Coach (review)
                     ↓
                  [pass / iterate]
```

- **Coach**: Claude (независимая верификация, не пишет код, не доверяет самоотчётам Player)
- **Player/Worker**: реализует, не может объявить задачу выполненной самостоятельно
- Цикл продолжается до прохождения верификации Coach

**Текущая реализация G3:** Coach = `general-purpose` subagent (Agent tool). Player = специализированный subagent (`refactoring-specialist`, `ui-designer`, `backend-developer`, etc.). CLI агенты (Qwen, OpenCode) не используются. `build_g3_subgraph()` в LangGraph реализует циклический граф (player→coach→conditional edge: pass/iter≥3→END).

---

## 4. Память — Continuum Memory Architecture (CMA)

### Источник

[arxiv.org/abs/2601.09913](https://arxiv.org/abs/2601.09913) — Joe Logan, Mode7 GK (январь 2026).

CMA — не статичный набор тиров. Это **процессная модель** памяти как непрерывно эволюционирующего субстрата.

### 5 обязательных свойств CMA

| Свойство | Что означает | Статус |
|---|---|---|
| **Persistent Storage** | Память сохраняется между сессиями | ✅ Letta (session) + pg (domain) |
| **Selective Retention** | Retrieval мутирует память. То, что достали — становится доступнее | ⬜ не реализовано |
| **Associative Routing** | Память хранит структуру: люди→проекты, события→следствия. Активация по связям | ✅ Qdrant `tlos-global` + per-message searchAssociative |
| **Temporal Continuity** | Эпизоды определяются порядком. Явные временные рёбра и границы эпизодов | ⬜ не реализовано |
| **Consolidation + Abstraction** | Детальные эпизоды выцветают → складываются в схемы высшего порядка | ⬜ частично (context compaction в bridge) |

### Lifecycle CMA

```
Ingest → Activation → Retrieval (с мутацией) → Consolidation
```

**Consolidation triggers:** конец G3-сессии + лимит контекстного окна.

**Текущая реализация:** Ingest (addFact → pg + Qdrant) и Retrieval (searchFacts + searchAssociative) работают. Selective Retention и полноценная Consolidation не реализованы.

### 5 уровней памяти

| Уровень | Кто имеет | Реализация | Статус |
|---|---|---|---|
| **Session** | Workers + Coaches | Letta: core / archival / recall memory blocks | ✅ LIVE (letta-client.js) |
| **Domain** | Chief + Leads | pg+pgvector: `tlos_facts` table + HNSW cosine | ✅ LIVE (domain-memory.js) |
| **Project** | Только Orchestrator | pg+pgvector (planned, same infra) | ⬜ not implemented |
| **Global** | Только Orchestrator | pg+pgvector (planned, same infra) | ⬜ not implemented |
| **Special** | Senior | Lead дистиллирует из Domain → Senior пишет спеки | ⬜ not implemented |

### Associative Routing (реализован)

- **Qdrant** `tlos-global` коллекция — cosine HNSW, 1536-dim (NIM Matryoshka)
- Per-message: `searchAssociative(content, 5)` → `<associative_context>` block инжектируется в prompt
- Double-write: `agent:zep:add_fact` → pg (Domain) + Qdrant (Global) одновременно
- djb2 hash для детерминированных point IDs (идемпотентный upsert)

---

## 5. tLOS Layer Map (актуальное состояние)

```
L3 Shell  — SolidJS + Tauri (Omnibar, canvas frames)
              ↕ NATS
L2 Kernel — kernel сервисы:
  ├── tlos-claude-bridge      (✅ LIVE, Docker)  ← Eidolon/Orchestrator + domain memory + assoc routing
  │     ├── letta-client.js             ← Letta REST (session memory, port 8283)
  │     ├── domain-memory.js            ← direct pg+liteLLM (domain memory, port 5432/4000 internal)
  │     └── qdrant-client.js            ← Qdrant REST (associative routing, port 6333)
  ├── tlos-langgraph-bridge   (✅ LIVE, Docker)  ← NATS ↔ LangGraph Python service
  ├── tlos-shell-bridge       (✅ LIVE)
  ├── tlos-dispatcher         (✅ LIVE)
  ├── tlos-fs-bridge          (✅ LIVE)
  └── tlos-shell-exec         (✅ LIVE)
L1 Grid   — NATS (единый transport, Zero-Web2)
L0 Meta   — ADR-002, конституции
```

### Docker stack (актуальный)

```
core/kernel/docker-compose.yml — 6 контейнеров, ~900MB RAM:
  db             port 5433  ← PostgreSQL + pgvector 0.5.1 (~21MB RAM)
  litellm        port 4000  ← liteLLM proxy → NIM embeddings + chat (~791MB RAM)
  qdrant         port 6333  ← Qdrant v1.13.0 (~49MB RAM)
  letta          port 8283  ← letta/letta:latest (session memory)
  langgraph-bridge  —       ← python:3.12-slim + Node22 + uv + claude CLI
  claude-bridge     —       ← node:22-alpine + claude CLI (Eidolon/Orchestrator)
```

Запуск: `docker compose up` из `core/kernel/`. NIM_KEY читается из `core/kernel/.env` (gitignored).
grid.ps1: `docker-kernel` сервис запускает весь стек одной командой.

> **Примечание:** В архитектуре v2 планировались отдельные NATS-сервисы `tlos-zep-bridge` и `tlos-qdrant-bridge`. Принято решение встроить клиенты напрямую в `tlos-claude-bridge` — проще, меньше NATS overhead.

---

## 6. Технический стек (актуальный)

| Компонент | Роль | Статус |
|---|---|---|
| **tLOS** | Sovereign spatial OS. Desktop shell (Tauri + SolidJS). Единая точка взаимодействия | ✅ LIVE |
| **LangGraph** | Граф управления. G3 = cyclic subgraph. Orchestrator → worker (реализован). Chief/Lead/Senior ноды — не реализованы | ✅ частично |
| **Letta** | Session memory для Workers + Coaches. Memory blocks. Shared blocks — не реализованы | ✅ частично |
| **pg + pgvector** | Domain memory substrate. `tlos_facts` (1536-dim HNSW cosine) | ✅ LIVE |
| **liteLLM** | Embedding proxy → NIM llama-3.2-nv-embedqa-1b-v2 (Matryoshka, 1536-dim) | ✅ LIVE |
| **Qdrant** | Associative Routing. `tlos-global` collection, cosine HNSW | ✅ LIVE |
| **Claude Sonnet** | Orchestrator (Eidolon) + G3 Coach | ✅ LIVE |

---

## 7. Текущий LangGraph граф

Реализован в `tlos-langgraph-bridge/graph.py`:

```
build_graph():       agent:graph:run → orchestrator_node → worker_node → END
build_g3_subgraph(): g3_player_node → g3_coach_node → conditional edge
                     passed OR iter≥3 → END; else → g3_player_node
```

**Не реализованы:** Chief-ноды, Lead-ноды, Senior-нода, routing между доменами, Shared Letta blocks между нодами одного домена.

---

## 8. Special Memory — компиляция (план)

Lead запускает явный шаг `distill_to_special_memory`:

```
Lead получает задачу от Chief
  └── CMA retrieval по Domain memory (pg + Qdrant)
        └── Lead фильтрует по релевантности к задаче
              └── Пишет результат в Special memory Senior
                    └── Senior читает Special memory → пишет спеку → запускает G3
```

**Статус:** не реализован. Сейчас Orchestrator выполняет роль Lead+Senior вручную.

---

## 9. Вспомогательные службы (план)

| Служба | Задача | Статус |
|---|---|---|
| **Summarize Service** | liteLLM chat/completions + pg `summaries` table. Триггер на nearLimit. | ⬜ not implemented |
| **Regulatory Agents** | Следят за соответствием naming, file-size, rbac | ⬜ not implemented |
| **Token Counter Service** | Учёт расхода по агентам, бюджетирование | ✅ LIVE (tools/token-counter, вне tLOS) |

---

## 10. Роадмап v5

> Updated: 2026-03-13. Roadmap v4 COMPLETE (Phases 0-5). v5 = Product Debt closure + automation + expansion.
> Source: QS Track 6 Product Debt audit (44 features, 9 partial, 8 not started).

### v4 Summary (ALL COMPLETE)

```
Phase 0  L3 DEPLOY            ✅  Docker rebuild, verify graphs
Phase 1  QUALITY SPRINT       ✅  8/9 tracks (Track 6 → v5 Phase 6)
Phase 2  AGENT EVOLUTION      ✅  Дирижёр, Chiefs, domain expansion
Phase 3  CONTINUUM MEMORY     ✅  5 layers × 5 containers, edges, episodes
Phase 4  SERVICES             ✅  Samurizator + Regulator
Phase 5  SHELL EVOLUTION      ✅  Intent pipeline, command registry, frame layouts
```

### v5 Overview

```
Phase 6  E2E VALIDATION       ← Full pipeline test from Shell           [IMMEDIATE]
Phase 7  AUTOMATION           ← Samurizator cron, episodes, escalation  [after Phase 6]
Phase 8  AGENT COMMS          ← Chief parallel dispatch, NATS rename    [after Phase 6]  ← PARALLEL with Phase 7
Phase 9  SHELL EXPANSION      ← New commands, new frames, UI for admin  [after Phase 6]  ← PARALLEL with Phase 7+8
```

**Parallelism map:**
```
Phase 6 (E2E) → ┬─ Phase 7 (Automation)   ─┐
                 ├─ Phase 8 (Agent Comms)   ─┤─→ DONE
                 └─ Phase 9 (Shell Expand)  ─┘
                    ↑ all three run in parallel
```

---

### Phase 6: E2E Validation

Верификация полной цепочки Дирижёр→Chief→Lead→Special→G3 из Shell. **P0 — блокирует всё остальное.**

> **Step 6.1 PASS** (2026-03-13, 312.7s). Внутри Phase 6 работаем по детальному production-ready плану:
> → **`docs/agent-system-prod-ready-plan.md`** — 6 внутренних фаз (Observability → Speed → Quality → Cost → Resilience → Scale), gap analysis, model routing, 8 новых файлов.
> Этот план включает задачи из Phase 7 (Automation: escalation, parallel dispatch) и Phase 8 (Agent Comms: horizontal, parallel Chiefs) — они реализуются в рамках prod-ready phases 1-2.

| Step | Task | Depends | Details |
|---|---|---|---|
| 6.1 | **Дирижёр E2E** | — | Omnibar → `agent:dirizhyor:run` → формализация intent → routing plan → Chief invocation. Verify token stream back to Shell |
| 6.2 | **Chief→Lead dispatch** | 6.1 | Chief получает задачу → выбирает Lead → Lead запускается, читает Project Memory, возвращает результат |
| 6.3 | **Special→G3 cycle** | 6.2 | Special пишет спеку → G3 Worker реализует → Coach верифицирует → результат стримится в Shell |
| 6.4 | **Full chain smoke test** | 6.3 | Один полный запрос через всю иерархию от Omnibar до G3 result |

**Ключевые файлы:** `bridge.py`, `bridge_handler.py`, `graph.py`, `Omnibar.tsx`

---

### Phase 7: Automation

Саморизаторы + эскалация + эпизоды работают автоматически, без ручных триггеров. **Параллельно с Phase 8 и 9.**

| Step | Task | Depends | Details |
|---|---|---|---|
| 7.1 | **Samurizator scheduler** | Phase 6 | asyncio periodic task в bridge.py: `consolidate_on_schedule` каждые 6h. Плюс авто-триггер `consolidate_on_episode_end` при `agent:graph:token {done: true}` от G3/Special графа |
| 7.2 | **Automatic episode boundaries** | 7.1 | G3 start → `start_episode()`, G3 done → `end_episode()`. Дирижёр task start/end = episode boundary |
| 7.3 | **Escalation propagation** | Phase 6 | G3 при max iterations (не pass) → публикует `agent:g3:escalation` с spec + last implementation + coach feedback. Special/Lead ноды обрабатывают эскалацию |
| 7.4 | **NATS subject rename** | Phase 6 | `agent:senior:run` → `agent:special:run`. Bridge.py принимает оба (backward compat 1 phase), затем старый удаляется |

**Ключевые файлы:** `bridge.py`, `bridge_handler.py`, `graph.py`, `samurizator.py`, `memory_edges.py`

---

### Phase 8: Agent Communications

Chief параллельный dispatch + горизонтальная коммуникация. **Параллельно с Phase 7 и 9.**

| Step | Task | Depends | Details |
|---|---|---|---|
| 8.1 | **Chief parallel dispatch** | Phase 6 | `dirizhyor_router_node`: когда routing_plan содержит 2+ chiefs, запускать через `asyncio.gather` параллельно вместо sequential loop |
| 8.2 | **Chief message exchange round** | 8.1 | После параллельного выполнения Chiefs — опциональный раунд обмена сообщениями через `chief_comm.py`. Каждый Chief видит summary результатов других Chiefs |
| 8.3 | **Cross-domain task coordination** | 8.2 | Дирижёр при мульти-доменной задаче: parallel Chiefs → message exchange → optional second round → aggregate results |

**Ключевые файлы:** `graph.py` (dirizhyor_router_node), `chief_comm.py`, `bridge_handler.py`

---

### Phase 9: Shell Expansion

Новые команды + новые фреймы + admin UI. **Параллельно с Phase 7 и 8.**

| Step | Task | Depends | Details |
|---|---|---|---|
| 9.1 | **Core Omnibar commands** | Phase 6 | `help` (список всех команд), `status` (kernel health + memory stats), `compact` (ручной Samurizator trigger), `dirizhyor` (invoke full hierarchy) |
| 9.2 | **Memory admin frame** | 9.1 | Новый фрейм `memory-admin`: просмотр Global/Domain/Project Memory, поиск по фактам, approve/reject frozen proposals |
| 9.3 | **Regulator violations frame** | 9.1 | Новый фрейм `regulator-log`: список нарушений из pg, фильтр по severity/rule, timeline |
| 9.4 | **Dynamic frame layouts from config** | 9.2 | `frameLayouts` загружаются из JSON файла (hot-reload), не только из TypeScript |

**Ключевые файлы:** `commandRegistry.ts`, `defaultCommands.ts`, `frameLayouts.ts`, новые фреймы в `src/components/frames/`

---

### Completed Phases (v4 archive)

### Phase 0: L3 Deploy ✅ COMPLETE

| Step | Task | Status |
|---|---|---|
| 0.1 | `docker compose build langgraph-bridge` | ✅ DONE (2026-03-12) |
| 0.2 | `docker compose up -d --no-deps langgraph-bridge` | ✅ DONE — connected to NATS |
| 0.3 | Verify: `agent:chief:run` → Chief/Dev dispatches to Lead | ⏸ deferred to QS |
| 0.4 | Verify: `agent:lead:run` → Lead/Frontend + Lead/Backend respond | ⏸ deferred to QS |
| 0.5 | Verify: `agent:senior:run` → Senior calls G3 subgraph | ⏸ deferred to QS |

---

### Phase 1: Quality Sprint

Полный аудит системы после деплоя L3. Чистим перед строительством новых фич.

#### Модель работы — Fully Isolated G3 Pairs

```
Orchestrator (main context)
  │
  └── Cross-Domain Spec Lead  (isolated context, sequential)
        ├── читает всю кодовую базу целиком
        ├── пишет спеки для каждого трека (все в одном контексте)
        └── возвращает пакет спек Orchestrator
              │
              └── Orchestrator запускает Coach агентов параллельно (по спекам)
                    │
                    ├── Coach/Naming         (isolated) — Senior→Special, Player→Worker
                    ├── Coach/Refactor-Kernel (isolated) — Python services cleanup
                    ├── Coach/Refactor-Shell  (isolated) — SolidJS/TS cleanup
                    ├── Coach/BugHunt        (isolated) — full codebase audit
                    ├── Coach/TechDebt       (isolated) — deps, dead code
                    ├── Coach/ProductDebt    (isolated) — features vs vision gaps
                    ├── Coach/UX             (isolated) — interaction debt
                    ├── Coach/UI             (isolated) — visual polish
                    └── Coach/Docker         (isolated) — compose optimization, health checks
```

| Track | Coach | Player subagent | Focus |
|---|---|---|---|
| **Naming** | `general-purpose` | `refactoring-specialist` | Senior→Special, Player→Worker в graph.py + bridge_handler + все ссылки |
| **Refactor (kernel)** | `general-purpose` | `refactoring-specialist` | Python services: graph.py, bridge_handler.py, special_memory.py |
| **Refactor (shell)** | `general-purpose` | `refactoring-specialist` | SolidJS: App.tsx, DynamicComponent, frame components |
| **Bug Hunt** | `general-purpose` | `code-reviewer` | Full kernel + shell audit |
| **Tech Debt** | `general-purpose` | `refactoring-specialist` | Dependencies, dead code, unused imports |
| **Product Debt** | `general-purpose` | `architect-reviewer` | Features vs tlos-system-spec.md vision |
| **UX Debt** | `general-purpose` | `ui-designer` | Omnibar UX, frame interactions |
| **UI Debt** | `general-purpose` | `ui-designer` | Visual consistency, brand compliance |
| **Docker** | `general-purpose` | `backend-developer` | Health checks, resource limits, compose optimization |

**Протокол Spec Lead:**
1. **Codebase audit** — читает все ключевые файлы (kernel + shell)
2. **Issue inventory** — составляет список проблем по каждому треку
3. **Spec pack** — пишет детальные спеки для каждого Coach (файл на трек)
4. **Return** — возвращает пакет спек Orchestrator

**Протокол каждого Coach агента:**
1. **Research** — WebSearch + WebFetch best practices для своей специализации
2. **Synthesis** — адаптирует найденные практики к нашему стеку
3. **Player launch** — запускает специализированный subagent через Agent tool
4. **Review** — ревьюит результат Player, итерирует при необходимости
5. **Report** — возвращает Orchestrator: что сделано, источники, находки

---

### Phase 2: Agent System Evolution ✅ COMPLETE

Агентная иерархия из vision → рабочая реализация. Steps 2.1-2.4 done 2026-03-13.

| Step | Task | Depends | Details |
|---|---|---|---|
| 2.1 | **Дирижёр isolation** | Phase 1 | Orchestrator node НЕ видит код — только Chiefs. Изоляция через restricted tool access в LangGraph state |
| 2.2 | **Chief horizontal comm** | 2.1 | Inter-chief NATS subjects (`chief:dev↔chief:marketing`). LangGraph conditional edges между chief nodes |
| 2.3 | **Domain expansion** | 2.2 | Marketing, Research, Production, Design chiefs + их Leads в LangGraph. Dynamic graph builder по конфигу |
| 2.4 | **Dynamic subdomain registration** | 2.3 | Leads создаются on demand из конфига. SEO, Copywriting, Traffic и др. не хардкожены в graph.py |

**Ключевые файлы:** `graph.py`, `bridge_handler.py`, `docker-compose.yml`

---

### Phase 3: Continuum Memory Architecture ✅ COMPLETE

5 слоёв × 5 контейнеров. Steps 3.1-3.5 done 2026-03-13.

| Step | Task | Depends | Details |
|---|---|---|---|
| 3.1 | **Global Memory tier** | Phase 1 | pg-based, Дирижёр-only read. Wide + shallow. `global_memory` table в pg |
| 3.2 | **Project Memory tier** | 3.1 | Domain-based files + Continuum layers inside. `project_memory` table, per-domain partitioning |
| 3.3 | **Continuum 5-layer system** | 3.2 | Frozen/Slow/Medium/Fast/Operational per container. `memory_layer` enum + TTL/rewrite policies в pg |
| 3.4 | **Selective Retention** | 3.3 | Retrieval mutates access scores. `last_accessed`, `access_count`, `retrieval_boost` columns в pg |
| 3.5 | **Temporal Continuity** | 3.4 | Episodic edges + time boundaries. `memory_edges` table, episode boundary detection |

**Ключевые файлы:** `domain-memory.js`, `special_memory.py`, `letta_shared.py`, новые сервисы

---

### Phase 4: Services (Meta-Agents) ✅ COMPLETE

Samurizators + Regulators. Steps 4.1-4.4 done 2026-03-13.

| Step | Task | Depends | Details |
|---|---|---|---|
| 4.1 | **Samurizators service** | Phase 3 | Passive memory compaction L5→L1. NATS subscriber: слушает G3 completion events, запускает деградацию |
| 4.2 | **Consolidation triggers** | 4.1 | G3-end trigger + nearLimit trigger. Consolidation = Samurizator run on specific memory container |
| 4.3 | **Regulators service** | Phase 2 | Real-time workflow compliance monitoring. PreToolUse/PostToolUse hooks + NATS event audit stream |
| 4.4 | **Regulator rules engine** | 4.3 | Configurable rules: naming, RBAC scope, workflow sequence. Rules as YAML/JSON, hot-reloadable |

**Ключевые файлы:** новые Docker сервисы, `docker-compose.yml`, NATS subject extensions

---

### Phase 5: Shell Evolution ✅ COMPLETE

Intent pipeline + command registry + frame layouts. Steps 5.1-5.3 done 2026-03-13.

| Step | Task | Depends | Details |
|---|---|---|---|
| 5.1 | **Intent entity formalization** | Phase 2 | `tLOS_Intent` entity: structured pipeline вместо informal Clarify. Intent → validate → route → track |
| 5.2 | **Omnibar trigger taxonomy** | 5.1 | Beyond 3 hardcoded commands. Dynamic trigger registration. `tLOS_IntentTrigger` config |
| 5.3 | **Rich frame spawning** | 5.2 | Intent triggers → spawn frame sets. Configurable mappings: trigger → frames + layout |

**Ключевые файлы:** `App.tsx`, `Omnibar.tsx`, новые типы в `frame.ts`

---

### Completed Phases (archive)

#### L2 Kernel ✅ COMPLETE

| Step | Task | Status |
|---|---|---|
| 1 | Letta self-hosted + session memory | ✅ DONE |
| 2 | tlos-langgraph-bridge + G3 subgraph | ✅ DONE |
| 3 | Domain Memory — pg+pgvector+liteLLM | ✅ DONE |
| 4 | Qdrant + Associative Routing | ✅ DONE |
| 5 | tLOS Agent Frames (agent-status, g3-session, memory-viewer) | ✅ DONE |

#### L3 Agent Hierarchy ✅ CODE COMPLETE (deploy pending)

| Step | Task | Status |
|---|---|---|
| 6 | Chief/Development нода в LangGraph | ✅ CODED |
| 7 | Lead/Frontend + Lead/Backend ноды | ✅ CODED |
| 8 | Senior нода + Special memory distillation | ✅ CODED |
| 9 | Shared Letta memory blocks между нодами домена | ✅ CODED |

#### Dockerization ✅ COMPLETE

| Step | Task | Status |
|---|---|---|
| D1 | Dockerfile для tlos-claude-bridge (Node 22 alpine) | ✅ DONE |
| D2 | Dockerfile для tlos-langgraph-bridge (Python 3.12 slim + uv) | ✅ DONE |
| D3 | Letta Docker image | ✅ DONE |
| D4 | Единый docker-compose.yml + NATS + networking | ✅ DONE — 11 сервисов |
| D5 | .env (NIM_KEY) + Docker Desktop autostart | ✅ DONE |
| D6 | Shell shortcut (.lnk) | ✅ DONE |

---

## 11. Docker Stack (reference)

**Compose:** `core/kernel/docker-compose.yml` — 11 сервисов always-on (kernel-* prefix)

| Сервис | Образ | Port | Status |
|---|---|---|---|
| nats | nats:latest | 4222 | ✅ LIVE |
| db | ghcr.io/getzep/postgres:latest | 5433 | ✅ LIVE |
| litellm | ghcr.io/berriai/litellm:main-latest | 4000 | ✅ LIVE |
| qdrant | qdrant/qdrant:v1.13.0 | 6333 | ✅ LIVE |
| letta-server | letta/letta:latest | 8283 | ✅ LIVE |
| langgraph-bridge | kernel-langgraph-bridge | — | ✅ LIVE |
| claude-bridge | kernel-claude-bridge | — | ✅ LIVE |
| shell-bridge | kernel-shell-bridge | 3001 | ✅ LIVE |
| dispatcher | kernel-dispatcher | — | ✅ LIVE |
| fs-bridge | kernel-fs-bridge | — | ✅ LIVE |
| shell-exec | kernel-shell-exec | — | ✅ LIVE |
| agent-bridge | kernel-agent-bridge | — | ⏸ profile:nim |

**Always-On:** `restart: unless-stopped`. Docker Desktop autostart с Windows.

---

## 12. Open Questions

- [ ] Модель для Workers/Players — Sonnet или Haiku (cost)?
- [ ] Как разграничить Domain memory между Chiefs (Frontend не читает Marketing)?
- [ ] Shared Letta blocks: один агент пишет → все агенты домена видят — нужна блокировка?
- [ ] CMA Selective Retention — как реализовать мутацию retrieval score в pg?
- [ ] Samurizators: отдельный Docker сервис или NATS subscriber в langgraph-bridge?
- [ ] Regulators: hook-based (Claude Code hooks) или отдельный NATS audit service?
- [ ] Dynamic graph builder: YAML config для доменов или pg-based registry?
