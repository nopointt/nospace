<!-- ENTRY:2026-03-18:CHECKPOINT:155:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 155 [Axis]

**Decisions:**
- 3-pill top-right indicator: FloorPill (этаж) / BranchPill (ветка) / CoordPill (координаты) — каждый кликабелен
- Omnibar Expanded → full height 852px (y:24, 900-24-24=852)
- 6 floor artboards F0–F5 скопированы из Expanded, каждый с правильным FloorPill label
- Floor структура финализирована: F0 Scratchpad / F1 Connectors / F2 Raw / F3 Insights / F4 Artifacts / F5 Stakeholders
- Icon font: Lucide доступен нативно в Pencil MCP — никакого pack install не нужно
- FloorPill + BranchPill → `lucide chevron-down` (не Unicode ▾/▼ — Inter их не рендерит)
- CoordPill → текст "x: 0  y: 0" + `lucide crosshair` (gap:6)
- Пилюли: x:1008/1136/1288, y:16 — правый край 24px (= omnibar левый margin)
- Тёплые серые — Bauhaus RAG подтвердил (Kandinsky Grundfläche + Oud Tönung):
  - `--bg-surface`: #F8F8F8 → #F5EDD8
  - `--bg-elevated`: #FFFFFF → #EDE0C4 (новый смысл: floating UI)
  - `--bg-pressed` (новый токен): #E0CFA9
  - `--interactive-hover`: #F5F5F5 → #F0E8D5
  - `--interactive-pressed`: #E3E3E3 → #E0CFA9

**Files changed:**
- `untitled.pen` — 3 пилюли на 8 артбордах; chevron-down + crosshair иконки; омнибар full height; 6 floor artboards; warm gray tokens применены
- `nospace/development/harkly/memory/harkly-design-ui.md` — L3 создан (startaxis) + обновлён: floor structure, icon system, полный task list, token decisions

**Completed:**
- 3-pill indicator на всех 8 артбордах (Collapsed + Expanded + F0–F5)
- lucide chevron-down в FloorPill/BranchPill всех артбордов
- lucide crosshair в CoordPill всех артбордов
- Omnibar Expanded полная высота
- 6 floor artboards F0–F5 с правильными метками
- Warm gray token system (RAG-confirmed, применено в Pencil variables)
- L3 harkly-design-ui.md составлен и актуализирован
- Spine-процесс изучен (оба архитектурных дока прочитаны): 6 стадий = 6 этажей

**In progress:**
- Следующий шаг: проектирование экранов F0–F5 по архитектурным докам

**Opened:**
- FloorPill/BranchPill/CoordPill → нужны как reusable компоненты в ejLN6 (сейчас one-off)
- Dropdown overlay компонент (список этажей + список веток)
- SpineProgress bar в header омнибара (F1-F5, не F0)
- `--border-subtle` (#E3E3E3) остался холодным — возможно нужен warm вариант
- Решение: с какого экрана начинать F0 или сразу F2/F3?

**Notes:**
- Lucide иконки: `plus`, `search`, `message-circle`, `triangle`, `arrow-up`, `chevron-down`, `crosshair` — подтверждены в Pencil
- RAG-агент: 73K токенов, 28 tool calls, 165s — источники Kandinsky (Grundfläche) + Oud (Tönung)
- Warm gray derivation: hue ~40°, lightness -5-7pt per step, saturation чуть растёт — тепловая семья сохраняется

<!-- ENTRY:2026-03-18:CLOSE:156:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 156 CLOSE [Axis]

**Decisions:**
- Shell UI архитектура зафиксирована: 3 пилюли топ-райт + Omnibar bottom-left + 6 floor artboards
- Floor структура: F0 Scratchpad / F1 Connectors / F2 Raw / F3 Insights / F4 Artifacts / F5 Stakeholders
- Lucide иконки нативны в Pencil MCP — icon pack не нужен
- Warm gray token system: Bauhaus RAG (Kandinsky + Oud) → 3-ступенчатая тёплая шкала

**Files changed:**
- `untitled.pen` — shell UI полностью: 8 артбордов, 3 пилюли, иконки, full-height omnibar, warm tokens
- `nospace/development/harkly/memory/harkly-design-ui.md` — L3 создан и актуализирован
- `nospace/development/harkly/memory/harkly-about.md` — Active L3 обновлён
- `nospace/development/harkly/memory/harkly-roadmap.md` — harkly-design-ui добавлен в Active Epics

**Completed:**
- Полный shell UI: collapsed + expanded + 6 floors (8 артбордов итого)
- Warm gray token system применён в Pencil
- L3 harkly-design-ui.md составлен (floor map, icon system, task list)
- Spine-процесс изучен по обоим архитектурным документам

**Opened:**
- Проектирование экранов F0–F5
- Пилюли → reusable компоненты
- Dropdown overlay компонент
- SpineProgress в header омнибара F1–F5

**Notes:**
- Следующая сессия: начинать с F0 Scratchpad или сразу F2/F3 (nopoint решает)
- `--border-subtle` (#E3E3E3) остался холодным — низкий приоритет пока
