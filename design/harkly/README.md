# Harkly Design System

Warm spatial research tool. Bauhaus structural principles + soft/light/warm aesthetic.

## Source of Truth

**Pencil file:** `harkly-ui.pen` — tokens, components, artboards. Everything visual lives here.

## What's in Pencil

| System | ID | Tokens |
|---|---|---|
| Color | DpHtH | Gray 10-step, Primary Y/R/B, Background 4, Text 4, Border 3, Interactive 3, Signal 4 |
| Spacing | jrVLH | 12 base scale (4px unit, 0–80px) + 13 component aliases |
| Typography | Kf1xa | Inter + JetBrains Mono, 8-step scale (10–48px), 3 weights, 3 line-heights, 11 roles |
| Motion | zqE0U | 6 duration (Presto/Andante/Adagio), 4 delay, 6 easing (Klee), 5 composite |
| Interface Examples | xF6MT | Panel, buttons, signals, borders, overlay, accent, light theme |
| Components | ejLN6 | 17 reusable: Button×5, Input×2, Badge×7, Card×2, SpineProgress |

## What's in Docs

| File | Purpose |
|---|---|
| `foundations/philosophy.md` | Brand → design bridge |
| `foundations/principles.md` | 5 Bauhaus principles adapted for Harkly |
| `guidelines/*.md` | Actionable rules (color, typography, spacing, layout, elevation, motion) |
| `patterns/*.md` | Named solutions (workspace, composition, interaction, navigation, error-states) |
| `components/inventory.md` | 17 components documented |
| `harkly-spatial-interface-rules.md` | Spatial paradigm (canvas, frames, omnibar, floors) |
| `bauhaus-rag-results.md` | 12 RAG queries for design decisions |

## Relationship to tLOS

Harkly inherits structural skeleton from tLOS design system (`design/design_system/`):
- **5 principles** — all universal, Materialwahrheit adapted for warm shadows
- **Spacing scale** — identical {4,8,12,16,20,24,32,40,48,64,80}, density register shifted to breathing
- **Typography rules** — rules 02-12 universal, font choice is Harkly's own
- **Layout rules** — functional zoning, basic plane weights universal
- **Patterns** — workspace/composition/interaction/navigation universal, tokens remapped

Harkly replaces: dark theme → light warm, B&W → warm palette, sharp corners → soft rounded, max density → calm breathing, 3-primary-only → warm chromatic vocabulary.

## Bauhaus RAG

Design decisions grounded in 14 Bauhausbucher via Qdrant vector DB:
- `design/design_system/` — 80 files, guidelines, patterns, tokens
- `docs/tLOS/design/bauhaus-code/` — 107 extraction files
- Qdrant: `localhost:6333`, collection `bauhaus_knowledge`, 10,288 vectors
- Query: `tlos-langgraph-bridge/bauhaus_query.py`

## Brand Foundation

- Brand Bible: `development/harkly/brand/brand-bible.md`
- Values: `development/harkly/brand/values.md`
- Positioning: `development/harkly/brand/positioning.md`
- TOV: Attentive · Precise · Humanist · Calm
- Vibe: Soft · Elegant · Intelligent · Scientific · Anthropocentric
