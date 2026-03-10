# nospace — Agent System Architecture v2
> Status: DRAFT — обсуждение 2026-03-10
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

| Уровень | Агент | Задача |
|---|---|---|
| L0 | nopoint | Намерения. Общается только с Orchestrator через tLOS Omnibar |
| L1 | **Orchestrator (Eidolon)** | Claude Sonnet. Принимает намерение, маршрутизирует по доменам |
| L2 | **Chief Agent** | Mini-orchestrator домена. Получает задачу от Orchestrator, декомпозирует на Leads |
| L3 | **Lead** | Sub-domain. Декомпозирует задачу, планирует G3-сессии, компилирует Special memory для Senior |
| L4 | **Senior** | Пишет спеки на основе Special memory, запускает G3-сессии |
| L5 | **G3: Coach + Player** | Dialectical Autocoding. Coach верифицирует, Player (Worker) реализует |

---

## 3. G3 — Dialectical Autocoding

Запускается Senior-ом. Cyclic subgraph в LangGraph.

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

---

## 4. Память — Continuum Memory Architecture (CMA)

### Источник

[arxiv.org/abs/2601.09913](https://arxiv.org/abs/2601.09913) — Joe Logan, Mode7 GK (январь 2026).

CMA — не статичный набор тиров. Это **процессная модель** памяти как непрерывно эволюционирующего субстрата.

### 5 обязательных свойств CMA

| Свойство | Что означает |
|---|---|
| **Persistent Storage** | Память сохраняется между сессиями. Агент накапливает идентичность, не пересобирает с нуля |
| **Selective Retention** | Retrieval мутирует память. То, что достали, становится доступнее; конкуренты ослабевают |
| **Associative Routing** | Память хранит структуру: люди → проекты, события → следствия. Активация распространяется по связям |
| **Temporal Continuity** | Эпизоды определяются порядком. Явные временные рёбра и границы эпизодов |
| **Consolidation + Abstraction** | Детальные эпизоды выцветают → складываются в схемы высшего порядка |

### Lifecycle CMA

```
Ingest → Activation → Retrieval (с мутацией) → Consolidation
```

**Consolidation triggers:** конец G3-сессии + лимит контекстного окна.

### 5 уровней памяти

| Уровень | Кто имеет | Организация |
|---|---|---|
| **Global** | Только Orchestrator | CMA lifecycle на уровне всего workspace |
| **Project** | Только Orchestrator | Разделена по доменам; каждый домен-раздел → своя CMA структура |
| **Domain** | Chief + Leads | CMA на уровне домена |
| **Special** | Senior | Lead дистиллирует из Domain memory → Senior пишет спеки |
| **Session** | Workers + Coaches | Letta: core / archival / recall memory blocks |

### Уровни абстракции памяти

Чем выше уровень — тем выше абстракция (CMA Consolidation):

```
Session   → raw эпизоды G3-сессий (детально, конкретно)
Domain    → консолидированные паттерны домена
Project   → проектные решения и архитектура
Global    → высокоуровневые схемы workspace
```

Информация движется **вверх через consolidation**, но никогда вниз напрямую.

---

## 5. tLOS Layer Map

Агент-система встраивается в существующую tLOS архитектуру:

```
L3 Shell  — SolidJS + Tauri (Omnibar, canvas frames, визуализация агентов)
              ↕ WebSocket → shell-bridge
L2 Kernel — Rust сервисы + kernel сервисы агент-системы:
  ├── tlos-claude-bridge      (есть)  ← Eidolon / Orchestrator Phase 1
  ├── tlos-langgraph-bridge   (новый) ← NATS ↔ LangGraph Python service
  ├── tlos-letta-bridge       (новый) ← NATS ↔ Letta REST API
  ├── tlos-zep-bridge         (новый) ← NATS ↔ Zep REST API
  ├── tlos-qdrant-bridge      (новый) ← NATS ↔ Qdrant REST API
  ├── tlos-shell-bridge       (есть)
  ├── tlos-dispatcher         (есть)
  ├── tlos-fs-bridge          (есть)
  └── tlos-shell-exec         (есть)
L1 Grid   — NATS (единый transport, Zero-Web2)
L0 Meta   — ADR-002, конституции
```

**Self-hosted сервисы** (Docker, запускаются через grid.ps1):

```
letta-server    localhost:8283  ← Letta REST API + memory persistence
zep-server      localhost:8000  ← Zep REST API + temporal knowledge graph
qdrant-server   localhost:6333  ← Qdrant REST API + vector store
langgraph-svc   NATS agent      ← Python service, LangGraph engine
```

Все коммуникации через NATS. Никакого прямого HTTP между внутренними компонентами.

---

## 6. Технический стек

| Компонент | Роль |
|---|---|
| **tLOS** | Sovereign spatial OS. Desktop shell (Tauri + SolidJS). Единая точка взаимодействия nopoint с системой. Визуализирует агентов, сессии, memory, аналитику токенов на бесконечном canvas |
| **LangGraph** | Граф всей системы. Каждый агент = нода. G3 = cyclic subgraph. Orchestrator = supervisor node |
| **Letta** | Session memory для Workers + Coaches. Memory blocks (core, archival, recall), редактируются самими агентами. Shared blocks внутри домена |
| **Zep** | Substrate для Domain / Project / Global memory. Temporal knowledge graph + vector search = полная CMA |
| **Qdrant** | Vector store для ассоциативного retrieval (Associative Routing в CMA) |
| **Claude Sonnet** | Orchestrator (Eidolon) + Chiefs + Leads + Seniors + Coaches |

### tLOS как UI слой

tLOS — не просто shell. Это **spatial interface для всей multi-agent системы**:
- **Omnibar** → точка входа nopoint → Eidolon (Orchestrator)
- **Canvas frames** → визуализация агентов, статусов, G3-сессий, memory состояния
- **NATS** → транспорт между tLOS shell и LangGraph-сервисом (Zero-Web2)
- **tlos-langgraph-bridge** → NATS-to-LangGraph адаптер (аналог tlos-claude-bridge)

---

## 6. Letta + LangGraph — интеграция

**Схема:** Letta агенты вызываются как LangGraph-ноды.

```
tLOS Omnibar → NATS → tlos-langgraph-bridge → LangGraph
LangGraph = control flow (routing, state transitions, cyclic G3 loops)
Letta     = stateful memory layer для Workers и Coaches
Zep       = CMA substrate для Domain / Project / Global memory
```

Каждый Worker/Coach = LangGraph нода, обёрнутая вокруг Letta-агента с персистентными memory blocks.

---

## 7. Special Memory — компиляция

Lead запускает явный шаг `distill_to_special_memory`:

```
Lead получает задачу от Chief
  └── CMA retrieval по Domain memory (Zep + Qdrant)
        └── Lead фильтрует по релевантности к задаче
              └── Пишет результат в Special memory Senior
                    └── Senior читает Special memory → пишет спеку → запускает G3
```

Lead решает что релевантно — это агентный шаг, не автоматический pipeline.

---

## 8. Вспомогательные службы

| Служба | Задача |
|---|---|
| **Summarize Service** | Мониторит контекстные окна всех агентов. При приближении к лимиту — триггерит CMA consolidation |
| **Regulatory Agents** | Следят за соответствием директории правилам (naming, file-size, rbac) |
| **Token Counter Service** | Учёт расхода по агентам, планирование, бюджетирование |

---

## 9. Open Questions

- [ ] Модель для Workers/Players — Sonnet или Haiku/дешевле?
- [ ] Zep: Docker self-hosted — privacy 152-ФЗ совместимо?
- [ ] Как разграничить Domain memory между Chiefs (чтобы Frontend Lead не читал Marketing domain)?
- [ ] Какие canvas frame-типы для визуализации агентов и G3-сессий в tLOS?

---

## 10. Следующие шаги

```
Шаг 1: Letta self-hosted                           (1 сессия)
  docker run letta/letta:latest -p 8283:8283
  Обновить tlos-claude-bridge: sessionLogs → Letta memory blocks
  Решает tech debt: compaction summary переживает bridge restart
  grid.ps1: добавить letta-server в $Services

Шаг 2: tlos-langgraph-bridge + LangGraph            (2-3 сессии)
  Python service: LangGraph + nats-py subscriber
  Минимальный граф: Orchestrator → G3 subgraph
  grid.ps1: добавить langgraph-svc в $Services

Шаг 3: Zep self-hosted + Domain memory              (1-2 сессии)
  docker run ghcr.io/getzep/zep:latest -p 8000:8000
  Первая Domain memory: Development домен
  grid.ps1: добавить zep-server в $Services

Шаг 4: Qdrant self-hosted + Associative Routing     (1 сессия)
  docker run qdrant/qdrant:latest -p 6333:6333
  Связать с Zep для vector search
  grid.ps1: добавить qdrant-server в $Services

Шаг 5: tLOS Agent Frames                            (параллельно)
  Canvas frame-типы: agent-status, g3-session, memory-viewer
```
