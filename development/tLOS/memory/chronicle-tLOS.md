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
