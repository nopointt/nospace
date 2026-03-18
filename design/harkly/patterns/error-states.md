# Error States — Harkly

Adapted from tLOS `design/design_system/patterns/error-states.md`. Green for success permitted.

---

## Foundational Logic

1. **Signals carry state, not decoration.** Color enters only when it encodes a distinct system state.
2. **Failure is educational.** Every error exposes its recovery path. A dead-end error message produces no knowledge.
3. **Absence of error signal = success.** (adapted — see Signal Colors below)

---

## Signal Colors

| Signal | Token | Value | Use |
|---|---|---|---|
| Error | `--signal-error` | #C82020 | Action blocked or failed |
| Warning | `--signal-warning` | #F2C200 | Degraded state, user may proceed |
| Info | `--signal-info` | #1E3EA0 | Informational, no action required |
| Success | `--signal-success` | #2D7D46 | Action completed successfully |
| Success bg | `--signal-success-bg` | #EAF4EB | Success background fill |

**Harkly difference from tLOS:** tLOS prohibits green (Mondrian — green is mixture). Harkly permits green for success. Reasoning: Harkly does not follow Mondrian's three-primary restriction. Klee P-21 treats green as a valid axis position. The audience expects green = success.

However: success signal should still be used sparingly. "Absence of error = success" remains the primary pattern. Green appears only for explicit confirmation moments (file uploaded, source connected, research completed).

---

## Pattern 1 — Signal Isolation

Apply one chromatic value per signal state. Never mix. A red error banner with a yellow icon = two primaries in one zone = dissolved universality.

Error: `--signal-error` only. Warning: `--signal-warning` only. Each in its own zone.

---

## Pattern 2 — Inline Error Placement

Place errors inline, adjacent to the element that caused them. Not in toasts. Not in distant modals.

Raumgestaltung: the error resolves at the place of tension, not at the top of the screen.

Exception: system-level events (network, agent failure) where no single element is the locus — toast permitted.

---

## Pattern 3 — Error Anatomy

Every error contains exactly three parts:
1. **Signal indicator** — color accent (`--signal-error` left border 3px)
2. **Error message** — what went wrong
3. **Recovery path** — what to do

An error without recovery path is incomplete. Do not show it.

Minimum viable: "File too large. Maximum size is 10 MB."

---

## Pattern 4 — Warning vs Error

| Type | Color | Meaning | User action |
|---|---|---|---|
| Warning (yellow) | `--signal-warning` | Degraded, may proceed | Optional |
| Error (red) | `--signal-error` | Blocked, must resolve | Required |

Kandinsky temperature: yellow advances (approaching, caution). Red grounds (stop here).

Never swap: yellow for errors, red for warnings.

---

## Pattern 5 — Empty States

Empty states are not errors. They are invitations.

**Harkly empty state structure:**
1. Warm empty canvas (Cosmic Latte ground — already inviting)
2. Subtle text prompt: "Sprositi Harkly..." (omnibar placeholder)
3. No illustrations, no mascots, no CTAs — the omnibar IS the CTA

Malevich P-12: white space = pure spatial sensation. The warm canvas IS the invitation. Adding decoration reduces its power.

---

## Pattern 6 — Warm Confirmation (Success)

**Rule:** Success is not just absence of error. Success moments deserve warm positive feedback: `--signal-success` (#2D7D46) badge + confirmation message. Brief, calm, specific.

Brand value #1: "Every voice matters." When the user completes an action (uploaded a file, connected a source, finished a study) — celebrate the moment warmly. Not with confetti or exclamation marks. With a calm green confirmation that acknowledges the work done.

**Structure:**
```
[signal.success indicator] [Confirmation — what succeeded]
                           [Next step — what happens now]
```

Example: "Telegram connected. 3 channels will be monitored." — (1) green dot, (2) what happened, (3) what's next.

Success signals appear inline, same as errors. They fade after 5 seconds (duration.ceremonial × ~7). Errors persist until resolved. Success is acknowledged and released.
