# TASK MANAGEMENT REGULATION — Lifecycle, Sizing, Quality & Audit
> Applies to: all agents and projects under /nospace.
> Authority: Senior Architect + CTO. Review: per quarter.
> Evidence base: GAIA Benchmark (arXiv:2311.12983), CLEAR Framework, NIST AI RMF 1.0, EU AI Act, SWE-bench methodology, Anthropic agentic workflow patterns.
> Tags: [task-management, lifecycle, gaia, clear, dor, dod, hitl, audit, mas]

---

## § 1 — Принципы

### Что мы отвергаем

| Классический подход | Причина отказа |
|---|---|
| **Story Points** | Субъективны. MARE = 600%+ (COCOMO). Не коррелируют с вычислительными затратами. Не учитывают стохастическую природу LLM. |
| **Оценка в часах** | Агенты не работают в часах. Единица измерения — токены, шаги рассуждений, API-вызовы. |
| **WBS до первого шага** | LLM-агент не может заранее детально декомпозировать открытую задачу. Микро-декомпозиция — задача Оркестратора. |
| **LLM-as-a-judge DoD** | LLM-судья разделяет слепые зоны генератора. DoD верифицируется детерминированно. |

### Что мы принимаем

- **GAIA Levels (1-2-3)** как единственная шкала сложности — вместо Story Points.
- **Token Budgets** как единица оценки и контроля стоимости.
- **Probabilistic completion** (NoEstimates): прогноз сроков — через исторический Cycle Time, не через угадывание.
- **CLEAR Framework** как система метрик: Cost, Latency, Efficacy, Assurance, Reliability.
- **Neuropixel DoD**: финальный выход агента проходит через детерминированный Verification Gate, а не через prose review.
- **Mandatory Orchestrator-Worker topology** для L2 и L3 задач.

---

## § 2 — Классификация сложности (GAIA Levels)

Каждая задача **до запуска** классифицируется по GAIA-уровню. Классификацию выполняет CTO или Tech Lead — не исполняющий агент.

### Level 1 — Atomic Task

| Параметр | Значение |
|---|---|
| Шагов рассуждения (estimated) | ≤ 5 |
| MCP-инструментов | 0-1, только read-only операции |
| Агентная топология | Single agent (без Оркестратора) |
| Token Budget | **8 000 токенов** |
| Примеры | Исправление опечатки, обновление конфига, написание одного теста, документирование функции |

### Level 2 — Compound Task

| Параметр | Значение |
|---|---|
| Шагов рассуждения (estimated) | 5–10 |
| MCP-инструментов | 1–3, включая write-операции |
| Агентная топология | Orchestrator + 1-2 Worker агента |
| Token Budget | **20 000 токенов** |
| Примеры | Новый компонент, интеграция API, рефактор нескольких файлов, добавление фичи с тестами |

### Level 3 — Complex Task

| Параметр | Значение |
|---|---|
| Шагов рассуждения (estimated) | 10+ или неизвестно (exploratory) |
| MCP-инструментов | Множество, включая деплой-операции |
| Агентная топология | Orchestrator + до 4 Workers (не превышать — Закон Брукса) |
| Token Budget | **30 000 токенов** (жёсткий cap из L4-guardrails.yaml) |
| Примеры | Новая подсистема, миграция, изменение архитектуры, мультимодульная фича |

### Правила классификации

- Если сложность задачи неоднозначна между уровнями — выбирать **более высокий** (fail-safe).
- Реклассификация в ходе выполнения ТОЛЬКО Оркестратором → с записью в `scratchpad.md`.
- Задача, превысившая 85% своего бюджета без завершения → автоматически эскалирует в L+1 или BLOCKED.

---

## § 3 — Бюджетирование задачи

### Token Budget Assignment

| GAIA Level | Soft Limit (80%) | Hard Limit (100%) | Action при Hard Limit |
|---|---|---|---|
| L1 | 6 400 токенов | 8 000 токенов | Hard stop → BLOCKED, HITL |
| L2 | 16 000 токенов | 20 000 токенов | Hard stop → BLOCKED, HITL |
| L3 | 24 000 токенов | 30 000 токенов | Hard stop → BLOCKED, HITL |

**Soft Limit Action (80%):** Агент ОБЯЗАН финализировать текущий шаг, записать прогресс в `scratchpad.md` и сигнализировать Оркестратору о приближении к лимиту. Новые подзадачи не открываются.

**Hard Limit Action (100%):** Немедленная остановка. Частичный результат сохраняется. Задача маркируется `BLOCKED(budget_exceeded)`. Требуется HITL.

### Учёт координационных издержек (Coordination Tax)

Токены, потраченные на **межагентную коммуникацию** (сообщения Оркестратор ↔ Worker), входят в общий бюджет задачи — не выделяются отдельно. Это стимулирует сокращение избыточных раундов координации.

**Правило максимума раундов:**

| Топология | Максимум раундов координации |
|---|---|
| Orchestrator → Worker (1 раунд) | Без ограничений |
| Worker → Orchestrator (обратная связь) | Максимум 2 per Worker |
| Worker → Worker (P2P) | **ЗАПРЕЩЕНО** |

P2P-коммуникация между Workers запрещена. Весь обмен только через Оркестратора.

---

## § 4 — Definition of Ready (DoR)

Задача допускается к исполнению ТОЛЬКО после прохождения DoR-чеклиста. DoR проверяет CTO или Tech Lead перед открытием ветки.

### Алгоритмический DoR-чеклист

```
☐ 1. GAIA Level назначен (L1 / L2 / L3).
☐ 2. Token Budget зафиксирован в spec.md (поле "Task Classification").
☐ 3. Problem Statement написан — одним параграфом, без технической двусмысленности.
☐ 4. Acceptance Criteria сформулированы как верифицируемые условия (не prose).
☐ 5. Все Verification Gates написаны как исполняемые команды или наблюдаемые условия.
☐ 6. Зависимости разрешены: все referenced API/tools зарегистрированы в L3-mcp-tools.json.
☐ 7. Секреты/токены доступа для необходимых MCP-инструментов выделены (через Assistant gateway).
☐ 8. Out of Scope явно определён (предотвращает scope creep).
☐ 9. HITL checkpoint определён если задача L3 или включает деплой-операции.
```

Задача с незакрытым DoR — **NEVER** передаётся Swarm-агенту. Это приоритет CTO/Tech Lead.

---

## § 5 — Паттерн исполнения

### Обязательная топология по уровню

| GAIA Level | Обязательный паттерн | Запрещено |
|---|---|---|
| L1 | Single Agent (Prompt Chaining) | Параллелизация, Оркестратор |
| L2 | Orchestrator-Workers или Evaluator-Optimizer | P2P Workers, Decentralized MAS |
| L3 | Orchestrator-Workers (строго централизованный) | Decentralized дебаты, > 4 Workers |

**Правило Оркестратора:** Оркестратор не пишет код и не вызывает деплой-инструменты напрямую. Он только декомпозирует цель → делегирует Worker-агентам → синтезирует результаты.

### Progressive Context Loading

Агент получает **только тот контекст, который нужен для текущего шага**:
- Worker видит только свою подзадачу и её зависимости — не весь spec целиком.
- Оркестратор передаёт Worker только `{subgoal, relevant_context_slice, verification_gate}`.
- Не передавать полный `scratchpad.md` или всю историю рассуждений Оркестратора Worker-у.

Нарушение этого правила = расточительство токенов + риск утечки контекста между изолированными агентами (RBAC violation).

---

## § 6 — Definition of Done (DoD)

DoD для задачи агента **не является prose-описанием** "когда хватит". Это алгоритмически верифицируемый чеклист.

### Обязательные условия (все должны быть выполнены)

```
☐ 1. Все Verification Gates из spec.md: PASS (зафиксировано в commit-summary.md).
☐ 2. Ни одна Gate не пропущена (пропуск = −20 Confidence Score = FAIL).
☐ 3. Confidence Score ≥ 70 (если < 70, задача возвращается в Swarm).
☐ 4. Token Usage ≤ Hard Limit (не превышен бюджет).
☐ 5. log-raw.md завершён с записью всех решений и развилок.
☐ 6. commit-summary.md написан: токены использованы, CLEAR-поля заполнены.
☐ 7. merge_to_semantic вызван — новые сущности промоутированы в semantic-context.
☐ 8. current-context обновлён — ветка удалена из Active Epics.
```

### Neuropixel Verification (автоматизируемые ворота)

Для задач, производящих исполняемый код или конфиги — Gate ДОЛЖНА быть синтаксически/семантически верифицируемой командой:

```bash
# Примеры валидных Gates (детерминированных, не prose)
cargo test                    # ✅ Gate: все тесты проходят
cargo clippy -- -D warnings   # ✅ Gate: нет предупреждений
wasm-pack build               # ✅ Gate: артефакт < N MB
curl $ENDPOINT | jq .status   # ✅ Gate: API отвечает 200

# Недопустимые Gates (prose, субъективны)
"убедиться что код читаем"   # ❌ нет команды верификации
"проверить что логика верна" # ❌ нет объективного критерия
```

---

## § 7 — Human-in-the-Loop (HITL) Триггеры

HITL активируется **автоматически** при достижении любого из порогов:

| Триггер | Порог | Действие |
|---|---|---|
| **Budget Soft Limit** | 80% токенов использовано | Агент завершает текущий шаг и сигнализирует. Оркестратор оценивает: продолжить или эскалировать. |
| **Budget Hard Limit** | 100% токенов | Hard stop. Задача → BLOCKED. HITL обязателен. |
| **Confidence Score Low** | ≤ 65 перед закрытием ветки | Задача возвращается в Swarm. Если снова ≤ 65 — HITL. |
| **Gate Loop Max** | 3 попытки на одну Gate | Агент не эскалирует в L+1 самостоятельно — маркирует BLOCKED, ждёт HITL. |
| **Scope Violation** | Агент обращается к ресурсам вне своего RBAC scope | Немедленная остановка. Эскалация к Assistant. |
| **Deployment Operations** | Любой вызов `cargo-mcp-rust/deploy_mainnet`, `cloudflare/deploy` | approval-router.ts обязателен. Автоматического прохождения нет. |

**Правило HITL:** Агент НИКОГДА не принимает решение о продолжении самостоятельно при достижении порога. Он фиксирует состояние, освобождает бюджет и ждёт.

---

## § 8 — Метрики и CLEAR Framework

Каждая завершённая задача обязана иметь CLEAR-запись в `commit-summary.md`:

| Метрика | Что измерять | Целевое значение |
|---|---|---|
| **C — Cost** | Токены использовано / Token Budget | ≤ 100% (Hard Limit) |
| **L — Latency** | Время от открытия ветки до merge | По историческому Cycle Time |
| **E — Efficacy** | Gates Passed / Gates Total | 100% (0 пропусков) |
| **A — Assurance** | Confidence Score | ≥ 70 |
| **R — Reliability** | Gate loops / Gates Total | ≤ 1.5 loop per gate в среднем |

### Cycle Time мониторинг

Вместо оценок "как долго займёт задача" — система отслеживает исторический Cycle Time по GAIA-уровням:

| Level | Baseline Cycle Time (после накопления данных) | Аномалия |
|---|---|---|
| L1 | TBD (заполняется после 10 закрытых L1 задач) | > 2× baseline |
| L2 | TBD | > 2× baseline |
| L3 | TBD | > 2× baseline |

При аномалии — автоматическая запись в episodic-log и уведомление Tech Lead.

---

## § 9 — Аудиторский след (EU AI Act / ISO 42001)

### Обязательные поля каждой записи в `log-raw.md`

```markdown
[YYYY-MM-DDThh:mm:ssZ] | agent:<agent-id> | step:<N> | action:<tool_called or reasoning>
  context_available: <brief description of what context agent had access to>
  authorization: <RBAC role + scope>
  output: <brief description or hash of output>
  gate_result: PASS|FAIL|N/A
```

### Требования к хранению

- `log-raw.md` — иммутабельный в ходе сессии (только append).
- После закрытия ветки — архивируется в `.archive/` (never delete).
- `commit-summary.md` — сохраняется как единственный верифицированный артефакт ветки.
- Срок хранения: **3 года** (минимум, совместимый с EU AI Act § 12).

### Что обязательно логировать

| Событие | Обязательно | Запрещено |
|---|---|---|
| Каждый вызов MCP-инструмента | Да — action, params hash, result status | Полные параметры с секретами |
| Каждый Gate | Да — команда, результат, количество loops | — |
| Каждое решение (Decision в commit-summary) | Да | — |
| Рассуждения LLM (reasoning trace) | Да — краткое описание | Не хранить полный контекст промпта |
| Ошибки и BLOCKED-переходы | Да — причина, timestamp | — |

---

## § 10 — Ретроспектива и оптимизация

**Цикл ретроспективы:** После каждых 10 закрытых задач Tech Lead (или Reviewer Agent) обязан:

1. Вычислить актуальный Cycle Time по каждому GAIA-уровню из `episodic-context.md`.
2. Проверить метрику Coordination Overhead: средний процент токенов на межагентную коммуникацию vs полезную работу. Если Coordination > 30% бюджета задачи — реклассифицировать топологию.
3. Обновить Baseline Cycle Time таблицу (§8) в `semantic-context-*.md`.
4. Выявить задачи с повторяющимися BLOCKED-переходами — кандидаты на пересмотр уровня классификации или улучшение DoR.

**Правило накопления знаний:** Успешная цепочка Verification Gates (все PASS, loops ≤ 1) для нового паттерна сохраняется как `gate-pattern` сущность в `semantic-context` — чтобы будущие CTO/Tech Lead не переизобретали проверенные команды.

---

## Связанные документы

| Документ | Связь |
|---|---|
| `rules/global-constitution.md` | Иерархия правил |
| `rules/regulations/memory-regulation.md` | Тир памяти, merge_to_semantic |
| `rules/regulations/rbac-regulation.md` | RBAC scope для агентов |
| `agents/_template/L4-guardrails.yaml` | Token budget enforcement |
| `tools/auth-gates/approval-router.ts` | HITL gate для деплой-операций |
| `development/{p}/branches/_template/spec.md` | Шаблон создания задачи |
| `development/{p}/branches/_template/commit-summary.md` | Шаблон закрытия задачи |
