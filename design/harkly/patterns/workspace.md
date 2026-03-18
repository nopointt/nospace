# Workspace Pattern — Harkly

Adapted from tLOS `design/design_system/patterns/workspace.md`. Light warm theme, spatial canvas.

---

## Canvas as Warm Ground

The canvas is the basic plane — Cosmic Latte (#FFF8E7). Not background to fill. Active spatial field. Empty canvas between frames = designed compositional intervals.

Kandinsky P-01: the basic plane is "a living, self-sufficient organism — never a passive container."

Malevich P-12: white on white = "pure space-sensation with no object-interference." Harkly's warm-white canvas IS the invitation. Emptiness is not void — it is potential.

---

## Three-Zone Division (adapted)

Harkly workspace uses spatial zones, but lighter than tLOS's tiled 3-zone model:

| Zone | Harkly expression |
|---|---|
| **Primary work** | Canvas center — frames float with content. Maximum area. |
| **Navigation** | FloorPill + BranchPill + CoordPill (top-right). Minimal footprint. |
| **Command** | Omnibar (bottom-left). Collapsed pill when idle, expanded panel when active. |

No persistent sidebar. No status strip. The canvas IS the workspace.

---

## Frame Composition

Frames float on the canvas. Each frame is a spatial object with position, size, z-layer.

**Active frame:** `--border-strong` (#AAAAAA) or warm shadow emphasis. Full content legibility.
**Inactive frame:** `--border-subtle` (#E8DDD0). Content remains readable but visually receded.
**Collapsed frame:** Header only (40px). Spatial cell persists. Never hides.

---

## Omnibar Overlay

When omnibar expands:
1. Canvas remains fully visible — no scrim in Harkly
2. Omnibar panel floats at elevation.2 (z-index: sticky 100)
3. Content behind omnibar is not dimmed — co-presence, not modal overlay
4. Dismissal: click outside or Escape

**Deliberate departure from tLOS:** tLOS workspace.md prescribes scrim (#00000099) behind expanded omnibar (Moholy-Nagy translucency + Kandinsky simultaneity). Harkly departs here, grounded in a different reading of Moholy: interpenetration (Moholy-Nagy) = both layers fully visible, not one dimmed. Moholy P-02: "layer transparent materials to reveal spatial depth without opaque volume." Co-presence without dimming is MORE faithful to Moholy's transparency principle than scrim-based simultaneity.

---

## Floor Navigation

Floors = Z-axis infinite canvases. FloorPill shows current floor name. Click to switch.

Each floor has its own spatial composition:
- F0 Scratchpad: mostly empty canvas + Framing Studio appears on question
- F1 Sources: source status frames scattered spatially
- F2 Raw: document corpus frames
- F3 Insights: knowledge graph + entity frames
- F4 Artifacts: deliverable frames (Empathy Map, Fact Pack)
- F5 Stakeholders: export preset frames

---

## Anti-Patterns

- **Dashboard layout on a floor** — floors are spatial canvas, not web pages
- **Sidebar navigation** — Harkly has no sidebar; use FloorPill + omnibar
- **Modal-heavy workflows** — actions through omnibar, not through modal chains
- **Empty canvas without spatial character** — emptiness must feel warm and inviting
- **Chrome competing with content** — pills and omnibar are subordinate to canvas content
