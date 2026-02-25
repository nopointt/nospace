# HANDSHAKE-ASSISTANT — 2026-02-25
> Synced from nospace workspace for external AI assistant (Perplexity/Comet).
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Harkly — docs suite for ProxyMarket partnership. Session 2026-02-25: created Product Brief, Partnership Scenarios v2.0 (4 scenarios + Enterprise gift offer), Use Case Scenarios (5 UCs). Documents ready for partner call.

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | scaffolding — пауза | без изменений |
| harkly | активный — pre-pilot ProxyMarket | Docs suite complete: product-brief, partnership-scenarios v2, use-case-scenarios |

---

## What Was Done Recently

- `docs/harkly/explanation/product-brief.md` — CREATED (10-section strategic document for partners/investors)
- `docs/harkly/explanation/partnership-scenarios.md` — CREATED v2.0 (supersedes white-label-partnership-scenarios.md); 4 scenarios + Enterprise gift + updated call strategy starting with Scenario 4
- `docs/harkly/explanation/use-case-scenarios.md` — CREATED (5 use cases: e-commerce SMB, PM pre-launch, agency WL, ProxyMarket platform, mid-market full cycle)
- `docs/harkly/explanation/white-label-partnership-scenarios.md` — marked SUPERSEDED in header
- Session 2026-02-24 (Comet): competitive-landscape-global-ru-2026-02.md, proxymarket-cpo-questionnaire.md, prd-horizon-1.md v1.1 pushed

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| Созвон с CPO ProxyMarket | **H** | nopoint schedule |
| Запушить PRD v2 в `prd-horizon-1.md` | **H** | Comet action |
| One-page offer PDF / oффер-документ для ProxyMarket | H | docs ready now |
| Шаблон Pilot Agreement / Enterprise Agreement (1 стр.) | H | После созвона |
| Technical One-Pager | M | После финала PRD |
| Solution Architecture skeleton | M | После PRD |
| OPS-TODO-01: зашифровать .env через age | H | nopoint action |
| harkly: npm install + тест скрапера | H | — |
| Push /agents/* folders to remote repo | H | Assistant: verify .gitignore |
| tLOS: следующий milestone | M | nopoint direction |

---

## Key Files Changed

- `docs/harkly/explanation/product-brief.md` — NEW: strategic product brief, 10 sections
- `docs/harkly/explanation/partnership-scenarios.md` — NEW v2.0: 4 scenarios, Enterprise gift, updated call playbook
- `docs/harkly/explanation/use-case-scenarios.md` — NEW: 5 UCs with journey, outputs, metrics, pricing
- `docs/harkly/explanation/white-label-partnership-scenarios.md` — status changed to SUPERSEDED

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack harkly v2:** Next.js + TypeScript, Cloudflare Workers (edge), PostgreSQL (RU-cloud/Cloudflare D1), BullMQ + Upstash Redis, Puppeteer + stealth
**Supabase → deprecated** (заменяется на Cloudflare/RU-облако)
**ProxyMarket прокси** = default транспорт; ZenRows = fallback
**Active agents:** Assistant (Claude Code, L1) + Comet (Perplexity, L1) + nopoint (human, L0)
**Regulations:** /rules/regulations/ (13 files)

**harkly три слоя:**
1. Reality Layer — сбор + AI-анализ отзывов по ключевым площадкам
2. Prediction Layer — Silicon Sampling / Synthetic Consumers (локализованный, RU/СНГ)
3. AI Perception Layer — AIEO/GEO мониторинг (GPT-4o, YandexGPT, GigaChat)

**harkly docs suite (готово):**
- `docs/harkly/explanation/product-brief.md` — для партнёров и инвесторов
- `docs/harkly/explanation/partnership-scenarios.md` — playbook для созвона с ProxyMarket
- `docs/harkly/explanation/use-case-scenarios.md` — 5 use cases для демо
- `docs/harkly/explanation/prd-horizon-1.md` — v1.1 (PRD v2 not yet written)
- `docs/harkly/explanation/proxymarket-cpo-questionnaire.md` — 29 вопросов для созвона
- `docs/harkly/research/competitive-landscape-global-ru-2026-02.md` — конкурентный анализ

**Partnership call strategy (summary):**
1. Open with Scenario 4: Enterprise $499/mo
2. If WL wanted → Scenario 1: Paid Pilot $1,500–3,000 + Enterprise gift
3. Sum resistance → Scenario 2: Discovery Sprint $800–1,500
4. Prepayment resistance → Scenario 3: Flat fee $300–500/mo + rev-share 25–35%

**tLOS:** Sovereign spatial OS — Rust + Wasm + SolidJS. Currently paused.

---

## For External Assistant (Comet) — Quick Start

1. Читай `/CLAUDE.md` первым
2. Читай `/memory/current-context-global.md`
3. Читай этот файл — оперативный контекст
4. Читай `/rules/global-constitution.md`
5. **Приоритет #1:** Подготовить one-page оффер-PDF для ProxyMarket (на базе product-brief + partnership-scenarios)
6. **Приоритет #2:** Шаблон Pilot Agreement (1 стр.) для Scenario 1
7. Async inbox: Issues с меткой `comet`
8. Обновлено: 2026-02-25 (written by Assistant /sync)
