# HANDSHAKE-ASSISTANT — 2026-02-25 18:30
> Synced from nospace workspace for external AI assistant (Perplexity/Comet).
> Repo: https://github.com/nopointt/nospace (private)
> Entry point: /CLAUDE.md → /rules/global-constitution.md

---

## Current Focus

Economics model complete and committed. ProxyMarket call prep fully done — questionnaire rewritten v2.0, product-brief v1.1 updated, 10 outdated docs deleted. Syncing to GitHub.

---

## Active Projects

| Project | Status | Last Action |
|---|---|---|
| tLOS | On hold — паузa | No actions this session |
| harkly | Active — pre-pilot ProxyMarket | Financial model built + all docs updated for call |

---

## What Was Done Recently

- Built `docs/harkly/economics/harkly_model.py` — full 2026 financial model (912 lines, no external deps, all prices sourced from web 2026-02-25)
- Generated `docs/harkly/economics/results.md` — full report: $79,774 total 2026 revenue, Dec MRR $21,987, 134 clients
- Rewrote `docs/harkly/explanation/proxymarket-cpo-questionnaire.md` v2.0 — async pre-call Part 1 (8 questions for CPO) + Part 2 call guide (pilot + money + packaging, 45-60 min)
- Added "Почему ProxyMarket × Harkly" block to `docs/harkly/explanation/product-brief.md` v1.1
- Deleted 10 outdated docs (white-label-partnership-scenarios, investor-pitch, founders-pitch, founder-questions-answered, founder-features-spec, deployment-stack-migration-spec, desktop-to-web-migration-roadmap, proxymarket-artifact-plan, prd-horizon-1, product-brief-v1)
- Verified LLM pricing 2026: GPT-4.1 $2/$8 per 1M tokens, YandexGPT Pro 5 $10/1M, GigaChat ~$6/1M (estimate), embeddings $0.02/1M

---

## Open Tasks

| Task | Priority | Blocker |
|---|---|---|
| Send async questionnaire Part 1 to CPO ProxyMarket | H | — |
| ProxyMarket call: pilot + money + packaging | H | CPO scheduling |
| One-page offer PDF for ProxyMarket (post-call) | H | Call outcome |
| Pilot Agreement template 1-page | H | — |
| WL margin fix: cap prediction requests in WL tier | M | Identified: at 10 end-clients Prediction cost ~= license revenue |
| OPS-TODO-01: encrypt .env with age | M | nopoint manual action |
| npm install + test scraper run in harkly/src/desktop | M | — |

---

## Key Files Changed

- `docs/harkly/economics/harkly_model.py` — NEW: full financial model, all sourced constants, standalone Python
- `docs/harkly/economics/results.md` — NEW: generated markdown report from model
- `docs/harkly/explanation/proxymarket-cpo-questionnaire.md` — REWRITTEN v2.0: async Part 1 + call guide Part 2
- `docs/harkly/explanation/product-brief.md` — UPDATED v1.1: added ProxyMarket synergy section (section 9)
- DELETED 10 files: white-label-partnership-scenarios, investor-pitch, founders-pitch, founder-questions-answered, founder-features-spec, deployment-stack-migration-spec, desktop-to-web-migration-roadmap, proxymarket-artifact-plan, prd-horizon-1, product-brief-v1

---

## Architecture Snapshot

**Workspace:** /nospace — AI-first multi-agent workspace
**Tech stack:** TypeScript, Rust, Electron, React, BullMQ
**Active agents:** Assistant (Claude Code) + Comet (Perplexity) + nopoint (human)
**Regulations:** /rules/regulations/ (13 files)
**Constitution:** /rules/global-constitution.md

**harkly:** Consumer Intelligence Platform — 3 layers: Reality + Prediction + AI Perception
- Desktop: /development/harkly/src/desktop/ (Puppeteer + React, Electron MVP — production-ready)
- API: /development/harkly/src/api/ (placeholder, next stage)
- Docs suite: /docs/harkly/explanation/ (product-brief v1.1, partnership-scenarios v2.0, use-case-scenarios, questionnaire v2.0)
- Economics: /docs/harkly/economics/ (harkly_model.py + results.md)
- Stack decision: Cloudflare Workers (edge/scraping) + Yandex Cloud PostgreSQL (FZ-152 compliant) + Yandex Cloud Object Storage + Upstash Redis (BullMQ)
- First partner: ProxyMarket — Hybrid track (Enterprise → WL), call confirmed agenda: пилот + деньги + упаковка
- Pricing tiers: Starter $49 / Growth $149 / Pro $299 / Enterprise $499 / WL $6-12K/yr

**tLOS:** Sovereign spatial OS — Rust + Wasm + SolidJS. Currently paused.

---

## Economics Model — Key Results (2026 Base Case)

- Total 2026 revenue: $79,774
- December MRR: $21,987 | 134 paying clients
- Fixed infra: $47/mo launch → $69/mo at 100 clients
- LTV:CAC all tiers: 31:1–74:1 (well above 3:1 minimum)
- ProxyMarket S1 (Paid Pilot → Annual): pilot $1,500 + license $9,600/yr = $11,100 Year 1
- Enterprise "gift" actual cash cost: $154.78 (vs $998 opportunity cost) — key talking point for call
- WL margin issue: at 10 end-clients, Prediction Layer cost ~= license revenue → need request cap in WL tier

## ProxyMarket Call Strategy (confirmed)

- Open with Scenario 4 (Enterprise $499/mo) → Scenario 1 (Paid Pilot WL $1,500–3,000) → S2 (Discovery Sprint $800–1,500) → S3 (Rev-share)
- Key offer: Enterprise access "as a gift" during pilot — actual cost $154.78, high perceived value
- Questionnaire Part 1 (8 async questions) ready to send before call

---

## For External Assistant (Comet)

1. Read /CLAUDE.md first (entry point with navigation)
2. Read /memory/current-context-global.md (workspace state)
3. Read /rules/global-constitution.md (rules hierarchy)
4. Read /docs/harkly/economics/results.md — financial model output
5. Read /docs/harkly/explanation/proxymarket-cpo-questionnaire.md — call prep
6. Read /docs/harkly/explanation/partnership-scenarios.md — 4 scenarios + call playbook
7. **Priority #1:** One-page offer document for ProxyMarket (post-call)
8. **Priority #2:** Pilot Agreement template (1-page, Scenario 1)
9. This file was written at 2026-02-25 18:30 — check git log for newer changes
