# Audit: Phase 1.3 Chronicle Entry Standardization + Phase 1.4 Regulation Lifecycle Metadata

> Auditor: Axis (Claude Code Orchestrator)
> Date: 2026-03-22
> Scope: All chronicle files across 4 projects + all 15 regulations in `rules/regulations/`

---

## Phase 1.3 — Chronicle Entry Standardization

### 1.3.1 Current Entry Format Inventory

**Documented standard** (defined at checkpoint 66, `tlos-chronicle.md` line 2389):
```
<!-- ENTRY:{DATE}:{TYPE}:{ID}:{PROJECT}:{EPIC} -->
```

**Checkpoint skill template** (`~/.claude/commands/checkpointaxis.md` line 66):
```
<!-- ENTRY:[YYYY-MM-DD]:CHECKPOINT:[N+1]:[project]:[epic] [AXIS] -->
```

**Harkly chronicle header** (`harkly-current.md` line 4):
```
> Format: <!-- ENTRY:[YYYY-MM-DD]:[TYPE]:[N]:harkly:[epic] -->
```

**Observation:** The documented standard and the skill template already disagree. The standard uses bare values; the skill wraps date and ID in square brackets `[...]`. The Harkly header shows yet another bracket style (date and type bracketed, ID not).

### 1.3.2 Format Variants Found in Production

I catalogued every entry delimiter across all chronicle and scratch files. **At least 6 distinct formats are in active use:**

| # | Format | Example | Where |
|---|---|---|---|
| 1 | `<!-- ENTRY:DATE:TYPE:ID:PROJECT:EPIC -->` | `<!-- ENTRY:2026-03-14:CHECKPOINT:67:tlos:workspace-consciousness -->` | tlos-chronicle (post-checkpoint 67), harkly-current (sessions 1-7) |
| 2 | `<!-- ENTRY:[DATE]:TYPE:[ID]:[PROJECT]:[EPIC] -->` | `<!-- ENTRY:[2026-03-17]:CHECKPOINT:[137]:[tlos/nospace]:[phase15-content-router...] -->` | tlos-current (checkpoint 137, 138, 148, 149) |
| 3 | `<!-- ENTRY:DATE:TYPE:ID:PROJECT:EPIC [AGENT] -->` | `<!-- ENTRY:2026-03-17:CHECKPOINT:139:tlos:tlos-phase15 [AXIS] -->` | tlos-current (139+), harkly-current (sessions 8+), contexter-current, scratches |
| 4 | `<!-- CHECKPOINT:ID:DATE:EPIC -->` | `<!-- CHECKPOINT:78:2026-03-14:phase-10-analysis:design-bauhaus -->` | tlos-chronicle (oldest entries, pre-standardization) |
| 5 | `<!-- CHECKPOINT:ID \| DATE \| EPIC -->` | `<!-- CHECKPOINT:82 \| 2026-03-14 \| phase-10-analysis:design-bauhaus -->` | tlos-chronicle (checkpoint 82, transitional) |
| 6 | `<!-- CHRONICLE:DATE:TYPE:ID:PROJECT:EPIC [AGENT] -->` | `<!-- CHRONICLE:2026-03-17:CHECKPOINT:147:tlos:phase15 [AXIS] -->` | tlos-current (checkpoint 147, single occurrence) |

**Project-level differences:**
- **tlos-chronicle.md** (4163+ lines): Pre-checkpoint-67 entries use Format 4 (CHECKPOINT-first, no project field). Post-67 entries gradually shift to Format 1, then Format 3.
- **tlos-current.md** (462 lines): Mixed — Formats 2 and 3 coexist. Brackets appear inconsistently.
- **harkly-current.md** (353 lines): Most consistent. Format 1 for early entries, Format 3 (with [AXIS]) for later.
- **contexter-current.md** (40 lines): Format 3 only (newest project, born with latest convention).
- **nomos-current.md** (14 lines): No entry delimiter at all. Just `## DATE — Session N` with plain markdown.

### 1.3.3 Fields Present vs Missing

| Field | tlos-chronicle (old) | tlos-current | harkly-current | contexter-current | nomos-current |
|---|---|---|---|---|---|
| Date | YES | YES | YES | YES | YES (in heading) |
| Type (CHECKPOINT/CLOSE) | YES | YES | YES | YES | NO |
| Entry ID (sequential N) | YES | YES | YES | YES | YES (in heading) |
| Project | NO (pre-67) / YES (post-67) | YES | YES (always "harkly") | YES | NO |
| Epic | YES | YES | YES | YES | NO |
| Agent ID | NO | Sometimes ([AXIS], [LOGOS]) | Sometimes ([AXIS]) | YES ([AXIS]) | NO |
| Session ID (hash) | NO | NO | NO | NO | NO |
| Git hash | NO | NO | NO | NO | NO |

**Key gaps:**
- **agent_id** appears only as a trailing tag `[AXIS]` in newer entries (post-checkpoint ~138). Not machine-parseable because it sits inside the comment but after the structured fields.
- **session_id** (the 8-hex-char hash from scratch filenames like `1fdcf9a0`) is never recorded in chronicle entries. It only exists in scratch filenames.
- **git hash** is never recorded anywhere in chronicles.

### 1.3.4 Scratch File Format Analysis

Two naming conventions observed:

| Convention | Pattern | Where |
|---|---|---|
| Session-hash based | `{session_id}+{N}-scratch.md` | `tLOS/memory/scratches/`, `tLOS/memory/chronicle/scratches/` |
| Session-based | `session+{N}-scratch.md` | `harkly/memory/` |
| Named | `f79bd6ea+171-scratch.md` | `harkly/memory/` (one instance) |
| Rolling | `session-scratch.md` | `harkly/memory/`, `contexter/memory/` |

Scratch file content follows the same format as chronicle entries (Decisions/Files changed/Completed/In progress/Opened/Notes). When processed, they are either:
- Reduced to a placeholder: `> Placeholder . last processed checkpoint: #N`
- Reduced to a closed marker: `> Closed . Axis . YYYY-MM-DD`
- Drained into chronicle and archived to `chronicle/scratches/`

### 1.3.5 How Checkpoint Skills Write Entries

The `checkpointaxis.md` skill defines the template (Format 2 with brackets):
```markdown
<!-- ENTRY:[YYYY-MM-DD]:CHECKPOINT:[N+1]:[project]:[epic] [AXIS] -->
## [YYYY-MM-DD] -- checkpoint [N+1] [Axis]
```

But actual checkpoint entries show the agent sometimes drops brackets, sometimes doesn't. This is because the template uses bracket-literal placeholder syntax `[YYYY-MM-DD]` which the agent interprets inconsistently: sometimes it treats brackets as "fill in this value" (drops them), sometimes it treats them as literal characters (keeps them).

### 1.3.6 Analysis: Would Structured Headers Break Grep Patterns?

Current grep patterns that would be affected:
- `grep "<!-- ENTRY:" {file}` -- used in `checkpointaxis.md` (Step 2) to count entries. **Would NOT break** as long as the prefix stays `<!-- ENTRY:`.
- `grep -c "<!-- ENTRY:" {scratch}` -- same command, counting entries in scratches.

**Conclusion:** Adding structured headers is safe as long as:
1. The prefix `<!-- ENTRY:` is preserved (grep anchor)
2. New fields are appended, not inserted before DATE
3. A migration script updates old entries or a `<!-- ENTRY_V1:` / `<!-- ENTRY:` dual-format period is used

### 1.3.7 Recommendation: Canonical Entry Format

```
<!-- ENTRY:YYYY-MM-DD:TYPE:ID:PROJECT:EPIC:AGENT -->
```

Where:
- No brackets around any field (eliminates bracket inconsistency)
- AGENT is always present (AXIS, LOGOS, SATOSHI, or SYSTEM)
- Optional extensions via trailing key=value: `session=abc123 git=def456`
- Nomos entries must adopt the format (currently undelimited)

Estimated effort: 2-3 hours for a migration script + manual review of edge cases in tlos-chronicle (Format 4/5 entries).

---

## Phase 1.4 — Regulation Lifecycle Metadata

### 1.4.1 Current Metadata State

All 15 regulation files have a consistent blockquote header pattern:
```markdown
# TITLE
> Applies to: ...
> Authority: ...
> Review: ...
> Tags: [...] (sometimes)
```

**No regulation has YAML frontmatter.** All metadata is in markdown blockquote format.

**Tags field status:**

| Regulation | Has Tags? | Last Modified |
|---|---|---|
| `agent-conduct-regulation.md` | NO | 2026-02-22 |
| `agent-identity-regulation.md` | YES | 2026-02-23 |
| `agent-onboarding-regulation.md` | YES | 2026-02-22 |
| `api-gateway-regulation.md` | YES | 2026-02-23 |
| `claude-agent-orchestration-regulation.md` | YES | 2026-03-02 |
| `code-style-regulation.md` | NO | 2026-02-22 |
| `context-economy-regulation.md` | YES | 2026-02-27 |
| `file-size-regulation.md` | YES | 2026-02-22 |
| `git-regulation.md` | YES | 2026-02-23 |
| `mas-architecture-regulation.md` | YES | 2026-02-23 |
| `memory-regulation.md` | YES | 2026-02-23 |
| `naming-regulation.md` | YES | 2026-02-23 |
| `rbac-regulation.md` | YES | 2026-02-23 |
| `task-management-regulation.md` | YES | 2026-02-23 |
| `vector-search-regulation.md` | YES | 2026-02-23 |

**2 regulations missing Tags:** `agent-conduct-regulation.md`, `code-style-regulation.md`

**No regulation has:**
- `last-reviewed:` date field
- `owner:` field (distinct from Authority)
- `status:` field (ACTIVE/DRAFT/DEPRECATED/SUPERSEDED)
- Version number

### 1.4.2 Staleness Analysis

Every regulation was last modified between 2026-02-22 and 2026-03-02. None has been touched in 20+ days despite the workspace undergoing massive structural changes (Axis/Logos/Satoshi identity migration, handshake deprecation, G3 methodology, Domain Lead pipeline, CLI agents deprecated).

#### Definitely Stale Regulations (content contradicts current practice)

**1. `claude-agent-orchestration-regulation.md` -- CRITICALLY STALE**
- References Qwen and OpenCode as primary coding agents. These are **explicitly deprecated** per CLAUDE.md: "CLI agents (Qwen, OpenCode, Gemini) -- DEPRECATED. Do not use."
- Section 1 says "Claude MUST delegate all feature code to agents (OpenCode, Qwen). Claude does NOT write code." -- This is the opposite of current practice where Claude uses G3 (Player/Coach via Agent tool).
- The entire regulation describes a workflow that no longer exists.
- Tags still list: `[claude, orchestration, qwen, opencode, agents, delegation, verification]`

**2. `memory-regulation.md` -- STALE**
- Built around `merge_to_semantic` tool which **does not exist as implemented code**. No `.ts`, `.py`, `.js`, or `.sh` file implements it. Only referenced in the regulation itself and `task-management-regulation.md`.
- Tiered model (Tier 0-3) does not match current L0-L5 Workspace Consciousness architecture.
- References `scratchpad.md` (Tier 0) -- actual system uses `{session_id}+{N}-scratch.md`.
- References `commit-summary.md` as a handoff artifact -- not used in current workflow.
- Integrity Hash Protocol (Section 6) references SHA-256 verification by Reviewer Agent -- no evidence this was ever implemented.

**3. `context-economy-regulation.md` -- PARTIALLY STALE**
- Section 5 recommends reading `handshake-harkly.md + current-context-harkly.md` for Harkly work. Handshake files are **deprecated** (per `feedback_no_handshake.md`).
- Section 4 references `/startgsession` -- this skill still exists but is a legacy name (now `startaxis`/`startlogos`/`startsatoshi`).

**4. `agent-conduct-regulation.md` -- PARTIALLY STALE**
- Section 1 says "MUST read the relevant position description" -- position descriptions exist in `rules/position-descriptions/` but are not part of current agent onboarding flow (CLAUDE.md does not reference them).
- Section 3 says "All agent-to-agent handoffs MUST include written context summary in `/memory/logs/agents/`" -- current handoff uses scratch files and chronicle, not log files.
- Section 5 references `/temp/` for intermediate work -- this directory pattern is not used; scratches serve this purpose.

**5. `task-management-regulation.md` -- PARTIALLY STALE**
- Section references `merge_to_semantic` in DoD checklist (item 7) -- tool does not exist.
- References `episodic-context.md` for cycle time tracking -- not practiced.
- References GAIA Benchmark and CLEAR Framework -- ambitious but never operationalized.

**6. `rbac-regulation.md` -- STRUCTURALLY OUTDATED**
- Roles defined do not match current agent topology. Missing: Axis, Logos, Satoshi (the three peer orchestrators). Missing: Domain Lead, Player, Coach (G3 roles).
- Still lists: senior-architect, cto, tech-lead, senior-coder, qa-lead, qa-swarm, devops-lead, sre-lead, monitor-swarm, reviewer, frontend-engineer -- many of these have never been instantiated.
- References `L0-identity.md` for role assignment -- only 2 such files exist (template + comet).
- References `L3-mcp-tools.json` for tool restrictions -- only template has this file.
- Production paths (`/production/{project}/`) are referenced but the production directory is nearly empty.

**7. `agent-identity-regulation.md` -- ASPIRATIONAL/NOT IMPLEMENTED**
- Describes JWT-based identity, SHA-256 file verification, signed handoffs. None of this has been implemented. The current identity system is simply the agent name embedded in entry delimiters `[AXIS]`.

**8. `api-gateway-regulation.md` -- ASPIRATIONAL/NOT IMPLEMENTED**
- Describes a centralized API Gateway that proxies all external calls. No such gateway exists. APIs are called directly with keys stored in `~/.tlos/` files.

**9. `vector-search-regulation.md` -- EXPLICITLY PROACTIVE**
- Header states: `Status: PROACTIVE -- vector search not yet deployed.` Self-aware that it is not yet applicable.
- References `query-mcp-ts` tool from `L3-mcp-tools.json` -- `query_codebase` exists as a JSON spec but has `"implementation_status": "planned"`.

#### Likely Still Valid (but need review)

**10. `code-style-regulation.md`** -- Generic enough to remain valid. Missing Tags field.

**11. `file-size-regulation.md`** -- References `semantic-context.md` sizes (300/500 line thresholds) which still exist. Core principle valid.

**12. `git-regulation.md`** -- Basic git workflow. Likely still valid but needs check against current commit practices (e.g., `--author="{Orch}"` pattern not mentioned).

**13. `naming-regulation.md`** -- Naming conventions. References tag vocabulary from `semantic-context-{scope}.md`. Still valid in principle.

**14. `agent-onboarding-regulation.md`** -- Still referenced from CLAUDE.md. But references `episodic-context-global.md` in checklist which is rarely used. Also references `semantic-context-{project}.md` which exists but is not actively maintained.

**15. `mas-architecture-regulation.md`** -- High-level architecture principles. References `query_codebase(query, scope)` tool (planned, not built). Core principles (Leads + Swarms) align with Domain Lead + G3 but terminology differs.

### 1.4.3 Deprecated References Summary

| Deprecated Concept | Regulations Referencing It | Notes |
|---|---|---|
| Qwen CLI | claude-agent-orchestration (throughout) | Explicitly deprecated in CLAUDE.md |
| OpenCode CLI | claude-agent-orchestration (throughout) | Explicitly deprecated in CLAUDE.md |
| `merge_to_semantic` tool | memory-regulation (6 refs), task-management (2 refs) | Never implemented |
| `handshake-*.md` files | context-economy (1 ref) | Deprecated per feedback_no_handshake.md |
| `commit-summary.md` artifact | memory-regulation (2 refs) | Not used in current workflow |
| `scratchpad.md` (Tier 0) | memory-regulation (1 ref), vector-search (1 ref) | Replaced by `{session}+{N}-scratch.md` |
| Position descriptions | agent-conduct (2 refs) | Exist in `rules/position-descriptions/` but not used in practice |
| `/temp/` directory | agent-conduct (1 ref) | Not used; scratches serve this purpose |
| `/memory/logs/agents/` handoffs | agent-conduct (1 ref) | Handoffs use scratch/chronicle instead |
| JWT/signed handoffs | agent-identity (throughout) | Never implemented |
| API Gateway proxy | api-gateway (throughout) | Never implemented |
| `startgsession` skill | context-economy (1 ref) | Superseded by `startaxis`/`startlogos`/`startsatoshi` |

### 1.4.4 Effort Estimate: Adding Lifecycle Metadata

**Proposed metadata block** (YAML frontmatter):
```yaml
---
status: ACTIVE | DRAFT | DEPRECATED | ASPIRATIONAL
last-reviewed: YYYY-MM-DD
owner: nopoint | senior-architect
version: 1.0
superseded-by: null | filename
---
```

**Effort to add to all 15 files:** ~1 hour mechanical work (add frontmatter, set initial values based on this audit).

**Effort to actually review and update content:** ~4-6 hours total across all 15 files. The 3 critically stale regulations (claude-agent-orchestration, memory, rbac) each need substantial rewrites.

### 1.4.5 Consolidation Analysis (15 -> 8)

**Proposed consolidation map:**

| Current (15) | Proposed (8) | Rationale |
|---|---|---|
| `agent-conduct-regulation.md` + `agent-onboarding-regulation.md` | `agent-conduct-regulation.md` | Onboarding is a subset of conduct. Merge checklist into Section 1. |
| `agent-identity-regulation.md` | ARCHIVE | Never implemented. Move to `.archive/regulations/`. Resurrect when JWT/signing is built. |
| `api-gateway-regulation.md` | ARCHIVE | Never implemented. Move to `.archive/regulations/`. |
| `claude-agent-orchestration-regulation.md` | `orchestration-regulation.md` | Rewrite completely for G3/Domain Lead model. Drop Qwen/OpenCode. |
| `code-style-regulation.md` | `code-style-regulation.md` | Keep as-is (add Tags). |
| `context-economy-regulation.md` | `context-economy-regulation.md` | Update handshake refs, keep core. |
| `file-size-regulation.md` | Merge into `memory-regulation.md` | File size is a memory system concern. |
| `git-regulation.md` | `git-regulation.md` | Keep as-is (review `--author` pattern). |
| `mas-architecture-regulation.md` | `architecture-regulation.md` | Rename, update terminology. |
| `memory-regulation.md` + `file-size-regulation.md` | `memory-regulation.md` | Rewrite for L0-L5 Workspace Consciousness. Drop `merge_to_semantic`. |
| `naming-regulation.md` | `naming-regulation.md` | Keep as-is. |
| `rbac-regulation.md` | `rbac-regulation.md` | Major rewrite: add Axis/Logos/Satoshi, Domain Lead, Player, Coach. |
| `task-management-regulation.md` | `task-management-regulation.md` | Remove `merge_to_semantic` refs, review DoD checklist. |
| `vector-search-regulation.md` | ARCHIVE | Self-declared proactive. Move to `.archive/regulations/`. |

**Result: 15 -> 10 (8 active + 2 could further merge, 3 archived, 2 absorbed)**

**Would consolidation break references?**

Key referencing locations:
- `rules/global-constitution.md` -- lists 10 regulations in hierarchy table. Would need update.
- `.archive/agents/workspace-charter.md` -- archived, no update needed.
- `agents/comet/L0-identity.md` -- references `rbac-regulation.md` (stays).
- `rules/regulations/agent-onboarding-regulation.md` -- references `agent-conduct`, `rbac`, `file-size`. If absorbed, self-reference goes away. Others stay.
- `memory/handshake-assistant.md` -- references "13 files" count. Would need update. (But handshake is deprecated.)
- Cross-references within regulations: `task-management` references `memory-regulation` and `rbac-regulation` (both stay). `vector-search` references `rbac-regulation` (archived, no impact on active).

**Total reference updates needed: ~5-8 files** (constitution, onboarding, a few cross-refs). Low risk.

---

## Summary of Findings

### Phase 1.3 Key Findings
1. **6 distinct entry delimiter formats** are in use across chronicle files
2. The checkpoint skill template itself causes inconsistency (bracket-literal syntax)
3. `agent_id` is only sometimes present and not in a parseable position
4. `session_id` and `git hash` are never in chronicle entries
5. Nomos chronicle has zero structured delimiters
6. Grep patterns (`grep "<!-- ENTRY:"`) would survive format standardization as long as the prefix is preserved

### Phase 1.4 Key Findings
1. **Zero regulations have YAML frontmatter** or lifecycle metadata
2. **2/15 missing Tags field** (agent-conduct, code-style)
3. **3 regulations are critically stale** (claude-agent-orchestration, memory, rbac) -- content directly contradicts current practice
4. **3 regulations describe unimplemented systems** (agent-identity, api-gateway, vector-search)
5. **`merge_to_semantic` tool** referenced in 8 places across 2 regulations -- never implemented
6. All files untouched for 20+ days despite major workspace evolution
7. Consolidation from 15 to ~10 is feasible with ~5-8 reference updates
8. Estimated effort: 1h metadata addition + 4-6h content review/rewrite for stale regulations

### Recommended Priority Order
1. **Rewrite `claude-agent-orchestration-regulation.md`** -- currently prescribes deprecated workflow
2. **Rewrite `memory-regulation.md`** -- tier model does not match L0-L5 reality
3. **Add lifecycle metadata to all 15** -- mechanical, enables future staleness detection
4. **Standardize chronicle entry format** -- fix checkpoint skill template, migrate old entries
5. **Archive 3 aspirational regulations** -- reduce noise for onboarding agents
6. **Rewrite `rbac-regulation.md`** -- add current agent roles
