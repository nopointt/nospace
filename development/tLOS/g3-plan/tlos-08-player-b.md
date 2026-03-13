# TLOS-08 — Player B Spec: LangGraph граф + message handler
> G3 Turn B | REQ-003, REQ-004
> Запускается ПАРАЛЛЕЛЬНО с Coach A

---

## Задача

Реализовать `graph.py` (LangGraph граф) и `bridge_handler.py` (message handler).
Turn A создал заглушки — Turn B заменяет их рабочими реализациями.

---

## Референсные файлы (читай перед реализацией)

1. `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\index.js`
   — ключевой референс: как вызывать Claude CLI через subprocess + stdin, как парсить stream-json

2. `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\bridge.py`
   — изучи: как bridge_handler подключается, формат publish событий

3. `C:\Users\noadmin\nospace\development\tLOS\g3-plan\tlos-08-requirements.md`
   — полный requirements contract (REQ-003, REQ-004)

---

## Claude CLI subprocess паттерн (из claude-bridge)

Claude CLI используется через subprocess + stdin (НЕ через Anthropic SDK — SDK требует API key):

```python
import subprocess
import json

def call_claude_cli(prompt: str, model: str = "claude-sonnet-4-6") -> str:
    """
    Вызывает claude CLI и возвращает полный ответ.
    Паттерн из tlos-claude-bridge: args через список, prompt через stdin.
    """
    import shutil
    claude_exe = shutil.which("claude") or shutil.which("claude.cmd")
    if not claude_exe:
        raise RuntimeError("claude CLI not found")

    args = [
        claude_exe,
        "--print",
        "--model", model,
        "--output-format", "stream-json",
    ]

    proc = subprocess.Popen(
        args,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout, stderr = proc.communicate(input=prompt.encode("utf-8"))

    # Парсим stream-json формат
    result_text = ""
    for line in stdout.decode("utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        # Тип "assistant" — содержит текст ответа
        if obj.get("type") == "assistant":
            for block in obj.get("message", {}).get("content", []):
                if block.get("type") == "text":
                    result_text += block.get("text", "")
        # Тип "result" — финальный результат (если нет assistant выше)
        elif obj.get("type") == "result":
            if not result_text:
                result_text = obj.get("result", "")

    return result_text.strip()
```

---

## Что реализовать

### `core/kernel/tlos-langgraph-bridge/graph.py`

Замени заглушку Turn A на рабочую реализацию:

```python
from typing import TypedDict
from langgraph.graph import StateGraph, END

class GraphState(TypedDict):
    messages: list       # [{"role": str, "content": str}]
    sessionId: str
    result: str

def orchestrator_node(state: GraphState) -> GraphState:
    """
    Orchestrator: принимает messages, формирует prompt для worker.
    Добавляет system context к первому сообщению.
    """
    # Minimal orchestrator: просто форвардит messages дальше
    # В будущих версиях: routing logic, task decomposition
    return state

def worker_node(state: GraphState) -> GraphState:
    """
    Worker: вызывает Claude CLI, возвращает результат.
    """
    messages = state["messages"]
    model = "claude-sonnet-4-6"

    # Build prompt from messages
    # Для stream-json формата: последнее user сообщение = основной prompt
    user_content = ""
    for msg in messages:
        if msg.get("role") == "user":
            user_content = msg.get("content", "")

    result = call_claude_cli(user_content, model=model)
    return {**state, "result": result}

def build_graph():
    """Build and compile the minimal LangGraph."""
    graph = StateGraph(GraphState)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("worker", worker_node)
    graph.set_entry_point("orchestrator")
    graph.add_edge("orchestrator", "worker")
    graph.add_edge("worker", END)
    return graph.compile()
```

Добавь `call_claude_cli()` функцию в этот же файл (из паттерна выше).

---

### `core/kernel/tlos-langgraph-bridge/bridge_handler.py`

Замени заглушку Turn A на рабочую реализацию:

```python
import json
import asyncio
from graph import build_graph

PUBLISH_SUBJECT = "tlos.shell.broadcast"

def encode(obj: dict) -> bytes:
    return json.dumps(obj).encode()

# Compile once at import time
_graph = None

def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph

async def handle_graph_run(nc, session_id: str, task: str, model: str):
    """
    Handle agent:graph:run — invoke LangGraph, stream result tokens.
    NEVER raises — all errors published as agent:graph:error.
    """
    try:
        graph = get_graph()
        state = {
            "messages": [{"role": "user", "content": task}],
            "sessionId": session_id,
            "result": ""
        }

        # Run graph (sync invoke in async context)
        loop = asyncio.get_event_loop()
        final_state = await loop.run_in_executor(None, graph.invoke, state)
        result = final_state.get("result", "")

        # Stream result as tokens (chunk into ~100 char pieces)
        chunk_size = 100
        for i in range(0, max(len(result), 1), chunk_size):
            chunk = result[i:i + chunk_size]
            await nc.publish(PUBLISH_SUBJECT, encode({
                "type": "agent:graph:token",
                "sessionId": session_id,
                "delta": chunk,
                "done": False
            }))
            await asyncio.sleep(0)  # yield event loop

        # Final done signal
        await nc.publish(PUBLISH_SUBJECT, encode({
            "type": "agent:graph:token",
            "sessionId": session_id,
            "delta": "",
            "done": True
        }))

    except Exception as e:
        print(f"[langgraph-bridge] handle_graph_run error: {e}")
        try:
            await nc.publish(PUBLISH_SUBJECT, encode({
                "type": "agent:graph:error",
                "sessionId": session_id,
                "error": str(e)
            }))
        except Exception:
            pass
```

---

## Verification (после завершения)

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge

# 1. Syntax check
uv run python -m py_compile graph.py bridge_handler.py && echo "syntax OK"

# 2. Graph imports
uv run python -c "from graph import build_graph; g = build_graph(); print('REQ-003 OK')"

# 3. call_claude_cli доступна
uv run python -c "from graph import call_claude_cli; print('call_claude_cli available')"

# 4. bridge_handler imports
uv run python -c "from bridge_handler import handle_graph_run; print('REQ-004 OK')"
```

---

## Правила G3

- НЕ объявляй задачу выполненной — Coach проверяет независимо
- НЕ трогай `bridge.py` или `main.py` — только `graph.py` и `bridge_handler.py`
- НЕ реализовывай G3 cyclic subgraph — это Turn C
- `call_claude_cli` должна работать даже если claude CLI вернёт код выхода != 0 (graceful degradation)
