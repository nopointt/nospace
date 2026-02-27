---
# CURRENT CONTEXT — tLOS
> Project-level snapshot. Updated when a branch closes or a sprint ends.
> Agents working in branches do NOT read global memory (token conservation).
> Tags: [tLOS, project, state, epics, blockers]
> Last updated: 2026-02-27
---

## Active Epics

| Epic ID | Branch | Description | Status | Owner Agent |
|---|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — первый enterprise user (proxy.market) | OPEN — spec ready, UI design next | nopoint |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | first-enterprise-user | 2026-02-27 |
| kernel_status | in-development | 2026-02-22 |
| shell_status | in-development | 2026-02-22 |
| last_commit | initial scaffold | 2026-02-22 |
| open_branches | 1 (mcb-v1) | 2026-02-27 |
| first_enterprise_user | Артём / proxy.market | 2026-02-27 |
| tlos_core_path | nospace/development/tLOS/core | 2026-02-27 |
| tlos_running | grid.bat run from core/ | 2026-02-27 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| Нет доступов к API (Alytics, Topvisor, Метрика, Админка) | mcb-v1 / Подвал | 2026-02-27 | Ждём от Артёма |
| Цели Владимира не зафиксированы в числах | mcb-v1 / Стратегия | 2026-02-27 | Ждём от Артёма |

## Architecture Snapshot

- **L0 Meta:** governance layer — docs and constitutions
- **L1 Grid:** NATS mesh — running (nats-server via grid.bat)
- **L2 Kernel:** Rust — tlos-dispatcher, tlos-fs-bridge, tlos-shell-exec running
- **L3 Shell:** SolidJS + Vite — running on localhost:5173
- **Core path:** `C:\Users\noadmin\nospace\development\tLOS\core`
- **Old path (backup):** `C:\Users\noadmin\.tLOS` — не удалять до следующей сессии

## Last Consolidation

- **Reviewer Run:** —
- **Entities Merged:** —
- **Next Scheduled Run:** every 10 commits or weekly
