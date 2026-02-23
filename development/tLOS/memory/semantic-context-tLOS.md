---
# SEMANTIC CONTEXT — tLOS
> Entity-Centric, RAG-ready. Append-only EXCEPT during Reviewer consolidation runs.
> Scope: tLOS project only. Global agents read this; branch agents do not.
> Tags: [tLOS, semantic, entities, RAG, project]
---

> [!WARNING]
> ONLY the Reviewer Agent may merge or delete entities during a scheduled consolidation.
> All other agents MUST only append new blocks. Never overwrite existing entries.

## Entities

```yaml
- Entity: tLOS_Kernel
  Type: Component
  Tags: [kernel, Rust, Wasm, NATS, L2]
  Attributes: Rust + Axum + Tokio + wasmtime, layer L2
  Relations:
    - Communicates_via: [NATS, WIT-interfaces]
    - Manages: [tLOS_Actors]
    - Exposes: [tlos-shell-bridge]
  Facts:
    - "Actor model: Wasm Component Model, wasm32-wasip2."
    - "No HTTP/REST internally. NATS subjects only."
    - "Actors compiled to Wasm blobs < 2MB."
  Last_updated: 2026-02-22
  Consolidation_status: clean

- Entity: tLOS_Shell
  Type: Component
  Tags: [shell, SolidJS, TypeScript, Vite, L3, UI]
  Attributes: SolidJS 1.8 + Vite 5 + TypeScript, spatial canvas
  Relations:
    - Connects_to: [tlos-shell-bridge]
    - Renders: [tLOS_Actors]
  Facts:
    - "All windows/actors use absolute positioning from spatial state store."
    - "Shell communicates with kernel ONLY via tlos-shell-bridge actor."
    - "Target: 60fps canvas rendering."
  Last_updated: 2026-02-22
  Consolidation_status: clean

- Entity: tLOS_Identity
  Type: Component
  Tags: [identity, Nostr, Ed25519, DID, auth]
  Attributes: Nostr/Ed25519/DID for signing and auth
  Relations:
    - Used_by: [tLOS_Kernel, tLOS_Shell]
  Facts:
    - "No centralized auth. All identity is self-sovereign."
  Last_updated: 2026-02-22
  Consolidation_status: clean
```

<!-- Append new yaml blocks above this line. -->
