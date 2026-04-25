# STATE — Provizor

## Position
- **Phase:** APT-02 WhatsApp Bot MVP (Domain 1 full focus)
- **Status:** Research COMPLETE (SEED + 5 DEEP). Ready for implementation.
- **Next:** Документы ТОО от Алимхана → Meta Registration (параллельно) → Bot Development (1-2 недели)
- **Parked:** APT-16 (Finmodel Polish) — ⏸ PAUSED
- **Last session:** 2026-04-05 (Axis, session 7 — pivot WhatsApp, meeting Алимхан, 6 researches, briefing PDF v2)
- **Sessions total:** 7

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
- V2 built: `apps/v2/` — 17 source files, 2537 lines, 550ms build
- V2 pages: Dashboard (9 metric cards + charts + summaries), P&L (expandable + по аптекам/месяцам + CSV), SKU Analytics (pagination + column customize + CSV), Channels, Markup, Roadmap
- V2 UX: dark navy theme, sidebar nav, pharmacy switcher, date range picker (6 presets), notification bell, user profile dropdown, action menus, horizontal scroll
- V1 deprecated (D-16), V2 = основной
- APT-13 CLOSED (session 6): full audit passed, remaining items → APT-16
- APT-16 created: UX/UI/Code audit (48 checklist items) + visual polish + deploy + functional gaps
- APT-10 CLOSED (session 6): Дефектура + Оборачиваемость pages + RoadmapPage rewrite + Deploy CF Pages
- V2 deployed: https://provizor.contexter.cc (CF Pages + CNAME + SSL)
- Info tooltips added to all 13 metric cards across 3 pages
- "К выводу (FCFE)" metric added to Dashboard (Net Profit + Depreciation)
- CIS Profitability renamed → "Рентабельность (РВС)"
- **Session 7 (2026-04-05):** Pivot Telegram → WhatsApp. Meeting with Алимхан transcribed.
- SEED + 5 DEEP researches complete (3,800+ строк): compliance, architecture, BSP, commerce, Rx handling
- Decisions D-17 — D-42 locked. Stack: Bun+Hono+whatsapp-api-js+Groq+PG on KZ VPS
- Direct Cloud API (no BSP). Commerce: WhatsApp→CTA→external site+Kaspi Pay
- Rx: inform+reserve+pickup. OTC: inform+order→external checkout. Controlled: strict refusal.
- Briefing PDF v2 for Алимхан (181 KB): regulations, risks, features, costs, timeline
- APT-17 (Voice Bot), APT-18 (Internet Store) added to roadmap

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
- D-16: V1 (`apps/demo/`) = DEPRECATED. V2 (`apps/v2/`) = основной. V1 не удалять, но не развивать.
- D-17: Telegram DEPRECATED. WhatsApp = единственная платформа для бота (2026-04-05, встреча с Алимханом)
- D-18: Голосовой бот (ElevenLabs) = отдельный эпик APT-17, после WhatsApp. Не в фокусе.
- D-19: APT-16 (Finmodel Polish) = PAUSED. Pivot на Domain 1 (WhatsApp-бот)
- D-20: Есть ТОО (действующая аптека, реальные расходы) — основа для верификации WhatsApp Business
- D-21: Интернет-магазин = deferred (личное задание Алимхана, APT-18)
- D-22: Direct Cloud API (без BSP), ~$30/мес
- D-23: whatsapp-api-js v6.2.1 (SDK)
- D-24: Groq Llama 3.3 70B (~$13/мес)
- D-25: pg_tsvector Russian stemmer
- D-26: KZ VPS (Алматы) — закон о персональных данных
- D-27: Бот = информационный ассистент, не продавец
- D-28: AI disclosure обязателен (Закон РК №230-VIII)
- D-29: Consent flow при первом контакте
- D-30: OTC only для рекомендаций, Rx = эскалация к фармацевту
- D-31: BSUID-ready (dual lookup phone+bsuid)
- D-32: KZ = zero-charge market для Marketing templates
- D-33: Service messages (user-initiated) = бесплатно безлимит
- D-34: IntellectDialog = fallback если верификация >21 дней
- D-35: Commerce: WhatsApp→CTA→external checkout (Meta рекомендует redirect)
- D-36: Онлайн OTC легальна с 2020, доп. лицензия не нужна
- D-37: MVP commerce = simple order page + Kaspi QR
- D-38: Rx информирование разрешено (наличие, цена, «нужен рецепт»)
- D-39: Rx flow = резерв + самовывоз с рецептом. Фото рецепта → pharmacist-in-the-loop.
- D-40: Контролируемые вещества = строгий отказ. Уголовная ответственность с 01.01.2026.
- D-41: Meta: "Drugs... prohibited" для COMMERCE. SERVICES = разрешены.
- D-42: Rx CTA → внешний checkout = серая зона. Rx безопаснее через резерв+самовывоз.

## Blockers
- Нет документов ТОО от Алимхана (свидетельство, БИН) — нужно для Meta регистрации
- Нет номера телефона для бота (нужен отдельный, не в WhatsApp)
- Нет доступа к данным 1С (ассортимент, цены) — для MVP используем ручную базу 50-100 препаратов
- Нет Kaspi Business аккаунта (для приёма оплаты на сайте)
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
| `docs/research/provizor-meeting-bot-2026-04-05.md` | Meeting transcript: Алимхан WhatsApp bot discussion |
| `docs/research/provizor-seed-whatsapp-bot.md` | SEED: WhatsApp Bot (5 directions, 12 signals) |
| `docs/research/provizor-deep-compliance.md` | DEEP-1: Commerce Policy, AI Policy, KZ law (544 lines) |
| `docs/research/provizor-deep-architecture.md` | DEEP-2: Stack, SDK, DB, LLM, hosting (971 lines) |
| `docs/research/provizor-deep-bsp-selection.md` | DEEP-3: Direct API vs BSP, pricing (572 lines) |
| `docs/research/provizor-deep-commerce-flow.md` | DEEP-4: Commerce flow, KZ e-commerce law, Kaspi Pay (~300 lines) |
| `docs/research/provizor-deep-rx-handling.md` | DEEP-5: Rx handling, KZ law, conversation flows, disclaimers (785 lines) |

## Metrics
- Sessions: 7
- Аптеки: 5 (сеть Алимхана)
- Оффлайн трафик: 200 входящих/день → 70-150 продаж (1 аптека)
- Halyk Market: ~43 продажи/день (~960/мес)
- Wolt Apteka: данные уточнить
- iTeka WhatsApp: ~30 обращений/день (1 аптека)
- Ассортимент: 6-7 тысяч позиций
- Research files: 16 (~8,800+ строк total: 8 finmodel + 1 meeting + 7 WhatsApp bot)
- V1 demo: 15 source files, builds in 500ms (DEPRECATED — D-16)
- V2: 22 source files, ~3500 lines, builds in 510ms (основной), deployed at provizor.contexter.cc
- WhatsApp bot: 42 decisions (D-01—D-42), 6 researches, briefing PDF v2 for Алимхан
