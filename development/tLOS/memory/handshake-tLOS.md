# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 by Assistant

---

## Где мы сейчас

Eidolon работает end-to-end, OSS patterns applied (2026-03-10): Letta XML memory blocks, OpenHands microagents, assistant-ui tlos_action cards, markdown в Omnibar, agent:context payload исправлен. claude-bridge стабилен — stdin prompt, session turns tracking, nearLimit flag.

---

## Следующий приоритет

1. **BUG** — Омнибар команда `mcb` не работает (спавнит 6 MCB фреймов на холст)
2. **SEC** — PatchDialog: верификация Nostr-подписи патчей (`nostr-tools`)
3. **ARCH** — Context summarization: когда сессия Claude приближается к лимиту (нужно хранить message history в bridge, затем LLM-summarize)
4. **FEATURE** — Добавить microagents для других доменов (harkly, rust, nostr)
5. **SEC** — System prompt files: ограничить права доступа (world-readable)

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | Eidolon backend + OSS patterns + bug fixes | **OPEN** — основная работа |
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
| Agent config path | `core/agents/eidolon/` |
| Microagents path | `core/agents/eidolon/microagents/` (canvas.md, solidjs.md) |
| Session persistence | `~/.tlos/sessions.json` — формат: `{ claudeSessionId, turns }` |
| Memory blocks | XML-инжект: `<persona>` + `<workspace>` в placeholder `<!-- MEMORY_BLOCKS -->` |
| tlos-cyan | `#06B6D4` |
| tlos-primary | `#f2b90d` |
| Monolith logo | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
| Constants file | `core/shell/frontend/src/constants.ts` |

---

## Что было сделано (2026-03-10, сессия 2)

**OSS Patterns Applied:**
- Letta memory pattern: `<persona>` + `<workspace>` XML blocks, fresh load per session
- OpenHands microagent pattern: `microagents/canvas.md` + `microagents/solidjs.md` — keyword-triggered context
- assistant-ui message parts: tlos_action blocks → ⚡ карточки в Chat.tsx
- Markdown rendering в Omnibar (streaming = raw text, done = marked)
- agent:context payload format fix (было сломано: missing wrapper + wrong field)
- Session entry теперь `{ claudeSessionId, turns }` — backward compat
- `nearLimit` flag когда > 80% контекста использовано
- `MessageStatus` type в kernel.ts

**Ключевые файлы:**
- `core/agents/eidolon/system-prompt.md` — `<!-- MEMORY_BLOCKS -->` placeholder
- `core/agents/eidolon/microagents/canvas.md` — NEW
- `core/agents/eidolon/microagents/solidjs.md` — NEW
- `core/kernel/tlos-claude-bridge/index.js` — XML injection, microagents, turns
- `core/shell/frontend/src/components/Chat.tsx` — AiMessageContent + parseParts
- `core/shell/frontend/src/components/Omnibar.tsx` — markdown AI, fixed agent:context

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Баг-репорт | development/tLOS/memory/bug-report-2026-03-10.md |
| Claude bridge | development/tLOS/core/kernel/tlos-claude-bridge/index.js |
| Eidolon system prompt | development/tLOS/core/agents/eidolon/system-prompt.md |
| Microagents | development/tLOS/core/agents/eidolon/microagents/ |
| Omnibar | development/tLOS/core/shell/frontend/src/components/Omnibar.tsx |
| Chat (markdown + cards) | development/tLOS/core/shell/frontend/src/components/Chat.tsx |
| Constants | development/tLOS/core/shell/frontend/src/constants.ts |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [x] Session persistence для claude-bridge → DONE
- [x] Auth persistence в Omnibar → DONE
- [x] Bug hunt sprint 1 → DONE (26/39)
- [x] Markdown в Chat → DONE
- [x] OSS patterns (Letta/OpenHands/assistant-ui) → DONE
- [x] agent:context payload fix → DONE
- [ ] NIM key rotation: механизм автообновления
- [ ] MCB омнибар: команда `mcb` — починить
- [ ] **SEC:** PatchDialog — нет верификации Nostr-подписи (нужен nostr-tools)
- [ ] **SEC:** System prompt files world-readable
- [ ] **ARCH:** Context summarization при overflow (HIGH complexity)
- [ ] Добавить microagents: harkly.md, nostr.md, rust.md
- [ ] WebSocket → Tauri IPC (ADR-003 Phase 2)
- [ ] Артём: npub + API доступы
