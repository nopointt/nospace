# Episodic Context — Decision Log
> Append-only. Each entry documents a decision that changed system state or rules.
> Format: `## [YYYY-MM-DD] [agent-id] — [decision title]`

---
## Session 2026-03-10 (3) — tLOS: context compaction + session continuity + mcb fix

**Decisions:**
- Context compaction: bridge now tracks full message history in-memory (`sessionLogs`); when `nearLimit` fires, next message triggers `summarizeConversation()` → new Claude session with `<PREVIOUS_CONTEXT_SUMMARY>` injected (OpenHands compaction pattern)
- Session ID stability: Omnibar `conversationSessionId` signal reused across all messages (was `crypto.randomUUID()` per-message — sessions never resumed)
- MCB command fixed: `resetViewport()` called after `replaceComponents([...MCB_FRAMES])` so frames are visible immediately

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — sessionLogs, getSessionLog(), summarizeConversation(), handleChat() rewrite with compaction flow
- `core/shell/frontend/src/components/Omnibar.tsx` — conversationSessionId signal, isSummarizing, agent:summarizing handler, ⚙️ indicator
- `core/shell/frontend/src/App.tsx` — resetViewport() on mcb command
- `core/shell/frontend/src/hooks/useComponents.ts` — agent:summarizing in filter

**Tasks completed / open:**
- ✅ Session continuity, context compaction, mcb viewport fix
- [ ] SEC: PatchDialog Nostr sig, system prompt permissions; FEATURE: microagents expansion

---
## Session 2026-03-10 — tLOS: OSS patterns applied to Eidolon agent architecture

**Decisions:**
- Adopted Letta memory pattern: persona + workspace injected as XML blocks (`<persona>`, `<workspace>`) via `<!-- MEMORY_BLOCKS -->` placeholder; fresh load per new session
- Adopted OpenHands microagent pattern: `agents/eidolon/microagents/*.md` with YAML frontmatter triggers; bridge injects matching microagents per message keyword
- Adopted assistant-ui message parts pattern: tlos_action blocks render as ⚡ action cards in Chat.tsx
- Session structure upgraded: `{ claudeSessionId, turns }` with backward compat; nearLimit flag at 80% context

**Files changed:**
- `core/agents/eidolon/system-prompt.md`, `microagents/canvas.md`, `microagents/solidjs.md` (NEW)
- `core/kernel/tlos-claude-bridge/index.js` — safeRead, XML injection, microagent loader, turns, nearLimit, agent:context payload fix
- `core/shell/frontend/src/components/Chat.tsx` — AiMessageContent + parseParts
- `core/shell/frontend/src/components/Omnibar.tsx` — markdown AI messages, fixed agent:context handler

**Tasks completed / open:**
- ✅ Letta/OpenHands/assistant-ui patterns, markdown in Omnibar, agent:context fix
- [ ] Context summarization at overflow, MCB omnibar command, PatchDialog Nostr sig

---
## Session 2026-03-08 — Harkly: продуктовый пивот → desk research automation SaaS

**Decisions:**
- Harkly сменил направление: больше не CX-платформа для Steam-игр, теперь desk research automation SaaS
- Первичная аудитория: CX/UX/Research Ops в SaaS-компаниях 50-500 человек (RU+СНГ, harkly.ru)
- Стек финальный: Next.js 14 + Bun + Vercel + YC PG (152-ФЗ) + Supabase + Modal.com
- Враг переопределён: не "парадигма опросов" — фрагментация workflow (4-8 несвязанных инструментов)
- Spine-процесс = гипотеза (Opus может предложить изменения)
- Дорожная карта 6 стадий: Research → Business Design (Opus) → Spec → Product Design → Build → Beta

**Files changed:**
- `development/harkly/branches/saas-v1/enemy.md` — Enemy Statement v0 написан заново
- `development/harkly/memory/current-context-harkly.md` — отражён пивот
- `development/harkly/memory/handshake-harkly.md` — перезаписан под новое направление

**Tasks completed / open:**
- ✅ Roadmap 6 стадий задокументирован в `.claude/plans/eager-juggling-flame.md`
- ✅ enemy.md v0 написан (структурно корректно, нужна валидация веб-данными)
- ⏳ hero.md не написан — нужно веб-исследование (агент пишет в файл, не в контекст)
- ⏳ opus_business_brief_prompt.md не обновлён (добавить hero + enemy + competitives)
- ⏳ Opus не запущен

---
## Session 2026-02-27 — Infrastructure: session commands + context economy regulation

**Decisions:**
- 3-tier session model: /startgsession (global) | /startHsession (harkly) | /startTsession (tLOS)
- context-economy-regulation.md принята — постоянная регуляция для всех агентов и сессий
- /continue создан — для возобновления работы после context limit
- tLOS: nopoint сообщил о большом апдейте + первом enterprise user, детали pending

**Files changed:**
- `~/.claude/commands/` — startHsession, closeHsession, startTsession, closeTsession, continue (новые)
- `~/.claude/commands/startgsession/H/T.md` — обновлены (context economy header)
- `rules/regulations/context-economy-regulation.md` — создан
- `rules/global-constitution.md` — §6 обновлён
- `CLAUDE.md` — блок ⚡ экономии контекста добавлен
- `development/harkly/memory/current-context-harkly.md` — создан
- `development/harkly/memory/handshake-harkly.md` — создан
- `development/tLOS/memory/handshake-tLOS.md` — создан (placeholder, big update pending)

**Tasks completed:** глобальный resync, harkly memory bootstrap, session infrastructure
**Tasks open:** tLOS briefing (nopoint), HARKLY-03 CPO call, HARKLY-05 web platform, OPS-TODO-01

**Risks / flags:**
- OPS-TODO-01 (unencrypted .env credentials) — критический, не решён
- tLOS реальное состояние неизвестно — память не отражает действительность

---
## Session 2026-03-02 — Multi-agent system bootstrap + G3 methodology

**Decisions:**
- Claude = Coach + Orchestrator (новая роль зафиксирована глобально)
- G3 Dialectical Autocoding принят как методология разработки
- 3 бесплатных агента активированы: qwen-cli, opencode/minimax-m2.5-free, opencode/trinity-large-preview-free
- Gemini CLI установлен (требует ключ; старый ключ скомпрометирован — нужна замена)
- CLAUDE.md перемещён в ~/.claude/CLAUDE.md (глобальный, один на всё)
- Agent Monitor Dashboard создан через G3 сессию (TASK-MONITOR-001, 1 turn, APPROVED)

**Files changed:**
- `~/.claude/CLAUDE.md` — перемещён из nospace/CLAUDE.md, добавлены секции Multi-Agent + G3
- `~/.claude/commands/g3.md` — новая slash-команда для G3 сессий
- `~/.claude/projects/.../memory/MEMORY.md` — добавлены агенты, G3, agent-monitor
- `nospace/tools/agent-monitor/` — новый проект (server.js, dashboard.html, 3x .cmd, start.cmd)
- `nospace/memory/current-context-global.md` — active_agents обновлён, g3/multi-agent добавлены

**Tasks completed:**
- G3 методология исследована (через Qwen CLI как research agent)
- /g3 slash-команда создана
- Gemini CLI установлен и протестирован
- OpenCode CLI настроен на бесплатные модели (minimax, trinity)
- Agent Monitor Dashboard реализован по G3 (Qwen Player, Claude Coach)

**Tasks open / carried over:**
- HARKLY-03 CPO ProxyMarket — pending nopoint
- HARKLY-05 web platform — in-progress
- OPS-TODO-01 — unencrypted .env — критический
- Gemini API ключ нужно заменить (старый публично опубликован в чате)
- tLOS briefing — pending

**Risks / flags:**
- Gemini API ключ скомпрометирован — отозвать и заменить на aistudio.google.com

---

## Session 2026-03-02 — tLOS: NIM AI bridge shipped + security hardening

**Decisions:**
- `tlos-agent-bridge` полностью переписан: old CLI spawner → NVIDIA NIM HTTP SSE bridge (meta/llama-3.1-8b-instruct)
- NIM auth: ключ в `~/.tlos/nim-key`, grid.ps1 проверяет файл (не CLAUDE_API_KEY)
- ADR-003 security hardening: NATS/WS binding → 127.0.0.1 (было 0.0.0.0)
- Canvas default: пустой холст (было MCB_FRAMES при старте)

**Files changed:**
- `development/tLOS/core/kernel/tlos-agent-bridge/src/main.rs` — полная перезапись (NIM SSE)
- `development/tLOS/core/kernel/tlos-agent-bridge/Cargo.toml` — добавлен reqwest
- `development/tLOS/core/grid.ps1` — nim-key file check вместо CLAUDE_API_KEY
- `development/tLOS/core/shell/frontend/src/hooks/useComponents.ts` — early return для agent messages, пустой default
- `development/tLOS/core/shell/frontend/src/App.tsx` — 2 memory leaks (onResized + subscribeToKernel)
- `development/tLOS/core/kernel/tlos-patch-daemon/src/main.rs` — CRITICAL path traversal fix (sanitize_path_component)
- `docs/ecosystem-noadmin/adr/003-tlos-network-isolation.md` — ADR-003 создан
- `development/tLOS/memory/current-context-tLOS.md` — обновлён
- `development/tLOS/memory/handshake-tLOS.md` — перезаписан

**Tasks completed:**
- NIM AI pipeline E2E: Omnibar → NATS → agent-bridge → NIM API → token stream → Omnibar
- Баг: agent:status/agent:token создавали canvas фреймы — исправлено
- CRITICAL security: path traversal в patch-daemon — исправлено
- Memory leaks App.tsx×2 — исправлены
- localStorage очищен (WebView2 leveldb)

**Tasks open:**
- NIM key refresh (12h TTL) — ручной процесс, нет автоматизации
- WebSocket → Tauri IPC (ADR-003 Phase 2, production milestone)
- MCB омнибар команда `mcb` — не работает после редизайна
- E2E с Артёмом — patch-daemon + installer

---

## [2026-02-27] [assistant] — Global context resync: harkly docs sprint complete, project memory bootstrapped

- Tags: `[harkly, resync, context-update, economics, silicon-sampling, partnership, memory-bootstrap]`

**Что произошло между 2026-02-26 и 2026-02-27 (работа без сессионных команд):**
- Harkly docs sprint завершён: product-brief-v2.md → v2.1 (ready for CPO send)
- Economics model финализирован: results.md, harkly-financial-2026.md (pessimistic: $28,650 rev 2026)
- Partnership docs suite создан: partnership-scenarios.md, white-label-partner-offer.md, roadmap-proxymarket.md, use-case-scenarios.md, call-scenario-proxymarket.md, proxymarket-cpo-questionnaire.md
- Silicon sampling experiment запущен: experiments/silicon_conses_1.md (Пятёрочка+, 20 personas, r=0.85 proof of concept)
- Desktop MVP подтверждён working (node_modules установлен, production use)

**Закрытые эпики:**
- HARKLY-01 → DONE (product-brief-v2.md v2.1 + full docs suite)
- HARKLY-02 → DONE (npm install + desktop running)
- HARKLY-04 → DONE (economics model complete)

**Открытые:**
- HARKLY-03: CPO созвон — nopoint
- HARKLY-05 (new): Web-платформа SaaS dev, target 1 апреля

**Структурное изменение:**
- Создан development/harkly/memory/ с project-level context и handshake
- Предложена стратегия lightweight project sessions (см. handshake.md)

---

## [2026-02-24] [comet] — Harkly: позиционирование ProxyMarket-first, трехслойная модель, PRD v2 draft

- Tags: `[harkly, proxymarket, prd, research, competitive-analysis, synthetic-consumers, aieo]`

**Принятые решения:**
- Harkly = UX-интеллидженс платформа, а не парсер отзывов. Три слоя: Reality (real reviews) + Prediction (synthetic consumers) + AI Perception (AIEO/GEO).
- Первоначальный фокус H1 — ProxyMarket (RU/СНГ + глобальные площадки ProxyMarket).
- Supabase → deprecated. Стек: Cloudflare Workers + D1 или PostgreSQL в RU-облаке (уточняется с юристами ProxyMarket) + ZenRows как fallback до появления собственных парсеров.
- ProxyMarket партнёрская модель: **Hybrid-трек** (сразу Enterprise + путь к white-label).
- Монетизация H1: 2 prediction-запроса free → $49 / $149 / $499 тарифы.
- Data residency: открытый вопрос, зависит от юристов ProxyMarket.
- Calibration data: уточняется на созвоне с CPO ProxyMarket.
- WB/Ozon — не в приоритете H1 (ProxyMarket использует другие площадки).

**Файлы созданы:**
- `docs/harkly/research/competitive-landscape-global-ru-2026-02.md` — конкурентный анализ (global + RU/СНГ)
- `docs/harkly/explanation/proxymarket-artifact-plan.md` — план артефактов (ранее)

**Открытые задачи:**
- PRD v2 (`prd-horizon-1.md`) — черновик согласован, пуш не выполнен — приоритет #1
- Technical One-Pager, Solution Architecture, White-label playbook — после PRD
- Созвон с CPO ProxyMarket — организует nopoint

---

## [2026-02-23] [comet] — Workspace audit: conflicts resolved, RBAC updated, position-descriptions removed

- Tags: `[rbac, audit, comet, constitution, harkly, memory]`
- Removed position-descriptions layer from rules hierarchy (Level 3). RBAC is now the single source of truth for agent roles and permissions.
- Added `comet` role to rbac-regulation.md (Level 1, external, no secret vault access).
- Updated global-constitution.md: Comet added to agent table, Web2 exception declared, harkly added to hierarchy.
- Fixed: `memory/` was documented as gitignored but is actually tracked. Updated handshake.md to reflect truth.
- Fixed: episodic-context-global.md second entry had no header — added retroactively.
- Fixed: `memory/current-context-global.md` active_agents updated to reflect actual state.
- Fixed: harkly-constitution.md Web2 exception documented, broken docs/harkly/ link resolved.
- Fixed: handshake-assistant.md updated to reflect Comet operative context (not just capabilities).
- Noted: /agents/* folders exist locally but not pushed to repo. Requires Assistant to run /sync.

---

## [2026-02-22] [human-ceo] — Agent ecosystem architecture scaffolded

- Tags: `[agents, ecosystem, architecture, rbac]`
- Defined 6-level multi-agent hierarchy: Creator → Assistant/Comet → CTO/Arch → QA → DevOps → SRE.
- Created `agents/ecosystem-map.md` — topology, communication rules, lifecycle, escalation matrix.
- Authored RBAC roles for all Lead agents: assistant, cto, senior-architect, tech-lead, qa-lead, devops-lead, sre-lead.
- Created agent instance folders: `/agents/assistant/`, `/agents/cto/`, `/agents/tech-lead/`, etc. (local only, pending push).
- Updated `global-constitution.md` § 6–8 with agent ecosystem table and memory-regulation link.
- Updated `agents/_template/` — identity.md, config.yaml, permissions.json with ecosystem-aware defaults.
- `workspace-charter.md` in `/agents/` synced to latest constitution.

---

## [2026-02-21] [human-ceo] — Workspace bootstrap

- Tags: `[scaffold, rules, architecture, memory]`
- Created `/nospace` root structure with all standard directories.
- Established 4-level rules hierarchy: Constitution → Regulations → RBAC → Specs.
- Authored `global-constitution.md` merged with `README.md` → unified Workspace Charter.
- Copy placed in `/agents/workspace-charter.md` for agent-first access.
- Authored `tLOS-constitution.md`, `code-style-regulation.md`, `agent-conduct-regulation.md`.
- Scaffolded tiered memory system: scratchpad → current-context → semantic → episodic.
- Authored `memory-regulation.md` covering handoff protocol, consolidation, and decay policy.
- Vector-Ready tags added to all semantic and episodic memory files.
- Branch `_template` created: `spec.md`, `scratchpad.md`, `log-raw.md`, `commit-summary.md`.

---

---
## Session 2026-02-23 — Git setup, harkly migration, Comet sync infrastructure

**Decisions:**
- Repo switched private → memory/ now tracked in git for Comet sync
- harkly migration scope: desktop only (API deferred to next stage)
- Investor pitch: 3 UX/UI scenarios (SaaS Dashboard / API-product / White-Label), $3–5K seed ask with profit share model
- /sync = bidirectional: pull Comet changes → push local state via handshake-assistant.md
- Comet (Perplexity) confirmed as external AI assistant with full GitHub read/write; async inbox = Issues with `comet` label or memory/ files

**Files changed:**
- `.gitignore` — created + updated (memory/ tracked, .archive/ tracked, selective private_knowledge exclusions)
- `.gitattributes` — created (LF normalization)
- `.gitmessage` — created (conventional commits template)
- `.git/hooks/pre-commit` — created + fixed (secret detection + file size; false positive fixes)
- `.git/hooks/commit-msg` — created (format validation)
- `rules/regulations/git-regulation.md` — created (full git protocol)
- `rules/global-constitution.md` — §6 updated with git-regulation
- `~/.claude/commands/startgsession.md` — created
- `~/.claude/commands/closegsession.md` — created
- `~/.claude/commands/sync.md` — created + fixed (git stash/pop for unstaged changes)
- `development/harkly/` — full structure created (28 desktop source files, constitution, spec.md)
- `development/harkly/src/desktop/package.json` — fixed (Electron + Vite + React deps)
- `development/harkly/rules/harkly-constitution.md` — created
- `docs/harkly/explanation/investor-pitch.md` — created
- `docs/ecosystem-noadmin/explanation/comet-assistant-capabilities.md` — created
- `memory/handshake-assistant.md` — created (Comet sync file, pushed to GitHub)

**Tasks completed:**
- Full git workflow: GCM, hooks, commit template, .gitattributes, git-regulation.md
- /startgsession, /closegsession, /sync global slash commands
- harkly desktop code migrated to nospace/development/harkly/src/desktop/ (28 files)
- harkly investor pitch with 3 UX/UI scenarios
- Comet capabilities documented
- /sync tested and working (bidirectional push/pull with GitHub)

**Tasks open / carried over:**
- harkly: npm install + test scraper run — H priority, no blocker
- harkly: refine investor pitch for specific investor — H, nopoint provides details
- harkly: API module migration — M, deferred per nopoint
- OPS-TODO-01: encrypt cloudflare/neon .env with age — H, nopoint manual action
- Claude ↔ Comet async channel format — H, nopoint decision
- tLOS: next milestone — M, awaiting nopoint direction

**Risks / flags:**
- `private_knowledge/context/longterm/` credentials unencrypted — OPS-TODO-01 critical, must resolve before any team expansion

---
## Session 2026-02-26 — Harkly economics model review (context limit hit)

**Decisions:**
- No architectural decisions made — session was analytical/review work

**Files read (analysis only, no writes):**
- `docs/harkly/economics/model.py` — harkly economics/financial model
- `docs/harkly/economics/results.md` — economics analysis results
- `docs/harkly/economics/dashboard.html` — economics dashboard UI

**Tasks completed:**
- Partial review of harkly economics model and dashboard (session context limit hit)

**Tasks open / carried over:**
- HARKLY-04: economics model review — incomplete, context limit reached mid-session. Resume with full re-read of model.py + results.md
- HARKLY-01: PRD v2 push — still pending Comet action
- HARKLY-02: npm install + scraper test run — still pending
- HARKLY-03: CPO ProxyMarket call — pending nopoint

**Risks / flags:**
- OPS-TODO-01 (unencrypted .env credentials) still unresolved — remains critical before team expansion

---
## Session 2026-02-28 — tLOS: Phase 1 node-v1 SHIPPED — E2E пайплайн работает

**Decisions:**
- Tauri v2 вместо браузера — tLOS теперь нативное Windows-приложение (frameless, decorations:false)
- Blossom (BUD-01) для бинарной дистрибуции патчей — external HTTP boundary, Zero-Web2 не нарушен
- `grid` и `tlos` как глобальные PowerShell команды (profile functions)
- nopoint identity создан: Nostr npub `npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw`

**Files changed:**
- `core/shell/frontend/src-tauri/` — Tauri v2 обёртка создана
- `core/shell/frontend/src-tauri/target/release/bundle/nsis/tLOS_0.1.0_x64-setup.exe` — готов
- `core/kernel/tlos-nostr/` — NIP-44 транспорт (nostr-sdk 0.37, Secp256k1)
- `core/kernel/tlos-patch-send/` — dev tool: Blossom BUD-01 upload + kind:30000 Nostr publish
- `core/kernel/tlos-patch-daemon/` — full node daemon: receive, SHA256 verify, NATS notify
- `core/shell/frontend/src/components/PatchDialog.tsx` — liquid glass dialog (создан)
- `core/shell/src/main.rs` — NATS→WebSocket bridge для patch.incoming (добавлен)
- `core/grid.ps1` — обновлён: npm run dev → npm run tauri:dev

**Tasks completed:**
- [done] Tauri native app + tLOS_0.1.0_x64-setup.exe
- [done] tlos-nostr + tlos-patch-send + tlos-patch-daemon (compile clean)
- [done] PatchDialog в SolidJS (liquid glass, bottom-right, русский текст)
- [done] E2E тест: Blossom upload ✅, Nostr relay (damus.io) ✅, event published ✅

**Tasks open:**
- [open] Настройка машины Артёма: installer + daemon + обмен npub
- [open] MCB оставшиеся фреймы (ждём API доступы)

<!-- Add new entries above this line. Oldest entries at the bottom. -->

---
## Session 2026-02-27 — tLOS: первый enterprise user + перенос core

**Decisions:**
- Первый enterprise user: Артём (proxy.market), Marketing Command Board (MCB)
- tLOS активная версия: `.tLOS` (Cycle 14, multi-agent), НЕ `the-last-os` (wasmCloud)
- tLOS перенесён: `.tLOS` -> `nospace/development/tLOS/core` (robocopy, все чеки прошли)
- BB-subset для MCB v1: Подвал + Операция + Тактика + Стратегия (без Крыши и мета)
- Запуск через `grid.bat run` из core/, стек живой на localhost:5173

**Files changed:**
- `development/tLOS/branches/mcb-v1/spec.md` — создан, полный spec MCB
- `development/tLOS/memory/handshake-tLOS.md` — обновлён
- `development/tLOS/memory/current-context-tLOS.md` — обновлён
- `development/tLOS/core/` — создан (перенос из .tLOS)

**Tasks completed / open:**
- [done] tLOS идентифицирован и запущен
- [done] tLOS перенесён в nospace/development/tLOS/core
- [done] Ветка mcb-v1 открыта, spec написан
- [open] UI mcb-seo по BB-фреймворку (следующая сессия)
- [open] Числовые цели Владимира от Артёма

---
## Session 2026-03-01 — Harkly: GTM стратегия + Silicon Persona концепт

**Decisions:**
- Cold outreach стратегия: H-06 (Steam/мобильные игры) — первая ниша для теста
- Data-first подход: готовый анализ + silicon persona как gift в первом сообщении
- Silicon Persona = portable MD файл synthetic consumer, откалиброванного на реальных отзывах → кидается в любой LLM → PMF тестирование без юзер-интервью
- AI Perception Layer полностью удалён из продукта (только CX Analysis + CX Prediction)
- Harkly не имеет вертикального фокуса — анализируем любой CX с публичными отзывами

**Files changed:**
- `branches/landing-coldoutreach/hypotheses.md` — 10 lean-format нишевых гипотез
- `branches/landing-coldoutreach/mobile-games-offer.md` — H-06 оффер + шаблоны сообщений
- `branches/landing-coldoutreach/osint-cx-research.md` — OSINT+CX исследование (Qwen)
- `branches/landing-coldoutreach/spec.md` — убран e-commerce таргет
- `rules/harkly-constitution.md` — убрана e-commerce вертикаль из § 1 и § 2
- `memory/current-context-harkly.md` — добавлен GTM state, silicon persona, новые метрики

**Tasks completed:**
- OSINT методология для CX Analysis — исследование готово
- 10 нишевых гипотез оформлены как lean hypotheses с приоритизацией
- H-06 mobile games: оффер, шаблоны outreach (A/B/C/D варианты), операционный план
- Найдены бесплатные инструменты: Steam JSON API, google-play-scraper, Gemini free tier
- Qwen CLI подтверждён как рабочий инструмент для тяжёлых исследовательских задач

**Open:**
- Silicon Persona MD шаблон — нужно разработать формат
- Первый реальный Steam анализ (5 игр) + кластеризация
- Отправить 15 outreach сообщений, замерить reply rate
- CPO ProxyMarket созвон (HARKLY-03)

---
## Session 2026-03-02 — tLOS: Claude Code integration as Eidolon AI backend

**Decisions:**
- tlos-claude-bridge: Node.js service spawning `claude` CLI subprocess as AI backend (BYOK via Claude Code subscription)
- Provider routing: `provider` field in `agent:chat` NATS messages routes to claude-bridge or nim-bridge
- Auth UI: Model panel shows Connection status + "Sign in with Claude" button (triggers `claude login` OAuth)
- Product model confirmed: tLOS = spatial OS + Claude Code + prebuilt AI config (CLAUDE.md, rules/, agents/) bundled

**Files changed:**
- `core/kernel/tlos-claude-bridge/index.js` — NEW + auth + path resolution + cmd.exe fix
- `core/kernel/tlos-claude-bridge/package.json` — NEW
- `core/shell/frontend/src/components/Omnibar.tsx` — provider selector UI + auth status
- `core/kernel/tlos-agent-bridge/src/main.rs` — provider filter (skip claude messages)
- `core/grid.ps1` — claude-bridge service entry + availability check

**Tasks completed / open:**
- ✅ tlos-claude-bridge implemented (NATS + subprocess + session resume + delta streaming)
- ✅ Provider selector UI (Claude/NVIDIA toggle + model list)
- ✅ Auth UI (Connected / Sign in with Claude)
- ❌ Windows subprocess still hangs — cmd.exe /c fix insufficient, needs further diagnosis

---
## Session 2026-03-03 — Harkly: CX OSINT Pipeline MVP working, first Silicon Persona generated

**Decisions:**
- Steam/H-06 выбрана как первая ниша (32/32 по competitive score — наименее конкурентна, ЛПР доступны)
- CX OSINT Pipeline stack: Python 3 + DuckDB + Qwen CLI (stdin) + stdlib urllib — $0 зависимостей
- Simteract (Taxi Life, appid 1351240) — первый целевой лид, OSINT 93/100
- Qwen CLI: text analysis only через stdin; Trinity/opencode — для shell execution на Windows

**Files changed:**
- `development/harkly/branches/cx_osint_pipeline/src/db.py` — полная перезапись (DuckDB params как list, _to_dicts, clusters PK fix)
- `development/harkly/branches/cx_osint_pipeline/src/reviews.py` — Unix timestamp → datetime, playtime KeyError fix
- `development/harkly/branches/cx_osint_pipeline/src/cluster.py` — qwen.cmd, stdin, encoding
- `development/harkly/branches/cx_osint_pipeline/src/report.py` — Windows filename sanitization
- `development/harkly/branches/cx_osint_pipeline/src/pipeline.py` — _ensure_candidate() added
- `development/harkly/branches/cx_osint_pipeline/pipeline-spec.md` — полная спецификация pipeline

**Tasks completed:**
- ✅ 6 runtime bugs fixed в Trinity-generated code (pipeline полностью рабочий)
- ✅ 195 reviews Taxi Life → 7 clusters (Qwen) → report.md + persona.md
- ✅ Первый Silicon Persona MD сгенерирован — готов как outreach gift

**Tasks open:**
- [ ] Fix Key Quotes bug (JSON parsing cluster.quotes в report.py)
- [ ] Run validate.py для Simteract (OSINT score в отчёте = N/A)
- [ ] Отправить 15 outreach @simteract
- [ ] CPO ProxyMarket созвон (HARKLY-03)

---
## Session 2026-03-06 — Harkly: scope pivot to prod-ready Layer 1 + G3 sentiment done

**Decisions:**
- Цель изменена с "демо партнёрам" на "prod-ready Layer 1, доступный по вебу"
- ProxyMarket → on hold (юр. блокер: законность парсинга СНГ площадок)
- Phase 2 (Durable Objects, CRDT, white-label) — деферировано до запуска Layer 1
- G3 rule enforced: Claude = Coach only, MiniMax = Player

**Files changed:**
- `cx-platform/src/etl/sentiment.rs` — NEW, rule-based sentiment scorer
- `cx-platform/src/etl/normalize.rs` — вызывает sentiment::score() после очистки
- `cx-platform/src/etl/store.rs` — пишет sentiment в БД
- `cx-platform/src/api/routes/researches.rs` — SentimentDistribution в API
- `cx-platform-web/lib/api.ts` — sentiment в Signal и AnalyticsResponse
- `cx-platform-web/app/researches/[id]/analytics/page.tsx` — sentiment distribution UI
- `cx-platform-web/app/researches/[id]/page.tsx` — sentiment badges на сигналах

**Tasks completed / open:**
- ✅ JWT auth (G3 #2)
- ✅ Sentiment scoring end-to-end (G3 #3) — cargo check ✅, tsc ✅
- ✅ Пользователь nopointttt@gmail.com зарегистрирован (admin)
- ❌ G3 #4: Create Research форма + auth guard + logout
- ❌ G3 #5: Rate limiting + validation
- ❌ Deploy to public URL

---
## Session 2026-03-06 — Harkly: разработка приостановлена, фокус на деньги

**Decisions:**
- cx-platform Layer 1 технически завершён (G3 #1-#5), код на GitHub
- CF Workers отклонён как деплой — tokio::spawn несовместим с Workers
- Render выбран как деплой платформа (не задеплоено)
- "Harkly в tLOS" (Tauri/SolidJS) — обсуждено, отложено
- **Разработка Harkly приостановлена — nopoint смещает фокус на заработок денег**

**Files changed:**
- `development/harkly/cx-platform/` — 60 файлов G3 #2-#5 запушены на GitHub
- `development/harkly/memory/current-context-harkly.md` — статус → paused
- `development/harkly/memory/handshake-harkly.md` — обновлён

**Tasks completed / open:**
- ✅ G3 #1-#5 все завершены и верифицированы Coach
- ✅ Код запушен на nopointt/nospace
- ❌ Deploy не сделан (Render, конфиги не написаны)
- ❌ G3 #4 UI (Create Research форма) — паузa
- ❌ H-06 outreach Simteract — не отправлено

---
## Session 2026-03-08 — Harkly: E2+E3 frontend готовы, паттерн параллельной разработки

**Decisions:**
- Параллельный паттерн зафиксирован: 2 сабагента в background + Claude кодит одновременно (~50% экономии)
- `prisma migrate dev` не работает с Supabase pooler — использовать SQL напрямую в Dashboard
- Custom subagents (`~/.claude/agents/`) недоступны через `subagent_type` — только `general-purpose`

**Files changed:**
- `harkly-saas/prisma/schema.prisma` — extraction_total, extraction_done, extraction_processed, annotation
- `harkly-saas/src/components/extract/ExtractPage.tsx` — Evidence Extractor UI
- `harkly-saas/src/app/api/projects/[id]/extraction/` — 5 новых API routes
- `nospace/tools/token-counter/count.ts` — SQLite persistence + --history flag

**Tasks completed / open:**
- ✅ E2 Corpus Triage (source list, screening, finalization, polling)
- ✅ E3 Evidence Extractor (5 API routes, UI, seed 40 extractions, schema)
- ✅ Token Counter SQLite per-session history
- ❌ SQL миграция E3 — нужно применить в Supabase Dashboard
- ❌ E4 Insight Canvas — следующий

---
## Session 2026-03-08 — Harkly: все Layer 1 эпики завершены (E0-E6)

**Decisions:**
- Стадия 3 G3 Frontend Build закрыта — E0 Scaffold, E1 Framing, E2 Corpus, E3 Extract, E4 Canvas, E5 Notebook, E6 Share
- Следующий этап: Tech Debt Analysis + SQL миграции в Supabase

**Files changed:**
- `harkly-saas/src/app/` — 12+ новых routes + pages
- `harkly-saas/prisma/` — schema + seed + 3 migrations
- `harkly-saas/src/components/` — insights/, notebook/, share/

**Tasks completed / open:**
- ✅ E4 Insight Canvas (Fact Pack, Evidence Map, Empathy Map + artifacts API)
- ✅ E5 Research Notebook (sidebar, notes CRUD, keyword auto-surfacing)
- ✅ E6 Share + Export (ShareLink, public /share/[token], ZIP, clipboard)
- ⏳ SQL миграции E3/E4/E6 применить в Supabase Dashboard
- ⏳ Стадия 4 Tech Debt Analysis

---
## Session 2026-03-10 — tLOS: L2 Kernel Step 3 DONE — Zep CE Docker stack LIVE

**Decisions:**
- Zep CE v0.27.2 (Docker: PostgreSQL+pgvector HNSW + Neo4j + Graphiti + Zep) заменяет mem0 V1
- Конфигурация через монтируемый `/app/config.yaml`; grid.ps1 генерирует из шаблона + NIM key
- Graphiti использует NIM (llama-3.1-70b-instruct) как OpenAI-compatible LLM для entity extraction
- Semantic search: `POST /api/v2/graph/search` (Graphiti + Neo4j) — заменяет substring search

**Files changed:**
- `core/kernel/tlos-zep-bridge/docker-compose.yml` — СОЗДАН
- `core/kernel/tlos-zep-bridge/config.yaml.template` — СОЗДАН
- `core/kernel/tlos-claude-bridge/zep-client.js` — ПЕРЕПИСАН (Zep CE API)
- `core/grid.ps1` — ОБНОВЛЁН (docker compose вместо mem0-wrapper)

**Tasks completed / open:**
- ✅ L2 Kernel Step 3 DONE — Zep CE LIVE, 200 OK на :8000
- ⏳ Verify Zep CE semantic search (Graphiti NIM extraction)
- ⏳ SEC: PatchDialog Nostr sig + system prompt permissions
