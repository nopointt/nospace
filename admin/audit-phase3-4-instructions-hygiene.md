# Audit: Phase 3 (Instruction Architecture) + Phase 4 (Structural Hygiene)

**Date:** 2026-03-22
**Auditor:** Axis (Orchestrator)

---

## Phase 3 — Instruction Architecture

### 3.1 Always-Loaded System Prompt (Every Turn)

These files are injected into EVERY prompt as system context:

| File | Lines | Bytes | ~Tokens |
|---|---|---|---|
| `~/.claude/CLAUDE.md` | 128 | 9,563 | ~2,390 |
| `~/.claude/rules/agents.md` | 91 | 3,587 | ~897 |
| `~/.claude/rules/coding-style.md` | 48 | 1,450 | ~363 |
| `~/.claude/rules/git-workflow.md` | 45 | 1,114 | ~279 |
| `~/.claude/rules/hooks.md` | 30 | 798 | ~200 |
| `~/.claude/rules/patterns.md` | 31 | 1,053 | ~263 |
| `~/.claude/rules/performance.md` | 59 | 2,202 | ~551 |
| `~/.claude/rules/security.md` | 29 | 891 | ~223 |
| `~/.claude/rules/testing.md` | 52 | 1,587 | ~397 |
| `~/.claude/rules/README.md` | 5 | 247 | ~62 |
| `~/.claude/projects/.../MEMORY.md` | 157 | 13,053 | ~3,263 |
| **TOTAL always-loaded** | **675** | **35,545** | **~8,886** |

### 3.2 Auto-Memory Pointer Files (Also Always-Loaded)

The MEMORY.md file references 40 pointer files in `~/.claude/projects/c--Users-noadmin/memory/`. These are auto-memory entries that Claude loads on demand when referenced. However, the MEMORY.md itself contains a full index of all pointers with inline summaries.

| Item | Count | Total Bytes | ~Tokens |
|---|---|---|---|
| Pointer files (`feedback_*`, `project_*`, `reference_*`, `user_*`, `ideas_*`) | 40 | 58,470 | ~14,617 |
| MEMORY.md (index with summaries) | 1 | 13,053 | ~3,263 |

**Key observation:** MEMORY.md is 157 lines / 13KB. It's the single largest always-loaded file. It contains inline summaries for every pointer, effectively duplicating ~30% of pointer content.

### 3.3 Project-Level Instructions (Loaded When in Project Dir)

When working from `nospace/development/tLOS/core/`:

| File | Bytes | ~Tokens | Notes |
|---|---|---|---|
| `core/CLAUDE.md` | 2,796 | ~699 | **STALE** — references Qwen/Kimi/GLM agents, `kimicode/`, `glmcode/` |
| `core/.claude/rules/agent-workflow.md` | 8,373 | ~2,093 | **STALE** — Kimi K2.5 + GLM 4.7 Tandem Protocol (deprecated) |
| `core/.claude/rules/logging.md` | 2,654 | ~664 | Likely current |
| `core/.claude/skills/ui-ux-pro-max/SKILL.md` | 14,784 | ~3,696 | Large skill (on-demand via skill invocation) |
| `core/.claude/skills/ui-ux-pro-max/data/` | 268K | — | CSV data files (loaded by skill scripts) |
| `core/.claude/commands/` (12 files) | — | — | Project slash commands |

**tLOS project-level adds ~3,456 tokens to system prompt** (CLAUDE.md + rules). The agent-workflow.md is entirely about deprecated CLI agents and should be archived.

### 3.4 Global Commands and Protocols

| Item | Count | Total Bytes | ~Tokens |
|---|---|---|---|
| Global commands (`~/.claude/commands/`) | 21 | 79,193 | ~19,798 |
| Protocols (`~/.claude/protocols/`) | 4 | 8,968 | ~2,242 |

Commands are NOT always-loaded (on-demand via `/command`). Same for protocols.

### 3.5 Hooks

| Hook | File | Bytes |
|---|---|---|
| UserPromptSubmit | `quota-guard.ts` | 4,671 |
| SessionStart | `mem-session-start.ts` | 2,853 |
| Stop | `kill-subagents.ps1` | 421 |
| PostToolUse (Write/Edit) | `auto-scratch.py` | 2,356 |
| PostToolUse (Read/Bash/Grep) | `session-index.py` | 4,437 |
| PostToolUse (Agent/TaskStop) | `eidolon-register.py` | 5,726 |
| (unused) | `search-index.py` | 2,721 |
| (unused) | `vscode-watchdog.ps1` | 958 |

### 3.6 Settings Configuration

`~/.claude/settings.json` contains:
- `effortLevel: "high"`
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"`
- 87 `allow` permission entries (many are legacy Qwen/OpenCode patterns)
- 26 `deny` permission entries (destructive commands)
- 10 `additionalDirectories`
- 6 hooks configured

**Bloat in permissions:** ~30+ allow entries reference `qwen`, `opencode`, `curl` to specific endpoints, and other one-off patterns that are no longer needed.

### 3.7 Duplication Analysis

| Duplication | Location A | Location B | Assessment |
|---|---|---|---|
| Orchestrator Protocol | CLAUDE.md (lines 95-128) | rules/agents.md (lines 1-91) | **Overlap** — both describe Domain Lead + G3 pipeline. CLAUDE.md has a summary, agents.md has details. |
| Immutability rule | CLAUDE.md (coding-style ref) | rules/coding-style.md | OK — CLAUDE.md just references |
| Handshake mention | CLAUDE.md navigation table | memory/feedback_no_handshake.md | **Conflict** — CLAUDE.md still lists handshake paths but feedback says deprecated |
| Agent roles (deprecated) | core/CLAUDE.md (Qwen/Kimi/GLM) | rules/agents.md (Domain Lead only) | **STALE** — core/CLAUDE.md contradicts global |

### 3.8 Token Budget Summary

| Layer | ~Tokens | When Loaded |
|---|---|---|
| Global CLAUDE.md | ~2,390 | Every prompt |
| Global rules (8 files) | ~3,233 | Every prompt |
| MEMORY.md (auto-memory index) | ~3,263 | Every prompt |
| **Tier 1 total (every prompt)** | **~8,886** | **Always** |
| tLOS project CLAUDE.md + rules | ~3,456 | When in tLOS dir |
| Global commands (21) | ~19,798 | On-demand only |
| Protocols (4) | ~2,242 | On-demand only |
| Pointer files (40) | ~14,617 | Loaded selectively |
| ui-ux-pro-max SKILL.md | ~3,696 | On skill invocation |

**~8,886 tokens are consumed EVERY prompt just for instructions.** This is before any code, conversation, or tool output.

### 3.9 Optimization Recommendations

#### Tier 1 (Always-Loaded) — Target: reduce from ~8,886 to ~5,000

1. **MEMORY.md (3,263 tokens):** Remove inline summaries from pointer references. Keep only pointer names + paths. Saves ~1,500 tokens.
2. **rules/README.md (62 tokens):** States "for human reference only, not used by Claude at runtime." Should be excluded from rules/ dir or renamed to not match .md pattern. Tiny but wasteful.
3. **CLAUDE.md Orchestrator Protocol section:** Already duplicated in agents.md. Replace with `See rules/agents.md`. Saves ~400 tokens.
4. **CLAUDE.md Context section (lines 70-88):** Move to `rules/context-economy.md` as path-scoped rule. Saves ~300 tokens.
5. **CLAUDE.md Navigation table (lines 28-50):** Mostly references to deprecated handshake files and roles that are rarely used. Compress to 3 lines. Saves ~300 tokens.

#### Tier 2 (Path-Scoped Rules) — Not Currently Used

No files in `~/.claude/rules/` have YAML frontmatter with `paths:`. This feature is available but unused. Candidates for path-scoping:
- `testing.md` — only relevant for tLOS (no test infra), not Harkly/Contexter
- `patterns.md` — generic enough to keep global, but skeleton project pattern is tLOS-specific

#### Tier 3 (Stale Content to Archive)

- `core/CLAUDE.md` — references Qwen as coder, glmcode/kimicode directories. Needs full rewrite.
- `core/.claude/rules/agent-workflow.md` — 8,373 bytes of Kimi+GLM tandem protocol. 100% deprecated.
- `core/.claude/commands/handshake.md` — deprecated per feedback_no_handshake.md
- `core/.claude/commands/handover.md` — likely deprecated (replaced by `/closeaxis` etc.)
- `core/.claude/handshake.md` — deprecated

#### Would Splitting CLAUDE.md Break Orchestrator Protocol?

**No.** The Orchestrator Protocol is already split between CLAUDE.md (summary) and rules/agents.md (details). CLAUDE.md could be trimmed to just: (1) workspace entry point, (2) identity/onboarding pointers, (3) safety rules. Everything else can move to rules/ files.

---

## Phase 4 — Structural Hygiene

### 4.1 Deprecated CLI Agent Directories

| Directory | Files | Status | References Found |
|---|---|---|---|
| `core/glmcode/` | 14 | Dead — GLM 4.7 delivery artifacts (Cycle 12-14) | 8 .md files reference it (mostly archive + CLAUDE.md) |
| `core/kimicode/` | 15 | Dead — Kimi K2.5 delivery artifacts (Cycle 6-13) | Same reference set |
| `core/.qwen/` | 17 | Dead — Qwen 2.5 config, skills, commands | Referenced in settings.json allow list + archive |
| `core/.opencode/` | 16 | Dead — OpenCode config, instructions | Referenced in settings.json allow list + archive |
| **Total** | **62 files** | | |

**Safety:** All 4 directories can be moved to `core/.archive/`. Only references are in:
- `core/CLAUDE.md` (itself stale, needs rewrite)
- `core/.claude/rules/agent-workflow.md` (itself deprecated)
- `settings.json` allow list (cleanup separately)
- Archive files (already archived content)

**No active regulation, skill, or command depends on these directories.**

### 4.2 Stale Recursive Directory

```
nospace/development/tLOS/development/tLOS/branches/l3-agents/step9-spec.md
```

A nested `development/tLOS/` inside `development/tLOS/` containing exactly 1 file. This is an accidental path creation from a spec step.

**Safety:** Safe to archive. 1 file, no references.

### 4.3 Stale Artifacts

| Item | Type | Status |
|---|---|---|
| `core/dir created/` | Empty directory with space in name | Safe to archive |
| `docs/time oracle/` | Directory with space, contains 1 .md file | Safe to archive |

### 4.4 Files with Spaces in Names

**Count: 17 files**

| Category | Count | Examples |
|---|---|---|
| Harkly branch outputs (report names) | 2 | `Taxi Life_ A City Driving Simulator_*.md` |
| Harkly branch specs | 3 | `Harkly Architecture Spec.md`, `Webshare 10 proxies.txt`, `CX-исследователей_...pdf` |
| Tauri default icon | 2 | `128x128 @2x.png` (harkly-shell + tLOS shell) |
| MCB docs (Russian names) | 5 | `Marketing Command Board (MCB).md`, xlsx files |
| Other docs | 5 | `StoryBrand Layer.md`, `time oracle` contents, `Strategic Brief` |

**Priority:** Low. Most are in branches/ or docs/. The Tauri icons are auto-generated defaults. The MCB files are user uploads.

### 4.5 Directories with Spaces in Names

**Count: 3 directories**

1. `development/tLOS/branches/feat-site-v1/templates/spotify-visualiser/public/Aeonik TRIAL` — font trial directory
2. `development/tLOS/core/dir created` — empty stale artifact
3. `docs/time oracle` — legacy doc directory

### 4.6 Handshake Files (Deprecated)

Per `feedback_no_handshake.md`: "handshake files deprecated -- scratches only, do not read/write handshake"

**Active (non-archive) handshake files still present: 6**

| File | Referenced By | Safety |
|---|---|---|
| `nospace/memory/handshake.md` | CLAUDE.md navigation table, context-economy-regulation.md | Needs ref cleanup first |
| `nospace/memory/handshake-assistant.md` | CLAUDE.md navigation table | Needs ref cleanup first |
| `development/harkly/memory/handshake-harkly.md` | Possibly harkly-about.md | Check before archiving |
| `development/tLOS/memory/handshake-tLOS.md` | Possibly tlos-about.md | Check before archiving |
| `core/.claude/commands/handshake.md` | Available as `/project:handshake` | Remove from commands/ |
| `core/.claude/handshake.md` | Legacy skill file | Safe to archive |

**Also in deprecated agent dirs:** `.opencode/commands/handshake.md`, `.qwen/commands/handshake.md`, `.qwen/skills/handshake/` — will be archived with parent dirs.

**Active references to update:**
- `~/.claude/CLAUDE.md` line mentioning `memory/handshake.md` and `memory/handshake-assistant.md`
- `nospace/rules/regulations/context-economy-regulation.md`
- `nospace/agents/comet/` (4 files reference handshake)

### 4.7 Scratch Files Accumulation

| Location | Count | Status |
|---|---|---|
| **tLOS active** (`memory/scratches/`) | 6 | Current working set |
| **tLOS chronicle archive** (`memory/chronicle/scratches/`) | 63 | Historical, read-only |
| **tLOS processed archive** (`core/kernel/archive/scratches-processed/`) | 38 | Already processed |
| **Harkly active** (`memory/` root level) | 17 | Should be in `memory/scratches/` |
| **Harkly chronicle archive** | 9 | Historical |
| **Contexter** | 2 | Minimal |
| **Nomos** | 1 | Minimal |
| **Total scratch files** | **136** | |

**Issues:**
1. Harkly has 17 scratches directly in `memory/` root instead of `memory/scratches/` subdirectory
2. tLOS has scratches in 3 separate locations (active, chronicle, processed) — inconsistent with Harkly which uses 2 locations
3. tLOS processed archive (38 files) duplicates chronicle archive — some files exist in both

### 4.8 Empty Directories

**Total: 68** (excluding build artifacts, .git, node_modules, target/, .wrangler/, .g3/)

| Area | Count | Notes |
|---|---|---|
| `agents/` | 10 | Placeholder role directories (assistant, cto, devops-lead, etc.) — never populated |
| `development/` | 16 | Various empty subdirs (brand, design, logs, etc.) |
| `docs/` | 10 | Empty research eval dirs, empty subdirs |
| `design/` | 2 | `design_system/bauhaus/`, `design_system/registry/` |
| `memory/` | 6 | Empty chronicle/scratches dirs for projects |
| Other | 24 | Misc |

**Agent placeholder dirs (10):** `nospace/agents/` has directories for assistant, cto, devops-lead, frontend-engineer, qa-lead, research-assistant, reviewer-agent, senior-architect, sre-lead, tech-lead — all empty. These are from the original RBAC design but were never populated with agent definitions.

### 4.9 Nested Git Repos

**Total: 34 nested .git directories** (no submodules configured)

| Category | Count | Assessment |
|---|---|---|
| Expected (cloned templates, _eval, oss-reference, tools) | 31 | OK — research/reference repos |
| Orphaned | 3 | Need investigation |

**Orphaned repos:**
1. `development/tLOS/core/.git` — the tLOS core was originally a separate repo. Now tracked by nospace parent. **Risk: conflicting git tracking.** Files may be tracked by both repos.
2. `docs/research/public-apis/.git` — cloned reference, should be in `_eval/`
3. `docs/tLOS/.git` — legacy tLOS docs repo, now part of nospace

### 4.10 Settings.json Cleanup Needed

The `permissions.allow` list contains 87 entries. At least 30 are legacy:
- 6 entries for `opencode run -m opencode/minimax-m2.5-free` (deprecated CLI)
- 4 entries for `qwen` commands (deprecated CLI)
- Multiple `curl` entries to `localhost:3000` (Harkly dev server, one-time testing)
- Python one-liner entries for parsing agent output (no longer needed)
- `Bash(echo "..."` entries that should never have been persisted

---

## Summary: Cleanup Inventory

### Priority 1 — Stale Content Causing Confusion (5 items)

| # | Item | Action | Effort |
|---|---|---|---|
| 1 | `core/CLAUDE.md` — references Qwen/Kimi/GLM as active agents | Rewrite to reflect current Domain Lead + G3 model | 15 min |
| 2 | `core/.claude/rules/agent-workflow.md` — 8KB of deprecated Kimi+GLM protocol | Move to `core/.archive/` | 1 min |
| 3 | `core/.claude/commands/handshake.md` + `core/.claude/handshake.md` | Move to `core/.archive/` | 1 min |
| 4 | CLAUDE.md navigation table — lists deprecated handshake paths | Update references | 5 min |
| 5 | MEMORY.md handshake references | Remove `handshake.md` and `handshake-assistant.md` from nav table | 5 min |

### Priority 2 — Dead Directories to Archive (4 items, 62 files)

| # | Item | Files | Action | Effort |
|---|---|---|---|---|
| 6 | `core/glmcode/` | 14 | Move to `core/.archive/glmcode/` | 1 min |
| 7 | `core/kimicode/` | 15 | Move to `core/.archive/kimicode/` | 1 min |
| 8 | `core/.qwen/` | 17 | Move to `core/.archive/.qwen/` | 1 min |
| 9 | `core/.opencode/` | 16 | Move to `core/.archive/.opencode/` | 1 min |

### Priority 3 — Structural Hygiene (6 items)

| # | Item | Action | Effort |
|---|---|---|---|
| 10 | `development/tLOS/development/tLOS/` recursive dir (1 file) | Move file to proper location, remove empty dirs | 2 min |
| 11 | `core/dir created/` empty dir with space | Archive | 1 min |
| 12 | 6 handshake files in active paths | Archive after updating references | 10 min |
| 13 | Harkly 17 scratches in `memory/` root | Move to `memory/scratches/` | 5 min |
| 14 | `settings.json` — 30+ stale permission entries | Clean up allow list | 10 min |
| 15 | `rules/README.md` in rules dir | Rename or move (wastes 62 tokens every prompt) | 1 min |

### Priority 4 — Low Priority / Cosmetic (3 items)

| # | Item | Action | Effort |
|---|---|---|---|
| 16 | 10 empty agent placeholder dirs | Keep (may be populated later) or archive | 2 min |
| 17 | 3 orphaned nested .git repos | Investigate `core/.git` conflict, move others | 15 min |
| 18 | 17 files with spaces + 3 dirs with spaces | Rename where safe (skip Tauri icons, user uploads) | 10 min |

### Priority 5 — Token Optimization (4 items)

| # | Item | Savings | Effort |
|---|---|---|---|
| 19 | MEMORY.md — remove inline summaries, keep pointers only | ~1,500 tokens/prompt | 20 min |
| 20 | CLAUDE.md — extract Orchestrator Protocol to agents.md only | ~400 tokens/prompt | 10 min |
| 21 | CLAUDE.md — extract Context section to path-scoped rule | ~300 tokens/prompt | 10 min |
| 22 | CLAUDE.md — compress navigation table | ~300 tokens/prompt | 5 min |

---

## Total Counts

| Category | Count |
|---|---|
| Stale/deprecated files to archive | 62 (CLI agents) + 8 (handshake/commands) + 2 (workflow/CLAUDE) = **72** |
| Empty directories | **68** |
| Files with spaces | **17** |
| Directories with spaces | **3** |
| Nested git repos (total) | **34** (3 orphaned) |
| Scratch files (total) | **136** (17 misplaced in Harkly) |
| Stale permission entries | **~30** |
| Token savings potential | **~2,500 tokens/prompt** (from ~8,886 to ~6,386) |

---

## Risk Assessment

| Action | Risk | Mitigation |
|---|---|---|
| Archive CLI agent dirs | None — explicitly deprecated in rules/agents.md | Move, do not delete |
| Rewrite core/CLAUDE.md | Medium — subagents in tLOS dir rely on it | Write new version aligned with current model |
| Archive handshake files | Low — MEMORY.md says deprecated | Update all references first |
| Clean settings.json | Low — allow entries are additive | Remove one category at a time |
| Slim MEMORY.md | Medium — pointers may be harder to find without summaries | Keep pointer paths, remove only prose summaries |
| Move Harkly scratches | Low — just path reorganization | Update any scratch-reading code in hooks |
