# l4-archive.md — L4 Session Scratch Archive
> Append-only. NEVER overwrite existing entries.
> Created: 2026-03-14
> Rule: context-gentle — nothing is deleted, questionable content goes here.
> Cleanup: nopoint manually when archive exceeds 500 lines.

<!-- ARCHIVE:2026-03-14:session-close:77 -->
## checkpoint 76 (archived at session close)

**Decisions:**
- Новая архитектура экстракции v3: один изолированный агент на 20-страничный батч, persona автора, пишет свой файл, merge-агент объединяет
- Промпты вынесены в отдельные файлы: `specialists/` директория, EXTRACTION-PLAN.md = индекс со ссылками
- Kandinsky v2: запускать параллельно все части (они независимы по контексту)

**Files changed:**
- `nospace/docs/tLOS/design/bauhaus-code/EXTRACTION-PLAN.md` — переписан: v3 стратегия + статус + book manifest со ссылками
- `nospace/docs/tLOS/design/bauhaus-code/specialists/` — создана директория, 11 specialist-файлов пишутся агентом
- `nospace/docs/tLOS/design/bauhaus-code/09-kandinsky-v2-p2.md` — создан ✅
- `nospace/docs/tLOS/design/bauhaus-code/09-kandinsky-v2-p3.md` — создан ✅

**Completed:**
- Kandinsky v2 Part 1+2+3 ✅ (1196ln merged)
- EXTRACTION-PLAN.md v3 restructured
- 11 specialist files written

**Notes:**
- Spannung (tension) = центральный концепт Kandinsky
- Grundfläche chapter (p.107-140) = наиболее ценный для UI/spatial design
---

---

<!-- ARCHIVE:2026-03-14:TafterCompact -->
## 2026-03-14 — checkpoint 68 (pre-TafterCompact)

**Decisions:**
- Bidirectional WC bridge реализован: samurizator → session-scratch.md (agent insights → Claude context)
- SQLite FTS5 session index: PostToolUse hook индексирует Read/Bash/Grep outputs для поиска без повторного чтения
- /compress-scratch redesigned: не компрессия L4, а распределение вверх по уровням абстракции (L4→L3→L2→L1)
- context-gentle rule: перед любой очисткой L4 → архивировать в l4-archive.md, никогда не удалять
- Haiku субагент для L4 distribution: читает L4, классифицирует по слоям, пишет в L3/L2/L1

**Files changed:**
- `samurizator.py` — +write_promoted_to_scratch()
- `bridge_handler.py` — вызов write_promoted_to_scratch после episode_end (2 места)
- `docker-compose.yml` — volume tlos-memory:rw + TLOS_SCRATCH_PATH env
- `memory/l4-archive.md` — NEW: append-only архив L4 (context-gentle)
- `~/.claude/hooks/auto-scratch.py` — PostToolUse Write/Edit hook
- `~/.claude/hooks/session-index.py` — PostToolUse Read/Bash/Grep → SQLite FTS5
- `~/.claude/hooks/search-index.py` — CLI поиск по session index
- `~/.claude/settings.json` — 2 PostToolUse hooks подключены
- `~/.claude/commands/compress-scratch.md` — redesigned: L4→L3/L2/L1 distribution
- `~/.claude/commands/{Tcheckpoint,startTsession,TafterCompact,closeTsession}.md` — +archive step
- `MEMORY.md` — +context-gentle rule

**Completed:** WC v2 полностью реализован

**Opened:**
- docker compose up -d --no-deps langgraph-bridge (нужен рестарт для volume mount)
- Harkly l4-archive.md pending

---

<!-- ARCHIVE:2026-03-14:TafterCompact -->
## 2026-03-14 — checkpoints 69+70 (pre-TafterCompact)

### checkpoint 69

**Decisions:**
- Wave B3 запущен параллельно (4 агента) и завершён в одной сессии
- auto-scratch hook не срабатывает в текущей сессии — расследовать
- Вариант B (summary node в LangGraph) — приоритет для реализации в след. сессии
- Вариант C (self-managed memory) — долгосрочный план, не текущий спринт

**Completed:**
- Wave B3: все 4 аудита готовы (07-Product, 09-TechWriter, 11-AI/ML, 12-Designer)
- Phase 10: 12/12 audit reports done
- Deep research: auto context window management (70% trigger, YAML compaction, Haiku model)

**Notes:**
- Phase 10 avg: 47/100. Security 22/100 блокирует external release
- C-10 (AI/ML LiteLLM) permanently blocked — Phase 5.1 ANTHROPIC_API_KEY constraint

### checkpoint 70

**Decisions:**
- L4 разделён: session-scratch.md (manual) + auto-scratch.md (auto PostToolUse hook)
- compress-scratch Haiku prompt → structured YAML output (l3/l2/l1/l4_keep) + observation masking
- Research rule: ресёрч пишется в файл по секциям, путь: docs/research/{topic}-research.md
- Вариант C задокументирован как design doc (PLANNED)

**Completed:**
- L4 split реализован во всех командах
- Variant A (compress-scratch YAML prompt) — реализован
- Variant C (self-managed memory) — design doc написан

**Opened:**
- Retroactive research file: context window mgmt research потерян при compact; воссоздать

---

<!-- ARCHIVE:2026-03-14:TafterCompact -->
## 2026-03-14 — checkpoint 71 (pre-TafterCompact)

**Decisions:**
- Старая Фаза 4 (Web3 Native: Nostr/IPFS/Akash/WGPU/LSP) — неактуальна, officially de-prioritized
- Итог Phase 10 = большое обновление родмапа + доработка продукта (Phase 11 будет определена после агрегации)
- Следующий цикл: агрегирование всех 12 audit reports → README.md dashboard + cross-domain analysis

**Completed:**
- TafterCompact: session-scratch checkpoints 69+70 распределены и архивированы
- Roadmap review: полная историческая картина восстановлена (Era 1 Rust/Wasm → Era 2 LangGraph)
- tlos-roadmap.md актуализирован (Phase 10 → 12/12 done, Next Priority переписан)

**Opened:**
- Phase 11 definition — после агрегации (big roadmap update)
- Web3 Native Фаза 4 de-prioritized — пометить CANCELLED в core/docs/roadmap.md

**Notes:**
- agent-system-architecture.md v5 (2026-03-13) — самый полный источник истины
- Агрегация = последний шаг Phase 10 перед закрытием epic

---


<!-- ARCHIVE:2026-03-14:TafterCompact:checkpoints-72-73 -->
## 2026-03-14 — checkpoints 72–73 + mode-switch + design-arch (pre-TafterCompact)

**Mode switch:** phase-10-analysis active. Domain-by-domain analysis, one per cycle. First domain: Design.

**Design architecture locked:**
- tLOS default = BLACK AND WHITE (Bauhaus/Suprematist). Dark void theme = deprecated historical artifact.
- nopoint theme = warm B&W: #001f3f on #fff8e7, Inter + IBM Plex Mono, #9de64c accent (rare)
- Theme system = color layer on top of invariant structural B&W
- Pencil MCP = canonical design authoring tool (.pen files, git-versioned)
- Frame generation = regulation-based, procedurally mutable
- Current audit score: 52/100 RED. Roadmap: D-0..D-7, score target 88/100 after D-6.

**Bauhaus extraction Wave 1:**
- ✅ Kandinsky #09 — 466 lines
- ✅ Malevich #11 — 296 lines
- ✅ Mondrian #05 — 415 lines
- 🔄 Van Doesburg #06 — was running in background at session close
- Wave 2 (Moholy-Nagy ×2, Klee) — paused by nopoint, prompts in EXTRACTION-PLAN.md
- Wave 3 (7 books) — not launched, prompts in EXTRACTION-PLAN.md

**Files created this session:**
- `nospace/docs/tLOS/design/ROADMAP.md`
- `nospace/docs/tLOS/design/bauhaus-code/EXTRACTION-PLAN.md`
- `nospace/docs/tLOS/design/bauhaus-code/09-kandinsky-point-line-plane.md`
- `nospace/docs/tLOS/design/bauhaus-code/11-malevich-non-objective-world.md`
- `nospace/docs/tLOS/design/bauhaus-code/05-mondrian-neue-gestaltung.md`
- `memory/tlos-phase10.md` updated: phase-10-analysis branch, design domain

---

<!-- ARCHIVE:2026-03-14:TafterCompact:checkpoint-74 -->
## 2026-03-14 — checkpoint 74 (pre-TafterCompact)

**Decisions:**
- PNG batch approach (20 стр → читать → удалить) = обязательный стандарт для Bauhaus KB. Text extraction = субтитры к фильму.
- Mondrian v1 vs v2: +53% строк, качественно другой контент (обложка как тезис, тишина=белая плоскость, музыкальная глава)
- Wave 3 (7 книг) запускать только PNG-методом, без text fallback
- v1 файлы (Kandinsky, Malevich, Mondrian) сохраняем — для сравнения подходов

**Files created:**
- `nospace/docs/tLOS/design/bauhaus-code/02-klee-pedagogical-sketchbook.md` — 640 строк ✅
- `nospace/docs/tLOS/design/bauhaus-code/05-mondrian-neue-gestaltung-v2.md` — 637 строк ✅
- `nospace/docs/tLOS/design/bauhaus-code/06-van-doesburg-grundbegriffe.md` — 447 строк ✅

**Completed:**
- Disk full crisis: tmp PNG-dirs (~1 GB) удалены пользователем, ещё ~2.3 GB Temp очищено
- Wave перезапущена с батч-стратегией (20 стр за раз, max ~100 MB на диске)
- Mondrian v2, Van Doesburg, Klee завершены
- PNG > text доказано на данных

**In progress (3 агента в фоне — Kandinsky v2 завершился без записи файла):**
- `#08 Moholy MPF` — ~56% (~112/200 страниц)
- `#13 Moholy VMA` — ~37% (~88/241 страниц)
- `#11 Malevich v2` — ~44% (~87/200 страниц)
- `#09 Kandinsky v2` — ❌ агент завершился без записи файла, нужен перезапуск

**Opened:**
- После завершения 3 агентов: запустить Wave 3 (7 книг: Schlemmer, Gleizes, Gropius×3, Oud, Meyer) — только PNG batch
- Kandinsky v2 перезапустить отдельно (09-kandinsky-point-line-plane-v2.md отсутствует)
- После всех 14 экстракций: синтез в DESIGN-CODE.md

**Notes:**
- Disk: ~3.2 GB свободно перед запуском; батч-стратегия держит под 200 MB суммарно
- wvm-l2O9my (3 GB) и 5ym40xmx (1.3 GB) в Temp — неизвестное происхождение, не трогать

---

<!-- ARCHIVE:2026-03-14:TafterCompact:checkpoint-75 -->
## 2026-03-14 — checkpoint 75 (pre-TafterCompact)

**Decisions:**
- Новая стратегия экстракции: одна книга за раз, генерировать ВСЕ PNG сразу, читать батчами по 20 стр, удалить всю папку в конце
- Длинные книги (>80 стр) — разбивать на части по агентам (~80 стр каждый)
- Cache нельзя очистить вручную — только time-based reset (5h window)
- Параллельность ограничить: max 3-4 агента одновременно

**Files changed:**
- `nospace/docs/tLOS/design/bauhaus-code/06-van-doesburg-grundbegriffe.md` — 447 → 535 строк (NIM OCR mystery agent)
- `nospace/docs/tLOS/design/bauhaus-code/11-malevich-non-objective-world-v2.md` — создан: 663 строки ✅
- `nospace/docs/tLOS/design/bauhaus-code/08-moholy-nagy-painting-photo-film.md` — создан: 395 строк ✅

**Completed:** Malevich v2 ✅, Moholy MPF ✅, Van Doesburg v2 ✅. Failed: VMA ❌, Kandinsky v2 ❌ (context exhaustion on 100+ page books).

**In progress:** Kandinsky v2 Part 1 (p.1-80) — agent abe692e36440a3fc5

**Opened:** Kandinsky Parts 2+3, VMA Parts 1-3, Wave 3 (7 books) — all sequential, new strategy.

---
