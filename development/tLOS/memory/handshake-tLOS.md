# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 10 checkpoint 6) by Assistant

---

## Где мы сейчас

L2 Kernel Step 3: заменяем Zep CE на direct pg+pgvector+liteLLM. liteLLM proxy работает (1536-dim NIM embeddings подтверждены). Zep CE v0.27.2 — dead project с двумя hardcodes (embedding model + embedder disabled). Следующий шаг: переписать zep-client.js на прямые pg+liteLLM вызовы, убрать 4 контейнера (zep, graphiti, neo4j, nlp).

---

## Следующий приоритет

1. **REPLACE ZEP** — переписать zep-client.js: direct pg (INSERT+SELECT+pgvector cosine) + liteLLM (/v1/embeddings). Тот же API (addFact, getContext, searchFacts). docker-compose: оставить только db + litellm.
2. **SEC** — PatchDialog: верификация Nostr-подписи патчей (nostr-tools)
3. **L2 Step 4** — Qdrant self-hosted + Associative Routing

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
| **liteLLM proxy** | Docker `ghcr.io/berriai/litellm:main-latest`, port 4000, config: `litellm-config.yaml` |
| **liteLLM embedding model** | `nvidia/llama-3.2-nv-embedqa-1b-v2` (Matryoshka, dims=1536, input_type=query) |
| **NIM key** | `~/.tlos/nim-key` — `nvapi-Nr1pEDT...KTG2` |
| **Zep CE** | DEAD PROJECT (discontinued April 2025). v0.27.2 has unfixable hardcodes. BEING REPLACED. |
| **pg+pgvector** | `ghcr.io/getzep/postgres:latest` — already running, has pgvector + HNSW, vector(1536) columns |
| Docker Desktop | v29.2.1, WSL2. Все Docker ops — через него |
| Session persistence | `~/.tlos/sessions.json` |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| История сессий | development/tLOS/memory/chronicle-tLOS.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| **Zep client (TO REWRITE)** | development/tLOS/core/kernel/tlos-claude-bridge/zep-client.js |
| **liteLLM config** | development/tLOS/core/kernel/tlos-zep-bridge/litellm-config.yaml |
| **Docker compose** | development/tLOS/core/kernel/tlos-zep-bridge/docker-compose.yml |
| Agent system arch | nospace/docs/agent-system-architecture.md |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] **IMMEDIATE**: Rewrite zep-client.js → direct pg+liteLLM (same API, no Zep dependency)
- [ ] **IMMEDIATE**: Simplify docker-compose: keep only db + litellm (remove zep, graphiti, neo4j, nlp)
- [ ] **ARCH**: Summarize Service — liteLLM chat/completions + pg summaries table (CMA consolidation)
- [ ] **SEC**: PatchDialog — нет верификации Nostr-подписи (нужен nostr-tools)
- [ ] **SEC**: System prompt files world-readable
- [ ] **L2 Step 4**: Qdrant self-hosted + Associative Routing
- [ ] **L2 Step 5**: tLOS Agent Frames
