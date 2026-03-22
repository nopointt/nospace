# Motion Guidelines — Contexter

From Harkly `guidelines/motion.md`. Identical — motion is universal, not theme-dependent.

---

## Duration Scale

| Token | Value | Register | Use |
|---|---|---|---|
| `duration.none` | 0ms | — | reduce-motion fallback |
| `duration.instant` | 80ms | Presto | Hover, focus, press |
| `duration.fast` | 150ms | Presto | Toggle, small change |
| `duration.standard` | 250ms | Andante | Panel open/close |
| `duration.deliberate` | 400ms | Andante | Page transition |
| `duration.ceremonial` | 700ms | Adagio | First load |

## Delay Scale

| Token | Value | Use |
|---|---|---|
| `delay.none` | 0ms | Simultaneous |
| `delay.ripple` | 30ms | Dense list stagger |
| `delay.sequence` | 60ms | Nav items |
| `delay.announce` | 100ms | Section cards |

## Easing

| Token | Curve | Use |
|---|---|---|
| `easing.aktiv` | ease-out | Elements entering |
| `easing.passiv` | ease-in | Elements exiting |
| `easing.medial` | ease-in-out | State change (default) |
| `easing.linear` | linear | Progress bars |

## Rules

1. **Three parameters** — tempo, rhythm, direction for every animation
2. **prefers-reduced-motion** — all durations → 0ms
3. **Duration from scale only** — no arbitrary values
4. **Easing by direction** — enter=out, exit=in, change=in-out
5. **No perpetual animation** — spinners stop when done
6. **Calm over dramatic** — Andante default, never frantic
