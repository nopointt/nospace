# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 12) by Assistant

---

## Где мы сейчас

L2 Kernel 4/5 DONE. Dockerization D1+D2+D4 SHIPPED (session 12): Dockerfiles для claude-bridge и langgraph-bridge, unified docker-compose.yml (6 сервисов), grid.ps1 обновлён. Docker stack теперь включает все kernel AI сервисы.

---

## Следующий приоритет

1. **D5** — Docker Desktop autostart + NIM_KEY через `.env` файл в `core/kernel/` (Always-On Kernel без grid.ps1)
2. **L2 Step 5** — tLOS Agent Frames (agent-status, g3-session, memory-viewer) в SolidJS canvas
3. **SEC** — PatchDialog Nostr sig + system prompt file permissions (branch: omnibar)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| docker-v1 | Dockerization D1–D6 | OPEN — D1+D2+D4 done, D5+D6 остались |
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
| Claude bridge Dockerfile | `core/kernel/tlos-claude-bridge/Dockerfile` (node:22-alpine + claude CLI) |
| LangGraph bridge Dockerfile | `core/kernel/tlos-langgraph-bridge/Dockerfile` (python:3.12-slim + Node22 + uv + claude CLI) |
| Docker build context | `core/` (для обоих Dockerfile — сохраняет путь `../../agents/eidolon`) |
| NATS в Docker | `host.docker.internal:4222` (NATS остаётся native на хосте) |
| Credentials mount | `${USERPROFILE}/.claude.json` + `${USERPROFILE}/.tlos` → `/root/` |
| Agent configs mount | `../agents/eidolon:/app/agents/eidolon:ro` (relative to `core/kernel/`) |
| NIM_KEY | `~/.tlos/nim-key` — нужен как env var для litellm; D5: в `.env` файл `core/kernel/.env` |
| Session persistence | `~/.tlos/sessions.json` |

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
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] **D5**: NIM_KEY в `.env` файл `core/kernel/.env` — gitignore + инструкция для nopoint
- [ ] **D5**: Docker Desktop autostart — Settings → General → Start Docker Desktop when you sign in
- [ ] **L2 Step 5**: tLOS Agent Frames — какой фрейм первым? agent-status / g3-session / memory-viewer
- [ ] **CLEANUP**: grid.ps1 + legacy `config.yaml.template`, `mem0-wrapper.py`
- [ ] **SEED**: sync tlos_facts seed → tlos-global Qdrant on bridge startup
- [ ] **Icon**: monolith.ico прозрачность — проверить на светлом рабочем столе
