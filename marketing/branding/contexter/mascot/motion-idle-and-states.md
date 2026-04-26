---
name: mascot_meme_motion_idle_and_states
description: Анимация для всех non-speech состояний. Idle 8-second breath cycle. Eye blink intervals. Glow polyrhythm. Curious / Knowing / Bridging / Processing motion. Duration tokens из design system. No bouncing rule. prefers-reduced-motion fallback.
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Motion: Idle and States

> Анимация non-speech states. Этот файл — про motion в idle / curious / knowing / bridging / processing / error. Speech motion — `motion-talk-animation.md`.

## Концептуальная модель

Non-speech motion — **subtle, continuous, organic**. Meme не frozen sculpture. Он **breathing, blinking, slowly oscillating** даже в полном покое.

Цель: **«живой, но calm»**. Movement is present но never demanding attention. Per Van Doesburg P-17 unequal accents — irregular natural rhythm, не metronomic.

Все non-speech motion respects:
- **Calm pillar** — никаких dramatic movements
- **Sparing pillar** — minimum motion для maximum life
- **Bauhaus duration tokens** (см. `design/contexter/guidelines/motion.md`) — instant 80ms / fast 150ms / standard 250ms / deliberate 400ms / ceremonial 700ms
- **No bouncing, no squash > 5%, no popping**

## Duration tokens (design system reference)

Из design-system motion guidelines (`nospace/design/contexter/guidelines/motion.md`):

| Token | Value | Used in mascot states |
|---|---|---|
| `duration.instant` | 80ms | Auftakt anticipation, eye blink close/open |
| `duration.fast` | 150ms | Knowing transition, pupil shifts |
| `duration.standard` | 250ms | Curious transition, default state changes |
| `duration.deliberate` | 400ms | Bridging transition |
| `duration.ceremonial` | 700ms | Processing initiation, error settle |

Easing tokens:
- `easing.aktiv` (ease-out) — entering states
- `easing.passiv` (ease-in) — exiting states
- `easing.medial` (ease-in-out) — transitions between states
- `easing.linear` — only for progress bars (не используется в mascot)

## State 1 — Idle (canonical baseline)

### Continuous motion

Idle is **not static**. Three concurrent motion patterns:

#### 1. Bracket breathing

| Parameter | Value |
|---|---|
| Amplitude | ±1% от bracket dimensions (subtle subtle) |
| Period | 8 seconds |
| Phase | Irregular (per Van Doesburg P-17) |
| Pattern | Slight expansion / contraction в both X and Y axes simultaneously |

Visual: brackets seem to «breathe» very slightly. Almost imperceptible at casual viewing, contributing к «alive» reading.

In rendering:
- Width oscillation: bracket horizontal segment length varies ±1%
- Height oscillation: bracket vertical bar height varies ±1%
- Synchronized but not identical (slight phase offset between width and height)

#### 2. Eye blink

| Parameter | Value |
|---|---|
| Interval | Every 6-12 seconds, irregular |
| Close phase | 80ms (instant token) |
| Hold closed | 0-20ms (variable, sometimes no hold) |
| Open phase | 80ms (instant token) |
| Total blink duration | ~160-180ms |

Blink mechanics:
- Bronze rim narrows top-to-bottom (eyelid action)
- White iris fully covered momentarily
- Pupil hidden during blink
- Bronze rim outer shape preserved (only inner closes)

Blinks могут occur sequentially (left и right) с **slight stagger** (left blink first by ~30-50ms) or simultaneously. Variation natural.

#### 3. Glow oscillation (patina)

| Parameter | Value |
|---|---|
| Amplitude | ±5% от current glow level (e.g., L2 baseline 10% → oscillates between 9.5% и 10.5%) |
| Period | 8 seconds, synchronized с bracket breathing |
| Phase | Slightly offset from bracket breathing (creates polyrhythm) |
| Per-patch variation | Each patina patch может slightly different phase / amplitude (subtle, organic) |

Glow oscillation reinforces «organism» reading — phosphorescent activity inside patina is alive.

### Polyrhythm

Idle creates **subtle polyrhythm** between three concurrent motion patterns:
- Bracket breath: 8-second period
- Eye blink: irregular 6-12 second intervals
- Glow oscillation: 8-second period (phase-offset from breath)

These cycles overlap но never perfectly synchronize. Per Van Doesburg P-17 — rhythm of unequal accents.

### Duration to enter idle

When Meme returns to idle from any other state — transition takes appropriate duration token:
- From Curious → Idle: 250ms (standard, ease-in-out)
- From Knowing → Idle: 150ms (fast)
- From Bridging → Idle: 400ms (deliberate, easing back from peak)
- From Speech → Idle: 200-300ms (phrase boundary settling)
- From Processing → Idle: 500-700ms (ceremonial, work completing)
- From Error → Idle: 200ms (after dismissal)

## State 2 — Curious

### Trigger animation

Idle → Curious transition: **250ms (standard)** with `easing.aktiv` (ease-out).

| Parameter | Animation |
|---|---|
| Bracket gap | Hold at D₀ (no separation in curious) |
| Left eye iris | Widens 5-10% over 250ms |
| Right eye | Holds (no change) |
| Both pupils | Shift к upper-edge of iris over 200ms |
| Glow level | Lifts from L2 → L3 over 250ms |
| Bracket breath | Speeds up from 8-second period to 6-second (subtle) |
| Glow oscillation | Speeds up matching breath (6-second period) |

### During curious

Sustained motion patterns:

| Parameter | Value |
|---|---|
| Bracket breath | ±1% amplitude, 6-second period (faster than idle) |
| Eye blink | Slower interval (8-15 seconds) — focused, less blinking |
| Glow oscillation | ±5%, 6-second period |
| Pupil drift | Small lateral movement (1-2 degree gaze shifts every 2-3 seconds — exploring) |

### Trigger from curious

Curious → Idle: 250ms (standard, ease-in-out)
Curious → Knowing: 150ms (fast — recognition follows curiosity)
Curious → Bridging: 400ms (deliberate — connection established)

### Don'ts

- ❌ No dramatic pupil dilation (5-10% widening only, не cartoon huge eyes)
- ❌ No rapid eye darting (2-3 second shifts, не nervous fast)
- ❌ No bracket separation (curious is calm anticipation, не speech-ready)
- ❌ No leaning forward (no body posture — geometry stays upright)

## State 3 — Knowing

### Trigger animation

Idle → Knowing transition: **150ms (fast)** with `easing.aktiv`. Recognition is sharper than curiosity.

| Parameter | Animation |
|---|---|
| Bracket gap | Hold at D₀ |
| Left eye | Holds (no change in size) |
| Right eye | Squint deepens — top edge bronze rim flattens further over 150ms |
| Both pupils | Settle slightly toward center over 150ms |
| Glow level | Holds at L2 (same as idle — knowing is calm acknowledgment) |
| Bracket breath | Slows from 8-second period to 10-second (settled rhythm) |

### During knowing

Sustained motion:

| Parameter | Value |
|---|---|
| Bracket breath | ±1% amplitude, 10-second period (slower than idle) |
| Eye blink | Slow deliberate possible (signaling «I see») — about every 5-8 seconds |
| Glow oscillation | ±5%, 10-second period |

### Optional: deliberate blink

In knowing state, Meme может do **deliberate slow blink** as «I recognize this» signal:
- Close 200ms (slower than normal blink)
- Hold 100-150ms (longer hold — emphasis)
- Open 200ms

This is **optional**, used sparingly для specific recognition moments в context.

### Trigger from knowing

Knowing → Idle: 150ms (fast)
Knowing → Bridging: 400ms (deliberate)
Knowing → Speech: 200ms (settling into speech)

### Don'ts

- ❌ No dramatic eye narrowing (only top edge of right rim flattens further, не whole eye narrows)
- ❌ No head nod (no head — face floats, no nodding gesture)
- ❌ No glow spike (knowing is acknowledgment, не recognition celebration — that's bridging)

## State 4 — Bridging

### Trigger animation

Idle → Bridging transition: **400ms (deliberate)** with `easing.medial`. Peak moment, more deliberate than other transitions.

| Parameter | Animation |
|---|---|
| Bracket gap | Hold at D₀ |
| Left eye iris | Brightens (slight saturation lift in white) over 400ms |
| Right eye | Less squint than knowing — both eyes more equal momentarily over 400ms |
| Both pupils | Center on viewer (acknowledgment direct gaze) over 300ms |
| Glow level | Lifts from L2 → L4 over 400ms |
| Bracket breath | Brief pause (held attention) for 2-3 seconds |
| Glow oscillation | Brief brighter peak over 400ms then settles back to L4 oscillating |

### During bridging

Sustained motion (brief — 2-5 seconds typical):

| Parameter | Value |
|---|---|
| Bracket breath | Held at peak position для 2-3 seconds, then resumes ±1% breathing |
| Eye blink | Suppressed during bridging moment (held attention) |
| Glow oscillation | ±10% amplitude (more visible variation at L4 — energy of moment) |

### Optional: «second arc» visualization

In bridging, **second arc может briefly appear** visualizing the connection:
- Subtle arc / line emerges from one bracket к other (visual representation of «connection found»)
- Or: glow temporarily intensifies on inner edges connecting brackets
- 200-300ms duration
- Optional, content-aware (used когда specific cross-reference visualization makes sense)

### Trigger from bridging

Bridging → Idle: 400ms (deliberate, settling back)
Bridging → Knowing: 200ms (transitioning к acknowledgment phase)

### Don'ts

- ❌ No exaggerated dramatic peaks (subtle bridging, не fireworks)
- ❌ No prolonged bridging state (2-5 seconds max — character signal moment, не sustained)
- ❌ No L5 glow (Calm pillar enforces L4 maximum)
- ❌ No bracket motion (geometry stable during bridging)

## State 5 — Processing

### Trigger animation

Idle → Processing transition: **500-700ms (ceremonial)** with `easing.medial`. Slow ramp-up establishes work rhythm.

| Parameter | Animation |
|---|---|
| Bracket gap | Hold at D₀ |
| Eyes | Asymmetry preserved |
| Glow level | Holds at L2 (subtle) |
| Bracket breath | Slows from 8-second period to 12-second |
| Glow oscillation | Begins rhythmic ±2% pulse synchronized with breath |
| Pupil behavior | Small lateral drift begins (subconscious work signal) |

### During processing

Sustained motion (can last seconds to minutes):

| Parameter | Value |
|---|---|
| Bracket breath | ±1% amplitude, 12-second period (slower than idle, focused work) |
| Eye blink | Half-blink at ~6-second intervals (rhythmic, not full close — about 50% close) |
| Glow oscillation | ±2% amplitude (subtle, less variation than idle ±5%) |
| Pupil drift | Slow lateral movement, 1-3 degree shifts every 4-6 seconds |

### Half-blink mechanics

Half-blink:
- 80ms close partway (bronze rim closes к 50% iris coverage)
- 50ms hold (less than full blink hold)
- 80ms open

Reads as «working, focused, half-attentive» rather than full alert или full closed.

### Optional: visual progress overlay

Processing может overlap с **UI progress visualization** (e.g., 4-stage pipeline indicator near Meme):
- Mascot in processing motion baseline
- Separate UI element shows stage progress
- Mascot не represents progress percentage (he's just working)

### Trigger from processing

Processing → Idle: 500-700ms (ceremonial, work complete settling)
Processing → Bridging: 400ms (если processing surfaces a connection)
Processing → Error: 200ms (если processing fails)

### Don'ts

- ❌ No anxious / stressed motion (calm work)
- ❌ No staring blank (eyes still alive с slight motion и blink)
- ❌ No furrowed brow (no brow, no expression of strain)
- ❌ No spinning / rotating animation (Meme не progress spinner)

## State 6 — Speech (cross-reference)

Speech motion — full spec в `motion-talk-animation.md`. Brief summary:
- Idle → Speech transition: 80ms anticipation (Auftakt)
- During speech: 10 sub-states active per `motion-talk-animation.md`
- Speech → Idle: 200-300ms phrase boundary settling

## State 7 — Error

### Trigger animation

Idle → Error transition: **200ms (between fast и standard)** with `easing.aktiv`. Quick settle.

| Parameter | Animation |
|---|---|
| Bracket gap | Stays at D₀ (or compresses slightly to D × 0.95 over 200ms) |
| Left eye | Slightly squinted (matching right eye) — both eyes squint similarly over 200ms |
| Right eye | Stays squinted |
| Both pupils | Settle к center over 200ms |
| Glow level | Drops from L2 → L1 over 200ms |
| Bracket breath | Pauses |
| Glow oscillation | Stops (frozen at L1) |

### During error

Sustained:

| Parameter | Value |
|---|---|
| Bracket breath | Paused or very slow (>15 second period if any) |
| Eye blink | Suppressed (held expression) |
| Glow level | L1 dimmed |

### Optional overlay (TBD)

Per `states.md` open question: signal-error red overlay possible:
- Glow color может briefly shift cyan-teal → signal-error red over 100ms
- Hold red for 1-2 seconds
- Settle back to cyan-teal at L1

Currently default: just L1 dimmed без color shift. Decision pending nopoint approval (см. `open-questions.md`).

### Trigger from error

Error → Idle: 200ms (after dismissal или recovery)
Error → Processing: 500ms (если retrying operation)

### Don'ts

- ❌ No alarm pulsing (red not blinking)
- ❌ No dramatic shake / tremor (Meme не panicked)
- ❌ No drop / fall motion (geometry stays upright)
- ❌ No apology gesture (no body / hand language for «sorry»)

## prefers-reduced-motion fallback

When user has `prefers-reduced-motion: reduce` set:

| State | Reduced motion |
|---|---|
| Idle | Static (no breathing, no blinking, no glow oscillation) |
| Curious | Static frame с widened left eye (key state visible without animation) |
| Knowing | Static frame с right eye more squinted |
| Bridging | Static frame с L4 glow и centered pupils (peak moment captured) |
| Speech | Static frame с brackets at average D × 1.2 separation, glow L3 |
| Processing | Static frame, может add small infinite spinner external indicator если progress signaling needed |
| Error | Static frame с L1 dimmed |

Per design system motion rule: «prefers-reduced-motion → all durations to 0ms».

This means transitions are instant (single frame change), and continuous motion patterns (breath, blink, oscillation) are suspended.

## Per-surface motion

### Web app UI

- Smooth 60fps animation
- Web Audio coupling possible for speech state
- CSS variable transforms for performance
- Respects prefers-reduced-motion

### Mobile

- Same as web (responsive)
- Reduced battery: optionally simpler patterns если battery saver active

### Marketing video (Veo / explainer)

- 24fps cinematic standard
- Continuity table preserved across clips
- Transitions baked into video timeline (не runtime)

### Pre-rendered Lottie

- All states pre-baked
- Transitions triggered by JSON state markers
- Performance-optimal for content-heavy contexts

## No bouncing, no squash, no popping rule

Per design discipline:

- ❌ **No bouncing** — Meme не bounces. He's a calm archivist, не cartoon character. No spring physics. No oscillation amplifying.
- ❌ **No squash > 5%** — bracket geometry can deform max 5% per axis (e.g., D × 0.95 to D × 1.6 в speech). Beyond this — drift toward cartoon.
- ❌ **No popping** — no sudden scale changes. All transitions are interpolated.
- ❌ **No popping in glow** — glow doesn't toggle on/off instantly. All glow changes are smooth gradients.
- ❌ **No popping в pupil position** — pupils smooth slide, не teleport.

## Performance considerations

### Web

- Use CSS transforms (GPU-accelerated)
- Limit AnalyserNode FFT size (256 bins for speech coupling)
- Throttle rAF if not visible (Page Visibility API)
- Use `will-change` sparingly (только on actively animating elements)

### Render budgets

- Idle motion: ~60fps target, simple updates (1-2 transforms per frame)
- Speech motion: ~60fps target, more complex (5-10 transforms per frame)
- Reduced motion: 0fps for continuous patterns

## Verification checklist

При implementation idle и states motion:

- [ ] Idle has 3 concurrent patterns: breath, blink, glow oscillation
- [ ] Polyrhythm visible (cycles overlapping без perfect sync)
- [ ] Curious eye widening 5-10% only (not dramatic)
- [ ] Knowing right eye squint deepens (not whole eye narrows)
- [ ] Bridging brief 2-5 seconds, glow lifts to L4
- [ ] Speech transitions through Auftakt (80ms anticipation)
- [ ] Processing slow rhythmic (12-second breath, half-blinks)
- [ ] Error settles quickly (200ms), L1 dimmed
- [ ] All transitions use design system motion tokens
- [ ] No bouncing, no squash > 5%, no popping
- [ ] prefers-reduced-motion fallback implemented
- [ ] Calm pillar enforced (no dramatic peaks beyond 1.3× speech amplitude)

## Drift modes warning

Common drift в implementation:

- **Bouncing drift** — animator adds spring physics. Reinforce «no bouncing, calm continuous motion only».
- **Excess amplitude drift** — breathing or oscillation at >2% (looks pulsing). Reinforce «±1% breath, ±5% glow, subtle barely visible».
- **Metronomic drift** — perfect even cycles (8.0 second exactly). Reinforce «irregular phase per Van Doesburg unequal accents».
- **Synchronized blinks drift** — blinks sync с other characters / effects. Reinforce «irregular interval 6-12 seconds, не synchronized to anything».
- **Pop transitions** — instant state changes. Reinforce «smooth interpolation per design system duration tokens».
- **Reduced-motion violation** — animation continues despite user preference. Reinforce «prefers-reduced-motion → static states».

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (geometry which animates)
- **Material** — `canon-material-bronze.md`, `canon-material-patina.md` (materials)
- **Glow** — `canon-bioluminescent-glow.md` (5-level scale used per state)
- **Face** — `canon-face.md` (eye blink mechanics, pupil position)
- **Composition** — `canon-composition.md` (motion happens within composition)
- **States** — `states.md` (states which this file animates)
- **Motion Speech** — `motion-talk-animation.md` (Speech state animations)
- **Continuity Block** — `continuity-block.md` (state-specific motion contexts)
- **References** — `references-rag-sources.md` (Van Doesburg unequal accents principle, Disney 12 principles, design system motion tokens)

## Lock status

Idle и states motion — **LOCKED v1 (session 254, 2026-04-26)**.

Three concurrent patterns в idle (breath, blink, glow oscillation) — non-negotiable. Duration tokens via design system — locked. Calm pillar enforcement — non-negotiable. prefers-reduced-motion fallback — required.

Refinements которые НЕ нарушают lock:
- Уточнение exact periods и amplitudes
- Per-platform performance optimizations
- New states adding (с decisions-log entry)
- Half-blink mechanics уточнение

History:
- v1 (session 254): Idle 3-pattern polyrhythm finalized, all 7 states motion mapped, design system tokens integrated
