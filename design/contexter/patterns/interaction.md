# Interaction Patterns — Contexter

From Harkly `patterns/interaction.md`. Cold state signals.

---

## State Machine

```
idle → hover → pressed → idle
idle → focused → activated → idle
any → disabled (terminal)
any → error → idle (resolved)
```

## Pattern 1 — Immediate Response

| Trigger | Response |
|---|---|
| Hover | 80ms |
| Press | 0-50ms |
| Release | 80ms |
| Focus | 80ms |

## Pattern 2 — State as Color Shift

| State | Token | Value |
|---|---|---|
| Idle | `--bg-canvas` | #FAFAFA |
| Hover | `--interactive-hover` | #F2F2F2 |
| Pressed | `--interactive-pressed` | #D9D9D9 |
| Disabled | `--text-disabled` | #CCCCCC |

No glow, no pulse, no bounce, no shadow on state change.

## Pattern 3 — Focus Ring

2px solid `--accent` (#1E3EA0). Offset 2px. WCAG 2.4.7.

## Pattern 4 — Disabled State

`--text-disabled`. cursor: not-allowed. Structurally present, interaction closed.

## Pattern 5 — Error State

`--signal-error` left border 2px. Inline message below. Recovery path always included.

## Pattern 6 — Loading State

Subtle spinner at element level. Rest of interface stays interactive.
