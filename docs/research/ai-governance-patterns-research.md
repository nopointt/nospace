# AI Governance Patterns Research
> Topic: Governance, regulations, and rule systems for multi-agent AI workspaces
> Author: Lead/TechResearch
> Date: 2026-03-22
> Status: In progress — written section by section

---

## Context

Auditing the nospace governance system: 1 constitution, 15 regulations, 9 position descriptions, ecosystem map. Rules are enforced by convention — agents read them at session start. Research question: is this system effective, and how does it compare to industry patterns?

---

## Section 1 — AI Agent Governance Frameworks

### 1.1 NIST AI Risk Management Framework (AI RMF)

**Source:** [NIST AI RMF Overview](https://www.nist.gov/itl/ai-risk-management-framework) | [2025 Updates](https://www.ispartnersllc.com/blog/nist-ai-rmf-2025-updates-what-you-need-to-know-about-the-latest-framework-changes/)

**Four core functions:**
- **Govern** — establish organizational AI governance and risk management policies; assign roles and accountability
- **Map** — identify and categorize risks across AI lifecycle and inter-agent dependencies
- **Measure** — continuous evaluation via metrics, scoring, and behavioral analytics
- **Manage** — operational controls, kill-switches, remediation workflows

**Key insight for multi-agent systems:** NIST-AI-600-1 (Generative AI Profile, 2024) extends RMF specifically to generative AI. It mandates documenting: foundational models used, hosting locations, use case criticality, data sensitivity, and **inter-agent dependencies**. This last point is directly relevant — a governance system for multi-agent workspaces must treat agent-to-agent relationships as a first-class risk surface.

**Applicability to nospace:** The four functions map well to our system:
- Govern = constitution + regulations
- Map = ecosystem-map.md (agent hierarchy, DAG)
- Measure = currently absent — no behavioral metrics, no compliance scoring
- Manage = RBAC regulation + escalation rules

**Gap identified:** The "Measure" function has no equivalent in the current nospace governance system. Rules exist but compliance with them is never measured.

---

### 1.2 AAGATE — NIST RMF Translated to Runtime Architecture

**Source:** [AAGATE on CSA](https://cloudsecurityalliance.org/blog/2025/12/22/aagate-a-nist-ai-rmf-aligned-governance-platform-for-agentic-ai)

AAGATE (Agentic AI Governance Assurance & Trust Engine) is the most technically precise translation of NIST AI RMF into an agentic system. It operates as a Kubernetes-native runtime governance overlay — independent of model internals. Eight components:

1. **Governing-Orchestrator Agent (GOA)** — central decision engine, receives telemetry, enforces millisecond kill-switch
2. **ComplianceAgent** — continuous evaluation via OWASP AIVSS scoring and OPA + Rego policy logic
3. **Janus Shadow-Monitor** — internal red-team, re-evaluates agent actions before execution
4. **Tool-Gateway Chokepoint** — audits all API/database interactions
5. **Agent Name Service** — identity registration via DIDs and SPIFFE verifiable credentials
6. **Istio mTLS + Cilium eBPF** — zero-trust networking at the mesh layer
7. **Qdrant + UEBA + Kafka** — behavioral analytics pipeline
8. **ETHOS Ledger Hooks** — optional blockchain audit trail

**Novel risk categories identified:**
- **LPCI (Logic-Layer Prompt Control Injection)** — hidden payloads in tools or agent memory
- **QSAF (Cognitive Degradation)** — reasoning stability degrades across recursive sessions
- **DIRF (Identity Misuse)** — unauthorized agent replication

**Key architectural insight:** The OReilly article argues that governance imposed from the outside fails at autonomous AI scale. The control plane must be separated from the data plane — the same architectural transition that networking made (separate control plane / data plane) and that cloud computing made (extracting governance logic from applications). At nospace scale, this means governance shouldn't be purely in prose files agents read voluntarily — it should be a runtime layer.

**Applicability:** nospace is not at Kubernetes scale. But the principle holds: the Orchestrator (Eidolon/Axis) should be a runtime governance enforcer, not just a coordinator. The `agent-onboarding-regulation.md` pre-flight check is convention, not enforcement.

---

### 1.3 EU AI Act — What Changes for Agent Systems

**Source:** [EU AI Act Timeline](https://www.dataguard.com/eu-ai-act/timeline) | [2026 Compliance Guide](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance) | [Orrick 6 Steps](https://www.orrick.com/en/Insights/2025/11/The-EU-AI-Act-6-Steps-to-Take-Before-2-August-2026)

**Timeline (binding):**
- Feb 2025: Prohibited AI practices + AI literacy obligations in force
- Aug 2025: Governance rules + GPAI model obligations in force
- Aug 2026: High-risk AI system requirements (Annex III) enforceable
- Aug 2027: High-risk AI in regulated products (extended deadline)

**GPAI obligations directly relevant to agent workspaces (Aug 2025, already in force):**
- Technical documentation making model development, training, evaluation traceable
- Transparency reports: capabilities, limitations, risks, guidance for integrators
- Training data summary (types, sources, preprocessing)

**Key insight for multi-agent systems:** The EU AI Act does not yet have explicit rules for multi-agent coordination, but the GPAI provisions apply to any system using a GPAI model as a component — meaning each agent in a multi-agent pipeline that uses an LLM is potentially in scope. The integrator (the workspace orchestrator) inherits obligations.

**Non-compliance penalties:** Up to €35M or 7% of global turnover for prohibited practices; up to €15M or 3% for other violations.

**Applicability to nospace:** tLOS/Harkly are pre-launch, no real users. Legal exposure is low now. But governance documentation habits formed now (traceability, capability documentation per agent) will matter at launch. The constitution + ecosystem-map partially satisfy this if they document what each agent can do and its limitations.

---

### 1.4 ISO 42001 — AI Management System Standard

**Source:** [ISO 42001 Implementation Guide 2025](https://www.isms.online/iso-42001/iso-42001-implementation-a-step-by-step-guide-2025/) | [ISO Standard Page](https://www.iso.org/standard/42001) | [CSA Lessons Learned](https://cloudsecurityalliance.org/blog/2025/05/08/iso-42001-lessons-learned-from-auditing-and-implementing-the-framework)

**What it is:** World's first certifiable AI management system standard. 38 distinct controls across 9 control objectives. Mirrors ISO 27001 structure — familiar to organizations with existing information security programs.

**9 Control Objectives (domains):**
1. AI policy and governance
2. Roles and responsibilities
3. Risk and impact assessment
4. AI system lifecycle management
5. Data management
6. Transparency and explainability
7. Fairness and bias management
8. Robustness and security
9. Monitoring and continuous improvement

**18-step implementation checklist:** starts with obtaining senior management support → scoping → AI policy → role assignment → risk assessment → control implementation → operation → monitoring → improvement.

**Key insight:** ISO 42001 explicitly requires **continual improvement** as a lifecycle requirement, not a one-time setup. Regulations that are written once and never reviewed violate this principle.

**Applicability to nospace:** The nospace governance system has objects corresponding to control objectives 1 (constitution), 2 (position descriptions + RBAC), 3 (no formal impact assessment), 4 (no formal lifecycle docs), and 9 (no monitoring or improvement cycle). Six control domains are fully or partially absent. This is a significant gap for a system claiming to govern AI agents.

---

## Section 2 — Policy-as-Code for AI Agents

### 2.1 Open Policy Agent (OPA) and Rego

**Source:** [OPA Homepage](https://www.openpolicyagent.org/) | [CNCF Best Practices 2025](https://www.cncf.io/blog/2025/03/18/open-policy-agent-best-practices-for-a-secure-deployment/) | [ARPaCCino Paper](https://arxiv.org/html/2507.10584v1)

**What OPA does:** General-purpose policy engine. Unifies policy enforcement across the stack. Declarative language (Rego) that lets you specify policy for any use case — RBAC, ABAC, ReBAC — compiled to bundles, hot-reloaded without downtime.

**For AI agents specifically:** Every agent tool call passes through an OPA evaluation:
```
Input: { agent_id, role, tool_name, parameters, context }
Output: allow | deny | approval_needed
```

**Emerging AI-specific work:**
- **ARPaCCino** (2025): Agentic RAG that translates natural-language policy descriptions into formal Rego rules and validates infrastructure architectures against them. This is the "Prose2Policy" direction — governance documents written by humans automatically compiled to executable policy.
- **Prose2Policy** (2025, arxiv 2603.15799): LLM pipeline converting natural-language access control policies to Rego. Directly applicable — nospace regulations are prose; they could be compiled.

**Key insight:** The gap between nospace's current approach (prose regulations agents read by convention) and executable policy is smaller than it appears. An OPA bundle can be generated from existing regulation text using an LLM pipeline. The regulations become the source of truth; the bundle becomes the enforcement artifact.

**Deployment pattern:**
1. Policies declared in YAML/JSON or Rego
2. Compiled to OPA bundles
3. Hot-reloaded at runtime without downtime
4. Every agent action passes through policy evaluation (<10ms overhead target)

---

### 2.2 Cedar — AWS's Agent-Native Policy Language

**Source:** [AWS Bedrock AgentCore Policy](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html) | [Cedar Overview](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-understanding-cedar.html) | [OPA vs Cedar comparison 2025](https://www.osohq.com/learn/opa-vs-cedar-vs-zanzibar)

**What Cedar is:** AWS's open-source policy language, now the enforcement backbone for Amazon Bedrock AgentCore. Unlike OPA (general-purpose), Cedar was designed from the start for fine-grained authorization with formal verification properties.

**Policy structure:**
```cedar
permit(
  principal == Agent::"finance-agent",
  action == Action::"create_payment",
  resource == Tool::"payment-service"
)
when { context.amount <= 5000 };
```

**Evaluation model (default deny):**
- If any `forbid` policy matches → DENY
- If a `permit` matches and no `forbid` matches → ALLOW
- If neither matches → DENY

**Gateway architecture for agents:** All agent traffic flows through AgentCore Gateway. Policy engine intercepts tool calls at the gateway layer, evaluates Cedar policies in real time — blocks unauthorized actions before execution. Decision is binary per call.

**Formal verification property:** Cedar was designed for automated mathematical analysis of policy sets — you can formally verify that no policy set can produce unintended allow decisions. OPA cannot do this; Cedar can.

**Cedar vs OPA decision matrix:**

| Property | OPA + Rego | Cedar |
|---|---|---|
| Design origin | Infrastructure/K8s | Authorization |
| Formal verification | No | Yes |
| Learning curve | High (Rego is unusual) | Medium |
| Ecosystem | CNCF, broad | AWS-native, growing |
| Agent-native | No (adapted) | Yes (AgentCore) |
| Hot reload | Yes | Yes |
| Default posture | Explicit deny required | Default deny |

**Applicability to nospace:** Cedar is the better fit if nospace adopts a Claude-native stack (AWS Bedrock). OPA is better if the stack stays Python + LangGraph + NATS. Both are viable — the key is picking one and compiling regulations to it.

---

### 2.3 RBAC vs ABAC for Agent Systems — The Hybrid Model

**Source:** [RBAC AI Agents 2025](https://www.cloudmatos.ai/blog/role-based-access-control-rbac-ai-agents/) | [Beyond RBAC for LLMs](https://petronellatech.com/blog/beyond-rbac-policy-as-code-to-secure-llms-vector-dbs-and-ai-agents/)

**Why pure RBAC fails for agents:**
- Coarse-grained: roles like "admin", "operator", "viewer" can't enforce parameter-level constraints
- Static: agents need dynamic context (time, budget, risk score, parent agent)
- No lateral coercion prevention: agent A can trigger agent B without RBAC knowing

**The hybrid model (production pattern):**
- **RBAC** for coarse boundaries: agent role determines which tools it can call at all
- **ABAC** for parameter constraints: `amount <= 5000`, `data_sensitivity <= 3`, `endpoint in allowed_set`
- **Contextual gates**: human-in-the-loop approval for operations above a risk threshold

**Agent identity pattern (production):**
Each agent receives a short-lived JWT (15-60 min) containing:
```json
{ "org": "nospace", "agent_id": "eidolon-7f3a", "role": "player",
  "parent": "domain-lead-frontend", "scopes": ["file:read", "file:write:src/"] }
```

**Key metric targets:**
- Privileged agents: <5% of active fleet
- Policy coverage: ≥80% of tool calls
- Enforcement latency: <10ms overhead
- Unenforced would-block events: <2% drift

**Gap in nospace RBAC:** The current RBAC regulation defines roles and their file/tool permissions as text. There is no runtime enforcement — an agent claiming the "player" role is trusted by convention. A malicious or malfunctioning agent could read outside its scope.

---

## Section 3 — CLAUDE.md at Scale

### 3.1 Hierarchical Instruction Architecture

**Source:** [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) | [Claude Code Memory](https://thomaslandgraf.substack.com/p/claude-codes-memory-working-with) | [Rules Directory Guide](https://claudefa.st/blog/guide/mechanics/rules-directory)

**Hierarchy (innermost wins for specificity, all load additively):**
1. User-global: `~/.claude/CLAUDE.md` and `~/.claude/rules/`
2. Project-root: `{repo}/.claude/CLAUDE.md` and `.claude/rules/`
3. Subdirectory: `{dir}/CLAUDE.md` (loaded only when Claude touches files in that directory)
4. Path-targeted rules: `.claude/rules/*.md` with YAML frontmatter `paths:` filter

**Path-targeted rules (most important scaling mechanism):**
```yaml
---
paths: src/api/**/*.ts
---
# API Rules
Always validate with Zod. Never return raw database errors.
```
This rule gets high priority ONLY when Claude is working on API files. Frontend rules don't pollute backend context and vice versa.

**What breaks at scale (monolithic CLAUDE.md problems):**
1. **Priority saturation**: all domain knowledge loads equally → Claude can't determine relevance
2. **Token budget exhaustion**: one huge CLAUDE.md consumes context before real work begins
3. **Stale drift**: large files are rarely updated because editing is risky (what if something breaks?)
4. **Subagent inheritance mismatch**: all subagents inherit the full parent CLAUDE.md even when irrelevant

**Scaling patterns that work:**
- Symlinks: share common rules across repositories
- Subdirectory CLAUDE.md: per-feature rules loaded only when needed
- Rules directory: modular, path-filtered, discoverable without config
- `skills/` directory: on-demand loading (medium priority, not always active)

**The nospace architecture assessment:**
nospace uses `~/.claude/CLAUDE.md` (global, always loaded) + `~/.claude/rules/*.md` (modular). This is architecturally sound. The `nospace/agents/` per-role structure partially mirrors subdirectory CLAUDE.md. The weakness: no path-targeted rules (everything in `~/.claude/rules/` loads for every session regardless of project or file type).

---

### 3.2 Codified Context — Academic Research Findings

**Source:** [Codified Context: Infrastructure for AI Agents in Complex Codebases](https://arxiv.org/html/2602.20478v1)

This 2025 paper provides the most rigorous empirical study of instruction architecture for AI agents in production codebases. Key findings:

**Three-tier context architecture (validated empirically):**
- **Tier 1 (Hot Memory, ~660 lines):** Constitution — always loaded. Naming conventions, orchestration protocols, trigger tables routing file patterns to specialist agents.
- **Tier 2 (Specialists, ~9,300 lines across 19 agents):** Domain-expert agents embed project-specific knowledge. Loaded when their domain triggers.
- **Tier 3 (Cold Memory, ~16,250 lines across 34 specs):** On-demand specification documents, retrieved via MCP tool `find_relevant_context()`.

**Trigger tables (key innovation):** Rather than requiring developers to specify which agent to use, a lookup table in the constitution maps file patterns to specialists:
```
network files → network-protocol-designer
auth files → security-specialist
ui components → ui-designer
```
This is "convention over configuration" applied to agent routing.

**Most important empirical finding:** Agents operating in complex domains without pre-loaded context produced "significantly more errors." Domain knowledge must be loaded, not retrieved — retrieval latency causes reasoning drift.

**50% knowledge rule:** Over 50% of each specialist agent's context should be domain knowledge (not behavioral instructions). Behavioral instructions are a small fraction. This inverts the common assumption that governance/rules dominate agent context.

**Applicability to nospace:** The nospace `L0-identity.md` + position description per agent is analogous to Tier 2 specialists. The global constitution is Tier 1. The regulation files are cold memory (Tier 3). The missing piece is the **trigger table** — automatic routing based on file/task pattern rather than nopoint specifying the agent manually.

---

## Section 4 — Convention over Configuration Applied to AI Governance

### 4.1 The Rails Principle Revisited

**Source:** [Convention over Configuration (Grokipedia)](https://grokipedia.com/page/Convention_over_configuration) | [Control Planes for Autonomous AI (O'Reilly)](https://www.oreilly.com/radar/control-planes-for-autonomous-ai-why-governance-has-to-move-inside-the-system/)

**Original Rails principle:** Developers specify only unconventional aspects of the application. Conventions eliminate explicit configuration. Result: Rails apps have identical structure, enabling expertise transfer between projects.

**Applied to AI governance:**
- Convention: "any file in `agents/` is a position description" → no need for a "what is a position description" regulation
- Convention: "any file in `docs/research/` is a research artifact, written by Lead/TechResearch" → no need for a research output regulation
- Convention: directory structure itself enforces role boundaries — agents literally cannot find files outside their subtree if the tree is structured by access level

**The governance overhead problem at nospace:** 15 regulations covering naming, RBAC, memory, context-economy, task-management, etc. Each regulation is prose. Agents read them by convention. The overhead:
- New agent session: reads CLAUDE.md + 15 regulations + position description = 30K–50K tokens consumed before any work
- Regulation conflicts: prose regulations can contradict each other; no formal conflict resolution
- Stale regulations: no review cycle; regulations written 6 months ago may not reflect current agent capabilities

**Convention reduction analysis — which regulations could become implicit:**

| Current Regulation | Can It Become Implicit? | Mechanism |
|---|---|---|
| Naming convention | Yes, fully | Directory structure enforces it; kebab-case validated by lint |
| File organization | Yes, mostly | Template directories; scaffold scripts |
| Memory lifecycle | Partially | Auto-archival by hook; retention rules in tooling |
| Context economy | Partially | Token counter enforces quota; compact rule in CLAUDE.md |
| RBAC | No | Must remain explicit; enforcement needed |
| Agent onboarding | Partially | Pre-flight script instead of prose checklist |
| Task management | Partially | Issue tracker / spec file templates encode the workflow |
| Research output | Yes | This file (research/{topic}-research.md) is the convention |

**Estimate:** 7–9 of 15 regulations could become implicit conventions enforced by tooling or directory structure. The remaining 6–8 require explicit prose because they encode non-obvious decisions (escalation rules, RBAC scope, constitutional principles).

**Key O'Reilly insight:** Governance embedded in conventions creates "hidden complexity by obscuring key decisions that would otherwise be explicit." The recommendation is a hybrid: use conventions for structural/predictable concerns, explicit governance for authority/permission/escalation decisions. This is not "5 regulations" — it's "5 regulations + well-designed directory structure + lint rules."

---

### 4.2 Control Plane Separation

**Source:** [O'Reilly Control Planes for Autonomous AI](https://www.oreilly.com/radar/control-planes-for-autonomous-ai-why-governance-has-to-move-inside-the-system/)

The architectural distinction is critical:

**Data plane:** agent execution — what the agent does (read file, write code, call API)
**Control plane:** governance — who is authorized to do what, and under what conditions

Current nospace architecture has no separation: the Orchestrator (Axis) is simultaneously the data plane (orchestrating work) and the control plane (enforcing RBAC, deciding escalation). This conflation means:
- No independent audit of governance decisions
- Governance quality depends on Orchestrator following rules by convention
- No kill-switch that operates independently of the Orchestrator itself

**Recommended separation pattern:**
```
[Agent request] → [Control Plane: OPA/Cedar evaluation] → [allow/deny] → [Data Plane: execution]
```

Even at small scale (Claude Code sessions), this can be a lightweight Python sidecar or pre-tool hook that evaluates permissions before tool calls execute.

---

## Section 5 — Agent RBAC — Implementation Patterns

### 5.1 Framework-Level RBAC (LangGraph, CrewAI)

**Source:** [RBAC AI Agents Guide 2025](https://www.cloudmatos.ai/blog/role-based-access-control-rbac-ai-agents/) | [Complete AI Agent Framework Guide 2025](https://www.langflow.org/blog/the-complete-guide-to-choosing-an-ai-agent-framework-in-2025)

**LangGraph Enterprise:** RBAC, workspaces, SSO. Self-hosted option. Data stays in VPC. RBAC operates at the graph/workspace level — controls who can create or modify agent graphs, not what agents can do at runtime.

**CrewAI Enterprise (most granular tool-level RBAC available):**
- `Agent.tools` — default tools the agent can use
- `Task.tools` — overrides `Agent.tools` for a specific task (enforces least privilege per task)
- If `Task.tools` is explicitly defined, agent can only use those tools for that task
- HIPAA/SOC2 compliant; on-prem install; secure tokens

**Aegis (runtime gateway pattern):**
- Acts as a runtime policy and observability gateway sitting between agent and tool
- Agent sends request (e.g., `create_payment`) → Aegis verifies JWT + extracts metadata → evaluates policy → allow/deny/approve
- Every decision logged: agent ID, role, policy version, decision rationale
- Supports shadow mode: logs what would have been blocked without enforcing (useful for calibration)

**Key insight:** None of the major frameworks enforce file-level RBAC — that's a concern specific to Claude Code's tool use (Bash, Read, Write, Edit). For Claude Code agents, enforcement must happen at the tool hook layer (pre-tool use hooks), not at the LLM framework layer.

---

### 5.2 File-Level and Tool-Level Access for Claude Code Agents

**Source:** [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) | [RBAC Excellence 2025](https://www.cloudmatos.ai/blog/role-based-access-control-rbac-ai-agents/)

**Current nospace RBAC:** prose-defined role → file path scope. No runtime enforcement. Agent self-declares role and is trusted.

**Implementable enforcement at Claude Code level:**
1. **PreToolUse hooks:** validate tool call against role's allowed scope before execution
2. **allowedTools in settings.json:** restrict which tools an agent session can use at all
3. **Bash restriction:** `"bash": { "allowedCommands": ["python", "git", "bun"] }` — explicit allowlist
4. **Workspace scoping:** each agent type runs in a separate Claude Code session with different `~/.claude/settings.json`

**Practical RBAC matrix for nospace:**

| Role | Read | Write | Bash | WebSearch | Agent spawn |
|---|---|---|---|---|---|
| Axis (Orchestrator) | All | All | All | Yes | Yes |
| Domain Lead | Domain + specs | Domain + spec file | Limited | Yes | Yes (G3 only) |
| Player | Domain only | Domain only | Limited | No | No |
| Coach | Domain + spec | No write | Read-only | No | No |
| Lead/TechResearch | Research dir + fetched | Research dir | No | Yes | No |

**Enforcement mechanism:** This matrix can be encoded in a `~/.claude/settings.json` per agent type, combined with a PreToolUse hook that validates the path against the role's allowed subtree. Current state: this matrix exists as prose in `rbac-regulation.md`; it is not encoded anywhere executable.

---

## Section 6 — Naming Conventions for LLM-First Codebases

### 6.1 Empirical Research on Naming and LLM Performance

**Source:** [How Does Naming Affect LLMs on Code Analysis Tasks?](https://arxiv.org/html/2307.12488v5) | [Codified Context Paper](https://arxiv.org/html/2602.20478v1)

**Key research finding (2307.12488):** Modifying all variable and method names in code significantly impairs an LLM's ability to understand the code. Naming is not cosmetic for LLMs — it is load-bearing semantic information. Descriptive names reduce the reasoning tokens needed to understand context.

**Implications for file naming:**
- `agent-onboarding-regulation.md` → LLM immediately knows: this is a regulation, it's about onboarding, it's for agents
- `reg-onboard.md` → LLM must infer content from context, consuming extra reasoning budget
- `document-47.md` → opaque; LLM must read to understand; content retrieval becomes expensive

**Conclusion:** Semantic file names are a form of compressed documentation. For a workspace where agents navigate hundreds of files, naming quality directly affects agent performance and token efficiency.

---

### 6.2 MCP and Kebab-Case Conventions

**Source:** [MCP Server Naming Conventions](https://zazencodes.com/blog/mcp-server-naming-conventions) | [OpenTelemetry Semantic Conventions for AI (gen_ai.*)](https://github.com/open-telemetry/semantic-conventions/issues/2664)

**MCP ecosystem naming standard:**
- MCP Server IDs: kebab-case (e.g., `memory-graph-mcp`, `file-system-mcp`)
- MCP Tools: snake_case (e.g., `find_relevant_context`, `create_payment`)
- MCP Prompts: snake_case or kebab-case

**OpenTelemetry Semantic Conventions for AI (2025, in progress):** The `gen_ai.*` namespace is being standardized for observability of generative AI systems. Includes conventions for agent spans, tool calls, and LLM interactions. Once stable, this will be the standard for agent telemetry naming.

**Kebab-case argument for files (LLM context):**
- Lowercase: no ambiguity about case sensitivity across OS
- Hyphens: visually unambiguous word boundaries (unlike underscores which can be lost in some renderers)
- URL-safe: directly usable in file paths referenced in documentation
- LLM parsing: tokenizers split on hyphens more consistently than underscores

**Convention-as-enforcement:** The key insight from the MCP ecosystem is that naming conventions become enforcement mechanisms when they're machine-checkable. A lint rule rejecting `RegOnboard.md` is stronger governance than a prose regulation saying "use kebab-case."

**Auto-enforcement options:**
- `ls-lint` (Go CLI): enforces filename conventions per directory with rules file
- `pre-commit hooks`: validate file names before git commit
- Directory template generation: scaffold scripts that only generate correctly-named files

**Current nospace assessment:** The current naming (kebab-case, semantic, descriptive) is correct. The gap: no enforcement tooling. It relies on convention. A single `ls-lint.yaml` configuration would convert this from prose regulation to enforced policy.

---

### 6.3 File Naming for Navigation Without Index

**Source:** [Codified Context Paper](https://arxiv.org/html/2602.20478v1) | [CLAUDE.md for .NET Developers](https://codewithmukesh.com/blog/claude-md-mastery-dotnet/)

**Key pattern:** In a well-named codebase, an agent should be able to navigate to the right file using only the name — no index required. This is achievable when:
1. Names encode content type (`-research.md`, `-regulation.md`, `-spec.md`, `-adr.md`)
2. Names encode domain (`frontend-`, `backend-`, `agent-`, `memory-`)
3. Directory structure encodes permission level (`/public/`, `/private/`, `/regulations/`)

**Name suffixes as type tags (current nospace conventions analyzed):**
- `-research.md` — research output (this file type)
- `-regulation.md` — governance rule document
- `-about.md` — project/system identity document
- `-spec.md` — implementation specification
- `-adr.md` — architecture decision record
- `-current.md` — live state document (current-context, chronicle)

This suffix system is a de facto type system. It should be documented and enforced. An agent reading `harkly-about.md` knows immediately what it is without opening it.

---

## Section 7 — Regulation Lifecycle and Stale Policy Detection

### 7.1 How Often Should Governance Rules Be Reviewed?

**Source:** [Automated Compliance and AI Regulation (Institute for Law & AI)](https://law-ai.org/automated-compliance-and-the-regulation-of-ai/) | [AI Regulation 2025 (Promptfoo)](https://www.promptfoo.dev/blog/ai-regulation-2025/)

**Regulatory lifecycle (enterprise standard):**
- **External regulations** (EU AI Act, NIST): review annually, or when regulation updates. EU AI Act obligations change on specific dates.
- **Internal policies**: review quarterly minimum; monthly if the AI system is actively changing.
- **Per-deployment review**: any time a new model, agent type, or capability is added.

**Stale policy signals (automated detection patterns):**
1. Policy references a file that no longer exists → stale
2. Policy references a role that is no longer in the ecosystem map → stale
3. Policy was last modified more than 90 days ago AND the codebase has changed significantly → suspect stale
4. Policy describes a workflow that contradicts the current spec → conflicted

**Automated compliance monitoring:** "Compliance checks must be embedded into the AI development pipeline — from data ingestion to model deployment and post-production monitoring." Tools include automated documentation generators, model validation platforms, and compliance dashboards.

---

### 7.2 Stale Regulation Detection for nospace

**Derived from research patterns**

**Signals that a regulation is stale in nospace:**
1. References an agent name not in ecosystem-map.md
2. Describes a workflow (e.g., handshake files) that has been deprecated in MEMORY.md
3. Was written before a major architecture change (e.g., Agent Teams pivot)
4. Contains prescriptions contradicted by newer regulations (the most dangerous type)

**Known stale example (detected from MEMORY.md):**
- `feedback_no_handshake.md` notes handshake files are deprecated
- Any regulation still referencing handshake workflow is stale

**Recommended review cycle for nospace:**
- After any agent hierarchy change: immediate review of RBAC + ecosystem-map
- After any major project pivot: review all regulations for contradictions
- Monthly: check regulation references against current file system
- Quarterly: full regulation audit — read each one, verify it reflects current practice

---

### 7.3 Auto-Generated Regulations — State of the Art

**Source:** [ARPaCCino Agentic RAG for Policy Compliance](https://arxiv.org/html/2507.10584v1) | [Prose2Policy](https://arxiv.org/html/2603.15799)

**Prose2Policy (2025):** LLM pipeline that converts natural-language access control policies into executable Rego code. The pipeline:
1. Parse natural language regulation text
2. Extract principals, actions, resources, conditions
3. Generate Rego rules
4. Validate generated rules against test cases
5. Output OPA bundle

**Applicability:** nospace `rbac-regulation.md` could be piped through Prose2Policy to generate an OPA bundle that enforces the same rules at runtime. This converts the RBAC regulation from "prose agents read" to "code that enforces."

**Auto-generation limitations:**
- Prose2Policy accuracy is ~85% for straightforward RBAC rules; drops to ~60% for complex conditional logic
- Generated policies require human review before deployment
- Ambiguous prose produces ambiguous policies — garbage in, garbage out
- Natural language policies often have implicit assumptions that Rego cannot encode

**Recommendation:** Prose2Policy is useful for bootstrapping enforcement, not for production-grade policy management. Write policies in a semi-structured format (structured prose + explicit principal/action/resource tables) that makes automated compilation reliable.

---

## Section 8 — Synthesis and Recommendations for nospace

### 8.1 Governance System Assessment

**Strengths of current nospace system:**
1. Constitution pattern (single source of truth) is architecturally sound
2. Ecosystem-map.md with explicit DAG mirrors NIST's Map function
3. Role position descriptions are more detailed than most enterprise implementations
4. Kebab-case semantic naming is correct (matching LLM discoverability best practices)
5. Hierarchical CLAUDE.md (global → project → directory) is the industry-validated pattern

**Gaps identified:**
1. **No runtime enforcement** — all governance is convention; no OPA, no Cedar, no PreToolUse hook validating RBAC at execution time
2. **No Measure function** — no behavioral metrics, no compliance scoring, no audit trail
3. **Regulation stale detection** — no automated check for stale references; manual process only
4. **No regulation review cycle** — regulations are written but not scheduled for review
5. **Priority saturation** — all regulations load equally; no path-targeted filtering
6. **No trigger tables** — agent routing is manual (nopoint specifies agent); no convention-based routing
7. **Control plane conflation** — Orchestrator is both executor and governor; no separation

### 8.2 Recommended Changes (Prioritized)

**Priority 1 (High impact, low effort):**

1. **Convert RBAC regulation to enforcement** — encode the RBAC matrix in `~/.claude/settings.json` per agent type + a PreToolUse hook script. The prose regulation becomes secondary documentation of the enforced policy.

2. **Add ls-lint for naming** — single `.ls-lint.yaml` file converts the naming regulation to enforced policy. Eliminates the naming regulation entirely as a mandatory-read document.

3. **Path-targeted rules in `.claude/rules/`** — add YAML frontmatter to domain-specific rules (backend rules only when in Python files, frontend rules only in SolidJS files). Reduces context waste per session.

4. **Regulation review tags** — add a metadata header to every regulation: `last-reviewed:`, `owner:`, `review-cycle:`. A weekly script checks for overdue reviews.

**Priority 2 (Medium impact, medium effort):**

5. **Trigger table in global constitution** — small lookup table mapping file patterns to the correct agent type. Reduces manual agent specification overhead.

6. **Semi-structured regulation format** — convert regulations to a format with explicit `principal/action/resource` tables (human-readable but machine-compilable). Prerequisite for Prose2Policy pipeline.

7. **Audit log in agent sessions** — PostToolUse hook appending `{timestamp, agent_id, tool, path}` to a log file. Minimal Measure function.

**Priority 3 (High impact, high effort):**

8. **OPA bundle from regulations** — run Prose2Policy on `rbac-regulation.md` to generate a bootstrapped Rego bundle. Integrate into PreToolUse hook as the enforcement engine.

9. **Control plane separation** — lightweight Python sidecar evaluating tool permissions before Claude executes them. Separates Orchestrator governance role from execution role.

10. **ISO 42001 gap fill** — add formal risk and impact assessment documents for each active agent type. Satisfies control objective 3 and creates the documentation trail needed for EU AI Act GPAI obligations.

### 8.3 Convention Reduction Analysis

**The question:** Can 15 regulations be reduced to 5 by making conventions implicit?

**Answer:** Yes, to 7-8 regulations, with tooling. Breakdown:

**Regulations that can be eliminated by tooling:**
- Naming convention regulation → `ls-lint.yaml` (enforced, not read)
- File organization regulation → scaffold templates + directory structure (convention, not prose)
- Research output format regulation → this file's header is the convention (self-documenting)

**Regulations that can be shrunk by tooling:**
- Context economy regulation → token counter tool + compact CLAUDE.md recommendation is sufficient; 80% of prose is redundant once tooling is in place
- Agent onboarding regulation → pre-flight checklist script replaces prose; regulation becomes the script

**Regulations that must remain as prose (require human judgment):**
- Global constitution (law, not regulation; must remain prose)
- RBAC regulation (complex decisions; prose is the source, tooling is the artifact)
- Escalation rules (judgment-dependent; can't be automated)
- Memory lifecycle (nuanced; archive-not-delete philosophy requires explanation)
- Agent communication protocol (DAG topology must be explicit)

**Estimate: 15 → 8 regulations** with the following tooling investments:
- ls-lint (1 day)
- Scaffold templates (2 days)
- PreToolUse RBAC hook (2 days)
- Pre-flight script (1 day)
- Regulation review metadata + checker script (1 day)

Total: ~7 days to reduce cognitive load of governance by ~45%.

---

## Sources

### Enterprise AI Governance
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST AI RMF 2025 Updates](https://www.ispartnersllc.com/blog/nist-ai-rmf-2025-updates-what-you-need-to-know-about-the-latest-framework-changes/)
- [AAGATE: NIST AI RMF-Aligned Governance for Agentic AI (CSA, Dec 2025)](https://cloudsecurityalliance.org/blog/2025/12/22/aagate-a-nist-ai-rmf-aligned-governance-platform-for-agentic-ai)
- [AI Governance Frameworks Best Practices for Enterprises 2026 (OneReach)](https://onereach.ai/blog/ai-governance-frameworks-best-practices/)
- [Control Planes for Autonomous AI (O'Reilly)](https://www.oreilly.com/radar/control-planes-for-autonomous-ai-why-governance-has-to-move-inside-the-system/)

### EU AI Act
- [EU AI Act — European Commission](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [EU AI Act Timeline (DataGuard)](https://www.dataguard.com/eu-ai-act/timeline)
- [EU AI Act 2026 Compliance Guide (SecurePrivacy)](https://secureprivacy.ai/blog/eu-ai-act-2026-compliance)
- [The EU AI Act: 6 Steps to Take Before 2 August 2026 (Orrick)](https://www.orrick.com/en/Insights/2025/11/The-EU-AI-Act-6-Steps-to-Take-Before-2-August-2026)

### ISO 42001
- [ISO/IEC 42001:2023 — AI Management Systems](https://www.iso.org/standard/42001)
- [ISO 42001 Implementation Guide 2025 (ISMS.online)](https://www.isms.online/iso-42001/iso-42001-implementation-a-step-by-step-guide-2025/)
- [ISO 42001 Lessons Learned from Auditing (CSA, May 2025)](https://cloudsecurityalliance.org/blog/2025/05/08/iso-42001-lessons-learned-from-auditing-and-implementing-the-framework)

### Policy-as-Code
- [Open Policy Agent](https://www.openpolicyagent.org/)
- [OPA CNCF Best Practices 2025](https://www.cncf.io/blog/2025/03/18/open-policy-agent-best-practices-for-a-secure-deployment/)
- [ARPaCCino: Agentic RAG for Policy-as-Code Compliance (arXiv 2507.10584)](https://arxiv.org/html/2507.10584v1)
- [Prose2Policy: Natural Language to Rego (arXiv 2603.15799)](https://arxiv.org/html/2603.15799)
- [Amazon Bedrock AgentCore Policy (Cedar)](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy.html)
- [Cedar Policy Language Understanding](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/policy-understanding-cedar.html)
- [OPA vs Cedar vs Zanzibar 2025](https://www.osohq.com/learn/opa-vs-cedar-vs-zanzibar)
- [Secure AI Agents with Cedar (AWS Blog)](https://aws.amazon.com/blogs/machine-learning/secure-ai-agents-with-policy-in-amazon-bedrock-agentcore/)

### Agent RBAC
- [RBAC Excellence for AI Agents 2025 (CloudMatos)](https://www.cloudmatos.ai/blog/role-based-access-control-rbac-ai-agents/)
- [Complete Guide to AI Agent Frameworks 2025 (Langflow)](https://www.langflow.org/blog/the-complete-guide-to-choosing-an-ai-agent-framework-in-2025)
- [Best AI Agent Frameworks 2025 (Maxim)](https://www.getmaxim.ai/articles/top-5-ai-agent-frameworks-in-2025-a-practical-guide-for-ai-builders/)

### CLAUDE.md and Instructions at Scale
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Rules Directory: Modular Instructions That Scale](https://claudefa.st/blog/guide/mechanics/rules-directory)
- [Claude Code Memory in Large Codebases (Thomas Landgraf)](https://thomaslandgraf.substack.com/p/claude-codes-memory-working-with)
- [Writing a Good CLAUDE.md (HumanLayer)](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [CLAUDE.md, AGENTS.md, and Every AI Config File (DeployHQ)](https://www.deployhq.com/blog/ai-coding-config-files-guide)

### Naming Conventions
- [How Does Naming Affect LLMs on Code Analysis Tasks? (arXiv 2307.12488)](https://arxiv.org/html/2307.12488v5)
- [MCP Server Naming Conventions](https://zazencodes.com/blog/mcp-server-naming-conventions)
- [OpenTelemetry Semantic Conventions for Generative AI Agentic Systems](https://github.com/open-telemetry/semantic-conventions/issues/2664)
- [Codified Context: Infrastructure for AI Agents in Complex Codebases (arXiv 2602.20478)](https://arxiv.org/html/2602.20478v1)

### Regulation Lifecycle
- [Automated Compliance and AI Regulation (Institute for Law & AI)](https://law-ai.org/automated-compliance-and-the-regulation-of-ai/)
- [How AI Regulation Changed in 2025 (Promptfoo)](https://www.promptfoo.dev/blog/ai-regulation-2025/)
- [AI Regulations 2025 Global Changes (AtomicMail)](https://atomicmail.io/blog/ai-regulation-news-global-changes-and-watchlist)

---

*End of research. Written section by section as completed. Lead/TechResearch, 2026-03-22.*
