# nospace — Agent System Architecture v2
> Status: DRAFT — обсуждение 2026-03-10
> Автор: nopoint + Assistant (Claude Sonnet 4.6)
> Tags: [architecture, agents, memory, langgraph, letta, cma, tlos]

---

## 1. Принцип

Единственная точка входа для nopoint — **Orchestrator**.
nopoint общается только с Orchestrator через **tLOS Omnibar**. Вся декомпозиция — внутренняя.

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

## 5. Технический стек

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
- [ ] Letta managed cloud vs self-hosted?
- [ ] Zep cloud vs self-hosted (privacy, 152-ФЗ)?
- [ ] Как разграничить Domain memory между Chiefs (чтобы Frontend Lead не читал Marketing domain)?
- [ ] Какие canvas frame-типы для визуализации агентов и G3-сессий в tLOS?

---

## 10. Следующие шаги

1. **Letta self-hosted** — поднять Docker инстанс, создать memory blocks для Eidolon (решает tech debt: compaction summary in-memory)
2. **LangGraph** — базовый граф: Orchestrator → Chief/Dev → Lead/Backend; tlos-langgraph-bridge через NATS
3. **Zep** — поднять для Domain memory (CMA substrate)
4. **Qdrant** — vector store для Associative Routing
5. **Первый G3 subgraph** — Senior → Coach ↔ Player в LangGraph
6. **tLOS Agent Frames** — canvas frame-типы для визуализации агентов, сессий, memory состояния
