# Quality Sprint -- Spec Pack
> Generated: 2026-03-12 by Cross-Domain Spec Lead
> Codebase: tLOS kernel (Python + Node.js) + shell (SolidJS/TS) + Docker (11 services)
> Workspace root: `C:\Users\noadmin\nospace\development\tLOS`

---

## Track 1: Naming (Senior -> Special, Player -> Worker)

### Context

Per `tlos-system-spec.md` sections 2.5 and 2.6, the vision names are:
- **L4:** "Special" (was "Senior" -- because they write specs/specifications)
- **L5:** "Worker" (was "Player" -- the implementation agent in G3 pairs)

The codebase still uses the old names everywhere. This track renames all internal identifiers while preserving NATS subject names for backwards compatibility.

### Issues Found

**graph.py** (core/kernel/tlos-langgraph-bridge/graph.py):
- [ ] Line 248: `g3_player_node` function name -- should be `g3_worker_node`
- [ ] Line 250: docstring says "Player: receives spec" -- should say "Worker"
- [ ] Line 260-264: prompt text says "Player" and "software implementation agent (Player)" -- should say "Worker"
- [ ] Line 275: `g3_coach_node` docstring references "Player's implementation" at line 284 -- update reference
- [ ] Line 317: comment "loop back to player" -- should be "loop back to worker"
- [ ] Line 322: return value `"player"` -- should be `"worker"`
- [ ] Line 329-331: topology comment says `player` -- should say `worker`
- [ ] Line 345: `graph.add_node("player", g3_player_node)` -- rename both node name and function
- [ ] Line 347: `graph.set_entry_point("player")` -- rename to `"worker"`
- [ ] Line 348: `graph.add_edge("player", "coach")` -- rename
- [ ] Line 352: `{"player": "player", "end": END}` -- rename both key and value
- [ ] Line 546: `# -- Senior nodes` section header -- rename to `# -- Special nodes`
- [ ] Line 548: `class SeniorState` -- rename to `SpecialState`
- [ ] Line 552: field `senior_domain` -- rename to `special_domain`
- [ ] Line 553: field `senior_context` -- rename to `special_context`
- [ ] Line 554: field `senior_spec` -- rename to `special_spec`
- [ ] Line 557: `senior_frontend_node` -- rename to `special_frontend_node`
- [ ] Line 559: docstring says "Senior/Frontend" -- should say "Special/Frontend"
- [ ] Line 580: prompt says "You are Senior/Frontend" -- update
- [ ] Line 608-610: variable `senior_spec` -- rename to `special_spec`
- [ ] Line 626-631: all `senior_spec` references and `senior_frontend_node` in error log
- [ ] Line 634: `senior_backend_node` -- rename to `special_backend_node`
- [ ] Line 636: docstring "Senior/Backend" -- rename
- [ ] Line 657: prompt "You are Senior/Backend" -- rename
- [ ] Line 687-710: all `senior_spec` references and error log text
- [ ] Line 713: `build_senior_graph` -- rename to `build_special_graph`
- [ ] Line 715-717: docstring and topology comment -- rename
- [ ] Lines 722-734: `senior_node_fn`, `senior_frontend_node`, `senior_backend_node`, node name `f"senior_{domain}"` -- rename all

**bridge_handler.py** (core/kernel/tlos-langgraph-bridge/bridge_handler.py):
- [ ] Line 85: section header "Singleton senior graphs" -- rename to "Singleton special graphs"
- [ ] Line 87: `_senior_graphs` -- rename to `_special_graphs`
- [ ] Line 90: `get_senior_graph` -- rename to `get_special_graph`
- [ ] Line 92: `global _senior_graphs` -- rename
- [ ] Lines 93-96: all `_senior_graphs` references and `build_senior_graph` import
- [ ] Lines 100-104: pre-compile block: `get_senior_graph(...)` calls and log message
- [ ] Line 280: `handle_senior_run` -- rename to `handle_special_run`
- [ ] Lines 282-283: docstring "agent:senior:run" and "senior graph" references
- [ ] Line 287: `get_senior_graph` call
- [ ] Lines 292-294: `senior_domain`, `senior_context`, `senior_spec` state keys
- [ ] Line 320: error log "handle_senior_run" -- rename

**bridge.py** (core/kernel/tlos-langgraph-bridge/bridge.py):
- [ ] Line 41: `"agent:senior:run"` -- **KEEP** (NATS subject backwards compat), but update comment
- [ ] Line 46: `from bridge_handler import handle_senior_run` -- rename import
- [ ] Line 47: `await handle_senior_run(...)` -- rename call

**special_memory.py** (core/kernel/tlos-langgraph-bridge/special_memory.py):
- [ ] Line 3: docstring column name `senior_domain` -- rename to `special_domain`
- [ ] Line 40: SQL column `senior_domain` -- **KEEP** for DB backwards compat, but add comment explaining the legacy name
- [ ] Line 61: parameter `senior_domain` -- rename to `special_domain`
- [ ] Line 83-86: SQL references to `senior_domain` column -- keep column name, rename Python parameter
- [ ] Line 97: parameter `senior_domain` -- rename to `special_domain`
- [ ] Line 116-120: SQL references -- keep column name, rename Python parameter

**G3SessionFrame.tsx** (core/shell/frontend/src/components/frames/G3SessionFrame.tsx):
- [ ] Line 12: `playerOutput` signal -- rename to `workerOutput`
- [ ] Line 18: `playerRef` -- rename to `workerRef`
- [ ] Line 35: `scrollToBottom(playerRef)` -- rename
- [ ] Line 201-202: "Player" label in UI -- rename to "Worker"
- [ ] Lines 205, 221, 226: `playerRef`, `playerOutput()` -- rename

**frame.ts** (core/shell/frontend/src/types/frame.ts):
- [ ] Line 37-40: `AVAILABLE_AGENTS` contains `qwen` entry -- Qwen is DEPRECATED per CLAUDE.md. Remove qwen, keep only Claude.

### Tasks

1. **graph.py:** Rename all `g3_player_node` -> `g3_worker_node`, `SeniorState` -> `SpecialState`, `senior_*` functions/vars -> `special_*`, `build_senior_graph` -> `build_special_graph`. Update all prompt text and docstrings.
2. **bridge_handler.py:** Rename `_senior_graphs` -> `_special_graphs`, `get_senior_graph` -> `get_special_graph`, `handle_senior_run` -> `handle_special_run`. Update all state key names from `senior_*` -> `special_*`.
3. **bridge.py:** Keep NATS subject `"agent:senior:run"` unchanged (backwards compat). Add comment: `# Legacy NATS subject -- vision name is "special"`. Rename function references.
4. **special_memory.py:** Keep SQL column name `senior_domain` in the table (backwards compat). Rename Python parameter from `senior_domain` -> `special_domain`. Add mapping comment.
5. **G3SessionFrame.tsx:** Rename `playerOutput` -> `workerOutput`, `playerRef` -> `workerRef`, UI label "Player" -> "Worker".
6. **frame.ts:** Remove deprecated Qwen from `AVAILABLE_AGENTS` array (lines 37-40).

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | No "player" in graph.py G3 nodes (function names, node names, edge names) | `grep -c "player" graph.py` returns only prompt text references, no function/node names |
| AC-2 | No "Senior" class/function names in graph.py | `grep -c "class Senior\|def senior_\|build_senior" graph.py` returns 0 |
| AC-3 | No "senior" in bridge_handler.py function/var names | `grep -c "def.*senior\|_senior_graphs\|get_senior" bridge_handler.py` returns 0 |
| AC-4 | NATS subject `agent:senior:run` preserved in bridge.py | `grep "agent:senior:run" bridge.py` returns 1 match |
| AC-5 | SQL column `senior_domain` preserved in special_memory.py | `grep "senior_domain" special_memory.py` returns only SQL/column references |
| AC-6 | G3SessionFrame shows "Worker" not "Player" in UI | Visual inspection of G3SessionFrame.tsx |
| AC-7 | No "qwen" in AVAILABLE_AGENTS | `grep "qwen" frame.ts` returns 0 |
| AC-8 | Python import chain works | `cd core/kernel/tlos-langgraph-bridge && python -c "from graph import build_special_graph; g=build_special_graph('frontend'); print('OK')"` prints OK |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge
# AC-1: No "player" function/node names in graph.py
python -c "import re; t=open('graph.py').read(); matches=re.findall(r'def g3_player|add_node.*player|entry_point.*player', t); print('PASS' if not matches else f'FAIL: {matches}')"
# AC-2: No Senior class/function names
python -c "import re; t=open('graph.py').read(); matches=re.findall(r'class Senior|def senior_|def build_senior', t); print('PASS' if not matches else f'FAIL: {matches}')"
# AC-3: bridge_handler clean
python -c "import re; t=open('bridge_handler.py').read(); matches=re.findall(r'def.*senior|_senior_graphs|get_senior', t); print('PASS' if not matches else f'FAIL: {matches}')"
# AC-4: NATS subject preserved
python -c "t=open('bridge.py').read(); print('PASS' if 'agent:senior:run' in t else 'FAIL')"
# AC-8: Import chain
python -c "from graph import build_special_graph; g=build_special_graph('frontend'); print('OK')"
```

---

## Track 2: Refactor (kernel)

### Context

Kernel services are in Python (langgraph-bridge) and Node.js (claude-bridge). Multiple code quality issues: massive code duplication in streaming handlers, deprecated API usage, connection management antipatterns, unused dependency.

### Issues Found

**bridge_handler.py -- Streaming handler duplication:**
- [ ] Lines 109-167 (`handle_graph_run`), 169-221 (`handle_chief_run`), 223-278 (`handle_lead_run`), 280-329 (`handle_senior_run`) -- four nearly identical streaming handlers. The only difference is graph selection and state construction. The streaming loop (chunk, publish, done, error handling) is duplicated 4 times (~50 lines each).

**bridge_handler.py -- Deprecated asyncio API:**
- [ ] Lines 132, 186, 243, 297: `asyncio.get_event_loop()` is deprecated since Python 3.10. Should use `asyncio.get_running_loop()` instead.

**bridge.py -- Missing elif chain:**
- [ ] Lines 20-47: Uses `if` for every message type instead of `elif`. If a message matches `agent:graph:run`, the code still checks all subsequent conditions unnecessarily. Should be `if/elif/elif/elif`.

**special_memory.py -- Connection-per-call antipattern:**
- [ ] Lines 27-33, 71-77, 104-110: Every function call opens a new `psycopg2.connect()` and closes it. This creates a new TCP connection per database operation. Should use a module-level connection pool (or at minimum a persistent connection).

**graph.py -- Massive code duplication in Senior nodes:**
- [ ] Lines 557-631 (`senior_frontend_node`) and 634-710 (`senior_backend_node`) are near-identical (~75 lines each). Only the domain name and prompt persona text differ. Should extract a generic `special_node(state, domain)` function.

**graph.py -- Duplicate user message extraction:**
- [ ] Lines 110-113, 129-133, 185-187, 379-381, 440-442, 500-503, 575-577, 650-652: The pattern `for msg in messages: if msg.get("role") == "user": user_content = msg.get("content", "")` is repeated 8 times. Extract `extract_user_message(messages)` helper.

**pyproject.toml -- Unused dependency:**
- [ ] Line 8: `"anthropic>=0.40"` is listed as a dependency but never imported in any Python file. The service uses Claude CLI subprocess, not the Anthropic SDK.

**index.js (claude-bridge) -- Nested promise chains at startup:**
- [ ] Lines 38-61: Deep nested `.then()` chains for DomainMemory + Qdrant startup sync. Hard to follow and error-prone. Should use async/await pattern.

**domain-memory.js -- DB_PORT default mismatch:**
- [ ] Line 16: Default port is `5433` (host-mapped port). Inside Docker, the env var is set to `5432` (container port). The default `5433` is only correct for local development outside Docker. This is not a bug (Docker sets the env var), but the default is misleading. Add a comment.

### Tasks

1. **Extract streaming helper in bridge_handler.py:** Create `async def _stream_result(nc, session_id, result)` that handles chunking, publishing tokens, and publishing done signal. All four handlers call this instead of duplicating the loop.
2. **Extract error handler in bridge_handler.py:** Create `async def _publish_error(nc, session_id, exc, context)` for the error catch block.
3. **Replace `asyncio.get_event_loop()` with `asyncio.get_running_loop()`** in bridge_handler.py lines 132, 186, 243, 297.
4. **Convert `if` chain to `elif` in bridge.py** lines 20-47.
5. **Extract `extract_user_message(messages)` helper in graph.py** and replace all 8 occurrences.
6. **Merge `senior_frontend_node` and `senior_backend_node` into generic `special_node(state, domain)` in graph.py** with domain-specific prompt text as a config dict.
7. **Add connection pooling to special_memory.py:** Replace per-call `psycopg2.connect()` with a module-level connection (lazy init, auto-reconnect on error).
8. **Remove `anthropic>=0.40` from pyproject.toml** line 8.
9. **Refactor nested `.then()` in index.js** lines 38-61 to use a clean async IIFE or top-level async function.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | Only one streaming loop in bridge_handler.py | `grep -c "for i in range" bridge_handler.py` returns 1 (in the helper) |
| AC-2 | `asyncio.get_event_loop()` not used | `grep -c "get_event_loop" bridge_handler.py` returns 0 |
| AC-3 | bridge.py uses elif | `grep -c "elif msg_type" bridge.py` returns 3 |
| AC-4 | `extract_user_message` helper exists | `grep "def extract_user_message" graph.py` returns 1 |
| AC-5 | `anthropic` removed from pyproject.toml | `grep "anthropic" pyproject.toml` returns 0 |
| AC-6 | Only one special node function (generic) | `grep -c "def special_.*_node" graph.py` returns 0 (generic function, not per-domain) |
| AC-7 | All handlers still work end-to-end | `python -c "from bridge_handler import handle_graph_run, handle_chief_run, handle_lead_run; print('OK')"` prints OK |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge
# AC-1: Single streaming loop
python -c "t=open('bridge_handler.py').read(); print('PASS' if t.count('for i in range') == 1 else 'FAIL')"
# AC-2: No deprecated API
python -c "t=open('bridge_handler.py').read(); print('PASS' if 'get_event_loop' not in t else 'FAIL')"
# AC-5: No anthropic dep
python -c "t=open('pyproject.toml').read(); print('PASS' if 'anthropic' not in t else 'FAIL')"
# AC-7: Imports work
python -c "from bridge_handler import handle_graph_run, handle_chief_run, handle_lead_run; print('OK')"
```

---

## Track 3: Refactor (shell)

### Context

Shell frontend is SolidJS + TypeScript. Main issues: DynamicComponent.tsx is a 496-line god component with a massive Switch statement, duplicate .jsx files exist alongside .tsx files, Omnibar.tsx is 723 lines.

### Issues Found

**DynamicComponent.tsx -- 496-line file with giant Switch:**
- [ ] Lines 321-487: A `<Switch>` with 22 `<Match>` branches, each following the exact same pattern: `<Match when={...}><ErrorBoundary><FrameComponent data={props.data} /></ErrorBoundary></Match>`. This is a textbook case for a dynamic component lookup map.

**Duplicate .jsx files alongside .tsx files:**
- [ ] 31 `.jsx` files exist that are build artifacts or legacy copies of the `.tsx` source files. Every `.tsx` frame component has a corresponding `.jsx` file (same directory). These are confusing and should be archived. Files:
  - `src/App.jsx` (duplicate of `App.tsx`)
  - `src/index.jsx` (duplicate of `index.tsx`)
  - `src/components/Omnibar.jsx`, `Chat.jsx`, `Space.jsx`, `UUPRenderer.jsx`, `ErrorBoundary.jsx`, `DynamicComponent.jsx`, `LatticeStatus.jsx`, `PatchDialog.jsx`
  - All 16 frame `.jsx` files in `src/components/frames/` and `src/components/frames/mcb/`

**Omnibar.tsx -- 723 lines, multiple concerns:**
- [ ] Lines 1-723: Omnibar.tsx handles: (1) input management, (2) message history, (3) agent state panel, (4) agent management panel, (5) model selection panel, (6) context panel, (7) keyboard handling, (8) hint cycling. Should be split into sub-components.

**useComponents.ts -- Object.assign mutation:**
- [ ] Line 129: `Object.assign(c, updates)` inside `produce` -- this is correct within Solid's `produce` but the standalone `updateComponent` function is never called from outside. Dead code candidate.

**kernel.ts -- Dual subscriber tracking:**
- [ ] Lines 33-34: Both `subscribers: []` array and `subscriberSet: Set` are maintained in parallel. Redundant -- the Set alone is sufficient for dedup, and iteration over the Set is fine.

**useSnap.ts -- 245-line monolith:**
- [ ] The entire hook is one file with handleDrag (65 lines), handleDragEnd (36 lines), handleResize (24 lines), handlePin (16 lines) all in one scope. The snap detection logic in handleDrag (lines 124-157) could be extracted.

### Tasks

1. **Extract frame registry from DynamicComponent.tsx:** Create `src/components/frameRegistry.ts` with a `Record<FrameType, Component>` map. Replace the 22-branch Switch in DynamicComponent with `const FrameComp = FRAME_REGISTRY[props.data.type]; return <ErrorBoundary><FrameComp data={props.data} /></ErrorBoundary>`. This reduces DynamicComponent.tsx by ~170 lines.
2. **Archive 31 duplicate .jsx files:** Move all `.jsx` files to `core/kernel/archive/shell-jsx-backup/`. They are not imported by any `.tsx` file and are build/legacy artifacts.
3. **Extract Omnibar sub-components:** Split Omnibar.tsx into:
   - `OmnibarInput.tsx` -- input row, hint cycling, send logic
   - `OmnibarPanelAgent.tsx` -- agent-state and agent-management panels
   - `OmnibarPanelModel.tsx` -- model selection, provider toggle, auth
   - `OmnibarPanelContext.tsx` -- context usage, clear context
   - `Omnibar.tsx` -- orchestrator (~200 lines max)
4. **Remove dual subscriber tracking in kernel.ts:** Remove the `subscribers` array (line 33), use only `subscriberSet`. Iterate with `subscriberSet.forEach(cb => cb(event.data))` in onmessage.
5. **Extract snap detection logic from useSnap.ts:** Create `detectFrameSnap()` and `detectOmnibarSnap()` pure functions.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | DynamicComponent.tsx under 350 lines | `wc -l DynamicComponent.tsx` < 350 |
| AC-2 | frameRegistry.ts exists with all 22 frame types | `grep -c ":" src/components/frameRegistry.ts` >= 22 |
| AC-3 | No .jsx files in src/ | `find src/ -name "*.jsx" \| wc -l` returns 0 |
| AC-4 | Omnibar.tsx under 250 lines | `wc -l Omnibar.tsx` < 250 |
| AC-5 | kernel.ts has single subscriber collection | `grep -c "subscribers" kernel.ts` returns references only to subscriberSet |
| AC-6 | Build succeeds | `cd core/shell/frontend && npm run build` exits 0 |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\shell\frontend
# AC-6: Build check
npm run build
# AC-1: DynamicComponent line count
wc -l src/components/DynamicComponent.tsx
# AC-3: No jsx files
find src/ -name "*.jsx" | wc -l
# AC-4: Omnibar line count
wc -l src/components/Omnibar.tsx
```

---

## Track 4: Bug Hunt

### Context

Full codebase audit for runtime bugs, logic errors, and silent failures.

### Issues Found

**bridge.py -- Missing elif causes multiple handler dispatch:**
- [ ] Lines 20-47: All conditions are `if` (not `elif`). If a malformed message somehow matches multiple types (unlikely but defensive programming), multiple handlers fire. More importantly, every message goes through all 4 comparisons unnecessarily. This is a performance bug for high-throughput scenarios.

**bridge_handler.py -- `asyncio.get_event_loop()` deprecation is a real bug in Python 3.12+:**
- [ ] Lines 132, 186, 243, 297: In Python 3.12, `asyncio.get_event_loop()` emits a DeprecationWarning and may return a different loop than the running one. The correct API is `asyncio.get_running_loop()`. This is a latent bug that will become a hard error in future Python versions.

**special_memory.py -- Connection leak on exception between connect and cursor:**
- [ ] Lines 27-33: If `psycopg2.connect()` succeeds but the code between `conn = ...` and `try:` raises (impossible in current code but fragile pattern), the connection leaks. Better: use `with psycopg2.connect(...) as conn:` context manager pattern.

**index.js (claude-bridge) -- Race condition in session save:**
- [ ] Lines 438-439: `saveSessionEntry` is called inside `child.stdout.on('data')` async callback. If two messages arrive rapidly, they could interleave and corrupt the sessions file. Low probability but real risk. Mitigation: debounce or queue writes.

**index.js -- Token estimation is naive and drifts:**
- [ ] Line 287 (Omnibar.tsx): `setContextUsed(prev => prev + Math.ceil(cmd.length / 4))` -- this is a client-side estimate that accumulates error. The real token count arrives via `agent:context` event from the bridge, but the estimate is added on every send. After many messages, the displayed count is inaccurate. Bug: the estimate should be removed since the real count replaces it.

**kernel.ts -- subscriberSet dedup check but array grows anyway:**
- [ ] Lines 93-108: `subscriberSet.has(cb)` returns early if the callback is already registered, but the return function still creates a new arrow function that references `cb`. If `subscribe` is called multiple times with the same callback from different contexts (SolidJS reactive re-runs), the early return masks the re-subscription. In practice: if a component re-subscribes on reactive updates, its old unsubscribe function becomes stale. This is mitigated by onCleanup but fragile.

**G3SessionFrame.tsx -- Coach review never populates:**
- [ ] Lines 39-53: The frame listens for `agent:graph:status` with `p.phase === "coach"`, but the langgraph-bridge only publishes `agent:graph:token` (delta streaming) and `agent:graph:error`. It never publishes `agent:graph:status` with phase information. The Coach review panel will always show "Waiting for Player..." and never display actual coach feedback.

**useComponents.ts -- saveCanvasState called with stale data:**
- [ ] Line 116: `saveCanvasState([...components])` is called at the end of `subscribeToKernel` handler INSIDE `setComponents(prev => ...)`. At this point, `components` (the Solid store) may not yet reflect the update because Solid batches updates. The spread `[...components]` could capture the pre-update state.

### Tasks

1. **Fix bridge.py elif chain** (lines 20-47).
2. **Replace `asyncio.get_event_loop()` with `asyncio.get_running_loop()`** in bridge_handler.py.
3. **Use context manager for psycopg2 connections** in special_memory.py.
4. **Remove naive token estimation in Omnibar.tsx** line 287 -- rely solely on `agent:context` event.
5. **Fix G3SessionFrame.tsx coach review protocol:** Either (a) update langgraph-bridge to publish `agent:graph:status` with phase data during G3 runs, or (b) update G3SessionFrame to parse coach feedback from the streamed token output.
6. **Fix stale save in useComponents.ts:** Move `saveCanvasState` call to a `createEffect` that watches `components` changes, or use `queueMicrotask` after setComponents.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | bridge.py uses elif | `grep -c "elif" bridge.py` >= 3 |
| AC-2 | No `get_event_loop` in bridge_handler | `grep "get_event_loop" bridge_handler.py` returns nothing |
| AC-3 | psycopg2 uses context manager | `grep "with psycopg2.connect" special_memory.py` returns matches |
| AC-4 | No `Math.ceil(cmd.length / 4)` in Omnibar | `grep "Math.ceil" Omnibar.tsx` returns 0 |
| AC-5 | G3Session shows coach feedback or documented as known limitation | Code review |
| AC-6 | Canvas state persists correctly | Manual test: move frame, reload, frame in same position |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge
python -c "t=open('bridge.py').read(); print('PASS' if 'elif' in t else 'FAIL: no elif')"
python -c "t=open('bridge_handler.py').read(); print('PASS' if 'get_event_loop' not in t else 'FAIL')"
python -c "t=open('special_memory.py').read(); print('PASS' if 'with psycopg2.connect' in t else 'FAIL')"
```

---

## Track 5: Tech Debt

### Context

Dependencies, dead code, unused imports, stale references, build artifacts.

### Issues Found

**31 duplicate .jsx files (shell):**
- [ ] Every `.tsx` file has a corresponding `.jsx` file in the same directory. These appear to be transpiled copies or legacy files. They are never imported (all imports use `.tsx`). Total: 31 files, ~100KB of dead weight.

**Unused `anthropic` dependency (kernel):**
- [ ] `pyproject.toml` line 8: `"anthropic>=0.40"` -- never imported. The service uses Claude CLI subprocess. This adds ~450KB to the Docker image and attack surface.

**Dead code: `updateComponent` in useComponents.ts:**
- [ ] Lines 126-132: `updateComponent` function is defined but never called anywhere in the codebase. The `produce`-based mutation is done inline in `subscribeToKernel` instead.

**Dead code: `chatMessages` signal in useComponents.ts:**
- [ ] Line 34: `const [chatMessages, setChatMessages] = kernel.chatMessages;` -- `setChatMessages` is never used. `chatMessages` is only used on line 66 to attach to a frame.

**Dead code: `AVAILABLE_AGENTS` Qwen entry in frame.ts:**
- [ ] Lines 37-40: Qwen agent config is defined but Qwen is DEPRECATED. This config is only used by `OmnibarFrame.tsx` which is itself a deprecated frame type (the pinned Omnibar replaced it).

**Stale `OmnibarFrame.tsx` frame:**
- [ ] `OmnibarFrame.tsx` (5KB) is the old standalone frame version of the Omnibar. It was replaced by the fixed-bottom `Omnibar.tsx` component. It is still registered in DynamicComponent.tsx (line 366-370) and in `FrameData.type` union (line 49), but never spawned by any command.

**Stale type in FrameData union:**
- [ ] Line 45-52 of frame.ts: `"catalog"` type is defined in the union but has no corresponding Match in DynamicComponent.tsx and no frame component. Dead type.
- [ ] Line 46: `"shape"` type is defined but has no corresponding Match in DynamicComponent.tsx. Dead type.

**LatticeStatus type duplication:**
- [ ] `LatticeStatus` interface is defined in both `types/frame.ts` (line 18) and `kernel.ts` (line 15). They are identical but not shared.

**ChatMessage type duplication:**
- [ ] `ChatMessage` interface is defined in both `types/frame.ts` (line 12) and `kernel.ts` (line 8). The `kernel.ts` version has an extra `status?` field.

**Seed data reference to old architecture in domain-memory.js:**
- [ ] Line 252: Seed data says `g3_player_node` -- should say `g3_worker_node` after naming rename.

### Tasks

1. **Move 31 `.jsx` files to archive:** `core/kernel/archive/shell-jsx-backup-2026-03-12/`
2. **Remove `anthropic>=0.40` from pyproject.toml** and regenerate `uv.lock`.
3. **Remove `updateComponent` from useComponents.ts** (lines 126-132). Remove from return object on line 141.
4. **Remove `setChatMessages` destructure** in useComponents.ts line 34 -- change to `const [chatMessages] = kernel.chatMessages;`
5. **Remove Qwen from `AVAILABLE_AGENTS`** in frame.ts.
6. **Remove dead types `"catalog"` and `"shape"` from FrameData.type union** in frame.ts.
7. **Consolidate `LatticeStatus` and `ChatMessage` types:** Keep definitions only in `types/frame.ts`, import in `kernel.ts`.
8. **Update seed data** in domain-memory.js line 252: `g3_player_node` -> `g3_worker_node`.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | No .jsx files in src/ | `find src/ -name "*.jsx"` returns empty |
| AC-2 | anthropic not in pyproject.toml | `grep "anthropic" pyproject.toml` returns empty |
| AC-3 | No "catalog" or "shape" in FrameData type union | `grep -E '"catalog"|"shape"' types/frame.ts` returns empty |
| AC-4 | updateComponent not exported | `grep "updateComponent" hooks/useComponents.ts` returns 0 |
| AC-5 | Build succeeds | `npm run build` in frontend exits 0 |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\shell\frontend
find src/ -name "*.jsx" | wc -l  # should be 0
grep "anthropic" ../../kernel/tlos-langgraph-bridge/pyproject.toml  # should be empty
grep -E '"catalog"|"shape"' src/types/frame.ts  # should be empty
npm run build  # should exit 0
```

---

## Track 6: Product Debt

### Context

Compare current implementation against `tlos-system-spec.md` gap analysis (Section 8) and `agent-system-architecture.md` roadmap. Focus on features that are coded but not connected, or documented as live but actually broken.

### Issues Found

**G3 Session frame is non-functional (disconnected from LangGraph G3):**
- [ ] `G3SessionFrame.tsx` sends `agent:graph:run` (line 76) which triggers the DIRECT graph (orchestrator -> worker -> END), NOT the G3 cyclic subgraph. The G3 subgraph (`build_g3_subgraph()`) is only called inline from `senior_frontend_node` / `senior_backend_node`. There is no NATS subject that directly invokes G3. The G3 Session frame in the shell is essentially a wrapper around the basic direct graph, not a G3 session.
- [ ] The Coach review panel never populates (no `agent:graph:status` with phase data is published by the bridge).

**Agent hierarchy graphs coded but not end-to-end tested:**
- [ ] Phase 0 in roadmap marks 0.3-0.5 as "deferred to QS": Chief, Lead, and Senior graphs are coded but never verified via shell UI. No shell command or frame spawns these graphs. Only `agent:graph:run` is triggered from the G3 Session frame.

**Memory Viewer shows domain-memory facts but no search UI:**
- [ ] `MemoryViewerFrame.tsx` can list facts and send `memory:search`, but search results come back as `memory:search-results` -- the frame needs to handle this message type. Need to verify it does.

**Kernel Status frame shows hardcoded service list:**
- [ ] `KernelStatusFrame.tsx` likely shows a fixed list of services rather than reading from `kernel:status` response dynamically. The `kernel:ping` / `kernel:status` protocol exists in claude-bridge but the shell frame needs to use it.

**Omnibar "kernel" command spawns wrong frames:**
- [ ] App.tsx line 209: `kernel` command spawns `KERNEL_FRAMES` which is `[agent-status, memory-viewer]`. But the actual Kernel monitoring frame is `kernel-status` (added later). The command should spawn `kernel-status` instead of or in addition to `agent-status`.

**Only 3 hardcoded Omnibar commands (mcb, kernel, g3):**
- [ ] App.tsx lines 203-218: Local commands are hardcoded. No way to spawn individual frame types. Per spec section 8, the vision requires a trigger taxonomy. Current state: no `spawn terminal`, `spawn notes`, etc.

**No way to trigger Chief/Lead/Senior graphs from shell:**
- [ ] The Omnibar sends `agent:chat` to claude-bridge. There is no UI for sending `agent:chief:run`, `agent:lead:run`, or `agent:senior:run`. These NATS subjects exist in bridge.py but are unreachable from the shell.

### Tasks

1. **Add G3 NATS subject:** Create `agent:g3:run` handler in bridge.py that directly invokes `build_g3_subgraph()` with a spec, criteria, and sessionId. Publish streaming tokens + coach phase info as `agent:graph:token` with additional fields.
2. **Fix G3SessionFrame to use new `agent:g3:run`** and display coach feedback properly.
3. **Update `kernel` command in App.tsx** to include `kernel-status` frame.
4. **Add basic frame spawn commands to Omnibar:** `spawn <type>` should create a frame of that type (at least for: terminal, notes, text-editor, file-browser, identity).
5. **Document current graph accessibility gap:** Add a note that Chief/Lead/Senior graphs are API-only (NATS) until Phase 2 provides UI.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | `agent:g3:run` handler exists in bridge.py | `grep "agent:g3:run" bridge.py` returns 1 match |
| AC-2 | G3SessionFrame sends `agent:g3:run` | `grep "agent:g3:run" G3SessionFrame.tsx` returns 1 match |
| AC-3 | `kernel` command includes kernel-status frame | `grep "kernel-status" kernel-frames.ts` returns a match |
| AC-4 | `spawn terminal` works in Omnibar | Manual test |
| AC-5 | G3SessionFrame shows coach feedback after a run | Manual test |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS
grep "agent:g3:run" core/kernel/tlos-langgraph-bridge/bridge.py
grep "agent:g3:run" core/shell/frontend/src/components/frames/G3SessionFrame.tsx
grep "kernel-status" core/shell/frontend/src/data/kernel-frames.ts
```

---

## Track 7: UX Debt

### Context

Interaction design issues in the shell UI. Focus on user-facing workflows that are confusing, broken, or incomplete.

### Issues Found

**Omnibar hint cycling is distracting:**
- [ ] Omnibar.tsx lines 121-135: Hints cycle every 2.5 seconds with `setInterval`. The cycling continues even when the user is interacting with frames elsewhere on the canvas. This creates unnecessary visual noise in the peripheral vision.

**No feedback when kernel is disconnected:**
- [ ] If the WebSocket to shell-bridge drops, the only indicator is a brief console error. The Omnibar continues to accept input and silently fails to send. User sees no visual feedback that the kernel connection is lost.

**Context panel token count is unreliable:**
- [ ] Omnibar.tsx line 287: Client-side token estimate (`Math.ceil(cmd.length / 4)`) drifts from actual usage. Users see inaccurate context usage. The real count from `agent:context` replaces it but only after the AI responds.

**No way to clear individual messages:**
- [ ] The only option is "clear context" which resets the entire conversation. No way to remove a single erroneous message.

**ESC behavior is inconsistent:**
- [ ] Omnibar.tsx lines 240-251: ESC closes panel first, then collapses Omnibar. But if a frame has focus (e.g., TextEditor), ESC is captured by the frame and never reaches the Omnibar. No unified keyboard navigation.

**G3 Session frame sends to wrong graph:**
- [ ] The "Run" button in G3SessionFrame sends `agent:graph:run` which triggers the basic direct graph (orchestrator -> worker -> END), not the G3 cyclic subgraph. Users expect a G3 dialectical session but get a single-shot response.

**No loading/spinner during AI response wait:**
- [ ] After sending a message, the Omnibar shows an empty AI message bubble with a pulsing cursor. If Claude CLI takes 5-10 seconds to start producing output, there is no explicit "thinking" indicator apart from the blinking cursor.

**Canvas save timing issue:**
- [ ] Frame position saves happen synchronously in drag/resize handlers. If the user drags rapidly, localStorage writes happen on every move event (throttled by RAF but still frequent). Should debounce canvas saves to every 500ms or on drag-end only.

### Tasks

1. **Add kernel connection indicator to Omnibar:** Show a disconnected icon/text when WebSocket is not OPEN. Disable input and show "Reconnecting..." placeholder.
2. **Remove client-side token estimation:** Delete line 287 in Omnibar.tsx. The `agent:context` event provides accurate data.
3. **Stop hint cycling when user is idle but Omnibar is collapsed:** Only cycle hints on focus/hover of the Omnibar input, not continuously.
4. **Fix G3 Session to use correct graph** (see Track 6 AC-1/AC-2).
5. **Debounce canvas save:** In useComponents.ts, debounce `saveCanvasState` calls with a 500ms timeout.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | Disconnected state visible in Omnibar | Visual inspection when shell-bridge is down |
| AC-2 | No `Math.ceil(cmd.length / 4)` in Omnibar.tsx | `grep "Math.ceil" Omnibar.tsx` returns 0 |
| AC-3 | Canvas save is debounced | `grep "debounce\|setTimeout.*save" useComponents.ts` returns a match |
| AC-4 | Build succeeds | `npm run build` exits 0 |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\shell\frontend
grep "Math.ceil" src/components/Omnibar.tsx  # should return nothing
grep -E "debounce|setTimeout.*save" src/hooks/useComponents.ts  # should match
npm run build
```

---

## Track 8: UI Debt

### Context

Visual consistency, brand compliance, and polish. The tLOS brand: bg `#0a0a0f`, primary `#f2b90d`, cyan `#06b6d4`, suprematist minimal aesthetic.

### Issues Found

**G3SessionFrame uses inline styles instead of Tailwind:**
- [ ] G3SessionFrame.tsx lines 108-261: The entire component uses `style={{...}}` objects instead of Tailwind classes. Every other frame in the codebase uses Tailwind. This is inconsistent and harder to maintain.

**App.tsx traffic lights differ from DynamicComponent.tsx traffic lights:**
- [ ] App.tsx lines 167-187: Window traffic lights use macOS-style colors (#ff5f57, #febc2e, #28c840) with hover text symbols.
- [ ] DynamicComponent.tsx lines 289-304: Frame traffic lights use different styling (bg-red-500/50, bg-amber-500/50, bg-emerald-500/50) without text symbols.
- [ ] These should be visually consistent.

**Error overlay uses emoji:**
- [ ] Omnibar.tsx line 599: `"compacting..."` text includes emoji. Per coding rules, avoid emojis unless explicitly requested.

**Inline `<style>` tag in Omnibar.tsx:**
- [ ] Omnibar.tsx lines 366-382: CSS animations defined via inline `<style>` tag. Should use Tailwind `@keyframes` in the global CSS or `tailwind.config`.

**Hardcoded color values scattered:**
- [ ] G3SessionFrame.tsx line 5: `const PRIMARY = "#f2b90d"` -- should use Tailwind theme token `tlos-primary`
- [ ] G3SessionFrame.tsx line 6: `const CYAN = "#06b6d4"` -- should use `tlos-cyan`
- [ ] Multiple frames use `"rgba(255,255,255,0.08)"` directly instead of the defined border class

**No empty state for canvas:**
- [ ] When all frames are closed, the canvas shows a blank dark background with only the grid. No "Welcome to tLOS" or "Press Ctrl+K / use Omnibar" hint.

**Omnibar collapsed state is too minimal:**
- [ ] The collapsed Omnibar has a 6x7px monolith SVG that is nearly invisible at opacity-40. Users may not realize the Omnibar is there on first launch.

### Tasks

1. **Convert G3SessionFrame from inline styles to Tailwind:** Replace all `style={{}}` with equivalent Tailwind classes. Use `text-tlos-primary` and `text-tlos-cyan` theme tokens.
2. **Unify traffic light styles:** Extract a `<TrafficLights>` component used by both App.tsx and DynamicComponent.tsx.
3. **Move Omnibar CSS animations to tailwind.config or global CSS.** Remove inline `<style>` tag.
4. **Remove emojis from code** -- replace with text-only indicators. `"compacting..."` needs only the text.
5. **Replace hardcoded hex colors in G3SessionFrame** with Tailwind theme tokens.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | G3SessionFrame has no `style={{` props | `grep -c "style={{" G3SessionFrame.tsx` returns 0 |
| AC-2 | TrafficLights component exists | `ls src/components/TrafficLights.tsx` exists |
| AC-3 | No inline `<style>` in Omnibar.tsx | `grep "<style>" Omnibar.tsx` returns 0 |
| AC-4 | No hardcoded hex colors in G3SessionFrame | `grep "#f2b90d\|#06b6d4\|#0a0a0f" G3SessionFrame.tsx` returns 0 |
| AC-5 | Build succeeds | `npm run build` exits 0 |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\shell\frontend
grep -c "style={{" src/components/frames/G3SessionFrame.tsx  # should be 0
ls src/components/TrafficLights.tsx  # should exist
grep "<style>" src/components/Omnibar.tsx  # should return nothing
npm run build
```

---

## Track 9: Docker

### Context

Docker compose stack has 11 services. Focus on health checks, resource limits, image optimization, and runtime correctness.

### Issues Found

**No resource limits on any service:**
- [ ] docker-compose.yml: None of the 11 services have `deploy.resources.limits` set. On a development machine, liteLLM alone uses ~791MB RAM. Without limits, a runaway service could OOM the entire Docker host.

**Letta service has no health check:**
- [ ] docker-compose.yml lines 69-75: The `letta` service has no `healthcheck`. Other services that depend on it (`langgraph-bridge`, `claude-bridge`) use `condition: service_started` which only waits for the container to start, not for Letta to be ready to accept connections on port 8283. This can cause startup failures.

**langgraph-bridge Dockerfile has stale NATS_URL default:**
- [ ] Dockerfile line 25: `ENV NATS_URL=nats://host.docker.internal:4222` -- this is the host-access URL. But in docker-compose.yml, the env is overridden to `nats://nats:4222`. The Dockerfile default should match the compose default for consistency (in case the service is run standalone).

**claude-bridge Dockerfile has same stale NATS_URL:**
- [ ] Dockerfile line 20: `ENV NATS_URL=nats://host.docker.internal:4222` -- same issue.

**DB_PORT default mismatch between Python and Node services:**
- [ ] `special_memory.py` line 14: Default is `5432` (container internal port) -- correct for Docker.
- [ ] `domain-memory.js` line 16: Default is `5433` (host-mapped port) -- correct for local dev outside Docker.
- [ ] Both services run in Docker where DB_PORT=5432 is set by compose. No bug, but the inconsistent defaults are confusing and a risk if someone runs a service standalone.

**No Docker build caching for node_modules in claude-bridge:**
- [ ] claude-bridge/Dockerfile lines 14-17: `COPY` lists individual .js files. If any .js file changes, the layer cache is invalidated even though dependencies didn't change. The package files are correctly cached (lines 9-11), but the source copy could be a single `COPY . .` after the npm ci step for simplicity.

**agent-bridge profile `nim` not documented:**
- [ ] docker-compose.yml lines 210-213: `agent-bridge` is behind `profiles: [nim]`. This means `docker compose up` does NOT start it. Users must use `docker compose --profile nim up` to include it. This is intentional but should have a comment in the compose file.

**litellm healthcheck uses Python in container:**
- [ ] docker-compose.yml line 49: `python3 -c "import urllib.request; ..."` -- this assumes Python is available inside the litellm container. If the image changes to a non-Python base, the healthcheck breaks. A `curl` or `wget` based check would be more robust.

**No `depends_on` condition for letta readiness:**
- [ ] docker-compose.yml lines 101-102, 132-133: Both `langgraph-bridge` and `claude-bridge` use `letta: condition: service_started`. Without a Letta healthcheck, this provides no guarantee that the Letta API is ready.

### Tasks

1. **Add resource limits to all services in docker-compose.yml:**
   - nats: 128MB
   - db: 256MB
   - litellm: 1024MB (observed ~791MB)
   - qdrant: 256MB
   - letta: 512MB
   - langgraph-bridge: 512MB
   - claude-bridge: 256MB
   - shell-bridge, dispatcher, fs-bridge, shell-exec: 128MB each
   - agent-bridge: 256MB
2. **Add healthcheck to letta service:** `test: ["CMD-SHELL", "curl -sf http://localhost:8283/v1/health || exit 1"]` with interval 10s, timeout 5s, retries 10. Install curl in the letta image or use wget.
3. **Update depends_on for langgraph-bridge and claude-bridge:** Change `letta: condition: service_started` to `letta: condition: service_healthy` (after adding healthcheck).
4. **Standardize NATS_URL defaults in Dockerfiles:** Change both Dockerfiles from `nats://host.docker.internal:4222` to `nats://nats:4222` to match the compose environment.
5. **Add comments for agent-bridge nim profile** explaining activation: `# Enable with: docker compose --profile nim up`.
6. **Add DB_PORT comment in domain-memory.js** explaining the 5433 default is for local dev.

### Acceptance Criteria

| ID | Criteria | Verification |
|---|---|---|
| AC-1 | All services have memory limits | `grep -c "mem_limit\|memory:" docker-compose.yml` >= 11 |
| AC-2 | Letta has healthcheck | `grep -A3 "healthcheck" docker-compose.yml \| grep "8283"` returns a match |
| AC-3 | langgraph-bridge depends on letta:service_healthy | `grep -A2 "letta:" docker-compose.yml \| grep "service_healthy"` returns matches |
| AC-4 | Both Dockerfiles use nats://nats:4222 | `grep "host.docker.internal" */Dockerfile` returns 0 |
| AC-5 | Docker stack starts successfully | `docker compose up -d && docker compose ps` shows all services healthy |

### Verification Commands

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel
# AC-1: Resource limits
grep -c "mem_limit" docker-compose.yml  # should be >= 11
# AC-2: Letta healthcheck
grep -A5 "letta:" docker-compose.yml | grep -c "healthcheck"  # should be >= 1
# AC-4: No host.docker.internal in Dockerfiles
grep -r "host.docker.internal" tlos-langgraph-bridge/Dockerfile tlos-claude-bridge/Dockerfile  # should return nothing
# AC-5: Stack health
docker compose up -d
docker compose ps --format "table {{.Service}}\t{{.Status}}"
```

---

## Cross-Track Dependencies

```
Track 1 (Naming) ── must complete BEFORE ──> Track 2 (Refactor kernel)
                                              (because refactor changes function signatures that naming also changes)

Track 1 (Naming) ── must complete BEFORE ──> Track 5 (Tech Debt)
                                              (seed data update depends on new names)

Track 6 (Product Debt) ── depends on ──> Track 1 (Naming)
                                          (G3 NATS subject uses renamed functions)

Track 3 (Refactor shell) ── independent of ──> Track 2 (Refactor kernel)
Track 4 (Bug Hunt) ── overlaps with ──> Track 2, Track 7 (some fixes are same as refactors)
Track 7 (UX Debt) ── overlaps with ──> Track 8 (UI Debt) on Omnibar changes
Track 9 (Docker) ── fully independent ──> can run in parallel with all tracks
```

### Recommended Execution Order

```
Phase A (parallel):
  Track 1 (Naming)      ← blocking for others
  Track 9 (Docker)      ← fully independent

Phase B (parallel, after Track 1):
  Track 2 (Refactor kernel)
  Track 3 (Refactor shell)
  Track 5 (Tech Debt)

Phase C (parallel, after Phase B):
  Track 4 (Bug Hunt)    ← some items already fixed by Track 2/3
  Track 6 (Product Debt) ← depends on renamed functions
  Track 7 (UX Debt)
  Track 8 (UI Debt)
```
