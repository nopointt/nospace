# Interaction Patterns — Harkly

Adapted from tLOS `design/design_system/patterns/interaction.md`. Warm state signals.

---

## State Machine

All interactive elements share one canonical state machine:

```
idle → hover → pressed → idle
idle → focused → activated → idle
any → disabled (terminal)
any → error → idle (resolved)
```

Every state transition is discrete and clean. No gradual morphing between states. Schlemmer: each transformation is complete and instantaneous.

---

## Pattern 1 — Immediate Response

State changes: instantaneous (0ms) or duration.instant (80ms). No perceptible delay between input and response.

| Trigger | Response time |
|---|---|
| Mouse enter (hover) | 80ms |
| Mouse down (press) | 0-50ms |
| Mouse up (release) | 80ms |
| Keyboard focus | 80ms |

---

## Pattern 2 — State as Color Shift

**Rule:** Interactive states communicated primarily through background/border color token shifts. Subtle warmth affordances permitted: micro-scale (1.0→1.01) and gentle opacity (0.9→1.0) on hover for spatial warmth. Prohibited: aggressive glow, pulse animation, bouncing scale, drop shadow addition on state change.

**Harkly tokens:**
| State | Token | Value |
|---|---|---|
| Idle | `--bg-surface` | #F5EDD8 |
| Hover | `--interactive-hover` | #F0E8D5 |
| Pressed | `--interactive-pressed` | #E0CFA9 |
| Disabled | `--text-disabled` + reduced opacity | #C6C6C6 |

The shift is subtle, warm, within the same hue family. No temperature jumps.

---

## Pattern 3 — Focus Ring

**Rule:** Keyboard focus indicated by a visible focus ring. 2px solid, `--accent-blue` (#1E3EA0). Offset 2px from element edge.

Accessibility: WCAG 2.4.7 (Focus Visible). Non-negotiable.

---

## Pattern 4 — Disabled State

**Rule:** Disabled elements use `--text-disabled` (#C6C6C6) for all content. Cursor: not-allowed. No hover/pressed transitions. The element is structurally present but interaction is closed.

Do not hide disabled elements. Sparsamkeit applies to action, not to presence. A disabled button communicates "this action exists but is not available now."

---

## Pattern 5 — Error State

**Rule:** Error uses `--signal-error` (#C82020) as left border (3px) or background tint. Error message appears inline below the element. Recovery path always included.

See `patterns/error-states.md` for full error anatomy.

---

## Pattern 6 — Loading State

**Rule:** Loading uses a subtle animation (spinner or progress bar) at the element level, not at the page level. The rest of the interface remains interactive.

Duration: spinner uses `duration.deliberate` (400ms) rotation cycle. Calm, not frantic.
