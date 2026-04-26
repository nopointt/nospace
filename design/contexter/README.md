# Contexter Design System

Black. White. Blue. One typeface. Sharp geometry. Swiss precision rooted in Bauhaus.

## Source of Truth

**Canon = the Markdown files in this directory.** Pencil files visualize the canon, they do not define it. When Pencil drifts, fix Pencil to match docs. When implementation drifts, fix code to match docs.

**Pencil files:**
- `contexter-ui.pen` — light theme tokens, components, screens (legacy single-theme reference)
- `design-system-themes.pen` — full system in light + dark themes (active source for both blog/vault dark + main contexter.cc light)

## What's in Pencil

| System | Content |
|---|---|
| Color System | 3 core (black/white/accent) + 4 text + 4 bg + 3 border + 2 interactive + 4 signal + 4 derived hover/pressed (accent + error) — 24 semantic tokens, theme axis (light/dark) |
| Spacing System | 12 base scale (4px unit, 0–80px) + 13 component aliases |
| Typography System | Inter (body/UI) + JetBrains Mono (code/data), 8-step scale (10–48px), 3 weights, 3 line-heights, 11 roles |
| Motion System | 6 duration, 4 delay, 6 easing |
| Component Library | Button×4, Input×2, Badge×4, DropZone, PipelineIndicator, DataTable |
| Logofolio | con[text]er — 4 variants, 3 sizes |

## What's in Docs

| File | Purpose |
|---|---|
| `foundations/philosophy.md` | Bauhaus root → Contexter expression |
| `foundations/principles.md` | 5 Bauhaus principles adapted for cold/Swiss aesthetic |
| `guidelines/color.md` | B&W + blue, pure grays, 10 rules |
| `guidelines/typography.md` | Single typeface, 12 rules |
| `guidelines/spacing.md` | 4px atom, 11 rules (from Harkly, universal) |
| `guidelines/elevation.md` | 4-level cold model, shadow rules |
| `guidelines/motion.md` | Calm motion, 6 rules (from Harkly, as-is) |
| `guidelines/layout.md` | Modular grid, asymmetric equilibrium, 10 rules |
| `guidelines/data-visualization.md` | Tables, progress, text-over-chart |
| `patterns/interaction.md` | State machine, 6 patterns |
| `patterns/error-states.md` | Signal colors, inline errors |
| `components/inventory.md` | All components documented |

## Relationship to Harkly

Contexter inherits structural skeleton from Harkly design system:
- **5 principles** — universal, Materialwahrheit adapted for cold B&W
- **Spacing scale** — identical (0–80px), density register shifted to Swiss precision
- **Typography rules** — rules 02-12 universal, single typeface replaces dual
- **Motion** — identical (calm register)
- **Patterns** — interaction/error-states universal, workspace/navigation not applicable (web app, not spatial)

Contexter replaces: warm palette → cold B&W, Inter+Mono → Mono only, soft corners → sharp 0px, Cosmic Latte → pure white, spatial canvas → web pages.

## Bauhaus RAG

All design decisions verified against 14 Bauhausbucher + 14 Zeitschrift issues:
- Qdrant: `localhost:6333`, collection `bauhaus_knowledge`, 10,288 vectors
- Every departure from Harkly justified by RAG citation
