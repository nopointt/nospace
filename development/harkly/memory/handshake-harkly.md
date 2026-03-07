# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-07 by Assistant

---

## Где мы сейчас

H-06: semcomp pipeline завершён (все метрики ✅). Инфраструктура для outreach выбрана: LemonSqueezy (оплата) + Brevo (email, 300/day free) + Figma MCP (токен добавлен, нужен рестарт Claude). 12 email-вариантов для A/B теста спроектированы (12 структур × 30 отправок = 360 писем).

---

## Следующий приоритет

1. **Перезапустить Claude Code** — Figma MCP активируется после рестарта
2. **Настроить Brevo** — зарегистрироваться, добавить DNS записи (SPF/DKIM/DMARC), настроить SMTP
3. **Domain warmup** — 10→20→30→50/week, 3 недели перед mass send
4. **Написать тексты 12 email-вариантов** (структуры готовы, тексты нет)
5. **Запустить A/B тест** — 12 вариантов × 30 отправок = 360 писем → выбрать winner

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Все игры (сырые) | `branches/cx_osint_pipeline/output/all_games.json` (2671 игр) |
| Отфильтрованные таргеты | `branches/cx_osint_pipeline/output/filtered/filtered_targets.json` (1750 игр) |
| Сводный индекс с прогрессом | `branches/cx_osint_pipeline/output/reviews/index.json` |
| Отзывы по игре | `branches/cx_osint_pipeline/output/reviews/{appid}.json` |
| JTBD-отчёты | `branches/cx_osint_pipeline/output/reports/{appid}_jtbd.md` |
| Скрипт сбора | `branches/cx_osint_pipeline/collect_reviews.py` |
| Скрипт анализа | `branches/cx_osint_pipeline/analyze_reviews.py` |
| Фильтр игр | `branches/cx_osint_pipeline/filter_games.py` |
| Outreach pipeline | `branches/cx_osint_pipeline/outreach_pipeline.py` |
| Стратегия (черновик) | `branches/cx_osint_pipeline/outreach_strategy.md` |

---

## Инфраструктура / ключи

| Сервис | Где хранится | Статус |
|---|---|---|
| Figma MCP | `~/.claude.json` → mcpServers.figma.env.FIGMA_API_KEY | ✓ настроен |
| LemonSqueezy | аккаунт nopoint | ✓ создан |
| Brevo (email) | настроить | ⏳ |

---

## Открытые вопросы

- [ ] Brevo настроить (аккаунт + DNS + SMTP credentials)
- [ ] Домен / sender address — ждём Artem (harkly.io или tekse.ru временно)
- [ ] Figma MCP — проверить после рестарта Claude
- [ ] Финальная цена: $49 или $99 за первый отчёт?
- [ ] Написать тексты 12 email-вариантов (структуры в outreach_strategy.md)

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`2026-03-06` G3 #5 rate limiting + input validation done | код (60 файлов) запушен на GitHub | CF Workers отклонён (tokio::spawn) | Render выбран как деплой | Разработка приостановлена — фокус на деньги

`2026-03-06` game_scout запущен (11929 кандидатов), outreach_pipeline обновлён (dynamic subject + peer tone), outreach_strategy.md создан | следующее: дождаться targets.json, ручная фильтрация, --dry-run первых 10

`2026-03-07` 2671 игр собрано → all_games.json. Фильтр (100-50k отзывов + AAA publisher exclusion) → 1750 indie-игр. Новые скрипты: collect_reviews.py (все отзывы с 2025-01-01, resume), analyze_reviews.py (JTBD, DeepSeek, 3 воркера). API keys в .env. Тест Civ VII: score 7/10, отчёт качественный. | следующее: nopoint запускает оба скрипта параллельно → топ-15 по score → outreach

`2026-03-07` semcomp.py создан — умный роутер (8 алгоритмов: tfidf_pos/textrank/emotion/list_extract/hybrid/cjk_truncate/truncate/as_is). Классификатор: length(SHORT/MEDIUM/LONG/VERY_LONG) × lang(LATIN/CJK/MIXED) × structure(NARRATIVE/LIST/MIXED) × density(LOW/MEDIUM/HIGH). Position bias в tfidf_pos. VERY_LONG n=8 guarantee_first=2. 21 отчёт проверен: 95% quote accuracy, 1 галлюцинация (285190). analyze_reviews.py подключён к semcomp. semcomp-registry.md в memory/. | следующее: run-analyze цикл semcomp до PQC>75% PDR>=1.0 tok<15k UTC>70% (гуглить между итерациями)

`2026-03-07` semcomp run→analyze→edit цикл ЗАВЕРШЁН (3 итерации). _semcomp_bench.py создан (Steam API fetch + PQC/PDR/UTC/Tok/Comp метрики). Итог: PQC=0.89✓ PDR=1.16✓ Tok=5716✓ Comp=66%✓ UTC=0.89✓ — все 5 целей достигнуты. Фиксы: tfidf_pos pain_boost=1+0.4×pain_count, min_words=5; textrank min_words=3 + n=2 для MEDIUM+LOW; Comp метрика считает только non-as_is. | следующее: запустить collect_reviews.py + analyze_reviews.py → топ-15 по score → outreach

`2026-03-07` Инфраструктура outreach: LemonSqueezy создан (payment, global cards), Brevo выбран (email, 300/day free, без карты), Figma MCP токен добавлен в ~/.claude.json (нужен рестарт Claude). 12 email-структур для A/B теста спроектированы (×30 каждый = 360 писем). | следующее: рестарт Claude → Brevo DNS → warmup → тексты 12 вариантов → A/B тест
