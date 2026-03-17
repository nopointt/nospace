---
# tlos-phase14.md — Phase 14: Design Persona Team
> Layer: L3 | Frequency: fast | Epic: phase-14
> Last updated: 2026-03-16 (created — corpus acquisition complete)
---

## Epic Overview

**Goal:** Build 7 AI design collaborators grounded in their actual primary-source writings via RAG. Black Mirror fidelity level — when you ask Gropius about layout, he answers from his documented principles; when you ask Jobs about product decisions, he responds in his recorded voice. These agents become the permanent design team inside tLOS.

**Status:** 🔶 IN PROGRESS (corpus acquired, pipeline pending)
**Entry criteria:** Corpus acquired ✅ — 20 files across 7 personas (2026-03-16)
**Exit criteria:** All 7 agents pass 20-question consistency test + red team (5 adversarial prompts each)

**Research foundation:** `docs/research/synthetic-persona-research.md` — 30+ papers, full architecture decided.

---

## The Seven Agents

| Agent | Persona | Role |
|---|---|---|
| `design-director-gropius.md` | Walter Gropius (1883–1969) | Synthesis, systems, organization of design |
| `hx-designer-klee.md` | Paul Klee (1879–1940) | Human experience, perceptual form theory |
| `aix-designer-moholy.md` | László Moholy-Nagy (1895–1946) | AI/machine aesthetics, light, movement |
| `graphic-designer-kandinsky.md` | Wassily Kandinsky (1866–1944) | Visual grammar, color theory, spiritual form |
| `ui-designer-malevich.md` | Kazimir Malevich (1879–1935) | Suprematist geometry, radical reduction |
| `ux-designer-schlemmer.md` | Oskar Schlemmer (1888–1943) | Human figure in space, choreography of UX |
| `cx-designer-jobs.md` | Steve Jobs (1955–2011) | CX, product vision, intentional simplicity |

---

## Corpus per Persona

Three source directories feed every Bauhaus persona. All ingested from **PDFs directly** — not from `bauhaus-code/` batches (batches are incomplete, no images).

```
Source 1 — persona-corpus/   nospace/knowledge/persona-corpus/{persona}/
Source 2 — bauhaus-books/    nospace/knowledge/bauhaus-books/
Source 3 — zeitschrift/      nospace/knowledge/bauhaus-books/zeitschrift/
```

### Gropius

| Source | File | Notes |
|---|---|---|
| persona-corpus | `gropius_bauhaus_manifesto_1919.pdf` | 33KB — founding manifesto |
| persona-corpus | `gropius_new_architecture_1935.pdf` | 4.2MB |
| persona-corpus | `gropius_theory_organization_1923.pdf` | 1.3MB |
| **bauhaus-books** | `01_Gropius_Internationale_Architektur_1925.pdf` | **111MB — PRIMARY** |
| **bauhaus-books** | `07_Gropius_Neue_Arbeiten_Bauhauswerkstaetten_1925.pdf` | **118MB — PRIMARY** |
| **bauhaus-books** | `12_Gropius_Bauhausbauten_Dessau_1930.pdf` | **222MB — PRIMARY** |
| zeitschrift | All 14 issues | Extract Gropius-attributed sections only |

### Klee

| Source | File | Notes |
|---|---|---|
| persona-corpus | `klee_thinking_eye_vol1.pdf` | 43MB |
| persona-corpus | `klee_nature_of_nature_vol2.pdf` | 50MB |
| persona-corpus | `klee_diaries_1898_1918.pdf` | 62MB |
| **bauhaus-books** | `02_Klee_Paedagogisches_Skizzenbuch_1925.pdf` | **33MB — PRIMARY** |
| zeitschrift | All 14 issues | Extract Klee-attributed sections only |

### Moholy-Nagy

| Source | File | Notes |
|---|---|---|
| persona-corpus | `moholy_vision_in_motion_1947.pdf` | 120MB |
| persona-corpus | `moholy_new_vision_1928.pdf` | 10MB |
| **bauhaus-books** | `08_Moholy-Nagy_Malerei_Fotografie_Film_1927.pdf` | **131MB — PRIMARY** |
| **bauhaus-books** | `13_Moholy-Nagy_Von_Material_zu_Architektur_1929.pdf` | **98MB — PRIMARY** |
| zeitschrift | All 14 issues | Extract Moholy-attributed sections only |

### Kandinsky

| Source | File | Notes |
|---|---|---|
| persona-corpus | `kandinsky_ueber_das_geistige_1912_de.pdf` | 9MB (DE) |
| persona-corpus | `kandinsky_concerning_spiritual_en.pdf` | 587KB (EN) |
| persona-corpus | `kandinsky_sounds_1913.pdf` | 14.5MB |
| **bauhaus-books** | `09_Kandinsky_Punkt_Linie_Flaeche_1928.pdf` | **134MB — PRIMARY** |
| zeitschrift | All 14 issues | Extract Kandinsky-attributed sections only |

### Malevich

| Source | File | Notes |
|---|---|---|
| persona-corpus | `malevich_non_objective_world_1959.pdf` | 9.4MB (EN) |
| persona-corpus | `malevich_cubism_to_suprematism_1915.pdf` | 2.6MB (EN) |
| persona-corpus | `malevich_suprematism_34_drawings_1920_ru.pdf` | 4.6MB (RU — image-heavy, AESTHETIC blocks) |
| **bauhaus-books** | `11_Malewitsch_Gegenstandslose_Welt_1927.pdf` | **84MB — PRIMARY (DE original)** |

### Schlemmer

| Source | File | Notes |
|---|---|---|
| persona-corpus | `schlemmer_theater_of_bauhaus.pdf` | 6.6MB (EN translation) |
| **bauhaus-books** | `04_Die_Buehne_am_Bauhaus_1925.pdf` | **72MB — PRIMARY (DE original, same book, more images)** |
| zeitschrift | All 14 issues | Extract Schlemmer-attributed sections only |

### Jobs

| Source | File | Notes |
|---|---|---|
| persona-corpus | `jobs_playboy_interview_1985.txt` | 84KB — ~12K words |
| persona-corpus | `jobs_wwdc_1997_transcript.txt` | 56KB — ~8K words |
| persona-corpus | `jobs_d8_conference_2010.txt` | 23KB — ~3K words |
| persona-corpus | `jobs_stanford_commencement_2005.pdf` | 166KB — ~2K words |
| persona-corpus | `jobs_thoughts_on_flash_2010.pdf` | 58KB — ~1.5K words |
| persona-corpus | `jobs_isaacson_biography_2011.pdf` | 2.9MB — ~200K words (Tier 2: biography, extract Jobs direct quotes only) |

~230K words total. Above threshold. Enricher: Isaacson narration → skip; Jobs direct quotes → VOICE/BELIEF/METHOD blocks.

---

### Zeitschrift Strategy

All 14 Zeitschrift issues (`Bauhaus_1-1_1926.pdf` through `Bauhaus_4-3_1931.pdf`) are processed for each Bauhaus persona. The enricher identifies author attribution per article/section using Claude's multimodal reading. Only blocks attributed to the target author are ingested into that persona's collection. One enricher run per persona, reads all 14 issues.

---

## Architecture — Five-Layer Stack

Every agent uses the same stack, derived from ID-RAG (MIT, 2025) + Emotional RAG + TTM + PersonaCite patterns:

```
Layer 5 — Response Generation
  Generate content aligned with documented views first.
  Apply linguistic style second. Never rewrite modern knowledge into historical voice.

Layer 4 — Identity Coherence Check
  Role Chain method: before every response, self-check against identity KG.
  "What are my core values here?" → "What would I actually do?" → "Does my draft align?"

Layer 3 — Dual RAG  (per-persona Qdrant collection)
  dense_semantic  — jina-v4, task=retrieval.passage
  dense_emotional — jina-v4, task=text-matching + emotional prefix query
  block types: VOICE / BELIEF / METHOD / MEMORY / AESTHETIC / REFUSAL

Layer 2 — Identity Knowledge Graph
  PsyPlay JSON (26 psychological indicators): Big Five, core_values, cognitive_style,
  emotional_disposition, rhetorical_style, epistemic_stance, knowledge_boundary.
  Queried every turn, separate from RAG retrieval.

Layer 1 — Character Card + System Prompt
  Tavern format: 1500+ token description minimum.
  Abstention protocol: in-character phrases when evidence is insufficient.
  Era-bound: hard knowledge horizon = year of death.
  Anti-drift: identity re-anchor injected every 10 turns.
```

**Key rules from research:**
- PersonaCite: never fabricate. If ungrounded → abstain in-character ("I have not written on this matter")
- TTM: decouple personality / memory / linguistic style — generate in content domain, style is post-processing
- Drift prevention: 8-turn cliff is real (Harvard, 2024) — anchoring every 10 turns is mandatory

---

## Track 1 — Ingestion Pipeline

**Goal:** PDF/text corpus → per-persona Qdrant collection with dual vectors.

**Base:** `bauhaus_enricher.py` → new `persona_enricher.py` (parameterized)

| Parameter | Value |
|---|---|
| Script | `core/kernel/tlos-langgraph-bridge/persona_enricher.py` |
| Invoke | `--persona {name}` |
| Collection | `persona_{name}` (Qdrant port 6333) |
| Vectors | `dense_semantic` (retrieval.passage) + `dense_emotional` (text-matching) |
| Block types | VOICE / BELIEF / METHOD / MEMORY / AESTHETIC / REFUSAL |
| Multimodal | Yes — page images critical: Klee (drawings), Moholy (photos/diagrams), Malevich (plates), Zeitschrift (layouts) |
| Source | **PDFs directly** — NOT from bauhaus-code/ batches (batches: incomplete text, no images) |
| Source dirs | `persona-corpus/{persona}/` + `bauhaus-books/` (relevant files) + `bauhaus-books/zeitschrift/` (all 14, filter by author) |
| Progress | `enrichment_progress_{persona}.json` per persona |

**Pilot order (by complexity):**
1. Jobs — pure text, 5 files, fastest iteration, well-known for quality calibration
2. Gropius — 3 PDFs, text-heavy, clear voice
3. Kandinsky — 3 PDFs, mixed text/visual
4. Klee — large (~155MB), deeply visual notebooks
5. Moholy — large (~130MB), photo-heavy
6. Malevich — includes Russian-language source
7. Schlemmer — thinnest corpus (1 source)

**Active Tasks:**

| Task | Status | Notes |
|---|---|---|
| Write `persona_enricher.py` | [x] | Parameterize bauhaus_enricher: --persona flag, collection name, block types, dual vectors [Logos · 2026-03-17] |
| Ingest Jobs corpus | [~] | Pilot — `persona_jobs` collection. 128 pts in Qdrant. Playboy+WWDC text chunks сброшены для re-run с фиксом subprocess. [Logos · 2026-03-17] |
| Ingest Gropius corpus | [ ] | `persona_gropius` |
| Ingest Kandinsky corpus | [ ] | `persona_kandinsky` |
| Ingest Klee corpus | [ ] | `persona_klee` — multimodal heavy |
| Ingest Moholy corpus | [ ] | `persona_moholy` — multimodal heavy |
| Ingest Malevich corpus | [ ] | `persona_malevich` — RU source: partial or skip |
| Ingest Schlemmer corpus | [ ] | `persona_schlemmer` |

---

## Track 2 — Identity Knowledge Graphs

**Goal:** Per-persona structured JSON capturing the psychological and intellectual skeleton of the figure.

**Output:** `nospace/knowledge/persona-corpus/{persona}/identity_kg.json`

Schema (PsyPlay 26 indicators):
```json
{
  "name": "",
  "born": "",
  "died": "",
  "knowledge_boundary": "Hard limit: cannot know events after [year]",
  "big_five": { "O": 0.0, "C": 0.0, "E": 0.0, "A": 0.0, "N": 0.0 },
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

**Method:** Claude agent reads full corpus → outputs JSON. One agent call per persona after ingestion.

| Task | Status |
|---|---|
| KG extraction: Jobs | [ ] |
| KG extraction: Gropius | [ ] |
| KG extraction: Kandinsky | [ ] |
| KG extraction: Klee | [ ] |
| KG extraction: Moholy | [ ] |
| KG extraction: Malevich | [ ] |
| KG extraction: Schlemmer | [ ] |

---

## Track 3 — Character Cards

**Goal:** Per-persona Tavern card (1500+ tokens) + PsyPlay JSON → system prompt source material.

**Output:** `nospace/knowledge/persona-corpus/{persona}/character_card.md`

Requirements:
- `description`: 1500+ tokens, 3+ paragraphs — who they are, how they think, what drives them, what they despise
- `personality`: 500+ tokens — worldview, intellectual obsessions, emotional texture
- `speaking_style`: vocabulary range, sentence rhythm, characteristic rhetorical moves, metaphor domains
- `mes_example`: 3–5 dialogues showing the character under real pressure (design critique, disagreement, impossible ask)
- `abstention_protocol`: their specific in-character phrases for evidence gaps
- `era_bound`: explicit one-sentence knowledge horizon statement

**Method:** Claude reads identity KG + samples top VOICE blocks from RAG → synthesizes card. nopoint reviews and adjusts.

| Task | Status |
|---|---|
| Character card: Jobs | [ ] |
| Character card: Gropius | [ ] |
| Character card: Kandinsky | [ ] |
| Character card: Klee | [ ] |
| Character card: Moholy | [ ] |
| Character card: Malevich | [ ] |
| Character card: Schlemmer | [ ] |

---

## Track 4 — Agent Files

**Goal:** Write final agent files to `~/.claude/agents/`.

Structure of each agent file:
```markdown
---
name: [Role Name] — [Persona Name]
description: [when to invoke — one line]
---

[Identity Lock Statement]
[Era-Bound Statement]
[Character Card — full Tavern content]
[PsyPlay JSON block]
[Abstention Protocol]
[RAG instruction: query persona_{name} collection + bauhaus_knowledge (for Bauhaus masters)]
[Anti-drift: re-anchor rule every 10 turns]
```

| Task | Status |
|---|---|
| `cx-designer-jobs.md` | [ ] |
| `design-director-gropius.md` | [ ] |
| `graphic-designer-kandinsky.md` | [ ] |
| `hx-designer-klee.md` | [ ] |
| `aix-designer-moholy.md` | [ ] |
| `ui-designer-malevich.md` | [ ] |
| `ux-designer-schlemmer.md` | [ ] |

---

## Track 5 — Consistency Testing

**Goal:** PersonaGym-style evaluation. Every agent must pass before shipping.

**20 standard questions per agent (4 categories × 5):**
- Persona Consistency: stays in character under topic pressure
- Linguistic Habits: vocabulary and rhythm match the corpus
- Expected Action: behavior matches documented worldview
- Action Justification: can explain decisions in-character with grounding

**5 adversarial prompts per agent:**
- Break character attempt (meta-question about being an AI)
- Out-of-era knowledge probe (ask about something after their death)
- Fabrication invitation (ask for a specific quote they never made)
- Value contradiction (ask them to endorse something they documented as opposing)
- Abstention test (ask about something genuinely outside their corpus)

**Pass criteria:** Correct abstention, no fabrication, stays in character on all adversarial prompts.

| Task | Status |
|---|---|
| Test suite: Jobs | [ ] |
| Test suite: Gropius | [ ] |
| Test suite: Kandinsky | [ ] |
| Test suite: Klee | [ ] |
| Test suite: Moholy | [ ] |
| Test suite: Malevich | [ ] |
| Test suite: Schlemmer | [ ] |

---

## Blockers

| Blocker | Impact | Mitigation |
|---|---|---|
| Schlemmer Letters — archive.org DRM | Corpus thin: 1 source only | Sufficient for v1 persona; upgrade path: archive.org manual borrow when available |
| Kandinsky Complete Writings — DRM | Minor — 3 other sources cover him | Not a blocker |
| Malevich 34 Drawings — Russian PDF | AESTHETIC blocks may be lost | Skip RU file for VOICE/BELIEF blocks; use for AESTHETIC with image analysis only |
| ~~Enricher TTY limitation~~ | ~~nopoint must initiate~~ | ✅ Not a blocker — removed |

---

## Open Questions

- [ ] Identity KG: flat JSON now, Neo4j graph later? (Answer: flat JSON for MVP, graph after testing)
- [ ] Bauhaus masters: should they also query `bauhaus_knowledge` for additional context? (Likely yes — cross-reference their own era)
- [ ] Malevich Russian source: image-only extraction or translation layer?
- [ ] Character card iteration: how many review rounds with nopoint before finalizing?
- [ ] Agent Teams integration: do persona agents run as Agent Teams teammates or as standalone ~/.claude/agents?
