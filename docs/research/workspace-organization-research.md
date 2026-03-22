# Workspace Organization Research
> Topic: AI-first multi-agent monorepo structure patterns
> Researcher: Lead/TechResearch (Eidolon)
> Date: 2026-03-22
> Scope: nospace workspace (~21K files, 4 projects, Claude Code agents)

---

## Section 1 — Current State Audit

### nospace Top-Level Structure (observed)

```
nospace/
├── admin/
├── agents/               # Agent definitions (orchestrator, domain leads, etc.)
│   ├── _template/
│   ├── assistant/
│   ├── comet/
│   ├── cto/
│   ├── domain-lead/
│   ├── frontend-engineer/
│   ├── qa-lead/
│   ├── research-assistant/
│   ├── reviewer-agent/
│   ├── senior-architect/
│   ├── sre-lead/
│   └── tech-lead/
├── data/
├── design/               # Cross-project design (design_system, harkly, contexter)
├── development/          # Source code (tLOS, harkly, contexter)
├── docs/                 # Docs per project + cross-cutting research
├── finance/              # nomos project
├── ideas_inbox.md
├── intent.md
├── knowledge/            # Knowledge corpus (bauhaus-books, persona-corpus)
├── marketing/            # Brand, campaigns, SEO, copywriting
├── memory/               # Workspace-level memory (L1–L4 layers)
├── private_knowledge/    # Gated context, policies
├── production/           # Deployment configs (tLOS, harkly)
├── requirements/
├── research/             # Long-form research by date/topic
├── rules/                # Global constitution, regulations, RBAC
├── temp/
└── tools/                # Internal tools (token-counter, mcp-servers, scripts)
```

### Observed Structural Tensions

1. `docs/research/` and `research/` both exist — dual research locations
2. `design/` is cross-project but `docs/` is project-scoped (docs/tLOS, docs/harkly)
3. `memory/` at workspace root handles global state; each project has its own memory/ subtree
4. `knowledge/` (corpus) vs `private_knowledge/` (gated) — similar names, different semantics
5. `finance/` is a project disguised as a domain (nomos = development project)
6. `marketing/` sits at workspace root but belongs to harkly project
7. `tools/` mixes workspace tooling with project-specific utilities

---

## Section 2 — Monorepo Organization Patterns for AI-Native Workspaces

### 2.1 Nx + AI Agent Skills (Leading OSS Example)

Source: https://nx.dev/blog/nx-ai-agent-skills (retrieved 2026-03-22)

Nx provides a **project graph** as structured knowledge for AI agents — instead of agents scanning filesystem, they query `nx show projects` or `nx graph`. This reduces token waste on exploration.

Key pattern: `npx nx configure-ai-agents` auto-generates CLAUDE.md / AGENTS.md with workspace conventions including naming patterns, directory structures, tagging strategies.

**Nx workspace skill hierarchy:**
1. `nx-workspace` — maps project structure via CLI
2. `nx-generate` — consistent code generation
3. `nx-run-tasks` — proper task execution
4. `monitor-ci` — bridges local dev to CI

**Application to nospace:** We have no build graph equivalent. The `agents/ecosystem-map.md` serves a similar navigation role but is human-written prose, not machine-queryable. A machine-readable `workspace.json` or `projects.yaml` would let agents skip exploration.

### 2.2 Meta-Repository Pattern (Multi-Session AI Agents)

Source: https://seylox.github.io/2026/03/05/blog-agents-meta-repo-pattern.html (retrieved 2026-03-22)

For multi-agent, multi-session workflows, a **meta-repo** provides:

```
meta-repo/
├── AGENTS.md          # Router: "for payments work, see repos/payments/"
├── repos.yaml         # Machine-readable: paths, build commands, dependencies
├── conventions/       # Commit style, branching, release notes
├── workflows/         # Step-by-step cross-repo playbooks
├── scripts/           # Standardized CLI wrappers
└── active-work/       # Epic tracking across sessions
    ├── EPIC-001.md
    └── EPIC-002.md
```

**Key insight:** `repos.yaml` eliminates ambiguity. Agents parse structured config rather than prose. The `active-work/` directory bridges auto-memory with structured tracking — agents read it to resume sessions without re-exploration.

**Application to nospace:** Our `memory/` system already does L1–L4 layering. What's missing: a machine-readable `projects.yaml` at workspace root and a structured `active-work/` or `epics/` directory distinct from scratch files.

### 2.3 Datadog Monorepo Pattern (AGENTS.md Hierarchy)

Source: https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0 (retrieved 2026-03-22)

Datadog's approach:

```
repo-root/
├── AGENTS.md               # Router document only
├── emails/AGENTS.md        # Domain-specific steering
├── go/services/AGENTS.md   # Subsystem steering
└── .agents/
    └── unit-tests.md       # Cross-cutting generic patterns
```

Root AGENTS.md is **navigation only** — "To create an email, read @emails/AGENTS.md". Domain teams own their steering content. Generic utilities go in `.agents/`.

The pattern maps CLAUDE.md → AGENTS.md via a one-liner: `echo "Read @AGENTS.md" > CLAUDE.md`

**Application to nospace:** Our `agents/ecosystem-map.md` functions as the router but lives inside the agents/ directory rather than at root. Moving navigation logic to workspace root (or creating a root CLAUDE.md that routes) would improve discoverability.

### 2.4 Google Piper / Large-Scale Monorepo Principles

Source: https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ (retrieved 2026-03-22)

Google's 86TB single repo operates on: **trunk-based development**, **default-open access**, **atomic cross-cutting changes**, **unified tooling** (CodeSearch, Critique, Rosie).

Key principle: **organizational visibility as feature**. Everyone sees all commits. Cross-team discovery is zero-cost. This only works with strong naming conventions — otherwise search is the only navigation.

**Application to nospace:** We benefit from this (one repo = full context for agents). The risk is cognitive overload for agents. Mitigation: strict naming conventions + explicit navigation files.

### 2.5 Anthropic Multi-Agent Research System

Source: https://www.anthropic.com/engineering/multi-agent-research-system (retrieved 2026-03-22)

Anthropic's internal multi-agent research pattern:
- **Orchestrator-worker pattern**: lead agent spawns 3–5 subagents in parallel
- **Distributed context windows**: each subagent has its own context, not shared
- **Artifact storage**: subagents write to external storage, pass lightweight references back
- **Memory persistence**: when approaching 200K token limit, save plan to Memory tool

File organization implication: **each agent needs its own working directory**, not shared writes. Subagents store results as files then pass paths, not content.

**Application to nospace:** This confirms our current model (agents/ isolated dirs + memory/ layers). The artifact storage pattern suggests adding a `temp/artifacts/` or session-scoped staging area distinct from permanent docs.

---

## Section 3 — CLAUDE.md / Instruction File Patterns

### 3.1 Official Claude Code Memory Architecture

Source: https://code.claude.com/docs/en/memory (retrieved 2026-03-22)

**Loading hierarchy** (most specific wins):

| Scope | Location | Loaded when |
|---|---|---|
| Managed policy | `/etc/claude-code/CLAUDE.md` | Always, cannot exclude |
| User | `~/.claude/CLAUDE.md` | Always, all projects |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Launch |
| Ancestor dirs | `../CLAUDE.md`, `../../CLAUDE.md` | Launch (full) |
| Subdirectory | `./subdir/CLAUDE.md` | On demand, when Claude reads files there |

**Auto memory structure:**
```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Index — first 200 lines loaded every session
├── debugging.md       # Topic files — read on demand
├── api-conventions.md
└── ...
```

**Rules system:**
```
.claude/rules/
├── code-style.md
├── testing.md
└── security.md        # Can have YAML frontmatter: paths: ["src/api/**/*.ts"]
```

**Size constraints:** Target under 200 lines per CLAUDE.md. Beyond 200 lines — adherence degrades. Import with `@path/to/file` syntax (max 5 hops deep).

**Key design principle:** CLAUDE.md is context, not enforcement. Instructions must be specific enough to be verifiable ("Use 2-space indentation" not "format nicely").

### 3.2 AGENTS.md as Open Standard

Source: https://agents.md/ + https://developers.openai.com/codex/guides/agents-md (retrieved 2026-03-22)

AGENTS.md is now an **open standard** supported by: OpenAI Codex, Claude Code, GitHub Copilot, Cursor, Amp, Jules (Google), Factory.

OpenAI's own repo uses **88 AGENTS.md files** across subcomponents. The pattern: each subsystem owns its steering document, root is router only.

**Nested override pattern:**
```
services/payments/
└── AGENTS.override.md   # Overrides for payments team
```

The closest AGENTS.md to the edited file wins.

### 3.3 Workspace-as-Code File Inventory

Source: https://dev.to/webbywisp/how-i-structure-my-ai-agent-workspace-and-why-it-matters-j13 (retrieved 2026-03-22)

Community pattern for single-agent workspaces:

```
workspace/
├── SOUL.md            # Identity, values, personality (immutable per project)
├── USER.md            # Human operator context (name, timezone, preferences)
├── OPS.md             # Operational playbook (startup checklist, protocols)
├── MEMORY.md          # Curated long-term memory (index, 2KB limit)
├── TOOLS.md           # Environment config (SSH, API endpoints)
└── memory/
    ├── YYYY-MM-DD.md  # Append-only daily logs
    └── projects/
        └── [name].md  # Living project documents
```

**Critical insight:** Each file has one job. Overlapping file purposes cause agents to lose prioritization. Loading order matters: identity → context → operations.

**Application to nospace:** Our L0–L4 memory layers implement this pattern at scale. The tension is our `rules/` directory conflates SOUL.md (constitution), OPS.md (regulations), and USER.md (preferences) into one tree.

### 3.4 Nested CLAUDE.md Loading for Monorepos

Source: https://code.claude.com/docs/en/memory + https://claude.com/blog/using-claude-md-files (retrieved 2026-03-22)

For monorepos specifically:
- Root CLAUDE.md = shared context, loads at launch
- Package-level CLAUDE.md = loads on demand when agent enters that package
- `.claude/rules/` files with `paths:` frontmatter = conditional, file-type scoped
- `claudeMdExcludes` = skip other teams' CLAUDE.md files

**Important:** Use `@` imports to pull in READMEs, package.json, external specs without duplicating content.

**Anti-pattern:** One giant CLAUDE.md for the whole monorepo — instruction adherence collapses above 200 lines.

---

## Section 4 — Knowledge Management in Repositories

### 4.1 Diataxis Framework

Source: https://diataxis.fr/ + https://ekline.io/blog/a-technical-guide-to-the-diataxis-framework-for-modern-documentation (retrieved 2026-03-22)

Four documentation modes with distinct user needs:

| Type | Purpose | User state | Directory |
|---|---|---|---|
| Tutorials | Learning-oriented, hand-holding | Student, studying | `docs/tutorials/` |
| How-to guides | Task-oriented, problem solving | Practitioner, working | `docs/how-to/` |
| Reference | Information-oriented, facts | Competent, need lookup | `docs/reference/` |
| Explanation | Understanding-oriented, concepts | Reader, studying | `docs/explanation/` |

Adopted by: Canonical, Gatsby, Cloudflare, Python documentation community.

**Application to nospace:** Our `docs/` is organized by project (docs/tLOS/, docs/harkly/) not by documentation type. Within each project's docs, a Diataxis subdirectory structure would improve agent navigation — agents searching for "how to deploy" would go to `docs/tLOS/how-to/` not scan the entire docs/tLOS/ tree.

### 4.2 Architecture Decision Records (ADRs)

Source: https://adr.github.io/ + https://github.com/joelparkerhenderson/architecture-decision-record (retrieved 2026-03-22)

ADRs: single file per decision, named `YYYY-MM-DD-decision-title.md`, stored in `docs/decisions/` or `docs/adr/`.

**nospace already uses this pattern** in `docs/ecosystem-noadmin/adr/`. Observation: ADRs are in `docs/` not in `rules/` — the distinction matters. Rules = current constraints; ADRs = historical reasoning.

### 4.3 Design System in Monorepo

Source: https://medium.com/@satnammca/scaling-your-frontend-a-monorepo-and-design-system-playbook-957e38c8c9e4 (retrieved 2026-03-22)

Design systems in monorepos follow the **packages/ui** pattern:
```
packages/ui/src/
├── shared/    # Design tokens, primitives
├── button/
│   ├── Button.tsx
│   └── index.ts
└── index.ts   # Single public API
```

Key principle: **no deep imports** — only from public API entry point.

**Application to nospace:** Our `design/design_system/` follows this intent but lacks a clear public API boundary. The `design/harkly/` and `design/contexter/` are project-scoped. The missing layer: `design/shared/` for tokens/primitives shared across all projects.

### 4.4 Private vs Shared Knowledge

Source: various (retrieved 2026-03-22)

Pattern: knowledge lives at two levels:
- **Shared/organizational**: conventions, ADRs, public design system — in version control
- **Private/sensitive**: credentials, gated research, PII-adjacent — gated or out of repo

nospace uses `private_knowledge/` for gated material. The pattern is sound. The naming could be clearer: `confidential/` or `gated/` communicates access restriction more explicitly.

---

## Section 5 — Agent Workspace File Organization Patterns

### 5.1 OpenHands SDK Architecture

Source: https://arxiv.org/html/2511.03690v1 + https://deepwiki.com/OpenHands/OpenHands/6.3-agent-configuration (retrieved 2026-03-22)

OpenHands organizes agent context via two subsystems:
- **Memory component**: `set_repository_info`, `set_runtime_info`, `set_conversation_instructions`
- **ConversationMemory**: processes event history into LLM-consumable messages

Event-sourced state model: all agent actions (commands, edits, results) recorded as immutable event log → deterministic replay → cross-session context.

**File-based memory pattern (from community research):**
Plain markdown scored 74% on memory tasks — outperforming specialized libraries. Rationale: "LLM-native (models trained on markdown)", human-readable, git-friendly, zero infrastructure.

### 5.2 Agentic Memory File Architecture (Three-Tier)

Source: https://gist.github.com/spikelab/7551c6368e23caa06a4056350f6b2db3 (retrieved 2026-03-22)

**Semantic memory** (context-free facts):
- Collections/profiles with strict schema
- Example: "user codes in TypeScript", "prefers async/await"

**Episodic memory** (time-stamped interactions):
- `.jsonl` or SQLite with timestamps
- Task trajectories: states, actions, outcomes

**Procedural memory** (behavioral patterns):
- Encoded in agent code, prompts, skills directories
- Must be initialized by designer

**nospace mapping:**
- Semantic = `memory/semantic-context-global.md` ✓
- Episodic = `memory/chronicle/` (append-only) ✓
- Procedural = `rules/` + `agents/*/L0-identity.md` ✓

The three tiers are present. What's less clear: which tier has write authority from which agent.

### 5.3 Wshobson/agents Plugin Architecture

Source: https://github.com/wshobson/agents (retrieved 2026-03-22)

A published Claude Code multi-agent repository with 72 plugins across 24 categories:

```
.claude-plugin/
└── marketplace.json      # Registry of all plugins

plugins/
├── python-development/
│   ├── agents/           # Specialized AI agents
│   ├── commands/         # Workflow tools
│   └── skills/           # Modular knowledge packages
└── kubernetes-ops/
    ├── agents/
    ├── commands/
    └── skills/

docs/
├── agent-reference/      # Per-category reference
├── plugin-catalog.md
└── usage-guide.md

tools/
└── (79 development tools)
```

**Key design:** Each plugin is self-contained — only its specific agents, commands, and skills load into context. This minimizes token usage through **progressive disclosure**.

**Application to nospace:** Our `agents/` directory has one level of specialization. The plugin model suggests grouping by capability domain (backend-development, design-tooling, research) rather than role hierarchy alone. Our `tools/` mixes workspace tooling with project utilities — splitting into `tools/workspace/` and `tools/project/{name}/` would reduce noise.

### 5.4 Memory as Files — ReMe Philosophy

Source: https://github.com/agentscope-ai/ReMe (retrieved 2026-03-22)

ReMe's philosophy: "memory as files, files as memory". Memory is readable, editable, copyable — first-class filesystem citizens, not database rows.

The pattern for multi-session continuity:
```
active-work/
├── EPIC-001.md           # Current epic with progress log
└── decisions/            # Decisions made this epic
archive/
├── EPIC-000.md           # Completed work reference
└── ...
```

Auto-memory stores a pointer: `"Active epic: EPIC-001, see active-work/EPIC-001.md"` — next session, agent reads tracking doc and resumes.

**Application to nospace:** Our scratch system (`memory/scratches/`) serves this purpose but without the archive structure. Separating `active-work/` from `completed/` would make the agent's operational state machine explicit.

---

## Section 6 — Convention Over Configuration

### 6.1 Self-Documenting Directory Names

Source: https://thekarel.gitbook.io/best-practices/constraints/monorepo + https://news.ycombinator.com/item?id=25907222 (retrieved 2026-03-22)

Naming conventions that reduce need for explicit docs:

**Standard conventions (wide industry adoption):**
- `apps/` — deployable units
- `packages/` or `libs/` — reusable libraries
- `tools/` — dev tooling and scripts
- `docs/` — documentation
- `infra/` or `production/` — deployment/ops config
- `.archive/` or `_archive/` — deprecated material (dot/underscore prefix = "not primary")

**Domain conventions (nospace-specific):**
- `development/{project}/` — source code is unambiguous
- `design/{project}/` — clear separation of code and design assets
- `finance/` — non-standard but self-explanatory

**Problematic conventions in nospace:**
- `research/` at root vs `docs/research/` — ambiguous, forces rule to resolve
- `knowledge/` vs `private_knowledge/` — similarity causes agent confusion
- `memory/` at root level (L1–L4) vs project-level `memory/` — same directory name, different semantics

### 6.2 Prefix/Suffix Conventions for Special Directories

Source: https://docs.devland.is/technical-overview/adr/0009-naming-files-and-directories (retrieved 2026-03-22)

Conventions for communicating directory role without documentation:

| Pattern | Meaning | Example |
|---|---|---|
| `_name` | Internal/private, excluded from navigation | `_template/`, `_archive/` |
| `.name` | Tooling/config, hidden by default | `.claude/`, `.github/` |
| `name-draft/` | Work in progress | `research-draft/` |
| `CAPS.md` | Critical file, always-read | `CLAUDE.md`, `AGENTS.md` |

**Recommendation for nospace:**
- `_archive/` instead of `.archive/` (already in use — good)
- `_temp/` for ephemeral working files (not `temp/` which looks permanent)
- `.agents/` for cross-cutting agent patterns (Datadog pattern)

### 6.3 Feature-Sliced Design Principles

Source: https://feature-sliced.design/blog/frontend-monorepo-explained (retrieved 2026-03-22)

FSD enforces **dependency flow direction**: apps → packages → shared primitives. No reverse imports. This is enforced by code structure, not documentation.

For non-code assets, the analogous rule: projects consume from shared; shared never imports from projects.

**Applied to nospace:**
```
design/shared/          → consumed by all projects
design/harkly/          → harkly-specific, cannot be consumed by tLOS
design/tLOS/            → tLOS-specific
development/harkly/     → imports from design/shared, not design/tLOS
```

This dependency direction is currently implicit. Making it explicit (via README in each design/ subdirectory stating consumption rules) would reduce agent confusion.

---

## Section 7 — Synthesis and Recommendations

### 7.1 Assessment of Current nospace Structure

**Strengths:**
- Clear functional domain separation at top level (development/, design/, docs/, rules/)
- Hierarchical memory system (L0–L4) is sophisticated and well-reasoned
- agents/ directory with role-based organization matches industry patterns
- Private knowledge separation (private_knowledge/) is correct
- Chronicle/scratch pattern is more advanced than most published examples

**Weaknesses / Friction Points:**

| Issue | Impact | Severity |
|---|---|---|
| Dual research locations (research/ and docs/research/) | Agent uncertainty about where to write | High |
| marketing/ at workspace root instead of development/harkly/ | Breaks project cohesion | Medium |
| finance/ as domain name obscures nomos project | Navigation requires prior knowledge | Medium |
| knowledge/ vs private_knowledge/ naming similarity | Agents may write to wrong location | High |
| No machine-readable projects.yaml | Agents must read prose to discover project structure | Medium |
| tools/ mixes workspace and project tooling | Discovery noise | Low |
| docs/ organized by project, not Diataxis type | Agents searching by intent fail | Medium |
| No explicit dependency direction for design/ | Cross-project imports are implicit | Low |
| Root CLAUDE.md / AGENTS.md absent | Entry navigation missing from filesystem root | High |

### 7.2 Recommended Changes (Prioritized)

**Priority 1 — Navigation (immediate agent impact):**

1. Add a root-level `AGENTS.md` (or `CLAUDE.md` in `.claude/`) that routes to project-specific memory files. One-liner per project. This is the single highest-impact change per Datadog + meta-repo patterns.

2. Consolidate research locations: `docs/research/` wins (stays), `research/` at root gets merged in or redirected. The root `research/` directory hosts long-form structured research (by date/topic) while `docs/research/` hosts technology evaluation outputs — but this distinction must be documented explicitly.

3. Add a `projects.yaml` at workspace root: machine-readable map of project name → development path, design path, docs path, memory path, status.

**Priority 2 — Naming clarity:**

4. Rename `knowledge/` to `corpus/` or `knowledge-corpus/` to distinguish from `private_knowledge/`. The word "knowledge" is overloaded (knowledge base, knowledge graph, knowledge corpus — all different).

5. Move `marketing/` under `development/harkly/marketing/` or create a clear pointer file at root explaining why it lives at root.

6. Consider renaming `finance/` to `development/nomos/` to match the project naming pattern of other projects.

**Priority 3 — Structure improvements:**

7. Add Diataxis subdirectory structure within each project's docs: `docs/{project}/tutorials/`, `docs/{project}/how-to/`, `docs/{project}/reference/`, `docs/{project}/explanation/`.

8. Add `design/shared/` for cross-project design tokens and primitives, with README stating consumption rules.

9. Split `tools/` into `tools/workspace/` (token-counter, scripts, mcp-servers) and let project-specific tools live under `development/{project}/tools/`.

10. Add `active-work/` directory to `memory/` (or at workspace root) with structured epic tracking documents, distinct from scratch files.

**Priority 4 — Agent instruction files:**

11. Add project-level CLAUDE.md or AGENTS.md files in `development/harkly/`, `development/tLOS/`, etc. These load on demand when agents work in those directories, reducing root-level bloat.

12. Use `.claude/rules/` with path-scoped frontmatter for file-type-specific conventions (e.g., Python files always use type hints, SolidJS components follow signal patterns).

### 7.3 What NOT to Change

**Do not restructure the agents/ directory.** The role-based hierarchy with L0-identity.md files is more sophisticated than any published pattern found. The _template/ subdirectory is excellent practice.

**Do not flatten the memory/ layering.** L0–L4 with chronicle and scratch separation is a custom pattern that exceeds industry standard. It is more advanced than OpenHands' event log or the meta-repo's active-work pattern.

**Do not move rules/ to .claude/rules/.** The current `rules/` at workspace root is human-visible and governance-oriented. The `.claude/rules/` is for path-scoped coding conventions. These are different concerns.

**Do not adopt Nx/Turborepo build tooling.** These tools assume code-first monorepos with build graphs. nospace is primarily a knowledge/agent workspace. The overhead would exceed the benefit.

### 7.4 Trade-off Matrix

| Change | Benefit | Cost | Recommendation |
|---|---|---|---|
| Root AGENTS.md | Agent navigation O(1) | 1 file, no migration | Do it |
| Consolidate research/ | Eliminate dual-write confusion | Migrate ~10 files | Do it |
| projects.yaml | Machine-queryable structure | Maintain alongside reality | Do it |
| Rename knowledge/ | Reduce naming collision | Update all references | Do it |
| Diataxis in docs/ | Intent-based doc search | ~40 subdirs to create | Gradual |
| design/shared/ | Explicit dependency direction | Reorganize design/ | Gradual |
| Move marketing/ | Project cohesion | Update references | Low priority |
| Rename finance/ | Naming consistency | Update memory/rules | Low priority |
| Split tools/ | Reduced noise | Reorganize tools/ | Low priority |

---

## Section 8 — Source Index

| Source | URL | Retrieved |
|---|---|---|
| Nx AI Agent Skills | https://nx.dev/blog/nx-ai-agent-skills | 2026-03-22 |
| Monorepo.tools AI | https://monorepo.tools/ai | 2026-03-22 |
| AI Agent Meta-Repo Pattern | https://seylox.github.io/2026/03/05/blog-agents-meta-repo-pattern.html | 2026-03-22 |
| Datadog AGENTS.md Monorepo | https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0 | 2026-03-22 |
| AGENTS.md Open Standard | https://agents.md/ | 2026-03-22 |
| OpenAI Codex AGENTS.md | https://developers.openai.com/codex/guides/agents-md | 2026-03-22 |
| Claude Code Memory Docs | https://code.claude.com/docs/en/memory | 2026-03-22 |
| CLAUDE.md Best Practices | https://claude.com/blog/using-claude-md-files | 2026-03-22 |
| CLAUDE.md Guide (Builder.io) | https://www.builder.io/blog/claude-md-guide | 2026-03-22 |
| Anthropic Multi-Agent System | https://www.anthropic.com/engineering/multi-agent-research-system | 2026-03-22 |
| OpenHands SDK Paper | https://arxiv.org/html/2511.03690v1 | 2026-03-22 |
| OpenHands Memory/Config | https://deepwiki.com/OpenHands/OpenHands/6.3-agent-configuration | 2026-03-22 |
| Agentic Memory Architecture | https://gist.github.com/spikelab/7551c6368e23caa06a4056350f6b2db3 | 2026-03-22 |
| wshobson/agents Repository | https://github.com/wshobson/agents | 2026-03-22 |
| ReMe Memory Kit | https://github.com/agentscope-ai/ReMe | 2026-03-22 |
| GitHub Copilot Agentic Memory | https://github.blog/ai-and-ml/github-copilot/building-an-agentic-memory-system-for-github-copilot/ | 2026-03-22 |
| Diataxis Framework | https://diataxis.fr/ | 2026-03-22 |
| Diataxis Technical Guide | https://ekline.io/blog/a-technical-guide-to-the-diataxis-framework-for-modern-documentation | 2026-03-22 |
| ADR Examples | https://github.com/joelparkerhenderson/architecture-decision-record | 2026-03-22 |
| Feature-Sliced Design Monorepo | https://feature-sliced.design/blog/frontend-monorepo-explained | 2026-03-22 |
| Luca Pette Monorepo Structure | https://lucapette.me/writing/how-to-structure-a-monorepo/ | 2026-03-22 |
| Google Piper CACM Paper | https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ | 2026-03-22 |
| Mindful Chase Monorepo Best Practices | https://www.mindfulchase.com/deep-dives/monorepo-fundamentals-deep-dives-into-unified-codebases/structuring-your-monorepo-best-practices-for-directory-and-code-organization.html | 2026-03-22 |
| AI Agent Workspace Structure | https://dev.to/webbywisp/how-i-structure-my-ai-agent-workspace-and-why-it-matters-j13 | 2026-03-22 |
| Naming Files/Dirs ADR | https://docs.devland.is/technical-overview/adr/0009-naming-files-and-directories | 2026-03-22 |
| Monorepo Best Practices (Karel) | https://thekarel.gitbook.io/best-practices/constraints/monorepo | 2026-03-22 |

---

*Research complete. Saved incrementally per Research Rule (MANDATORY). Recommend escalation to Eidolon for architectural decisions on Priority 1 items.*
