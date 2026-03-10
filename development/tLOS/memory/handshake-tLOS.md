# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 15) by Assistant

---

## Где мы сейчас

**L2 Kernel ALL DONE (5/5)** — session 15. Все 5 шагов L2 завершены: Letta, LangGraph, Domain Memory, Associative Routing, Agent Frames. docker-v1 merged → main, legacy files archived. Следующий приоритет: L3 Agent Hierarchy (Step 6).

---

## Следующий приоритет

1. **Rebuild claude-bridge** — `docker compose build claude-bridge && docker compose up -d claude-bridge` (для kernel:ping + memory handlers)
2. **L3 Step 6** — Agent Hierarchy: Chief → Lead → Senior агенты (новая ветка `l3-agents`)
3. **SEC branch (omnibar)** — PatchDialog Nostr sig verification + system prompt file permissions

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
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
| NIM_KEY | `core/kernel/.env` (gitignored) |
| Rebuild required | `docker compose build claude-bridge && docker compose up -d claude-bridge` |
| Omnibar команды | `mcb`, `kernel` (agent-status+memory-viewer), `g3` (g3-session) |
| Agent Frames | `core/shell/frontend/src/components/frames/` — AgentStatusFrame, MemoryViewerFrame, G3SessionFrame |
| Archive rule | Никогда не удалять файлы — архивировать в `core/kernel/archive/` |
| L2 status | **ALL DONE 5/5** — готово к L3 |

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
| Agent Frames | development/tLOS/core/shell/frontend/src/components/frames/ |

---

## Открытые вопросы

- [ ] **Rebuild claude-bridge** — нужен для активации kernel:ping + memory handlers
- [ ] **L3 Step 6** — какой агент первым: Chief или Lead? Какой домен?
- [ ] **docker-v1 remote** — удалить: `git push origin --delete docker-v1`; local: `git branch -D docker-v1`
- [ ] **Icon** — monolith.ico прозрачность — проверить на светлом рабочем столе
- [ ] **Docker Desktop autostart** — ручной шаг: Settings → General → ☑ Start Docker Desktop when you sign in
