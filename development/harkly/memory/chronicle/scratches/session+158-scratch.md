<!-- ENTRY:2026-03-18:CHECKPOINT:158:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 158 [Axis]

**Decisions:**
- Студия фрейминга = гибридная модель, не один PICOT
- Input layer: любой NL (HMW / Problem Statement / JTBD / vague signal) — PM не обязан знать фреймворки
- AI классифицирует тип вопроса → выбирает фреймворк внутри
- User-facing: PM-нативный язык, не акронимы
- V1 priority stack: JTBD (primary) → SPICE → PEO → FINER (gate) → Issue Tree (advanced)
- PICOT/PICO — только advanced mode
- Market gap подтверждён: ни один инструмент не имеет framework-aware Framing Studio как first-class feature
- JTBD хорошо известен в RU PM-сообществе (GoPractice, ProductSense, ProductHood)

**Files changed:**
- `harkly/memory/harkly-design-ui.md` — добавлена секция "Framing Studio Architecture" с V1 решениями и design implications
- `nospace/docs/research/framing-frameworks-research.md` — создан агентом (735 строк, 10 фреймворков, comparison table, Harkly recommendation)

**Completed:**
- Ресёрч framing frameworks завершён (735 строк, 18 источников)
- Архитектурное решение по Студии фрейминга зафиксировано в L3
- Checkpoint #157 записан

**In progress:**
- —

**Opened:**
- Переделать Pencil F0: текущий дизайн показывает PICOT → нужен JTBD framing
- JTBD statement структура для F0: "Когда [ситуация] / хочу [мотив] / чтобы [результат]"
- Problem Statement как intake → AI классифицирует → предлагает фрейм

**Notes:**
- SPIDER внутренний (driving search logic), PMs не видят акроним
- ECLIPSE — too complex (6 элементов), только internal advanced use
- FINER = validation gate, не framing layer — показывать только Feasibility warning
- Dscout "Clarity Chain" (2025) — ближайший аналог, но это prompting methodology, не product module
- RU CIS контекст: JTBD известен, сравнение с конкурентами культурно комфортно, time pressure высокий → PEO/HMW лучше для быстрых вопросов

<!-- ENTRY:2026-03-18:CLOSE:159:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 159 CLOSE [Axis]

**Decisions:**
- F0 flow = двухшаговый: омнибар → Студия фрейминга (появляется после intent normalization)
- Omnibar-dialog для нормализации интента = отдельный эпик (не в текущем дизайне)
- JTBD framing реализован в Pencil F0 (Когда / Хочу / Чтобы)
- Collapsed state Студии фрейминга = 300×52px карточка с expand icon
- Compact header controls rule: 24px height, 16×16 icons, gap:8 (8px grid)
- `--border-subtle` → #E8DDD0 (warm, was #E3E3E3 cold)
- Harkly UI язык = русский, все лейблы переведены
- closeaxis скилл исправлен для harkly (Steps 3,4,5,8 + chronicle структура)

**Files changed:**
- `harkly/memory/harkly-design-ui.md` — L3: JTBD node IDs, 6 новых Pencil critical rules, токен border-subtle обновлён, JTBD rebuild задача закрыта
- `harkly/memory/harkly-roadmap.md` — L2: дата + HARKLY-15 в Next Priority #1
- `harkly/memory/harkly-about.md` — L1: Write Authority обновлён (chronicle entries)
- `~/.claude/commands/closeaxis.md` — Steps 3,4,5,8 исправлены для harkly
- `harkly/memory/chronicle/harkly-chronicle.md` — создан (ротационный архив)
- `harkly/memory/chronicle/queue/` + `queue/processed/` — созданы
- `untitled.pen` — F0 rebuilt: JTBD panel, header controls (JTBD+collapse+pin+X), collapsed card, border-subtle warm, "Спросите Harkly…"

**Completed:**
- [x] F0 Framing Studio rebuild: PICOT → JTBD (Когда/Хочу/Чтобы)
- [x] Header controls: JTBD chip + collapse + pin + X (compact 24px/16px/gap:8)
- [x] Collapsed card state нарисована
- [x] `--border-subtle` → #E8DDD0 warm
- [x] Omnibar placeholder → "Спросите Harkly…"
- [x] L3/L2/L1 полностью актуализированы
- [x] closeaxis skill исправлен (harkly chronicle paths)
- [x] Harkly chronicle структура создана (queue/, harkly-chronicle.md)

**Opened:**
- [ ] F1 Источники screen — следующий экран для дизайна
- [ ] Omnibar-dialog нормализации интента — отдельный эпик (не сейчас)
- [ ] Omnibar → reusable component (pending)
- [ ] SpineProgress bar в omnibar header (F1–F5)

**Notes:**
- Lucide X glyph оптически легче — принять как данность, не исправляется размером
- M() + layout drop bug: после M() всегда batch_get проверить layout
- set_variables формат: {type:"color",value:"#HEX"} — plain string не работает
- gap off-grid (gap:6) — запрещён, только кратные 4
