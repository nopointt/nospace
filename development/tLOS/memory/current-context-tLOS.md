---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-02
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — JTBD-анализ: 6 фреймов достаточны; McbSeoFrame нужно заполнить реальными данными Артёма; омнибар команда `mcb` требует фикса |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |
| epic-nim-v1 | nim-v1 | NIM AI Bridge — NVIDIA NIM HTTP SSE интеграция | **SHIPPED** — agent-bridge переписан, Omnibar → NIM → token stream работает |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand system зафиксирована, сайт в разработке |
| epic-site-v1 | site-v1 | Promo video / infinite-canvas collapse animation | **ABANDONED** — collapse animation не удалась. Фокус переключён на сайт. |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | first-enterprise-user + NIM AI integration | 2026-03-02 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid` или `tlos open` | 2026-03-02 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| nim_key_path | ~/.tlos/nim-key — временный ключ (12ч), требует обновления | 2026-03-02 |
| canvas_default | Пустой холст (было MCB_FRAMES — убрано) | 2026-03-02 |
| node_architecture | ADR-002 v3 — Nostr Native + Secp256k1 (nostr-sdk) + NIP-44, Phase 1 | 2026-02-28 |
| transport_phase1 | Nostr NIP-44 (SHIPPED) — Blossom BUD-01 для бинарей | 2026-02-28 |
| transport_phase3 | libp2p DCUTR — только когда нод 20+ | 2026-02-28 |
| nopoint_nostr_npub | npub18xvx74029skh84hgdawyxht0827057ulzvddlyx0dvsnq0ehk20sgsqysw | 2026-02-28 |
| identity_file | ~/.tlos/identity.key — создан на машине nopoint | 2026-02-28 |
| blossom_server | blossom.primal.net — работает, требует ["x", sha256] tag в BUD-01 auth | 2026-02-28 |
| wasmcloud_status | ОТКЛОНЁН — custom Wasmtime host в Phase 3+ | 2026-02-28 |
| storage_key | tlos-canvas-state-mcb-v1 — localStorage очищен, дефолт теперь [] | 2026-03-02 |
| shell_bridge_port | 3001 | 2026-02-27 |
| tlos_core_path | nospace/development/tLOS/core | 2026-02-27 |
| cost | $0 — только free open source + публичные Nostr relays | 2026-02-28 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Цели не зафиксированы в числах | mcb-v1 | 2026-02-27 | Ждём от Артёма |
| Артём не настроил tlos-patch-daemon | node-v1 | 2026-02-28 | Нужно: установить tLOS-setup.exe, запустить daemon с --dev-npub nopoint |
| NIM key временный (12ч) | nim-v1 | 2026-03-02 | Обновить ~/.tlos/nim-key при истечении |

## Architecture Snapshot

- **L0 Meta:** ADR-002 v3 + constitutions
- **L1 Grid:** NATS локально + Nostr NIP-44 для межнодовой связи (Phase 1, SHIPPED)
- **L2 Kernel:** Rust сервисы; Phase 3+: custom Wasmtime host
- **L3 Shell:** SolidJS + Tauri native app (WebView2, frameless, 1440x900)
- **Identity:** Secp256k1 (nostr-sdk) — реализовано, ~/.tlos/identity.key
- **Transport Phase 1:** Nostr NIP-44 (Secp256k1, kind:30000) + Blossom BUD-01
- **Transport Phase 3:** libp2p DCUTR (когда нод 20+)
- **Patch pipeline:** tlos-patch-send → Blossom → Nostr → tlos-patch-daemon → NATS → PatchDialog
- **NIM AI pipeline:** Omnibar → kernel.send(agent:chat) → WS → shell-bridge → NATS tlos.shell.events → agent-bridge → NVIDIA NIM SSE → NATS tlos.shell.broadcast → WS → kernel.subscribe → Omnibar renders tokens
- **Hot-swap Phase 1:** restart actor (простой)
- **Hot-swap Phase 3:** Wasmtime atomic pointer swap (zero downtime)
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **ADR-002 v3:** docs/tLOS/docs/technical/adr/ADR-002-node-architecture.md
- **ADR-003:** docs/ecosystem-noadmin/adr/003-tlos-network-isolation.md — NATS/WS 0.0.0.0→127.0.0.1 (FIXED); WebSocket→Tauri IPC (TODO prod); WebView→egui (TODO long-term)
- **Security fix:** tlos-patch-daemon — sanitize_path_component() валидирует actor/version/filename перед path::join()
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. Будущее: унифицировать на Secp256k1.
- **Known tech debt:** PatchDialog.tsx:19 — kernel.subscribe() cleanup не подтверждён (LOW risk)
- **Known tech debt:** tlos-spatial/src/lib.rs:195 — clippy: `result.len() >= 0` always true (minor)

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

## NIM AI Roadmap

| Task | Status |
|---|---|
| agent-bridge: NIM HTTP SSE streaming bridge | ✅ DONE (2026-03-02) |
| Omnibar redesign: NIM chat panel, token streaming | ✅ DONE (2026-03-02) |
| NATS security: 127.0.0.1 binding, ADR-003 | ✅ DONE (2026-03-02) |
| Security audit: path traversal fix patch-daemon | ✅ DONE (2026-03-02) |
| Memory leaks: App.tsx onResized + subscribeToKernel | ✅ DONE (2026-03-02) |
| NIM key refresh mechanism | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — production milestone |
| WebView → egui (ADR-003 Phase 3) | TODO — long-term |

## THELOS Brand System (зафиксировано 2026-02-28)

| Элемент | Значение |
|---|---|
| Концепция | Чёрный квадрат Малевича (апогей) + чёрная дыра (притяжение) + τέλος (завершённость/полнота) |
| Логотип | Чёрный монолит |
| Шрифт | Helvetica / Neue Haas Grotesk — Швейцария, объективность, сведение к сущности |
| Стиль | Супрематизм — геометрия, никакого декора, формы в пространстве |
| `#000` / `#0A0A0F` | Чёрный — абсолютная форма, финальность |
| `~#0B1D3A` | Deep navy — ночное небо, холодная глубина, масштаб, серьёзность |
| `#FAF6F1` → `#C8A882` | Бежевый спектр (слоновая кость → капучино) — свет, человечность (кожа), мудрость (пергамент), мягкость, эмпатия, интеллигентность |
| Правило | Чёрный + синий = основная масса; бежевый точечно — только где система говорит с человеком (заголовки, CTA, финальная фраза) |
| Бренд-доки | `docs/tLOS/docs/brand/` — Mythology.md, StoryBrand Layer.md, Kapferer-Brand-Identity-Prism.md |

## MCB Work — Next Steps

| Task | Status |
|---|---|
| JTBD-анализ 6 фреймов vs SEO-команда Артёма | ✅ DONE — 6 фреймов достаточны |
| Заполнить McbSeoFrame реальными данными из 6 источников Артёма | TODO |
| Починить омнибар (команда `mcb`) | TODO |
| Получить доступы к API (Alytics, Topvisor, Метрика) | BLOCKED — ждём Артёма |
