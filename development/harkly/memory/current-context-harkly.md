---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-04 by Assistant
---

## Project Phase

**pre-launch** — CX OSINT Pipeline работает end-to-end. Instagram ветка открыта: аудитория определена (CX/UX researchers first, PMs secondary), воронка решена (Harkly Enthusiast $9+ донат), GSAP видео PoC готов. Следующий шаг: контент-столпы + визуальная идентичность + Playwright MP4 pipeline.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-03 | Созвон с CPO ProxyMarket | pending | nopoint |
| HARKLY-05 | Web-платформа SaaS dev — target 1 апреля 2026 | in-progress | nopoint |
| HARKLY-06 | Landing page + Cold outreach | **in-progress** — pipeline готов, persona.md сгенерирован; нужна отправка первых 15 outreach | nopoint |
| HARKLY-07 | CX OSINT Pipeline — autonomous pipeline | ✅ MVP done — 7 файлов Python, DuckDB, Qwen кластеризация, Silicon Persona MD output | nopoint |
| HARKLY-08 | Instagram — контент и аккаунт | **in-progress** — аудитория и воронка решены, визуальная идентичность в работе | nopoint |

## Product State

| Component | Status | Notes |
|---|---|---|
| Desktop MVP | ✅ Live | Electron + Vite + React, работает в production |
| CX Analysis (Reality Layer) | ✅ Working | Парсинг отзывов + NLP + Behavioral Taxonomy; ZenRows fallback |
| CX Prediction (Silicon Sampling) | ✅ Proof-of-concept | silicon_conses_1.md — Пятёрочка+ тест, r=0.85–0.90 |
| **CX OSINT Pipeline** | **✅ MVP working** | Автономный Python pipeline: Steam Spy → OSINT scoring → reviews → Qwen clustering → report.md + persona.md |
| **Silicon Persona (MD format)** | **✅ First generated** | Taxi Life persona.md создан — готов как lead magnet для outreach |
| Web SaaS Platform | 🔧 In dev | Cloudflare Workers + D1/PostgreSQL-RU |
| Research Hub | 🔧 Planned | Aggregator: Playwright scraper → Qwen summary → CF D1/Workers/Pages; title+summary+link модель |
| GSAP Video Pipeline | 🔧 PoC ready | scene-01.html работает; Playwright MP4 recorder не настроен |
| White-label infra | 🔧 Planned | Для партнёров, target Q1 2026 |

## Instagram Strategy (HARKLY-08)

- **Аудитория (primary):** CX/UX researchers, CX-специалисты
- **Аудитория (secondary):** Product Managers
- **Позиционирование аккаунта:** "исследовательская лаборатория клиентского опыта"
- **Воронка:** Instagram → Landing → Harkly Enthusiast донат ($9 min, без потолка) → Research Hub + Alpha test + Telegram
- **"Harkly Enthusiast":** lifetime статус, voluntary donation, якорная подсказка "$25–50 most common"
- **Research Hub стек:** Playwright headless → Qwen 3.5 (title+summary+tags+relevance) → CF D1 → CF Workers API → CF Pages фронт
- **Контент-столпы:** TBD — nopoint проведёт исследование конкурентов (промпт готов)
- **Визуальная идентичность:** в работе у nopoint
- **Видео формат:** GSAP HTML → Playwright recordVideo → MP4 1080×1920

## Docs / Artifacts Ready

| Артефакт | Файл | Статус |
|---|---|---|
| Product Brief v2.1 | docs/harkly/product-brief-v2.md | ✅ Ready for CPO send |
| Partnership Scenarios | docs/harkly/explanation/partnership-scenarios.md | ✅ Done |
| White-label Offer | docs/harkly/explanation/white-label-partner-offer.md | ✅ Done |
| CPO Questionnaire | docs/harkly/explanation/proxymarket-cpo-questionnaire.md | ✅ Done |
| Call Scenario ProxyMarket | docs/harkly/explanation/call-scenario-proxymarket.md | ✅ Done |
| Roadmap ProxyMarket | docs/harkly/explanation/roadmap-proxymarket.md | ✅ Done |
| Use Case Scenarios | docs/harkly/explanation/use-case-scenarios.md | ✅ Done |
| Economics Model | docs/harkly/economics/results.md | ✅ Done |
| Financial Model 2026 | docs/harkly/economics/harkly-financial-2026.md | ✅ Done |
| Silicon Sampling Exp #1 | docs/harkly/experiments/silicon_conses_1.md | ✅ Done — Пятёрочка+ |
| OSINT+CX Research Report | branches/landing-coldoutreach/osint-cx-research.md | ✅ Done |
| Niche Hypotheses (10 ниш) | branches/landing-coldoutreach/hypotheses.md | ✅ Done |
| H-06 Mobile Games Offer | branches/landing-coldoutreach/mobile-games-offer.md | ✅ Done |
| **Pipeline Spec** | **branches/cx_osint_pipeline/pipeline-spec.md** | ✅ Done — полная спецификация |
| **Taxi Life CX Report** | **branches/cx_osint_pipeline/output/reports/1351240_Taxi Life_ A City Driving Simulator_report.md** | ✅ Generated |
| **Taxi Life Silicon Persona** | **branches/cx_osint_pipeline/output/reports/1351240_Taxi Life_ A City Driving Simulator_persona.md** | ✅ Generated — lead magnet ready |
| **GSAP Video PoC** | **video-tests/scene-01.html** | ✅ PoC — "The Signal in the Noise", 12 Disney principles applied |

## GTM Strategy (Cold Outreach)

- **Первая ниша:** H-06 — Steam/мобильные игры (Mixed рейтинг, 500+ отзывов)
- **Первый лид:** Simteract (Taxi Life, appid 1351240) — OSINT score 93/100, Twitter @simteract, Discord, LinkedIn
- **Подход:** data-first + silicon persona как gift в первом сообщении
- **Бесплатный стек:** Steam JSON API + Qwen CLI кластеризация + DuckDB
- **Reply rate target:** 12–18% (data-first benchmark по Belkins 2025)
- **Порог H-06:** 3+ ответа из 15 сообщений = гипотеза подтверждена

## Silicon Persona Concept

**Что это:** MD файл с synthetic consumer профилем, откалиброванным на реальных публичных отзывах продукта.
**Как работает:** кидаешь в любой LLM (Claude/GPT/Gemini) → LLM становится синтетическим клиентом → можно задавать вопросы о PMF, фичах, болях.
**Use case:** PMF тестирование на уровне гипотез без юзер-интервью.
**Статус:** ✅ Первый файл сгенерирован для Taxi Life.

## CX OSINT Pipeline — Tech Notes

- **Стек:** Python 3.14, DuckDB 1.4.4, Qwen CLI (через stdin), stdlib urllib
- **Путь:** `development/harkly/branches/cx_osint_pipeline/src/`
- **Запуск:** `python pipeline.py --mode analyze --appid {appid}`
- **Windows quirks:** `qwen.cmd` (не `qwen`), no colons in filenames, Unix timestamps → datetime
- **Для shell ops:** Trinity/opencode (не Qwen — он text-only в `--output-format text` режиме)
- **Известный баг:** Key Quotes в report.md показывает `[[...]` — JSON parsing cluster.quotes не раскрывает список
- **Следующий шаг:** запустить `validate.py --min-score 50` чтобы заполнить OSINT score в report

## Economics Snapshot

- **Revenue 2026 (pessimistic):** $28,650
- **Dec MRR:** $3,900 | **ARR run-rate:** $46,800
- **GM breakeven:** October 2026
- **WL Schedule:** ProxyMarket WL-Base (март), WL-Pro (июнь), WL-Base #2 (сентябрь), WL-Scale (декабрь)
- **Artem commission:** 20% GP на Enterprise + WL клиентах

## Partnership State

| Partner | Track | Status |
|---|---|---|
| ProxyMarket | Hybrid (Enterprise + White-label) | Docs ready, CPO call pending |

## Blockers

| Blocker | Raised | Resolution |
|---|---|---|
| CPO ProxyMarket созвон | 2026-02-24 | nopoint schedules — приоритет |
| Data residency: RU vs Cloudflare | 2026-02-24 | Юристы ProxyMarket |
| Web platform architecture decision | 2026-02-27 | Нужно решение nopoint → CTO |
| Key Quotes bug в report.md | 2026-03-03 | `[[...]` вместо реальных цитат — JSON parsing cluster.quotes |
| OSINT score = N/A в отчёте | 2026-03-03 | Запустить validate.py для appid 1351240 |
| Контент-столпы Instagram | 2026-03-04 | nopoint проводит исследование конкурентов |
| Визуальная идентичность | 2026-03-04 | nopoint рисует |
| Playwright MP4 pipeline | 2026-03-04 | PoC HTML готов, runner не настроен |

## Key Numbers

| Metric | Value |
|---|---|
| Credit pricing | 1 review = 1 cr / 1 synthetic consumer = 20 cr / 1 LLM query = 1 cr |
| COGS/credit | $0.01275 (with 50% buffer) |
| WL-Base | $2,250/мес (150k credits + 25k gift) |
| Silicon sampling correlation | r = 0.85–0.90 (PyMC Labs 2026, 57 опросов) |
| Competitor pricing | Wonderflow $30K/yr, Brandwatch $60-180K/yr, Chattermill $500+/мес |
| Data-first outreach reply rate | 12–18% vs 3–5% generic (Belkins 2025) |
| Cost per analysis | ~$0 (Steam API free + Qwen CLI free + DuckDB free) |
| Desktop launch date | running now |
| Web SaaS launch target | 1 апреля 2026 |
| First target studio | Simteract (Taxi Life) — OSINT 93/100 |
| Harkly Enthusiast min donation | $9 (anchor suggestion: $25–50) |
