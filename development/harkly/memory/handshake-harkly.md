# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-04 by Assistant

---

## Где мы сейчас

Pre-launch. Pipeline MVP работает, первый Silicon Persona (Taxi Life) готов. Открыта Instagram ветка (HARKLY-08): аудитория CX/UX researchers, воронка Harkly Enthusiast $9+ донат, GSAP видео PoC сделан. Следующий шаг — контент-столпы + визуальная идентичность + Playwright MP4 pipeline.

---

## Следующий приоритет

1. **Instagram** — контент-столпы (nopoint исследует конкурентов, промпт готов) + визуальная идентичность → контент-план
2. **Playwright MP4 pipeline** — настроить runner: GSAP HTML → Playwright recordVideo → MP4 1080×1920
3. **Cold outreach** — 15 outreach Simteract (@simteract), persona.md готов, шаблон готов
4. **Баг Key Quotes** — `[[...]` вместо цитат в report.md, JSON parsing cluster.quotes

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Состояние проекта | development/harkly/memory/current-context-harkly.md |
| GSAP видео PoC | development/harkly/video-tests/scene-01.html |
| Silicon Persona (lead magnet) | development/harkly/branches/cx_osint_pipeline/output/reports/1351240_Taxi Life_..._persona.md |
| H-06 оффер + шаблоны outreach | development/harkly/branches/landing-coldoutreach/mobile-games-offer.md |
| Pipeline src | development/harkly/branches/cx_osint_pipeline/src/ |
| Product Brief (для CPO) | docs/harkly/product-brief-v2.md |

---

## Открытые вопросы

- [ ] Контент-столпы Instagram — результат исследования конкурентов у nopoint
- [ ] Визуальная идентичность — цвет, шрифт, стиль (nopoint рисует)
- [ ] Playwright MP4 pipeline — настроить recorder и bash-обёртку
- [ ] Research Hub — начать сборку (CF D1 + Playwright scraper + Qwen summary)
- [ ] Key Quotes bug: JSON parsing cluster.quotes в report.py
- [ ] CPO ProxyMarket созвон — когда?

---

## Tech: Pipeline Quick Reference

```bash
# Полный прогон (find + validate + analyze top candidate)
python pipeline.py --mode full --genre Simulation --min-reviews 1000

# Анализ конкретной игры
python pipeline.py --mode analyze --appid 1351240

# Только валидация кандидатов
python pipeline.py --mode validate --genre Indie
```

**Windows quirks:** `qwen.cmd` (не `qwen`). Qwen = text analysis only. Trinity/opencode = shell executor.

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`[2026-03-01] OSINT research (Qwen), 10 ниш гипотез, H-06 оффер+шаблоны, silicon persona концепт | Silicon Persona MD шаблон + первый Steam анализ`
`[2026-03-03] Steam API OK, OSINT scoring layer, Wild Eight (abandoned), Simteract найден (93/100), Trinity написал pipeline (7 файлов) | Исправить код Trinity → pipeline готов`
`[2026-03-03] Исправлено 6 runtime багов (DuckDB params, timestamp, qwen.cmd, stdin, Win filenames), pipeline работает end-to-end, 195 reviews → 7 clusters → report.md + persona.md сгенерированы | Fix Key Quotes bug → validate Simteract → 15 outreach`
`[2026-03-04] Instagram ветка: аудитория (CX/UX researchers first), воронка (Harkly Enthusiast $9+ донат + Research Hub + Alpha + Telegram), Research Hub архитектура (CF stack, aggregator модель), GSAP видео PoC scene-01.html (12 Disney principles) | Контент-столпы + визуал + Playwright MP4 pipeline`
