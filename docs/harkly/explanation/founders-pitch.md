# Harkly - Предложение для Партнерства

## Executive Summary

**Harkly** — API-платформа для автоматического сбора и анализа отзывов с e-commerce площадок.

**Статус:** MVP готов к деплою
**Время до production:** 1-2 недели
**Инвестиции на старт:** $0 (инфраструктура) + 4-6 недель разработки

---

## Что уже работает ✅

### Технология
- **API** на Node.js + Express
- **Скрапинг** с Otzovik.ru и Irecommend.ru
- **Очереди** BullMQ + Redis для background jobs
- **База данных** PostgreSQL (Supabase) с RLS
- **CLI** для управления
- **Docker** + готовый деплой на Render

### Функционал
- [x] Создание проектов мониторинга
- [x] Запуск scraping jobs через API
- [x] Сбор отзывов с пагинацией
- [x] Хранение в PostgreSQL
- [x] REST API для доступа к данным
- [x] Progress tracking (real-time)
- [x] Stealth-техники (обход базовых защит)

### Инфраструктура
- [x] Supabase (PostgreSQL + Auth) — настроено
- [x] Upstash Redis — настроено
- [x] Render blueprint — готов к деплою
- [x] CI/CD pipeline — готов

---

## Архитектура

```
[Клиент] → [API (Render)] → [PostgreSQL (Supabase)]
                ↓
         [Redis Queue (Upstash)]
                ↓
         [Worker (Render)] → [Puppeteer] → [Сайты]
```

**Техстек:**
- Node.js 20 + TypeScript
- Express.js + Zod (валидация)
- Puppeteer + Stealth Plugin
- BullMQ (очереди)
- Supabase (PostgreSQL)
- Docker

---

## Стоимость инфраструктуры

| Компонент | Free Tier | Production |
|-----------|-----------|------------|
| **Render API** | $0 (cold starts) | $7/мес |
| **Render Worker** | $0 (cold starts) | $7/мес |
| **Supabase DB** | $0 (500MB) | $0-25/мес |
| **Upstash Redis** | $0 (10k/day) | $0-10/мес |
| **Итого** | **$0/мес** | **$14-50/мес** |

---

## Бизнес-модель

### Целевые клиенты
1. **Маркетинговые агентства** (monitoring брендов)
2. **E-commerce компании** (анализ конкурентов)
3. **Аналитические платформы** (data feed)
4. **Enterprise** (кастомные интеграции)

### Модели монетизации

| Модель | Цена | Для кого |
|--------|------|----------|
| **Per Project** | $50-200 | Разовые задачи |
| **Subscription** | $49-299/мес | Постоянный мониторинг |
| **Per Volume** | $0.01-0.05/отзыв | Высокие объемы |
| **Enterprise** | от $500/мес | SLA, on-premise |

### Unit-экономика
- **Себестоимость**: $14-50/мес на сервер
- **Цена клиента**: $49-500/мес
- **Маржинальность**: 70-95%

---

## Roadmap

### Phase 1: Deploy & Validate (Неделя 1-2)
- [ ] Деплой на Render
- [ ] Smoke tests
- [ ] Доступ для фаундеров
- [ ] Документация API

**Результат**: Работающий MVP с доступом по API

### Phase 2: Core Sources (Неделя 3-4)
- [ ] Yandex.Market (16 часов)
- [ ] Wildberries (20 часов)
- [ ] Ozon (16 часов)

**Результат**: 4-5 основных источников, покрытие 80% рынка

### Phase 3: Enterprise Features (Неделя 5-6)
- [ ] Monitoring & Alerts
- [ ] Data Quality Metrics
- [ ] Multi-format Export (CSV, Excel)
- [ ] Webhooks

**Результат**: Enterprise-ready, SLA 99%

### Phase 4: Scale (Неделя 7-8)
- [ ] 10+ источников
- [ ] 100,000+ отзывов/день
- [ ] Performance optimization
- [ ] Multi-region

**Результат**: Масштабируемая платформа

### Phase 5: White-Label (Неделя 9-12)
- [ ] Custom domains
- [ ] Branded API
- [ ] Partnership integrations
- [ ] Legal compliance

**Результат**: Готовность к enterprise продажам

**Итого: 3 месяца до production-ready**

---

## Конкурентные преимущества

1. **Технология**
   - Stealth scraping (обход защит)
   - Real-time очереди (BullMQ)
   - Масштабируемая архитектура

2. **Гибкость**
   - API-first (любые интеграции)
   - On-premise опция (контроль данных)
   - White-label ready

3. **Скорость**
   - MVP готов (1-2 недели до запуска)
   - Быстрое добавление источников (16-20ч)
   - Готовый деплой

4. **Стоимость**
   - Низкие операционные расходы ($14/мес старт)
   - Open-source core (MIT license)
   - Эффективное использование ресурсов

---

## Метрики для отслеживания

### Технические
- **Uptime**: > 99%
- **Response time**: < 500ms
- **Scraping speed**: 300-500 страниц/час
- **Data completeness**: > 98%

### Бизнес
- **MRR** (Monthly Recurring Revenue)
- **CAC** (Customer Acquisition Cost)
- **LTV** (Lifetime Value)
- **Churn rate** (< 5% целевой)

---

## Требования от партнеров

### Что нужно от вас:
1. **Доступ к клиентам** — пилотные проекты для валидации
2. **Feedback** — приоритизация фич
3. **Продажи** — маркетинг и привлечение клиентов
4. **Инвестиции** — 4-6 недель разработки (или готовый MVP деплой)

### Что мы предоставляем:
1. **Технология** — полностью готовая платформа
2. **Разработка** — поддержка и доработки
3. **Инфраструктура** — настройка и maintenance
4. **Документация** — API docs, примеры

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Сайты меняют защиту | Высокая | Monitoring, быстрый фикс (24ч) |
| Блокировка IP | Средняя | Прокси, ротация |
| Низкий спрос | Средняя | Early validation с пилотами |
| Конкуренты | Низкая | Фокус на качестве и поддержке |

---

## Следующие шаги

### Immediate (Эта неделя):
1. ✅ Деплой MVP на Render
2. ✅ Тестовый доступ для фаундеров
3. ✅ Первый тестовый scraping

### Short-term (2-4 недели):
1. Добавление Yandex.Market + Wildberries
2. Первые пилотные клиенты
3. Feedback и итерации

### Mid-term (2-3 месяца):
1. Enterprise features
2. White-label
3. Scale до 10+ источников

---

## Контакты

**Технический директор**: [Ваше имя]
**Email**: [email]
**Telegram**: [@username]
**API Docs**: https://docs.harkly.io
**Demo**: https://harkly-api-xxx.onrender.com/health

---

## Приложения

1. `ROADMAP.md` — Детальный план развития
2. `SOURCES.md` — Список источников с оценками
3. `DEPLOY-CHECKLIST.md` — Чеклист деплоя
4. `API-DOCS.md` — Документация API

---

**Готовы к сотрудничеству?** 🚀

Мы предоставляем технологию, вы — рынок и клиентов.
Вместе строим лидера в нише scraping и аналитики отзывов.
