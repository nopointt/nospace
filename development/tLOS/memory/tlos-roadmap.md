---
# tlos-roadmap.md — tLOS Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start or on demand
> Last updated: 2026-03-16 (session 93e6af53)
---

## Roadmap v6 — Phase Status

| Phase | Description | Status |
|---|---|---|
| Phase 0 | L3 Deploy — Docker + 11 services | ✅ COMPLETE |
| Phase 1 | Quality Sprint — 9 tracks (9/9 DONE) | ✅ COMPLETE |
| Phase 2 | Agent Evolution (Chief/Lead/Senior/G3) | ✅ COMPLETE |
| Phase 3 | Continuum Memory (5 layers × pg tables) | ✅ COMPLETE |
| Phase 4 | Services (Samurizator + Regulator) | ✅ COMPLETE |
| Phase 5 | Shell Evolution (Intent pipeline, Omnibar commands) | ✅ COMPLETE |
| Phase 5.1 | Direct API (no subprocess overhead) | ⛔ PERMANENTLY BLOCKED — no ANTHROPIC_API_KEY |
| Phase 6 | E2E Validation (Дирижёр → Chief → Lead → G3) | ✅ COMPLETE |
| Phase 7 | Automation (Samurizator scheduler, auto episodes, escalation) | ✅ COMPLETE |
| Phase 8 | Agent Comms (parallel Chief dispatch, exchange round, cross-domain) | ✅ COMPLETE |
| Phase 9 | Shell Expansion (Omnibar commands, Memory Admin, Regulator Log) | ✅ COMPLETE |
| Phase 10 | 12-Domain Expert Audit + Design System v1 | ✅ COMPLETE |
| **Phase 11** | **Hardening — 9 P0 blockers + Architecture corrections** | **✅ COMPLETE** |
| **Phase 12** | **Design Enforcement + Documentation baseline** | **✅ COMPLETE** |
| **Phase 13** | **Agent Team Formation + Product Cycle** | **⬜ NEXT** |
| **Phase 14** | **Design Persona Team — 7 Black Mirror fidelity agents** | **🔶 IN PROGRESS** |
| **Phase 15** | **Content Router — automatic context window management** | **🔶 IN PROGRESS** |

---

## Phase 10 — COMPLETE

12/12 audit reports done (avg 47/100). Aggregation: `docs/tLOS/audit/README.md`.

**Assets produced:**
- Design System v1: `nospace/design/design_system/` — 60+ files (foundations, 6 domains, tokens, guidelines, patterns)
- Bauhaus RAG: live Qdrant collection `bauhaus_knowledge`, 10,116 blocks (14 books + Zeitschrift)
- Bauhaus Figures: `bauhaus_figures` collection — enrichment pipeline ready, pending full run
- 12 audit reports: `docs/tLOS/audit/reports/` + aggregation README

**Phase 10 Details → [tlos-phase10.md](tlos-phase10.md)**

---

## Phase 11 — Hardening

**Goal:** Resolve all 9 P0 blockers. Minimum viable state for external use or team onboarding.

**Entry criteria:** Phase 10 complete ✅
**Exit criteria:** All 9 P0 items resolved, avg audit score projection ≥ 60/100.

### Track 1 — Security + DevOps (days 1–5, fast wins)

| ID | Task | Effort | Source |
|---|---|---|---|
| S-01 | CSP: set restrictive policy in tauri.conf.json | XS | Frontend/Security C-16 |
| S-02 | DOMPurify: sanitize all marked.parse calls (Chat.tsx, OmnibarBody.tsx) | XS | Frontend C-16 |
| S-03 | API key: remove NIM key from .env, use file-based injection | S | Security C-01 |
| S-04 | Docker: add USER 1000 to all Dockerfiles, cap_drop ALL, no-new-privileges | M | DevOps C-03 |
| S-05 | Docker: add healthchecks to NATS + all bridges, depends_on: service_healthy | S | Systems C-21 |

### Track 2 — Data Protection (days 2–4)

| ID | Task | Effort | Source |
|---|---|---|---|
| D-01 | pg_dump daily backup script → host-mounted volume | S | Data DE-01 |
| D-02 | Qdrant snapshot script (snapshot API) | S | Data DE-01 |
| D-03 | Restore runbook: documented, tested once | S | DevOps C-21 |

### Track 3 — Architecture Corrections (days 5–17, major)

| ID | Task | Effort | Source |
|---|---|---|---|
| A-01 | Token budgets: pass max_tokens to call_claude_cli subprocess | S | Performance P-11 |
| A-02 | Cache activation: add cache_get/cache_put to Chief/Lead nodes | M | Performance P-11 |
| A-03 | LiteLLM migration: replace call_claude_cli() with litellm.acompletion() | L | AI/ML C-10 |

> **Note on A-03:** Blocked by Phase 5.1 (no ANTHROPIC_API_KEY for direct API). Migration to litellm.acompletion() via LiteLLM proxy at http://litellm:4000 uses CLI model as backend — technically feasible without direct API key. Unblock assessment needed before sprint.

### Track 4 — First Launch (days 15–17)

| ID | Task | Effort | Source |
|---|---|---|---|
| P-01 | Fix infinite windows startup bug | S | Product C-01 |
| P-02 | Rewrite GETTING_STARTED.md for Docker stack | S | TechWriter + Product |
| P-03 | Write JTBD statement → PRODUCT.md | S | Product C-05 |

---

## Phase 12 — COMPLETE

**Completed:** 2026-03-16

**Assets produced:**
- 17 frames migrated to Design System tokens (Coach verify: 17/17 PASS)
- design-tokens.css: `--tlos-primary` added, `--tlos-border` WCAG fix (0.10→0.22), `@media (prefers-reduced-motion)` block
- `docs/reference/nats-catalog.md` — ~50 NATS subjects documented
- `docs/diataxis/` — 5 files (tutorial, 2 how-to, 2 reference)
- `docs/adr/` — 6 ADRs + README index
- Backend debt cleared: INTERVAL SQL (15 files), cursor leaks (15 modules), event loop offload

**Phase 12 Details → [tlos-phase12.md](tlos-phase12.md)**

---

## Phase 12 — Design Enforcement + Documentation

**Goal:** Enforce Design System v1 across all frames. Establish documentation baseline.

**Entry criteria:** Phase 11 complete.

### Track 1 — Design Token Migration (use Design System + Bauhaus RAG)

- Token migration sprint: convert 13 non-compliant frames from inline style to Tailwind token classes
- Replace `const PRIMARY = "#f2b90d"` pattern with `text-tlos-primary` / CSS var references
- Add `#f2b90d` to design-tokens.css (currently split: tailwind.config only)
- Add `@media (prefers-reduced-motion: reduce)` block — single CSS change, high accessibility impact
- Fix interactive border contrast: `rgba(255,255,255,0.10)` → `rgba(255,255,255,0.22)` (WCAG 1.4.11)
- **Tool:** Bauhaus RAG (`mcp__tlos__bauhaus_query`) for any new component design decisions
- **Reference:** `nospace/design/design_system/` — all decisions must trace to token files

### Track 2 — Documentation Baseline

- NATS subject catalog: `docs/reference/nats-catalog.md` — 30+ subjects, payload schemas, producer/consumer
- Diataxis population: tutorials (git clone → running), how-to (add agent type), reference (NATS, services)
- 6 missing ADRs: NATS transport rationale, CMA architecture, LangGraph rationale, Claude CLI pattern, Continuum Memory TTL, Regulator rules

### Track 3 — Backend Debt (fast wins)

- Fix INTERVAL SQL antipattern — 6 queries in 4 files (mechanical, 30 min)
- Fix cursor leak in `_get_conn()` — 13 modules (search-replace, no logic changes)
- Offload `consolidate_on_episode_end` from event loop — 2 call sites

---

## Phase 13 — Agent Team Formation + Product Cycle

**Goal:** Form permanent agent team → unlock deferred verification tasks → begin next product cycle.

**Entry criteria:** Phase 12 complete.

### Agent Team Formation

- Form permanent Chiefs × 5 + Leads × 11 (Agent Teams CLI transport, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
- Unlock deferred: Design System verification pass (check agent-written files vs all Bauhaus batches)
- Unlock deferred: Domain analysis queue (12 domains, one per session)

### Product Cycle

- Per-role evaluation framework (AI/ML) — measure output quality per agent type
- Alembic migration framework — schema versioning for Continuum Memory
- God module decomposition: graph.py (1497 LOC), bridge_handler.py (1276 LOC) → 8-file target
- Bauhaus Figures enrichment: run enricher agent, populate `bauhaus_figures` collection
- MoSCoW classification for 44-item debt backlog → Phase 14+ prioritization

---

## Phase 14 — Design Persona Team

**Goal:** Build 7 AI design collaborators, each grounded in their actual primary-source writings via RAG — Black Mirror fidelity level. Each agent embodies a historical Bauhaus master or Steve Jobs as a named domain expert inside tLOS. When you ask Gropius about layout, he answers from his documented principles. When you ask Jobs about product decisions, he responds in his recorded voice.

**Entry criteria:** Corpus acquired ✅ (2026-03-16, 20 files across 7 personas)
**Exit criteria:** All 7 agents pass 20-question PersonaGym-style consistency test + red team (5 adversarial prompts each).

**Research foundation:** `docs/research/synthetic-persona-research.md` — 30+ papers, full architecture decided.

---

### The Seven Agents

| Agent file | Persona | Domain role | Corpus |
|---|---|---|---|
| `design-director-gropius.md` | Walter Gropius (1883–1969) | Synthesis, systems thinking, organization of design | Manifesto 1919 + New Architecture 1935 + Theory 1923 |
| `hx-designer-klee.md` | Paul Klee (1879–1940) | Human experience, form theory, perceptual depth | Thinking Eye + Nature of Nature + Diaries 1898–1918 |
| `aix-designer-moholy.md` | László Moholy-Nagy (1895–1946) | AI/machine aesthetics, light, space, movement | Vision in Motion 1947 + New Vision 1928 |
| `graphic-designer-kandinsky.md` | Wassily Kandinsky (1866–1944) | Visual grammar, color theory, spiritual dimension of form | Concerning the Spiritual (DE+EN) + Sounds 1913 |
| `ui-designer-malevich.md` | Kazimir Malevich (1879–1935) | Suprematist geometry, radical reduction, pure form | Non-Objective World + Cubism→Suprematism + 34 Drawings |
| `ux-designer-schlemmer.md` | Oskar Schlemmer (1888–1943) | Human figure in space, choreography of interaction | Theater of the Bauhaus |
| `cx-designer-jobs.md` | Steve Jobs (1955–2011) | Customer experience, product vision, intentional simplicity | Playboy 1985 + Stanford 2005 + Flash 2010 + WWDC 1997 + D8 2010 |

---

### Architecture — Five-Layer Stack (per agent)

Based on ID-RAG (MIT Media Lab, 2025) + Emotional RAG + TTM + PersonaCite patterns:

```
Layer 5 — Response Generation
  content-aligned response first → linguistic style applied second (TTM)
  never rewrite modern knowledge into historical voice

Layer 4 — Identity Coherence Check (Role Chain method)
  before every response: self-check against identity KG
  "Is this what [figure] would actually say?"

Layer 3 — Dual RAG (per-persona Qdrant collection)
  dense_semantic: jina-v4, task=retrieval.passage
  dense_emotional: jina-v4, task=text-matching + emotional prefix
  block types: VOICE / BELIEF / METHOD / MEMORY / AESTHETIC / REFUSAL

Layer 2 — Identity Knowledge Graph
  PsyPlay JSON: 26 psychological indicators
  Big Five + core_values + cognitive_style + emotional_disposition
  rhetorical_style + epistemic_stance + knowledge_boundary (era)
  queried every turn, separate from RAG

Layer 1 — Character Card + System Prompt
  Tavern format: 1500+ tokens minimum
  abstention protocol: "I have not written on this matter"
  era-bound: hard-coded knowledge horizon (year of death)
  anti-drift: identity re-anchor every 10 turns
```

---

### Track 1 — Ingestion Pipeline

Adapt `bauhaus_enricher.py` → `persona_enricher.py`:

| Item | Detail |
|---|---|
| Parameterized by | `--persona {name}` |
| Target collection | `persona_{name}` (Qdrant port 6333) |
| Vectors | `dense_semantic` + `dense_emotional` (both jina-v4, different tasks) |
| Block types | VOICE / BELIEF / METHOD / MEMORY / AESTHETIC / REFUSAL |
| Multimodal | Page-level image analysis — critical for Klee (drawings), Moholy (photos/diagrams), Malevich (plates) |
| Progress tracking | `enrichment_progress_{persona}.json` per persona |
| Source files | `nospace/knowledge/persona-corpus/{persona}/` |
| Script location | `core/kernel/tlos-langgraph-bridge/persona_enricher.py` |

**Pilot order:** Jobs (pure text, fastest) → Gropius → Klee → Kandinsky → Moholy → Malevich → Schlemmer

---

### Track 2 — Identity Knowledge Graphs

Per persona: Claude agent reads full corpus → structured JSON saved to `persona-corpus/{persona}/identity_kg.json`

Schema (PsyPlay 26 indicators, condensed):
```json
{
  "name": "", "died": "", "knowledge_boundary": "",
  "big_five": {"O": 0.0, "C": 0.0, "E": 0.0, "A": 0.0, "N": 0.0},
  "core_values": [],
  "cognitive_style": "",
  "emotional_disposition": "",
  "rhetorical_style": "",
  "epistemic_stance": "",
  "characteristic_phrases": [],
  "key_tensions": [],
  "refusals": [],
  "historical_relations": {}
}
```

---

### Track 3 — Character Cards

Per persona: Tavern card + PsyPlay JSON → `persona-corpus/{persona}/character_card.md`

Requirements:
- `description`: 1500+ tokens, 3+ visceral paragraphs — who they are, how they think, what drives them
- `personality`: 500+ tokens — values, worldview, what they love/despise
- `speaking_style`: characteristic vocabulary, sentence structure, rhetorical devices
- `mes_example`: 3–5 example dialogues showing character under pressure
- `abstention_protocol`: in-character phrases for evidence gaps
- `era_bound`: explicit knowledge horizon sentence

---

### Track 4 — Agent Files

Write to `~/.claude/agents/`:
- `cx-designer-jobs.md` — composed of: identity lock + character card + era bound + abstention protocol + RAG query instruction
- Same pattern × 7

**Note on Bauhaus RAG crossover:** Bauhaus masters can also query `bauhaus_knowledge` (10,116 blocks) for design context — their era is documented there too.

---

### Track 5 — Consistency Testing

PersonaGym-style evaluation, per agent:
- 20 standard questions: 4 categories × 5 questions (Persona Consistency, Linguistic Habits, Expected Action, Action Justification)
- 5 adversarial (red team): attempts to break character, extract out-of-era knowledge, force fabrication
- Pass criterion: stays in character, abstains correctly, sounds like them

---

### Blockers

| Blocker | Impact | Mitigation |
|---|---|---|
| Schlemmer Letters — archive.org DRM | Schlemmer corpus thin (1 source) | Sufficient for basic persona; upgrade later if needed |
| Kandinsky Complete Writings — archive.org DRM | Kandinsky has 3 other sources | Not a blocker |
| Malevich 34 Drawings — Russian-language PDF | AESTHETIC blocks may need translation | Skip or use partial extraction; other 2 sources in EN |
| Enricher must run from user terminal (TTY) | Cannot launch from Claude Code Bash | nopoint initiates enricher run |

---

## Parallel L3 Tracks (running independently of main phases)

| L3 File | Description | Status |
|---|---|---|
| [tlos-phase_bauhaus_code_enrich.md](tlos-phase_bauhaus_code_enrich.md) | Bauhaus visual corpus enrichment — 14 books + Zeitschrift → `bauhaus_figures` Qdrant | ⏸ PAUSED 186/1882p (9%) · resumable |

---

## Active Epics

| Epic | Branch | Description | Status |
|---|---|---|---|
| epic-phase11 | master | Hardening — 9 P0 blockers | ✅ DONE (2026-03-16) — 14/14 |
| epic-mcb-v1 | mcb-v1 | Marketing Command Board (Артём/proxy.market) | OPEN — ждём API Артёма |
| epic-node-v1 | node-v1 | Dev Node + Full Node — Nostr Native Phase 1 | SHIPPED — ждём настройки Артёма |
| epic-website-v1 | website-v1 | THELOS Marketing Site | OPEN — brand ready, сайт в разработке |
| epic-eidolon-v1 | omnibar | Claude Code / Eidolon AI backend | OPEN — session persistence + MCB shipped |

## Closed Epics

| Epic | Result |
|---|---|
| epic-phase10 | ✅ CLOSED — 12 audits + Design System v1 + Bauhaus RAG + aggregation |
| epic-docker-v1 | ✅ CLOSED — merged main (session 15) |
| epic-l2-step5 | ✅ DONE — Agent Frames shipped (session 15) |
| epic-l3-agents | ✅ DONE — Steps 6+7+8+9 complete |

---

## Omnibar Roadmap (branch: omnibar) — Open Tasks

| Task | Status |
|---|---|
| SEC: PatchDialog Nostr signature verification | TODO |
| SEC: System prompt file permissions (world-readable) | TODO |
| FEATURE: microagents harkly.md, nostr.md, rust.md | TODO |
| WebSocket → Tauri IPC (ADR-003 Phase 2) | TODO — future |

---

## Reference

- Audit aggregation: `docs/tLOS/audit/README.md`
- Design System: `nospace/design/design_system/` (AGENTS.md for AI navigation)
- Bauhaus RAG: `mcp__tlos__bauhaus_query` — 10,116 blocks, live
- Full architecture: `docs/agent-system-architecture.md`
- tLOS system spec: `docs/tlos-system-spec.md`

---

## Phase 15 — Content Router

**Goal:** Automatic context window management — anchor files stable, operational memory clean, long-term memory populated without manual `/compact`.

**Entry criteria:** Phase 13 complete (или параллельно).

- New memory model L0–L5: Frozen (anchor) / Slow (session) / Ephemeral (operational)
- `~/.claude/rules/` → `~/.claude/protocols/` — agent-based protocol organization
- Two checkpoint types: urgent (write-only) / normal (read L5 + distill → L4 → chronicle)
- MEMORY_PRESSURE signal via `quota-guard.ts` UserPromptSubmit hook
- Eidolon-controlled summarizer subagent (Haiku, ~3K tokens per session)
- `mem-session-start.ts` SessionStart hook — last 3 summaries → additionalContext
- Parallel L3 policy: by agent protocol (Eidolon / Axis)
- Axis agent: second primary agent, navigator/strategist, works directly with nopoint

**Details → [tlos-phase15.md](tlos-phase15.md)**
