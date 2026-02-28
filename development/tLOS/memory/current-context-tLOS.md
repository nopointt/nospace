---
# CURRENT CONTEXT — tLOS
> Project-level snapshot. Updated when a branch closes or a sprint ends.
> Agents working in branches do NOT read global memory (token conservation).
> Tags: [tLOS, project, state, epics, blockers]
> Last updated: 2026-02-28
---

## Active Epics

| Epic ID | Branch | Description | Status | Owner Agent |
|---|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — первый enterprise user (proxy.market) | OPEN — 6 MCB frames реализованы, MCB — дефолтный экран, рендер требует подтверждения в браузере | nopoint |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | first-enterprise-user | 2026-02-28 |
| kernel_status | запускается через grid.ps1 — фоновые процессы без отдельных окон, логи в branches/mcb-v1/logs/ | 2026-02-28 |
| shell_status | localhost:5173 — MCB frames как дефолт (STORAGE_KEY=v4), mcb команда через replaceComponents | 2026-02-28 |
| last_commit | — (не коммитили в эту сессию) | 2026-02-28 |
| open_branches | 1 (mcb-v1) | 2026-02-28 |
| first_enterprise_user | Артём / proxy.market | 2026-02-27 |
| tlos_core_path | nospace/development/tLOS/core | 2026-02-27 |
| tlos_running | grid.ps1 run — сервисы в фоне (-WindowStyle Hidden), логи в terminal + файл | 2026-02-28 |
| shell_bridge_port | 3001 (port 3000 blocked by Windows HTTP.sys) | 2026-02-27 |
| mcb_frames_default | ДА — MCB_FRAMES дефолтный стейт при первом открытии | 2026-02-28 |
| storage_key | tlos-canvas-state-v4 | 2026-02-28 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| Нет доступов к API (Alytics, Topvisor, Метрика, Админка) | mcb-v1 / Подвал | 2026-02-27 | Ждём от Артёма |
| Цели Владимира не зафиксированы в числах | mcb-v1 / Стратегия | 2026-02-27 | Ждём от Артёма |
| MCB frame рендер не подтверждён | shell / frontend | 2026-02-28 | User видит "окна без дизайна" — дизайн есть в .tsx, нужен hard refresh браузера + проверка F12 console |
| grid.ps1 фоновые логи не протестированы | kernel | 2026-02-28 | Новый подход Start-Job + Receive-Job не подтверждён |

## Architecture Snapshot

- **L0 Meta:** governance layer — docs and constitutions
- **L1 Grid:** NATS mesh — running (nats-server via grid.ps1)
- **L2 Kernel:** Rust — tlos-shell-bridge(:3001), tlos-fs-bridge, tlos-shell-exec; запускаются фоном через -WindowStyle Hidden
- **L3 Shell:** SolidJS + Vite — localhost:5173, MCB frames дефолтный стейт
- **Canvas state:** `src/data/mcb-frames.ts` — единственный источник правды для MCB_FRAMES
- **Core path:** `C:\Users\noadmin\nospace\development\tLOS\core`
- **Old path (backup):** `C:\Users\noadmin\.tLOS` — IGNORE, старая копия
- **Agent roles:** Claude=orchestrator (no code — НАРУШЕНО в этой сессии), Qwen=coder (via CLI `-y` flag)
- **Qwen CLI:** `qwen -y -p "prompt"` для записи файлов
- **Logs:** `branches/mcb-v1/logs/{service}.log` — логи каждого сервиса

## Last Consolidation

- **Reviewer Run:** —
- **Entities Merged:** —
- **Next Scheduled Run:** every 10 commits or weekly
