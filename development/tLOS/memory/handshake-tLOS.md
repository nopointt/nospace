# HANDSHAKE — tLOS
> Читай этот файл в начале любой tLOS-сессии.
> Updated: 2026-03-13 (checkpoint 59) by Eidolon

---

## Где мы сейчас

**Roadmap v5 FULLY COMPLETE (Phases 6-9 ALL DONE).** Phase 9 Shell Expansion delivered: 9 Omnibar commands, 5 new frames (HelpFrame, SystemStatusFrame, DirizhyorFrame, MemoryAdminFrame, RegulatorLogFrame), dynamic frame layouts (localStorage + NATS hot-reload). Docker 11/11 services UP. Samurizator scheduler running (6h interval). Exchange round operational. TypeScript build clean (95 modules).

**ПЕРВОЕ ДЕЙСТВИЕ: прочитай** `docs/agent-system-architecture.md` — Roadmap v5 (все фазы завершены).

---

## Следующий приоритет

1. **tLOS System Spec** — `docs/tlos-system-spec.md` + Excalidraw 6-zone diagram (from transcription) — CREATED, may need updates
2. **Phase 5.1 Direct API** — permanently BLOCKED (no API key)
3. **New roadmap planning** — all v5 phases complete, need next direction from nopoint

---

## Активные ветки

| Branch | Task | Status |
|---|---|---|
| master | Roadmap v5 FULLY COMPLETE (Phases 6-9) | ACTIVE |
| omnibar | SEC: PatchDialog Nostr sig + system prompt permissions | OPEN |
| mcb-v1 | Marketing Command Board для Артёма | BLOCKED — ждём API |
| website-v1 | THELOS marketing site | OPEN |

---

## Критические данные

| Ключ | Значение |
|---|---|
| Docker stack | 11/11 services UP, langgraph-bridge rebuilt with Phase 9 handlers |
| Phase 9 Shell Expansion | **ALL DONE**: 9.1 Core commands (help/status/dirizhyor/compact/memory-admin/regulator-log), 9.2 MemoryAdminFrame (5 tabs, Continuum layers, frozen proposals), 9.3 RegulatorLogFrame (severity filters, violation cards), 9.4 Dynamic layouts (localStorage + NATS hot-reload) |
| Phase 8 Agent Comms | **ALL DONE**: 8.1 Parallel dispatch, 8.2 Exchange round, 8.3 Cross-domain coordination |
| Phase 7 Automation | **ALL DONE**: 7.1 Scheduler (6h), 7.2 Episodes (auto), 7.3 Escalation (G3→NATS), 7.4 NATS rename (special) |
| Phase 6 E2E | **ALL PASS**: 6.1-6.4 verified |
| Prod-ready plan | **ALL PHASES COMPLETE** (0-5). 5.1 BLOCKED permanent. |
| Omnibar commands | 9 total: mcb, kernel, g3, help, status, dirizhyor, compact, memory-admin, regulator-log |
| Frame registry | 26 frame types in FRAME_REGISTRY |
| Regulator | 13 rules: 2 naming + 1 scope + 1 workflow + 2 rate_limit + 2 communication + 5 procedural |
| Samurizator scheduler | 6h periodic (env: SAMURIZATOR_INTERVAL) |
| Exchange round | _chief_exchange_call + _dispatch_chiefs_exchange_round (parallel ThreadPoolExecutor) |
| Global roadmap | `docs/agent-system-architecture.md` (Roadmap v5, ALL COMPLETE) |
| KPI | Скорость + Качество (разрыв intent↔result). Стоимость = токены |
| Identity | Claude Code = **Eidolon** (навсегда) |
| Archive rule | Никогда не удалять файлы → `core/kernel/archive/` |
| API key | ANTHROPIC_API_KEY — нет и не будет. Только подписка. |

---

## Ключевые файлы

| Нужно | Файл |
|---|---|
| Конституция | development/tLOS/rules/tLOS-constitution.md |
| Текущее состояние | development/tLOS/memory/current-context-tLOS.md |
| Карта кодовой базы | development/tLOS/memory/codebase-map-tLOS.md |
| Летопись | development/tLOS/memory/chronicle-tLOS.md |
| **Production-Ready Plan** | **docs/agent-system-prod-ready-plan.md** |
| Роадмап v5 (глобальный) | docs/agent-system-architecture.md |
| Системная спецификация | docs/tlos-system-spec.md |
| **Frame Registry** | core/shell/frontend/src/components/frameRegistry.tsx |
| **Frame Layouts** | core/shell/frontend/src/commands/frameLayouts.ts |
| **Default Commands** | core/shell/frontend/src/commands/defaultCommands.ts |
| LangGraph граф | core/kernel/tlos-langgraph-bridge/graph.py |
| **Bridge handler** | core/kernel/tlos-langgraph-bridge/bridge_handler.py |
| **Bridge (NATS dispatch)** | core/kernel/tlos-langgraph-bridge/bridge.py |
| **Regulator** | core/kernel/tlos-langgraph-bridge/regulator.py |
| **Samurizator** | core/kernel/tlos-langgraph-bridge/samurizator.py |
| **Memory edges** | core/kernel/tlos-langgraph-bridge/memory_edges.py |
| Debug Service | core/kernel/tlos-langgraph-bridge/debug_service.py |
| Коммуникации агентов | core/kernel/tlos-langgraph-bridge/agent_comm.py |
| **Chief comm** | core/kernel/tlos-langgraph-bridge/chief_comm.py |

---

## Открытые вопросы

- [x] Phase 6.1-6.4: E2E validation — ALL PASS
- [x] Phase 7.1-7.4: Automation — ALL DONE
- [x] Phase 8.1-8.3: Agent Communications — ALL DONE
- [x] Phase 9.1-9.4: Shell Expansion — ALL DONE
- [ ] langchain-core 1.2.18 transient import issue — может потребовать пиннинга версий
- [x] Phase 5.1: Direct API — навсегда ЗАБЛОКИРОВАНА
