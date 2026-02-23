# HOW-TO: Create a New Agent Instance in the Ecosystem

**Target Audience:** `Senior Architect`, `nopoint`
**Prerequisites:** You must have physical access to `/agents/_template/` and `/agents/workspace-charter.md`.

## Step 1: Copy the Template Layer Files

The ecosystem uses a strict 5-layer hierarchy for agent instantiation.

1. Navigate to `/agents/`.
2. Create a new directory for your agent role (e.g., `/agents/junior-rust-coder/`).
3. Copy all files from `/agents/_template/L0` through `L4` into this new directory.

## Step 2: Configure Layer 0 (Identity)

Open `L0-identity.md`.
- Replace `[Role]` with the specific job title.
- Replace `[Project]` with the scope (e.g., `tLOS / Core Modules`).
- Define the **Mandate** (what success looks like for this specific role).
- *Crucially:* Define the **Absolute Taboos** (what this agent must NEVER do).

## Step 3: Configure Layer 2 (Memory Access & Limits)

Open `L2-memory-config.yaml`.
- Set the `working_memory_limit_lines`. Keep this small for flash-tier models (Swarm level), larger for Leads.
- Map the ACL (Access Control List): Which contexts can this agent Read/Write?
  - *Example:* A swarm coder should have `[]` for global write access, and `["/branches/<b>/scratchpad.md"]` for local write access.

## Step 4: Whitelist MCP Tools (Layer 3)

Open `L3-mcp-tools.json`.
- Define which MCP servers this agent can trigger.
- *Example:* If the agent compiles code, ensure `cargo-mcp-rust` is in the `allowed_servers` list.
- If the agent pushes state, `web3-dstorage-mcp` must be allowed. *Note: Only DevOps Lead should have this tool.*

## Step 5: Update the Position Description

- Create a markdown file in `/rules/position-descriptions/` matching the agent's name (e.g., `junior-rust-coder-pd.md`). 
- Detail specific responsibilities per `global-constitution.md` standards.

## Step 6: Registration

Update the `ecosystem-map.md` to reflect where this new agent sits in the vertical/horizontal topology.
