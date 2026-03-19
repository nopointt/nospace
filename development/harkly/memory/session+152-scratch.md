# session-scratch.md — Write-Ahead Log (Harkly)
> Layer: L4 | Operational | Write-only during session, read+clear at session start
> Closed · Axis · 2026-03-17

<!-- ENTRY:2026-03-18:CHECKPOINT:152:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 152 [Axis]

**Decisions:**
- Thelos = tLOS rebranded — same design system, same paths, new name. No path changes needed.
- Harkly uses Thelos design system as core, gets its own Pencil file with tokens renamed Thelos→Harkly.
- Light theme is primary for Harkly (dark is Thelos/tLOS shell).
- Components-first workflow: build reusable Pencil components before designing screens.
- Infinite canvas + Omnibar as primary interaction model (same pattern as tLOS shell).
- Reddit-only for MVP demo (open API); other sources shown but locked — confirmed after API research.
- Source selection UI shown (not hidden) but only Reddit active in MVP.
- Use cases UC-2 and UC-3 are demo targets (UC-4 deferred — Layer 2).

**Files changed:**
- `nospace/development/harkly/memory/product-use-cases.md` — background agent may update sources (in progress)
- `nospace/docs/research/open-apis/` — new directory, background agent writing 4 docs + linking L1s (in progress)
- Pencil `untitled.pen` — renamed all "Thelos" → "Harkly" (11 nodes); set 18 light-theme variables; created reusable components: Button/Primary, Button/Secondary, Button/Ghost, Button/Danger, Button/Icon, Input/Default, Input/Search (lib frame id: ejLN6)

**Completed:**
- Pencil MCP reconnected (project-level mcpServers added to .claude.json)
- Thelos→Harkly rename in Pencil (11 text + frame nodes)
- Light theme variables defined in Pencil (18 color tokens)
- Buttons (5 variants) + Inputs (2 variants) as reusable components created

**In progress:**
- Component library build: Badges, Cards, SpineProgress still pending
- Background agent: open-apis docs + L1 links + use-cases update

**Opened:**
- After components: design Harkly screens (Framing Studio, Research Canvas) based on UC-2/UC-3
- Spine process 6-step progress component needed
- Source pill component (Reddit badge) needed

**Notes:**
- Bauhaus RAG confirmed as source of truth for design decisions
- design-code-structure-research.md read (Opus synthesis, 107 Bauhaus files)
- No Pencil variables existed before this session — all tokens were hardcoded
- Background agent id: a914a6f8ee61d8b4d (open-apis research + L1 links)
