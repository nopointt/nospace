---
name: mascot_meme_decisions_log
description: Эволюция канона маскота Meme. v1 → v7 с датами, контекстом, причинами. Каждое решение с timestamp, источником, кто approved.
type: reference
version: append-only
locked: append-only (entries only, never deleted)
---

# Meme — Decisions Log

> Append-only журнал. Каждое решение фиксируется здесь с датой, контекстом, причиной, кто approved. Never delete entries — corrections добавляются как новые entries referencing original.

## Эволюция версий

### v1 — Glowing neon yellow whole body

**Date:** 2026-04 (early sessions)

**Context:** Первичный референс — Jerry-the-counselor из Pixar «Soul» — neon-outline 2D abstract figure, копающийся в картотеке душ. Первая итерация Meme пытались reproduce этот aesthetic.

**Form:** Bracket pair `[ ]` glowing entirely в neon yellow color (близко к #FFD700 saturated).

**Rejected:** Слишком близко к Soul Jerry visually. Brand identity не distinguishable. Neon style territories already saturated в tech mascot landscape.

**Lesson:** Visual references need distance from inspiration. Brand asset must be uniquely Contexter, not derivative.

### v2 — Solid bronze, no glow

**Date:** 2026-04 (mid-development)

**Context:** Reaction к v1 «too neon» — went opposite direction. Solid aged bronze без any luminescence.

**Form:** Bracket pair в solid bronze, matte aged surface, no patina, no glow.

**Rejected:** Too dead, too static. Lost «alive» reading. Looked like museum artifact frozen в time, не living mascot.

**Lesson:** Static can read as dead. Some signal of «aliveness» needed for mascot. Pure material truth without animation/light = lifeless.

### v3 — Cool glow + warm highlights

**Date:** 2026-04 (mid-development)

**Context:** Hybrid attempt — bronze base с cool glow accent. First exploration of dual-color material concept.

**Form:** Bronze body с cool glow (cyan tint) на surfaces + warm highlights from key light. Glow distributed somewhat uniformly.

**Rejected:** «Almost» — direction promising но glow distribution неъlogical. Patina concept не yet introduced. Glow felt arbitrary, not grounded в material.

**Lesson:** Glow needs physical source / habitat. Random glow distribution unconvincing. Grounding glow в specific material chemistry would help.

### v4 — Bronze body + bioluminescent patina (LOCKED)

**Date:** 2026-04-26 (session 253 morning)

**Context:** Breakthrough — patina concept introduced как physical home for glow. Bronze stays material (calm, weighty), patina accents с bioluminescent organism. Dual reading achieved: «бронза = старик-хранитель / patina-свет = ребёнок-любопытство».

**Form:** Bronze base + verdigris patina patches + cyan-teal bioluminescent glow inside patina + 60-70% patina coverage initially.

**Approved:** nopoint approval after seeing first iterations. Material grammar finally honest. Physical realism (verdigris IS copper oxidation, IS source of bioluminescent reading) gives material truth foundation.

**Locked decision:** D-CTX15-15 (form) + D-MATERIAL-04 (bronze body + bioluminescent patina canonical). See `nospace/development/contexter/memory/STATE.md` for full decision IDs.

**Lesson:** Material concept must be physically coherent. Verdigris-as-bioluminescent-habitat is satisfying because it has natural-world precedent (corroded metals + lichen / phosphorescent moss).

### v5 — Inverse (glowing bronze + still patina)

**Date:** 2026-04-26 (session 253 afternoon)

**Context:** Quick exploration of inversion — what if bronze glowed and patina stayed neutral?

**Form:** Bronze body emissive (warm glow), patina static cyan-teal mineral.

**Rejected:** Inversion violated semantic logic. Bronze = old material / static / memory. Patina = young / alive / curiosity. Inverting means старик becomes more luminous than ребёнок — contradicts dual personality narrative. Also less visually attractive.

**Lesson:** Material assignments are semantic, not interchangeable. Each material carries character meaning.

### v6 — Form locked (brackets + face above + bracket X-axis talk)

**Date:** 2026-04-26 (session 253 afternoon)

**Context:** Beyond material — needed to lock complete form spec including face и talk animation. Crucial decision: keep mouth or remove.

**Decisions:**
- Form locked as: two `[ ]` brackets + minimal face floating above (eye-dots only)
- Mouth removed permanently
- Talk animation works через bracket X-axis separation (см. `motion-talk-animation.md`)

**Approved:** nopoint approval. Concept of «awareness above brackets» established. No-mouth design grounded in:
1. Brand discipline — character through structure not facial expression
2. Production stability — no lip sync failure mode
3. Bauhaus Sparing pillar — minimum elements for maximum character

**Locked decision:** D-CTX15-15 expanded to include no-mouth + talk animation.

**Lesson:** Form decisions cascade. Removing mouth required new talk mechanic — discovered bracket X-axis separation works beautifully. Constraint generated invention.

### v7 — Current canonical (3-layer eyes + ≤30% patina + L2 glow)

**Date:** 2026-04-26 (session 254)

**Context:** R-02 isolation reference development. nopoint feedback during pilot iterations led к specific refinements.

**Decisions emerging from session 254 R-02 development:**

- **D-CANON-EYES-01:** 3-layer eye structure introduced (bronze rim → white iris → black pupil). Previous v6 had «solid bronze dots» — feedback indicated lacking expressivity. 3-layer construction added expressive surface (white iris) and directional indicator (black pupil) without violating «no mouth» rule.

- **D-CANON-PATINA-01:** Coverage refined from 60-70% → ≤30%. Bronze must dominate as primary material reading. 60-70% patina was too heavy — lost «aged bronze artifact» reading и became «corroded ruin».

- **D-CANON-PATINA-02:** No drips rule added. Vertical drip streaks rejected as «too ruinous». Brand discipline — museum bronze look, not outdoor weathered look.

- **D-CANON-GLOW-01:** 5-level intensity scale L1-L5 formalized. Previous loose «subtle glow» specification insufficient. Explicit scale gives state-to-level mapping.

- **D-CANON-GLOW-02:** Baseline canonical glow = L2. Used in all reference shots and idle UI states. Higher levels (L3, L4) used only for state-specific moments. L5 forbidden (Calm pillar).

- **D-CANON-GLOW-03:** Glow source rule clarified — emanates ONLY from inside patina patches, not from brackets, not as halo, not as rim. Spread radius 1-2cm with soft falloff.

- **D-CANON-FACE-01:** Asymmetry mechanics specified: left eye 30% WIDER full circle (curious child); right eye smaller с semicircle top bronze rim (wise archivist). Previous v6 had «асимметричные» без exact mechanics.

- **D-CANON-FACE-02:** Pupil position upper-center for engaged gaze (NOT dead center). Subtle but meaningful for «present, focused outward» reading.

- **D-CANON-FACE-03:** Eyes never glow + no patina on rims. Eyes are clean bronze matte, separate material context from bracket bodies.

**Approved:** nopoint approval through R-02 v3 iteration acceptance.

**Locked decisions:** All listed above. See `decisions-log.md` (this file) and `nospace/development/contexter/memory/STATE.md` для cross-reference.

**Lesson:** Canon refinements come from production. Real generation iterations surface precision opportunities. Spec must be explicit enough to constrain LLM drift while leaving room для natural texture variation.

## Voice decisions (session 254)

### D-VOICE-01 — 12-dimension sonic spec

**Date:** 2026-04-26 (session 254)

**Decision:** Voice spec по 12 dimensions accepted (Pitch / Age / Gender / Pace / Rhythm / Texture / Tone / Emotional modulation / Linguistic / Real-world precedents / Sync / NEVER).

**Context:** nopoint requested «у меме будет голос». Comprehensive voice spec needed.

**Approved:** Default decision committed in autonomous mode (per session 254 D-VOICE).

### D-VOICE-02 — Reel CTA scope only v1

**Date:** 2026-04-26 (session 254)

**Decision:** Voice scope v1 = reel CTA only (3-second slogan). UI silent. Marketing explainer deferred. Voice assistant out of scope.

**Context:** Pilot scope to validate voice approach before broader deployment.

**Approved:** Default decision committed in autonomous mode.

### D-VOICE-03 — ElevenLabs Voice Design path

**Date:** 2026-04-26 (session 254)

**Decision:** Implementation = ElevenLabs Voice Design (generated voice from description) для pilot. Custom clone deferred к post-PMF.

**Context:** Custom clone requires actor recording + Creator+ tier. Voice Design lower-cost path для validation.

**Approved:** Default decision committed in autonomous mode.

### D-VOICE-04 — Bilingual through V3 multilingual

**Date:** 2026-04-26 (session 254)

**Decision:** Same character voice через ElevenLabs multilingual V3 model. RU + EN canon, both consistent under same identity.

**Context:** Brand bilingual (EN primary + RU secondary). Voice should be recognizable as same Meme в either language.

**Approved:** Default decision committed in autonomous mode.

## Canon decisions (session 254)

### D-CANON-01 — mascot-meme.md becomes index

**Date:** 2026-04-26 (session 254)

**Decision:** Existing `mascot-meme.md` becomes short index file pointing to `mascot/` folder. Original content polностью preserved across new mascot/ folder files (G1 satisfied).

**Context:** nopoint requested folder structure with separate full files per layer. mascot-meme.md too dense for one file.

**Approved:** Default decision committed in autonomous mode.

### D-CANON-02 — 21-file folder structure

**Date:** 2026-04-26 (session 254)

**Decision:** mascot/ folder contains 21 files: README + philosophy + 7 canon-* + states + 2 motion-* + 2 voice-* + marketing-surfaces + cute-friendliness + anti-patterns + continuity-block + decisions-log + references-rag-sources + open-questions.

**Context:** Granular file structure allows selective loading per task (per `README.md` purpose map).

**Approved:** Default decision committed in autonomous mode.

## Lock policy

### What is locked

- Form (brackets + face above) — LOCKED v6 (session 253)
- Material concept (bronze body + verdigris patina + bioluminescent glow) — LOCKED v4 (session 253)
- 3-layer eye structure — LOCKED v7 (session 254)
- Patina coverage ≤30% mirror match — LOCKED v7 (session 254)
- Bioluminescent glow 5-level scale, baseline L2 — LOCKED v7 (session 254)
- No mouth, talk = X-axis bracket separation — LOCKED v6 (session 253)
- Talk animation 10-state spec — LOCKED v1 (session 253)
- Voice (sonic signature) — LOCKED v1 (session 254)

### What can be refined без lock break

- Specific hex value tolerances (within established target ranges)
- Implementation framework choice (Lottie vs Framer Motion vs Rive)
- Per-platform sizing edge cases
- New states added (с decisions-log entry)
- New continuity block variant per new state

### What requires re-approval

- Changing canonical hex values
- Changing form (bracket structure)
- Removing 3-layer eye structure
- Adding mouth
- Increasing patina coverage above 30%
- Removing bioluminescent glow
- Changing dual personality concept

### Process для canon change

1. Propose change in chat or as ADR document
2. Cross-reference impact на other canon files
3. Estimate downstream regeneration cost (reference frames, motion clips, marketing)
4. nopoint approval explicit
5. Update affected canon files
6. Add entry to `decisions-log.md` (this file)
7. Update `continuity-block.md` if material change
8. Tag affected files version bump

## Cross-reference matrix

Decision IDs and their source files:

| Decision ID | Source | Topic |
|---|---|---|
| D-CTX15-12 | `nospace/development/contexter/memory/STATE.md` | Theme axis carries semantic |
| D-CTX15-13 | `nospace/development/contexter/memory/STATE.md` | Bauhaus yellow `#E8C018` + dark canvas `#1A1A1A` |
| D-CTX15-14 | `nospace/development/contexter/memory/STATE.md` | Brand bible v1 (9 files) |
| D-CTX15-15 | `nospace/development/contexter/memory/STATE.md` | Mascot Meme v6 form locked |
| D-CANON-EYES-01 | `decisions-log.md` (this file) | 3-layer eye structure |
| D-CANON-PATINA-01 | `decisions-log.md` (this file) | Patina coverage ≤30% |
| D-CANON-PATINA-02 | `decisions-log.md` (this file) | No drips rule |
| D-CANON-GLOW-01 | `decisions-log.md` (this file) | 5-level intensity scale |
| D-CANON-GLOW-02 | `decisions-log.md` (this file) | Baseline L2 |
| D-CANON-GLOW-03 | `decisions-log.md` (this file) | Glow source rule |
| D-CANON-FACE-01 | `decisions-log.md` (this file) | Asymmetry mechanics |
| D-CANON-FACE-02 | `decisions-log.md` (this file) | Pupil position upper-center |
| D-CANON-FACE-03 | `decisions-log.md` (this file) | Eyes never glow + no patina on rims |
| D-VOICE-01..04 | `decisions-log.md` (this file) | Voice spec / scope / implementation / bilingual |
| D-CANON-01..02 | `decisions-log.md` (this file) | Folder structure / mascot-meme.md as index |

## Session 254 video pilot decisions (added 2026-04-26 evening)

### D-CANON-FACE-04 — Default expression eyelid droop revision

**Date:** 2026-04-26 (session 254 video pilot, R-02 v8)

**Context:** Pilot iterations с Imagen / Nano Banana Pro showed что v7 «asymmetric semicircle right-eye squint» reads to viewers как «scrutinizing / suspicious / judging» вместо intended «curious + wise». Проблема не в asymmetry concept, а в **shape distortion** (semicircle vs full circle) + asymmetric squint = «raised eyebrow + narrowed eye» → universal «skeptical» signal.

**Decision:**
- **Default expression revised:** оба глаза full circle outline + **symmetric eyelid droop 15-20%** (top covered by bronze rim curving down).
- **Asymmetry exclusively through size:** left eye 30% larger diameter than right.
- **Semicircle squint top-flattening reserved для Knowing state** active modulation, не для default expression.
- Reading shifts from «curious + scrutinizing» (v7) к **«slightly wry archivist who has seen it all»** (v8) — fits TOV pillar Quietly Authoritative + 25% funny calibration.

**Approved:** nopoint approval after R-02 v8 generation accepted.

**Files updated:** `canon-face.md` (Section II Asymmetry), this file.

**Lesson:** Asymmetry through shape distortion (semicircle squint) reads stronger «judging» signal чем asymmetry through size (full circles). Universal facial perception cues take precedence over abstracted geometric intent.

### D-CANON-GEOMETRY-02 — Locked proportions

**Date:** 2026-04-26 (session 254 video pilot)

**Context:** Imagen / Nano Banana Pro generated wildly varying bracket proportions across pilot iterations — from skinny wire-like (height-to-thickness ~10:1) к chunky stocky (4:1). Без locked proportions canon не reproducible.

**Decision:**

| Property | Locked value |
|---|---|
| Bracket height (reference) | 1.0H |
| Cross-section thickness | 0.13H (~13% of height) |
| Horizontal segment length | 0.35H |
| Gap between brackets (default) | 0.13H (= thickness) |
| Height-to-thickness ratio | ~7.7:1 |
| Face vertical gap above brackets | 0.25H |

**Critical implementation note:** Numerical ratios drift в Imagen prompts. Use **descriptive language** в prompts: «substantial thick sculptural cross-section like museum bronze or large old door handles, about 7-8 times taller than thick, NOT wire-thin».

**Approved:** nopoint approval after pilot diagnostic.

**Files updated:** `canon-geometry.md` Section «Пропорции», `continuity-block.md`, this file.

**Lesson:** Visual canon requires explicit numerical anchors. But для prompt engineering — descriptive language outperforms math notation.

### D-CANON-GEOMETRY-03 — Height as expression dimension

**Date:** 2026-04-26 (session 254 video pilot)

**Context:** Meme has limited expression toolkit (no mouth, no limbs). Existing canon expression channels: eyes (3-layer + asymmetry + droop) + glow (5-level scale) + bracket gap (default vs speech). Need additional dimension to support narrative range.

**Decision:**

Bracket **height** varies per state — становится new expression axis.

| State | Height % of baseline |
|---|---|
| Whisper / contemplation | 92% |
| Error | 95% |
| Knowing | 97% |
| **Idle (canonical)** | **100%** |
| Speech | 100% (action via gap) |
| Processing | 100% with ±2% breath |
| Curious | 105% |
| Bridging | 110% |

Constraints:
- Cross-section thickness НИКОГДА не changes — только vertical bar length flexes
- Horizontal segment length НИКОГДА не changes
- Maximum stretch +10% (Bridging) — Calm pillar enforces
- Minimum compression -8% (Whisper) — beyond reads «sad / collapsed»

**Approved:** nopoint approval after pilot need surfaced.

**Files updated:** `canon-geometry.md` Section VIII new, `states.md` height column, this file.

**Lesson:** Constraints generate invention. Limited expression toolkit (no mouth, no limbs) drives discovery of vertical body language as character dimension.

## Pending decisions (open)

Per `open-questions.md`:

- Sound design (есть ли у Meme сонические эффекты в UI events?)
- 3D rendering technology choice (voxel vs wireframe vs raymarch для marketing video)
- Print presence (risograph print с ограниченной палитрой)
- Localised variants (Meme «ворчит» differently в RU vs EN?)
- Custom voice clone path (actor / nopoint / generated only?)
- Trademark/IP considerations (registering Meme как brand asset)
- Animation framework choice (Lottie vs Framer Motion vs Rive — production decision)
- Sound effects mapping в UI events (отдельный canon TBD)
- Error state overlay color (L1 dimmed vs signal-error red overlay)

These pending items не block current canon. Will be resolved через future iterations с new decisions-log entries.

## Connection с brand decisions

Canon mascot decisions cross-reference brand-level decisions:

- Brand bible canonical (D-CTX15-14) — mascot extends brand bible
- TOV pillars (Sparing / Trustworthy / Spatial / Quietly Authoritative) — Meme voice projects these
- Vibe dimensions (Cold / Spacious / Discreet / Precise / Timeless / Anthropocentric) — Meme embodies all six
- Audience (AI-power users) — Meme calibrated к этой audience
- Category (Public RAG + Shared Rooms) — Meme = symbol of category

Mascot canon живёт **in brand layer**, не в design system layer. Material colors (bronze / patina / glow) — brand canonical, не design system tokens.

## Lock status

Decisions log — **append-only by policy**.

Never edit existing entries. Corrections add new entries referencing original (e.g., «2026-XX-XX correction к 2026-04-26 entry: ...»).

## Связь с другими файлами

- **All canon files** — reference decisions logged here для their lock entries
- **STATE.md** — `nospace/development/contexter/memory/STATE.md` — broader project decisions cross-referenced
- **CTX-15 epic** — `nospace/development/contexter/memory/contexter-content-factory.md` — content factory epic context
- **Open Questions** — `open-questions.md` — decisions still pending
- **Continuity Block** — `continuity-block.md` — reflects decisions in paste-ready format
