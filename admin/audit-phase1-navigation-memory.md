# Audit: Phase 1.1 (Root Navigation) + Phase 1.2 (Memory Loading Discipline)
> Generated: 2026-03-22
> Auditor: Axis (Opus 4.6)
> Input: 35+ files read, line counts measured, skill definitions analyzed

---

## Phase 1.1 — Root Navigation Layer

### 1.1.1 Current State: How agents orient today

**Entry points that Claude Code auto-loads (every session, unconditionally):**

| File | Lines | Est. tokens | Loaded by |
|---|---|---|---|
| `~/.claude/CLAUDE.md` | 128 | ~512 | Claude Code auto (global instructions) |
| `~/.claude/rules/*.md` (9 files) | 390 | ~1,560 | Claude Code auto (global rules) |
| `~/.claude/projects/c--Users-noadmin/memory/MEMORY.md` | 157 | ~628 | Claude Code auto (project memory) |
| **Subtotal: auto-loaded** | **675** | **~2,700** | |

**Key observation:** `~/.claude/CLAUDE.md` IS `nospace/CLAUDE.md` — identical content (128 lines). The file in `~/.claude/` is the one that actually gets loaded. There is NO `nospace/CLAUDE.md` on disk. The content lives only in `~/.claude/CLAUDE.md`.

**Routing mechanism today:**
1. `~/.claude/CLAUDE.md` (auto-loaded) contains a role-based routing table (Step 3) that maps 12 roles to their "read next" paths
2. It points to `agents/ecosystem-map.md` for topology (referenced 3 times in the file)
3. It points to `rules/global-constitution.md` for governance
4. It points to `memory/current-context-global.md` for workspace state
5. All paths are relative to `nospace/` — but `nospace/` doesn't exist as a Claude Code project root (cwd is `~`)

**What does NOT exist:**
- `nospace/CLAUDE.md` — NOT FOUND (no workspace-level CLAUDE.md)
- `nospace/AGENTS.md` — NOT FOUND
- `nospace/projects.yaml` — NOT FOUND
- `nospace/.claude/` — NOT FOUND (no path-scoped Claude rules)

### 1.1.2 Agent Orientation Cost

**Files an agent must read before knowing what to do:**

| Scenario | Files read | Lines | Est. tokens | Steps |
|---|---|---|---|---|
| **Any session** (auto-loaded) | CLAUDE.md + 9 rules + MEMORY.md | 675 | ~2,700 | 0 (automatic) |
| **Axis start** (`/startaxis`) | + axis-active + L1 + L2 + axis.md + L3 + scratches + chronicle index | +6-10 files | +1,200-1,800 | 8 steps |
| **Logos start** (`/startlogos`) | + logos-active + L1 + L2 + L3 + scratches + auto-scratch | +5-8 files | +1,000-1,500 | 6 steps |
| **Satoshi start** (`/startsatoshi`) | + satoshi-active + L1 + L2 + L3 + scratches + chronicle index | +6-8 files | +800-1,200 | 8 steps |
| **Global session** (`/startgsession`) | + constitution + 13 regulations + PD + 3 memory files + handshake | +19 files | +4,500-5,000 | 7 steps |

**Worst case (startgsession):** 675 (auto) + ~5,000 (skill) = **~7,700 tokens** just for orientation. Plus 19 explicit file reads consuming tool calls and time.

**Best case (startaxis, project known):** 675 (auto) + ~1,500 (skill) = **~4,200 tokens** for a focused project session.

### 1.1.3 ecosystem-map.md — References & Role

**File:** `nospace/agents/ecosystem-map.md` (142 lines, ~568 tokens)

**Referenced from (10 files):**

| File | Type of reference |
|---|---|
| `~/.claude/CLAUDE.md` | 3 references: routing table, key documents table, CTO role path |
| `nospace/rules/global-constitution.md` | governance doc link |
| `nospace/memory/episodic-context-global.md` | historical mention |
| `nospace/admin/restructuring-proposal.md` | analysis reference |
| `nospace/admin/structure-audit.md` | analysis reference |
| `nospace/admin/nospace-index.md` | index entry |
| `nospace/docs/research/ai-governance-patterns-research.md` | research mention |
| `nospace/docs/research/workspace-organization-research.md` | research mention |
| `nospace/docs/tLOS/audit/criteria/11-ai-ml-engineer.md` | audit criteria |
| `nospace/.archive/agents/workspace-charter.md` | archived reference |

**Content assessment:** ecosystem-map.md describes a 2026-era agent hierarchy (L0-L5b, 14 roles, DAG flow, escalation rules, MCP sandboxing) that was designed for a future state (Swarm agents, QA teams, DevOps pipeline). The **actually used** hierarchy today is simpler: Axis/Logos/Satoshi + Domain Lead + G3 (Player + Coach). The ecosystem-map describes infrastructure that doesn't exist yet (approval-router, sandboxed MCP servers, Release Swarm, Monitor Swarm).

### 1.1.4 Gap Analysis: Would AGENTS.md + projects.yaml break anything?

**Would adding `nospace/AGENTS.md` break anything?**
- No. No file at that path exists. No references to it. Clean addition.
- Risk: yet another navigation file. Must be clearly differentiated from `~/.claude/CLAUDE.md` (which is the auto-loaded one) and `agents/ecosystem-map.md` (which has detailed topology).
- **Recommendation:** AGENTS.md should be a thin router (< 30 lines), not a content doc. Purpose: "which project am I working on?" not "how does the agent system work?"

**Would adding `nospace/projects.yaml` break anything?**
- No. No file at that path exists. Clean addition.
- Risk: YAML is not auto-loaded by Claude Code. An agent would need to be told to read it, or a skill would need to parse it.
- **Recommendation:** Useful for tooling (scripts that generate project lists, validate paths). Less useful for agents who already get routing from CLAUDE.md. Value depends on whether automation will consume it.

### 1.1.5 Structural Observation: The Two CLAUDE.md Problem

**Current state:**
- `~/.claude/CLAUDE.md` = THE auto-loaded file (128 lines). Contains workspace entry point, routing table, orchestrator protocol, security rules.
- `nospace/CLAUDE.md` = DOES NOT EXIST.

**But the content of `~/.claude/CLAUDE.md` says:**
> `# /nospace — Workspace Entry Point`
> Paths like `rules/global-constitution.md`, `agents/ecosystem-map.md` are relative to nospace/

This creates ambiguity: the file lives in `~/.claude/` but its paths are relative to `nospace/`. Agents must mentally resolve `agents/ecosystem-map.md` as `nospace/agents/ecosystem-map.md` (absolute: `C:\Users\noadmin\nospace\agents\ecosystem-map.md`).

**Risk if changed:** Creating a `nospace/CLAUDE.md` that differs from `~/.claude/CLAUDE.md` would create two competing entry points. Must be one or the other, not both.

---

## Phase 1.2 — Memory Loading Discipline

### 1.2.1 Skill Definitions — What Each Session Start Loads

#### `/startaxis` (166 lines, ~664 tokens for the skill itself)

| Step | What it reads | Lines | Est. tokens | Conditional? |
|---|---|---|---|---|
| 1 | `~/.tlos/axis-active` | 1 | ~4 | Always (crash recovery) |
| 2 | L1 (`tlos-about.md` / `harkly-about.md` / `contexter-about.md`) | 170-243 | ~680-972 | Based on project |
| 2 | L2 (`tlos-roadmap.md` / `harkly-roadmap.md`) | 95-424 | ~380-1,696 | Based on project |
| 2 | `protocols/axis.md` | 67 | ~268 | Always |
| 3 | L3 (active epic file) | ~50-200 | ~200-800 | Based on project |
| 4 | Chronicle queue drain | varies | varies | tlos only |
| 5 | Scratch processing | varies | varies | tlos only |
| 5b | `auto-scratch.md` | varies | varies | tlos only |
| 6 | Create placeholder + write axis-active | 0 (write) | 0 | Always |
| 7 | Chronicle index (last 5 rows) | ~25 | ~100 | Always |
| **Total (tlos, typical)** | | **~800** | **~3,200** | |
| **Total (harkly, typical)** | | **~500** | **~2,000** | |

**Note:** Steps 4-5b (chronicle drain, scratch processing) are READ + WRITE operations that consume additional tokens for the content being processed (old scratch files, queue files). A session with 3 unprocessed scratches could add 120+ lines (~480 tokens) just to read them before processing.

#### `/startlogos` (116 lines, ~464 tokens for skill)

| Step | What it reads | Lines | Est. tokens | Conditional? |
|---|---|---|---|---|
| 1 | `~/.tlos/logos-active` | 1 | ~4 | Always |
| 2 | L1 + L2 | 264-667 | ~1,056-2,668 | Based on project |
| 3 | L3 (active epic) | ~50-200 | ~200-800 | Based on project |
| 4 | Scratch processing | varies | varies | Always |
| 4b | `auto-scratch.md` | varies | varies | Always |
| 5 | Create placeholder + write logos-active | 0 | 0 | Always |
| **Total (tlos, typical)** | | **~700** | **~2,800** | |

**Key difference from startaxis:** Logos does NOT drain chronicle queue (only Axis drains). Logos does NOT read `protocols/axis.md`.

#### `/startsatoshi` (156 lines, ~624 tokens for skill)

| Step | What it reads | Lines | Est. tokens | Conditional? |
|---|---|---|---|---|
| 1 | `~/.tlos/satoshi-active` | 1 | ~4 | Always |
| 2 | L1 (`nomos-about.md`) | 114 | ~456 | Always (only nomos) |
| 2 | L2 (`nomos-roadmap.md`) | unknown | ~? | Always |
| 3 | L3 (active epic) | ~50-100 | ~200-400 | Always |
| 4 | Chronicle queue drain | varies | varies | Always |
| 5 | Scratch processing | varies | varies | Always |
| 5b | Market context (WebSearch) | 0 | 0 (external) | Optional |
| 7 | Chronicle index (last 5) | ~5-10 | ~20-40 | Always |
| **Total (typical)** | | **~300** | **~1,200** | |

**Lightest session start** — Nomos is a small project with minimal history.

#### `/startgsession` (107 lines, ~428 tokens for skill)

| Step | What it reads | Lines | Est. tokens | Conditional? |
|---|---|---|---|---|
| 1 | `nospace/CLAUDE.md` | 0 | 0 | File DOES NOT EXIST — will fail silently |
| 1 | `rules/global-constitution.md` | 99 | ~396 | Always |
| 2 | 13 regulation files | 1,837 | ~7,348 | Always (ALL at once) |
| 3 | `assistant-pd.md` | 43 | ~172 | Always |
| 4 | `semantic-context-global.md` | 92 | ~368 | Always |
| 4 | `current-context-global.md` | 73 | ~292 | Always |
| 4 | `episodic-context-global.md` | 732 | ~2,928 | Always |
| 5 | `handshake.md` | 65 | ~260 | Always |
| **Total** | | **2,941** | **~11,764** | |

**CRITICAL FINDING:** `/startgsession` is the most expensive skill at **~11,764 tokens** for file reads alone. The 13 regulations consume 7,348 tokens (62% of total). The episodic-context-global at 732 lines is the largest single file at 2,928 tokens.

**Bug:** Step 1 instructs to read `nospace/CLAUDE.md` which does not exist. The content is already auto-loaded via `~/.claude/CLAUDE.md`, making this a redundant (and broken) read.

### 1.2.2 L1 File Sizes

| Project | File | Lines | Est. tokens | Has section index? |
|---|---|---|---|---|
| tLOS | `tlos-about.md` | 243 | ~972 | Yes (Navigation table at bottom, Active L3 table, Key Paths table) |
| Harkly | `harkly-about.md` | 170 | ~680 | Yes (Navigation table, Active L3 table, Key Paths table) |
| Contexter | `contexter-about.md` | 116 | ~464 | Partial (Active L3 table, Key Paths table, but no explicit Navigation section) |
| Nomos | `nomos-about.md` | 114 | ~456 | Partial (Navigation table, Active L3 table) |

**Can L1 files be loaded partially?**
- All L1 files are structured with clear `##` headers (Identity, Tech Stack, Key Paths, Active L3, Navigation)
- Theoretically partitionable by section, but no existing mechanism to do selective loading
- The `Active L3` section (~10-20 lines) is the most frequently needed part at session start
- `Tech Stack` and `Key Paths` are reference sections rarely needed at orientation time

**Partial loading potential:**
- "Essential" L1 (Identity + Active L3 + Navigation): ~30-50 lines (~120-200 tokens)
- "Reference" L1 (Tech Stack, Key Paths, Docker, Brand, etc.): ~70-200 lines (~280-800 tokens)
- **Savings if deferred: 60-75% of L1 token cost**

### 1.2.3 L2 File Sizes

| Project | File | Lines | Est. tokens |
|---|---|---|---|
| tLOS | `tlos-roadmap.md` | 424 | ~1,696 |
| Harkly | `harkly-roadmap.md` | 95 | ~380 |

**Observation:** tLOS roadmap is 4.5x larger than Harkly's because it includes detailed phase descriptions (Phases 11-16) with tracks and task tables. Most of this is historical (completed phases) or future (Phase 16 planning). Only the Active Epics section and current phase details are operationally relevant.

**Partial loading potential for tLOS L2:**
- "Essential" (Active Epics table + current IN PROGRESS phase): ~50 lines (~200 tokens)
- "Reference" (completed phases, future phases): ~374 lines (~1,496 tokens)
- **Savings if deferred: 88% of tLOS L2 token cost**

### 1.2.4 Chronicle Sizes

| Project | Total lines (all chronicle files) | Largest single file |
|---|---|---|
| tLOS | 7,481 | `tlos-chronicle.md` (4,163 lines) |
| Harkly | 1,219 | `harkly-current.md` (352 lines) |
| Contexter | 182 | `contexter-current.md` (39 lines) |
| Nomos | 19 | `nomos-current.md` (13 lines) |

**tLOS chronicle is the largest concern** — 7,481 lines across 80+ files. The archive `tlos-chronicle.md` alone is 4,163 lines (~16,652 tokens). This is never loaded at session start (only index.md, last 5 rows), but scratch processing in Step 5 reads and rewrites scratch files.

**Scratch file accumulation (tLOS):** 61 scratch files in `chronicle/scratches/`, ranging from 2 to 431 lines. Step 5 of startaxis processes any with `<!-- ENTRY:` markers, which involves reading each file fully.

### 1.2.5 Total Session Start Token Cost

| Session type | Auto-loaded | Skill reads | Skill itself | Total est. | Tool calls |
|---|---|---|---|---|---|
| **Any session (no skill)** | ~2,700 | 0 | 0 | **~2,700** | 0 |
| **startaxis (tlos)** | ~2,700 | ~3,200 | ~664 | **~6,564** | 8-12 |
| **startaxis (harkly)** | ~2,700 | ~2,000 | ~664 | **~5,364** | 6-8 |
| **startlogos (tlos)** | ~2,700 | ~2,800 | ~464 | **~5,964** | 6-8 |
| **startsatoshi (nomos)** | ~2,700 | ~1,200 | ~624 | **~4,524** | 6-8 |
| **startgsession** | ~2,700 | ~11,764 | ~428 | **~14,892** | 19-22 |

### 1.2.6 What Could Be Deferred (Loaded on Demand)

| Currently loaded at start | Lines | Est. tokens | Can defer? | Risk |
|---|---|---|---|---|
| **13 regulations (startgsession)** | 1,837 | ~7,348 | YES — load only when relevant regulation needed | Agent may violate unknown rule; mitigate by keeping constitution (99 lines) as anchor |
| **episodic-context-global.md** | 732 | ~2,928 | YES — load last N entries, not all | Loss of historical context; rarely needed for task execution |
| **L1 reference sections** (Tech Stack, Docker, Key Paths) | ~150-200 per project | ~600-800 | YES — load when agent needs to write code or navigate paths | Agent asks more questions; mitigate with L1 "essential" subset |
| **L2 completed phases** | ~300 (tlos) | ~1,200 | YES — load only active/next phases | Loss of phase history context; rarely needed |
| **protocols/axis.md** | 67 | ~268 | NO — MEMORY_PRESSURE protocol must be known from start | Would break pressure handling |
| **Chronicle index (last 5)** | ~25 | ~100 | NO — low cost, high orientation value | — |
| **Active L3 file** | ~50-200 | ~200-800 | NO — defines what to work on | Would break task continuity |
| **Scratch processing (tlos steps 4-5)** | varies | varies | PARTIALLY — could batch process instead of inline | Stale scratches accumulate; acceptable if drained at close |

**Maximum theoretical savings:**

| Session type | Current tokens | With deferrals | Savings |
|---|---|---|---|
| startgsession | ~14,892 | ~5,500 | **63%** (~9,400 tokens) |
| startaxis (tlos) | ~6,564 | ~4,200 | **36%** (~2,400 tokens) |
| startaxis (harkly) | ~5,364 | ~3,800 | **29%** (~1,500 tokens) |

### 1.2.7 Hardcoded File Paths in Skills

All four skills contain hardcoded absolute paths. Inventory of path patterns:

**Hardcoded in ALL skills:**
- `/c/Users/noadmin/.tlos/{agent}-active` — crash recovery pointer
- `/c/Users/noadmin/.claude/projects/c--Users-noadmin/*.jsonl` — session ID extraction
- `/c/Users/noadmin/nospace/development/tLOS/memory/` — tLOS memory root
- `/c/Users/noadmin/nospace/development/harkly/memory/` — Harkly memory root

**Hardcoded in startaxis only:**
- `/c/Users/noadmin/nospace/development/tLOS/memory/chronicle/queue/*.md`
- `/c/Users/noadmin/nospace/development/tLOS/memory/chronicle/tlos-current.md`
- `/c/Users/noadmin/.claude/protocols/axis.md`

**Hardcoded in startgsession only:**
- `/c/Users/noadmin/nospace/CLAUDE.md` (BROKEN — file does not exist)
- `/c/Users/noadmin/nospace/rules/global-constitution.md`
- `/c/Users/noadmin/nospace/rules/regulations/*.md` (13 explicit paths)
- `/c/Users/noadmin/nospace/rules/position-descriptions/assistant-pd.md`
- `/c/Users/noadmin/nospace/memory/semantic-context-global.md`
- `/c/Users/noadmin/nospace/memory/current-context-global.md`
- `/c/Users/noadmin/nospace/memory/episodic-context-global.md`
- `/c/Users/noadmin/nospace/memory/handshake.md`

**Risk if paths change:** Every skill would need manual update. No indirection layer exists (no config file mapping logical names to physical paths). The project path mapping tables inside startaxis/startlogos/startsatoshi are the closest thing to a registry, but they're embedded in the skill markdown.

### 1.2.8 What Would Break If Loading Order Changed?

| Change | Would break? | Why |
|---|---|---|
| Load L2 before L1 | NO — both are independent reference docs | But L1 contains Active L3 pointers needed for Step 3 |
| Load L3 before L1 | YES — L3 filename comes from L1's Active L3 table | Agent wouldn't know which L3 to load |
| Skip L2 entirely | NO — L2 is roadmap context, not execution-critical | Agent loses phase awareness but can still work |
| Skip regulations (startgsession) | PARTIALLY — agent may unknowingly violate rules | Constitution + CLAUDE.md cover most critical rules already |
| Skip chronicle drain (startaxis) | NO — scratches accumulate but no data loss | Must drain eventually; deferring to close is safe |
| Reorder startgsession to load memory before regulations | NO — memory files are independent | Slight improvement: knowing workspace state before reading all rules |

---

## Summary of Findings

### Phase 1.1 — Root Navigation

| Finding | Severity | Action |
|---|---|---|
| `nospace/CLAUDE.md` does not exist; content lives in `~/.claude/CLAUDE.md` | INFO | Clarify: is this intentional? Create symlink or keep only in ~/.claude/ |
| `nospace/AGENTS.md` does not exist | GAP | Safe to create as thin router (<30 lines) |
| `nospace/projects.yaml` does not exist | GAP | Safe to create; value depends on tooling consumers |
| `nospace/.claude/rules/` does not exist | INFO | No path-scoped rules at workspace level; all rules in `~/.claude/rules/` |
| `ecosystem-map.md` describes future-state agent hierarchy, not current operational reality | DRIFT | Referenced by 10 files; updating it affects governance chain |
| `~/.claude/CLAUDE.md` paths are relative to nospace/ but file lives in ~/.claude/ | AMBIGUITY | Agents must resolve manually; error-prone for new agents |

### Phase 1.2 — Memory Loading

| Finding | Severity | Action |
|---|---|---|
| `/startgsession` costs ~14,892 tokens — 63% from regulations that may not be needed | HIGH | Defer regulations; load constitution + CLAUDE.md only |
| `/startgsession` Step 1 tries to read `nospace/CLAUDE.md` which doesn't exist | BUG | Fix: remove or redirect to the auto-loaded CLAUDE.md |
| `episodic-context-global.md` (732 lines) is loaded fully every gsession start | HIGH | Load last N entries or defer entirely |
| L1 files load 60-75% reference content not needed at orientation time | MEDIUM | Split into essential/reference sections; load reference on demand |
| tLOS L2 roadmap (424 lines) is 88% historical/future content | MEDIUM | Load only active phases section |
| All skills contain 15+ hardcoded absolute paths | DEBT | Extract to `projects.yaml` or path registry; skills reference registry |
| Chronicle drain (startaxis steps 4-5) adds variable cost based on unprocessed scratches | LOW | Acceptable; drain-at-close pattern already works |
| No mechanism for partial L1/L2 loading exists | DESIGN GAP | Requires either file splitting or SQLite transition (Phase 16 scope) |
| `protocols/axis.md` (67 lines) is always loaded — justified (MEMORY_PRESSURE protocol) | OK | Keep as-is |
| Skill definitions themselves cost 428-664 tokens each | OK | Acceptable overhead for structured onboarding |
