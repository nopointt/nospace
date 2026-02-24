# HANDSHAKE-ASSISTANT — 2026-02-24
> Comet (Perplexity) operative context. Перезаписывается Comet после каждой рабочей сессии.
> Synced by Assistant Agent via /sync.
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Harkly — ProxyMarket-first стратегия. Проведено глубокое теоретическое исследование + конкурентный анализ global и RU/СНГ. PRD v2 в процессе: структура согласована с nopoint, финальный пуш PRD не выполнен в последней сессии Comet — требует следующего шага (приоритет #1).

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | scaffolding — пауза | без изменений |
| harkly | активный — pre-pilot ProxyMarket | Конкурентный анализ, product brief, PRD v2 draft (не запушен) |

---

## What Was Done (Comet Session — 2026-02-24)

### Исследования
- Проведено глубокое теоретическое исследование по 8 темам: synthetic consumers, silicon samples, Homo silicus, AI brand sentiment, continuous intelligence, validation science, multi-agent societies, second-order guardrails
- Построены три горизонта Harkly: Завтра (3–6 мес.), середина 2026, 2030
- Проведён конкурентный анализ RU/СНГ (SERM/ORM, маркетплейс-аналитика, synthetic research, AIEO/GEO)

### Артефакты в репо
- `docs/harkly/research/competitive-landscape-global-ru-2026-02.md` — создан (global + RU/СНГ competitive analysis)
- `docs/harkly/product-brief-v1.md` — создан ранее (не в этой сессии, подтверждён)
- `docs/harkly/explanation/prd-horizon-1.md` — **НЕ обновлён**, остаётся v1.1 (см. Open Tasks)

### Ключевые решения от nopoint
- Монетизация H1: 2 запроса free → $49 / $149 / $499 тарифы
- ProxyMarket: Hybrid трек (Enterprise сразу + путь к white-label)
- Data residency: уточнять с юристами ProxyMarket
- Calibration data: уточнять на созвоне с CPO
- OPS-TODO-01: nopoint пояснения получены (про шифрование secrets перед деплоем)

### PRD v2 — статус
- Структура согласована (13 разделов по инструкции nopoint)
- Черновик написан в чате, одобрен по структуре
- **Финальный пуш в `prd-horizon-1.md` НЕ выполнен** — нужно закрыть в следующей сессии
- v1.1 (SHA: b0558ed6249f1af5d79778c84b3ccac9417bf2c4) остаётся актуальной версией в репо

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| Запушить PRD v2 в `docs/harkly/explanation/prd-horizon-1.md` | **CRITICAL** | — Comet action |
| Созвон с CPO ProxyMarket | H | nopoint schedule |
| Technical One-Pager (`docs/harkly/technical-one-pager.md`) | H | После финала PRD |
| Solution Architecture skeleton (`docs/harkly/solution-architecture-document.md`) | M | После PRD |
| White-label playbook update | M | После созвона |
| Partnership Design Doc (`proxymarket-partnership-design.md`) | M | После созвона |
| OPS-TODO-01: зашифровать .env через age | H | nopoint action |
| harkly: npm install + тест скрапера | H | — |
| Push /agents/* folders to remote repo | H | Assistant: verify .gitignore |
| tLOS: следующий milestone | M | nopoint direction |

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack harkly v2:** Next.js + TypeScript, Cloudflare Workers (edge), PostgreSQL (RU-cloud/Cloudflare D1), BullMQ + Upstash Redis, Puppeteer + stealth
**Supabase → deprecated** для harkly (заменяется на Cloudflare/RU-облако, решение зависит от юристов ProxyMarket)
**ProxyMarket прокси** = default транспорт для парсеров; ZenRows = fallback
**Active agents:** Assistant (Claude Code, L1) + Comet (Perplexity, L1) + nopoint (human, L0)
**Regulations:** /rules/regulations/ (13 files)

**harkly три слоя:**
1. Reality Layer — сбор + AI-анализ отзывов по ключевым площадкам
2. Prediction Layer — Silicon Sampling / Synthetic Consumers (локализованный, RU/СНГ)
3. AI Perception Layer — AIEO/GEO мониторинг (GPT-4o, YandexGPT, GigaChat)

**Конкуренты (global):** YouScan, Brand Analytics, IQBuzz, Crayon, Klue, Qualtrics Edge, Profound, LLMrefs
**Конкуренты (RU/СНГ):** YouScan, Brand Analytics, IQBuzz, SemanticForce, MPStats, Moneyplace — ни один не покрывает все три слоя Harkly

**tLOS:** Sovereign spatial OS — Rust + Wasm + SolidJS. Kernel: Axum + Tokio + wasmtime. Mesh: NATS. Identity: Nostr/Ed25519/DID. Currently paused.

---

## For External Assistant (Comet) — Quick Start

1. Читай `/CLAUDE.md` первым
2. Читай `/memory/current-context-global.md`
3. Читай этот файл — оперативный контекст
4. Читай `/rules/global-constitution.md`
5. **Приоритет #1:** запушить PRD v2 (см. Open Tasks)
6. Async inbox: Issues с меткой `comet`
7. Обновлено: 2026-02-24 (merged by Assistant /sync)
