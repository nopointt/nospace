# Data Visualization Guidelines — Harkly

Rules for charts, graphs, knowledge graphs, entity lists, data tables, and research artifacts (Empathy Map, Journey Map, Fact Pack, Evidence Map).

Harkly is a research tool. Data visualization is not secondary — it IS the product surface where insights become visible. Every rule here serves the brand: Attentive (show what matters), Precise (numbers not adjectives), Humanist (people not data points), Calm (no visual noise).

---

## 01. Data is Spatial

**Rule:** Data visualizations are frames on the infinite canvas — spatial objects with position, size, z-layer. They are NOT embedded charts inside a page layout. A knowledge graph floats on F3 canvas. An Empathy Map is a frame on F4.

**Why:** Spatial paradigm. Position implies relationship. A quote frame placed near an entity frame = visual connection. The canvas IS the layout engine.

---

## 02. One Insight Per Frame

**Rule:** Each data visualization frame communicates one primary insight. Do not combine multiple chart types in one frame. A knowledge graph is one frame. An entity list is another. A quote panel is a third.

**Why:** Economy (Sparsamkeit). Single dominant per composition. If a frame tries to show two things, split it into two frames positioned near each other on the canvas.

---

## 03. Text Over Chart

**Rule:** Prefer text-based data representation over graphical charts. Tables over bar charts. Lists over pie charts. Numbers over infographics. Use graphical visualization only when spatial relationships (graph nodes, journey stages, map quadrants) cannot be expressed in text.

**Why:** Brand = Precise + Scientific. "847 respondents" is more precise than a bar. "3 patterns found" is clearer than a donut chart. Infostyle = text first.

**Exception (Kandinsky P-04):** "Where quantitative change must be read at a glance, substitute line-form for numerical table." Trend data and temporal patterns ARE better served by graphical lines — the eye grasps direction and magnitude simultaneously. Text-over-chart applies to static counts and categories, not to temporal flows.

**When graphical IS needed:**
- Knowledge graphs (entity relationships = inherently spatial)
- Journey Maps (stages = sequential spatial flow)
- Empathy Maps (quadrants = spatial grouping)
- Evidence Maps (claim → evidence = tree structure)
- Trend lines (temporal patterns = Kandinsky line-form)

---

## 04. Warm Neutral Palette for Data

**Rule:** Data visualizations use the warm neutral palette as base. Chromatic color enters only to encode meaningful distinctions — not to make charts "colorful."

| Element | Token | Use |
|---|---|---|
| Background | `--bg-canvas` or `--bg-surface` | Frame ground |
| Grid lines | `--border-subtle` (#E8DDD0) | Warm structural grid |
| Default data | `--text-primary` (#1C1C1C) | Bars, lines, nodes |
| Secondary data | `--text-secondary` (#555555) | Labels, axes |
| Metadata | `--text-tertiary` (#8E8E8E) | Timestamps, source refs |
| Highlight | `--accent-blue` (#1E3EA0) | Active/selected item |
| Warning | `--signal-warning` (#F2C200) | Threshold exceeded |
| Error | `--signal-error` (#C82020) | Failed/invalid data |
| Success | `--signal-success` (#2D7D46) | Confirmed/validated |

**No rainbow palettes.** If categories need color distinction, use warm-gray value steps (light → dark) first. Chromatic color only when gray distinction is insufficient AND the distinction encodes meaning.

---

## 05. Knowledge Graph Rules (F3 Insights)

**Nodes:**
- Shape: rounded rectangle (cornerRadius 8px) — consistent with frame components
- Size: proportional to evidence strength (more sources → larger node)
- Fill: `--bg-surface` default, `--accent-blue` for active/selected
- Border: `--border-subtle` default, `--border-strong` for active
- Label: inside node, `--text-primary`, 12-14px Inter

**Edges:**
- Style: 1px solid `--border-default` (#C6C6C6)
- Direction: arrow terminus (Lucide arrow icon or SVG arrowhead)
- Label: midpoint, `--text-tertiary`, 10-11px
- No curved edges unless crossing would create ambiguity — prefer straight lines (economy)

**Layout:**
- Force-directed or hierarchical — NOT grid
- Spatial clustering by theme (related entities near each other)
- Zoom levels: ground = read labels, neighborhood = see clusters, overview = see full graph shape

---

## 06. Entity List Rules (F3 Insights)

**Structure:** Vertical list of entity frames. Each entity = one row-frame.

| Element | Style |
|---|---|
| Entity name | 14px 600 `--text-primary` |
| Entity type | Badge component (Badge/Stage), 11px |
| Evidence count | Badge/Count component |
| Confidence | Progress bar: `--text-primary` fill on `--bg-surface` ground |
| Source attribution | 11px `--text-tertiary`, truncated to source name |

**Interaction:** Click entity → camera jumps to entity node in knowledge graph (if on same floor) or highlights related quotes.

---

## 07. Quote Display Rules (F3 Insights, F2 Raw)

**Rule:** Quotes are primary evidence. Display them with maximum readability and full attribution.

| Element | Style |
|---|---|
| Quote text | 14px 400 `--text-primary`, line-height 1.4, left border 3px `--accent-blue` |
| Source | 11px `--text-tertiary` — "[Source name], [date]" |
| Highlight | Selected words in quote: `--bg-elevated` background inline |

**No quotation marks.** Left border = quote indicator (economy). Quotation marks are redundant.

---

## 08. Research Artifact Rules (F4 Artifacts)

### Empathy Map
Four quadrants (Says / Thinks / Does / Feels). Each quadrant = separate sub-frame inside the artifact frame.
- Quadrant label: 12px 600 `--text-secondary`, ALL CAPS, letter-spacing 1px
- Content: bullet list, 13px `--text-primary`
- Quadrant border: `--border-subtle` between quadrants
- No color coding per quadrant — structure (position) carries the meaning

### Fact Pack
Table-based. Rows = facts. Columns = claim | evidence count | confidence | sources.
- Follow table rules: frame → row frame → cell frame → content
- Alternating row fill: `--bg-canvas` / `--bg-surface`
- Confidence: text ("high" / "medium" / "low"), not color bars

### Journey Map
Horizontal stages. Each stage = vertical column frame.
- Stage header: 12px 600 `--text-secondary`
- Pain points: left border 3px `--signal-error`
- Positive moments: left border 3px `--signal-success`
- Touchpoints: Badge/Stage component
- Horizontal flow: left → right reading direction, gap-lg (24px) between stages

### Evidence Map
Tree structure: claim → supporting evidence → warrant.
- Claim node: `--bg-surface`, `--border-strong`, 14px 600
- Evidence node: `--bg-canvas`, `--border-default`, 13px 400
- Color coding by strength: `--signal-success` border (strong), `--signal-warning` border (weak), `--signal-error` border (contradicted)
- Tree layout: top-down, claim at top, evidence branching below

---

## 09. Data Tables (F2 Raw, F1 Sources)

**Structure:** Frame → row frames → cell frames → content. Strict hierarchy, no shortcuts.

| Element | Style |
|---|---|
| Header row | `--bg-elevated` fill, 11px 600 `--text-secondary`, ALL CAPS, letter-spacing 1px |
| Body row | alternating `--bg-canvas` / `--bg-surface` |
| Cell padding | inset-sm (8px) vertical, inset-md (12px) horizontal |
| Cell text | 13px 400 `--text-primary` |
| Row hover | `--interactive-hover` |
| Selected row | `--accent-blue` left border 3px |
| Sort indicator | Lucide chevron-up / chevron-down, 12px, `--text-tertiary` |

**No zebra striping with chromatic color.** Alternating warm neutrals only.

---

## 10. Progress and Status Indicators

**Linear progress bar:**
- Height: 4px (compact) or 8px (standard)
- Track: `--bg-surface`
- Fill: `--text-primary` (default), `--signal-warning` (70-90%), `--signal-error` (>90%)
- Corner radius: 2px (compact) or 4px (standard)

**Threshold colors:** green (0-70%) → yellow (70-90%) → red (90-100%) for quota/limit bars.

**Spine progress:** Use SpineProgress component (1QdMm) for research stage indication.

---

## 11. Empty Data States

**Rule:** Empty data visualization = warm invitation, not error.

- Empty knowledge graph: canvas with single text "Ask Harkly to find connections" (omnibar prompt)
- Empty entity list: "No entities extracted yet. Add documents on F2."
- Empty table: header row visible, body area shows warm prompt text

No placeholder illustrations. No skeleton loading screens. The warm canvas ground IS the empty state. A single guiding text line is sufficient.

---

## 12. Accessibility in Data Viz

**Rule:** Never use color as the sole differentiator. Every color-coded element must also have a text label, icon, or pattern.

- Knowledge graph nodes: shape + label + color (not color alone)
- Status indicators: dot + text label (not dot alone)
- Chart segments: label each segment directly (not in a separate legend)
- Minimum contrast: 4.5:1 for all data labels on their background
