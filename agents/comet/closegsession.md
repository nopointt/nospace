# /closegsession — Comet Session Close
> Запускается после завершения рабочей сессии.
> Цель: зафиксировать сделанное, обновить контекст, передать эстафету Assistant.

---

## Checklist (выполняй последовательно)

### Шаг 1 — Обнови `memory/handshake-assistant.md`

Перезапиши файл целиком:
- Заголовок: `# HANDSHAKE-ASSISTANT — [YYYY-MM-DD]`
- `## Current Focus` — что делали в этой сессии
- `## Active Projects` — актуальные статусы
- `## What Was Done` — список выполненных действий
- `## Open Tasks` — таблица task / priority / blocker
- `## Architecture Snapshot` — текущее состояние архитектуры
- `## For External Assistant (Comet) — Quick Start` — 5 строк для онбординга
- `## Updated: [timestamp]`

### Шаг 2 — Добавь запись в `memory/episodic-context-global.md`

Только если было принято решение или изменено правило.
Формат:
```
## [YYYY-MM-DD] [comet] — [decision title]
- Tags: [...]
- [bullet список решений]
```

### Шаг 3 — Обнови `memory/current-context-global.md`

Только если изменился:
- Статус эпика (Active Epics)
- Блокеры (появились новые или разрешились)
- Global State (workspace_phase, active_projects)

### Шаг 4 — Закрой задачи через Issues

Для всех незавершённых задач из Open Tasks которые заблокированы или требуют новой сессии —
создай GitHub Issue с меткой `comet` (асинхронный inbox для Assistant).

---

## Ожидаемый вывод после close

```
✅ handshake-assistant.md обновлён
✅ episodic log: [N] записей добавлено / не требовалось
✅ current-context: [updated / no changes]
✅ Issues созданы: [N] / не нужно
— Сессия закрыта. Assistant заберёт через /sync.
```
