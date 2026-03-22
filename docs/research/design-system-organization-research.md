# Design System, Brand & Content Organization in a Developer Monorepo
> Research conducted: 2026-03-22
> Scope: 6 topics — design system org, token inheritance, brand assets in repos, docs organization, knowledge base management, marketing content in repos
> Context: nospace workspace with 3 design systems (tLOS Bauhaus, Harkly, Contexter), duplication in brand docs, Bauhaus PDF knowledge base

---

## Table of Contents

1. [Design System Organization in Monorepos](#1-design-system-organization-in-monorepos)
2. [Design System Inheritance — Base + Brand Fork Patterns](#2-design-system-inheritance--base--brand-fork-patterns)
3. [Brand Assets in Repositories](#3-brand-assets-in-repositories)
4. [Documentation Organization — Diataxis at Scale](#4-documentation-organization--diataxis-at-scale)
5. [Knowledge Base Management — PDFs, Corpus, RAG](#5-knowledge-base-management--pdfs-corpus-rag)
6. [Marketing Content in Engineering Repos](#6-marketing-content-in-engineering-repos)
7. [Synthesis — Recommendation for nospace](#7-synthesis--recommendation-for-nospace)

---

## 1. Design System Organization in Monorepos

### How industry-standard design systems structure their repos

#### Shopify Polaris

Source: https://github.com/shopify/polaris (accessed 2026-03-22)

Top-level structure (prior to January 2026 migration to Web Components):

```
polaris/
├── documentation/          # monorepo working guidelines
├── polaris-for-vscode/     # VS Code extension
├── polaris-icons/          # icon assets
├── polaris-react/          # React component library (@shopify/polaris)
├── polaris-tokens/         # design tokens
├── polaris.shopify.com/    # documentation website
└── stylelint-polaris/      # linting rules
```

Key insight: Each layer of the system is a separate package. Tokens are not embedded inside components — they live in `polaris-tokens/` and are consumed by `polaris-react/`. Documentation is a separate website package that imports from components. The 2025 migration moved from React to Web Components but retained this package separation pattern.

Source: https://www.shopify.com/partners/blog/polaris-unified-and-for-the-web (2025)

**Applicability:** Polaris separates tokens → components → docs as three distinct packages. This pattern scales because each layer can be versioned and consumed independently. For nospace, tLOS Bauhaus tokens could be a standalone package that Harkly and Contexter import from.

---

#### GitHub Primer

Source: https://github.com/primer/primitives (accessed 2026-03-22)
Source: https://github.com/primer/design (accessed 2026-03-22)

Primer splits across three repositories:
- `primer/primitives` — design tokens (colors, spacing, typography)
- `primer/design` — design guidelines documentation
- `primer/contribute` — contribution guidelines

Token directory layout in `primer/primitives`:

```
src/tokens/
├── base/
│   ├── color/
│   ├── size/
│   ├── typography/
│   └── motion/
└── functional/
    ├── color/
    │   ├── light/
    │   │   └── overrides/    # high-contrast, colorblind, tritanopia
    │   └── dark/
    │       └── overrides/
    ├── size/
    └── typography/
```

Key insight: Primer uses a **base/functional split** — base tokens are literal raw values, functional tokens map to semantic usage. Overrides for accessibility are a subdirectory of each theme, not a separate tree. Tokens stored as JSON5, compiled via Style Dictionary.

**Applicability:** The base/functional split maps directly to a Bauhaus base → project-specific semantic layer architecture. The `overrides/` subdirectory pattern is useful for Harkly dark mode or tLOS theme variants.

---

#### IBM Carbon

Source: https://github.com/carbon-design-system/carbon (accessed 2026-03-22)
Source: https://medium.com/carbondesign/carbon-is-moving-to-a-monorepo (2020, still canonical)

Top-level structure:

```
carbon/
├── .github/
├── config/
├── docs/                   # migration guides
├── e2e/                    # end-to-end tests
├── examples/               # implementation samples
├── packages/               # ALL distributable modules
│   ├── @carbon/react
│   ├── @carbon/web-components
│   ├── @carbon/styles
│   ├── @carbon/elements     # design language
│   ├── @carbon/colors
│   ├── @carbon/themes       # color tokens
│   ├── @carbon/type         # typography tokens
│   ├── @carbon/layout
│   ├── @carbon/motion
│   ├── @carbon/icons
│   └── @carbon/pictograms
├── tasks/
└── www/                    # documentation website
```

Key insight: Carbon separates concerns at the package level with `@carbon/themes` (color tokens) and `@carbon/type` (typography tokens) as separate packages from `@carbon/elements` (the design language as a whole). The `www/` directory is the doc site, co-located but separately deployable.

**Applicability:** Carbon's `@carbon/themes` pattern is directly relevant — a separate tokens package consumed by both the core design system and product-specific implementations.

---

#### Atlassian Design System (ADS)

Source: https://github.com/pioug/atlassian-frontend-mirror (mirror of Bitbucket repo, accessed 2026-03-22)
Source: https://atlassian.design/ (accessed 2026-03-22)

ADS lives in a large internal Bitbucket monorepo. The `design-system/` folder contains all ADS packages published as `@atlaskit/*` npm packages. Design decisions are expressed through tokens as single sources of truth, covering color, space, typography, and layout subsystems.

Key insight: ADS is an example of a design system embedded inside a larger product monorepo (Atlassian Frontend), not an isolated design system repo. The design system is a `/design-system` folder within the broader engineering workspace.

**Applicability:** This is the pattern closest to nospace — a design system living inside a workspace that also contains product code.

---

### Summary Pattern — Industry Standard

All major design systems converge on this structure:

```
tokens/                     # or polaris-tokens/ or @carbon/themes/
  base/                     # raw literal values
  semantic/                 # named by usage, not value
  [brand-or-theme]/         # overrides per brand/theme
components/                 # or packages/react/
  [component-name]/
    index.ts
    styles.ts
    [component-name].stories.ts
docs/                       # or www/
  foundations/
  components/
  guidelines/
  contributing/
```

The consistent pattern: tokens are isolated and composable, components consume tokens, docs are a separate deployable surface. No team embeds raw color values in component code.

---

## 2. Design System Inheritance — Base + Brand Fork Patterns

### W3C Design Tokens Specification (stable, 2025)

Source: https://designzig.com/design-tokens-specification-reaches-first-stable-version-with-w3c-community-group/ (accessed 2026-03-22)
Source: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/ (2025-10-28)

The W3C Community Group released the first stable Design Tokens Specification in October 2025. Key mechanisms for inheritance:

- `$extends` property for token group inheritance
- Curly brace syntax `{token.name}` for aliases and references
- JSON Pointer notation for sophisticated cross-file references
- Multi-brand support via collection inheritance

This is the standard all major tools (Style Dictionary, Figma tokens, Tokens Studio) now implement against.

---

### Three-Tier Token Architecture (Industry Consensus)

Source: https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/ (accessed 2026-03-22)
Source: https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9 (accessed 2026-03-22)

The established pattern for multi-brand design systems uses three tiers:

**Tier 1 — Global (raw values):**
```
color-blue-500: #3b82f6
spacing-4: 16px
font-family-sans: "Inter"
```

**Tier 2 — Semantic (named by role):**
```
color-action-primary: {color-blue-500}
space-component-padding: {spacing-4}
```

**Tier 3 — Component-specific:**
```
button-primary-background: {color-action-primary}
button-padding: {space-component-padding}
```

Token flow: `raw value → semantic role → component use`
Brand swapping: only Tier 1 changes. Tier 2 and Tier 3 are universal.

---

### Multi-Brand File Structure (Style Dictionary Pattern)

Source: https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9 (accessed 2026-03-22)
Source: https://clearleft.com/thinking/designing-with-tokens-for-a-flexible-multi-brand-design-system (accessed 2026-03-22)

Recommended directory layout for base + brand override:

```
tokens/
├── base/                       # Tier 1 — brand-specific literal values
│   ├── bauhaus/                # tLOS base brand
│   │   ├── colors.tokens.json
│   │   ├── typography.tokens.json
│   │   └── spacing.tokens.json
│   ├── harkly/                 # Harkly brand overrides
│   │   ├── colors.tokens.json
│   │   └── typography.tokens.json
│   └── contexter/              # Contexter brand overrides
│       └── colors.tokens.json
├── semantic/                   # Tier 2 — shared, brand-agnostic
│   ├── colors.tokens.json
│   ├── typography.tokens.json
│   └── spacing.tokens.json
└── components/                 # Tier 3 — component-specific
    ├── button.tokens.json
    └── input.tokens.json
```

Build process: Style Dictionary resolves per brand. Output: `dist/bauhaus/`, `dist/harkly/`, `dist/contexter/`. Each brand gets its own CSS custom properties file; semantic and component tokens reference base by alias.

---

### Figma Extended Collections (2025)

Source: https://medium.com/design-bootcamp/preparing-for-the-design-tokens-era-multi-brand-systems-and-figmas-extended-collections-9fd35ccd06df (accessed 2026-03-22)

Figma launched Extended Collections in November 2025 for Enterprise plans. Mechanism: child collections inherit a base collection and allow selective overrides. This mirrors the token file structure — one base collection (Bauhaus), one extended collection per brand (Harkly, Contexter).

**Applicability to nospace:** The nospace workspace uses Pencil (not Figma), but the concept maps: Bauhaus is the base, Harkly and Contexter are extended collections with selective overrides.

---

### Brad Frost — Composition Patterns

Source: https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/ (accessed 2026-03-22)

Four composition models applicable to nospace:

| Pattern | Structure | When to use |
|---|---|---|
| Multiple brands | `core + brand-theme-n` | Distinct product brands sharing infrastructure |
| Sub-brands | `core + brand + sub-brand` | Parent brand with variants |
| White-label | `core + brand + white-label` | Customer-configurable products |
| Campaign | `core + brand + campaign` | Time-limited design variants |

For nospace: tLOS Bauhaus = `core`, Harkly = `brand-theme`, Contexter = `brand-theme`. The inheritance is `bauhaus → [harkly | contexter]`, not three independent systems.

---

### Amy Hupe — Multi-Brand Documentation Structure

Source: https://amyhupe.co.uk/articles/structuring-documentation-multi-brand-design-systems/ (accessed 2026-03-22)

Four structural approaches for multi-brand design system docs:

1. **Separate sites per brand** — high maintenance overhead unless using structured content
2. **Homepage brand selection** — shared homepage, branching into brand-specific sections
3. **Brand-specific subsections** — components split by brand, patterns shared
4. **In-page tabs** — tabbed navigation, most granular, shows universal + brand-specific side by side

The recommendation: publish as much guidance as possible to a common destination, only split by brand where genuinely needed. Universal content: UX writing principles, accessibility standards, component behavior. Brand-specific: voice/tone, visual styling, context-specific patterns.

**Applicability:** For nospace docs, the in-page tabs / subsections pattern means `design/bauhaus/` contains universal foundation docs, `design/harkly/` contains only the delta.

---

## 3. Brand Assets in Repositories

### Where do brand guidelines, TOV docs, and positioning docs belong?

Source: https://www.huckfinchbranding.com/blog/design-systems-vs-brand-guidelines-what-you-need-to-know (accessed 2026-03-22)
Source: https://www.mediavalet.com/blog/brand-guidelines (2024, accessed 2026-03-22)

The industry consensus distinguishes two artifacts:

**Brand Guidelines** (what the brand IS — identity, values, TOV, positioning):
- Audience: marketers, copywriters, designers, external agencies
- Storage: typically a brand management platform (Frontify, Corebook, Zeroheight) for external access, but increasingly in-repo as Markdown for AI-first and developer-accessible contexts
- These documents are relatively stable (months to years between changes)

**Design System** (how the brand IS EXPRESSED in product — tokens, components, patterns):
- Audience: designers and engineers building the product
- Storage: always in the repo
- These change frequently with product development

The key distinction: brand guidelines inform the design system. The design system operationalizes the brand in code.

Source: https://designsystems.surf/guides/single-source-of-truth (accessed 2026-03-22)

---

### WordPress Openverse — Brand in Monorepo

Source: https://github.com/WordPress/openverse (accessed 2026-03-22)

The Openverse monorepo (WordPress product) includes a `Brand/` directory containing logos, icons, and usage guidelines alongside all product code. This is the pattern for developer-centric brand management.

---

### The Duplication Problem

Source: https://help.zeroheight.com/hc/en-us/articles/36435175273499-How-to-display-multiple-brands-themes-guidelines-and-more-on-zeroheight (accessed 2026-03-22)

When brand docs exist in multiple locations (e.g., both `development/harkly/brand/` and `docs/harkly/brand/`), teams face:
- Drift: different files get updated independently
- Confusion: unclear which is authoritative
- Wasted effort: same content maintained twice

The solution: designate one location as the canonical source, all others as pointers/symlinks/redirects. The canonical location should be where the primary consumers work.

---

### Recommendation Pattern — Brand Asset Location

Based on cross-industry evidence, the recommended hierarchy is:

```
[project]/
├── brand/                  # CANONICAL location
│   ├── brand-overview.md   # single source of truth
│   ├── tov.md
│   ├── positioning.md
│   ├── values.md
│   └── assets/
│       ├── logo/
│       └── colors.json     # synced from tokens
```

If brand docs need to be in `docs/` for a documentation site, the docs version should be auto-generated or explicitly referenced from `brand/` — never independently maintained.

**Applicability to nospace:** The current duplication between `development/harkly/brand/` and `docs/harkly/brand/` is a known anti-pattern. One of these should be eliminated. The `development/harkly/brand/` location is closer to where Harkly code is developed, making it the natural canonical location. The `docs/` copy should become a pointer or be removed.

---

## 4. Documentation Organization — Diataxis at Scale

### The Diataxis Framework

Source: https://diataxis.fr/ (accessed 2026-03-22)
Source: https://idratherbewriting.com/blog/what-is-diataxis-documentation-framework (accessed 2026-03-22)

Diataxis defines four documentation quadrants based on user need:

| Type | User need | Action | Answer to |
|---|---|---|---|
| **Tutorial** | Learning | Studying | "Help me learn" |
| **How-to Guide** | Task | Doing | "Help me do this" |
| **Reference** | Information | Consulting | "Tell me about X" |
| **Explanation** | Understanding | Reading | "Why does this work?" |

Adopted by: Python, Django, Cloudflare Developer Docs, Ubuntu Core, Gatsby.

---

### Diataxis Applied to Monorepo Docs

Source: https://ekline.io/blog/a-technical-guide-to-the-diataxis-framework-for-modern-documentation (accessed 2026-03-22)
Source: https://emmanuelbernard.com/blog/2024/12/19/diataxis/ (2024-12-19, accessed 2026-03-22)

Applied to a multi-project workspace, Diataxis maps to:

```
docs/
├── tutorials/              # Getting started paths per project
│   ├── tlos/
│   └── harkly/
├── how-to/                 # Task-specific guides
│   ├── tlos/
│   └── harkly/
├── reference/              # Authoritative specs
│   ├── tlos/
│   ├── harkly/
│   └── shared/             # Cross-project: NATS schema, API contracts
├── explanation/            # Rationale, ADRs, architecture
│   ├── adr/
│   └── research/           # Research documents like this one
```

---

### Docs-as-Code — Key Implementation Pattern

Source: https://medium.com/@harryalexdunn/documentation-as-code-how-to-build-deploy-a-centralised-documentation-site-using-mkdocs-gitlab-2dc86e071bd0 (accessed 2026-03-22)
Source: https://www.braingu.com/news/docs-as-code (accessed 2026-03-22)

Docs-as-code treats documentation like source code:
- Stored in Git
- Written in Markdown (or similar)
- Reviewed in pull requests
- Built and deployed via CI/CD (MkDocs, Docusaurus, Mintlify)
- Changes to code trigger documentation updates

The pattern used by Kasava (accessed 2026-03-22, https://www.kasava.dev/blog/everything-as-code-monorepo):

```
docs/                       # public documentation (Mintlify)
docs-internal/              # architecture docs, specs, research
```

Splitting public-facing and internal documentation is a common pattern. Research documents (like `research/`) belong in internal docs, not the public site.

---

### Cross-Project vs Project-Specific Docs — Decision Framework

Based on aggregate research:

| Content type | Location | Rationale |
|---|---|---|
| API reference | `[project]/docs/` | Consumers are project-specific |
| ADRs | `docs/adr/` | Architecture decisions are workspace-level |
| Research | `docs/research/` | Cross-project, supports all decisions |
| Getting started | `[project]/docs/` | Project-scoped audience |
| Shared patterns | `docs/patterns/` | Reused across projects |
| Brand guidelines | `[project]/brand/` | Project-scoped, different per brand |

The key principle: **put docs where the primary audience works**. If a doc is about one project, it lives with that project. If it supports decisions across all projects, it lives at the workspace root.

---

## 5. Knowledge Base Management — PDFs, Corpus, RAG

### Git LFS for Large Files

Source: https://git-lfs.com/ (accessed 2026-03-22)
Source: https://wellarchitected.github.com/library/architecture/recommendations/scaling-git-repositories/when-to-use-git-lfs/ (accessed 2026-03-22)

Git LFS replaces large files with small text pointers in the Git history. Actual file contents are stored in a separate LFS store (GitHub/GitLab hosted or custom).

Use Git LFS when:
- Files exceed 50MB
- Binary files change infrequently (PDFs, images, datasets)
- You need version history on the binary file itself

Avoid Git LFS when:
- Files rarely change (better: external storage with a pointer in repo)
- Your team is non-technical (LFS is CLI-driven)
- You need fast clone times (LFS still downloads tracked files by default)

Configuration: `.gitattributes` file declares tracked extensions:
```
*.pdf filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
```

---

### Alternatives for Static Knowledge Base PDFs

Source: https://dbushell.com/2024/07/15/replace-github-lfs-with-cloudflare-r2-proxy/ (2024-07-15, accessed 2026-03-22)
Source: https://lakefs.io/blog/dvc-vs-git-vs-dolt-vs-lakefs/ (accessed 2026-03-22)

For a corpus of PDFs that are essentially static (Bauhaus books rarely change), alternatives are better than LFS:

| Approach | Storage | Best when |
|---|---|---|
| Git LFS + GitHub | GitHub LFS store | Files change, need version history |
| Cloudflare R2 + pointer | Object storage | Files static, just need reference |
| DVC (Data Version Control) | S3/GCS/local NAS | ML/research pipelines, frequent dataset changes |
| Separate repository | GitHub | Large corpus, want clean separation from code |
| gitignore + external mount | Filesystem | Local-only, not collaborative |

For nospace's Bauhaus PDFs (1.16 GB, static reference material): a separate repository or R2 object storage with a `knowledge/README.md` pointer file is cleaner than LFS. LFS adds friction without benefit when files never change.

---

### RAG Corpus Organization Patterns

Source: https://unstructured.io/insights/rag-systems-best-practices-unstructured-data-pipeline (accessed 2026-03-22)
Source: https://mallahyari.github.io/rag-ebook/03_prepare_data.html (accessed 2026-03-22)
Source: https://lakefs.io/blog/what-is-rag-pipeline/ (accessed 2026-03-22)

A RAG corpus has two storage layers:

**Layer 1 — Raw corpus (source files):**
```
knowledge/
├── bauhaus/
│   ├── books/          # PDFs (gitignored or LFS)
│   └── extractions/    # Markdown/text extractions (in Git, text)
├── harkly/
│   └── references/
└── shared/
    └── standards/      # W3C, WCAG, etc.
```

**Layer 2 — Processed artifacts (pipeline outputs):**
```
knowledge/
├── chunks/             # chunked text files
├── embeddings/         # vector files (gitignored — large, reproducible)
└── index/              # vector DB export (gitignored or external)
```

Key principle: **source extractions belong in Git (text, diffable), embeddings do not**. Embeddings are reproducible artifacts — they can be regenerated from extractions. Storing embeddings in Git bloats the repo with non-diffable binary data.

For the nospace Bauhaus corpus:
- PDFs: external storage (R2 or separate repo), pointer in `knowledge/bauhaus/README.md`
- Extractions (the 107 Markdown files already extracted): in Git at `knowledge/bauhaus/extractions/`
- Embeddings: gitignored, stored in Cloudflare Vectorize or local cache

---

### Incremental Sync Pattern

Source: https://unstructured.io/insights/rag-systems-best-practices-unstructured-data-pipeline (accessed 2026-03-22)

Best practice for RAG pipeline organization:

```
knowledge/
├── corpus/             # source documents (tracked or LFS)
│   └── [source-name]/
│       └── [doc].pdf
├── processed/          # pipeline outputs (gitignored)
│   ├── chunks/
│   └── metadata.json   # chunk-to-source mapping (in Git, small)
└── pipeline/           # processing scripts (in Git)
    ├── ingest.py
    ├── chunk.py
    └── embed.py
```

The `metadata.json` (chunk→source mapping) belongs in Git because it enables traceability without storing the embeddings themselves.

---

## 6. Marketing Content in Engineering Repos

### The Case for Marketing-in-Monorepo

Source: https://www.kasava.dev/blog/everything-as-code-monorepo (accessed 2026-03-22)

Kasava manages their entire company in one monorepo, including:

```
marketing/
├── blogs/
│   ├── drafts/
│   ├── review/
│   └── published/
├── investor-deck/      # Next.js static site with slide components
└── email/              # MJML templates
```

Their rationale: when a feature ships, the AI has access to the codebase, the marketing blog queue, and the product docs simultaneously. Blog posts are Markdown + frontmatter, email templates are MJML code. Marketing content treated as code.

Key benefit they cite: **cross-boundary coherence**. When an engineer changes an API, the AI assistant that generates the release blog can read the actual diff. When marketing writes about a feature, they can verify claims against the real implementation.

---

### The Case Against Marketing-in-Engineering-Repo

Source: https://www.cmswire.com/digital-experience/when-headless-cms-met-real-marketing-workflows/ (accessed 2026-03-22)

The headless CMS model explicitly separates marketing content from engineering repos:

Arguments for separation:
- Marketing teams need non-technical workflows (visual editors, publishing queues, A/B testing)
- Content has different release cadence than code
- Legal/compliance review processes differ
- Marketing content benefits from CMS-specific features (scheduling, localization, preview)

The hybrid-headless pattern (emerging 2024-2025): APIs for developers, visual editing for marketers, content stored in CMS not in Git. Market growing from $3.94B (2025) to $22.28B (2034).

---

### Decision Framework — Marketing in Repo vs Not

Based on aggregate research:

| Factor | In-repo wins | Out-of-repo wins |
|---|---|---|
| Team composition | Developers write content | Non-technical marketers |
| Content type | Markdown, code snippets, technical docs | Rich media, campaign assets |
| Update cadence | Weekly or slower, tied to releases | Daily, independent of releases |
| Review process | Git PR workflow acceptable | CMS workflow needed |
| AI-first workspace | Content accessible to AI coding agents | External tool required |
| Tooling | Git + editor sufficient | Scheduling, localization, preview needed |

---

### Copywriting and Research — Where It Belongs

Source: Research synthesis across all sources above

For an AI-first monorepo like nospace where the primary consumers of marketing content are:
1. AI agents that write code referencing the brand
2. Developers who write about features
3. A solo founder (nopoint) who controls all content

The in-repo approach wins. Audience research, TOV docs, copy maps, and positioning belong in the project folder — not in a CMS — because:
- They inform design system decisions
- They guide AI agents working on the product
- They don't need CMS-specific features (scheduling, localization, A/B testing)
- Git PR workflow is the team's native review process

For Harkly specifically: `development/harkly/marketing/` with subdirectories by content type, adjacent to `development/harkly/brand/`.

---

## 7. Synthesis — Recommendation for nospace

### Current State (problems)

1. Brand docs exist in TWO locations: `development/harkly/brand/` AND `docs/harkly/brand/` — drift risk
2. Three design systems in `design/` are independent — no explicit inheritance from Bauhaus base
3. Marketing content in `marketing/` — only for Harkly, unclear relationship to `development/harkly/`
4. Knowledge base (`knowledge/`) contains 1.16 GB of PDFs alongside extracted Markdown — not separated by concern
5. Research documents in `docs/research/` are workspace-level — correctly placed

---

### Recommended Organization

#### Option A: Per-Project with Shared Base (Recommended)

```
nospace/
├── design/
│   ├── tokens/                         # CENTRALIZED token base
│   │   ├── base/                       # Tier 1 — literal values
│   │   │   ├── bauhaus/                # Bauhaus base brand values
│   │   │   ├── harkly/                 # Harkly overrides of Tier 1
│   │   │   └── contexter/              # Contexter overrides
│   │   ├── semantic/                   # Tier 2 — shared, role-based
│   │   └── components/                 # Tier 3 — component-specific
│   ├── bauhaus/                        # Bauhaus system: foundations + guidelines
│   ├── harkly/                         # Harkly system: delta from Bauhaus
│   └── contexter/                      # Contexter system: delta from Bauhaus
│
├── development/
│   ├── tLOS/                           # unchanged
│   ├── harkly/
│   │   ├── brand/                      # CANONICAL brand docs (source of truth)
│   │   │   ├── brand-overview.md
│   │   │   ├── tov.md
│   │   │   └── ui-language-ru.md
│   │   └── marketing/                  # Marketing content (in-repo)
│   │       ├── copy/
│   │       └── audience-research/
│   └── contexter/
│
├── knowledge/
│   ├── bauhaus/
│   │   ├── README.md                   # pointer to external PDF storage
│   │   └── extractions/                # Markdown extractions (in Git)
│   └── pipeline/                       # RAG processing scripts
│
└── docs/
    ├── research/                       # workspace-level research (current location is correct)
    ├── adr/                            # architecture decisions
    └── [project]/                      # project-specific public docs
```

#### What Changes

| Current | Recommended | Action |
|---|---|---|
| `development/harkly/brand/` | Keep as CANONICAL | Mark as source of truth |
| `docs/harkly/brand/` | Pointer or remove | Eliminate duplication |
| `marketing/` (root-level) | `development/harkly/marketing/` | Move under project |
| `design/` — 3 independent systems | `design/tokens/` as shared base | Create token inheritance layer |
| `knowledge/` PDFs inline | `knowledge/bauhaus/extractions/` + external PDF storage | Separate extractions from binaries |

---

#### Option B: Fully Centralized (Alternative)

All design, brand, and marketing content in `design/` with subfolders per project. Works if design is a first-class project team alongside engineering. Not recommended for nospace because the design work is deeply coupled to each product's development.

---

### Decision Criteria Applied to nospace

| Question | Answer | Implication |
|---|---|---|
| Do multiple projects share a base design system? | Yes — Bauhaus underlies tLOS, Harkly, Contexter | Centralized token base in `design/tokens/` |
| Are brand docs project-specific or cross-cutting? | Project-specific (Harkly brand ≠ tLOS brand) | Per-project `brand/` folders |
| Is the team technical? | Yes — solo AI-first workspace | In-repo marketing content is viable |
| Do PDFs change? | Rarely — static reference corpus | External storage for PDFs, Git for extractions |
| Is there a CI/CD pipeline for docs? | Not yet | Not a blocking concern |
| Is the duplication causing harm? | Risk of drift | Resolve immediately |

---

### Immediate Actions (Priority Order)

1. **Resolve brand duplication** — designate `development/harkly/brand/` as canonical, add a single-line `docs/harkly/brand/README.md` redirect pointing to it.
2. **Create `design/tokens/` with three-tier structure** — Bauhaus base, Harkly overrides, Contexter overrides.
3. **Move `marketing/` under `development/harkly/marketing/`** — keeps Harkly content co-located with Harkly development.
4. **Separate `knowledge/bauhaus/`** — move PDFs to external storage (Cloudflare R2 or separate `bauhaus-corpus` repo), keep extractions in Git.
5. **Add `knowledge/pipeline/`** — RAG processing scripts co-located with corpus metadata.

---

## Sources

- Shopify Polaris monorepo: https://github.com/shopify/polaris
- Polaris Web Components (2025): https://www.shopify.com/partners/blog/polaris-unified-and-for-the-web
- GitHub Primer design: https://github.com/primer/design
- GitHub Primer primitives: https://github.com/primer/primitives
- Atlassian Frontend mirror: https://github.com/pioug/atlassian-frontend-mirror
- IBM Carbon monorepo: https://github.com/carbon-design-system/carbon
- Carbon moving to monorepo: https://medium.com/carbondesign/carbon-is-moving-to-a-monorepo
- W3C Design Tokens stable spec: https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- Brad Frost — Themeable Design Systems: https://bradfrost.com/blog/post/the-many-faces-of-themeable-design-systems/
- Multi-brand theming with Style Dictionary: https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9
- Multi-brand tokens for flexible systems: https://clearleft.com/thinking/designing-with-tokens-for-a-flexible-multi-brand-design-system
- Figma Extended Collections: https://medium.com/design-bootcamp/preparing-for-the-design-tokens-era-multi-brand-systems-and-figmas-extended-collections-9fd35ccd06df
- Multi-brand documentation structure: https://amyhupe.co.uk/articles/structuring-documentation-multi-brand-design-systems/
- Design System vs Brand Guidelines: https://www.huckfinchbranding.com/blog/design-systems-vs-brand-guidelines-what-you-need-to-know
- Design system single source of truth: https://designsystems.surf/guides/single-source-of-truth
- WordPress Openverse monorepo: https://github.com/WordPress/openverse
- Diataxis framework: https://diataxis.fr/
- Diataxis 2024 exploration: https://emmanuelbernard.com/blog/2024/12/19/diataxis/
- Technical guide to Diataxis: https://ekline.io/blog/a-technical-guide-to-the-diataxis-framework-for-modern-documentation
- Git LFS official: https://git-lfs.com/
- When to use Git LFS (GitHub Well-Architected): https://wellarchitected.github.com/library/architecture/recommendations/scaling-git-repositories/when-to-use-git-lfs/
- Replacing GitHub LFS with Cloudflare R2: https://dbushell.com/2024/07/15/replace-github-lfs-with-cloudflare-r2-proxy/
- DVC vs Git-LFS comparison: https://lakefs.io/blog/dvc-vs-git-vs-dolt-vs-lakefs/
- RAG pipeline best practices: https://unstructured.io/insights/rag-systems-best-practices-unstructured-data-pipeline
- RAG data preparation: https://mallahyari.github.io/rag-ebook/03_prepare_data.html
- Everything as code monorepo (Kasava): https://www.kasava.dev/blog/everything-as-code-monorepo
- Headless CMS and marketing workflows: https://www.cmswire.com/digital-experience/when-headless-cms-met-real-marketing-workflows/
- AI and monorepos (monorepo.tools): https://monorepo.tools/ai
- Monorepos and AI comeback (2026): https://medium.com/@dani.garcia.jimenez/monorepos-are-back-and-ai-is-driving-the-comeback-f4abbb7bb55f
- Design token naming best practices: https://www.netguru.com/blog/design-token-naming-best-practices
- Structuring multi-brand Figma variables: https://bordercrossingux.com/structuring-figma-variables/
