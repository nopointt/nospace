# Episodic Context — Decision Log
> Append-only. Each entry documents a decision that changed system state or rules.
> Format: `## [YYYY-MM-DD] [agent-id] — [decision title]`

---

## [2026-02-23] [comet] — Workspace audit: conflicts resolved, RBAC updated, position-descriptions removed

- Tags: `[rbac, audit, comet, constitution, harkly, memory]`
- Removed position-descriptions layer from rules hierarchy (Level 3). RBAC is now the single source of truth for agent roles and permissions.
- Added `comet` role to rbac-regulation.md (Level 1, external, no secret vault access).
- Updated global-constitution.md: Comet added to agent table, Web2 exception declared, harkly added to hierarchy.
- Fixed: `memory/` was documented as gitignored but is actually tracked. Updated handshake.md to reflect truth.
- Fixed: episodic-context-global.md second entry had no header — added retroactively.
- Fixed: `memory/current-context-global.md` active_agents updated to reflect actual state.
- Fixed: harkly-constitution.md Web2 exception documented, broken docs/harkly/ link resolved.
- Fixed: handshake-assistant.md updated to reflect Comet operative context (not just capabilities).
- Noted: /agents/* folders exist locally but not pushed to repo. Requires Assistant to run /sync.

---

## [2026-02-22] [human-ceo] — Agent ecosystem architecture scaffolded

- Tags: `[agents, ecosystem, architecture, rbac]`
- Defined 6-level multi-agent hierarchy: Creator → Assistant/Comet → CTO/Arch → QA → DevOps → SRE.
- Created `agents/ecosystem-map.md` — topology, communication rules, lifecycle, escalation matrix.
- Authored RBAC roles for all Lead agents: assistant, cto, senior-architect, tech-lead, qa-lead, devops-lead, sre-lead.
- Created agent instance folders: `/agents/assistant/`, `/agents/cto/`, `/agents/tech-lead/`, etc. (local only, pending push).
- Updated `global-constitution.md` § 6–8 with agent ecosystem table and memory-regulation link.
- Updated `agents/_template/` — identity.md, config.yaml, permissions.json with ecosystem-aware defaults.
- `workspace-charter.md` in `/agents/` synced to latest constitution.

---

## [2026-02-21] [human-ceo] — Workspace bootstrap

- Tags: `[scaffold, rules, architecture, memory]`
- Created `/nospace` root structure with all standard directories.
- Established 4-level rules hierarchy: Constitution → Regulations → RBAC → Specs.
- Authored `global-constitution.md` merged with `README.md` → unified Workspace Charter.
- Copy placed in `/agents/workspace-charter.md` for agent-first access.
- Authored `tLOS-constitution.md`, `code-style-regulation.md`, `agent-conduct-regulation.md`.
- Scaffolded tiered memory system: scratchpad → current-context → semantic → episodic.
- Authored `memory-regulation.md` covering handoff protocol, consolidation, and decay policy.
- Vector-Ready tags added to all semantic and episodic memory files.
- Branch `_template` created: `spec.md`, `scratchpad.md`, `log-raw.md`, `commit-summary.md`.

---

<!-- Add new entries above this line. Oldest entries at the bottom. -->
