# session-scratch.md
> Placeholder · Axis · 2026-04-16 · session 242
> Last processed checkpoint: #241

<!-- ENTRY:2026-04-16:CLOSE:243:contexter:ctx-13-reddit-gtm [AXIS] -->
## 2026-04-16 — сессия 243 CLOSE [Axis]

**Decisions:**
- D-AXIS-01: Copy audit scope моcтли ru.ts, не tsx (frontend мигрирован на i18n). 38/60 старых пунктов RESOLVED, 11 still in ru.ts, 24 new items (Landing.tsx + Supporters + hardcoded EN в Hero/Upload).
- D-AXIS-02: Apply phase = 6 атомарных коммитов, primarily в ru.ts. Порядок: jargon sweep → landing copy → Hero Connect i18n → Upload wire existing keys → weak error toasts → CTA specificity.
- D-AXIS-03: Analytics primary candidate = PostHog EU Cloud (1M events free, native Hono SDK, EU residency, funnels + replay + errors + MCP telemetry one platform). Pending DEEP-1.
- D-AXIS-04: UTM attribution via LemonSqueezy `custom_data` + sessionStorage pipeline — zero-cost, ~30 lines JS. Time-sensitive (UTM не пойманный на первой волне теряется навсегда).
- D-AXIS-05: E4 standard обновлён для 1M context — empirical signals > fill percentages. nopoint's working range 500-700K на Opus 4.7.
- D-AXIS-06: Credits programs priority — NVIDIA Inception + Cloudflare for Startups $5K + AWS Activate Foundation (все прямые заявки, все требуют incorporation).
- D-AXIS-07: Credits finding — Contexter GitHub = 0 stars (created 2026-03-21, size=0), Claude for OSS полностью не применим.

**Files created/modified:**
- `docs/research/contexter-copy-audit-2026-04-16.md` — NEW, copy audit refresh (24 files scanned, updated master table)
- `docs/research/contexter-analytics-seed-research.md` — NEW, analytics SEED (25 signals, 15 dimensions, 3 DEEP recommendations)
- `~/.claude/projects/C--Users-noadmin/memory/feedback_opus_4_7_context_threshold.md` — NEW, 500-700K working range
- `~/.claude/projects/C--Users-noadmin/memory/MEMORY.md` — pointer added
- `~/.claude/rules/standards.md` — E4 rewritten (model-aware thresholds)
- `~/.claude/reglaments/context-economy.md` — degradation section rewritten
- `~/.claude/reglaments/bug-diagnosis.md` — degradation section rewritten
- `nospace/docs/system-guide.md` — degradation section rewritten

**Completed:**
- Trek A Phase 0 — copy audit refresh (Sonnet agent `a3cc4ecbacc9633fc`, 5min, 47K tokens)
- Analytics SEED — Sonnet agent `aba95018230406c42`, 8min, 90K tokens, 25 signals, 3 DEEP recs
- E4 rule update — 4 файла синхронизированы
- Credits program analysis — 8 программ (4 из файла + 4 из web search), приоритеты расставлены, incorporation identified as gating blocker

**Opened:**
- Trek A apply phase (6 atomic commits в ru.ts + Hero.tsx + Upload.tsx) — pending nopoint review of proposed replacements, planned for fresh dialog через /continueaxis
- Analytics DEEP-1 (PostHog integration spec, SolidJS + Hono middleware + LS webhook + funnel) — pending nopoint approval
- Analytics DEEP-2 (UTM attribution pipeline, time-sensitive) — pending
- Analytics DEEP-3 (MCP telemetry decision) — pending, non-blocking для launch
- Credits program incorporation decision (AR LLC / Delaware C-Corp / KZ ТОО) — blocks NVIDIA Inception + AWS Activate + CF Startups + Anthropic Startup direct
- AI'preneurs 2026 diagnostic interview ~April 20 — ask про Astana Hub Perks partner list (Anthropic? AWS? GCP? Cloudflare?)
- Submit Anthology Fund Airtable (единственная программа без incorporation блокера)

**Notes:**
- Context engineering: эта сессия ушла на ~380K (прочитано 18 GTM research файлов + 2 specs + 4 reglament). Уроки для /continueaxis: деликатно читать SEED outputs через offset/limit, делегировать большие inventory задачи Explore-агентам вместо прямого чтения в Orchestrator.
- Rate limit burn сегодня (1 час → лимиты в 0) — не цена Opus 4.7, а combo: (a) Claude Code v2.1.100 тихо добавляет ~20K tokens/request (GitHub issue, задокументированный баг), (b) март off-peak promo закончился 28 марта, (c) weekly Opus cap отдельный с августа 2025.
- Copy audit: критично для Reddit/HN трафика — на публичном Landing через `ru.ts` висят жаргоны `Мультимодальный поиск`, `MCP-подключение`, `RAG`, `self-hosting`, `векторизация`. 8 пунктов Prio 0.
- Analytics gap: важный unexpected — dev-аудитория undercounts на 30-50% из-за ad-blockers. Рекомендация SEED — client-side + server-side (GoAccess на Caddy logs) параллельно для floor+ceiling.
- LemonSqueezy в январе 2026 объявили Stripe migration — следить до строительства attribution pipeline, может сломать `custom_data` структуру.
- Incorporation статус Contexter неясен — нужно обсудить с Артёмом до AI'preneurs диагностики.
