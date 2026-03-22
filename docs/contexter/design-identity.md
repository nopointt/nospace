# Contexter — Design Identity
> Rooted in Bauhaus. Expressed through Swiss typography. Black, white, blue.
> RAG source: Qdrant bauhaus_knowledge (10,288 vectors, 14 books + 14 journals)

---

## Core Principles (from RAG)

| Principle | Source | Application |
|---|---|---|
| **Neue Typographie** | Zeitschrift: "Single-typeface, lowercase, functional layout" | One mono typeface. Lowercase dominant. No decoration. |
| **Geringste Mittel, größte Wirkung** | Gropius P-05: "minimum means, maximum effect" | Every pixel earns its place. No ornament. |
| **Keine Symmetrie** | Mondrian P-17: "through all things equilibrium must be created without symmetry" | Asymmetric layouts. Modular grid with intentional tension. |
| **Ökonomisches Arbeitsprinzip** | Moholy-Nagy: "every structural element bears only what is necessary" | No redundant UI. Data is the interface. |
| **Reduktion** | Gropius: "Einfachheit im Vielfachen" — simplicity in multiplicity | Three colors. Two weights. One typeface. |

---

## Logo

**con·text·er**

- Font: JetBrains Mono (monospace, geometric construction)
- Weight: 500 (medium)
- Letter-spacing: -4% (-0.04em)
- "text" highlighted in `--accent` blue (#1E3EA0)
- Всё lowercase
- No logomark — the word IS the mark

```
con[text]er
    ^^^^
    blue
```

**Rationale:** Mono font = Bauhaus Neue Typographie (systematic, constructed letterform). Negative tracking = density, tension (Mondrian asymmetric compression). "text" highlight = the product's essence made visible.

---

## Color System

3 colors. Period.

| Token | Value | Use |
|---|---|---|
| `--black` | #0A0A0A | Text, borders, primary content |
| `--white` | #FAFAFA | Background, negative space |
| `--accent` | #1E3EA0 | Interactive elements, "text" highlight, links, focus |

### Extended (functional only)

| Token | Value | Use |
|---|---|---|
| `--gray-80` | #333333 | Secondary text |
| `--gray-50` | #808080 | Tertiary text, disabled |
| `--gray-20` | #CCCCCC | Borders, dividers |
| `--gray-05` | #F2F2F2 | Surface (elevation.1) |
| `--error` | #D32F2F | Error state only |
| `--success` | #2E7D32 | Success state only |

**Rule:** Chromatic color < 5% of any viewport. Blue appears ONLY where interaction or emphasis is needed.

---

## Typography

**One typeface: JetBrains Mono.**

No secondary font. Mono for everything — headings, body, labels, code, data. This IS the Swiss/Bauhaus commitment: single constructed typeface family.

### Scale (6 sizes)

| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `--type-display` | 48px | 700 | 1.0 | Hero headline |
| `--type-h1` | 32px | 700 | 1.1 | Page heading |
| `--type-h2` | 20px | 500 | 1.2 | Section heading |
| `--type-body` | 14px | 400 | 1.5 | Body text, content |
| `--type-label` | 12px | 500 | 1.2 | Labels, metadata |
| `--type-caption` | 10px | 400 | 1.2 | Timestamps, hints |

### Rules
- **Lowercase dominant** — headings, buttons, navigation: sentence case or all lowercase
- **Letter-spacing:** -0.02em for display/h1, 0em for body, +0.04em for label (tracking opens at small sizes)
- **No italic** — weight only for emphasis (400 vs 500 vs 700)
- **Monospace alignment** — exploit fixed-width for vertical alignment in tables, data, grids

---

## Grid System

**Modular grid: 8px base, 64px module.**

```
┌──────────────────────────────────────────────────────┐
│  8px │ 8px │ 8px │ 8px │ 8px │ 8px │ 8px │ 8px │    │
│  ←────────── 64px module ──────────→                 │
│                                                      │
│  Columns: 12 × 64px = 768px content                  │
│  Gutter: 16px (2 modules)                            │
│  Margin: 32px (4 modules)                            │
│  Max width: 1280px                                   │
└──────────────────────────────────────────────────────┘
```

### Asymmetric layouts (Mondrian principle)

**Hero (screen 1):**
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────────┐                    │
│  │ con[text]er      │                    │
│  │                  │                    │
│  │ any context →    │  ┌──────────────┐  │
│  │ knowledge api    │  │  upload      │  │
│  │                  │  │  zone        │  │
│  └─────────────────┘  └──────────────┘  │
│                                         │
│  8col                    4col           │
└─────────────────────────────────────────┘
```

**Upload (screen 2):** full-width, horizontal pipeline stages

**Dashboard (screen 3):** asymmetric 2-column, data left (8col), meta right (4col)

---

## Spacing

| Token | Value | Use |
|---|---|---|
| `--space-0` | 0px | — |
| `--space-1` | 4px | Inline icon-text gap |
| `--space-2` | 8px | Tight padding (badges) |
| `--space-3` | 16px | Component padding |
| `--space-4` | 24px | Section gap |
| `--space-5` | 32px | Major section gap |
| `--space-6` | 48px | Page section gap |
| `--space-7` | 64px | Module boundary |
| `--space-8` | 96px | Hero breathing room |

---

## Components (minimal set for MVP 3 screens)

### Button
- Border: 1px solid `--black`
- Background: transparent (ghost default)
- Text: JetBrains Mono 14px/500, `--black`
- Padding: 8px 16px
- Corner: 0px (sharp — Bauhaus: no decoration)
- Hover: background `--black`, text `--white` (invert)
- Primary variant: background `--accent`, text `--white`, no border

### Input
- Border: 1px solid `--gray-20`
- Background: `--white`
- Text: JetBrains Mono 14px/400
- Padding: 12px 16px
- Corner: 0px
- Focus: border `--accent`, 2px

### Drop zone
- Border: 1px dashed `--gray-20`
- Background: `--gray-05`
- Hover: border `--accent`, background white
- Active (drag over): border solid `--accent`, 2px

### Pipeline indicator
- Horizontal row of stages
- Each stage: mono text + status dot
- Active: `--accent` dot + bold text
- Done: `--black` dot
- Pending: `--gray-50` dot
- Error: `--error` dot

### Data table
- Header: JetBrains Mono 12px/500, `--gray-80`, uppercase, +0.04em tracking
- Row: JetBrains Mono 14px/400, `--black`
- Border: bottom 1px `--gray-20` per row
- No alternating row colors
- Mono alignment = columns naturally align

### Status badge
- Background: transparent
- Border: 1px solid current-color
- Text: 10px/500, uppercase, +0.04em
- Colors: `--accent` (processing), `--success` (ready), `--error` (error), `--gray-50` (pending)

---

## Motion

Minimal. Functional only.

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 100ms | Hover, focus |
| `--duration-fast` | 200ms | State change |
| `--duration-standard` | 300ms | Panel open/close |

- Easing: `ease-out` for enter, `ease-in` for exit
- **No decorative animations.** No bounces. No springs. No parallax.
- `prefers-reduced-motion`: all durations → 0ms

---

## Visual Identity Summary

```
Bauhaus root
  → Neue Typographie (mono, lowercase, functional)
  → Sparsamkeit (3 colors, 1 font, 0px radius)
  → Asymmetrisches Gleichgewicht (modular grid, tension)
  → Materialwahrheit (screen as medium, no skeuomorphism)
  → Ökonomie (data IS the interface, no decoration)

Swiss expression
  → JetBrains Mono everywhere
  → Black / White / Blue only
  → Sharp corners (0px radius)
  → Dense data, generous white space
  → Modular 64px grid with 8px atom
```

**Contexter looks like:** a well-typeset technical document that happens to be interactive. The Economist meets Terminal meets Bauhaus Zeitschrift. Data-dense, typographically rigorous, visually calm.
