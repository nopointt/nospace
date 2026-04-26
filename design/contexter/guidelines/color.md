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

## Dark Theme Tokens (theme axis: `dark`)

**Ground:** Gelb-polus (warm pole). `--bg-canvas` = #1A1A1A (Moholy-Nagy poster canon, near-black). `--accent` = #E8C018 (Itten primary triad cadmium yellow, replaces light theme's blue accent).

**Inversion principle:** Kandinsky P-01 — black-on-white and white-on-black are structurally equivalent. Each token holds the same semantic role; values invert across the lightness axis. Pure grays (hue 0°) preserved — no warm tinting in dark either.

### Core (3 colors)

| Token | Light | Dark |
|---|---|---|
| `--black` | #0A0A0A | #0A0A0A (shared) |
| `--white` | #FAFAFA | #FAFAFA (shared) |
| `--accent` | #1E3EA0 | **#E8C018** |

### Text Hierarchy

| Token | Light | Dark |
|---|---|---|
| `--text-primary` | #0A0A0A | #FAFAFA |
| `--text-secondary` | #333333 | #CCCCCC |
| `--text-tertiary` | #808080 | #999999 |
| `--text-disabled` | #CCCCCC | #666666 |

### Background Elevation (inverted: ground darkest, elevate lighter)

| Token | Light | Dark |
|---|---|---|
| `--bg-canvas` | #FAFAFA | #1A1A1A |
| `--bg-surface` | #F2F2F2 | #262626 |
| `--bg-elevated` | #E5E5E5 | #333333 |
| `--bg-pressed` | #D9D9D9 | #404040 |

### Border

| Token | Light | Dark |
|---|---|---|
| `--border-subtle` | #E5E5E5 | #333333 |
| `--border-default` | #CCCCCC | #4D4D4D |
| `--border-strong` | #808080 | #808080 (shared, mid-grey transition) |

### Interactive States

| Token | Light | Dark |
|---|---|---|
| `--interactive-hover` | #F2F2F2 | #262626 |
| `--interactive-pressed` | #D9D9D9 | #404040 |

### Interactive States — Accent (derived: mix with white instead of black on dark)

| Token | Light formula | Dark formula |
|---|---|---|
| `--accent-hover` | mix(accent, black, 25%) → #19317A | mix(accent, white, 15%) → #ECC93C |
| `--accent-pressed` | mix(accent, black, 50%) → #142455 | mix(accent, white, 30%) → #EFD25E |

### Interactive States — Error

| Token | Light | Dark (light-tinted for contrast) |
|---|---|---|
| `--signal-error-hover` | #A12626 | #F47E7E |
| `--signal-error-pressed` | #6E1C1C | #F89999 |

### Signals (functional)

| Token | Light | Dark (lightened for contrast on #1A1A1A) |
|---|---|---|
| `--signal-error` | #D32F2F | #EF5350 |
| `--signal-success` | #2E7D32 | #66BB6A |
| `--signal-warning` | #F2C200 | #FFB300 |
| `--signal-info` | #1E3EA0 | #82AAFF |

### WCAG Contrast (verified, all dark-mode text on `#1A1A1A`)

| Pair | Ratio | WCAG |
|---|---|---|
| `--text-primary` #FAFAFA on canvas | 16.9:1 | AAA |
| `--text-secondary` #CCCCCC on canvas | 10.5:1 | AAA |
| `--text-tertiary` #999999 on canvas | 6.3:1 | AA Normal |
| `--accent` #E8C018 on canvas | 10.4:1 | AAA Large + AAA Normal |
| `--signal-error` #EF5350 on canvas | 5.2:1 | AA Normal |
| `--signal-success` #66BB6A on canvas | 7.0:1 | AAA Large |
| `--signal-warning` #FFB300 on canvas | 9.4:1 | AAA Large |
| `--signal-info` #82AAFF on canvas | 6.4:1 | AA Normal |

### Theme Application Rule

Main `contexter.cc` forces `light`. Blog `blog.contexter.cc` and Vault `vault.contexter.cc` force `dark`. App `app.contexter.cc` defaults to `light` with optional user toggle stored in `localStorage["contexter-theme"]`. No-FOUC inline script reads localStorage before any CSS loads.

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

### 09. Yellow Role by Ground

**On LIGHT ground (Weiß-polus, light theme):** Warning yellow as fill background only. Never as text or thin border — yellow has insufficient contrast against light surfaces (`#F2C200` on `#FAFAFA` ≈ 1.4:1, fails WCAG).

**On DARK ground (Gelb-polus, dark theme):** Yellow `#E8C018` may carry text, thin border, fill — all roles. Contrast on `#1A1A1A` ≈ 10.4:1 (WCAG AAA Large + AAA Normal). Yellow becomes the primary chromatic accent (replacing blue), per Kandinsky elemental pairing Gerade/Dreieck/Gelb (acute angle, sharp, active) — appropriate for CTAs, focus rings, links, active states.

**Rationale:** Kandinsky P-01 (color, 1926) — black-point-on-white and white-point-on-black are structurally equivalent but tonally inverted. Role assignments invert with the ground.

### 10. Cold Ground Theory (departure from Harkly)
Harkly: Kandinsky Gelb-polus (warm yellow ground). Contexter: Weiß-polus (cold white ground). Elements on cold ground carry inherent neutrality. Blue accent creates maximum cold-on-cold resonance.
