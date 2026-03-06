# HANDSHAKE — harkly
> Читай этот файл в начале любой harkly-сессии.
> Updated: 2026-03-06 by Assistant

---

## Где мы сейчас

Pre-launch. cx-platform Phase 1 complete + multi-source ETL (Steam + Reddit + GOG). Partner demo готов (start-demo.ps1). Analytics screen с bar chart + CSV export. Следующий шаг: cold outreach или Phase 2 white-label.

---

## Следующий приоритет

1. **Cold outreach** (HARKLY-06) — 15 outreach Simteract (@simteract), persona.md готов, шаблон готов
2. **Instagram** — контент-столпы (nopoint исследует конкурентов) + визуальная идентичность → контент-план
3. **Phase 2 cx-platform** — YouTube Data API (Tier 2 source) или white-label multi-tenancy (Durable Objects)
4. **CPO ProxyMarket созвон** — приоритет, docs полностью готовы

---

## Ключевые файлы для быстрого старта

| Нужно | Файл |
|---|---|
| Состояние проекта | development/harkly/memory/current-context-harkly.md |
| Partner demo launcher | development/harkly/cx-platform/start-demo.ps1 (run from cx-platform-web/) |
| Rust backend | development/harkly/cx-platform/src/ |
| Next.js web | development/harkly/cx-platform-web/app/ |
| Silicon Persona (lead magnet) | development/harkly/branches/cx_osint_pipeline/output/reports/1351240_Taxi Life_..._persona.md |
| H-06 оффер + шаблоны outreach | development/harkly/branches/landing-coldoutreach/mobile-games-offer.md |
| Product Brief (для CPO) | docs/harkly/product-brief-v2.md |

---

## Открытые вопросы

- [ ] Cold outreach — отправить первые 15 сообщений Simteract
- [ ] CPO ProxyMarket созвон — когда?
- [ ] Контент-столпы Instagram — результат исследования конкурентов у nopoint
- [ ] Визуальная идентичность — цвет, шрифт, стиль (nopoint рисует)
- [ ] Playwright MP4 pipeline — настроить recorder и bash-обёртку
- [ ] Key Quotes bug: JSON parsing cluster.quotes в report.py

---

## Tech: cx-platform Quick Reference

```powershell
# Kill old server before rebuild
taskkill /F /IM cx-platform.exe

# Start demo (from cx-platform-web/)
.\start-demo.ps1
# → Rust API :3000, Next.js :3001

# Multi-source research (POST body)
{ "name": "...", "appid": 1351240, "limit": 500,
  "reddit_query": "Taxi Life game",
  "gog_product_id": 1234567890 }
```

**Tier 1 sources active:** Steam (required) + Reddit (optional) + GOG (optional)

---

## Обновляй этот файл

После каждой сессии — 5 строк сюда.
Формат: `[дата] что сделано | что следующее`

`[2026-03-01] OSINT research (Qwen), 10 ниш гипотез, H-06 оффер+шаблоны, silicon persona концепт | Silicon Persona MD шаблон + первый Steam анализ`
`[2026-03-03] Steam API OK, OSINT scoring layer, Wild Eight (abandoned), Simteract найден (93/100), Trinity написал pipeline (7 файлов) | Исправить код Trinity → pipeline готов`
`[2026-03-03] Исправлено 6 runtime багов (DuckDB params, timestamp, qwen.cmd, stdin, Win filenames), pipeline работает end-to-end, 195 reviews → 7 clusters → report.md + persona.md сгенерированы | Fix Key Quotes bug → validate Simteract → 15 outreach`
`[2026-03-04] Instagram ветка: аудитория (CX/UX researchers first), воронка (Harkly Enthusiast $9+ донат + Research Hub + Alpha + Telegram), Research Hub архитектура (CF stack, aggregator модель), GSAP видео PoC scene-01.html (12 Disney principles) | Контент-столпы + визуал + Playwright MP4 pipeline`
`[2026-03-05] G3 Stage 1+2+3 DONE: cx-platform Rust end-to-end + Axum HTTP API. serve subcommand + collect subcommand. POST /api/v1/researches (async ETL spawn), GET /api/v1/researches/:id/signals (paginated), X-Tenant-ID middleware. cargo check passes 0 errors. | Stage 4: Next.js web UI or smoke test API with curl`
`[2026-03-06] G3 Stage 4a+4b+demo+analytics+tier1 DONE: smoke test ✅, Next.js 14 UI ✅, partner demo (start-demo.ps1), analytics screen (bar chart + CSV export), Tier 1 multi-source ETL (Steam+Reddit+GOG). cargo check + tsc clean. | Cold outreach Simteract или Phase 2 white-label`
