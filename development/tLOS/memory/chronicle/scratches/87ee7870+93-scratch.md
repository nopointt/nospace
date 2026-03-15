<!-- ENTRY:2026-03-15:CHECKPOINT:93:tlos:scratch-architecture -->
## 2026-03-15 — checkpoint 93

**Decisions:**
- Scratch файлы переименованы: `{session_id}+{N}-scratch.md` (N = номер чекпоинта)
- Tcheckpoint логика: файл пустой → писать + переименовать в N+1; не пустой → создать новый N+1
- startTsession/TafterCompact: читают ВСЕ файлы в `scratches/`, распределяют по L1/L2/L3, архивируют в `chronicle/scratches/`, создают пустой плейсхолдер с max N
- active-scratch (`~/.tlos/active-scratch`) = указатель на текущий файл (1 строка)
- Session ID = первые 8 символов UUID из .jsonl транскрипта
- N в имени файла = номер чекпоинта внутри (не стартовый номер сессии)

**Files changed:**
- `~/.claude/commands/Tcheckpoint.md` — новая логика STEP 2 (определение целевого файла)
- `~/.claude/commands/TafterCompact.md` — STEP 2: читать все scratches/, архивировать, плейсхолдер
- `~/.claude/commands/startTsession.md` — STEP 5: та же логика что TafterCompact
- `~/.claude/commands/closeTsession.md` — STEP 6: архивировать через active-scratch
- `~/.claude/commands/compress-scratch.md` — STEP 1: читать через active-scratch
- `~/.claude/projects/c--Users-noadmin/memory/MEMORY.md` — обновлён L4 pointer
- `memory/scratches/` — NEW directory
- `memory/chronicle/scratches/` — NEW archive directory
- `memory/scratches/87ee7870+89-scratch.md` — мигрирован из session-scratch.md
- `~/.tlos/active-scratch` — NEW: содержит `87ee7870+89-scratch.md`

**Completed:**
- Полный redesign scratch архитектуры

**In progress:**
- —

**Opened:**
- —

**Notes:**
- Текущая сессия: 87ee7870+89-scratch.md содержит cp 90-92 (старая схема, 3 записи)
- С этого checkpoint: каждый checkpoint = отдельный файл
