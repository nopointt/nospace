# Elevation Guidelines — Harkly (Light Theme)

Adapted from tLOS `design/design_system/guidelines/elevation.md`. Light theme elevation model.

---

## Elevation Model

tLOS uses dark-to-lighter elevation (darker = deeper, lighter = elevated). Harkly inverts: lighter = ground, slightly darker/warmer = elevated.

| Level | tLOS (dark) | Harkly (light) | Token | Use |
|---|---|---|---|---|
| elevation.0 | #000000 (Malevich black) | #FFF8E7 (Cosmic Latte) | `--bg-canvas` | Canvas ground |
| elevation.1 | #1C1C1C | #F5EDD8 | `--bg-surface` | Panels, frames, cards |
| elevation.2 | #393939 | #EDE0C4 | `--bg-elevated` | Floating UI: pills, toolbars, dropdowns |
| elevation.3 | #393939 | #E0CFA9 | `--bg-pressed` | Modals, overlays (pressed state) |
| overlay | #00000099 | warm tint TBD | — | Scrim behind modals |

**Direction:** ground is lightest, elevation adds warmth/darkness. Each step descends ~5-7 lightness points while staying in the same hue family (~43 deg).

---

## Rule 1 — No Drop Shadows Simulating Physical Light

**Rule:** Never use drop shadows with directional offset to simulate a light source.

**Harkly adaptation:** Shadows ARE used in Harkly, but as structural spatial signals:
- `effect:shadow, spread:1, blur:0` = structural border (replaces stroke — Pencil limitation)
- `effect:shadow, blur:8, offset:y:2` = subtle float signal for elevated elements
- `effect:shadow, blur:24` = soft ambient glow for major floating panels

**Prohibited:** Shadows that simulate a directional light source (sun from top-left). Shadows must be uniform or minimal-directional.

**Test:** Cover the shadow with your hand. Does the element still read as elevated? If yes, the shadow is decorative — reduce or remove it. If no, the shadow is structural — keep it.

**Pencil tool workaround:** `effect:shadow, spread:1, blur:0` is used as a border replacement because Pencil MCP silently drops `stroke`. This is a tool limitation, not a design decision. Materialwahrheit (Gropius P-01) would prefer a true border (stroke). When implementing in code — use CSS `border`, not `box-shadow`, for structural borders. Shadow-as-border is Pencil-only.

---

## Rule 2 — Elevation Through Warmth, Not Shadow

**Rule:** Primary elevation signal is background color shift (lighter → warmer/darker). Shadow is secondary reinforcement, not the primary signal.

Gleizes P-09: "Organize the surface as a field of articulated planes. Depth is secondary — surface articulation is primary."

---

## Rule 3 — z-index as Intentional Hierarchy

**Rule:** z-index from a fixed scale. No arbitrary values.

| Stratum | z-index | Use |
|---|---|---|
| Content | auto/0 | Normal content flow |
| Sticky | 100 | Omnibar collapsed, pills, persistent UI |
| Dropdown | 200 | Dropdowns, popovers, tooltips |
| Modal backdrop | 300 | Scrim behind modals |
| Modal | 400 | Modals, omnibar expanded, command palette |

---

## Rule 4 — Overlapping Elements Need Purpose

**Rule:** When elements overlap, the overlap must serve hierarchy or depth. Accidental overlap is visual noise.

---

## Rule 5 — Borders as Structural Lines

**Rule:** Border tokens define structural separation, not decoration:
- `--border-subtle` (#E8DDD0) — warm structural line between sibling elements
- `--border-default` (#C6C6C6) — standard element boundary
- `--border-strong` (#AAAAAA) — active/focused element emphasis

Mondrian: "The border is a structural line separating planes, not ornament."
