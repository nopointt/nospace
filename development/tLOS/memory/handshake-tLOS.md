# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 by Assistant

---

## Где мы сейчас

**Eidolon работает end-to-end** (2026-03-10). Bug hunt sprint 1 завершён: 26/39 issues fixed. Омнибар стабилизирован — Eidolon отвечает, markdown рендерится, Neural Link spam устранён.

---

## Следующий приоритет

1. **FEATURE** — Omnibar context bar: реальные токены из `agent:context` NATS events (UI не подключён)
2. **SEC** — PatchDialog: верификация Nostr-подписи патчей (`nostr-tools`)
3. **FEATURE** — Обновить `agent-system-architecture.md`: убрать opcode, добавить tLOS frames как UI layer
4. **BUG** — MCB омнибар команда `mcb` не работает
5. **SEC** — System prompt files: ограничить права доступа (world-readable)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | Eidolon backend + bug fixes + markdown | **OPEN** — основная работа |
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
| Bridge spawn mode | `--print` + stdin (НЕ `-p arg` — ломает cmd.exe из-за `<>` символов) |
| Agent config path | `core/agents/eidolon/` |
| Session persistence | `~/.tlos/sessions.json` |
| tlos-cyan | `#06B6D4` |
| tlos-primary | `#f2b90d` |
| Monolith logo | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
| Constants file | `core/shell/frontend/src/constants.ts` (15 magic numbers) |

---

## Что было сделано (2026-03-10)

**Eidolon Agent Backend:**
- `core/agents/eidolon/config.json` + `system-prompt.md` (5923 chars) + `memory/persona.md` + `memory/workspace.md`
- claude-bridge: system prompt injection, session persistence, agent:context events
- Auth persistence: localStorage cache в Omnibar.tsx

**Bug Hunt Sprint 1 — 26/39 fixes:**
- CRITICAL: PatchDialog subscribe→onMount, kernel exponential backoff, unbounded subscribers
- claude-bridge: spawn timeout 30s + **stdin-based prompt** (главный Windows fix — `<SYSTEM_CONTEXT>` ломал cmd.exe)
- DynamicComponent: RAF throttle + event delegation (1 window listener вместо N)
- useSnap: defensive copy + O(N²)→O(N) BFS
- Space.tsx: canvas resize flush только при реальном resize
- Omnibar: model validation, hint interval, "coming soon" удалён
- kernel.ts: DEBUG-gated log(), onerror handler
- constants.ts: 15 именованных констант
- useComponents.ts: фильтр agent:* событий (фикс Neural Link spam при каждом сообщении)

**Markdown в Chat:**
- `marked` установлен, GFM+breaks
- `.chat-md` стили в index.css (bold=yellow, code=cyan, tLOS palette)

**Monolith Logo:**
- `monolith.svg` + `favicon.svg` + все Tauri icons перегенерированы

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Баг-репорт | development/tLOS/memory/bug-report-2026-03-10.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Eidolon system prompt | development/tLOS/core/agents/eidolon/system-prompt.md |
| Omnibar | development/tLOS/core/shell/frontend/src/components/Omnibar.tsx |
| Chat (markdown) | development/tLOS/core/shell/frontend/src/components/Chat.tsx |
| Constants | development/tLOS/core/shell/frontend/src/constants.ts |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [x] Session persistence для claude-bridge → DONE
- [x] Auth persistence в Omnibar → DONE
- [x] Bug hunt sprint 1 → DONE (26/39)
- [x] Neural Link spam при каждом сообщении → DONE
- [x] Markdown в Chat → DONE
- [ ] NIM key rotation: механизм автообновления
- [ ] MCB омнибар: команда `mcb` — починить
- [ ] **SEC:** PatchDialog — нет верификации Nostr-подписи (нужен nostr-tools)
- [ ] **SEC:** System prompt files world-readable
- [ ] **FEATURE:** Context bar реальные токены из agent:context
- [ ] agent-system-architecture.md: убрать opcode, добавить tLOS frames как UI layer
- [ ] WebSocket → Tauri IPC (ADR-003 Phase 2)
- [ ] Артём: npub + API доступы
