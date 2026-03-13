# Coach Review — TLOS-08 Turn B (LangGraph graph + message handler)
Date: 2026-03-10

## REQ-003 — LangGraph minimal graph

| Check | Result | Notes |
|-------|--------|-------|
| GraphState TypedDict | PASS | messages: list, sessionId: str, result: str (lines 17-20) |
| call_claude_cli defined | PASS | Lines 25-80: subprocess + stdin, stream-json parsing |
| Non-zero exit code handled | PASS | Lines 55-58: logs warning, falls through to parse stdout — no raise |
| orchestrator_node | PASS | Lines 85-91: pass-through (correct minimal implementation) |
| worker_node | PASS | Lines 94-108: extracts last user message, calls call_claude_cli |
| build_graph() | PASS | Lines 113-121: orchestrator → worker → END, returns compiled |
| `python -c "from graph import build_graph; g = build_graph()"` | PASS | REQ-003 OK |
| `from graph import call_claude_cli` | PASS | Available |

**GOOD:** stream-json parsing handles both type=`assistant` (streamed text blocks) and type=`result` (fallback) — matches claude-bridge index.js pattern exactly.

**GOOD:** OSError caught separately at line 51 for process spawn failures.

## REQ-004 — bridge_handler.py message handler

| Check | Result | Notes |
|-------|--------|-------|
| handle_graph_run is async | PASS | Line 44: `async def` |
| graph.invoke in executor | PASS | Line 68: `loop.run_in_executor(None, graph.invoke, state)` — asyncio loop unblocked |
| Singleton pre-compile at import | PASS | Lines 36-39: try/except at module load — warns on failure, does not crash |
| Streaming in chunks | PASS | Lines 73-81: 100-char chunks, asyncio.sleep(0) between each |
| Always publishes done:true | PASS | Lines 84-89: outside the `if result:` block — fires even on empty result |
| Outer except catches all | PASS | Lines 91-101: catches Exception, publishes agent:graph:error |
| Inner publish failure handled | PASS | Lines 93-101: nested try/except — last resort logs only |
| `from bridge_handler import handle_graph_run` | PASS | REQ-004 OK |

**GOOD:** `done: True` signal is outside the `if result:` block (line 84) — client never hangs even on empty response.

**GOOD:** Singleton compiled at import time (line 36-39) — first request not penalised by compilation overhead.

## Runtime Checks (Coach)

| Check | Result | Notes |
|-------|--------|-------|
| Syntax (py_compile graph.py, bridge_handler.py) | PASS | SYNTAX_OK |
| REQ-003: build_graph() | PASS | Verified independently |
| REQ-004: handle_graph_run import | PASS | Verified independently |

## Issues Found

**LOW — `asyncio.get_event_loop()` deprecated in Python 3.10+**
Line 67: `loop = asyncio.get_event_loop()`. In Python 3.10+ this emits DeprecationWarning if no current event loop is set. Preferred: `loop = asyncio.get_running_loop()` (available in async context). No correctness impact (warnings only), but clean-up is recommended.

**LOW — model hardcoded in worker_node (line 99)**
`model = "claude-sonnet-4-6"` is hardcoded instead of using `state["messages"]`-level model. The `model` parameter passed to handle_graph_run (from NATS message) is not threaded through to worker_node. Not a correctness issue in V1 but worth noting.

Optional follow-up (not required for approval):
1. Replace `asyncio.get_event_loop()` → `asyncio.get_running_loop()` in bridge_handler.py
2. Thread `model` from handle_graph_run through GraphState into worker_node

## Verdict

TURN_B_APPROVED ✅ — все REQ-003 и REQ-004 проверки пройдены.
