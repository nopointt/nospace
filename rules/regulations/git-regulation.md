# GIT REGULATION — Version Control Protocol
> Applies to: all agents, all projects under `/nospace`.
> Authority: Senior Architect. Review: per quarter.
> Tags: [git, commits, branches, push, credential, hooks]

---

## § 1 — Принцип

Git — единственный source of truth для состояния workspace.
Все изменения системного состояния ДОЛЖНЫ проходить через git.
Прямые правки файлов без коммита — нарушение протокола.

---

## § 2 — Идентификация

Все коммиты от агентов и ассистента выполняются под:
```
user.name  = nopointt
user.email = danchoachona@gmail.com
```

Атрибуция Claude (`Co-Authored-By`) — **ОТКЛЮЧЕНА** (`includeCoAuthoredBy: false`).
Коммиты агентов неотличимы от коммитов человека — это намеренно.
Подлинность определяется через SIT (agent-identity-regulation.md), не через git author.

---

## § 3 — Credential Management

| Метод | Статус |
|---|---|
| Git Credential Manager (GCM) | ✅ Активен (`credential.helper = manager`) |
| Токен в URL (`https://user:token@…`) | ❌ ЗАПРЕЩЁН — токен попадает в историю |
| Plaintext `~/.git-credentials` | ❌ ЗАПРЕЩЁН — небезопасно |

GCM хранит токен в защищённом хранилище ОС.
Агенты используют уже аутентифицированный контекст — новая авторизация не нужна.

---

## § 4 — Ветки (Branch Protocol)

### Топология
```
main          ← production-ready только. Прямой пуш ЗАПРЕЩЁН агентам.
└── feat-*    ← новая функциональность
└── fix-*     ← баг-фиксы
└── refactor-*← рефакторинг без изменения поведения
└── chore-*   ← зависимости, конфиги, не-код
└── perf-*    ← оптимизация производительности
└── test-*    ← только тесты
└── ci-*      ← pipeline / DevOps изменения
```

### Именование веток
```
{type}-{feature-slug}
```
Примеры: `feat-jwt-identity`, `fix-approval-queue-overflow`, `chore-deps-update`

Тип ветки ДОЛЖЕН совпадать с типом коммита в ней.

### Права на пуш

| Агент | main | feat-* / fix-* / … | Создать ветку |
|---|---|---|---|
| nopoint (human) | ✅ | ✅ | ✅ |
| Assistant Agent | ❌ | ✅ | ✅ |
| CTO / Architect | ❌ | ✅ | ✅ |
| Worker Agents | ❌ | ✅ (своя ветка) | ❌ |
| DevOps Lead | ✅ (только release merge) | ✅ | ✅ |

---

## § 5 — Commit Message Format

**Обязательный формат** (conventional commits):
```
<type>(<scope>): <description>

<optional body — 72 chars per line>

<optional footer>
Refs: #issue
BREAKING CHANGE: <description>
```

**Типы:** `feat` | `fix` | `refactor` | `docs` | `test` | `chore` | `perf` | `ci`

**Правила:**
- Описание — imperativ, lowercase, без точки в конце
- Заголовок — максимум 50 символов
- Scope опционален: `feat(approval-router): ...`
- Merge commits и revert commits — пропускают валидацию

**Примеры:**
```
feat: add JWT session identity token issuance
fix(approval-router): cap queue to prevent DoS via MAX_PENDING
docs: add OWASP LLM security audit report
chore: update L4-guardrails output_sanitization config
refactor(memory): extract integrity hash verification to helper
```

---

## § 6 — Hooks (Автоматические проверки)

Хуки расположены в `.git/hooks/` — активны локально.

### `pre-commit`
Блокирует коммит если:
- Staged файл соответствует паттерну секрета (`.env`, `seed-phrase`, `longterm/`, и др.)
- Staged файл содержит строки-секреты (API keys, Bearer tokens, GitHub PAT `ghp_*`, Anthropic keys `sk-*`)
- Файл превышает 800 строк (предупреждение, не блокировка)

### `commit-msg`
Блокирует коммит если сообщение не соответствует `<type>: <description>`.

---

## § 7 — Push Protocol

```
# Стандартный workflow агента:
git checkout -b feat-<slug>          # создать ветку
# ... работа ...
git add <specific-files>             # НЕ git add -A
git commit -m "feat: <description>"
git push -u origin feat-<slug>
# → открыть PR через gh pr create
```

**ЗАПРЕЩЕНО:**
- `git add -A` или `git add .` — случайно добавит секреты
- `git push --force` на main
- `git commit --no-verify` — обход хуков
- `git push` напрямую в main (кроме DevOps Lead при release merge)

---

## § 8 — Pull Request Protocol

При создании PR:
1. `git diff main...HEAD` — полный diff с базовой веткой
2. Заголовок PR ≤ 70 символов
3. Body включает: Summary (3-5 bullets) + Test Plan (checklist)
4. PR reviewer — минимум QA Lead
5. Squash merge — предпочтительно для чистой истории main

---

## § 9 — Конфигурация (справочник)

Текущая конфигурация `.git/config` нospace:
```ini
[user]
    name  = nopointt
    email = danchoachona@gmail.com
[credential]
    helper = manager
[commit]
    template = .gitmessage
[core]
    hooksPath = .git/hooks
[remote "origin"]
    url = https://github.com/nopointt/nospace.git
```

Шаблон коммита: `.gitmessage`
Атрибуция: отключена в `~/.claude/settings.json` → `includeCoAuthoredBy: false`
Line endings: нормализованы через `.gitattributes` (LF в репо, CRLF на Windows checkout)
