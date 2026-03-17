# session-scratch.md — Write-Ahead Log (Harkly)
> Layer: L4 | Operational | Write-only during session, read+clear at session start

<!-- ENTRY:2026-03-17:CLOSE:151:harkly:harkly-marketing-content [AXIS] -->
## 2026-03-17 — сессия 151 CLOSE [Axis]

**Decisions:**
- Pipeline v0 = NEEDS REWORK. HN + GitHub дают нерелевантный контент для PM/UX аудитории
- Telethon = единственный quality source → primary в Antenna rework
- idea_hub.py (CRUD) — переиспользовать. Antenna + DeepResearcher — переписать с нуля
- Qwen CLI использован для кодинга (one-time authorization nopoint, только эта сессия)
- TelegramPerson v2 system_prompt — единственный production-ready компонент

**Files changed:**
- `brand/agents/idea_hub.py` — создан (CRUD, stdlib, переиспользовать)
- `brand/agents/antenna.py` — создан (⚠️ NEEDS REWORK)
- `brand/agents/deep_researcher.py` — создан (⚠️ NEEDS REWORK)
- `brand/agents/specs/` — 5 spec файлов создано
- `brand/ideas/hub.json` — инициализирован
- `brand/ideas/briefs/348668d1-...-brief.md` — тестовый brief (низкое качество, удалить)
- `memory/harkly-marketing-content.md` — обновлён (NEEDS REWORK + Phase 2 задачи)
- `memory/chronicle/harkly-current.md` — CLOSE #9 appended
- `memory/chronicle/index.md` — row #9 добавлен

**Completed:**
- Тестовый пост написан (Pillar 1, рекрутмент "9 из 13 чатов") — готов к публикации
- Pipeline v0 scaffold: idea_hub + antenna + deep_researcher
- End-to-end проверка: Antenna → Hub → DeepResearcher работает технически

**Opened:**
- ⚠️ Rework Antenna (Telethon primary, HN/GitHub secondary)
- ⚠️ Rework DeepResearcher (с нормальными источниками)
- GhostPerson + HabrPerson (Phase 1 остаток)
- Нужны TG_API_ID + TG_API_HASH для Telethon

**Notes:**
- Сегодняшний HN top-50 не содержал ни одной релевантной истории — не баг, просто сегодня
- Pipeline качество полностью зависит от Telethon — без него нет смысла
