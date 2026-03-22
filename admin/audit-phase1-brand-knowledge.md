# Audit: Phase 1.5 (Brand & Marketing Co-location) + Phase 1.6 (Knowledge Directory Rename)

> Auditor: Axis (Orchestrator)
> Date: 2026-03-22
> Scope: File inventory, duplication analysis, reference mapping, migration risk assessment
> Source proposal: `admin/restructuring-proposal.md` sections 1.5 and 1.6

---

## Phase 1.5 — Brand & Marketing Co-location

### Current State

Brand content lives in THREE separate locations:

#### Location 1: `development/harkly/brand/` (21 files across 4 subdirs)

| File / Dir | Type | Notes |
|---|---|---|
| `brand-bible.md` (18.5 KB) | Brand strategy | Single source: symbol, mission, values, TOV, audience, speaking style |
| `brand-and-design-overview.md` (3.1 KB) | Index/pointer | Maps all brand docs + Pencil design system |
| `category-manifesto.md` (9.3 KB) | Brand strategy | Customer Signals Research as discipline |
| `positioning.md` (6.6 KB) | Brand strategy | GTM, audience, problem, differentiator |
| `values.md` (6.7 KB) | Brand values | 5 values, vibe dimensions, methodology |
| `omnibar-primacy.md` (1.7 KB) | UI philosophy | Omnibar = primary input |
| `ui-language-ru.md` (1.4 KB) | UI language | Russian-only UI rule |
| `MOVED.md` (369 B) | Redirect | Points to `marketing/` for tov.md, values.md, channels/, agents/ |
| `agents/` (3 Python scripts + specs/) | Code | antenna.py, deep_researcher.py, idea_hub.py |
| `channels/` | Empty | Was migrated to marketing/, now empty |
| `ideas/hub.json` + `ideas/briefs/` | Data | Idea pipeline data |

#### Location 2: `docs/harkly/brand/` (6 files, 175 KB total)

| File | Size | Notes |
|---|---|---|
| `Harkly.md` (16.6 KB) | GTM strategy doc | Older document — superseded by `development/harkly/brand/positioning.md` |
| `enemy.md` (52.3 KB) | Deep OSINT analysis | CX pain points — "Enemy" narrative, unique content |
| `hero.md` (46.2 KB) | Deep OSINT analysis | CX persona psychographic — "Hero" narrative, unique content |
| `framework.md` (11.0 KB) | Brand framework | Kapferer/StoryBrand/Mythology structure |
| `instagram_str1.md` (46.1 KB) | Instagram strategy | B2B Instagram content analysis |
| `HARKLY_BRAND_MYTHOLOGY.md` (2.8 KB) | Brand mythology | Enemy + Worldview + Hero + Resolution summary |

#### Location 3: `marketing/` (root-level, 24 files)

| Path | Content |
|---|---|
| `marketing/INDEX.md` | Domain index (branding, copywriting, campaigns, SEO) |
| `marketing/branding/tov.md` (23.4 KB) | TOV v3 — CANONICAL, 529 lines |
| `marketing/branding/values.md` | **DOES NOT EXIST** — MOVED.md claims it was moved here, but the file is missing |
| `marketing/copywriting/channels/` | audience-portrait.md, audience-speaking-style.md, telegram-content-strategy.md, telegram-persona.md |
| `marketing/copywriting/agents/` | audience_analysis.py, channel_collector.py |
| `marketing/copywriting/research/` | telegram-channel-samples.json, relevant_posts.txt, audience-analysis/ (13 chat analysis files) |

### Gap Analysis

#### GAP-1: values.md is orphaned (CRITICAL)

`MOVED.md` in `development/harkly/brand/` claims values.md was moved to `marketing/branding/values.md`. However:
- `marketing/branding/values.md` **does not exist** (confirmed by ls)
- `development/harkly/brand/values.md` **still exists** (6.7 KB)
- `brand-and-design-overview.md` (auto-memory pointer) references `marketing/branding/values.md` as CANONICAL
- Multiple memory files reference both paths

**Diagnosis:** The move was declared in MOVED.md but the destination file was either never copied or was deleted. The source copy still exists. The MOVED.md redirect is lying.

#### GAP-2: tov.md exists in TWO locations (versions differ)

- `marketing/branding/tov.md` — 529 lines, v3, header says "CANONICAL"
- `development/harkly/brand/tov.md` — **DOES NOT EXIST** (confirmed by ls)
- MOVED.md correctly points to marketing/ for tov.md

**Diagnosis:** tov.md was successfully migrated to marketing/. This one is clean.

#### GAP-3: docs/harkly/brand/ has UNIQUE content not present elsewhere

All 6 files in `docs/harkly/brand/` are unique — none of them exist in `development/harkly/brand/` or `marketing/`. These are:
- Deep OSINT research documents (enemy.md = 52 KB, hero.md = 46 KB) — substantial analytical work
- Brand framework synthesis (framework.md, HARKLY_BRAND_MYTHOLOGY.md)
- Older GTM doc (Harkly.md — superseded but contains original thinking)
- Instagram strategy (instagram_str1.md — also exists in `development/harkly/branches/feat-instagram-scraper/`)

These are NOT duplicates. They are unique research artifacts that fed INTO the current brand docs.

#### GAP-4: marketing/ is Harkly-only but named generically

`marketing/` sits at workspace root suggesting cross-project scope. All content is Harkly-specific (branding, copywriting, audience research). No tLOS or Contexter marketing content exists anywhere.

#### GAP-5: MOVED.md is incomplete

MOVED.md lists 4 items moved: tov.md, values.md, channels/, agents/. But:
- values.md destination is missing
- agents/ still has Python scripts in `development/harkly/brand/agents/` (not moved — antenna.py, deep_researcher.py, idea_hub.py are there)
- channels/ in `development/harkly/brand/` is empty (this one was actually moved)

### Reference Map (files that would break on path change)

#### References to `development/harkly/brand/` (30+ locations)

| File | Type of Reference |
|---|---|
| `development/harkly/memory/harkly-about.md` | 11 path references (L1 file, loaded every session) |
| `development/harkly/memory/harkly-marketing-content.md` | 12 path references |
| `development/harkly/memory/harkly-mvp-session-context.md` | 3 path references |
| `development/harkly/memory/harkly-roadmap.md` | 1 path reference |
| `development/harkly/memory/harkly-design-ui.md` | 2 path references |
| `development/harkly/memory/chronicle/harkly-current.md` | 5 path references |
| `development/harkly/brand/brand-and-design-overview.md` | 5 self-references |
| `development/harkly/brand/agents/specs/` | 7 path references in spec files |
| `development/tLOS/memory/chronicle/tlos-current.md` | 8 path references (historical log) |
| `development/tLOS/memory/auto-scratch.md` | 7 path references |
| `design/harkly/README.md` | 3 path references |
| `docs/research/design-system-organization-research.md` | 9 path references |
| `~/.claude/projects/.../MEMORY.md` (auto-memory) | 2 path references |
| Multiple chronicle/scratch files | ~20 historical references |

#### References to `docs/harkly/brand/` (4 locations)

| File | Type of Reference |
|---|---|
| `development/harkly/brand/positioning.md` | Line 4: "Replaces: docs/harkly/brand/Harkly.md" |
| `docs/research/design-system-organization-research.md` | 5 references (duplication analysis) |
| `admin/restructuring-proposal.md` | 2 references |
| `admin/nospace-index.md` | 1 reference |

#### References to `marketing/` (40+ locations)

Most references are in chronicle/scratch files (historical). Active references:
- `development/harkly/memory/harkly-marketing-content.md` — 14 references
- `development/harkly/memory/harkly-about.md` — 1 reference
- `development/harkly/brand/MOVED.md` — 4 references
- `development/harkly/brand/brand-and-design-overview.md` — 1 reference
- `marketing/INDEX.md` — self-referencing
- `marketing/copywriting/channels/telegram-content-strategy.md` — 3 self-references
- `docs/research/f1-audience-sources-mining.md` — 1 reference
- `admin/` files — 3 references

### Risk if Changed

| Action | Risk | Impact |
|---|---|---|
| Move `docs/harkly/brand/` to `development/harkly/brand/` | LOW — only 4 referencing locations, none critical | 4 files to update |
| Move `marketing/` to `development/harkly/marketing/` | MEDIUM — 14 active references in harkly-marketing-content.md + INDEX.md self-refs | ~20 files to update |
| Rename paths in chronicles | NONE needed — chronicles are historical logs, old paths are correct for when they were written |

### Migration Steps (Recommended)

**Step 0 — Fix GAP-1 immediately (values.md orphan)**
1. Verify `development/harkly/brand/values.md` is the most recent version
2. Copy to `marketing/branding/values.md`
3. This fixes the dangling pointer without changing any architecture

**Step 1 — Consolidate docs/harkly/brand/ into development/harkly/brand/research/**
1. Create `development/harkly/brand/research/`
2. Move all 6 files from `docs/harkly/brand/` into it (enemy.md, hero.md, framework.md, Harkly.md, instagram_str1.md, HARKLY_BRAND_MYTHOLOGY.md)
3. Replace `docs/harkly/brand/` with a single `docs/harkly/brand/README.md`: "Moved to development/harkly/brand/research/"
4. Update the 4 referencing files

**Step 2 — Move marketing/ under development/harkly/marketing/**
1. Move `marketing/` to `development/harkly/marketing/`
2. Place a redirect at `marketing/README.md`: "Moved to development/harkly/marketing/"
3. Update `MOVED.md` in `development/harkly/brand/`
4. Update `harkly-marketing-content.md` (14 references)
5. Update `harkly-about.md` (1 reference)
6. Update `brand-and-design-overview.md` (1 reference)
7. Update `telegram-content-strategy.md` self-references (3 refs)
8. Update `marketing/INDEX.md` internal refs

**Step 3 — Clean up MOVED.md**
After step 2, rewrite MOVED.md to reflect actual current state (or remove it entirely since everything will be co-located).

---

## Phase 1.6 — Knowledge Directory Rename

### Current State

#### `knowledge/` structure

```
knowledge/                           2.8 GB total
  bauhaus-books/                     2.5 GB
    *.pdf (14 files)                 1.16 GB — Bauhaus school PDFs (1925-1930)
    enriched_figures/ (6 book dirs)  ~1.3 GB — extracted figure PNGs (456 images)
    catalog.md                       Collection index
    download.sh                      Download script
    08_mfp_output.txt                Text extraction output
    11_malevich_text.txt             Text extraction output
  persona-corpus/                    327 MB
    manifest.json                    21 items, 7 personas (Klee, Moholy, Kandinsky, Gropius, Malevich, Schlemmer, Jobs)
    download_corpus.py               Downloader script
    state.json                       Download state tracker
    run.sh                           Bash wrapper
    gropius/                         PDFs
    kandinsky/                       PDFs
    klee/                            PDFs
    malevich/                        PDFs
    moholy/                          PDFs
    schlemmer/                       PDFs
    jobs/                            identity_kg.json + character_card.md
```

**File type breakdown:** 46 PDFs, 456 PNGs, 2 MDs, 5 TXTs, 3 JSONs

#### `private_knowledge/` structure

```
private_knowledge/
  context/
    longterm/    — .gitignored (age-encrypted secrets)
    current/     — .gitignored (temp MCP tokens, active sessions)
  policies/
    approval-matrix.yaml  — tracked in git
```

#### Content classification

| Directory | Content Type | Semantic Category |
|---|---|---|
| `knowledge/bauhaus-books/` | Original Bauhaus school PDFs + extracted figures | **Source corpus** — raw reference material for RAG |
| `knowledge/persona-corpus/` | Persona primary sources (books, interviews, diaries) | **Source corpus** — persona training material |
| `private_knowledge/context/` | API keys, session tokens, credentials | **Secrets vault** — access-controlled |
| `private_knowledge/policies/` | Approval matrix for secret access | **Security policy** — access rules |

### Reference Map

#### References to `knowledge/` (path as directory, not just the word)

**Code references (WOULD BREAK on rename):**

| File | Reference | Type |
|---|---|---|
| `development/tLOS/core/kernel/tlos-langgraph-bridge/bauhaus_enricher.py` | `BOOKS_DIR = Path("C:/Users/noadmin/nospace/knowledge/bauhaus-books")` | Hardcoded absolute path |
| `development/tLOS/core/kernel/tlos-langgraph-bridge/upsert_klee_figures.py` | `PNG_P10 = "C:/Users/noadmin/nospace/knowledge/bauhaus-books/enriched_figures/..."` | Hardcoded absolute path |
| `development/tLOS/core/kernel/tlos-langgraph-bridge/persona_enricher.py` | `PERSONA_CORPUS_DIR = Path("C:/Users/noadmin/nospace/knowledge/persona-corpus")` | Hardcoded absolute path |
| `development/tLOS/core/kernel/archive/bauhaus_enricher.py` | `BOOKS_DIR = Path("C:/Users/noadmin/nospace/knowledge/bauhaus-books")` | Archived copy, same path |
| `knowledge/persona-corpus/manifest.json` | `"target_dir": "C:/Users/noadmin/nospace/knowledge/persona-corpus"` | Self-referencing config |

**Documentation references (update needed but not breaking):**

| File | Count | Notes |
|---|---|---|
| `admin/nospace-index.md` | 4 | Directory documentation |
| `admin/structure-audit.md` | 3 | Audit report |
| `admin/restructuring-proposal.md` | 2 | This proposal itself |
| `development/tLOS/memory/tlos-about.md` | 1 | L1 context |
| `development/tLOS/memory/tlos-roadmap.md` | 1 | Roadmap |
| `development/tLOS/memory/tlos-phase14.md` | 5 | Phase spec |
| `development/tLOS/memory/tlos-phase_bauhaus_code_enrich.md` | 1 | Enrichment spec |
| `development/tLOS/memory/current-context-tLOS.md` | 1 | Current context |
| `development/tLOS/memory/chronicle-tLOS.md` | 3 | Historical chronicle |
| `development/tLOS/memory/chronicle/tlos-current.md` | 2 | Current chronicle |
| `development/tLOS/memory/chronicle/tlos-chronicle.md` | 15 | Full chronicle history |
| `development/tLOS/memory/l4-archive.md` | 1 | Archive |
| `docs/tLOS/design/ROADMAP.md` | 1 | Design roadmap |
| `docs/tLOS/design/bauhaus-code/INDEX.md` | 1 | Bauhaus code index |
| `docs/tLOS/design/bauhaus-code/archive/EXTRACTION-PLAN.md` | 2 | Extraction spec |
| `docs/research/design-system-organization-research.md` | 12 | Research report |
| `docs/research/workspace-organization-research.md` | 7 | Research report |
| Multiple chronicle/scratch files | ~15 | Historical logs |

#### References to `private_knowledge/` (33 locations)

| Category | Files | Count |
|---|---|---|
| RBAC / Security regulations | 6 files in `rules/regulations/` | 12 references |
| Position descriptions | 6 files in `rules/position-descriptions/` | 7 references |
| Agent identities | 3 files in `agents/` | 3 references |
| Security audit docs | 2 files in `docs/ecosystem-noadmin/` | 2 references |
| Code | `tools/auth-gates/approval-router.ts` | 2 references (path in code) |
| Self-references | `private_knowledge/policies/approval-matrix.yaml` | 1 reference |
| Memory files | 2 files | 2 references |
| Research docs | 1 file | 4 references |

### Analysis: Is This Actually a "Corpus"?

| Criterion | knowledge/ | private_knowledge/ |
|---|---|---|
| Content type | PDFs, PNGs, TXTs — original source material | Credentials, tokens, policies |
| Purpose | RAG input, agent training, design extraction | Secret management, access control |
| Access pattern | Read-only by enrichment pipelines | Read+dispense by assistant role only |
| Mutability | Mostly immutable (downloaded once, figures extracted once) | Mutable (tokens rotate, sessions change) |
| Semantic name fit | "Knowledge" is wrong — these are SOURCE MATERIALS, not derived knowledge | "Private knowledge" is imprecise — these are SECRETS |

**Verdict:** `knowledge/` is unambiguously a **corpus** (collection of source texts/images used as input to RAG/enrichment pipelines). It is NOT "knowledge" in the knowledge-base or knowledge-graph sense. Renaming to `corpus/` is semantically correct.

`private_knowledge/` is a **secrets vault** with an attached policy file. Renaming to `vault/` or `secrets/` would be more precise, but the current name works because `private_` prefix clearly distinguishes it from `knowledge/`. If `knowledge/` becomes `corpus/`, the confusion disappears entirely and `private_knowledge/` can stay as-is.

### Git/LFS Status

- **Git LFS is NOT configured** — no files tracked via LFS
- **PDFs are committed directly to git** — 46 PDFs totaling ~1.46 GB in the repository
- **PNGs are committed directly** — 456 enriched figure images
- **.gitignore does NOT exclude knowledge/** — all files are tracked
- **.gitignore DOES exclude** `private_knowledge/context/longterm/` and `private_knowledge/context/current/`

**Implication:** Renaming `knowledge/` to `corpus/` requires `git mv`, which will properly track the rename. However, the 2.8 GB of binary content in git history is a separate problem (not in scope for this phase but worth noting).

### Risk if Changed

| Action | Risk | Impact |
|---|---|---|
| `git mv knowledge/ corpus/` | MEDIUM — 5 hardcoded paths in Python break | 5 code files to fix |
| Update documentation references | LOW — ~70 references but most are historical logs | ~15 active docs to update |
| Rename `private_knowledge/` | HIGH — 33 references across security regulations, RBAC, code | NOT RECOMMENDED right now |

### Migration Steps (Recommended)

**Step 1 — Rename directory**
```bash
cd nospace
git mv knowledge/ corpus/
```

**Step 2 — Fix hardcoded paths in code (5 files, CRITICAL)**
1. `development/tLOS/core/kernel/tlos-langgraph-bridge/bauhaus_enricher.py` — update BOOKS_DIR
2. `development/tLOS/core/kernel/tlos-langgraph-bridge/upsert_klee_figures.py` — update PNG paths
3. `development/tLOS/core/kernel/tlos-langgraph-bridge/persona_enricher.py` — update PERSONA_CORPUS_DIR and BAUHAUS_BOOKS_DIR
4. `development/tLOS/core/kernel/archive/bauhaus_enricher.py` — update BOOKS_DIR (archived copy)
5. `corpus/persona-corpus/manifest.json` — update target_dir

**Step 3 — Update active documentation (15 files)**
Priority order (most-read first):
1. `development/tLOS/memory/tlos-about.md`
2. `development/tLOS/memory/current-context-tLOS.md`
3. `development/tLOS/memory/tlos-roadmap.md`
4. `development/tLOS/memory/tlos-phase14.md`
5. `admin/nospace-index.md`
6. `admin/structure-audit.md`
7. `admin/restructuring-proposal.md`
8. `docs/tLOS/design/ROADMAP.md`
9. `docs/tLOS/design/bauhaus-code/INDEX.md`
10. `docs/tLOS/design/bauhaus-code/archive/EXTRACTION-PLAN.md`
11. `docs/research/design-system-organization-research.md`
12. `docs/research/workspace-organization-research.md`
13. `development/tLOS/memory/tlos-phase_bauhaus_code_enrich.md`
14. `development/tLOS/memory/tlos-phase10.md`
15. `~/.claude/projects/.../MEMORY.md` (auto-memory references)

**Step 4 — DO NOT update chronicles/scratches**
Chronicle files are historical logs. Old paths were correct at the time of writing. Updating them would falsify history.

**Step 5 — DO NOT rename private_knowledge/**
The naming collision resolves once `knowledge/` becomes `corpus/`. Renaming `private_knowledge/` would require updating 33 references across security-critical files (RBAC regulations, position descriptions, agent identities, code). The risk-to-benefit ratio is unfavorable.

---

## Summary of Findings

### Phase 1.5 — Brand & Marketing

| Finding | Severity |
|---|---|
| `marketing/branding/values.md` is MISSING despite MOVED.md claiming it was moved there | CRITICAL — dangling pointer |
| `docs/harkly/brand/` contains 6 unique files (175 KB of OSINT research) not duplicated anywhere | IMPORTANT — not true duplicates |
| `development/harkly/brand/agents/` was NOT moved to marketing/ despite MOVED.md claim | MEDIUM — MOVED.md is inaccurate |
| `marketing/` is Harkly-only content at workspace root | LOW — naming mismatch |
| 30+ active references to `development/harkly/brand/` across memory/design files | INFO — bulk update needed on any move |

### Phase 1.6 — Knowledge Rename

| Finding | Severity |
|---|---|
| `knowledge/` is 2.8 GB, all committed directly to git (no LFS) | INFO — separate concern |
| Content is source corpus (PDFs + PNGs), NOT derived knowledge | CONFIRMED — rename to `corpus/` is correct |
| 5 Python files have hardcoded absolute paths that WILL BREAK | CRITICAL — must fix on rename |
| 33 references to `private_knowledge/` in security-critical files | INFO — DO NOT rename, confusion resolves when `knowledge/` changes |
| ~70 total references to `knowledge/` path, ~15 in active docs | MEDIUM — manageable update scope |
