---
# SEMANTIC CONTEXT — GLOBAL
> Entity-Centric, RAG-ready. Append-only EXCEPT during Reviewer consolidation runs.
> Format: one YAML block per entity. No narrative prose.
> Tags: [workspace, global, semantic, entities, RAG]
---

> [!WARNING]
> ONLY the Reviewer Agent may merge or delete entities during a scheduled consolidation.
> All other agents MUST only append new blocks at the bottom of this file.

## Entities

```yaml
- Entity: nospace_Workspace
  Type: System
  Tags: [workspace, global, architecture]
  Attributes: Multi-agent, AI-first, Web3-native, Zero-Web2
  Relations:
    - Contains: [tLOS, harkly]
    - Governed_by: [global-constitution.md]
    - Memory_tier: Global
  Facts:
    - "Scaffolded 2026-02-22. Follows 4-level rules hierarchy."
    - "Philosophy: Lean, Design-Driven, Product-Led, Native-First, Free First, Law-Token."
  Last_updated: 2026-02-22
  Consolidation_status: clean

- Entity: tLOS_Project
  Type: Project
  Tags: [tLOS, OS, AI, Wasm, Rust, SolidJS]
  Attributes: Sovereign spatial OS, AI-native, edge-first
  Relations:
    - Architecture_layers: [L0-Meta, L1-Grid, L2-Kernel, L3-Shell]
    - Governed_by: [tLOS-constitution.md]
    - Memory_tier: Project
  Facts:
    - "Kernel: Rust + Axum + Tokio + wasmtime."
    - "Shell: SolidJS 1.8 + Vite 5 + TypeScript."
    - "Mesh: NATS. Identity: Nostr/Ed25519/DID."
    - "Zero-Web2: no HTTP/REST between internal actors."
  Last_updated: 2026-02-22
  Consolidation_status: clean
```

<!-- Append new entity blocks above this line. Reviewer merges happen below during consolidation. -->
