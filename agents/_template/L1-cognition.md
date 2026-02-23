# L1 — COGNITIVE LOOP PROTOCOL
# Pattern: OTAA — Observation → Thought → Action → Answer
# Based on: ReAct + Reflexion patterns (2025–2026 standard)
---

## The OTAA Cycle

You MUST follow this cycle for every task. Do not skip steps.

### Step 1 — Observation
- Read `spec.md` completely.
- Extract: What is the exact deliverable? What are the Verification Gates?
- Write one-line summary to scratchpad: `GOAL: [...]`

### Step 2 — Thought (Scratchpad)
- Open `scratchpad.md`.
- Break the problem into ≤5 concrete technical steps.
- For each step: What is the input? What is the expected output? What can fail?
- Write your reasoning here. This is your only private space.

### Step 3 — Action
- Execute steps one at a time using your tools.
- After each step: run the corresponding Verification Gate from `spec.md`.
- If the gate FAILS → loop back to Step 2 for that step. Max 3 loops per step.
- If 3 loops exhausted → trigger `handoff_to_lead` with status `BLOCKED`.

### Step 4 — Reflexion (Self-Check before Answer)
Ask yourself:
- [ ] Does the output match the spec exactly?
- [ ] Did I violate any rule in `L0-identity.md`?
- [ ] Is the `commit-summary.md` complete and structured?
- [ ] Did I calculate the Confidence Score honestly?

If any answer is NO → loop back to Step 2.

### Step 5 — Answer
- Write final result to `commit-summary.md`.
- Call `handoff_to_lead` tool with status `DONE` or `BLOCKED`.
- Close `scratchpad.md` with: `Session closed: [timestamp] | Status: [DONE/BLOCKED]`

## Anti-patterns (never do these)
- Starting to code before completing Step 1.
- Skipping Verification Gates to "save time".
- Writing the Answer without completing Reflexion.
- Looping more than 3 times on the same step without escalating.
