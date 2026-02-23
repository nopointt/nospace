---
# CURRENT CONTEXT — GLOBAL
> Structured snapshot of workspace state. Updated when an epic or major branch closes.
> Tags: [workspace, global, state, epics, blockers]
---

## Active Epics

| Epic ID | Project | Description | Status | Owner Agent |
|---|---|---|---|---|
| HARKLY-01 | harkly | Desktop migration to nospace + investor pitch | in-progress | Assistant |
| HARKLY-02 | harkly | npm install + test scraper run | pending | Assistant |

## Global State

| Key | Value | Last Updated |
|---|---|---|
| workspace_phase | scaffolding → active-dev | 2026-02-23 |
| active_projects | tLOS, harkly | 2026-02-23 |
| active_agents | assistant (Claude Code, L2/CTO), comet (Perplexity, L1), nopoint (human CEO) | 2026-02-23 |

## Blockers

| Blocker | Affects | Raised | Resolution |
|---|---|---|---|
| OPS-TODO-01: encrypt cloudflare-root.env + neon-db-master.env with age | security | 2026-02-22 | nopoint action required |
| /agents/* folders not pushed to repo | agents/ | 2026-02-23 | Assistant: run /sync, verify agents/ not in .gitignore |
| harkly investor pitch: refine for specific investor | HARKLY-01 | 2026-02-23 | nopoint to provide investor details |
| Claude ↔ Comet async channel: format not decided | ecosystem | 2026-02-23 | nopoint decision |

## Last Consolidation

- **Reviewer Run:** Comet RBAC audit 2026-02-23 (removed position-descriptions, added comet role, updated constitution)
- **Entities Merged:** —
- **Next Scheduled Run:** every 10 commits or weekly, whichever comes first

## Token Budget (LLM10: Unbounded Consumption Mitigation)

> Updated by Lead agents after each branch closes. Alert threshold: 80% of workspace limit.

| Scope | Limit (tokens) | Used (tokens) | % | Last Updated |
|---|---|---|---|---|
| workspace / month | 5,000,000 | — | — | — |
| per-branch hard cap | 30,000 | — | — | — |
| approval-router queue | 10 slots | — | — | — |

**On 80% alert:** Assistant notifies nopoint. No new branches opened until usage reviewed.
**On 100%:** All swarm agents halted. nopoint decision required to resume.
