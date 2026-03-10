# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-10 by Assistant

---

## Где мы сейчас

Eidolon полностью операционен: session continuity (stable conversationSessionId), context compaction (LLM summarization at nearLimit), mcb команда починена. Все ARCH/BUG задачи из omnibar epic закрыты — остались только SEC и FEATURE.

---

## Следующий приоритет

1. **SEC** — PatchDialog: верификация Nostr-подписи патчей (`nostr-tools`)
2. **SEC** — System prompt files: ограничить права доступа (world-readable)
3. **FEATURE** — Microagents для других доменов: harkly.md, nostr.md, rust.md

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| omnibar | Eidolon backend — все ARCH/BUG закрыты, остались SEC | **OPEN** |
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
| Session ID | Omnibar `conversationSessionId` signal — stable per conversation, reset on clearContext() |
| Context compaction | bridge `sessionLogs` in-memory; nearLimit → summarizeConversation() → new session + summary |
| Memory blocks | XML-инжект: `<persona>` + `<workspace>` в placeholder `<!-- MEMORY_BLOCKS -->` |
| tlos-cyan | `#06B6D4` |
| tlos-primary | `#f2b90d` |
| Monolith logo | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
| Constants file | `core/shell/frontend/src/constants.ts` |

---

## Что было сделано (2026-03-10, сессия 3)

**Session ID fix (критический баг):**
- Omnibar: `conversationSessionId` signal — stable per conversation, был `crypto.randomUUID()` per message
- `clearContext()` теперь сбрасывает sessionId → настоящая "новая беседа"

**Context Compaction (полный ARCH):**
- bridge `sessionLogs` — in-memory history per session `[{role, content}]`
- `summarizeConversation()` — спавнит claude, возвращает summary string
- `handleChat()`: проверяет `needsSummarization` ПЕРЕД обработкой → compaction → new session
- Summary инжектируется как `<PREVIOUS_CONTEXT_SUMMARY>` в новую сессию
- Omnibar: `isSummarizing` + `agent:summarizing` handler + `⚙️ compacting...` индикатор

**MCB bug fix:**
- App.tsx: `resetViewport()` после `replaceComponents([...MCB_FRAMES])` — фреймы теперь видны сразу
- useComponents.ts: `agent:summarizing` добавлен в фильтр

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
| App (mcb handler) | development/tLOS/core/shell/frontend/src/App.tsx |
| useComponents (filter) | development/tLOS/core/shell/frontend/src/hooks/useComponents.ts |
| Constants | development/tLOS/core/shell/frontend/src/constants.ts |
| Grid launcher | development/tLOS/core/grid.ps1 |

---

## Открытые вопросы

- [ ] SEC: PatchDialog — нет верификации Nostr-подписи (нужен nostr-tools)
- [ ] SEC: System prompt files world-readable
- [ ] FEATURE: microagents harkly.md, nostr.md, rust.md
- [ ] Context compaction summary: сейчас in-memory (теряется при рестарте bridge) — нужно ли персистировать?
- [ ] WebSocket → Tauri IPC (ADR-003 Phase 2)
- [ ] Артём: npub + API доступы
