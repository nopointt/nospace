# BRANCH SPEC — [branch-name]
> Tags: [spec, branch, tLOS, <feature-area>]

---

## Task Classification

> Assigned by CTO / Tech Lead before branch opens. Required for DoR.

| Field | Value |
|---|---|
| **GAIA Level** | L1 / L2 / L3 |
| **Token Budget** | 8 000 / 20 000 / 30 000 токенов |
| **Topology** | Single Agent / Orchestrator-Workers / Orchestrator-Workers (max 4) |
| **HITL Checkpoint** | Yes / No — если Yes, указать шаг |

---

## Definition of Ready (DoR)

> CTO / Tech Lead проверяет этот чеклист ПЕРЕД передачей задачи Swarm-агенту.
> Задача с незакрытым DoR к исполнению не допускается.

```
☐ 1. GAIA Level назначен (поле выше заполнено).
☐ 2. Token Budget зафиксирован (поле выше заполнено).
☐ 3. Problem Statement написан — один параграф, без технической двусмысленности.
☐ 4. Acceptance Criteria — верифицируемые условия, не prose.
☐ 5. Все Verification Gates — исполняемые команды или наблюдаемые условия (не prose).
☐ 6. Зависимости разрешены: referenced API/tools в L3-mcp-tools.json.
☐ 7. Секреты/токены для MCP-инструментов выделены через Assistant gateway.
☐ 8. Out of Scope явно определён.
☐ 9. (L3 / Deploy) HITL checkpoint определён.
```

---

## Problem Statement

<!-- Один параграф. Какую проблему пользователя или системы решает эта ветка? -->

---

## Scope

**In scope:**
- —

**Out of scope:**
- —

---

## Acceptance Criteria

- [ ] —
- [ ] —

---

## Architecture Notes

<!-- Архитектурные решения или ограничения специфичные для этой ветки. -->
<!-- Ссылаться на global-constitution или tLOS-constitution при переопределении дефолтов. -->

---

## Dependencies

| Depends On | Type | Status |
|---|---|---|
| — | internal / external | — |

---

## Verification Gates

> CTO пишет эти gates. Swarm-агент ОБЯЗАН пройти каждый gate перед переходом к следующему шагу.
> Gate = исполняемая команда или наблюдаемое условие. Не prose.

| Step | Gate Command / Condition | Expected Result |
|---|---|---|
| 1 | `[e.g., cargo test module_name]` | `0 errors, 0 warnings` |
| 2 | `[e.g., wasm-pack build]` | `artifact < 2MB` |
| 3 | `[e.g., curl endpoint && status == 200]` | `pass` |

**Правило:** Провал gate → вернуться к Thought (максимум 3 попытки) → BLOCKED если не устранено.

---

## Definition of Done (DoD)

- [ ] Все Verification Gates: PASS (зафиксировано в commit-summary.md)
- [ ] Ни одна Gate не пропущена (пропуск = FAIL, возврат в Swarm)
- [ ] Confidence Score ≥ 70
- [ ] Token Usage ≤ Hard Limit (`Task Classification` → Token Budget)
- [ ] `log-raw.md` завершён со всеми решениями и развилками
- [ ] `commit-summary.md` написан: CLEAR-метрики заполнены
- [ ] `merge_to_semantic` вызван — новые сущности в `semantic-context-tLOS.md`
- [ ] `current-context-tLOS.md` обновлён — ветка удалена из Active Epics
