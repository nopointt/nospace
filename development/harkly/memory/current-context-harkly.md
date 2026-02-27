---
# CURRENT CONTEXT — harkly
> Project-level snapshot. Read at start of every harkly session.
> Tags: [harkly, project, state, epics, blockers]
> Last updated: 2026-02-27 by Assistant
---

## Project Phase

**pre-launch** — docs complete, desktop MVP live, web platform in dev.

## Active Epics

| Epic ID | Description | Status | Owner |
|---|---|---|---|
| HARKLY-03 | Созвон с CPO ProxyMarket | pending | nopoint |
| HARKLY-05 | Web-платформа SaaS dev — target 1 апреля 2026 | in-progress | nopoint |

## Product State

| Component | Status | Notes |
|---|---|---|
| Desktop MVP | ✅ Live | Electron + Vite + React, работает в production |
| Reality Layer (парсеры) | ✅ Working | ZenRows fallback, маркетплейсы + карты |
| Prediction Layer (silicon consumers) | ✅ Proof-of-concept | silicon_conses_1.md — Пятёрочка+ тест |
| AI Perception Layer | 🔧 Planned | Мониторинг ChatGPT/YandexGPT/GigaChat |
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
| Calibration data Prediction Layer | 2026-02-24 | Уточнить на CPO созвоне |
| Web platform architecture decision | 2026-02-27 | Nужно решение nopoint → CTO |

## Key Numbers

| Metric | Value |
|---|---|
| Credit pricing | 1 review = 1 cr / 1 synthetic consumer = 20 cr / 1 LLM query = 1 cr |
| COGS/credit | $0.01275 (with 50% buffer) |
| WL-Base | $2,250/мес (150k credits + 25k gift) |
| Silicon sampling correlation | r = 0.85–0.90 (Stanford/NYU 2024) |
| Desktop launch date | running now |
| Web SaaS launch target | 1 апреля 2026 |
