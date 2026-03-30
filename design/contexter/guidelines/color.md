# Color Guidelines — Contexter

Adapted from Harkly `guidelines/color.md`. Cold B&W palette.

RAG: Van Doesburg — "Reine Ausdrucksmittel — pure plastic means." Mondrian — "non-colors (black/white/gray without hue)."

---

## Color Tokens

### Core (3 colors)

| Token | Value | Use |
|---|---|---|
| `--black` | #0A0A0A | Text, borders, primary content |
| `--white` | #FAFAFA | Background, negative space |
| `--accent` | #1E3EA0 | Interactive elements, emphasis, links, focus |

RAG justification — Kandinsky P-11: Blue = cold pole (Blau-polus). Maximum temperature contrast on white ground. Straight lines carry cold Spannung.

### Text Hierarchy (4 tokens, from Harkly structure)

| Token | Value | Use |
|---|---|---|
| `--text-primary` | #0A0A0A | Body text, headings |
| `--text-secondary` | #333333 | Labels, secondary content |
| `--text-tertiary` | #808080 | Timestamps, metadata, hints |
| `--text-disabled` | #CCCCCC | Disabled state |

### Background Elevation (4 tokens, from Harkly structure)

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | #FAFAFA | Page ground |
| `--bg-surface` | #F2F2F2 | Cards, panels, table headers |
| `--bg-elevated` | #E5E5E5 | Hover states, active elements |
| `--bg-pressed` | #D9D9D9 | Pressed state, active tab |

### Border (3 tokens, from Harkly structure)

| Token | Value | Use |
|---|---|---|
| `--border-subtle` | #E5E5E5 | Dividers, table row borders |
| `--border-default` | #CCCCCC | Input borders, card borders |
| `--border-strong` | #808080 | Focused elements, active borders |

### Interactive States (2 tokens, from Harkly structure)

| Token | Value | Use |
|---|---|---|
| `--interactive-hover` | #F2F2F2 | Hover background (neutral elements) |
| `--interactive-pressed` | #D9D9D9 | Pressed/active background (neutral elements) |

### Interactive States — Accent (derived: mix with black)

| Token | Value | Formula | Use |
|---|---|---|---|
| `--accent-hover` | #19317A | mix(accent, black, 25%) | Accent button hover |
| `--accent-pressed` | #142455 | mix(accent, black, 50%) | Accent button pressed |

### Interactive States — Error (derived: mix with black)

| Token | Value | Formula | Use |
|---|---|---|---|
| `--signal-error-hover` | #A12626 | mix(error, black, 25%) | Danger button hover |
| `--signal-error-pressed` | #6E1C1C | mix(error, black, 50%) | Danger button pressed |

### Signal (functional only)

| Token | Value | Use |
|---|---|---|
| `--signal-error` | #D32F2F | Error state |
| `--signal-success` | #2E7D32 | Success state |
| `--signal-warning` | #F2C200 | Warning state |
| `--signal-info` | #1E3EA0 | Info (= accent) |

---

## Rules (from Harkly, universal)

### 01. Structure First, Color Second
Validate hierarchy in pure grayscale before applying blue. If layout cannot communicate without chromatic color, structure is broken.

### 02. Pure Gray Scale (departure from Harkly)
Contexter grays are pure (hue 0°), not warm-tinted. Mondrian P-11/P-14: non-colors without hue.

Harkly uses warm grays (hue ~43°, Kandinsky Gelb-polus). Contexter uses cold grays (pure).

### 03. Color Follows Purpose (semantic tokens)
Reference semantic tokens, never raw hex. `--signal-error`, not `#D32F2F`.

### 04. Flat Unmodulated Color
No gradients. No chromatic blurs. Every fill is solid.

### 05. Color Earns Its Place
Every chromatic element encodes information. Blue = interactive. Red = error. Green = success.

### 06. Chromatic Restraint (5% max)
Maximum 5% of viewport surface may carry chromatic color (blue/red/green). Stricter than Harkly's 15% — Gropius economy.

### 07. Color as Spatial Structure
Background tokens define zones. Chromatic marks state transitions within zones.

### 08. WCAG AA Contrast
4.5:1 for text, 3:1 for UI. Non-negotiable. `--text-primary` (#0A0A0A) on `--bg-canvas` (#FAFAFA) = ~19:1.

### 09. Yellow on Light: Background Only
Warning yellow as fill background only. Never as text or thin border.

### 10. Cold Ground Theory (departure from Harkly)
Harkly: Kandinsky Gelb-polus (warm yellow ground). Contexter: Weiß-polus (cold white ground). Elements on cold ground carry inherent neutrality. Blue accent creates maximum cold-on-cold resonance.
