# Layout Guidelines — Contexter

From Harkly `guidelines/layout.md`. Universal rules. Adapted from spatial to web.

---

## Grid System

**Modular grid: 8px atom, 64px module.**

- Columns: 12 × variable
- Gutter: 16px
- Margin: 32px (mobile), 64px (desktop)
- Max content width: 1280px
- Page width: 1440px

RAG: Klee P-17 — "Proportions as specific ratios between unlike quantities." Zeitschrift — "Normierung — standardisation."

## Rules

### 01. Zone by Function
Divide layout by what happens in each zone, not by visual balance.

### 02. Directional Weights (Kandinsky)
- Top = light, free → navigation, branding
- Bottom = heavy, grounded → actions, CTAs
- Left = departure, exploration → content
- Right = arrival, settlement → meta, status

### 03. Asymmetric Equilibrium
8:4 column splits. Never centered symmetry for primary layouts.

Mondrian P-17: symmetry is static, dead. Gleichgewicht sustains tension.

### 04. Single Axis Dominance
Every layout has one dominant axis. Secondary is subordinate.

### 05. Content Before Chrome
Primary content gets maximum space. Navigation and support are subordinate.

### 06. Grid as Structure
64px module is invisible structure. Elements snap to it.

### 07. Progressive Disclosure Through Depth
Complex content through z-layers (elevation), not tabs or accordions.

### 08. No Orphaned Elements
Every element belongs to a group.

### 09. Minimum Viable Layout
Start with one element. Add structure only when content demands it.

### 10. Page Transitions (web adaptation)
Contexter uses page routes (not spatial transitions). But transitions between pages use `duration.standard` (250ms) + `easing.medial`.

## Raw → Structured Axis (foundational layout concept)

Every screen follows the conceptual left→right transformation:
- **Left** = raw input, departure, exploration (Kandinsky: left edge = free)
- **Right** = structured output, arrival, settlement (Kandinsky: right edge = grounded)
- The pipeline is implied through reading direction, never explicit chrome

This governs the 8:4 asymmetric split: 8 columns for the input/content pole, 4 columns for the output/meta pole.

## Screen Layouts

### Hero (screen 1) — raw → structured promise
```
┌──────────────────────────────────────────┐
│  nav: logo left, cta right               │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────────┐  ┌─────────────┐  │
│  │ "any context →     │  │ api output  │  │
│  │  knowledge api"    │  │ preview     │  │
│  │                    │  │ mcp badge   │  │
│  │ supported formats  │  │             │  │
│  └──────────────────┘  └─────────────┘  │
│  8 col (raw pole)        4 col (struct) │
└──────────────────────────────────────────┘
```

### Upload (screen 2) — raw → structured in action
```
┌──────────────────────────────────────────┐
│  nav                                     │
├──────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────┐  │
│  │ drop zone          │  │ extraction  │  │
│  │ file list           │  │ preview     │  │
│  │ (raw inputs)        │  │ pipeline ●  │  │
│  │ 8 col               │  │ 4 col       │  │
│  └──────────────────┘  └─────────────┘  │
└──────────────────────────────────────────┘
```

### Dashboard (screen 3) — raw → structured complete
```
┌──────────────────────────────────────────┐
│  nav                                     │
├──────────────────────────────────────────┤
│  ┌──────────────────┐  ┌─────────────┐  │
│  │ documents table    │  │ query panel │  │
│  │ (uploaded files     │  │ (structured │  │
│  │  = raw layer)       │  │  knowledge) │  │
│  │ 8 col               │  │ 4 col       │  │
│  └──────────────────┘  └─────────────┘  │
└──────────────────────────────────────────┘
```
