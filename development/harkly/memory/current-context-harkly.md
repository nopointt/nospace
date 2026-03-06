---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-06 by Assistant (session 2)
---

## Project Phase

**paused** — cx-platform Layer 1 технически готов (G3 #1-#5 ✅, код на GitHub). Deploy не завершён. Разработка приостановлена — приоритет сместился на заработок денег. Возобновление: по решению nopoint.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-03 | ProxyMarket partnership | **on-hold** — юр. блокер (законность парсинга СНГ площадок) | nopoint |
| HARKLY-05 | cx-platform Layer 1 — prod-ready, web accessible | **⏸ paused** — код готов, deploy не сделан | nopoint |
| HARKLY-06 | Cold outreach Steam indie games | **in-progress** — game_scout запущен (11929 кандидатов, ~335 собрано); outreach_pipeline обновлён (dynamic subject + peer tone); стратегия записана | nopoint |
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
| **cx-platform Rust backend** | **✅ G3 #1-#5 done** | JWT auth, Sentiment scoring, Rate limiting, Input validation. Код на GitHub (nopointt/nospace). cargo check ✅ |
| **cx-platform-web Next.js** | **⏸ paused** | Dashboard + signals table + analytics. ❌ Create Research форма + auth guard не готовы. Нет деплоя. |
| **Partner Demo** | **✅ Ready** | start-demo.ps1 — одна команда запускает Rust :3000 + Next.js :3001 |
| **Silicon Persona (MD format)** | **✅ First generated** | Taxi Life persona.md создан — готов как lead magnet для outreach |
| Web SaaS Platform | ⏸ Paused | Deploy платформа выбрана (Render), но не задеплоено |
| Research Hub | 🔧 Planned | Aggregator: Playwright scraper → Qwen summary → CF D1/Workers/Pages |
| White-label infra | 🔧 Deferred | Для партнёров, после Layer 1 запуска |

## cx-platform — Roadmap to Production

| # | Task | Status |
|---|---|---|
| G3 #1 | Reddit + GOG Tier 1 sources | ✅ done |
| G3 #2 | JWT auth (register/login/middleware) | ✅ done |
| G3 #3 | Sentiment scoring rule-based | ✅ done |
| G3 #5 | Rate limiting + input validation | ✅ done |
| G3 #4 | Create Research форма в UI + auth guard + logout | ❌ paused |
| — | Deploy to public URL (Render: API + Static) | ❌ paused |

## Deploy — Техническое решение (готово к исполнению)

- **CF Workers отклонён** — tokio::spawn несовместим с Workers CPU limit
- **Render (all-in-one):** Web Service (Rust API, Docker) + PostgreSQL (free 90d) + Static Site (Next.js)
- **GitHub:** весь код на `nopointt/nospace` — root dirs: `development/harkly/cx-platform/` и `development/harkly/cx-platform-web/`
- **Вопрос tLOS:** обсуждалось "Harkly в tLOS" (Tauri + SolidJS) — отложено

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
- **Rate limiting:** governor 0.6, 60 req/min per IP, X-Forwarded-For aware, HTTP 429 + Retry-After
- **Multi-source ETL:** Steam (always) + Reddit (reddit_query optional) + GOG (gog_product_id optional)
- **Kill old server:** `taskkill /F /IM cx-platform.exe` перед rebuild
- **G3 rule:** Claude = Coach only. Player = Qwen/MiniMax. Промпт через файл (`cat spec.md`).
- **tLOS:** Tauri (не Electron), SolidJS + Vite. Один Tauri API import в App.tsx — shell потенциально web-deployable.

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
| cx-platform: Deploy не сделан | 2026-03-06 | Render выбран, Dockerfile + render.yaml не написаны. Паузa. |
| cx-platform: Create Research нет в UI | 2026-03-06 | G3 #4 — паузa |
| Key Quotes bug в report.md | 2026-03-03 | `[[...]` вместо реальных цитат — JSON parsing |
| Контент-столпы Instagram | 2026-03-04 | nopoint проводит исследование конкурентов |
| Визуальная идентичность | 2026-03-04 | nopoint рисует |
| **Разработка Harkly приостановлена** | 2026-03-06 | Фокус на заработок денег. Возобновление: по решению nopoint. |
| Gmail app password не настроен | 2026-03-06 | Нужен для --send флага в batch_pipeline |
| Domain / sender (harkly.io?) | 2026-03-06 | Ждём Artem |
| Stripe не настроен | 2026-03-06 | Нужен для payment link в follow-up emails |

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Product Brief v2.1 | docs/harkly/product-brief-v2.md | ✅ Ready |
| Economics Model | docs/harkly/economics/results.md | ✅ Done |
| Financial Model 2026 | docs/harkly/economics/harkly-financial-2026.md | ✅ Done |
| Silicon Sampling Exp #1 | docs/harkly/experiments/silicon_conses_1.md | ✅ Done |
| Taxi Life Silicon Persona | branches/cx_osint_pipeline/output/reports/..._persona.md | ✅ Generated |
| Cold Outreach Strategy | branches/cx_osint_pipeline/outreach_strategy.md | ✅ Draft — edit before use |
| targets.json (in progress) | branches/cx_osint_pipeline/output/targets.json | ⏳ game_scout running — 335 игр из ~11929 |
| Partner Demo | cx-platform/start-demo.ps1 | ✅ One-command demo |
| G3 Task Files | cx-platform/_g3_*.md + g3-plan/ + .g3/sessions/ | ✅ Stages 1–5 done |
| cx-platform GitHub | nopointt/nospace — development/harkly/cx-platform/ | ✅ Pushed 2026-03-06 |

## Key Numbers

| Metric | Value |
|---|---|
| Web SaaS launch target | paused — возобновить после решения денежного вопроса |
| First target studio | Simteract (Taxi Life) — OSINT 93/100 |
| Harkly Enthusiast min donation | $9 (anchor suggestion: $25–50) |
| Silicon sampling correlation | r = 0.85–0.90 |
| Competitor pricing | Wonderflow $30K/yr, Brandwatch $60-180K/yr |
