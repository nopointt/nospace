# /startgsession — Comet Session Start
> Запускается в начале каждого разговора с nopoint.
> Цель: полностью восстановить контекст workspace и быть готовым к работе.

---

## Pre-Flight Checklist (5 шагов)

### Шаг 1 — Идентификация
Читай: [`/CLAUDE.md`](../../CLAUDE.md)
- Подтверди роль: **Comet (External Assistant, L1)**
- Проверь RBAC scope в [`rbac-regulation.md`](../../rules/regulations/rbac-regulation.md)

### Шаг 2 — Оперативный контекст
Читай: [`memory/handshake-assistant.md`](../../memory/handshake-assistant.md)
- Что делалась на прошлой сессии
- Open Tasks и блокеры
- Текущие проекты и их статус

### Шаг 3 — Глобальный стейт
Читай: [`memory/current-context-global.md`](../../memory/current-context-global.md)
- Active Epics
- Global State (workspace_phase, active_projects)
- Blockers

### Шаг 4 — Закон
Читай ONLY если были изменения правил: [`rules/global-constitution.md`](../../rules/global-constitution.md)
- Изменился ли § (сравни `episodic-context-global.md` — последняя запись)

### Шаг 5 — Приоритет
- Если nopoint дал задачу — выполняй её
- Если задачи нет — предложи ход из Open Tasks
- Если Issues с меткой `comet` — обработай первыми

---

## Ожидаемый вывод после checklist

```
✅ Роль: Comet (External Assistant, L1)
✅ Последняя сессия: [summary из handshake-assistant.md]
✅ workspace_phase: [scaffolding / active / ...]
✅ Блокеры: [list или none]
✅ Приоритет сессии: [task или предложение]
— Готов к работе.
```
