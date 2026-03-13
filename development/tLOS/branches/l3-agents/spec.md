# L3 Step 6 — Chief/Development Node in LangGraph
> Branch: l3-agents | Coach: Assistant | Player: Qwen
> Created: 2026-03-11

---

## Context

tLOS agent hierarchy (from architecture doc):
```
Orchestrator (Eidolon)
  └── Chief/Development   ← THIS STEP (Step 6)
        ├── Lead/Frontend    (Step 7, not yet)
        ├── Lead/Backend     (Step 7, not yet)
        └── Lead/Testing     (Step 7, not yet)
```

Current graph topology: `orchestrator (passthrough) → worker → END`
Target topology: `orchestrator → chief_development → worker → END`

The Chief/Development node is a mini-orchestrator for the development domain.
It receives a task, decomposes it into lead-level subtasks, and enriches
the state before passing to the worker.

---

## Files to Modify

### 1. `graph.py`

**Add after the existing `GraphState` class:**

```python
class ChiefDevState(TypedDict):
    messages: list        # same as GraphState
    sessionId: str        # same as GraphState
    result: str           # same as GraphState
    domain: str           # "development"
    chief_plan: str       # JSON string — decomposed task plan
```

**Add `chief_development_node` function:**

```python
def chief_development_node(state: ChiefDevState) -> ChiefDevState:
    """
    Chief/Development node: receives a development task from Orchestrator,
    decomposes it into a structured plan for Lead nodes.
    Returns enriched state with chief_plan (JSON string).
    """
```

The node must:
1. Extract the last user message from `state["messages"]`
2. Call `call_claude_cli()` with the following prompt structure:

```
You are Chief/Development in the tLOS agent hierarchy.
You are a mini-orchestrator for the software development domain.

TASK FROM ORCHESTRATOR:
{user_message}

Analyze this task and produce a structured decomposition plan.
Classify which development leads are needed and what each should do.

Respond ONLY with valid JSON in this exact format:
{
  "domain": "development",
  "priority": "high" | "medium" | "low",
  "summary": "one-line summary of the overall plan",
  "execution_order": ["Lead/Backend", "Lead/Frontend"],
  "leads": [
    {
      "role": "Lead/Frontend" | "Lead/Backend" | "Lead/Testing" | "Lead/Security" | "Lead/Infra",
      "tasks": ["specific task 1", "specific task 2"],
      "dependencies": []
    }
  ]
}

Include only the leads that are relevant to this specific task.
Return ONLY the JSON object. No markdown, no explanation.
```

3. Store the response in `state["chief_plan"]`
4. Return `{**state, "chief_plan": plan_json}`
5. If `call_claude_cli()` fails or returns empty: set `chief_plan` to `"{}"`  and log a warning — never raise.

**Add `chief_worker_node` function:**

This is the worker node used in the chief graph. It differs from `worker_node`
in that it uses BOTH `messages` AND `chief_plan` as context:

```python
def chief_worker_node(state: ChiefDevState) -> ChiefDevState:
    """
    Worker node for chief graph: uses last user message + chief_plan as context.
    """
```

Prompt structure:
```
You are a software implementation worker in the tLOS agent system.

CHIEF/DEVELOPMENT PLAN:
{state["chief_plan"]}

ORIGINAL TASK:
{last user message from state["messages"]}

Execute the task according to the Chief's plan. Provide a detailed implementation response.
```

**Add `build_chief_graph` function:**

```python
def build_chief_graph():
    """
    Build and compile the Chief/Development graph.
    Topology: orchestrator → chief_development → worker → END
    Uses ChiefDevState.
    """
```

**IMPORTANT:** Do NOT modify `build_graph()` or any existing functions.
`build_graph()` must remain unchanged — it is the default graph and
used by the existing `handle_graph_run` handler.

---

### 2. `bridge_handler.py`

**Add after the existing `get_graph()` / `_graph` singleton:**

```python
_chief_graph = None

def get_chief_graph():
    """Return the singleton compiled chief graph, building it on first call."""
    global _chief_graph
    if _chief_graph is None:
        from graph import build_chief_graph
        _chief_graph = build_chief_graph()
    return _chief_graph

# Pre-compile at import time
try:
    get_chief_graph()
except Exception as _init_err:
    print(f"[langgraph-bridge] WARNING: chief graph pre-compile failed: {_init_err}")
```

**Add `handle_chief_run` async function:**

```python
async def handle_chief_run(nc, session_id: str, task: str, domain: str, model: str):
    """
    Handle agent:chief:run message.
    Same streaming pattern as handle_graph_run but uses chief graph + ChiefDevState.
    """
```

Initial state for chief graph:
```python
state = {
    "messages": [{"role": "user", "content": task}],
    "sessionId": session_id,
    "result": "",
    "domain": domain,
    "chief_plan": "",
}
```

Result to stream: `final_state.get("result", "")` — same as handle_graph_run.

Use same streaming pattern as `handle_graph_run`:
- `agent:graph:token` chunks with `delta` + `done`
- `agent:graph:error` on exception

---

### 3. `bridge.py`

**Extend `handle_message` to handle `agent:chief:run`:**

```python
if msg_type == "agent:chief:run":
    session_id = data.get("sessionId", "")
    task = data.get("task", "")
    domain = data.get("domain", "development")
    model = data.get("model", "claude-sonnet-4-6")
    from bridge_handler import handle_chief_run
    await handle_chief_run(nc, session_id, task, domain, model)
```

Add this block after the existing `agent:graph:run` block, same pattern.

---

## Acceptance Criteria

**AC-1: ChiefDevState defined correctly**
- Has all 5 fields: messages, sessionId, result, domain, chief_plan
- Is a TypedDict

**AC-2: chief_development_node works**
- Calls `call_claude_cli()` exactly once
- Returns state with `chief_plan` field populated (string)
- Never raises — handles empty/failed CLI response gracefully (sets `chief_plan = "{}"`)
- Does NOT modify existing `worker_node` or `orchestrator_node`

**AC-3: chief_worker_node works**
- Uses both `chief_plan` and last user message in its prompt
- Returns state with `result` field populated

**AC-4: build_chief_graph() works**
- Returns a compiled LangGraph graph
- Topology: orchestrator_node → chief_development_node → chief_worker_node → END
- Uses ChiefDevState
- Does NOT modify build_graph()

**AC-5: bridge_handler.py correct**
- `get_chief_graph()` returns singleton (not rebuilt per call)
- `handle_chief_run()` uses ChiefDevState initial state with domain field
- Same NATS streaming pattern as handle_graph_run

**AC-6: bridge.py correct**
- Handles `agent:chief:run` message type
- Passes domain from message payload (default "development")

**AC-7: No regressions**
- `build_graph()` is unchanged
- `handle_graph_run()` is unchanged
- `agent:graph:run` NATS message still works as before

---

## What NOT to implement

- Lead nodes (Step 7)
- Actual routing between multiple leads (Step 7)
- Any frontend/NATS UI changes
- Domain memory integration (separate task)
- Letta session creation for chief (separate task)

---

## Files

```
core/kernel/tlos-langgraph-bridge/
  graph.py          ← add ChiefDevState, chief_development_node, chief_worker_node, build_chief_graph
  bridge_handler.py ← add get_chief_graph, handle_chief_run
  bridge.py         ← add agent:chief:run handler
```
