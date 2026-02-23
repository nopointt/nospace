# Спецификация: Реализация функций для фаундеров

## Overview

На основе вопросов фаундеров необходимо реализовать:
1. Мониторинг изменений верстки
2. Систему алертов
3. White-label конфигурацию
4. Метрики качества данных
5. Экспорт в разные форматы

---

## 1. Monitoring & Alerting System

### Цель
Автоматическое обнаружение изменений на сайтах-источниках и уведомление команды.

### Компоненты

#### 1.1 Health Check Service
```typescript
// services/health-monitor.ts
export class HealthMonitorService {
  async checkSource(source: string, testUrl: string): Promise<HealthStatus> {
    // 1. Попытка парсинга тестовой страницы
    // 2. Проверка селекторов
    // 3. Валидация структуры данных
    // 4. Запись метрик
  }
}
```

**Функционал:**
- [ ] Проверка каждые 6 часов
- [ ] Тестовые страницы для каждого источника
- [ ] Проверка 5 ключевых селекторов
- [ ] Запись результатов в БД

#### 1.2 Alerting System
```typescript
// services/alerts.ts
export class AlertService {
  async sendAlert(type: 'critical' | 'warning', message: string): Promise<void> {
    // Отправка в Telegram/Email
  }
}
```

**Интеграции:**
- [ ] Telegram Bot API
- [ ] Email (SMTP)
- [ ] Webhook (для клиентов)

**Триггеры:**
- 3 ошибки подряд → Critical Alert
- Изменение структуры HTML → Warning
- Длительный downtime (> 1 час) → Critical

#### 1.3 Dashboard
- [ ] Web UI со статусом всех источников
- [ ] Графики uptime
- [ ] История изменений

---

## 2. Data Quality Metrics

### Цель
Валидация полноты и качества собранных данных.

### Метрики

#### 2.1 Completeness Check
```typescript
// services/quality-checker.ts
export class QualityChecker {
  async checkCompleteness(jobId: string): Promise<CompletenessReport> {
    // 1. Сравнение count на сайте vs собрано
    // 2. Проверка пагинации (все страницы?)
    // 3. Проверка на дубликаты
    // 4. Валидация обязательных полей
  }
}
```

**Проверки:**
- [ ] Все страницы обработаны
- [ ] Нет дубликатов (по external_id)
- [ ] Все обязательные поля заполнены
- [ ] Рейтинг в диапазоне 1-5

#### 2.2 Freshness Check
```typescript
async checkFreshness(jobId: string): Promise<FreshnessReport> {
  // Проверка даты последнего отзыва
  // Сравнение с текущей датой
}
```

**Критерии:**
- [ ] Последний отзыв не старше 7 дней (для активных источников)
- [ ] Дата парсинга vs дата отзыва (разница < 24 часов)

#### 2.3 Quality Score
```typescript
interface QualityScore {
  completeness: number; // 0-100
  freshness: number;    // 0-100
  accuracy: number;     // 0-100
  overall: number;      // weighted average
}
```

---

## 3. Multi-Format Export

### Цель
Экспорт данных в различные форматы для клиентов.

### Форматы

#### 3.1 CSV Export
```typescript
// services/export/csv-export.ts
export class CsvExporter {
  async exportToCsv(reviews: Review[]): Promise<Buffer> {
    // CSV с заголовками
    // UTF-8 с BOM для Excel
  }
}
```

**Поля:**
- id, external_id, title, text, rating, author, date, source_url

#### 3.2 Excel Export
```typescript
export class ExcelExporter {
  async exportToExcel(data: ExportData): Promise<Buffer> {
    // XLSX с форматированием
    // Несколько листов (Reviews, Stats)
  }
}
```

**Фичи:**
- [ ] Фильтры
- [ ] Сводная таблица
- [ ] Графики

#### 3.3 Markdown Export (RAG-ready)
```typescript
export class MarkdownExporter {
  async exportToMarkdown(reviews: Review[]): Promise<string> {
    // Структурированный Markdown
    // Заголовки, метаданные
    // Готов для RAG/LLM
  }
}
```

**Формат:**
```markdown
# Отзывы: [Product Name]

## Review #1
**Автор:** John Doe
**Рейтинг:** 5/5
**Дата:** 2024-01-15

Текст отзыва...

---
```

#### 3.4 API Endpoints
```typescript
// routes/export.ts
router.get('/jobs/:id/export/:format', async (req, res) => {
  // format: csv, xlsx, md, json
  // Возврат файла
});
```

---

## 4. White-Label Configuration

### Цель
Возможность использования под брендом клиента.

### Конфигурация

#### 4.1 Branding Config
```typescript
// config/white-label.ts
interface WhiteLabelConfig {
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  apiDomain: string;
  emailDomain: string;
  hidePoweredBy: boolean;
}
```

#### 4.2 API Customization
- [ ] Custom rate limits
- [ ] Custom endpoints naming
- [ ] Custom error messages

#### 4.3 Documentation
- [ ] White-label API docs (Swagger)
- [ ] Custom README
- [ ] Branded SDK

---

## 5. Advanced Scheduler

### Цель
Гибкое планирование задач скрапинга.

### Функционал

#### 5.1 Cron Scheduler
```typescript
interface ScheduleConfig {
  jobId: string;
  cronExpression: string; // "0 9 * * *" (9:00 daily)
  timezone: string;       // "Europe/Moscow"
  enabled: boolean;
}
```

#### 5.2 Smart Scheduling
- [ ] Не парсить ночью (если не нужно)
- [ ] Проверять перед парсингом (не изменилось ли)
- [ ] Backoff при ошибках

#### 5.3 Webhook Integration
```typescript
interface WebhookConfig {
  url: string;
  events: ('job.completed' | 'job.failed' | 'review.new')[];
  secret: string; // для подписи
}
```

---

## Implementation Plan

### Phase 1: Core Monitoring (Неделя 1)
- [ ] Health Check Service
- [ ] Telegram alerts
- [ ] Dashboard UI

### Phase 2: Quality Metrics (Неделя 2)
- [ ] Completeness checker
- [ ] Freshness validation
- [ ] Quality scoring

### Phase 3: Export Formats (Неделя 3)
- [ ] CSV exporter
- [ ] Excel exporter
- [ ] Markdown exporter
- [ ] API endpoints

### Phase 4: White-Label (Неделя 4)
- [ ] Config system
- [ ] Custom domains
- [ ] Branded docs

### Phase 5: Advanced Features (Неделя 5)
- [ ] Cron scheduler
- [ ] Webhooks
- [ ] Smart scheduling

---

## Технический стек

**Monitoring:**
- Health checks: Node-cron
- Alerts: node-telegram-bot-api, nodemailer
- Dashboard: Next.js + Recharts

**Export:**
- CSV: fast-csv
- Excel: xlsx
- Markdown: marked

**White-Label:**
- Config: Environment variables + DB
- Custom domains: Cloudflare
- Docs: Swagger UI + custom CSS

---

## Оценка

| Компонент | Время | Сложность |
|-----------|-------|-----------|
| Monitoring | 16 часов | Средняя |
| Quality Metrics | 12 часов | Низкая |
| Export Formats | 8 часов | Низкая |
| White-Label | 20 часов | Высокая |
| Scheduler | 12 часов | Средняя |
| **Итого** | **68 часов** | **~9 дней** |

---

## Следующий шаг

Готов начать реализацию? Рекомендую начать с **Monitoring** (критично для фаундеров).
