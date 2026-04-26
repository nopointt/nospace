# Component Inventory — Contexter

All components in `contexter-ui.pen` (light reference) and `design-system-themes.pen` (full light+dark). Inter for UI text. JetBrains Mono for code/data only. 0px corners. No shadows. Theme axis: `light` | `dark`.

---

## Buttons (4)

| Component | Fill | Text | Corner | Use |
|---|---|---|---|---|
| Button/Primary | `--accent` | #FFFFFF 14/500 | 0px | Primary action |
| Button/Secondary | transparent + 1px `--black` | `--black` 14/500 | 0px | Secondary action |
| Button/Ghost | transparent | `--text-secondary` 14/500 | 0px | Tertiary action |
| Button/Danger | `--signal-error` | #FFFFFF 14/500 | 0px | Destructive action |

All buttons: padding [8,16], Inter 14px weight 500, lowercase text.

---

## Inputs (2)

| Component | Size | Corner | Border | Use |
|---|---|---|---|---|
| Input/Default | 280×40 | 0px | 1px `--border-default` | Standard text input |
| Input/Focused | 280×40 | 0px | 2px `--accent` | Focused state |

Input: Inter 14px/400 (body role). Placeholder: `--text-disabled`. Padding [0,16]. Exception: when input is for code or API tokens — use JetBrains Mono.

---

## Badges (4)

| Component | Border | Dot | Text | Use |
|---|---|---|---|---|
| Badge/Processing | 1px `--accent` | `--accent` | `--accent` 10/500 | Processing state |
| Badge/Ready | 1px `--signal-success` | `--signal-success` | `--signal-success` 10/500 | Ready state |
| Badge/Error | 1px `--signal-error` | `--signal-error` | `--signal-error` 10/500 | Error state |
| Badge/Pending | 1px `--border-default` | `--text-tertiary` | `--text-tertiary` 10/500 | Pending state |

All badges: 0px corners, padding [4,10], gap 6px, Inter 10/500 (label-caps role), transparent fill.

---

## Pipeline Indicator (1)

Horizontal row: 4 stages (parse → chunk → embed → index).

| Stage state | Dot | Text |
|---|---|---|
| Done | `--black` 8px | Inter `--black` 12/500 (label role) |
| Active | `--accent` 8px | Inter `--accent` 12/700 |
| Pending | `--text-tertiary` 8px | Inter `--text-tertiary` 12/400 |
| Error | `--signal-error` 8px | Inter `--signal-error` 12/500 |

Stages connected by 1px `--border-subtle` lines.

---

## Drop Zone (1)

| Property | Value |
|---|---|
| Fill | `--bg-surface` |
| Border | 1px dashed `--border-default` |
| Corner | 0px |
| Icon | Lucide `upload`, 24px, `--text-tertiary` |
| Text | Inter 14/400 `--text-tertiary` |
| Hint | Inter 10/400 `--text-disabled` |
| Hover | border solid `--accent`, fill `--bg-canvas` |

---

## Data Table (structure)

| Element | Style |
|---|---|
| Header | `--bg-surface`, Inter 12/500 `--text-secondary`, UPPERCASE, +0.04em (label-caps role) |
| Row | `--bg-canvas`, Inter 14/400 `--text-primary` for narrative, JetBrains Mono 14/400 for technical/numeric data, bottom 1px `--border-subtle` |
| Hover | `--interactive-hover` |
| Selected | 2px left `--accent` |
| Cell padding | [8,16] |

---

## Logo (4 variants)

| Variant | Background | "con"/"er" | "text" |
|---|---|---|---|
| Logo/Primary | `--white` | `--black` 48/500 | `--accent` 48/500 |
| Logo/Inverted | `--black` | `--white` 48/500 | `--accent` 48/500 |
| Logo/On Accent | `--accent` | `--white` 48/500 | `--white` 48/700 |
| Logo/Compact | — | `--black` 14-32/500 | `--accent` 14-32/500 |

All: JetBrains Mono, letterSpacing -0.04em (-4%).

---

## Shared Properties

- **Font:** Inter for UI text, JetBrains Mono for code/data/technical content
- **Icons:** Lucide (iconFontFamily: "lucide")
- **Corners:** 0px everywhere (Mondrian P-37: right angle governs)
- **Shadows:** none (Van Doesburg: pure plastic means)
- **Spacing:** all values from 4px scale
