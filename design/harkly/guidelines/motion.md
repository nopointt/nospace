# Motion Guidelines — Harkly

Adapted from tLOS `design/design_system/guidelines/motion.md`. Calm register.

---

## Harkly Motion Character

Klee P-19: "A collaboration of the organs into a self-standing, calmly-moving or motion-calm whole."

Harkly motion is **resolved** — every motion-element finds its counter-movement or comes to rest. No perpetual animation. No attention-grabbing loops. No urgency.

---

## Duration Scale (from Pencil Motion System)

| Token | Value | Register | Use |
|---|---|---|---|
| `duration.none` | 0ms | — | reduce-motion fallback |
| `duration.instant` | 80ms | Presto | Hover, focus, press feedback |
| `duration.fast` | 150ms | Presto | Toggle, small state change |
| `duration.standard` | 250ms | Andante | Panel open/close, content swap |
| `duration.deliberate` | 400ms | Andante | Floor transition, frame activation |
| `duration.ceremonial` | 700ms | Adagio | Workspace-scale transition, first load |

**Harkly preference:** Default to Andante (250-400ms). Presto for micro-interactions only. Adagio rarely — reserved for spatial transitions (floor switch, branch change).

---

## Delay Scale

| Token | Value | Use |
|---|---|---|
| `delay.none` | 0ms | Simultaneous onset |
| `delay.ripple` | 30ms | Dense list stagger |
| `delay.sequence` | 60ms | Nav items, form groups |
| `delay.announce` | 100ms | Dashboard cards, workspace sections |

---

## Easing (Klee aktiv/medial/passiv)

| Token | Curve | Character |
|---|---|---|
| `easing.aktiv` | ease-out | Enter — arrives with energy, settles |
| `easing.passiv` | ease-in | Exit — gathers speed, departs |
| `easing.medial` | ease-in-out | State change — symmetric transition |
| `easing.linear` | linear | Progress bars, timers |
| `easing.terrestrial` | custom bezier | Grounded, physical feel |
| `easing.cosmic` | custom bezier | Floating, weightless feel |

**Harkly preference:** `easing.medial` (ease-in-out) for most transitions. Calm, symmetric, no drama. `easing.aktiv` (ease-out) for elements entering the canvas.

---

## Rules

### 1. Three Parameters Before Implementation

**Rule:** Every animation defines: tempo (duration token), rhythm (easing token), direction (enter/exit/state-change). No undefined parameters.

### 2. Respect prefers-reduced-motion

**Rule:** Every animation wrapped in `prefers-reduced-motion: no-preference` check. Reduced = 0ms instant. No exceptions.

### 3. Duration From Scale Only

**Rule:** No arbitrary duration values. Use only the 6 tokens.

### 4. Easing by Direction

**Rule:** Enter = ease-out. Exit = ease-in. State change = ease-in-out.

### 5. No Perpetual Animation

**Rule:** Nothing loops forever. Loading spinners are the only exception, and they must stop when loading completes.

### 6. Calm Over Dramatic

**Rule:** When in doubt, use a longer duration (Andante over Presto) and symmetric easing (medial). Harkly is calm. Motion should feel like breathing, not snapping.
