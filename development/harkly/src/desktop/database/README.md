# Phase 1: Database Setup

Схема Supabase для Harkly.

## Структура

```
database/
├── supabase-schema.sql      # Основная схема
├── supabase-seed.sql        # Тестовые данные
├── .env.example             # Пример переменных окружения
└── README.md               # Этот файл
```

## Применение схемы

### Шаг 1: Открыть SQL Editor в Supabase

1. Перейди в Supabase Dashboard
2. Выбери проект
3. SQL Editor → New query
4. Вставь содержимое `supabase-schema.sql`
5. Нажми Run

### Шаг 2: Проверить таблицы

После применения должны появиться таблицы:

- `profiles` — профили пользователей
- `projects` — проекты
- `scraping_jobs` — задачи парсинга
- `reviews` — отзывы
- `proxy_settings` — настройки прокси

### Шаг 3: Проверить RLS

Включи RLS для всех таблиц:

```sql
-- Убедись что RLS включен
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_settings ENABLE ROW LEVEL SECURITY;
```

### Шаг 4: Добавить тестовые данные (опционально)

```sql
-- Замени 'your-user-uuid-here' на реальный UUID из auth.users
-- Затем запусти supabase-seed.sql
```

## Переменные окружения

Создай файл `.env` в корне проекта:

```bash
# Скопируй из .env.example
cp database/.env.example .env

# Заполни реальными значениями
# SUPABASE_SERVICE_ROLE_KEY — берется из Settings -> API в Supabase
```

## Таблицы

### profiles
Расширение auth.users. Создается автоматически при регистрации.

### projects
Проекты пользователей для организации задач.

Колонки:
- `id` — UUID
- `user_id` — владелец
- `name` — название
- `description` — описание
- `source_type` — otzovik/irecomend/other
- `status` — active/archived/deleted

### scraping_jobs
Задачи парсинга с прогрессом.

Колонки:
- `id` — UUID
- `project_id` — проект
- `url` — URL для парсинга
- `status` — pending/running/completed/failed
- `max_pages` — макс. страниц
- `progress` — JSON с прогрессом
- `total_reviews` — найдено отзывов
- `parsed_reviews` — спарсено
- `error_message` — ошибка
- `started_at` — время старта
- `completed_at` — время завершения

### reviews
Отзывы из разных источников.

Колонки:
- `id` — UUID
- `job_id` — задача
- `source` — otzovik/irecomend/other
- `external_id` — ID на источнике
- `source_url` — URL отзыва
- `title` — заголовок
- `text` — текст
- `rating` — оценка (1-5)
- `author` — автор
- `review_date` — дата отзыва
- `search_vector` — для полнотекстового поиска

## RLS Policies

Все таблицы защищены RLS. Пользователь видит только свои данные.

## Realtime

Таблицы `scraping_jobs` и `reviews` настроены для Realtime.

Подписка в клиенте:

```typescript
const channel = supabase
  .channel('jobs')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'scraping_jobs'
  }, (payload) => {
    console.log('Job updated:', payload)
  })
  .subscribe()
```

## Полезные запросы

```sql
-- Список проектов пользователя
SELECT * FROM projects 
WHERE user_id = auth.uid();

-- Статистика по проекту
SELECT 
  p.name,
  COUNT(j.id) as total_jobs,
  SUM(j.parsed_reviews) as total_reviews
FROM projects p
LEFT JOIN scraping_jobs j ON p.id = j.project_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name;

-- Поиск отзывов
SELECT * FROM reviews
WHERE search_vector @@ plainto_tsquery('russian', 'хороший товар');

-- Активные задачи
SELECT * FROM scraping_jobs
WHERE status = 'running';
```

## Миграции

Для production используй Supabase CLI:

```bash
# Установка
npm install -g supabase

# Инициализация
supabase init

# Создать миграцию
supabase db diff -f initial_schema

# Применить
supabase db push
```

## Следующий шаг

После применения схемы переходи к **Phase 2: Backend API**.
