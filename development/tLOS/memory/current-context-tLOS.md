---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-10 (session 3)
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — `mcb` команда починена (viewport reset); ждём API доступы Артёма |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |
| epic-nim-v1 | nim-v1 | NIM AI Bridge — NVIDIA NIM HTTP SSE интеграция | **SHIPPED** — agent-bridge переписан, Omnibar → NIM → token stream работает |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand system зафиксирована, сайт в разработке |
| epic-eidolon-v1 | omnibar | Claude Code integration as Eidolon AI backend | **OPEN** — session persistence fix + context summarization + mcb fix shipped |
| epic-workspace-v1 | workspace-v1 | Организация рабочего пространства nopoint + Артём | **OPEN** — sessions-map.md создан, 3 трека (A: Omnibar v2, B: BB Floors, C: Infra) |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | Eidolon fully operational — session continuity, context compaction, mcb fixed | 2026-03-10 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid.ps1 run` | 2026-03-10 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| claude_bridge | tlos-claude-bridge — FULL: XML memory, microagents, stable sessionId, context compaction | 2026-03-10 |
| dispatcher | tlos-dispatcher — FIXED (graceful wasm skip, no crash on missing math_worker.wasm) | 2026-03-08 |
| eidolon | Eidolon AI backend LIVE — context summarization, stable sessions, nearLimit compaction | 2026-03-10 |
| session_continuity | Omnibar: stable `conversationSessionId` per conversation → claude-bridge resumes correctly | 2026-03-10 |
| context_summarization | bridge: nearLimit → summarizeConversation() → new session with `<PREVIOUS_CONTEXT_SUMMARY>` | 2026-03-10 |
| mcb_command | App.tsx: `mcb` → replaceComponents + resetViewport — FIXED | 2026-03-10 |
| markdown_chat | Chat.tsx + Omnibar.tsx — `marked` GFM+breaks | 2026-03-10 |
| tlos_action_cards | Chat.tsx: tlos_action blocks → ⚡ action cards | 2026-03-10 |
| monolith_logo | Монолит SVG: Omnibar, favicon.svg, Tauri icons | 2026-03-10 |
| nim_key_path | ~/.tlos/nim-key — временный ключ (12ч), требует обновления | 2026-03-02 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| ~~claude-bridge: cmd.exe breaks on <SYSTEM_CONTEXT> in -p arg~~ | claude-bridge | 2026-03-10 | **RESOLVED** — prompt via stdin |
| ~~Neural Link frame спавнится на каждое сообщение~~ | frontend | 2026-03-10 | **RESOLVED** — фильтр agent:* events |
| ~~agent:context payload bug~~ | claude-bridge + Omnibar | 2026-03-10 | **RESOLVED** |
| ~~sessionId создавался per-message → сессии не резюмировались~~ | Omnibar | 2026-03-10 | **RESOLVED** — stable `conversationSessionId` |
| ~~mcb команда не показывала фреймы~~ | App.tsx | 2026-03-10 | **RESOLVED** — resetViewport() после replaceComponents |
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Артём не настроил tlos-patch-daemon | node-v1 | 2026-02-28 | Нужно: tLOS-setup.exe + daemon с --dev-npub nopoint |
| NIM key временный (12ч) | nim-v1 | 2026-03-02 | Обновить ~/.tlos/nim-key при истечении |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы; Phase 3+: custom Wasmtime host
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Claude AI pipeline:** Omnibar → agent:chat{provider:'claude', model} → NATS → claude-bridge → `claude --print` (stdin) → NATS → Omnibar
  - System prompt: XML memory blocks (`<persona>`, `<workspace>`) injected via `<!-- MEMORY_BLOCKS -->` placeholder (Letta pattern)
  - Session persistence: `~/.tlos/sessions.json` (sessionId → `{ claudeSessionId, turns }`)
  - Session ID stability: Omnibar `conversationSessionId` signal — reused across all messages, reset only on clearContext()
  - Microagents: `agents/eidolon/microagents/*.md` — keyword-triggered context injection per message (OpenHands pattern)
  - Context tracking: `agent:context` event → `payload: { tokensUsed, contextTotal, nearLimit, turns }`
  - **Context compaction:** bridge `sessionLogs` in-memory — tracks full message history; on `nearLimit` → `summarizeConversation()` → new Claude session with `<PREVIOUS_CONTEXT_SUMMARY>` injected
  - Compaction UI: `agent:summarizing` event → Omnibar shows `⚙️ compacting...` indicator
- **NIM AI pipeline:** Omnibar → agent:chat{provider:'nim'} → NATS → agent-bridge → NVIDIA NIM SSE → NATS → Omnibar
- **Auth:** claude-bridge reads ~/.claude.json, publishes agent:auth:status; Omnibar кэширует в localStorage
- **Frame filtering:** useComponents.ts фильтрует все agent:* events (включая agent:summarizing)
- **Markdown:** Chat.tsx + Omnibar.tsx используют `marked` (GFM+breaks), стили в index.css (.chat-md)
- **tlos_action cards:** Chat.tsx парсит ````tlos_action` блоки → ⚡ карточки
- **MessageStatus:** `kernel.ts` экспортирует `MessageStatus = 'streaming' | 'complete' | 'error'`
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. Context compaction: summary хранится только in-memory (теряется при рестарте bridge).

## Omnibar Roadmap (branch: omnibar)

| Task | Status |
|---|---|
| Redesign: NIM chat panel, token streaming | ✅ DONE |
| Provider selector (Claude/NVIDIA toggle + model list) | ✅ DONE |
| Auth UI: Connected/Sign in status in Model panel | ✅ DONE |
| Monolith logo: SVG + favicon + Tauri icons | ✅ DONE (2026-03-10) |
| Auth persistence: localStorage cache | ✅ DONE (2026-03-10) |
| Eidolon agent backend: system prompt + config | ✅ DONE (2026-03-10) |
| claude-bridge: stdin-based prompt (Windows shell fix) | ✅ DONE (2026-03-10) |
| claude-bridge: session persistence to disk | ✅ DONE (2026-03-10) |
| claude-bridge: spawn timeout 30s | ✅ DONE (2026-03-10) |
| Markdown rendering in Chat.tsx | ✅ DONE (2026-03-10) |
| Bug hunt sprint 1: 26/39 issues fixed | ✅ DONE (2026-03-10) |
| Letta XML memory blocks (persona + workspace as XML) | ✅ DONE (2026-03-10) |
| OpenHands microagents (keyword-triggered context) | ✅ DONE (2026-03-10) |
| assistant-ui message parts (tlos_action cards) | ✅ DONE (2026-03-10) |
| Markdown in Omnibar AI messages | ✅ DONE (2026-03-10) |
| agent:context payload bug fixed | ✅ DONE (2026-03-10) |
| Context bar: real token counts from agent:context | ✅ DONE (2026-03-10) |
| Session ID stability (conversationSessionId) | ✅ DONE (2026-03-10) |
| Context summarization (LLM-based compaction at nearLimit) | ✅ DONE (2026-03-10) |
| Omnibar command `mcb` fix (viewport reset) | ✅ DONE (2026-03-10) |
| SEC: PatchDialog Nostr signature verification | TODO — needs nostr-tools |
| SEC: System prompt file permissions (world-readable) | TODO |
| FEATURE: microagents harkly.md, nostr.md, rust.md | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — future |

## Bug Hunt Status (2026-03-10)

Session 3 additions: 3 more bugs fixed (sessionId, mcb viewport, agent:summarizing filter).
Remaining open: SEC (PatchDialog sig, system prompt permissions).

Priority next:
1. SEC: PatchDialog Nostr signature verification (needs nostr-tools)
2. SEC: System prompt file permissions
3. FEATURE: microagents for harkly, nostr, rust domains

## THELOS Brand System (зафиксировано 2026-02-28)

| Элемент | Значение |
|---|---|
| Концепция | Чёрный квадрат Малевича (апогей) + чёрная дыра (притяжение) + τέλος (завершённость/полнота) |
| Логотип | Монолит — чёрный вертикальный прямоугольник, соотношение 4:5, Супрематизм |
| Шрифт | Helvetica / Neue Haas Grotesk — Швейцария, объективность, сведение к сущности |
| Стиль | Супрематизм — геометрия, никакого декора, формы в пространстве |
| `#000` / `#0A0A0F` | Чёрный — абсолютная форма, финальность |
| `tlos-cyan` | `#06B6D4` (Tailwind cyan-500) |
| `tlos-primary` | `#f2b90d` (золотой акцент) |
| Monolith SVG | `core/shell/frontend/src/assets/monolith.svg` (4:5 ratio) |
