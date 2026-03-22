# Audit: Phase 2.3 (Governance Consolidation) + Phase 2.4-2.6 (G3 Workflow)
> Date: 2026-03-22
> Auditor: Axis (Orchestrator)
> Scope: All 15 regulations + G3 workflow analysis
> Input: `admin/restructuring-proposal.md` Phases 2.3-2.6

---

## PART A — Phase 2.3: Governance Consolidation (15 -> 8 + tooling)

### Summary of All 15 Regulations

| # | File | Lines | YAML Frontmatter | Tags | Core Content | Enforced by Tooling? | Cross-References |
|---|---|---|---|---|---|---|---|
| 1 | `agent-conduct-regulation.md` | 41 | No (blockquote header) | No | Behavior rules: scope discipline, communication protocol, failure handling, memory hygiene | No (pure prose) | References position descriptions, `/memory` paths |
| 2 | `agent-identity-regulation.md` | 135 | No (blockquote header) | Yes: `[agent-identity, jwt, signing, impersonation, authentication, mas]` | JWT session identity tokens (SIT), artifact signing, MCP auth, revocation. Phase 1 (manual) active. | No (Phase 2-3 planned but not built) | References `api-gateway-regulation.md` SS8, `private_knowledge`, RBAC |
| 3 | `agent-onboarding-regulation.md` | 74 | No (blockquote header) | Yes: `[onboarding, agent, setup, checklist, initialization]` | Pre-flight checklist (4 blocks: ID, rules, context, init). Offboarding steps. Common errors table. | No (pure prose checklist) | References `agent-conduct-regulation.md`, `rbac-regulation.md`, `file-size-regulation.md` |
| 4 | `api-gateway-regulation.md` | 126 | No (blockquote header) | Yes: `[api-gateway, keys, secrets, proxy, audit, revocation]` | API key management, gateway proxy architecture, token types (session/deploy/monitor/emergency), threat model for /private_knowledge, age encryption. | Partially (approval-router.ts exists) | References RBAC, `private_knowledge`, `memory/logs` |
| 5 | `claude-agent-orchestration-regulation.md` | 102 | No (blockquote header) | Yes: `[claude, orchestration, qwen, opencode, agents, delegation, verification]` | Claude = Coach not Coder, agent selection (Qwen/OpenCode), prompt composition rules, verification protocol, parallelism limits. | No (pure prose) | No direct cross-refs to other regulations |
| 6 | `code-style-regulation.md` | 57 | No (blockquote header) | No | Code quality: simplicity, file/function size limits (400/30 lines), type contracts, error handling, safety, scalability, agent-readable naming. | No (no linter enforces it) | No cross-refs |
| 7 | `context-economy-regulation.md` | 99 | No (blockquote header) | Yes: `[context, tokens, economy, limits, efficiency, assistant]` | Token budget discipline, cost estimation before operations, minimal reading principle, session monitoring, /continue protocol. | No (pure prose) | No direct cross-refs to other regulations |
| 8 | `file-size-regulation.md` | 65 | No (blockquote header) | Yes: `[file-size, alerts, memory, tokens, context]` | File size limits table (soft/hard by type), alert system (check before reading), semantic-context special rules, monitoring. | No (could be a pre-commit hook) | References semantic-context files, SRE Lead |
| 9 | `git-regulation.md` | 175 | No (blockquote header) | Yes: `[git, commits, branches, push, credential, hooks]` | Git identity, credential management, branch topology, commit message format, pre-commit/commit-msg hooks, push protocol, PR protocol, config reference. | Yes (pre-commit + commit-msg hooks exist) | References `agent-identity-regulation.md` (SIT for author identity) |
| 10 | `mas-architecture-regulation.md` | 102 | No (blockquote header) | Yes: `[MAS, architecture, paradigms, DAG, MoE, RAG, verification, blackboard]` | MAS paradigm choices: Verification-Aware Planning, DAG Handoff Flow, MoE routing for QA/SRE, Dynamic RAG (query_codebase). Rejected: Blackboard, Full DAG. | No (architectural reference) | References LangGraph, Airflow, VeriMAP, `query_codebase` tool |
| 11 | `memory-regulation.md` | 120 | No (blockquote header) | Yes: `[memory, regulation, consolidation, handoff, decay]` | 4-tier memory model, merge_to_semantic handoff protocol, consolidation schedule (every 10 commits), decay policy (90 days), integrity hash protocol (SHA-256). | Partially (merge_to_semantic tool, integrity hash tool) | References `episodic-context`, `semantic-context`, LLM04 threat |
| 12 | `naming-regulation.md` | 168 | No (blockquote header) | Yes: `[naming, semantic-search, grep, discoverability, conventions]` | File naming patterns by category (regulations, PDs, ADRs, memory, logs, branches, specs, MCP, scripts, research). Tags requirement. Forbidden patterns. | No (could be ls-lint) | References `memory-regulation.md`, branch protocol |
| 13 | `rbac-regulation.md` | 195 | No (blockquote header) | Yes: `[RBAC, permissions, roles, access-control, security]` | Complete role registry (YAML), 14 roles with read/write/secret permissions. PoLP. Audit requirements. | Partially (enforced by agent prompts, not programmatically) | References `L0-identity.md`, `L3-mcp-tools.json` |
| 14 | `task-management-regulation.md` | 281 | No (blockquote header) | Yes: `[task-management, lifecycle, gaia, clear, dor, dod, hitl, audit, mas]` | GAIA levels (L1-L3), token budgets, DoR/DoD checklists, HITL triggers, CLEAR metrics, audit trail (EU AI Act), retrospective cycle. | Partially (L4-guardrails.yaml for token budgets, approval-router.ts for HITL) | References `memory-regulation.md`, `rbac-regulation.md`, `L4-guardrails.yaml`, `approval-router.ts`, spec/commit-summary templates |
| 15 | `vector-search-regulation.md` | 113 | No (blockquote header) | Yes: `[vector-search, rag, embedding, retrieval, llm08, semantic-context]` | PROACTIVE regulation (vector search not yet deployed). Pre-conditions, corpus integrity, retrieval security, prohibited patterns, recommended stack. | No (not yet deployed) | References `memory-regulation.md` SS6, `agent-identity-regulation.md`, `query-mcp-ts` |

### Total Lines: 1,853 across 15 files

---

### Detailed Verdicts

#### 1. agent-conduct-regulation.md (41 lines)
**Core value:** General agent behavior rules (scope, communication, failure handling, memory hygiene).
**Overlap:** SS2 (scope discipline) overlaps with RBAC. SS5 (memory hygiene) overlaps with memory-regulation. SS3 (communication) is unique.
**Verdict:** KEEP. Small, foundational. Covers behavior that no other regulation addresses (failure handling, communication protocol). Could absorb agent-identity SS1 principles.

#### 2. agent-identity-regulation.md (135 lines)
**Core value:** JWT-based agent identity, artifact signing, MCP auth headers.
**Overlap:** Phase 1 is "manual verification via Assistant's judgment" -- essentially a convention, not enforcement.
**Reality check:** Phase 2-3 (HTTP server, RS256 keypairs) are planned but unbuilt. The regulation describes a FUTURE system, not current state.
**Verdict:** MERGE into agent-conduct-regulation. Add a "Phase 1 Identity" section (10-15 lines). The JWT spec can move to `.archive/` as reference for when Phase 2 is built. Current enforcement = zero.

#### 3. agent-onboarding-regulation.md (74 lines)
**Core value:** Pre-flight checklist before any agent acts. Referenced by CLAUDE.md entry point.
**Overlap:** Minimal. This is the only onboarding document.
**Critical path:** Referenced from top-level CLAUDE.md as Step 2. Every agent session reads this.
**Verdict:** KEEP. Essential for agent initialization. High reference count.

#### 4. api-gateway-regulation.md (126 lines)
**Core value:** API key management, gateway proxy, token lifecycle, threat model, age encryption.
**Reality check:** The gateway architecture (`/tools/api-gateway`) does not exist as a deployed service. Keys are currently managed manually via `~/.tlos/` files. The approval-router.ts partially exists.
**Overlap:** SS8 (threat model) is valuable security reference but describes aspirational state.
**Verdict:** REPLACE. Extract the 3 actionable rules (never hardcode keys, mask in logs, token types) into agent-conduct or a security section. The gateway architecture description moves to `.archive/` -- it describes an unbuilt system.

#### 5. claude-agent-orchestration-regulation.md (102 lines)
**Core value:** Claude delegation rules, agent selection, prompt composition, verification protocol.
**Reality check:** HEAVILY OUTDATED. References Qwen CLI and OpenCode (MiniMax) as primary agents. These are deprecated per MEMORY.md: "CLI agents (Qwen, OpenCode, Gemini) -- DEPRECATED. Do not use." The current system uses Agent tool (Claude subagents), not CLI agents.
**Overlap:** The CLAUDE.md Orchestrator Protocol + `agents.md` + Domain Lead INSTRUCTION.md have superseded most of this content.
**Verdict:** REWRITE. The regulation's core intent (Claude = Coach, delegate, verify) is valid, but 80% of the content (Qwen/OpenCode specifics, CLI commands, `--approval-mode yolo`) is dead. Rewrite as "orchestration-regulation.md" focused on: (1) Claude = Orchestrator, (2) Domain Lead delegation, (3) G3 protocol, (4) verification rules. Absorb from `agents.md` and INSTRUCTION.md.

#### 6. code-style-regulation.md (57 lines)
**Core value:** Code quality principles, size limits, type contracts, error handling.
**Overlap:** Duplicates `~/.claude/rules/coding-style.md` (the CLAUDE.md rules file). Both define file size limits (400 vs 200-400 lines), both mandate immutability, both require error handling.
**Reality check:** No linter or formatter enforces this. Agents read it if they follow onboarding, but compliance is honor-system.
**Verdict:** REPLACE with tooling. The `.editorconfig` + biome/eslint configs + pre-commit hook for file size can enforce 80% of this. Keep a 10-line summary in agent-conduct for the principles (simplicity, single responsibility). Archive the full text.

#### 7. context-economy-regulation.md (99 lines)
**Core value:** Token discipline, cost estimation, minimal reading, /continue protocol.
**Overlap:** CLAUDE.md already has a "Context -- different rules for different roles" section that covers Orchestrator vs subagent context rules.
**Reality check:** Actively relevant. Token economy is the most frequently encountered constraint in practice.
**Verdict:** KEEP. Unique content, high practical value. The CLAUDE.md section is a summary; this regulation has the full rules.

#### 8. file-size-regulation.md (65 lines)
**Core value:** File size limits table, alert system.
**Overlap:** Code-style regulation also has size limits. The specific memory file limits (scratchpad 200/400, current-context 100/150, etc.) are unique to this file.
**Reality check:** No automated enforcement. Agents occasionally check, but the "STOP reading at hard limit" rule is never enforced.
**Verdict:** REPLACE with tooling. The limits table can become a pre-commit hook config or a PreToolUse hook. Memory file limits can be a simple JSON config that hooks check. Archive the prose.

#### 9. git-regulation.md (175 lines)
**Core value:** Git identity, branch topology, commit format, hooks, push/PR protocol.
**Overlap:** `~/.claude/rules/git-workflow.md` has commit message format and PR workflow.
**Reality check:** PARTIALLY ENFORCED. pre-commit and commit-msg hooks exist and work. Branch naming and push rules are honor-system.
**Verdict:** KEEP. The hooks provide real enforcement. The regulation documents the full protocol. High reference count from episodic-context and CLAUDE.md.

#### 10. mas-architecture-regulation.md (102 lines)
**Core value:** Architectural paradigm choices and rationale (Verification Gates, DAG, MoE, RAG). Rejected alternatives.
**Overlap:** The agent hierarchy is also in `agents/ecosystem-map.md`. The verification gates concept is also in task-management-regulation.
**Reality check:** This is a reference/ADR document, not an operational regulation. No agent needs to "follow" it during execution -- it records decisions already made.
**Verdict:** MERGE into `agents/ecosystem-map.md` as an "Architecture Decisions" section, or convert to a proper ADR. It is not a regulation (no rules to follow, only rationale for past decisions).

#### 11. memory-regulation.md (120 lines)
**Core value:** 4-tier memory model, merge_to_semantic protocol, consolidation schedule, decay policy, integrity hash.
**Overlap:** File-size-regulation covers some memory file limits.
**Reality check:** The integrity hash protocol is sophisticated but rarely executed. The tier model is fundamental to workspace operation.
**Verdict:** KEEP. Core operational regulation. Could absorb vector-search-regulation when RAG activates. The integrity hash section could absorb from file-size the memory-specific limits.

#### 12. naming-regulation.md (168 lines)
**Core value:** File naming conventions by category, tags requirements, forbidden patterns.
**Overlap:** None -- this is the only source for naming rules.
**Reality check:** Agents generally follow conventions because examples exist, not because they read this regulation. The conventions are already implicit in the directory structure.
**Verdict:** REPLACE with tooling. An `ls-lint.yaml` config can enforce naming patterns. The directory structure itself serves as the convention. Archive the regulation, keep a brief conventions section in an onboarding doc.

#### 13. rbac-regulation.md (195 lines)
**Core value:** Complete YAML role registry with read/write/secret permissions for 14 roles.
**Overlap:** None -- single source of truth for permissions.
**Reality check:** CORE REGULATION. Every agent references this. The YAML block is the canonical permission table.
**Verdict:** KEEP. Non-negotiable. This is the most referenced regulation.

#### 14. task-management-regulation.md (281 lines)
**Core value:** GAIA levels, token budgets, DoR/DoD checklists, HITL triggers, CLEAR metrics, audit trail, retrospective.
**Overlap:** Token budgets relate to context-economy. Verification gates relate to mas-architecture.
**Reality check:** The LONGEST regulation. Contains valuable but dense content. GAIA levels are used in practice. CLEAR metrics and EU AI Act audit trail are aspirational.
**Verdict:** KEEP but TRIM. The GAIA levels (SS2) + DoR/DoD (SS4/SS6) + HITL triggers (SS7) are essential (~120 lines). The CLEAR framework (SS8) and EU AI Act audit (SS9) and retrospective (SS10) are aspirational and rarely referenced. Move SS8-SS10 to `.archive/` or a separate reference doc.

#### 15. vector-search-regulation.md (113 lines)
**Core value:** Pre-conditions for vector search, corpus integrity, retrieval security.
**Status:** PROACTIVE -- vector search not yet deployed.
**Overlap:** References memory-regulation SS6 (integrity hash).
**Reality check:** Entirely forward-looking. Zero operational impact today.
**Verdict:** MERGE into memory-regulation as a "Future: Vector Search" appendix section. When RAG activates, expand back into its own regulation. Currently consuming index space for zero value.

---

### Consolidation Summary

| Current Count | Proposed Count | Delta |
|---|---|---|
| 15 regulations | 8 prose + 3 tooling configs | -4 net (7 eliminated/merged) |

| Verdict | Regulations | Action |
|---|---|---|
| **KEEP (no change)** | rbac, agent-conduct, context-economy, agent-onboarding, git, memory | 6 regulations stay |
| **KEEP but TRIM** | task-management | Remove SS8-SS10 (aspirational metrics/audit) to archive |
| **REWRITE** | claude-agent-orchestration | Completely rewrite; 80% of content references deprecated CLI agents |
| **MERGE** | agent-identity -> agent-conduct | Add 10-15 line "Identity" section |
| **MERGE** | vector-search -> memory | Add "Future: Vector Search" appendix |
| **MERGE** | mas-architecture -> ecosystem-map.md or ADR | Not a regulation; it's architectural rationale |
| **REPLACE with tooling** | naming -> ls-lint.yaml | Convention enforcement via linter |
| **REPLACE with tooling** | file-size -> pre-commit hook config | Automated size checks |
| **REPLACE with tooling** | code-style -> .editorconfig + linter | Keep 10-line principles summary in agent-conduct |
| **REPLACE (archive)** | api-gateway | Extract 3 key rules to agent-conduct security section |

### Proposed Final 8

1. `rbac-regulation.md` (195 lines, unchanged)
2. `agent-conduct-regulation.md` (~80 lines, absorbs identity principles + security rules from api-gateway + code-style principles)
3. `context-economy-regulation.md` (99 lines, unchanged)
4. `agent-onboarding-regulation.md` (74 lines, unchanged)
5. `git-regulation.md` (175 lines, unchanged)
6. `memory-regulation.md` (~140 lines, absorbs vector-search appendix)
7. `task-management-regulation.md` (~180 lines, trimmed: SS8-SS10 to archive)
8. `orchestration-regulation.md` (~80 lines, REWRITE of claude-agent-orchestration to reflect Domain Lead + G3 + Agent tool reality)

**Total estimated: ~1,023 lines (down from 1,853 = -45%)**

### Files Requiring Update After Consolidation

| File | Change Needed |
|---|---|
| `rules/global-constitution.md` SS6 | Remove 7 regulation entries, update table |
| `CLAUDE.md` | Update any regulation references |
| `agents/ecosystem-map.md` | Add MAS architecture rationale section |
| `rules/regulations/agent-onboarding-regulation.md` SS2.B | Update referenced regulation list |
| `rules/regulations/naming-regulation.md` | Archive (replaced by ls-lint.yaml) |
| `docs/ecosystem-noadmin/explanation/owasp-llm-security-audit.md` | Update regulation references |
| `memory/episodic-context-global.md` | Record consolidation event |

### Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| Agents reference archived regulations | LOW | Archived files get a redirect header: "Merged into X, see Y" |
| Tooling not yet created (ls-lint, hooks) | MEDIUM | Keep regulation text until tooling is confirmed working |
| Orchestration regulation rewrite loses nuance | MEDIUM | Read current G3 skill + INSTRUCTION.md carefully during rewrite |
| agent-conduct becomes too long after merges | LOW | Current 41 lines + ~40 absorbed = ~80 lines, well under 120 line limit |

---

## PART B — Phase 2.4-2.6: G3 Workflow Analysis

### B.1 Current G3 Flow (as-is)

Based on analysis of:
- `/nospace/agents/domain-lead/INSTRUCTION.md` (284 lines)
- `~/.claude/commands/g3.md` (238 lines, the `/g3` skill)
- Sample specs: `g3-plan/tlos-09-*.md`
- Sample reviews: `.g3/sessions/tlos-09-review-a.md`

#### Two G3 Variants Exist

**Variant A: Domain Lead G3** (INSTRUCTION.md)
```
Orchestrator
  -> Domain Lead (general-purpose subagent)
       Phase 1: Audit domain files
       Phase 2: Write spec
       Phase 3: Launch G3 pair
         -> Player (specialized subagent) <- receives full spec inline
         -> Coach (general-purpose subagent) <- receives spec + Player report
       Phase 4: Iterate (max 3 rounds) -> Report to Orchestrator
```

**Variant B: /g3 Skill** (g3.md slash command)
```
Claude = Coach (directly, in main context)
  Step 1: Clarify (questions to user)
  Step 2: Setup g3-plan/ directory + requirements contract
  Step 3: Run Qwen CLI as Player (one subtask per invocation)
  Step 4: Coach Review (Claude reads code independently)
  Step 5: Feedback loop (max iterations)
```

**Critical finding:** Variant B is DEPRECATED. It uses Qwen CLI (`--approval-mode yolo`), which is deprecated per MEMORY.md. Variant A (Domain Lead) is the active workflow.

#### Current G3 Steps (Variant A, active)

| Step | Actor | Action |
|---|---|---|
| 1 | Orchestrator | Clarify -> Formalize (2-4 sentence task) |
| 2 | Orchestrator | Hand off to Domain Lead |
| 3 | Domain Lead | Audit domain files |
| 4 | Domain Lead | Write self-contained spec (template in INSTRUCTION.md) |
| 5 | Domain Lead | Dispatch Player with spec inline |
| 6 | Player | Implement from spec, report: DONE/BLOCKED/NEEDS_CONTEXT |
| 7 | Domain Lead | Dispatch Coach with spec + Player's claimed changes |
| 8 | Coach | Independent code review: spec compliance first, then code quality |
| 9 | Coach | Report: Approved or Issues (with specific fixes) |
| 10 | Domain Lead | If issues: re-dispatch Player with feedback (max 3 iterations) |
| 11 | Domain Lead | Report to Orchestrator with AC table |

---

### B.2 Confidence Pre-flight Assessment (Phase 2.4)

#### Current State

**There is NO confidence pre-flight step.** Player receives the spec and starts implementing immediately. The only safety valve is:
- Player can report `NEEDS_CONTEXT` or `BLOCKED` status
- But this happens AFTER the Player has already consumed tokens attempting implementation
- There is no structured self-assessment before work begins

The task-management-regulation (SS6) mentions "Confidence Score >= 70" as a DoD requirement, but this is a POST-completion metric, not a PRE-flight check.

#### What the Proposal Suggests

From `restructuring-proposal.md` Phase 2.4:
```
Before implementing, Player outputs:
1. Confidence score (0-100)
2. Identified gaps or ambiguities in spec
3. Questions for Coach/Lead
If confidence < 70 OR gaps found: -> Return NEEDS_CONTEXT
```

#### Analysis

| Aspect | Current State | Proposed Change | Risk | Dependencies |
|---|---|---|---|---|
| Player pre-assessment | None | Player outputs confidence + gaps before coding | LOW -- adds ~200 tokens per Player launch | Modify Domain Lead INSTRUCTION.md Player Prompt |
| Spec gap detection | Post-hoc (Player discovers during implementation) | Pre-hoc (Player scans spec, flags gaps) | LOW | None |
| Token waste prevention | Player burns full cycle on ambiguous spec | Player returns early if confidence < 70 | MEDIUM benefit -- prevents wasted iterations | Domain Lead must handle NEEDS_CONTEXT flow |
| Implementation effort | N/A | ~15 lines added to Player Prompt template in INSTRUCTION.md | LOW | None |

#### What Would Need Changing

1. **`nospace/agents/domain-lead/INSTRUCTION.md`** Phase 3, Player Prompt section:
   - Add a "Pre-flight" block before "Your Job" section
   - Player must output confidence score + gap list as FIRST action
   - Add routing: if confidence < 70, report NEEDS_CONTEXT immediately

2. **`~/.claude/commands/g3.md`** (if kept):
   - Add Step 2.5: Player Pre-flight before Step 3

3. **`nospace/rules/regulations/task-management-regulation.md`** SS6:
   - Change Confidence Score from DoD-only to DoR+DoD metric

#### Recommendation

**IMPLEMENT.** Low effort (15 lines), high value. The Google 17.2x error amplification data cited in the proposal is real -- a Player that starts with a misunderstanding amplifies the error through the entire implementation. Early abort saves 1 full Player + Coach cycle.

---

### B.3 Coach Grading Method

#### Current State

Coach currently grades on TWO dimensions, in strict order:

**Review 1: Spec Compliance** (mandatory first)
- Did Player implement everything in spec?
- Did Player overbuild (add things not in spec)?
- Did Player break frozen interfaces?
- Do verification commands produce expected output?

**Review 2: Code Quality** (only after Review 1 passes)
- Single responsibility per file
- Clear naming
- Follows existing patterns
- YAGNI (no unnecessary abstractions)
- Backend: NEVER raises pattern
- Frontend: frame patterns

#### Assessment

Coach grades **outcomes** (spec compliance) FIRST, then **implementation quality** SECOND. This is correct and aligns with the research finding that outcome-based grading is more effective than implementation-path grading.

However, Coach does NOT currently:
- Assign a numerical confidence/quality score
- Grade decomposability of remaining work
- Assess whether the task should have been split differently
- Record structured metrics (only prose report)

#### Proposed Change (from audit perspective)

| Aspect | Current State | Proposed Change | Risk |
|---|---|---|---|
| Grading order | Spec compliance first, quality second | No change needed -- already correct | N/A |
| Structured scoring | Prose only ("Approved" / "Issues") | Add structured fields: compliance_score (0-100), quality_score (0-100) | LOW -- slight overhead |
| Retrospective input | Coach findings stay in review files | Coach findings should feed into decisions.md (Phase 2.6) | MEDIUM -- requires new workflow step |

---

### B.4 Decomposability Tagging (Phase 2.5)

#### Current State

**There is NO decomposability assessment.** The Orchestrator Protocol (CLAUDE.md) says "Decompose + Hand off -- launch Domain Leads in parallel for independent domains." But there is no explicit check for whether domains are truly independent.

The `agents.md` file mentions parallel Domain Leads:
```
# GOOD: parallel leads
Orchestrator launches simultaneously:
- Lead/Frontend: shell UI changes
- Lead/Backend: NATS handler changes
```

But this is example-based guidance, not a structured assessment step.

#### What the Proposal Suggests

Before launching Domain Leads, Orchestrator explicitly tags:
```
## Task Assessment
- Domain A (frontend): decomposable=true, parallel OK
- Domain B (backend): decomposable=true, parallel OK
- Domain C (migration): decomposable=false, MUST run after A+B
```

#### Analysis

| Aspect | Current State | Proposed Change | Risk | Dependencies |
|---|---|---|---|---|
| Parallel safety check | Implicit (Orchestrator judgment) | Explicit tagging per domain | LOW -- adds ~100 tokens to Formalize step | Modify CLAUDE.md Orchestrator Protocol |
| Sequential dependency detection | Not tracked | Explicit MUST-run-after annotation | MEDIUM benefit -- prevents -39% to -70% penalty cited in proposal | None |
| Implementation effort | N/A | ~10 lines added to Orchestrator Protocol in CLAUDE.md | LOW | None |

#### What Would Need Changing

1. **CLAUDE.md** Orchestrator Protocol, step 4 "Decompose + Hand off":
   - Add mandatory decomposability assessment block
   - Template: domain, decomposable (true/false), dependencies, parallel OK (true/false)

2. **`~/.claude/rules/agents.md`** "Parallel Domain Leads" section:
   - Add decomposability check as prerequisite

3. **Optional:** Domain Lead INSTRUCTION.md could include a "dependency check" where Lead verifies its domain is truly independent before starting.

#### Recommendation

**IMPLEMENT.** Very low effort, prevents a known failure mode. The explicit tagging also creates an audit trail for why certain tasks were parallelized (or not).

---

### B.5 decisions.md per Project (Phase 2.6)

#### Current State

**Partially exists.** One `decisions.md` file found:
- `nospace/development/harkly/memory/decisions-harkly.md` (127 lines, 17 decision entries)

**Does NOT exist for tLOS.** No `decisions-tLOS.md` found.

The Harkly decisions file follows this format:
```
## YYYY-MM-DD -- Topic
- Decision point 1
- Decision point 2
```

It is append-only, covers stack choices, architectural patterns, and session outcomes. This is exactly the pattern the proposal describes.

#### Analysis

| Aspect | Current State | Proposed Change | Risk | Dependencies |
|---|---|---|---|---|
| Harkly decisions | EXISTS (127 lines, working) | Formalize format, ensure Domain Leads append | LOW | None |
| tLOS decisions | MISSING | Create `development/tLOS/memory/decisions-tLOS.md` | LOW | Seed with existing architectural decisions from chronicle |
| Domain Lead workflow | Leads write specs, not decisions | Leads append architectural decisions during spec creation | MEDIUM -- adds a step to Lead workflow | Modify INSTRUCTION.md Phase 2 |
| Orchestrator pre-check | No check for prior decisions | Orchestrator reads decisions.md before making architectural calls | LOW -- one Read call | Modify CLAUDE.md Clarify step |

#### What Would Need Changing

1. **Create:** `nospace/development/tLOS/memory/decisions-tLOS.md` (seeded from chronicle)
2. **`nospace/agents/domain-lead/INSTRUCTION.md`** Phase 2:
   - Add step: "Before writing spec, read `decisions-{project}.md` for relevant prior decisions"
   - Add step: "If making a new architectural decision, append to `decisions-{project}.md`"
3. **CLAUDE.md** Orchestrator Protocol, step 1 "Clarify":
   - Add: "Read `decisions-{project}.md` to check for prior decisions on the topic"
4. **RBAC:** decisions.md write access for Domain Lead and higher (currently covered by `development/{project}/memory/**` write for tech-lead+ roles)

#### Recommendation

**IMPLEMENT.** Harkly already proves the pattern works. tLOS needs the file created. The GitHub Squad research cited in `docs/research/agent-orchestration-patterns-research.md` specifically validates this approach as "repository-native coordination."

---

### B.6 /g3 Skill Status

#### Current State

The `/g3` skill (`~/.claude/commands/g3.md`, 238 lines) is **functionally deprecated** because:
1. It uses Qwen CLI (`qwen --approval-mode yolo`) -- deprecated
2. It uses OpenCode (MiniMax) -- deprecated
3. It casts Claude as Coach in main context (burns Orchestrator tokens on review)
4. The Domain Lead workflow (INSTRUCTION.md) has replaced it with subagent-based G3

#### Recommendation

**REWRITE** the `/g3` skill to match the Domain Lead workflow:
- Remove all Qwen/OpenCode references
- Make it a launcher for Domain Lead (subagent), not a direct Coach session
- Keep the requirements contract concept (useful for structuring input)
- Keep the review format (consistent with INSTRUCTION.md Coach prompt)

---

## PART C -- Cross-cutting Dependencies

### Implementation Order

```
Phase 2.3 (Governance):
  Step 1: Archive 7 regulations (no dependencies)
  Step 2: Merge agent-identity -> agent-conduct
  Step 3: Merge vector-search -> memory
  Step 4: Merge mas-architecture -> ecosystem-map
  Step 5: Rewrite claude-agent-orchestration -> orchestration
  Step 6: Update global-constitution SS6 table
  Step 7: Update agent-onboarding checklist
  Step 8: Create tooling configs (ls-lint, pre-commit hooks)

Phase 2.4 (Confidence Pre-flight):
  Step 1: Modify INSTRUCTION.md Player Prompt (depends on 2.3 Step 5 if orchestration rewrite happens first)

Phase 2.5 (Decomposability):
  Step 1: Modify CLAUDE.md Orchestrator Protocol
  Step 2: Modify agents.md

Phase 2.6 (decisions.md):
  Step 1: Create decisions-tLOS.md
  Step 2: Modify INSTRUCTION.md Phase 2
  Step 3: Modify CLAUDE.md Clarify step
```

Phases 2.4, 2.5, 2.6 are independent of each other but all depend on Phase 2.3 being at least partially complete (especially the orchestration rewrite).

### Estimated Effort

| Phase | Files Changed | Lines Changed (est.) | Effort |
|---|---|---|---|
| 2.3 Governance | ~15 files (7 archive + 4 merge/rewrite + 4 reference updates) | ~400 lines net reduction | MEDIUM (2-3 sessions) |
| 2.4 Confidence | 2-3 files (INSTRUCTION.md, g3.md, task-management) | ~30 lines added | LOW (1 session) |
| 2.5 Decomposability | 2 files (CLAUDE.md, agents.md) | ~15 lines added | LOW (30 min) |
| 2.6 decisions.md | 3-4 files (create 1, modify 2-3) | ~50 lines | LOW (1 session) |
