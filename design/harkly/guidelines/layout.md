# Layout Guidelines — Harkly

From tLOS `design/design_system/guidelines/layout.md`. Universal rules — no adaptation needed.

---

## 01. Zone by Function, Not by Visual Balance

**Rule:** Divide every layout into zones determined by what happens in each zone (functional zoning). Never arrange zones to "look balanced."

**Check:** Can each zone be named by its function? If a zone can only be described by its position ("the left part"), it was placed visually, not functionally.

## 02. Respect the Basic Plane Directional Weights

**Rule:** Honor the viewport's four directional forces:
- **Top** (Himmel) = light, free, becoming
- **Bottom** (Erde) = heavy, grounded, constrained
- **Left** (Ferne) = departure, distance, exploration
- **Right** (Haus) = arrival, home, settlement

**Harkly application:** Omnibar sits bottom-left (grounded + departure point). FloorPill/BranchPill/CoordPill sit top-right (arrival + overview). Content frames occupy the center-left active zone.

## 03. Prefer Asymmetric Equilibrium Over Centered Symmetry

**Rule:** Achieve Gleichgewicht through asymmetric balance. Do not default to centering or mirror-image placement.

Mondrian: symmetry resolves all tension — dead. Centering produces inertia. Gleichgewicht sustains tension.

## 04. Single Axis Dominance

**Rule:** Every layout has one dominant axis (horizontal or vertical). The secondary axis is subordinate. Do not create equally weighted bi-axial layouts.

## 05. Content Before Chrome

**Rule:** The primary work zone receives maximum spatial allocation. Navigation and support elements are subordinate — smaller, lower contrast, less spatial weight.

## 06. Grid as Structure, Not Decoration

**Rule:** The 64px Baukasten grid (8x8 base = 64px visual) is structural scaffolding. Elements align to it. Grid lines are not visible to users — they are the invisible Liniennetz (Schlemmer).

## 07. Progressive Disclosure Through Spatial Depth

**Rule:** Complex content reveals through spatial layers (elevation, z-index), not through tabs or accordions. Primary content at elevation.0. Detail overlays at elevation.2-3.

## 08. No Orphaned Elements

**Rule:** Every element must belong to a spatial group. An element floating alone with no relationship to neighbors is compositionally orphaned. Either group it or remove it.

## 09. Minimum Viable Layout

**Rule:** The simplest layout is one element on the canvas. Do not add structural complexity (sidebars, panels, grids) until the content demands it.

## 10. Spatial Transitions, Not Route Changes

**Rule:** Moving between views is a spatial operation (pan, zoom, floor switch), not a page navigation. The canvas persists. Content is activated, not loaded.
