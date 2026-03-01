---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-03-01 by Assistant
---

## Project Phase

**pre-launch** — docs complete, desktop MVP live, web platform in dev. GTM strategy defined: cold outreach → H-06 mobile games first.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-03 | Созвон с CPO ProxyMarket | pending | nopoint |
| HARKLY-05 | Web-платформа SaaS dev — target 1 апреля 2026 | in-progress | nopoint |
| HARKLY-06 | Landing page + Cold outreach | **in-progress** — ниши, стратегия, шаблоны готовы; нужен первый реальный анализ + отправка | nopoint |

## Product State

| Component | Status | Notes |
|---|---|---|
| Desktop MVP | ✅ Live | Electron + Vite + React, работает в production |
| CX Analysis (Reality Layer) | ✅ Working | Парсинг отзывов + NLP + Behavioral Taxonomy; ZenRows fallback |
| CX Prediction (Silicon Sampling) | ✅ Proof-of-concept | silicon_conses_1.md — Пятёрочка+ тест, r=0.85–0.90 |
| **Silicon Persona (MD format)** | **💡 New concept** | Portable synthetic consumer как .md файл — кидается в любой LLM → PMF testing. Lead magnet для cold outreach |
| Web SaaS Platform | 🔧 In dev | Cloudflare Workers + D1/PostgreSQL-RU |
| White-label infra | 🔧 Planned | Для партнёров, target Q1 2026 |

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
| OSINT+CX Research Report | branches/landing-coldoutreach/osint-cx-research.md | ✅ Done — Qwen research |
| Niche Hypotheses (10 ниш) | branches/landing-coldoutreach/hypotheses.md | ✅ Done |
| H-06 Mobile Games Offer | branches/landing-coldoutreach/mobile-games-offer.md | ✅ Done — шаблоны + план |

## GTM Strategy (Cold Outreach)

- **Первая ниша:** H-06 — Steam/мобильные игры (Mixed рейтинг, 500+ отзывов)
- **Подход:** data-first + silicon persona как gift в первом сообщении
- **Бесплатный стек:** Steam JSON API + google-play-scraper + Gemini free tier
- **Reply rate target:** 12–18% (data-first benchmark по Belkins 2025)
- **Порог H-06:** 3+ ответа из 15 сообщений = гипотеза подтверждена

## Silicon Persona Concept (новый продукт)

**Что это:** MD файл с synthetic consumer профилем, откалиброванным на реальных публичных отзывах продукта.
**Как работает:** кидаешь в любой LLM (Claude/GPT/Gemini) → LLM становится синтетическим клиентом → можно задавать вопросы о PMF, фичах, болях.
**Use case:** PMF тестирование на уровне гипотез без юзер-интервью.
**Статус:** концепция одобрена, шаблон MD нужно разработать.

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
| Silicon Persona MD шаблон | 2026-03-01 | Разработать формат в следующей сессии |
| Первый реальный анализ Steam-игры | 2026-03-01 | Запустить Steam API + LLM кластеризацию |

## Key Numbers

| Metric | Value |
|---|---|
| Credit pricing | 1 review = 1 cr / 1 synthetic consumer = 20 cr / 1 LLM query = 1 cr |
| COGS/credit | $0.01275 (with 50% buffer) |
| WL-Base | $2,250/мес (150k credits + 25k gift) |
| Silicon sampling correlation | r = 0.85–0.90 (PyMC Labs 2026, 57 опросов) |
| Competitor pricing | Wonderflow $30K/yr, Brandwatch $60-180K/yr, Chattermill $500+/мес |
| Data-first outreach reply rate | 12–18% vs 3–5% generic (Belkins 2025) |
| Cost per analysis | ~$0.05 + 20 мин (Steam API free + Gemini free) |
| Desktop launch date | running now |
| Web SaaS launch target | 1 апреля 2026 |
