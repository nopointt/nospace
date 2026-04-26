---
name: mascot_meme_canon_composition
description: Полная композиционная спецификация маскота Meme. Reference shot framing, центрирование, вертикальная занятость, фон uniform, margin от краёв, in-context vs character-sheet, aspect ratios.
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Canon Composition

> Кадрирование. Этот файл — про где Meme размещается в кадре. Что отображается в кадре — `canon-geometry.md` и `canon-face.md`. Как освещён — `canon-lighting.md`.

## Обзор

Композиция Meme в reference shots следует **строгим canonical правилам**, чтобы downstream Veo-генерации (image-to-video) сохраняли consistency. Reference frame — это identity anchor. Любая спатиальная асимметрия в reference усиливается в video output.

Также — composition говорит на семантическом уровне: где Meme в кадре, какую часть кадра он занимает, как фон relates с ним. Это влияет на эмоциональное чтение.

Этот файл покрывает 6 canonical reference shots (R-01 через R-06) и rules для in-context shots (marketing video, UI illustrations).

## I. Базовые композиционные правила

### Strict centering

Subject **perfectly centered horizontally** в кадре.

- Mirror axis симметрии Meme = vertical axis в frame center
- Не offset left или right
- Не closer к одному edge frame
- Mathematical: midpoint between two brackets = exact horizontal center of frame

Правило **non-negotiable** для reference shots. Drift creates spatial bias which amplifies в Veo motion clips.

### Vertical occupation

Subject (brackets + face) занимает **~60% vertical height** of frame.

- Brackets bottom edge: ~80% height (20% empty space below)
- Brackets top edge: ~50% height (face occupies area above)
- Face center: ~35% height
- Frame top empty: ~25% above face

Это **дышащая** composition — не cropped tight, не overstuffed.

### Background uniformity (reference shots)

Background — **pure neutral dark `#1A1A1A`**, uniform, без gradients, без vignettes, без atmospheric tint.

| Property | Value |
|---|---|
| Color | `#1A1A1A` (Moholy-Nagy poster canon) |
| Uniformity | Solid, no gradient, no vignette |
| Tint | Pure dark, no cyan ambient (per `canon-bioluminescent-glow.md` no-halo rule) |
| Texture | None — clean studio void |
| Depth | None в isolation reference (R-02); has в archive reference (R-01) |

В **R-01 master hero** background имеет archive context (drawer rows receding) — но base color остаётся `#1A1A1A` derivative с atmospheric depth modulation.

### Margin от frame edges

Subject **не touches** frame edges. Comfortable margin everywhere:

| Margin location | Min margin |
|---|---|
| Top edge (above face) | ~25% frame height |
| Bottom edge (below brackets) | ~20% frame height |
| Left edge (left bracket) | ~20% frame width |
| Right edge (right bracket) | ~20% frame width |

Subject occupies center 60-65% of frame area.

### Why these proportions

- Centered → balance, no implicit motion direction
- 60% vertical → Meme has presence без overwhelming
- Background uniform → focus on subject, no compositional distraction
- Margins → comfortable visual breathing room, не cropped

## II. 6 canonical reference shots

Каждый reference shot имеет специфическое назначение. Все они служат как **identity anchors** для downstream Veo / Imagen / DaVinci работы.

### R-01 — Master Hero Shot (front, archive setting)

**Purpose:** Primary canonical reference. Используется как `images[0]` в каждой Veo generation.

**Composition:**
- Aspect ratio: **16:9** (cinematic widescreen)
- Subject: full Meme (brackets + face) front-facing
- Vertical occupation: ~50% (smaller than R-02 — brackets occupy mid-distance, archive context fills frame)
- Position: subject centered horizontally, slightly below frame mid-line (60% height для bracket center)
- Background: archive interior 2050 visible, drawer rows receding to atmospheric depth at right
- Foreground: one drawer slightly ajar в lower-left

**Lighting context:**
- Warm directional spot upper-left at 45°, tungsten 3200K
- Subject illuminated по canonical lighting (см. `canon-lighting.md`)
- Archive context lit by ambient atmospheric depth + drawer interiors slightly warm

**Atmospheric:**
- Volumetric haze visible mid-distance
- Particle texture в haze beam (catches warm light)
- Background drawers silhouetted against `#1A1A1A` to `#0D0D0D` tonal range

**Use:**
- Primary identity anchor для Veo Ingredients — slot images[0]
- Marketing hero image
- Press kit primary
- Brand identity reference в documentation

**Generation guidance:**
- Imagen 4 Ultra recommended (sharp material detail в archive context)
- 2K resolution minimum
- Photorealistic render
- Depth of field — brackets sharp, archive softly out of focus
- Prompt должен include continuity block + archive setting description

### R-02 — Pure Character Isolation (neutral dark background)

**Purpose:** Cleanest identity reference. Removed all environmental noise. Used когда geometry/material precision is paramount.

**Composition:**
- Aspect ratio: **1:1** (square)
- Subject: full Meme (brackets + face) front-facing
- Vertical occupation: ~60-65% (more dominant чем R-01)
- Position: centered, bracket midpoint slightly below frame center (55% height)
- Background: pure neutral dark `#1A1A1A`, completely uniform
- Foreground: nothing
- No environment, no objects, no context

**Lighting context:**
- Single soft box upper-left at 45°, warm tungsten 3200K
- Subtle rim from behind separates brackets from dark
- Bioluminescent glow secondary illumination per `canon-bioluminescent-glow.md`

**Atmospheric:**
- Pure void
- No haze
- No particles
- No depth elements

**Use:**
- Character sheet reference
- Identity verification (when checking canon compliance)
- Imagen Ingredient slot images[0] альтернатива R-01
- Style guide canonical illustration
- **Currently locked:** R-02 v7 was the iteration we did в session 254 — this is the canonical reference for current canon

**Generation guidance:**
- Nano Banana Pro (per session 254 finding) или Imagen 4 Ultra
- 2K resolution minimum
- Ultra-sharp focus, no DoF blur
- Full character visible с comfortable margins

### R-03 — 3/4 View (depth and volume)

**Purpose:** Multi-angle reference. Per MVCustom research (см. `references-rag-sources.md`) — multi-angle references improve geometric consistency в Veo through depth encoding.

**Composition:**
- Aspect ratio: **16:9**
- Subject: Meme viewed from 45° angle (3/4 view), revealing rectangular cross-section thickness
- Vertical occupation: ~50%
- Position: centered, slight tilt of camera angle visible (subject не frontal but rotated ~30-45° relative camera)
- Background: dark neutral void `#1A1A1A` with trace of archive atmosphere (suggestion of distant drawer rows, very out of focus)

**What 3/4 view reveals:**
- Cross-section depth (3-4cm rectangular profile visible from angle)
- Inner corner geometry (90° intersection clearly visible)
- Material distribution на depth surfaces (patina also на side faces)
- 3D form (sculpt vs flat shape)

**Use:**
- Depth/volume reference (Veo Ingredient slot images[1])
- Verification что Meme is 3D object, not flat
- Material texture reference на depth surfaces

**Generation guidance:**
- Imagen 4 Standard ok
- Camera angle 45° rotation описан в prompt
- Lighting maintained (warm key upper-left), but plays differently на rotated geometry
- Sharp focus

### R-04 — Texture Close-up (patina detail)

**Purpose:** Material fingerprint. Provides crystalline mineral texture and bronze surface detail at extreme detail. Used as Texture+Style Ingredient slot.

**Composition:**
- Aspect ratio: **1:1** (square)
- Subject: extreme macro close-up of bracket surface
- Frame fill: bronze + patina texture filling 100% of frame (no full bracket form visible)
- No characters, no eyes, no full bracket shape — only material surface
- Background: implied (out of focus context)

**What macro view reveals:**
- Crystalline mineral structure of patina (close detail)
- Layered chemistry (newer patina на older)
- Bronze base visible в gaps между patina patches
- Surface micro-pitting от aging
- Glow from within patina patches at extreme detail

**Lighting:**
- Diffuse macro photography lighting
- Patina's own glow provides secondary illumination
- Soft, even illumination для material study

**Use:**
- Texture+Style Ingredient slot (Veo `images[2]`)
- Material reference для DaVinci color grading
- Bauhaus-aligned material study (close inspection of physical reality)

**Generation guidance:**
- Imagen 4 Ultra recommended (max detail для material)
- Sharp macro depth of field — entire surface in focus
- Hyperrealistic material scan aesthetic
- Scientific macro photography style reference

### R-05 — Speaking Pose (brackets parted)

**Purpose:** Speech state reference. Brackets separated на X-axis 2-3× wider than default. Used as last frame в talk animation transitions (per first/last frame Veo workaround в DEEP-1 §6.3).

**Composition:**
- Aspect ratio: **16:9**
- Subject: full Meme
- Brackets: parted horizontally — gap 2-3× wider than canonical default (e.g., 8-12cm)
- Vertical bars stay vertical (no tilt despite separation)
- Face: centered over **wider gap midpoint** — moves slightly right for left bracket position, but face stays centered relative to gap
- Background: archive setting (suggestion) или neutral void

**What speaking pose communicates:**
- Brackets opening outward на X-axis = act of speech
- Inner-facing surfaces glow brighter (10-15% lift на patina patches на inner edges per `motion-talk-animation.md` State 7)
- Face above gap читается as «communicating consciousness, deliberately»

**Use:**
- Last frame для Veo first/last frame transition (Branch B per DEEP-1)
- Speech state canonical reference
- Animation key pose

**Generation guidance:**
- Imagen 4 Standard
- Same lighting и material as default
- Brackets gap explicitly described (2-3× default = 8-12cm)
- Inner edges 10-15% brighter glow
- Mouth animation NOT happening (no mouth — это speech через bracket separation)

### R-06 — Face Study (eye-dot detail)

**Purpose:** Close-up face study. Captures personality engine in detail.

**Composition:**
- Aspect ratio: **1:1**
- Subject: extreme close-up на eye-dots area
- Frame fill: face area dominates ~70% frame
- Visible context: top sections of brackets visible below — provides positioning context
- Background: dark with archive atmosphere suggestion

**What face study reveals:**
- 3-layer eye structure clearly visible (bronze ring → white iris → black pupil)
- Asymmetry detail (left wider, right semicircle)
- Pupil position (upper-center)
- Bronze rim material detail
- Trace cyan-teal glow ambient от patina (very subtle)

**Lighting:**
- Very soft diffuse lighting
- Bronze dots catch minimal warm light from upper-left
- Primary illumination — ambient bioluminescent glow from below (subtle)

**Use:**
- Face study reference (Veo Ingredient для facial close-ups)
- Eye structure documentation
- Personality reading verification

**Generation guidance:**
- Imagen 4 Ultra (eye detail critical)
- 2K resolution
- Sharp focus на entire face area
- Eyes both clearly visible with full 3-layer structure
- Asymmetry obvious

## III. Aspect ratios summary

| Reference | Aspect ratio | Why |
|---|---|---|
| R-01 Master Hero | 16:9 | Cinematic widescreen, matches Veo output, hero shots |
| R-02 Isolation | 1:1 | Square character sheet, classic identity reference |
| R-03 3/4 View | 16:9 | Cinematic, pairs с R-01 |
| R-04 Texture Close-up | 1:1 | Square macro shot, focused material study |
| R-05 Speaking Pose | 16:9 | Cinematic, animation key pose |
| R-06 Face Study | 1:1 | Square, focused detail |

In-context production:
- Marketing video / Veo clips: **16:9** primary, **9:16** vertical для social
- UI illustrations: variable (responsive)
- Favicon: **1:1**
- Press kit: 16:9 + 1:1 + 9:16 variants

## IV. Reference vs in-context composition

### Reference shots (R-01 to R-06)

- **Strict canonical composition rules** (centering, occupation, margins, background)
- **Static** subject — no motion captured
- **Studio aesthetic** — minimal context distractions
- **Multiple angles** для encoding identity from various perspectives

### In-context composition (Veo motion clips)

В motion clips (production reels), composition rules **relax** для cinematic storytelling:

- Camera moves (dolly, pan, crane) — subject не fixed in frame
- Variable subject scale through clip (wide → medium → close)
- Background context dominant (archive interior fills frame)
- Foreground elements (drawer ajar, atmospheric haze) interact with subject

Per DEEP-2 storyboard spec, 5-clip Curiosity Arc structure (см. `references-rag-sources.md`):
- Clip 1: Wide establishing — Meme small (~20% height)
- Clip 2: Medium tracking — Meme medium (~40% height)
- Clip 3: ECU discovery — Meme face fills frame
- Clip 4: Medium speech — Meme medium (~40% height)
- Clip 5: Wide pull-back — Meme small (~20-25% height)

Composition rules в motion:
- ✅ Subject can move в frame (camera follows / character drifts)
- ✅ Subject can be off-center temporarily (motion / camera)
- ✅ Multiple subjects/objects in frame OK (Meme + drawer + archive)
- ✅ Variable scale через clip
- ❌ But Meme identity preserved (geometry / material / face spec all hold per other canon files)
- ❌ But framing should respect rule of thirds, not random
- ❌ But final frame должен composition-stable (not chaotic)

См. `motion-talk-animation.md` и `motion-idle-and-states.md` для motion-specific composition.

## V. UI illustration composition

В UI illustration (favicon / loading / empty state / blog), composition rules adapt:

### Favicon (16×16, 32×32)

- Single color silhouette
- Simplified geometry (bracket pair recognizable, eyes как dots)
- No background — transparent or `#1A1A1A`
- Mascot fills frame ~80-90%

### Loading bar (1D)

- Horizontal animation
- Brackets implied as anchor points
- Wave moves between brackets
- Eyes simplified or omitted

### Empty state (2D illustration)

- Mascot center или slight offset
- Background simple (light grey #F0F0F0 в light theme, dark #1A1A1A в dark theme)
- 2D outline rendering (line art)
- Sometimes accompanied by short text below

### Hero (2.5D parallax)

- Mascot prominently positioned (often centered или 1/3 grid)
- Layered elements behind для depth
- Subtle parallax animation
- Higher-resolution rendering

### Marketing video (3D)

- Per DEEP-2 storyboard spec
- Variable framing per clip (Curiosity Arc structure)
- Studio matte aesthetic in canonical reference moments

## VI. Background details (R-01 archive setting)

### Drawer rows

- Endless rows of aged metal card-catalog drawers
- Receding к right (or left, mirror) toward atmospheric depth
- Drawers silhouetted against `#1A1A1A` to `#0D0D0D` tonal range
- Heights varied (drawers stacked в array, vertical variations)

### One foreground drawer

- Slightly ajar (5-10cm visible opening)
- Lower-left of frame в standard R-01
- Reveals warm interior glow (warm tungsten от inside)
- Index cards visible but не readable text

### Atmospheric haze

- Volumetric mist mid-distance
- Catches warm directional light from upper-left
- Visible particle texture (dust motes)
- Density: light enough that drawers visible через haze, dark enough that depth feels significant

### Material context

- Archive metal — dark steel-grey, weathered
- Drawers cast bronze-similar coloration where light touches
- Floor: never explicitly visible (maintains «no ground plane» rule per `canon-geometry.md`)
- Walls / ceiling: not visible (атмосферная depth fades эти detail)

## VII. Composition verification checklist

При generation reference shot, verify:

- [ ] Subject perfectly centered horizontally (mirror axis at frame center)
- [ ] Vertical occupation appropriate per shot type (~50-65%)
- [ ] Comfortable margins from all frame edges
- [ ] Background pure `#1A1A1A` uniform (in isolation reference)
- [ ] Background archive context (in master hero reference) с atmospheric depth
- [ ] No vignette
- [ ] No background gradient
- [ ] No atmospheric cyan tinting
- [ ] Subject не touches frame edges
- [ ] Aspect ratio matches canonical for shot type
- [ ] Frame composition stable (не chaotic, не cropped tight)
- [ ] Reference shots show Meme statically (no implied motion blur)

## VIII. Drift modes warning

Common drift в Imagen / Veo:

- **Off-center drift** — subject slightly left или right of center. Reinforce «perfectly centered horizontally, mirror axis at exact frame center».
- **Tight crop drift** — Imagen crops subject too tight, edges close to frame. Reinforce «comfortable margins all around, full character visible с breathing room».
- **Background contamination** — modal adds atmospheric tint, vignette, or gradient. Reinforce «pure uniform `#1A1A1A` background, no vignette, no gradient, no atmospheric tinting».
- **Floor reference drift** — modal adds ground plane / shadow / reflection. Reinforce «brackets float in mid-air, no ground, no shadow on floor, no reflection».
- **Cyan haze drift** — atmospheric cyan tint появляется в background. Reinforce «background pure dark, no cyan ambient, glow does not project на background».
- **Composition asymmetry** — modal places brackets asymmetrically (left bracket different vertical position than right). Reinforce «mirror symmetric composition, both brackets at identical vertical positions».
- **Aspect drift** — output не respects aspect ratio specified. Reinforce explicit aspect ratio в каждом prompt (1:1 для R-02/R-04/R-06, 16:9 для R-01/R-03/R-05).

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (что в кадре)
- **Bronze / Patina / Glow** — material и surface specs которые рендерятся в композиции
- **Face** — `canon-face.md` (face composition position rules)
- **Lighting** — `canon-lighting.md` (как свет рендерится в композиции)
- **States** — `states.md` (per-state какие references / which composition variant)
- **Continuity Block** — `continuity-block.md` (paste-ready composition section)
- **Marketing Surfaces** — `marketing-surfaces.md` (per-surface composition rules)
- **References** — `references-rag-sources.md` (Apple Sept 2025 product reveal aesthetic, Bauhaus composition principles)

## Lock status

Composition rules — **LOCKED v1 (session 254, 2026-04-26)**.

6 canonical reference shots — defined. Aspect ratios — locked. Centering / margins / background uniformity — non-negotiable for reference shots.

Refinements которые НЕ нарушают lock:
- Уточнение exact margin percentages
- Уточнение atmospheric haze density в R-01
- Per-surface composition variations в UI illustrations
- New reference shots adding (R-07, R-08 etc — с decisions-log entry)
