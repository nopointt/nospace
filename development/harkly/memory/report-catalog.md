# Harkly — Report Catalog (Steam CX Service)

> Типы отчётов, доступных для продажи indie Steam-студиям.
> Updated: 2026-03-06

---

## 1. Refund Zone Report

Отзывы написанные при 1.5–2.5ч — это окно возврата. Что именно убивает игру за первые 2 часа? Какой момент = триггер "хочу деньги назад".

## 2. Temporal Sentiment Report

Динамика жалоб по времени: launch week → month 1 → month 3+. Что студия уже пофиксила? Что стало хуже? Какие паттерны появились после конкретных патчей.

## 3. Competitive Gap Report

Берём жалобы из Taxi Life + аналогичные из ETS2/ATS reviews. Где конкурент объективно выигрывает? Что игроки хотят перенести из ETS2 в Taxi Life? Готовый feature backlog.

## 4. Geographic Complaint Map

GetPlayerSummaries даёт страну. Немцы жалуются на одно, американцы на другое. Важно для локализации и приоритизации по ключевым рынкам.

## 5. Community Amplifier Report

У каждого отзыва есть votes_helpful. Самые высоко-голосованные негативные отзывы = то, что резонирует с сообществом. Это не просто жалобы — это публичный нарратив о твоей игре.

## 6. Early Access Scar Report

Отзывы с флагом written_during_early_access vs post-launch. Какие проблемы тянутся с EA и до сих пор не решены? Это ранят репутацию сильнее всего.

## 7. Veteran Voice Report

Отзывы от игроков с 500+ часов в игре. Это самая ценная обратная связь — люди которые остались, но разочаровались. Что именно сломало их лояльность?

## 8. Sentiment Velocity Report

Rate of change: игра становится лучше или хуже за последние 90 дней? Индекс в духе "улучшение на 12% по stability, деградация на 8% по content". Для студии — KPI.

## 9. Silent Majority Report

Игроки с большим playtime (50ч+) которые НЕ оставили отзыв. Через SteamSpy owner estimates vs review count = gap. Кто молчит и почему — косвенный анализ через тех кто похож по профилю но всё же написал.

## 10. Wishlist-to-Refund Funnel

Отзывы написанные при < 3ч + negatively voted. Это разрыв между маркетинговым ожиданием и реальностью. Кластеризация: что именно не совпало с тем что обещал трейлер / стор-пейдж.

---

## Приоритет по цене/сложности

| Отчёт | Сложность | Ценность для студии |
|-------|-----------|---------------------|
| Refund Zone | LOW | HIGH — прямой impact на конверсию |
| Temporal Sentiment | LOW | HIGH — видят ROI от патчей |
| Community Amplifier | LOW | HIGH — PR/reputation |
| Competitive Gap | MEDIUM | HIGH — feature roadmap |
| Veteran Voice | LOW | MEDIUM |
| Geographic | LOW | MEDIUM |
| Sentiment Velocity | MEDIUM | MEDIUM |
| Early Access Scar | LOW | MEDIUM |
| Wishlist-to-Refund | MEDIUM | HIGH |
| Silent Majority | HIGH | LOW (много inference) |

**Первые три — почти бесплатные по данным, но выглядят как аналитика на $300+.**

---

## Player Profile Report (уже реализован)

Pipeline: `player_profile_pipeline.py`
Taxonomy: Genre Expert / Casual / Competitor Fan / Collector / Mixed
Legitimacy Score: mean playtime_at_review для Genre Expert с voted_up=False
