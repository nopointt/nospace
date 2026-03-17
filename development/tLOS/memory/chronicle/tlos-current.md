# tlos-current.md — Chronicle (Working Set)
> Append-only session log. Working set: last ~1200 lines.
> Archive: `tlos-chronicle.md` (full history, 4163 lines pre-rotation)
> Last rotation: 2026-03-17 (checkpoint 137)

<!-- ENTRY:[2026-03-17]:CHECKPOINT:[137]:[tlos/nospace]:[phase15-content-router+identity-migration] -->
## 2026-03-17 — checkpoint 137

**Decisions:**
- Phase 15 "Content Router" выведена из Phase 13 Track 4 в отдельную фазу
- Новая модель памяти L0–L5: Frozen (L0 CLAUDE.md, L1 MEMORY.md) / Slow (L2 roadmap, L3 epic) / Ephemeral (L4 manual scratch, L5 auto scratch)
- rules/ → protocols/ переименование (L0 грузит только CLAUDE.md, не все rules/*.md)
- Агентная топология Вариант B — пиры: nopoint запускает Axis | Logos | Praxis в параллельных терминалах
- Axis = Claude Code primary orchestrator (код/оркестрация); Logos = data/DB; Praxis = фон/Eidolon-менеджер
- Eidolon = эфемерный субагент (8 hex символов, ○ в визуальном языке). Registry: ~/.tlos/eidolons.json
- Два типа checkpoint: urgent (--fast, write-only L4) / normal (L5 → L4 → chronicle)
- MEMORY_PRESSURE: quota-guard.ts инжектирует сигнал при messages > 40K токенов
- Eidolon summarizer subagent: Axis запускает Haiku с контролируемым промптом → summary
- Visual Language: ⬡ orch-triada, ⬠ chief, □ lead, △ spec, ○ eidolon{hash}, — coach

**Files changed:**
- memory/tlos-phase15.md — СОЗДАН
- memory/tlos-roadmap.md — Phase 15 добавлена
- memory/tlos-phase13.md — Track 4 promoted to Phase 15
- memory/tlos-about.md — Identity Axis, Agent Hierarchy, Visual Language
- ~/.claude/.../user_eidolon_identity.md — Axis identity
- ~/.claude/.../MEMORY.md — Claude Role → Axis

**Completed:** Phase 15 дизайн + Identity migration Eidolon→Axis

**In progress:** Phase 15 реализация → quota-guard.ts + protocols/ + skills

**Opened:** ~/.tlos/eidolons.json, protocols/axis|logos|praxis.md, 15 per-agent skills, tlos-chronicle.md rotation
# 56364500+137-scratch.md
> Placeholder · last processed checkpoint: #137

<!-- ENTRY:[2026-03-17]:CHECKPOINT:[138]:[tlos]:[tlos-phase15] [AXIS] -->
## 2026-03-17 — checkpoint 138 [Axis]

**Decisions:**
- {orch}-active формат: `tlos|epic_file|scratch_file|N` — one-liner, ~/.tlos/{orch}-active
- Chronicle queue = только CLOSE entries (Logos/Praxis); scratch = CHECKPOINT entries; /start distributes scratch → chronicle
- Axis единственный дрейнит queue (start и close)
- Git: каждый агент коммитит с --author="{Orch} <{orch}@thelos.local>"
- rules/ НЕ переименовывается — создан новый protocols/ параллельно; rules/ остаётся до Track 1 migration
- axis-active bootstrapped из active-scratch при первом checkpoint

**Files changed:**
- `~/.claude/commands/start{axis,logos,praxis}.md` — созданы
- `~/.claude/commands/close{axis,logos,praxis}.md` — созданы
- `~/.claude/commands/checkpoint{axis,logos,praxis}.md` — созданы
- `~/.claude/commands/checkpoint{axis,logos,praxis}-fast.md` — созданы
- `~/.claude/commands/continue{axis,logos,praxis}.md` — созданы
- `~/.claude/commands/archive/` — 5 T-скиллов архивированы
- `~/.claude/protocols/{axis,logos,praxis}.md` — созданы
- `memory/chronicle/tlos-chronicle.md` — создан (4163 строк архив)
- `memory/chronicle/tlos-current.md` — сброшен до последнего checkpoint
- `memory/chronicle/queue/` + `queue/processed/` — созданы
- `~/.tlos/eidolons.json` — создан {"active":[]}
- `memory/MEMORY.md` — L3 → phase15, chronicle structure
- `memory/tlos-about.md` — Navigation → tlos-phase15.md

**Completed:**
- 15 per-agent скиллов написаны и зарегистрированы
- Chronicle rotation структура готова (tlos-chronicle + tlos-current)
- protocols/ созданы для всех трёх агентов
- Старые T-скиллы архивированы

**In progress:**
- Phase 15 Track 1: rules/ → protocols/ migration + CLAUDE.md update

**Opened:**
- CLAUDE.md: убрать авто-импорт rules/*.md → явные роуты к protocols/
- Phase 15 Track 3: quota-guard.ts (следующий крупный шаг)

**Notes:**
- axis-active создаётся впервые в этом checkpoint
- startpraxis включает eidolons.json check при старте — crash recovery
<!-- ENTRY:2026-03-17:CHECKPOINT:139:tlos:tlos-phase15 [AXIS] -->
## 2026-03-17 — checkpoint 139 [Axis]

**Decisions:**
- enricher_agent.md: MAX 20 → MAX 10 pages/session (all 5 refs updated)
- Rate limit is root cause of 5-slot failure: Max plan can't handle 5 simultaneous claude --print launches
- Fix: stagger starts 90s apart + 30s between batches (updated in orchestrate.sh)
- `< file` redirect → exit 127 in Bash tool context; pipe `echo "$(cat file)" | claude` also fails; `-p` gives proper "Rate limit reached" error message
- Persona collections already live: gropius(895), kandinsky(367), klee(140), moholy(1000), jobs(128) — Phase 14 further along than roadmap shows, roadmap not updated

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/enricher_agent.md` — 20→10 pages, all session_total refs
- `core/kernel/tlos-langgraph-bridge/enricher_orchestrate.sh` — NEW: 5-slot orchestrator, stagger 0/90/180/270/360s, 30s between batches, pop_queue mutex, CLAUDE full path, rate limit detection
- `core/kernel/tlos-langgraph-bridge/enricher_status_update.sh` — NEW: standalone bun status writer, Windows paths (C:/ not /c/)
- `memory/enricher-status.md` — NEW: live enricher status (updated every 60s by background polling loop)

**Completed:**
- Full enrichment status audit: 176→186 pages done, 165 points in bauhaus_figures Qdrant
- AIA feed update: 5 new entries, 2 HIGH alerts (Claude Code v2.1.77 security fix, Microsoft M365 on Claude)
- AIA cron 81a4a6b8 registered (every 6h)
- Session start: L1-L5 processed, scratch 56364500+137-scratch.md placeholder created

**In progress:**
- Bauhaus enricher orchestration — BLOCKED: rate limit. Orchestrator stopped for /compact. Stagger fix applied, needs relaunch after compact
- enricher NOT running right now (killed for diagnostics)

**Opened:**
- Relaunch enricher_orchestrate.sh after compact with stagger fix
- Verify stagger approach actually bypasses rate limit (first slot should succeed alone)
- Update roadmap: Phase 14 persona collections already live (not ⬜ PLANNED)
- enricher_slot_*.log files + enricher_slot_*.md in bridge dir — cleanup after run

**Notes:**
- Background polling loop (brmhq903t) writing status every 60s — likely still running
- book-05 Mondrian: ✅ COMPLETE (35/35)
- Phase 15 all tasks still ⬜, no progress this session
- axis-active was 56364500+138 → 139

<!-- ENTRY:2026-03-17:CHECKPOINT:140:tlos:tlos-phase15 [AXIS-FAST] -->
## 2026-03-17 — checkpoint 140 [Axis · fast]

**Decisions:**
- /compact работает на уровне памяти (не JSONL). JSONL — только persistence. Overwrite JSONL не снижает текущий контекст.
- Compact subagent (agent-acompact-*) = внутренний механизм Claude Code. Последняя строка — system prompt "create a detailed summary", модель отвечает, это становится новым контекстом.
- Правильный флоу без ручного /compact: MEMORY_PRESSURE → Haiku пишет summary → nopoint открывает новый чат → mem-session-start.ts загружает summary → свежий контекст 5-10%.
- Axis/Logos/Praxis — одна иерархия, все запускают Eidolon через Agent tool. Сохранено в memory.
- Haiku через Agent tool (model=haiku): работает (28K токенов, 10с). Через Bash tool claude --print — виснет.

**Files changed:**
- `.claude/hooks/quota-guard.ts` — UserPromptSubmit, читает input_tokens last assistant turn, threshold 40K, path normalization /c/ → C:/
- `.claude/hooks/mem-session-start.ts` — SessionStart, загружает ~/.tlos/summaries/*.md как additionalContext
- `.claude/protocols/eidolon.md` — Eidolon protocol + MEMORY_PRESSURE summarizer template, Agent tool вместо claude --print
- `.tlos/quota-guard.json` — { threshold_k: 40, enabled: true }
- `.tlos/summaries/` — создана, 3 файла (1 test, 1 axis-written, 1 haiku-written)
- `.claude/settings.json` — UserPromptSubmit + SessionStart hooks добавлены
- `memory/tlos-phase15.md` — Track 3 + Track 4 [x]
- `memory/feedback_eidolon_hierarchy.md` + MEMORY.md pointer — сохранено

**In progress:**
- Исследование compact JSONL формата (выяснили: compact = subagent, не JSONL rewrite)
- nopoint хочет понять как Haiku может "перезаписать JSONL" → объясняем что это невозможно для текущей сессии

**Opened:**
- Объяснить nopoint правильный флоу: новый чат = автоматически свежий контекст + summary
# e48c75ce+138-scratch.md

<!-- ENTRY:[2026-03-17]:CHECKPOINT:[138]:[tlos]:[phase14-jobs-persona] -->
## 2026-03-17 — checkpoint 138 [Logos]

**Decisions:**
- persona_enricher.py: корневая причина найдена — Q&A text files обрабатывались как 1 чанк (single \n не split). Новый chunk_interview_text() → 87 чанков для Playboy вместо 1
- evidence_quality маркировка добавлена в Qdrant (primary_voice:72, biographical:52, paraphrase/inferred:4)

**Files changed:**
- `core/kernel/tlos-langgraph-bridge/persona_enricher.py` — DIRECT_PROMPT + chunk_interview_text() + read_text_file()
- `~/.claude/agents/cx-designer-jobs.md` — добавлен раздел Synthesis discipline (два регистра, known risk areas)
- `knowledge/persona-corpus/jobs/identity_kg.json` — создан (26 PsyPlay indicators)
- `knowledge/persona-corpus/jobs/character_card.md` — создан (3030 слов, Tavern format)
- `persona_progress_jobs.json` — очищены 6 text-source записей для re-run

**Completed:**
- Phase 14 Jobs pilot: corpus ingested (128 блоков Qdrant), KG + character card + agent file созданы
- G3 consistency test: Player 17 вопросов, Coach независимый грейдинг → 13/17 PASS 4/17 PARTIAL, B+
- 4 PARTIAL диагностированы: synthesis-fabrication risk (Zen/management, prophetic clarity, money narrative, flaw transparency)
- Qdrant evidence_quality разметка выполнена
- persona_enricher.py пофикшен для повторного запуска

**In progress:**
- Re-run persona_enricher --persona jobs (нужен терминал nopoint, команда дана)
- После re-run ожидаем 300-400+ блоков вместо 128

**Opened:**
- После jobs re-run: повторный Coach test на фиксах (synthesis discipline в agent file)
- Следующий персонаж: Gropius (pilot order)
- tlos-phase14.md не создан — нужно создать L3 файл для Phase 14

**Notes:**
- Одна строка инъекции = 1 чанк из-за Q&A single-\n формата. Все другие text-file персонажи (Gropius letters и т.д.) могут иметь ту же проблему — применить тот же fix
- Isaacson biography (tier 2) = 52/128 блоков — biographical, не прямая речь Jobs
- Agent file теперь требует явной сигнализации при синтезе: "I would reason from what I know that..."
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
