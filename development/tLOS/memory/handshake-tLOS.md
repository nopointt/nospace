# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 (session 11) by Assistant

---

## Где мы сейчас

L2 Kernel 4/5 шагов DONE. Полный роадмап (L2→L3→L4→Dockerization) зафиксирован в `docs/agent-system-architecture.md` v3 — читать его первым. Docker stack работает (3 контейнера, ~861MB RAM). Desktop shortcut создан.

---

## Следующий приоритет

1. **Dockerization** — D1: Dockerfile tlos-claude-bridge (Node 22 alpine) → D2: tlos-langgraph-bridge → D4: единый docker-compose
2. **L2 Step 5** — tLOS Agent Frames (agent-status, g3-session, memory-viewer)
3. **SEC** — PatchDialog Nostr sig + system prompt file permissions (branch: omnibar)

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
| Claude bridge path | `core/kernel/tlos-claude-bridge/index.js` |
| Bridge spawn mode | `--print` + stdin |
| Docker stack | 3 containers: db:5433 + litellm:4000 + qdrant:6333 (~861MB RAM) |
| docker-compose | `core/kernel/tlos-zep-bridge/docker-compose.yml` |
| NIM key | `~/.tlos/nim-key` |
| Session persistence | `~/.tlos/sessions.json` |
| Desktop shortcut | `Desktop/tLOS.lnk` → `AppData/Local/tLOS/tlos-app.exe` |
| monolith.ico | `AppData/Local/tLOS/monolith.ico` — прозрачный фон (визуально не проверен на светлом фоне) |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| История сессий | development/tLOS/memory/chronicle-tLOS.md |
| **Роадмап (главный)** | **docs/agent-system-architecture.md** |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Domain memory client | development/tLOS/core/kernel/tlos-claude-bridge/zep-client.js |
| Associative routing | development/tLOS/core/kernel/tlos-claude-bridge/qdrant-client.js |
| Docker compose | development/tLOS/core/kernel/tlos-zep-bridge/docker-compose.yml |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] **Dockerization**: D1 — Dockerfile для tlos-claude-bridge (volume mounts для ~/.tlos, ~/.claude.json)
- [ ] **L2 Step 5**: tLOS Agent Frames (agent-status, g3-session, memory-viewer)
- [ ] **Icon**: monolith.ico прозрачность — проверить на светлом рабочем столе
- [ ] **SEC**: PatchDialog Nostr sig, system prompt world-readable
- [ ] **SEED**: sync tlos_facts seed → tlos-global Qdrant on bridge startup
- [ ] **CLEANUP**: grid.ps1 Zep-specific refs, config.yaml.template, mem0-wrapper.py
