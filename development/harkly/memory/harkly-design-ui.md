---
# harkly-design-ui.md — Harkly UI Design Epic
> Layer: L3 | Epic: harkly-design-ui | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-18 (close #156, Axis)
---

## Goal

Design the full Harkly UI in Pencil MCP: infinite canvas shell + UC-2/UC-3 screens.
Light theme. Baukasten 8px grid. Schlemmer spatial zones. Thelos design system tokens.

## Pencil File

`C:\Users\noadmin\AppData\Local\Programs\Pencil\untitled.pen`

## Key Node IDs

| Node | ID | Notes |
|---|---|---|
| Component library frame | ejLN6 | 17 components (buttons, inputs, badges, cards, SpineProgress) |
| Shell · Omnibar Collapsed | 7OCdH | 1440×900 artboard |
| Shell · Omnibar Expanded | yil9s | 1440×900 artboard, omnibar 360×852 full height |
| F0 · Scratchpad | oeslM | floor artboard |
| F1 · Connectors | 4d2op | floor artboard |
| F2 · Raw | 4nrvq | floor artboard |
| F3 · Insights | MnI3g | floor artboard |
| F4 · Artifacts | 4Q98Z | floor artboard |
| F5 · Stakeholders | xhXjO | floor artboard |
| Omnibar collapsed pill | fYZfh | 320×48, bottom-left, shadow border |
| Omnibar expanded panel | keCtm | 360×852, bottom-left, shadow border, full height |

## Icon System

- **Font:** Lucide (available in Pencil MCP natively — no pack install needed)
- CoordPill icon: `crosshair`
- FloorPill / BranchPill icon: `chevron-down`
- Omnibar send button: `arrow-up`
- Usage: `{type:"icon_font", iconFontFamily:"lucide", iconFontName:"<name>", width:14, height:14}`

## Design Decisions (frozen)

- Grid: Baukasten 8px base → 64px visual grid (8×8)
- Background: `$--bg-canvas` = #FFF8E7 (comic latte)
- Grid lines: #EBEBEB
- Omnibar: bottom-LEFT (not center — distinct Harkly pattern)
- Border style: shadow workaround (Pencil stroke silently drops)
- Padding in Pencil: `[vertical, horizontal]` CSS shorthand order

## Token System

18 variables in Pencil. Key tokens:
- `--bg-canvas` = #FFF8E7
- `--bg-surface` = #F8F8F8 (⚠️ may need warm variant #F5EDD8 — pending decision)
- `--border-default` = #C6C6C6
- `--accent-blue` = #1E3EA0
- `--text-tertiary` = #8E8E8E

## Tasks

### Shell (done)
- [x] Component library: 17 components (Button×5, Input×2, Badge×7, Card×2, SpineProgress)
- [x] Base shell: Omnibar Collapsed artboard (1440×900)
- [x] Base shell: Omnibar Expanded artboard (1440×900, omnibar full height)
- [x] 64px Baukasten grid on both artboards
- [x] Comic latte background via token
- [x] 3-pill top-right indicator (FloorPill / BranchPill / CoordPill)
- [x] FloorPill: lucide chevron-down icon
- [x] BranchPill: lucide chevron-down icon
- [x] CoordPill: lucide crosshair icon
- [x] 6 floor artboards (F0–F5) с правильными FloorPill labels
- [x] Floor structure defined: F0 Scratchpad / F1 Connectors / F2 Raw / F3 Insights / F4 Artifacts / F5 Stakeholders

### Token system (in progress)
- [ ] `--bg-surface` warm variant — ждём RAG-агента (тёплые серые под Cosmic Latte)
- [ ] Добавить `--bg-elevated` токен для floating UI (пилюли, тулбары)
- [ ] Обновить значения в Pencil variables после решения по токенам

### Screens (not started)
- [ ] F0 Scratchpad — пустой канвас, Omnibar, Framing Studio появляется при вводе
- [ ] F1 Connectors — список интеграций, OAuth статусы, API квоты
- [ ] F2 Raw — corpus list, triage (include/exclude), document viewer
- [ ] F3 Insights — граф знаний, entity list, цитаты с источниками
- [ ] F4 Artifacts — Empathy Map / Fact Pack / Journey Map с drill-down до F3→F2
- [ ] F5 Stakeholders — export, аудитория-preset, форматы (PDF/PPTX/MD)

### Components (pending)
- [ ] Omnibar → reusable component (сейчас one-off frames)
- [ ] FloorPill / BranchPill / CoordPill → reusable компоненты в ejLN6
- [ ] Dropdown overlay компонент (для FloorPill/BranchPill списков)
- [ ] SpineProgress bar в header омнибара (F0 не нужен, F1–F5 показывает прогресс)

## Open Issues

- [ ] `--bg-surface` warm variant: RAG-агент запущен, ждём рекомендации
- [ ] Stroke format unresolved → shadow workaround до решения Pencil MCP
- [ ] Pencil icon pack: Lucide доступен нативно ✅ — никакого pack install не нужно

## Blockers

нет
