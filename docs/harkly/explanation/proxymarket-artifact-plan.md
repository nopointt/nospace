# План артефактов — ProxyMarket-first
> Версия: 1.0 | Дата: 2026-02-24 | Автор: Comet (L1)
> Статус: ACTIVE — рабочий план до и после созвона с CPO ProxyMarket

Выстраиваем систему артефактов вокруг ProxyMarket-first и новой сетки документов.

---

## 1. Продуктовый уровень

### 1.1 Product Brief — Harkly v1 (ProxyMarket-first)

Короткий, описательный документ «что такое Harkly» на языке бизнеса:

- **Кто мы:** сервис анализа и предсказания пользовательского опыта в разных доменах без привязки к маркетплейсам как первому приоритету.
- **Какие проблемы решаем:** мониторинг UX, поиск «болей», прогноз реакции на изменения, сравнение с конкурентами по UX-метрикам.
- **Ключевые фичи:** сбор сигналов, AI-анализ, synthetic consumers, AI-perception.
- **Почему это логично с ProxyMarket:** их прокси-инфраструктура + наш интеллект = полноценный data product.

Документ идёт первым всем: CPO, бизнес-людям, нетехническим партнёрам.

> Файл: `docs/harkly/product-brief-v1.md` — подготовить

---

### 1.2 PRD — Harkly Horizon 1 (Enterprise-ориентированный)

Используем текущий `prd-horizon-1` как базу, но:

- Переписываем позиционирование: Harkly = платформа UX-интеллидженса, маркетплейсы — один из доменов, а не «ядро».
- Добавляем раздел «Enterprise & Adaptability»: гибкие источники, white-label, варианты деплоя, пилоты под домен конкретного клиента ProxyMarket.
- Акцент ProxyMarket-first: в примерах и roadmap H1 явно показываем, как из ядра продукта вырастает решение под них как ключевого партнёра.

PRD — для тех, кто хочет глубокое погружение в продукт и план развития, Product Brief — верхнеуровневый вход.

> Файл: [`docs/harkly/explanation/prd-horizon-1.md`](./prd-horizon-1.md) — обновить

---

## 2. Технический уровень

### 2.1 Technical One-Pager

Одностраничник для нетехнических партнёров и «полутехнических» людей (продажи, CPO, аккаунты):

- High-level архитектура (Frontend / API / Workers / AI / Data Store).
- Что где крутится (облако, безопасность, RLS, логирование).
- Как используется инфраструктура ProxyMarket (их прокси как default транспорт).
- Интеграционные точки (webhooks, API, white-label-конфиг).

> Файл: `docs/harkly/technical-one-pager.md` — подготовить

---

### 2.2 Solution Architecture Document

Более детальный техдок для их CTO/архитекторов:

- Архитектурные диаграммы.
- Потоки данных (ingest → обработка → аналитика → отчёты/API).
- Вариации деплоя (наш облачный контур, опции на будущее).
- Безопасность, аудит, масштабирование.
- Как встраиваются прокси ProxyMarket и возможные интеграции с их биллингом/кабинетом.

Оба документа опираются на уже описанные в PRD нефункциональные требования и архитектуру, но упакованы под разные уровни глубины.

> Файл: `docs/harkly/solution-architecture-document.md` — подготовить

---

## 3. Партнёрские сценарии и дизайн

### 3.1 Partnership Scenarios / Playbook (ProxyMarket-first)

Расширяем текущий White-Label Partnership Scenarios в playbook, где есть три трека.

**Трек 1 — Enterprise Client:**

> ProxyMarket как прямой заказчик: подписка/проект, пилоты под их собственный бренд/кейсы.

- Кто платит: ProxyMarket напрямую в Harkly за право использования платформы в своих целях.
- Владелец конечного клиента: Harkly.
- Саппорт: Harkly ведёт напрямую с ProxyMarket как клиентом.
- GTM: директный сейлс → пилот → годовой контракт.

**Трек 2 — White-Label Partner:**

> ProxyMarket продаёт Harkly под своим брендом своим клиентам.

Базовые white-label сценарии:

| Сценарий | Описание |
|---|---|
| **Paid Pilot → Годовая лицензия** | Платный пилот (2 мес.) → зачёт в годовой white-label контракт. Рекомендуемый. |
| **Discovery-спринт** | 3–4 недели → кастомный прототип + роадмап → лицензия. Быстрое начало. |
| **Flat fee + Rev-share** | Фикс + % от выручки ProxyMarket с этого продукта. Компромисс при возражении против аванса. |

- Кто платит: ProxyMarket Harkly (flat/pilot/rev-share), конечные клиенты платят ProxyMarket.
- Владелец конечного клиента: ProxyMarket.
- Саппорт L1: ProxyMarket. Саппорт L2/L3: Harkly.
- GTM: ProxyMarket сам продвигает под своим брендом → Harkly за кадром.

**Трек 3 — Hybrid (Enterprise + White-Label):**

> ProxyMarket получает Enterprise-доступ к платформе для своих задач бесплатно, монетизация — на ресейле клиентам.

- Кто платит: конечные клиенты платят ProxyMarket, ProxyMarket делится ревенью с Harkly.
- **Enterprise-подписка для ProxyMarket = бесплатно** при наличии активного ресейла.
- Владелец конечного клиента: ProxyMarket.
- GTM: ProxyMarket включает Harkly в свой продуктовый портфель + использует внутренне для собственной аналитики.

> Файл: [`docs/harkly/explanation/white-label-partnership-scenarios.md`](./white-label-partnership-scenarios.md) — обновиться до полного playbook

---

### 3.2 Partnership Design Document (ProxyMarket)

Отдельный doc для конкретного партнёрства, заполняемый после созвона. **Ориентирован на основателей.**

Сержёвые секции:

- **Роли:** кто за что отвечает со стороны Harkly, кто — со стороны партнёра (разработка, опс, саппорт, продажи, онбординг, биллинг).
- **Риски:** технические, коммерческие, репутационные, юридические с митигацией.
- **Коммуникации:** ритм синков, каналы, эскалация проблем.
- **Финансовые потоки:** модель оплаты, ревенью, дедлайны, minimum commitment, аудит выручки.
- **Таймлайн и KPI:** этапы (Discovery, MVP, Pilot Scale, Scale) + метрики успеха.
- **Юридический контур (high-level):** IP, DPA, SLA, расторжение.

> Файл: [`docs/harkly/explanation/partnership-design-document-template.md`](./partnership-design-document-template.md) — шаблон готов.
> Заполняется в файл `docs/harkly/explanation/proxymarket-partnership-design.md` после созвона.

---

## 4. Юридический контур после созвона

### 4.1 Созвон и follow-up

На созвоне используем:
- Product Brief + PRD
- Technical One-Pager
- Partnership Scenarios / Playbook
- Список вопросов к CPO ([`proxymarket-cpo-questionnaire.md`](./proxymarket-cpo-questionnaire.md))

По итогам созвона делаем детальный фоллоу-ап (по электронной почте, официальный предварительный документ):
- Выбранный сценарий (Enterprise / White-Label / Hybrid)
- Согласованный пилот (2 недели MVP, объём работ, ожидания по результатам)
- Ориентировочные деньги и обязанности сторон

Follow-up служит **предварительным соглашением** (предмет + обязательства сторон + ориентировочная цена + сроки) и счётом. 
Определённая юридическая сила: цель создать документарную основу до подписания полного договора.

### 4.2 White-Label Agreement (или иной договор)

На основе follow-up и выбранной модели:

- **White-Label или Hybrid** → готовим **White-Label Agreement** (лицензия, брендинг, ответственность, SLA, данные, IP).
- **Чистый Enterprise** → сервисный/лицензионный договор.

Юристы дорабатывают полный договор параллельно разработке. К моменту готовности MVP — договор подписан или утверждён.

---

## 5. Шаги «прямо сейчас»

| # | Действие | Ответственный | Файл на выходе |
|---|---|---|---|
| 1 | Зафиксировать позиционирование Harkly: сервис анализа и предсказания UX, ProxyMarket-first | nopoint | Формулировка в Product Brief |
| 2 | Подготовить Product Brief в enterprise-тоне | Comet | `product-brief-v1.md` |
| 3 | Обновить PRD H1 под новое позиционирование + enterprise/ProxyMarket-акценты | Comet | `prd-horizon-1.md` v2 |
| 4 | Собрать Technical One-Pager из PRD | Comet | `technical-one-pager.md` |
| 5 | Наметить skeleton Solution Architecture Document | Comet | `solution-architecture-document.md` |
| 6 | Обновить White-Label Scenarios до полного Playbook с Enterprise + Hybrid | Comet | `white-label-partnership-scenarios.md` |
| 7 | Шаблон Partnership Design Document — уже готов | Comet | `partnership-design-document-template.md` |
| 8 | Подготовить письмо CPO: текст + ссылки на документы + agenda | Comet | Черновик в chat |

---

## 6. Карта артефактов

```
docs/harkly/
├── product-brief-v1.md                        ← для всех, бизнес-язык
├── technical-one-pager.md                     ← нетехнические партнёры
├── solution-architecture-document.md          ← CTO/архитекторы
└── explanation/
    ├── prd-horizon-1.md                        ← глубокое погружение в продукт
    ├── white-label-partnership-scenarios.md    ← 3 WL-сценария + playbook
    ├── partnership-design-document-template.md ← шаблон PDD
    ├── proxymarket-partnership-design.md       ← заполняется после созвона
    ├── proxymarket-cpo-questionnaire.md        ← вопросы на созвон
    └── proxymarket-artifact-plan.md            ← этот файл
```

---

*План составлен Comet (L1) на основе брифинга nopoint. ProxyMarket-first: все документы затачиваются под них как ключевого партнёра и Enterprise-заказчика.*
