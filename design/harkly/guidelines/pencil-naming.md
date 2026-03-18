# Pencil Naming Convention — Harkly

Rules for naming nodes, components, artboards, and frames in `harkly-ui.pen`.

---

## Top-Level Frames

Format: `{Category} · {Name}` or `{Category} {Name}`

| Pattern | Example | Use |
|---|---|---|
| `Harkly {System}` | Harkly Color System, Harkly Typography System | Design system frames |
| `Harkly Component Library` | — | Component library |
| `Shell · {State}` | Shell · Omnibar Collapsed, Shell · Omnibar Expanded | Shell artboards |
| `F{N} · {Name RU}` | F0 · Scratchpad, F1 · Источники, F2 · Raw | Floor artboards |
| `{variant}F{N}` | copiedF0, peoF0, itF0, finerF0 | Variant explorations |

---

## Reusable Components

Format: `{Type}/{Variant}` — slash separates type from variant.

| Pattern | Examples |
|---|---|
| `Button/{variant}` | Button/Primary, Button/Secondary, Button/Ghost, Button/Danger, Button/Icon |
| `Input/{variant}` | Input/Default, Input/Search |
| `Badge/{category}/{variant}` | Badge/Stage, Badge/Stage/Active, Badge/Source/Reddit, Badge/Status/Processing, Badge/Count |
| `Frame/{variant}` | Frame/Project, Frame/Artifact |
| `SpineProgress` | — (single component, no variants) |

**Rules:**
- Type = what it is (Button, Badge, Frame, Input)
- Variant = how it differs (Primary, Active, Reddit)
- Category = grouping within type (Source, Status, Stage)
- Use PascalCase for each segment
- Max 3 levels: `Type/Category/Variant`
- No spaces in component names

---

## Internal Nodes (non-reusable)

Format: short camelCase abbreviation. Keep names minimal — Sparsamkeit applies to naming too.

| Pattern | Examples | Use |
|---|---|---|
| `hdr` / `hdr2` | header frames | Section headers |
| `sec{N}` / `sec{name}` | secg, secp, secbg, sectl | Section containers |
| `row{name}` | rowg, rowp, rowbd, row1 | Row containers |
| `lbl{name}` | lbl0, lblA1 | Labels |
| `val{name}` | val0, valA1 | Values |
| `bar{name}` | bar0, bar1p | Visual bars |
| `col{name}` | colNone, col1 | Columns |
| `sw{name}` / `s{N}f` | sww, sw1, s5f | Color swatches |
| `btn` / `sBtn` | — | Buttons |
| `ico` / `sIco` | — | Icons |
| `div{N}` / `sep{N}` | divider0, sep1 | Dividers |

**Rules:**
- camelCase, no spaces
- Abbreviate aggressively: `hdr` not `header`, `lbl` not `label`, `sec` not `section`
- Number suffixes for sequences: `row1`, `row2`
- Prefix with parent context when ambiguous: `projFooter`, `artFooter`

---

## Artboard-Level Nodes

Standard nodes present on every floor artboard:

| Name | Purpose |
|---|---|
| `Grid` | 64px Baukasten grid overlay |
| `ScreenLabel` | Floor identifier text (e.g. "F1 · Источники") |
| `FloorPill` | Floor selector pill, top-right |
| `BranchPill` | Branch selector pill |
| `CoordPill` | Coordinate display pill |
| `Omnibar` | Omnibar frame (collapsed or expanded) |

These names are fixed across all artboards. Do not rename.

---

## Content Nodes on Floors

Format: `{floor}{purpose}` or descriptive camelCase.

| Pattern | Examples |
|---|---|
| `fs` | Framing Studio panel (F0) |
| `collCard` | Collapsed state card |
| `stateLabel` | State indicator label |

For floor-specific content, prefix with floor context only if node could be confused across floors.

---

## Design System Frame Sections

Inside design system frames (Color System, Typography System, etc.):

| Pattern | Examples | Use |
|---|---|---|
| `sec{N}{name}` | sec1Container, sec2Container | Major sections |
| `{group}GrpLbl` | insetGrpLbl, gapGrpLbl | Group labels |
| `row{ID}` | rowA1, rowB3, rowC1 | Table-like rows |
| `cell{ID}{L/R}` | cellA1L, cellA1R | Table cells |
| `{prefix}Panel` | wRegPanel, lhTightPanel | Visual panels |
| `role{Name}` | roleDisplay, roleBody, roleCaption | Typography role rows |
| `eas{Name}` | easBox1, easRow1 | Easing visualizations |
| `footerNote` / `footerFrame` | — | Footer elements |

---

## Naming Anti-Patterns

| Don't | Do | Why |
|---|---|---|
| `Frame 1`, `Frame 2` | `Frame/Project`, `Frame/Artifact` | Generic numbers carry no meaning |
| `group_1_header` | `hdr` | Over-verbose, wastes cognitive space |
| `My Button`, `new frame` | `Button/Primary`, `fsPanel` | Unnamed defaults = design debt |
| `Card/Project` | `Frame/Project` | "Card" = dashboard mental model, "Frame" = spatial |
| `UPPERCASE_NAME` | `camelCase` | Caps = shouting, not Bauhaus Sparsamkeit |
| `icon-arrow-up` | `sIco` | Kebab-case inconsistent with Pencil convention |

---

## Checklist Before Committing

- [ ] Every reusable component follows `Type/Variant` or `Type/Category/Variant`
- [ ] Every artboard has the 6 standard nodes (Grid, ScreenLabel, FloorPill, BranchPill, CoordPill, Omnibar)
- [ ] No unnamed default nodes (`frame`, `text`, `rectangle`)
- [ ] Internal nodes use camelCase abbreviations
- [ ] Floor names use Russian (`Источники`, `Черновик`, not `Sources`, `Scratchpad`)
- [ ] Design system section names follow `sec{N}` pattern
- [ ] **OVERLAP CHECK (MANDATORY):** After every batch_design, run `get_screenshot` and visually verify NO frames overlap. `snapshot_layout(problemsOnly:true)` is NOT sufficient — it checks bounding boxes, not visual overlap from fit_content growth. Calculate manually: node y + estimated content height < next node y. Omnibar is at y:828 — nothing may extend below y:828.
- [ ] **GRID CHECK:** All x/y positions AND widths must be multiples of 64 (Baukasten grid). Verify: 128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024, 1088, 1152, 1216, 1280. Width: 256, 320, 384, 448, 512. Any value not on grid = bug.
