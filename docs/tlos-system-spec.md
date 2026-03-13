# tLOS System Specification
> Vision (nopoint, 2026-03-12) + Current Implementation
> Source: 30-min audio transcription + codebase exploration

---

## 1. Five Pillars

tLOS состоит из пяти основных частей:

| # | Pillar | Назначение |
|---|--------|------------|
| 1 | **Agents** | Агентная иерархия: от Human intent до Worker+Coach пар |
| 2 | **Memory** | Continuum Memory: 5 слоёв перезаписываемости × 5 уровней абстракции |
| 3 | **Kernel** | Ядро: Docker-сервисы, NATS, LangGraph, persistence |
| 4 | **Shell** | UI: SolidJS canvas, Omnibar (command center), Frames (26 типов) |
| 5 | **Services** | Мета-агенты: Samurizators (память), Regulators (правила) |

---

## 2. Agent Hierarchy (VISION)

### 2.1 Overview

```
L0  Human (nopoint)
    │  raw intent: "создай сайт"
    ▼
L1  Дирижёр / Orchestrator
    │  формализует → делит по доменам
    │  Global Memory only, НЕ видит код
    ▼
L2  Chief Agent ×N  (per domain)
    │  Dev, Marketing, Research, Production, Design...
    │  ←→ горизонтально между собой
    ▼
L3  Lead Agent ×N  (per subdomain)
    │  Frontend, Backend, QA, SEO, Copywriting...
    │  декомпозирует эпики → G3 сессии
    ▼
L4  Special ×N  (per epic)
    │  пишет спеки, знает ЧТО делать
    │  запускает пары Worker+Coach
    ▼
L5  Worker + Coach  (G3 пары ×∞)
    Worker: узкий специалист, знает КАК делать
    Coach: проверяет по спеке, max 3 итерации
```

### 2.2 L1 — Дирижёр / Orchestrator

**Роль:** Мост между человеком и всей командой агентов.

**Главная задача:** Понять → формализовать → нормализовать → структурировать → разделить по доменам intent человека.

**Характеристики:**
- Думает **максимально широко**, но **минимально глубоко**
- **НЕ** имеет доступа к кодовой базе
- **НЕ** общается напрямую с Lead, Special или Worker
- Общается **ТОЛЬКО** с Chief Agents
- Проактивен: предлагает решения, задаёт уточняющие вопросы
- Получает саммаризированную информацию от Chiefs (не полные файлы)

**Контекстное окно:**
- Intent человека
- Global Memory (факты)
- Веб-поиск (по необходимости)
- Инструкции от человека

**Регламент эскалации:** Какие решения может принимать сам, какие эскалирует к человеку — будет прописан позже, когда структура устоится.

**Текущая реализация:**
- `tlos-claude-bridge/index.js` — Claude CLI subprocess (Eidolon)
- System prompt: `agents/eidolon/system-prompt.md`
- Memory blocks: `<persona>`, `<workspace>`, `<domain_memory>`, `<associative_context>`

### 2.3 L2 — Chief Agent

**Роль:** Оркестратор домена. Принимает задачу от Дирижёра, распределяет архитектуру, принимает решения о стеке.

**Домены (примеры):**
- Development (разработка)
- Marketing (маркетинг)
- Research (исследования)
- Production (продакшен)
- Design (дизайн)

**Характеристики:**
- Получает задачу от Дирижёра ("разработай сайт", "сделай SEO")
- Расписывает архитектуру, принимает решения о стеке
- Распределяет эпики по своим Leads
- **Горизонтальная коммуникация:** Chiefs могут общаться друг с другом
- **НЕ может** напрямую обратиться к Lead/Special другого домена
- Если Chiefs не могут договориться → эскалация к Дирижёру

**Текущая реализация:**
- `graph.py`: `ChiefDevState`, `chief_development_node`, `build_chief_graph`
- `bridge_handler.py`: `handle_chief_run`
- NATS: `agent:chief:run`

### 2.4 L3 — Lead Agent

**Роль:** Управляет сабдоменом. Декомпозирует эпики на G3-сессии.

**Сабдомены (примеры для Development):**
- Frontend
- Backend
- QA / Testing
- Security
- Infrastructure

**Сабдомены (примеры для Marketing):**
- Copywriting
- SEO
- Design
- Traffic

**Характеристики:**
- Декомпозирует эпики от Chief на G3-сессии
- Формирует Domain Memory из результатов работы Specials
- Может запрашивать уточнения у Chief

**Текущая реализация:**
- `graph.py`: `LeadState`, `lead_frontend_node`, `lead_backend_node`, `build_lead_graph(role)`
- `bridge_handler.py`: `handle_lead_run`, `_lead_graphs` singleton per role
- `letta_shared.py`: `read_domain_context`, `append_domain_context` (per-domain Letta agent)
- NATS: `agent:lead:run`

### 2.5 L4 — Special (ранее Senior)

**Роль:** Пишет спецификации для конкретных G3-сессий.

**Почему "Special":** Пишут спеки → спецификации → специалисты.

**Характеристики:**
- Знает **ЧТО** делать (конкретные задачи, критерии приёмки)
- Знает регуляционные моменты (правила, стандарты)
- НЕ знает КАК делать (это задача Worker)
- Special Memory per epic: контекст одного эпика, делится на G3-сессии
- Запускает пары Worker+Coach по готовой спеке

**Текущая реализация:**
- `graph.py`: `SeniorState`, `senior_frontend_node`, `senior_backend_node`, `build_senior_graph`
- `special_memory.py`: pg table `special_memory_facts` (session_id, senior_domain, content, task_context)
- `bridge_handler.py`: `handle_senior_run`, `_senior_graphs` singleton per domain
- NATS: `agent:senior:run`

### 2.6 L5 — Worker + Coach (G3 Pairs)

**Роль:** Исполнение и верификация.

**Worker (ранее Player):**
- Узкий эксперт в конкретной теме (напр. "космический копирайтер")
- Знает **КАК** делать — очень глубоко, но в одном
- Вне своей области — ничего не знает
- Придумывает реализацию по спеке от Special

**Coach:**
- Тоже глубокий специалист
- Проверяет Worker по спеке от Special
- Max 3 итерации → эскалация
- НЕ видит процесс Worker (только результат)

**Operational Memory:** Общий контекст между Coach и Special, между Special и Worker. Важно: Coach НЕ слышит Worker, Worker СЛЫШИТ Coach. Special может слушать Worker.

**Текущая реализация:**
- `graph.py`: `G3State`, `g3_player_node`, `g3_coach_node`, `build_g3_subgraph()`
- Cyclic: player → coach → conditional (passed/iter≥3 → END, else → player)

---

## 3. Memory System (Continuum Memory)

### 3.1 Abstraction Levels

| Level | Name | Широта | Глубина | Кто владеет |
|-------|------|--------|---------|-------------|
| L0 | Human Intent | — | — | Human (nopoint) |
| L1 | Global Memory | MAX | MIN | Дирижёр |
| L2 | Domain Memory | Средняя (один домен) | Средняя | Chief Agent |
| L3 | Project Memory | Domain-based | Высокая | Lead Agent |
| L4 | Special Memory | Per-epic | Высокая | Special |
| L5 | Operational Memory | Per-session | MAX | Worker+Coach |

**Принцип:** Чем ниже уровень абстракции → тем уже горизонт, но глубже контекст.

### 3.2 Continuum Memory — 5 Layers per Container

Каждый контейнер памяти (Global, Domain, Project, Special) состоит из 5 слоёв по перезаписываемости:

| Layer | Перезапись | Описание |
|-------|-----------|----------|
| **Frozen** | Никогда (только человек) | Основные инструкции, конституция, неизменяемые правила |
| **Slow** | Раз в эпику / проект | Архитектурные решения, выбранные стеки, ADR |
| **Medium** | Регулярно | Текущие контексты, активные задачи, спеки |
| **Fast** | Часто | Промежуточные результаты, текущий прогресс |
| **Operational / Empirical** | Каждую сессию | Текущая работа, временный контекст |

### 3.3 Memory Containers

**Global Memory Container:**
- Continuum layers = отдельные файлы
- Владелец: Дирижёр (только он читает постоянно)
- Другие агенты: могут обращаться по запросу

**Domain Memory Container:**
- Continuum layers = отдельные файлы
- Один контейнер на домен (Dev, Marketing, etc.)
- Lead формирует Domain Memory из результатов Specials
- Chief читает

**Project Memory Container:**
- Файлы по ДОМЕНАМ (не по Continuum)
- Внутри каждого файла — слои по Continuum
- Формируется Samurizators из Operational → Global (деградация контента)
- Дирижёр подключает по необходимости (не всегда в контексте)

**Special Memory:**
- Per-epic контейнер
- Special и Lead могут писать
- Содержит спеки, контексты G3-сессий

**Operational Memory:**
- Общий контекст текущей сессии
- Worker, Coach и Special работают в нём

### 3.4 Current Implementation (mapping)

| Vision Layer | Implementation | Technology | Status |
|-------------|---------------|------------|--------|
| Operational Memory | Letta session agents | Letta REST API, port 8283 | ✅ LIVE |
| Operational Memory (fallback) | In-memory fallback | `memoryFallback[sessionId]` | ✅ LIVE |
| Domain Memory | pg facts table | `tlos_facts` + pgvector HNSW 1536-dim | ✅ LIVE |
| Domain Memory (embeddings) | liteLLM proxy | NIM llama-3.2-nv-embedqa-1b-v2 | ✅ LIVE |
| Associative Routing | Qdrant | `tlos-global` collection, cosine search | ✅ LIVE |
| Special Memory | pg session facts | `special_memory_facts` table | ✅ LIVE |
| Shared Domain Context | Letta per-domain agents | `tlos-domain-{frontend|backend}` | ✅ LIVE |
| Global Memory | — | — | ⬜ NOT IMPLEMENTED |
| Project Memory | — | — | ⬜ NOT IMPLEMENTED |
| Continuum layers | — | — | ⬜ NOT IMPLEMENTED |
| Samurizator service | — | — | ⬜ NOT IMPLEMENTED |
| Selective Retention | — | — | ⬜ NOT IMPLEMENTED |
| Temporal Continuity | — | — | ⬜ NOT IMPLEMENTED |
| Consolidation | Partial | Context compaction in bridge | ⚠️ PARTIAL |

### 3.5 Memory Degradation Flow (Samurizators)

```
L5 Operational → L4 Special → L3 Project → L2 Domain → L1 Global
     (raw)        (per-epic)   (domain-based)  (domain)   (wide, shallow)

Контент деградирует: каждый переход теряет детали, но расширяет горизонт.
Samurizators пассивно проводят эту деградацию.
```

---

## 4. Shell

### 4.1 Architecture

Shell = **Omnibar** + **Frames**. Две большие структуры.

```
┌──────────────────────────────────────────────┐
│  App.tsx (root)                               │
│  ├── Space (canvas grid background)          │
│  ├── World-Space Layer (camera-aware frames)  │
│  ├── Screen-Space Layer (pinned frames)       │
│  └── Omnibar (fixed bottom-center, z-1000)    │
└──────────────────────────────────────────────┘
```

**Technology:** SolidJS 1.8 + TypeScript + Vite 5 + Tailwind + Tauri (native WebView2)

### 4.2 Omnibar (Command Center)

**Omnibar** — центр управления. Input + message history + panels.

**Local Commands (handled in App.tsx):**

| Command | Action | Frames spawned |
|---------|--------|---------------|
| `mcb` | Marketing Command Board | 6 frames (strategy, signal-brief, seo, gap-detail, task-card, experiment) |
| `kernel` | Kernel monitoring | 2 frames (agent-status, memory-viewer) |
| `g3` | G3 session | 1 frame (g3-session) |

**AI Commands** (routed to kernel via WebSocket → NATS):

| Message Type | Destination | Purpose |
|-------------|-------------|---------|
| `agent:chat` | claude-bridge / agent-bridge | User → AI conversation |
| `agent:ping` | shell-bridge | Health check |
| `agent:auth:request` | claude-bridge | Auth status check |

**Provider Selection:** Claude (Sonnet/Haiku/Opus) или NVIDIA NIM

**Panels:** Model (provider/auth/model), Agent State (agent list), Context (token usage)

**UI States:** Collapsed → Expanded (360px) → Max (600px)

### 4.3 Frames (26 Types)

**Two-Layer Rendering:**
- **World-space:** Pan/zoom с viewport transform
- **Screen-space:** Pinned к экрану, без transform

**Frame Chrome (DynamicComponent.tsx):**
- Traffic lights: 🔴 close, 🟡 minimize, 🟢 pin (world↔screen)
- Drag handle (header)
- 8 resize handles (N/S/E/W/corners)

**Frame Types by Category:**

| Category | Types |
|----------|-------|
| Generic | window, text, button, chat, panel |
| Editor & Files | text-editor, terminal, file-browser, notes, diff-viewer, image-viewer |
| Workers | math-worker, echo-worker |
| Agent & System | agent-console, agent-status, identity, kernel-status |
| MCB (6) | mcb-strategy, mcb-signal-brief, mcb-seo, mcb-gap-detail, mcb-task-card, mcb-experiment |
| AI | memory-viewer, g3-session |
| Deprecated | omnibar (pinned component now) |

**Persistence:** `tlos-canvas-state-v4` в localStorage.

### 4.4 State Management

No centralized store — SolidJS signals:
- **Omnibar:** self-contained signals (input, historyState, messages)
- **Canvas:** `useComponents` hook (frames array via Solid store)
- **Viewport:** `useViewport` hook (pan/zoom)
- **Snap/Group:** `useSnap` hook (multi-frame selection)
- **Kernel:** module-level singleton `kernel.ts` (WebSocket pub/sub)

---

## 5. Kernel

### 5.1 Docker Services (12)

| Service | Image | Port | Role |
|---------|-------|------|------|
| **nats** | nats:latest | 4222, 8222 | Message broker (Zero-Web2) |
| **db** | postgres + pgvector | 5433 | Domain Memory + Special Memory |
| **litellm** | berriai/litellm | 4000 | Embedding proxy (NIM Matryoshka 1536-dim) |
| **qdrant** | qdrant:v1.13.0 | 6333 | Associative routing (global vector) |
| **letta** | letta/letta:latest | 8283 | Session memory (Letta agents) |
| **langgraph-bridge** | Python 3.12 + uv | internal | LangGraph agent orchestration |
| **claude-bridge** | Node 22 alpine | internal | Claude CLI wrapper (Eidolon) |
| **shell-bridge** | Rust (Axum) | 3001 | WebSocket gateway (Shell ↔ NATS) |
| **dispatcher** | Rust | internal | Actor manifest, intent routing |
| **fs-bridge** | Rust | internal | File I/O (safe_path, no traversal) |
| **shell-exec** | Rust | internal | Command execution (whitelisted) |
| **agent-bridge** | Rust (profile: nim) | internal | NIM inference (optional) |

### 5.2 NATS Message Routing

**Agent commands:**
| Subject | Handler | Direction |
|---------|---------|-----------|
| `agent:chat` | claude-bridge | Shell → AI |
| `agent:graph:run` | langgraph-bridge | Shell → LangGraph (direct) |
| `agent:chief:run` | langgraph-bridge | Shell → Chief graph |
| `agent:lead:run` | langgraph-bridge | Shell → Lead graph |
| `agent:senior:run` | langgraph-bridge | Shell → Senior graph |
| `agent:graph:token` | Shell | LangGraph → streaming |
| `agent:graph:error` | Shell | LangGraph → error |
| `agent:memory:add_fact` | claude-bridge | Shell → pg fact |
| `memory:get-facts` | claude-bridge | Shell → pg query |
| `memory:search` | claude-bridge | Shell → vector search |
| `kernel:ping` / `kernel:status` | shell-bridge | Health monitoring |

**File system:**
| Subject | Handler |
|---------|---------|
| `tlos.fs.list` | fs-bridge |
| `tlos.fs.read` | fs-bridge |
| `tlos.fs.write` | fs-bridge |
| `tlos.shell.exec` | shell-exec |

### 5.3 LangGraph Graphs (5 types)

| Graph | Flow | State |
|-------|------|-------|
| **Direct** | orchestrator → worker → END | GraphState |
| **Chief** | orchestrator → chief_development → chief_worker → END | ChiefDevState |
| **Lead** (per-role) | orchestrator → lead_{frontend\|backend} → lead_worker → END | LeadState |
| **Senior** (per-domain) | orchestrator → senior_{frontend\|backend} → END (calls G3 inline) | SeniorState |
| **G3 subgraph** | player → coach → conditional → (loop or END) | G3State |

**G3 Cycle:** max 3 iterations. Coach decides pass/fail. If 3 iterations exhausted → escalate.

### 5.4 System Prompt Injection (Claude Bridge)

Order of injection into Claude:
1. Base system prompt (`agents/eidolon/system-prompt.md`)
2. `<persona>` from `agents/eidolon/memory/persona.md`
3. `<workspace>` from `agents/eidolon/memory/workspace.md`
4. `<domain_memory>` from pg (new sessions only)
5. `<associative_context>` from Qdrant (per-message)
6. Microagents: keyword-triggered from `agents/eidolon/microagents/*.md` (per-message)
7. `<PREVIOUS_CONTEXT_SUMMARY>` (after compaction)

---

## 6. Services (VISION)

### 6.1 Samurizators (Summarizers)

**Метафора:** "Медики" — следят за здоровьем памяти.

**Задача:** Пассивно компактить память, освобождая контекстные окна агентов.

**Механизм:**
- Берут данные из максимального уровня глубины (L5 Operational)
- Проводят деградацию контента: L5 → L4 → L3 → L2 → L1
- Каждый переход: теряются детали, расширяется горизонт
- Формируют: Global Memory, Project Memory, Domain Memory
- Работают **пассивно** — потихоньку, в фоне, без ручного запуска

**Текущая реализация (partial):**
- Context compaction в claude-bridge: `summarizeConversation()` при nearLimit
- Letta memory blocks: conversation_summary (10000 chars)
- НЕ реализовано: пассивная деградация L5→L1, формирование Global/Project Memory

### 6.2 Regulators

**Метафора:** "Полиция" — следят за соблюдением правил.

**Задача:** В реальном времени проверять, что агенты работают по регламенту.

**Примеры нарушений:**
- Агент самостоятельно выполняет задачу вместо делегирования
- Нарушение нейминг-конвенций
- Пропуск Verification Gates
- Работа за пределами своего RBAC scope

**Механизм:**
- Скрипты-хуки, которые в моменте останавливают агента
- Приводят "в чувство" — напоминают правила
- Могут быть реализованы как PreToolUse / PostToolUse hooks

**Текущая реализация:**
- Claude Code hooks (PreToolUse/PostToolUse) — базовые
- `~/.claude.json` deny list (`rm`, `rmdir`, etc.)
- НЕ реализовано: автоматический мониторинг workflow compliance

### 6.3 Future Services (ideas from transcription)

- **МЧС** — "emergency responders" для чрезвычайных ситуаций в агентной системе
- Другие метафоры из реальных госструктур → службы в агентной системе

---

## 7. Communication Rules

### 7.1 Vertical Communication (top-down)

```
Human → Дирижёр   : raw intent
Дирижёр → Chief   : формализованная задача по домену
Chief → Lead      : эпик с архитектурой
Lead → Special    : подзадача для G3
Special → Worker  : спека (ЧТО делать)
Special → Coach   : спека (критерии проверки)
```

### 7.2 Horizontal Communication

```
Chief ↔ Chief  : да, могут общаться напрямую
Lead ↔ Lead    : только внутри одного домена (через Chief)
Worker ↔ Coach : НЕ видят друг друга (только через спеку)
```

### 7.3 Cross-Domain Rules

- Chief Agent одного домена **МОЖЕТ** общаться с Chief другого домена
- Chief Agent **НЕ МОЖЕТ** обратиться напрямую к Lead/Special другого домена
- Если нужна информация из другого домена → идёт через Chief этого домена

### 7.4 Escalation Chain

```
Worker → Special → Lead → Chief → Дирижёр → Human
```

Эскалация происходит когда:
- Worker не может решить задачу за 3 итерации G3
- Special не может написать спеку (неясность)
- Chiefs не могут договориться между собой
- Регламент эскалации запрещает принятие решения на этом уровне

### 7.5 Information Visibility

| Agent | Слышит | НЕ слышит |
|-------|--------|-----------|
| Worker | Coach (feedback) | — |
| Coach | — | Worker (процесс) |
| Special | Worker (результаты) | — |
| Lead | Special (отчёты) | Worker/Coach |
| Chief | Leads (саммари) | Specials/Workers |
| Дирижёр | Chiefs (саммари) | всё остальное |

---

## 8. Gap Analysis: Vision vs Current

| Feature | Vision | Current | Gap |
|---------|--------|---------|-----|
| **Agent Hierarchy** | 6 levels (L0-L5) | L1 (Eidolon) + L5 (G3 pairs) live. L2-L4 code ready, not deployed | Docker rebuild pending |
| **Дирижёр isolation** | No code access, only Chiefs | Has access to everything via Claude CLI | Need isolation layer |
| **Chief horizontal comm** | Chiefs talk to each other | Not implemented (single chief graph) | Need inter-chief protocol |
| **Special (renamed)** | Writes specs, knows regulations | Called "Senior" in code | Rename + regulation injection |
| **Worker (renamed)** | Deep specialist | Called "Player" in code | Rename in graph.py |
| **Continuum Memory** | 5 layers per container | Not implemented | New memory architecture needed |
| **Global Memory** | Wide, shallow, Дирижёр-only | Not implemented | Need pg-based Global tier |
| **Project Memory** | Domain-based files, Continuum inside | Not implemented | Need new container type |
| **Samurizators** | Passive memory compaction L5→L1 | Partial (context compaction) | Need dedicated service |
| **Regulators** | Real-time rule enforcement | Basic hooks only | Need monitoring agents |
| **Domain diversity** | Dev, Marketing, Research, Production, Design | Only Dev (frontend/backend) | Need more domains in LangGraph |
| **Subdomain flexibility** | SEO, Copywriting, Traffic, etc. | Only Frontend/Backend | Need dynamic subdomain system |
| **Intent formalization** | Structured pipeline | Informal Clarify loop | Need formal Intent entity |
| **Omnibar triggers** | Rich trigger taxonomy | 3 hardcoded commands | Need trigger system |

---

## Appendix A: File Paths

| Component | Path |
|-----------|------|
| Shell frontend | `core/shell/frontend/src/` |
| Omnibar | `core/shell/frontend/src/components/Omnibar.tsx` |
| DynamicComponent | `core/shell/frontend/src/components/DynamicComponent.tsx` |
| Frame types | `core/shell/frontend/src/types/frame.ts` |
| Kernel compose | `core/kernel/docker-compose.yml` |
| LangGraph graphs | `core/kernel/tlos-langgraph-bridge/graph.py` |
| Bridge handler | `core/kernel/tlos-langgraph-bridge/bridge_handler.py` |
| Special memory | `core/kernel/tlos-langgraph-bridge/special_memory.py` |
| Letta shared | `core/kernel/tlos-langgraph-bridge/letta_shared.py` |
| Claude bridge | `core/kernel/tlos-claude-bridge/index.js` |
| Domain memory | `core/kernel/tlos-claude-bridge/domain-memory.js` |
| Qdrant client | `core/kernel/tlos-claude-bridge/qdrant-client.js` |
| Roadmap | `docs/agent-system-architecture.md` |
| Codebase map | `development/tLOS/memory/codebase-map-tLOS.md` |

## Appendix B: Brand

| Element | Value |
|---------|-------|
| Концепция | Чёрный квадрат Малевича + τέλος |
| Стиль | Супрематизм |
| Background | `#0a0a0f` |
| Primary (gold) | `#f2b90d` |
| Cyan accent | `#06b6d4` |
| Monolith SVG | `core/shell/frontend/src/assets/monolith.svg` |
