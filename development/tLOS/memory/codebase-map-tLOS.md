# tLOS Codebase Map
> Создан: 2026-03-11 (checkpoint 34)
> Обновлён: 2026-03-13 — Phase 2-5 модули добавлены
> Источник: 3 Explore-агента (Kernel Python, Shell Frontend, Docker Infra)
> Читать в начале Quality Sprint — заменяет повторный ресёрч кодовой базы.

---

## 8 Продуктовых доменов

| # | Домен | Описание | Статус |
|---|---|---|---|
| 1 | **Workspace** | Canvas, frames, команды (mcb/g3/kernel), persistence | LIVE |
| 2 | **AI Chat** | Omnibar, Claude/NIM, streaming, context budget | LIVE |
| 3 | **Agent Work** | G3 (Player+Coach), LangGraph иерархия (Chief→Lead→Senior) | LIVE |
| 4 | **Memory & Knowledge** | Letta (session), pg+vector (domain), Qdrant (associative) | LIVE |
| 5 | **Nostr Network** | Identity (keypair), Patch receive/apply, Dev/Full node | SHIPPED |
| 6 | **Kernel** | 11 Docker-сервисов, always-on infra, health monitoring | LIVE |
| 7 | **MCB** | Marketing Command Board для Артёма (6 фреймов) | OPEN — ждём API |
| 8 | **Local Tools** | Terminal, File Browser, Text Editor, Diff Viewer | LIVE (basic) |

---

## Техническая карта файлов

### Kernel — Python (tlos-langgraph-bridge)

```
core/kernel/tlos-langgraph-bridge/
├── graph.py              735 LOC   ← МОНОЛИТ — все LangGraph ноды (Phase 2: factory functions)
├── bridge_handler.py     328 LOC   ← NATS handlers + singleton graphs (Phase 4: +3 handlers)
├── bridge.py              81 LOC   ← NATS router (Phase 4: +3 routes)
├── letta_shared.py       140 LOC   ← Letta HTTP client (per-domain singleton)
├── special_memory.py     139 LOC   ← pg persistence для Senior nodes
├── domain_config.py             ← [Phase 2] 5 chiefs + 11 leads as Python dicts, dynamic graph builder config
├── global_memory.py             ← [Phase 3] Global Memory tier, pg table `global_memory`, 5 Continuum layers
├── project_memory.py            ← [Phase 3] Project Memory tier, pg table `project_memory`, per-domain + Continuum layers
├── continuum.py                 ← [Phase 3] Lifecycle policies, TTL, frozen immutability, retrieval boost SQL
├── memory_edges.py              ← [Phase 3] Temporal edges + episodes, BFS traversal
├── samurizator.py               ← [Phase 4] Hybrid memory compaction service (extractive + LLM)
├── regulator.py                 ← [Phase 4] Real-time rules engine, YAML config, inline audit
├── regulator_rules.yaml         ← [Phase 4] 6 compliance rules
└── pyproject.toml               ← nats-py, langgraph, anthropic, psycopg2-binary, requests
```

**graph.py — структура (735 строк):**
| TypedDict | Поля | Кто использует |
|---|---|---|
| `GraphState` | 3 | build_graph() — базовый |
| `ChiefDevState` | 5 | build_chief_graph() |
| `G3State` | 6 | build_g3_subgraph() |
| `LeadState` | 6 | build_lead_graph() |
| `SeniorState` | 6 | build_senior_graph() |
| `DirizhyorState` | — | [Phase 2] Dirizhyor orchestration state |

**graph.py — функции:**
- `call_claude_cli(prompt, model)` — subprocess stdin, stream-json, NEVER raises
- `orchestrator_node`, `worker_node` — базовый граф
- `chief_development_node`, `chief_worker_node` — Chief уровень
- `g3_player_node`, `g3_coach_node`, `g3_should_continue` — G3 cyclic subgraph
- `lead_frontend_node`, `lead_backend_node`, `lead_worker_node` — Lead уровень
- `senior_frontend_node`, `senior_backend_node` — Senior уровень (вызывают G3 inline)
- `_build_chief_node(config)`, `_build_lead_node(config)` — [Phase 2] factory functions for dynamic graph building
- `build_graph()`, `build_chief_graph()`, `build_lead_graph()`, `build_senior_graph()`, `build_g3_subgraph()`

**bridge_handler.py — структура:**
- Singleton caches: `_graph`, `_chief_graph`, `_lead_graphs{}`, `_senior_graphs{}`
- Pre-compile at import: все графы компилируются при старте
- Handlers: `handle_graph_run`, `handle_chief_run`, `handle_lead_run`, `handle_senior_run`
- [Phase 4] Handlers: `handle_samurizator_run`, `handle_regulator_check`, `handle_regulator_reload`, `handle_dirizhyor_run`
- Streaming pattern: `run_in_executor(None, graph.invoke, state)` → 100-char chunks → NATS publish

**bridge.py — NATS routing:**
```
agent:graph:run       → handle_graph_run
agent:chief:run       → handle_chief_run
agent:lead:run        → handle_lead_run
agent:senior:run      → handle_senior_run
agent:samurizator:run → handle_samurizator_run     [Phase 4]
agent:regulator:check → handle_regulator_check     [Phase 4]
agent:regulator:reload→ handle_regulator_reload    [Phase 4]
agent:dirizhyor:run   → handle_dirizhyor_run       [Phase 4]
```

**domain_config.py — [Phase 2] Agent hierarchy config:**
- 5 Chief definitions (Development, Architecture, QA, Security, DevOps) as Python dicts
- 11 Lead definitions (Frontend, Backend, Infra, Testing, Security, etc.)
- Used by factory functions `_build_chief_node()` / `_build_lead_node()` in graph.py

**Continuum Memory Architecture — [Phase 3]:**

| Module | pg table | Description |
|---|---|---|
| `global_memory.py` | `global_memory` | Global Memory tier, 5 Continuum layers (perception → identity) |
| `project_memory.py` | `project_memory` | Project Memory tier, per-domain scoping + Continuum layers |
| `continuum.py` | — | Lifecycle policies: TTL enforcement, frozen immutability, retrieval boost SQL |
| `memory_edges.py` | — | Temporal edges between memory items + episodes, BFS graph traversal |

**samurizator.py — [Phase 4] Memory compaction:**
- Hybrid extractive + LLM summarization service
- Compacts memory items to reduce context window pressure

**regulator.py + regulator_rules.yaml — [Phase 4] Rules engine:**
- Real-time compliance rules evaluation
- YAML config with 6 rules
- Inline audit: bridge.py calls regulator before executing agent actions

**letta_shared.py:**
- `_domain_agents: dict` — кеш domain → Letta agent_id
- Letta agent name: `tlos-domain-{domain}`
- Функции: `_get_agent_id()`, `read_domain_context()`, `write_domain_context()`, `append_domain_context()`
- NEVER raises, graceful Letta-DOWN degradation

**special_memory.py:**
- pg table: `special_memory_facts` (session_id, senior_domain, content, task_context)
- Функции: `create_table()`, `write_spec()`, `read_context()`
- Auto-init при import

---

### Kernel — Node.js (tlos-claude-bridge)

```
core/kernel/tlos-claude-bridge/
├── index.js          634 LOC   ← Eidolon/Orchestrator + all glue
├── domain-memory.js            ← pg+liteLLM (tlos_facts, HNSW cosine)
├── qdrant-client.js            ← Qdrant tlos-global (associative routing)
├── letta-client.js             ← Letta REST client (session memory)
└── check-auth.js               ← Claude auth verification
```

**index.js — ключевые потоки:**
- NATS subscribe → `agent:chat` → claude CLI subprocess → stream → NATS publish
- Letta persistence: `~/.tlos/letta-agents.json` (Map: sessionId → agentId)
- Domain memory: inject `<domain_memory>` в system prompt
- Associative routing: `searchAssociative(content, 5)` per-message → `<associative_context>`
- Context compaction: `nearLimit` → `summarizeConversation()` → new session с `<PREVIOUS_CONTEXT_SUMMARY>`
- Microagents: keyword-triggered context injection из `agents/eidolon/microagents/*.md`

---

### Infra — Docker

```
core/kernel/docker-compose.yml — 11 сервисов (+ 1 profile:nim)
```

| Сервис | Image | Port | Healthcheck | Restart |
|---|---|---|---|---|
| nats | nats:latest | 4222, 8222 | ❌ нет | unless-stopped |
| db | getzep/postgres | 5433:5432 | ✅ pg_isready | unless-stopped |
| litellm | berriai/litellm | 4000 | ✅ HTTP /health | unless-stopped |
| qdrant | qdrant:v1.13.0 | 6333, 6334 | ✅ TCP | unless-stopped |
| letta | letta/letta | 8283 | ❌ нет | unless-stopped |
| langgraph-bridge | custom Python | — | ❌ нет | unless-stopped |
| claude-bridge | custom Node.js | — | ❌ нет | unless-stopped |
| shell-bridge | Rust | 3001 | ❌ нет | unless-stopped |
| dispatcher | Rust | — | ❌ нет | unless-stopped |
| fs-bridge | Rust | — | ❌ нет | unless-stopped |
| shell-exec | Rust | — | ❌ нет | unless-stopped |
| agent-bridge | Rust (profile:nim) | — | ❌ нет | unless-stopped |

**langgraph-bridge env vars (уже в compose):**
- `NATS_URL=nats://nats:4222`
- `DB_HOST=db`, `DB_PORT=5432`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `LETTA_URL=http://letta:8283`
- `depends_on`: db(healthy), litellm(healthy), qdrant(healthy), nats(started), letta(started)

---

### Shell — SolidJS Frontend

```
core/shell/frontend/src/
├── App.tsx                      250 LOC  ← viewport, canvas root, window lifecycle
│                                           (Phase 5: command registry + intent pipeline integration)
├── components/
│   ├── DynamicComponent.tsx     495 LOC  ← window chrome + 32-way frame router (МОНОЛИТ)
│   ├── Omnibar.tsx              723 LOC  ← AI chat UI (МОНОЛИТ)
│   │                                       (Phase 5: intentPipeline prop)
│   ├── OmnibarInput.tsx                  ← (Phase 5: autocomplete for registered commands)
│   ├── Chat.tsx                 169 LOC  ← message renderer + tlos_action cards
│   ├── PatchDialog.tsx          170 LOC  ← patch receive/apply UI
│   ├── Space.tsx                 78 LOC  ← canvas grid background
│   ├── UUPRenderer.tsx           78 LOC  ← UUP component tree renderer
│   ├── LatticeStatus.tsx         54 LOC  ← kernel health dots
│   └── ErrorBoundary.tsx         41 LOC  ← Solid error boundary
│
├── components/frames/           ← 21 фрейм-файл
│   ├── G3SessionFrame.tsx       265 LOC  ← LangGraph G3 interface
│   ├── AgentStatusFrame.tsx     164 LOC  ← kernel:ping/status polling
│   ├── MemoryViewerFrame.tsx    169 LOC  ← memory:get-facts + search
│   ├── KernelStatusFrame.tsx     91 LOC  ← 11 сервисов health grid
│   ├── Omnibar (frame)          101 LOC
│   ├── TextEditorFrame.tsx      120 LOC
│   ├── TerminalFrame.tsx        106 LOC
│   ├── FileBrowserFrame.tsx     125 LOC
│   ├── mcb/
│   │   ├── McbStrategyFrame.tsx 158 LOC
│   │   ├── McbSignalBriefFrame  126 LOC
│   │   ├── McbSeoFrame.tsx      106 LOC
│   │   ├── McbGapDetailFrame    113 LOC
│   │   ├── McbTaskCardFrame.tsx 199 LOC
│   │   └── McbExperimentFrame   158 LOC
│   └── (прочие: Notes, ImageViewer, DiffViewer, MathWorker, EchoWorker, Identity)
│
├── commands/                    ← [Phase 5] Command system
│   ├── commandRegistry.ts              ← Command registry (register/get/list/execute)
│   ├── defaultCommands.ts              ← Default commands (mcb, kernel, g3)
│   └── frameLayouts.ts                 ← Unified frame layout system (4 strategies)
│
├── data/                        ← (Phase 5: re-export from frameLayouts)
│   ├── mcb-frames.ts                   ← re-export from frameLayouts
│   ├── kernel-frames.ts                ← re-export from frameLayouts
│   └── g3-frames.ts                    ← re-export from frameLayouts
│
├── hooks/
│   ├── useComponents.ts         142 LOC  ← canvas state + kernel subscriptions
│   ├── useSnap.ts               245 LOC  ← snap/dock/group drag logic
│   ├── useViewport.ts            52 LOC  ← pan/zoom
│   └── useIntentPipeline.ts            ← [Phase 5] Intent pipeline SolidJS hook
│
└── types/
    ├── frame.ts                 159 LOC  ← 32 frame types (FrameData, 29 optional props)
    └── intent.ts                        ← [Phase 5] tLOS_Intent entity type + helpers
```

**Frame types (32 штуки):**
`window`, `text`, `button`, `chat`, `panel`, `math-worker`, `echo-worker`, `shape`,
`text-editor`, `terminal`, `file-browser`, `notes`, `catalog`, `image-viewer`, `diff-viewer`,
`omnibar`, `agent-console`, `identity`, `mcb-strategy`, `mcb-seo`, `mcb-gap-detail`,
`mcb-task-card`, `mcb-experiment`, `mcb-signal-brief`, `agent-status`, `memory-viewer`,
`g3-session`, `kernel-status`

**Omnibar команды → фреймы:**
- `mcb` → 6 MCB фреймов
- `kernel` → agent-status + memory-viewer
- `g3` → g3-session

---

## Известный долг (по файлам)

### CRITICAL — Security

| Файл | Строка | Проблема |
|---|---|---|
| Chat.tsx | 47 | `innerHTML={renderMarkdown(...)}` — XSS, marked без DOMPurify |
| DynamicComponent.tsx | 423 | `innerHTML` на props.data.uup — XSS |
| PatchDialog.tsx | 28 | `path: data.path` без валидации — path traversal |

### HIGH — Kernel

| Файл | Строки | Проблема |
|---|---|---|
| bridge_handler.py | 132,186,243,297 | `asyncio.get_event_loop()` deprecated → `get_running_loop()` |
| bridge_handler.py | 109-329 | 4 handle_* функции — ~160 LOC дублирование |
| bridge_handler.py | все handlers | `model` параметр принимается но не используется |
| graph.py | 5 мест | message extraction pattern дублируется (5×) |
| graph.py | 2 места | G3 invoke pattern дублируется (senior_frontend, senior_backend) |
| graph.py | 107,180,498 | hardcoded `model = "claude-sonnet-4-6"` |
| graph.py | 320 | G3 max iterations `3` захардкожено |
| bridge.py | 20-47 | `if/if/if/if` вместо `if/elif/elif/elif` |
| bridge.py + bridge_handler.py | — | `encode()` дублируется в обоих файлах |

### MEDIUM — Shell Monoliths

| Файл | LOC | Проблема |
|---|---|---|
| Omnibar.tsx | 723 | Слишком большой → надо разбить на 5-6 компонентов |
| DynamicComponent.tsx | 495 | Монолит → WindowChrome + ResizeHandles + FrameRouter |
| Chat.tsx + Omnibar.tsx | — | Дублированная markdown утилита |
| useComponents.ts | 67,74 | Мутация props (`data.messages = ...`) — нарушение immutability |

### MEDIUM — Docker

| Проблема | Файл |
|---|---|
| Нет healthcheck для nats и letta | docker-compose.yml |
| Hardcoded `NATS_URL` в Dockerfile | tlos-langgraph-bridge/Dockerfile |
| **langgraph-bridge не пересобран** (Steps 6-9 в коде но не в Docker) | — |

### LOW — Shell UX

| Файл | Проблема |
|---|---|
| G3SessionFrame | iterations `3` захардкожены в UI, session ID без random suffix |
| AgentStatusFrame | ping interval 30s захардкожен, нет "connecting..." initial state |
| TerminalFrame | нет scroll lock toggle |
| Все фреймы | нет loading states, нет error states |
| Omnibar | нет индикатора disconnect от kernel |
| App.tsx | thought/error overlays без aria-live, без ESC dismiss |

---

## NATS Message Types (полная таблица)

| NATS тип | Направление | Handler |
|---|---|---|
| `agent:chat` | Shell → claude-bridge | Eidolon chat |
| `agent:graph:run` | Shell → langgraph-bridge | LangGraph direct |
| `agent:chief:run` | Shell → langgraph-bridge | Chief/Development |
| `agent:lead:run` | Shell → langgraph-bridge | Lead/Frontend или /Backend |
| `agent:senior:run` | Shell → langgraph-bridge | Senior/Frontend или /Backend |
| `agent:samurizator:run` | Shell → langgraph-bridge | [Phase 4] Memory compaction |
| `agent:regulator:check` | Shell → langgraph-bridge | [Phase 4] Rules compliance check |
| `agent:regulator:reload` | Shell → langgraph-bridge | [Phase 4] Reload regulator rules |
| `agent:dirizhyor:run` | Shell → langgraph-bridge | [Phase 4] Dirizhyor orchestration |
| `agent:graph:token` | langgraph-bridge → Shell | Streaming chunk |
| `agent:graph:error` | langgraph-bridge → Shell | Error event |
| `agent:memory:add_fact` | Shell → claude-bridge | Добавить факт в domain memory |
| `kernel:ping` | Shell → shell-bridge | Health check |
| `kernel:status` | shell-bridge → Shell | Status response |
| `memory:get-facts` | Shell → claude-bridge | Get facts |
| `memory:search` | Shell → claude-bridge | Vector search |

---

## Технические зависимости между компонентами

```
Shell (SolidJS)
  │  [Phase 5: commandRegistry → frameLayouts → intentPipeline]
  ↕ NATS (4222)
  ├── claude-bridge (Node.js)
  │     ├── Letta :8283 (session memory)
  │     ├── db :5432 (domain memory — pg+vector)
  │     ├── litellm :4000 (embeddings → NIM)
  │     └── qdrant :6333 (associative routing)
  └── langgraph-bridge (Python)
        ├── NATS (subscribe agent:*:run + samurizator + regulator + dirizhyor)
        ├── Letta :8283 (shared domain blocks)
        ├── db :5432 (special_memory_facts, global_memory, project_memory)
        ├── domain_config.py → graph.py factory functions [Phase 2]
        ├── Continuum Memory (global_memory.py, project_memory.py, continuum.py, memory_edges.py) [Phase 3]
        ├── samurizator.py (memory compaction) [Phase 4]
        ├── regulator.py + regulator_rules.yaml (compliance engine) [Phase 4]
        └── Claude CLI subprocess (agent nodes)
```

---

## Файлы конфигурации

| Файл | Назначение |
|---|---|
| `core/kernel/.env` | NIM_KEY + WORKSPACE_ROOT + USERPROFILE |
| `core/kernel/docker-compose.yml` | Единый compose для всего kernel |
| `core/agents/eidolon/config.json` | Eidolon: model, contextWindowTokens, paths |
| `core/agents/eidolon/system-prompt.md` | System prompt с `<!-- MEMORY_BLOCKS -->` placeholder |
| `core/agents/eidolon/microagents/*.md` | Keyword-triggered context injection |
| `core/kernel/tlos-langgraph-bridge/regulator_rules.yaml` | [Phase 4] 6 compliance rules for regulator engine |
| `core/grid.ps1` | Dev launcher: NIM key load → .env write → docker compose up → Tauri |
| `~/.tlos/sessions.json` | sessionId → claudeSessionId persistence |
| `~/.tlos/letta-agents.json` | sessionId → Letta agentId persistence |
| `~/.tlos/nim-key` | NIM API key |
