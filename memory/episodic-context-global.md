# Episodic Context — Decision Log
> Append-only. Each entry documents a decision that changed system state or rules.
> Format: `## [YYYY-MM-DD] [agent-id] — [decision title]`

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

<!-- Add new entries above this line. Oldest entries at the bottom. -->
