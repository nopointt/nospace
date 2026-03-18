---
# harkly-design-ui.md — Harkly UI Design Epic
> Layer: L3 | Epic: harkly-design-ui | Status: 🔶 IN PROGRESS
> Last updated: 2026-03-18 (session 165 CLOSE — design system 19 docs, F1 Sources 6 artboards, Bauhaus RAG validated, architecture restructured)
---

## Goal

Design the full Harkly UI in Pencil MCP: spatial canvas shell + floor screens.
Light warm theme. Baukasten 8px grid. Harkly design system (`nospace/design/harkly/`).

## Pencil File

`nospace/design/harkly/harkly-ui.pen`

## Required Reading Before Any Design Work

Read these files IN THIS ORDER before touching Pencil:

| # | File | Why |
|---|---|---|
| 1 | `design/harkly/harkly-spatial-interface-rules.md` | Canvas, frames, omnibar, floors, branches. What spatial means. Anti-patterns. |
| 2 | `design/harkly/foundations/philosophy.md` | Brand → design bridge. Warm Bauhaus. What Harkly is NOT. |
| 3 | `design/harkly/foundations/principles.md` | 5 Bauhaus principles adapted for Harkly. Rounded corners, warm shadows, breathing space. |
| 4 | `design/harkly/guidelines/color.md` | 21 tokens, warm palette rules, green for success, chromatic restraint. |
| 5 | `design/harkly/guidelines/spacing.md` | Scale {4..80}, breathing must be justified, component aliases. |
| 6 | `design/harkly/guidelines/elevation.md` | Light theme elevation, shadow as structural signal, z-index scale, Pencil workaround. |
| 7 | `design/harkly/guidelines/data-visualization.md` | Charts, graphs, entity lists, quote display, empathy map, tables. |
| 8 | `design/harkly/guidelines/pencil-naming.md` | Node naming convention: components, artboards, internal nodes. |
| 9 | `development/harkly/brand/omnibar-primacy.md` | Omnibar = primary input. Floors = spatial canvas. No dashboard patterns. |
| 10 | `development/harkly/brand/ui-language-ru.md` | All UI text in Russian. Floor name translations. |

**Skip reading = skip designing.** These docs ARE the design system. Pencil tokens and components implement them.

## Key Node IDs

| Node | ID | Notes |
|---|---|---|
| Component library frame | ejLN6 | 17 components (buttons, inputs, badges, cards, SpineProgress) |
| Shell · Omnibar Collapsed | 7OCdH | 1440×900 artboard, x:0 y:1176 |
| Shell · Omnibar Expanded | yil9s | 1440×900 artboard, x:1500 y:1176 |
| F0 · Scratchpad | oeslM | 1440×900, x:0 y:2176 |
| F1 · Источники | GATr5 | 1440×900, x:1500 y:2176 (WIP — has dashboard layout from earlier session, needs spatial redo) |
| F2 · Raw | 4nrvq | 1440×900, x:3000 y:2176 |
| F3 · Insights | MnI3g | 1440×900, x:4500 y:2176 |
| F4 · Artifacts | 4Q98Z | 1440×900, x:6000 y:2176 |
| F5 · Stakeholders | xhXjO | 1440×900, x:7500 y:2176 |
| Omnibar collapsed pill | fYZfh | 320×48, x:24 y:828, cornerRadius:24, shadow border |
| Omnibar expanded panel | keCtm | 360×852, x:24 y:24, cornerRadius:16, shadow border |
| Omnibar · LogoDot | e259P | 8×8, fill $--accent-blue |
| Omnibar · Placeholder | 7BofV | fill_container, $--text-tertiary |
| Omnibar · SendBtn | sIhoZ | 32×32, $--accent-blue, lucide arrow-up |
| Omnibar expanded · Header | koe96 | fill_container×52, padding:[0,16], bottom divider #E8DDD0 |
| Omnibar expanded · Body | seIAG | fill_container×fill_container, $--bg-surface, padding:16 |
| Omnibar expanded · Divider | 4e4x5 | fill_container×1, $--border-subtle |
| Omnibar expanded · InputRow | hqN5U | fill_container×52, padding:[0,16] |
| **F0 Framing Studio nodes (JTBD layout ✅)** | | |
| F0 · Framing Studio panel | j5n3U | x:640 y:150, 544px wide, vertical layout, bg-surface, shadow border |
| F0 · FS Header frame | JnD93 | fill_container |
| F0 · FS Title row | SZvLI | horizontal, space_between |
| F0 · FS Title text | p9aSx | "Студия фрейминга" |
| F0 · FS JTBD chip group | 1e55k | horizontal, gap:8 — contains chip + X |
| F0 · FS JTBD chip | OScrE | fill:#EDE0C4, cornerRadius:4, padding:[2,6] |
| F0 · FS JTBD label | OqRyf | "JTBD", text-secondary, 10px |
| F0 · FS Close icon | cPd6C | lucide x, text-tertiary |
| F0 · FS Question text | JYXtL | question display |
| F0 · FS Divider 1 | qYftV | — |
| F0 · FS Table body | eTecO | JTBD rows (Когда / Хочу / Чтобы) |
| F0 · Row Когда / Badge / Value | 6DCt5 / E20yQ / wN0k3 | badge: 64px, #EDE0C4 |
| F0 · Row Хочу / Badge / Value | yfUHb / qJv6S / fzBq4 | badge: 64px, #EDE0C4 |
| F0 · Row Чтобы / Badge / Value | hTLyT / s9JDf / 60QU1 | badge: 64px, #EDE0C4 |
| F0 · FS Divider 2 | CsV1P | — |
| F0 · FS Footer | 8pBUd | Уточнить (SUBXx/dXnDo) + Начать исследование (sv14P/C8efQ) |
| F0 · FloorPill | MzfcR | text "Черновик" = Rry8L |
| F0 · Screen label | lTH5M | — |
| F0 · Omnibar expanded | pFhBG | — |
| **F0 Variants artboard (Framing Studio layouts)** | | |
| copiedF0 artboard | ugSNR | 1440×900, x:0 y:3176 — F0 variant exploration |
| copiedF0 · Framing Studio panel variant | icVH5 | 544×416, x:640 y:150 — tabular layout, NPS/SPICE framework display (segment rows with colored badges) |

## Artboard Structure (all 8 artboards identical)

```
Artboard (1440×900, fill:$--bg-canvas, layout:none)
├── Grid (64px Baukasten: 14H + 22V lines #EBEBEB, z:0)
├── ScreenLabel (text, $--text-tertiary, x:24 y:16)
├── FloorPill (120×28, x:1008 y:16, cornerRadius:14, $--bg-surface, gap:6)
│   ├── text "Scratchpad" / "Connectors" / etc. ($--text-secondary, fontSize:11)
│   └── icon_font lucide chevron-down (14×14)
├── BranchPill (144×28, x:1136 y:16, cornerRadius:14, $--bg-surface, gap:6)
│   ├── text "Branch 1" ($--text-secondary, fontSize:11)
│   └── icon_font lucide chevron-down (14×14)
├── CoordPill (128×28, x:1288 y:16, cornerRadius:14, $--bg-surface, gap:6)
│   ├── text "x: 0  y: 0" ($--text-secondary, fontSize:11)
│   └── icon_font lucide crosshair (14×14)
└── Omnibar [collapsed 320×48 / expanded 360×852] (x:24, bottom-left)
```

Pill right edges: FloorPill 1008+120=1128 / BranchPill 1136+144=1280 / CoordPill 1288+128=1416 (24px from edge).

## Icon System

- **Font:** Lucide (available in Pencil MCP natively — no pack install needed)
- CoordPill icon: `crosshair`
- FloorPill / BranchPill icon: `chevron-down`
- Omnibar send button: `arrow-up`
- Confirmed icons: `plus`, `search`, `message-circle`, `triangle`, `arrow-up`, `chevron-down`, `crosshair`
- Usage: `{type:"icon_font", iconFontFamily:"lucide", iconFontName:"<name>", width:N, height:N}`
- ⚠️ Unicode ▾ (U+25BE) и ⊕ (U+2295) — Inter не рендерит → always use Lucide icon_font

## Design Decisions (frozen)

- Grid: Baukasten 8px base → 64px visual grid (8×8)
- Background: `$--bg-canvas` = #FFF8E7 (Cosmic Latte)
- Grid lines: #EBEBEB (slightly warm)
- Omnibar: bottom-LEFT (not center — distinct Harkly pattern)
- Border style: shadow effect workaround (Pencil stroke silently drops)
- Padding in Pencil: `[vertical, horizontal]` CSS shorthand order
- Warm gray rationale: Kandinsky Grundfläche (hue ~43°) + Oud Tönung → surfaces in same thermal family. Derivation: hue ~40°, lightness -5-7pt per step, saturation increases slightly

## Token System (21 variables in Pencil — all updated)

| Token | Value | Notes |
|---|---|---|
| `--bg-canvas` | #FFF8E7 | Cosmic Latte ✅ |
| `--bg-surface` | #F5EDD8 | warm ✅ (was #F8F8F8) |
| `--bg-elevated` | #EDE0C4 | warm ✅ (new — floating UI: pills, toolbars) |
| `--bg-pressed` | #E0CFA9 | warm ✅ (new) |
| `--interactive-hover` | #F0E8D5 | warm ✅ (was #F5F5F5) |
| `--interactive-pressed` | #E0CFA9 | warm ✅ (was #E3E3E3) |
| `--accent-blue` | #1E3EA0 | — |
| `--accent-red` | #C82020 | — |
| `--accent-yellow` | #F2C200 | — |
| `--text-primary` | #1C1C1C | — |
| `--text-secondary` | #555555 | — |
| `--text-tertiary` | #8E8E8E | — |
| `--text-disabled` | #C6C6C6 | — |
| `--border-default` | #C6C6C6 | — |
| `--border-subtle` | #E8DDD0 | warm ✅ (was #E3E3E3) |
| `--border-strong` | #AAAAAA | — |
| `--signal-error` | #C82020 | — |
| `--signal-info` | #1E3EA0 | — |
| `--signal-warning` | #F2C200 | — |
| `--signal-success` | #2D7D46 | new ✅ (FINER I/N/E/R text) |
| `--signal-success-bg` | #EAF4EB | new ✅ (FINER I/N/E/R badge fill) |

## ⚠️ Pencil MCP Critical Rules

| Rule | Detail |
|---|---|
| **stroke** | Silently drops with no error. **Always use** `effect:{type:"shadow",...}` for borders |
| **border tokens** | **CRITICAL:** `effect.shadow` does NOT accept token variables (`$--token`). Always use **hardcoded hex** for shadow color in borders |
| **padding** | Order is `[vertical, horizontal]` (CSS shorthand — NOT reversed) |
| **effect shadow** | Does NOT accept `x`/`y` properties — only `blur`, `spread`, `color` |
| **text nodes** | Property is `content`, not `value` |
| **icon_font** | Requires `iconFontFamily` + `iconFontName` + explicit `width`/`height` |
| **M() + layout bug** | After `M()` into a new frame — always `batch_get` and verify `layout` didn't drop. If missing → `U(id, {layout:"horizontal"})` immediately |
| **gap off-grid** | gap must always be a multiple of 4px (4, 8, 12, 16, 24...). gap:6 — off-grid, never use |
| **set_variables format** | Must be `{"--token": {"type":"color","value":"#HEX"}}` — plain string `"#HEX"` throws error |
| **Lucide X optical weight** | `x` glyph is visually lighter than other icons at same px size. Accept it — resizing doesn't fix it |
| **Compact header controls** | Baukasten rule: uniform 24px height, icons 16×16, gap between icons 8px, gap chip→icons 8px |
| **flexbox children x/y** | In flexbox-layout row frames, x/y of children are IGNORED. Fix column alignment via `gap` on the parent row frame, not x on child text node |
| **badge justifyContent** | Badge frames use `justifyContent:"center"` — intentional design. Do NOT change to flex-start (breaks pill visual) |

## Floor Architecture

| Floor | Name | Content |
|---|---|---|
| F0 | Черновик | Empty canvas, Omnibar, Framing Studio (appears on question input — JTBD primary) |
| F1 | Источники | Source status frames on spatial canvas — infrastructure overview |
| F2 | Raw | Corpus list, triage include/exclude, document viewer |
| F3 | Insights | Knowledge graph, entity list, quotes with drill-down to F2 |
| F4 | Artifacts | Empathy Map / Fact Pack / Journey Map / Evidence Map, drill-down F3→F2 |
| F5 | Stakeholders | Export: PDF/PPTX/MD, audience presets (C-Suite / Product / Research) |

Spine stages: Framing → Planning → Ingestion → Extraction → Synthesis → Notebook

**Branch model (updated 2026-03-18):**
- F0 is NOT global — it's per-branch. Branch 1 has its own F0, Branch 2 has its own F0 (separate empty canvas).
- New branch = new F0 (empty scratchpad) + F1–F5 isolated instances.
- No shared canvas across branches.

**PICOT bar (resolved 2026-03-18):**
- NOT sticky by default anywhere.
- Visibility controlled by user (toggle). No persistent PICOT context bar on all floors.

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
- [x] 6 floor artboards (F0–F5) with correct FloorPill labels

### Token system (done)
- [x] `--bg-surface` warm variant → #F5EDD8
- [x] `--bg-elevated` token → #EDE0C4 (floating UI)
- [x] `--bg-pressed` token → #E0CFA9 (new)
- [x] `--interactive-hover` / `--interactive-pressed` warm variants
- [x] All 19 tokens updated in Pencil variables
- [x] `--signal-success` + `--signal-success-bg` added (21 total)
- [ ] `--signal-warning-bg` + `--signal-warning-text` (FINER F-badge hardcode #FFF3CD/#B8860B)

### Screens
- [x] F0 Черновик — Framing Studio all V1 frameworks: JTBD ✅ SPICE ✅ PEO ✅ Issue Tree ✅ FINER ✅ · value text alignment fixed · formal tokens applied
- [ ] F1 Источники — source status frames on spatial canvas (see `design/harkly/guidelines/data-visualization.md`)
- [ ] F2 Raw — corpus list, triage (include/exclude), document viewer
- [ ] F3 Insights — knowledge graph, entity list, quotes with sources
- [ ] F4 Artifacts — Empathy Map / Fact Pack / Journey Map with drill-down to F3→F2
- [ ] F5 Stakeholders — export, audience presets, formats (PDF/PPTX/MD)

### Components (pending)
- [ ] Omnibar → reusable component (currently one-off frames)
- [ ] FloorPill / BranchPill / CoordPill → reusable components in ejLN6
- [ ] Dropdown overlay component (floor + branch lists)
- [ ] SpineProgress bar in omnibar header (F1–F5 only, not F0)

## Framing Studio Architecture (resolved 2026-03-18)

**Source:** `nospace/docs/research/framing-frameworks-research.md` (735 lines, full research)

### Core decision: гибридная модель, не один фреймворк

**Input layer:** Принимать любой NL — HMW, Problem Statement, JTBD, расплывчатый сигнал. Не заставлять PM знать фреймворки.

**AI classification (internal):**
- Exploratory qualitative CX → **SPIDER** (drives source/method recommendations)
- Service/experience evaluation → **SPICE**
- Hypothesis testing / A-B review → **PICO(T)**
- Complex multi-branch → **Issue Tree** → затем SPIDER/SPICE per branch
- Discovery / generative → **JTBD** → затем SPIDER для evidence

**User-facing output:** PM-native язык (не "S-P-I-D-E-R элементы", а "Кто / Что изучаем / Как / Что ищем"). Название фреймворка — информационный лейбл, не primary UI.

**FINER gate (internal):** Score по Feasibility и Relevance перед финализацией. Флагировать слишком широкие или нереализуемые вопросы.

### V1 Priority Frameworks

| # | Фреймворк | Роль | Аудитория |
|---|---|---|---|
| 1 | **JTBD Framing** | Primary frame для discovery/exploratory | PM-нативный, знаком в RU (GoPractice, ProductSense) |
| 2 | **SPICE** | Service/experience evaluation | Internal — показывать в PM-нативном языке |
| 3 | **PEO** | Quick fallback для простых вопросов | Минимальный, 3 элемента |
| 4 | **FINER** | Validation gate (internal) | Показывать только Feasibility warning |
| 5 | **Issue Tree** | Advanced mode, сложные программы | Power users |

**PICOT/PICO** → advanced mode only. Только если PM явно тестирует гипотезу с измеримыми outcomes.

### Design implications для F0 Pencil

- ~~Текущий Pencil F0 показывает PICOT~~ — ✅ DONE, rebuilt to JTBD framing (session 162)
- JTBD statement: "Когда [ситуация], я хочу [мотив], чтобы [результат]"
- Дополнительно: Problem Statement как entry (первое что PM вводит) → AI классифицирует → предлагает JTBD/SPICE/PEO
- Название "Студия фрейминга" ✅ — корректно отражает концепцию
- Market gap: ни один существующий инструмент не имеет framework-aware Framing Studio как first-class feature

## Open Issues

- [x] Переделать Pencil F0: PICOT → JTBD framing (primary V1 frame) ✅ 2026-03-18
- [x] `--border-subtle` → #E8DDD0 (warm) ✅ 2026-03-18
- [x] All V1 Framing Studio frameworks finalized ✅ 2026-03-18
- [x] Value text column alignment fixed (gap:8, PEO badge 80px) ✅ 2026-03-18
- [ ] `--signal-warning-bg` + `--signal-warning-text` tokens (FINER F-badge hardcode)
- [ ] Omnibar frames → reusable components (currently one-off)
- [ ] Omnibar placeholder "Ask Harkly…" → перевести на русский

## Blockers

нет
