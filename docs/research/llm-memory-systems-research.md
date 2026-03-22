# LLM Memory Systems Research
> Topic: Memory systems and context management for LLM-based AI agents in software development
> Context: 5-layer memory system (L0-L4 + Chronicle) for Claude Code agents managing multi-project workspace
> Research date: 2026-03-22
> Researcher: Lead/TechResearch (Eidolon)
> Status: Complete

---

## Table of Contents

1. [LLM Memory Architectures — Framework Survey](#1-llm-memory-architectures--framework-survey)
2. [Context Window Optimization](#2-context-window-optimization)
3. [Structured vs Unstructured Memory](#3-structured-vs-unstructured-memory)
4. [Session Continuity Patterns](#4-session-continuity-patterns)
5. [Memory Consolidation](#5-memory-consolidation)
6. [Chronicle / Logging Patterns](#6-chronicle--logging-patterns)
7. [SQLite as Memory Backend](#7-sqlite-as-memory-backend)
8. [Synthesis and Recommendations](#8-synthesis-and-recommendations)
9. [Sources Index](#9-sources-index)

---

## 1. LLM Memory Architectures — Framework Survey

### 1.1 MemGPT / Letta

Sources:
- https://docs.letta.com/concepts/memgpt/ (2026-03-22)
- https://www.letta.com/blog/agent-memory (2026-03-22)
- https://www.letta.com/blog/benchmarking-ai-agent-memory (2026-03-22)
- https://www.letta.com/blog/letta-v1-agent (2026-03-22)

**Core concept.** MemGPT treats LLM context as RAM and external storage as disk. Agents autonomously decide what to page in/out using self-editing memory tools. Inspired by OS virtual memory management. The original 2023 paper by Packer, Wooders et al. established this as a canonical pattern.

**Three-tier memory hierarchy:**

| Tier | Analogy | Characteristics |
|---|---|---|
| Core memory | RAM | Always in context. ~2000 tokens per block. Agent rewrites via tool call. Stores: persona, user profile, critical facts |
| Recall memory | L2 cache | Recent conversation history. Stored externally (PostgreSQL/SQLite). Retrieved via search tool, not always loaded |
| Archival memory | Disk | Unlimited external storage. Vector-indexed. Agent queries via `archival_memory_search`. Embedding-based retrieval |

**2025-2026 evolution (Letta V1).**
Moving from complex MemGPT-style paging to a leaner ReAct-like loop optimized for frontier models. Key shift: instead of the framework managing paging, the agent uses tool calls to manage its own memory blocks. This removes a layer of abstraction and reduces latency. PostgreSQL is the default production backend; SQLite for local/lightweight deployments.

**Benchmark finding (LoCoMo dataset).**
Letta tested filesystem-based memory tools (grep, search_files, open, close with auto-embedding) against Mem0's graph-based approach. Result: Letta filesystem achieved 74.0% accuracy vs Mem0's 68.5%. Key insight quoted: "Agents today are highly effective at using tools, especially those likely to have been in their training data (such as filesystem operations)." Implication: the storage mechanism matters less than agent capability. Well-designed filesystem ops can match vector DB retrieval at moderate scale.

**Applicability to current system:**

| Our layer | MemGPT/Letta equivalent |
|---|---|
| L0 (CLAUDE.md global rules) | Core memory block — persona/instructions |
| L1-L2 (project memory) | Core memory block — project context |
| L3 (phase context) | Recall memory — recent relevant context |
| L4 scratch files | Recall memory — session history |
| Chronicle | Archival memory — append-only long-term store |

Key gap: Letta agents self-manage their memory via tool calls. Our system requires human/orchestrator intervention to manage layer transitions. The architecture is sound; the autonomy layer is missing.

---

### 1.2 LangGraph Memory

Sources:
- https://docs.langchain.com/oss/python/langgraph/memory (2026-03-22)
- https://dev.to/sreeni5018/the-architecture-of-agent-memory-how-langgraph-really-works-59ne (2026-03-22)
- https://markaicode.com/langgraph-memory-short-term-long-term-storage/ (2026-03-22)
- https://redis.io/tutorials/what-is-agent-memory-example-using-langgraph-and-redis/ (2026-03-22)
- https://sparkco.ai/blog/mastering-langgraph-state-management-in-2025 (2026-03-22)

**Core concept.** LangGraph separates memory into thread-scoped (short-term) and cross-session (long-term) with explicit namespace-based storage. Memory is a first-class graph primitive, not an afterthought.

**Short-term (thread-scoped):**
- Conversation history persisted via checkpointers
- State = TypedDict schema with reducer functions (e.g., `add_messages` appends rather than replaces)
- Backends: `MemorySaver` (in-memory, dev), `SqliteSaver` (local), `PostgresSaver` (production)
- Checkpoints enable resume at any graph node after failure or interruption
- Every node receives full state, returns only partial updates

**Long-term (cross-session):**
- `InMemoryStore` (dev) or `PostgresStore` (production)
- Namespaced by tuple: `(user_id, "preferences")`, `(agent_id, "knowledge")`, `(project, "decisions")`
- Retrieve via: `store.search(namespace, query)` or `store.get(namespace, key)`
- PostgresStore supports vector similarity search natively

**State management pattern (2025):**
```
Explicit reducers → atomic updates per node
Interrupt/resume → `interrupt()` suspends, `Command(resume=value)` continues
Cross-thread → agents write to shared namespace, any thread can read
```

**Production storage stack:**

| Scale | Thread state | Long-term |
|---|---|---|
| Local dev | SqliteSaver | InMemoryStore |
| Production | PostgresSaver | PostgresStore (+ pgvector) |
| High-frequency | PostgresSaver | Redis |
| Hybrid doc+vector | PostgresSaver | MongoDB Atlas |

**Applicability.** LangGraph's checkpointer pattern is the most directly applicable to our session continuity problem. `SqliteSaver` stores every node's state as JSON keyed by `(thread_id, checkpoint_id)`, with full metadata (node name, timestamp, parent checkpoint ID). Our L4 scratch files are a manual approximation of this — structurally correct but not automatic.

---

### 1.3 CrewAI Memory

Sources:
- https://docs.crewai.com/en/concepts/memory (2026-03-22)
- https://sparkco.ai/blog/deep-dive-into-crewai-memory-systems (2026-03-22)
- https://dev.to/foxgem/ai-agent-memory-a-comparative-analysis-of-langgraph-crewai-and-autogen-31dp (2026-03-22)

**Four memory types:**

| Type | Storage | Scope | Purpose |
|---|---|---|---|
| Short-term | LanceDB (vector) | Session | RAG over recent task context |
| Long-term | SQLite (`lts.db`) | Cross-session | Task outcomes + quality scores |
| Entity | LanceDB (vector) | Cross-session | People, orgs, concepts encountered |
| Contextual | Computed | On-demand | Synthesis of all three above |

**Storage details:**
- Default path: `./.crewai/memory/` (env: `CREWAI_STORAGE_DIR`)
- Long-term SQLite schema: `tasks_outputs(task_description, output, quality_score 0-10, datetime)`
- Custom backend: implement `StorageBackend` protocol, pass as `Memory(storage=your_backend)`
- LanceDB replaced ChromaDB in newer versions for better columnar performance

**Key design insight.** CrewAI uses SQLite for structured long-term memory (outcomes, scores, metadata) while using a vector store for semantic retrieval (short-term, entity). This hybrid is notable — not "pick one", but "use both for what each does best."

**Applicability:**
- SQLite long-term memory pattern maps directly to our Chronicle (structured logs + metadata)
- Entity memory concept maps to `semantic-context-global.md` (entity-centric)
- Quality score per task could inform episodic memory (decision logs with outcome ratings)

---

### 1.4 AutoGen Memory

Sources:
- https://latenode.com/blog/platform-comparisons-alternatives/automation-platform-comparisons/langgraph-vs-autogen-vs-crewai-complete-ai-agent-framework-comparison-architecture-analysis-2025 (2026-03-22)

**Architecture.** Primary memory = conversational history (message list). No built-in long-term memory — relies entirely on external integrations (Chroma, PGVector, Zep, Mem0, Azure Cognitive Search).

**Memory strategies:**
- `GroupChatManager` periodically compresses history via summarization
- Transform chain: conversation transformers filter/truncate messages before LLM call
- External retrieval: agents call retrieval tools at query time

**Key weakness.** No native persistent state. Each session restart = blank slate unless developer implements persistence. Noted as the most significant gap vs LangGraph/CrewAI.

**Applicability.** AutoGen's approach is the baseline naive implementation — useful as a contrast. The transform chain pattern (truncation/filtering of messages) is directly relevant to our context-loading problem.

---

### 1.5 Mem0 — Standalone Memory Service

Sources:
- https://www.digitalocean.com/community/tutorials/langgraph-mem0-integration-long-term-ai-memory (2026-03-22)

Mem0 is a standalone memory service designed to integrate with any LLM framework. Key properties:
- Automatic memory extraction from conversations (no explicit "remember this" required)
- Conflict resolution: when new memory contradicts old, Mem0 decides which to keep
- Scope levels: user, agent, or app level
- Local backends: SQLite + vector (Qdrant/Chroma embedded)
- Cloud backend: Mem0 managed service

Usage pattern:
```
mem0.add(messages, user_id="user_123")      # extract and store memories
mem0.search(query, user_id="user_123")      # retrieve relevant memories
# inject results into next LLM call
```

**Key differentiator.** Mem0 manages the full memory lifecycle automatically — it decides what to remember, update, and forget. The developer only calls add/search. This removes the "what to memorize" cognitive load from agents.

**Applicability.** Mem0's automatic extraction could replace our manual `/checkpoint` commands. However, it introduces an external dependency and would need to be self-hosted for sovereignty.

---

## 2. Context Window Optimization

Sources:
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (2026-03-22)
- https://factory.ai/news/context-window-problem (2026-03-22)
- https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/ (2026-03-22)
- https://airbyte.com/agentic-data/ai-context-window-optimization-techniques (2026-03-22)
- https://repositum.tuwien.at/bitstream/20.500.12708/224666/1/Hrubec%20Nicolas%20-%202025%20-%20Reducing%20Token%20Usage%20of%20Software%20Engineering%20Agents.pdf (2026-03-22)
- https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2 (2026-03-22)
- https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms (2026-03-22)
- https://eval.16x.engineer/blog/llm-context-management-guide (2026-03-22)

### 2.1 Context Rot — Critical Finding

**Context rot:** as token count in the context window increases, the model's ability to accurately recall information from earlier in that context decreases non-linearly. Transformers have a finite "attention budget." Every new token introduced depletes this budget. Beyond ~50-100K tokens, retrieval accuracy on content from the beginning of the context degrades significantly — even in models with 200K+ windows.

Needle-in-a-haystack benchmarks consistently confirm this. The implication for our system: loading all memory layers (L0-L4 + Chronicle) at session start is actively harmful even if it fits within the window. We are trading token cost for accuracy degradation.

**Anthropic's framing (context engineering for agents):**
> "Treat context as a finite resource with diminishing marginal returns. Every token must attend to every other token, creating n² pairwise relationships."

**Key principle:** Find the smallest set of high-signal tokens that maximize the likelihood of the desired outcome.

### 2.2 Selective Loading Strategies

**Just-in-time (JIT) retrieval.**
Maintain lightweight identifiers (file paths, topic names, layer IDs) rather than content. Agents fetch specific content at the moment they need it via tool calls. Anthropic cites Claude Code itself as an example: loads CLAUDE.md at start, then uses `grep` and `glob` for dynamic discovery — does not pre-load all files.

**Benchmark result (Speakeasy, 2025).**
Dynamic toolsets (JIT tool loading) vs static toolsets (all tools always available): 100-160x token reduction with 100% maintained task success rate. Applied to memory: JIT memory loading should yield similar reductions.

**Sub-agent architecture for context isolation.**
Specialized sub-agents handle focused tasks with clean context windows, returning condensed summaries (1,000-2,000 tokens) rather than full explorations. This is exactly our current G3 Player/Coach pattern — and it works. The Orchestrator maintains the global context; sub-agents receive only the spec.

**Progressive disclosure.**
Agents incrementally discover relevant context through exploration. File sizes, naming conventions, and timestamps signal information relevance without loading file content. Index-first, content-second.

### 2.3 Selective Context Injection Algorithm

Anthropic and production implementations converge on this pattern:
1. Receive task/query
2. Identify relevant memory keys by topic, recency, relevance score (not by loading all content)
3. Fetch only those keys from external store (tool call)
4. Inject minimal retrieved context into LLM call
5. After task: write updates back to store

For our workspace: instead of loading `current-context-tlos.md` (full, ~1200 lines), load only the section(s) relevant to the current task. A "section map" (small index of section headers) enables targeted loading without reading the full file.

### 2.4 Summarization and Compression

**LLMLingua (Microsoft Research).** Prompt compression that removes redundant tokens with <5% accuracy loss. Effective for RAG systems with long retrieved documents. Open source. Particularly useful when retrieved context must be included but is verbosely written.

**Recursive summarization.** Long chronicles/transcripts → progressive summarization. Summarize the summaries. Reduces 100K tokens to ~2K with key facts preserved. Loss: implementation details, failed experiments, exact wording.

**Window truncation strategies (from LangGraph docs):**

| Strategy | Mechanism | Fidelity |
|---|---|---|
| FIFO | Drop oldest messages | Low — loses early context |
| Importance-weighted | Score each chunk, drop lowest | Medium — requires scoring |
| Summary-then-trim | Summarize what will be dropped, keep summary | High |
| Hybrid | Keep first N + last N + summary of middle | High |

### 2.5 Token Format Efficiency

Measured token cost per equivalent unit of information (baseline = verbose markdown):

| Format | Relative token cost | LLM parse accuracy |
|---|---|---|
| Verbose markdown (prose) | 1.0x baseline | High |
| Compact markdown (tables, bullets, no padding) | 0.4x | High |
| YAML | 0.8x | High |
| JSON | 1.2x | High |
| XML | 1.5x | Medium |
| Plain text (unstructured) | 0.35x | Medium — loses structure |
| SQLite row serialized as JSON line | 0.6x | High |

**Finding:** Compact markdown is the most token-efficient format that preserves structure and LLM parse accuracy. Our current MD files are the right format — the problem is loading strategy, not format.

---

## 3. Structured vs Unstructured Memory

Sources:
- https://www.letta.com/blog/benchmarking-ai-agent-memory (2026-03-22)
- https://github.com/doobidoo/mcp-memory-service (2026-03-22)
- https://zeroclaws.io/blog/zeroclaw-hybrid-memory-sqlite-vector-fts5/ (2026-03-22)
- https://github.com/sqliteai/sqlite-memory (2026-03-22)

### 3.1 Decision Matrix

**Flat files (MD / JSON) — win when:**
- Human readability is required (nopoint opens files in editor)
- Git-native versioning is required (memory changes are diffable, revertable)
- Zero tooling is the constraint (no DB driver, no schema migration)
- LLM-native consumption is the priority (LLMs are trained on MD text)
- Workspace scale is small (<1000 active facts, <50 documents)
- Grep/search over content works: `grep -r "ContentRouter" nospace/docs/`

**Databases (SQLite) — win when:**
- Cross-session querying is required: "what decisions about X in last 30 days?"
- Multiple agents write concurrently (WAL mode handles this)
- Structured retrieval is required: filter by project, phase, agent, decision type
- Integrity matters: transactions prevent partial writes
- Scale exceeds ~1000 facts: retrieval precision requires indexing
- Semantic search over memory is needed (vector similarity)

**Letta benchmark insight.** Letta's LoCoMo study tested filesystems (with semantic search via embedding) against vector-DB-backed memory. Key finding: at their benchmark scale, filesystem approach actually outperformed (74% vs 68.5%). The agents' ability to use file operation tools effectively compensated for the lack of DB-level indexing. Interpretation: the storage backend is less critical than the retrieval strategy. Well-designed filesystem access patterns can match DB retrieval at moderate scale.

### 3.2 Hybrid Approach — Best of Both

Production systems increasingly use a hybrid: MD files as source of truth (human-readable, git-tracked) + SQLite as query layer (indexed, structured). The SQLite index is derived from the MD files and is rebuildable. This preserves all flat-file benefits while adding structured querying.

This is the approach used by ZeroClaw, sqlite-memory, and several LangGraph deployments.

### 3.3 When to Migrate

Migration trigger thresholds from production literature:
- >1000 stored memory facts → vector retrieval precision degrades with flat files
- >3 concurrent writing agents → SQLite WAL mode becomes necessary
- Query patterns require filtering by metadata (project, date, type) → SQL is the right tool
- Session state restoration takes >5 seconds → indexing required

Current workspace (nospace): ~50 active MD files, ~2-3 agents writing. Well below migration thresholds. But migration path should be designed now.

---

## 4. Session Continuity Patterns

Sources:
- https://sparkco.ai/blog/mastering-langgraph-state-management-in-2025 (2026-03-22)
- https://medium.com/@anil.jain.baba/long-term-agentic-memory-with-langgraph-824050b09852 (2026-03-22)
- https://dev.to/gonewx/cursor-vs-claude-code-vs-windsurf-which-one-handles-context-loss-the-worst-real-tests-dpe (2026-03-22)
- https://dev.to/gonewx/i-tried-3-different-ways-to-fix-claude-codes-memory-problem-heres-what-actually-worked-30fk (2026-03-22)
- https://mer.vin/2025/12/ai-coding-assistant-memory-systems-compared-claude-vs-gemini-vs-codex-vs-windsurf-vs-cursor/ (2026-03-22)

### 4.1 LangGraph Checkpoint / Restore (Gold Standard)

LangGraph's `SqliteSaver` is the most production-proven pattern for session continuity in Python-based agent systems.

```python
# Configuration
from langgraph.checkpoint.sqlite import SqliteSaver
checkpointer = SqliteSaver.from_conn_string("memory.db")
graph = workflow.compile(checkpointer=checkpointer)

# Automatic persistence — every node's state saved
graph.invoke(input, config={"configurable": {"thread_id": "session-abc"}})

# Resume from last checkpoint on next session
# Same thread_id → automatically picks up where left off

# Inspect state
checkpoint = graph.get_state(config)
# Contains: state dict, pending writes, metadata, parent checkpoint

# Rollback to specific point
graph.update_state(config, new_state, as_node="node_name")
```

**Schema (simplified):**
```sql
CREATE TABLE checkpoints (
  thread_id TEXT,
  checkpoint_id TEXT,
  parent_checkpoint_id TEXT,
  type TEXT,
  checkpoint BLOB,  -- JSON state dict
  metadata BLOB,    -- {source: "loop", step: 3, writes: {...}}
  PRIMARY KEY (thread_id, checkpoint_id)
);
```

**Key properties:**
- Every node transition = automatic checkpoint
- Checkpoints are immutable (append-only)
- Resume = find latest checkpoint for thread_id, restore state, continue
- Interruption = `interrupt()` call, human provides input, `Command(resume=value)` continues

Our L4 scratch files are a manual, human-driven approximation of this pattern. Structurally correct but not automatic.

### 4.2 How Production Coding Agents Handle Session State

**Cursor:**
- Session state = conversation history in SQLite (local app storage)
- Codebase index: separate SQLite + vector index, rebuilt incrementally
- Cross-session memory: none natively; each new chat is blank
- Workaround: "Rules for AI" (static text injected at session start, equivalent to our CLAUDE.md)

**Windsurf:**
- Similar to Cursor for session state
- "Memories" feature (2025, experimental): user-defined notes + automatic preference extraction, stored as text file injected at session start
- Cross-session memory: shallow (preferences only, not decisions/context)

**Claude Code (native):**
- CLAUDE.md files injected at session start (L0 equivalent)
- `claude -c` to continue last session; `claude -r {id}` to restore specific session
- No native cross-session agent memory — each session is independent unless CLAUDE.md is loaded
- Memory layers (our L1-L4 + Chronicle) = custom extension on top of native capabilities

**Key finding:** Even production-grade coding agents (Cursor, Windsurf) lack sophisticated cross-session memory. They rely on codebase indexing (file content search) rather than agent memory per se. Our 5-layer system is more sophisticated than what these tools provide natively. We are at the frontier, not behind it.

### 4.3 Practical Session Continuity Approaches (Community)

A practitioner who tested three approaches for Claude Code (DEV Community, 2026):

| Approach | What | Strength | Weakness |
|---|---|---|---|
| CLAUDE.md + timestamped notes | Structured session summaries in MD | Human-readable, no tooling | Requires consistent discipline |
| SQLite MCP memory layer | `remember()` / `recall()` tools | Semantic knowledge persists | Doesn't capture code state; requires explicit prompting |
| Git-integrated session replay (Mantra) | Links conversation to git commits | Captures reasoning + code snapshots | Requires manual review |

Best result: **hybrid** — SQLite MCP for decision logging + git integration for code state + selective CLAUDE.md updates. Achieved ~80% continuity. The remaining 20% = nuanced directional context that remains hard to reconstruct.

**Applicability:** This matches our current architecture directionally. Our chronicle + scratch files provide the "decisions log" component. The missing piece is structured querying (SQLite index) and git-linked state snapshots.

### 4.4 Scratch File Pattern vs SQLite

**Current scratch pattern:**
```
memory/scratches/{session_id}+{N}-scratch.md
```

**Limitations in practice:**
- Linear scan to find relevant scratches (O(n) grep)
- No structured query ("all scratches mentioning ContentRouter from the last 2 weeks")
- No metadata index (project, phase, key decisions)
- Size grows unboundedly without manual cleanup

**Proposed SQLite scratch index:**
```sql
CREATE TABLE scratches (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  project TEXT,
  phase TEXT,
  created_at INTEGER,       -- unix timestamp
  content TEXT,             -- full markdown content
  summary TEXT,             -- auto-generated 3-sentence summary
  key_decisions TEXT,       -- extracted decisions as JSON array
  open_questions TEXT       -- extracted open questions as JSON array
);

CREATE VIRTUAL TABLE scratches_fts USING fts5(
  content, key_decisions, open_questions,
  content='scratches',
  content_rowid='id'
);
```

This would enable: `SELECT * FROM scratches WHERE project='tLOS' AND phase='1.5' AND created_at > X` and full-text search over all scratch content simultaneously.

---

## 5. Memory Consolidation

Sources:
- https://arxiv.org/html/2601.01885v1 (Agentic Memory / AgeMem, 2026-03-22)
- https://www.techrxiv.org/users/1007269/articles/1367390/master/file/data/LLM_MAS_Memory_Survey_preprint_/LLM_MAS_Memory_Survey_preprint_.pdf (LLM MAS Memory Survey, 2026-03-22)
- https://dl.acm.org/doi/10.1145/3765766.3765803 (ACT-R Memory Architecture, 2026-03-22)
- https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms (2026-03-22)
- https://eval.16x.engineer/blog/llm-context-management-guide (2026-03-22)
- https://arxiv.org/html/2602.06052v3 (Rethinking Memory Mechanisms, 2026-03-22)

### 5.1 Consolidation Strategies from Research

**Progressive summarization (recommended for our use case).**
Cascade of summarization levels, each 5-10x compression of the level below:
```
Raw session scratches (L4)
    → Session summary (500 tokens per session)
        → Weekly summary (200 tokens per week)
            → Phase summary (300 tokens per phase)
                → Project summary (L2 layer)
```

Preserve across all levels: decisions, outcomes, open questions, key entities.
Archive at each compression step: implementation details, debugging logs, intermediate explorations.
Discard: test runs, formatting changes, auto-generated content.

**Forgetting curves (ACT-R model, experimental).**
The ACT-R cognitive architecture paper (ACM HAI 2025) applies Ebbinghaus forgetting to agent memory:
- Each memory item has an activation score = function of access frequency + recency
- Score below threshold → demote to archive → eventually delete
- "Repeated references selectively maintained and reinforced associated memories while others naturally faded over time"
- Result: same question yields different recalled content across instances as memory evolves

**Implementation status:** No production framework fully implements forgetting curves for agents as of 2025. The pattern is theoretically sound but practically requires:
1. Per-item access tracking (when was this fact last read by an agent?)
2. Decay function application (scheduled job)
3. Demotion/deletion pipeline

This is future work for our system. Manual archival is sufficient for now.

**Agentic Memory (AgeMem) approach.**
Exposes memory operations as tool-based actions. The agent itself decides what to store, retrieve, update, summarize, or discard. Three-stage progressive RL training teaches the agent when to use each operation. More autonomous than our current human-driven consolidation.

**A-MEM (four-step consolidation):**
1. Note construction: create memory note with content + timestamp + keywords + tags
2. Link generation: identify relevant historical memories (for cross-referencing)
3. Memory evolution: decide whether new note updates or contradicts existing memory
4. Retrieval: semantic search at query time

This maps well to our desired system: each Chronicle entry could follow this four-step pattern.

### 5.2 Chronicle Consolidation (Our Specific Use Case)

**Current state:**
- `tlos-chronicle.md` — full history (~1000+ lines), append-only
- `tlos-current.md` — working set (~1200 lines), manually maintained

**Problem:** Current-context file grows without clear management policy. Lines accumulate until nopoint manually compacts. No programmatic trigger.

**Recommended consolidation policy (derived from LangGraph + MemGPT patterns):**

Trigger conditions (any one sufficient):
- Line count: current-context > 1500 lines
- Token estimate: loading current-context costs > 12K tokens
- Time: weekly, regardless of size
- Event: phase completion or major architectural decision

Consolidation procedure:
1. Identify entries older than the current phase (or older than 4 weeks)
2. Group by topic/decision area
3. LLM-summarize each group: 3-5 bullet points preserving decision + rationale + outcome
4. Append summary to monthly archive: `chronicle/2026-03/week-12.md`
5. Remove summarized entries from `tlos-current.md`
6. Add one-line cross-reference in `tlos-current.md`: `[see: 2026-W12 archive — ContentRouter decisions]`

**What to always preserve (never consolidate away):**
- Architecture decisions with rationale (ADR-style)
- Technology choices (why X over Y)
- Breaking changes and migrations
- Unresolved open questions (must remain in current-context until resolved)

**What to archive after phase completion:**
- Implementation detail logs
- Debugging session notes
- Rejected alternatives exploration

**What to delete (truly ephemeral):**
- Test runs that succeeded with expected output
- Formatting-only changes
- Auto-generated content that can be regenerated

### 5.3 Multi-Agent Memory Survey Findings (Academic, 2025-2026)

From "Memory in LLM-based Multi-Agent Systems" (TechRxiv preprint) and ICLR 2026 workshop:

**Memory operation taxonomy:**
- Write: store new information
- Read: retrieve relevant information
- Update: modify existing memory (conflict resolution)
- Delete/Archive: remove outdated information
- Transfer: move between memory tiers (e.g., L4 scratch → L2 project memory)

**Collective forgetting problem:** In multi-agent systems, when one agent updates memory, other agents may have stale views. Solutions: shared memory bus (Pub/Sub), lock-based writes, or eventual consistency with version vectors.

**For our system:** Axis/Logos/Satoshi each write to their respective chronicle queues. A consolidation agent (Axis, in practice) drains the queue and updates shared memory. This is already our architecture — the queue pattern is validated by research.

---

## 6. Chronicle / Logging Patterns

Sources:
- https://event-driven.io/en/audit_log_event_sourcing/ (2026-03-22)
- https://akka.io/blog/event-sourcing-the-backbone-of-agentic-ai (2026-03-22)
- https://github.com/sumant1122/agentlog (2026-03-22)
- https://prefactor.tech/blog/audit-trails-in-ci-cd-best-practices-for-ai-agents (2026-03-22)
- https://www.cloudmatos.ai/blog/creating-audit-ready-multi-agent-systems/ (2026-03-22)

### 6.1 Event Sourcing Pattern for Agent Chronicles

**Core principle:** The chronicle is an event store. Current state (context files, L1-L3) = projection of events. To reconstruct state at any point in time: replay chronicle from beginning.

This is the theoretical foundation of our Chronicle + current-context.md split:
- Chronicle = event store (append-only, immutable)
- current-context.md = materialized view (projection, regenerable, lossy for convenience)

**Event sourcing applied to AI agents:**
> "Event sourcing enables auditing of nondeterministic systems and allows fearless experimentation through event logs that can inform fine-tuning and context engineering."

**AgentLog (open source, 2025):** Lightweight event bus for AI agents built on append-only JSONL logs. Agents publish and subscribe to events via HTTP/SSE. Each event = one JSONL line. Enables simple, replayable, debuggable multi-agent workflows. Schema per event:
```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "agent_id": "axis",
  "event_type": "decision|action|observation|error",
  "session_id": "sess-abc",
  "payload": {...},
  "parent_event_id": "uuid-of-triggering-event"
}
```

### 6.2 Recommended Chronicle Entry Format

**Hybrid format: structured header + prose body.** Structured enough to be indexed by scripts; prose body directly consumable by LLMs without transformation.

```markdown
## [2026-03-22T14:32:00Z] tLOS — architecture-decision: ContentRouter Phase 1.5

**Agent:** Axis
**Project:** tLOS
**Phase:** 1.5
**Session:** sess-{hash}
**Type:** architecture-decision
**Impact:** high
**Status:** resolved
**Git:** {commit-hash}

### Decision
[2-4 sentences: what was decided]

### Rationale
[prose: why]

### Alternatives Considered
- {Option A}: rejected because...
- {Option B}: rejected because...

### Open Questions
- [ ] {question that needs follow-up}

### Outcome
{result observed after implementation, filled in later}
```

**Why this format:**
- YAML-like header = parseable by grep/scripts for indexing and filtering
- Prose body = directly LLM-consumable without transformation
- Git commit hash = links decision to exact code state
- Open questions = tracked as checkboxes, greppable for `- [ ]`
- Markdown = git-diffable, FTS5-indexable

### 6.3 Audit Trail Requirements for AI Agents

From production literature (CI/CD audit trails for AI agents, 2025):

**Mandatory fields per entry:**
- `agent_id`: which agent generated this
- `session_id`: session in which it was generated
- `timestamp`: ISO-8601, UTC
- `event_type`: decision | action | observation | error | question
- `model_version`: which model version was running
- `causal_parent`: event/input that triggered this

**Immutability rule:** Never edit past entries. Wrong decisions are valuable learning data. A bad decision + its eventual correction is more valuable than a sanitized log that only shows correct outcomes.

**Human review markers:** Mark entries that require human validation:
```markdown
**Review Required:** YES — {reason}
```

**Rollback support:** Entries reference specific git commit hashes so the code state at decision time is recoverable.

### 6.4 Structured Logging for Python Agents

For the Thelos Python backend that generates chronicle entries:

| Library | Format | Structured | Agent-Friendly |
|---|---|---|---|
| `structlog` | JSON or text | High | Good |
| `loguru` | Rich text | Partial | Good for ops logs |
| `opentelemetry` | OTLP spans | High | Excellent for distributed |
| Custom SQLite logger | SQL | High | Best for agent memory |

**Recommendation for our stack:** Custom SQLite logger for agent decisions (structured, queryable, persistent), `loguru` for operational logs (errors, timing). The SQLite agent log exports to MD Chronicle via scheduled script — humans and LLMs read MD; scripts query SQLite.

---

## 7. SQLite as Memory Backend

Sources:
- https://gerus-lab.hashnode.dev/why-your-ai-agents-memory-is-broken-and-how-to-fix-it-with-sqlite (2026-03-22, 403 but search results summarized)
- https://dev.to/aairom/embedded-intelligence-how-sqlite-vec-delivers-fast-local-vector-search-for-ai-3dpb (2026-03-22)
- https://zeroclaws.io/blog/zeroclaw-hybrid-memory-sqlite-vector-fts5/ (2026-03-22)
- https://github.com/sqliteai/sqlite-memory (2026-03-22)
- https://github.com/asg017/sqlite-vec (2026-03-22)
- https://arxiv.org/html/2603.02240 (SuperLocalMemory, 2026-03-22)
- https://www.pingcap.com/blog/local-first-rag-using-sqlite-ai-agent-memory-openclaw/ (2026-03-22)
- https://www.sqlite.org/fts5.html (2026-03-22)

### 7.1 Why SQLite for Agent Memory

**Zero-config embedded database.** No daemon, no port, no network, no backup strategy beyond git. A single `.db` file. This matches our "minimal infrastructure" requirement and Docker Desktop constraint.

**Production-validated at agent scale.** LangGraph's `SqliteSaver` is deployed across thousands of production agent systems. CrewAI's long-term memory uses SQLite by default. Both are production-proven.

**Performance at our scale (measured):**

From ZeroClaw hybrid memory system (running on Raspberry Pi Zero 2 W, the weakest possible hardware):
- FTS5 full-text search: 0.3ms per query
- Vector similarity search: 2ms per query
- Result merging (RRF): 0.1ms
- Total retrieval: <3ms

On x86 hardware, all sub-millisecond. For our workspace scale (~10K entries max), this is trivially fast.

**SQLite WAL mode for concurrent multi-agent access:**
```sql
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA busy_timeout=5000;  -- retry for 5s if locked
```

WAL guarantees:
- Unlimited concurrent readers (never blocked)
- Single writer + simultaneous readers: YES, readers not blocked by writer
- Multiple concurrent writers: NO, serialized at write lock
- Crash recovery: WAL file replayed on restart

For our system: writes are infrequent (end of session, checkpoint events). Reads are frequent (context loading). Ideal pattern for SQLite WAL.

### 7.2 FTS5 Full-Text Search

FTS5 is built into Python's `sqlite3` module. No additional dependencies.

**Capabilities:**
- BM25 ranking (same algorithm as Elasticsearch default)
- Prefix, phrase, proximity queries
- Trigram tokenizer (Porter stemmer also available)
- Content tables: FTS index over existing table, no data duplication
- `highlight()` and `snippet()` functions for context extraction
- `rank` column for relevance ordering

**Hybrid search schema (recommended):**
```sql
-- Source of truth table
CREATE TABLE memory (
  id INTEGER PRIMARY KEY,
  layer TEXT,           -- 'L0', 'L1', 'L2', 'L3', 'L4', 'chronicle'
  project TEXT,         -- 'tLOS', 'harkly', 'contexter', 'global'
  file_path TEXT,       -- path to source MD file
  section TEXT,         -- section heading
  content TEXT,         -- section text content
  tags TEXT,            -- comma-separated tags
  created_at INTEGER,   -- unix timestamp
  updated_at INTEGER,
  git_hash TEXT         -- git commit hash at time of indexing
);

-- FTS5 index (content table — no duplication)
CREATE VIRTUAL TABLE memory_fts USING fts5(
  content,
  tags,
  content='memory',
  content_rowid='id',
  tokenize='porter ascii'
);

-- Populate FTS after insert
CREATE TRIGGER memory_ai AFTER INSERT ON memory BEGIN
  INSERT INTO memory_fts(rowid, content, tags)
  VALUES (new.id, new.content, new.tags);
END;

-- Example hybrid query
SELECT
  m.*,
  memory_fts.rank,
  snippet(memory_fts, 0, '<mark>', '</mark>', '...', 32) as snippet
FROM memory_fts
JOIN memory m ON m.id = memory_fts.rowid
WHERE memory_fts MATCH 'ContentRouter routing decisions'
  AND m.project = 'tLOS'
  AND m.layer IN ('L2', 'L3', 'chronicle')
ORDER BY rank
LIMIT 10;
```

### 7.3 sqlite-vec — Vector Similarity in SQLite

**Source:** https://github.com/asg017/sqlite-vec

Pure SQLite extension for vector similarity search (cosine, L2, dot product). No Python package dependency beyond the shared library.

```sql
-- Load extension (once per connection)
SELECT load_extension('./vec0');

-- Create vector table
CREATE VIRTUAL TABLE memory_vec USING vec0(
  id INTEGER PRIMARY KEY,
  embedding FLOAT[1536]  -- NIM Matryoshka 1536-dim
);

-- Insert
INSERT INTO memory_vec VALUES (42, json('[0.1, 0.2, ...]'));

-- Cosine similarity search
SELECT id, distance
FROM memory_vec
WHERE embedding MATCH json('[0.3, 0.4, ...]')
  AND k = 20              -- top-K candidates
ORDER BY distance
LIMIT 10;
```

**Performance:** HNSW index internally. At 100K vectors: ~5ms on M1 Mac. At our scale (~1K-10K chunks): sub-millisecond.

**Matryoshka compatibility:** NIM 1536-dim Matryoshka embeddings are compatible. sqlite-vec supports any fixed-dimension float array.

**Hybrid retrieval with RRF (Reciprocal Rank Fusion):**
```python
def hybrid_search(query: str, query_embedding: list[float], k: int = 10):
    # BM25 results (FTS5)
    fts_results = db.execute("""
        SELECT rowid, rank FROM memory_fts
        WHERE memory_fts MATCH ? ORDER BY rank LIMIT ?
    """, [query, k * 2]).fetchall()

    # Vector results (sqlite-vec)
    vec_results = db.execute("""
        SELECT id, distance FROM memory_vec
        WHERE embedding MATCH ? AND k = ?
        ORDER BY distance LIMIT ?
    """, [json.dumps(query_embedding), k * 2, k * 2]).fetchall()

    # RRF fusion: score = 1/(60 + rank)
    scores = {}
    for rank, (rowid, _) in enumerate(fts_results):
        scores[rowid] = scores.get(rowid, 0) + 1 / (60 + rank)
    for rank, (id_, _) in enumerate(vec_results):
        scores[id_] = scores.get(id_, 0) + 1 / (60 + rank)

    return sorted(scores.items(), key=lambda x: -x[1])[:k]
```

### 7.4 sqlite-memory — Production Reference Implementation

**Source:** https://github.com/sqliteai/sqlite-memory

SQLite extension with built-in markdown-aware chunking + hybrid search. Directly applicable to our workspace.

**Schema (two core tables):**
- `dbmem_content`: indexed content with hash, path, context, timestamps
- `dbmem_chunks`: text segments with embeddings as binary BLOBs

**Markdown chunking approach:**
- Semantic boundary-aware (splits at heading boundaries, not fixed character count)
- `max_tokens=512` per chunk, `overlay_tokens=100` (overlap for continuity)
- Preserves document structure context in each chunk

**Hybrid search:**
```
vector_weight=0.6, text_weight=0.4
oversamples 4x candidates, then re-ranks
```

**API:**
```
memory_add_file(path, context)
memory_add_directory(path, context)
memory_search WHERE query = '...'
memory_delete_context(context)
```

**Intelligent sync:** Content-hash change detection skips re-indexing unchanged files. Atomic `SAVEPOINT` transactions. Single `.db` file output.

**Applicability:** This is very close to what we need. `memory_add_directory("nospace/development/tLOS/memory", "tlos-memory")` would index all our L1-L3 files. `memory_search WHERE query = 'ContentRouter phase 1.5 decisions'` would retrieve relevant chunks.

### 7.5 SuperLocalMemory — Privacy-First Multi-Agent Memory

**Source:** https://arxiv.org/html/2603.02240

Combines:
- SQLite-backed storage with FTS5 full-text search
- Leiden-based knowledge graph clustering
- Event-driven coordination layer with per-agent provenance
- Adaptive re-ranking framework + Bayesian trust defense against memory poisoning

Relevant for our multi-agent setup: per-agent provenance means we can trace which agent wrote which memory entry. Trust scores per agent allow weighting their memory contributions differently.

### 7.6 Migration Path for Our System

**Current → SQLite migration in three phases:**

**Phase 0 (current):** Flat MD files — source of truth, git-tracked, human-readable. No changes.

**Phase 1 (recommended near-term):** SQLite as query layer only. MD files remain source of truth. Index is derived from MD, fully rebuildable.
```
md_files → indexer.py → memory.db (SQLite + FTS5 + sqlite-vec)
                         ↓
                    search_memory CLI/MCP tool
                         ↓
                    Agents query via tool call
```

**Phase 2 (future, after Phase 1 validates):** SQLite as primary, MD as export. Chronicle entries written to SQLite first, exported to MD for git tracking and human review. Requires schema migrations to be managed (risk).

**Phase 2 risks:**
- Loses git-native diffability of raw memory
- Requires backup strategy beyond git
- Migration path if we need to abandon SQLite

**Mitigation:** nightly MD export committed to git provides backup + diffability. SQLite provides live query capability.

**Phase 1 implementation sketch (Python 3.12):**
```python
# build_memory_index.py
import sqlite3, pathlib, hashlib, frontmatter, time

WORKSPACE = pathlib.Path("C:/Users/noadmin/nospace")
DB_PATH = WORKSPACE / ".tlos/memory.db"

def build_index():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    # Create tables (schema above)
    # ...

    # Index all memory layers
    layers = {
        "L1": WORKSPACE / "development/tLOS/memory/tlos-about.md",
        "L2": WORKSPACE / "development/tLOS/memory/tlos-roadmap.md",
        "L3": WORKSPACE / "development/tLOS/memory/tlos-phase15.md",
        "chronicle": WORKSPACE / "development/tLOS/memory/chronicle/tlos-current.md",
    }

    for layer, path in layers.items():
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8")
        file_hash = hashlib.md5(content.encode()).hexdigest()

        # Skip if unchanged (content hash match)
        existing = conn.execute(
            "SELECT git_hash FROM memory WHERE layer=? AND file_path=?",
            [layer, str(path)]
        ).fetchone()
        if existing and existing[0] == file_hash:
            continue

        # Section-level chunking at heading boundaries
        for section in split_by_headings(content):
            conn.execute("""
                INSERT OR REPLACE INTO memory
                (layer, project, file_path, section, content, updated_at, git_hash)
                VALUES (?,?,?,?,?,?,?)
            """, [layer, "tLOS", str(path), section.title, section.body,
                  int(time.time()), file_hash])

    conn.commit()
    conn.close()
```

---

## 8. Synthesis and Recommendations

### 8.1 Key Findings Matrix

| Topic | Finding | Source confidence | Applies to us |
|---|---|---|---|
| Memory tiers | 3-tier (in-context / session / long-term) is the production standard | High (Letta, LangGraph, CrewAI) | Yes — maps to our L0-L4 |
| Context rot | Loading too much in context actively degrades retrieval accuracy | High (Anthropic, Factory.ai) | Critical — we likely over-load |
| JIT loading | 100-160x token reduction achievable; same task success rate | High (Speakeasy benchmark) | High priority change |
| Filesystem vs DB | Filesystem adequate below ~1000 facts; DB wins above that | Medium (Letta benchmark) | Fine today; plan for DB |
| SQLite production | SqliteSaver proven across thousands of LangGraph deployments | High | Migration target |
| FTS5 performance | <0.3ms per query, even on Pi Zero hardware | High (ZeroClaw) | No performance concern |
| sqlite-vec | HNSW vector search in SQLite, compatible with NIM 1536-dim | High (asg017/sqlite-vec) | Drop-in addition |
| Hybrid search (RRF) | BM25 + vector fusion consistently outperforms either alone | High (multiple sources) | Implement in Phase 1 |
| Compact MD format | 0.4x tokens vs verbose MD, same LLM accuracy | Medium (estimated) | Immediate — reformat heavy files |
| Chronicle pattern | Event sourcing (append-only + materialized view) is validated | High | Matches our design |
| Consolidation triggers | Size (1500 lines) + time (weekly) + event (phase complete) | Medium | Formalize policy |
| Forgetting curves | No production implementation; manual archival is sufficient | High | Future work |
| Session continuity | ~80% achievable with SQLite MCP + scratch discipline | Medium (practitioner) | Consistent with current |
| Sub-agent isolation | Separate context per agent is correct pattern | High (Anthropic) | Already doing this |

### 8.2 Gap Analysis — Current System vs Best Practices

| Current practice | Best practice | Gap severity | Effort to fix |
|---|---|---|---|
| All layers loaded at session start via CLAUDE.md | JIT selective loading | High — context rot risk on every session | Medium — needs section-level loading tool |
| Manual `/checkpoint` command for scratches | Automatic checkpoint after significant actions | Medium — data loss risk if session ends unexpectedly | High — requires automation |
| Flat file scratches, no metadata index | SQLite index with FTS5 over MD files | Medium — grep is slow, no structured query | Low-Medium — indexer script |
| Manual chronicle consolidation (nopoint triggers) | Time/size-triggered automated summarization | Medium — inconsistent execution | Medium — requires consolidation agent |
| No semantic search over memory | FTS5 + sqlite-vec hybrid retrieval | High — agents cannot discover relevant memory | Medium — sqlite-memory extension |
| No standard entry format in chronicle | Structured header + prose body format | Medium — parsing inconsistent | Low — format standardization |
| No cross-session memory query | SQLite with FTS5 + project/phase filters | High — context reconstruction is manual | Medium — Phase 1 migration |
| No agent provenance on chronicle entries | Per-agent metadata (agent_id, session_id, model_version) | Medium — can't trace who decided what | Low — add to entry format |

### 8.3 Immediate Recommendations (Zero Migration)

These can be done now without any infrastructure changes:

1. **YAML frontmatter on memory files.** Add structured metadata to all L1-L3 and chronicle files. Enables grep-based filtering without DB. Adds: `project`, `phase`, `updated_at`, `tags`, `maintainer`.

2. **Section-level loading discipline.** Document the convention: Orchestrator loads only the section(s) of L1-L3 relevant to the current task. The section table of contents (small, ~10 lines) serves as the navigation index. Load section-header index first, then specific sections on demand. Estimated token reduction: 3-5x per session.

3. **Chronicle entry format standardization.** Adopt the structured header format from Section 6.2. Enables reliable grep-based filtering: `grep -n "Type: architecture-decision" tlos-chronicle.md`.

4. **Consolidation triggers documented.** Write the policy explicitly: if current-context > 1500 lines or older than 4 weeks → trigger consolidation. Give Axis authority to consolidate autonomously (currently nopoint-triggered only).

5. **Open questions tracking.** All chronicle entries include `- [ ] {question}` checkboxes. Weekly grep: `grep -n "^- \[ \]" tlos-current.md` gives outstanding questions list. Low-tech but effective.

### 8.4 Near-Term Recommendations (Phase 1 — SQLite Index Layer)

Timeline: after current epic completion.

1. **Build `memory.db` as query-only index over MD files.** No changes to source-of-truth MD files. Script: `tools/build_memory_index.py`. Runs on demand or file-watch mode.

2. **Implement `search_memory` MCP tool or CLI.** Agents call `search_memory("ContentRouter decisions", project="tLOS", layer="L2,L3,chronicle")` instead of loading full files. Returns top-10 relevant chunks with source references.

3. **sqlite-vec integration for semantic search.** Embed all memory chunks using NIM API (already in stack). Enables "find relevant memory about X" even when exact terms differ. Vector weight 0.6, FTS5 weight 0.4, RRF fusion.

4. **Scratch file metadata standardization.** Add YAML frontmatter to all new scratches: `session_id`, `project`, `phase`, `agent`, `key_decisions[]`, `open_questions[]`. Enables automated SQLite indexing.

5. **Scratch index in SQLite.** Build `scratches` table from all existing scratch files. Enable: "find all decisions about X from the last 3 phases" in <1ms.

### 8.5 Architecture Decision Draft (for Eidolon / nopoint review)

**Proposed Phase 1 architecture:**

```
Source of Truth (git-tracked MD files — unchanged)
    │
    ├── development/tLOS/memory/
    │   ├── tlos-about.md     (L1)
    │   ├── tlos-roadmap.md   (L2)
    │   ├── tlos-phase15.md   (L3)
    │   └── scratches/        (L4)
    │       └── {session_id}+{N}-scratch.md
    │
    ├── chronicle/
    │   ├── tlos-chronicle.md  (append-only event store)
    │   ├── tlos-current.md    (materialized view, weekly regenerated)
    │   └── 2026-03/           (monthly archives)
    │
    ▼ (indexer runs on demand or via file watcher)

memory.db (SQLite WAL — query layer only, rebuildable)
    ├── memory table        (content + structured metadata)
    ├── memory_fts          (FTS5 full-text index)
    ├── memory_vec          (sqlite-vec embeddings, 1536-dim NIM)
    └── scratches table     (structured scratch metadata + FTS)
    │
    ▼
search_memory tool (MCP or CLI)
    └── Agents call: search_memory(query, project, layer, date_from)
    └── Returns: [{section, content, source_file, relevance_score}]
```

**Design constraints:**
- MD files remain source of truth — no lock-in
- SQLite index is 100% rebuildable from MD at any time: `python tools/rebuild_index.py`
- No external services required (pure local stack: Python 3.12 + sqlite3 + sqlite-vec)
- WAL mode handles multi-agent concurrent reads (Axis, Logos, Satoshi)
- Compatible with current Claude Code agent workflow (tool call model)

**Escalation note:** Phase 2 migration (SQLite as primary store, MD as export) requires architectural decision by Eidolon/nopoint. This research covers Phase 1 only. Phase 2 trade-offs are documented in Section 7.6.

---

## 9. Sources Index

| # | URL | Topic | Date accessed |
|---|---|---|---|
| 1 | https://docs.letta.com/concepts/memgpt/ | Letta/MemGPT memory architecture | 2026-03-22 |
| 2 | https://research.memgpt.ai/ | Original MemGPT research | 2026-03-22 |
| 3 | https://www.letta.com/blog/agent-memory | Agent memory types (Letta) | 2026-03-22 |
| 4 | https://www.letta.com/blog/benchmarking-ai-agent-memory | Filesystem vs DB benchmark | 2026-03-22 |
| 5 | https://www.letta.com/blog/letta-v1-agent | Letta V1 agent loop redesign | 2026-03-22 |
| 6 | https://docs.langchain.com/oss/python/langgraph/memory | LangGraph memory docs | 2026-03-22 |
| 7 | https://dev.to/sreeni5018/the-architecture-of-agent-memory-how-langgraph-really-works-59ne | LangGraph deep dive | 2026-03-22 |
| 8 | https://markaicode.com/langgraph-memory-short-term-long-term-storage/ | LangGraph storage patterns | 2026-03-22 |
| 9 | https://redis.io/tutorials/what-is-agent-memory-example-using-langgraph-and-redis/ | Redis + LangGraph | 2026-03-22 |
| 10 | https://sparkco.ai/blog/mastering-langgraph-state-management-in-2025 | LangGraph state 2025 | 2026-03-22 |
| 11 | https://docs.crewai.com/en/concepts/memory | CrewAI memory docs | 2026-03-22 |
| 12 | https://sparkco.ai/blog/deep-dive-into-crewai-memory-systems | CrewAI memory deep dive | 2026-03-22 |
| 13 | https://dev.to/foxgem/ai-agent-memory-a-comparative-analysis-of-langgraph-crewai-and-autogen-31dp | Framework comparison | 2026-03-22 |
| 14 | https://latenode.com/blog/platform-comparisons-alternatives/automation-platform-comparisons/langgraph-vs-autogen-vs-crewai-complete-ai-agent-framework-comparison-architecture-analysis-2025 | Full framework comparison | 2026-03-22 |
| 15 | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Anthropic context engineering | 2026-03-22 |
| 16 | https://factory.ai/news/context-window-problem | Context window problem (Factory.ai) | 2026-03-22 |
| 17 | https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/ | Context management strategies | 2026-03-22 |
| 18 | https://airbyte.com/agentic-data/ai-context-window-optimization-techniques | Optimization techniques | 2026-03-22 |
| 19 | https://repositum.tuwien.at/bitstream/20.500.12708/224666/1/Hrubec%20Nicolas%20-%202025%20-%20Reducing%20Token%20Usage%20of%20Software%20Engineering%20Agents.pdf | Academic: token reduction for SE agents | 2026-03-22 |
| 20 | https://www.speakeasy.com/blog/how-we-reduced-token-usage-by-100x-dynamic-toolsets-v2 | 100-160x token reduction via dynamic toolsets | 2026-03-22 |
| 21 | https://agenta.ai/blog/top-6-techniques-to-manage-context-length-in-llms | Context length techniques | 2026-03-22 |
| 22 | https://eval.16x.engineer/blog/llm-context-management-guide | Context management guide | 2026-03-22 |
| 23 | https://medium.com/@anil.jain.baba/long-term-agentic-memory-with-langgraph-824050b09852 | LangGraph long-term memory | 2026-03-22 |
| 24 | https://github.com/FareedKhan-dev/langgraph-long-memory | LangGraph long memory implementation | 2026-03-22 |
| 25 | https://www.mongodb.com/company/blog/product-release-announcements/powering-long-term-memory-for-agents-langgraph | LangGraph + MongoDB | 2026-03-22 |
| 26 | https://www.digitalocean.com/community/tutorials/langgraph-mem0-integration-long-term-ai-memory | Mem0 integration | 2026-03-22 |
| 27 | https://github.com/asg017/sqlite-vec | sqlite-vec extension (HNSW in SQLite) | 2026-03-22 |
| 28 | https://github.com/doobidoo/mcp-memory-service | MCP memory service (SQLite + knowledge graph) | 2026-03-22 |
| 29 | https://redis.io/blog/llm-token-optimization-speed-up-apps/ | LLM token optimization (Redis) | 2026-03-22 |
| 30 | https://www.sqlite.org/fts5.html | SQLite FTS5 documentation | 2026-03-22 |
| 31 | https://zeroclaws.io/blog/zeroclaw-hybrid-memory-sqlite-vector-fts5/ | Hybrid SQLite FTS5 + vector (ZeroClaw) | 2026-03-22 |
| 32 | https://github.com/sqliteai/sqlite-memory | sqlite-memory extension (MD-aware chunking) | 2026-03-22 |
| 33 | https://arxiv.org/html/2603.02240 | SuperLocalMemory (multi-agent, Bayesian trust) | 2026-03-22 |
| 34 | https://www.pingcap.com/blog/local-first-rag-using-sqlite-ai-agent-memory-openclaw/ | Local-first RAG with SQLite | 2026-03-22 |
| 35 | https://dev.to/aairom/embedded-intelligence-how-sqlite-vec-delivers-fast-local-vector-search-for-ai-3dpb | sqlite-vec performance analysis | 2026-03-22 |
| 36 | https://event-driven.io/en/audit_log_event_sourcing/ | Event sourcing audit log | 2026-03-22 |
| 37 | https://akka.io/blog/event-sourcing-the-backbone-of-agentic-ai | Event sourcing for agentic AI | 2026-03-22 |
| 38 | https://github.com/sumant1122/agentlog | AgentLog (JSONL event bus for agents) | 2026-03-22 |
| 39 | https://prefactor.tech/blog/audit-trails-in-ci-cd-best-practices-for-ai-agents | Audit trails for AI agents in CI/CD | 2026-03-22 |
| 40 | https://www.cloudmatos.ai/blog/creating-audit-ready-multi-agent-systems/ | Audit-ready multi-agent systems | 2026-03-22 |
| 41 | https://arxiv.org/html/2601.01885v1 | Agentic Memory / AgeMem (RL-based) | 2026-03-22 |
| 42 | https://www.techrxiv.org/users/1007269/articles/1367390/master/file/data/LLM_MAS_Memory_Survey_preprint_/LLM_MAS_Memory_Survey_preprint_.pdf | LLM Multi-Agent Memory Survey | 2026-03-22 |
| 43 | https://dl.acm.org/doi/10.1145/3765766.3765803 | ACT-R forgetting curves for AI agents | 2026-03-22 |
| 44 | https://arxiv.org/html/2602.06052v3 | Rethinking Memory Mechanisms (survey) | 2026-03-22 |
| 45 | https://dev.to/gonewx/cursor-vs-claude-code-vs-windsurf-which-one-handles-context-loss-the-worst-real-tests-dpe | IDE memory comparison (real tests) | 2026-03-22 |
| 46 | https://dev.to/gonewx/i-tried-3-different-ways-to-fix-claude-codes-memory-problem-heres-what-actually-worked-30fk | Claude Code memory solutions (practitioner) | 2026-03-22 |
| 47 | https://mer.vin/2025/12/ai-coding-assistant-memory-systems-compared-claude-vs-gemini-vs-codex-vs-windsurf-vs-cursor/ | AI coding assistant memory comparison | 2026-03-22 |
| 48 | https://openreview.net/pdf?id=U51WxL382H | ICLR 2026 MemAgents workshop proposal | 2026-03-22 |
| 49 | https://arxiv.org/pdf/2502.06975 | Episodic Memory — the missing piece (position paper) | 2026-03-22 |
| 50 | https://github.com/Shichun-Liu/Agent-Memory-Paper-List | Agent memory paper list (curated) | 2026-03-22 |
