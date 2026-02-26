# Harkly — Financial Model 2026
> Сгенерировано: 2026-02-25 | Горизонт: Jan–Dec 2026
> Источники данных: верифицированы 2026-02-25 (см. раздел Sources)
> ⚠️  Помеченные ESTIMATE — цифры расчётные, реальные могут отличаться

---
## 0. Рекомендуемый стек (lean, FZ-152, масштабируемый)

| Компонент | Сервис | Причина |
|---|---|---|
| Edge / scraping | **Cloudflare Workers** (paid $5/mo) | Глобальный edge, browser rendering встроен |
| Browser rendering | **Cloudflare Browser Rendering** ($0.09/hr) | 10ч бесплатно, scalable |
| БД пользователей (FZ-152) | **Yandex Cloud PostgreSQL** (~$40/mo) | Сервера в РФ, managed, compliance |
| Auth (FZ-152) | **Yandex ID OAuth** + JWT в YC PostgreSQL | Бесплатный OAuth, PD хранится в РФ |
| Хранение эмбеддингов | **Yandex Cloud Object Storage** ($0.03/GB/mo) | РФ-сервера, дёшево |
| Task queue | **BullMQ + Upstash Redis** (free tier) | Бесплатно до 10K команд/день |
| LLM (анализ отзывов) | **GPT-4.1-mini** (ESTIMATE $0.40/1M in) | Дёшево, быстро, качественно |
| LLM (prediction) | **GPT-4.1** ($2.00/1M in) | Максимальное качество silicon sampling |
| LLM (AI Perception) | GPT-4.1 + **YandexGPT Pro 5** ($0.01/1K) + **GigaChat** (est) | Тестируем именно те LLM, что видят клиент |

**Фиксированная инфра на старте:** $47/мес
**Фиксированная инфра при 100 клиентах:** $69/мес

---
## 1. Прайсинг — что входит в каждый тариф

| Тариф | Цена/мес | Цена/год | Проекты | Источники | Prediction | AI Perception | API | Поддержка |
|---|---|---|---|---|---|---|---|---|
| **Free** | 0 (бесплатно) | — | 1 | 1 | —/мес | — | — | community |
| **Starter** | $49 | $490 | 1 | 1 | —/мес | — | — | email 48h |
| **Growth** | $149 | $1,489 | 5 | 3 | 50/мес | — | — | email 24h |
| **Pro** | $299 | $2,989 | 10 | ∞ | 200/мес | ✅ | — | email 12h + chat |
| **Enterprise** | $499 | $4,988 | ∞ | ∞ | 999/мес | ✅ | ✅ + WL | dedicated 24h SLA |

> 💡 **Enterprise в подарок при любом WL-соглашении:** реальный cash-cost для Harkly = $77.39/мес на клиента. Opportunity cost = $499/мес. Это маркетинговый инструмент с ~нулевыми реальными расходами.

---
## 2. Unit Economics — сколько стоит привлечь, сколько зарабатываем

| Тариф | Цена | Переменные расходы/мес | Валовая маржа | Чёрн/мес | Срок жизни | LTV | CAC (avg) | LTV:CAC | Payback |
|---|---|---|---|---|---|---|---|---|---|
| **Starter** | $49 | $0.02 | 100.0% | 4.0% | 25 мес | $1,162 | $37 | 31.4:1 ✅ | 0.8 мес |
| **Growth** | $149 | $2.08 | 98.6% | 4.0% | 25 мес | $3,548 | $95 | 37.3:1 ✅ | 0.7 мес |
| **Pro** | $299 | $16.09 | 94.6% | 2.0% | 50 мес | $13,646 | $185 | 73.8:1 ✅ | 0.7 мес |
| **Enterprise** | $499 | $77.56 | 84.5% | 1.5% | 67 мес | $26,429 | $550 | 48.1:1 ✅ | 1.4 мес |

> Источники: churn — [Recurly Churn Report 2025](https://vitally.io/post/saas-churn-benchmarks); LTV:CAC — [Optifai 2025](https://optif.ai/learn/questions/b2b-saas-ltv-benchmark/); CAC payback — [Benchmarkit 2025](https://www.benchmarkit.ai/2025benchmarks)

---
## 3. Переменные расходы — из чего состоит себестоимость

| Тариф | Browser | Proxy | LLM анализ | Embeddings | Prediction LLM | AI Perception LLM | **Итого** |
|---|---|---|---|---|---|---|---|
| Starter | $0.000 | $0.009 | $0.014 | $0.0002 | $0.000 | $0.000 | **$0.02** |
| Growth | $0.000 | $0.032 | $0.048 | $0.0008 | $2.000 | $0.000 | **$2.08** |
| Pro | $0.000 | $0.079 | $0.120 | $0.0021 | $15.000 | $0.888 | **$16.09** |
| Enterprise | $0.000 | $0.169 | $0.257 | $0.0045 | $75.000 | $2.130 | **$77.56** |

> LLM анализ использует GPT-4.1-mini (ESTIMATE). AI Perception = GPT-4.1 + YandexGPT Pro 5 + GigaChat.
> Источники: [GPT-4.1 pricing](https://pricepertoken.com/pricing-page/model/openai-gpt-4.1); [YandexGPT](https://yandex.cloud/en/docs/foundation-models/pricing); [Cloudflare BR](https://developers.cloudflare.com/changelog/2025-07-28-br-pricing/)

---
## 4. White-Label партнёрские сценарии — экономика за 12 месяцев

### Scenario 4 — Enterprise SaaS Subscription

**Денежный поток по месяцам (наша выручка, $):**
| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 998 | 998 | 998 | 998 | 998 | 998 | 998 | 998 | 998 | 998 | 998 | 998 |

| Метрика | Значение |
|---|---|
| Выручка за год | **$11,976** |
| Наши затраты (COGS) | $27,975 |
| Валовая прибыль | **$-15,999** |
| Валовая маржа | -133.6% |
| Enterprise gift — opportunity cost | $0 |
| Enterprise gift — реальный cash cost | $0.00 |

### Scenario 1 — Paid Pilot → Annual License

**Денежный поток по месяцам (наша выручка, $):**
| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2000 | 0 | 8000 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

| Метрика | Значение |
|---|---|
| Выручка за год | **$10,000** |
| Наши затраты (COGS) | $6,994 |
| Валовая прибыль | **$3,006** |
| Валовая маржа | 30.1% |
| Enterprise gift — opportunity cost | $998 |
| Enterprise gift — реальный cash cost | $4,462.50 |
| Выручка партнёра от своих клиентов | $11,880 |
| Партнёр платит нам | $10,000 |
| Win партнёра (gross gain) | **$1,880** |
| ROI партнёра | 18.8% |

### Scenario 2 — Discovery Sprint

**Денежный поток по месяцам (наша выручка, $):**
| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1150 | 8000 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

| Метрика | Значение |
|---|---|
| Выручка за год | **$9,150** |
| Наши затраты (COGS) | $6,994 |
| Валовая прибыль | **$2,156** |
| Валовая маржа | 23.6% |
| Enterprise gift — opportunity cost | $1,497 |
| Enterprise gift — реальный cash cost | $6,693.75 |
| Выручка партнёра от своих клиентов | $9,504 |
| Партнёр платит нам | $9,150 |
| Win партнёра (gross gain) | **$354** |
| ROI партнёра | 3.9% |

### Scenario 3 — Flat fee + Rev-share

**Денежный поток по месяцам (наша выручка, $):**
| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 297 | 297 | 297 | 697 | 697 | 697 | 697 | 697 | 697 | 697 | 697 | 697 |

| Метрика | Значение |
|---|---|
| Выручка за год | **$7,164** |
| Наши затраты (COGS) | $27,975 |
| Валовая прибыль | **$-20,811** |
| Валовая маржа | -290.5% |
| Enterprise gift — opportunity cost | $1,497 |
| Enterprise gift — реальный cash cost | $6,693.75 |
| Выручка партнёра от своих клиентов | $11,880 |
| Партнёр платит нам | $7,164 |
| Win партнёра (gross gain) | **$4,716** |
| ROI партнёра | 65.8% |

---
## 5. Прогноз 2026 — помесячно

> Запуск H1 = май 2026 (8–12 недель от февраля). ProxyMarket pilot = май.

| Мес | Клиенты | Direct MRR | WL Revenue | Итого Revenue | Переменные | Фиксированные | Gross Profit | GM% |
|---|---|---|---|---|---|---|---|---|
| **Jan** | 0 | $0 | $0 | $0 | $0.00 | $47.30 | $-47 | 0.0% |
| **Feb** | 0 | $0 | $0 | $0 | $0.00 | $47.30 | $-47 | 0.0% |
| **Mar** | 0 | $0 | $0 | $0 | $0.00 | $47.30 | $-47 | 0.0% |
| **Apr** | 0 | $0 | $0 | $0 | $0.00 | $47.30 | $-47 | 0.0% |
| **May** | 3 | $484 | $2,000 | $2,484 | $32.41 | $47.33 | $2,405 | 96.8% |
| **Jun** | 9 | $1,441 | $0 | $1,441 | $96.66 | $47.37 | $1,297 | 90.0% |
| **Jul** | 19 | $3,017 | $8,000 | $11,017 | $203.00 | $47.46 | $10,767 | 97.7% |
| **Aug** | 33 | $5,359 | $0 | $5,359 | $361.49 | $48.19 | $4,950 | 92.4% |
| **Sep** | 52 | $8,447 | $0 | $8,447 | $571.22 | $54.06 | $7,821 | 92.6% |
| **Oct** | 75 | $12,260 | $0 | $12,260 | $831.29 | $61.48 | $11,367 | 92.7% |
| **Nov** | 102 | $16,779 | $0 | $16,779 | $1,140.83 | $69.82 | $15,569 | 92.8% |
| **Dec** | 134 | $21,987 | $0 | $21,987 | $1,498.96 | $79.40 | $20,409 | 92.8% |

**Итого выручка 2026:** $79,774
**MRR декабрь 2026 (direct):** $21,987
**ARR run-rate декабрь 2026:** $263,844

---
## 6. Политика скидок

| Тариф | Прайс/мес | Цена годовой (лист) | Макс скидка | Floor price | Макс скидка (LTV:CAC≥3) |
|---|---|---|---|---|---|
| Starter | $49 | $490 | 16.7% (annual) | $0.51 | 25.0% |
| Growth | $149 | $1,489 | 16.7% (annual) | $3.35 | 25.0% |
| Pro | $299 | $2,989 | 16.7% (annual) | $17.32 | 25.0% |
| Enterprise | $499 | $4,988 | 16.7% (annual) | $80.31 | 25.0% |

> WL floor rule: партнёр не может продавать ниже $499/мес (Enterprise list price).
> Источник: [industry standard annual discount](https://www.saffronedge.com/blog/saas-conversion-rate/)

---
## 7. Политика конфликтов каналов

```
CHANNEL CONFLICT RULES (industry standard approach — SaaS source: WotNot, OpenView 2025):

1. FLOOR PRICE RULE (канибализация):
   WL resellers cannot price below Harkly public Enterprise ($499/mo).
   Reason: protects direct channel, prevents ProxyMarket undercutting our SMB tiers.

2. LAST-TOUCH ATTRIBUTION:
   If a client signed via ProxyMarket and later contacts Harkly directly →
   ProxyMarket retains credit for 12 months from sign date.
   After 12 months → client can move to direct without rev-share.

3. GEOGRAPHIC/VERTICAL SOFT EXCLUSIVITY:
   ProxyMarket gets soft exclusivity for "proxy infrastructure" vertical in RU/СНГ.
   Harkly can sell direct to any end-client not sourced by ProxyMarket.

4. MINIMUM COMMITMENT (anti-zero protection):
   Scenario 3 floor: $300/mo flat fee guaranteed regardless of rev-share performance.
   Reason: protects Harkly from "signed but never sells" partners.
```

---
## 8. Break-even анализ

- Фиксированные расходы при запуске: **$47/мес**
- Средняя contribution margin на клиента (Starter/Growth/Pro mix): **$153.77/мес**
- Break-even по прямым клиентам: **≈0 платящих клиентов**
- С ProxyMarket S1 pilot ($2,000 upfront): покрывает **42.2 месяцев** фиксированных расходов

---
## 9. Риск-анализ (чувствительность)

| Сценарий | Выручка 2026 | Δ к базе |
|---|---|---|
| **База** | $79,774 | — |
| Чёрн +50% (SMB 6%/мес) | $59,830 | -25.0% |
| Нет WL-сделки (только direct) | $69,774 | -12.5% |
| Рост ×0.5 (медленный старт) | $43,876 | -45.0% |
| GPT-4.1-mini ×3 дороже | экстра затраты $152 | маржа −0.2% |

> ⚠️ gpt41_mini price is ESTIMATE — actual price may differ ±50%

---
## 10. Источники данных

| ID | Описание | Источник |
|---|---|---|
| `gpt41` | — | pricepertoken.com/pricing-page/model/openai-gpt-4.1 — verified 2026-02-25 |
| `gpt41_mini` | — | ESTIMATE based on GPT-4o mini pattern ($0.15/$0.60) × 2.5x — not officially verified |
| `yandexgpt` | — | yandex.cloud/en/docs/foundation-models/pricing — until 2026-03-03 |
| `gigachat` | — | ESTIMATE ~YandexGPT Pro level — developers.sber.ru/docs/ru/gigachat/api/tariffs (page not parseable) |
| `cloudflare_br` | — | developers.cloudflare.com/changelog/2025-07-28-br-pricing — $0.09/browser-hour |
| `cloudflare_workers` | — | developers.cloudflare.com/workers/platform/pricing — $5/mo paid plan |
| `yandex_pg` | — | yandex.cloud/en/docs/managed-postgresql/pricing — ~$40/mo minimum startup |
| `churn` | — | Recurly Churn Report 2025, vitally.io — SMB 3-5%/mo, mid-market 1.5-3%, enterprise 1-2% |
| `ltv_cac` | — | optif.ai B2B SaaS LTV benchmarks 2025 — LTV:CAC 3:1 minimum, 5:1 target |
| `cac_payback` | — | Benchmarkit 2025 SaaS — payback <12mo SMB, <18mo mid-market |
| `freemium_conv` | — | OpenView Partners SaaS benchmarks — 2-5% freemium→paid conversion |
| `wl_revshare` | — | OpenView Partners / getmonetizely.com — vendor keeps 30-40% of reseller revenue |
| `annual_discount` | — | SaaS industry standard — 15-20% discount for annual prepay (2 months free equiv.) |

*ESTIMATE = расчётная оценка, не верифицированная официально. Проверить перед презентацией инвесторам.*