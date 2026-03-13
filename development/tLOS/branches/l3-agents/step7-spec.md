# G3 Spec — L3 Step 7: Lead/Frontend + Lead/Backend nodes

> Session: L3-TLOS-07
> Date: 2026-03-11
> Author: Orchestrator (nopoint + Claude Sonnet 4.6)
> Status: ACTIVE
> Files: core/kernel/tlos-langgraph-bridge/

---

## Context

tLOS multi-agent system — L3 Agent Hierarchy.
Step 6 DONE: Chief/Development node (ChiefDevState, build_chief_graph, agent:chief:run).

Current hierarchy:
```
Orchestrator (Eidolon) → Chief/Development → [Lead nodes — NOT YET IMPLEMENTED]
```

Step 7 adds Lead/Frontend and Lead/Backend as specialized nodes under Chief/Development.
Each Lead has a specific persona (domain expertise) and produces a lead_plan for the worker.

---

## Existing Code (DO NOT MODIFY)

### graph.py — existing symbols (read-only)

```python
GraphState          # TypedDict: messages, sessionId, result
ChiefDevState       # TypedDict: messages, sessionId, result, domain, chief_plan
call_claude_cli()   # Claude CLI subprocess helper (reuse, do not redefine)
orchestrator_node() # passthrough node (reuse in lead graphs)
worker_node()       # GraphState worker (leave untouched)
chief_worker_node() # ChiefDevState worker (leave untouched)
build_graph()       # FROZEN — do not modify
build_chief_graph() # FROZEN — do not modify
build_g3_subgraph() # FROZEN — do not modify
G3State             # FROZEN — do not modify
```

### bridge_handler.py — existing symbols (read-only)

```python
handle_graph_run()  # FROZEN
handle_chief_run()  # FROZEN
get_graph()         # FROZEN
get_chief_graph()   # FROZEN
```

### bridge.py — existing routing (read-only)

```python
# msg_type == "agent:graph:run" → handle_graph_run   # FROZEN
# msg_type == "agent:chief:run" → handle_chief_run   # FROZEN
```

---

## Requirements

### REQ-01 — LeadState TypedDict (graph.py)

Add new TypedDict `LeadState` with exactly these 6 fields:

```python
class LeadState(TypedDict):
    messages: list        # [{"role": str, "content": str}]
    sessionId: str
    result: str
    lead_role: str        # "frontend" | "backend"
    lead_spec: str        # task spec string (from Chief or direct)
    lead_plan: str        # JSON string — Lead's execution plan for worker
```

### REQ-02 — lead_frontend_node (graph.py)

```python
def lead_frontend_node(state: LeadState) -> LeadState:
```

- Extracts last user message from `state["messages"]`
- Builds prompt with **Lead/Frontend persona**:
  - Expert in: SolidJS, TypeScript, Vite, Tailwind CSS
  - Expert in: tLOS frame system (DynamicComponent, canvas, frame types, `flex flex-col h-full` pattern)
  - Expert in: tLOS visual system (primary `#f2b90d`, bg `#0a0a0f`, border `rgba(255,255,255,0.08)`)
  - Expert in: Omnibar, canvas state, useComponents hook
- Asks Claude CLI to return JSON plan: `{ "role": "frontend", "summary": str, "tasks": [str], "files_to_modify": [str], "approach": str }`
- Graceful fallback: `lead_plan = "{}"` on empty response
- Returns `{**state, "lead_plan": plan_json}`

### REQ-03 — lead_backend_node (graph.py)

```python
def lead_backend_node(state: LeadState) -> LeadState:
```

- Same structure as lead_frontend_node but with **Lead/Backend persona**:
  - Expert in: Python 3.12, asyncio, NATS (nats.py), LangGraph (StateGraph, TypedDict, conditional edges)
  - Expert in: tLOS bridge pattern (subprocess + stdin for claude CLI, stream-json parsing)
  - Expert in: Docker Compose, service networking, bridge_handler singleton pattern
  - Expert in: NEVER raises pattern (all exceptions caught, published as agent:graph:error)
- Same JSON plan format: `{ "role": "backend", "summary": str, "tasks": [str], "files_to_modify": [str], "approach": str }`
- Graceful fallback: `lead_plan = "{}"` on empty response
- Returns `{**state, "lead_plan": plan_json}`

### REQ-04 — lead_worker_node (graph.py)

```python
def lead_worker_node(state: LeadState) -> LeadState:
```

- Reads `state["lead_plan"]` and last user message
- Builds prompt: "You are executing as {lead_role} in tLOS. Lead plan: {lead_plan}. Task: {user_content}."
- Calls `call_claude_cli(prompt)` (reuse existing function)
- Returns `{**state, "result": result}`

### REQ-05 — build_lead_graph (graph.py)

```python
def build_lead_graph(role: str):
    """
    Build and compile a Lead graph for the given role.
    role: "frontend" | "backend"
    Topology: orchestrator → lead_{role}_node → lead_worker_node → END
    Uses LeadState.
    """
```

- Routes `role="frontend"` → `lead_frontend_node`
- Routes `role="backend"` → `lead_backend_node`
- Raises `ValueError(f"Unknown lead role: {role}")` for unknown roles
- Uses `LeadState` (not GraphState or ChiefDevState)
- Re-uses `orchestrator_node` (already defined, accepts any TypedDict via duck typing at runtime)

### REQ-06 — get_lead_graph (bridge_handler.py)

```python
_lead_graphs: dict = {}   # role → compiled graph (module-level)

def get_lead_graph(role: str):
    """Per-role singleton. Builds on first call, returns cached on subsequent calls."""
    global _lead_graphs
    if role not in _lead_graphs:
        from graph import build_lead_graph
        _lead_graphs[role] = build_lead_graph(role)
    return _lead_graphs[role]
```

Pre-compile both roles at import time (same pattern as get_graph / get_chief_graph):
```python
try:
    get_lead_graph("frontend")
    get_lead_graph("backend")
except Exception as _init_err:
    print(f"[langgraph-bridge] WARNING: lead graphs pre-compile failed: {_init_err}")
```

### REQ-07 — handle_lead_run (bridge_handler.py)

```python
async def handle_lead_run(nc, session_id: str, task: str, role: str, model: str):
```

- Identical pattern to `handle_chief_run` (same streaming, same error handling)
- Initial state:
  ```python
  state = {
      "messages": [{"role": "user", "content": task}],
      "sessionId": session_id,
      "result": "",
      "lead_role": role,
      "lead_spec": task,
      "lead_plan": "",
  }
  ```
- Uses `get_lead_graph(role)` (not get_graph or get_chief_graph)
- Streams `agent:graph:token` chunks, always sends `done: True`
- Never raises — catches all exceptions, publishes `agent:graph:error`

### REQ-08 — bridge.py routing

Add routing for `agent:lead:run` in `handle_message()`:

```python
if msg_type == "agent:lead:run":
    session_id = data.get("sessionId", "")
    task = data.get("task", "")
    role = data.get("role", "backend")
    model = data.get("model", "claude-sonnet-4-6")
    from bridge_handler import handle_lead_run
    await handle_lead_run(nc, session_id, task, role, model)
```

---

## Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | `LeadState` has exactly 6 fields: messages, sessionId, result, lead_role, lead_spec, lead_plan | Read TypedDict definition |
| AC-2 | `lead_frontend_node` prompt mentions SolidJS, TypeScript, tLOS frame system, DynamicComponent | Read prompt string |
| AC-3 | `lead_backend_node` prompt mentions Python, NATS, LangGraph, asyncio, bridge pattern | Read prompt string |
| AC-4 | `build_lead_graph("frontend")` and `build_lead_graph("backend")` compile without error | `python -c "from graph import build_lead_graph; build_lead_graph('frontend'); build_lead_graph('backend'); print('OK')"` |
| AC-5 | `get_lead_graph(role)` returns same object on repeated calls (singleton) | `python -c "from bridge_handler import get_lead_graph; assert get_lead_graph('frontend') is get_lead_graph('frontend'); print('OK')"` |
| AC-6 | `handle_lead_run` never raises — exception path publishes `agent:graph:error` | Code review |
| AC-7 | bridge.py routes `agent:lead:run` to `handle_lead_run` | Code review |
| AC-8 | `build_graph()` output unchanged: `orchestrator → worker → END` with `GraphState` | `python -c "from graph import build_graph; g=build_graph(); print('OK')"` |

---

## Constraints

1. **`call_claude_cli`** — reuse, never redefine
2. **`orchestrator_node`** — reuse as entry node in lead graph (it's a passthrough, works with any dict)
3. **`build_graph()`, `build_chief_graph()`, `build_g3_subgraph()`** — FROZEN, zero changes
4. **`handle_graph_run()`, `handle_chief_run()`** — FROZEN, zero changes
5. All nodes: graceful degradation on empty Claude CLI response (fallback to `"{}"`, never raise)
6. lead_worker_node MUST use `LeadState`, not `GraphState`
7. Import pattern: `from graph import build_lead_graph` inside `get_lead_graph` (local import, same as existing pattern)

---

## Out of Scope (Step 7)

- Routing FROM Chief graph to Lead nodes (Step 8)
- Senior node (Step 8)
- Lead/Testing, Lead/Security, Lead/Infra nodes (future)
- Shared Letta memory blocks (Step 9)
- Any changes to frontend (SolidJS) code
