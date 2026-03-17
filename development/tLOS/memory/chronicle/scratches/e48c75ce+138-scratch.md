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
