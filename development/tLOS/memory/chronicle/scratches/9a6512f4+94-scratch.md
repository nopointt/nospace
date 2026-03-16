# 9a6512f4+94-scratch.md
> Checkpoint · 2026-03-15 18:45

<!-- ENTRY:2026-03-15:CHECKPOINT:96:tlos:phase-10-analysis:design-bauhaus -->
## 2026-03-15 — checkpoint 96

**Decisions:**
- Параллельный лимит расширен: 10 → 15 → 20 агентов (согласовано nopoint)
- Zeitschrift на паузе (пропускаем)
- Gleizes PDF (#14) = 1964 Guggenheim каталог (EN), не Bauhausbuch — nopoint в курсе, принято
- Прямые экстракторы (без Lead) — финальный паттерн

**Files changed:**
- `nospace/docs/tLOS/design/bauhaus-code/` — 50+ batch .md файлов создано

**Completed:**
- #07 Gropius NA: 7/7 ✅ 100%
- #08 Moholy MPF: 7/7 ✅ 100%
- #09 Kandinsky: 11/11 ✅ 100%
- #10 Oud: 6/6 ✅ 100% (b05 был завис — перезапущен)
- #11 Malevich: 4/4 ✅ (из прошлой сессии)
- #12 Gropius Dessau: 12/12 ✅ 100%
- #13 Moholy VMA: 11/11 ✅ 100%
- #14 Gleizes: 6/7 (b07 в работе)

**In progress:**
- Gleizes b07 — последний батч всей экстракции (в работе)

**Opened:**
- После Gleizes b07 — Phase 1 экстракции завершена (без Zeitschrift)
- Следующий шаг: Design domain analysis (Phase 10 основная задача)

**Notes:**
- Bauhaus extraction pipeline v3.2: PNG (150 DPI) → Read → Extract → Write → Cleanup
- Oud b05 завис на >1.5ч → перезапущен с суффиксом _retry, успешно завершился
- Quota CLI/Max: cache_read = 1x (не 0.1x)
- AIA Monitor cron job ID: c9590392 (каждые 6ч)
- Все книги кроме Gleizes — оригинальные Bauhausbücher (DE)
