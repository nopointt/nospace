# STATE — Provizor

## Position
- **Phase:** Unit Economics (APT-13) — сервис юнит-экономики, первый deliverable
- **Status:** Ресёрч завершён (3 SEED + 3 DEEP). Стек определён. Готов к реализации Phase 0.
- **Next:** Phase 0 — демо-калькулятор для встречи с Алимханом (2026-04-05)
- **Last session:** 2026-04-04 (Axis, session 231 — создание проекта + полный research cycle)
- **Sessions total:** 1

## Key Completions
- Вводные от nopoint собраны (5 голосовых → транскрипция → структура)
- 4 домена определены, 15 эпиков, ICE приоритизация
- Директория проекта + memory structure создана
- Стек определён: Bun + Hono + PostgreSQL + React 19 + TailAdmin + Recharts
- 6 research файлов (~3,500+ строк): 3 SEED + 3 DEEP
- DEEP-0: 40 формул, 12 таблиц PostgreSQL, 4-уровневая UI иерархия — implementation-ready
- DEEP-1: госреестр найден (ndda.kz + api.dari.kz), KZ регуляция полностью смоделирована
- DEEP-3: конкурентный аудит — мультиканальная маржа = confirmed white space
- Мультиканальная маржа = подтверждённый дифференциатор (0 из 6 конкурентов)

## Active Decisions
- D-01: Проект = автоматизация аптечной сети Алимхана (5 аптек, Казахстан)
- D-02: Стратегия = MLP на данных Алимхана → отладить → продавать другим аптекам как SaaS
- D-03: Хостинг = текущий Hetzner VPS рядом с Contexter
- D-04: Scratch type = session-scratch.md (как Contexter)
- D-05: Конституция = позже
- D-06: Telegram-бот = Care as a Service (личный фармацевт-терапевт)
- D-07: 4 домена: бот (клиентский), аналитика ассортимента, ценообразование, unit-экономика
- D-08: Стек = Bun + Hono + PostgreSQL + React 19 + TailAdmin + Recharts
- D-09: Hero metric = CIS Profitability % (F-18), не Gross Margin
- D-10: ICE приоритизация: APT-13 → APT-01 → APT-02
- D-11: 1С интеграция через OData/HTTP Services, batch hourly sync
- D-12: Госреестр предельных цен = ndda.kz + api.dari.kz (JSON API)
- D-13: OTC деругулируются с июля 2025 (5,936 → 5,408 регулируемых SKU)

## Blockers
- Нет доступа к данным Алимхана (1С, прайсы, ассортимент) — action item для встречи
- Нет Telegram Bot Token
- Неизвестна доля OSMS/регулируемых SKU в выручке Алимхана (главный unknown для точной модели)
- Комиссии Wolt Apteka не подтверждены (оценка ~25-30%)

## Deferred
- Конституция проекта
- Система лояльности (баллы)
- Авто-вызов курьера
- Камера + Vision на кассу (анти-воровство)
- Подписка на курсовые препараты

## Metrics
- Sessions: 1
- Аптеки: 5 (сеть Алимхана)
- Оффлайн трафик: 200 входящих/день → 70-150 продаж (1 аптека)
- Halyk Market: ~43 продажи/день (1 аптека)
- Wolt Apteka: данные уточнить
- iTeka WhatsApp: ~30 обращений/день (1 аптека)
- Ассортимент: 6-7 тысяч позиций
