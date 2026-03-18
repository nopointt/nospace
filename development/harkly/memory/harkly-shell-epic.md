---
# harkly-shell-epic.md — Harkly Shell (Tauri + SolidJS)
> Layer: L3 | Epic: harkly-shell | Status: 📋 PLANNING
> Last updated: 2026-03-18 (session 168 — drag fix, floor/branch mechanics, scroll, snap removed)
---

## Goal

Собрать Harkly desktop shell на базе tLOS Tauri shell. SolidJS + Tailwind + Tauri v2. Рестайлить под Harkly warm light дизайн. Реализовать CJM Spine Flow.

## Source

- tLOS shell: `development/tLOS/core/shell/frontend/`
- Harkly copy: `development/harkly/harkly-shell/` (уже скопировано)
- Pencil дизайн: `design/harkly/harkly-ui.pen`
- CJM: `architecture/harkly-cjm-spine-flow.md`
- Design system: `design/harkly/` (tokens, guidelines, patterns)

## Stack

| Layer | tLOS (as-is) | Harkly (target) |
|---|---|---|
| Runtime | Tauri v2 | Tauri v2 (без изменений) |
| Frontend | SolidJS 1.8 | SolidJS 1.8 |
| Styling | Tailwind 3 + tlos-* tokens (dark) | Tailwind 3 + h-* tokens (warm light) |
| Font | Space Grotesk + JetBrains Mono | Inter + JetBrains Mono |
| Canvas | Space.tsx (canvas grid, viewport pan/zoom) | Space.tsx (cosmic latte #FFF8E7, warm grid #EBEBEB) |
| Omnibar | Bottom-center, dark, kernel WS → NATS | Bottom-LEFT, warm surface, kernel TBD |
| Frames | DynamicComponent + frameRegistry | Те же, рестайл |
| Window | Transparent, custom TrafficLights | TBD (transparent vs opaque) |
| Kernel | WebSocket → NATS → Python agents | TBD (Phase 2 — backend не в этом эпике) |

## Decisions (resolved 2026-03-18)

| # | Вопрос | Решение |
|---|---|---|
| D1 | Омнибар позиция | **Bottom-LEFT** как в Pencil дизайне |
| D2 | Kernel/чат | **Pseudo-NLP** — hardcoded сценарий, nopoint пишет реплики по скрипту, система отвечает заготовленными ответами |
| D3 | Floor navigation | **Pills + keyboard + механика перехода** — FloorPill/BranchPill/CoordPill в top-right + Ctrl+Alt+Scroll + AI-initiated transitions |
| D4 | Window chrome | **Без нативных декораций** — frameless, custom window controls |
| D5 | Transparency | **По дизайн системе** — opaque cosmic latte (#FFF8E7), shadow borders, warm surfaces |
| D6 | Фреймы | **Все фреймы нужны** — source frames, plan frame, framing studio, + предварительный дизайн F2-F5 |
| D7 | Scope | **Всё что есть + больше** — F0-F5 все этажи (F0-F1 детально, F2-F5 предварительно) |

## Phases

### Phase 1 — Visual Shell + Canvas

**Goal:** Запустить Tauri с Harkly дизайном. Cosmic latte canvas, warm omnibar bottom-left, Inter font, frameless window.

**1.1 Restyle (config + CSS)**
- [x] Tailwind tokens: tlos-* → h-* (23 Harkly tokens)
- [x] index.css: light theme base (bg #FFF8E7, text #1C1C1C, Inter)
- [x] index.html: Inter + JetBrains Mono fonts, title "Harkly", lang="ru"
- [x] tauri.conf.json: name "Harkly", identifier "io.harkly.app"
- [x] Space.tsx: cosmic latte bg (#FFF8E7), warm grid (#EBEBEB), 64px Baukasten grid
- [x] App.tsx: light theme classes, floor+branch filtering, auto-load harkly layout, spawn inheritance
- [x] DynamicComponent.tsx: Harkly chrome, animate-h-enter fix (moved to inner div)

**1.2 Omnibar restyle**
- [x] Omnibar.tsx: bottom-LEFT position (fixed bottom-6 left-6), warm surface bg
- [x] OmnibarInput.tsx: h-surface bg, h-blue accent dot, "Спросите Harkly…", shadow border
- [x] OmnibarBody.tsx: h-surface bg, h-text-1 text, warm dividers (#E8DDD0)
- [ ] OmnibarPanelAgent/Model/Context: warm light restyle

**1.3 Kernel mock**
- [x] kernel.ts: заглушить WebSocket — noop connect(), mock subscribe()
- [x] Pseudo-NLP engine: map of trigger phrases → scripted responses
- [ ] Scenario script (nopoint пишет реплики по скрипту, система отвечает заготовками)

**Verification:** `cargo tauri dev` → окно Harkly, cosmic latte фон, тёплая сетка 64px, омнибар bottom-left, ввод текста работает, scripted ответы.

### Phase 2 — Floor Navigation

**Goal:** 6 этажей с переключением и пиллами.

- [x] `useFloor.ts` hook: currentFloor (0-5), currentBranch, goToFloor, createBranch, switchBranch, 5 default branches
- [x] FloorPill component: dropdown with 6 floors, onSelectFloor
- [x] BranchPill component: dropdown with branches list + "Новая ветка"
- [x] CoordPill component: rightmost, "x: 0  y: 0", crosshair icon
- [x] Floor names: ["Фрейминг", "Планирование", "Сырые данные", "Инсайты", "Артефакты", "Блокнот"]
- [x] Keyboard: Ctrl+Alt+Scroll = floor switch + viewport reset
- [x] Keyboard: Ctrl+Shift+Scroll = branch switch + viewport reset
- [x] Scroll: plain=vertical pan, Shift=horizontal, scrollable frame passthrough
- [x] Canvas content filtered by currentFloor + currentBranch — Z-layer isolation
- [x] Auto-snap removed (useSnap simplified to pure drag/resize)
- [ ] Floor transition animation (viewport smooth pan — currently instant reset)
- [ ] AI-initiated transition: pseudo-NLP command triggers setFloor + viewport animation

**Verification:** Ctrl+Alt+Scroll переключает этажи, пиллы обновляются, канвас показывает контент текущего этажа.

### Phase 3 — F0 Фрейминг (Framing Studio)

**Goal:** Рабочий F0 со скриптовым Framing Studio flow.

- [ ] FramingStudio frame component (544px wide, warm surface, shadow border, cornerRadius:16)
- [ ] Header: "Студия фрейминга" + framework chip (JTBD/SPICE/PEO) + controls (minimize, pin, close)
- [ ] JTBD layout: 3 rows (Когда / Хочу / Чтобы) with EDE0C4 badges
- [ ] SPICE layout: 5 rows (Setting / Perspective / Intervention / Comparison / Evaluation)
- [ ] PEO layout: 3 rows
- [ ] FINER validation gate: 5 badges (Реализуемо=warning, rest=success)
- [ ] Footer: "Уточнить" + "Начать исследование" buttons
- [ ] Collapsed card state (300×52, icon + title + chip + expand)
- [ ] Pseudo-NLP: user types question → system populates JTBD fields → shows FINER → user clicks "Начать" → transition to F1
- [ ] Expanded omnibar with AI conversation during framing

**Verification:** Ввод вопроса → JTBD заполняется → FINER gate → "Начать" → переход на F1.

### Phase 4 — F1 Планирование (Collection Plan)

**Goal:** F1 с планом сбора и source frames.

- [ ] CollectionPlan frame (384px wide, warm surface, vertical layout)
  - Header: "План сбора" + badge "Готов"/"Планирую..."
  - Research question (inherited from F0)
  - Concept tags (отток, retention, онбординг, etc.)
  - Footer: "N источников · M запросов"
- [ ] SourceFrame component (320px wide, reusable)
  - Icon + name + description
  - Status dot + status text
  - Query line (search icon + query text)
- [ ] 6 source instances: Files, Telegram, Transcripts, Support, vc.ru, Habr
- [ ] Loading state: gray plan with spinner, sources appearing progressively
- [ ] Pseudo-NLP: AI says "начинаю план" → plan builds → sources appear → "план нравится?" → user "работаем" → transition to F2
- [ ] "Добавить источник" button → source picker overlay

**Verification:** AI строит план → источники появляются → query info видна → "работаем" → переход на F2.

### Phase 5 — F2-F5 Preliminary (placeholder floors)

**Goal:** Предварительный контент на каждом этаже чтобы при переключении было что показать.

- [ ] F2 Сырые данные: placeholder frame "Сбор данных..." + document list skeleton
- [ ] F3 Инсайты: placeholder frame "Извлечение инсайтов..." + insight card skeletons
- [ ] F4 Артефакты: placeholder frame "Артефакты" + artifact type selector (empathy map, fact pack, journey map)
- [ ] F5 Блокнот: empty canvas with "Рабочий стол исследования" label + note-taking frame

**Verification:** Все 6 этажей показывают контент при переключении.

### Phase 6 — Scripted Demo Scenario

**Goal:** Полный end-to-end сценарий для демо.

- [ ] Сценарий-скрипт (markdown): что nopoint пишет → что система отвечает → что появляется на канвасе
- [ ] Все transitions плавные (floor switch + frame appearance + omnibar expand/collapse)
- [ ] Таймеры для "AI thinking" delays (1-3 секунды для реалистичности)
- [ ] Reset command: сброс до начального состояния

**Verification:** nopoint проходит весь сценарий от F0 до F4, всё работает по скрипту.

### Phase 7 — Kernel Integration (future)

- [ ] WebSocket connection to backend
- [ ] Claude API integration for real AI chat
- [ ] Frame spawning from kernel messages
- [ ] Real data ingestion pipeline

## Files to Change

| File | Phase | Change |
|---|---|---|
| `tailwind.config.js` | 1 ✅ | h-* tokens |
| `src/index.css` | 1 ✅ | Light theme |
| `index.html` | 1 ✅ | Inter, title |
| `src-tauri/tauri.conf.json` | 1 ✅ | Harkly name |
| `src/components/Space.tsx` | 1 | Cosmic latte + warm grid |
| `src/App.tsx` | 1 | Light theme, remove tLOS |
| `src/components/Omnibar.tsx` | 1 | Bottom-LEFT, warm |
| `src/components/OmnibarInput.tsx` | 1 | Warm input |
| `src/components/OmnibarBody.tsx` | 1 | Warm chat |
| `src/kernel.ts` | 1 | Noop + pseudo-NLP engine |
| `src/hooks/useFloor.ts` | 2 | NEW — floor/branch state |
| `src/components/FloorPill.tsx` | 2 | NEW — floor indicator |
| `src/components/BranchPill.tsx` | 2 | NEW — branch indicator |
| `src/components/CoordPill.tsx` | 2 | NEW — coordinate display |
| `src/components/frames/FramingStudio.tsx` | 3 | NEW — F0 content |
| `src/components/frames/CollectionPlan.tsx` | 4 | NEW — F1 plan |
| `src/components/frames/SourceFrame.tsx` | 4 | NEW — F1 source card |
| `src/data/scenario.ts` | 6 | NEW — scripted demo data |

## Constraints

- **Disk space:** ~4.8 GB free (after tLOS target clean). Tauri build needs ~2 GB.
- **Rust/Cargo:** installed (1.93.1). Tauri CLI: NOT installed (`cargo install tauri-cli` needed ~200 MB).
- **node_modules:** copied from tLOS, should work for vite dev.

## Blockers

- `cargo install tauri-cli` нужен перед первым запуском
- Disk space tight — мониторить при сборке
