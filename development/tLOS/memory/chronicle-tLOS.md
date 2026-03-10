# CHRONICLE — tLOS
> Append-only session log. NEVER overwrite. Only append new entries at the bottom.
> Created: 2026-03-10

---

> **Формат записи:**
> `## [YYYY-MM-DD — сессия N] CLOSE | CHECKPOINT`
> Каждая запись содержит: фазу, решения, изменённые файлы, выполненные/открытые задачи.
> Записи не редактируются после добавления — только исторический факт.

---

## [2026-03-10 — сессия 1] CLOSE

**Phase:** Eidolon backend — первый запуск (system prompt, session persistence, context tracking)

**Decisions:**
- Выбран подход Letta XML memory blocks: `<persona>` + `<workspace>` инжектируются в system-prompt через placeholder `<!-- MEMORY_BLOCKS -->`
- Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
- Context tracking: парсинг `msg.usage` из claude stream → `agent:context` event
- Agent config: `core/agents/eidolon/config.json` (model, contextWindowTokens, пути)
- OpenHands microagents pattern: keyword-triggered context injection из `microagents/*.md`

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — system prompt load, session persistence, context events, microagents
- `core/agents/eidolon/config.json` — создан
- `core/agents/eidolon/system-prompt.md` — создан
- `core/agents/eidolon/memory/persona.md` — создан
- `core/agents/eidolon/memory/workspace.md` — создан
- `core/agents/eidolon/microagents/canvas.md` — создан
- `core/agents/eidolon/microagents/solidjs.md` — создан

**Completed:**
- Eidolon system prompt + memory blocks
- Session persistence to disk
- Context tracking (real token counts)
- Microagents infrastructure
- Markdown rendering in Chat.tsx (marked GFM)
- tlos_action cards in Chat.tsx
- Auth UI + localStorage persistence

**Opened:**
- SEC: PatchDialog Nostr signature verification
- SEC: System prompt file permissions
- FEATURE: microagents harkly.md, nostr.md, rust.md

---

## [2026-03-10 — сессия 2] CLOSE

**Phase:** Bug hunt sprint 1 — исправление критических проблем Omnibar

**Decisions:**
- Bug hunt спринт: 26/39 issues fixed за сессию
- `MessageStatus` type экспортирован из `kernel.ts`
- tlos_action карточки парсятся на уровне Chat.tsx (не bridge)

**Files changed:**
- `core/shell/frontend/src/kernel.ts` — MessageStatus export, ChatMessage interface
- `core/shell/frontend/src/components/Chat.tsx` — tlos_action cards, markdown, AiMessageContent
- `core/shell/frontend/src/components/Omnibar.tsx` — множество bug fixes

**Completed:**
- 26 из 39 bugs fixed (sprint 1)
- Markdown в Omnibar AI сообщениях
- agent:context payload bug fixed
- Context bar с реальными token counts

**Opened:**
- Оставшиеся HIGH bugs: sessionId stability + context summarization

---

## [2026-03-10 — сессия 3] CLOSE

**Phase:** Session continuity + Context compaction + MCB fix — все ARCH/BUG закрыты

**Decisions:**
- `conversationSessionId` — stable signal per conversation в Omnibar; был `crypto.randomUUID()` per-message → сессии никогда не резюмировались
- Context compaction: in-memory `sessionLogs` per sessionId; `nearLimit` → `summarizeConversation()` → new claude session с `<PREVIOUS_CONTEXT_SUMMARY>`
- Compaction in-memory only (не персистируется) — сознательное решение (bridge restart = new context)
- MCB bug: viewport не сбрасывался после `replaceComponents` → фреймы вне видимости
- `agent:summarizing` event фильтруется в useComponents.ts — не спавнит canvas frame

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — sessionLogs, summarizeConversation(), handleChat() rewrite
- `core/shell/frontend/src/components/Omnibar.tsx` — conversationSessionId signal, isSummarizing, agent:summarizing handler, ⚙️ indicator
- `core/shell/frontend/src/App.tsx` — resetViewport() на mcb command
- `core/shell/frontend/src/hooks/useComponents.ts` — agent:summarizing в event filter

**Completed:**
- Session ID stability (conversationSessionId)
- Context summarization (LLM-based compaction at nearLimit)
- MCB viewport reset fix
- agent:summarizing filter в useComponents

**Opened:**
- SEC: PatchDialog Nostr signature verification (nostr-tools)
- SEC: System prompt file permissions (world-readable)
- FEATURE: microagents harkly.md, nostr.md, rust.md
- ARCH: Context compaction summary in-memory only (теряется при рестарте bridge)
