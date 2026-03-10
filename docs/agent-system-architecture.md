# nospace — Agent System Architecture v3
> Status: АКТУАЛЬНО — обновлено 2026-03-10 (сессия 11)
> Автор: nopoint + Assistant (Claude Sonnet 4.6)
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

**Текущая реализация G3:** Orchestrator выступает Coach напрямую. Players — встроенные Agent tool агенты (backend-developer, code-reviewer) или CLI агенты (Qwen, OpenCode). `build_g3_subgraph()` в LangGraph реализует циклический граф (player→coach→conditional edge: pass/iter≥3→END).

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

## 10. Роадмап

### L2 Kernel (текущий спринт)

| Шаг | Задача | Статус |
|---|---|---|
| 1 | Letta self-hosted + session memory | ✅ DONE |
| 2 | tlos-langgraph-bridge + G3 subgraph | ✅ DONE |
| 3 | Domain Memory — pg+pgvector+liteLLM | ✅ DONE |
| 4 | Qdrant + Associative Routing | ✅ DONE |
| 5 | tLOS Agent Frames (agent-status, g3-session, memory-viewer) | ⬜ TODO |

### L3 Agent Hierarchy (следующий спринт, после L2 complete)

| Шаг | Задача | Зависимости |
|---|---|---|
| 6 | Chief/Development нода в LangGraph | L2 Step 5 |
| 7 | Lead/Frontend + Lead/Backend ноды | Шаг 6 |
| 8 | Senior нода + Special memory distillation | Шаг 7 |
| 9 | Shared Letta memory blocks между нодами домена | Шаг 7 |

### L4 CMA Full (будущее)

| Шаг | Задача | Зависимости |
|---|---|---|
| 10 | Selective Retention (retrieval → pg update) | L3 complete |
| 11 | Temporal Continuity (эпизодные рёбра в pg) | Шаг 10 |
| 12 | Consolidation Service (G3-end + nearLimit triggers) | Шаг 11 |
| 13 | Project + Global memory тиры (pg multi-domain) | Шаг 12 |

---

## 11. Докеризация системы

### Текущее состояние

| Сервис | Где запускается | Статус |
|---|---|---|
| db (PostgreSQL + pgvector) | Docker | ✅ D1→D4 |
| litellm (NIM proxy) | Docker | ✅ D1→D4 |
| qdrant | Docker | ✅ D1→D4 |
| letta-server | Docker letta/letta:latest | ✅ D3→D4 |
| tlos-langgraph-bridge | Docker python:3.12-slim + Node22 | ✅ D2 |
| tlos-claude-bridge | Docker node:22-alpine | ✅ D1 |
| tLOS Shell (Tauri) | native .exe | 🔒 остаётся native (десктоп) |

### Цель: Always-On Kernel

Всё кроме Shell переходит в Docker с `restart: unless-stopped`.
Docker Desktop запускается с Windows (автозапуск).
Результат: kernel всегда работает в фоне. Никакого `grid.ps1 run` для старта сервисов.

```
Windows boot
  └── Docker Desktop (autostart)
        └── docker compose up (auto, restart: unless-stopped)
              ├── db:5433
              ├── litellm:4000
              ├── qdrant:6333
              ├── letta:8283          ← перевести в Docker
              ├── langgraph-svc       ← перевести в Docker
              └── claude-bridge:3000  ← перевести в Docker (Node.js)
```

### Shell Shortcut (следствие Always-On)

Если kernel всегда up → Shell запускается мгновенно, без ожидания сервисов.

**Варианты shortcut:**
- **Windows .lnk** → указывает на `tLOS_0.1.0_x64-setup.exe` (или `tlos.exe` после установки)
- **PowerShell one-liner** → `Start-Process "$env:LOCALAPPDATA\tLOS\tlos.exe"` — можно повесить на Win+T или как плитку
- **Windows Terminal profile** → кнопка в taskbar запускает shell (если нужен терминал-режим)

Самый простой путь: **обычный ярлык .lnk** на рабочем столе / в taskbar → Tauri .exe.
grid.ps1 остаётся для dev-режима (rebuild, logs, stop).

### Роадмап докеризации

| Шаг | Задача | Статус |
|---|---|---|
| D1 | Dockerfile для tlos-claude-bridge (Node 22 alpine) | ✅ DONE |
| D2 | Dockerfile для tlos-langgraph-bridge (Python 3.12 slim + uv) | ✅ DONE |
| D3 | Letta Docker image (`letta/letta:latest`, port 8283) | ✅ DONE (folded into D4) |
| D4 | Единый `docker-compose.yml` + NATS fix + inter-container networking | ✅ DONE — 6 сервисов online |
| D5 | `core/kernel/.env` (NIM_KEY) + Docker Desktop autostart | ✅ DONE — .env создан; autostart → ручной шаг |
| D6 | Shell shortcut (.lnk) | ✅ DONE — `Desktop/tLOS.lnk` создан (сессия 11) |

> **Примечание D1:** claude-bridge читает `~/.tlos/nim-key`, `~/.claude.json`, `~/.tlos/sessions.json` — нужен volume mount для `%USERPROFILE%/.tlos` и `%USERPROFILE%/.claude.json`.
> **Примечание D2:** langgraph-bridge использует subprocess для `claude --print` — внутри контейнера нужен claude CLI + credentials. Нетривиально, низкий приоритет.

---

## 12. Open Questions

- [ ] Модель для Workers/Players — Sonnet или Haiku (cost)?
- [ ] Как разграничить Domain memory между Chiefs (Frontend не читает Marketing)?
- [ ] Shared Letta blocks: один агент пишет → все агенты домена видят — нужна блокировка?
- [ ] CMA Selective Retention — как реализовать мутацию retrieval score в pg?
- [ ] Summarize Service: отдельный NATS-сервис или часть tlos-claude-bridge?
