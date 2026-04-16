# session-scratch.md
> Placeholder · Axis · 2026-04-17 · session 244
> Last processed checkpoint: #243

<!-- ENTRY:2026-04-17:CLOSE:244:contexter:contexter-analytics [AXIS] -->
## 2026-04-17 — сессия 244 CLOSE [Axis]

**Decisions:**
- D-AXIS-08..13 (session-level): analytics primary=PostHog EU (locked); copy audit applied; Pro tier 100GB (UI match); Business $79/mo 200GB hidden; NOWPayments secondary fallback; TIER_LIMITS UI-only.
- D-CTX11-01..20 (epic-level, locked in L3 `contexter-analytics.md`): NSM = WAU-A (Weekly Activated Users on 4 value-core MCP tools); AARRR+HEART hybrid framework; PostHog EU Cloud primary + CF Worker proxy + GoAccess mandatory; 24-event taxonomy; 7 Grove guardrails; 12 decision triggers; `person_profiles: 'identified_only'` GDPR posture; posthog-node Bun defaults; SAMPLE_RATE env var; offline batch RAG eval only; persona_self_reported pre-launch; 19 MUST-HAVE MVI items block launch.
- Variant C chosen for copy audit iter 1 (revert c1d08ab + 3 atomic replacement commits + dynamic tier limits).
- DEEP-2 cancelled (~90% covered by DEEP-1). DEEP-5 cancelled (covered by DEEP-4 Sections H+I+K).
- Research reglament updated: Pre-Research Clarification (5 mandatory points) + Query Logging (`## Queries Executed` table) + Progress Signals (every 3-5 min) sections added to `~/.claude/reglaments/research.md`.

**Files changed:**
- `web/src/lib/translations/ru.ts` — jargon sweep (14 replacements), landing Prio-0 (13 replacements), Hero connectTitle/Desc/Cta keys added, weak error toasts strengthened (4), CTA labels specific (starter/pro), settings.namePlaceholder added, cursor.s3.detail MCP-серверов → Contexter.
- `web/src/components/Hero.tsx` — Connect section → i18n, stage error map wired.
- `web/src/pages/Upload.tsx` — Retry + 4 status messages + stage error map all wired to existing i18n keys.
- `web/src/pages/Settings.tsx` — restructured with TIER_LIMITS + dynamic `/api/billing` tier fetch + ProfileField + plan upgrade + support + beta (c1d08ab reverted, replaced by d177a25 with dynamic limits).
- `development/contexter/memory/STATE.md` — Position/Status/Next rewritten for session 244, Pricing tier line expanded (+Business), Pipeline line (308 formats), D-AXIS-08..13 + D-CTX11-01..20 appended, Copy audit blocker resolved, Pro backend fix blocker added.
- `development/contexter/memory/contexter-about.md` (L1) — +CTX-11 in Active L3, Write Authority expanded, Supported Formats corrected for 308 alpha, Last updated 2026-04-17.
- `development/contexter/memory/contexter-roadmap.md` (L2) — +CTX-11 row in Epics table, Last updated 2026-04-17.
- `development/contexter/memory/contexter-analytics.md` (L3) — **NEW**, full CTX-11 epic spec: 20 decisions + Pre-CTX11 (3 tasks) + 6 waves (33 tasks) + 5 SHOULD-HAVE + 6 NICE-TO-HAVE + 12 epic ACs + blockers + G3 assignments. ~30KB.
- `development/contexter/memory/specs/copy-audit-apply-2026-04-16.md` — **NEW**, 6-commit spec for G3.
- `development/contexter/memory/specs/copy-audit-apply-iteration-1-2026-04-16.md` — **NEW**, iter 1 addendum (Variant C hybrid).
- `~/.claude/reglaments/research.md` — Pre-Research Clarification + Query Logging + Progress Signals sections.
- `docs/research/contexter-analytics-primary-deep-research.md` — **NEW** (1055 lines, DEEP-1 PostHog decision, full integration spec).
- `docs/research/contexter-mcp-telemetry-deep-research.md` — **NEW** (~1000 lines, DEEP-3 narrow, 4 gaps + 8 events + quota middleware + OTel mapping).
- `docs/research/contexter-analytics-methodology-seed-research.md` — **NEW** (627 lines, 38 signals across 13 dimensions).
- `docs/research/contexter-measurement-system-deep-research.md` — **NEW** (893 lines, DEEP-4 WAU-A + AARRR events + guardrails + triggers + MVI).
- `docs/research/contexter-analytics-codebase-inventory-2026-04-16.md` — **NEW** (131 lines, Explore agent output: 6 payment flows, 12 MCP tools, 8 existing events, 5 supporter states, tier drift, NOWPayments crypto active).

**Completed:**
- Copy audit applied — 8 atomic commits `6404a56..e137481` on origin/main, G3 Gropius+Breuer iter 1 PARTIAL_PASS → accepted (invented TIER_LIMITS Starter/Pro values judgment call).
- DEEP-1 PostHog EU Cloud analytics platform decision (HIGH 90% confidence).
- DEEP-3 narrow MCP telemetry (4 gaps closed: sampling + OTel verbatim spec + abuse detection + 8-event taxonomy).
- DEEP-4 measurement system design (WAU-A NSM, 24 events, 7 guardrails, 12 triggers, 12 hypotheses, MVI 34 items, Sean Ellis schedule).
- Methodology SEED (38 signals, 2 DEEP recommendations — DEEP-5 skipped per DEEP-4 coverage).
- Codebase inventory via Explore agent (3 prior research docs used stale data — Pro tier drift, Business hidden, NOWPayments crypto active surfaced).
- STATE + L1 + L2 updated for session 244.
- L3 `contexter-analytics.md` written.
- Research reglament enhanced with 3 new mandatory sections.
- 8 memory file discrepancies found + fixed (CTX-11 not registered, 23 formats stale, pricing missing Business, Last updated stamps).

**Opened:**
- Pre-CTX-11 G3 pair (Mies+Schlemmer): persona_self_reported field + user_registered event + Pro backend 50→100GB fix. Spec TBD next session.
- CTX-11 W1 Foundation (PostHog setup + CF Worker proxy + attribution table + env + GSC) — critical path for launch.
- CTX-11 W2 Frontend (posthog-js + UTM module + pageviews + identify).
- CTX-11 W3 Backend (Hono middleware + LS webhook extension + supporter lifecycle events).
- CTX-11 W4 MCP Telemetry (8 events + mcpQuotaMiddleware + derived events).
- CTX-11 W5 GoAccess on Caddy (server-side log layer).
- CTX-11 W6 Dashboards + alerts + end-to-end smoke.
- Reddit Phase 1 warmup (nopoint manual posting) — не блокируется CTX-11.
- Incorporation decision до AI'preneurs ~April 20.
- Anthology Fund Airtable submit (без incorporation gate).

**Notes:**
- Context engineering lesson: 495K context at session close на Opus 4.7 1M — in working range per E4 (500-700K). Не degraded, но чувствительно.
- Разрыв SEED→DEEP методологический: first 3 researches были про HOW (tools, code), не WHAT/WHY (framework, hypotheses). Methodology SEED + DEEP-4 закрыли этот пробел.
- Persona field — critical pre-launch insight (researcher freedom in DEEP-4) — zero-cost to collect, impossible retroactive. Поставлен отдельной micro-task перед W1.
- Copy audit iter 1 scope creep: Gropius переписал Settings.tsx при минимальной спеке — B3 violation. Coach словил. Iteration 1 исправила разделив на 3 atomic commits с dynamic TIER_LIMITS вместо hardcoded free.
- Critical path для launch: Pre-CTX-11 → W1 → W2 → W3 DEPLOYED ДО Reddit Phase 3 — UTM первой волны иначе теряется навсегда.
- Business tier $79/mo hidden — по D-AXIS-11, sales-only. Analytics должен fire events для business если user его активирует.
- LemonSqueezy Stripe migration (January 2026) — monitor blog; custom_data unchanged per April 2026 verification, но risk flagged для W3.
