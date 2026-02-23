---
# CURRENT CONTEXT — GLOBAL
> Structured snapshot of workspace state. Updated when an epic or major branch closes.
> Tags: [workspace, global, state, epics, blockers]
---

## Active Epics

| Epic ID | Project | Description | Status | Owner Agent |
|---|---|---|---|---|
| — | — | — | — | — |

## Global State

| Key | Value | Last Updated |
|---|---|---|
| workspace_phase | scaffolding | 2026-02-23 |
| active_projects | tLOS, harkly | 2026-02-23 |
| active_agents | assistant (Claude Code, L1), comet (Perplexity, L1), cto (Claude Code, L2) | 2026-02-23 |

## Blockers

| Blocker | Affects | Raised | Resolution |
|---|---|---|---|
| OPS-TODO-01: encrypt .env files with age | private_knowledge | 2026-02-22 | Requires nopoint action |
| /agents/* folders not pushed | agents/ | 2026-02-23 | Assistant: run /sync |

## Last Consolidation

- **Reviewer Run:** —
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
