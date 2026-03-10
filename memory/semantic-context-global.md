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

- Entity: nopoint
  Type: Person
  Tags: [human, founder, CEO, L0]
  Attributes: Creator, primary decision-maker, L0 authority
  Relations:
    - Founder_of: [harkly, tLOS, nospace_Workspace]
    - Partner_of: Artem
  Facts:
    - "nopoint — не склоняется (nopoint'а — неверно, просто 'nopoint')."
    - "L0 в иерархии агентов. Единственный, кто принимает архитектурные решения."
    - "CEO harkly. Роль по отношению к Артем уточняется."
  Last_updated: 2026-03-10
  Consolidation_status: new

- Entity: harkly_Project
  Type: Project
  Tags: [harkly, SaaS, consumer-intelligence, research]
  Attributes: Consumer Intelligence Platform, AI-first, desk research automation
  Relations:
    - Part_of: nospace_Workspace
    - Team: [nopoint, Artem]
    - Stack: [Next.js 14, Prisma, Supabase, Vercel, Modal.com, Yandex Cloud PG]
    - Memory_tier: Project
  Facts:
    - "Продукт: автоматизация desk research для UX/CX исследователей."
    - "3 слоя: Reality (данные) + Prediction (silicon sampling) + AI Perception."
    - "Лендинг live: harkly-saas.vercel.app (deployed 2026-03-10)."
    - "Фронтенд E0-E6 завершён (G3 сессии #1-#4). Следующее: Стадия 5 Backend Build."
    - "Монетизация: Free (300 кредитов) + $50/$250/$500 + WL $500/мес."
    - "152-ФЗ: персданные → Yandex Cloud ru-central1, аналитика → Supabase (US)."
  Last_updated: 2026-03-10
  Consolidation_status: new

- Entity: Artem
  Type: Person
  Tags: [human, team, harkly, co-founder]
  Attributes: Co-founder harkly, partner nopoint
  Relations:
    - Partner_of: nopoint
    - Involved_in: [harkly]
  Facts:
    - "Присоединился 2026-03-10. Co-founder harkly, роли между nopoint и artem не определены."
    - "Не связан с ProxyMarket в контексте harkly. ProxyMarket — отдельный трек, не активен."
  Last_updated: 2026-03-10
  Consolidation_status: new

<!-- Append new entity blocks above this line. Reviewer merges happen below during consolidation. -->
