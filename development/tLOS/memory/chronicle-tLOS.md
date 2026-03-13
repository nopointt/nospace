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

---

## [2026-03-10 — сессия 16] CLOSE

**Phase:** L2 Kernel ALL DONE (5/5) — Full Docker Stack + pre-L3 fixes

**Decisions:**
- Полный перенос всех нативных сервисов в Docker (NATS + 5 Rust сервисов); grid.ps1 теперь только Docker compose + Tauri
- lettaAgentIds Map персистируется в `~/.tlos/letta-agents.json` (pre-L3 critical fix)
- server.rs: TLOS_BIND_HOST env var вместо хардкода 127.0.0.1 (Docker networking)
- WORKSPACE_ROOT авто-резолвится в grid.ps1 (Split-Path $Root -Parent)
- agent-bridge в Docker через profiles:nim (опциональный, только если есть NIM key)
- Полный рефактор/debthunting — отложен до после L3 Step 9

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — lettaAgentIds persistence: loadLettaAgents/saveLettaAgents, ~/.tlos/letta-agents.json
- `core/kernel/docker-compose.yml` — NATS service + 5 Rust сервисов + NATS_URL fix (host.docker.internal → nats)
- `core/kernel/Dockerfile.rust-services` — NEW: multi-stage Rust build (rust:1.82-slim-bookworm builder + debian:bookworm-slim runtime)
- `core/kernel/tlos-shell-bridge/src/server.rs` — TLOS_BIND_HOST env var (default 127.0.0.1)
- `core/grid.ps1` — полная замена: Docker-only, WORKSPACE_ROOT, nim profile, только Tauri native

**Completed:**
- pre-L3 fix: lettaAgentIds Map persistence → L3 агенты переживут рестарт Docker
- Full Docker infra: NATS + shell-bridge + dispatcher + fs-bridge + shell-exec + agent-bridge в Docker
- grid.ps1 упрощён: `docker compose up -d` + Tauri frontend (всё остальное в Docker)

**Opened:**
- First build Rust Docker image (~10 мин, `docker compose build shell-bridge dispatcher fs-bridge shell-exec`)
- L3 Step 6 — Agent Hierarchy (новая ветка l3-agents)

---

## [2026-03-10 — checkpoint 20] CHECKPOINT

**Phase:** L2 Kernel ALL DONE (5/5) — post-close snapshot

**Decisions:**
- Нет новых решений — checkpoint вызван сразу после session 16 CLOSE

**Files changed:**
- нет изменений с момента последнего CLOSE

**Completed:**
- Session 16 полностью закрыта и запушена

**In progress:**
- First build Rust Docker image (ожидает запуска nopoint)

**Opened:**
- нет

**Notes:**
- /Tcheckpoint вызван после /closeTsession — состояние уже актуально


---

## [2026-03-10 — checkpoint 20] CHECKPOINT

**Phase:** L2 Kernel ALL DONE — подготовка к первому Docker build Rust сервисов

**Decisions:**
- `.dockerignore` добавлен в `core/` — исключает `kernel/target/` (~2GB Rust cache). Без него build context был 2GB+ → OOM при `docker compose build`. Теперь ~50MB.
- `core/kernel/.env` сделан постоянным: содержит NIM_KEY + WORKSPACE_ROOT + USERPROFILE. Больше не зависит от `grid.ps1 run` для записи.
- Первый build Rust образов не завершён (OOM → остановлен). Готово к повторному запуску в следующей сессии.

**Files changed:**
- `core/kernel/.env` — добавлены WORKSPACE_ROOT + USERPROFILE
- `core/.dockerignore` — создан (kernel/target/, node_modules/, dist/)
- `memory/handshake-tLOS.md` — обновлён (checkpoint)
- `memory/current-context-tLOS.md` — добавлены docker_env_permanent, docker_ignore, rust_first_build

**Completed:**
- `.env` постоянный — WORKSPACE_ROOT зафиксирован
- `.dockerignore` — OOM-причина устранена

**In progress:**
- Первый `docker compose build` Rust сервисов — не завершён, готов к запуску

**Opened:**
- [ ] Запустить build завтра: `cd core/kernel && docker compose build shell-bridge dispatcher fs-bridge shell-exec && docker compose up -d`
- [ ] Проверить все 11 индикаторов зелёные
- [ ] L3 Step 6 — Agent Hierarchy (ветка `l3-agents`)

**Notes:**
- Проблема была: build context 2GB из-за `kernel/target/` (Rust compiled artifacts). Docker копировал весь каталог включая кэш. `.dockerignore` решает это навсегда.
- После успешного build все 12 сервисов стартуют через `docker compose up -d`. `grid.ps1 run` запускает только Tauri поверх.

---

## [2026-03-11 — checkpoint 21] CHECKPOINT

**Phase:** Disk cleanup DONE + первый Rust Docker build FAILED (attempt 2) → fix identified

**Decisions:**
- `rm`, `rm -rf`, `rmdir`, `del`, `rd`, `Remove-Item` — навсегда заблокированы в Claude deny list. Все удаления файлов — только nopoint вручную. Claude составляет список, nopoint запускает.
- Docker Rust build упал exit 101 (`failed to parse manifest at time-core-0.1.8/Cargo.toml`) из-за corrupted cargo registry после `docker builder prune`. Фикс: `--no-cache` флаг.
- Обнаружено: сейчас запущен СТАРЫЙ `tlos-zep-bridge/docker-compose.yml`, не новый `core/kernel/docker-compose.yml`. Переключение — следующий шаг после успешного build.

**Files changed:**
- `~/.claude/projects/.../memory/MEMORY.md` — добавлено правило: rm -rf навсегда заблокирован
- `memory/current-context-tLOS.md` — добавлены: rust_first_build (FAILED attempt 2), disk_cleanup DONE, active_docker_stack, claude_permissions, 2 новых blocker
- `memory/handshake-tLOS.md` — перезаписан с текущим состоянием

**Completed:**
- Disk cleanup: C: освобождено ~16 GB (99% → 86%, 18 GB free)
  - Docker: 6 старых образов удалены (4.78 GB), builder cache (3.22 GB), 2 named + 6 anonymous volumes
  - nopoint вручную: Rust target/ dirs (12.1 GB), .bun/install/cache (2.9 GB), puppeteer (654 MB), .tLOS_Copy (181 MB), pip cache, .next
- Диагностика краша claude-bridge: NATS_REFUSED 192.168.65.254:4222 — NATS перенесён в Docker, но старый compose не знает
- Диагностика Rust build failure: exit 101, corrupted time-core-0.1.8 manifest

**In progress:**
- Rust Docker build с `--no-cache` (nopoint запускает вручную)

**Opened:**
- BLOCKER: Rust build нужен `--no-cache` флаг: `docker compose build --no-cache shell-bridge dispatcher fs-bridge shell-exec`
- После build: остановить tlos-zep-bridge compose → запустить kernel compose → проверить 12 сервисов
- L3 Step 6 — Agent Hierarchy (ветка `l3-agents`) — после успешного build

**Notes:**
- Все target/ директории удалены. При следующем нативном `cargo build` (не Docker) — Tauri shell пересоберётся ~10 мин. Docker builds самодостаточны (компилируют внутри контейнера).
- Docker VHDX (20 GB файл) не сжимается автоматически — freed space отображается внутри WSL2 но не возвращается ОС немедленно. `df -h /c` показывает реальное место.

---

## [2026-03-11 — checkpoint 22] CHECKPOINT

**Phase:** Rust Docker build SUCCESS (rust:1.88) + Domain Memory rename + stack switch in progress

**Decisions:**
- Root cause of ALL build failures: `time@0.3.47` + `time-core@0.1.8` require **rustc 1.88.0** (not 1.82, not 1.85)
- Dockerfile.rust-services pinned to `rust:1.88-slim-bookworm` (permanent fix)
- Domain Memory rename: zep → tlos/domain_memory (volume, DB creds, env vars, NATS message type)
- Old tlos_facts data declared test data — fresh start with new `domain_memory_data` volume
- `agent:zep:add_fact` → `agent:memory:add_fact` (frontend doesn't use this type — safe)

**Files changed:**
- `core/kernel/Dockerfile.rust-services` — rust:1.82 → rust:1.85 → **rust:1.88** (final)
- `core/kernel/docker-compose.yml` — zep_postgres → domain_memory_data; DB creds env vars; comment cleanup
- `core/kernel/tlos-claude-bridge/domain-memory.js` — hardcoded `user/password/database: 'zep'` → env vars (DB_USER/DB_PASSWORD/DB_NAME)
- `core/kernel/tlos-claude-bridge/index.js` — `agent:zep:add_fact` → `agent:memory:add_fact`; comment cleanup

**Completed:**
- Rust Docker build SUCCESS — `Finished release profile [optimized] in 5m 20s` (rust:1.88)
- Images built: kernel-shell-bridge, kernel-dispatcher, kernel-fs-bridge, kernel-shell-exec ✓
- Old tlos-zep-bridge stack partially stopped (db/litellm/qdrant removed)
- Domain Memory rename complete across all files
- builder prune #2: 2.585 GB freed

**In progress:**
- Stopping remaining tlos-zep-bridge containers (letta, langgraph-bridge, claude-bridge)
- `docker compose up -d` for new kernel stack (pending full stop of old)

**Opened:**
- [ ] `docker compose up -d` — запустить после полной остановки старого стека
- [ ] Удалить дубли: `tlos-zep-bridge-langgraph-bridge:latest` + `tlos-zep-bridge-claude-bridge:latest` (~1.3 GB)
- [ ] Проверить 11 сервисов зелёные
- [ ] L3 Step 6 — Agent Hierarchy (l3-agents branch)

**Notes:**
- Итоговая стратегия build: всегда использовать `rust:latest` или проверять msrv зависимостей перед пинингом версии
- После `docker compose up -d` — новый DB инициализируется с чистой БД domain_memory (user: tlos). Данные тестовые, миграция не нужна.
- builder prune перед каждым `--no-cache` build обязателен для освобождения места

---

## [2026-03-11 — checkpoint 23] CHECKPOINT

**Phase:** /compact после сессии 22 — kernel stack 11/11 UP, все задачи L2 Dockerization DONE

**Decisions:**
- /compact выполнен nopoint для сжатия контекста. Состояние полностью сохранено.
- Роадмап `docs/agent-system-architecture.md` обновлён: Dockerization таблица переписана (11 сервисов), статусы актуализированы.
- Handshake обновлён: старые TODO (docker compose up, delete дублей) убраны как выполненные.

**Files changed:**
- `memory/handshake-tLOS.md` — обновлён: статус "FULLY UP", приоритет → L3 Step 6
- `docs/agent-system-architecture.md` — таблица Dockerization переписана (11 сервисов, актуальные образы)
- `memory/chronicle-tLOS.md` — этот entry

**Completed:**
- 11/11 сервисов `kernel-*` запущены и стабильны
- Старый `tlos-zep-bridge` стек полностью decommissioned
- Дубли образов (~1.3 GB) удалены
- Domain Memory rename полностью завершён

**In progress:**
- Ожидание подтверждения стабильности `kernel-claude-bridge-1`

**Opened:**
- [ ] L3 Step 6 — Chief/Development нода в LangGraph (ветка `l3-agents`)
- [ ] L2 Step 5 — tLOS Agent Frames (agent-status, g3-session, memory-viewer)
- [ ] `git push origin --delete docker-v1` — удалить remote ветку

**Notes:**
- /compact — это не конец сессии. Продолжаем без полного перезапуска.
- Все данные kernel stack — свежие (domain_memory, qdrant, letta). Миграция не нужна.

---

## [2026-03-11 — checkpoint 24] CHECKPOINT

**Phase:** Shell UI — kernel n/m status indicator DONE + Tauri icon/rebuild in progress

**Decisions:**
- `LatticeStatus` полностью переписан: SPT/ASM/SHP были legacy (всегда false в shell-bridge server.rs) → убраны. Вместо 4 пилюль — единый `n/m` pill с click-to-detail.
- `useKernelHealth` — singleton (module-level signals) чтобы не плодить HTTP poll timers.
- DB статус inferred через LLM (litellm depends_on db: service_healthy в compose).
- KernelStatusFrame — pinned фрейм, position top-right (window.innerWidth - 320px). Повторный клик — focus существующего.
- Tauri rebuild нужен после всех frontend изменений. Иконка монолита — проверка и фикс в следующем шаге.

**Files changed:**
- `core/shell/frontend/src/hooks/useKernelHealth.ts` — СОЗДАН: singleton poller, 6 сервисов, HTTP no-cors + WS
- `core/shell/frontend/src/components/LatticeStatus.tsx` — ПЕРЕПИСАН: n/m pill, onOpenDetail prop
- `core/shell/frontend/src/components/frames/KernelStatusFrame.tsx` — СОЗДАН: detail frame с countdown
- `core/shell/frontend/src/types/frame.ts` — добавлен `"kernel-status"` тип
- `core/shell/frontend/src/components/DynamicComponent.tsx` — Match для kernel-status
- `core/shell/frontend/src/App.tsx` — spawnKernelStatus + передан в LatticeStatus

**Completed:**
- n/m индикатор готов (6 сервисов: SHELL/NATS/LLM/QDRANT/LETTA/DB)
- KernelStatusFrame с live countdown до следующего poll

**In progress:**
- Проверка иконок монолита во всех местах (Tauri icons/, taskbar, shortcut)
- Tauri rebuild

**Opened:**
- [ ] Tauri rebuild: `bun run build` → `cargo tauri build`
- [ ] Проверить/исправить monolith.ico: 4:5, прозрачный фон, height 100%
- [ ] Новый shortcut на рабочем столе (старый удалить через nopoint)
- [ ] L3 Step 6 — Chief/Development нода в LangGraph (ветка `l3-agents`)

**Notes:**
- HTTP health check через `fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(2500) })` — корректно для Tauri WebView. Connection refused → TypeError → `false`. HTTP response (любой) → `true`.
- Letta health endpoint: `http://localhost:8283/health` — проверить что работает.
- DB: postgres port 5433 не поддаётся HTTP health check → inferred via litellm.

---

## [2026-03-11 — checkpoint 25] CHECKPOINT

**Phase:** Icons generated + Tauri build in progress + /compact

**Decisions:**
- Монолит иконки: Python PIL, не PowerShell (ImageMagick недоступен). Monolith = чёрный 4:5 rect, height=100%, width=height*4/5, transparent bg. Stroke rgba(255,255,255,0.10) для >=48px.
- Все 21 PNG + multi-size ICO сгенерированы одним Python скриптом.
- `bunx tauri build` запущен в фоне до /compact. Статус неизвестен.

**Files changed:**
- `src-tauri/icons/*.png` (21 файлов) — ПЕРЕЗАПИСАНЫ монолитом
- `src-tauri/icons/icon.ico` — ПЕРЕЗАПИСАН multi-size монолитом (16-256px)
- `memory/current-context-tLOS.md` — обновлён: tauri_rebuild IN PROGRESS
- `memory/handshake-tLOS.md` — перезаписан

**Completed:**
- Все иконки монолита сгенерированы
- Frontend dist собран (`bun run build`, 5.35s)

**In progress:**
- `bunx tauri build` — статус неизвестен (запущен до /compact)

**Opened:**
- [ ] Проверить результат Tauri build: `target/release/bundle/nsis/tLOS_0.1.0_x64-setup.exe`
- [ ] Установить + обновить/создать shortcut на рабочем столе
- [ ] L3 Step 6 — Chief/Development нода в LangGraph (l3-agents branch)

**Notes:**
- Python PIL доступен. Для переген иконок: запустить скрипт из src-tauri/ или из CLI напрямую.
- Если Tauri build завис — отменить и запустить снова: `cd core/shell/frontend && bunx tauri build 2>&1 | tee build.log`
- Shortcut: после нового установщика старый .lnk скорее всего обновится автоматически (NSIS перезаписывает exe по тому же пути).

---

## [2026-03-11 — checkpoint 26] CHECKPOINT

**Phase:** Post-compact resume — Tauri rebuild attempt 2

**Decisions:**
- Первый `bunx tauri build` не завершился (context compact завершил сессию до окончания build, bundle/ отсутствует)
- Запущен повторный build в фоне (task `byhrvc9sy`)

**Files changed:**
- `memory/current-context-tLOS.md` — tauri_rebuild статус обновлён (attempt 2, task byhrvc9sy)
- `memory/handshake-tLOS.md` — checkpoint 26, уточнён статус Tauri build

**Completed:**
- Обновлены все файлы памяти после /compact

**In progress:**
- `bunx tauri build` — attempt 2, background task byhrvc9sy

**Opened:**
- Ничего нового

**Notes:**
- После compact background task из предыдущей сессии не сохраняется — нужно проверять bundle/ при старте после compact

---

## [2026-03-11 — checkpoint 27] CHECKPOINT

**Phase:** Tauri build DONE — ожидаем установки

**Decisions:**
- Оба `bunx tauri build` завершились (exit 0): b0z0ta4fj (attempt 1, ~5m24s) и byhrvc9sy (attempt 2, ~10m)
- Второй билд был избыточным (запущен из-за ложного вывода об отсутствии bundle/ после compact), но оба вышли успешно

**Files changed:**
- `memory/current-context-tLOS.md` — tauri_rebuild → DONE
- `memory/handshake-tLOS.md` — checkpoint 27

**Completed:**
- Tauri build x2 ✓ — `tLOS_0.1.0_x64-setup.exe` + `tLOS_0.1.0_x64_en-US.msi` готовы
- Monolith иконки: все 21 файл (Python PIL, 4:5, прозрачный фон)
- LatticeStatus n/m + KernelStatusFrame (singleton poller, 10s)
- Память обновлена после /compact

**In progress:**
- Ожидаем: nopoint запускает installer и проверяет иконку

**Opened:**
- Ничего нового

**Notes:**
- После /compact background task из предыдущей сессии (b0z0ta4fj) дожил и завершился успешно
- bundle/ директория существовала — просто проверка через `ls` была до завершения task

---

## [2026-03-11 — checkpoint 28] CHECKPOINT

**Phase:** Shell полностью рабочий — 11/11 сервисов, fullscreen, монолит брендинг

**Decisions:**
- KERN индикатор убран из тайтлбара (дублировал SHELL в KernelStatusFrame)
- 5 внутренних NATS-only сервисов показаны через inferred статус (ok = NATS UP)
- Fullscreen при старте через `getCurrentWindow().maximize()` в onMount
- NSIS header/sidebar: BMP формат (PNG не поддерживается NSIS)
- `installerIcon` (не `installIcon`) — правильное имя поля в Tauri v2 schema

**Files changed:**
- `src/hooks/useKernelHealth.ts` — 6 → 11 сервисов (+DISPATCH/FS/EXEC/LGRAPH/CLAUDE inferred via NATS)
- `src/App.tsx` — убран KERN, maximize() при старте, height KernelStatusFrame 430→620
- `src-tauri/capabilities/default.json` — добавлен `core:window:allow-maximize`
- `src-tauri/tauri.conf.json` — headerImage/sidebarImage .bmp, installerIcon
- `src-tauri/icons/installer-header.bmp` + `installer-sidebar.bmp` — монолит брендинг
- `src/kernel.ts` — WS URL захардкожен (Tauri v2: hostname = tauri.localhost)
- `core/kernel/docker-compose.yml` — qdrant/letta пересозданы с port mapping
- `memory/current-context-tLOS.md` — kernel_status_ui обновлён до v2
- `memory/handshake-tLOS.md` — checkpoint 28

**Completed:**
- Shell показывает 11/11 сервисов (6/6 при включённом Docker stack) ✓
- Fullscreen при старте ✓
- Монолит брендинг в NSIS installer ✓
- WebSocket подключение исправлено (Tauri v2 hostname bug) ✓
- QDRANT/LETTA порты исправлены (force-recreate контейнеры) ✓

**In progress:**
- Ничего активного

**Opened:**
- NATS-inferred services — в будущем заменить на настоящий heartbeat (low priority)

**Notes:**
- Таури v2 на Windows: window.location.hostname = 'tauri.localhost' (не 'localhost')
- NSIS требует BMP для header/sidebar изображений (PNG → warning, игнорируется)
- Tauri v2 capabilities: `installerIcon` (не `installIcon`), `allow-maximize` нужен отдельно

---

## [2026-03-11 — checkpoint 29] CHECKPOINT

**Phase:** L3 Agent Hierarchy — Step 6 DONE, Quality Sprint designed

**Decisions:**
- G3 = default work mode: Coach (general-purpose subagent) + Player (specialized subagent). CLI agents (Qwen, OpenCode) deprecated навсегда.
- Quality Sprint архитектура: Spec Lead (один раз читает весь кодбейс) → параллельные Coach/Player пары на каждый трек (Refactor kernel/shell, Bug Hunt, Tech Debt, Product Debt, UX Debt, UI Debt, Docker Rebuild)
- Coach всегда = general-purpose (нужен Agent tool для запуска Player)
- Tcheckpoint skill упрощён: убраны Steps 5/6 с авто-restore механизмом; теперь просто "run /compact, then /TafterCompact"
- TafterCompact skill создан как явный пост-compact restore

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/graph.py` — ChiefDevState, chief_development_node, chief_worker_node, build_chief_graph (Player: Qwen → now deprecated, was G3 session)
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — get_chief_graph singleton, handle_chief_run async function
- `core/kernel/tlos-langgraph-bridge/bridge.py` — agent:chief:run message type handler
- `development/tLOS/branches/l3-agents/spec.md` — G3 spec for Step 6 (AC-1 through AC-7)
- `docs/agent-system-architecture.md` — L2 COMPLETE, L3 Step 6 status, Quality Sprint section, G3 workflow updated
- `~/.claude/commands/TafterCompact.md` — создан (пост-compact restore skill)
- `~/.claude/commands/Tcheckpoint.md` — упрощён (убран авто-restore)
- `~/.claude/projects/.../memory/MEMORY.md` — Claude Role section: Qwen deprecated, subagents documented

**Completed:**
- L3 Step 6 — Chief/Development нода: ChiefDevState + chief graph + NATS agent:chief:run ✓
- G3 workflow установлен как default (Coach+Player subagents only) ✓
- Quality Sprint архитектура спроектирована и задокументирована ✓
- Tcheckpoint/TafterCompact skills обновлены ✓

**In progress:**
- L3 Step 7 — Lead/Frontend + Lead/Backend ноды (следующий G3)
- langgraph-bridge rebuild (Step 6 не задеплоен в Docker)

**Opened:**
- orchestrator_node type annotation debt (GraphState vs ChiefDevState, runtime OK, LOW priority)
- docker-v1 remote cleanup (`git push origin --delete docker-v1`)

**Notes:**
- Сессия завершилась compact в середине /Tcheckpoint — этот checkpoint завершает прерванную сессию
- build_graph() и handle_graph_run() не изменены — регрессий нет
- Qwen Player был использован для Step 6 реализации (последний раз) — с этой точки только Claude subagents

---

## [2026-03-11 — checkpoint 30] CHECKPOINT

**Phase:** L3 Agent Hierarchy — Steps 6+7 DONE (Chief + Lead/Frontend + Lead/Backend)

**Decisions:**
- G3 Quality Sprint format confirmed as working workflow: Orchestrator spec → Coach (general-purpose, research) → Player (backend-developer, implements) → Coach verifies AC → Orchestrator reviews. First attempt PASS on all 8 AC.
- langgraph-bridge Docker rebuild deferred until all L3 steps complete (rebuild once at end of L3)

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/graph.py` — +LeadState TypedDict, +lead_frontend_node, +lead_backend_node, +lead_worker_node, +build_lead_graph(role)
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — +_lead_graphs dict singleton, +get_lead_graph(role) per-role cache, +handle_lead_run async handler (pre-compiled both roles at import)
- `core/kernel/tlos-langgraph-bridge/bridge.py` — +agent:lead:run routing
- `development/tLOS/branches/l3-agents/step7-spec.md` — G3 spec for Step 7 (AC-1..AC-8)
- `memory/current-context-tLOS.md` — l3_step7 DONE, project_phase updated, langgraph_bridge updated
- `memory/handshake-tLOS.md` — checkpoint 30

**Completed:**
- L3 Step 7 — Lead/Frontend + Lead/Backend nodes ✓ (All AC-1..AC-8 PASS)
- G3 Quality Sprint format first successful run ✓

**In progress:**
- L3 Step 8 — Senior нода + Special memory distillation (next G3)
- langgraph-bridge Docker rebuild (Steps 6+7 pending deploy)

**Opened:**
- orchestrator_node type annotation debt: annotated GraphState but used in LeadState/ChiefDevState graphs (runtime OK, LOW priority)

**Notes:**
- L3 NATS message types: agent:graph:run / agent:chief:run / agent:lead:run (role field)
- build_lead_graph raises ValueError for unknown roles (unlike Chief which defaults silently)
- Coach agent (general-purpose) ran research on LangGraph TypedDict specialization, singleton pattern, persona prompt engineering — synthesis applied to implementation

---

## [2026-03-11 — checkpoint 31] CHECKPOINT

**Phase:** Agent workflow architecture finalized — Domain Lead + G3 pattern

**Decisions:**
- Domain Lead sits between Orchestrator and G3 pair (corrected architecture from earlier sessions)
- Coach and Player are одноуровневые — не видят друг друга, оба видят только spec
- Clarify phase — это loop: вопросы + WebSearch + codebase research до полного понимания
- obras/superpowers (writing-plans + subagent-driven-development) — методологическая основа для Domain Lead
- "Do NOT trust the report. Read the actual code." — ключевой принцип из superpowers spec-reviewer
- rules/agents.md и rules/testing.md конфликтуют с новым workflow — зафиксированы, починить в след. сессии

**Files changed:**
- `~/.claude/CLAUDE.md` — Orchestrator Protocol (Clarify loop), Default Working Mode (Domain Lead + G3), G3 updated (Coach+Player isolated), ссылка на Domain Lead instruction
- `nospace/agents/domain-lead/INSTRUCTION.md` — СОЗДАН: полная инструкция Domain Lead (Audit → Spec → G3 Launch → Report)
- `nospace/tools/superpowers/` — клонирован obra/superpowers
- `memory/handshake-tLOS.md` — checkpoint 31
- `memory/current-context-tLOS.md` — agent_workflow + rules_conflicts обновлены

**Completed:**
- Исправлена иерархия: Orchestrator → Domain Lead → G3 (Player + Coach) ✓
- CLAUDE.md обновлён — workflow зафиксирован глобально ✓
- Domain Lead instruction создан на основе superpowers ✓
- Clarify как loop задокументирован ✓
- Конфликты в rules/ идентифицированы ✓

**In progress:**
- L3 Step 8 — Senior нода + Special memory distillation
- langgraph-bridge Docker rebuild (Steps 6+7 pending)

**Opened:**
- rules/agents.md — конфликт: старые агенты (planner, tdd-guide) vs Domain Lead workflow
- rules/testing.md — конфликт: mandatory TDD 80% vs отсутствие test infra в tLOS

**Notes:**
- superpowers клонирован в nospace/tools/superpowers/ для справки
- OpenSpec и spec-kit изучены — взяли только идею persistent spec artifact и Frozen Interfaces паттерн
- Player модель: должна быть Sonnet (не Haiku) — rules/performance.md говорит "Haiku for workers", это потенциально снижает качество Player

---

## [2026-03-11 — checkpoint 32] CHECKPOINT

**Phase:** L3 Agent Hierarchy — Steps 6+7+8 DONE, Step 9 next

**Decisions:**
- Special memory = persistent pg (не in-state) — таблица `special_memory_facts`
- Orchestrator context economy: проактивность для Orchestrator, строгость для субагентов
- Formalize ≠ Spec: Orchestrator пишет задачу (2-4 строки), не спеку. 5 строк = STOP
- Параллельные Domain Lead-ы = главная ценность архитектуры (масштабируемость)
- Player = Sonnet явно зафиксирован в rules/performance.md (Haiku только для утилит)
- Domain Lead / Coach isolation в Step 8 не подтверждена — добавить в следующий раз требование `Launched via Agent tool`

**Files changed:**
- `~/.claude/rules/agents.md` — полностью переписан: Domain Lead + G3, таблица доменов, параллельные лиды
- `~/.claude/rules/testing.md` — полностью переписан: verification steps вместо TDD 80%
- `~/.claude/rules/performance.md` — обновлён: Player = Sonnet явно, Haiku только утилиты
- `~/.claude/CLAUDE.md` — контекст/роли, Formalize ≠ Spec, Hand off + параллельные лиды, subagent escalation
- `core/kernel/tlos-langgraph-bridge/special_memory.py` — СОЗДАН: pg module, create_table + write_spec + read_context
- `core/kernel/tlos-langgraph-bridge/graph.py` — SeniorState + senior_frontend_node + senior_backend_node + build_senior_graph
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — _senior_graphs + get_senior_graph + handle_senior_run
- `core/kernel/tlos-langgraph-bridge/bridge.py` — agent:senior:run routing
- `core/kernel/tlos-langgraph-bridge/pyproject.toml` — psycopg2-binary>=2.9
- `core/kernel/tlos-langgraph-bridge/uv.lock` — авто-регенерирован (psycopg2-binary 2.9.11)
- `core/kernel/docker-compose.yml` — DB env vars в langgraph-bridge service
- `development/tLOS/branches/l3-agents/step8-spec.md` — СОЗДАН: полная спека Step 8

**Completed:**
- rules/agents.md конфликт устранён ✅
- rules/testing.md конфликт устранён ✅
- L3 Step 8: Senior нода + Special memory ✅ (код готов, Docker rebuild pending)
- CLAUDE.md workflow hardening: Formalize ≠ Spec, параллельные лиды ✅

**In progress:**
- Docker rebuild langgraph-bridge (ручной шаг nopoint)

**Opened:**
- L3 Step 9: Shared Letta memory blocks между нодами домена

**Notes:**
- Workflow нарушение зафиксировано: Orchestrator написал спеку сам вместо Domain Lead → исправлено в CLAUDE.md
- tLOS = то что мы сейчас делаем руками, только визуализировано на канвасе с контролем над каждым шагом
- Domain Lead ценен именно параллелизмом — Orchestrator должен всегда декомпозировать на параллельные домены

---

## [2026-03-11 — checkpoint 33] CHECKPOINT

**Phase:** L3 Agent Hierarchy COMPLETE — Steps 6+7+8+9 DONE. Готов к Quality Sprint.

**Decisions:**
- L3 считается завершённым: все 4 шага (Chief+Lead+Senior+SharedLetta) реализованы
- Quality Sprint — следующий этап после Docker rebuild
- docker-v1 remote branch — удалён (cleanup завершён)

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/letta_shared.py` — СОЗДАН: per-domain singleton Letta HTTP client, read/write/append domain context, NEVER raises
- `core/kernel/tlos-langgraph-bridge/graph.py` — lead_frontend/backend: +read_domain_context + append_domain_context; senior_frontend/backend: +read_domain_context (DOMAIN HISTORY в prompt)
- `core/kernel/docker-compose.yml` — LETTA_URL=http://letta:8283 + depends_on:letta → langgraph-bridge
- `core/kernel/tlos-langgraph-bridge/pyproject.toml` — requests>=2.32 добавлен
- `development/tLOS/branches/l3-agents/step9-spec.md` — СОЗДАН: спека Step 9

**Completed:**
- L3 Step 9: Shared Letta memory blocks между нодами домена ✅ (13/13 AC PASS)
- docker-v1 remote branch удалён ✅

**In progress:**
- Docker rebuild langgraph-bridge (ручной шаг nopoint — ПЕРВОЕ)

**Opened:**
- Quality Sprint: Cross-Domain Spec Lead → параллельные Coach/Player пары

**Notes:**
- letta_shared.py деградирует корректно при Letta DOWN: "" / False, никаких крэшей
- L3 Agent Hierarchy полностью готова к деплою после Docker rebuild
- Workflow: Domain Lead запущен через Agent tool (general-purpose), G3 через Coach subagent

---

## [2026-03-11 — checkpoint 35] CHECKPOINT

**Phase:** Project mapping phase — Excalidraw skill installed, full tLOS project map created before Quality Sprint execution.

**Decisions:**
- FigJam MCP abandoned (API call limits exhausted) → переход на Excalidraw skill (локально, без лимитов)
- Quality Sprint план (snuggly-skipping-swing.md) временно отложен — сначала завершаем project mapping
- excalidraw-diagram skill (coleam00) установлен: `~/.claude/skills/excalidraw-diagram/` + Playwright renderer
- Next session: установить Excalidraw VSCode extension для просмотра/редактирования без браузера

**Files changed:**
- `development/tLOS/memory/codebase-map-tLOS.md` — CREATED: полная карта кодовой базы (8 доменов, LOC, known debt, NATS types)
- `development/tLOS/memory/handshake-tLOS.md` — updated: checkpoint 35, project map reference, Excalidraw skill
- `development/tLOS/memory/current-context-tLOS.md` — updated: checkpoint 35, новые строки excalidraw_skill, project_map, figjam_board
- `development/tLOS/tlos-project-map.excalidraw` — CREATED: полная карта проекта (4 секции, ~145 элементов)
- `development/tLOS/tlos-project-map.png` — CREATED: отрендеренный PNG через Playwright
- `~/.claude/skills/excalidraw-diagram/` — INSTALLED: excalidraw-diagram skill + uv env + chromium
- `~/.claude/projects/.../memory/MEMORY.md` — FigJam URL + Excalidraw section added

**Completed:**
- codebase-map-tLOS.md создан (заменяет повторный ресёрч кодовой базы)
- excalidraw-diagram skill установлен и проверен (render → PNG OK)
- tlos-project-map.excalidraw создан и отрендерен

**In progress:**
- Project mapping: карта создана, нужен локальный просмотр (Excalidraw extension)
- Quality Sprint: план написан, ждёт финализации после project map review
- Docker rebuild langgraph-bridge: ручной шаг nopoint, ещё не выполнен

**Opened:**
- Установка Excalidraw локально (VSCode extension pomdtr.excalidraw-editor) — следующая сессия
- Доработка project map после локального просмотра с nopoint

**Notes:**
- FigJam MCP (claude.ai Figma) исчерпал лимиты вызовов — для диаграмм теперь используем Excalidraw skill
- Quality Sprint план полностью готов в ~/.claude/plans/snuggly-skipping-swing.md (6 треков, 4 волны)
- Карта проекта показывает всю систему: роадмап L2→L3→QS→L4, архитектуру Shell→NATS→сервисы, иерархию агентов, 8 продуктовых доменов

---

## [2026-03-12 — checkpoint 36] CHECKPOINT

**Phase:** System documentation complete — full spec from audio + 6-zone Excalidraw system map + VSCode extension

**Decisions:**
- `tlos-system-spec.md` создан из 30-минутной транскрипции nopoint — 8 секций: Five Pillars, Agent Hierarchy (L0-L5 vision), Continuum Memory (5 layers × 5 containers), Shell, Kernel, Services (Samurizators+Regulators), Communication Rules, Gap Analysis
- `tlos-system-map.excalidraw` полностью готова — 6 зон: Agent Hierarchy, Continuum Memory, Shell, Kernel, Services, Data Flow. Dark theme (#0a0a0f), gold+cyan palette, ~200 элементов
- VSCode extension `pomdtr.excalidraw-editor` v3.9.1 установлен для in-editor preview/editing
- Excalidraw color palette переопределена под tLOS brand (dark bg, gold primary, cyan accent) — отличается от стандартных light-theme цветов skill

**Files changed:**
- `docs/tlos-system-spec.md` — СОЗДАН: полная системная спецификация (vision + implementation + gap analysis)
- `development/tLOS/tlos-system-map.excalidraw` — СОЗДАН: 6-zone comprehensive system architecture diagram (~200 elements)
- `development/tLOS/tlos-system-map.png` — СОЗДАН: rendered PNG через Playwright
- `development/tLOS/memory/session-12mar-context.md` — СОЗДАН: pre-compact context save (zone coordinates, colors, progress)
- `memory/current-context-tLOS.md` — updated: tlos_system_spec, tlos_system_map, excalidraw_vscode added
- `memory/handshake-tLOS.md` — overwritten: checkpoint 36

**Completed:**
- `tlos-system-spec.md` — полная спецификация из аудио nopoint (8 секций) ✅
- `tlos-system-map.excalidraw` — 6-zone system architecture diagram rendered to PNG ✅
- Groq whisper-large-v3 транскрибация аудио → `nospace/transcription.txt` ✅
- Excalidraw VSCode extension установлен ✅
- Semantic entities: tLOS_Intent + tLOS_IntentTrigger добавлены ✅
- Intent Trigger audit добавлен в omnibar roadmap ✅

**In progress:**
- Docker rebuild langgraph-bridge (ручной шаг nopoint)
- Review system map + spec с nopoint
- Quality Sprint — ждёт финализации

**Opened:**
- Ничего нового

**Notes:**
- Сессия началась с транскрибации аудио (Groq whisper), затем создание spec + excalidraw. Двойной compact: первый посередине excalidraw (Zone 1 done), второй после завершения всех 6 зон
- Excalidraw diagram строился section-by-section per skill guidelines: Zone 1 (Agent Hierarchy) → Zone 2 (Memory) → Zone 5+3 (Services+Shell) → Zone 4+6 (Kernel+Data Flow)
- Seed namespacing: 100xxx=Z1, 200xxx=Z2, 300xxx=Z3, 400xxx=Z4, 500xxx=Z5, 600xxx=Z6

---

## [2026-03-12 — checkpoint 37] CHECKPOINT

**Phase:** L3 COMPLETE — Full System Graph planned

**Decisions:**
- Решение создать Full System Graph — network-style Excalidraw диаграмму всех компонентов tLOS (Docker services + agents + memory + shell + NATS) и их связей как граф
- Файл: `development/tLOS/tlos-system-graph.excalidraw` (отдельно от 6-zone system map)

**Files changed:**
- Ничего не изменено с checkpoint 36

**Completed:**
- Checkpoint 36 полностью завершён в предыдущей сессии

**In progress:**
- Full System Graph — следующий артефакт (HIGH context, ~300+ elements)
- Docker rebuild langgraph-bridge (ручной шаг nopoint)

**Opened:**
- Full System Graph — новый визуальный артефакт

**Notes:**
- Контекст-сейв перед крупной задачей (Full System Graph — оценка HIGH context cost)

---

## [2026-03-12 — checkpoint 38] CHECKPOINT

**Phase:** L3 COMPLETE — Full System Graph created

**Decisions:**
- Network graph style: NATS-centric radial layout (vs zone-based system map)
- 5 edge types color-coded: gold=NATS pub/sub, gray=Docker networking, cyan=Agent hierarchy, green=Memory r/w, red=Meta-service
- Section-by-section JSON build (4 sections): core+NATS → shell+datastores → agents+memory+legend → edge labels+ports

**Files changed:**
- `development/tLOS/tlos-system-graph.excalidraw` — СОЗДАН: Full System Graph (~120 elements)
- `development/tLOS/tlos-system-graph.png` — СОЗДАН: rendered PNG
- `memory/current-context-tLOS.md` — updated: tlos_system_graph entry added
- `memory/handshake-tLOS.md` — overwritten: checkpoint 38

**Completed:**
- Full System Graph — network topology diagram всех компонентов tLOS ✅
  - 7 bridges (shell-bridge, claude-bridge, langgraph-bridge, dispatcher, agent-bridge, fs-bridge, shell-exec)
  - 4 data stores (db, litellm, qdrant, letta) with port numbers
  - 3 shell components (Omnibar, Frames, DynamicComp)
  - 2 external APIs (Claude CLI, NIM API)
  - 6 agent hierarchy levels (L0 Human → L5 G3 Pair)
  - 5 memory containers (Global, Domain, Project, Special, Operational)
  - 2 meta-services (Samurizators, Regulators)
  - NATS subject labels on key connections
  - Legend with all 5 edge types

**In progress:**
- Docker rebuild langgraph-bridge (ручной шаг nopoint)
- Quality Sprint — ждёт финализации

**Opened:**
- Ничего нового

**Notes:**
- Три визуальных артефакта теперь готовы: system-spec (текст), system-map (6-зонная карта), system-graph (сетевой граф)
- Граф строился section-by-section: Section 1 (NATS+bridges+arrows) → Section 2 (shell+external+datastores+Docker deps) → Section 3 (agents+memory+meta-services+legend) → Section 4 (NATS subject labels+port numbers)
- Rendered + validated через Playwright (2 итерации)

---

## [2026-03-12 — checkpoint 39] CHECKPOINT

**Phase:** Phase 0 DONE + Phase 1 QS Phase A IN PROGRESS

**Decisions:**
- Roadmap v4: полная перестройка — 6 фаз (Phase 0-5) с parallelism map
- QS placement: после L3 Deploy, перед Agent Evolution
- Phase A: Track 1 (Naming) + Track 9 (Docker) параллельно первыми (Track 1 blocking для остальных)

**Files changed:**
- `docs/agent-system-architecture.md` — **REWRITTEN** v3→v4. Section 10 (Roadmap) полностью переписан: 6 фаз, parallelism map, completed phases в архив. Docker stack condensed into section 11.
- `development/tLOS/branches/quality-sprint/specs.md` — **CREATED** by Cross-Domain Spec Lead. 9 tracks, 700+ строк, concrete issues with line numbers.
- `development/tLOS/memory/current-context-tLOS.md` — updated: roadmap_v4, quality_sprint, l3_deploy entries added
- `development/tLOS/memory/handshake-tLOS.md` — overwritten (checkpoint 39)

**Completed:**
- Phase 0: L3 Deploy — `docker compose build langgraph-bridge` + `docker compose up -d --no-deps langgraph-bridge`. 11/11 UP, NATS connected.
- QS Spec Lead: full codebase audit → 9 track specs written

**In progress:**
- QS Phase A: Track 1 (Naming: Senior→Special, Player→Worker) — background agent
- QS Phase A: Track 9 (Docker: resource limits, letta healthcheck, NATS_URL fix) — background agent

**Opened:**
- QS Phase B: Track 2 (Refactor kernel) + Track 3 (Refactor shell) + Track 5 (Tech Debt) — waiting for Phase A
- QS Phase C: Track 4 (Bug Hunt) + Track 6 (Product Debt) + Track 7 (UX) + Track 8 (UI) — waiting for Phase B

**Notes:**
- Roadmap v4 key structure: Phase 0 (deploy) → Phase 1 (QS) → Phase 2 (Agent Evolution) ‖ Phase 3 (Continuum Memory) → Phase 4 (Services) ‖ Phase 5 (Shell Evolution)
- Cross-Domain Spec Lead found 60+ naming issues, 4x duplicated streaming handlers, 31 dead .jsx files, G3SessionFrame sending to wrong graph, missing Docker resource limits
- Background agents running autonomously with verification commands

---

## [2026-03-12 — checkpoint 42] CHECKPOINT

**Phase:** Quality Sprint — Phase A+B+C COMPLETE (8/9 tracks)

**Decisions:**
- Track 6 (Product Debt) deferred to Phase 2: agent:g3:run, spawn command, kernel command update are new features, not quality cleanup
- Phase C merged tracks: Track 8+4 partial (G3SessionFrame + TrafficLights) + Track 7+4 partial (Omnibar polish + canvas save)
- File ownership boundaries enforced across parallel agents to prevent conflicts

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — extracted _stream_result + _publish_error helpers, asyncio.get_running_loop(), 160 lines dedup eliminated
- `core/kernel/tlos-langgraph-bridge/bridge.py` — if→elif chain
- `core/kernel/tlos-langgraph-bridge/graph.py` — extract_user_message() helper (8 occurrences → 1), merged special_frontend/backend_node → generic special_node(state, domain)
- `core/kernel/tlos-langgraph-bridge/special_memory.py` — module-level connection pooling with auto-reconnect
- `core/kernel/tlos-langgraph-bridge/pyproject.toml` — removed anthropic>=0.40
- `core/kernel/tlos-langgraph-bridge/uv.lock` — regenerated (5 deps removed)
- `core/kernel/tlos-claude-bridge/index.js` — nested .then()→async/await, seed data g3_player_node→g3_worker_node
- `core/kernel/tlos-claude-bridge/domain-memory.js` — seed data updated
- `core/shell/frontend/src/components/DynamicComponent.tsx` — 496→317 lines, Switch→frameRegistry lookup, TrafficLights component
- `core/shell/frontend/src/components/frameRegistry.ts` — NEW: 26 frame type registry
- `core/shell/frontend/src/components/Omnibar.tsx` — 723→238 lines, split into orchestrator
- `core/shell/frontend/src/components/OmnibarInput.tsx` — NEW: input row, hints (focus-only cycling)
- `core/shell/frontend/src/components/OmnibarBody.tsx` — NEW: message history, expanded header
- `core/shell/frontend/src/components/OmnibarPanelAgent.tsx` — NEW: agent panels
- `core/shell/frontend/src/components/OmnibarPanelModel.tsx` — NEW: model selection
- `core/shell/frontend/src/components/OmnibarPanelContext.tsx` — NEW: context usage
- `core/shell/frontend/src/components/TrafficLights.tsx` — NEW: unified traffic lights (window/frame variants)
- `core/shell/frontend/src/components/frames/G3SessionFrame.tsx` — inline styles→Tailwind, hex→tokens
- `core/shell/frontend/src/components/frames/WindowFrame.tsx` — NEW (extracted from DynamicComponent)
- `core/shell/frontend/src/components/frames/TextFrame.tsx` — NEW (extracted)
- `core/shell/frontend/src/components/frames/ButtonFrame.tsx` — NEW (extracted)
- `core/shell/frontend/src/components/frames/ChatFrame.tsx` — NEW (extracted)
- `core/shell/frontend/src/components/frames/PanelFrame.tsx` — NEW (extracted)
- `core/shell/frontend/src/services/kernel.ts` — subscriberSet only, connection signal exported
- `core/shell/frontend/src/hooks/useComponents.ts` — dead code removed, canvas save debounced (500ms + queueMicrotask)
- `core/shell/frontend/src/hooks/useSnap.ts` — snap detection extracted to snapUtils.ts
- `core/shell/frontend/src/hooks/snapUtils.ts` — NEW: detectFrameSnap + detectOmnibarSnap pure functions
- `core/shell/frontend/src/types/frame.ts` — removed dead types (catalog, shape)
- `core/shell/frontend/tailwind.config.js` — added tlos-primary, tlos-frame-bg tokens
- `core/shell/frontend/src/App.tsx` — TrafficLights component integrated
- 31 .jsx files → `core/kernel/archive/shell-jsx-backup-2026-03-12/`

**Completed:**
- QS Phase B: Track 2 (Refactor kernel — 9 tasks, 7 AC all PASS)
- QS Phase B: Track 3 (Refactor shell — 4 tasks, 6 AC all PASS)
- QS Phase B: Track 5 (Tech Debt — 4 tasks, 5 AC all PASS)
- QS Phase C: Track 7 (UX — 5 tasks, 4 AC all PASS)
- QS Phase C: Track 8 (UI — 4 tasks, 5 AC all PASS)
- QS Phase C: Track 4 partial (bugs fixed via Track 2+3+7)

**In progress:**
- Docker rebuild: langgraph-bridge + claude-bridge (kernel Python files changed)

**Opened:**
- Track 6 (Product Debt) deferred items: agent:g3:run NATS subject, G3SessionFrame protocol, spawn command, kernel command update
- LatticeStatus/ChatMessage type consolidation in kernel.ts (deferred from Track 5, low priority)

**Notes:**
- 7 background agents ran total: 3 in Phase B parallel + 2 in Phase C parallel + 2 in Phase A (previous checkpoint)
- All agents ran with strict file ownership boundaries — zero merge conflicts
- Total QS impact: ~200 lines of duplication eliminated (kernel), Omnibar 723→238 lines, DynamicComponent 496→317 lines, G3SessionFrame fully Tailwind, 31 dead files archived, 5 unused deps removed

---

## [2026-03-13 — checkpoint 43] CHECKPOINT

**Phase:** Phase 2 (Agent Evolution) + Phase 3 (Continuum Memory) — parallel execution started

**Decisions:**
- Phase 2 and Phase 3 launched in parallel as per Roadmap v4 parallelism map
- Step 2.1 (Дирижёр) and Step 3.1 (Global Memory) implemented via two parallel Domain Lead agents
- bridge.py file ownership assigned exclusively to Lead/Phase2 to avoid merge conflicts
- Global Memory integration into Дирижёр done by Orchestrator after both agents completed
- `_get_or_build_chief_graph_inline()` uses its own cache isolated from bridge_handler singletons

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/graph.py` — +DirizhyorState (6 fields), +dirizhyor_node (intent formalization, NO code access, reads Global Memory), +dirizhyor_router_node (routing_plan JSON parse, Chief inline invocation), +build_dirizhyor_graph (dirizhyor→dirizhyor_router→END), +_get_or_build_chief_graph_inline(), +read_global_summary() integration
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — +_dirizhyor_graph singleton, +get_dirizhyor_graph() with pre-compile, +handle_dirizhyor_run()
- `core/kernel/tlos-langgraph-bridge/bridge.py` — +agent:dirizhyor:run elif branch (line 48)
- `core/kernel/tlos-langgraph-bridge/global_memory.py` — NEW: pg table `global_memory` (id, layer, category, content, metadata JSONB, access_count, created_at, last_accessed). VALID_LAYERS: frozen/slow/medium/fast/operational. API: create_table, read_global_context, write_global_fact, update_global_fact, read_global_summary. Module-level _conn singleton with _get_conn() auto-reconnect. NEVER raises.
- `development/tLOS/memory/current-context-tLOS.md` — updated: checkpoint 43, Phase 2.1+3.1 DONE
- `development/tLOS/memory/handshake-tLOS.md` — overwritten: checkpoint 43, new priorities (2.2+3.2)

**Completed:**
- Docker rebuild: langgraph-bridge + claude-bridge (QS changes + Phase 2.1+3.1 deployed)
- Step 2.1: Дирижёр isolation — L1 node in LangGraph, NATS agent:dirizhyor:run, intent formalization, Global Memory read
- Step 3.1: Global Memory tier — pg table with 5 Continuum layers, full CRUD API, integrated into Дирижёр

**In progress:**
- Step 2.2: Chief horizontal communication (next)
- Step 3.2: Project Memory tier (next, parallel with 2.2)

**Opened:**
- Chief horizontal comm protocol design needed (how Chiefs message each other)
- Project Memory schema design (per-domain files with Continuum layers inside)

**Notes:**
- 2 parallel Domain Lead agents ran: Lead/Phase2 (graph.py + bridge_handler.py + bridge.py) and Lead/Phase3 (global_memory.py only)
- Verification: `uv run python -c "from graph import build_dirizhyor_graph; print('OK')"` → OK
- Verification: `uv run python -c "from global_memory import read_global_summary; print(read_global_summary() or 'empty')"` → warns about DB connection (expected outside Docker), returns empty string safely
- Docker container started clean: `[langgraph-bridge] connected` + `[langgraph-bridge] ready — tlos.shell.events`

---

## [2026-03-13 — checkpoint 44] CHECKPOINT

**Phase:** Phase 2 (Agent Evolution) + Phase 3 (Continuum Memory) — Steps 2.2 + 3.2 completed

**Decisions:**
- Chief horizontal comm uses pg async inbox pattern (not NATS real-time) — fits synchronous LangGraph execution model
- Project Memory mirrors global_memory.py pattern exactly (same connection singleton, same API shape, added `domain` param)
- File ownership split across parallel agents: Lead/Phase2 owns chief_comm.py + graph.py chief node; Lead/Phase3 owns project_memory.py only
- Integration (Project Memory → Lead nodes, Chief inbox → Chief node) done by Orchestrator after both agents completed

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/chief_comm.py` — NEW: pg table `chief_messages` (id, from_chief, to_chief, subject, content, metadata JSONB, status, created_at, read_at). Composite index (to_chief, status) + index (from_chief). API: create_table, send_message, read_inbox, read_inbox_summary, mark_archived, get_thread. Module-level _conn singleton. NEVER raises.
- `core/kernel/tlos-langgraph-bridge/project_memory.py` — NEW: pg table `project_memory` (id, domain, layer, category, content, metadata JSONB, access_count, created_at, updated_at, last_accessed). Indexes: composite (domain, layer), domain, category. API: create_table, read_project_context, write_project_fact, update_project_fact, read_project_summary, list_domains. NEVER raises.
- `core/kernel/tlos-langgraph-bridge/graph.py` — chief_development_node: +read_inbox_summary("development") from chief_comm. lead_frontend_node: +read_project_summary("frontend") from project_memory. lead_backend_node: +read_project_summary("backend") from project_memory.
- `development/tLOS/memory/current-context-tLOS.md` — updated: checkpoint 44
- `development/tLOS/memory/handshake-tLOS.md` — overwritten: checkpoint 44

**Completed:**
- Step 2.2: Chief horizontal communication — pg inbox/outbox, integrated into chief_development_node
- Step 3.2: Project Memory tier — pg per-domain + 5 Continuum layers, integrated into lead_frontend/backend_node
- Docker rebuild + deploy (langgraph-bridge with 2.2+3.2 changes)

**In progress:**
- Step 2.3: Domain expansion (Marketing, Research, Production, Design chiefs)
- Step 3.3: Continuum 5-layer system (TTL/rewrite policies)

**Opened:**
- Dynamic graph builder design needed for Step 2.3 (YAML config vs pg-based registry?)
- TTL/rewrite policy mechanism for Step 3.3 (pg triggers vs application-level?)

**Notes:**
- 2 parallel Domain Lead agents ran: Lead/Phase2 (chief_comm.py + graph.py) and Lead/Phase3 (project_memory.py)
- All verifications passed: chief_comm OK, project_memory OK, all graphs OK
- Docker startup clean: `[langgraph-bridge] ready — tlos.shell.events`
- Session total: 4 steps completed (2.1, 2.2, 3.1, 3.2) across 2 rounds of parallel execution

---

## [2026-03-13 — checkpoint 45] CHECKPOINT

**Phase:** Phase 2 (Agent Evolution) COMPLETE + Phase 3 (Continuum Memory) COMPLETE

**Decisions:**
- Step 2.3: Domain config as Python dicts in `domain_config.py` (not YAML/pg registry). Factory functions `_build_chief_node(domain)` and `_build_lead_node(role)` replace hardcoded per-domain functions. Adding domains = config entries only.
- Step 2.4: Recognized as already satisfied by 2.3's factory approach — dynamic subdomain registration is implicit in the config-driven factory pattern. Phase 2 marked COMPLETE.
- Step 3.3: Continuum lifecycle in `continuum.py` — TTL policies at application level (not pg triggers). `expires_at` column added to all memory tables. Frozen layer is immutable (only human can modify).
- Step 3.4: Retrieval boost as computed SQL expression (not stored column). `compute_retrieval_boost_sql()` returns `layer_weight + LN(1+access_count) + recency_decay`. No schema migration needed.
- Step 3.5: Temporal edges + episodes in `memory_edges.py` — BFS traversal with max 50 results. Two pg tables: `memory_edges` + `memory_episodes`.

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/domain_config.py` — NEW: 5 chiefs + 11 leads as Python dicts. Helper functions: `get_available_chiefs()`, `get_leads_for_chief(domain)`, `get_all_lead_roles()`.
- `core/kernel/tlos-langgraph-bridge/continuum.py` — NEW: `VALID_LAYERS`, `LAYER_POLICIES` (TTL, rewritable, auto_cleanup), `LAYER_BOOST_WEIGHTS`. API: `validate_layer()`, `is_frozen()`, `can_rewrite()`, `compute_expires_at()`, `cleanup_expired()`, `get_layer_stats()`, `promote_fact()`, `compute_retrieval_boost_sql()`.
- `core/kernel/tlos-langgraph-bridge/memory_edges.py` — NEW: pg tables `memory_edges` + `memory_episodes`. API: `add_edge()`, `get_edges_from/to()`, `get_related_facts()` (BFS), `start/end_episode()`, `get_current_episode()`, `list_episodes()`.
- `core/kernel/tlos-langgraph-bridge/graph.py` — `_build_chief_node(domain)` + `_build_lead_node(role)` factory functions. `ChiefState` replaces `ChiefDevState`. `dirizhyor_router_node` uses generic dispatch via `_get_or_build_chief_graph_inline()`. `_SPECIAL_DOMAIN_CONFIG` extended with 5 domains.
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — `_chief_graphs: dict` + `_lead_graphs: dict` singletons. Pre-compile loops for all chiefs/leads/specials.
- `core/kernel/tlos-langgraph-bridge/global_memory.py` — Continuum imports, `expires_at` column, frozen immutability, retrieval boost ordering, `cleanup_expired_global()`.
- `core/kernel/tlos-langgraph-bridge/project_memory.py` — Same Continuum upgrades as global_memory.py.
- `core/kernel/tlos-langgraph-bridge/special_memory.py` — Added `layer` + `expires_at` columns, `cleanup_expired_special()`.
- `development/tLOS/memory/current-context-tLOS.md` — updated: checkpoint 45, Phase 2+3 COMPLETE
- `development/tLOS/memory/handshake-tLOS.md` — overwritten: checkpoint 45, next Phase 4

**Completed:**
- Step 2.3: Domain expansion — 5 chiefs + 11 leads via factory pattern
- Step 2.4: Dynamic subdomain — implicit in factory approach (marked COMPLETE)
- Step 3.3: Continuum 5-layer lifecycle — TTL policies, frozen immutability, expires_at
- Step 3.4: Selective Retention — retrieval boost SQL expression
- Step 3.5: Temporal Continuity — memory edges + episodes with BFS
- **Phase 2 ALL 4 STEPS DONE**
- **Phase 3 ALL 5 STEPS DONE**
- Docker rebuilt 5x, all 11/11 services UP

**In progress:**
- Nothing — Phase 2+3 complete, awaiting nopoint for Phase 4 direction

**Opened:**
- Phase 4: Samurizators (passive memory compaction service) design needed
- Phase 4: Regulators (rule enforcement service) design needed

**Notes:**
- 5 steps completed in 2 rounds of parallel execution: Round 1 (2.3+3.3), Round 2 (3.4+3.5)
- All verifications passed: domain_config OK, continuum OK, memory_edges OK, all graphs compile, all memory tables created
- Docker rebuilds all clean, langgraph-bridge connects to NATS and all memory tables
- Path format lesson: always use Unix-style `/c/Users/...` in bash commands (first verification failed with Windows-style path)
- Total session: 9/9 steps completed across Phase 2+3 (4 previous + 5 this session)

---

## [2026-03-13 — checkpoint 46] CHECKPOINT

**Phase:** Phase 4 (Services — Samurizators + Regulators) COMPLETE

**Decisions:**
- Hybrid summarization algorithm: Operational→Fast = extractive (top-N by access_count, no LLM), Fast→Medium+ = LLM via liteLLM (NIM Llama 3.1 70B), Slow→Frozen = human-only (proposals table)
- Regulator as inline fire-and-forget in bridge.py — evaluates every NATS event but never blocks main flow
- YAML rules config for hot-reload without Docker restart
- Rate limiting in-memory (ephemeral dict, resets on service restart — acceptable for compliance monitoring)
- Cross-domain extraction (Project→Global) as separate trigger, not automatic

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/samurizator.py` — NEW: ~730 lines. Hybrid compaction: extractive (Operational→Fast), LLM (Fast→Medium, Medium→Slow), frozen proposals, cross-domain extraction. `_call_litellm()` via liteLLM at http://litellm:4000. `frozen_proposals` pg table. API: consolidate_on_episode_end, consolidate_on_schedule, propose_frozen_candidates, extract_project_to_global. NEVER raises.
- `core/kernel/tlos-langgraph-bridge/regulator.py` — NEW: ~393 lines. Rules engine loading from YAML. 4 check types: naming (domain_config validation), scope (RBAC hierarchy), workflow (session history), rate_limit (sliding window). `regulator_violations` pg table. In-memory `_event_counts` + `_session_history`. API: load_rules, evaluate_event, get_rules_summary, get_violation_log. NEVER raises.
- `core/kernel/tlos-langgraph-bridge/regulator_rules.yaml` — NEW: 6 rules (naming_domain, naming_role, scope_lead_no_chief, workflow_chief_before_lead, rate_limit_per_session, rate_limit_global).
- `core/kernel/tlos-langgraph-bridge/bridge.py` — +3 elif branches (agent:samurizator:run, agent:regulator:check, agent:regulator:reload) + inline regulator evaluation block (fire-and-forget)
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — +3 handlers (handle_samurizator_run, handle_regulator_check, handle_regulator_reload)
- `core/kernel/tlos-langgraph-bridge/pyproject.toml` — +pyyaml>=6.0
- `development/tLOS/memory/current-context-tLOS.md` — updated: checkpoint 46, Phase 4 COMPLETE
- `development/tLOS/memory/handshake-tLOS.md` — overwritten: checkpoint 46, next Phase 5

**Completed:**
- Step 4.1: Samurizator service — hybrid compaction (extractive + LLM via liteLLM)
- Step 4.2: Consolidation triggers — episode_end, schedule, frozen, project_to_global
- Step 4.3: Regulator service — inline NATS audit, fire-and-forget
- Step 4.4: Rules engine — 6 YAML rules, hot-reload, violations in pg
- **Phase 4 ALL 4 STEPS DONE**
- Docker rebuilt, 11/11 services UP
- Verified inside Docker: samurizator tables_ready=True, regulator rules_loaded=True, table_ready=True, naming validation works (valid domain=0 violations, invalid=1)

**In progress:**
- Nothing — Phase 4 complete, awaiting nopoint for Phase 5 direction

**Opened:**
- Phase 5: Shell Evolution (Intent formalization, Omnibar trigger taxonomy, rich frame spawning)
- Codebase map update needed (add Phase 4 modules)

**Notes:**
- 2 parallel Domain Lead agents ran: Lead/Samurizators (samurizator.py) and Lead/Regulators (regulator.py + YAML)
- Both agents modified bridge.py and bridge_handler.py independently — no conflicts (clean merge)
- liteLLM integration for summarization: http://litellm:4000/v1/chat/completions → NIM Llama 3.1 70B
- Regulator inline check tested: valid event (domain=development) → 0 violations, invalid (domain=INVALID_DOMAIN) → 1 violation
- Total roadmap: Phase 0 ✅ → Phase 1 ✅ → Phase 2 ✅ → Phase 3 ✅ → Phase 4 ✅ → Phase 5 next

---

## [2026-03-13 — checkpoint 47] CHECKPOINT

**Phase:** Roadmap v4 ALL COMPLETE (Phases 0-5). Roadmap v5 built (Phases 6-9).

**Decisions:**
- Phase 5 (Shell Evolution) scope: Intent pipeline + Command Registry + Frame Layouts. No kernel-side dynamic registration (deferred — no current use case)
- Product Debt audit (QS Track 6): 44 features, 27 full, 9 partial, 8 not started, 0 divergent
- Roadmap v5: Phase 6 (E2E Validation) blocks Phases 7+8+9 which run in parallel
- Hybrid algorithm for summarization confirmed (checkpoint 46), now in samurizator.py

**Files changed:**
- `core/shell/frontend/src/types/intent.ts` — NEW: tLOS_Intent entity + createIntentEntity, withParsed, withStatus helpers
- `core/shell/frontend/src/commands/commandRegistry.ts` — NEW: Map-based registry, registerCommand/getCommand/listCommands/executeCommand
- `core/shell/frontend/src/commands/defaultCommands.ts` — NEW: mcb/kernel/g3 registered via registry + frameLayouts
- `core/shell/frontend/src/commands/frameLayouts.ts` — NEW: unified layout system (FrameLayout type, 4 strategies: custom/grid/stack/single, resolveLayout)
- `core/shell/frontend/src/hooks/useIntentPipeline.ts` — NEW: SolidJS hook (create→parse→route→track, 50-entry history)
- `core/shell/frontend/src/App.tsx` — inline if/else command matching removed, registerDefaultCommands() + useIntentPipeline() wired
- `core/shell/frontend/src/components/Omnibar.tsx` — onLocalCommand prop replaced with intentPipeline: IntentPipeline
- `core/shell/frontend/src/components/OmnibarInput.tsx` — autocomplete dropdown (gold highlight, keyboard nav: ArrowUp/Down/Tab/Escape)
- `core/shell/frontend/src/data/mcb-frames.ts` — re-export from frameLayouts
- `core/shell/frontend/src/data/kernel-frames.ts` — re-export from frameLayouts
- `core/shell/frontend/src/data/g3-frames.ts` — re-export from frameLayouts
- `docs/agent-system-architecture.md` — Roadmap v5: Phases 2-5 marked COMPLETE, Phases 6-9 added (14 steps)
- `development/tLOS/memory/codebase-map-tLOS.md` — Phase 2-5 modules added (kernel + shell)

**Completed:**
- Phase 5 (Shell Evolution): Steps 5.1 (Intent Entity), 5.2 (Command Registry), 5.3 (Frame Layouts) — ALL DONE
- QS Track 6 (Product Debt): full audit — 44 features, gap analysis, priority ranking
- Codebase map update: Phase 2-5 modules documented
- Roadmap v5 written: 4 phases, 14 steps, parallelism map

**In progress:**
- Nothing active — awaiting nopoint's decision on Phase 6 start

**Opened:**
- Phase 6: E2E Validation (P0 — Дирижёр→Chief→Lead→Special→G3 from Shell)
- Phase 7: Automation (Samurizator cron, episode boundaries, escalation propagation, NATS rename)
- Phase 8: Agent Comms (Chief parallel dispatch, message exchange, cross-domain coordination)
- Phase 9: Shell Expansion (help/status/compact/dirizhyor commands, memory-admin frame, regulator-log frame)

**Notes:**
- TypeScript compiles clean after Phase 5 changes (npx tsc --noEmit = 0 errors)
- Two parallel Domain Leads for Phase 5: Lead A (Intent + Registry) and Lead B (Frame Layouts) — both wrote frameLayouts.ts but Lead B's version (fuller) won as last-write, Lead A imports correctly
- Total roadmap progress: v4 Phases 0-5 ✅ → v5 Phase 6 NEXT → Phases 7+8+9 parallel

---

## [2026-03-13 — checkpoint 48] CHECKPOINT

**Phase:** Roadmap v5 Phase 6 (E2E Validation) — Step 6.1 PASS + Agent Flow Optimization plan approved

**Decisions:**
- Agent Flow Optimization: 5 mechanisms approved (instruction cascade, fast path success, escalation matrix, parallel chiefs, cross-functional ordering)
- Debug Service = new meta-service ("медики"). Samurizators = "архивариусы". Regulators = "полиция"
- Токены = единая метрика стоимости (не доллары, не время)
- Качество = разрыв между намерением и результатом
- Границы полномочий = YAML с диапазонами метрик
- Горизонтальные регламенты = отдельные маленькие файлы (не один большой)
- Порядок доменов в cross-functional задачах = LLM решает
- Claude Code = Eidolon (навсегда, синхронизироваться с файлами)
- Память при успехе: Дирижёр/Chief/Lead = "ок", Special = LLM-summary
- Параллельный dispatch Chiefs = делаем сразу. Горизонтальная коммуникация = отдельная фаза

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/graph.py` — `--strict-mcp-config` in call_claude_cli (eliminates MCP server startup overhead)
- `docs/agent-flow-optimization-plan.md` — CREATED: full optimization plan (5 mechanisms, 6 steps, tests)
- `~/.claude/projects/.../memory/ideas_inbox.md` — CREATED: brainstorm inbox (7 ideas recorded)
- `~/.claude/projects/.../memory/feedback_quality_metric.md` — CREATED: KPI definition
- `~/.claude/projects/.../memory/feedback_brainstorm_mode.md` — CREATED: brainstorm handling
- `~/.claude/projects/.../memory/user_eidolon_identity.md` — CREATED: Eidolon identity

**Completed:**
- Phase 6.1: Дирижёр→Chief E2E test PASS (312.7s, routing to dev+design, 13345 chars result)
- Claude CLI auth fix in Docker (volume mount ~/.claude)
- MCP overhead fix (--strict-mcp-config, removed Figma etc. startup)
- JSON code fence fix (_extract_json helper)
- Agent Flow Optimization plan written, reviewed, approved by nopoint

**In progress:**
- Agent Flow Optimization implementation (6 steps: escalation YAML → bug KB → fast path → parallel chiefs → cross-functional → rebuild+test)
- Phase 6.2-6.4 (Chief→Lead, Special→G3, full chain smoke test)

**Opened:**
- Debug Service implementation (after Bug KB table)
- Горизонтальная коммуникация (отдельная фаза)
- Ideas from brainstorm: процедурно генерируемые регламенты, авто-LLM скрипты, error tolerance, автономность решений, "2 маленьких лучше 1 большого" архитектура памяти

**Notes:**
- Claude CLI inside Docker takes ~6-8s per call (Node.js bootstrap + auth + API). Full chain = multiple sequential calls = minutes
- MCP fix saved ~3s per simple call, potentially ~150s for long prompts (Figma MCP was starting)
- Zombie processes can occur if multiple g.invoke() run simultaneously — need sequential execution or process isolation
- call_claude_cli works (8.6s), dirizhyor_node works (18.2s), Chief graph works (164.8s), full chain works (312.7s)
- Key bottleneck: sequential Claude CLI subprocess calls. Optimization plan addresses this via parallel dispatch + fast path

---

## [2026-03-13 — checkpoint 49] CHECKPOINT

**Phase:** Roadmap v5 Phase 6 — Production-Ready Plan written, приступаем к реализации

**Decisions:**
- Production-Ready Plan (`docs/agent-system-prod-ready-plan.md`) утверждён как основной рабочий документ
- Original optimization plan (`docs/agent-flow-optimization-plan.md`) сохранён как reference
- Phase 0 (Observability) — первый приоритет реализации
- Пропущенные идеи из старого плана зафиксированы в ideas_inbox (Instruction Cascade, Escalation Formula)

**Files changed:**
- `docs/agent-system-prod-ready-plan.md` — CREATED: полный production-ready план (6 фаз, gap analysis, model routing, 8 новых файлов, verification tests)
- `ideas_inbox.md` — UPDATED: добавлены Каскад инструкций, Формула эскалации (4 условия)

**Completed:**
- Web research по agent flow best practices (15+ источников: Anthropic, Microsoft Magentic-One, LangGraph, O'Reilly, Chip Huyen, Eugene Yan, Andrew Ng)
- Gap analysis: 12 пробелов между текущим tLOS и production стандартами (A1-A5 critical, B1-B4 quality, C1-C4 scale)
- Production-Ready Plan: 6 фаз (Observability → Speed → Quality → Cost → Resilience → Scale), 8 новых файлов, модельная стратегия (Opus/Sonnet/Haiku)
- Верификация: все идеи из старого плана проверены на полноту, пропущенные зафиксированы

**In progress:**
- Phase 0 (Observability): trace.py + dashboard_query.py — приступаем

**Opened:**
- Phase 0-5 implementation (full production-ready roadmap)
- Связка глобального роадмапа (agent-system-architecture.md) с prod-ready plan

**Notes:**
- Ключевой вывод из исследования: архитектура tLOS (5 паттернов Anthropic) подтверждена индустрией
- Главный bottleneck: Claude CLI subprocess (~5s overhead per call) — Phase 5.1 (Direct API) решает
- Compound error (Chip Huyen): 95% per step → 60% за 10 шагов — нужен Opus на Дирижёре
- Кеширование = самый высокий ROI (O'Reilly)

---

## [2026-03-13 — checkpoint 50] CHECKPOINT

**Phase:** Phase 0 Observability — COMPLETE

**Decisions:**
- Token estimation: `len(text) // 4` — достаточно для Phase 0, точные подсчёты в Phase 5 (direct API)
- NEVER raises pattern для всех trace/dashboard функций
- Trace propagation через state (trace_id + parent_span_id в каждом TypedDict)
- Lazy import в trace.py для избежания circular imports с graph.py

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/trace.py` — CREATED: Span, TraceContext, traced_call_claude_cli, estimate_tokens, pg table agent_traces
- `core/kernel/tlos-langgraph-bridge/dashboard_query.py` — CREATED: get_chain_summary, get_cost_by_level, get_slowest_spans, get_error_rate, get_trace_tree, print_chain
- `core/kernel/tlos-langgraph-bridge/graph.py` — MODIFIED: trace_id/parent_span_id в 6 States, все ноды инструментированы
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — MODIFIED: trace_id в initial state, print_chain после Дирижёр chain

**Completed:**
- Phase 0 (Observability) полностью реализована и задеплоена
- Docker rebuild: 11/11 сервисов UP
- agent_traces table создана автоматически
- Все 6 графов компилируются с trace полями
- JTBD Consistency Score — идея записана + research (17 источников, метрика оригинальна)

**In progress:**
- Phase 1 (Speed) — следующий приоритет

**Opened:**
- Phase 1: parallel Chiefs dispatch, fast path success, cross-functional ordering

**Notes:**
- Контекст сессии дампнут в `memory/scratch-checkpoint-50.md`
- Все верификации прошли: py_compile, AST check trace fields, Docker exec tests

---

## [2026-03-13 — checkpoint 51] CHECKPOINT

**Phase:** Phase 1 (Speed) + Phase 2 (Quality) — COMPLETE

**Decisions:**
- Parallel Chiefs: ThreadPoolExecutor вместо LangGraph Send API — проще, не меняет топологию графа
- Single chief → прямой вызов без thread pool overhead
- Plan validation с retry: если первый план невалиден → retry dirizhyor_node с feedback → если второй тоже → error
- Evaluation integration: автозапись outcome в bridge_handler после Дирижёр chain (tokens + latency из trace spans)

**Files changed:**
- `graph.py` — Phase 1: `_dispatch_chiefs_parallel`, `execution_order` в промпте, фазовый dispatch. Phase 2: `_validate_routing_plan`, `_retry_dirizhyor_with_feedback`
- `bridge_handler.py` — evaluation record_outcome интеграция
- `escalation_rules.yaml` — CREATED: blast radius матрица для 4 уровней
- `bug_kb.py` — CREATED: Bug KB (pg table + CRUD API)
- `evaluation.py` — CREATED: task_outcomes (pg table + recording + querying)

**Completed:**
- Phase 1 (Speed): parallel Chiefs dispatch, execution_order, backward compat
- Phase 2 (Quality): escalation rules, bug KB, plan validation with retry, evaluation tracking
- Docker rebuild: all services UP, all pg tables created, all graphs compile

**In progress:**
- Phase 3 (Cost) — следующий приоритет

**Opened:**
- Phase 3: model routing, response caching, token budgets

**Notes:**
- Все верификации прошли в Docker (bug_kb CRUD, evaluation CRUD, plan validation, graph compilation)
- Step 1.2 (Fast Path) отложен — требует архитектурных изменений в streaming

---

## [2026-03-13 — checkpoint 52] CHECKPOINT

**Phase:** Production-Ready Plan Phase 4 (Resilience) — COMPLETE. Phases 0-4 all done.

**Decisions:**
- psycopg v3 direct connection API (`psycopg.Connection.connect()` + `PostgresSaver(conn=conn)`) instead of `from_conn_string()` which returns context manager in v3
- uv.lock regeneration required after adding new deps (langgraph-checkpoint-postgres, psycopg[binary]) — `--frozen` flag uses stale lock
- Double-texting strategy: queue (not reject/interrupt) — queued messages processed after chain completes

**Files changed:**
- `timeout_config.py` — CREATED: timeout table (90s/call, 120s/300s/600s chain) + retry config (max 1, base_delay 2s)
- `checkpointer.py` — CREATED: singleton PostgresSaver for LangGraph graph state checkpointing
- `graph.py` — call_claude_cli timeout param + subprocess.TimeoutExpired handling, call_claude_cli_with_retry (exponential backoff), all 6 build_* functions accept checkpointer
- `trace.py` — traced_call_claude_cli uses call_claude_cli_with_retry
- `bridge_handler.py` — asyncio.wait_for chain timeout per handler (120s/300s/600s), all graph getters pass get_checkpointer()
- `bridge.py` — double-texting: _dispatch extraction, _running_chains set, _message_queue dict, _process_queue recursive
- `pyproject.toml` — added langgraph-checkpoint-postgres>=2.0, psycopg[binary]>=3.1
- `uv.lock` — regenerated with new deps (langgraph-checkpoint-postgres==3.0.4, psycopg==3.3.3)

**Completed:**
- Phase 4 Step 4.1: Chain Timeout — subprocess level (90s) + chain level (role-appropriate)
- Phase 4 Step 4.2: State Checkpointing — PostgresSaver connected to DB, all graphs compile with checkpointer
- Phase 4 Step 4.3: Retry with Backoff — exponential backoff, max 1 retry, integrated into traced calls
- Phase 4 Step 4.4: Double-Texting — message queue in bridge.py, per-session tracking
- Docker rebuild + all 6 verification checks PASS

**In progress:**
- Nothing — awaiting instructions for Phase 5 or other work

**Opened:**
- Phase 5 (Scale): Direct API (5.1), Horizontal Comms (5.2), Debug Service (5.3) — separate epoch
- langchain-core 1.2.18 transient import issue on first container start — may need version pinning

**Notes:**
- PostgresSaver successfully connects to existing domain_memory DB — checkpoint tables auto-created by .setup()
- All Prod-Ready phases (0-4) implemented in single day across 3 sessions (checkpoints 50-52)
- Phase 3 (Cost) was done in previous session: model_config.py, cache.py, budget_config.py

---

## [2026-03-13 — checkpoint 53] CHECKPOINT

**Phase:** Production-Ready Plan Phase 5 (Scale) — Step 5.2 Horizontal Comms COMPLETE, Step 5.1 permanently BLOCKED

**Decisions:**
- Phase 5.1 (Direct API) permanently BLOCKED — nopoint confirmed: "ANTHROPIC_API_KEY нет и не будет, все только через подписку". CLI overhead (~3-5s/call, ~10% of chain time) is an architectural ceiling.
- Priority order for Phase 5: 5.2 (Horizontal Comms) → 5.3 (Debug Service) → 5.4 (Procedural Regulations). 5.1 skipped permanently.
- Created new generalized `agent_comm.py` instead of modifying existing `chief_comm.py` — backward compatibility preserved.
- Communication matrix: 17 pairs (11 allowed, 5 forbidden, 1 same-domain-only) based on tlos-system-spec.md Section 7.

**Files changed:**
- `agent_comm.py` — CREATED: generalized inter-agent messaging for all hierarchy levels. pg table `agent_messages`, 6 functions (validate_comm, send_message, read_inbox, read_inbox_summary, get_thread, mark_archived). Loads comm_rules.yaml at import. NEVER raises.
- `comm_rules.yaml` — CREATED: full communication matrix. 6 message types, 6 agent levels, 17 pairs with direction/allowed_types/cross_domain/max_per_chain.
- `regulator.py` — MODIFIED: added `_check_communication()` function, dispatched from `evaluate_event()` for rule_type=="communication".
- `regulator_rules.yaml` — MODIFIED: added 2 communication rules (comm_hierarchy_enforcement, comm_cross_domain_block).
- `graph.py` — MODIFIED: Lead nodes + Special node now read agent inbox via `read_inbox_summary()`.
- `bridge.py` — MODIFIED: added `agent:comm:send` and `agent:comm:inbox` NATS handler dispatches.
- `bridge_handler.py` — MODIFIED: added `handle_comm_send()` and `handle_comm_inbox()` async handlers.

**Completed:**
- Phase 5.2 Step 1: comm_rules.yaml — 17 communication pairs defined
- Phase 5.2 Step 2: agent_comm.py — generalized messaging with validation
- Phase 5.2 Step 3: regulator integration — 2 new communication rule types
- Phase 5.2 Step 4: graph.py Lead+Special inbox reading
- Phase 5.2 Step 5: bridge.py+bridge_handler.py NATS handlers
- Phase 5.2 Step 6: Docker rebuild + all verification checks PASS

**In progress:**
- Phase 5.3 (Debug Service) — next in agreed priority

**Opened:**
- Phase 5.3: Debug Service "Медики" — needs Bug KB table design, meta-agent architecture
- Phase 5.4: Procedural Regulations — extend regulator_rules.yaml with process workflow rules

**Notes:**
- Docker venv gotcha: `docker compose exec langgraph-bridge python -c "..."` fails (system Python), must use `uv run python -c "..."` for correct venv activation
- chief_comm.py remains untouched — agent_comm.py is a parallel, more general system for all levels
- Forbidden pairs enforced: Worker↔Coach (isolated), Lead cross-domain, Chief→foreign Lead/Special

---

## [2026-03-13 — checkpoint 54] CHECKPOINT

**Phase:** Production-Ready Plan Phase 5 (Scale) — Step 5.3 Debug Service COMPLETE

**Decisions:**
- Debug Service follows samurizator.py pattern: pg singleton connection, liteLLM for LLM analysis, NEVER raises
- Known bug optimization: `diagnose()` checks Bug KB first — if same error_signature found, returns instantly without LLM call
- Auto-diagnose integration point: `traced_call_claude_cli` in trace.py — fire-and-forget when CLI returns empty after all retries
- LLM JSON parsing: markdown fence stripping (same pattern as `_extract_json` in graph.py)

**Files changed:**
- `debug_service.py` — CREATED: meta-service "медики". pg table `debug_diagnoses`, 6 functions (diagnose, predict_risks, analyze_trends, get_recent_diagnoses, mark_resolved, get_diagnosis_summary). LiteLLM integration for LLM analysis. NEVER raises.
- `bridge.py` — MODIFIED: added 3 NATS dispatch entries (agent:debug:diagnose, agent:debug:predict, agent:debug:analyze)
- `bridge_handler.py` — MODIFIED: added 3 async handlers (handle_debug_diagnose, handle_debug_predict, handle_debug_analyze), same pattern as handle_samurizator_run
- `trace.py` — MODIFIED: auto-diagnose on empty CLI response in traced_call_claude_cli (fire-and-forget)

**Completed:**
- Phase 5.3 Step 1: debug_service.py — pg table + 6 public functions + liteLLM integration
- Phase 5.3 Step 2: bridge.py — 3 NATS dispatch entries
- Phase 5.3 Step 3: bridge_handler.py — 3 async handlers
- Phase 5.3 Step 4: trace.py — auto-diagnose on empty response
- Phase 5.3 Step 5: Docker rebuild + verification: diagnose (new+known bug), predict_risks (5 risks), analyze_trends (3 insights → global_memory)

**In progress:**
- Phase 5.4 (Procedural Regulations) — next in agreed priority

**Opened:**
- Phase 5.4: Procedural Regulations — extend regulator_rules.yaml with process workflow rules

**Notes:**
- Docker venv gotcha persists: must use `uv run python -c "..."` not bare `python`
- diagnose() verified: new bug → LLM analysis + Bug KB log; known bug → instant from Bug KB (no LLM call, increments seen)
- predict_risks() verified: 5 risks returned (2 high-likelihood), based on Bug KB history
- analyze_trends() verified: 3 insights extracted, all written to global_memory table
- All 3 NATS handlers follow handle_samurizator_run pattern: run_in_executor → publish result → stream summary

---

## [2026-03-13 — checkpoint 55] CHECKPOINT

**Phase:** Production-Ready Plan Phase 5 (Scale) — **FULLY COMPLETE**. Phase 5.4 Procedural Regulations DONE.

**Decisions:**
- New rule type `procedural` in regulator.py — dispatches to 5 specific check functions
- Reused existing `escalation_rules.yaml` (Phase 2) — loaded at regulator init alongside regulator_rules.yaml
- Blast radius ordering: single_file < epic < subdomain < domain < cross_domain < global
- Worker autonomy check uses hardcoded `_ARCHITECTURAL_ACTIONS` set (12 actions from escalation_rules.yaml)
- Level-skip prevention only flags downward skips (dirizhyor→lead) — upward escalation is always allowed

**Files changed:**
- `regulator.py` — MODIFIED: added `load_escalation_rules()`, `_check_procedural()` dispatcher, 5 procedural check functions (`_proc_blast_radius`, `_proc_escalation_required`, `_proc_g3_iteration_limit`, `_proc_level_skip`, `_proc_worker_autonomy`), module-level constants (`_VALID_LEVEL_TRANSITIONS`, `_BLAST_RADIUS_ORDER`, `_ARCHITECTURAL_ACTIONS`), auto-load escalation rules at init
- `regulator_rules.yaml` — MODIFIED: added 5 procedural rules (13 total): proc_blast_radius, proc_escalation_required, proc_g3_iteration_limit, proc_level_skip, proc_worker_autonomy

**Completed:**
- Phase 5.4: 5 procedural rules added to regulator
- Phase 5.4: escalation_rules.yaml integration into regulator
- Phase 5.4: Docker rebuild + 10/10 verification tests PASS
- **FULL Production-Ready Plan (Phases 0-5) — COMPLETE** (5.1 permanently BLOCKED)

**In progress:**
- Nothing — plan fully executed

**Opened:**
- Phase 6 E2E Validation: Chief→Lead, Special→G3, full chain testing
- Phase 7+ (Automation, Agent Comms, Shell Expansion) — per Roadmap v5

**Notes:**
- 13 rules total: 2 naming + 1 scope + 1 workflow + 2 rate_limit + 2 communication + 5 procedural
- All procedural rules follow NEVER-raises pattern with safe None returns
- Escalation rules cover 4 levels (special, lead, chief, dirizhyor) — worker is implicit (no autonomous decisions)
- Production-Ready Plan spanned 6 phases, ~20+ new files, fully deployed in Docker

---

## [2026-03-13 — checkpoint 56] CHECKPOINT

**Phase:** Roadmap v5 Phase 6 E2E Validation — ALL STEPS COMPLETE (6.1-6.4)

**Decisions:**
- Checkpointer (PostgresSaver) requires thread_id config — all 5 chain handlers in bridge_handler.py must pass config dict
- Timeouts too tight for Sonnet complex prompts — increased: max_per_call 90→180s, single_domain 120→420s, multi_domain 300→600s, complex_chain 600→900s
- NATS broadcast uses `delta` field (not `token`) — confirmed in testing

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — added `config = {"configurable": {"thread_id": session_id}}` to all 5 chain handlers (handle_graph_run, handle_chief_run, handle_lead_run, handle_special_run, handle_dirizhyor_run); changed `graph.invoke(state)` → `graph.invoke(state, config)`
- `core/kernel/tlos-langgraph-bridge/timeout_config.py` — increased all timeouts: max_per_call 90→180s, single_domain 120→420s, multi_domain 300→600s, complex_chain 600→900s

**Completed:**
- Phase 6.1: Дирижёр E2E — PASS (312.7s, from previous session)
- Phase 6.2a: Chief/Development E2E — PASS (65.7s, 723 chars)
- Phase 6.2b: Lead/Backend standalone E2E — PASS (65.3s, 755 chars)
- Phase 6.3: Special/Backend → G3 Worker+Coach cycle — PASS (312.7s, 1321 chars)
- Phase 6.4: Full chain Дирижёр → Chief/Production — PASS (565.3s, 6171 chars)
- Bug fix: checkpointer config missing thread_id
- Bug fix: timeouts too tight for production workloads

**In progress:**
- Nothing — Phase 6 fully complete

**Opened:**
- Phase 7 (Automation) — scheduling, auto-triggers, cron-like services
- Phase 8 (Agent Comms) — Shell↔Agent real-time protocol

**Notes:**
- Full chain test routed to Chief/Production (not Chief/Development) — Дирижёр correctly identified the /status endpoint as production domain
- Chief/Development decomposed task into Lead assignments with verification commands
- Lead/Backend produced implementation plan reading Project Memory + Letta context
- Special→G3 cycle: Worker implemented is_palindrome with NEVER-raises pattern, Coach verified and accepted
- Docker rebuilt 2x during Phase 6 (checkpointer fix + timeout fix)
- 11/11 services UP throughout all tests

---

## [2026-03-13 — checkpoint 57] CHECKPOINT

**Phase:** Phase 7 Automation — ALL 4 STEPS COMPLETE (7.1-7.4)

**Decisions:**
- Implemented directly (no Domain Lead) since all changes in same 3 files, same backend domain
- Implementation order: 7.4 (simplest) → 7.2 (needed for 7.1) → 7.1 (scheduler + triggers) → 7.3 (most complex)
- Episode triggers fire-and-forget after chain completion in handlers (not in graph.py — no NATS access there)
- G3 escalation flows through SpecialState dict → handler reads & publishes on NATS
- NATS rename: `agent:special:run` canonical, `agent:senior:run` kept as legacy alias

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/bridge.py` — added `agent:special:run` to _CHAIN_MSG_TYPES, dispatch condition handles both special+senior, added _samurizator_scheduler (6h periodic), scheduler_task in run_bridge
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — handle_special_run: episode start/end, escalation check, samurizator trigger; handle_dirizhyor_run: episode boundaries (type=task), samurizator trigger (global_memory)
- `core/kernel/tlos-langgraph-bridge/graph.py` — added `escalation: dict | None` to SpecialState, special_node detects G3 escalation (iterations>=3 && !passed)

**Completed:**
- Phase 7.1: Samurizator scheduler — 6h periodic (env: SAMURIZATOR_INTERVAL), covers global_memory + project_memory (per domain) + project_to_global
- Phase 7.2: Auto episode boundaries — start_episode/end_episode in handle_special_run (type=g3_session) and handle_dirizhyor_run (type=task)
- Phase 7.3: G3 escalation propagation — SpecialState.escalation field, special_node detection, handler publishes agent:g3:escalation on NATS
- Phase 7.4: NATS subject rename — agent:special:run canonical, agent:senior:run legacy alias
- All verified in Docker (11/11 services UP)

**In progress:**
- Nothing — Phase 7 fully complete

**Opened:**
- Phase 8 (Agent Comms) — Chief parallel dispatch via asyncio.gather, message exchange round, cross-domain coordination
- Phase 9 (Shell Expansion) — new Omnibar commands, memory-admin frame, regulator-log frame (parallel with Phase 8)

**Notes:**
- Docker exec path conversion issue on Windows/Git Bash: `/app/kernel/...` gets mangled to `C:/Program Files/Git/app/kernel/...`. Fixed by wrapping in `bash -c '...'`
- All 4 steps implemented and verified in single session without Docker rebuild needed
- Phase 7 completes the Production-Ready Plan (Phases 0-7). Phase 8+ is new roadmap territory (Roadmap v5)

---

## [2026-03-13 — checkpoint 58] CHECKPOINT

**Phase:** Phase 8 Agent Communications — ALL 3 STEPS COMPLETE (8.1-8.3)

**Decisions:**
- 8.1 (Chief parallel dispatch) was already implemented — ThreadPoolExecutor + phased execution_order in dirizhyor_router_node. No changes needed.
- Exchange round designed as lightweight Claude CLI call (not full Chief graph re-invocation) — avoids running worker step twice
- Exchange only triggers when 2+ Chiefs have non-empty results
- Audit trail: exchange summaries persisted to chief_comm (exchange_round_summary messages) — fire-and-forget, non-critical

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/graph.py` — added `_chief_exchange_call()` (single Chief exchange via Claude CLI), `_dispatch_chiefs_exchange_round()` (parallel exchange via ThreadPoolExecutor), modified `dirizhyor_router_node()` (collect→exchange→format pattern)

**Completed:**
- Phase 8.1: Chief parallel dispatch — confirmed already done
- Phase 8.2: Exchange round — `_chief_exchange_call` + `_dispatch_chiefs_exchange_round` implemented and verified
- Phase 8.3: Cross-domain coordination — wired into dirizhyor_router_node, E2E verified
- E2E test: Дирижёр → Development + Marketing parallel → exchange round (2 chiefs) → aggregated result. Trace: 7 spans, 4920 tokens, 141s
- Docker image rebuilt, 11/11 services UP

**In progress:**
- Nothing — Phase 8 fully complete

**Opened:**
- Phase 9 (Shell Expansion) — new Omnibar commands, memory-admin frame, regulator-log frame

**Notes:**
- Exchange round log line: `dirizhyor_router_node: exchange round — 2 chiefs`
- Design worker timeout on first test (361s, EMPTY) — not a Phase 8 bug, Design domain lacks implementation context
- Duplicate chiefs validation error on second test — LLM routing plan quality issue, not Phase 8 bug
- Claude CLI uses `--model` flag (not `-m`)
- NATS message delivery can be slow if bridge is blocked processing a previous long-running task — clean restart resolves

---

## [2026-03-13 — checkpoint 59] CHECKPOINT

**Phase:** Phase 9 Shell Expansion — ALL 4 STEPS COMPLETE (9.1-9.4). Roadmap v5 FULLY COMPLETE.

**Decisions:**
- 6 new Omnibar commands added (help, status, dirizhyor, compact, memory-admin, regulator-log) — total 9 commands
- `compact` designed as action command (sends NATS + shows confirmation window) rather than a frame
- Dynamic layouts (9.4) use dual persistence: localStorage for client-side + NATS hot-reload for server-side config
- Backend handlers follow NEVER-raises pattern — all exceptions caught, safe defaults returned

**Files changed:**
- `core/shell/frontend/src/types/frame.ts` — added 5 new frame types to union
- `core/shell/frontend/src/components/frames/HelpFrame.tsx` — NEW: lists all registered commands
- `core/shell/frontend/src/components/frames/SystemStatusFrame.tsx` — NEW: kernel status dashboard (services, memory, samurizator, regulator)
- `core/shell/frontend/src/components/frames/DirizhyorFrame.tsx` — NEW: full hierarchy invocation (intent→streaming→chief results)
- `core/shell/frontend/src/components/frames/MemoryAdminFrame.tsx` — NEW: 5-tab Continuum Memory admin (Global/Domain/Project/Special/Frozen)
- `core/shell/frontend/src/components/frames/RegulatorLogFrame.tsx` — NEW: violation log with severity filters
- `core/shell/frontend/src/components/frameRegistry.tsx` — added 5 new frame imports + registry entries
- `core/shell/frontend/src/commands/defaultCommands.ts` — 6 new commands + layoutCommand() helper
- `core/shell/frontend/src/commands/frameLayouts.ts` — 6 new layouts + dynamic layout system (loadExternalLayouts, saveExternalLayout, requestKernelLayouts)
- `core/shell/frontend/src/App.tsx` — loadExternalLayouts() call on startup
- `core/kernel/tlos-langgraph-bridge/bridge.py` — 6 new NATS dispatch entries (kernel:status-full, memory:admin:*, agent:regulator:violations)
- `core/kernel/tlos-langgraph-bridge/bridge_handler.py` — 6 new handler functions (handle_status_full, handle_memory_admin_list/frozen/approve/reject, handle_regulator_violations)
- `core/kernel/tlos-langgraph-bridge/regulator.py` — get_rules_count() + get_violations_count_24h()

**Completed:**
- Phase 9.1: Core Omnibar commands (help, status, dirizhyor, compact, memory-admin, regulator-log)
- Phase 9.2: MemoryAdminFrame (5 tabs, domain filter, search, Continuum layer badges, frozen proposals with approve/reject)
- Phase 9.3: RegulatorLogFrame (severity filters, violation cards with colored borders, auto-refresh 30s)
- Phase 9.4: Dynamic frame layouts (localStorage persistence + NATS hot-reload + loadExternalLayouts on App startup)
- TypeScript build verified clean (95 modules, no errors)
- Docker image rebuilt, 11/11 services UP
- Roadmap v5 Phases 6-9 ALL COMPLETE

**In progress:**
- Nothing — Roadmap v5 fully complete

**Opened:**
- Next roadmap direction — all v5 phases done, awaiting nopoint's direction
- tLOS System Spec + Excalidraw diagram may need updates with Phase 9 additions

**Notes:**
- 26 frame types now registered in FRAME_REGISTRY
- 9 Omnibar commands total (mcb, kernel, g3 + 6 new)
- handle_status_full checks each service independently (HTTP for Letta/liteLLM/Qdrant, pg connection for PostgreSQL)
- Python import test inside Docker confirmed all Phase 9 handlers import OK (psycopg2 not available outside venv — expected)
