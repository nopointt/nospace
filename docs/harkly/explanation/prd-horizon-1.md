# PRD — Harkly Horizon 1
> Версия: 1.0 | Дата: 2026-02-23 | Автор: Comet (Perplexity, L1)
> Статус: **ACTIVE** — передать CTO для реализации
> Горизонт: Завтра (3–6 месяцев)
> Связано: [research/2026-02-harkly-horizons](../../research/2026-02-harkly-horizons/README.md) · [research/2026-02-synthetic-consumers-silicon-sampling](../../research/2026-02-synthetic-consumers-silicon-sampling/README.md)

---

## 1. Executive Summary

**Harkly** переходит от desktop-инструмента к специализированной **Consumer Intelligence Platform** для e-commerce брендов и агентств RU/СНГ.

Горизонт 1 — это реализация трёх слоёв:
- **Layer 1 (Reality):** непрерывный сбор и анализ реальных отзывов с маркетплейсов через веб-дашборд;
- **Layer 2 (Prediction):** первый silicon sampling модуль — прогноз реакции аудитории до запуска;
- **Layer 3 (AI Perception):** мониторинг того, как LLM-системы описывают бренд.

**Время до production:** 8–12 недель.
**Целевой MRR по завершению горизонта:** $2,000–5,000.
**Приоритет:** сначала Layer 1 полностью, затем Layer 2 MVP, затем Layer 3 baseline.

---

## 2. Проблема

### Для бренда/маркетолога сегодня

| Боль | Масштаб |
|---|---|
| Ручной мониторинг сотен отзывов на WB/Ozon/Отзовике | Часы в день |
| Нет инструмента для предсказания реакции до запуска | $$$  на A/B-тесты |
| Неизвестно, как ChatGPT/YandexGPT описывает бренд | Новая угроза |
| Аналитика — раз в квартал, а рынок меняется ежедневно | Опоздание на реакцию |
| Конкурентная разведка по отзывам — вручную | Нет системы |

### Почему сейчас

1. **Silicon sampling доказан** — Stanford/NYU (2024): LLM-симуляции достигают r = 0.85–0.90 с реальными эффектами.
2. **Рынок не занят** — в RU нет B2B SaaS с комбинацией реальных отзывов + synthetic prediction + AI perception.
3. **СберМаркетинг** создал внутренний аналог («Скуф», oct 2025) — значит, корпоративный спрос подтверждён.
4. **MVP технически готов** — парсеры работают, RAG-пайплайн готов, инфра задеплоена.

---

## 3. Целевая аудитория

### Persona 1 — Маркетолог бренда (Primary)

```
Имя: Катя, 28 лет, Москва
Роль: Бренд-менеджер / Head of SMM
Компания: FMCG/косметика/одежда, продаёт на WB и Ozon
Боль: тратит 3+ часов в неделю на ручной мониторинг отзывов
Цель: понять, что не нравится покупателям, и исправить до следующей поставки
WTP: $100–300/мес
Триггер покупки: демо с реальными отзывами по её бренду
```

### Persona 2 — Product Manager (Secondary)

```
Имя: Антон, 32 года
Роль: PM в e-commerce компании
Боль: запускает новый SKU и не знает, как отреагирует аудитория
Цель: получить прогноз отзывов до инвестирования в производство
WTP: $200–500/мес
Триггер покупки: silicon sampling кейс с точным прогнозом
```

### Persona 3 — Руководитель агентства (White-label)

```
Имя: Игорь, 38 лет
Роль: CEO маркетингового агентства
Боль: нет инструмента для отчётности по репутации клиентов
Цель: продавать клиентам «умный мониторинг» под своим брендом
WTP: $500–2000/мес
Триггер покупки: white-label демо + revenue share условия
```

---

## 4. Scope Horizon 1

### IN SCOPE

**Layer 1 — Reality (Must Have)**
- [ ] Веб-дашборд (Next.js, миграция с desktop)
- [ ] Парсеры: Отзовик, Irecommend (уже работают → подключить к веб)
- [ ] Парсеры: Wildberries, Ozon (новые, приоритет H1)
- [ ] Яндекс.Маркет (stretch goal)
- [ ] AI-анализ: тональность, кластеризация тем, топ-претензии
- [ ] Мониторинг конкурентов: отзывы по конкурирующим брендам/SKU
- [ ] Алёрты: аномалия тональности, новые острые претензии
- [ ] Экспорт: CSV, Excel, Markdown (RAG-ready)
- [ ] Health check & alerting (мониторинг источников)

**Layer 2 — Prediction (MVP, Must Have)**
- [ ] Silicon sampling endpoint: принять текст → вернуть predicted sentiment + топ-темы
- [ ] Базовый sampling frame для RU-аудитории (12+ сегментов)
- [ ] Ensemble prompting (16 итераций, усреднение)
- [ ] Calibration коэффициент на основе реальных RU-отзывов
- [ ] UI: поле ввода текста + вывод прогноза

**Layer 3 — AI Perception (Baseline, Must Have)**
- [ ] Регулярные запросы к GPT-4, YandexGPT, GigaChat по бренду
- [ ] Хранение и diff: как изменилось восприятие за неделю/месяц
- [ ] Базовый отчёт: «как ИИ описывает ваш бренд vs топ-конкуренты»

**Инфраструктура**
- [ ] Docker deployment на Render (Web + Worker)
- [ ] Supabase: PostgreSQL + Auth + RLS
- [ ] BullMQ + Upstash Redis (очередь задач)
- [ ] Мультитенантность (1 инстанс, несколько клиентов)
- [ ] White-label конфигурация (базовый уровень)

### OUT OF SCOPE (H1)
- Multi-agent simulations (→ H3)
- Яндекс.Маркет парсер (stretch goal, если время есть)
- Полная validation science whitepaper (→ H2)
- Deep enterprise API (→ H2)
- Mobile app
- Публичный marketplace отзывов

---

## 5. Функциональные требования

### 5.1 Layer 1 — Reality Layer

#### F1.1 Управление проектами

```
Пользователь может:
- Создать проект (бренд или конкурент)
- Добавить источники: WB / Ozon / Отзовик / Irecommend / ЯМ
- Задать расписание парсинга (cron)
- Видеть историю всех job-ов
- Видеть сводный дашборд по проекту
```

**Поля проекта:**
- `name` — название бренда/продукта
- `type` — own | competitor
- `sources[]` — список площадок
- `queries[]` — поисковые запросы / URL-ы
- `schedule` — cron expression (default: раз в сутки)
- `notifications` — Telegram / Email

#### F1.2 Scraping Jobs

```
POST /api/v1/jobs
{
  "project_id": "uuid",
  "source": "wildberries | ozon | otzovik | irecommend",
  "query": "название бренда или URL",
  "max_pages": 100,
  "proxy": { "enabled": true }
}

→ 202 Accepted
{
  "job_id": "uuid",
  "status": "queued",
  "estimated_time": "~5 min"
}
```

**Статусы job:** `queued → running → completed | failed`

**Прогресс в реальном времени** через Supabase Realtime:
```
{ "current_page": 12, "total_pages": 47, "reviews_collected": 234 }
```

#### F1.3 AI-анализ отзывов

После завершения job — автоматический анализ через LLM:

| Метрика | Описание | Выход |
|---|---|---|
| **Тональность** | Доля позитивных / нейтральных / негативных | % + тренд |
| **Топ-темы** | Кластеры тем (доставка, качество, цена, упаковка...) | Топ-10 с весами |
| **Претензии** | Конкретные жалобы с частотностью | Список + примеры |
| **Похвалы** | Конкретные достоинства с частотностью | Список + примеры |
| **NPS-proxy** | Оценка вероятности рекомендации | Число 0–100 |
| **Аномалии** | Резкие изменения тональности | Алёрты |

**RAG-пайплайн (уже готов):**
```
Отзывы → Cleaner → Chunker → Embeddings → Vector Store
                                              ↓
                                         LLM Query
```

#### F1.4 Конкурентная разведка

```
Пользователь создаёт проект с type=competitor:
- Добавляет конкурента (название/URL)
- Видит те же метрики, что и по своему бренду
- Сравнение: собственный бренд vs конкурент бок о бок
- Экспорт сравнительного отчёта
```

#### F1.5 Алёрты и уведомления

```
Триггеры:
- Тональность упала более чем на 15% за 7 дней → Warning
- 3+ парсинга подряд с ошибками → Critical (ops)
- Новый тип претензий, которого не было в прошлом месяце → Info
- Конкурент набирает отзывов значительно быстрее → Info

Каналы:
- Telegram (приоритет, через Bot API)
- Email (SMTP)
- Webhook (для white-label и API)
```

#### F1.6 Экспорт данных

| Формат | Содержание | Использование |
|---|---|---|
| CSV | Все отзывы с метаданными | Excel-аналитика |
| XLSX | Отзывы + сводная таблица + графики | Отчёт руководству |
| Markdown | Структурированные отзывы | RAG / LLM-входные данные |
| JSON | Сырые данные | API-интеграция |
| PDF-отчёт | Branded summary | Клиентская презентация |

---

### 5.2 Layer 2 — Prediction Layer (Silicon Sampling MVP)

#### F2.1 Prediction Endpoint

```
POST /api/v1/predict
{
  "input_text": "<текст карточки товара / рекламного сообщения>",
  "audience": {
    "platform": "wildberries | ozon | otzovik",
    "segments": ["women_25_45_moscow", "budget_buyers"]  // опционально
  },
  "n_simulations": 50  // default
}

→ 200 OK
{
  "predicted_sentiment": {
    "positive": 62,
    "neutral": 23,
    "negative": 15
  },
  "predicted_topics": [
    { "topic": "качество материала", "probability": 0.45, "direction": "positive" },
    { "topic": "размерная сетка",   "probability": 0.31, "direction": "negative" },
    { "topic": "скорость доставки", "probability": 0.28, "direction": "neutral" }
  ],
  "predicted_complaints": [
    { "text": "размер не совпадает с таблицей", "frequency": 0.22 }
  ],
  "calibration_note": "Модель откалибрована на 1,200 реальных отзывов в категории 'Одежда WB'. Средняя точность: ±11 п.п.",
  "confidence": 0.74
}
```

#### F2.2 Sampling Frame (RU/СНГ)

Минимальный набор профилей для ансамбля:

| Сегмент | Параметры профиля |
|---|---|
| Москва/СПб, ж, 18–34 | Высокий доход, активный покупатель маркетплейсов |
| Регионы, ж, 25–44 | Средний доход, ориентация на цену |
| Москва/СПб, м, 25–40 | Средний/высокий доход, технологичные продукты |
| Регионы, м, 30–50 | Средний доход, практичность |
| Пенсионеры (55+) | Низкий темп покупок, детальные отзывы |
| Молодёжь (16–22) | Тренды, бренд-чувствительность |
| ...ещё 6 сегментов | Категорийная специфика |

#### F2.3 Ensemble & Calibration

**Метод (по Stanford/NYU):**
1. Для каждого профиля из sampling frame — генерируем промпт с демографией + текстом стимула
2. Просим LLM ответить «как ответил бы этот человек» (шкала тональности + вероятные темы)
3. 16 итераций с рандомизацией порядка профилей и формулировок промпта
4. Усреднение → применение калибровочного коэффициента (baseline: 0.56 по Stanford/NYU для EN, будем уточнять для RU)
5. Возврат confidence interval

**Калибровка:**
- Начальная калибровка: на исторических отзывах уже собранных клиентом
- Обновление при каждом новом пакете реальных отзывов
- Документируется в отчёте: «откалибровано на N отзывах из категории X, точность ±Y п.п."

#### F2.4 UI Prediction

```
Страница: /predict

┌─────────────────────────────────────────────────────┐
│  HARKLY PREDICT                                     │
├─────────────────────────────────────────────────────┤
│  Вставьте текст (описание товара, акции, сообщения): │
│  ┌─────────────────────────────────────────────┐    │
│  │ [textarea]                                  │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Аудитория: [WB ▼]  Категория: [Одежда ▼]          │
│                                                     │
│  [→ Предсказать реакцию]                            │
├─────────────────────────────────────────────────────┤
│  РЕЗУЛЬТАТ:                                         │
│  ● Позитивных отзывов:  62%  ████████░░             │
│  ● Нейтральных:         23%  ███░░░░░░░             │
│  ● Негативных:          15%  ██░░░░░░░░             │
│                                                     │
│  Вероятные темы:                                    │
│  [+] качество материала (45%) ████░░░░              │
│  [-] размерная сетка (31%)    ███░░░░░              │
│  [~] скорость доставки (28%)  ██░░░░░░              │
│                                                     │
│  ⚠ Риск: «размер не совпадает с таблицей» у 22%    │
│                                                     │
│  ℹ Откалибровано на 1,200 реальных отзывах WB/Одежда│
│    Точность: ±11 п.п. | Confidence: 74%             │
└─────────────────────────────────────────────────────┘
```

---

### 5.3 Layer 3 — AI Perception (Baseline)

#### F3.1 LLM Brand Audit

Регулярный мониторинг: как frontier-LLM описывают бренд.

```
Cron: раз в неделю
Модели: GPT-4o, YandexGPT Pro, GigaChat Pro

Запросы-шаблоны (на RU):
1. "Расскажи про бренд [BRAND]. Его плюсы и минусы?"
2. "Сравни [BRAND] с [COMPETITOR_1] и [COMPETITOR_2]. Что выбрать?"
3. "Какие отзывы покупателей ты знаешь о [BRAND]?"
4. "Стоит ли покупать [PRODUCT_CATEGORY] у [BRAND]?"

Сохраняется: полный текст ответа + дата + модель
```

#### F3.2 Diff и трекинг изменений

```
Каждую неделю система сравнивает:
- Текущий ответ LLM vs предыдущий
- Semantic diff: что появилось нового, что исчезло
- Sentiment score ответа LLM (0–100)
- Ключевые ассоциации (entities extracted)

Визуализация:
[График] Sentiment score LLM-восприятия бренда за 12 недель
[Таблица] Бренд vs конкуренты: как описывает каждая LLM
[Алёрт] Резкое ухудшение описания → уведомление
```

#### F3.3 AI Perception Report

```
Формат: PDF / веб-страница

Содержание:
1. Как вас описывает ИИ прямо сейчас (summary)
2. Сравнение с конкурентами
3. Динамика за период
4. Риски (негативные ассоциации, пробелы)
5. Рекомендации (что публиковать, чтобы улучшить LLM-восприятие)
```

---

## 6. Нефункциональные требования

### Производительность

| Метрика | Требование |
|---|---|
| Время запуска scraping job | < 5 сек после создания |
| Скорость парсинга | 50–100 отзывов/мин |
| Время AI-анализа 1000 отзывов | < 3 мин |
| Prediction latency (Layer 2) | < 30 сек |
| Uptime API | ≥ 99% |
| Web dashboard load time | < 2 сек |

### Безопасность

- Supabase Auth + JWT для всех API
- RLS: клиент видит только свои данные
- API keys для программного доступа (hash-based)
- Все .env через age-шифрование (OPS-TODO-01)
- Никаких PII в логах
- Webhook подписи (HMAC-SHA256)

### Масштабируемость

- BullMQ позволяет горизонтально масштабировать workers
- Мультитенантность: RLS изолирует клиентов
- Render: апгрейд до $25 plan при нагрузке
- Supabase: миграция на Pro ($25) при превышении 500MB

### Second-Order Guardrails

Harkly не используется для:
- Оптимизации политических манипуляций
- Создания вредоносного контента для здоровья
- Таргетинга уязвимых демографических групп в аморальных целях

Техническая реализация:
- Content policy фильтр на входе Prediction Layer
- Audit log всех prediction-запросов
- Явный отказ с объяснением на запрещённые паттерны

---

## 7. Технический стек

### Frontend
```
Framework:  Next.js 14+ (App Router)
Language:   TypeScript strict
Styling:    TailwindCSS + shadcn/ui
State:      React Query + Zustand
Auth:       Supabase Auth
Realtime:   Supabase Realtime (job progress)
Charts:     Recharts
```

### Backend
```
Runtime:    Node.js 20
Framework:  Express.js
Queue:      BullMQ + Upstash Redis
Database:   Supabase PostgreSQL
Scraping:   Puppeteer + puppeteer-extra-plugin-stealth
Auth:       JWT (Supabase)
AI:         OpenAI API (GPT-4o) + YandexGPT API + GigaChat API
RAG:        Существующий пайплайн (chunker + cleaner)
```

### Infrastructure
```
Frontend:   Render Static Site ($0)
API:        Render Web Service ($7/mo)
Worker:     Render Worker ($7/mo)
Database:   Supabase ($0 → $25 at scale)
Queue:      Upstash Redis ($0)
CDN:        Cloudflare ($0)
Monitoring: Sentry (free) + Render Dashboard
Secrets:    age-шифрование (после OPS-TODO-01)
```

### Новые зависимости (для H1)
```
npm install:
  openai           # GPT API
  @yandex-cloud/ai # YandexGPT
  node-cron        # Scheduler
  node-telegram-bot-api  # Alerts
  fast-csv         # CSV export
  xlsx             # Excel export
  @types/marked    # Markdown export
  puppeteer-extra-plugin-stealth  # Anti-bot (уже есть?)
```

---

## 8. Архитектура данных

### Новые таблицы (дополнительно к существующим)

```sql
-- Prediction requests (Layer 2)
create table predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  input_text text not null,
  audience jsonb,
  result jsonb,
  calibration_note text,
  confidence float,
  model_version text,
  created_at timestamptz default now()
);

-- AI Perception snapshots (Layer 3)
create table ai_perception_snapshots (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id),
  llm_model text not null,       -- gpt-4o, yandexgpt, gigachat
  query_template text not null,
  response_text text not null,
  sentiment_score float,         -- 0-100
  entities jsonb,               -- extracted associations
  diff_from_previous jsonb,     -- что изменилось
  created_at timestamptz default now()
);

-- Alerts log
create table alerts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id),
  type text not null,           -- critical, warning, info
  category text not null,       -- sentiment_drop, scraper_error, etc.
  message text not null,
  payload jsonb,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz default now()
);

-- RLS для новых таблиц (аналогично существующим)
alter table predictions enable row level security;
alter table ai_perception_snapshots enable row level security;
alter table alerts enable row level security;
```

---

## 9. User Flows

### Flow 1: Маркетолог настраивает мониторинг бренда

```
1. Регистрация → Supabase Auth → onboarding
2. Создать проект → ввести название бренда
3. Добавить источники: выбрать WB + Ozon + Отзовик
4. Задать поисковые запросы: «BrandName», «SKU-123»
5. Запустить первый парсинг → наблюдать прогресс в реальном времени
6. Получить AI-анализ: тональность, топ-темы, претензии
7. Настроить алёрт на падение тональности > 15%
8. Экспортировать первый отчёт (PDF/Excel)
```

### Flow 2: PM тестирует описание нового продукта

```
1. Открыть вкладку «Predict»
2. Вставить текст карточки товара
3. Выбрать: платформа = WB, категория = Одежда
4. Нажать «Предсказать реакцию»
5. Получить прогноз через 25–30 сек
6. Увидеть риски: «28% вероятность претензий к размерной сетке»
7. Исправить описание, повторить тест
8. Принять решение о запуске
```

### Flow 3: Руководитель агентства настраивает white-label

```
1. Получить white-label license
2. Ввести config: logoUrl, brandName, primaryColor, apiDomain
3. Получить кастомную документацию (Swagger)
4. Добавить субаккаунты для клиентов
5. Клиент заходит под его брендом, видит только свои данные
```

---

## 10. Фазы реализации

### Phase 0 — Инфра и деплой (Неделя 1)

| Задача | Ответственный | Приоритет |
|---|---|---|
| OPS-TODO-01: зашифровать .env через age | nopoint | BLOCKER |
| Настроить Render: Web + Worker + Static | CTO | H |
| Supabase: схема + RLS + new tables | CTO | H |
| Upstash Redis подключить к BullMQ | CTO | H |
| Базовый Dockerfile для Puppeteer | CTO | H |
| Cloudflare DNS | nopoint | H |

### Phase 1 — Layer 1: Web MVP (Неделя 2–4)

| Задача | Приоритет | Оценка |
|---|---|---|
| Миграция Electron → Next.js App Router | H | 4 дня |
| Supabase Auth (login/register) | H | 1 день |
| Dashboard: список проектов + jobs | H | 2 дня |
| Scraper Form + progress realtime | H | 2 дня |
| Подключить существующие парсеры (Отзовик, Irecommend) | H | 1 день |
| WB парсер (новый) | H | 3 дня |
| Ozon парсер (новый) | H | 3 дня |
| AI-анализ: тональность + темы + претензии | H | 2 дня |
| Алёрты (Telegram + Email) | M | 1 день |
| Экспорт: CSV + Excel + Markdown | M | 2 дня |

### Phase 2 — Layer 2: Prediction MVP (Неделя 5–7)

| Задача | Приоритет | Оценка |
|---|---|---|
| Sampling frame RU (12 сегментов) | H | 2 дня |
| Ensemble prompting модуль | H | 3 дня |
| Calibration на исторических данных | H | 2 дня |
| Prediction API endpoint | H | 1 день |
| Prediction UI (страница + форма + результат) | H | 2 дня |
| Первый пилотный кейс с клиентом | H | 1 день |

### Phase 3 — Layer 3: AI Perception (Неделя 8–9)

| Задача | Приоритет | Оценка |
|---|---|---|
| LLM audit cron (GPT-4o, YandexGPT, GigaChat) | H | 2 дня |
| Semantic diff + хранение | H | 1 день |
| Perception dashboard (chart + таблица) | M | 2 дня |
| Базовый PDF/web-отчёт | M | 1 день |

### Phase 4 — Полировка и лонч (Неделя 10–12)

| Задача | Приоритет |
|---|---|
| Monitoring: Health Check Service (парсеры) | H |
| White-label config (базовый уровень) | H |
| Advanced Scheduler (cron UI) | M |
| Webhooks для API-клиентов | M |
| Security audit + Sentry | H |
| Beta launch: 3–5 пилотных клиентов | H |
| Сбор валидационных данных (prediction ↔ реальность) | H |

---

## 11. Метрики успеха (KPI Horizon 1)

| KPI | Цель | Метод измерения |
|---|---|---|
| Платящих клиентов | 3–5 | Supabase Auth + billing |
| MRR | $1,500–3,000 | Выручка |
| Prediction accuracy | r ≥ 0.6 с реальными отзывами | Валидационные кейсы |
| Парсеров работает | WB + Ozon + Отзовик + Irecommend | Uptime метрики |
| Prediction latency | < 30 сек | P95 API метрика |
| Documented case study | 1+ | Опубликован в /docs |
| Investor pitch готов (обновлённый) | Да | nopoint review |

---

## 12. Риски

| Риск | Вероятность | Влияние | Митигация |
|---|---|---|---|
| WB/Ozon меняют anti-bot защиту | Высокая | Высокое | Proxy rotation, health check алёрты, быстрое фиксирование |
| LLM API недоступны (YandexGPT/GigaChat) | Средняя | Среднее | Fallback на GPT-4o, кэширование последних ответов |
| Prediction accuracy ниже ожиданий на RU-данных | Средняя | Высокое | Прозрачная calibration note, не обещать > r=0.75 на старте |
| Задержка Phase 1 (Electron → web сложнее) | Средняя | Среднее | Начать с API-first, UI — потом |
| OPS-TODO-01 не закрыт | Зависит от nopoint | Высокое для безопасности | Приоритет #1 перед деплоем |
| Puppeteer требует много RAM на Render | Средняя | Среднее | Мониторинг, апгрейд до $25 plan |

---

## 13. Открытые вопросы к nopoint

1. **Монетизация H1:** Freemium + paid tiers или сразу только paid? Какой минимальный план?
2. **Парсер приоритеты:** Если WB или Ozon займут дольше — что важнее для первых клиентов?
3. **Prediction калибровка:** Есть ли у первых клиентов исторические данные A/B-тестов для начальной калибровки?
4. **White-label:** Кто конкретный потенциальный white-label клиент? Под него настраиваем Phase 4.
5. **OPS-TODO-01:** Когда закрываем? Это blocker для продакшн-деплоя.

---

## Appendix: Pricing H1 (предварительно)

| Тариф | Цена | Что включено |
|---|---|---|
| **Starter** | $49/мес | 1 проект, 1 источник, 500 отзывов/мес, Layer 1 only |
| **Growth** | $149/мес | 5 проектов, 3 источника, 5K отзывов/мес, Layer 1 + 2 (50 predictions) |
| **Pro** | $299/мес | 10 проектов, все источники, 20K отзывов/мес, Layer 1+2+3, алёрты |
| **Agency** | $499/мес | Безлимит проектов, white-label, API, 100K отзывов/мес, все слои |

*Уточнить с nopoint перед продажей первых планов.*

---

*PRD создан Comet (Perplexity, L1) на основе технических документов Harkly, исследования по synthetic consumers/silicon sampling и анализа текущего MVP. Передать CTO для оценки и реализации.*
