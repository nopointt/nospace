# OSINT CX Pipeline: Гайд №3 — Автоматизированный Стек

Автоматизированный OSINT-пайплайн для CX-исследований — это **ETL-система с разведывательным слоем**: он собирает сигналы из публичных источников, нормализует их, классифицирует через LLM и передаёт в аналитику. Индустриальный стандарт 2025–2026 сочетает Python-оркестрацию, специализированные коллекторы и многоуровневую LLM-классификацию. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

***

## Архитектура Пайплайна: 5 Слоёв

Профессиональный пайплайн состоит из пяти независимых, но связанных слоёв: [emergentmind](https://www.emergentmind.com/topics/multi-stage-llm-based-classification-pipeline)

```
[ИСТОЧНИКИ] → [КОЛЛЕКТОРЫ] → [НОРМАЛИЗАЦИЯ] → [LLM-КЛАССИФИКАЦИЯ] → [ХРАНИЛИЩЕ + АНАЛИТИКА]
```

Каждый слой — это отдельный сервис с чёткой ответственностью. Это позволяет заменять компоненты без переписывания всей системы и масштабировать узкие места независимо.

***

## Слой 1: Коллекторы — Сбор Данных

Источники CX-сигналов делятся на три класса с разными методами сбора: [github](https://github.com/joestanding/osint-analyser)

**Класс A — Официальные API.** Структурированные данные с минимальными юридическими рисками. Reddit (PRAW / официальный Reddit API v2), App Store и Google Play (AppFollow API или itunes-scraper), Twitter/X API (Academic Research Access или Apify-скраперы), YouTube Data API v3 для комментариев.

**Класс B — Скрапинг публичных страниц.** Используй Playwright (headless браузер для динамического контента) или HTTPX + BeautifulSoup4 для статических страниц. Целевые источники: Trustpilot, G2, Glassdoor, Indeed Reviews, Product Hunt, LinkedIn публичные посты.

**Класс C — Потоковый мониторинг.** Snscrape или Apify для периодического краулинга по ключевым словам. Brand24 API или Talkwalker API как managed-решение если бюджет позволяет. [talkwalker](https://www.talkwalker.com/blog/best-osint-tools)

Коллекторы Класса A — **первый приоритет**: официальный API = стабильно, легально, воспроизводимо. Классы B и C добавляются по необходимости.

***

## Слой 2: Нормализация — Единая Схема

Критически важный этап, который чаще всего игнорируют. Каждый источник даёт разные форматы — отзыв с Trustpilot и пост с Reddit нельзя класть в одну таблицу без унификации. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

Универсальная схема сигнала для CX:

```json
{
  "signal_id": "uuid",
  "source": "reddit | trustpilot | glassdoor | ...",
  "signal_type": "review | post | comment | reply",
  "content": "raw text",
  "author_id": "hashed",
  "platform_score": 4.5,
  "date": "ISO 8601",
  "url": "permalink",
  "metadata": {
    "upvotes": 142,
    "verified_purchase": true,
    "language": "en"
  },
  "labels": {}  // заполняется на этапе классификации
}
```

Инструмент: **Pydantic v2** для валидации схемы на входе — отклоняет невалидные записи и логирует их отдельно, не ломая пайплайн.

***

## Слой 3: LLM-Классификация — Сердце Пайплайна

Это самый архитектурно сложный слой. Индустриальный стандарт — **многоуровневый каскадный классификатор**, где каждый уровень отвечает за одну задачу классификации. [emergentmind](https://www.emergentmind.com/topics/multi-stage-llm-based-classification-pipeline)

Принцип каскада: **быстрая/дешёвая модель фильтрует большинство, дорогая модель получает только сложные случаи**. Это даёт до 90-кратной экономии на стоимости инференса при сохранении точности. [emergentmind](https://www.emergentmind.com/topics/multi-stage-llm-based-classification-pipeline)

**Уровень 1 — Грубая фильтрация (fast model, embedding-based).**
Убрать нерелевантный шум: спам, рекламу, off-topic контент. Инструмент: sentence-transformers (`all-MiniLM-L6-v2`) + cosine similarity threshold. Скорость: тысячи записей в секунду на CPU.

**Уровень 2 — Тематическая классификация (small LLM).**
Определить: к какому аспекту CX относится сигнал (onboarding / pricing / support / product / UX / delivery). Модель: `GPT-4o mini` — 2M токенов в минуту, в 25× дешевле GPT-4. Или локально: `Mistral-7B-Instruct` через Ollama. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

**Уровень 3 — Глубокий анализ (full LLM, только на отобранных).**
Для сигналов с высокой информативностью: sentiment (positive / negative / neutral / mixed), CJM-этап (awareness / onboarding / activation / retention / churn), тип (жалоба / восторг / предложение / вопрос / сравнение с конкурентом), JTBD-экстракция. Модель: `GPT-4o` или `Claude 3.5 Sonnet`. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

Архитектурный паттерн Microsoft Semantic Telemetry — объединяй несколько классификаторов в **один промпт** для снижения расхода токенов, но мониторь деградацию точности: при батч-классификации 10 записей одновременно 15–20% ассайнов меняются между прогонами. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

***

## Слой 4: Оркестрация и Инфраструктура

Стандарт индустрии для оркестрации ETL-пайплайнов с LLM: [reddit](https://www.reddit.com/r/Hacking_Tutorials/comments/1p74lyd/finally_automated_my_entire_osint_recon_workflow/)

**Apache Airflow** (или его cloud-managed аналог **Astronomer**) — планировщик задач, DAG-модель, встроенный retry, логирование. Для небольших объёмов достаточно **Prefect** — проще в деплое, нативная поддержка Python async.

**Celery + Redis** — для асинхронной очереди задач коллекторов. Каждый коллектор запускается как независимый worker, результат кладётся в очередь.

**Управление параллелизмом LLM-вызовов** — critical для экономии. Паттерн Microsoft: динамическое управление concurrency на основе success/failure rate и latency. При росте latency — снижать параллелизм, при стабильной работе — наращивать. Exponential backoff на все retry. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

***

## Слой 5: Хранилище и Аналитика

Двухуровневая модель хранения: [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

**Raw layer (object storage):** S3 / Cloudflare R2 — хранить исходные сигналы в Parquet-формате. Дёшево, неизменяемо, позволяет перекласифицировать при изменении схемы меток без повторного сбора.

**Analytical layer (OLAP):** DuckDB (локально, встроенный в Python, zero-ops) или ClickHouse (для высоких объёмов) — columnar storage для быстрых агрегаций по сентименту, источнику, дате, теме.

**Visualisation:** Apache Superset (open-source) или Metabase — дашборды поверх DuckDB/ClickHouse без написания UI.

***

## Полный Стек: Референс

| Слой | Инструмент | Альтернатива | Зачем |
|---|---|---|---|
| Коллектор API | PRAW, HTTPX | Apify, ScrapingBee | Сбор данных |
| Headless браузер | Playwright | Selenium | Динамические страницы |
| Валидация | Pydantic v2 | Marshmallow | Схема сигнала |
| Очередь задач | Celery + Redis | RQ, Dramatiq | Async workers |
| Оркестрация | Prefect / Airflow | Dagster | DAG, планировщик |
| Фильтрация (быстро) | sentence-transformers | FastText | L1 классификация |
| Классификация LLM | GPT-4o mini / Mistral-7B | Claude Haiku | L2–L3 анализ |
| Промпт-менеджмент | Prompty / LangChain | DSPy | Версионирование промптов |
| Raw storage | Cloudflare R2 / S3 | MinIO (local) | Parquet-архив |
| OLAP | DuckDB | ClickHouse | Аналитические запросы |
| Дашборды | Metabase | Apache Superset | Visualisation |

 [reddit](https://www.reddit.com/r/Hacking_Tutorials/comments/1p74lyd/finally_automated_my_entire_osint_recon_workflow/)

***

## Инновационный Слой: Что Уже В Продакшне

Передний край за пределами стандарта — три паттерна, которые появились в 2024–2025: [emergentmind](https://www.emergentmind.com/topics/multi-stage-llm-based-classification-pipeline)

**Agentic pipeline construction.** Вместо hard-coded DAG — LLM-агент, который сам составляет план пайплайна на основе задачи: какие источники собирать, какие классификаторы запускать, какую схему меток использовать. Frameworks: LangGraph, CrewAI. Прототипы показывают 100% pipeline runnability на 14 датасетах. [emergentmind](https://www.emergentmind.com/topics/multi-stage-llm-based-classification-pipeline)

**Embedding-based classifier вместо LLM-вызовов.** Для высоких объёмов: один раз получить embedding через `text-embedding-3-large`, затем прогнать через обученный MLP для каждого классификатора. Экономия — в 10–50× по стоимости. Компромисс: ниже точность, требует GPU для инференса и переобучения при смене схемы меток. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)

**Prompt compression (LLMLingua).** Автоматическое сжатие промптов с сохранением смысла — снижает TPM-нагрузку на 30–40% на длинных контекстах. Применимо когда промпт + сигнал превышает 2K токенов. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)
**Prompt compression (LLMLingua).** Автоматическое сжатие промптов с сохранением смысла — снижает TPM-нагрузку на 30–40% на длинных контекстах. Применимо когда промпт + сигнал превышает 2K токенов. [microsoft](https://www.microsoft.com/en-us/research/blog/technical-approach-for-classifying-human-ai-interactions-at-scale/)