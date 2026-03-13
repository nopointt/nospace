# Plan: Production-Ready Agent System
> tLOS Agent Hierarchy — от прототипа к production-grade системе
> Автор: nopoint + Eidolon | 2026-03-13
> Основан на: исследовании 15+ источников (Anthropic, Microsoft, LangGraph, O'Reilly, Chip Huyen, Eugene Yan)

---

## Место в глобальном роадмапе

> **Глобальный роадмап:** `docs/agent-system-architecture.md` (Roadmap v5, Phases 1-9)
>
> Этот план работает **внутри Phase 6** (E2E Validation) глобального роадмапа.
> Он также поглощает часть задач из Phase 7 (Automation: escalation, samurizator cron) и Phase 8 (Agent Comms: parallel Chiefs dispatch, horizontal communication).
>
> ```
> Global Roadmap v5:
>   Phase 0-5: ✅ DONE (v4)
>   Phase 6: E2E Validation ← МЫ ЗДЕСЬ
>     └── THIS PLAN (Phases 0-5 внутренние)
>   Phase 7: Automation      ← частично покрыто этим планом (Phase 2, 4)
>   Phase 8: Agent Comms     ← частично покрыто этим планом (Phase 1, 5)
>   Phase 9: Shell Expansion ← отдельно
> ```

---

## Контекст

Текущая система работает. E2E тест Дирижёр→Chief прошёл за 312.7s. Но это прототип — print() вместо логирования, одна модель для всего, нет кеширования, нет бюджетов. Этот план превращает работающий прототип в production-ready систему.

**Ключевой вывод из исследования:**
> "GPT-3.5 в agent-цикле (95.1%) побеждает GPT-4 в режиме одного запроса (67%). **Архитектура важнее модели.**"
> — Andrew Ng, DeepLearning.AI

**Три столпа production agent system:**
1. **Наблюдаемость** — ты должен видеть что происходит внутри
2. **Ограничения** — без лимитов агенты потребят бесконечные ресурсы
3. **Обратная связь** — система должна учиться на своих результатах

---

## Что у нас хорошо (подтверждено исследованием)

| Что есть | Индустриальный паттерн | Статус |
|---|---|---|
| Иерархия агентов (Дирижёр→Chief→Lead→Special→G3) | "Hierarchical Agent Teams" (LangGraph рекомендация) | Реализовано |
| G3 (Player + Coach, цикл до 3 итераций) | "Evaluator-Optimizer loop" (Anthropic best practice) | Реализовано |
| NATS pub/sub | "Event-driven communication" (production-proven) | Реализовано |
| NEVER raises паттерн | "Graceful degradation" | Реализовано |
| Singleton compilation графов | Избегание overhead на каждый запрос | Реализовано |
| domain_config.py как единый источник | "Single source of truth" для иерархии | Реализовано |
| Continuum Memory (5 слоёв) | Продвинутая memory architecture | Реализовано |
| Samurizator + Regulator | Meta-services (compaction + rules) | Реализовано |

**Вывод:** фундамент правильный. Проблемы — в отсутствии production-слоёв поверх.

---

## Критические пробелы (Gap Analysis)

### Категория A: Без этого нельзя в production

| # | Пробел | Что это значит | Риск |
|---|---|---|---|
| A1 | **Нет наблюдаемости** | Только `print()`. Невозможно понять где застряло, сколько стоило, почему медленно | Слепота. Оптимизируем вслепую |
| A2 | **Нет лимитов на цепочку** | G3 = max 3 итерации. Но полная цепочка Дирижёр→...→G3 — без timeout и budget | Цепочка может висеть бесконечно |
| A3 | **Одна модель для всего** | `claude-sonnet-4-6` на каждый вызов. Роутинг-решение (5 строк JSON) стоит столько же сколько генерация кода (1000 строк) | Переплата x5-10 за простые задачи |
| A4 | **Нет кеширования** | Каждый вызов Claude CLI — с нуля. Одинаковый routing для одинаковых задач | Лишние токены + лишнее время |
| A5 | **Claude CLI subprocess = bottleneck** | Каждый вызов = Node.js bootstrap (~3s) + auth (~2s) + API. Это архитектурный потолок | Минимум 5s на любой вызов, не сжимается |

### Категория B: Критично для качества

| # | Пробел | Что это значит | Риск |
|---|---|---|---|
| B1 | **Нет валидации планов** | Routing plan Дирижёра исполняется без проверки. Неверный JSON / несуществующий домен → тихий skip | Тихие ошибки |
| B2 | **Нет feedback loop** | Нет способа измерить: задача выполнена хорошо или плохо? | Нет данных для улучшения |
| B3 | **Нет escalation matrix** | Все ошибки эскалируются одинаково. Нет blast radius | Мелкие баги идут до человека |
| B4 | **Sequential Chiefs dispatch** | 2 домена = 2x время (290s вместо 160s) | Линейное замедление |

### Категория C: Важно для масштабирования

| # | Пробел | Что это значит | Риск |
|---|---|---|---|
| C1 | **Нет persistence** | Состояние в памяти. Рестарт контейнера = потеря всего | Невозможность recovery |
| C2 | **Нет double-texting** | Новое сообщение пока цепочка работает — undefined behavior | UX проблема |
| C3 | **Нет drift detection** | Качество может деградировать незаметно (модель обновилась, промпты стали хуже) | Скрытая деградация |
| C4 | **Compound error** | 95% accuracy per step → 60% за 10 шагов → 0.6% за 100 шагов (Chip Huyen) | Длинные цепочки = низкое качество |

---

## Индустриальные рекомендации (что подтверждено в production)

### От Anthropic ("Building Effective Agents")

> "Успех — не в том чтобы построить самую сложную систему. Успех — в том чтобы построить правильную систему для твоих нужд."

Пять паттернов (от простого к сложному):
1. **Prompt Chaining** — фиксированная цепочка вызовов ← **tLOS использует**
2. **Routing** — LLM выбирает путь ← **tLOS использует (Дирижёр)**
3. **Parallelization** — независимые задачи параллельно ← **tLOS планирует**
4. **Orchestrator-Workers** — динамическая декомпозиция ← **tLOS использует (Chief→Lead)**
5. **Evaluator-Optimizer** — генерация + критика ← **tLOS использует (G3)**

**Вывод:** tLOS уже использует все 5 паттернов. Архитектура правильная.

### От Microsoft (Magentic-One)

Двойной цикл контроля:
- **Inner Loop** (Progress Ledger) — трекинг прогресса по шагам
- **Outer Loop** (Task Ledger) — факты + гипотезы + план. Перепланирование если застряло

Правило: Continue (если прогресс) → Wait (застряло <2 раз) → Replan (застряло ≥2 раз)

### От O'Reilly (Year of Building with LLMs)

1. **Ежедневные "vibe checks"** — смотри на production данные каждый день
2. **Кеширование — самый высокий ROI** для стоимости и скорости
3. **Логируй всё** — inputs, outputs, tool calls, state transitions
4. **Пинь версии моделей** — 10-30% variance при смене модели

### От LangGraph (Production Patterns)

1. **Postgres checkpointer** — persistence состояния
2. **Streaming** — токены по мере генерации (у нас есть через NATS)
3. **`RemainingSteps`** — graceful degradation при приближении к лимитам
4. **Double-texting** — 4 стратегии: reject, queue, interrupt, rollback
5. **`Command` primitive** — routing + state update в одном

### Тактика снижения compound error (Chip Huyen)

1. Сильная модель на критических решениях (Дирижёр = Opus, Worker = Sonnet)
2. Self-correction на каждом шаге
3. Меньше шагов, но каждый — с высокой уверенностью
4. Параллельное голосование (несколько попыток → агрегация)

---

## Модельная стратегия (Model Routing)

**Текущая:** всё на `claude-sonnet-4-6`. Это как если бы генерал лично разносил каждое письмо.

**Предлагаемая:**

| Уровень | Тип задачи | Модель | Почему |
|---|---|---|---|
| Дирижёр | Формализация + routing | **Opus** | Критическое решение. Ошибка здесь = каскадная ошибка |
| Chief | Декомпозиция задачи | **Sonnet** | Средняя сложность, нужен баланс |
| Lead | Планирование исполнения | **Sonnet** | Нужно понимать кодовую базу |
| Special | Спецификация задачи | **Sonnet** | Технические детали |
| G3 Worker | Написание кода | **Sonnet** | Качество кода критично |
| G3 Coach | Верификация | **Sonnet** | Нужна глубокая проверка |
| Routing JSON parse | Извлечение JSON | **Haiku** | Тривиальная задача, 3x экономия |
| Notifications | "ок" / summary | **Haiku** | Простое резюмирование |
| Bug KB search | Поиск похожих багов | **Haiku** | Classification task |

**Экономия:** ~30-40% токенов за счёт Haiku на утилитных задачах. Качество Дирижёра ↑ за счёт Opus.

---

## ПЛАН РАЗРАБОТКИ

### Приоритеты и зависимости

```
Phase 0: OBSERVABILITY (фундамент — без этого нельзя оптимизировать)
    │
    ├── Phase 1: SPEED (параллелизм + fast path)
    │
    ├── Phase 2: QUALITY (escalation + validation + feedback)
    │
    └── Phase 3: COST (model routing + caching + budgets)
         │
         └── Phase 4: RESILIENCE (persistence + limits + recovery)
              │
              └── Phase 5: SCALE (horizontal comms + Debug Service + procedural regs)
```

**Правило:** Phase 0 — обязательно первая. Phases 1-3 могут идти параллельно. Phase 4 после 1-3. Phase 5 — отдельная эпоха.

---

### Phase 0: Observability (ФУНДАМЕНТ)

> "Нельзя оптимизировать то что не измеряешь" — каждый источник в исследовании

**Что делаем:** structured logging + cost tracking на каждый Claude CLI вызов.

#### Step 0.1: `trace.py` — Structured Tracing

Новый файл. Каждый вызов `call_claude_cli` логирует:

```
{
  "trace_id": "uuid",           // уникальный ID всей цепочки
  "span_id": "uuid",            // ID этого конкретного вызова
  "parent_span_id": "uuid",     // кто вызвал
  "agent_level": "dirizhyor",   // L1/L2/L3/L4/L5
  "agent_role": "Chief/Development",
  "model": "claude-sonnet-4-6",
  "prompt_tokens": 1500,        // estimated from prompt length
  "completion_tokens": 800,     // estimated from response length
  "latency_ms": 8400,
  "status": "ok" | "error" | "empty",
  "timestamp": "ISO8601"
}
```

**Реализация:**
- `trace.py` — модуль с `Span` class и `TraceContext`
- pg таблица `agent_traces` — все спаны пишутся сюда
- `call_claude_cli` оборачивается в `with trace_span(...):`
- trace_id прокидывается через state на каждом уровне

**Файлы:** `trace.py` (новый), `graph.py` (модификация call_claude_cli)

**Результат:** после каждого вызова цепочки — полная картина: кто сколько потратил, где задержка.

#### Step 0.2: `dashboard_query.py` — SQL-запросы для анализа

Не UI — просто набор SQL-функций:
- `get_chain_summary(trace_id)` — полная цепочка с таймингами
- `get_cost_by_level(days=7)` — стоимость по уровням за период
- `get_slowest_spans(limit=10)` — самые медленные вызовы
- `get_error_rate(days=7)` — процент ошибок

**Файлы:** `dashboard_query.py` (новый)

**Результат:** в любой момент можно запросить "где деньги" и "где тормоза".

#### Verification Phase 0:

```bash
# Запустить тестовую задачу через Дирижёр
python -c "
from trace import get_chain_summary
from dashboard_query import get_cost_by_level
# После тестового запуска:
summary = get_chain_summary('latest')
print(summary)  # должен показать все спаны цепочки
"
```

---

### Phase 1: Speed

> Целевое улучшение: 312s → ~90-120s для мульти-доменных задач

#### Step 1.1: Parallel Chiefs Dispatch

**Что:** `asyncio.gather` вместо sequential loop в `dirizhyor_router_node`.

**Текущий код (graph.py:899-934):**
```python
for entry in domains:
    chief_graph.invoke(chief_state)  # блокирует до завершения
```

**Станет:**
```python
import asyncio
tasks = [loop.run_in_executor(None, chief_graph.invoke, state) for ...]
results = await asyncio.gather(*tasks)
```

**Проблема:** `dirizhyor_router_node` — синхронная функция внутри LangGraph. Нужен рефакторинг: либо вынести параллельность на уровень `bridge_handler.py`, либо использовать LangGraph `Send` для динамического параллелизма.

**Рекомендация (из LangGraph docs):** использовать `Send` API — он создан именно для dynamic parallel fan-out:

```python
def dirizhyor_router_node(state):
    # Вместо invoke — Send к нескольким Chief нодам
    return [Send(f"chief_{domain}", chief_state) for domain in domains]
```

Это нативный LangGraph-подход. Каждый Send создаёт параллельную ветку.

**Файлы:** `graph.py` (рефакторинг dirizhyor_router_node + build_dirizhyor_graph)

**Экономия:** ~45% времени на мульти-доменных задачах.

#### Step 1.2: Fast Path Success

**Что:** результат G3 → сразу к Дирижёру, минуя промежуточные уровни.

**Как:** в `bridge_handler.py` после завершения chief graph — publish результат на NATS сразу, параллельно отправить lightweight notifications.

**Notifications:**
- Special: LLM summary (Haiku, ~2s)
- Lead: механическая запись "task X done" (без LLM)
- Chief: механическая запись "task X done" (без LLM)

**Файлы:** `graph.py`, `bridge_handler.py`

**Экономия:** для одно-доменных задач — убираем 3 уровня обратного прохождения.

#### Step 1.3: Cross-Functional Ordering

**Что:** Дирижёр определяет порядок доменов + зависимости.

**Как:** добавить в routing_plan JSON:
```json
{
  "execution_order": [
    {"phase": 1, "chiefs": ["development", "design"]},
    {"phase": 2, "chiefs": ["marketing"]}
  ],
  "dependencies": {"marketing": ["development", "design"]}
}
```

`dirizhyor_router_node` читает `execution_order` → запускает фазы последовательно, Chiefs внутри фазы — параллельно (через Send).

**Файлы:** `graph.py` (промпт dirizhyor_node + dirizhyor_router_node)

#### Verification Phase 1:

| Тест | Ожидание |
|---|---|
| Два домена параллельно | Время ≈ max(Dev, Design), не сумма |
| Кросс-функциональная задача | Фазовое выполнение, порядок корректный |
| Одиночный домен | Fast path — результат быстрее чем раньше |

---

### Phase 2: Quality

> Целевое улучшение: ошибки решаются на месте, не каскадируются вверх

#### Step 2.1: `escalation_rules.yaml`

Конфигурационный файл с правилами эскалации по blast radius:

```yaml
levels:
  special:
    blast_radius: "single_file"
    can_decide:
      - swap_equivalent_dependency
      - fix_bug_single_file
      - retry_on_timeout
      - choose_between_equivalent_approaches
    must_escalate:
      - change_interface_between_files
      - add_new_file

  lead:
    blast_radius: "subdomain"
    can_decide:
      - change_interface_between_files
      - add_new_file_in_subdomain
      - revise_spec_after_3_failures
    must_escalate:
      - new_docker_service
      - change_db_schema

  chief:
    blast_radius: "domain"
    can_decide:
      - new_docker_service
      - change_db_schema
      - reassign_task_to_other_lead
      - change_nats_subject
    must_escalate:
      - cross_domain_format_change
      - add_new_domain
      - budget_decision

  dirizhyor:
    blast_radius: "cross_domain"
    can_decide:
      - cross_domain_format_change
      - add_new_domain
      - budget_decision
    must_escalate:
      - delete_service
      - change_technology
      - deploy_to_production
      - any_irreversible_action
```

**Файлы:** `escalation_rules.yaml` (новый)

#### Step 2.2: `bug_kb.py` — Bug Knowledge Base

pg таблица `bug_knowledge_base`:
```
id | error_signature | error_message | domain | resolution_path
   | blast_radius | token_cost | times_seen | last_seen | created_by
```

API:
- `log_bug(error_sig, message, domain, resolution)` — записать баг
- `search_similar(error_sig)` — найти похожий (по signature)
- `get_resolution(bug_id)` — получить путь решения
- `increment_seen(bug_id)` — увеличить счётчик встреч

**Паттерн:** тот же что `global_memory.py` — NEVER raises, graceful fallback.

**Файлы:** `bug_kb.py` (новый)

#### Step 2.3: Plan Validation

**Что:** проверить routing_plan ДО исполнения.

**Проверки:**
1. JSON valid?
2. Все `chief` значения — из `_AVAILABLE_CHIEFS`?
3. `execution_order` содержит все chiefs из `domains`?
4. Нет циклических зависимостей?
5. Каждый chief имеет непустой `task`?

**Если проверка провалилась:** retry dirizhyor_node один раз с feedback. Если второй раз — error.

**Файлы:** `graph.py` (новая функция `_validate_routing_plan` + проверка в `dirizhyor_router_node`)

#### Step 2.4: Evaluation & Feedback Loop

**Что:** после каждой выполненной задачи — оценка качества.

**Минимальная версия (сейчас):**
1. Записывать в pg таблицу `task_outcomes`:
   - `trace_id`, `intent`, `result_summary`, `total_tokens`, `total_latency_ms`
   - `human_rating` (null пока не оценено)
   - `auto_quality_score` (LLM-as-judge — можно добавить позже)
2. Периодически (вручную) проставлять `human_rating` (1-5)
3. SQL для анализа: средний рейтинг по доменам, по уровням, тренд

**Полная версия (потом):**
- LLM-as-judge автоматически оценивает: "intent → result, насколько близко?"
- Drift detection: если средний score падает — алерт

**Файлы:** `evaluation.py` (новый), `task_outcomes` pg таблица

#### Verification Phase 2:

| Тест | Ожидание |
|---|---|
| Знакомый баг | Special решает сам, не эскалирует |
| Незнакомый баг | Эскалация к Lead/Chief |
| Невалидный routing plan | Retry + success или clear error |
| Задача с рейтингом | Запись в task_outcomes, queryable |

---

### Phase 3: Cost

> Целевое улучшение: -40% токенов при том же качестве

#### Step 3.1: Model Routing

**Что:** разные модели для разных задач.

```python
MODEL_CONFIG = {
    "dirizhyor": "claude-opus-4-6",      # критическое решение
    "chief": "claude-sonnet-4-6",         # средняя сложность
    "lead": "claude-sonnet-4-6",          # нужен контекст кодовой базы
    "special": "claude-sonnet-4-6",       # техническая спецификация
    "g3_worker": "claude-sonnet-4-6",     # качество кода
    "g3_coach": "claude-sonnet-4-6",      # глубокая проверка
    "notification": "claude-haiku-4-5",   # утилитная задача
    "routing_parse": "claude-haiku-4-5",  # извлечение JSON
    "bug_search": "claude-haiku-4-5",     # classification
}
```

**Как:** добавить параметр `role` в `call_claude_cli`, lookup модели по роли. Дефолт — Sonnet.

**Файлы:** `graph.py` (call_claude_cli + все вызовы), `model_config.py` (новый)

#### Step 3.2: Response Caching

**Что:** кеширование для повторяющихся паттернов.

**Что кешировать:**
- Routing decisions: одинаковый intent → одинаковый routing plan (TTL 1 час)
- Domain context reads: global_memory + project_memory (TTL 5 мин)
- Bug KB searches: signature → resolution (TTL ∞)

**Что НЕ кешировать:**
- Код (G3 Worker output) — всегда свежий
- Coach verification — зависит от конкретного кода
- Chief decomposition — зависит от контекста

**Реализация:** pg таблица `response_cache` с TTL. Простой key-value. Ключ = hash(prompt_prefix + intent).

**Файлы:** `cache.py` (новый), `graph.py` (интеграция)

**Ожидаемый ROI:** кеширование = самый высокий ROI оптимизации по данным O'Reilly.

#### Step 3.3: Token Budgets

**Что:** максимальный бюджет токенов на задачу.

```python
BUDGET_CONFIG = {
    "simple_task": 50_000,    # одиночный домен, 1 файл
    "medium_task": 150_000,   # несколько файлов, 1 домен
    "complex_task": 500_000,  # мульти-доменная задача
    "max_per_chain": 1_000_000,  # абсолютный потолок
}
```

**Как:** trace.py уже считает токены на каждый span. Добавить проверку: если accumulated_tokens > budget → graceful stop с частичным результатом.

**Файлы:** `trace.py` (добавить budget check), `budget_config.py` (новый)

#### Verification Phase 3:

| Тест | Ожидание |
|---|---|
| Routing + notification | Используют Haiku вместо Sonnet |
| Повторный routing на тот же intent | Cache hit, 0 токенов |
| Задача превышающая бюджет | Graceful stop с partial result |

---

### Phase 4: Resilience

> Целевое улучшение: система переживает рестарты, не теряет состояние

#### Step 4.1: Chain Timeout

**Что:** максимальное время на полную цепочку.

```python
TIMEOUT_CONFIG = {
    "single_domain": 120,    # 2 минуты
    "multi_domain": 300,     # 5 минут
    "complex_chain": 600,    # 10 минут
    "max_per_call": 90,      # 90 секунд на один Claude CLI вызов
}
```

**Как:** `subprocess.Popen.communicate(timeout=90)` уже поддерживается. Добавить в `call_claude_cli`. На уровне chain — `asyncio.wait_for` в `bridge_handler.py`.

**Файлы:** `graph.py`, `bridge_handler.py`

#### Step 4.2: State Checkpointing (LangGraph Postgres)

**Что:** сохранять состояние графа в Postgres.

**Как:** LangGraph поддерживает `PostgresSaver` checkpointer:
```python
from langgraph.checkpoint.postgres import PostgresSaver
checkpointer = PostgresSaver.from_conn_string(DATABASE_URL)
graph = builder.compile(checkpointer=checkpointer)
```

После каждого нода — автоматический checkpoint. При рестарте — resume с последнего checkpoint.

**Файлы:** `graph.py` (все `build_*_graph` функции), зависимость `langgraph-checkpoint-postgres`

#### Step 4.3: Retry with Backoff

**Что:** при transient failures (сеть, rate limit) — retry 1 раз с задержкой.

```python
def call_claude_cli_with_retry(prompt, model, max_retries=1):
    for attempt in range(max_retries + 1):
        result = call_claude_cli(prompt, model)
        if result:  # non-empty = success
            return result
        if attempt < max_retries:
            time.sleep(2 ** attempt)  # exponential backoff
    return ""  # graceful degradation
```

**Файлы:** `graph.py`

#### Step 4.4: Double-Texting Strategy

**Что:** если пользователь отправляет новое сообщение пока цепочка работает.

**Стратегия: Queue** — новое сообщение ставится в очередь, текущая цепочка завершается, потом обрабатывается следующее.

**Реализация:** на уровне `bridge.py` — проверка `is_chain_running`. Если да — поставить в NATS queue.

**Файлы:** `bridge.py`, `bridge_handler.py`

#### Verification Phase 4:

| Тест | Ожидание |
|---|---|
| Claude CLI timeout (задержка >90s) | Graceful timeout, не виснет |
| Рестарт контейнера mid-chain | Resume с последнего checkpoint |
| Два сообщения подряд | Второе обрабатывается после первого |

---

### Phase 5: Scale (отдельная эпоха)

> Эти фичи — после стабилизации Phases 0-4

#### Step 5.1: Direct API вместо Claude CLI

**Главный architectural improvement.** Claude CLI subprocess = Node.js bootstrap 3-5s на каждый вызов. Прямой API через `anthropic` Python SDK — ~0.1s overhead.

```python
import anthropic
client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

def call_claude_api(prompt: str, model: str = "claude-sonnet-4-6") -> str:
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
```

**Экономия:** ~5s на каждый вызов. В цепочке из 6 вызовов = 30s. Это больше чем parallel dispatch.

**Но:** требует ANTHROPIC_API_KEY вместо Claude CLI auth. Нужно проверить ценообразование vs CLI.

#### Step 5.2: Horizontal Communication

Регламенты горизонтальной коммуникации между всеми уровнями. Маленькие YAML файлы для каждой пары.

#### Step 5.3: Debug Service ("Медики")

Полная мета-служба: modeling + verification + resolution. Отдельный LLM pipeline.

#### Step 5.4: Procedural Regulations

Регламенты как функция от параметров (автономность, error tolerance, blast radius).

---

## Порядок реализации (рекомендуемый)

```
Week 1: Phase 0 (Observability)
  ├── trace.py + pg table
  ├── call_claude_cli instrumentation
  └── dashboard_query.py
  → РЕЗУЛЬТАТ: видим стоимость и латентность каждого вызова

Week 2: Phase 1 (Speed) + Phase 3.1 (Model Routing)
  ├── Parallel Chiefs (Send API или asyncio.gather)
  ├── Model routing config
  └── Fast path success
  → РЕЗУЛЬТАТ: 2x быстрее + 30% дешевле

Week 3: Phase 2 (Quality)
  ├── escalation_rules.yaml
  ├── bug_kb.py
  ├── Plan validation
  └── Evaluation table
  → РЕЗУЛЬТАТ: ошибки решаются на месте

Week 4: Phase 3.2-3.3 (Cost) + Phase 4.1-4.3 (Resilience)
  ├── Response caching
  ├── Token budgets
  ├── Chain timeouts
  ├── Retry with backoff
  └── State checkpointing
  → РЕЗУЛЬТАТ: production-ready система

Week 5+: Phase 5 (Scale)
  ├── Direct API migration
  ├── Horizontal comms
  └── Debug Service
  → РЕЗУЛЬТАТ: следующий уровень
```

---

## Архитектура после реализации

```
User Intent
  │
  ▼
┌─────────────────────────────────────────────────┐
│ Дирижёр (Opus)                                   │
│ ├── trace_span: формализация + routing           │
│ ├── _validate_routing_plan()                     │
│ ├── cache check (routing)                        │
│ └── budget check                                 │
└─────────────┬───────────────────────────────────┘
              │ Send API (parallel)
    ┌─────────┼──────────┐
    ▼         ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Chief/Dev│ │Chief/Dsn│ │Chief/Mkt│  (Sonnet, parallel)
│trace_span│ │trace_span│ │trace_span│
└────┬───┘ └────┬───┘ └────┬───┘
     ▼          ▼          ▼
  Lead→Special→G3        ...        ...
  (each with trace_span, escalation check, bug_kb lookup)
     │
     ▼
┌─────────────────────────────────────────────────┐
│ Fast Path: результат → Дирижёр → NATS → Shell   │
│ Notifications (Haiku): Special summary, Lead/Chief "ok" │
│ Trace: полная цепочка с токенами и таймингами    │
│ Evaluation: intent vs result logged              │
└─────────────────────────────────────────────────┘
```

---

## Новые файлы (итого)

| Файл | Phase | Что делает |
|---|---|---|
| `trace.py` | 0 | Structured tracing + pg table `agent_traces` |
| `dashboard_query.py` | 0 | SQL-запросы для анализа стоимости/скорости |
| `model_config.py` | 3 | Конфигурация модели по роли агента |
| `cache.py` | 3 | Response caching с TTL |
| `budget_config.py` | 3 | Token budgets per task type |
| `escalation_rules.yaml` | 2 | Blast radius правила для каждого уровня |
| `bug_kb.py` | 2 | Bug Knowledge Base (pg table + API) |
| `evaluation.py` | 2 | Task outcome tracking + quality metrics |

## Модифицируемые файлы

| Файл | Что меняется |
|---|---|
| `graph.py` | trace integration, parallel Send, model routing, validation, timeout, caching |
| `bridge_handler.py` | fast path, notifications, double-texting, chain timeout |
| `bridge.py` | double-texting queue |
| `domain_config.py` | model per role (optional) |
| `docker-compose.yml` | новая зависимость langgraph-checkpoint-postgres |
| `pyproject.toml` | зависимости: anthropic, langgraph-checkpoint-postgres |

---

## Метрики успеха (по фазам)

| Фаза | Метрика | Текущее | Цель |
|---|---|---|---|
| Phase 0 | Видимость цепочки | 0% (только print) | 100% (каждый вызов traceд) |
| Phase 1 | Latency 2-domain task | ~290s | ~160s (-45%) |
| Phase 1 | Latency single domain | ~160s | ~90s (fast path) |
| Phase 2 | Ошибки доходящие до Human | ~100% | <30% (escalation matrix) |
| Phase 3 | Стоимость routing вызовов | 100% (Sonnet) | 30% (Haiku) |
| Phase 3 | Cache hit rate (routing) | 0% | >50% |
| Phase 4 | Recovery after restart | 0% (state lost) | 100% (checkpoint resume) |
| Phase 5 | CLI overhead per call | ~5s | ~0.1s (direct API) |

---

## Источники

1. **Anthropic** — "Building Effective Agents" (anthropic.com/engineering)
2. **Microsoft** — Magentic-One (microsoft.com/research)
3. **O'Reilly** — "What We Learned from a Year of Building with LLMs"
4. **Chip Huyen** — "AI Agent Architecture" (compound error analysis)
5. **Eugene Yan** — "LLM Patterns for Production" (caching, guardrails)
6. **LangGraph Docs** — Send API, Interrupts, Postgres checkpointer
7. **OpenTelemetry** — LLM Observability semantic conventions
8. **Andrew Ng** — Agent Design Patterns (DeepLearning.AI)
9. **Lilian Weng** — "LLM-Powered Autonomous Agents" (memory taxonomy)
10. **Hamel Husain** — LLM Judge Evaluation patterns
