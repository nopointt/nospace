# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 14) by Assistant

---

## Где мы сейчас

L2 Kernel 4/5 DONE. **Dockerization D1–D6 ALL DONE** (session 14): Always-On Kernel полностью готов — `core/kernel/.env` (NIM_KEY), seed sync pg→Qdrant, agent-system-architecture.md актуализирован. Docker Desktop autostart — ручной шаг nopoint.

---

## Следующий приоритет

1. **Docker Desktop autostart** — Settings → General → ☑ "Start Docker Desktop when you sign in" (ручной шаг nopoint)
2. **Rebuild claude-bridge** — `docker compose build claude-bridge && docker compose up -d claude-bridge` (чтобы seed sync заработал)
3. **L2 Step 5** — tLOS Agent Frames (agent-status, g3-session, memory-viewer) в SolidJS canvas

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| docker-v1 | Dockerization D1–D6 — Always-On Kernel | **DONE** — можно закрыть / merge |
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
| NIM_KEY | `core/kernel/.env` (gitignored) — читается Docker Compose автоматически |
| NIM_KEY source | `~/.tlos/nim-key` |
| NATS на хосте | `nats-server -a 0.0.0.0` (НЕ 127.0.0.1 — Docker не достучится) |
| Inter-container env vars | QDRANT_URL=qdrant:6333, LITELLM_URL=litellm:4000, LETTA_URL=letta:8283, DB_HOST=db, DB_PORT=5432 |
| Session persistence | `~/.tlos/sessions.json` |
| Domain Memory | `domain-memory.js` — pg+pgvector+liteLLM; seed sync pg→Qdrant добавлен в bridge startup |
| Rebuild required | `docker compose build claude-bridge` (для seed sync в index.js) |

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

- [ ] **Docker Desktop autostart** — ручной шаг: Settings → General → ☑ Start Docker Desktop when you sign in
- [ ] **Rebuild claude-bridge** — нужен для активации seed sync (index.js изменён)
- [ ] **L2 Step 5** — какой Agent Frame первым? agent-status / g3-session / memory-viewer
- [ ] **CLEANUP** — удалить `zep-client.js` (orphaned), `config.yaml.template`, `mem0-wrapper.py` (rm дважды отклонён)
- [ ] **docker-v1 branch** — все D1-D6 done, можно закрыть и merge
- [ ] **Icon** — monolith.ico прозрачность — проверить на светлом рабочем столе
