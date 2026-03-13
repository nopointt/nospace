# TLOS-08 — Requirements Contract: tlos-langgraph-bridge
> G3 Session | Coach: Orchestrator (Claude main) | Date: 2026-03-10

---

## Задача

Создать Python сервис `tlos-langgraph-bridge` — NATS subscriber, подключающий tLOS к LangGraph.
Аналог `tlos-claude-bridge` но на Python, с LangGraph как control flow engine.

---

## REQ-001 — Python project structure

**Путь:** `core/kernel/tlos-langgraph-bridge/`

**Файлы:**
- `pyproject.toml` — uv-managed, deps: `nats-py>=2.0`, `langgraph>=0.2`, `anthropic>=0.40`
- `main.py` — точка входа: `asyncio.run(main())`
- `bridge.py` — NATS connection + message routing
- `graph.py` — LangGraph граф

**Verification Gate:**
```bash
cd core/kernel/tlos-langgraph-bridge
uv run python -c "import nats, langgraph, anthropic; print('REQ-001 OK')"
# → REQ-001 OK (без ошибок импорта)
```

---

## REQ-002 — NATS connectivity

**Подключение:**
- URL: `nats://127.0.0.1:4222`
- Reconnect: автоматический при разрыве
- Subject: subscribe `tlos.shell.events` (StringCodec JSON — тот же что claude-bridge)
- Publish to: `tlos.shell.broadcast`

**Обработка сообщений:**
- type `agent:graph:run` → вызов `handle_graph_run(nc, sessionId, task, model)`

**События публикуемые:**
- `agent:graph:status {ready: true, service: "langgraph"}` — при старте
- `agent:graph:token {sessionId, delta, done: false}` — во время выполнения
- `agent:graph:token {sessionId, delta: "", done: true}` — по завершении
- `agent:graph:error {sessionId, error: str}` — при ошибке

**Verification Gate:**
```bash
# запустить сервис, проверить что запустился без краша
# в логе должна быть строка: [langgraph-bridge] ready — tlos.shell.events
```

---

## REQ-003 — LangGraph minimal graph

**Файл:** `graph.py`

**State:**
```python
from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END

class GraphState(TypedDict):
    messages: list       # [{role, content}]
    sessionId: str
    result: str
```

**Граф:**
- `orchestrator` нода: принимает messages, добавляет system context, передаёт worker
- `worker` нода: вызывает Claude CLI subprocess (паттерн из claude-bridge: `spawn claude --print`, stdin), возвращает ответ
- edge: `orchestrator → worker → END`
- `build_graph()` возвращает `compiled_graph`

**Claude вызов в worker ноде:**
Использовать subprocess + claude CLI (паттерн из tlos-claude-bridge):
```python
import subprocess, sys
proc = subprocess.run(
    ["claude", "--print", "--model", model, "--output-format", "stream-json"],
    input=prompt.encode(),
    capture_output=True
)
```

**Verification Gate:**
```bash
uv run python -c "from graph import build_graph; g = build_graph(); print('REQ-003 OK')"
# → REQ-003 OK
```

---

## REQ-004 — bridge.py message handler

**Функция:**
```python
async def handle_graph_run(nc, session_id: str, task: str, model: str):
    # 1. build state
    # 2. invoke graph
    # 3. publish agent:graph:token chunks
    # 4. publish agent:graph:token {done: true}
    # NEVER raise exception — catch all, publish error
```

**Invariants:**
- Всегда завершается `done: true` или `error` (клиент не должен зависнуть)
- Не крашит основной event loop при ошибке
- Все исключения: логирует + публикует `agent:graph:error`

**Verification Gate:**
```bash
# unit test: вызов handle_graph_run с mock nc
# → публикует минимум 1 agent:graph:token + done:true
```

---

## REQ-005 — grid.ps1 integration

**$Services array** (после letta, перед frontend):
```powershell
@{ name="langgraph"; title="LangGraph bridge"; dir=(Join-Path $Kernel "tlos-langgraph-bridge"); cmd="uv run python main.py"; optional=$true }
```

**Pre-flight блок** (в "run" case, после letta блока):
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

**Stop блок** — убить процесс по имени (нет фиксированного порта):
```powershell
# В "stop" блоке — добавить строку:
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*tlos-langgraph-bridge*" } | Stop-Process -Force -ErrorAction SilentlyContinue
```

**Status блок** — проверка по имени:
```powershell
# В "status" блоке — добавить проверку:
$lgProc = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*tlos-langgraph-bridge*" } | Select-Object -First 1
if ($lgProc) {
    Write-Host "  [UP]  LangGraph bridge  python main.py" -ForegroundColor Green
} else {
    Write-Host "  [ ]   LangGraph bridge  python main.py" -ForegroundColor DarkGray
}
```

**Verification Gate:**
```
# Читаем grid.ps1 — проверяем:
# 1. $Services содержит langgraph entry
# 2. "run" блок содержит langgraph pre-flight
# 3. "stop" блок содержит langgraph kill
# 4. "status" блок содержит langgraph check
```

---

## REQ-006 — G3 cyclic subgraph

**Функция:** `build_g3_subgraph(spec: str, criteria: str) → compiled_subgraph`

**State:**
```python
class G3State(TypedDict):
    spec: str
    criteria: str
    implementation: str
    coaching_feedback: str
    iterations: int
    passed: bool
```

**Ноды:**
- `player`: получает spec + feedback → генерирует implementation (claude CLI)
- `coach`: получает implementation + criteria → оценивает → `{passed: bool, feedback: str}` (claude CLI)

**Граф:**
```
START → player → coach → [conditional edge]
  if passed or iterations >= 3 → END
  else → player (increment iterations)
```

**Интеграция в build_graph():**
- `build_graph()` принимает опциональный `task_type: str = "direct"`
- если `task_type == "g3"`: использует G3 subgraph

**Verification Gate:**
```bash
uv run python -c "
from graph import build_g3_subgraph
g = build_g3_subgraph('write hello world in python', 'must use print function')
result = g.invoke({'spec': 'write hello world in python', 'criteria': 'must use print function', 'implementation': '', 'coaching_feedback': '', 'iterations': 0, 'passed': False})
print('REQ-006 OK, passed:', result['passed'])
"
```

---

## Границы (что НЕ делают Players)

- НЕ трогать `tlos-claude-bridge/index.js` или `letta-client.js`
- НЕ менять NATS subjects, уже используемые claude-bridge (`agent:chat`, `agent:token` etc)
- НЕ добавлять HTTP endpoints — только NATS
- НЕ требовать ANTHROPIC_API_KEY — использовать claude CLI subprocess (как claude-bridge)

---

## Распределение по Turn

| Turn | REQ | Исполнитель |
|------|-----|-------------|
| A | REQ-001, REQ-002, REQ-005 | Player A (backend-developer) |
| B | REQ-003, REQ-004 | Player B (backend-developer) |
| C | REQ-006 | Player C (backend-developer) |
