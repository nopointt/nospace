# Error States — Contexter

From Harkly `patterns/error-states.md`. Universal patterns.

---

## Signal Colors

| Signal | Token | Value |
|---|---|---|
| Error | `--signal-error` | #D32F2F |
| Warning | `--signal-warning` | #F2C200 |
| Info | `--signal-info` | #1E3EA0 (= accent) |
| Success | `--signal-success` | #2E7D32 |

## Pattern 1 — Signal Isolation
One chromatic value per signal state. Never mix.

## Pattern 2 — Inline Error Placement
Errors inline, adjacent to the element that caused them. Raumgestaltung: resolve at the place of tension.

## Pattern 3 — Error Anatomy
1. Signal indicator (color border 2px)
2. Error message (what went wrong)
3. Recovery path (what to do)

## Pattern 4 — Warning vs Error
Warning (yellow) = degraded, optional action. Error (red) = blocked, required action.

## Pattern 5 — Empty States
Not errors. Plain text invitation on white ground. No illustrations.

## Pattern 6 — Success Confirmation
`--signal-success` dot + message. Inline. Fades after 5s. Calm acknowledgment.
