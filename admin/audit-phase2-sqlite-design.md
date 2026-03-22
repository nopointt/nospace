# Phase 2 Audit: SQLite Index Layer & Design System Three-Tier Tokens

Date: 2026-03-22
Auditor: Axis (Orchestrator)

---

## Phase 2.1 — SQLite Index Layer Readiness

### 1. Memory File Landscape

**Total memory .md files:** 196
**Total lines across all memory files:** 23,218

| Location | Files | Lines |
|---|---|---|
| `development/tLOS/memory/` (flat) | 22 | 6,808 |
| `development/tLOS/memory/chronicle/` (flat: index, current, archive) | 3 | 4,775 |
| `development/tLOS/memory/chronicle/scratches/` | 63 | ~3,000 est. |
| `development/tLOS/memory/chronicle/queue/` | 2 | ~50 est. |
| `development/tLOS/memory/scratches/` (active) | 6 | ~250 est. |
| `development/harkly/memory/` | 47 | 5,321 |
| `development/contexter/memory/` | 4 | 263 |
| `finance/nomos/memory/` | 3 | 211 |
| `memory/` (global workspace) | 5 | 1,069 |
| `tools/oss-reference/` (irrelevant) | 1 | (skip) |
| **TOTAL** | **196** | **~23,218** |

### 2. File Categories and Formats

**Category A — Structured context files (consistent format, easy to parse):**
- `*-about.md` — project L1 identity (tlos-about, harkly-about, contexter-about, nomos-about)
- `*-roadmap.md` — L2 project roadmap
- `*-phase*.md` — L3 epic context (tlos-phase10..15, nomos-phase1)
- `current-context-*.md` — active session state
- `semantic-context-*.md` — entity-centric knowledge base
- `codebase-map-*.md` — code structure maps

These files have consistent naming, stable structure, and are updated in-place. Good SQLite candidates for a `memory_files` table.

**Category B — Scratch files (two naming patterns):**

Pattern 1 (tLOS): `{8-hex-hash}+{N}-scratch.md`
- Example: `1fdcf9a0+143-scratch.md`
- Fields extractable: session_hash, checkpoint_number
- 6 active in `memory/scratches/`, 63 archived in `chronicle/scratches/`

Pattern 2 (Harkly): `session+{N}-scratch.md`
- Example: `session+152-scratch.md`
- Fields extractable: checkpoint_number (session hash absent)
- 15 files in Harkly memory

Pattern 3 (Harkly legacy): `{8-hex-hash}+{N}-scratch.md`
- Example: `f79bd6ea+171-scratch.md` (1 file in Harkly memory)

**Inconsistency:** Harkly scratches use `session+N` while tLOS uses `{hash}+N`. Both patterns are parseable but need two regex patterns. Scratch content is either 2-line placeholder ("Processed / distributed") or structured checkpoint data.

**Category C — Chronicle entries (structured, parseable):**
- `tlos-current.md` — working set (461 lines)
- `tlos-chronicle.md` — full archive (4,163 lines)
- Entry format: `<!-- ENTRY:[date]:CHECKPOINT:[N]:[scope]:[tags] -->`
- Followed by H2 heading, then structured sections: Decisions, Files changed, Completed, In progress, Opened, Notes

This is the most promising candidate for row-level SQLite indexing. Each entry has:
- Date (extractable from comment tag)
- Checkpoint number (extractable)
- Scope (extractable)
- Tags (extractable)
- Decisions (free text, can store as blob)
- Files changed (list, can normalize into separate table)

**Category D — One-off files (heterogeneous):**
- `bug-report-*.md`, `enricher-status.md`, `session-12mar-context.md`
- Research files in Harkly: `cold-outreach-*.md`, `stealth-scraping-techniques.md`
- Harkly epic specs: `harkly-18-*-*.md`
- These have no consistent format across files

### 3. Parsing Edge Cases

| Edge Case | Impact | Handling |
|---|---|---|
| Scratch files with only 2 lines ("Processed") | Low — just mark as processed | Check line count, skip content extraction |
| Chronicle entries with inconsistent tag format | Medium — some entries omit tags | Fallback regex: match `<!-- ENTRY:` prefix, extract what's present |
| Mixed Russian/English content | Low — UTF-8 throughout | Store as-is, FTS5 handles Unicode |
| Markdown frontmatter absent | Low — none of the files use YAML frontmatter | Parser can skip frontmatter detection |
| Files over 1000 lines (chronicle: 4163, auto-scratch: 1010) | Medium — large text blobs | Chunk into entries for chronicle; store auto-scratch as-is |
| Harkly scratch naming inconsistency (`session+N` vs `hash+N`) | Low — two regex patterns needed | Union of patterns in parser |

### 4. SQLite Availability

- **sqlite3 CLI:** NOT available on PATH. `which sqlite3` returns nothing.
- **Bun 1.3.10:** Available. Bun has built-in `bun:sqlite` module (SQLite3 via C bindings, zero dependencies). No package.json needed.
- **better-sqlite3:** Found only in `docs/research/_eval/solid-pages/package.json` (evaluation project, not production).
- **No existing SQLite databases** in the workspace.

**Recommendation:** Use `bun:sqlite` — zero dependencies, built into the runtime already on the system.

### 5. Tools/Scripts That Read Memory Files

**No custom tools exist** that read memory files programmatically. The `tools/` directory contains:
- `token-counter/count.ts` — reads Claude API usage, not memory files
- `agent-monitor/` — monitors agent sessions
- `linkedin-scraper/` — unrelated
- `opcode/` — unrelated
- `vscode-claude-monitor/` — monitors VSCode

The only references to `memory/` in tools are in `oss-reference/` (third-party code, irrelevant).

**Memory files are currently read exclusively by Claude agents** via file reads during session startup (handshake, L1-L3 loading, scratch resumption). No programmatic indexing exists.

### 6. Estimated DB Size After Migration

| Data | Est. Size |
|---|---|
| 196 files metadata (path, category, project, updated_at) | ~20 KB |
| Full text of all 23,218 lines (~80 chars avg) | ~1.8 MB |
| FTS5 index | ~2-3 MB |
| Chronicle entries table (normalized, ~200 entries) | ~100 KB |
| Scratch files table (normalized, ~84 entries) | ~50 KB |
| **Total estimated DB size** | **~5-7 MB** |

### 7. Sync Script Requirements

The sync script would need to:

1. **Watch** — Monitor `nospace/**/memory/*.md` for changes (Bun `fs.watch` or polling)
2. **Parse** — Extract metadata from filename patterns:
   - Project: derive from path (`development/tLOS/` → `tlos`, `development/harkly/` → `harkly`, etc.)
   - Category: derive from filename pattern (scratch, chronicle, context, about, roadmap, phase, etc.)
   - Checkpoint number: extract from scratch filenames
   - Session hash: extract from tLOS scratch filenames
3. **Chronicle splitter** — Parse `tlos-current.md` and `tlos-chronicle.md` into individual entries using `<!-- ENTRY:` delimiters
4. **Upsert** — Full-text content into `memory_content` table; metadata into `memory_files` table
5. **FTS5 index** — For semantic search across all memory content
6. **Incremental** — Only re-index files that changed (compare mtime or content hash)

### 8. Phase 2.1 Readiness Assessment

| Criterion | Status |
|---|---|
| Files exist and are countable | READY |
| File formats are parseable | READY (with 2 regex patterns for scratches) |
| Runtime available (Bun + bun:sqlite) | READY |
| Chronicle format has structured delimiters | READY |
| No existing tools conflict | READY (greenfield) |
| Estimated effort | ~2-3 hours for MVP sync script |

**Verdict: READY for implementation.** The memory file landscape is consistent enough for automated indexing. The main challenge is the dual scratch naming pattern, which is trivial to handle. Chronicle entries have excellent structure for row-level extraction.

---

## Phase 2.2 — Design System Three-Tier Tokens

### 1. Current Token File Inventory

**13 JSON files** in `design/design_system/tokens/`:

| Tier | File | Tokens (est.) | Format |
|---|---|---|---|
| **Base (Tier 1)** | `base/color.tokens.json` | ~35 | W3C DTCG |
| | `base/spacing.tokens.json` | ~30 | W3C DTCG |
| | `base/typography.tokens.json` | ~30+ roles | W3C DTCG |
| | `base/motion.tokens.json` | ~25 | W3C DTCG |
| **Semantic (Tier 2)** | `semantic/color.semantic.tokens.json` | ~33 | W3C DTCG |
| | `semantic/elevation.semantic.tokens.json` | ~25 | W3C DTCG |
| **Component (Tier 3)** | `component/button.tokens.json` | ~60 | W3C DTCG |
| | `component/input.tokens.json` | ~40+ | W3C DTCG |
| | `component/panel.tokens.json` | ~30+ | W3C DTCG |
| | `component/tag.tokens.json` | ~30+ | W3C DTCG |
| | `component/omnibar.tokens.json` | ~62 | W3C DTCG |
| **Theme** | `themes/dark.tokens.json` | ~25 overrides | W3C DTCG |
| | `themes/high-contrast.tokens.json` | ~25 overrides | W3C DTCG |

**Total: ~450+ tokens across 13 files.**

### 2. Token Format Analysis

All token files use the **W3C Design Tokens Community Group (DTCG) format**:
- `$schema`: points to `https://design-tokens.github.io/community-group/format/`
- `$value`: token value
- `$type`: token type (`color`, `dimension`, `fontFamily`, `fontWeight`, `lineHeight`, `cubicBezier`, `duration`, `typography`, `transition`, `number`)
- `$description`: extensive Bauhaus citations (descriptions are very verbose, 50-200 words each)
- Token references use `{group.subgroup.token}` syntax (DTCG alias format)

**Compliance: Fully W3C DTCG compliant.** This is excellent — Style Dictionary 4.x, Tokens Studio, and other standard tools can consume this format directly.

### 3. Current Three-Tier Structure (Already Exists!)

The tLOS design system already implements a three-tier token architecture:

```
Tier 1: base/        — Raw primitives (color.gray.500 = #717171)
Tier 2: semantic/    — Purpose-mapped aliases (state.hover = {color.interactive.hover})
Tier 3: component/   — Component-scoped (button.primary.default.background = {color.primary.blue})
```

Plus a **theme layer** that overrides Tier 1 values:
```
themes/dark.tokens.json    — overrides color.background.canvas → #000000
themes/high-contrast.json  — overrides color.background.canvas → #FFFFFF
```

**The three-tier architecture is already implemented for tLOS.** The question becomes: how do Harkly and Contexter fit into this?

### 4. Harkly Token Status

**No JSON token files exist for Harkly.** Zero `.json` files in `design/harkly/`.

Harkly tokens live in TWO places:

**A. Pencil file** (`harkly-ui.pen`) — 6 token systems defined as Pencil design systems:
- Color (DpHtH), Spacing (jrVLH), Typography (Kf1xa), Motion (zqE0U)
- These are the source of truth for Harkly's visual language

**B. CSS custom properties** (`harkly-shell/src/styles/design-tokens.css`) — 44 lines, hand-written:
- `--h-canvas: #FFF8E7` (Cosmic Latte — warm, NOT tLOS black)
- `--h-surface: #F5EDD8` (warm gray surface — NOT tLOS gray.800)
- `--h-blue: #1E3EA0` (SHARED with tLOS primary.blue)
- `--h-red: #C82020` (SHARED with tLOS primary.red)
- `--h-yellow: #F2C200` (SHARED with tLOS primary.yellow)
- `--h-success: #2D7D46` (Harkly-only — tLOS has NO green)
- `--h-text-1: #1C1C1C` (INVERTED from tLOS: dark text on light ground)

**Key finding: Harkly does NOT reference tLOS tokens. It uses completely different surface/background values** (warm light theme vs dark theme), while sharing the three primary accent colors.

### 5. Contexter Token Status

**No JSON token files exist for Contexter.** Tokens defined only in:
- `design/contexter/guidelines/color.md` — markdown tables
- Pencil file (`contexter-ui.pen`) — not audited

Contexter colors:
- `--black: #0A0A0A` (near-black, NOT tLOS #000000)
- `--white: #FAFAFA` (near-white, NOT tLOS #FFFFFF or Harkly #FFF8E7)
- `--accent: #1E3EA0` (SHARED with tLOS/Harkly primary.blue)
- `--signal-success: #2E7D32` (green, like Harkly but different shade)
- Pure cold grays (NOT warm like Harkly, NOT pure like tLOS)

### 6. Shared vs. Project-Specific Values

| Token Category | tLOS | Harkly | Contexter | Shared? |
|---|---|---|---|---|
| **Accent blue** | #1E3EA0 | #1E3EA0 | #1E3EA0 | YES — all three |
| **Accent red** | #C82020 | #C82020 | #D32F2F (different) | Partial |
| **Accent yellow** | #F2C200 | #F2C200 | #F2C200 | YES — all three |
| **Success green** | NONE (forbidden) | #2D7D46 | #2E7D32 | Harkly+Contexter only, different shades |
| **Canvas bg** | #000000 (black) | #FFF8E7 (warm cream) | #FAFAFA (near-white) | NO — all different |
| **Surface bg** | #1C1C1C | #F5EDD8 | #F2F2F2 | NO — all different |
| **Text primary** | #FFFFFF (white) | #1C1C1C (dark) | #0A0A0A (near-black) | NO — polarity inverted |
| **Spacing scale** | 4px base, 0-80px | Identical scale | Identical scale | YES — all three |
| **Typography scale** | 1.25x, 10-48px | Same scale | Same scale | YES — all three |
| **Font primary** | Inter | Inter | JetBrains Mono only | Partial |
| **Motion tokens** | 6 duration + 6 easing | Similar but different ms | Identical to Harkly | Partial |
| **Border radius** | 0px (strict) | Soft rounded (departure) | 0px (strict) | Partial |

### 7. Three-Tier Inheritance Model

Based on the analysis, the three-tier model should work like this:

```
Layer 0: Bauhaus Core (shared mathematical foundations)
├── Spacing scale: 4px base, 13 steps, semantic aliases
├── Typography scale: 1.25x ratio, 8 steps, 3 weights, 3 line-heights, 11 roles
├── Motion: 6 duration registers, 6 easing curves, 4 delays
├── Elevation structure: 4 levels + overlay
└── Accent primaries: blue #1E3EA0, red #C82020, yellow #F2C200

Layer 1: Project Theme (overrides surface + text polarity)
├── tLOS:       dark canvas, white text, pure grays, NO green, 0px radius
├── Harkly:     warm light canvas, dark text, warm grays, green allowed, rounded corners
└── Contexter:  cold light canvas, dark text, pure cold grays, green allowed, 0px radius

Layer 2: Component Tokens (reference Layer 1 through semantic aliases)
├── tLOS components: button, input, panel, tag, omnibar (already exist as JSON)
├── Harkly components: 17 in Pencil (not yet extracted to JSON)
└── Contexter components: in Pencil (not yet extracted to JSON)
```

### 8. Would Three-Tier Break Existing Code?

**tLOS frontend** (`core/shell/frontend/src/`):
- Imports `design-tokens.css` (CSS custom properties)
- Uses `--tlos-*` prefixed vars and `--color-*` aliases
- Component token migration specs exist (`.token-migration-specs/` directory with per-frame specs)
- Has known gaps: no RGB channel tokens for alpha compositing (`rgba(var(...), 0.15)` impossible)
- **Impact: LOW** — tLOS tokens are already structured, just need JSON → CSS build step

**Harkly frontend** (`harkly-shell/src/`):
- Imports `design-tokens.css` with `--h-*` prefixed vars (44 lines, hand-written)
- No JSON token source — CSS is the source of truth
- **Impact: MEDIUM** — need to create JSON tokens, generate CSS from them, replace hand-written CSS

**Contexter frontend** (`src/`):
- Token references are in markdown guidelines only
- No CSS custom properties file found
- **Impact: LOW** — no existing token code to break

### 9. Build Tooling Analysis

**Current state:** No token build tooling exists. CSS custom properties are hand-written.

**Options for build tool:**

| Tool | DTCG Support | Multi-project | Verdict |
|---|---|---|---|
| **Style Dictionary 4.x** | Native DTCG | Yes (custom file headers, filters) | Best fit — mature, W3C-aligned |
| **Tokens Studio** | DTCG + Figma sync | Yes | Overkill — no Figma in workflow (Pencil used) |
| **Custom Bun script** | DIY | DIY | Viable for simple JSON → CSS transform |

**Recommendation:** Style Dictionary 4.x. It natively reads DTCG format, supports multi-platform output (CSS, TS, JSON), has built-in reference resolution (`{color.primary.blue}` → `#1E3EA0`), and supports project-level theme overrides via `include`/`source` configuration.

### 10. Proposed File Structure for Three-Tier System

```
design/tokens/
├── core/                          # Layer 0: Bauhaus shared
│   ├── spacing.tokens.json        # (move from design_system/tokens/base/)
│   ├── typography.tokens.json
│   ├── motion.tokens.json
│   └── accent.tokens.json         # NEW: shared accent primaries only
│
├── tlos/                          # Layer 1: tLOS theme + semantics + components
│   ├── color.tokens.json          # tLOS-specific gray scale, surfaces, text
│   ├── semantic/
│   │   ├── color.semantic.tokens.json
│   │   └── elevation.semantic.tokens.json
│   ├── component/
│   │   ├── button.tokens.json
│   │   ├── input.tokens.json
│   │   ├── panel.tokens.json
│   │   ├── tag.tokens.json
│   │   └── omnibar.tokens.json
│   └── themes/
│       ├── dark.tokens.json
│       └── high-contrast.tokens.json
│
├── harkly/                        # Layer 1: Harkly theme
│   ├── color.tokens.json          # Warm grays, Cosmic Latte, green signal
│   ├── semantic/                  # Harkly semantic mappings
│   └── component/                 # Extract from Pencil
│
├── contexter/                     # Layer 1: Contexter theme
│   ├── color.tokens.json          # Cold B&W, pure grays
│   └── component/                 # Extract from Pencil
│
└── style-dictionary.config.js     # Build config: core + {project} → output
```

### 11. Phase 2.2 Readiness Assessment

| Criterion | Status |
|---|---|
| tLOS tokens exist in W3C DTCG format | READY (13 files, ~450 tokens) |
| Three-tier structure is already implemented for tLOS | READY |
| Harkly tokens extracted to JSON | NOT READY — still in Pencil + hand-written CSS |
| Contexter tokens extracted to JSON | NOT READY — still in markdown guidelines only |
| Shared values identified | READY (spacing, typography, motion, accent primaries) |
| Project-specific values identified | READY (surface colors, text polarity, border-radius) |
| Build tooling selected | READY (Style Dictionary 4.x recommended) |
| Code import compatibility assessed | READY (low risk for tLOS, medium for Harkly) |

**Verdict: PARTIALLY READY.** The tLOS token system is mature and well-structured. The blockers are:

1. **Harkly JSON extraction** — 17 components in Pencil need JSON token export. The CSS custom properties file (44 lines) provides the starting point but lacks the DTCG structure.
2. **Contexter JSON extraction** — Color tokens in markdown need conversion to DTCG JSON.
3. **Refactoring shared core** — Current tLOS `base/` tokens include both shared values (spacing, typography) and tLOS-specific values (dark color palette). These need to be separated.

**Estimated effort:**
- Separate shared core from tLOS-specific: ~1-2 hours
- Create Harkly DTCG JSON from CSS + Pencil: ~3-4 hours
- Create Contexter DTCG JSON from guidelines: ~1-2 hours
- Style Dictionary config + build pipeline: ~2-3 hours
- **Total: ~8-11 hours for full three-tier system**

---

## Cross-Phase Dependencies

| Dependency | Phase 2.1 (SQLite) | Phase 2.2 (Tokens) |
|---|---|---|
| Bun runtime | Required | Required (Style Dictionary or custom build) |
| File watching | Required for sync | Optional for token build (manual trigger OK) |
| New directory structure | `tools/memory-index/` | `design/tokens/` restructure |
| Breaking changes | None (additive) | Harkly CSS import path may change |

Both phases can proceed **independently and in parallel**. No cross-phase blocking dependencies.
