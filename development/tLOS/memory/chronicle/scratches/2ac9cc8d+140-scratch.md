# 2ac9cc8d+140-scratch.md
> Placeholder · last processed checkpoint: #140

<!-- ENTRY:2026-03-17:CLOSE:141:tlos:tlos-phase15 [AXIS] -->
## 2026-03-17 — сессия 141 CLOSE [Axis]

**Decisions:**
- /compact = in-memory операция, JSONL — односторонняя персистентность (RAM→disk). Overwrite JSONL не снижает текущий контекст
- auto-compact встроен в Claude Code при 95% окна, настраивается через CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
- Haiku + mem-session-start.ts = мост между сессиями, не инструмент снижения контекста — возможно избыточен при наличии operational memory layer (L4+L5)
- auto-scratch.py имел Windows path bug (/c/ → C:/) — пофикшен
- TRACKED_ROOTS расширен с tLOS+harkly до всего /nospace/
- messages[] в RAM синхронизированы с JSONL односторонне (RAM→JSONL); Claude Code читает JSONL только при старте

**Files changed:**
- `memory/tlos-phase15.md` — Open Questions: Haiku launch [x] решён, Last updated добавлен
- `memory/tlos-roadmap.md` — Phase 14 + Phase 15 → 🔶 IN PROGRESS, Bauhaus figures 176→186p
- `~/.claude/hooks/auto-scratch.py` — Windows path bug fix (SCRATCH_PATHS C:/), TRACKED_ROOTS → /nospace/, get_scratch_path упрощён

**Completed:**
- Crash recovery: 3 scratch файла обработаны (cp. 138 Axis, 138 Logos, 139-140 Axis)
- AIA deep-dive: /compact internals из исходников cli.js v2.1.77 (модель, messages[], JSONL, summary формат)
- auto-scratch.py починен и верифицирован (работает на любом nospace пути)
- Roadmap обновлён (Phase 14 + 15 IN PROGRESS)
- L3 tlos-phase15.md обновлён (Haiku question closed)

**Opened:**
- Переоценить Track 4 Phase 15 (Haiku summarizer): возможно избыточен при наличии operational memory layer
- Track 1 Phase 15: rules/ → protocols/ migration (всё ещё ⬜)
- Track 2 Phase 15: /checkpointaxis --fast флаг (всё ещё ⬜)

**Notes:**
- vmmemWSL = Hyper-V VM для WSL2, объяснено nopoint
- [1m] флаг Sonnet на Max плане = Extra Usage → Rate limit immediately, подтверждено
- enricher_orchestrate.sh не запускался в эту сессию, остаётся паузирован
