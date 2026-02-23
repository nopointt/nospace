# ADR 001: Git-flow Memory Context

**Date:** 2026-02-21
**Status:** Accepted
**Context:** Our AI agents require a scalable, context-economical way to share state without overwhelming their token limits. Reading the entire codebase for every task is inefficient and prone to hallucination.
**Decision:** We adopted a Git-flow inspired memory structure. A global `current-context-global.md` acts as the `main` branch state. Individual tasks spawn `/branches/<b>/`, which have ephemeral `scratchpad.md` and `log-raw.md`. Upon completion, a `commit-summary.md` is generated.
**Rationale:** 
- Enforces Context Economy (agents only read summaries, not raw thoughts of other agents).
- Provides a clear lifecycle (scratchpad -> merge_to_semantic -> global memory).
- Matches how Human-in-the-Loop (nopoint) naturally interacts with git branches.
**Consequences:** Agents must strictly adhere to the `merge_to_semantic` handoff protocol. Raw logs are never shared horizontally.
