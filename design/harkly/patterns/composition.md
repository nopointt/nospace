# Composition Patterns — Harkly

From tLOS `design/design_system/patterns/composition.md`. Universal — no adaptation needed.

---

## Pattern 01: Single Dominant

Every composition has exactly one dominant element. All others serve it.

The active frame is dominant. Inactive frames recede. Navigation elements have lowest weight. If you hesitate pointing to the dominant — the composition has no dominant. Reduce competitors.

Kandinsky P-04: "Betonte Gewichte" — emphasized weights control direction and intensity of Spannung throughout the entire Flache.

---

## Pattern 02: Asymmetric Balance (Gleichgewicht)

Prefer asymmetric balance over symmetric. Equal weights on mirror axes kill tension.

Mondrian: Gleichgewicht = equilibrium of equivalent but not identical means. A small dark element balances a large light element. The forces cancel, but you feel them.

Klee: three independent parameters for balance — Mab (scale), Gewicht (weight), Charakter (quality). A composition in Mab-equilibrium may not be in Gewicht-equilibrium. Each axis independently.

---

## Pattern 03: Sparsamkeit Audit

Before finalizing any composition, perform the removal test:

1. Point to each element
2. Mentally remove it
3. Does comprehension decrease?
4. If no — the element fails economy. Remove it.

Van Doesburg: Gestaltungsmittel (essential means) vs Hilfsmittel (auxiliary means). Only the essential is permitted.

---

## Pattern 04: Plane Hierarchy

Every layout is a set of overlapping or adjacent planes with different visual weights. The compositional structure is defined by the relationships between planes, not by the content within them.

Gleizes P-09: "Organize the surface as a field of articulated planes."

In Harkly: canvas ground (elevation.0) → frame surfaces (elevation.1) → floating UI (elevation.2) → modals (elevation.3). Each elevation step is a distinct compositional plane.

---

## Pattern 05: Compositional Tension (compositional tension)

Remove any element from the composition. If the composition feels the loss — compositional tension is achieved. If nothing changes — the layout was arranged, not composed.

Oud: compositional tension = the quality of a composition where every part is under load.

This is the ultimate test. Apply it to every floor screen, every frame layout, every component.
