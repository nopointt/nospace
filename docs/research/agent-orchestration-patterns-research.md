# Agent Orchestration Patterns Research

**Topic:** Multi-agent orchestration patterns and task management for AI coding agents
**Researcher:** Lead/TechResearch (Eidolon instance)
**Date:** 2026-03-22
**Operator:** Eidolon / chief-research
**Context:** Evaluating whether current Orchestrator → Domain Lead → G3 (Player+Coach) hierarchy has better alternatives or improvements.

---

## Table of Contents

1. [Multi-Agent Orchestration Frameworks](#1-multi-agent-orchestration-frameworks)
2. [Production AI Coding Tool Architectures](#2-production-ai-coding-tool-architectures)
3. [Task Decomposition for AI Agents](#3-task-decomposition-for-ai-agents)
4. [Verification Patterns](#4-verification-patterns)
5. [Agent Communication Patterns](#5-agent-communication-patterns)
6. [Scaling Agent Teams](#6-scaling-agent-teams)
7. [Domain Lead Pattern Analysis](#7-domain-lead-pattern-analysis)
8. [Synthesis and Recommendations](#8-synthesis-and-recommendations)

---

## 1. Multi-Agent Orchestration Frameworks

### 1.1 Core Architectural Taxonomy

The field has converged on five fundamental orchestration topologies. Each trades control granularity for coordination cost differently.

**Source:** [Agent Orchestration Patterns: Swarm vs Mesh vs Hierarchical vs Pipeline — DEV Community](https://dev.to/jose_gurusup_dev/agent-orchestration-patterns-swarm-vs-mesh-vs-hierarchical-vs-pipeline-b40) (2025)

#### Orchestrator-Worker (Hub-and-Spoke)

A central orchestrator decomposes tasks and dispatches them to specialized workers. Workers do not communicate with each other. All results flow back to the hub.

- Latency: 2–5 seconds per task dispatch
- Strengths: single control flow, easy debugging, horizontal scalability
- Weaknesses: orchestrator is single point of failure and throughput bottleneck (if the orchestrator's LLM call takes 3 seconds and 20 workers are waiting, decomposition ceiling is ~6.7 tasks/second); context window degrades with 50+ intermediate results
- Best for: independent subtasks, document processing, code generation where subproblems are truly disjoint

#### Swarm (Shared Blackboard)

No centralized control. Agents make local decisions based on shared state (the "blackboard") or environmental signals. Handoff protocols transfer tasks between agents.

- Latency: variable, depends on convergence
- Strengths: no coordination bottleneck, high fault tolerance
- Weaknesses: poor observability, difficulty enforcing ordering, convergence not guaranteed
- Best for: exploration tasks, research, large-scale parallel investigation

#### Mesh (Peer-to-Peer)

Agents maintain persistent named connections to specific peers and communicate directly. Unlike swarm's anonymous shared state, mesh agents know exactly who they are talking to.

- Latency: 5–15 seconds per iteration cycle
- Strengths: iterative refinement on shared artifacts, medium control, medium fault tolerance
- Weaknesses: combinatorial explosion in connections — N agents create N(N-1)/2 connections; 50 agents = 1,225 connection points
- Best for: collaborative reasoning, code review loops; maximum practical size 3–8 agents

#### Hierarchical (Tree)

Multiple delegation levels. Top managers set strategy, mid-level supervisors handle tactics, leaf workers execute.

- Latency: 6–12 seconds minimum (stacks per hierarchy level; 3-level hierarchy with 2-second LLM calls adds 6 seconds before any worker starts)
- Strengths: context window management (no single agent needs full system context), logarithmic scalability
- Weaknesses: compounding latency, information loss through summarization at each level
- Best for: enterprise-scale (20+ agents), multi-domain systems, codebase audits at scale

#### Pipeline (Sequential Assembly Line)

Data flows through fixed sequential stages with clear input/output contracts at each boundary.

- Latency: predictable, cumulative across stages
- Strengths: easy monitoring, clear contracts, stage-independent model swapping
- Weaknesses: cannot handle runtime conditional branching, longest cold-start for interactive use
- Best for: content generation, ETL, compliance checking, batch workflows

---

### 1.2 Framework Comparison

**Sources:**
- [CrewAI vs LangGraph vs AutoGen — DataCamp](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen) (2025)
- [LangGraph vs AutoGen vs CrewAI — Latenode](https://latenode.com/blog/platform-comparisons-alternatives/automation-platform-comparisons/langgraph-vs-autogen-vs-crewai-complete-ai-agent-framework-comparison-architecture-analysis-2025) (2025)
- [In-Depth Comparison: LangGraph, AutoGen, MetaGPT, ChatDev, Swarm — StableLearn](https://stable-learn.com/en/global-open-source-ai-agents-introduction-and-selection/) (2025)
- [OpenAI Swarm GitHub](https://github.com/openai/swarm)

| Framework | Topology | Coordination Model | Software Dev Fit | Production-Ready |
|-----------|----------|-------------------|-----------------|-----------------|
| LangGraph | DAG graph with cycles | Stateful graph, reducer-based state merging | High — conditional routing, HITL, cyclical revision | Yes (LangChain ecosystem) |
| CrewAI | Role-based hierarchy | Role assignment, sequential or parallel crew | Medium — role abstraction maps to team structure | Yes |
| AutoGen | Event-driven conversation | Message passing, group chat manager | High — conversational task decomposition | Yes (Microsoft) |
| MetaGPT | Sequential pipeline | Structured artifact handoff (PRD → Design → Code) | Very High — models full SDLC | Research-grade |
| ChatDev | Sequential chat chains | Waterfall phases with role communication | High — simulates software company | Research-grade |
| OpenAI Swarm | Handoff-based peer | Agent handoffs via function calls | Low — explicitly not production-ready | No (educational) |

#### LangGraph Architecture Notes

LangGraph treats agent interactions as nodes in a directed graph with controlled cycles. Key mechanisms:
- **State persistence**: shared, persistent state across all workflow nodes using reducer logic for concurrent updates
- **Conditional edges**: routing decisions based on current state — enables dynamic branching (e.g., "if confidence < 0.7 → human review")
- **Checkpointing**: entire state stored externally, enabling pause/resume and HITL at any node
- **Send API**: orchestrator can dynamically create worker nodes and send them specific state slices; all worker outputs merge into shared state

Source: [LangGraph Architecture Guide — Latenode](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-ai-framework-2025-complete-architecture-guide-multi-agent-orchestration-analysis) (2025)

#### MetaGPT Architecture Notes

MetaGPT formalizes the "software company" pattern with five roles and standardized operating procedures (SOPs) encoded as prompt sequences:

1. Product Manager: analyzes requirements → produces PRD with user stories and requirement pool
2. Architect: translates PRD → system design (file lists, data structures, interface definitions)
3. Project Manager: task distribution from system design
4. Engineer: implements assigned classes and functions
5. QA Engineer: writes test cases

Critical innovation: **agents produce structured intermediate artifacts** (not just text). The use of structured outputs (PRD, design docs, interface specs) significantly increases downstream code generation accuracy. This is the same principle as spec-driven development.

Source: [MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework — arXiv](https://arxiv.org/html/2308.00352v6) (published 2023, ICLR 2024)

#### ChatDev Architecture Notes

ChatDev introduces "chat chains" that break each SDLC phase into smaller subtasks and guide multi-turn communications between role pairs. Sequential phases: Design → Coding → Testing → Documentation.

Roles: CEO, CTO, CPO, Programmer, Designer, Tester, Reviewer.

Key mechanism: **communicative dehallucination** — agents are instructed to request more specific details before giving responses rather than hallucinating answers. This is an explicit anti-hallucination design at the communication protocol level.

Source: [ChatDev: Communicative Agents for Software Development — arXiv](https://arxiv.org/abs/2307.07924) (ACL 2024)

---

## 2. Production AI Coding Tool Architectures

### 2.1 Claude Code Agent Teams

**Source:** [Claude Code Agent Teams — Official Docs](https://code.claude.com/docs/en/agent-teams) (2026-03-22, live)

Claude Code Agent Teams is the most directly relevant production system to study. Architecture:

| Component | Role |
|-----------|------|
| Team lead | Main Claude Code session; creates team, spawns teammates, coordinates work |
| Teammates | Independent Claude Code instances; own context windows; communicate peer-to-peer |
| Task list | Shared list with dependency resolution; file-locked claim mechanism |
| Mailbox | Async message delivery between agents; auto-delivered, no polling |

Key design decisions worth noting:
- **Subagents vs Teammates**: Subagents only report results back to the main agent (no peer communication). Teammates message each other directly. Choose subagents for focused tasks where only results matter; choose teams when agents need to share findings mid-task.
- **Peer-to-peer communication** distinguishes this from pure orchestrator-worker. Teammates can challenge each other's findings (adversarial hypothesis testing).
- **Plan approval gate**: Teammates can be required to plan in read-only mode before the lead approves implementation. This is a formal verification gate analogous to the G3 Coach role.
- **Hook system**: `TeammateIdle` hook (exit code 2 = keep working with feedback) and `TaskCompleted` hook (exit code 2 = prevent completion with feedback) provide external quality enforcement.
- **Recommended team size**: 3–5 teammates. 5–6 tasks per teammate keeps everyone productive.
- **Known limitation**: no nested teams — teammates cannot spawn their own teams. Only one level of orchestration depth from the lead.
- **Token cost**: significantly higher than subagents; each teammate is a full independent Claude instance.

Performance claim: 4–5x speedup on genuinely independent subtasks.

### 2.2 Devin / Devin 2.0

**Sources:**
- [Agent-Native Development: Deep Dive into Devin 2.0 — Medium](https://medium.com/@takafumi.endo/agent-native-development-a-deep-dive-into-devin-2-0s-technical-design-3451587d23c0) (April 2025)
- [Cognition: Devin 2.0](https://cognition.ai/blog/devin-2) (2025)

Key architecture decisions:
- Each Devin session runs in an **isolated virtual machine** — this prevents cross-session interference and makes parallelization natural
- Multi-agent: one Devin instance dispatches tasks to other Devin instances
- **Self-assessed confidence evaluation**: Devin asks for clarification when confidence is below a threshold. This is an explicit human-in-the-loop trigger based on internal state.
- **Automatic repository indexing**: every 2 hours, Devin indexes repos and generates architecture wikis with diagrams and source links — persistent contextual grounding
- Performance: 83% more junior-level development tasks per Agent Compute Unit (ACU) vs Devin 1.x

Devin's architecture is single-agent-first (a single powerful agent with full tool access) rather than role-specialized multi-agent. The multi-agent mode is additive, not foundational.

### 2.3 GitHub Copilot / Squad

**Sources:**
- [How Squad runs coordinated AI agents inside your repository — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-squad-runs-coordinated-ai-agents-inside-your-repository/) (2025)
- [VS Code 1.107 Multi-Agent Orchestration — Visual Studio Magazine](https://visualstudiomagazine.com/articles/2025/12/12/vs-code-1-107-november-2025-update-expands-multi-agent-orchestration-model-management.aspx) (December 2025)
- [How to orchestrate agents using mission control — GitHub Blog](https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/) (2025)

Squad (open source, built on GitHub Copilot) uses a "drop-box" architectural decision pattern: every significant architectural choice is appended as a structured block to a versioned `decisions.md` file in the repository. This is a persistent shared artifact that serves as coordination memory across agents.

Copilot Mission Control: single pane to assign tasks across repos, select custom agents, view real-time session logs, steer mid-run (pause/refine/restart), and jump into resulting PRs.

VS Code 1.107 expanded: Agent HQ (manage all agents from one view), background agents running in isolated workspaces.

Key insight: GitHub's approach emphasizes **repository-native coordination** — using the repo itself (decisions.md, PRs, issues) as the coordination substrate rather than an external orchestration layer.

---

## 3. Task Decomposition for AI Agents

**Sources:**
- [Spec-Driven Development: Unpacking 2025's Key New Practice — Thoughtworks](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices) (2025)
- [AI Coding Agents for Spec-Driven Development — Augment Code](https://www.augmentcode.com/guides/ai-coding-agents-for-spec-driven-development-automation) (2025)
- [Agentic Coding: GSD vs Spec Kit vs OpenSpec vs Taskmaster AI — Medium](https://medium.com/@richardhightower/agentic-coding-gsd-vs-spec-kit-vs-openspec-vs-taskmaster-ai-where-sdd-tools-diverge-0414dcb97e46) (February 2026)
- [GitHub Spec Kit — GitHub Blog](https://github.blog/developer-skills/agentic-ai-mcp-and-spec-driven-development-top-blog-posts-of-2025/) (2025)

### 3.1 Spec-Driven Development (SDD)

SDD has become an industry-recognized pattern in 2025. The methodology: separate planning from implementation using structured specification files as the coordination artifact.

Standard four-phase model:
1. **Specify** — define user journeys, business requirements, success criteria (no technical details)
2. **Plan** — create technical architecture, choose stack, identify dependencies
3. **Tasks** — break plan into small, independently executable tasks with explicit dependencies
4. **Implement** — agent executes tasks while human reviews focused changes

The specification files (requirements.md, design.md, tasks.md) serve as the single source of truth for agent behavior. Tools like Kiro, GitHub Spec Kit, OpenSpec, and Taskmaster AI all follow this pattern.

### 3.2 Accuracy Impact of Decomposition Quality

Critical research finding from Google: AI-generated changes with clear specifications achieve **91% accuracy** in predicting necessary file changes, compared to **less than 50%** with vague prompts.

Separately: multi-file AI coding with poor decomposition fails with only **19.36% accuracy** because agents lose architectural context across distributed systems. Single-function tasks achieve **87.2% accuracy**.

This is the empirical case for spec-driven task decomposition: it addresses the context fragmentation problem.

### 3.3 Manual vs Automatic Decomposition

The field has not converged on automatic decomposition as reliable. Current production tools (Kiro, GitHub Spec Kit) use AI-assisted decomposition with human review of the spec before execution.

Automatic decomposition (MetaGPT-style) works for greenfield toy projects. For existing production codebases with architectural constraints, the spec requires human input on what is frozen.

### 3.4 Task Granularity Recommendations

From Claude Code Agent Teams docs (validated by other sources):
- Too small: coordination overhead exceeds benefit
- Too large: agent works too long without check-ins, wasted effort risk
- Just right: self-contained units producing clear deliverables (a function, a test file, a reviewed module)
- Practical ratio: 5–6 tasks per agent keeps everyone productive without excessive context switching

---

## 4. Verification Patterns

**Sources:**
- [Demystifying Evals for AI Agents — Anthropic Engineering](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2025)
- [Self-Evaluation in AI Agents — Galileo](https://galileo.ai/blog/self-evaluation-ai-agents-performance-reasoning-reflection) (2025)
- [AI Trends 2026: Test-Time Reasoning and Reflective Agents — HuggingFace](https://huggingface.co/blog/aufklarer/ai-trends-2026-test-time-reasoning-reflective-agen) (2026)

### 4.1 Verification Pattern Taxonomy

Three categories of verification, used in combination in production systems:

**Self-reflection (single-agent):** The agent examines its own output guided by an external signal (failed unit test, internal principles, or explicit critique prompt) and generates improvement feedback for itself. Strength: cheap, no additional agents needed. Weakness: cannot catch blind spots inherent to the model's own reasoning.

**Generator-Critic (two-agent):** A separate Critic agent reviews the Generator agent's output. The Critic shifts into a different "mode" — looking for gaps in reasoning, inconsistencies, ambiguity, missing requirements. This change of perspective surfaces issues invisible in the initial pass. This is the G3 Player/Coach pattern.

**External evaluation (deterministic graders):** Unit tests, static analysis, type checking. These are the most reliable because they are objective and not subject to model hallucination.

### 4.2 Grader Types by Agent Category

From Anthropic's engineering practice:

| Agent type | Primary grader | Secondary grader |
|------------|---------------|-----------------|
| Coding agents | Unit tests pass/fail, static analysis | Code quality rubric (model-based) |
| Conversational agents | State verification (was ticket resolved?) | Interaction quality rubric |
| Research agents | Groundedness checks, coverage validation | Expert human review |
| Computer-use agents | Backend state verification | Page state checks |

Key principle: **grade the outcome, not the path**. Overly rigid tests that check execution steps rather than final state penalize valid creative solutions.

### 4.3 Pass@k vs Pass^k

Two metrics that matter differently:
- **Pass@k**: does the agent succeed in at least one of k attempts? Measures raw capability ceiling.
- **Pass^k**: does the agent succeed in all k attempts? Measures consistency (what users actually experience).

For production/customer-facing agents, pass^k (consistency) matters more than pass@k.

### 4.4 Reflection Loop Design

Production pattern from multiple sources: reflection alone is insufficient. In mature agentic architectures, reflection is combined with:
- Tool use to verify facts or retrieve authoritative data
- Human-in-the-loop controls for high-risk outputs
- Evaluation patterns to enforce standards
- Orchestration logic that decides when reflection is sufficient vs when escalation is required

The Coach/reviewer pattern (external agent with different perspective) is validated as superior to self-reflection for catching systematic blind spots.

### 4.5 Evaluation Infrastructure Principles

From Anthropic's engineering blog:
1. Start early with small datasets — 20–50 real failure cases beat waiting for hundreds of pristine test cases
2. Isolate trial environments — each run starts clean
3. Calibrate model graders against human expert judgment
4. Monitor for saturation — when scores reach 100%, build harder tests
5. Read transcripts relentlessly — you cannot know if graders work well without reading actual agent transcripts

---

## 5. Agent Communication Patterns

**Sources:**
- [Memory in LLM-based Multi-agent Systems — TechRxiv](https://www.techrxiv.org/users/1007269/articles/1367390/master/file/data/LLM_MAS_Memory_Survey_preprint_/LLM_MAS_Memory_Survey_preprint_.pdf?inline=true) (2025)
- [LLM-based Multi-Agent Blackboard System — arXiv 2510.01285](https://arxiv.org/pdf/2510.01285v1) (2025)
- [Multi-Agent Architectures — Arun Baby](https://www.arunbaby.com/ai-agents/0029-multi-agent-architectures/) (2025)
- [Four Design Patterns for Event-Driven Multi-Agent Systems — Confluent](https://www.confluent.io/blog/event-driven-multi-agent-systems/) (2025)

### 5.1 Memory and Communication Taxonomy

Three fundamental communication substrates for multi-agent systems:

**Message passing (direct):** Agents send explicit messages to named recipients. Pros: clear accountability, traceable. Cons: requires agents to know each other's identities; coordination overhead grows with team size.

**Shared memory / blackboard:** All agents read and write to a common state store. Pros: agents don't need to know about each other; asynchronous by nature. Cons: concurrent write conflicts, harder to trace causality.

**Artifact-based handoff:** One agent produces a structured artifact (file, document, database record) that the next agent consumes. Pros: natural checkpointing, human-readable intermediate state, composable pipelines. Cons: requires agreed-upon artifact schemas.

### 5.2 Memory Types in Multi-Agent Systems

Five types of agent memory used in practice:

- **In-context (working memory):** agent's current context window — fast but bounded
- **External (episodic/semantic):** databases, vector stores, knowledge graphs — persistent, shared
- **Procedural:** tools, skills, callable functions
- **Collective/shared:** the blackboard — all agents query and modify the same store
- **Episodic (per-agent):** role histories and conversation logs per agent

Key finding: memory allows agents to recall prior subtasks, coordinate handoffs, maintain role histories, share relevant knowledge, and build on earlier steps rather than restarting from scratch.

### 5.3 Blackboard Pattern in 2025 Research

The blackboard pattern (a shared knowledge base that agents post to and retrieve from) enables asynchronous collaboration without direct communication. Research frameworks like PC-Agent use a manager agent that maintains an evolving global task state, with worker agents completing role-specific subtasks and posting results to the blackboard.

Blackboard vs message passing for AI coding context: Spec files (requirements.md, design.md, tasks.md) are effectively a blackboard. File-based coordination is naturally persistent and human-readable — aligning with spec-driven development.

### 5.4 Artifact Handoff Protocol (OpenAI Swarm Model)

OpenAI's Swarm framework popularized explicit handoff: each agent has functions and can hand off to another agent when it encounters a task outside its specialization. The key insight: each agent only needs to know when to hand off and to whom — not the full task decomposition plan.

This is a lightweight alternative to centralized orchestration for simple sequential workflows.

### 5.5 Context Efficiency in Handoffs

Critical efficiency concern: Agent Teams (Claude Code) shows that each teammate has its own context window loaded from scratch with CLAUDE.md, MCP servers, and skills. This is expensive. The spawn prompt must contain all task-specific context because the lead's conversation history does not transfer.

Pattern recommendation: design handoff artifacts (specs, task files) to be maximally self-contained. Do not assume the receiving agent has any prior context.

---

## 6. Scaling Agent Teams

**Sources:**
- [Towards a Science of Scaling Agent Systems — Google Research / arXiv 2512.08296](https://arxiv.org/abs/2512.08296) (December 2025)
- [Why Your Multi-Agent System is Failing: The 17x Error Trap — Towards Data Science](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/) (2025)
- [The Mythical Agent-Month: Brooks's Law for AI Agents — Peter Forret Blog](https://blog.forret.com/2025/2025-10-26/mythical-agent-month/) (October 2025)
- [Google: Towards a Science of Scaling Agent Systems — InfoQ](https://www.infoq.com/news/2026/02/google-agent-scaling-principles/) (February 2026)

### 6.1 Quantitative Scaling Data

Google research (180 agent configurations studied) is the most rigorous published data on agent scaling:

**Performance range by task type:**
- Finance tasks (highly parallelizable): centralized coordination = +80.9% vs single agent
- Web navigation (moderately parallel): decentralized = +9.2%
- Planning/sequential tasks: ALL multi-agent variants degraded -39% to -70%

**Coordination overhead by architecture:**
- Independent (no coordination): 58% computational overhead
- Centralized: 285% overhead
- Decentralized: 263% overhead
- Hybrid: 515% overhead

**Error amplification factors:**
- Single-agent: 1.0x baseline
- Centralized: 4.4x (controlled via validation bottleneck)
- Decentralized: 7.8x
- Independent (bag of agents): **17.2x** — unchecked error propagation

**Agent count scaling (turn count follows power law):**
- 3-agent centralized system: 3.8x more turns than single agent
- 4-agent hybrid: 6.2x more turns
- Practical ceiling: "per-agent reasoning capacity becomes prohibitively thin beyond 3-4 agents"

**Predictive model:** The research claims their model correctly identifies the optimal coordination strategy for 87% of unseen task configurations. Key predictor: task decomposability, not task complexity.

### 6.2 The Task Decomposability Criterion

The most important finding in agent scaling research: the decisive factor is whether tasks are decomposable (parallelizable), not whether they are complex.

- Decomposable tasks: agents independently analyze separate components, then synthesize. Multi-agent helps.
- Sequential tasks: each action modifies state that subsequent actions depend on. Strict ordering. Multi-agent always hurts.

For software development: module-level parallelism (different files, different services) is decomposable. Within-function logic is sequential.

### 6.3 Brooks's Law Applied to AI Agents

The "Mythical Agent-Month" analysis applies Brooks's Law directly: adding AI agents to a software project has non-obvious costs.

"Onboarding" an AI agent requires feeding it the project's entire context through context engineering — consuming senior developer time. This is equivalent to ramping up a new team member.

Hidden coordination costs:
- Context provision (loading agent with project knowledge)
- Synchronization (keeping agents consistent on shared state)
- Error correction (cascading errors from one agent to another)
- Verification (checking agent outputs)

### 6.4 The Bag of Agents Anti-Pattern

The most common failure mode: treating multi-agent as simply "add more agents." Without deliberate coordination topology, independent agents generate 17.2x error amplification vs single-agent baseline.

The solution is topology-first design: choose the coordination pattern (hierarchical, centralized, decentralized, pipeline) based on task structure before choosing agent count.

### 6.5 Practical Team Size Recommendations

Converging guidance across sources:
- Claude Code Agent Teams docs: 3–5 teammates
- Google research: practical ceiling at 3–4 agents for reasoning-heavy tasks
- Agent orchestration patterns article: mesh limited to 3–8 agents before combinatorial explosion
- Token cost: scales linearly with agent count in Claude Code teams

Recommendation: default to 3 agents for most software development tasks. Scale to 5 only when task decomposability is confirmed and tasks are truly independent.

---

## 7. Domain Lead Pattern Analysis

**Sources:**
- [A Domain-Based Structure for Software Engineering Teams — Medium/Super.com](https://medium.com/super/a-domain-based-structure-for-software-engineering-teams-faab1b3428fb) (2024)
- [What Is a Tech Lead — Alci.dev](https://www.alci.dev/en/que-es/tech-lead) (2025)
- [Delegating Effectively as a Tech Lead — Better Programming](https://betterprogramming.pub/how-to-effectively-delegate-tasks-as-a-technical-leader-b6d634497512) (2024)
- [MetaGPT ICLR 2024 paper](https://proceedings.iclr.cc/paper_files/paper/2024/file/6507b115562bb0a305f1958ccc87355a-Paper-Conference.pdf)
- [ChatDev ACL 2024 paper](https://aclanthology.org/2024.acl-long.810/)

### 7.1 The Pattern in Human Organizations

The audit → spec → delegate pattern maps directly to the Tech Lead / Staff Engineer role in high-functioning engineering organizations.

In human teams, a Tech Lead:
- Understands the codebase domain deeply (audit)
- Defines technical approach, breaks down work, defines interfaces (spec)
- Delegates implementation to engineers while maintaining design oversight (delegate)
- Remains hands-on but is not the implementation bottleneck

The Staff Engineer variant is less hands-on, more architectural: they solve cross-team coordination problems by writing design documents that other teams implement. This is exactly the Domain Lead pattern: the Lead never writes production code, it writes specs that Player implements.

Domain Lead in engineering organizations (from Super.com engineering team): "an engineer responsible for the success of a domain who functions as a domain tech lead, helping assign work within the domain." The key: as many Domain Lead positions as there are domains (3–4 per squad), giving multiple engineers exposure to technical leadership without requiring a single senior lead to be the bottleneck.

### 7.2 MetaGPT as the Closest Academic Analog

MetaGPT's Architect role is the closest documented analog to the Domain Lead pattern:
- Takes structured PRD from Product Manager
- Translates to system design (file lists, data structures, interface definitions)
- Produces structured artifact that Project Manager decomposes further
- Never writes implementation code

The critical MetaGPT insight: **structured intermediate artifacts** between roles dramatically increase success rate. A design document is not just communication — it is a verification gate. If the Architect's output is incoherent, it fails before reaching the Engineer.

### 7.3 Comparison with Existing Patterns

| Aspect | Human Tech Lead | MetaGPT Architect | ChatDev Phase Lead | Domain Lead (current) |
|--------|----------------|-------------------|-------------------|----------------------|
| Audits domain | Yes (knows codebase) | Implicit (sees PRD) | Per-phase | Yes (explicit) |
| Produces spec | Design doc | System design artifact | Phase output | Yes (written spec) |
| Delegates | To engineers | To PM/Engineer | To next phase | To G3 Player |
| Verifies output | Code review | QA Engineer | Tester role | G3 Coach |
| Cross-domain visibility | Limited | Isolated role | None | By Orchestrator |

### 7.4 Key Validation: Structured Artifacts are the Core Value

The most consistent finding across MetaGPT, ChatDev, SDD literature, and Claude Code Agent Teams: the value of the Domain Lead / Architect / Tech Lead role is not task assignment — it is the production of structured intermediate artifacts that:

1. Force explicit thinking about what needs to be done before doing it
2. Create a verification surface (is the spec correct? is it complete?)
3. Reduce context requirements for executing agents (spec is self-contained)
4. Enable independent verification by the Coach without re-reading all source context

This validates the current G3 design: the spec IS the coordination mechanism.

### 7.5 Missing Pieces in Current Pattern

Comparing against production systems and research:

**No confidence-based escalation trigger:** Devin 2.0 implements self-assessed confidence evaluation — asking for human input when confidence is below a threshold. The current G3 Coach escalates to Orchestrator only after 3 Player→Coach iterations. A confidence-based pre-flight check by Player before starting could prevent wasted iterations.

**No persistent shared artifact store:** GitHub Squad's decisions.md and the blackboard pattern both use a persistent shared artifact that all agents can read. Currently, context is passed via the spec file, but there is no persistent store that accumulates decisions across sessions. The chronicle/scratch system partially fills this role but is not structured for agent consumption.

**No automatic task decomposability assessment:** The Google research shows that multi-agent helps on decomposable tasks and hurts on sequential ones. There is no current mechanism for the Orchestrator to assess decomposability before launching Domain Leads in parallel. This is a potential source of wasted tokens on sequential tasks.

---

## 8. Synthesis and Recommendations

### 8.1 What the Current Architecture Gets Right

The Orchestrator → Domain Lead → G3 (Player+Coach) hierarchy aligns with best practices in multiple dimensions:

- **Hierarchical topology with controlled depth**: 3 levels matches the Google research sweet spot (beyond 3-4 agents, reasoning capacity degrades)
- **Spec as coordination artifact**: Domain Lead produces a self-contained spec that enables isolated Player and Coach contexts — this is the MetaGPT structured artifact principle validated
- **External critic pattern**: Coach has a different perspective from Player and verifies against spec rather than against Player's explanation — this is the validated generator-critic pattern
- **Frozen interfaces**: Orchestrator defines frozen interfaces before Domain Leads start — this prevents parallel Leads from making conflicting architectural decisions
- **Parallel Lead launch for independent domains**: matches the Google finding that multi-agent helps on decomposable tasks

### 8.2 Highest-Value Improvements

Ranked by estimated impact vs implementation cost:

**1. Confidence-based pre-flight (HIGH value, LOW cost)**

Add a Player pre-flight step: before implementing, Player outputs a structured confidence assessment of the spec:
- Ambiguous requirements (list)
- Missing context (list)
- Confidence score (0-1)

If confidence < threshold or missing context list is non-empty → STOP, return `NEEDS_CONTEXT` before wasting a full implementation attempt. This mirrors Devin 2.0's confidence evaluation and reduces wasted Player→Coach iterations.

**2. Structured task decomposability tagging (MEDIUM value, LOW cost)**

Orchestrator should explicitly tag each task before launching Domain Leads:
- `decomposable: true/false`
- `sequential_dependency: [list of task IDs]`

Decomposable = launch Domain Leads in parallel. Sequential = force serial. This prevents the -39% to -70% performance degradation that Google research documents for multi-agent sequential tasks.

**3. Decision log artifact (MEDIUM value, LOW cost)**

Create a persistent `decisions.md` file (per project, in the development directory) analogous to GitHub Squad's pattern. Domain Leads append architectural decisions made during spec creation. This creates a cross-session shared context that prevents repeated architectural debates and helps future sessions reason about constraints.

**4. Outcome-focused Coach verification (HIGH value, MEDIUM cost)**

Current spec format should explicitly separate:
- Acceptance criteria (what outcome to verify)
- Implementation guidance (how to approach it)

Coach should verify outcomes, not implementation path. Anthropic's own engineering principle: "grade the outcome rather than the path" prevents penalizing valid creative solutions. Current spec format mixes these two concerns.

**5. Error amplification isolation (HIGH value, MEDIUM cost)**

The 17.2x error amplification of independent (uncoordinated) agents is the most dangerous failure mode. The current Coach role provides centralized validation (4.4x error amplification per Google data). However, if multiple Players run in parallel without a Coach per Player, errors can propagate. Rule: every Player output must pass through a Coach before being used by any other agent or merged.

### 8.3 Patterns to Avoid

**Bag of Agents**: launching multiple Players without independent Coach verification for each. Error amplification is 17x worse than single-agent.

**Nested teams at scale**: Claude Code explicitly limits teams to one level of nesting. This is a good constraint — hierarchies beyond 2 delegation levels add compounding latency (6+ seconds per level) and information loss through summarization.

**Mesh topology for implementation**: Mesh works for 3–8 tightly coupled agents on iterative refinement. For implementation tasks, use pipeline (sequential) or hub-and-spoke (parallel independent). Mesh between Players leads to combinatorial coordination explosion.

**Over-decomposition into tiny tasks**: Tasks too small mean coordination overhead exceeds benefit. The 5–6 tasks per agent target implies each task should be substantial enough to justify its own context window load.

### 8.4 Quick Reference: Pattern Selection

| Scenario | Recommended Pattern | Avoid |
|----------|--------------------|----|
| Independent modules, parallel work | Hub-and-spoke: Orchestrator → N Domain Leads → N G3 pairs | Mesh between Leads |
| Sequential SDLC phases (design then implement) | Pipeline: Domain Lead → Player → Coach | Parallel Players on dependent work |
| Debugging competing theories | Agent Teams (peer-to-peer, adversarial) | Single sequential investigation |
| Complex verification across domains | Multiple independent Coaches per Player | Single Coach for multiple Players |
| Sequential algorithmic task | Single Player, no multi-agent | Any multi-agent topology |

### 8.5 Recommended Reading for Further Depth

- [Towards a Science of Scaling Agent Systems (Google, arXiv 2512.08296)](https://arxiv.org/abs/2512.08296) — the most rigorous empirical data on scaling
- [MetaGPT ICLR 2024](https://arxiv.org/html/2308.00352v6) — structured artifact pattern, foundational
- [Demystifying Evals for AI Agents (Anthropic Engineering)](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — production verification design
- [Claude Code Agent Teams Docs](https://code.claude.com/docs/en/agent-teams) — live reference for peer-to-peer patterns
- [Why Your Multi-Agent System is Failing (Towards Data Science)](https://towardsdatascience.com/why-your-multi-agent-system-is-failing-escaping-the-17x-error-trap-of-the-bag-of-agents/) — error amplification topology analysis

---

*Research complete. Last updated: 2026-03-22.*
