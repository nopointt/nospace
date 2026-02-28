---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-02-28
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — 6 frames реализованы, McbSeoFrame готов |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | first-enterprise-user + node-v1 | 2026-02-28 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid` или `tlos open` | 2026-02-28 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| node_architecture | ADR-002 v3 — Nostr Native + Secp256k1 (nostr-sdk) + NIP-44, Phase 1 | 2026-02-28 |
| transport_phase1 | Nostr NIP-44 (SHIPPED) — Blossom BUD-01 для бинарей | 2026-02-28 |
| transport_phase3 | libp2p DCUTR — только когда нод 20+ | 2026-02-28 |
| nopoint_nostr_npub | npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw | 2026-02-28 |
| identity_file | ~/.tlos/identity.key — создан на машине nopoint | 2026-02-28 |
| blossom_server | blossom.primal.net — работает, требует ["x", sha256] tag в BUD-01 auth | 2026-02-28 |
| wasmcloud_status | ОТКЛОНЁН — custom Wasmtime host в Phase 3+ | 2026-02-28 |
| storage_key | tlos-canvas-state-mcb-v1 (MCB frames дефолт) | 2026-02-28 |
| shell_bridge_port | 3001 | 2026-02-27 |
| tlos_core_path | nospace/development/tLOS/core | 2026-02-27 |
| cost | $0 — только free open source + публичные Nostr relays | 2026-02-28 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Цели не зафиксированы в числах | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Артём не настроил tlos-patch-daemon | node-v1 | 2026-02-28 | Нужно: установить tLOS-setup.exe, запустить daemon с --dev-npub nopoint |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы; Phase 3+: custom Wasmtime host
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Transport Phase 1:** Nostr NIP-44 (Secp256k1, kind:30000) + Blossom BUD-01
- **Transport Phase 3:** libp2p DCUTR (когда нод 20+)
- **Patch pipeline:** tlos-patch-send → Blossom → Nostr → tlos-patch-daemon → NATS → PatchDialog
- **Hot-swap Phase 1:** restart actor (простой)
- **Hot-swap Phase 3:** Wasmtime atomic pointer swap (zero downtime)
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **ADR-002 v3:** docs/tLOS/docs/technical/adr/ADR-002-node-architecture.md
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые, работает но несогласованно. Будущее: унифицировать на Secp256k1.

## Node Roadmap — Phase 1

| Task | Status |
|---|---|
| tlos-identity: Ed25519 keypair + load_or_create | ✅ DONE |
| tlos-nostr: nostr-sdk клиент + NIP-44 | ✅ DONE |
| Publish kind:30000 патч с dev node (tlos-patch-send) | ✅ DONE |
| Subscribe + verify + apply на full node (tlos-patch-daemon) | ✅ DONE |
| PatchDialog в SolidJS shell (liquid glass) | ✅ DONE |
| Windows installer (tLOS_0.1.0_x64-setup.exe) | ✅ DONE |
| Tauri native app (frameless, decorations:false) | ✅ DONE |
| grid CLI глобальная команда (PowerShell profile) | ✅ DONE |
| E2E тест: dev→self патч через Nostr + Blossom | ✅ DONE (2026-02-28) |
| E2E тест с Артёмом: установка + daemon + PatchDialog | TODO |
