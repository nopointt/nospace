---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-10 (session 10 checkpoint 6)
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

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | L2 Kernel Step 3 — REPLACING Zep CE with pg+pgvector+liteLLM direct (Zep CE dead project, embedder broken) | 2026-03-10 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid.ps1 run` | 2026-03-10 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| claude_bridge | tlos-claude-bridge — FULL: XML memory, microagents, stable sessionId, context compaction + Letta + Zep domain context | 2026-03-10 |
| langgraph_bridge | tlos-langgraph-bridge — Python service: NATS → LangGraph (orchestrator→worker) + G3 cyclic subgraph | 2026-03-10 |
| zep_bridge | **REPLACING** — Zep CE v0.27.2 has 2 hardcodes: (1) embedding model ada-002, (2) embedder disabled when expected dims=0. liteLLM proxy works (1536-dim confirmed) but Zep won't call it. Decision: replace with direct pg+pgvector+liteLLM. Stack: db(pgvector) + litellm only. | 2026-03-10 |
| dispatcher | tlos-dispatcher — FIXED (graceful wasm skip, no crash on missing math_worker.wasm) | 2026-03-08 |
| eidolon | Eidolon AI backend LIVE — context summarization, stable sessions, nearLimit compaction, Zep domain context | 2026-03-10 |
| session_continuity | Omnibar: stable `conversationSessionId` per conversation → claude-bridge resumes correctly | 2026-03-10 |
| context_summarization | bridge: nearLimit → summarizeConversation() → new session with `<PREVIOUS_CONTEXT_SUMMARY>` | 2026-03-10 |
| domain_memory | claude-bridge: getDomainContext() → `<domain_memory>` XML block в system prompt (on new session) | 2026-03-10 |
| nim_key_path | ~/.tlos/nim-key — ОБНОВЛЁН 2026-03-10 (новый ключ от nopoint) | 2026-03-10 |

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
| ~~**Zep CE upgrade**~~ — mem0 не давал векторный поиск | zep-bridge | 2026-03-10 | **RESOLVED** — Zep CE Docker stack LIVE (port 8000) |
| **Zep CE vector search** — v0.27 hardcodes ada-002 + embedder "expected 0" dims | zep-bridge | 2026-03-10 | **REPLACING** — Zep CE удаляется. Замена: direct pg+pgvector+liteLLM (zep-client.js rewrite, same API) |
| **liteLLM proxy** — works, 1536-dim via NIM llama-3.2-nv-embedqa-1b-v2 Matryoshka confirmed | zep-bridge | 2026-03-10 | **DONE** — proxy ready, Zep replacement in progress |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы + агент-система как ядро: LangGraph (Python) + Letta (session memory) + Zep/mem0 (domain CMA V1) + Qdrant (vector, TODO); все self-hosted, управляются grid.ps1, общаются через NATS
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Claude AI pipeline:** Omnibar → agent:chat{provider:'claude', model} → NATS → claude-bridge → `claude --print` (stdin) → NATS → Omnibar
  - System prompt: XML memory blocks (`<persona>`, `<workspace>`, `<domain_memory>`) injected
  - Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
  - Session ID stability: Omnibar `conversationSessionId` signal — reused across all messages, reset only on clearContext()
  - Microagents: `agents/eidolon/microagents/*.md` — keyword-triggered context injection per message (OpenHands pattern)
  - Context tracking: `agent:context` event → `payload: { tokensUsed, contextTotal, nearLimit, turns }`
  - **Context compaction:** bridge dual-path — Letta UP: history/summary in Letta blocks (persistent); Letta DOWN: in-memory fallback (`memoryFallback`); on `nearLimit` → `summarizeConversation()` → new Claude session with `<PREVIOUS_CONTEXT_SUMMARY>` injected
  - **Domain memory:** `getDomainContext()` → ZepClient.getContext('development-domain') → `<domain_memory>` injected on new session
  - **agent:zep:add_fact** NATS event → ZepClient.addFact (fire-and-forget)
  - Compaction UI: `agent:summarizing` event → Omnibar shows `⚙️ compacting...` indicator
- **LangGraph pipeline:** tlos.shell.events → tlos-langgraph-bridge → LangGraph (orchestrator→worker) → tlos.shell.broadcast
  - subscribe: `tlos.shell.events`, message type `agent:graph:run`
  - publish: `agent:graph:token` (streaming chunks), `agent:graph:error`, `agent:graph:status`
  - graph.py: GraphState, call_claude_cli (subprocess+stdin), build_graph(), build_g3_subgraph()
  - G3 cyclic subgraph: player→coach→conditional edge (passed/iter≥3→END, else→player)
  - Singleton compiled graph in bridge_handler.py (pre-compile at import)
  - run_in_executor for graph.invoke (async-safe)
- **Zep CE pipeline (V2):** ZepClient в claude-bridge → Zep CE Docker stack (port 8000) → PostgreSQL+pgvector + Neo4j + Graphiti
  - **API VERSION: /api/v1/ (CE edition, NOT /api/v2/ which is Zep Cloud)**
  - zep-client.js: isAvailable, ensureDomain, addFact, getFacts, searchFacts, getContext (6 functions, zero-throw)
  - ensureDomain: POST /api/v1/user (singular) + POST /api/v1/sessions (domain → user + session)
  - addFact: POST /api/v1/sessions/{domain}-session/memory (messages)
  - searchFacts: POST /api/v1/sessions/{domain}-session/search {text, limit} (vector search; fallback substring)
  - getContext: GET /api/v1/sessions/{domain}-session/memory → summary.content (LLM-generated by Zep)
  - Development domain: 14 seed facts, автосид при первом ensureDomain
  - Docker Compose: `core/kernel/tlos-zep-bridge/docker-compose.yml`; config: `config.yaml` (generated from template, gitignored)
  - NIM LLM: Graphiti uses `MODEL_NAME=meta/llama-3.1-70b-instruct` + `OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1`
  - **config.yaml + .env** — gitignored (содержат NIM key); grid.ps1 генерирует из `config.yaml.template` при старте
- **NIM AI pipeline:** Omnibar → agent:chat{provider:'nim'} → NATS → agent-bridge → NVIDIA NIM SSE → NATS → Omnibar
- **Auth:** claude-bridge reads ~/.claude.json, publishes agent:auth:status; Omnibar кэширует в localStorage
- **Frame filtering:** useComponents.ts фильтрует все agent:* events (включая agent:summarizing)
- **Markdown:** Chat.tsx + Omnibar.tsx используют `marked` (GFM+breaks), стили в index.css (.chat-md)
- **tlos_action cards:** Chat.tsx парсит ` ```tlos_action ` блоки → ⚡ карточки
- **MessageStatus:** `kernel.ts` экспортирует `MessageStatus = 'streaming' | 'complete' | 'error'`
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **Agent system architecture:** `docs/agent-system-architecture.md` — L2 Kernel: LangGraph + Letta + Zep + Qdrant внутри tLOS, self-hosted, grid.ps1. Иерархия: Orchestrator(Eidolon) → Chief → Lead → Senior → G3(Coach↔Player). CMA: Session(Letta) → Domain(Zep) → Project(Zep) → Global(Zep).
- **Letta service:** `letta server --port 8283` — optional в grid.ps1; client: `core/kernel/tlos-claude-bridge/letta-client.js`
- **LangGraph service:** `uv run python main.py` — optional в grid.ps1; `core/kernel/tlos-langgraph-bridge/`
- **Zep CE service:** `docker compose up` — optional в grid.ps1; `core/kernel/tlos-zep-bridge/` (port 8000). grid.ps1 генерирует config.yaml из template + NIM key перед стартом.
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. `lettaAgentIds` Map в bridge теряется при рестарте. `asyncio.get_event_loop()` deprecated в Python 3.10+ (bridge_handler.py LOW). model не прокидывается через GraphState в worker_node (LOW). Zep CE graphiti NIM integration нужна верификация (add fact + semantic search test).

## L2 Kernel Roadmap

| Шаг | Задача | Статус |
|-----|--------|--------|
| 1 | Letta self-hosted + tlos-claude-bridge migration | ✅ DONE (G3 TLOS-07) |
| 2 | tlos-langgraph-bridge — Python service + LangGraph + G3 subgraph | ✅ DONE (G3 TLOS-08) |
| 3 | Domain Memory — pg+pgvector+liteLLM (replacing Zep CE, which is dead/broken) | 🔄 IN PROGRESS — liteLLM done, zep-client.js rewrite next |
| 4 | Qdrant self-hosted + Associative Routing | ⬜ TODO |
| 5 | tLOS Agent Frames (agent-status, g3-session, memory-viewer) | ⬜ TODO (параллельно) |

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
| Zep domain memory: <domain_memory> in system prompt | ✅ DONE — V2 Zep CE (semantic search, 2026-03-10) |
| SEC: PatchDialog Nostr signature verification | TODO — needs nostr-tools |
| SEC: System prompt file permissions (world-readable) | TODO |
| FEATURE: microagents harkly.md, nostr.md, rust.md | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — future |

## Bug Hunt Status (2026-03-10)

Session 3 additions: 3 more bugs fixed (sessionId, mcb viewport, agent:summarizing filter).
Remaining open: SEC (PatchDialog sig, system prompt permissions).

Priority next:
1. Verify Zep CE semantic search works (add fact → search → confirm Graphiti NIM extraction)
2. SEC: PatchDialog Nostr signature verification (needs nostr-tools)
3. SEC: System prompt file permissions

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
