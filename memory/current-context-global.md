---
# CURRENT CONTEXT — GLOBAL
> Structured snapshot of workspace state. Updated when an epic or major branch closes.
> Tags: [workspace, global, state, epics, blockers]
> Last updated: 2026-02-26 by Assistant
---

## Active Epics

| Epic ID | Project | Description | Status | Owner Agent |
|---|---|---|---|---|
| HARKLY-01 | harkly | ProxyMarket-first: PRD v2 + docs suite | **in-progress** | Comet |
| HARKLY-02 | harkly | npm install + test scraper run | pending | Assistant |
| HARKLY-03 | harkly | Созвон с CPO ProxyMarket | pending | nopoint |
| HARKLY-04 | harkly | Economics model review (model.py + dashboard) | **in-progress** | Assistant |

## Global State

| Key | Value | Last Updated |
|---|---|---|
| workspace_phase | active-dev | 2026-02-24 |
| active_projects | tLOS (pause), harkly (active) | 2026-02-24 |
| active_agents | assistant (Claude Code, L1), comet (Perplexity, L1), nopoint (human CEO) | 2026-02-24 |
| harkly_positioning | UX-интеллидженс платформа, 3 слоя, ProxyMarket-first | 2026-02-24 |
| harkly_partner_track | Hybrid (Enterprise сразу + white-label) | 2026-02-24 |
| harkly_infra | Cloudflare Workers + D1/PostgreSQL-RU + BullMQ + ZenRows fallback | 2026-02-24 |
| harkly_supabase | deprecated | 2026-02-24 |
| harkly_monetization | Free (2 req) + $49/$149/$499 tiers | 2026-02-24 |

## Blockers

| Blocker | Affects | Raised | Resolution |
|---|---|---|---|
| PRD v2 не запущен в `prd-horizon-1.md` | HARKLY-01 | 2026-02-24 | Comet action required (приоритет #1) |
| Data residency: RU-юрисдикция или Cloudflare? | harkly infra | 2026-02-24 | Нужно согласовать с юристами ProxyMarket |
| Calibration data для Prediction Layer | HARKLY-01 | 2026-02-24 | Уточнить на созвоне с CPO |
| OPS-TODO-01: encrypt .env через age | security | 2026-02-22 | nopoint action required |
| /agents/* folders not pushed to repo | agents/ | 2026-02-23 | Assistant: run /sync |
| HARKLY-04 economics model review incomplete | HARKLY-04 | 2026-02-26 | Session hit context limit — resume next session |

## Last Consolidation

- **Reviewer Run:** Comet session 2026-02-24 — harkly research sprint, competitive analysis, PRD v2 draft
- **Decisions locked:** ProxyMarket Hybrid-track, 3-layer model, Supabase deprecated, monetization tiers
- **Next Scheduled Run:** после созвона с CPO ProxyMarket

## Token Budget (LLM10: Unbounded Consumption Mitigation)

> Updated by Lead agents after each branch closes. Alert threshold: 80% of workspace limit.

| Scope | Limit (tokens) | Used (tokens) | % | Last Updated |
|---|---|---|---|---|
| workspace / month | 5,000,000 | — | — | — |
| per-branch hard cap | 30,000 | — | — | — |
| approval-router queue | 10 slots | — | — | — |

**On 80% alert:** Assistant notifies nopoint. No new branches opened until usage reviewed.
**On 100%:** All swarm agents halted. nopoint decision required to resume.
