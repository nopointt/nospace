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

- Entity: tLOS_Intent
  Type: Concept
  Tags: [intent, agent-system, orchestrator, L1-abstraction]
  Attributes: Намерение человека — необработанный сигнал от nopoint к системе
  Relations:
    - Processed_by: [Orchestrator/Дирижер]
    - Triggers: [tLOS_IntentTrigger]
    - Decomposes_into: [Domain tasks per Chief Agent]
  Facts:
    - "Intent — raw signal: может быть расплывчатым ('создай сайт'), дирижер его формализует."
    - "Дирижер принимает intent → нормализует → структурирует → делит по доменам."
    - "Типы намерений: Creation (создать X), Modification (изменить X), Research (узнать X), Execution (запустить X), Review (проверить X)."
    - "Intent не равно задача. Задача — формализованный intent."
    - "Дирижер работает только на уровне intent и domain-задач, никогда не лезет в реализацию."
  Last_updated: 2026-03-12
  Consolidation_status: new

- Entity: tLOS_IntentTrigger
  Type: Concept
  Tags: [trigger, intent, omnibar, commands, L3-shell]
  Attributes: Механизм распознавания и активации намерения в Shell
  Relations:
    - Lives_in: [tLOS_Omnibar]
    - Activates: [tLOS_Intent]
    - Routes_to: [tLOS_Agents, tLOS_Frames]
  Facts:
    - "Триггер намерения — паттерн (текст/команда/событие) который однозначно указывает на тип намерения."
    - "В Omnibar триггеры: slash-команды (/mcb, /g3, /kernel), keyword-команды, провайдер-теги."
    - "Типы триггеров: (1) Command — явная команда (/mcb, /kernel); (2) Keyword — ключевое слово в тексте; (3) Context — автоматический на основе контекста; (4) Event — системное событие (nearLimit, session end)."
    - "Триггер → Intent → Route → Agent/Frame. Цепочка должна быть детерминированной."
    - "TODO: провести аудит всех существующих триггеров в Omnibar — что активирует что и почему."
  Last_updated: 2026-03-12
  Consolidation_status: new

- Entity: ContinuumMemory
  Type: Concept
  Tags: [memory, continuum, layers, lifecycle, L3-kernel]
  Attributes: 5-layer memory model governing persistence and decay across all memory containers
  Relations:
    - Governs: [GlobalMemory, DomainMemory, ProjectMemory, SpecialMemory, OperationalMemory]
    - Managed_by: [Samurizator]
    - Defined_in: [continuum.py]
  Facts:
    - "5 layers: Frozen (TTL=∞, human-only write) → Slow (90d) → Medium (30d) → Fast (7d) → Operational (24h)."
    - "Each memory container (Global, Domain, Project, Special, Operational) has all 5 Continuum layers as separate rows."
    - "Retrieval boost: layer_weight + ln(1+access_count) + recency_decay — computed at query time, no stored column."
    - "Frozen layer is immutable — only human can write. Samurizator proposes frozen candidates for human review."
    - "Memory degradation path: Operational → Fast → Medium → Slow → Frozen (upward compaction by Samurizator)."
  Last_updated: 2026-03-13
  Consolidation_status: new

- Entity: Samurizator
  Type: Service
  Tags: [meta-agent, memory-compaction, service, L4-services]
  Attributes: Passive memory compaction service ("медики" — doctors for memory health)
  Relations:
    - Compacts: [ContinuumMemory]
    - Reads_from: [OperationalMemory, FastMemory, MediumMemory, ProjectMemory]
    - Writes_to: [FastMemory, MediumMemory, SlowMemory, GlobalMemory, frozen_proposals]
    - Triggered_by: [episode_end, schedule, frozen, project_to_global]
    - Defined_in: [samurizator.py, bridge_handler.py]
  Facts:
    - "Hybrid compaction: extractive (Operational→Fast: top-N by access_count) + LLM via liteLLM (Fast→Medium, Medium→Slow)."
    - "Frozen proposals go to pg table `frozen_proposals` for human review only — never auto-promoted."
    - "Cross-domain extraction: Project→Global for facts with high retrieval boost."
    - "NATS subject: agent:samurizator:run. Triggers: episode_end, schedule, frozen, project_to_global."
    - "NEVER raises — all errors caught and logged internally."
  Last_updated: 2026-03-13
  Consolidation_status: new

- Entity: Regulator
  Type: Service
  Tags: [meta-agent, rules-engine, compliance, service, L4-services]
  Attributes: Real-time rules enforcement service ("полиция" — police for workflow compliance)
  Relations:
    - Monitors: [AgentHierarchy, ContinuumMemory]
    - Reads_from: [regulator_rules.yaml]
    - Writes_to: [pg violations table]
    - Defined_in: [regulator.py, regulator_rules.yaml, bridge_handler.py]
  Facts:
    - "6 YAML rules: naming conventions, scope boundaries, workflow compliance, rate limiting."
    - "In-memory rate limiting per agent. Violations logged to pg `regulator_violations` table."
    - "Inline fire-and-forget evaluation in bridge.py — never blocks main message flow."
    - "Hot-reload rules via NATS: agent:regulator:reload. Check: agent:regulator:check. Report: agent:regulator:violation."
    - "NEVER raises — all errors caught and logged internally."
  Last_updated: 2026-03-13
  Consolidation_status: new

<!-- Append new yaml blocks above this line. -->
