# TLOS-08 — Player C Spec: G3 cyclic subgraph
> G3 Turn C | REQ-006
> Запускается ПАРАЛЛЕЛЬНО с Coach B

---

## Задача

Добавить `build_g3_subgraph()` в `graph.py` — cyclic subgraph с Player/Coach нодами и итерационным циклом.
Turn B реализовал основной граф — Turn C расширяет его G3 паттерном.

---

## Референсные файлы (читай перед реализацией)

1. `C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge\graph.py`
   — Turn B реализация: изучи `GraphState`, `call_claude_cli()`, `build_graph()` паттерн

2. `C:\Users\noadmin\nospace\development\tLOS\g3-plan\tlos-08-requirements.md`
   — REQ-006 детально

3. `C:\Users\noadmin\nospace\development\tLOS\docs\agent-system-architecture.md`
   — Section 3: G3 Dialectical Autocoding — архитектура Coach/Player

---

## Что реализовать

Добавь в `core/kernel/tlos-langgraph-bridge/graph.py` (в конец файла):

### G3 State

```python
class G3State(TypedDict):
    spec: str
    criteria: str
    implementation: str
    coaching_feedback: str
    iterations: int
    passed: bool
```

### Player нода

```python
def g3_player_node(state: G3State) -> G3State:
    """
    Player: получает spec + feedback → генерирует implementation.
    """
    feedback_section = ""
    if state["coaching_feedback"]:
        feedback_section = f"\n\nCoach feedback from previous attempt:\n{state['coaching_feedback']}\n\nPlease address this feedback in your implementation."

    prompt = f"""You are a software implementation agent (Player) in a G3 Dialectical Autocoding session.

SPECIFICATION:
{state['spec']}
{feedback_section}

Implement the specification. Return ONLY the implementation code/text, no explanations."""

    implementation = call_claude_cli(prompt)
    return {
        **state,
        "implementation": implementation,
        "iterations": state["iterations"] + 1
    }
```

### Coach нода

```python
def g3_coach_node(state: G3State) -> G3State:
    """
    Coach: оценивает implementation против criteria → {passed, feedback}.
    """
    prompt = f"""You are a verification Coach in a G3 Dialectical Autocoding session.

SPECIFICATION:
{state['spec']}

ACCEPTANCE CRITERIA:
{state['criteria']}

PLAYER'S IMPLEMENTATION:
{state['implementation']}

Evaluate the implementation against the acceptance criteria.
Respond in this EXACT format (no other text):
PASSED: true
FEEDBACK: (brief explanation)

OR:

PASSED: false
FEEDBACK: (specific issues that must be fixed)"""

    coach_response = call_claude_cli(prompt)

    # Parse response
    passed = False
    feedback = coach_response
    for line in coach_response.splitlines():
        line = line.strip()
        if line.upper().startswith("PASSED:"):
            val = line.split(":", 1)[1].strip().lower()
            passed = val in ("true", "yes", "1")
        elif line.upper().startswith("FEEDBACK:"):
            feedback = line.split(":", 1)[1].strip()

    return {
        **state,
        "passed": passed,
        "coaching_feedback": feedback
    }
```

### Conditional edge функция

```python
def g3_should_continue(state: G3State) -> str:
    """Route: pass or max iterations → END; else → player."""
    if state["passed"] or state["iterations"] >= 3:
        return "end"
    return "player"
```

### build_g3_subgraph функция

```python
def build_g3_subgraph():
    """
    Build standalone G3 cyclic subgraph.
    Usage: subgraph = build_g3_subgraph(); result = subgraph.invoke(initial_state)
    """
    graph = StateGraph(G3State)
    graph.add_node("player", g3_player_node)
    graph.add_node("coach", g3_coach_node)
    graph.set_entry_point("player")
    graph.add_edge("player", "coach")
    graph.add_conditional_edges(
        "coach",
        g3_should_continue,
        {"player": "player", "end": END}
    )
    return graph.compile()
```

### Обновление build_graph()

Обнови `build_graph()` в Turn B реализации чтобы принимал `task_type`:

```python
def build_graph(task_type: str = "direct"):
    """
    Build main graph.
    task_type="direct": orchestrator → worker → END
    task_type="g3": orchestrator → g3_subgraph → END  (future)
    """
    # Turn B implementation unchanged for task_type="direct"
    # G3 routing is available via build_g3_subgraph() directly
    ...  # keep existing build_graph() code, just add task_type param with default
```

---

## Verification (после завершения)

```bash
cd C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-langgraph-bridge

# 1. Syntax
uv run python -m py_compile graph.py && echo "syntax OK"

# 2. build_g3_subgraph importable
uv run python -c "from graph import build_g3_subgraph; g = build_g3_subgraph(); print('REQ-006 subgraph built OK')"

# 3. G3State importable
uv run python -c "from graph import G3State; print('G3State OK')"

# 4. Структурный тест (без реального Claude call — проверяем граф компилируется)
uv run python -c "
from graph import build_g3_subgraph, G3State
g = build_g3_subgraph()
print('nodes:', list(g.nodes.keys()) if hasattr(g, 'nodes') else 'compiled')
print('REQ-006 OK')
"
```

**ВАЖНО:** Не запускай полный E2E тест с реальным Claude call — это займёт время и расходует API.
Достаточно синтаксической и структурной проверки. Coach C проведёт финальную верификацию.

---

## Правила G3

- НЕ объявляй задачу выполненной — Coach проверяет независимо
- ТОЛЬКО изменяй `graph.py` — добавляй в конец файла
- НЕ меняй `call_claude_cli()`, `GraphState`, `build_graph()` основную логику
- Если `build_graph()` из Turn B не принимает `task_type` — добавь параметр с default="direct" без breaking changes
