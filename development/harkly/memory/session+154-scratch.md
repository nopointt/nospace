<!-- ENTRY:2026-03-18:CHECKPOINT:154:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 154 [Axis]

**Decisions:**
- Canvas grid: Baukasten 8px base module (RAG synthesis confirmed) → 64px visual grid (8×8)
- Canvas background: `--bg-canvas` → #FFF8E7 (comic latte) — warm neutral, not pure white
- No column grid on canvas; spatial zones instead (Schlemmer: body-law fixed UI / space-law floating frames)
- Omnibar position: bottom-LEFT (not center as in tLOS) — distinct Harkly pattern
- Omnibar border: shadow effect instead of stroke (stroke silently dropped by Pencil MCP — always use shadow)
- Padding format in Pencil: `[vertical, horizontal]` — critical discovery, not `[horizontal, vertical]`
- `--bg-surface` (#F8F8F8) stays for now; may need warm variant (#F5EDD8) — nopoint to decide
- Grid line color: #EBEBEB (slightly warm, consistent with latte palette)

**Files changed:**
- `untitled.pen` — Shell · Omnibar Collapsed (7OCdH) + Shell · Omnibar Expanded (yil9s) artboards created; 64px Baukasten grid on both; `$--bg-canvas` token applied; coord display fixed; omnibar padding corrected; shadow borders applied
- `untitled.pen` variable `--bg-canvas`: #FFFFFF → #FFF8E7

**Completed:**
- Base shell design: two artboards 1440×900 (collapsed + expanded omnibar states)
- Canvas background: comic latte `#FFF8E7` via token
- 64px Baukasten grid: 22 vertical × 14 horizontal lines per screen, behind all content
- Omnibar collapsed: pill bottom-left, dot+placeholder+send, shadow border, correct padding [0,12]
- Omnibar expanded: panel 360×400, header/body/divider/input, shadow, padding [0,16]
- Coordinate display: top-right pill, smaller (56×20), centered text
- Bauhaus grid RAG research (background agent — 107 files synthesis read)
- Padding bug found and fixed (Pencil [vertical,horizontal] order)

**In progress:**
- Next screen: Framing Studio or Research Canvas (awaiting nopoint decision)

**Opened:**
- `--bg-surface` warm variant decision pending
- Omnibar frames should become reusable components (currently one-off)
- Stroke format in Pencil MCP unresolved → use shadow workaround until solved

**Notes:**
- Pencil MCP stroke silently drops when applied via U() — no error, no property in result. Shadow effect is reliable workaround.
- Pencil padding: [vertical, horizontal] matches CSS shorthand convention (not reversed as initially assumed)
- Bauhaus RAG: no column grids, no golden ratio — Baukasten (Meyer) + Schlemmer zones is the correct spatial system
