# Spec: Design Tokens — Nomos

> Target: G3 Player — itten or lead-visual-design (Bauhaus RAG access)
> References: `CONTEXT.md` D-03 (theme), D-05 (tokens source)
> Pre-inline: Contexter color.md + typography.md + spacing.md + this spec

---

## Philosophy (adapt Contexter → Nomos)

**Contexter:** Swiss precision, cold B&W + blue, Mondrian "non-colors".

**Nomos:** Bauhaus classical, light ground, **primary triad** red/blue/yellow per Kandinsky P-11 and Itten color wheel, structural green for P&L gains.

Both share: typography, spacing, layout grid, elevation, motion — these are REUSED unchanged.

**RAG verification required** for every color decision. Queries to run (via Qdrant `bauhaus_knowledge`):

1. "Kandinsky primary triad yellow red blue"
2. "Itten color wheel temperature"  
3. "Bauhaus Werbung color hierarchy"
4. "Moholy-Nagy light yellow ground"
5. "Van Doesburg reine Ausdrucksmittel"

Every token's rationale MUST cite a RAG source (book + section).

---

## Color Tokens

### Core (3 primary + 1 neutral + 2 extended)

| Token | Value | Role | RAG source |
|---|---|---|---|
| `--color-yellow` | #F2C200 | Warning, pending, attention | Kandinsky P-11 Gelb-polus (warm) |
| `--color-red` | #C0162D | Danger, SELL, error, halt | Itten Rot (middle temperature, earth pull) |
| `--color-blue` | #1E3EA0 | Interactive, links, primary actions, info | Kandinsky Blau-polus (cold, spiritual) |
| `--color-green` | #2E7D32 | Success, gains, BUY profitable | Itten secondary (blue+yellow), practical override |
| `--color-black` | #0A0A0A | Text primary, borders strong | Mondrian non-color |
| `--color-white` | #FAFAF5 | Ground (warm off-white, NOT Contexter cold) | Moholy-Nagy yellow-tinted ground |

Rejected:
- Fiery Red Pantone 18-1664 (#BE1E2D) — too modern, not Bauhaus canonical. Using Itten red #C0162D instead.
- Dark theme — per D-03 revised decision.
- Brown from swatch — no canonical role in Bauhaus triad. Reserved as potential `--color-sepia` for non-interactive decoration if needed.

### Text Hierarchy (inherits Contexter structure, adjusted to warm ground)

| Token | Value | Use |
|---|---|---|
| `--text-primary` | #0A0A0A | Body, headings |
| `--text-secondary` | #3A3A3A | Labels, captions |
| `--text-tertiary` | #808080 | Timestamps, metadata |
| `--text-disabled` | #C0C0C0 | Disabled |
| `--text-on-accent` | #FAFAF5 | Text on colored backgrounds |

### Background Elevation (warm-tinted, 4 levels per Contexter structure)

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | #FAFAF5 | Page ground |
| `--bg-surface` | #F2F0E8 | Cards, panels |
| `--bg-elevated` | #E5E0D0 | Hover, active elements |
| `--bg-pressed` | #D9D2BF | Pressed, active tab |

### Border (warm-neutral)

| Token | Value | Use |
|---|---|---|
| `--border-subtle` | #E5E0D0 | Table row dividers |
| `--border-default` | #C8C0A8 | Input borders |
| `--border-strong` | #808080 | Focused elements |

### Interactive States (derived)

| Token | Value | Formula | Use |
|---|---|---|---|
| `--blue-hover` | #19317A | mix(blue, black, 25%) | Primary button hover |
| `--blue-pressed` | #142455 | mix(blue, black, 50%) | Primary button pressed |
| `--red-hover` | #9A1124 | mix(red, black, 25%) | Danger hover |
| `--red-pressed` | #730D1B | mix(red, black, 50%) | Danger pressed |
| `--green-hover` | #245F28 | mix(green, black, 25%) | Success hover |
| `--yellow-hover` | #C29A00 | mix(yellow, black, 25%) | Warning hover |

### Signal (functional)

| Token | Value | Use |
|---|---|---|
| `--signal-error` | #C0162D | = red |
| `--signal-warning` | #F2C200 | = yellow |
| `--signal-success` | #2E7D32 | = green |
| `--signal-info` | #1E3EA0 | = blue |

### Trading-specific (new, not in Contexter)

| Token | Value | Use |
|---|---|---|
| `--trade-buy` | #1E3EA0 | BUY orders, long positions |
| `--trade-sell` | #C0162D | SELL orders |
| `--trade-virtual` | transparent + 2px dashed #808080 | Cramer virtual trades (outlined, not filled) |
| `--pnl-positive` | #2E7D32 | P&L > 0 |
| `--pnl-negative` | #C0162D | P&L < 0 |
| `--pnl-zero` | #808080 | P&L == 0, muted |
| `--position-long` | #1E3EA0 | Position LONG state |
| `--position-flat` | #808080 | Position FLAT state |
| `--halt-active` | #C0162D + 10% bg | Halt banner background |

---

## Typography (inherit Contexter — JetBrains Mono only)

8-step scale, 3 weights, 3 line-heights.

| Token | Value | Role |
|---|---|---|
| `--font-family` | 'JetBrains Mono', 'Fira Code', monospace | All text |
| `--fs-xxs` | 10px | Metadata, timestamps |
| `--fs-xs` | 12px | Captions, table cells |
| `--fs-sm` | 14px | Secondary body |
| `--fs-base` | 16px | Body text |
| `--fs-md` | 20px | Stat values |
| `--fs-lg` | 24px | Page headings (H3) |
| `--fs-xl` | 32px | Section headings (H2) |
| `--fs-xxl` | 48px | Dashboard big numbers (H1) |
| `--fw-regular` | 400 | Body |
| `--fw-medium` | 500 | Labels, emphasis |
| `--fw-bold` | 700 | Headings, alerts |
| `--lh-tight` | 1.1 | Big numbers |
| `--lh-normal` | 1.4 | Body |
| `--lh-loose` | 1.6 | Long-form reading |

Rule: monospaced numbers critical for trading — table columns align without tabular-nums hack.

---

## Spacing (inherit Contexter — 4px atom, 12-step scale)

| Token | Value |
|---|---|
| `--space-0` | 0 |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 32px |
| `--space-8` | 40px |
| `--space-9` | 48px |
| `--space-10` | 64px |
| `--space-11` | 80px |

Component-level aliases (from Contexter `spacing.md`):
- `--gap-tight` = --space-1 (4px)
- `--gap-default` = --space-2 (8px)
- `--gap-loose` = --space-4 (16px)
- `--padding-card` = --space-4 (16px)
- `--padding-page` = --space-6 (24px)
- `--padding-button` = --space-3 × --space-2

---

## Elevation (inherit Contexter cold model, WARM shadows)

4-level scale:

| Token | CSS | Use |
|---|---|---|
| `--elevation-flat` | none | Inline content |
| `--elevation-low` | `0 1px 2px rgba(40,30,10,0.06)` | Cards, table rows |
| `--elevation-mid` | `0 4px 12px rgba(40,30,10,0.08)` | Dropdowns, modals |
| `--elevation-high` | `0 12px 32px rgba(40,30,10,0.12)` | Floating panels, toasts |

Shadow tint is warm (brown-ish RGB) to match warm ground — departure from Contexter's cold shadow. RAG: Moholy warmth principle.

---

## Motion (inherit Contexter 6 durations + 6 easings)

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 0ms | No animation |
| `--duration-fast` | 120ms | Hover, focus |
| `--duration-normal` | 240ms | Modals, transitions |
| `--duration-slow` | 400ms | Page transitions |
| `--duration-graceful` | 600ms | Chart reveals |
| `--duration-deliberate` | 1000ms | Halt banner entry |
| `--easing-linear` | `linear` | |
| `--easing-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default |
| `--easing-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Modal |
| `--easing-bounce` | `cubic-bezier(0.68, -0.55, 0.27, 1.55)` | Rare — celebratory |

---

## Layout (inherit Contexter modular grid)

- Base column: 12 (max-width 1440px)
- Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536
- Sidebar: 240px fixed, collapses to icon-only <1024px, hidden <640px (hamburger)
- Header: 56px fixed
- Page padding: `--padding-page` (24px) desktop, `--space-4` (16px) mobile

---

## Tailwind 4 config snippet

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "canvas": "var(--bg-canvas)",
        "surface": "var(--bg-surface)",
        "elevated": "var(--bg-elevated)",
        "ink-primary": "var(--text-primary)",
        "ink-secondary": "var(--text-secondary)",
        "accent": "var(--color-blue)",
        "accent-hover": "var(--blue-hover)",
        "danger": "var(--color-red)",
        "warning": "var(--color-yellow)",
        "success": "var(--color-green)",
        "trade-buy": "var(--trade-buy)",
        "trade-sell": "var(--trade-sell)",
        "pnl-up": "var(--pnl-positive)",
        "pnl-down": "var(--pnl-negative)",
      },
      fontFamily: {
        mono: ["var(--font-family)"],
      },
      fontSize: {
        "xxs": "var(--fs-xxs)",
        "xs": "var(--fs-xs)",
        "sm": "var(--fs-sm)",
        "base": "var(--fs-base)",
        "md": "var(--fs-md)",
        "lg": "var(--fs-lg)",
        "xl": "var(--fs-xl)",
        "xxl": "var(--fs-xxl)",
      },
      boxShadow: {
        "e-low": "var(--elevation-low)",
        "e-mid": "var(--elevation-mid)",
        "e-high": "var(--elevation-high)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## `index.css` (CSS variables + Tailwind base)

```css
@import "tailwindcss";

:root {
  /* colors */
  --color-yellow: #F2C200;
  --color-red: #C0162D;
  --color-blue: #1E3EA0;
  --color-green: #2E7D32;
  --color-black: #0A0A0A;
  --color-white: #FAFAF5;
  /* ... all tokens above ... */
}

body {
  font-family: var(--font-family);
  background: var(--bg-canvas);
  color: var(--text-primary);
  font-size: var(--fs-base);
  line-height: var(--lh-normal);
  font-feature-settings: "tnum" 1;
}
```

---

## Component Primitives — minimum set

Following Contexter `components/inventory.md`:

- **Button** — 4 variants: primary (blue), danger (red), ghost, icon. 3 sizes.
- **Badge** — 4 variants: info, success, warning, danger.
- **Card** — container with `bg-surface` + `shadow-e-low` + `padding-card`.
- **Stat** — label + big number + delta.
- **Table** — sortable headers, hover row, zebra optional.
- **Modal** — centered, `shadow-e-high`, escape closes.
- **Input** — bordered, monospace, focused ring.
- **Toggle** — for enable/disable strategy.
- **Pill** — status indicator (runner running/stopped).

---

## 10 Rules (adapted from Contexter `color.md`)

1. Structure first, color second — validate grayscale before applying triad
2. Color follows purpose (semantic tokens only, never raw hex in components)
3. Flat unmodulated color — no gradients
4. Color earns its place — every chromatic element encodes info
5. Chromatic restraint — max 10% viewport is colored (relaxed from Contexter 5%)
6. WCAG AA contrast non-negotiable (4.5:1 text, 3:1 UI)
7. Warm ground (Nomos departure from Contexter cold) — FAFAF5 base
8. P&L uses green/red as immediate visual priority
9. Trading state (LONG/FLAT) uses position tokens, not raw colors
10. Every color decision cites Bauhaus RAG source

---

## RAG citation requirement

In the final implementation, add a `design-decisions.md` file in `finance/nomos/web/` listing each token + RAG citation:

```markdown
| Token | Value | RAG source (book, page) |
|---|---|---|
| --color-yellow | #F2C200 | Kandinsky "Point and Line to Plane" P-11 Gelb-polus |
| --color-red   | #C0162D | Itten "Kunst der Farbe" — Rot temperature middle |
| ...
```

---

## Definition of Done (design tokens)

- All tokens above implemented in `index.css`
- Tailwind config maps tokens correctly
- Visual validation: demo page showing every primitive + color
- RAG citations written for all chromatic tokens
- Contrast audit: all text/bg pairs pass WCAG AA
