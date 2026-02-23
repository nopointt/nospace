# MEMORY SYSTEM REGULATION
> Applies to: all AI agents operating under /nospace.
> Authority: Senior Architect. Review: per quarter.
> Tags: [memory, regulation, consolidation, handoff, decay]

---

## § 1 — Tiered Memory Model

Agents MUST write to memory in the correct tier. Never skip tiers.

| Tier | File | When to Write | Who Reads |
|---|---|---|---|
| 0 — Raw | `scratchpad.md` | Continuously, during active work | Owning agent only |
| 1 — Summary | `current-context.md` | When a branch or epic closes | Project + Global agents |
| 2 — Semantic | `semantic-context.md` | Via `merge_to_semantic` tool only | All agents at that scope |
| 3 — Episodic | `episodic-context.md` | Append after major decisions | Reviewer Agent + Global agents |

**Reading direction:** Global agents read downward (global → project). Branch agents read upward (branch → project only). Branch agents NEVER read global memory.

---

## § 2 — Handoff Protocol (`merge_to_semantic`)

> This is a mandatory programmatic step, not an optional write.

**Trigger:** When `commit-summary.md` is finalized and the branch closes.

**Steps the agent MUST execute in order:**
1. Read `commit-summary.md` — extract the YAML entity blocks.
2. Call `merge_to_semantic` tool (or manually execute the equivalent append operation if the tool is unavailable).
3. Append entity blocks to `semantic-context-<project>.md` with `Consolidation_status: new`.
4. Append a one-line entry to `episodic-context-<project>.md`.
5. Update `current-context-<project>.md` — remove the branch from Active Epics, increment commit counter.
6. Log the handoff in `/memory/logs/agents/<agent-id>-<date>.md`.

**NEVER** copy entities manually without calling the tool. Manual writes bypass audit.

---

## § 3 — Memory Consolidation (Reviewer Agent)

**Schedule:** Every 10 commits OR weekly, whichever comes first. Tracked in `current-context.md → Last Consolidation`.

**Reviewer Agent tasks:**
1. Read `semantic-context-<project>.md` in full.
2. Identify duplicate entities (same concept, different names).
3. Merge duplicates: keep the most recent `Last_updated`, union all `Facts`.
4. Identify stale entities: `Last_updated` older than 90 days with no references in recent commits.
5. Mark stale entities with `Consolidation_status: archived` — do NOT delete, move to `## Archived Entities` section.
6. Update `current-context.md → Last Consolidation` with date and counts.
7. Append a consolidation entry to `episodic-context.md`.

**Reviewer Agent access:** Read/write to `semantic-context-*.md` files only during consolidation windows.

---

## § 4 — Memory Decay Policy (Staleness)

> *My addition: without a decay rule, semantic memory becomes an infinite graveyard.*

An entity becomes **stale** when:
- `Last_updated` is older than **90 days**, AND
- It has not been referenced in any `commit-summary.md` in that period.

A stale entity is NOT deleted. It moves to a `## Archived Entities` section in the semantic file with `Consolidation_status: archived`.

An archived entity can be **reactivated** by any agent who references it in a new commit — set `Consolidation_status: active` and update `Last_updated`.

**Rationale:** Prevents semantic files from growing unbounded. Preserves history. Allows rediscovery.

---

## § 5 — Memory Integrity Rules

- MUST NOT write free-form prose to semantic or episodic files. YAML blocks and log entries only.
- MUST NOT overwrite past entries in `episodic-context.md`. Append only.
- MUST NOT nest entities in the semantic file. One flat block per entity.
- Tags MUST be drawn from the project's established tag vocabulary (see `semantic-context-<project>.md` existing tags). New tags require a note in the episodic log.

---

## § 6 — Integrity Hash Protocol (LLM04: Data Poisoning Mitigation)

Every `semantic-context-*.md` and `episodic-context-*.md` file MUST carry an integrity header as its first line:

```
<!-- integrity: sha256:<hex-hash-of-all-content-below-this-line> -->
```

### Responsibilities

| Actor | Action |
|---|---|
| `merge_to_semantic` tool | Recomputes and rewrites the integrity header on every write |
| Reviewer Agent | Verifies hash before each consolidation run (§3) |
| Assistant | Handles violations: quarantine + restore |

### Verification Procedure

1. Reviewer Agent computes `sha256(file_content_after_integrity_line)`.
2. Compares with value in `<!-- integrity: sha256:... -->`.
3. **Match** → proceed with consolidation.
4. **Mismatch** → STOP. Do not read or trust file contents.
   - Escalate to Assistant: `INTEGRITY_VIOLATION — <filename> — expected <hash_in_header> got <computed_hash>`.
   - Assistant logs to `/memory/logs/system/integrity-violations-<date>.md`.
   - Assistant renames file to `<filename>.quarantine`.
   - Assistant restores last known-good version from `episodic-context.md` entry.
   - Assistant notifies nopoint.

### Hash Scope

The hash covers **all bytes from the character after the newline following the integrity line** to EOF. The integrity line itself is excluded. This allows the tool to update the header without invalidating the hash.

### Threat Covered

**LLM04 — Data/Model Poisoning via Memory:** A compromised or injected agent writes malicious YAML entities into `semantic-context-*.md` to alter future agent behavior. The integrity check detects any write that bypassed `merge_to_semantic`.

> Note: This is a detection control, not a prevention control. Prevention relies on RBAC (only `merge_to_semantic` tool has write access to semantic files).
