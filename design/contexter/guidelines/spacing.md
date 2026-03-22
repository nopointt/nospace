# Spacing Guidelines — Contexter

From Harkly `guidelines/spacing.md`. All 11 rules universal. No adaptation needed.

---

## 01. Use Only the Scale

Only values from the spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. No arbitrary values.

4px atomic unit. Fine steps +4px linear (4-24). Large steps geometric (32-80).

## 02. Space is Active (Raumgestaltung)

Design margins and padding as compositional elements with weight and intention.

## 03. Rhythm Through Variation

Vary spacing deliberately to create rhythm. Uniform spacing = no accent = monotone.

## 04. Consistent Inset

Same container type = same inset token.

## 05. Gap Anchors Relationship

Within group: gap-sm (8px) or gap-md (16px). Between groups: gap-lg (24px) or gap-xl (32px). Between sections: section (40px).

## 06. Outer > Inner

Container padding >= internal gap.

## 07. Breathing Room Between Groups

Minimum section (40px) between major sections. Contexter uses generous white space — Swiss precision, not dense engineering UI.

## 08. Dense vs Sparse as Hierarchy Signal

Tighter spacing for data tables (high-density). Looser spacing for hero, empty states.

## 09. No Zero-Gap Without Border

Two elements at 0px gap must have a structural border.

## 10. Component Alias Tokens

| Alias | Value | Use |
|---|---|---|
| inset-xs | 4px | Badges, tight pills |
| inset-sm | 8px | Buttons, inputs |
| inset-md | 12px | Cards, panels |
| inset-lg | 16px | Main content areas |
| inset-xl | 24px | Page-level containers |
| gap-xs | 4px | Icon + label |
| gap-sm | 8px | Elements in group |
| gap-md | 16px | Groups in section |
| gap-lg | 24px | Sections |
| gap-xl | 32px | Major sections |
| section | 40px | Zone boundary |
| panel-inset | 48px | Outer panel padding |
| page-gap | 64px | Page-level separation |

## 11. Scale Visualization

```
0  ░ none
4  █ atomic
8  ██ 2x
12 ███ 3x
16 ████ standard
20 █████ upper fine
24 ██████ transition
32 ████████ first large
40 ██████████ zone
48 ████████████ panel outer
64 ████████████████ major section
80 ████████████████████ maximum
```
