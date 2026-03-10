# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 8 close) by Assistant

---

## Где мы сейчас

L2 Kernel Steps 1-2-3 завершены. Zep CE Docker stack LIVE (PostgreSQL+pgvector HNSW + Neo4j + Graphiti + Zep v0.27.2, port 8000). Semantic search через Graphiti + NIM LLM. Docker Desktop v29.2.1 установлен и работает.

---

## Следующий приоритет

1. **Verify Zep CE** — протестировать end-to-end: add fact → getDomainContext → Eidolon видит fact → searchFacts semantic (убедиться что Graphiti+NIM извлекает entities)
2. **SEC** — PatchDialog: верификация Nostr-подписи патчей (`nostr-tools`)
3. **SEC** — System prompt files: ограничить права доступа (world-readable)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | SEC items: PatchDialog Nostr sig + system prompt permissions | **OPEN** |
| workspace-v1 | Организация рабочего пространства | OPEN |
| mcb-v1 | Marketing Command Board для Артёма | BLOCKED — ждём API доступы |
| node-v1 | Nostr patch pipeline | SHIPPED — ждём Артёма |
| website-v1 | THELOS marketing site | OPEN |

---

## Критические данные

| Ключ | Значение |
|---|---|
| Claude default model | `claude-sonnet-4-6` |
| Claude bridge path | `core/kernel/tlos-claude-bridge/index.js` |
| Bridge spawn mode | `--print` + stdin (НЕ `-p arg`) |
| Letta path | `/c/Users/noadmin/.local/bin/letta` (uv tool) |
| Letta port | `localhost:8283` |
| LangGraph bridge path | `core/kernel/tlos-langgraph-bridge/main.py` |
| Zep CE stack | `core/kernel/tlos-zep-bridge/docker-compose.yml` (port 8000) |
| Zep config | `config.yaml` генерируется grid.ps1 из `config.yaml.template` + NIM key |
| Zep config path | `core/kernel/tlos-zep-bridge/config.yaml` (gitignored) |
| Zep client | `core/kernel/tlos-claude-bridge/zep-client.js` |
| NIM key | `~/.tlos/nim-key` — временный (12ч), обновить при истечении |
| Session persistence | `~/.tlos/sessions.json` — claudeSessionId + turns |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| История сессий | development/tLOS/memory/chronicle-tLOS.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Zep client | development/tLOS/core/kernel/tlos-claude-bridge/zep-client.js |
| Zep docker-compose | development/tLOS/core/kernel/tlos-zep-bridge/docker-compose.yml |
| Zep config template | development/tLOS/core/kernel/tlos-zep-bridge/config.yaml.template |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] **VERIFY**: Zep CE semantic search — Graphiti NIM извлекает entities? (тест: add_fact → search semantic)
- [ ] **SEC**: PatchDialog — нет верификации Nostr-подписи (нужен nostr-tools)
- [ ] **SEC**: System prompt files world-readable
- [ ] **ARCH**: Персистировать lettaAgentIds → sessions.json (V1 debt)
- [ ] **L2 Step 4**: Qdrant self-hosted + Associative Routing
- [ ] **L2 Step 5**: tLOS Agent Frames (agent-status, g3-session, memory-viewer)
- [ ] **FEATURE**: microagents harkly.md, nostr.md, rust.md
- [ ] **FIX LOW**: asyncio.get_event_loop() → get_running_loop() в bridge_handler.py
- [ ] **FIX LOW**: model не прокидывается в worker_node через GraphState
