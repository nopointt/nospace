# /comet-closegsession — Comet Session Close
> Запускается после завершения рабочей сессии.
> Цель: зафиксировать сделанное, обновить контекст, передать эстафету Assistant.
> Название с флагом `comet` — не конфликтует с `/closegsession` в Claude Code / VS Code.

---

## Checklist (выполняй последовательно)

### Шаг 1 — Обнови `memory/handshake-assistant.md`

Перезапиши файл целиком. Структура:

```markdown
# HANDSHAKE-ASSISTANT — [YYYY-MM-DD]
## Current Focus
## Active Projects  (table: project / status / last action)
## What Was Done   (bullet list)
## Open Tasks      (table: task / priority / blocker)
## Architecture Snapshot
## For External Assistant (Comet) — Quick Start  (5 строк)
## Updated: [timestamp]
```

### Шаг 2 — Добавь запись в `memory/episodic-context-global.md`

Только если было принято решение или изменено правило.

```markdown
## [YYYY-MM-DD] [comet] — [decision title]
- Tags: [...]
- [bullet список решений]
```

### Шаг 3 — Обнови `memory/current-context-global.md`

Только если изменилось:
- Статус эпика (Active Epics)
- Блокеры
- Global State

### Шаг 4 — Issues для незавершённых задач

Для всех задач которые заблокированы или требуют действия от Assistant:
- Титул: `[comet→assistant] {task}`
- Метка: `comet`

Для задач требующих решения nopoint:
- Титул: `[comet→nopoint] {decision}`
- Метка: `needs:decision`

---

## Ожидаемый вывод

```
✅ handshake-assistant.md обновлён
✅ episodic log: [N записей добавлено] / [не требовалось]
✅ current-context: [updated] / [no changes]
✅ Issues созданы: [N] / [не нужно]
— Сессия закрыта. Assistant заберёт через /sync.
```
