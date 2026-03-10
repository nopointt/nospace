# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 16) by Assistant

---

## Где мы сейчас

**L2 Kernel ALL DONE (5/5)** — session 16. Полный Docker стек: NATS + 5 Rust сервисов (shell-bridge, dispatcher, fs-bridge, shell-exec, agent-bridge) теперь в Docker. grid.ps1 Docker-only. lettaAgentIds персистируются в `~/.tlos/letta-agents.json`. Следующий приоритет: L3 Agent Hierarchy (Step 6).

---

## Следующий приоритет

1. **First build + тест:** `cd core/kernel && docker compose build shell-bridge dispatcher fs-bridge shell-exec && docker compose up -d` → проверить все индикаторы зелёные
2. **L3 Step 6** — Agent Hierarchy: Chief Agent (ветка `l3-agents`)
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
| Unified docker-compose | `core/kernel/docker-compose.yml` — **12 сервисов** |
| NIM_KEY | `core/kernel/.env` (gitignored) |
| grid.ps1 run | Docker compose up -d (все сервисы) + Tauri (native only) |
| First build Rust | `docker compose build shell-bridge dispatcher fs-bridge shell-exec` |
| WORKSPACE_ROOT | Auto-resolved в grid.ps1 (Split-Path $Root -Parent) |
| lettaAgentIds | `~/.tlos/letta-agents.json` — персистируется |
| Dockerfile Rust | `core/kernel/Dockerfile.rust-services` — multi-stage |
| Archive rule | Никогда не удалять файлы — архивировать в `core/kernel/archive/` |
| Refactor | После L3 Step 9 — не раньше |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| История сессий | development/tLOS/memory/chronicle-tLOS.md |
| **Роадмап (главный)** | **docs/agent-system-architecture.md** |
| Unified docker-compose | development/tLOS/core/kernel/docker-compose.yml |
| Rust Dockerfile | development/tLOS/core/kernel/Dockerfile.rust-services |
| grid.ps1 | development/tLOS/core/grid.ps1 |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Agent Frames | development/tLOS/core/shell/frontend/src/components/frames/ |

---

## Открытые вопросы

- [ ] **First build Rust Docker** — запустить и проверить все индикаторы зелёные
- [ ] **L3 Step 6** — с какого агента начать: Chief или Lead? Какой домен?
- [ ] **docker-v1 remote** — удалить: `git push origin --delete docker-v1`; local: `git branch -D docker-v1`
- [ ] **Icon** — monolith.ico прозрачность — проверить на светлом рабочем столе
- [ ] **Docker Desktop autostart** — ручной шаг: Settings → General → ☑ Start Docker Desktop when you sign in
