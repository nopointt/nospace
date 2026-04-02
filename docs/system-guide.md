# System Guide — /nospace Workspace

> How everything works. The canonical reference for workspace architecture.
> This file is exempt from file size regulations — it describes the full system.
> Last updated: 2026-04-02 (session 228 — standards + reglaments system)

---

## 1. Entry Points

| Context | What to do |
|---|---|
| New session, any project | `/startaxis` (code/arch) or `/startlogos` (data/DB) or `/startsatoshi` (finance) |
| Global overview | `/startgsession` |
| Resume after compact/new dialog | `/continueaxis` / `/continuelogos` / `/continuesatoshi` |
| Mid-session save | `/checkpointaxis` (normal) or `/checkpointaxis-fast` (urgent, 99% context) |
| End session | `/closeaxis` / `/closelogos` / `/closesatoshi` |
| Memory consolidation (every 5-10 sessions) | `/dream` |
| G3 coding session | `/g3` |
| Quality self-audit | `/checkstandards` |
| Sync to GitHub for Comet | `/sync` |
| Anthropic intelligence | `/aia` (explicit request only) |

---

## 2. Quality System (3 layers)

The quality system has three layers that load at different times:

### Layer 1: Standards (always loaded, every prompt)

**File:** `~/.claude/rules/standards.md`
- 49 standards total: 13 CRITICAL, 29 REQUIRED, 7 RECOMMENDED
- RFC 2119 severity (MUST / MUST NOT / SHOULD)
- Each standard has: ID, rule, test, origin + trigger incident
- 9 sections: A (Verification), B (Process), C (Orchestration), D (Communication), E (Research), F (Cost), G (Safety), H (Code Quality), I (Operational)

**Execution order** (first three steps of any task):
1. **B8** — load matching reglament (hook reminds automatically)
2. **B1** — clarify understanding, ask questions, wait for "ok"
3. **A5** — assess blast radius before any code change

Key CRITICAL standards:
- A1: verify before asserting (read actual files)
- A5: blast radius assessment before ANY code change
- B1: clarify before coding (wait for "ok")
- B2: wait for explicit confirmation (silence ≠ consent)
- B3: do it right, not easy (quality > speed)
- B8: load reglament before process
- C3: no delegation of audits
- G1: never delete files or nodes

### Layer 2: Reglaments Index (always loaded, every prompt)

**File:** `~/.claude/rules/reglaments-index.md`
- ~1K tokens, contains ONLY the index (names, triggers, paths)
- Does NOT contain the reglaments themselves
- Includes per-project sections: foundations, design guidelines, brand guidelines

### Layer 3: Reglaments (loaded on-demand via Read)

**Directory:** `~/.claude/reglaments/` (NOT in rules/, NOT auto-loaded)

| Reglament | Trigger |
|---|---|
| `research.md` | Any research task |
| `bug-diagnosis.md` | Bug fix, crash, error |
| `g3-session.md` | Launching G3 pair |
| `agent-orchestration.md` | Launching/managing agents |
| `design-transfer.md` | Pencil-to-code, UI work |
| `brand-voice.md` | User-facing copy, marketing |
| `security-audit.md` | Security review, deploy |
| `deploy.md` | Production deployment |
| `git-workflow.md` | Commits, branches, PRs |
| `context-economy.md` | Every session (blast radius, smart reading) |

### Enforcement Mechanism

Three levels ensure reglaments are actually loaded:

1. **Hook (mechanical):** `reglament-trigger.ts` in UserPromptSubmit — parses nopoint's prompt for trigger keywords (RU+EN), emits system-reminder telling Orchestrator which reglament to load. Cannot be bypassed.
2. **Standard B8 (self-enforcement, CRITICAL):** "Before starting any process from reglaments-index, MUST Read the corresponding reglament."
3. **`/checkstandards` (post-factum audit):** Checks if reglaments should have been loaded but were not.

---

## 3. Memory Architecture

### Working Memory (L0–L4)

```
STATE.md (per project) ← quick entry point: position, decisions, blockers, metrics
  ↕ derived from / synced with:
L1: {project}-about.md ← tech stack, paths, services, identity (slow changes)
L2: {project}-roadmap.md ← phases, epics, priorities (changes per epic)
L3: {project}-{epic}.md ← active tasks, blockers, decisions (changes per session)
L4: scratches/ ← session checkpoints (ephemeral, distributed on close/dream)
Chronicle: {project}-current.md ← append-only session log (ground truth)
Chronicle index: index.md ← row per entry (date, type, N, epic)
```

### File Locations

| Layer | tLOS | Harkly | Contexter | Nomos |
|---|---|---|---|---|
| STATE | `development/tLOS/memory/STATE.md` | `development/harkly/memory/STATE.md` | `development/contexter/memory/STATE.md` | `finance/nomos/memory/STATE.md` |
| L1 | `tlos-about.md` | `harkly-about.md` | `contexter-about.md` | `nomos-about.md` |
| L2 | `tlos-roadmap.md` | `harkly-roadmap.md` | `contexter-roadmap.md` | `nomos-roadmap.md` |
| L3 | `tlos-phase*.md` | `harkly-{epic}.md` | `contexter-{epic}.md` | `nomos-{epic}.md` |
| L4 | `scratches/{id}+{N}-scratch.md` | `session-scratch.md` | `session-scratch.md` | `scratches/{id}+{N}-scratch.md` |
| Chronicle | `chronicle/tlos-current.md` | `chronicle/harkly-current.md` | `chronicle/contexter-current.md` | `chronicle/nomos-current.md` |

All paths relative to `nospace/{project_dir}/memory/`.

### Auto-Memory (Claude Code native)

Separate from Workspace Consciousness. Lives in `~/.claude/projects/C--Users-noadmin/memory/`.

- `MEMORY.md` — index (≤200 lines, ≤25KB), loaded every session
- Topic files (`feedback_*.md`, `project_*.md`, `reference_*.md`, `user_*.md`)
- Claude Code uses Sonnet side-query to pick ≤5 relevant files per conversation
- Good descriptions in frontmatter = better recall

### CONTEXT.md (Decision Tracking)

Created during Orchestrator Clarify phase for each active phase/epic.
Location: `{project}/memory/contexts/phase-{N}-context.md`

Structure:
- **Locked Decisions** (D-01, D-02...) — agents MUST follow
- **Claude's Discretion** — implementation details
- **Deferred** — explicitly NOT this phase

Downstream agents reference decision IDs: "per D-01, using NATS not HTTP"

---

## 4. Skill Lifecycle

### Session Flow

```
/startaxis                    Read axis-active → STATE.md + L1 + L2 + L3
                              Drain scratches → chronicle
                              Create placeholder scratch
                              Read standards.md + reglaments-index.md
                              Load project constitution
                              Briefing output

    ↓
[work happens]                Execution order: B8 (reglament) → B1 (clarify) → A5 (blast radius) → work
    ↓
/checkpointaxis               Write ENTRY to scratch, increment N
(or /checkpointaxis-fast)     (fast = 1 read + 1 write, for 99% context)
    ↓
[more work]
    ↓
/closeaxis                    Inventory → CLOSE entry → chronicle queue → drain
                              STATE.md + L3 + L2 + L1 updates → archive scratch → git push
```

### If context runs out:
```
/checkpointaxis-fast          Save state (minimal, write-only)
[new dialog]
/continueaxis                 Read axis-active → L1 + L2 + L3 → standards + reglaments-index
                              Distribute unfinished scratch → resume
```

### Periodic maintenance:
```
/dream                        Full deep read of ALL memory → cross-layer audit
                              Fix drift, contradictions → optimize chronicles
                              Run every 5-10 sessions in dedicated Opus session
```

### Session pointer files:
- `~/.tlos/axis-active` — format: `{project}|{epic_file}|{scratch_file}|{last_N}`
- `~/.tlos/logos-active` — same format
- `~/.tlos/satoshi-active` — same format
- `~/.tlos/session.lock` — PID + orchestrator + startedAt (crash recovery)

---

## 5. Agent System

### Agent Definitions

All agents defined in `~/.claude/agents/*.md` with frontmatter:
```yaml
---
name: agent-name
description: "when to invoke"
model: sonnet              # all subagents = Sonnet by default
tools: Read, Write, Edit, Bash, Glob, Grep
effort: high               # high for Players, medium for Coaches
permissionMode: acceptEdits  # Players only
memory: project            # persistent per-project memory
isolation: worktree         # Players only (git worktree isolation)
color: blue
---
[system prompt content]
```

### G3 Pipeline (Dialectical Autocoding)

→ Full protocol: `~/.claude/reglaments/g3-session.md`

```
Orchestrator
  → Clarify (questions, research, CONTEXT.md with locked decisions)
  → Formalize (2-4 sentences for Domain Lead)
  → Anticipate (risks, edge cases)
  → Domain Lead (audit → spec with D-01 refs + verify commands)
    → Coach PRE-REVIEW (8 dimensions)
    → Player (Phase Zero → implements from spec, atomic commit per task)
    → Coach POST-REVIEW (independent verification)
    → Max 3 iterations, then escalate
```

### Pre-inline Rule (standard C7)

When spawning any agent, inline context into prompt:
```
BAD:  Agent(prompt="Read STATE.md, then write spec")
GOOD: Agent(prompt="# Context\n[STATE.md content]\n# Task\nWrite spec for...")
```

### Model Selection

| Context | Model |
|---|---|
| Orchestrator (main) | Opus (always) |
| Domain Lead | Sonnet |
| G3 Player | Sonnet |
| G3 Coach | Sonnet |
| Simple lookup/utility | Haiku |

Opus for subagents only if Orchestrator proposes and nopoint confirms (standard C2).

### Key Agents

| Agent | Role | Type |
|---|---|---|
| gropius | Frontend Player (SolidJS/Tailwind, pixel-perfect) | G3 Player |
| itten | Web Designer Player (visual composition) | G3 Player |
| mies | Backend Player (Hono/CF Workers/D1) | G3 Player |
| breuer | Frontend Coach (visual regression, code quality) | G3 Coach |
| albers | Design Coach (token compliance, a11y) | G3 Coach |
| schlemmer | Backend Coach (API testing, data integrity) | G3 Coach |
| moholy | QA Engineer (Playwright E2E, CJM) | G3 Player |
| chief-development | Dev domain orchestrator | Domain Lead |
| chief-design | Design domain orchestrator | Domain Lead |
| lead-frontend | SolidJS/Tailwind for tLOS shell | Domain Lead |
| lead-backend | Python/NATS/LangGraph for tLOS kernel | Domain Lead |

---

## 6. Rules System

### Loading Order (lowest → highest priority)

1. Managed: `/etc/claude-code/CLAUDE.md` (admin, not used)
2. User global: `~/.claude/CLAUDE.md` (Orchestrator protocol, G3 pipeline, security, bug fixing)
3. User rules: `~/.claude/rules/*.md` — auto-loaded, unconditional (no `paths:` frontmatter)
4. User rules: `~/.claude/rules/*-context.md` — conditional (loaded when touching matching files via `paths:` frontmatter)
5. Local: `CLAUDE.local.md` (not used)

### What's Auto-Loaded (every prompt)

From `~/.claude/rules/` (unconditional):
- `standards.md` — 44 quality standards (RFC 2119)
- `reglaments-index.md` — process reglaments index + per-project pointers
- `coding-style.md` — immutability, file limits, code quality checklist
- `agents.md` — G3 pipeline, quota guard, model selection
- `git-workflow.md` — quick reference + route to reglament
- `hooks.md` — active hooks list
- `patterns.md` — skeleton projects, repository pattern
- `performance.md` — model selection, context management, extended thinking
- `security.md` — pre-commit checklist + route to reglament
- `testing.md` — structured verification, Coach protocol, AC format

From `~/.claude/rules/` (conditional, via `paths:` frontmatter):
- `tlos-context.md` — tLOS stack, paths
- `harkly-context.md` — Harkly stack, paths
- `contexter-context.md` — Contexter stack, paths
- `nomos-context.md` — Nomos stack, paths

### What's NOT Auto-Loaded

- `~/.claude/reglaments/*.md` — 10 process reglaments (loaded on-demand via Read)
- `~/.claude/protocols/*.md` — 4 protocol files (loaded by skills when needed)
- `nospace/rules/*.md` — constitutions (loaded by start skills per project)
- `nospace/rules/regulations/*.md` — 17 old regulations (archived/merged into reglaments)
- `nospace/docs/research/*.md` — research files (loaded on-demand)
- `nospace/design/*/guidelines/*.md` — design guidelines (loaded during G3 Phase Zero)

### Key Insight from Source Code

Claude Code's `~/.claude/rules/` loading is **recursive** — ALL .md files in ALL subdirectories are auto-loaded. This is why reglaments live in `~/.claude/reglaments/` (outside rules/), not `~/.claude/rules/reglaments/`. Putting them in rules/ would add ~15-20K tokens to every prompt.

---

## 7. Hooks (Enforcement Layer)

Configured in `~/.claude/settings.json`. Enforce rules mechanically — LLM cannot bypass.

| Hook Event | What It Does | Script |
|---|---|---|
| UserPromptSubmit | Quota guard (memory pressure) | `quota-guard.ts` |
| UserPromptSubmit | Reglament trigger detection | `reglament-trigger.ts` |
| SessionStart | Memory init + session lock | `mem-session-start.ts` + lock write |
| SessionEnd | Clear session lock | lock delete |
| Stop | Kill subagent processes | `kill-subagents.ps1` |
| SubagentStart | Log agent start | → `~/.tlos/agent-log.jsonl` |
| SubagentStop | Log agent stop | → `~/.tlos/agent-log.jsonl` |
| PreCompact | Log compaction start | → `~/.tlos/compaction-log.txt` |
| PostCompact | Log compaction end | → `~/.tlos/compaction-log.txt` |
| PostToolUse (Write/Edit) | Auto-scratch file change log | `auto-scratch.py` |
| PostToolUse (Read/Bash/Grep) | Session index | `session-index.py` |
| PostToolUse (Agent/TaskStop) | Eidolon registry | `eidolon-register.py` |

### Reglament Trigger Hook

`reglament-trigger.ts` parses nopoint's prompt for keywords (9 patterns, RU+EN) and emits a system-reminder telling Orchestrator which reglament to Read. This is the mechanical layer of standard B8 enforcement.

### Permission Deny Rules (26 rules)

Blocks: `rm`, `rmdir`, `del`, `rd`, `git push --force`, `git reset --hard`, `git clean`, `drop table`, `truncate`, `chmod 777`, `sudo`, `taskkill`, `kill -9`, etc.

---

## 8. Context Economy

→ Full protocol: `~/.claude/reglaments/context-economy.md`

### Core Principle: Read Smart, Not Less

- **Wrong:** "Read as little as possible to save tokens"
- **Right:** "Read everything blast radius demands. Read nothing it does not."

### Blast Radius Assessment (standard A5, CRITICAL)

Before ANY code change:
1. Grep for usages (1-3 calls, ~0.5% context)
2. Check imports (who imports this file, what it imports)
3. Read every file in the blast radius

### Context Degradation

- 0-20% context: reliable reasoning
- 20%+: progressive degradation
- ~100K tokens: practical ceiling for debugging
- After 10+ tool calls: re-state hypothesis explicitly
- Preferred transition: checkpoint → new dialog → /continueaxis

### Token Economics

- cache_read = 1x quota on Max plan (NOT discounted)
- cache_read dominates cost (~99% of total)
- Fewer turns with higher quality > many turns with degrading quality

---

## 9. Foundations (per project)

Constitutions are loaded by start/continue skills based on active project.

| Project | Constitution | Key Constraints |
|---|---|---|
| Global | `nospace/rules/global-constitution.md` | AI-First, Lean, archive don't delete |
| tLOS | `nospace/development/tLOS/rules/tLOS-constitution.md` | Zero-Web2, NATS-only, Wasm, Nostr/Ed25519 |
| Harkly | `nospace/development/harkly/rules/harkly-constitution.md` | Web2 OK, CX Intelligence |
| Contexter | (no constitution) | Best RAG, no shortcuts, MCP-native |
| Nomos | (no constitution) | Beginner-safe, DCA > timing |

### Design Guidelines (per project)

Full index in `~/.claude/reglaments/design-transfer.md`

| Project | Status | Source |
|---|---|---|
| tLOS | 100+ rules, 9 guideline files | `nospace/design/design_system/` |
| Harkly | Adapted Bauhaus, warm palette | `nospace/design/harkly/` |
| Contexter | Inherits tLOS, no project-specific | Deferred task in L2 |
| Nomos | No design system | — |

### Brand Guidelines (per project)

Full index in `~/.claude/reglaments/brand-voice.md`

| Project | Status | Source |
|---|---|---|
| tLOS | Internal, no brand | — |
| Harkly | Brand bible, TOV, values | `nospace/development/harkly/brand/` |
| Contexter | Partial (copy audit, positioning) | Deferred task in L2 |
| Nomos | No brand | — |

---

## 10. Key File Map

```
~/.claude/
├── CLAUDE.md                        # Orchestrator protocol + G3 pipeline
├── settings.json                    # Hooks, permissions, env, statusLine
├── agents/                          # 34 agent definitions (Bauhaus G3 team + Chiefs/Leads)
├── commands/                        # 22 skills (start/close/checkpoint/continue × 3 + global + g3 + dream + sync + aia + compress-scratch + checkstandards)
├── rules/                           # 15 rule files (auto-loaded every prompt)
│   ├── standards.md                 # 44 quality standards (RFC 2119)
│   ├── reglaments-index.md          # Process reglaments index (~1K tokens)
│   ├── coding-style.md              # Code quality, immutability, checklist
│   ├── agents.md                    # G3 pipeline, quota guard
│   ├── git-workflow.md              # Quick ref + route to reglament
│   ├── hooks.md                     # Active hooks list
│   ├── patterns.md                  # Skeleton projects, design patterns
│   ├── performance.md               # Model selection, context management
│   ├── security.md                  # Pre-commit checklist + route to reglament
│   ├── testing.md                   # Structured verification, Coach protocol
│   └── *-context.md (×4)           # Project-specific (conditional via paths:)
├── reglaments/                      # 10 process reglaments (NOT auto-loaded)
│   ├── research.md                  # SEED/DEEP methodology, self-check
│   ├── bug-diagnosis.md             # 4-phase protocol, context degradation
│   ├── g3-session.md                # Phase Zero, Coach 8-dim, Player/Coach rules
│   ├── agent-orchestration.md       # Quota, model selection, GAIA, delegation
│   ├── design-transfer.md           # Pencil safety, visual comparison, guidelines index
│   ├── brand-voice.md               # Brand guidelines index per project
│   ├── security-audit.md            # Security checklist, response protocol
│   ├── deploy.md                    # Deploy procedures per project
│   ├── git-workflow.md              # Full commit/branch/PR protocol
│   └── context-economy.md           # Blast radius, smart reading, degradation
├── protocols/                       # 4 protocol files (loaded by skills)
│   ├── axis.md                      # Memory pressure protocol
│   ├── logos.md                     # Data/DB specific
│   ├── praxis.md                    # Background tasks
│   └── eidolon.md                   # Subagent naming/registry
└── hooks/                           # Hook scripts
    ├── quota-guard.ts               # Memory pressure detection
    ├── reglament-trigger.ts         # Keyword → reglament reminder
    ├── mem-session-start.ts         # Session init
    ├── kill-subagents.ps1           # Stop hook cleanup
    ├── auto-scratch.py              # File change tracking
    ├── session-index.py             # Read/search tracking
    └── eidolon-register.py          # Agent registry

~/.tlos/
├── axis-active                      # Session pointer (project|epic|scratch|N)
├── logos-active                     # Same for Logos
├── satoshi-active                   # Same for Satoshi
├── session.lock                     # PID + orchestrator (crash recovery)
├── eidolons.json                    # Agent registry (auto-updated by hook)
├── agent-log.jsonl                  # Agent start/stop log
└── compaction-log.txt               # Compaction events

nospace/
├── development/{project}/memory/
│   ├── STATE.md                     # Current position
│   ├── {project}-about.md           # L1: tech stack, paths, identity
│   ├── {project}-roadmap.md         # L2: phases, epics
│   ├── {project}-{epic}.md          # L3: active tasks, blockers
│   ├── contexts/                    # CONTEXT.md per phase (locked decisions)
│   ├── scratches/                   # L4: session checkpoints
│   └── chronicle/
│       ├── {project}-current.md     # Append-only log (ground truth)
│       ├── index.md                 # Row per entry
│       └── scratches/               # Archived processed scratches
├── docs/
│   ├── system-guide.md              # THIS FILE
│   ├── research/                    # All research saved here
│   └── templates/
│       └── CONTEXT-TEMPLATE.md      # Decision tracking template
├── rules/
│   └── global-constitution.md       # Workspace philosophy
├── design/
│   ├── design_system/               # tLOS Bauhaus design system (9 guideline files)
│   └── harkly/                      # Harkly adapted design system
└── {project}/rules/
    └── {project}-constitution.md    # Project-specific mandates
```

---

## 11. Compaction & Context Management

### What survives compaction:
- CLAUDE.md (always in system prompt)
- .claude/rules/ (always in system prompt — standards, reglaments-index, all rules)
- Auto-memory MEMORY.md (re-read by auto-memory system)
- Top 5 recently-edited files (5K tokens each)
- Top skills (25K budget)

### What does NOT survive:
- Chat messages → compressed to summary
- Inline file contents → lost (re-read if needed)
- Images → stripped
- Reglaments loaded via Read → lost (hook will re-trigger on next relevant prompt)

### Strategy:
- Critical info → memory files (survive via auto-memory reload)
- Work progress → TaskCreate/TaskUpdate (persist to disk)
- Session state → axis-active pointer (1-line file, always readable)
- Standards + reglaments-index → survive (in rules/, auto-loaded)
- Reglaments → hook re-triggers loading when needed

---

## 12. System Evolution Log

| Date | Session | Change |
|---|---|---|
| 2026-03-31 | 220 | system-guide.md created |
| 2026-04-02 | 228 | standards.md (49 standards), reglaments system (10 reglaments), reglament-trigger hook, execution order, blast radius standard (A5), context-economy rewrite, coding-style/git-workflow/security dedup, performance.md fixes, full audit + count fix |
