# STATE — Provizor

## Position
- **Phase:** Unit Economics (APT-13) — сервис юнит-экономики, первый deliverable
- **Status:** V1 demo built (light theme). V2 = полный редизайн под TrueProfit.
- **Next:** V2 — from scratch, dark theme, sidebar, TrueProfit-style Dashboard + P&L + Product Analytics
- **Last session:** 2026-04-04 (Axis, session 232 — v1 demo + competitive research + TrueProfit UI audit)
- **Sessions total:** 2

## Key Completions
- Вводные от nopoint собраны (5 голосовых → транскрипция → структура)
- 4 домена определены, 15 эпиков, ICE приоритизация
- Директория проекта + memory structure создана
- Стек определён: Bun + Hono + PostgreSQL + React 19 + Tailwind CSS 4 + Recharts
- 8 research файлов (~5,000+ строк): 3 SEED + 4 DEEP + 1 global
- DEEP-0: 40 формул, 12 таблиц PostgreSQL, 4-уровневая UI иерархия — implementation-ready
- DEEP-1: госреестр найден (ndda.kz + api.dari.kz), KZ регуляция полностью смоделирована
- DEEP-3: конкурентный аудит — мультиканальная маржа = confirmed white space
- DEEP-4: UX Review Analysis — 12 отзывов, 5 категорий болей, pain taxonomy
- DEEP-5: Global Unit Economics — 10 сервисов, positioning matrix
- Мультиканальная маржа = подтверждённый дифференциатор (0 из 7 конкурентов)
- V1 demo SPA built: React 19 + Vite + Tailwind CSS 4 + Recharts
- Code: `apps/demo/` — builds, runs on localhost:5173
- 6 tabs: Overview, Рентабельность, P&L, Наценки КЗ, Каналы, Roadmap
- Dashboard-first UX (inputs collapsed, results immediate)
- Insights blocks (actionable recommendations)
- SmartApteka 2025 presentation analyzed (28 slides)
- TrueProfit UI fully audited (30 screenshots + HTML saved)

## V2 Direction — TrueProfit-inspired redesign

**Reference material:**
- TrueProfit screenshots: `C:\Users\noadmin\Documents\ShareX\Screenshots\2026-04\chrome_*.png` (30 files)
- TrueProfit HTML: `C:\Users\noadmin\Desktop\trueprofit\` (Dashboard, P&L Report, Product Analytics, Marketing Attribution, Customer Lifetime Value, Exports — each .html + _files/)
- SmartApteka slides: `C:\Users\noadmin\Downloads\smartapteka_slides\slide_01.png` through `slide_28.png`
- SmartApteka PDF: `C:\Users\noadmin\Downloads\Презентация СмартАптека 2025.pdf`

**V2 design spec (from TrueProfit audit):**
- Dark theme: navy background (#0f172a), teal cards (#1e293b), white text
- Sidebar navigation (not tabs): Dashboard, Product Analytics, P&L Report, Каналы, Наценки, Roadmap
- Store switcher dropdown (Аптека 1 / Все аптеки / Сеть)
- Metric cards: large numbers + % delta vs benchmark (green ↗ / red ↘)
- Performance chart: combo bar + line (Revenue bars + Net Margin line)
- Cost Breakdown: donut chart (COGS, ФОТ, Аренда, Коммуналка, Маркетинг)
- P&L table: аптеки как колонки (1,2,3,4,5) + Total (TrueProfit uses days)
- Product Analytics: per-SKU table with search, filters, customizable columns
- Compare: Previous Period button in header
- Filters modal, Customize modal, Custom Metric builder (Phase 2+)
- V1 code stays as `apps/demo/`, V2 = new app (from scratch)

**What NOT to copy from TrueProfit:**
- Marketing Attribution (аптеки не имеют ad spend)
- LTV:CAC ratio (walk-in клиенты, нет CAC)
- Ad Spend by Channel (нет рекламных каналов)

**What to keep from Provizor domain:**
- CIS Profitability (hero metric — 0 конкурентов)
- Multichannel margin (offline vs Halyk vs Wolt vs iTeka — 0 конкурентов)
- KZ regressive markup scale (regulatory)
- Pharmacy benchmarks (DEEP-0 section 6E)
- Insights/recommendations blocks

## Active Decisions
- D-01: Проект = автоматизация аптечной сети Алимхана (5 аптек, Казахстан)
- D-02: Стратегия = MLP на данных Алимхана → отладить → продавать другим аптекам как SaaS
- D-03: Хостинг = текущий Hetzner VPS рядом с Contexter
- D-04: Scratch type = session-scratch.md (как Contexter)
- D-05: Конституция = позже
- D-06: Telegram-бот = Care as a Service (личный фармацевт-терапевт)
- D-07: 4 домена: бот (клиентский), аналитика ассортимента, ценообразование, unit-экономика
- D-08: Стек = Bun + Vite + React 19 + Tailwind CSS 4 + Recharts (no TailAdmin)
- D-09: Hero metric = CIS Profitability % (F-18), не Gross Margin
- D-10: ICE приоритизация: APT-13 → APT-01 → APT-02
- D-11: 1С интеграция через OData/HTTP Services, batch hourly sync
- D-12: Госреестр предельных цен = ndda.kz + api.dari.kz (JSON API)
- D-13: OTC деругулируются с июля 2025 (5,936 → 5,408 регулируемых SKU)
- D-14: V2 = TrueProfit-style dark theme UI, from scratch, V1 stays as-is
- D-15: TrueProfit = design reference (UI only, не бизнес-логика)

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

## Research Files
| File | Content |
|---|---|
| `docs/research/provizor-seed-ue-frameworks.md` | SEED 1: Frameworks, Metrics & Formulas |
| `docs/research/provizor-seed-analytics-tools.md` | SEED 2: Analytics Tools & Ready Models |
| `docs/research/provizor-seed-business-logic.md` | SEED 3: Business Logic & Decision-Making |
| `docs/research/provizor-deep-ue-model.md` | DEEP-0: Complete Formula Model (40 формул, 12 таблиц PG, UI hierarchy) |
| `docs/research/provizor-deep-kz-regulation.md` | DEEP-1: KZ Price Regulation Impact Modeling |
| `docs/research/provizor-deep-competitive-audit.md` | DEEP-3: Competitive Audit (7 CIS products) |
| `docs/research/provizor-deep-ux-reviews.md` | DEEP-4: UX Review Analysis (12 reviews, pain taxonomy) |
| `docs/research/provizor-deep-global-unit-economics.md` | DEEP-5: Global Unit Economics Services (top 10, positioning) |

## Metrics
- Sessions: 2
- Аптеки: 5 (сеть Алимхана)
- Оффлайн трафик: 200 входящих/день → 70-150 продаж (1 аптека)
- Halyk Market: ~43 продажи/день (~960/мес)
- Wolt Apteka: данные уточнить
- iTeka WhatsApp: ~30 обращений/день (1 аптека)
- Ассортимент: 6-7 тысяч позиций
- Research files: 8 (~5,000+ строк)
- V1 demo: 15 source files, builds in 500ms
