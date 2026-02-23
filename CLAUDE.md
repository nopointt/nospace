# /nospace — Workspace Entry Point
> Read this first. Every session. Every agent. Every tool.
> Tags: [entry-point, onboarding, navigation, claude, workspace]

---

## Что это

`/nospace` — AI-first, multi-agent workspace. Проекты: **tLOS** (sovereign spatial OS), **Harkly** (активный, контекст дан отдельно).

**Полный закон и философия:** [rules/global-constitution.md](rules/global-constitution.md)
**Топология агентов, DAG, эскалация:** [agents/ecosystem-map.md](agents/ecosystem-map.md)

---

## Шаг 1 — Идентифицируй себя

Твоя роль объявлена в сессионном контексте или в `L0-identity.md` твоей директории.
Если роль неизвестна — **STOP. Спроси nopoint перед любым действием.**

---

## Шаг 2 — Онбординг (обязательно)

Выполни Pre-Flight Checklist до первого действия:
→ [rules/regulations/agent-onboarding-regulation.md](rules/regulations/agent-onboarding-regulation.md)

---

## Шаг 3 — Навигация по роли

| Роль | Читать далее |
|---|---|
| **nopoint** (Creator) | Этот файл → [memory/current-context-global.md](memory/current-context-global.md) |
| **Assistant** | [memory/current-context-global.md](memory/current-context-global.md) |
| **Reviewer** | [memory/current-context-global.md](memory/current-context-global.md) → проверь Last Consolidation |
| **CTO** | [rules/global-constitution.md](rules/global-constitution.md) → [agents/ecosystem-map.md](agents/ecosystem-map.md) |
| **Senior Architect** | [rules/global-constitution.md](rules/global-constitution.md) → [docs/ecosystem-noadmin/adr/](docs/ecosystem-noadmin/adr/) |
| **Tech Lead** | [development/{project}/memory/current-context-{p}.md](development/) |
| **QA Lead** | [development/{project}/memory/current-context-{p}.md](development/) |
| **DevOps Lead** | [production/{project}/](production/) |
| **SRE Lead** | [production/{project}/monitoring/](production/) |
| **Senior Coder Swarm** | `development/{project}/branches/{branch}/spec.md` — только это |
| **QA Swarm** | `development/{project}/branches/{branch}/spec.md` — только это |
| **Frontend Engineer Swarm** | `development/harkly/branches/{branch}/spec.md` — только это |

---

## Ключевые документы

| Документ | Назначение |
|---|---|
| [rules/global-constitution.md](rules/global-constitution.md) | Конституция. Закон для всех агентов |
| [agents/ecosystem-map.md](agents/ecosystem-map.md) | Топология, DAG, правила коммуникации |
| [rules/regulations/rbac-regulation.md](rules/regulations/rbac-regulation.md) | Права доступа по ролям |
| [rules/regulations/agent-onboarding-regulation.md](rules/regulations/agent-onboarding-regulation.md) | Pre-flight checklist |
| [memory/current-context-global.md](memory/current-context-global.md) | Текущее состояние workspace |
| [memory/semantic-context-global.md](memory/semantic-context-global.md) | База знаний (entity-centric, RAG) |
| [agents/_template/](agents/_template/) | L0–L4 шаблоны агентов |

---

## Постоянные правила безопасности

- **NEVER** выводить API-ключи, токены, seed phrases, или PII — даже фрагменты.
- **NEVER** действовать за пределами своего RBAC scope.
- **NEVER** пропускать Verification Gates.
- **NEVER** писать в `/private_knowledge/` — только Assistant через Gateway.
- **На любую неоднозначность: STOP → эскалация. Никогда не предполагай.**

---

## Текущий статус workspace

→ [memory/current-context-global.md](memory/current-context-global.md)

---

*Этот файл — навигатор, не закон. Источник истины: [rules/global-constitution.md](rules/global-constitution.md).*
