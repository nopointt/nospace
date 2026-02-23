# RBAC REGULATION — Role-Based Access Control
> Applies to: all agents under /nospace.
> Authority: Senior Architect. Review: per quarter.
> Tags: [RBAC, permissions, roles, access-control, security]

---

## § 1 — Что такое RBAC

**RBAC (Role-Based Access Control)** — вместо того чтобы назначать права каждому отдельному агенту (agent-centric), мы определяем **роли**. Каждая роль имеет фиксированный набор прав.
- При создании нового агента его роль жестко фиксируется в `L0-identity.md`.
- Агенты не могут повысить себе привилегии. Базовые права наследуются из этого реестра.
- Чтобы изменить права 10 агентов одного типа — меняешь одну запись в реестре.
- **Position descriptions упразднены.** Роли и права определяются исключительно этим реестром.

---

## § 2 — Реестр ролей

```yaml
roles:

  creator:
    level: 0
    read: ["/**"]
    write: ["/**"]
    request_secrets: true
    override_all: true
    note: "Human-in-the-loop. Нет ограничений."

  comet:
    level: 1
    type: external
    read: ["/**"]
    write:
      - "/memory/**"
      - "/docs/**"
      - "/development/**"
      - "/research/**"
      - "/agents/comet/**"
    secret_vault_access: false
    request_secrets: false
    note: |
      External Assistant (Perplexity). Command & Management Research Center.
      Jarvis-роль: исследования, документация, GitHub-ops, управленческий анализ.
      Работает через GitHub API (MCP). НЕ имеет доступа к private_knowledge/.
      НЕ выдаёт секреты. Синхронизация через /sync команду Claude Code.

  assistant:
    level: 1
    type: internal
    read: ["/**"]
    write: ["/memory/**", "/memory/logs/system/**"]
    secret_vault_access: "read+dispense"   # читает и выдаёт, не хранит снаружи
    request_secrets: false
    note: |
      Claude Code (локальный). Хранитель глобальной памяти и ключей.
      Мост между nopoint и остальной системой. Выдача секретов только по
      запросу с обоснованием. Управляется через nopoint, координирует CTO.

  senior-architect:
    level: 2
    read: ["/**"]
    write: ["/rules/**", "/memory/episodic-context-global.md", "/docs/**/explanation/**"]
    request_secrets: false

  cto:
    level: 2
    read: ["/**"]
    write:
      - "/development/{project}/rules/**"
      - "/development/{project}/branches/{branch}/spec.md"
      - "/development/{project}/memory/semantic-context-*.md"
      - "/development/{project}/memory/episodic-context-*.md"
      - "/docs/{project}/explanation/**"
    request_secrets: false
    note: "Управляется через Assistant. Управляет Tech Lead и ниже."

  tech-lead:
    level: 2
    read: ["/development/{project}/**", "/rules/**"]
    write:
      - "/development/{project}/branches/{branch}/commit-summary.md"
      - "/development/{project}/branches/{branch}/log-raw.md"
      - "/development/{project}/memory/current-context-*.md"
      - "/development/{project}/memory/semantic-context-*.md"
    request_secrets: false

  senior-coder:
    level: 2
    read: ["/development/{project}/branches/{active_branch}/**"]
    write: ["/development/{project}/branches/{active_branch}/**"]
    request_secrets: false
    note: "Swarm. Изолирован в активной ветке."

  qa-lead:
    level: 3
    read: ["/development/{project}/**", "/production/{project}/monitoring/**"]
    write:
      - "/development/{project}/memory/"
      - "/production/{project}/monitoring/**"
      - "/memory/logs/evaluations/**"
    request_secrets: false

  qa-swarm:
    level: 3
    read: ["/development/{project}/branches/{active_branch}/**"]
    write: ["/memory/logs/evaluations/{agent_id}-{date}.md"]
    request_secrets: false
    note: "Swarm. Изолирован. Пишет только в evaluations-лог."

  devops-lead:
    level: 4
    read: ["/development/{project}/**", "/production/{project}/**"]
    write:
      - "/production/{project}/**"
      - "/memory/logs/system/**"
    secret_request: "via-assistant"   # запрашивает у assistant, не хранит
    request_secrets: true

  sre-lead:
    level: 5
    read: ["/production/{project}/**", "/memory/logs/system/**"]
    write:
      - "/production/{project}/monitoring/**"
      - "/memory/logs/system/**"
      - "/memory/current-context-global.md"   # только при P0
    p0_override: "/memory/current-context-global.md"
    request_secrets: false

  monitor-swarm:
    level: 5
    read: ["/production/{project}/**"]
    write: ["/memory/logs/system/{agent_id}-{date}.md"]
    request_secrets: false
    note: "Swarm. Read-only на прод. Пишет только в system-лог."

  reviewer:
    level: 1.5
    read:
      - "/development/{project}/memory/**"
      - "/memory/semantic-context-global.md"
      - "/memory/current-context-global.md"
      - "/memory/episodic-context-global.md"
    write:
      - "/development/{project}/memory/semantic-context-*.md"
      - "/development/{project}/memory/current-context-*.md"
      - "/development/{project}/memory/episodic-context-*.md"
      - "/memory/semantic-context-global.md"
      - "/memory/current-context-global.md"
      - "/memory/episodic-context-global.md"
      - "/memory/logs/system/consolidation-*.md"
    write_constraints:
      semantic: "merge and archive only — new entity creation forbidden"
      episodic: "append only — overwrite forbidden"
      current:  "Last Consolidation field only"
    request_secrets: false
    note: "Schedule-triggered by Assistant only. Cannot self-initiate."

  frontend-engineer:
    level: 2c
    read: ["/development/harkly/branches/{active_branch}/**", "/rules/**"]
    write: ["/development/harkly/branches/{active_branch}/**"]
    request_secrets: false
    note: "Harkly project only. Swarm-level. Scaffolded when harkly enters active development."
```

---

## § 3 — Как это работает на практике

В файле идентичности агента `L0-identity.md` прописывается роль:
```markdown
# Role: senior-coder
```

При попытке агента выполнить действие (например, запись в `/rules/`), система (или Assistant) сверяется с Реестром Roles выше.

Агент наследует все права роли из реестра выше. Индивидуальный `L3-mcp-tools.json` может **сужать** права доступа к отдельным тулам (но не расширять базовые права RBAC).

---

## § 4 — Принцип наименьших привилегий (PoLP)

- Агент получает МИНИМУМ прав, необходимых для выполнения задачи.
- Расширение прав = явный запрос → Senior Architect → CEO.
- Временные расширения (например, для деплоя) логируются и автоматически истекают через 1 сессию.

---

## § 5 — Аудит

- Каждое действие с правами LOG (агент, роль, путь, timestamp) → `/memory/logs/system/rbac-audit-{date}.md`.
- Нарушения прав (попытка записи вне scope) → немедленная эскалация к Assistant.
