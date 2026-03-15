# session-scratch.md — Write-Ahead Log
> Layer: L4-manual | Operational | Write-only during session, read+clear at session start


<!-- ENTRY:2026-03-15:CHECKPOINT:90:tlos:skill-output-redesign -->
## 2026-03-15 — checkpoint 90

**Decisions:**
- Изменять только вывод скиллов, не алгоритм (ошибка: первая версия меняла алгоритм)
- Новые выводы: Tcheckpoint=1 строка, TafterCompact=CONTINUING/NEXT/EPIC, startTsession=компактная таблица, closeTsession=компактная таблица

**Files changed:**
- `~/.claude/commands/Tcheckpoint.md` — STEP 3: вывод → `✓ #N — date — epic`
- `~/.claude/commands/TafterCompact.md` — STEP 3: новый формат CONTINUING/NEXT/EPIC
- `~/.claude/commands/startTsession.md` — STEP 7: новый формат PHASE/EPIC/SINCE/NEXT/BLOCKERS/AIA
- `~/.claude/commands/closeTsession.md` — STEP 10: компактная таблица L3/L2/L1/CHR/L4/GIT/AIA

**Completed:**
- TafterCompact выполнен (checkpoint 89 архивирован, распределён, хроника обновлена)
- JTBD анализ 4 скиллов (через Plan agent)
- Redesign выводов всех 4 скиллов (со второй попытки — первая меняла алгоритмы)

**In progress:**
- —

**Opened:**
- —

**Notes:**
- Первая попытка (ошибочная): убрал L4 processing из TafterCompact, параллелизовал reads в startTsession — всё отменено
- Корректная версия: алгоритмы оригинальные, только output blocks изменены

<!-- ENTRY:2026-03-15:CHECKPOINT:91:tlos:skill-output-redesign -->
## 2026-03-15 — checkpoint 91

**Decisions:**
- Все выводы скиллов переведены на plain markdown: жирный, буллеты, таблицы — без code blocks

**Files changed:**
- `~/.claude/commands/Tcheckpoint.md` — STEP 3: жирный заголовок + буллеты по секциям
- `~/.claude/commands/TafterCompact.md` — STEP 3: Продолжаем / Следующие задачи / Активный эпик
- `~/.claude/commands/startTsession.md` — STEP 7: h2 + таблица (Фаза/Эпик/Чекпоинт) + буллеты + AIA
- `~/.claude/commands/closeTsession.md` — STEP 10: h2 + таблица слоёв (L3/L2/L1/Летопись/L4/Git/AIA)

**Completed:**
- Redesign outputs всех 4 скиллов — финальная версия с читаемым форматом

**In progress:**
- —

**Opened:**
- —

**Notes:**
- Три итерации: (1) менял алгоритмы — откат; (2) code-block выводы — не читаемо; (3) plain markdown = финал

<!-- ENTRY:2026-03-15:CHECKPOINT:92:tlos:skill-output-redesign -->
## 2026-03-15 — checkpoint 92

**Decisions:**
- В вывод Tcheckpoint добавлена секция "Не сохранено" — явное отражение того что осознанно исключено из checkpoint

**Files changed:**
- `~/.claude/commands/Tcheckpoint.md` — STEP 3: добавлена секция "Не сохранено"

**Completed:**
- Финальный формат Tcheckpoint готов (4 итерации: алгоритм → code block → plain md → + не сохранено)

**In progress:**
- —

**Opened:**
- —

**Notes:**
- —

