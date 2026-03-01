---
# CURRENT CONTEXT — GLOBAL
> Structured snapshot of workspace state. Updated when an epic or major branch closes.
> Tags: [workspace, global, state, epics, blockers]
> Last updated: 2026-03-02 by Assistant
---

## Active Epics

| Epic ID | Project | Description | Status | Owner Agent |
|---|---|---|---|---|
| HARKLY-03 | harkly | Созвон с CPO ProxyMarket | pending | nopoint |
| HARKLY-05 | harkly | Web-платформа SaaS (API + white-label) — запуск 1 апреля | in-progress | nopoint |

## Closed Epics (since last global update)

| Epic ID | Project | Description | Closed | Result |
|---|---|---|---|---|
| HARKLY-01 | harkly | PRD v2 + docs suite | 2026-02-26 | product-brief-v2.md v2.1 + full partnership docs suite |
| HARKLY-02 | harkly | npm install + test scraper run | 2026-02-26 | node_modules installed, desktop MVP running |
| HARKLY-04 | harkly | Economics model review | 2026-02-26 | results.md complete, financial model finalized |

## Global State

| Key | Value | Last Updated |
|---|---|---|
| workspace_phase | active-dev | 2026-02-27 |
| active_projects | tLOS (pause), harkly (active) | 2026-02-27 |
| active_agents | assistant (Claude Code, L1 — Coach+Orchestrator), comet (Perplexity, L1), nopoint (human CEO), qwen-cli (Player, free), opencode-minimax (Player, free), opencode-trinity (Player, free), gemini-cli (Player, requires key) | 2026-03-02 |
| harkly_phase | pre-launch — CPO call pending, web platform in dev, desktop MVP live | 2026-02-27 |
| harkly_positioning | Consumer Intelligence Platform, 3 слоя: Reality + Prediction (silicon) + AI Perception | 2026-02-26 |
| harkly_partner_track | Hybrid (Enterprise + white-label), ProxyMarket first | 2026-02-26 |
| harkly_infra | Cloudflare Workers + D1/PostgreSQL-RU + BullMQ + ZenRows fallback | 2026-02-24 |
| harkly_monetization | Free (300 кредитов) + $50/$250/$500 тарифы + WL $500/мес | 2026-02-26 |
| harkly_desktop | MVP работает, используется в production (silicon sampling Пятёрочка+) | 2026-02-27 |
| harkly_economics | Модель завершена. Pessimistic: $28,650 revenue 2026, GM breakeven Oct 2026 | 2026-02-26 |
| tLOS_phase | UNKNOWN — nopoint сообщил о большом апдейте и первом enterprise user. Детали не зафиксированы | 2026-02-27 |
| session_infrastructure | /startHsession, /closeHsession, /startTsession, /closeTsession, /continue, /g3 — все созданы | 2026-03-02 |
| multi_agent_system | Claude=Coach+Orchestrator. 3 бесплатных агента: qwen, opencode/minimax, opencode/trinity. Gemini требует ключ. Agent Monitor: nospace/tools/agent-monitor/ | 2026-03-02 |
| g3_methodology | G3 Dialectical Autocoding активирован. /g3 команда создана. Первая G3 сессия завершена (TASK-MONITOR-001, 1 turn, APPROVED) | 2026-03-02 |
| context_economy | context-economy-regulation.md принята, встроена во все /start* команды и CLAUDE.md | 2026-02-27 |

## Blockers

| Blocker | Affects | Raised | Resolution |
|---|---|---|---|
| OPS-TODO-01: encrypt .env через age | security | 2026-02-22 | nopoint action required — CRITICAL before team expansion |
| Созвон с CPO ProxyMarket не состоялся | HARKLY-03 | 2026-02-24 | nopoint schedules |
| Data residency: RU-юрисдикция или Cloudflare? | harkly infra | 2026-02-24 | Нужно согласовать с юристами ProxyMarket |
| Calibration data для Prediction Layer | harkly product | 2026-02-24 | Уточнить на созвоне с CPO |
| prd-horizon-1.md (Comet task) — не выполнен | — | 2026-02-24 | product-brief-v2.md v2.1 фактически заменяет — решить нужен ли отдельный Comet-файл |
| tLOS: большой апдейт + первый enterprise user — детали не зафиксированы | tLOS | 2026-02-27 | nopoint briefing required at next /startTsession |

## Last Consolidation

- **Reviewer Run:** 2026-02-27 by Assistant — ручная ревизия на основе исследования файловой системы
- **Decisions locked:** harkly economics complete, docs suite complete, desktop MVP live, partnership ready
- **Next Scheduled Run:** после CPO созвона или при следующем major milestone

## Token Budget (LLM10: Unbounded Consumption Mitigation)

> Updated by Lead agents after each branch closes. Alert threshold: 80% of workspace limit.

| Scope | Limit (tokens) | Used (tokens) | % | Last Updated |
|---|---|---|---|---|
| workspace / month | 5,000,000 | — | — | — |
| per-branch hard cap | 30,000 | — | — | — |
| approval-router queue | 10 slots | — | — | — |

**On 80% alert:** Assistant notifies nopoint. No new branches opened until usage reviewed.
**On 100%:** All swarm agents halted. nopoint decision required to resume.
