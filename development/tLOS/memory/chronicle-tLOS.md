# CHRONICLE — tLOS
> Append-only session log. NEVER overwrite. Only append new entries at the bottom.
> Created: 2026-03-10

---

> **Формат записи:**
> `## [YYYY-MM-DD — сессия N] CLOSE | CHECKPOINT`
> Каждая запись содержит: фазу, решения, изменённые файлы, выполненные/открытые задачи.
> Записи не редактируются после добавления — только исторический факт.

---

## [2026-03-10 — сессия 1] CLOSE

**Phase:** Eidolon backend — первый запуск (system prompt, session persistence, context tracking)

**Decisions:**
- Выбран подход Letta XML memory blocks: `<persona>` + `<workspace>` инжектируются в system-prompt через placeholder `<!-- MEMORY_BLOCKS -->`
- Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
- Context tracking: парсинг `msg.usage` из claude stream → `agent:context` event
- Agent config: `core/agents/eidolon/config.json` (model, contextWindowTokens, пути)
- OpenHands microagents pattern: keyword-triggered context injection из `microagents/*.md`

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — system prompt load, session persistence, context events, microagents
- `core/agents/eidolon/config.json` — создан
- `core/agents/eidolon/system-prompt.md` — создан
- `core/agents/eidolon/memory/persona.md` — создан
- `core/agents/eidolon/memory/workspace.md` — создан
- `core/agents/eidolon/microagents/canvas.md` — создан
- `core/agents/eidolon/microagents/solidjs.md` — создан

**Completed:**
- Eidolon system prompt + memory blocks
- Session persistence to disk
- Context tracking (real token counts)
- Microagents infrastructure
- Markdown rendering in Chat.tsx (marked GFM)
- tlos_action cards in Chat.tsx
- Auth UI + localStorage persistence

**Opened:**
- SEC: PatchDialog Nostr signature verification
- SEC: System prompt file permissions
- FEATURE: microagents harkly.md, nostr.md, rust.md

---

## [2026-03-10 — сессия 2] CLOSE

**Phase:** Bug hunt sprint 1 — исправление критических проблем Omnibar

**Decisions:**
- Bug hunt спринт: 26/39 issues fixed за сессию
- `MessageStatus` type экспортирован из `kernel.ts`
- tlos_action карточки парсятся на уровне Chat.tsx (не bridge)

**Files changed:**
- `core/shell/frontend/src/kernel.ts` — MessageStatus export, ChatMessage interface
- `core/shell/frontend/src/components/Chat.tsx` — tlos_action cards, markdown, AiMessageContent
- `core/shell/frontend/src/components/Omnibar.tsx` — множество bug fixes

**Completed:**
- 26 из 39 bugs fixed (sprint 1)
- Markdown в Omnibar AI сообщениях
- agent:context payload bug fixed
- Context bar с реальными token counts

**Opened:**
- Оставшиеся HIGH bugs: sessionId stability + context summarization

---

## [2026-03-10 — сессия 3] CLOSE

**Phase:** Session continuity + Context compaction + MCB fix — все ARCH/BUG закрыты

**Decisions:**
- `conversationSessionId` — stable signal per conversation в Omnibar; был `crypto.randomUUID()` per-message → сессии никогда не резюмировались
- Context compaction: in-memory `sessionLogs` per sessionId; `nearLimit` → `summarizeConversation()` → new claude session с `<PREVIOUS_CONTEXT_SUMMARY>`
- Compaction in-memory only (не персистируется) — сознательное решение (bridge restart = new context)
- MCB bug: viewport не сбрасывался после `replaceComponents` → фреймы вне видимости
- `agent:summarizing` event фильтруется в useComponents.ts — не спавнит canvas frame

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — sessionLogs, summarizeConversation(), handleChat() rewrite
- `core/shell/frontend/src/components/Omnibar.tsx` — conversationSessionId signal, isSummarizing, agent:summarizing handler, ⚙️ indicator
- `core/shell/frontend/src/App.tsx` — resetViewport() на mcb command
- `core/shell/frontend/src/hooks/useComponents.ts` — agent:summarizing в event filter

**Completed:**
- Session ID stability (conversationSessionId)
- Context summarization (LLM-based compaction at nearLimit)
- MCB viewport reset fix
- agent:summarizing filter в useComponents

**Opened:**
- SEC: PatchDialog Nostr signature verification (nostr-tools)
- SEC: System prompt file permissions (world-readable)
- FEATURE: microagents harkly.md, nostr.md, rust.md
- ARCH: Context compaction summary in-memory only (теряется при рестарте bridge)

---

## [2026-03-10 — сессия 4 — checkpoint 1] CHECKPOINT

**Phase:** Memory system + Agent architecture — сессия продолжается

**Decisions:**
- chronicle-tLOS.md: append-only permanent session log (L3 memory tier); никогда не перезаписывается
- /Tcheckpoint: mid-session state save протокол — обновляет handshake + current-context + chronicle без git commit
- /closeTsession обновлён: STEP 3.5 — append to chronicle при каждом close
- /startTsession обновлён: STEP 3 — обязательное чтение chronicle в полном объёме
- Агент-система = tLOS L2 Kernel (не внешние сервисы): LangGraph + Letta + Zep + Qdrant, self-hosted Docker, NATS transport
- Иерархия: Orchestrator (Eidolon/L1) → Chief (L2) → Lead (L3) → Senior (L4) → G3:Coach+Player (L5)
- CMA: 5-level memory — Session (Letta), Domain (Zep), Project (Zep), Global (Zep), Special (Lead→Senior distillation)
- Шаги реализации: Letta first (решает compaction persistence) → LangGraph bridge → Zep → Qdrant → Agent Frames

**Files changed:**
- `memory/chronicle-tLOS.md` — СОЗДАН
- `~/.claude/commands/Tcheckpoint.md` — СОЗДАН
- `~/.claude/commands/closeTsession.md` — обновлён (STEP 3.5)
- `~/.claude/commands/startTsession.md` — обновлён (STEP 3 chronicle)
- `nospace/docs/agent-system-architecture.md` — обновлён (tLOS как L2 Kernel, Layer Map, grid.ps1 integration)
- `memory/current-context-tLOS.md` — обновлён (agent architecture, tech debt note)

**In progress:**
- Eidolon backend: все ARCH/BUG закрыты; SEC открыты
- Агент-система: архитектура зафиксирована, реализация не начата
- Следующий шаг: Letta self-hosted (Шаг 1)

---

## [2026-03-10 — сессия 5 — checkpoint 2] CHECKPOINT

**Phase:** L2 Kernel Step 1 — Letta integration (G3 session TLOS-07) — COMPLETE

**Decisions:**
- Docker недоступен → Letta via `uv tool install letta` (pip-based, no Docker) — v0.16.6
- G3 protocol с встроенными Agent tool агентами (backend-developer, code-reviewer) вместо Qwen CLI
- Параллельный запуск: Player A + B одновременно; когда B готов → Coach B + Player C параллельно
- `lettaAgentIds` Map in-process only (не персистируется) — V1 known debt, решить в follow-up
- letta-client.js: built-in fetch только, zero external deps, zero throws, 30s isAvailable кэш
- index.js dual-path: Letta UP → LettaClient.*, Letta DOWN → memoryFallback (silent fallback)
- Startup warning fires once (module-level .then()), не на каждый handleChat вызов

**Files changed:**
- `core/kernel/tlos-claude-bridge/letta-client.js` — СОЗДАН (124 строки, 6 async функций)
- `core/kernel/tlos-claude-bridge/index.js` — sessionLogs удалён, Letta dual-path добавлен
- `core/grid.ps1` — letta service entry + pre-flight + stop-by-port + status health check + help text
- `g3-plan/current_requirements.md` — СОЗДАН (REQ-001…REQ-006 requirements contract)
- `g3-plan/player-b-spec.md` — СОЗДАН
- `g3-plan/player-c-spec.md` — СОЗДАН
- `g3-plan/todo.g3.md` — все 3 turn DONE
- `.g3/sessions/review-turn-1.md` — СОЗДАН (TURN_A_APPROVED)
- `.g3/sessions/review-turn-2.md` — СОЗДАН (TURN_B_APPROVED)
- `.g3/sessions/review-turn-3.md` — СОЗДАН (IMPLEMENTATION_APPROVED)
- `memory/current-context-tLOS.md` — обновлён
- `memory/handshake-tLOS.md` — перезаписан

**Completed:**
- G3 session TLOS-07-LETTA-MEMORY: все 3 Turn APPROVED
- Letta v0.16.6 установлен (uv tool, ~/.local/bin/letta)
- letta-client.js создан и верифицирован (syntax OK, graceful degradation OK)
- index.js migrated: sessionLogs → Letta dual-path (syntax OK)
- grid.ps1 обновлён: 4 изменения (service entry, pre-flight, stop, status)
- Первая G3 сессия с встроенными Agent tool агентами как Players — протокол работает

**In progress:**
- SEC items (PatchDialog sig, system prompt permissions)

**Opened:**
- V1 tech debt: lettaAgentIds не персистируется → agentId теряется при рестарте bridge
- Следующий G3: SEC — PatchDialog Nostr signature verification

**Notes:**
- Player A (backend-developer) застрял на долгом pip install — остановлен вручную, grid.ps1 изменения сделаны Orchestrator напрямую
- Coach Review agents не имеют Bash доступа → runtime checks (node --check, curl) выполнял Orchestrator
- G3 каскадный паттерн работает: B и C запустились параллельно; Coach reviews также параллельно с следующим Player

---

## [2026-03-10 — сессия 6 — checkpoint 3] CHECKPOINT

**Phase:** L2 Kernel Step 2 — tlos-langgraph-bridge (G3 session TLOS-08) — COMPLETE

**Decisions:**
- TLOS-08 каскад строго последовательный (A→B→C) — все три Player пишут в одни файлы (graph.py, bridge_handler.py)
- tlos-langgraph-bridge использует subprocess + claude CLI (НЕ Anthropic SDK) — API key не нужен
- Singleton pattern в bridge_handler: граф компилируется один раз при импорте (не per-request)
- run_in_executor для graph.invoke — asyncio event loop не блокируется во время subprocess
- build_g3_subgraph() standalone — вызывается напрямую, не через build_graph()
- G3 conditional edge: passed OR iter≥3 → END; else → player (max 3 iterations)

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/pyproject.toml` — СОЗДАН (uv-managed, nats-py + langgraph + anthropic)
- `core/kernel/tlos-langgraph-bridge/main.py` — СОЗДАН (asyncio.run entry point)
- `core/kernel/tlos-langgraph-bridge/bridge.py` — СОЗДАН (NATS connect + subscribe + publish, deferred bridge_handler import)
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — СОЗДАН (singleton graph, handle_graph_run, streaming, zero-raise)
- `core/kernel/tlos-langgraph-bridge/graph.py` — СОЗДАН (GraphState, call_claude_cli, orchestrator+worker nodes, build_graph, G3State, g3_player_node, g3_coach_node, g3_should_continue, build_g3_subgraph)
- `core/grid.ps1` — обновлён (langgraph service entry + pre-flight uv check + stop WMI + status WMI)
- `g3-plan/tlos-08-requirements.md` — СОЗДАН (REQ-001…006)
- `g3-plan/tlos-08-player-a.md` — СОЗДАН
- `g3-plan/tlos-08-player-b.md` — СОЗДАН
- `g3-plan/tlos-08-player-c.md` — СОЗДАН
- `g3-plan/todo.g3.md` — обновлён (TLOS-08 entries)
- `.g3/sessions/tlos-08-review-a.md` — СОЗДАН (TURN_A_APPROVED)
- `.g3/sessions/tlos-08-review-b.md` — СОЗДАН (TURN_B_APPROVED)
- `.g3/sessions/tlos-08-review-c.md` — СОЗДАН (IMPLEMENTATION_APPROVED)
- `memory/current-context-tLOS.md` — обновлён (L2 Kernel roadmap, langgraph_bridge row, arch snapshot)
- `memory/handshake-tLOS.md` — перезаписан

**Completed:**
- G3 session TLOS-08-LANGGRAPH: все 3 Turn APPROVED
- tlos-langgraph-bridge создан и верифицирован (syntax OK, imports OK, conditional edge logic OK)
- grid.ps1 обновлён: langgraph optional service (4 точки)
- L2 Kernel Steps 1+2 оба DONE

**In progress:**
- SEC items (PatchDialog Nostr sig, system prompt permissions)

**Opened:**
- LOW: asyncio.get_event_loop() deprecated → нужен get_running_loop() в bridge_handler.py
- LOW: model не прокидывается через GraphState в worker_node

**Notes:**
- G3 каскад TLOS-08 строго последовательный (нельзя запустить B параллельно с A из-за общих файлов)
- Orchestrator выполнял Coach роль напрямую (runtime bash checks + write review files)
- Все три Players завершились успешно без ручного вмешательства

---

## [2026-03-10 — сессия 7 — checkpoint 4] CHECKPOINT

**Phase:** L2 Kernel Step 3 — Zep domain memory V1 LIVE (mem0), Zep CE upgrade BLOCKED on Docker

**Decisions:**
- TLOS-09 G3 каскад: Player A не нашёл Zep CE для Windows → выбрал mem0 fallback без эскалации (ошибка протокола)
- Retroactive решение: заменить mem0 на Zep CE после установки Docker Desktop
- NIM API ключ использовать для Zep CE embeddings (localStorage: `~/.tlos/nim-key`)
- G3 Player блокер → протокол: эскалировать nopoint, не принимать fallback автономно
- zep-client.js: внутри claude-bridge (как letta-client.js), не отдельный NATS-сервис

**Files changed:**
- `core/kernel/tlos-claude-bridge/zep-client.js` — СОЗДАН (full API: isAvailable, ensureDomain, addFact, getFacts, searchFacts, getContext; 12 seed facts)
- `core/kernel/tlos-zep-bridge/mem0-wrapper.py` — СОЗДАН (FastAPI+SQLite, port 8001, Zep-compatible API)
- `core/kernel/tlos-claude-bridge/index.js` — ИЗМЕНЁН (ZepClient import, startup init, getDomainContext, domain_memory в system prompt, agent:zep:add_fact handler)
- `core/grid.ps1` — ИЗМЕНЁН (zep service entry + pre-flight uv/mem0-wrapper check + stop WMI + status HTTP)
- `g3-plan/tlos-09-requirements.md` — СОЗДАН
- `g3-plan/tlos-09-player-{a,b,c}.md` — СОЗДАНЫ
- `.g3/sessions/tlos-09-review-{a,b,c}.md` — СОЗДАНЫ (все APPROVED)
- `g3-plan/todo.g3.md` — обновлён (TLOS-09 все Turn DONE)
- `~/.tlos/nim-key` — ОБНОВЛЁН (новый ключ от nopoint)

**Completed:**
- G3 session TLOS-09-ZEP: все 3 Turn APPROVED
- Zep domain memory V1 LIVE: `<domain_memory>` блок в Eidolon system prompt на новых сессиях
- Development domain: 12 seed фактов о текущем состоянии tLOS

**In progress:**
- Docker Desktop установка (передана nopoint вручную)
- Zep CE upgrade (BLOCKED)

**Opened:**
- BLOCKER: Zep CE upgrade — ждём Docker Desktop от nopoint
- LESSON: G3 блокер → эскалировать, не выбирать fallback автономно

**Notes:**
- mem0-wrapper.py — только substring search, нет векторного поиска, нет temporal graph, нет автоэкстракции
- Zep CE upgrade план: Docker → `ghcr.io/getzep/zep:latest` → конфиг с NIM API для embeddings → заменить port 8001 → обновить zep-client.js под Zep CE API
- NIM key `nvapi-wIb4Owx...` — временный (12ч), обновить при истечении

---

## [2026-03-10 — сессия 8] CLOSE

**Phase:** L2 Kernel Step 3 UPGRADE — Zep CE Docker stack LIVE (replaces mem0 V1)

**Decisions:**
- Zep CE v0.27.2 требует `config.yaml` файл (env vars через `environment:` не достаточны для `store.type`)
- config.yaml монтируется как `/app/config.yaml:ro`; grid.ps1 генерирует его из `config.yaml.template` + NIM key при каждом старте
- Graphiti использует NIM как OpenAI-compatible LLM backend (`OPENAI_BASE_URL` + `MODEL_NAME`)
- zep-client.js переписан: факты → Zep sessions (messages), semantic search → `POST /api/v2/graph/search`
- Docker Desktop WSL2 backend работает (v29.2.1); Hyper-V не нужен
- 3 итерации конфига в процессе отладки: pagecache env var bug → ZEP_STORE_TYPE → port 0 → config.yaml

**Files changed:**
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — СОЗДАН (4 сервиса: db, neo4j, graphiti, zep)
- `core/kernel/tlos-zep-bridge/config.yaml.template` — СОЗДАН (шаблон конфига Zep CE с NIM key placeholder)
- `core/kernel/tlos-zep-bridge/config.yaml` — СОЗДАН (generated, gitignored)
- `core/kernel/tlos-zep-bridge/.env` — СОЗДАН (generated, gitignored)
- `core/kernel/tlos-claude-bridge/zep-client.js` — ПОЛНОСТЬЮ ПЕРЕПИСАН (Zep CE API, port 8000, semantic search)
- `core/grid.ps1` — ОБНОВЛЁН (4 точки: Services cmd, run preflight + config.yaml gen, stop docker compose, status port 8000)

**Completed:**
- L2 Kernel Step 3 DONE: Zep CE Docker stack LIVE — 200 OK на `GET /healthz:8000`
- pgvector HNSW indexes созданы (message_embedding, summary_embedding)
- zep-client.js совместим с существующим index.js API (isAvailable, ensureDomain, addFact, getContext)

**Opened:**
- VERIFY: Zep CE semantic search нужна проверка (Graphiti NIM entity extraction)
- GITIGNORE: config.yaml + .env нужно добавить в .gitignore tlos-zep-bridge
- SEC items остаются открытыми (PatchDialog Nostr sig, system prompt permissions)

---

## [2026-03-10 — сессия 9 — checkpoint 5] CHECKPOINT

**Phase:** L2 Kernel Step 3 — Zep CE vector search investigation — BLOCKED, substring fallback ACCEPTED

**Decisions:**
- Zep CE v0.27.2 hardcodes `text-embedding-ada-002` (1536-dim OpenAI model) для embeddings; значение `llm.model` в конфиге игнорируется для embeddings
- `llm.service` поддерживает только `openai` и `anthropic` (не `local`) — проверено experimentally
- `nlp.server_url` в Zep CE используется для NER (named entity recognition), НЕ для vector embeddings
- NIM не имеет модели `text-embedding-ada-002` → всегда 404 на vector search
- Решение: substring fallback в zep-client.js уже реализован — достаточен для domain memory use case
- nlp-server добавлен в стек (для NER Graphiti), model кэшируется в `zep_nlp_cache` Docker volume
- Docker Desktop правило зафиксировано в MEMORY.md: все Docker операции только через Docker Desktop

**Files changed:**
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — добавлен nlp сервис (zep-nlp-server), zep_nlp_cache volume, python3 healthcheck (wget не установлен в образе), убраны ZEP_EMBEDDINGS_* env vars
- `core/kernel/tlos-zep-bridge/config.yaml.template` — итоговый вид: `llm.service: openai`, `nlp.server_url: http://nlp:5557`; перебрали: nvidia/nv-embed-v1, embeddings секция, ZEP_EMBEDDINGS_MODEL env var, service: local — все не работают
- `~/.tlos/nim-key` — обновлён новым ключом `nvapi-Nr1pEDT...KTG2`
- `~/.claude/projects/.../memory/MEMORY.md` — добавлено правило Docker Desktop

**Completed:**
- NIM key обновлён и применён
- Диагностика: debug logging подтвердил что Zep вызывает `POST https://integrate.api.nvidia.com/v1/embeddings` (правильный URL) но с hardcoded model → 404
- nlp-server healthcheck исправлен (python3 вместо wget)
- zep_nlp_cache volume — модель all-MiniLM-L6-v2 кэшируется, не скачивается при каждом recreate

**In progress:**
- Zep container в crash loop (`service: local` невалидно) — нужен force-recreate с `service: openai`

**Opened:**
- DECISION: оставить nlp-server или убрать (только для NER, не нужен если NER не используется, ~450MB RAM)

**Notes:**
- Потрачено значительное время на итерации конфига: 6+ попыток (openai_endpoint_url → openai_endpoint → nvidia/nv-embed-v1 как model → embeddings секция → ZEP_EMBEDDINGS_* env vars → service:local)
- Все попытки настроить NIM embeddings провалились — ограничение Zep CE v0.27 архитектурное
- Для решения нужен либо: upgrade Zep CE до версии с поддержкой custom embedding model, либо OpenAI ключ, либо substring fallback (принято)

---

## [2026-03-10 — сессия 10 — checkpoint 6] CHECKPOINT

**Phase:** L2 Kernel Step 3 — liteLLM proxy DONE, Zep CE replacement APPROVED

**Decisions:**
- liteLLM proxy (ghcr.io/berriai/litellm:main-latest) развёрнут и работает: маппинг `text-embedding-ada-002` → `nvidia/llama-3.2-nv-embedqa-1b-v2` (Matryoshka, dims=1536, input_type=query, encoding_format=float)
- Подтверждено curl: liteLLM возвращает 1536-dim embeddings через NIM — идеальное совпадение с pgvector schema
- Zep CE v0.27.2 имеет ВТОРОЙ hardcode: при старте вычисляет "expected 0" dims для embeddings → embedder никогда не активируется, даже с liteLLM proxy
- NIM модель `nv-embed-v1` — fixed 4096-dim, НЕ поддерживает Matryoshka. `llama-3.2-nv-embedqa-1b-v2` — поддерживает, подтверждено NVIDIA Developer Forums
- NIM embedding API требует `encoding_format: float` и `input_type` для асимметричных моделей — исправлено в litellm-config.yaml
- **РЕШЕНИЕ: полностью заменить Zep CE** на direct pg+pgvector+liteLLM. zep-client.js переписывается с тем же API (addFact, getContext, searchFacts). docker-compose сокращается до 2 контейнеров (db + litellm). Экономия ~1.4GB RAM
- Zep CE discontinued April 2025 (подтверждено blog.getzep.com). Open source фокус сместился на Graphiti
- Summarize Service будет реализован через liteLLM chat/completions + pg таблицу summaries (не через Zep built-in summarizer)

**Files changed:**
- `core/kernel/tlos-zep-bridge/litellm-config.yaml` — NEW: liteLLM proxy config (2 model mappings: embedding + chat)
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — добавлен litellm сервис, восстановлен nlp, обновлён zep depends_on
- `core/kernel/tlos-zep-bridge/config.yaml.template` — openai_endpoint изменён на http://litellm:4000/v1
- `memory/current-context-tLOS.md` — обновлён project_phase, zep_bridge status, blockers, L2 roadmap step 3
- `memory/handshake-tLOS.md` — переписан с новым состоянием

**Completed:**
- liteLLM Docker container deployed, healthy, tested (port 4000)
- NIM embedding через liteLLM: 1536-dim confirmed (curl test)
- Исследование: Zep CE source analysis — embedder disabled by "expected 0" dims (unfixable without Go code changes)
- Исследование: NVIDIA NIM embedding models — nv-embed-v1 (4096 fixed) vs llama-3.2-nv-embedqa-1b-v2 (Matryoshka, configurable)
- Решение по архитектуре: Zep CE → pg+pgvector+liteLLM (одобрено nopoint)

**In progress:**
- Rewrite zep-client.js → direct pg+liteLLM calls (same API surface)
- Simplify docker-compose: db + litellm only (remove zep, graphiti, neo4j, nlp)

**Opened:**
- ARCH: Summarize Service design (liteLLM chat + pg summaries table + trigger mechanism)
- Update agent-system-architecture.md: Zep → pg+liteLLM в Layer Map

**Notes:**
- liteLLM image pull ~1 min, container ~120MB RAM, startup ~5s — lightweight
- liteLLM requires NIM_API_KEY env var (mapped from NIM_KEY in docker-compose)
- Zep Graphiti (OSS) — actively maintained, can be re-added later for knowledge graph (L2 Step 4+)
- Текущий стек: 6 контейнеров (~1.6GB RAM). После замены: 2 контейнера (~160MB RAM). Огромная экономия для 3.7GB WSL2 limit

---

## [2026-03-10 — сессия 10 — checkpoint 7] CHECKPOINT

**Phase:** L2 Kernel Step 3 — **DONE**. Zep CE fully replaced with pg+pgvector+liteLLM.

**Decisions:**
- zep-client.js полностью переписан: direct pg (Pool, `tlos_facts` table) + liteLLM /v1/embeddings (NIM Matryoshka 1536-dim)
- docker-compose.yml упрощён: 2 сервиса (db + litellm), удалены zep, graphiti, neo4j, nlp
- pg exposed on port 5433 (не 5432 — конфликт с локальным PostgreSQL 17.9 на Windows)
- npm `pg` package добавлен в claude-bridge dependencies
- tlos_facts schema: id SERIAL, domain VARCHAR, content TEXT, metadata JSONB, embedding vector(1536), created_at TIMESTAMPTZ
- HNSW cosine index (`vector_cosine_ops`) создаётся автоматически при ensureSchema()
- 14 seed facts авто-вставляются с embeddings при первом ensureDomain('development-domain')
- Fallback: substring search если liteLLM недоступен
- API surface сохранён: isAvailable, ensureDomain, addFact, getFacts, searchFacts, getContext

**Files changed:**
- `core/kernel/tlos-claude-bridge/zep-client.js` — ПОЛНОСТЬЮ ПЕРЕПИСАН: pg Pool + liteLLM fetch → tlos_facts table + vector search
- `core/kernel/tlos-claude-bridge/package.json` — добавлен `pg` dependency
- `core/kernel/tlos-claude-bridge/package-lock.json` — NEW (npm install pg)
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — упрощён до 2 сервисов (db:5433 + litellm:4000)
- `core/kernel/tlos-zep-bridge/litellm-config.yaml` — обновлены комментарии (primary service, не "remaps Zep")
- `memory/current-context-tLOS.md` — обновлён: Step 3 DONE, Architecture Snapshot переписан
- `memory/handshake-tLOS.md` — переписан с финальным состоянием

**Completed:**
- zep-client.js rewrite: all 6 API functions working with direct pg+liteLLM
- Vector semantic search CONFIRMED: query "NIM embedding Matryoshka" → top result "L2 Kernel Step 3" (score 0.362)
- docker-compose simplified: 6 → 2 containers. RAM: ~1.6GB → ~811MB
- 4 containers removed: zep (unhealthy), graphiti, neo4j, nlp
- Port conflict resolved: Docker pg on 5433, local PG on 5432
- Git commit + push: submodule (feat: replace Zep CE) + nospace (feat: submodule pointer)
- L2 Kernel Step 3 roadmap status → ✅ DONE

**In progress:**
- (nothing — Step 3 complete)

**Opened:**
- CLEANUP: grid.ps1 may reference Zep-specific startup
- CLEANUP: config.yaml.template, mem0-wrapper.py — legacy files
- DOCS: agent-system-architecture.md needs update (Zep → pg+liteLLM)
- ARCH: Summarize Service design (liteLLM chat + pg summaries)

**Notes:**
- liteLLM container ~790MB RAM (heavier than expected from checkpoint 6 estimate of ~120MB — Python runtime overhead)
- db container ~20MB RAM — very lightweight
- Total stack ~811MB vs previous ~1.6GB — saved ~800MB
- Local PostgreSQL 17.9 running on Windows caused initial connection failure (role "zep" does not exist) — resolved by mapping Docker port to 5433

---

## [2026-03-10 — checkpoint 8] CHECKPOINT

**Phase:** L2 Kernel Step 4 — DONE. Qdrant self-hosted + Associative Routing fully implemented.

**Decisions:**
- G3 подход: Coach написал 3 спеки (spec-a-docker, spec-b-client, spec-c-integration), Player A + Player B запущены параллельно (async agents via Agent tool)
- Qdrant healthcheck: `bash -c ':> /dev/tcp/localhost/6333'` — python3/curl нет в qdrant образе, bash tcp единственный вариант
- Associative Routing: tlos-global коллекция для всех доменов; djb2 для dedup; per-message searchAssociative; двойная запись (pg + Qdrant) при add_fact
- djb2 → детерминированные int IDs — upsert идемпотентен

**Files changed:**
- `core/kernel/tlos-claude-bridge/qdrant-client.js` — NEW: Qdrant REST client (isAvailable, ensureCollection, upsert, addGlobal, search, searchAssociative)
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — добавлен qdrant/qdrant:v1.13.0 (6333/6334, qdrant_data, bash tcp healthcheck)
- `core/kernel/tlos-claude-bridge/index.js` — QdrantClient: import + startup init + per-message assoc search + addGlobal sync
- `branches/feat-qdrant-v1/spec-a-docker.md` — NEW
- `branches/feat-qdrant-v1/spec-b-client.md` — NEW
- `branches/feat-qdrant-v1/spec-c-integration.md` — NEW
- `memory/current-context-tLOS.md` — Step 4 DONE, Architecture Snapshot обновлён
- `memory/handshake-tLOS.md` — переписан

**Completed:**
- qdrant-client.js: 6 функций, zero-throw, native fetch
- searchAssociative тест: query "spatial OS SolidJS" → score 0.638 (semantic match confirmed)
- Dedup тест: повторный addGlobal → кол-во results не растёт
- Docker stack: 3 containers healthy (db:21MB + litellm:791MB + qdrant:49MB = ~861MB)
- Git commit + push: submodule + nospace pointer
- L2 Step 4 → ✅ DONE

**In progress:**
- (nothing — Step 4 complete)

**Opened:**
- L2 Step 5: tLOS Agent Frames (agent-status, g3-session, memory-viewer)
- SEED: sync tlos_facts seed data → tlos-global Qdrant при старте bridge

**Notes:**
- Player B завершился ~34s (1 tool call), Player A ~95s (5 tool calls включая docker compose up)
- gRPC порт 6334 expose для будущего использования

---

## [2026-03-10 — сессия 11] CLOSE

**Phase:** Архитектурная сессия — роадмап зафиксирован, desktop shortcut создан

**Decisions:**
- `docs/agent-system-architecture.md` v3 = единственный источник истины по роадмапу (L2+L3+L4+Dockerization)
- Always-On Kernel концепция: всё кроме Tauri Shell → Docker с restart:unless-stopped
- Desktop shortcut = простой .lnk на tlos-app.exe (kernel всегда up → shell открывается мгновенно)
- Следующий приоритет: Dockerization (D1–D6), затем L2 Step 5

**Files changed:**
- `docs/agent-system-architecture.md` — ПОЛНОСТЬЮ ПЕРЕПИСАН v2→v3: статус каждого компонента, L3/L4 роадмап, Dockerization раздел, Shell Shortcut
- `AppData/Local/tLOS/monolith.ico` — создан (Pillow RGBA, PNG-in-ICO, прозрачный фон)
- `Desktop/tLOS.lnk` — создан desktop shortcut на tlos-app.exe
- `~/.claude/projects/.../memory/MEMORY.md` — роадмап nav ref + Docker stack обновлён

**Completed:**
- agent-system-architecture.md актуализирован (было: v2 устаревший, стало: v3 с реальным статусом)
- Desktop shortcut tLOS.lnk создан
- MEMORY.md: roadmap doc зафиксирован как главный навигационный документ

**Opened:**
- Dockerization D1-D6 (следующая сессия)
- Icon transparency: возможно работает (прозрачность A=0 подтверждена), но тёмные обои делают её неразличимой — нужно проверить на светлом фоне

---

## [2026-03-10 — сессия 12] CLOSE

**Phase:** Dockerization D1+D2+D4 — All kernel AI services now have Dockerfiles + unified compose

**Decisions:**
- G3 methodology used for all 3 Docker tasks: Qwen as Player, Claude as Coach
- D1+D2 ran in parallel (independent Dockerfiles), D4 depended on both
- NATS stays native on host; Docker containers connect via `host.docker.internal:4222`
- `bridge.py` NATS_URL hardcoded → env var (required for Docker networking)
- claude CLI installed inside both bridge containers (both invoke `claude --print` via subprocess)
- Build context = `core/` for both Dockerfiles (preserves `../../agents/eidolon` path resolution)
- Unified compose at `core/kernel/docker-compose.yml` (replaces zep-only compose)
- grid.ps1: letta/langgraph/claude-bridge removed from native services → new `docker-kernel` service

**Files changed:**
- `core/kernel/tlos-claude-bridge/Dockerfile` — CREATE (node:22-alpine + claude CLI)
- `core/kernel/tlos-claude-bridge/.dockerignore` — CREATE
- `core/kernel/tlos-langgraph-bridge/Dockerfile` — CREATE (python:3.12-slim + Node22 + uv + claude CLI)
- `core/kernel/tlos-langgraph-bridge/.dockerignore` — CREATE
- `core/kernel/tlos-langgraph-bridge/bridge.py` — PATCH: NATS_URL hardcode → env var
- `core/kernel/docker-compose.yml` — CREATE: unified 6-service compose
- `core/grid.ps1` — PATCH: removed native letta/langgraph/claude-bridge; added docker-kernel
- `branches/docker-v1/spec-d1.md` — CREATE (G3 spec)
- `branches/docker-v1/spec-d2.md` — CREATE (G3 spec)
- `branches/docker-v1/spec-d4.md` — CREATE (G3 spec)

**Completed:**
- D1: Dockerfile tlos-claude-bridge ✅ (Coach verified: build OK, `which claude` → found)
- D2: Dockerfile + bridge.py patch tlos-langgraph-bridge ✅ (Coach verified: build OK, imports OK)
- D4: Unified docker-compose + grid.ps1 cleanup ✅ (`docker compose config` + build OK)
- Git commit: `ed249b9` in core submodule, `5e5e235` in nospace docker-v1 branch

**Opened:**
- D5: Docker Desktop autostart + `core/kernel/.env` для NIM_KEY
- D6: Shell shortcut (зависит от D5)

---

## [2026-03-10 — сессия 13] CLOSE

**Phase:** L2 Kernel 4/5 DONE. Always-On Docker Kernel полностью operational — все 6 сервисов connected.

**Decisions:**
- NATS должен слушать на `0.0.0.0`, а не `127.0.0.1` — иначе Docker контейнеры не могут достучаться через `host.docker.internal`
- Inter-container URLs через Docker service names (не localhost): `qdrant:6333`, `litellm:4000`, `letta:8283`, `db:5432`
- `zep-client.js` → `domain-memory.js` — убрано legacy Zep брендирование, клиент переименован в DomainMemory

**Files changed:**
- `core/grid.ps1` — NATS: `-a 127.0.0.1` → `-a 0.0.0.0`
- `core/kernel/tlos-langgraph-bridge/Dockerfile` — добавлен `PYTHONUNBUFFERED=1`
- `core/kernel/tlos-claude-bridge/qdrant-client.js` — `localhost:6333` → `process.env.QDRANT_URL`
- `core/kernel/tlos-claude-bridge/letta-client.js` — `localhost:8283` → `process.env.LETTA_URL`
- `core/kernel/tlos-claude-bridge/zep-client.js` — `localhost` → `process.env.DB_HOST/DB_PORT`; `localhost:4000` → `process.env.LITELLM_URL`
- `core/kernel/tlos-claude-bridge/domain-memory.js` — CREATE (копия zep-client.js — новое имя модуля)
- `core/kernel/tlos-claude-bridge/index.js` — `ZepClient` → `DomainMemory`; log messages cleaned (убраны "Zep" упоминания)
- `core/kernel/tlos-claude-bridge/Dockerfile` — `zep-client.js` → `domain-memory.js`
- `core/kernel/docker-compose.yml` — добавлены env vars для claude-bridge: QDRANT_URL, LITELLM_URL, LETTA_URL, DB_HOST, DB_PORT

**Completed:**
- NATS connectivity fix для Docker стека ✅
- Inter-container networking fix (все клиенты используют service names) ✅
- ZepClient → DomainMemory rename ✅
- All 6 containers verified online: Qdrant `associative routing enabled` + Domain memory `development domain ready` + NATS `connected` + `online claude-sonnet-4-6` ✅
- Git commits: `3114745` (NATS fix + PYTHONUNBUFFERED), `c68a9de` (networking + DomainMemory rename)

**Opened:**
- D5: Docker Desktop autostart + `core/kernel/.env` для NIM_KEY
- CLEANUP: удалить `zep-client.js` (orphaned legacy)

---

## [2026-03-10 — сессия 14] CLOSE

**Phase:** Dockerization D1–D6 ALL DONE. Always-On Kernel complete. Seed sync pg→Qdrant.

**Decisions:**
- D5: `core/kernel/.env` с NIM_KEY — gitignored, Docker Compose читает автоматически
- D6: Desktop/tLOS.lnk уже существовал (сессия 11) — считается done
- Seed sync: `index.js` при старте bridge → `getFacts(50)` → `addGlobal` each fact (idempotent, djb2 dedup)
- `agent-system-architecture.md` обновлён: Docker stack (6 сервисов), D1-D6 все ✅, domain-memory.js

**Files changed:**
- `core/kernel/.env` — CREATE (NIM_KEY, gitignored)
- `core/kernel/tlos-claude-bridge/index.js` — seed sync pg→Qdrant на startup
- `docs/agent-system-architecture.md` — Docker stack актуализирован (D1-D6 DONE)
- `development/tLOS/branches/docker-v1/spec-d5.md` — CREATE (D5 documentation)

**Completed:**
- D5 ✅ — NIM_KEY .env создан, Docker Compose подхватывает
- Seed sync ✅ — pg facts синкаются в Qdrant на startup
- agent-system-architecture.md ✅ — актуальный статус всех компонентов
- Dockerization D1-D6 ALL DONE ✅

**Opened:**
- Docker Desktop autostart — ручной шаг nopoint (Settings → General)
- Rebuild claude-bridge нужен для seed sync (index.js изменён)
- CLEANUP: zep-client.js + config.yaml.template + mem0-wrapper.py (rm отклонён дважды)
- L2 Step 5: Agent Frames — следующий приоритет

---

## [2026-03-10 — сессия 15] CLOSE

**Phase:** L2 Kernel ALL DONE 5/5. Agent Frames shipped. docker-v1 merged → main.

**Decisions:**
- Agent Frames реализованы через NATS request/response: kernel:ping → kernel:status, memory:get-facts/search → memory:facts/search-results
- G3SessionFrame использует существующий LangGraph pipeline (agent:graph:run/token/status/error) без изменений в backend
- Legacy файлы не удаляются — архивируются в `core/kernel/archive/` (новое правило nopoint)
- docker-v1 branch merged → main (fast-forward не получилось, merge commit feb4d72)

**Files changed:**
- `core/shell/frontend/src/types/frame.ts` — +3 типа: agent-status, memory-viewer, g3-session
- `core/shell/frontend/src/components/frames/AgentStatusFrame.tsx` — CREATE
- `core/shell/frontend/src/components/frames/MemoryViewerFrame.tsx` — CREATE
- `core/shell/frontend/src/components/frames/G3SessionFrame.tsx` — CREATE
- `core/shell/frontend/src/data/kernel-frames.ts` — CREATE
- `core/shell/frontend/src/data/g3-frames.ts` — CREATE
- `core/shell/frontend/src/components/DynamicComponent.tsx` — +3 imports + Switch cases
- `core/shell/frontend/src/App.tsx` — +kernel + g3 Omnibar commands
- `core/kernel/tlos-claude-bridge/index.js` — +kernel:ping, memory:get-facts, memory:search handlers
- `core/kernel/archive/` — CREATE: zep-client.js, config.yaml.template, mem0-wrapper.py

**Completed:**
- L2 Step 5 Agent Frames ✅ — все 3 фрейма реализованы
- Cleanup legacy files ✅ — заархивированы в core/kernel/archive/
- docker-v1 branch merged → main ✅ (commit feb4d72, pushed)

**Opened:**
- Rebuild claude-bridge нужен для kernel:ping + memory handlers
- L3 Step 6 — Agent Hierarchy (новая ветка l3-agents)
- docker-v1 remote branch — удалить вручную: git push origin --delete docker-v1
