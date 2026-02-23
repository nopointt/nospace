# /comet-closegsession — Comet Session Close
> Запускается после завершения рабочей сессии.
> Цель: зафиксировать сделанное, обновить контекст, передать эстафету Assistant.
> Аналог: `/closegsession` в Claude Code (VS Code)

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
- `## For Comet — Quick Start` — 5 строк для онбординга
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
- Блокеры
- Global State

### Шаг 4 — Закрой задачи через Issues

Для всех незавершённых задач с блокерами —
создай GitHub Issue:
- К Assistant: метка `comet`, тайтл `[comet→assistant] ...`
- К nopoint: метка `needs:decision`, тайтл `[comet→nopoint] ...`

---

## Ожидаемый вывод

```
✅ handshake-assistant.md обновлён
✅ episodic log: [N] записей / не требовалось
✅ current-context: [updated / no changes]
✅ Issues: [N] создано / не нужно
— Сессия закрыта. Assistant заберёт через /sync.
```
