# TLOS-08 — Player A Spec: Python skeleton + NATS + grid.ps1
> G3 Turn A | REQ-001, REQ-002, REQ-005

---

## Задача

Создать Python проект `tlos-langgraph-bridge` с NATS подключением и интегрировать в grid.ps1.
НЕ реализовывать LangGraph граф (это Turn B) — в Turn A достаточно заглушки.

---

## Референсные файлы (читай перед реализацией)

1. `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\index.js`
   — изучи: NATS subscribe/publish паттерн, format событий, handleChat структуру

2. `C:\Users\noadmin\nospace\development\tLOS\core\grid.ps1`
   — изучи: $Services array, optional service pre-flight блоки (claude-bridge, letta), stop блок, status блок

3. `C:\Users\noadmin\nospace\development\tLOS\g3-plan\tlos-08-requirements.md`
   — полный requirements contract

---

## Что создать

### `core/kernel/tlos-langgraph-bridge/pyproject.toml`

```toml
[project]
name = "tlos-langgraph-bridge"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "nats-py>=2.0",
    "langgraph>=0.2",
    "anthropic>=0.40",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### `core/kernel/tlos-langgraph-bridge/main.py`

```python
import asyncio
from bridge import run_bridge

if __name__ == "__main__":
    asyncio.run(run_bridge())
```

### `core/kernel/tlos-langgraph-bridge/bridge.py`

```python
import asyncio
import json
import nats

NATS_URL = "nats://127.0.0.1:4222"
SUBSCRIBE_SUBJECT = "tlos.shell.events"
PUBLISH_SUBJECT = "tlos.shell.broadcast"

def encode(obj: dict) -> bytes:
    return json.dumps(obj).encode()

async def handle_message(nc, msg):
    try:
        data = json.loads(msg.data.decode())
        msg_type = data.get("type", "")
        if msg_type == "agent:graph:run":
            session_id = data.get("sessionId", "")
            task = data.get("task", "")
            model = data.get("model", "claude-sonnet-4-6")
            # Import here to allow Turn B to implement graph.py independently
            from bridge_handler import handle_graph_run
            await handle_graph_run(nc, session_id, task, model)
    except Exception as e:
        print(f"[langgraph-bridge] message error: {e}")

async def run_bridge():
    print("[langgraph-bridge] connecting to NATS...")
    nc = await nats.connect(
        NATS_URL,
        reconnect_time_wait=2,
        max_reconnect_attempts=-1,  # infinite
    )
    print(f"[langgraph-bridge] connected")

    async def message_handler(msg):
        await handle_message(nc, msg)

    await nc.subscribe(SUBSCRIBE_SUBJECT, cb=message_handler)

    # Publish startup status
    await nc.publish(PUBLISH_SUBJECT, encode({
        "type": "agent:graph:status",
        "ready": True,
        "service": "langgraph"
    }))
    print(f"[langgraph-bridge] ready — {SUBSCRIBE_SUBJECT}")

    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        pass
    finally:
        await nc.drain()
        print("[langgraph-bridge] stopped")
```

### `core/kernel/tlos-langgraph-bridge/bridge_handler.py`

Заглушка для Turn A (Turn B заменит её реальной реализацией):

```python
import json

PUBLISH_SUBJECT = "tlos.shell.broadcast"

def encode(obj: dict) -> bytes:
    return json.dumps(obj).encode()

async def handle_graph_run(nc, session_id: str, task: str, model: str):
    """Stub — Turn B replaces this with real LangGraph invocation."""
    try:
        await nc.publish(PUBLISH_SUBJECT, encode({
            "type": "agent:graph:token",
            "sessionId": session_id,
            "delta": f"[stub] received task: {task[:50]}",
            "done": False
        }))
        await nc.publish(PUBLISH_SUBJECT, encode({
            "type": "agent:graph:token",
            "sessionId": session_id,
            "delta": "",
            "done": True
        }))
    except Exception as e:
        await nc.publish(PUBLISH_SUBJECT, encode({
            "type": "agent:graph:error",
            "sessionId": session_id,
            "error": str(e)
        }))
```

### `core/kernel/tlos-langgraph-bridge/graph.py`

Пустой файл-заглушка (Turn B заполнит):

```python
# graph.py — implemented in Turn B
# Placeholder for LangGraph graph definition

def build_graph():
    raise NotImplementedError("Turn B implements build_graph()")
```

---

## grid.ps1 изменения (4 точки)

Читай `core/grid.ps1` полностью, затем внеси 4 изменения:

### 1. $Services array — после letta entry, перед frontend:

```powershell
@{ name = "langgraph"; title = "LangGraph bridge"; dir = (Join-Path $Kernel "tlos-langgraph-bridge"); cmd = "uv run python main.py"; optional = $true  },
```

### 2. "run" case — pre-flight блок после letta блока (lines ~74-80):

```powershell
if ($svc.optional -and $svc.name -eq "langgraph") {
    $uvAvailable = $null -ne (Get-Command uv -ErrorAction SilentlyContinue)
    $pyProjectPath = Join-Path $svc.dir "pyproject.toml"
    if (-not $uvAvailable -or -not (Test-Path $pyProjectPath)) {
        Write-Host "  skip  $($svc.title)  (uv not found or pyproject.toml missing)" -ForegroundColor DarkGray
        continue
    }
}
```

### 3. "stop" блок — добавить после letta stop (после строки с $lettaPid):

```powershell
Get-WmiObject Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*tlos-langgraph-bridge*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host "  stop  langgraph" -ForegroundColor Gray
```

### 4. "status" блок — добавить после letta status check:

```powershell
$lgProc = Get-WmiObject Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*tlos-langgraph-bridge*" } | Select-Object -First 1
if ($lgProc) {
    Write-Host "  [UP]  LangGraph bridge  python main.py" -ForegroundColor Green
} else {
    Write-Host "  [ ]   LangGraph bridge  python main.py" -ForegroundColor DarkGray
}
```

---

## Verification (после завершения)

```bash
# 1. Проверь структуру
ls C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\
# → pyproject.toml, main.py, bridge.py, bridge_handler.py, graph.py

# 2. Проверь импорты (без запуска NATS)
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge
uv run python -c "import nats, langgraph, anthropic; print('REQ-001 OK')"

# 3. Проверь синтаксис
uv run python -m py_compile main.py bridge.py bridge_handler.py graph.py
echo "syntax OK"

# 4. Читай grid.ps1 и убедись что 4 точки вставлены
```

---

## Правила G3

- НЕ объявляй задачу выполненной — Coach проверяет независимо
- НЕ трогай `tlos-claude-bridge/` — только новые файлы + grid.ps1
- НЕ реализовывай LangGraph граф — заглушка в graph.py достаточна для Turn A
- Пиши итоги в `g3-plan/todo.g3.md` (обнови Turn A → DONE когда закончишь)
