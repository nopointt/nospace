# Harkly — Spatial Interface Rules
### Adapted from tLOS Spatial Shell / Design System
### Date: 2026-03-18

---

## Origin

Harkly inherits its interface paradigm from tLOS — a spatial operating system. These rules are the interface contract. Every floor, every screen, every component in Harkly follows these principles.

**Source documents:**
- `tLOS/core/docs/specs/spatial-shell.md` — canvas model, coordinate system, navigation, window physics
- `tLOS/core/docs/specs/frame-system.md` — frame as spatial UI container, 4-layer composition
- `design/design_system/guidelines/spatial.md` — 12 spatial design rules
- `design/design_system/patterns/workspace.md` — workspace zones, tiling vs floating, omnibar overlay

---

## 1. The Canvas

The canvas is an **infinite 2D plane**. Not a viewport. Not a page. Not a scrollable container.

- Objects are positioned by **world coordinates** (x, y), independent of the camera
- The canvas has **directional weight** (Kandinsky Grundfläche): top = light/free, bottom = heavy/anchored, left = departure, right = arrival
- Empty space is **active compositional territory** — not void to fill
- Background: warm Cosmic Latte (`#FFF8E7` in Harkly, `#000000` in tLOS dark mode)
- Grid: 64px Baukasten (8×8 base) — invisible structure, visible as 64px guidelines

**Canvas is NOT:**
- A webpage background
- A container to fill edge-to-edge with content
- A layout grid for cards/lists/dashboards

**For Harkly:** Each floor shows a viewport into the canvas. The canvas persists — panning and zooming reveal more. What's visible in the 1440×900 artboard is ONE viewport position.

---

## 2. The Frame

A frame is a **spatial UI container** rendered on the canvas. It is NOT a DOM element, NOT a page section, NOT a dashboard panel.

**Frame properties (first-class data):**
- Position: `(x, y)` in world coordinates
- Size: `(width, height)` — explicit, persisted
- Z-layer: depth in stacking order
- Pin: world-pinned (moves with canvas) or screen-pinned (stays in viewport)

**Frame behaviors:**
- Drag, resize, snap to grid (magnetic at <20px)
- Group drag (snapped frames move together)
- Minimize to title bar (never hide — spatial cell persists)
- No infinite scroll inside — pagination or spatial expansion

**For Harkly Pencil mockups:** Content panels on each floor are frames positioned at specific canvas coordinates. They are NOT full-width page sections. They float on the canvas with explicit position and size, surrounded by intentional empty space.

---

## 3. The Omnibar

The Omnibar is the **command center** — the single primary input for ALL system interactions.

**tLOS Omnibar:**
- Fixed bottom-center, always accessible (`Ctrl+K`)
- Chat-to-UI: intent → AI orchestrates → dynamic UI spawned on canvas
- Universal search with camera jump-to-point
- Model selector at runtime

**Harkly Omnibar:**
- Fixed bottom-LEFT (distinct Harkly pattern, not center)
- Collapsed: 320×48 pill (LogoDot + placeholder + send button)
- Expanded: 360×852 panel (header + body + input row)
- Primary input for ALL actions: adding sources, creating research, configuring settings

**The Omnibar Primacy Rule:**
- **Omnibar = primary input**
- **Floors = display + optional editing**
- Don't overload floor content with buttons, forms, CTAs
- Floor is a **spatial canvas** showing state, not a settings panel
- Actions happen THROUGH the omnibar, not through buttons scattered on the floor
- Example: adding an entity → user types in omnibar → AI handles the flow → result frame appears on canvas

---

## 4. The Floor System — Z-Axis of Infinite Space

Floors are the **Z-axis** of the spatial workspace. Each floor is a **separate infinite canvas** — a complete, unbounded 2D plane at its own Z-level.

Between any two floors there is **infinity**. Floor 0 and Floor 1 are not "stacked pages" — they are entirely separate infinite planes separated by an infinite gap on the Z-axis. Switching floors = teleporting to a different infinite plane, not scrolling up.

```
Z-axis (floors)
  │
  │   F5 ─────── ∞ infinite canvas (Стейкхолдеры)
  │       ∞ gap
  │   F4 ─────── ∞ infinite canvas (Артефакты)
  │       ∞ gap
  │   F3 ─────── ∞ infinite canvas (Инсайты)
  │       ∞ gap
  │   F2 ─────── ∞ infinite canvas (Сырьё)
  │       ∞ gap
  │   F1 ─────── ∞ infinite canvas (Источники)
  │       ∞ gap
  │   F0 ─────── ∞ infinite canvas (Черновик)
  ▼
```

**Harkly floors:**

| Floor | Name | Content paradigm |
|---|---|---|
| F0 | Черновик | Empty infinite canvas + Framing Studio (appears on question) |
| F1 | Источники | Source status frames on infinite canvas — infrastructure overview |
| F2 | Сырьё | Corpus document frames — triage workspace |
| F3 | Инсайты | Knowledge graph + entity frames — synthesis |
| F4 | Артефакты | Empathy Map / Fact Pack / Journey Map frames — deliverables |
| F5 | Стейкхолдеры | Export preset frames — audience-specific formatting |

**Floor navigation:** FloorPill (top-right) + `Cmd+1..6` shortcuts. Switching floors = moving to a different Z-level (different infinite plane).

### Branches — Parallel Infinite Canvases on One Floor

A branch is a **separate infinite canvas that exists on the same floor**. Between any two branches there is also **infinity** — they are parallel planes, not tabs.

```
Floor 0 (Z=0):
  Branch 1 ─── ∞ infinite canvas (Research A)
       ∞ gap
  Branch 2 ─── ∞ infinite canvas (Research B)
       ∞ gap
  Branch 3 ─── ∞ infinite canvas (Research C)
```

Each branch has its own complete F0–F5 stack:

```
Branch 1:  F0₁ ─ F1₁ ─ F2₁ ─ F3₁ ─ F4₁ ─ F5₁   (each = ∞ canvas)
Branch 2:  F0₂ ─ F1₂ ─ F2₂ ─ F3₂ ─ F4₂ ─ F5₂   (each = ∞ canvas)
```

New branch = 6 new infinite canvases (one per floor). Branches are isolated — no shared state, no shared canvas, no cross-contamination.

**Branch navigation:** BranchPill (top-right, next to FloorPill) + keyboard shortcuts.

---

## 5. Content on Floors — Spatial, Not Dashboard

**THE CRITICAL RULE:**

Floor content is arranged **spatially on the canvas**, not as a webpage layout. Content elements are **frames** — spatial objects with explicit position, size, and z-layer.

**What spatial floor content looks like:**

```
Canvas (1440×900 viewport, Cosmic Latte background, 64px grid)

  [Frame A]                    [Frame B]
  Entity name                  Entity name
  ● Status                     ● Status
  metadata · timestamp         metadata · timestamp

                    [Frame C]
                    Entity name
                    ○ Different status

  [Frame D]                    [Frame E]
  Entity name                  Entity name
  ⚠ Warning status             ● Active status

  ┌──────────────────┐
  │ ● Спросите Harkly...  ↑ │   ← Omnibar (collapsed, bottom-left)
  └──────────────────┘

                                    [Floor ▾] [Branch 1 ▾] [x:0 y:0 ⊕]
```

**Key differences from a dashboard:**
1. Frames are **positioned freely on the canvas**, not in a grid
2. Frames have **different sizes** based on content and importance
3. **Empty space between frames** is intentional — proximity implies relationship
4. **No page header, no title bar, no filter chips** — the floor IS the content
5. **Actions through omnibar** — not through buttons on frames
6. Frames can be **dragged, rearranged** by the user — position is meaningful

---

## 6. Spatial Rules for Harkly (from tLOS Design System)

### 6.1 Position = State
Moving a source card from one area to another changes its semantic context. Example: dragging a disconnected source near a connected source group = intention to connect.

### 6.2 Grid Snapping
All frames snap to the 64px Baukasten grid. Freeform placement only during drag — snapping on release.

### 6.3 Touch Targets
Every interactive element: minimum 44px touch target. Primary text: 16-20px base. Max 5-7 concurrent focal demands per viewport.

### 6.4 No Infinite Scroll
Content exceeding frame bounds → pagination or linked overflow to adjacent frame. Never scroll infinitely inside a frame.

### 6.5 Multi-Scale Navigation
- Ground level: read frame content, interact with elements
- Neighborhood level: see cluster relationships, card groupings
- Overview level: entire floor pattern emerges (which sources connected, which pending)

### 6.6 Compositional Weight
- Top of canvas: light/free (available sources, suggestions)
- Bottom of canvas: heavy/anchored (stable, connected sources, omnibar)
- Left: open/outward (exploration, new connections)
- Right: constrained/settled (configured, stable sources)

### 6.7 Frame Minimum Size
Source cards have minimum viable size. Below threshold → collapse to title bar (name + status dot). Spatial cell persists — card never disappears.

---

## 7. What NOT to Build

| Anti-pattern | Why it's wrong | Spatial alternative |
|---|---|---|
| Full-width page header with title | Floor content IS the floor — no wrapper | FloorPill in top-right corner |
| Action buttons on the floor | Omnibar handles all actions | Type intent in omnibar |
| Category filter chips | Web pattern, not spatial | Spatial grouping — similar frames near each other |
| Card grid (N columns) | Grid layout ≠ spatial layout | Freeform positioned frames on canvas |
| Search bar on floor | Omnibar IS the search | Omnibar with jump-to-frame |
| Full-width progress bars | Web dashboard pattern | Compact indicators inside frames |
| Empty state with CTA button | Web pattern | First-run: omnibar prompt guides the user |
| Sidebar navigation | Traditional web pattern | Floor/branch navigation via pills |
| Tabs or tab bars | DOM pattern, not spatial | Separate floors or spatial zones |
| Infinite scroll lists | Destroys spatial legibility | Pagination or spatial expansion |

---

## 8. Omnibar as Action Center

Instead of UI buttons on floors, ALL actions happen through omnibar:

| User intent | Omnibar interaction | Canvas result |
|---|---|---|
| Create something | Types intent in natural language | AI processes → frame appears on canvas |
| Configure entity | Clicks frame → types in omnibar | Detail panel opens near the frame |
| Search | Types query | Camera jumps to matching frame |
| Change state | Types command | Frame updates visually |
| Upload | Drags files onto canvas | Progress frame appears |

---

## 9. Design Checklist for Floor Screens

Before designing any floor in Pencil:

- [ ] Content is **frames on canvas**, not page sections
- [ ] Frames have **explicit position** (x, y) — not flexbox/grid
- [ ] **Empty space** between frames is intentional and meaningful
- [ ] **No page header** — FloorPill is the only floor indicator
- [ ] **No action buttons** on the floor itself — actions through omnibar
- [ ] **Omnibar visible** (collapsed pill, bottom-left)
- [ ] Each frame has **status visible** at a glance
- [ ] Cards can be **different sizes** based on content
- [ ] **Proximity implies relationship** — similar sources grouped
- [ ] **No filter UI** — spatial grouping replaces filtering
- [ ] Grid snapping: frames align to 64px Baukasten grid
- [ ] **No infinite scroll** inside any frame

---

*This document is the bridge between tLOS spatial paradigm and Harkly UI implementation. All Pencil mockups must follow these rules.*
