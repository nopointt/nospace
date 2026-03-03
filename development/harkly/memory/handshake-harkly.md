# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-03 by Assistant

---

## Где мы сейчас

**Pre-launch, pipeline MVP готов.** CX OSINT Pipeline (7 Python файлов, DuckDB, Qwen) работает end-to-end. Первый Silicon Persona MD сгенерирован для Simteract (Taxi Life, 93/100 OSINT). Следующий шаг — отправить первые 15 outreach.

---

## Следующий приоритет

1. **Исправить баг Key Quotes** — в report.md показывает `[[...]` вместо реальных цитат. Проблема в JSON parsing `cluster.quotes` в report.py.
2. **Запустить validate.py для Simteract** — чтобы заполнить OSINT score в отчёте. `python validate.py --min-score 50` (предварительно нужно добавить appid 1351240 в candidates или запустить collect.py).
3. **Отправить 15 outreach** — Simteract (@simteract) — первый приоритет. Gift: persona.md. Шаблон: mobile-games-offer.md.
4. **Созвон с CPO ProxyMarket** (HARKLY-03) — nopoint организует. Перед созвоном отправить product-brief-v2.md.

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Состояние проекта | development/harkly/memory/current-context-harkly.md |
| Pipeline spec | development/harkly/branches/cx_osint_pipeline/pipeline-spec.md |
| Pipeline src | development/harkly/branches/cx_osint_pipeline/src/ |
| Сгенерированный persona.md | development/harkly/branches/cx_osint_pipeline/output/reports/1351240_Taxi Life_ A City Driving Simulator_persona.md |
| Гипотезы ниш | development/harkly/branches/landing-coldoutreach/hypotheses.md |
| H-06 оффер + шаблоны | development/harkly/branches/landing-coldoutreach/mobile-games-offer.md |
| Product Brief (для CPO) | docs/harkly/product-brief-v2.md |

---

## Открытые вопросы

- [ ] Key Quotes bug: как правильно парсить JSON-массив из DuckDB cluster.quotes в report.py?
- [ ] Нужен ли validate step перед analyze, или достаточно `_ensure_candidate()`?
- [ ] Silicon Persona — отдельный продукт или только lead magnet для Harkly?
- [ ] Web SaaS стек: Cloudflare Workers + D1 или PostgreSQL-RU?
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
