---
# CURRENT CONTEXT — tLOS
> Last updated: 2026-03-08
---

## Active Epics

| Epic ID | Branch | Description | Status |
|---|---|---|---|
| epic-mcb-v1 | mcb-v1 | Marketing Command Board — Артём / proxy.market | OPEN — JTBD-анализ: 6 фреймов достаточны; McbSeoFrame нужно заполнить реальными данными Артёма; омнибар команда `mcb` требует фикса |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | **SHIPPED** — E2E пайплайн работает, ждём настройки машины Артёма |
| epic-nim-v1 | nim-v1 | NIM AI Bridge — NVIDIA NIM HTTP SSE интеграция | **SHIPPED** — agent-bridge переписан, Omnibar → NIM → token stream работает |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand system зафиксирована, сайт в разработке |
| epic-eidolon-v1 | omnibar | Claude Code integration as Eidolon AI backend | **OPEN** — claude-bridge ПОЧИНЕН (end-to-end работает), нужен product spec от Opus → tech spec → impl |
| epic-workspace-v1 | workspace-v1 | Организация рабочего пространства nopoint + Артём | **OPEN** — sessions-map.md создан, 3 трека (A: Omnibar v2, B: BB Floors, C: Infra) |

## Project State

| Key | Value | Last Updated |
|---|---|---|
| project_phase | omnibar-v2: product design → tech spec → impl | 2026-03-08 |
| shell_status | Tauri native app (decorations:false) — запуск через `grid` или `tlos open` | 2026-03-02 |
| installer | `tLOS_0.1.0_x64-setup.exe` собран, готов к отправке Артёму | 2026-02-28 |
| agent_bridge | NIM HTTP SSE bridge — meta/llama-3.1-8b-instruct via NVIDIA NIM API | 2026-03-02 |
| claude_bridge | tlos-claude-bridge (Node.js) — FIXED & WORKING (end-to-end confirmed) | 2026-03-08 |
| dispatcher | tlos-dispatcher — FIXED (graceful wasm skip, no crash on missing math_worker.wasm) | 2026-03-08 |
| provider_selector | Omnibar Model panel — Claude/NVIDIA toggle + model list + auth status | 2026-03-02 |
| nim_key_path | ~/.tlos/nim-key — временный ключ (12ч), требует обновления | 2026-03-02 |
| canvas_default | Пустой холст (было MCB_FRAMES — убрано) | 2026-03-02 |
| node_architecture | ADR-002 v3 — Nostr Native + Secp256k1 (nostr-sdk) + NIP-44, Phase 1 | 2026-02-28 |

## Blockers

| Blocker | Layer | Raised | Resolution |
|---|---|---|---|
| ~~tlos-claude-bridge subprocess зависает на Windows~~ | claude-bridge | 2026-03-02 | **RESOLVED 2026-03-08** — shell:true, stdin closed, --verbose, CLAUDE_CODE env unset, resultSeen flag |
| Нет доступов к API (Alytics, Topvisor, Метрика) | mcb-v1 | 2026-02-27 | Ждём от Артёма |
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
- **NIM AI pipeline:** Omnibar → agent:chat{provider:'nim'} → NATS → agent-bridge → NVIDIA NIM SSE → NATS → Omnibar
- **Claude AI pipeline:** Omnibar → agent:chat{provider:'claude', model} → NATS → claude-bridge → claude CLI subprocess → NATS → Omnibar
- **Provider routing:** `provider` field in agent:chat routes to correct bridge (claude-bridge or agent-bridge)
- **Auth:** claude-bridge reads ~/.claude.json, publishes agent:auth:status; Sign in opens `claude login` in new CMD
- **Session resume:** claude --resume <claudeSessionId> for multi-turn; sessionId→claudeSessionId map in bridge memory (lost on restart)
- **Core path:** C:\Users\noadmin\nospace\development\tLOS\core
- **Known tech debt:** tlos-identity (Ed25519) vs nostr-sdk (Secp256k1) — разные кривые. Будущее: унифицировать на Secp256k1.

## Omnibar Roadmap (branch: omnibar)

| Task | Status |
|---|---|
| Redesign: NIM chat panel, token streaming | ✅ DONE |
| Turn 4: 8 UI fixes (idle ring, context visibility, animations) | ✅ DONE |
| Turn 5: Context panel above TUI (sibling frame, flex-col) | ✅ DONE |
| Turn 6: Provider selector (Claude/NVIDIA toggle + model list) | ✅ DONE |
| Auth UI: Connected/Sign in status in Model panel | ✅ DONE |
| claude-bridge: Node.js subprocess + NATS + session resume | ✅ IMPLEMENTED |
| claude-bridge: Windows spawn fix (shell:true + stdin closed + --verbose + resultSeen) | ✅ FIXED (2026-03-08) |
| claude-bridge: session persistence to disk (~/.tlos/sessions.json) | TODO |
| Omnibar command `mcb` fix | TODO |

## NIM AI Roadmap

| Task | Status |
|---|---|
| agent-bridge: NIM HTTP SSE streaming bridge | ✅ DONE (2026-03-02) |
| Omnibar redesign: NIM chat panel, token streaming | ✅ DONE (2026-03-02) |
| NATS security: 127.0.0.1 binding, ADR-003 | ✅ DONE (2026-03-02) |
| NIM key refresh mechanism | TODO |

## MCB Work — Next Steps

| Task | Status |
|---|---|
| JTBD-анализ 6 фреймов vs SEO-команда Артёма | ✅ DONE — 6 фреймов достаточны |
| Заполнить McbSeoFrame реальными данными из 6 источников Артёма | TODO |
| Починить омнибар (команда `mcb`) | TODO |
| Получить доступы к API (Alytics, Topvisor, Метрика) | BLOCKED — ждём Артёма |

## THELOS Brand System (зафиксировано 2026-02-28)

| Элемент | Значение |
|---|---|
| Концепция | Чёрный квадрат Малевича (апогей) + чёрная дыра (притяжение) + τέλος (завершённость/полнота) |
| Логотип | Чёрный монолит |
| Шрифт | Helvetica / Neue Haas Grotesk — Швейцария, объективность, сведение к сущности |
| Стиль | Супрематизм — геометрия, никакого декора, формы в пространстве |
| `#000` / `#0A0A0F` | Чёрный — абсолютная форма, финальность |
| `~#0B1D3A` | Deep navy — ночное небо, холодная глубина, масштаб, серьёзность |
| `#FAF6F1` → `#C8A882` | Бежевый спектр — свет, человечность, мудрость, мягкость |
