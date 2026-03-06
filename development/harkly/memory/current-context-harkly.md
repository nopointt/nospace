---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-06 by Assistant
---

## Project Phase

**pre-launch** — cx-platform Layer 1 завершает production-ready sprint. JWT auth + sentiment scoring готовы. Цель: prod-ready Layer 1 accessible по вебу (без white-label). Следующее: Create Research UI + deploy.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-03 | ProxyMarket partnership | **on-hold** — юр. блокер (законность парсинга СНГ площадок) | nopoint |
| HARKLY-05 | cx-platform Layer 1 — prod-ready, web accessible | **in-progress** | nopoint |
| HARKLY-06 | Cold outreach Steam indie games | **in-progress** — pipeline готов, persona.md сгенерирован; нужна отправка первых 15 outreach | nopoint |
| HARKLY-08 | Instagram — контент и аккаунт | **in-progress** — аудитория и воронка решены, визуальная идентичность в работе | nopoint |
| HARKLY-09 | cx-platform Rust backend — Phase 1 | **✅ done** | nopoint |
| HARKLY-10 | CX Community Building | **planned** — Instagram + Research Hub + Harkly Enthusiast + Telegram | nopoint |

## Product State

| Component | Status | Notes |
|---|---|---|
| Desktop MVP | ✅ Live | Electron + Vite + React, работает в production |
| CX Analysis (Reality Layer) | ✅ Working | Парсинг отзывов + NLP + Behavioral Taxonomy; ZenRows fallback |
| CX Prediction (Silicon Sampling) | ✅ Proof-of-concept | silicon_conses_1.md — Пятёрочка+ тест, r=0.85–0.90 |
| **CX OSINT Pipeline** | **✅ MVP working** | Автономный Python pipeline: Steam Spy → OSINT scoring → reviews → Qwen clustering → report.md + persona.md |
| **cx-platform Rust backend** | **✅ Phase 1 + JWT + Sentiment** | Multi-source ETL: Steam + Reddit + GOG. JWT auth (register/login). Sentiment scoring rule-based. cargo check ✅ |
| **cx-platform-web Next.js** | **🔧 In-progress** | Dashboard + signals table + analytics (sentiment dist). ❌ Create Research форма в UI не готова. Auth guard не готов. |
| **Partner Demo** | **✅ Ready** | start-demo.ps1 — одна команда запускает Rust :3000 + Next.js :3001 |
| **Silicon Persona (MD format)** | **✅ First generated** | Taxi Life persona.md создан — готов как lead magnet для outreach |
| Web SaaS Platform | 🔧 In dev | Цель: prod-ready Layer 1 without white-label |
| Research Hub | 🔧 Planned | Aggregator: Playwright scraper → Qwen summary → CF D1/Workers/Pages |
| White-label infra | 🔧 Deferred | Для партнёров, после Layer 1 запуска |

## cx-platform — Roadmap to Production

| # | Task | Status |
|---|---|---|
| G3 #1 | Reddit + GOG Tier 1 sources | ✅ done |
| G3 #2 | JWT auth (register/login/middleware) | ✅ done |
| G3 #3 | Sentiment scoring rule-based | ✅ done |
| G3 #4 | Create Research форма в UI + auth guard + logout | ❌ next |
| G3 #5 | Rate limiting + input validation | ❌ todo |
| — | Deploy to public URL (HTTPS) | ❌ todo |

## OSINT Sources — cx-platform

| Source | Status | Field |
|---|---|---|
| Steam Reviews | ✅ Active | `appid` (required) |
| Reddit posts | ✅ Active | `reddit_query` (optional) |
| GOG Reviews | ✅ Active | `gog_product_id` (optional) |
| YouTube Comments | 🔧 Planned (Tier 2) | YouTube Data API v3 key needed |

## cx-platform — Tech Notes

- **Rust:** `C:/Users/noadmin/nospace/development/harkly/cx-platform/` — Axum 0.7, sqlx 0.8, PostgreSQL 17 native
- **Next.js:** `C:/Users/noadmin/nospace/development/harkly/cx-platform-web/` — Next.js 14 App Router, Tailwind, port 3001
- **Demo:** `.\start-demo.ps1` от cx-platform-web (запускает оба процесса)
- **JWT:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login` → Bearer token, 7 days
- **Auth user:** nopointttt@gmail.com зарегистрирован, role=admin
- **Sentiment:** rule-based, -1.0 до 1.0, поле `sentiment REAL` в signals таблице
- **Multi-source ETL:** Steam (always) + Reddit (reddit_query optional) + GOG (gog_product_id optional)
- **Kill old server:** `taskkill /F /IM cx-platform.exe` перед rebuild
- **G3 rule:** Claude = Coach only. MiniMax = Player. Промпт через файл (`cat spec.md` в аргумент).

## Instagram Strategy (HARKLY-08)

- **Аудитория (primary):** CX/UX researchers, CX-специалисты
- **Воронка:** Instagram → Landing → Harkly Enthusiast донат ($9 min) → Research Hub + Alpha test + Telegram
- **Контент-столпы:** TBD — nopoint проведёт исследование конкурентов
- **Визуальная идентичность:** в работе у nopoint

## GTM Strategy (Cold Outreach)

- **Первая ниша:** H-06 — Steam/мобильные игры (Mixed рейтинг, 500+ отзывов)
- **Первый лид:** Simteract (Taxi Life, appid 1351240) — OSINT score 93/100, Twitter @simteract
- **Порог H-06:** 3+ ответа из 15 сообщений = гипотеза подтверждена

## Partnership State

| Partner | Track | Status |
|---|---|---|
| ProxyMarket | Hybrid (Enterprise + White-label) | **On hold** — юр. вопрос: законность продажи спаршенных данных СНГ площадок |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| ProxyMarket: законность парсинга СНГ данных | 2026-03-06 | Юр. консультация нужна — on hold до разрешения |
| cx-platform: Create Research нет в UI | 2026-03-06 | G3 #4 следующий |
| cx-platform: нет деплоя | 2026-03-06 | После G3 #4 + #5 |
| Key Quotes bug в report.md | 2026-03-03 | `[[...]` вместо реальных цитат — JSON parsing |
| Контент-столпы Instagram | 2026-03-04 | nopoint проводит исследование конкурентов |
| Визуальная идентичность | 2026-03-04 | nopoint рисует |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Product Brief v2.1 | docs/harkly/product-brief-v2.md | ✅ Ready |
| Economics Model | docs/harkly/economics/results.md | ✅ Done |
| Financial Model 2026 | docs/harkly/economics/harkly-financial-2026.md | ✅ Done |
| Silicon Sampling Exp #1 | docs/harkly/experiments/silicon_conses_1.md | ✅ Done |
| Taxi Life Silicon Persona | branches/cx_osint_pipeline/output/reports/..._persona.md | ✅ Generated |
| Partner Demo | cx-platform/start-demo.ps1 | ✅ One-command demo |
| G3 Task Files | cx-platform/_g3_*.md | ✅ Stages 1–3 done |

## Key Numbers

| Metric | Value |
|---|---|
| Web SaaS launch target | asap — prod-ready Layer 1 |
| First target studio | Simteract (Taxi Life) — OSINT 93/100 |
| Harkly Enthusiast min donation | $9 (anchor suggestion: $25–50) |
| Silicon sampling correlation | r = 0.85–0.90 |
| Competitor pricing | Wonderflow $30K/yr, Brandwatch $60-180K/yr |
