# FILE SIZE REGULATION — Context Overflow Prevention
> Applies to: all memory and documentation files under /nospace.
> Authority: Senior Architect. Enforced by: any agent reading a file.
> Tags: [file-size, alerts, memory, tokens, context]

---

## § 1 — Почему это важно

Большой файл = большой контекст = сожжённые токены и потеря точности агентов.
Когда `semantic-context.md` вырастает до 500 строк, агент читает его целиком и теряет фокус.
Лимиты — это защита от "контекстного отравления".

---

## § 2 — Лимиты по типам файлов

| Тип файла | Мягкий лимит (⚠️) | Жёсткий лимит (🔴) | Действие при превышении |
|---|---|---|---|
| `scratchpad.md` | 200 строк | 400 строк | Очистить немедленно (это raw) |
| `current-context-*.md` | 100 строк | 150 строк | Перенести старые эпики в episodic |
| `semantic-context-*.md` | 300 строк | 500 строк | Запустить Reviewer/Consolidation |
| `episodic-context-*.md` | 500 строк | 1000 строк | Разбить на архивные части |
| `spec.md` | 150 строк | 250 строк | Разбить эпик на 2 задачи |
| `commit-summary.md` | 100 строк | 200 строк | Агрессивнее сжимать |
| `log-raw.md` | 300 строк | — | Не лимитируется (raw, не читается агентами) |
| Код (`.rs`, `.ts`) | 500 строк | 800 строк | Разбить на модули |
| Position Description | 80 строк | 120 строк | Вынести детали в отдельный документ |

---

## § 3 — Система алертов

Каждый агент перед чтением файла ДОЛЖЕН проверить размер:

```
if file.lines > soft_limit:
    prepend ⚠️ WARNING to own scratchpad: "File X is near limit. Consolidation needed."

if file.lines > hard_limit:
    STOP reading
    escalate to Tech Lead / CTO with message: "File X exceeded hard limit. Action required."
    do NOT proceed until resolved
```

---

## § 4 — Правило для semantic-context (особый случай)

Когда `semantic-context-*.md` приближается к 300 строк (⚠️):
1. Автоматически включать `retrieval_method: vector_search` вместо полного чтения.
2. Агент запрашивает только нужные сущности через `query_codebase` или grep.

Когда файл превышает 500 строк (🔴):
- Запускается Reviewer Agent (Memory Consolidation).
- До завершения консолидации агенты не пишут в этот файл.

---

## § 5 — Мониторинг

- SRE Lead MUST проверять размеры ключевых файлов памяти раз в неделю.
- Запись в `/memory/logs/system/file-size-audit-{date}.md` при каждой проверке.

---

## § 6 — Исключения (binary / encrypted / generated)

Лимит 800 строк применяется к **текстовым человеко-/AI-читаемым файлам**. Для бинарных и сгенерированных форматов количество строк семантически не значимо — `wc -l` считает встроенные line-endings внутри зашифрованного/сжатого блоба, не структуру.

**Исключения от line-count check (pre-commit hook + reviewer agents):**

| Тип файла | Причина исключения |
|---|---|
| `.pen` | Pencil encrypted file. Структура управляется через MCP tools, не line-count. Содержит дизайн-систему/экраны как зашифрованную сериализацию. |
| `.ipynb` | Jupyter notebook с embedded outputs (изображения, JSON cells). |
| `.min.js`, `.min.css` | Минифицированные бандлы — single-line by definition. |
| `package-lock.json`, `bun.lock`, `yarn.lock`, `pnpm-lock.yaml`, `*.lock` | Сгенерированные dependency lockfiles. |
| `.svg` | Часто single-line vector data, line count неинформативен. |
| `.pdf` | Бинарный формат. |

Дополнительные исключения добавляются по запросу через PR в этот файл + соответствующее обновление `.git/hooks/pre-commit` секция § 3.

**Что НЕ освобождается:** обычные текстовые форматы (`.md`, `.ts`, `.tsx`, `.py`, `.go`, `.rs`, `.json` non-lock, `.yaml` non-lock, `.css` source, `.html`) — лимиты § 2 действуют полностью.
