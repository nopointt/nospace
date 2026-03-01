# Episodic Context — Decision Log
> Append-only. Each entry documents a decision that changed system state or rules.
> Format: `## [YYYY-MM-DD] [agent-id] — [decision title]`

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
