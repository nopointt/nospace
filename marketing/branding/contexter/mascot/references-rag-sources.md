---
name: mascot_meme_references_rag_sources
description: Все RAG источники (Bauhaus principles + web research) с цитатами и применением к маскоту. Klee P-24 / P-16, Moholy-Nagy P-03 / P-09, Schlemmer Triadic Ballet / P-09 / Bewegung, Van Doesburg P-17, Kandinsky P-19 / Sprache, Oud P-30, Marianne Brandt + web (Pixar Luxo Jr / Duolingo Rive / Apple counter-dip / NN/G eye-ratio / phoneme research).
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — References (RAG Sources)

> Все источники informing canon. Bauhaus principles + web research. Each source cited с specific application к маскоту.

## Назначение

Этот файл — **academic foundation** канона. Для каждого design decision можно trace, к какой source / principle он apelled. Это дисциплинирует канон — никаких «just because», each rule has heritage.

Формат каждой записи: **Source → Principle → Application к Meme**.

## Bauhaus RAG sources

### Klee P-24 — Motion / Space (1925)

**Citation:** «Compositions dealing with fluid or atmospheric content should use intermediate formal symbols — neither pure static geometry (crosses, plumb lines) nor pure orbital forms (spirals, circles), but transitional forms (waves, partial arcs).»

**Source:** Klee «Pedagogical Sketchbook» / Bauhausbücher Vol 2 (1925)

**Principle:** Transitional symbols carry life energy. Pure static forms (cross, line) are rest. Pure orbital forms (spiral, circle) are motion. Between them — wave, partial arc — carry life dynamics.

**Application к Meme:**
- Bracket form is **transitional symbol** — vertical bar with inward-turning ends. Not pure rest (vertical line). Not pure orbit (full circle). Between them.
- This is why bracket form reads «alive» despite being geometric — it's structurally not-quite-finished.

**File:** `philosophy.md`, `canon-geometry.md`

### Klee P-16 — Rhythm Structural (1925)

**Citation:** «Design system so any unit can be removed/added and rhythm holds.»

**Source:** Klee «Pedagogical Sketchbook» / Bauhausbücher Vol 2

**Principle:** Structural rhythm transcends individual units. Pattern integrity preserved через unit substitution.

**Application к Meme:**
- Talk animation works at **structural rhythm level**, не at phoneme-precision level. Animation pattern preserves character even if specific phonemes mismatch.
- Reference cycle (1-second example в `motion-talk-animation.md`) shows pattern; specific values can vary per occurrence.

**File:** `motion-talk-animation.md` (Talk Animation State 7 asymmetric coupling).

### Moholy-Nagy P-03 — Volume / Schwingung (1929)

**Citation:** «The spiral is the paradigmatic biotechnical form: deploy it structurally, not decoratively — it carries the entire construction.» Plus: «Hand registers Schwingung (oscillation) and Druck (pressure).»

**Source:** Moholy-Nagy «Von Material zu Architektur» (1929)

**Principle:** Spiral form embodies biotechnical organization. Hand-rendered art carries oscillation (rhythmic frequency) и pressure (intensity dynamics).

**Application к Meme:**
- Bracket form is **biotechnical** — geometric structure with organic life signals (asymmetric coupling, micro-breath, glow oscillation).
- Talk animation State 7 (asymmetric coupling) carries «Schwingung» (left/right oscillation phase offset 15-30ms).
- Bracket pressure dynamics in vowel/consonant phonemes carry «Druck».

**File:** `philosophy.md`, `motion-talk-animation.md` (State 7).

### Moholy-Nagy P-09 — Photogram / Light Material (1925)

**Citation:** «Organize the light and shadow relationships of a Photogramm as you would organize a composition in space — the paper is the record of that spatial organization, not a flat surface to be decorated.»

**Source:** Moholy-Nagy «Malerei, Fotografie, Film» (1925, Bauhausbücher Vol 8)

**Principle:** Light and shadow are spatial composition tools, not decorative surface treatment. Light has material weight.

**Application к Meme:**
- Свет и тень для Meme — **архитектурная граница безопасности**, не оформление. Public surface = light (Weiß-polus), private = dark (Gelb-polus). Theme axis carries semantic meaning.
- Lighting в reference shots is structural (single source upper-left), не decorative dramatic.

**File:** `philosophy.md`, `canon-lighting.md`.

### Schlemmer Triadic Ballet costume Fig-07 (1922)

**Citation:** «Dark figure with white ring and baton» — silhouette + geometric primitives + functional accessory.

**Source:** Schlemmer «Das Triadische Ballett» costume design (1922)

**Principle:** Character through silhouette + geometric primitives + functional accessory. Not through facial detail or anatomical modeling.

**Application к Meme:**
- Bracket pair (silhouette) + face above (geometric primitives) — direct heritage of Schlemmer's character-through-construction approach.
- No mouth = no facial detail. Character carried entirely via geometric structure и motion.

**File:** `philosophy.md`, `canon-geometry.md`, `canon-face.md`.

### Schlemmer P-09 — Stage as Organism (1925)

**Citation:** «Every element's behavior affects every other.»

**Source:** Schlemmer «Die Bühne im Bauhaus» (1925, Bauhausbücher Vol 4)

**Principle:** Stage / scene is unified organism. Every part responds to every other part — no isolated movements.

**Application к Meme:**
- Talk animation State 9 (Face response) — eye dots respond к bracket motion. Face ≠ isolated. When brackets actuate, eyes pulse.
- Motion State 1 (Idle) — three concurrent patterns (breath / blink / glow oscillation) form unified polyrhythm. Each affects perceived character.

**File:** `motion-talk-animation.md` (State 9), `motion-idle-and-states.md` (State 1).

### Schlemmer Bewegung — Sequential Frames (1925)

**Citation:** «Sequential frames, incremental repositioning.»

**Source:** Schlemmer's stage movement theory (1925)

**Principle:** Animation works через discrete keyframes (sequential), не через continuous motion. Movement is built up through precise positions.

**Application к Meme:**
- Talk animation operates internally at **12-15 fps** discrete keyframes (per Schlemmer principle), но rendered at 60fps interpolated. Bauhaus discrete-step character preserved.
- Animation is keyframe-based, не procedural / physics-based.

**File:** `motion-talk-animation.md` (Implementation hints — frame rate).

### Van Doesburg P-17 — Rhythm of Unequal Accents (1925)

**Citation:** «Rhythm of UNEQUAL accents.»

**Source:** Van Doesburg «Grundbegriffe der neuen gestaltenden Kunst» (1925, Bauhausbücher Vol 6)

**Principle:** Mechanical equality = death. Organic unequal accents = life. Composition lives через intentional irregularity.

**Application к Meme:**
- Talk animation State 7 (Asymmetric coupling) — left и right brackets always с phase offset 15-30ms. Never perfectly synchronized.
- Idle motion — bracket breathing, eye blink, glow oscillation все с irregular phases. Polyrhythm through imperfect alignment.
- Voice rhythm — каждое предложение чуть другой длины, paused non-uniform. Per Van Doesburg.

**Files:** `motion-talk-animation.md` (State 7), `motion-idle-and-states.md`, `voice-audio.md` (Dimension 5).

### Kandinsky P-19 — Point and Line (1926)

**Citation:** «Punkt = rest, Linie = inner-moved tension born of movement.»

**Source:** Kandinsky «Punkt und Linie zu Fläche» (1926, Bauhausbücher Vol 9)

**Principle:** Point (Punkt) is rest, equilibrium. Line (Linie) carries inner-moved tension born of movement — not external force, but internal energy.

**Application к Meme:**
- **Closed brackets at rest (Idle state)** = Punkt — equilibrium, stability.
- **Opening (Speech state, brackets separating)** = Linie — tension carrying intention.
- Cycle: Punkt → Linie → Punkt — speech rhythm.

**Files:** `motion-talk-animation.md` (State 1 Idle, State 2 Auftakt anticipation, State 5 Word boundaries).

### Kandinsky Sprache — Visual Vocabulary

**Citation:** «Visual language formed by point-line combinations — unreachable by words.»

**Source:** Kandinsky's theoretical writings (1926+)

**Principle:** Visual language has its own grammar inaccessible to verbal language. Compositions of points and lines communicate dimensions verbal description cannot reach.

**Application к Meme:**
- Talk animation creates **visual language parallel to речи**. Not transcribing words. Brackets actuate в rhythm matching speech но not articulating phonemes specifically.
- This is intentional — Meme communicates через geometric language что cannot be reduced to text.

**File:** `motion-talk-animation.md` (RAG sources table).

### Oud P-30 — Inner Logic (1929)

**Citation:** «Begin from the inner organizational logic; let the exterior emerge from that.»

**Source:** J.J.P. Oud Bauhausbücher (1929)

**Principle:** Form follows organizational logic. Exterior reflects internal structure, не imposed style.

**Application к Meme:**
- Bracket form **derives from concept** (двойственность ребёнок+старик, archive container, no-mouth design). Exterior is consequence, не aesthetic choice.
- Material assignments (bronze = старик / patina = ребёнок) — semantic, не decorative.
- Asymmetric eyes (left wider / right squinted) — encoding personality, не facial design choice.

**Files:** `philosophy.md`, `canon-face.md` (asymmetry as encoding).

### Marianne Brandt — Bauhaus Metalwork

**Citation:** Brandt-Kandem table lamps (1928), MT 49 tea infuser (1924), light fixtures для Bauhaus building.

**Source:** Marianne Brandt's industrial design work в Bauhaus metal workshop под Moholy-Nagy

**Principle:** Material truth (Materialwahrheit) applied к metalwork. Bronze is bronze, не painted, не plated. Sculptural form serving function. Slight imperfections от handcraft.

**Application к Meme:**
- Bronze material для Meme body — **direct heritage** Brandt's metalwork. Same warm aged bronze aesthetic.
- Aging texture (micro-pitting, slight imperfections) — handmade quality, not industrial perfection.
- Sculptural form (brackets как 3D object, not flat shape).

**File:** `canon-material-bronze.md` (Heritage references section).

## Web research sources

### Pixar Luxo Jr. — Animation Principles (1986)

**Citation:** Luxo Jr. (1986 short film by John Lasseter) demonstrates 12 animation principles applied к inanimate object (lamp). Personality emerges via timing, squash/stretch, anticipation, follow-through, overlapping action — without facial expression.

**Source:** Lasseter's research applying Disney's 12 Animation Principles (Thomas/Johnston 1981) к non-character objects.

**Principle:** Personality without face is achievable. Object character carried entirely через motion timing и body language.

**Application к Meme:**
- **Direct precedent для no-mouth design.** Luxo Jr. has lamp shade (head equivalent) и base (body equivalent) с no face. Character emerges from motion alone.
- Anticipation (Disney principle 1) → talk animation State 2 (Auftakt 80ms before speech)
- Squash/stretch (Disney principle 4) → bracket compression в consonants (D × 0.95 stops)
- Follow-through и overlapping action (Disney principle 6) → eye dots delayed body motion в asymmetric coupling
- Slow-in/slow-out (Disney principle 7) → easing curves в bracket motion
- Secondary action (Disney principle 9) → eye blink during phrase boundaries
- Timing (Disney principle 11) → unequal accent rhythm (Van Doesburg P-17 alignment)

**Files:** `philosophy.md`, `motion-talk-animation.md` (RAG sources web research table).

### Duolingo Rive State Machine — Mascot Animation (2024)

**Citation:** Duolingo uses Rive (state machine animation tool) для their owl mascot across iOS, Android, Flutter, React, Web. Mascot has defined emotional states (happy, frustrated, proud, disappointed) each as discrete animation state, transitions triggered by user events.

**Source:** Rive blog / Duolingo engineering blog (2023-2024)

**Principle:** State machine thinking informs mascot design. Discrete emotional states with explicit triggers, smooth transitions between.

**Application к Meme:**
- States (`states.md`) — 7 canonical Meme states (Idle / Curious / Knowing / Bridging / Speech / Processing / Error).
- Each state has explicit trigger context, glow level, eye behavior, bracket gap.
- Transitions follow design system motion tokens.

But difference: Meme **rejects discrete emotional toggles** (happy/sad/angry). Personality through dual-asymmetry, не mode switches. This is brand discipline distinct from Duolingo's approach.

**Files:** `states.md`, `references-rag-sources.md` (this file).

### Wall-E (Pixar 2008) — Two Eyes + Body Language

**Citation:** Wall-E character design uses two eyes + body language to convey full emotional range without mouth. Years of expressive animation precedent.

**Source:** Pixar's Wall-E character design documentation (2008+).

**Principle:** Two eyes (binocular construction) + body language sufficient for emotional range. No mouth required.

**Application к Meme:**
- Confirms feasibility of no-mouth expressive design.
- Asymmetric eyes (left wider, right squinted) carry duality where Wall-E used coordinated movement of both eyes.
- Body language через bracket gap variations (idle ±1%, curious slight lean, bridging held attention) parallels Wall-E's body posture variations.

**File:** `philosophy.md`, `references-rag-sources.md` (this file).

### BB-8 (Star Wars 2015) — Head Tilt + Sound

**Citation:** BB-8 character communicates через head tilt + sound effects. No facial features, no human-like expressions. Personality entirely from movement и audio.

**Source:** Star Wars: The Force Awakens character design (2015).

**Principle:** Communication через body angle + audio rhythm sufficient. Head tilt = head-position equivalent.

**Application к Meme:**
- Bracket gap variation = «head-position» equivalent для Meme. Different gap states communicate different moods.
- Voice (per `voice-audio.md`) augments visual character through sonic identity.

**File:** `philosophy.md`, `motion-talk-animation.md` (RAG sources web table).

### Apple Counter-Dip Strategy (Microsoft/Apple Research)

**Citation:** «Apple product reveal videos maintain 82% average retention through midpoints by 'deliberate pacing shifts and information hierarchy strategies'.»

**Source:** Microsoft + Apple attention research cited in RetentionRabbit 2025 State of YouTube Audience Retention Benchmark Report.

**Principle:** Standard 30-second video has attention dip at 40-60% duration. Deliberate pacing shifts at midpoint counter this dip.

**Application к Meme:**
- Video reel structure (DEEP-2 storyboard) places **discovery beat at second 20** (Clip 3 ECU) — center of 40-second reel.
- This is **counter-dip** moment — designed to lift attention exactly when it would naturally drop.
- Per `canon-composition.md` and DEEP-2 master spec.

**File:** `canon-composition.md`, `references-rag-sources.md` (this file).

### NN/G Anthropomorphic Character Research (2023)

**Citation:** «Innocent-style characters may have no mouths, conveying innocent, soft, and quiet personalities.» Plus: «Eye-ratio is the most powerful signal for age/authority perception — wider eyes = younger/curious, narrower = experienced/authoritative.»

**Source:** ScienceDirect anthropomorphic character ratios paper (2023) — cited in mascot design research.

**Principle:** Eye-ratio carries primary character signal в no-face design. Wider = young/curious, narrower = experienced/authoritative.

**Application к Meme:**
- **Direct grounding for asymmetry rule.** Left eye wider → curious child reading. Right eye narrower → experienced/authoritative reading.
- 30% size difference between eyes is canonical (per `canon-face.md`).
- Asymmetry IS personality engine для Meme.

**File:** `canon-face.md` (asymmetry rules), `philosophy.md`.

### NN/G Robot Mouth Study

**Citation:** «Robot with mouth perceived more lifelike + less sad.»

**Source:** NN/G research on robot character perception (anthropomorphic design).

**Application к Meme:**
- This finding is **counter-precedent** к no-mouth decision. NN/G suggests adding mouth makes character more lifelike.
- But **Meme не robot — Meme является brand symbol**. Geometric language скобок усиливает character не reduces.
- Decision: ignore NN/G mouth recommendation в favor of brand discipline (no antrophomorphic cute) + production stability (no lip sync failure mode).

**File:** `philosophy.md` (no-mouth rationale), `voice-audio.md` (NEVER patterns).

### Phoneme Research (Linguistics)

**Citation:** «Mouth opening correlates with vowel duration» / «Vowels longer before fricatives than stops»

**Source:** Standard phonological linguistic research (multiple academic sources).

**Application к Meme:**
- Talk animation State 3 (Vowels) — bracket spread amplitude correlates с vowel duration. Longer vowel = longer bracket hold.
- Talk animation State 4 (Consonants) — fricatives held longer (80-150ms vibrate) than stops (30-50ms snap). Brackets reflect phonological reality.

**File:** `motion-talk-animation.md` (State 3, State 4).

### Disney 12 Animation Principles (1981 Thomas/Johnston)

**Citation:** Frank Thomas и Ollie Johnston's «The Illusion of Life: Disney Animation» (1981) — 12 fundamental principles of character animation.

**Source:** Disney studio practice codified.

**12 Principles (those applied к Meme):**

1. **Squash and stretch** → bracket compression в consonants (D × 0.95 stops)
2. **Anticipation** → talk animation State 2 (80ms anticipation Auftakt)
3. Staging → composition rules (canonical centering per `canon-composition.md`)
4. **Slow-in slow-out** → easing curves в bracket motion (per design system tokens)
5. **Secondary action** → eye blink during phrase boundaries
6. **Follow-through and overlapping action** → eye dots delayed body motion в asymmetric coupling
7. Arcs → motion follows arc trajectories (per `motion-idle-and-states.md`)
8. Timing → unequal accent rhythm (Van Doesburg P-17)
9. Exaggeration → MUTED for Meme (Calm pillar caps amplitude at 1.3×)
10. Solid drawing → bronze cast surface, sculptural depth (canonical material)
11. Appeal → Meme appeal через geometry, not anthropomorphic cute
12. Straight-ahead vs pose-to-pose → keyframe-based (Schlemmer sequential frames principle)

**Files:** `motion-talk-animation.md` (Don'ts and Implementation), `motion-idle-and-states.md`.

## Cross-discipline references

### Atlas Cloud Workflow (2026)

**Citation:** Atlas Cloud's Nano Banana → Veo 3.1 professional workflow guide.

**Source:** atlascloud.ai blog — «From Nano Banana Image to Video AI: A Professional Workflow Using Atlas Cloud and Veo 3.1»

**Principle:** Production workflow для AI video generation. Use Imagen 4 / Nano Banana to generate canonical reference images. Use those references как Veo Ingredients для consistency.

**Application к Meme:**
- Pilot R-02 isolation reference generated в Nano Banana Pro (per session 254 development).
- Reference images используются как `images[0]` в Veo для identity locking.
- Idle loop anchor technique (4-second static clip как identity baseline).

**File:** `canon-composition.md` (R-01..R-06 specs).

### MVCustom Multi-View Diffusion (October 2025)

**Citation:** «MVCustom — Multi-View Customized Diffusion (arXiv:2510.13702v2)» — depth-aware feature rendering. Multi-angle reference images improve geometric consistency in diffusion models.

**Source:** arXiv 2510.13702 (October 2025).

**Principle:** Multi-angle reference encoding (front + 3/4 + side) provides richer depth representation than single front-facing reference.

**Application к Meme:**
- 6 canonical reference shots (R-01 through R-06) — multi-angle reference library per MVCustom principles.
- R-02 frontal + R-03 3/4 view + R-06 face study + R-04 texture close-up = comprehensive depth encoding.
- Used as Veo Ingredients (`images[0..2]`) для identity lock.

**File:** `canon-composition.md`, `references-rag-sources.md` (this file).

### Geometry Forcing (July 2025)

**Citation:** «Geometry Forcing — arXiv:2507.07982» — method to make video diffusion models internalize latent 3D representations through alignment with geometric foundation models.

**Source:** arXiv 2507.07982 (July 2025).

**Principle:** Geometric structure preservation в video diffusion is research direction. Sharp 90° angles, consistent cross-section maintenance — possible с specific architectural alignment.

**Application к Meme:**
- Conceptual grounding для why Meme's geometric precision is **achievable but not deterministic** в Veo 3.1.
- Justifies anti-drift checklist enforcement (manual verification needed).

**File:** `canon-geometry.md` (geometry verification checklist), `references-rag-sources.md` (this file).

### Forensic Multi-Modal Character Consistency (Google Cloud, 2025)

**Citation:** Chouaieb Nemri's 6-stage forensic pipeline для character consistency: Gemini 2.5 Pro extracts JSON «fingerprint» → translates к natural language → Imagen 3.0 generates → Gemini evaluates → Imagen outpaints → Veo generates video.

**Source:** Medium / Google Cloud Community (July 2025).

**Principle:** Combined visual reference + semantic description conditioning provides redundancy против drift.

**Application к Meme:**
- GeometryCompositeProfile JSON spec (per DEEP-1) — Meme equivalent of FacialCompositeProfile.
- Continuity block (`continuity-block.md`) — semantic description applied uniformly.
- Reference images + continuity block = dual redundancy против drift.

**File:** `continuity-block.md`, `references-rag-sources.md` (this file).

## Production references

### Apple September 2025 Product Reveal Aesthetic

**Citation:** Apple's product photography aesthetic (September 2025 hardware reveal events) — floating object в space, single soft box light upper-left, dark background, soft falloff shadows, high material fidelity.

**Source:** Apple's product photography conventions cited in design references.

**Application к Meme:**
- Reference shot composition (R-02 isolation) directly references this aesthetic.
- Single warm directional spot upper-left.
- Pure dark background `#1A1A1A`.
- Soft penumbra shadows.

**File:** `canon-composition.md`, `canon-lighting.md`.

### Avatar Pandora Bioluminescence (2009/2022 Films)

**Citation:** James Cameron's Avatar (2009) и Avatar: The Way of Water (2022) — bioluminescent flora и fauna design. Phosphorescent organisms emerging в darkness.

**Source:** Avatar films character / environment design.

**Principle:** Soft organic biological glow emerging from natural mineral / organic material. NOT neon, NOT LED.

**Application к Meme:**
- Bioluminescent glow concept directly references Pandora aesthetic.
- Phosphorescent moss / deep-sea bioluminescence direct analogues.
- Soft organic light, не technological lighting.

**File:** `canon-bioluminescent-glow.md`.

### DaVinci Resolve Color Grading (Bronze + Bioluminescent)

**Citation:** DEEP-5 (`contexter-meme-davinci-grade-recipe-deep.md`) — 8-node DaVinci grade recipe для bronze + bioluminescent aesthetic. Hue 185° = `#1AD4E6` для Glow Color Filter.

**Source:** Internal DEEP-5 research, validates Resolve 20.2+ Secondary Glow + Alpha-Driven Light Effects features.

**Application к Meme:**
- Color grade values (hex `#1AD4E6` glow target) align с canonical glow color spec.
- Production pipeline complete — generate в Veo, grade в DaVinci, deliver.

**File:** `canon-bioluminescent-glow.md`, DaVinci grade recipe внутренний artifact.

### TARS (Interstellar 2014) — Voice Reference

**Citation:** TARS robot character voice (Bill Irwin) — calm, slightly dry humor, never performative. Confident dry observations.

**Source:** Christopher Nolan's Interstellar (2014).

**Application к Meme:**
- Primary voice precedent. Voice spec dimension 10 cites TARS specifically.
- Calm pillar embodied. Slight wry edge без sarcasm.

**File:** `voice-audio.md`.

### Bilbo Baggins (Ian Holm, LOTR) — Voice Reference

**Citation:** Ian Holm's portrayal of Bilbo в LOTR / Hobbit films — knowing, weary но warm, slightly hesitant. Lived-in voice.

**Source:** Lord of the Rings: The Fellowship of the Ring (2001), The Hobbit: An Unexpected Journey (2012).

**Application к Meme:**
- Secondary voice precedent. Wisdom без announce.
- Pairs с TARS — calm + dry + warm + experienced.

**File:** `voice-audio.md`.

### Леонид Каневский «Следствие вели» — Voice Reference (RU)

**Citation:** Леонид Каневский's narrator voice в Russian crime documentary «Следствие вели». Calm baritone, slightly knowing, dry tone, present без excess.

**Source:** Russian television documentary (NTV).

**Application к Meme:**
- RU canonical voice precedent.
- Confirms cross-cultural translatability of voice character.

**File:** `voice-audio.md`.

## Heritage list summary

Bauhaus principles applied:
1. Klee P-24 (Motion/Space, transitional symbols)
2. Klee P-16 (Rhythm structural)
3. Moholy-Nagy P-03 (Schwingung, biotechnical spiral)
4. Moholy-Nagy P-09 (Light/Shadow as material)
5. Schlemmer Triadic Ballet Fig-07 (Character through silhouette)
6. Schlemmer P-09 (Stage as organism)
7. Schlemmer Bewegung (Sequential frames)
8. Van Doesburg P-17 (Rhythm of unequal accents)
9. Kandinsky P-19 (Point and Line)
10. Kandinsky Sprache (Visual vocabulary)
11. Oud P-30 (Inner organizational logic)
12. Marianne Brandt (Bauhaus metalwork heritage)

Web research applied:
1. Pixar Luxo Jr. (no-mouth animation precedent)
2. Disney 12 Principles (animation foundation)
3. Duolingo Rive (state machine mascot)
4. Wall-E (two eyes + body language)
5. BB-8 (head tilt + sound)
6. Apple Sept 2025 product reveal (aesthetic)
7. Avatar Pandora bioluminescence (glow concept)
8. NN/G eye-ratio research (asymmetry grounding)
9. NN/G robot mouth study (counter-precedent contemplated, rejected)
10. Phoneme linguistic research (talk animation)
11. RetentionRabbit 2025 (Apple counter-dip)

Production references:
1. MVCustom (multi-view reference encoding)
2. Geometry Forcing (geometric consistency research)
3. Atlas Cloud workflow (Imagen → Veo pipeline)
4. Forensic character consistency (Google Cloud)
5. DaVinci color grade recipe (DEEP-5)

Voice references:
1. TARS (Interstellar)
2. Bilbo Baggins (Ian Holm)
3. Леонид Каневский (RU)

## Когда добавлять источники

При future canon evolution:
1. Identify the design decision being made
2. Trace к existing reference (Bauhaus или web)
3. If no existing reference — research новый source
4. Cite source explicitly (citation + link if available)
5. State application explicitly
6. Add к этому файлу

This discipline ensures canon stays grounded в evidence, не arbitrary.

## Связь с другими файлами

- **All canon files** — каждое design decision должно trace back к источнику в этом файле
- **Decisions Log** — `decisions-log.md` cites which references informed which decisions
- **Continuity Block** — `continuity-block.md` reflects all canonical applications
- **STATE.md** — broader project decisions cross-reference

## Lock status

References — **append-only by policy**.

Existing references locked. New references added per future canon evolution.

History:
- v1 (session 254): Comprehensive references compiled, Bauhaus + web + production + voice categorized
