# Bauhaus Design Code — Index
> Last updated: 2026-03-14
> This file is the map. All bauhaus-code files linked here.

## Dual Output Architecture (ADR — 2026-03-14)

The pipeline produces **two parallel outputs** from the same source (14 v3.1 merged files):

| Output | Purpose | Format | Updates |
|---|---|---|---|
| **DESIGN-CODE.md** | Basic rules, audit, machine-checkable verification | Imperative rules + Check commands | Rarely (principles are stable) |
| **Author Personas** | Design work, creativity, complex situations | LLM system prompt (Identity + Framework + Grounding) | Via auto-research |

**Rule:** Personas reason FROM DESIGN-CODE.md, never override it. Principles are frozen; application evolves.

```
14 v3.1 merged files
  ├── Bauhaus Synthesis Agent → DESIGN-CODE.md  (Layer 1: static rules)
  └── Persona Builder Agent  → personas/*.md    (Layer 2: dynamic reasoning)
        └── [grounded in Layer 1] + [auto-research context]
```

**Personas dir (pending):** `nospace/docs/tLOS/design/bauhaus-code/personas/`

---

## Strategy

| File | Purpose |
|---|---|
| [EXTRACTION-PLAN.md](EXTRACTION-PLAN.md) | v3.1 extraction strategy, book manifest, batch maps |
| [DESIGN-CODE-template.md](DESIGN-CODE-template.md) | Template for final guidelines document (fill after all 14 extractions) |
| [../../research/bauhaus-guidelines-structure-research.md](../../research/bauhaus-guidelines-structure-research.md) | Research: how top studios structure design guidelines |

**Final output (pending):** `nospace/docs/tLOS/design/DESIGN-CODE.md`

---

## Extracted Books

### ✅ v3.1 Ready (re-extraction pending — wait for quota)

| # | Author | Status | Output file |
|---|---|---|---|
| 13 | Moholy-Nagy — VMA | ⏳ v3.1 queued (Phase 0 done, 11 semantic batches) | 13-moholy-nagy-material-to-architecture.md |
| 04 | Schlemmer — Bühne | ⏳ v3.1 queued | 04-bauhaus-stage-spatial-interaction.md |
| 14 | Gleizes — Kubismus | ⏳ v3.1 queued | 14-gleizes-kubismus.md |
| 01 | Gropius — Int. Arch. | ⏳ v3.1 queued | 01-gropius-internationale-architektur.md |
| 07 | Gropius — Neue Arbeiten | ⏳ v3.1 queued | 07-gropius-workshop-products.md |
| 10 | Oud — Holländ. Arch. | ⏳ v3.1 queued | 10-oud-dutch-architecture.md |
| 12 | Gropius — Dessau | ⏳ v3.1 queued | 12-gropius-bauhausbauten-dessau.md |
| 03 | Meyer — Versuchshaus | ⏳ v3.1 queued | 03-meyer-experimental-house.md |

### 📦 Archive (v1/v2 — fixed batches, pre-semantic, superseded by v3.1)

> These files are kept for reference and comparison only.
> Do NOT use as input for DESIGN-CODE.md — use v3.1 versions.

| # | Author | Archive file | Lines | Note |
|---|---|---|---|---|
| 09 | Kandinsky | [09-kandinsky-point-line-plane.md](09-kandinsky-point-line-plane.md) | 466 | v1 text extraction |
| 09 | Kandinsky | [09-kandinsky-v2-p1.md](09-kandinsky-v2-p1.md) | 561 | v2 PNG batch part 1 |
| 09 | Kandinsky | [09-kandinsky-v2-p2.md](09-kandinsky-v2-p2.md) | 556 | v2 PNG batch part 2 |
| 09 | Kandinsky | [09-kandinsky-v2-p3.md](09-kandinsky-v2-p3.md) | 979 | v2 PNG batch part 3 |
| 09 | Kandinsky | [09-kandinsky-point-line-plane-v2.md](09-kandinsky-point-line-plane-v2.md) | 1196 | v2 merged (best archive) |
| 11 | Malevich | [11-malevich-non-objective-world.md](11-malevich-non-objective-world.md) | 296 | v1 text extraction |
| 11 | Malevich | [11-malevich-non-objective-world-v2.md](11-malevich-non-objective-world-v2.md) | 663 | v2 PNG (best archive) |
| 05 | Mondrian | [05-mondrian-neue-gestaltung.md](05-mondrian-neue-gestaltung.md) | 415 | v1 text extraction |
| 05 | Mondrian | [05-mondrian-neue-gestaltung-v2.md](05-mondrian-neue-gestaltung-v2.md) | 637 | v2 PNG (best archive) |
| 06 | van Doesburg | [06-van-doesburg-grundbegriffe.md](06-van-doesburg-grundbegriffe.md) | 535 | v2 PNG (best archive) |
| 08 | Moholy-Nagy | [08-moholy-nagy-painting-photo-film.md](08-moholy-nagy-painting-photo-film.md) | 395 | v2 PNG (best archive) |
| 02 | Klee | [02-klee-pedagogical-sketchbook.md](02-klee-pedagogical-sketchbook.md) | 640 | v2 PNG (best archive) |

---

## Specialist Prompts (v3.1)

> One file per book. Contains: author persona, analytical framework, procedure, semantic batch map, merge agent prompt.

| # | File | Batches | Phase 0 |
|---|---|---|---|
| 13 | [specialists/13-moholy-vma-specialist.md](specialists/13-moholy-vma-specialist.md) | 11 semantic | ✅ done |
| 08 | [specialists/08-moholy-mpf-specialist.md](specialists/08-moholy-mpf-specialist.md) | 10 | ⏳ pending |
| 02 | [specialists/02-klee-specialist.md](specialists/02-klee-specialist.md) | 3 | ⏳ pending |
| 04 | [specialists/04-schlemmer-specialist.md](specialists/04-schlemmer-specialist.md) | 5 | ⏳ pending |
| 14 | [specialists/14-gleizes-specialist.md](specialists/14-gleizes-specialist.md) | 3 | ⏳ pending |
| 01 | [specialists/01-gropius-int-arch-specialist.md](specialists/01-gropius-int-arch-specialist.md) | 6 | ⏳ pending |
| 07 | [specialists/07-gropius-neue-arbeiten-specialist.md](specialists/07-gropius-neue-arbeiten-specialist.md) | 6 | ⏳ pending |
| 10 | [specialists/10-oud-specialist.md](specialists/10-oud-specialist.md) | 5 | ⏳ pending |
| 12 | [specialists/12-gropius-dessau-specialist.md](specialists/12-gropius-dessau-specialist.md) | 12 | ⏳ pending |
| 03 | [specialists/03-meyer-specialist.md](specialists/03-meyer-specialist.md) | 3 | ⏳ pending |
| 09 | [specialists/09-kandinsky-specialist.md](specialists/09-kandinsky-specialist.md) | 10 | ⏳ pending |
| 05 | specialists/05-mondrian-specialist.md | — | not created |
| 06 | specialists/06-van-doesburg-specialist.md | — | not created |
| 11 | specialists/11-malevich-specialist.md | — | not created |

---

## Workflow

```
Phase 0 (current): Pre-analysis → semantic batch maps
  ✅ #13 VMA: 11 batches defined
  ⏳ All others: pending (run when quota allows)

Phase 1 (next): v3.1 extraction
  Book by book, 4 agents/wave, merge agent after each book

Phase 2a: Bauhaus Synthesis Agent
  Reads all 14 v3.1 merged files → fills DESIGN-CODE-template.md → DESIGN-CODE.md

Phase 2b: Persona Builder Agent
  Reads all 14 v3.1 merged files → builds author persona prompts → personas/*.md
  Each persona: Identity + Framework (from specialist) + Grounding (from merged file) + Research slot

Phase 3: Design domain team
  Code review / audit → DESIGN-CODE.md
  Design work / creativity / edge cases → author personas
```
