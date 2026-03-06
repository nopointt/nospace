# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-06 by Assistant

---

## Где мы сейчас

H-06 Cold Outreach в активной фазе: game_scout.py собирает целевые игры (11929 кандидатов, ~335 собрано на момент закрытия сессии — скрипт работал в фоне). outreach_pipeline.py обновлён с динамическим subject line и peer-to-peer тоном. Разработка платформы (cx-platform) на паузе — приоритет на быстрые деньги через outreach.

---

## Следующий приоритет

1. Дождаться завершения game_scout → получить полный targets.json
2. Вручную отфильтровать targets.json — убрать крупных паблишеров (Focus, SEGA, Bandai Namco, Nacon, 2K, EA, Ubisoft)
3. Запустить `batch_pipeline.py --dry-run` на первые 10 игр — проверить сгенерированные письма
4. Настроить Gmail app password + отправить первые 15 outreach
5. Отредактировать `outreach_strategy.md` — заполнить открытые вопросы (цена, домен, Stripe)

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Список целевых игр | `branches/cx_osint_pipeline/output/targets.json` |
| Скрипт сбора игр | `branches/cx_osint_pipeline/game_scout.py` |
| Outreach pipeline | `branches/cx_osint_pipeline/outreach_pipeline.py` |
| Пакетная отправка | `branches/cx_osint_pipeline/batch_pipeline.py` |
| Стратегия (черновик) | `branches/cx_osint_pipeline/outreach_strategy.md` |
| Player profile pipeline | `branches/cx_osint_pipeline/player_profile_pipeline.py` |

---

## Открытые вопросы

- [ ] Gmail app password для --send флага
- [ ] Домен / sender address (harkly.io?) — ждём Artem
- [ ] Stripe для payment link в follow-up
- [ ] Формат отчёта: MD или PDF?
- [ ] Финальная цена: $49 или $99 за первый отчёт?
- [ ] Когда вводить subscription offer ($49/mo)?

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-06` G3 #5 rate limiting + input validation done | код (60 файлов) запушен на GitHub | CF Workers отклонён (tokio::spawn) | Render выбран как деплой | Разработка приостановлена — фокус на деньги

`2026-03-06` game_scout запущен (11929 кандидатов), outreach_pipeline обновлён (dynamic subject + peer tone), outreach_strategy.md создан | следующее: дождаться targets.json, ручная фильтрация, --dry-run первых 10
