# COMMIT SUMMARY — [branch-name]
> Структурированный handoff-документ. Пишется ОДИН РАЗ при закрытии ветки.
> Источник для `merge_to_semantic` handoff tool.
> Tags: [commit, summary, handoff, tLOS, <feature-area>]

---

## What Was Built

<!-- Один параграф. Что эта ветка добавляет или изменяет в системе? -->

---

## Task Classification — Actuals

> Сравнение плана (из spec.md) с фактом.

| Metric | Planned | Actual | Status |
|---|---|---|---|
| GAIA Level | L? | L? | ✅ / ⚠️ Reclassified |
| Token Budget | ? tokens | ? tokens | ✅ Within / ⚠️ 80-100% / ❌ Exceeded |
| Topology Used | ? | ? | ✅ / ⚠️ Changed |
| HITL Triggered | Yes/No | Yes/No | — |

---

## Verification Gates — Results

| Gate | Command | Result | Loops Needed |
|---|---|---|---|
| 1 | `[gate command from spec.md]` | ✅ PASS / ❌ FAIL | 1 |
| 2 | `[gate command from spec.md]` | ✅ PASS / ❌ FAIL | 1 |

---

## Confidence Score

```
Score: [0-100]

Calculation:
  Base:                                    70
  + All gates passed first attempt:        [+10 or 0]
  + Zero loops back to Thought:            [+10 or 0]
  + Spec was unambiguous (DoR passed):     [+10 or 0]
  - Unresolved TODOs (×10 each):           [-N]
  - Gates requiring 3 loops (×10 each):    [-N]
  - Gates skipped (×20 each):              [-N]
  ─────────────────────────────────────────
  Final:                                   [SUM]

Interpretation:
  90-100 = HIGH   → Tech Lead can fast-track
  70-89  = MEDIUM → standard review
  50-69  = LOW    → deep review + extra QA gate
  < 50   = FAIL   → return to Swarm
```

**Honest assessment:** [One sentence on why you gave this score]

---

## CLEAR Metrics

> task-management-regulation.md §8.

| Metric | Value | Target | Status |
|---|---|---|---|
| **C — Cost** | ? tokens used / ? budget | ≤ 100% | ✅ / ⚠️ / ❌ |
| **L — Latency** | [branch open date → close date] | Cycle Time baseline | ✅ / ⚠️ anomaly |
| **E — Efficacy** | ? gates passed / ? total | 100% | ✅ / ❌ |
| **A — Assurance** | Confidence Score: ? | ≥ 70 | ✅ / ❌ |
| **R — Reliability** | Avg loops per gate: ? | ≤ 1.5 | ✅ / ⚠️ |

**Coordination Tax:** ? tokens on inter-agent communication / ? total = ?%
*(Target: < 30% of task budget. If exceeded — flag for retrospective.)*

---

## Decisions Made

| Decision | Rationale | Alternative Considered |
|---|---|---|
| — | — | — |

---

## New Entities (for Semantic Memory)

```yaml
# Appended to semantic-context-tLOS.md via merge_to_semantic tool.
- Entity: [EntityName]
  Type: [Component | Service | Pattern | Decision | GatePattern]
  Tags: [tag1, tag2, tag3]
  Attributes: —
  Relations:
    - —
  Facts:
    - "—"
  Last_updated: YYYY-MM-DD
  Consolidation_status: new
```

---

## Files Changed

| File | Change Type | Summary |
|---|---|---|
| — | add / modify / archive | — |

---

## Known Risks / Follow-ups

- —

---

## Handoff Checklist

- [ ] All Verification Gates: PASS
- [ ] Confidence Score ≥ 70 (если < 70 — вернуть в Swarm до handoff)
- [ ] Token Usage ≤ Hard Limit
- [ ] CLEAR Metrics заполнены
- [ ] `log-raw.md` финализирован
- [ ] New entity YAML blocks написаны выше
- [ ] **`merge_to_semantic` вызван**
- [ ] `current-context-tLOS.md` обновлён — ветка удалена из Active Epics
