# nospace Restructuring Proposal
> Generated: 2026-03-22
> Based on: 5 research reports (3,627 lines, 150+ sources)
> Status: PROPOSAL — requires nopoint approval

---

## Executive Summary

The nospace workspace architecture is **structurally sound and more advanced than industry standard** for agent memory management (validated across all 5 research tracks). No fundamental redesign needed. The gaps are in **navigation entry points**, **memory loading discipline**, **governance enforcement**, and **structural hygiene**.

**26 improvements** organized into 4 tiers by effort/impact. Estimated total: Phase 1 in 1 session, Phase 2 in 2-3 sessions, Phase 3 in a dedicated epic.

---

## Phase 1 — Immediate (low effort, high impact)

### 1.1 Root Navigation Layer

**Problem:** Fresh agent context has no O(1) way to orient in the workspace. `ecosystem-map.md` is buried in `agents/`.
**Evidence:** Datadog, OpenAI Codex, and Nx all use root-level routing docs. Meta-repo pattern uses machine-readable `repos.yaml`.

**Actions:**

**A. Create `nospace/AGENTS.md`** — root router (not content doc):
```markdown
# nospace — Agent Router

## Projects
| Project | Memory | Code | Design |
|---|---|---|---|
| tLOS | development/tLOS/memory/tlos-about.md | development/tLOS/core/ | design/design_system/ |
| Harkly | development/harkly/memory/harkly-about.md | development/harkly/harkly-shell/ | design/harkly/ |
| Contexter | development/contexter/memory/contexter-about.md | development/contexter/src/ | design/contexter/ |
| Nomos | finance/nomos/memory/nomos-about.md | — | — |

## Governance
- Constitution: rules/global-constitution.md
- Regulations: rules/regulations/
- Agent topology: agents/ecosystem-map.md

## For specific domains, read the project's L1 (-about.md) file.
```

**B. Create `nospace/projects.yaml`** — machine-readable project map:
```yaml
projects:
  tlos:
    name: "Thelos (tLOS)"
    status: active
    l1: development/tLOS/memory/tlos-about.md
    code: development/tLOS/core/
    design: design/design_system/
    constitution: development/tLOS/rules/tLOS-constitution.md
  harkly:
    name: "Harkly"
    status: active
    l1: development/harkly/memory/harkly-about.md
    code: development/harkly/harkly-shell/
    design: design/harkly/
    constitution: development/harkly/rules/harkly-constitution.md
  contexter:
    name: "Contexter"
    status: active
    l1: development/contexter/memory/contexter-about.md
    code: development/contexter/src/
    design: design/contexter/
  nomos:
    name: "Nomos"
    status: active
    l1: finance/nomos/memory/nomos-about.md
```

---

### 1.2 JIT Memory Loading Discipline

**Problem:** Current session start loads all L1+L2+L3+chronicle = ~8,400 tokens minimum. Research shows: context rot degrades accuracy non-linearly. JIT loading achieves **100-160x** token reduction.
**Evidence:** Speakeasy benchmark 2025, Anthropic context engineering blog.

**Actions:**

**A. Add section indexes to L1 files.** Each `{project}-about.md` gets a TOC at the top:
```markdown
## Sections (load on demand)
| Section | Lines | When to load |
|---|---|---|
| Identity | 1-10 | Always |
| Tech Stack | 12-30 | When coding |
| Key Paths | 32-50 | When navigating files |
| Docker Stack | 52-80 | When launching services |
| Active L3 | 220-230 | Always |
```

Session start loads: Identity + Active L3 (20 lines) instead of full file (242 lines). **~10x reduction.**

**B. Lazy chronicle loading.** Never read `tlos-current.md` (461 lines) at session start. Instead:
- Read `chronicle/index.md` (151 lines, already small)
- Load specific entries only when referenced

**C. Scratch batch processing.** Instead of reading 16 scratch files sequentially:
```sql
-- Future SQLite, but today:
grep -l "<!-- ENTRY:" scratches/*.md  -- find only unprocessed
```
Skip empty/placeholder scratches entirely.

---

### 1.3 Chronicle Entry Standardization

**Problem:** Chronicle entries lack structured headers. Can't query by agent, session, or git hash without reading full text.
**Evidence:** Event sourcing pattern, AgentLog JSONL standard.

**Action:** Standardize entry format:
```markdown
<!-- ENTRY:2026-03-22:CHECKPOINT:150:tlos:phase-15:axis:session-abc123:git-def456 -->
## 2026-03-22 — checkpoint 150
...content...
```

Fields: `date:type:N:project:epic:agent_id:session_id:git_hash`

---

### 1.4 Regulation Lifecycle Metadata

**Problem:** No way to detect stale regulations. Some reference deprecated concepts (handshake files). NIST "Measure" function absent.
**Evidence:** NIST AI RMF, ISO 42001.

**Action:** Add YAML frontmatter to every regulation:
```yaml
---
last-reviewed: 2026-03-22
owner: senior-architect
review-cycle: quarterly
references: [rbac-regulation.md, memory-regulation.md]
---
```

Weekly stale detection: `grep -l "last-reviewed: 2025" rules/regulations/` finds overdue reviews.

---

### 1.5 Brand & Marketing Co-location

**Problem:** Brand content duplicated in `docs/harkly/brand/` AND `development/harkly/brand/`. Marketing at root level but Harkly-only.
**Evidence:** Anti-pattern documented in design system research. Single canonical location required.

**Actions:**
- `development/harkly/brand/` = **canonical** (already more complete)
- `docs/harkly/brand/` → replace contents with pointer: `See development/harkly/brand/`
- `marketing/` → move to `development/harkly/marketing/` (co-location with project)

---

### 1.6 Knowledge Directory Rename

**Problem:** `knowledge/` and `private_knowledge/` — similar names, different access semantics.
**Evidence:** Workspace organization research, naming collision analysis.

**Action:** `knowledge/` → `corpus/` (reflects actual content: source corpus for RAG)

---

## Phase 2 — Near-term (medium effort, high impact)

### 2.1 SQLite Index Layer (Phase 1 of SQLite migration)

**Problem:** grep across 184 MD files. No structured querying of chronicle (4,163 lines). No FTS.
**Evidence:** sqlite-memory, ZeroClaw hybrid pattern, FTS5 benchmarks (0.3ms on RPi Zero).

**Architecture:** MD files remain source of truth. SQLite = read-only index.

```
memory/*.md  ──(sync script)──►  workspace.db
                                   ├── memory (L1-L3 content, project/layer/key)
                                   ├── chronicle (entries with structured fields)
                                   ├── scratches (session_id, processed flag)
                                   ├── memory_fts (FTS5 full-text index)
                                   └── chronicle_fts (FTS5 full-text index)
```

**Sync script** runs at session start, after checkpoint, after session close.
**Query interface:** Bash (`sqlite3 workspace.db "SELECT..."`) or MCP tool.

---

### 2.2 Design System Three-Tier Tokens

**Problem:** Three independent design systems is the wrong model. Bauhaus principles are copy-pasted, not inherited.
**Evidence:** Shopify Polaris, IBM Carbon, W3C Design Tokens spec. Three-tier standard: base (brand-specific) → semantic (shared) → component (shared).

**Target structure:**
```
design/
  tokens/
    base/
      bauhaus/       ← Tier 1: raw values from tLOS Bauhaus
      harkly/        ← Tier 1: warm palette overrides
      contexter/     ← Tier 1: cold B&W overrides
    semantic/        ← Tier 2: role-named, brand-agnostic (shared)
    components/      ← Tier 3: use-specific (shared)
  design_system/     ← tLOS Bauhaus guidelines (kept as-is, it's the upstream)
  harkly/            ← Harkly-specific guidelines + Pencil file
  contexter/         ← Contexter-specific guidelines
```

Brand swapping = change Tier 1 base only. Tiers 2-3 are universal.

---

### 2.3 Governance Consolidation (15 → 8 + tooling)

**Problem:** 15 regulations, some overlap, some unenforceable prose. Conventions can replace ~7.
**Evidence:** Convention-over-configuration research, Prose2Policy paper.

**Regulations to KEEP as prose** (authority/permission/escalation):
1. `rbac-regulation.md` — who can do what
2. `agent-conduct-regulation.md` — behavior rules
3. `context-economy-regulation.md` — token discipline
4. `task-management-regulation.md` — GAIA levels, DoR/DoD
5. `memory-regulation.md` — tier model, consolidation
6. `claude-agent-orchestration-regulation.md` — delegation rules
7. `agent-onboarding-regulation.md` — pre-flight checklist
8. `git-regulation.md` — version control rules

**Regulations to REPLACE with tooling/conventions:**
| Regulation | Replacement |
|---|---|
| `naming-regulation.md` | `ls-lint.yaml` + directory conventions |
| `file-size-regulation.md` | Pre-commit hook or PreToolUse hook |
| `code-style-regulation.md` | `.editorconfig` + linter configs |
| `api-gateway-regulation.md` | MCP server configs (already implicit) |
| `mas-architecture-regulation.md` | Merge into ecosystem-map.md |
| `agent-identity-regulation.md` | Merge into agent-conduct |
| `vector-search-regulation.md` | Merge into memory-regulation |

**Removed regulations stay in `.archive/rules/`** with pointer.

---

### 2.4 Confidence Pre-flight for G3 Player

**Problem:** Player implements blindly from spec, discovers gaps mid-implementation, wastes full cycle.
**Evidence:** Devin 2.0 architecture, Google 17.2x error amplification data.

**Action:** Add to Domain Lead INSTRUCTION.md:
```markdown
## Player Pre-flight (mandatory)

Before implementing, Player outputs:
1. Confidence score (0-100)
2. Identified gaps or ambiguities in spec
3. Questions for Coach/Lead

If confidence < 70 OR gaps found:
  → Return NEEDS_CONTEXT to Domain Lead
  → Do NOT proceed to implementation
```

---

### 2.5 Decomposability Tagging

**Problem:** Orchestrator launches parallel Domain Leads without assessing if tasks are truly independent. Google data: parallel execution on sequential tasks = -39% to -70%.
**Evidence:** arXiv 2512.08296 (180 agent configurations).

**Action:** Before launching Domain Leads, Orchestrator explicitly tags:
```markdown
## Task Assessment
- Domain A (frontend): decomposable=true, parallel OK
- Domain B (backend): decomposable=true, parallel OK
- Domain C (migration): decomposable=false, MUST run after A+B
```

---

### 2.6 Persistent decisions.md per Project

**Problem:** Architectural decisions get lost between sessions. Same debates repeat.
**Evidence:** GitHub Squad pattern, MetaGPT Architect role.

**Action:** Add `development/{project}/decisions.md`:
```markdown
# Decisions — {project}

## 2026-03-22 — Axis — Use Jina v4 over OpenAI embeddings
Why: multimodal, truncate_dim support, 1024-dim fits Vectorize
Alternative considered: OpenAI text-embedding-3-large
```

Domain Leads append during spec creation. Orchestrator checks before making architectural calls.

---

## Phase 3 — Strategic (high effort, architectural)

### 3.1 SQLite Primary Store (Phase 2 migration)

**Decision required from nopoint.** MD files become generated artifacts; SQLite is source of truth.

**Pros:**
- Atomic transactions, crash recovery (WAL)
- FTS5 + sqlite-vec hybrid search
- Structured queries (by date, project, agent, epic)
- Single file backup

**Cons:**
- Not diffable in git (need SQL dump export)
- Claude Code can't Read directly (needs Bash/MCP wrapper)
- Migration risk (184 files)

**Recommendation:** Do Phase 1 (index layer) first. Evaluate after 2 weeks. If index query frequency > file read frequency → proceed to Phase 2.

---

### 3.2 `search_memory` MCP Tool

**Problem:** Agents query memory via Read (full file) or grep (unstructured). No semantic search.
**Evidence:** sqlite-vec (HNSW vector search in SQLite), ZeroClaw hybrid pattern.

**Architecture:**
```
search_memory(query, project?, layer?, date_range?)
  → SQLite FTS5 (BM25 text match, weight 0.4)
  → sqlite-vec (vector similarity, weight 0.6)
  → RRF fusion
  → top-K results with source file + line numbers
```

Callable by Axis/Logos/Satoshi. Replaces loading full files for fact-finding.

---

### 3.3 Policy-as-Code Gateway

**Problem:** RBAC, file-size limits, naming rules exist as prose. No runtime enforcement.
**Evidence:** OPA/Rego, Cedar (AWS Bedrock AgentCore), AAGATE pattern, Prose2Policy paper.

**Target:** PreToolUse hook evaluates policy before every file write:
```
Agent writes to file → PreToolUse hook →
  Check: is agent authorized for this path? (RBAC)
  Check: does filename match naming pattern? (naming)
  Check: will file exceed size limit? (file-size)
  → ALLOW or BLOCK with reason
```

Implementation: Claude Code hooks + OPA/Rego policies generated from prose regulations.

---

### 3.4 Three-Tier Instruction Architecture

**Problem:** CLAUDE.md loads everything every prompt. At scale, constitution consumes context before real work.
**Evidence:** Codified-context paper (arXiv 2602.20478), Claude Code rules directory docs.

**Target:**
```
Tier 1 — Hot Constitution (always loaded, <500 tokens)
  ~/.claude/CLAUDE.md  ← minimal router + critical rules only

Tier 2 — Domain Specialist (loaded per-project, <1000 tokens)
  .claude/rules/{project}.md  ← path-scoped: "paths: development/tLOS/**"

Tier 3 — Cold Specs (loaded on demand)
  Regulations, PDs, design guidelines  ← agent reads only when task requires
```

CLAUDE.md shrinks from current ~3K tokens to ~500. Domain rules auto-activate via path matching.

---

## Phase 4 — Structural Hygiene (cleanup, no architectural change)

### 4.1 Archive deprecated items
- `core/glmcode/`, `core/kimicode/`, `core/.qwen/`, `core/.opencode/` → `.archive/`
- `development/tLOS/development/tLOS/` → remove (stale recursive dir)
- `core/dir created/` → remove (stale artifact)
- Handshake files (`memory/handshake.md`, per-project handshakes) → `.archive/` with pointer

### 4.2 Fix naming violations
- Rename 17+ files with spaces → kebab-case or archive
- Rename 3 directories with spaces → kebab-case
- Add `tLOS` as legacy exception to naming-regulation §5

### 4.3 Process accumulated scratches
- tLOS: 6 scratches → distribute to chronicle, archive
- Harkly: 16 scratches → distribute to chronicle, archive

### 4.4 Remove empty directories
- `requirements/` → remove (unused)
- `data/` → keep (gitignored runtime, convention)
- Empty agent dirs in `agents/` → keep as scaffolding (low cost)

### 4.5 Consolidate research locations
- `research/` (root, 3 dated dirs) + `docs/research/` (50+ files) → document distinction:
  - `research/` = long-form independent research (keep as-is)
  - `docs/research/` = project-specific evaluations and specs (keep as-is)
  - Add README to each explaining scope

---

## Impact Summary

| Phase | Changes | Token Savings | Quality Impact |
|---|---|---|---|
| **1** | 6 actions | ~10x session start reduction | Navigation: O(1) orientation |
| **2** | 6 actions | FTS5 queries vs grep dumps | Structured memory access |
| **3** | 4 actions | Semantic search over history | Policy enforcement |
| **4** | 5 actions | Cleanup noise | Consistency |

---

## Research Sources

All findings backed by 5 research reports totaling 3,627 lines and 150+ sources:

| Report | File | Lines | Sources |
|---|---|---|---|
| Workspace Organization | `docs/research/workspace-organization-research.md` | 571 | 26 |
| LLM Memory Systems | `docs/research/llm-memory-systems-research.md` | 1,091 | 50 |
| AI Governance Patterns | `docs/research/ai-governance-patterns-research.md` | 657 | 20 |
| Agent Orchestration | `docs/research/agent-orchestration-patterns-research.md` | 563 | 25 |
| Design System Organization | `docs/research/design-system-organization-research.md` | 745 | 30 |
