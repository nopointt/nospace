---
# product-use-cases.md — Harkly Product Use Cases
> Layer: reference | Created: 2026-03-18 (Axis)
> Purpose: concrete actor-situation-result scenarios for UI design + marketing demos
---

## Use Case 2 — Voice of Customer для продуктовой команды

**Актор:** UX-исследователь в продуктовой компании

**Ситуация:** Продакт просит «дай мне понять, что реально болит у наших пользователей» перед квартальным планированием. Исследователь собирает отзывы из App Store, Google Play, профильных форумов — в 6 разных вкладках, вручную копирует в таблицу.

**В Harkly:** Один NLP-запрос запускает параллельный сбор по всем источникам. Артефакт Empathy Map (SAY / THINK / DO / FEEL) генерируется автоматически из отзывов. Каждый квадрант кликабелен — провал до первоисточника.

**Результат:** Продакт открывает артефакт в Biz-режиме и видит только выводы — без технического шума. Исследователь не тратит время на объяснение «откуда эти данные».

**Spine stages:** Framing → Ingestion (App Store/GP/forums) → Extraction → Synthesis (Empathy Map)
**Key artifact:** Empathy Map с drill-down до источника

---

## Use Case 3 — Research Brief за один сеанс

**Актор:** Независимый CX-консультант

**Ситуация:** Клиент дал задачу — «изучи, как нас воспринимают относительно топ-3 игроков рынка». Дедлайн — 2 дня, бюджет не предполагает большой команды.

**В Harkly:** Framing Studio помогает сформулировать исследовательский вопрос и выбрать фрейм. Spine-процесс ведёт от вопроса до артефакта без переключения между инструментами. На выходе — Research Deck: структурированная презентация из Source Table + Fact Pack + Signal Log, собранная автоматически.

**Результат:** Консультант сдаёт клиенту артефакт с трейсабилити — каждый вывод ссылается на источник. Клиент доверяет данным, потому что может проверить сам.

**Spine stages:** Framing (PICO/Issue Tree) → Ingestion → Extraction → Synthesis (Fact Pack + Signal Log) → Stakeholders (Research Deck export)
**Key artifact:** Research Deck = Source Table + Fact Pack + Signal Log

---

## Use Case 4 — Pre-launch Signal Check

**Актор:** CX-лид в бренде перед запуском нового продукта

**Ситуация:** Команда хочет понять, как аналогичные продукты конкурентов были приняты аудиторией в первые 3 месяца после запуска. Найти эти данные ретроспективно — боль.

**В Harkly:** Prediction Layer + Reality Layer комбинируются: OSINT-данные по конкурентным запускам обогащаются silicon sampling — прогнозом реакции аудитории на конкретные характеристики нового продукта.

**Результат:** Команда получает не «интуицию», а структурированный Signal Report с гипотезами и доказательной базой до запуска.

**Spine stages:** Framing → Ingestion (competitor OSINT) → Extraction → Synthesis (Signal Report) + Silicon Sampling (Layer 2)
**Key artifact:** Signal Report с hypothesis + evidence base
**Note:** Layer 2 feature (silicon sampling) — deferred, but sets vision

---

## Summary Matrix

| UC | Актор | Primary source (MVP) | Key artifact | Layer |
|---|---|---|---|---|
| UC-2 | UX researcher | Reddit (OAuth) · Hacker News (no auth) · App Store via Scrapling · Google Play via Scrapling · Rss2Json (forum RSS) | Empathy Map (SAY/THINK/DO/FEEL) | L1 |
| UC-3 | CX consultant | Reddit (OAuth) · Hacker News Algolia API (no auth) · NewsAPI (apiKey) · The Guardian (apiKey) · GNews (apiKey) · Wikipedia (no auth) · Rss2Json (no auth) · Tavily Search API | Research Deck (Source Table + Fact Pack + Signal Log) | L1 |
| UC-4 | CX lead (brand) | Twitter/X API (OAuth) · LinkedIn (OAuth) · ORB Intelligence (apiKey) · Domainsdb.info (no auth) · Clearbit Logo (apiKey) · Scrapling (StealthyFetcher) · silicon sampling (deferred) | Signal Report | L1 + L2 |

> Full API details: `nospace/docs/research/open-apis/` — index, per-source files, priority matrix.
> UC-2/UC-3 MVP: Reddit + HN + Rss2Json cover demo without paid APIs. Scrapling handles App Store/forums.
> UC-4 MVP: Twitter/X + Domainsdb.info + Scrapling cover competitor surface. ORB Intelligence for enriched firmographics (paid, Stage 2).
