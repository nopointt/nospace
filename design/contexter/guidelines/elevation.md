# Elevation Guidelines — Contexter

Adapted from Harkly `guidelines/elevation.md`. Cold elevation model.

---

## Elevation Model

| Level | Token | Value | Use |
|---|---|---|---|
| elevation.0 | `--bg-canvas` | #FAFAFA | Page ground |
| elevation.1 | `--bg-surface` | #F2F2F2 | Cards, panels, table headers |
| elevation.2 | `--bg-elevated` | #E5E5E5 | Hover states, dropdowns |
| elevation.3 | `--bg-pressed` | #D9D9D9 | Pressed state, modals |

Direction: ground is lightest, elevation adds darkness. Each step descends ~5 lightness points. Pure gray (hue 0°).

---

## Rule 1 — No Shadows

**Departure from Harkly.** Harkly permits structural shadows (blur:0 borders, blur:8 float). Contexter uses NO shadows whatsoever.

Elevation communicated through background color shift + border only. Van Doesburg: "pure plastic means — line and plane."

---

## Rule 2 — Elevation Through Color Shift

Primary elevation signal is background token shift. `--bg-canvas` → `--bg-surface` → `--bg-elevated`.

---

## Rule 3 — z-index Scale (from Harkly)

| Stratum | z-index | Use |
|---|---|---|
| Content | 0 | Normal flow |
| Sticky | 100 | Navigation, persistent UI |
| Dropdown | 200 | Dropdowns, popovers |
| Modal backdrop | 300 | Scrim |
| Modal | 400 | Modals, dialogs |

---

## Rule 4 — Borders as Structural Lines

| Token | Value | Use |
|---|---|---|
| `--border-subtle` | #E5E5E5 | Dividers, row borders |
| `--border-default` | #CCCCCC | Input/card borders |
| `--border-strong` | #808080 | Active/focused elements |

Mondrian: "The border is a structural line separating planes."
