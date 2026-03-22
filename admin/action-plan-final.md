# nospace Restructuring — Final Action Plan
> Generated: 2026-03-22
> Based on: 5 research reports (3,627 lines) + 6 directory audits
> Status: READY FOR APPROVAL

---

## Overview

| Metric | Before | After (projected) |
|---|---|---|
| Tokens per prompt (always-loaded) | ~8,886 | ~6,300 (-29%) |
| Tokens per session start (tLOS) | ~6,564 | ~2,500 (-62%) |
| Tokens per session start (global) | ~14,892 | ~5,000 (-66%) |
| Regulations count | 15 (1,853 lines) | 8 (1,023 lines, -45%) |
| Stale regulations | 6 | 0 |
| Files with naming violations | 17 + 3 dirs | 0 |
| Deprecated items unarchived | 62 files + 6 handshakes | 0 |
| Accumulated scratches | 136 | Processed & archived |

---

## Phase 1 — Immediate Actions

### 1.1 Create Root Navigation Layer
**Status:** SAFE — nothing exists, pure addition.
**Effort:** 30 min

| Action | Details |
|---|---|
| Create `nospace/AGENTS.md` | Router file: projects table → L1 paths, governance → constitution, topology → ecosystem-map |
| Create `nospace/projects.yaml` | Machine-readable: 4 projects with name, status, l1, code, design, constitution paths |

**Risk:** Zero — new files, no existing references.

---

### 1.2 Fix /startgsession Bug + Reduce Session Load
**Status:** Bug confirmed. Savings validated.
**Effort:** 1 hour

| Action | Details |
|---|---|
| Fix Step 1 of `/startgsession` | Remove reference to nonexistent `nospace/CLAUDE.md`, point to `~/.claude/CLAUDE.md` |
| Remove unconditional regulation loading | `/startgsession` loads ALL 13 regulations (7,348 tokens). Change to: load 0 regulations at start, agent reads specific regulation only when task requires |
| Add section indexes to L1 files | TOC with line ranges at top of each `-about.md`. Load Identity + Active L3 only (~20 lines vs 242) |
| Defer L2 loading | Don't load roadmap at start. Load on demand when asked "что дальше?" |

**Risk:** LOW — skills are text prompts, not code. If agent needs a regulation, it `Read`s it.
**Dependencies:** Edit 4 skill files in `~/.claude/`.

---

### 1.3 Standardize Chronicle Entry Format
**Status:** 6 formats found. Standardization safe (preserving `<!-- ENTRY:` prefix).
**Effort:** 45 min (define format + update checkpoint skills)

**Standard format:**
```
<!-- ENTRY:YYYY-MM-DD:TYPE:N:PROJECT:EPIC:AGENT_ID:SESSION_ID -->
```

| Action | Details |
|---|---|
| Update `/checkpointaxis`, `/checkpointlogos`, `/checkpointsatoshi` skills | New entry template with all 7 fields |
| DO NOT reformat existing entries | Historical entries stay as-is (different grep behavior is acceptable for old entries) |
| Document format in workspace-consciousness-architecture.md | Add § on entry standard |

**Risk:** LOW — old entries remain, new entries follow standard. grep `<!-- ENTRY:` works for both.

---

### 1.4 Add Regulation Lifecycle Metadata
**Status:** 0/15 have frontmatter. 6 critically stale/unimplemented.
**Effort:** 1 hour

| Action | Details |
|---|---|
| Add YAML frontmatter to all 15 | `last-reviewed`, `owner`, `review-cycle`, `status` (active/stale/unimplemented) |
| Mark 3 stale regulations | `claude-agent-orchestration` (stale), `memory-regulation` (stale — merge_to_semantic doesn't exist), `rbac-regulation` (stale — missing Axis/Logos/Satoshi) |
| Mark 3 unimplemented | `agent-identity` (JWT never built), `api-gateway` (gateway never built), `vector-search` (proactive, not active) |
| Add Tags to 2 missing files | `agent-conduct-regulation.md`, `code-style-regulation.md` |

**Risk:** Zero — metadata addition, content unchanged.

---

### 1.5 Consolidate Brand Content
**Status:** NOT a simple duplication. `docs/harkly/brand/` has 6 UNIQUE research files (175 KB).
**Effort:** 30 min

**REVISED plan (based on audit):**

| Action | Details |
|---|---|
| Move 6 unique files from `docs/harkly/brand/` to `development/harkly/brand/research/` | `enemy.md`, `hero.md`, `framework.md`, `Harkly.md`, `HARKLY_BRAND_MYTHOLOGY.md`, `instagram_str1.md` |
| Replace `docs/harkly/brand/` with README pointer | "Brand docs canonical location: `development/harkly/brand/`" |
| Fix `MOVED.md` lie | `development/harkly/brand/MOVED.md` claims values.md moved to marketing/ but it didn't. Delete MOVED.md or fix redirect |
| Move `marketing/` to `development/harkly/marketing/` | 24 files. Update INDEX.md paths |
| Update ~30 references | In L1/L2 memory files and design docs |

**Risk:** MEDIUM — 30 reference updates. But all are in .md files (searchable, fixable).

---

### 1.6 Rename knowledge/ → corpus/
**Status:** Semantically correct. 5 Python files with hardcoded paths will break.
**Effort:** 45 min

| Action | Details |
|---|---|
| `mv nospace/knowledge/ nospace/corpus/` | Rename |
| Fix 5 Python files | `bauhaus_enricher.py`, `upsert_klee_figures.py`, `persona_enricher.py`, `manifest.json`, archived copy |
| Update ~15 active documentation references | L1 files, MEMORY.md, README files |
| DO NOT update chronicle entries | Historical accuracy preserved |
| DO NOT rename `private_knowledge/` | Collision disappears once `knowledge/` becomes `corpus/` |

**Risk:** LOW — Python files are infrequently run batch scripts. Test after rename.

**NOTE:** 2.8 GB of PDFs committed directly to git without LFS. Separate concern — address in Phase 4 or dedicated cleanup.

---

## Phase 2 — Near-term Actions

### 2.1 SQLite Index Layer
**Status:** READY. 196 files, 23K lines, consistent delimiters, bun:sqlite available.
**Effort:** 2-3 hours for MVP sync script

| Action | Details |
|---|---|
| Create `nospace/tools/memory-db/sync.ts` | Bun script: parse all memory/*.md → SQLite tables (memory, chronicle, scratches) + FTS5 indexes |
| Create `nospace/tools/memory-db/workspace.db` | Gitignored. Regenerable artifact. |
| Create `nospace/tools/memory-db/query.ts` | CLI: `bun run query.ts "jina v4"` → FTS5 search across all memory |
| Add to session start skills | After scratch processing: `bun run sync.ts` |

**Risk:** LOW — additive. MD files remain source of truth. SQLite is regenerable read-only index.

---

### 2.2 Design System Three-Tier Tokens
**Status:** tLOS tokens mature (13 JSON, W3C DTCG). Harkly/Contexter have NO JSON tokens.
**Effort:** 8-11 hours total

| Action | Details |
|---|---|
| Phase A: Extract Harkly tokens from CSS + Pencil | Create `design/harkly/tokens/` with base color, typography, spacing, motion JSONs |
| Phase B: Extract Contexter tokens from markdown | Create `design/contexter/tokens/` |
| Phase C: Create shared semantic layer | `design/tokens/semantic/` referencing base tokens via aliases |
| Phase D: Style Dictionary 4.x integration | Build pipeline: base + overrides → CSS variables / Tailwind config |

**Risk:** MEDIUM — Harkly extraction requires Pencil MCP tool reading. No code currently imports tokens directly (Tailwind classes used instead), so no breakage.
**DEFER if:** Active development on other epics takes priority.

---

### 2.3 Governance Consolidation
**Status:** Confirmed 15→8. Need rewrite of orchestration regulation.
**Effort:** 3-4 hours

| Regulation | Action |
|---|---|
| **KEEP (rewrite):** `claude-agent-orchestration-regulation.md` | Full rewrite — 80% references deprecated Qwen/OpenCode |
| **KEEP (update):** `rbac-regulation.md` | Add Axis/Logos/Satoshi/Eidolon roles |
| **KEEP (update):** `memory-regulation.md` | Remove merge_to_semantic refs, add chronicle format standard |
| **KEEP as-is:** `agent-conduct`, `context-economy`, `task-management`, `agent-onboarding`, `git-regulation` | Minor tweaks only |
| **ARCHIVE:** `agent-identity-regulation.md` | → `.archive/rules/` (JWT never built) |
| **ARCHIVE:** `api-gateway-regulation.md` | → `.archive/rules/` (gateway never built, extract 3 key rules into agent-conduct) |
| **ARCHIVE:** `vector-search-regulation.md` | → `.archive/rules/` or append to memory-regulation |
| **REPLACE:** `naming-regulation.md` | Keep as reference doc, add `ls-lint.yaml` for enforcement |
| **REPLACE:** `file-size-regulation.md` | Keep as reference doc, add PreToolUse hook for enforcement |
| **REPLACE:** `code-style-regulation.md` | Merge actionable parts into project-level `.editorconfig` |
| **MERGE:** `mas-architecture-regulation.md` | Content → `agents/ecosystem-map.md` (it's rationale, not regulation) |
| Update `global-constitution.md` § 6 | Update rules hierarchy table (5-8 reference changes) |

**Risk:** MEDIUM — constitution references. All changes traceable.

---

### 2.4 Confidence Pre-flight for G3 Player
**Status:** NOT implemented. Low effort to add.
**Effort:** 30 min

| Action | Details |
|---|---|
| Add pre-flight section to `agents/domain-lead/INSTRUCTION.md` | Player outputs: confidence (0-100), gaps found, questions — BEFORE implementing |
| Add threshold rule | If confidence < 70 OR gaps found → `NEEDS_CONTEXT`, don't proceed |
| Update `~/.claude/rules/agents.md` | Add pre-flight to G3 table |

**Risk:** Zero — additive prompt change.

---

### 2.5 Decomposability Tagging
**Status:** NOT implemented. Low effort.
**Effort:** 15 min

| Action | Details |
|---|---|
| Add to CLAUDE.md Orchestrator Protocol | Before launching Domain Leads: tag each as `decomposable: true/false` |
| Add to `~/.claude/rules/agents.md` | "Sequential tasks force serial Domain Lead execution" |

**Risk:** Zero — behavioral guidance, no code change.

---

### 2.6 Persistent decisions.md
**Status:** Harkly already has one (127 lines, working). tLOS doesn't.
**Effort:** 15 min

| Action | Details |
|---|---|
| Create `development/tLOS/decisions.md` | Same format as Harkly: date, agent, decision, why, alternatives |
| Create `development/contexter/decisions.md` | Same |
| Add to Domain Lead INSTRUCTION.md | "Append architectural decisions during spec creation" |

**Risk:** Zero — new files.

---

## Phase 3 — Strategic Actions

### 3.1 Trim MEMORY.md (~2,500 tokens savings per prompt)
**Status:** 3,263 tokens always-loaded. Contains inline summaries duplicating pointer files.
**Effort:** 1-2 hours

| Action | Details |
|---|---|
| Remove inline descriptions from pointer entries | Keep only: `- [filename.md](filename.md) — one-line description` |
| Remove duplicated Orchestrator Protocol | Already in CLAUDE.md rules/agents.md |
| Compress navigation tables | Remove redundant columns |
| Target: < 1,500 tokens | Currently 3,263 → goal 1,500 |

**Risk:** LOW — MEMORY.md is nopoint-controlled. Test: read compressed version, verify all navigation works.

---

### 3.2 Path-Scoped Rules (Tier 2 Instructions)
**Status:** `.claude/rules/` exists with 8 files but NONE use `paths:` frontmatter.
**Effort:** 2 hours

| Action | Details |
|---|---|
| Convert project-specific rules to path-scoped | `tlos-rules.md` with `paths: nospace/development/tLOS/**` |
| Convert design rules | `design-rules.md` with `paths: nospace/design/**` |
| Remove from always-loaded CLAUDE.md | These load only when agent works in matching paths |

**Risk:** LOW — Claude Code natively supports `paths:` in rules YAML frontmatter. Test: verify rules activate correctly.

---

### 3.3 Rewrite /g3 Skill
**Status:** Functionally deprecated (Qwen CLI references).
**Effort:** 1-2 hours

| Action | Details |
|---|---|
| Rewrite to match Domain Lead workflow | Remove all Qwen/OpenCode/Gemini references |
| Integrate confidence pre-flight | Player assesses before implementing |
| Integrate decomposability check | Orchestrator tags before launching |

---

### 3.4 search_memory MCP Tool (future)
**Deferred** — requires SQLite index (2.1) to be stable first. Design after 2 weeks of index usage.

---

## Phase 4 — Structural Hygiene

### 4.1 Archive Deprecated Items
**Status:** 62 files safe to archive. Zero active references.
**Effort:** 30 min

| Item | Files | Action |
|---|---|---|
| `core/glmcode/` | ~20 | `mv` → `.archive/deprecated-agents/glmcode/` |
| `core/kimicode/` | ~25 | `mv` → `.archive/deprecated-agents/kimicode/` |
| `core/.qwen/` | ~7 | `mv` → `.archive/deprecated-agents/qwen/` |
| `core/.opencode/` | ~10 | `mv` → `.archive/deprecated-agents/opencode/` |
| `core/TEAM_AI.md`, `GLM.md`, `KIMI.md` | 3 | `mv` → `.archive/deprecated-agents/` |
| Handshake files (6) | 6 | `mv` → `.archive/deprecated-memory/` |
| `development/tLOS/development/tLOS/` | stale | Remove (recursive artifact, empty or minimal) |
| `core/dir created/` | stale | Remove |

---

### 4.2 Process & Archive Scratches
**Status:** 136 files. 17 misplaced in Harkly memory root.
**Effort:** 1-2 hours

| Action | Details |
|---|---|
| tLOS (6 scratches) | Process ENTRY markers → append to chronicle → move to `chronicle/scratches/` |
| Harkly (16 session scratches + 1 named) | Same process |
| Harkly misplaced (17 in memory root) | Move `session+N-scratch.md` files to proper location |
| Contexter, Nomos | Process & archive |

---

### 4.3 Fix Naming Violations
**Status:** 17 files + 3 dirs with spaces.
**Effort:** 30 min

| Action | Details |
|---|---|
| Files with spaces (17) | Rename to kebab-case where active; archive where legacy |
| Dirs with spaces (3) | `docs/time oracle/` → `docs/time-oracle/`, etc. |
| Add `tLOS` to naming-regulation §5 | Legacy exception (breaking change to fix everywhere) |

---

### 4.4 Clean Stale Permissions
**Status:** ~30 stale entries in settings.json from deprecated CLI workflows.
**Effort:** 15 min

| Action | Details |
|---|---|
| Review `~/.claude.json` and `~/.claude/settings.json` | Remove Qwen/OpenCode/Gemini permissions |
| Keep only active: Claude Code, Pencil MCP, Eidolon MCP | |

---

### 4.5 Address 2.8 GB PDFs in Git
**Status:** Bauhaus PDFs committed without LFS. Bloats clone.
**Effort:** Investigation needed

| Action | Details |
|---|---|
| Option A: Git LFS migration | Keeps files in repo, reduces clone size |
| Option B: Move to R2/external | Pointer files in repo, PDFs on Cloudflare R2 |
| Option C: Accept (private repo, sole user) | Cost: disk only, no collaboration impact |

**Recommendation:** Option C for now. Revisit if repo is ever shared.

---

## Execution Order

```
Session 1 (immediate):
  1.1 Create AGENTS.md + projects.yaml          30 min
  1.2 Fix /startgsession bug + reduce loading   1 hr
  1.4 Add regulation metadata                   1 hr
  2.4 Add confidence pre-flight                 30 min
  2.5 Add decomposability tagging               15 min
  2.6 Create decisions.md files                 15 min
                                                ──────
                                                ~3.5 hrs

Session 2 (cleanup):
  4.1 Archive deprecated items                  30 min
  4.2 Process scratches                         1-2 hrs
  4.3 Fix naming violations                     30 min
  4.4 Clean stale permissions                   15 min
  1.3 Standardize chronicle format              45 min
                                                ──────
                                                ~3-4 hrs

Session 3 (governance):
  2.3 Consolidate regulations (15→8)            3-4 hrs
  1.5 Consolidate brand content                 30 min
  1.6 Rename knowledge/ → corpus/               45 min
                                                ──────
                                                ~4-5 hrs

Session 4 (infrastructure):
  2.1 SQLite index layer                        2-3 hrs
  3.1 Trim MEMORY.md                            1-2 hrs
  3.2 Path-scoped rules                         2 hrs
                                                ──────
                                                ~5-7 hrs

Session 5+ (when capacity allows):
  2.2 Design system three-tier tokens           8-11 hrs
  3.3 Rewrite /g3 skill                         1-2 hrs
```

---

## Files Created During This Audit

| File | Purpose |
|---|---|
| `admin/nospace-index.md` | Complete directory index (790+ lines) |
| `admin/structure-audit.md` | Naming & structure compliance audit |
| `admin/restructuring-proposal.md` | Research-backed proposal (26 improvements) |
| `admin/action-plan-final.md` | THIS FILE: execution plan with audit findings |
| `admin/audit-phase1-navigation-memory.md` | Phase 1.1-1.2 audit |
| `admin/audit-phase1-chronicle-regulations.md` | Phase 1.3-1.4 audit |
| `admin/audit-phase1-brand-knowledge.md` | Phase 1.5-1.6 audit |
| `admin/audit-phase2-sqlite-design.md` | Phase 2.1-2.2 audit |
| `admin/audit-phase2-governance-g3.md` | Phase 2.3-2.6 audit |
| `admin/audit-phase3-4-instructions-hygiene.md` | Phase 3+4 audit |
| `docs/research/workspace-organization-research.md` | Web research: workspace org |
| `docs/research/llm-memory-systems-research.md` | Web research: LLM memory |
| `docs/research/ai-governance-patterns-research.md` | Web research: governance |
| `docs/research/agent-orchestration-patterns-research.md` | Web research: orchestration |
| `docs/research/design-system-organization-research.md` | Web research: design systems |
