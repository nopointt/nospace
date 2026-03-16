---
# tlos-phase13.md — Phase 13: Agent Team Formation + Product Cycle
> Layer: L3 | Frequency: fast | Epic: phase-13
> Last updated: 2026-03-16 (checkpoint 136 — Content Router design)
---

## Epic Overview

**Goal:** Form permanent agent team. Unlock deferred verification tasks. Begin next product cycle.
**Status:** 🔶 IN PROGRESS
**Entry criteria:** Phase 12 complete ✅
**Exit criteria:** Permanent team formed + all deferred verification tasks unblocked + product cycle initiated.

---

## Track 1 — Agent Team Formation

| Task | Status | Notes |
|---|---|---|
| Form permanent Chiefs × 5 (Agent Teams CLI transport) | [x] | `~/.claude/agents/chief-{domain}.md` × 5 (2026-03-16) |
| Form permanent Leads × 11 (Agent Teams CLI transport) | [x] | `~/.claude/agents/lead-{domain}.md` × 11 (2026-03-16) |
| Claude Code v2.1.32+ verified | [x] | v2.1.76 ✅ |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` enabled | [x] | settings.json env (2026-03-16) |
| Unlock deferred: Design System verification pass | [ ] | Check agent-written files vs all Bauhaus batches |
| Unlock deferred: Domain analysis queue (12 domains) | [ ] | One per session |

---

## Track 2 — Product Cycle

| Task | Status | Notes |
|---|---|---|
| Per-role evaluation framework (AI/ML) | [x] | 12/12 PASS, agent_type+role+auto_quality_score, 5 handlers (2026-03-16) |
| Alembic migration framework | [x] | 7/7 PASS, 14 tables, `upgrade head` deferred to Docker (2026-03-16) |
| God module decomposition: `graph.py` (1603 LOC) | [x] | → 8 files done, Coach 15/15 PASS (2026-03-16) |
| God module decomposition: `bridge_handler.py` (1389 LOC) | [x] | → 9 files done, Coach 15/15 PASS, fixed latent NameError (2026-03-16) |
| MoSCoW classification for 44-item debt backlog | [x] | → 64 items written to `docs/backlog-moscow.md` (2026-03-16) |

---

## Track 3 — Carried from Phase 12 (quick wins)

| Task | Status | Notes |
|---|---|---|
| Add `--tlos-blue` token to design-tokens.css + tailwind.config | [x] | `#3B82F6` added (2026-03-16) |
| Fix `--tlos-border-hover` regression (0.18 < resting 0.22) | [x] | 0.18 → 0.32 (2026-03-16) |
| ADR "why" sections: заполнить агентами | [x] | All 6 ADRs filled (2026-03-16) |

---

---

## Track 4 — Workspace Tooling (Context Router)

| Task | Status | Notes |
|---|---|---|
| JSONL structure research (types, usage, content) | [x] | tool_results only in Messages, no "loaded docs" layer (2026-03-16) |
| Content Router design (not summarizer) | [x] | lossless routing to memory files, concept settled (2026-03-16) |
| Content taxonomy + weights defined | [x] | Read→DROP, assistant text→KEEP, tool_result→DROP first (2026-03-16) |
| Create `memory/why.md` — rationale layer | [ ] | Format: "Why: [decision] + trade-offs + date" |
| Answer 3 Router design questions | [ ] | why.md load timing / router trigger / who writes why.md |
| Write `quota-guard.ts` (UserPromptSubmit hook) | [ ] | L0-L4 budget alerts at +1%/+20%/+50% |
| Write `mem-stop.ts` (Stop hook) | [ ] | trigger at 40k messages, Haiku CLI, save to ~/.tlos/summaries/ |
| Write `mem-session-start.ts` (SessionStart hook) | [ ] | reads last 3 summaries → additionalContext |
| Update `~/.claude/settings.json` — add 3 hooks | [ ] | Stop + SessionStart + UserPromptSubmit |

---

## Blockers

— нет активных блокеров —

## Open Questions

- [ ] Agent Teams: tmux setup — how many panes, layout?
- [ ] MoSCoW backlog: nopoint reviews + prioritizes, or agent drafts first?
- [ ] Content Router: why.md — load at every SessionStart or on-demand?
- [ ] Content Router: trigger timing — PostToolUse / Stop / UserPromptSubmit threshold?
- [ ] Content Router: who writes why.md — router auto or only via checkpoint?
