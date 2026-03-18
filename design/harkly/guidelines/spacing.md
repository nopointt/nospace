# Spacing Guidelines — Harkly

From tLOS `design/design_system/guidelines/spacing.md`. All 11 rules universal. Density register adapted.

---

## 01. Use Only the Scale

**Rule:** Only values from the spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. No arbitrary values.

Basis: 4px atomic unit. Fine steps +4px linear (4-24). Large steps geometric (32-80). Source: Bauhaus modular system (Gropius standardization, Klee proportional rhythm).

## 02. Space is Active (Raumgestaltung)

**Rule:** Design margins and padding as compositional elements with weight and intention. Never treat spacing as leftover.

Every spacing value must have a compositional reason: "this gap is 32 because it signals a group boundary."

## 03. Rhythm Through Variation

**Rule:** Vary spacing deliberately to create rhythm. Uniform spacing everywhere = no accent = monotone.

## 04. Consistent Inset

**Rule:** Same container type = same inset token. All cards use the same padding. All badges use the same padding.

## 05. Gap Anchors Relationship

**Rule:** Elements within a group share gap-sm (8px) or gap-md (16px). Groups separated by gap-lg (24px) or gap-xl (32px). Sections by spacing.component.section (40px).

## 06. Outer > Inner

**Rule:** Container padding >= internal gap. A card with padding:12 and gap:16 is structurally incoherent — the internal spacing exceeds the container boundary.

## 07. Breathing Room Between Groups

**Rule:** Sections and functional groups must have deliberate breathing room. Minimum: spacing.component.section (40px) between major sections.

**Harkly note:** This is where Harkly's "calm" brand lives. tLOS defaults to tight grouping. Harkly defaults to the upper range of the same scale — gap-lg (24px) within sections, section (40px) between them, page-gap (64px) for major breaks.

**Bauhaus check (Gropius P-05/P-10):** Breathing space must be compositionally justified, not uniform padding by default. Every interval earns its place: "this gap is 40px because it marks a zone boundary." Moholy-Nagy P-01 validates breathing as biological need — but Gropius demands that each interval be earned through Sparsamkeit. Sparse ≠ lazy. Sparse = intentional economy of density.

## 08. Dense vs Sparse as Hierarchy Signal

**Rule:** Density is intentional. Use tighter spacing for high-priority content (active workspace, data tables). Use looser spacing for secondary content (settings, about).

**Harkly note:** Harkly's overall density register is sparser than tLOS. But within Harkly, the same relative density hierarchy applies: F3 Insights (data-heavy) is denser than F0 Scratchpad (breathing).

## 09. No Zero-Gap Without Border

**Rule:** Two elements at 0px gap must have a structural border between them. Zero-gap without border produces ambiguous element boundaries.

## 10. Component Alias Tokens

**Rule:** Use semantic aliases from the spacing system:

| Alias | Maps to | Value | Use |
|---|---|---|---|
| inset-xs | base.1 | 4px | Badges, tight pills |
| inset-sm | base.2 | 8px | Buttons, inputs |
| inset-md | base.3 | 12px | Cards, panels |
| inset-lg | base.4 | 16px | Main content areas |
| inset-xl | base.6 | 24px | Page-level containers |
| gap-xs | base.1 | 4px | Icon + label |
| gap-sm | base.2 | 8px | Elements in group |
| gap-md | base.4 | 16px | Groups in section |
| gap-lg | base.6 | 24px | Sections |
| gap-xl | base.8 | 32px | Major sections |
| section | base.10 | 40px | Zone boundary |
| panel-inset | base.12 | 48px | Outer panel padding |
| page-gap | base.16 | 64px | Page-level separation |

## 11. Scale Comparison

The spacing scale is designed so each step visually earns its interval — no step is redundant:

```
0  ░ none (structural zero)
4  █ atomic unit
8  ██ 2x base
12 ███ 3x base
16 ████ standard unit
20 █████ upper fine scale
24 ██████ transition threshold
32 ████████ first large-scale
40 ██████████ zone separation
48 ████████████ panel outer
64 ████████████████ major section
80 ████████████████████ maximum
```
