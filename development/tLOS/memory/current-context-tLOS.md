---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-10 (session 16 close)
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — `mcb` команда починена (viewport reset); ждём API доступы Артёма |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |
| epic-nim-v1 | nim-v1 | NIM AI Bridge — NVIDIA NIM HTTP SSE интеграция | **SHIPPED** — agent-bridge переписан, Omnibar → NIM → token stream работает |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand system зафиксирована, сайт в разработке |
| epic-eidolon-v1 | omnibar | Claude Code integration as Eidolon AI backend | **OPEN** — session persistence fix + context summarization + mcb fix shipped |
| epic-workspace-v1 | workspace-v1 | Организация рабочего пространства nopoint + Артём | **OPEN** — sessions-map.md создан, 3 трека (A: Omnibar v2, B: BB Floors, C: Infra) |
| epic-docker-v1 | docker-v1 | Dockerization D1–D6 — Always-On Kernel | **CLOSED** — merged → main (session 15) |
| epic-l2-step5 | — | L2 Step 5 — Agent Frames (agent-status, memory-viewer, g3-session) | **DONE** — shipped session 15 |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | **L2 Kernel ALL DONE (5/5)** — session 16. Full Docker stack: NATS + 5 Rust services (shell-bridge, dispatcher, fs-bridge, shell-exec, agent-bridge) в Docker. lettaAgentIds persistence fix. grid.ps1 Docker-only. Следующий приоритет: L3 Agent Hierarchy (Step 6). | 2026-03-10 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid.ps1 run` | 2026-03-10 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| claude_bridge | tlos-claude-bridge — FULL: XML memory, microagents, stable sessionId, context compaction + Letta + domain memory (pg+liteLLM) | 2026-03-10 |
| langgraph_bridge | tlos-langgraph-bridge — Python service: NATS → LangGraph (orchestrator→worker) + G3 cyclic subgraph | 2026-03-10 |
| domain_memory | **DONE** — pg+pgvector+liteLLM. `domain-memory.js` (переименовано из zep-client.js): direct pg (tlos_facts table, vector(1536), HNSW cosine) + liteLLM embeddings (NIM Matryoshka). Docker: db:5432 (internal), litellm:4000, qdrant:6333. Session 13: connected inside Docker via service names. | 2026-03-10 |
| associative_routing | **DONE** — qdrant-client.js (tlos-global collection, djb2 dedup, cosine search). index.js: searchAssociative per-message → `<associative_context>` block. agent:zep:add_fact syncs to Qdrant. | 2026-03-10 |
| dispatcher | tlos-dispatcher — FIXED (graceful wasm skip, no crash on missing math_worker.wasm) | 2026-03-08 |
| eidolon | Eidolon AI backend LIVE — context summarization, stable sessions, nearLimit compaction, domain context | 2026-03-10 |
| session_continuity | Omnibar: stable `conversationSessionId` per conversation → claude-bridge resumes correctly | 2026-03-10 |
| context_summarization | bridge: nearLimit → summarizeConversation() → new session with `<PREVIOUS_CONTEXT_SUMMARY>` | 2026-03-10 |
| nim_key_path | ~/.tlos/nim-key — ОБНОВЛЁН 2026-03-10 (новый ключ от nopoint) | 2026-03-10 |
| agent_arch_doc | `docs/agent-system-architecture.md` v3 — единственный источник истины по роадмапу. L2(1-5)+L3(6-9)+L4(10-13)+Dockerization(D1-D6). | 2026-03-10 |
| desktop_shortcut | `Desktop/tLOS.lnk` → `AppData/Local/tLOS/tlos-app.exe`. Icon: monolith.ico (прозрачный фон, проблема отображения не решена). | 2026-03-10 |
| dockerization | **D1-D6 ALL DONE** — Dockerfiles: tlos-claude-bridge (node:22-alpine) + tlos-langgraph-bridge (python:3.12-slim+Node22). Unified compose: `core/kernel/docker-compose.yml` (6 services). `.env`: NIM_KEY (gitignored). grid.ps1 обновлён. NATS: `-a 0.0.0.0`. Inter-container env vars. All 6 containers online. D5: `core/kernel/.env` создан. D6: Desktop/tLOS.lnk создан. Docker Desktop autostart → ручной шаг nopoint. | 2026-03-10 |
| docker_compose_unified | `core/kernel/docker-compose.yml` — **12 сервисов** (session 16): nats:4222, db:5433, litellm:4000, qdrant:6333, letta:8283, langgraph-bridge, claude-bridge, shell-bridge:3001, dispatcher, fs-bridge, shell-exec, agent-bridge(profile:nim). NATS_URL=nats://nats:4222 (internal). WORKSPACE_ROOT через .env (grid.ps1 auto). | 2026-03-10 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| ~~claude-bridge: cmd.exe breaks on <SYSTEM_CONTEXT> in -p arg~~ | claude-bridge | 2026-03-10 | **RESOLVED** — prompt via stdin |
| ~~Neural Link frame спавнится на каждое сообщение~~ | frontend | 2026-03-10 | **RESOLVED** — фильтр agent:* events |
| ~~agent:context payload bug~~ | claude-bridge + Omnibar | 2026-03-10 | **RESOLVED** |
| ~~sessionId создавался per-message → сессии не резюмировались~~ | Omnibar | 2026-03-10 | **RESOLVED** — stable `conversationSessionId` |
| ~~mcb команда не показывала фреймы~~ | App.tsx | 2026-03-10 | **RESOLVED** — resetViewport() после replaceComponents |
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Артём не настроил tlos-patch-daemon | node-v1 | 2026-02-28 | Нужно: tLOS-setup.exe + daemon с --dev-npub nopoint |
| ~~**Zep CE vector search**~~ | zep-bridge | 2026-03-10 | **RESOLVED** — Zep CE полностью заменён на pg+pgvector+liteLLM. Vector search working (cosine HNSW). |
| ~~**liteLLM proxy**~~ | zep-bridge | 2026-03-10 | **RESOLVED** — liteLLM proxy deployed, 1536-dim NIM embeddings confirmed. |
| **Local PG conflict** | infra | 2026-03-10 | **RESOLVED** — Docker pg exposed on port 5433 (local PG on 5432). zep-client.js uses 5433. |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы + агент-система как ядро: LangGraph (Python) + Letta (session memory) + pg+pgvector+liteLLM (domain memory) + Qdrant (vector, TODO); все self-hosted, управляются grid.ps1, общаются через NATS
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Claude AI pipeline:** Omnibar → agent:chat{provider:'claude', model} → NATS → claude-bridge → `claude --print` (stdin) → NATS → Omnibar
  - System prompt: XML memory blocks (`<persona>`, `<workspace>`, `<domain_memory>`) injected
  - Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
  - Session ID stability: Omnibar `conversationSessionId` signal — reused across all messages, reset only on clearContext()
  - Microagents: `agents/eidolon/microagents/*.md` — keyword-triggered context injection per message (OpenHands pattern)
  - Context tracking: `agent:context` event → `payload: { tokensUsed, contextTotal, nearLimit, turns }`
  - **Context compaction:** bridge dual-path — Letta UP: history/summary in Letta blocks (persistent); Letta DOWN: in-memory fallback (`memoryFallback`); on `nearLimit` → `summarizeConversation()` → new Claude session with `<PREVIOUS_CONTEXT_SUMMARY>` injected
  - **Domain memory:** `getDomainContext()` → DomainMemory.getContext('development-domain') → `<domain_memory>` injected on new session
  - **agent:zep:add_fact** NATS event → DomainMemory.addFact (fire-and-forget; NATS subject kept for compatibility)
  - Compaction UI: `agent:summarizing` event → Omnibar shows `⚙️ compacting...` indicator
- **Domain Memory pipeline (replaces Zep CE):** domain-memory.js → PostgreSQL (pgvector 0.5.1, Docker: db:5432) + liteLLM proxy (litellm:4000) → NIM embeddings
  - Table: `tlos_facts` (id, domain, content, metadata JSONB, embedding vector(1536), created_at)
  - Index: HNSW cosine (`vector_cosine_ops`) on embedding column
  - API: isAvailable, ensureDomain, addFact, getFacts, searchFacts (vector cosine), getContext
  - Embeddings: liteLLM maps `text-embedding-ada-002` → NIM `llama-3.2-nv-embedqa-1b-v2` (Matryoshka, 1536-dim)
  - Chat: liteLLM maps `meta/llama-3.1-70b-instruct` → NIM passthrough (for future Summarize Service)
  - Docker Compose: `core/kernel/docker-compose.yml`; 6 services (db + litellm + qdrant + letta + langgraph-bridge + claude-bridge)
  - 14 seed facts auto-inserted on first `ensureDomain('development-domain')`
  - Fallback: substring search if liteLLM unavailable
- **Associative Routing (L2 Step 4):** qdrant-client.js → Qdrant v1.13.0 (port 6333) → `tlos-global` collection
  - Functions: isAvailable, ensureCollection, upsert, addGlobal, search, searchAssociative
  - djb2 hash for deterministic point IDs (dedup on upsert)
  - index.js: `searchAssociative(content, 5)` per-message → `<associative_context>` block injected into prompt
  - agent:zep:add_fact → DomainMemory.addFact (pg) + QdrantClient.addGlobal (qdrant) in parallel
  - **Seed sync on startup:** после ensureDomain() → getFacts(50) → addGlobal each fact (idempotent, djb2 dedup)
  - Healthcheck: `bash -c ':> /dev/tcp/localhost/6333'` (qdrant image has no python3)
- **LangGraph pipeline:** tlos.shell.events → tlos-langgraph-bridge → LangGraph (orchestrator→worker) → tlos.shell.broadcast
  - subscribe: `tlos.shell.events`, message type `agent:graph:run`
  - publish: `agent:graph:token` (streaming chunks), `agent:graph:error`, `agent:graph:status`
  - graph.py: GraphState, call_claude_cli (subprocess+stdin), build_graph(), build_g3_subgraph()
  - G3 cyclic subgraph: player→coach→conditional edge (passed/iter≥3→END, else→player)
  - Singleton compiled graph in bridge_handler.py (pre-compile at import)
  - run_in_executor for graph.invoke (async-safe)
- **NIM AI pipeline:** Omnibar → agent:chat{provider:'nim'} → NATS → agent-bridge → NVIDIA NIM SSE → NATS → Omnibar
- **Auth:** claude-bridge reads ~/.claude.json, publishes agent:auth:status; Omnibar кэширует в localStorage
- **Frame filtering:** useComponents.ts фильтрует все agent:* events (включая agent:summarizing)
- **Markdown:** Chat.tsx + Omnibar.tsx используют `marked` (GFM+breaks), стили в index.css (.chat-md)
- **tlos_action cards:** Chat.tsx парсит ` ```tlos_action ` блоки → ⚡ карточки
- **MessageStatus:** `kernel.ts` экспортирует `MessageStatus = 'streaming' | 'complete' | 'error'`
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **Agent system architecture:** `docs/agent-system-architecture.md` — L2 Kernel: LangGraph + Letta + pg+liteLLM + Qdrant внутри tLOS, self-hosted, grid.ps1. Иерархия: Orchestrator(Eidolon) → Chief → Lead → Senior → G3(Coach↔Player). CMA: Session(Letta) → Domain(pg+liteLLM) → Project(pg+liteLLM) → Global(pg+liteLLM).
- **Letta service:** `letta/letta:latest` Docker image — порт 8283; volume `letta_data:/root/.letta`
- **LangGraph service:** Docker `core/kernel/tlos-langgraph-bridge/Dockerfile` (python:3.12-slim+Node22+uv+claude CLI)
- **Domain Memory + All Kernel services:** `docker compose up` из `core/kernel/` — **unified compose** `core/kernel/docker-compose.yml` (6 services). NIM_KEY env var from ~/.tlos/nim-key. grid.ps1: `docker-kernel` service.
- **Full Docker stack (session 16):** grid.ps1 теперь только `docker compose up -d` + Tauri. NATS в Docker (nats:latest, 4222+8222). 5 Rust сервисов: shell-bridge(3001), dispatcher, fs-bridge, shell-exec, agent-bridge(profile:nim). `kernel/Dockerfile.rust-services` — multi-stage Rust build. server.rs: TLOS_BIND_HOST env var (0.0.0.0 в Docker). WORKSPACE_ROOT auto → fs-bridge + shell-exec volume mount.
- **lettaAgentIds persistence (session 16):** `~/.tlos/letta-agents.json` — Map сохраняется при каждом новом агенте. Пережитает рестарт Docker.
- **Agent Frames (L2 Step 5):** AgentStatusFrame (kernel:ping → kernel:status, 30s poll), MemoryViewerFrame (memory:get-facts + memory:search), G3SessionFrame (agent:graph:run + streaming). Omnibar: `kernel` → agent-status+memory-viewer, `g3` → g3-session. Files: `core/shell/frontend/src/components/frames/AgentStatusFrame.tsx`, `MemoryViewerFrame.tsx`, `G3SessionFrame.tsx`, `data/kernel-frames.ts`, `data/g3-frames.ts`.
- **First build required:** `docker compose build shell-bridge dispatcher fs-bridge shell-exec agent-bridge && docker compose up -d` (первый раз ~10 мин Rust compile). Потом `grid.ps1 run`.
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. `asyncio.get_event_loop()` deprecated в Python 3.10+ (bridge_handler.py LOW). model не прокидывается через GraphState в worker_node (LOW). Legacy files archived: `core/kernel/archive/`. Полный рефактор → после L3 Step 9.

## L2 Kernel Roadmap

| Шаг | Задача | Статус |
|-----|--------|--------|
| 1 | Letta self-hosted + tlos-claude-bridge migration | ✅ DONE (G3 TLOS-07) |
| 2 | tlos-langgraph-bridge — Python service + LangGraph + G3 subgraph | ✅ DONE (G3 TLOS-08) |
| 3 | Domain Memory — pg+pgvector+liteLLM (replaced Zep CE) | ✅ DONE — zep-client.js rewritten, vector search working |
| 4 | Qdrant self-hosted + Associative Routing | ✅ DONE — qdrant-client.js, tlos-global collection, per-message assoc context |
| 5 | tLOS Agent Frames (agent-status, g3-session, memory-viewer) | ✅ DONE — session 15. Omnibar: `kernel` + `g3` |

## Omnibar Roadmap (branch: omnibar)

| Task | Status |
|---|---|
| Redesign: NIM chat panel, token streaming | ✅ DONE |
| Provider selector (Claude/NVIDIA toggle + model list) | ✅ DONE |
| Auth UI: Connected/Sign in status in Model panel | ✅ DONE |
| Monolith logo: SVG + favicon + Tauri icons | ✅ DONE (2026-03-10) |
| Auth persistence: localStorage cache | ✅ DONE (2026-03-10) |
| Eidolon agent backend: system prompt + config | ✅ DONE (2026-03-10) |
| claude-bridge: stdin-based prompt (Windows shell fix) | ✅ DONE (2026-03-10) |
| claude-bridge: session persistence to disk | ✅ DONE (2026-03-10) |
| claude-bridge: spawn timeout 30s | ✅ DONE (2026-03-10) |
| Markdown rendering in Chat.tsx | ✅ DONE (2026-03-10) |
| Bug hunt sprint 1: 26/39 issues fixed | ✅ DONE (2026-03-10) |
| Letta XML memory blocks (persona + workspace as XML) | ✅ DONE (2026-03-10) |
| OpenHands microagents (keyword-triggered context) | ✅ DONE (2026-03-10) |
| assistant-ui message parts (tlos_action cards) | ✅ DONE (2026-03-10) |
| Markdown in Omnibar AI messages | ✅ DONE (2026-03-10) |
| agent:context payload bug fixed | ✅ DONE (2026-03-10) |
| Context bar: real token counts from agent:context | ✅ DONE (2026-03-10) |
| Session ID stability (conversationSessionId) | ✅ DONE (2026-03-10) |
| Context summarization (LLM-based compaction at nearLimit) | ✅ DONE (2026-03-10) |
| Omnibar command `mcb` fix (viewport reset) | ✅ DONE (2026-03-10) |
| Letta integration: persistent memory blocks (G3 session) | ✅ DONE (2026-03-10) |
| Domain memory: `<domain_memory>` in system prompt | ✅ DONE — pg+pgvector+liteLLM (vector search, 2026-03-10) |
| SEC: PatchDialog Nostr signature verification | TODO — needs nostr-tools |
| SEC: System prompt file permissions (world-readable) | TODO |
| FEATURE: microagents harkly.md, nostr.md, rust.md | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — future |

## Bug Hunt Status (2026-03-10)

Session 3 additions: 3 more bugs fixed (sessionId, mcb viewport, agent:summarizing filter).
Remaining open: SEC (PatchDialog sig, system prompt permissions).

Priority next:
1. SEC: PatchDialog Nostr signature verification (needs nostr-tools)
2. SEC: System prompt file permissions
3. Summarize Service design (liteLLM chat + pg summaries)

## THELOS Brand System (зафиксировано 2026-02-28)

| Элемент | Значение |
|---|---|
| Концепция | Чёрный квадрат Малевича (апогей) + чёрная дыра (притяжение) + τέλος (завершённость/полнота) |
| Логотип | Монолит — чёрный вертикальный прямоугольник, соотношение 4:5, Супрематизм |
| Шрифт | Helvetica / Neue Haas Grotesk — Швейцария, объективность, сведение к сущности |
| Стиль | Супрематизм — геометрия, никакого декора, формы в пространстве |
| `#000` / `#0A0A0F` | Чёрный — абсолютная форма, финальность |
| `tlos-cyan` | `#06B6D4` (Tailwind cyan-500) |
| `tlos-primary` | `#f2b90d` (золотой акцент) |
| Monolith SVG | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
