# AGENT ONBOARDING REGULATION
> Applies to: every newly instantiated AI agent before first action.
> Authority: Assistant Agent (verification) + CTO (scope confirmation).
> Tags: [onboarding, agent, setup, checklist, initialization]

---

## § 1 — Принцип

Каждый агент начинает с одной и той же стартовой точки. Без онбординга агенты стартуют с разными предположениями о контексте, что приводит к несогласованным действиям.

---

## § 2 — Pre-Flight Checklist (выполнить ДО первого действия)

### Блок A — Идентификация (обязательно)

- [ ] Прочитал `agents/workspace-charter.md` — понял философию и правила
- [ ] Прочитал своё Position Description: `rules/position-descriptions/{role}-pd.md`
- [ ] Подтвердил: моя роль = `{role}`, мой проект = `{project}`, моя ветка = `{branch}`

### Блок B — Правила (обязательно)

- [ ] Прочитал `rules/regulations/agent-conduct-regulation.md`
- [ ] Прочитал `rules/regulations/rbac-regulation.md` — знаю свои права
- [ ] Прочитал `rules/regulations/file-size-regulation.md` — знаю лимиты

### Блок C — Контекст (по роли)

**Swarm-агент (Senior Coder, QA Swarm, Monitor Swarm):**
- [ ] Прочитал `/development/{project}/branches/{branch}/spec.md`
- [ ] Открыл `/development/{project}/branches/{branch}/scratchpad.md`
- [ ] Больше ничего не читал — вертикальная изоляция

**Lead-агент (Tech Lead, QA Lead, DevOps Lead, SRE Lead):**
- [ ] Прочитал `/development/{project}/memory/current-context-{project}.md`
- [ ] Прочитал активные `spec.md` всех открытых веток
- [ ] Проверил открытые блокеры в `current-context`

**Architecture-агент (CTO, Senior Architect):**
- [ ] Прочитал `/memory/current-context-global.md`
- [ ] Прочитал `/development/{project}/memory/semantic-context-{project}.md`
- [ ] Проверил `episodic-context-global.md` — последние 5 записей

### Блок D — Инициализация

- [ ] Написал первую строку в `scratchpad.md`: `Owner: {agent_id} | Task: {task} | Started: {timestamp}`
- [ ] Сделал первую запись в `/memory/logs/agents/{agent_id}-{date}.md`: `INIT | role:{role} | project:{project} | branch:{branch}`

---

## § 3 — Правило "нулевого действия"

Агент НЕ производит никаких действий (запись, чтение кода, вызов инструментов) до завершения Блоков A и B. Нарушение = немедленная эскалация к Tech Lead.

---

## § 4 — Завершение сессии (Offboarding)

- [ ] Написал итоговую строку в `scratchpad.md`: `Session ended: {timestamp} | Status: {done/blocked/handed-off}`
- [ ] Закрыл запись в логе `/memory/logs/agents/{agent_id}-{date}.md`: `EXIT | outcome:{outcome}`
- [ ] Если владелец ветки — обновил `current-context-{project}.md` статус ветки

---

## § 5 — Типичные ошибки онбординга

| Ошибка | Последствие | Правило |
|---|---|---|
| Начал писать код до чтения spec.md | Галлюцинация, несоответствие | Блок C |
| Читал global memory как Swarm | Burn токенов, нарушение изоляции | RBAC: senior-coder |
| Не открыл scratchpad | Нет рабочей области, мысли в основном контексте | Блок D |
| Не залогировал INIT | Нет аудита — невозможно отследить действия | Блок D |
