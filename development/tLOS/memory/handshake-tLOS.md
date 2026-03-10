# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 13) by Assistant

---

## Где мы сейчас

L2 Kernel 4/5 DONE. Always-On Docker Kernel полностью запущен (session 13): все 6 сервисов online, inter-container networking исправлен, Qdrant + Domain Memory + NATS подключены. ZepClient переименован в DomainMemory.

---

## Следующий приоритет

1. **D5** — Docker Desktop autostart + `core/kernel/.env` с `NIM_KEY` (Always-On без grid.ps1)
2. **L2 Step 5** — tLOS Agent Frames (agent-status, g3-session, memory-viewer) в SolidJS canvas
3. **CLEANUP** — удалить `zep-client.js` (orphaned legacy, заменён на `domain-memory.js`)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| docker-v1 | Dockerization D1–D6 | OPEN — D1+D2+D4+networking DONE; D5+D6 остались |
| omnibar | SEC: PatchDialog Nostr sig + system prompt permissions | OPEN |
| workspace-v1 | Организация рабочего пространства nopoint + Артём | OPEN |
| mcb-v1 | Marketing Command Board для Артёма | BLOCKED — ждём API |
| node-v1 | Nostr patch pipeline | SHIPPED — ждём Артёма |
| website-v1 | THELOS marketing site | OPEN |

---

## Критические данные

| Ключ | Значение |
|---|---|
| Claude default model | `claude-sonnet-4-6` |
| Unified docker-compose | `core/kernel/docker-compose.yml` — 6 сервисов |
| Docker project name | `tlos-zep-bridge` (для сохранения named volumes) |
| Claude bridge Dockerfile | `core/kernel/tlos-claude-bridge/Dockerfile` (node:22-alpine) |
| LangGraph bridge Dockerfile | `core/kernel/tlos-langgraph-bridge/Dockerfile` (python:3.12-slim+Node22+uv) |
| Build context | `core/` (для обоих Dockerfile) |
| NATS на хосте | `nats-server -a 0.0.0.0` (НЕ 127.0.0.1 — Docker не достучится) |
| Inter-container env vars | QDRANT_URL=qdrant:6333, LITELLM_URL=litellm:4000, LETTA_URL=letta:8283, DB_HOST=db, DB_PORT=5432 |
| NIM_KEY | `~/.tlos/nim-key` — нужен как env var для litellm; D5: в `.env` файл `core/kernel/.env` |
| Session persistence | `~/.tlos/sessions.json` |
| Domain Memory | `domain-memory.js` (бывший zep-client.js) — pg+pgvector+liteLLM |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| История сессий | development/tLOS/memory/chronicle-tLOS.md |
| **Роадмап (главный)** | **docs/agent-system-architecture.md** |
| Unified docker-compose | development/tLOS/core/kernel/docker-compose.yml |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Domain Memory | development/tLOS/core/kernel/tlos-claude-bridge/domain-memory.js |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] **D5**: NIM_KEY в `.env` файл `core/kernel/.env` — gitignore + инструкция для nopoint
- [ ] **D5**: Docker Desktop autostart — Settings → General → Start Docker Desktop when you sign in
- [ ] **L2 Step 5**: tLOS Agent Frames — какой фрейм первым? agent-status / g3-session / memory-viewer
- [ ] **CLEANUP**: удалить `zep-client.js` (orphaned, `domain-memory.js` его заменил)
- [ ] **CLEANUP**: grid.ps1 + legacy `config.yaml.template`, `mem0-wrapper.py`
- [ ] **SEED**: sync tlos_facts seed → tlos-global Qdrant on bridge startup
- [ ] **Icon**: monolith.ico прозрачность — проверить на светлом рабочем столе
