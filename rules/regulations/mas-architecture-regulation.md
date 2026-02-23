# MAS ARCHITECTURE REGULATION
> Мультиагентная архитектура: принятые парадигмы и обоснование выбора.
> Authority: CTO + Senior Architect. Review: per major version.
> Tags: [MAS, architecture, paradigms, DAG, MoE, RAG, verification, blackboard]

---

## § 1 — Наша базовая архитектура: Leads + Swarms + Git Context

Жёсткая иерархия с изолированными роями. Порядок и контроль на уровне Leads; свобода и параллелизм внутри веток. Контекст передаётся только сжатыми артефактами.

---

## § 2 — Принятые механики из альтернативных парадигм

### 2.1 — Verification-Aware Planning (Обязательные TDD-шаги)

**Источник:** Фреймворк VeriMAP (2026).

**Принято:** CTO ОБЯЗАН включать в `spec.md` блок `## Verification Gates` — исполняемые проверки для каждого шага. Swarm-агент физически не переходит к шагу N+1 без успешного прохождения проверки шага N.

```markdown
## Verification Gates (in spec.md)
- Step 1 Gate: `cargo test module_name` returns 0 errors
- Step 2 Gate: `wasm-pack build` produces artifact < 2MB
```

**Эффект:** ошибки ловятся в момент написания кода, до ревью Tech Lead.

### 2.2 — DAG Handoff Flow (Строгий граф передачи)

**Источник:** LangGraph, Apache Airflow.

**Принято:** Передача кода между уровнями — строгий граф. Нет "мягких" путей.

```
[Swarm: code] → [Tech Lead: review]
                    ├── APPROVE → [QA Lead: test]
                    │                ├── PASS → [DevOps Lead: deploy]
                    │                └── FAIL → [Tech Lead: bug-report] → [Swarm]
                    └── REJECT → [Swarm: fix] (с bug-report.md)
```

Агент внутри ветки имеет свободу. Межуровневые переходы — только по стрелкам.

### 2.3 — MoE Routing для QA и SRE Swarm

**Источник:** Mixture of Experts Agent Routing (2025–2026).

**Принято:** QA Swarm и Monitor Swarm — это микро-агенты с одной задачей. Используют самые дешёвые и быстрые модели (Flash/Haiku tier).

| Swarm | Микро-агент | Задача | Модель tier |
|---|---|---|---|
| QA | auto-unit-runner | Запускает unit-тесты, возвращает pass/fail | Flash |
| QA | contract-verifier | Проверяет ABI совместимость | Flash |
| QA | chaos-injector | Обрывает соединения, замеряет recovery | Flash |
| SRE | p2p-pinger | Пингует пиров каждые 60s | Flash |
| SRE | mempool-watcher | Отслеживает переполнение мемпула | Flash |
| SRE | panic-detector | Парсит Rust panic logs | Flash |

**Архитектурное правило:** один микро-агент = одна функция = один инструмент.

### 2.4 — Dynamic RAG (`query_codebase` tool)

**Источник:** Federation Over Embeddings (2025–2026).

**Принято как MCP Tool:** вместо чтения `semantic-context.md` агент вызывает `query_codebase(query, scope)` — специализированный индексатор парсит живой код и возвращает точный ответ.

```json
// Пример вызова
{ "tool": "query_codebase",
  "query": "WIT interface for actor lifecycle",
  "scope": "/kernel/actors/**/*.rs" }
```

Определение инструмента: `/tools/mcp-servers/query-codebase.json`.

**Правило:** агенты уровня Swarm ИСПОЛЬЗУЮТ этот инструмент для поиска интерфейсов. Они НЕ читают `semantic-context.md` целиком.

---

## § 3 — Отклонённые парадигмы

### Blackboard Architecture
**Почему нет:** Без жёстких Leads агенты могут переписывать артефакты друг друга → бесконечные циклы.
**Что взяли:** Идею Shared State частично реализует `current-context.md` — доска только для чтения для большинства агентов.

### Full DAG Automation (без свободы маневра)
**Почему нет:** При нестандартных ошибках (упал сервер, невалидный WIT) граф ломается и нет выхода. Нужен `scratchpad` для свободного мышления внутри ветки.

---

## § 4 — Обоснование нашей гибридной позиции

| Проблема | Наше решение |
|---|---|
| Галлюцинации кодера | Verification Gates в spec.md |
| Потеря токенов на передачу | Context Economy (только сжатые артефакты) |
| Устаревшая документация | `query_codebase` MCP Tool (живой код) |
| Дорогие QA-агенты | MoE: Flash-модели, одна задача |
| Неконтролируемые хэндоффы | Строгий DAG граф между уровнями |
