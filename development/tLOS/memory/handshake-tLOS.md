# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-02 by Assistant

---

## Где мы сейчас

Claude Code интеграция реализована архитектурно: `tlos-claude-bridge` (Node.js) + provider selector UI в Omnibar (Claude/NVIDIA toggle, model list, auth status). **Но subprocess на Windows зависает** — клод не отвечает на сообщения, несмотря на cmd.exe /c fix. NIM pipeline работает. Auth UI показывает Connected корректно.

---

## Следующий приоритет

1. **BLOCKER: Починить claude-bridge subprocess** — `cmd.exe /c claude.cmd -p ...` зависает без вывода. Диагностика: запустить тест-скрипт отдельно, посмотреть stderr, попробовать `shell: true` или PowerShell wrapper. Возможно claude требует TTY или интерактивный терминал.
2. **Session persistence** — `sessionId→claudeSessionId` теряется при рестарте bridge. Сохранять в `~/.tlos/sessions.json`.
3. **Omnibar `mcb` command** — сломана команда запуска MCB фреймов после редизайна.

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | Omnibar redesign + Claude Code integration (epic-eidolon-v1) | open — bridge broken |
| mcb-v1 | Marketing Command Board для Артёма | blocked — ждём API доступы |
| node-v1 | Nostr patch pipeline | shipped — ждём Артёма |
| website-v1 | THELOS marketing site | open |

---

## Архитектура AI pipeline

```
Omnibar → agent:chat { provider: 'claude'|'nim', model }
  ├── provider='claude' → tlos-claude-bridge (Node.js, core/kernel/tlos-claude-bridge/)
  │     └── cmd.exe /c claude.cmd -p ... --model ... --resume <id>
  └── provider='nim'   → tlos-agent-bridge (Rust)
        └── NVIDIA NIM HTTP SSE
```

Auth: bridge читает `~/.claude.json` → `agent:auth:status` → Omnibar Connected/Sign in → `agent:auth:login` → `cmd /k claude login`

---

## Критические данные

| Ключ | Значение |
|---|---|
| nopoint Nostr npub | `npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw` |
| NIM key | `~/.tlos/nim-key` — временный (12ч), требует ручного обновления |
| NIM model | `meta/llama-3.1-8b-instruct` |
| Claude default model | `claude-sonnet-4-6` |
| Claude bridge path | `core/kernel/tlos-claude-bridge/index.js` |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Omnibar | development/tLOS/core/shell/frontend/src/components/Omnibar.tsx |
| Grid launcher | development/tLOS/core/grid.ps1 |
| NIM bridge | development/tLOS/core/kernel/tlos-agent-bridge/src/main.rs |
| ADR-003 security | docs/ecosystem-noadmin/adr/003-tlos-network-isolation.md |

---

## Открытые вопросы

- [ ] Почему claude subprocess зависает? (TTY requirement? CLAUDECODE still set? PATH issue?)
- [ ] Session persistence для claude-bridge (disk)?
- [ ] NIM key rotation: механизм автообновления
- [ ] MCB омнибар: команда `mcb` — починить
- [ ] WebSocket → Tauri IPC (ADR-003 Phase 2, production milestone)
- [ ] Артём: когда пришлёт npub и доступы к API?
- [ ] PatchDialog.tsx:19 — kernel.subscribe() cleanup не подтверждён (LOW risk)
