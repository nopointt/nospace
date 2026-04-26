---
name: mascot_meme_states
description: 7 каноничных состояний маскота Meme — Idle (canonical), Curious, Knowing, Bridging, Speech, Processing, Error. Glow level / eye behavior / bracket gap / trigger context. Запрет happy/sad/angry mode-toggles.
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — States

> Поведенческая спецификация. Этот файл — про какое состояние Meme в каком моменте. Forms / materials / glow scale — отдельные canon файлы. Animation timing — `motion-talk-animation.md`, `motion-idle-and-states.md`.

## Концептуальная модель

Состояния Meme — **выражения двойственности через комбинацию визуальных параметров**. Не «happy/sad/angry mode toggles». Не emotional masks. Это **subtle gradients** одной и той же character.

Парadigma: Meme — calm archivist в любом состоянии. Что меняется по states — это **что преобладает в данный момент** — child curiosity или old archivist knowing, и какой phase of work / interaction:
- Idle = присутствие
- Curious = открытие нового файла
- Knowing = recognition уже виденного
- Bridging = found connection
- Speech = communicating
- Processing = work in progress
- Error = something blocked

Все states **carry same character identity**. Glow color, geometry, face structure, material — all unchanged across states. Что варьируется — это **glow level, eye behavior, bracket gap, motion** — fine-grained variations.

## Canonical states list

7 states являются canonical:

| State | Trigger | Character mood | Height (% baseline) |
|---|---|---|---|
| **Whisper / contemplation** (rare) | Deep settled moments | Almost still, deeply settled | 92% |
| **Error** | Action blocked / failure | Restrained, signal-color overlay | 95% |
| **Knowing** | Recognition of seen-before pattern | Old-archivist forward, child-curiosity present but quiet | 97% |
| **Idle** (canonical) | Default, no specific event | Present, attending, dual-personality balanced | **100%** |
| **Speech** | Output to user / communicating | Active mode, brackets actuating | 100% (action via gap) |
| **Processing** | Indexing / parsing in progress | Working, focused, mostly silent | 100% (with ±2% breath) |
| **Curious** | New file appears, novel input | Child-curiosity forward, old-knowing present but quiet | 105% |
| **Bridging** | Connection found between data points | Both curious + knowing engaged, peak moment | 110% |

**NEVER:** «Happy», «Sad», «Angry», «Surprised» — these are mode-toggles нарушающие dual-personality discipline. Personality lives в asymmetry + duality, не в mode swaps.

## State 1 — Idle (canonical baseline)

### Trigger
- Default state when nothing specific is happening
- User is not actively engaging
- Background while waiting / between actions
- Reference image baseline (R-02 isolation = idle state)

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L2 (subtle, ~10% surface lift over bronze) |
| **Bracket gap** | Default 1× (3-4cm) |
| **Bracket position** | Perfectly vertical, parallel, no tilt |
| **Left eye** | Full circle bronze rim, full white iris, pupil upper-center |
| **Right eye** | Smaller, semicircle squint top, narrower iris band, pupil upper-center |
| **Eye blink** | Random irregular every 6-12 seconds |
| **Bracket breathing** | ±1% amplitude, 8-second period (subtle subtle) |
| **Glow oscillation** | ±5%, 8-second period synchronized with breath |

### Character reading
- Calm presence
- Dual personality balanced (neither child nor old man preferentially forward)
- Awareness of the room without active engagement
- Archivist at rest

### Where used
- Reference shots (R-02 isolation = canonical idle)
- UI loading states (low-action moments)
- Background mascot presence (e.g., favicon)
- Marketing reel idle moments
- Long-duration on-screen presence (waiting for user input)

### What this state is NOT
- Not bored (presence implies attention, just not reactive)
- Not asleep (no closed eyes, no slow breath)
- Not depressed (calm не sad)
- Not robotic / mechanical (slight breathing, eye blinks add life)

## State 2 — Curious

### Trigger
- New file uploaded to archive
- Novel input encountered
- Question posed to system
- Discovery moment (early phase — before recognition)

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L3 (visible, ~15% surface lift) |
| **Bracket gap** | Default 1× (no separation) |
| **Bracket position** | Perfectly vertical |
| **Left eye** | Iris widens 5-10% (visible enlargement, dilated curious gaze) |
| **Right eye** | Holds normal squint position |
| **Eye blink** | Slight pause (longer interval — focused) |
| **Pupils** | Both shift to upper-edge of iris (looking up — engaged interest) |
| **Bracket breathing** | Slightly faster (6-second period instead of 8) |
| **Glow oscillation** | ±5%, slightly faster cycle |

### Character reading
- Child curiosity primary signal
- Wide eye communicates «interest, attention forward»
- Calm but engaged
- About to be told something / about to discover

### Where used
- File upload completion (Meme сейчас просматривает)
- Search initiated
- New shared room invitation received
- Moment before content rendering
- Marketing reel: discovery beats (Clip 3 in DEEP-2 storyboard)

### Animation transition from Idle
- 250ms ease-out (motion duration token from design system: standard)
- Left eye widens, pupils shift up, glow lifts
- Smooth gradient (no stepped change)
- Per `motion-idle-and-states.md` curious state spec

### What this state is NOT
- Not surprised (curious is calm engagement, not shock)
- Not hyperactive (subtle widening, не drama)
- Not pleading (no social / supplicating reading)
- Not confused (curiosity is forward-leaning, not lost)

## State 3 — Knowing

### Trigger
- Recognition of pattern previously seen
- «I've seen this before» moment
- Resolution of search (familiar territory)
- Old-archivist signal: «yes, here's where it lives»

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L2 (same as idle) |
| **Bracket gap** | Default 1× |
| **Bracket position** | Perfectly vertical |
| **Left eye** | Holds normal full circle position |
| **Right eye** | Squint deepens — top edge bronze rim flattens further (more semicircle) |
| **Eye blink** | Slow, deliberate blink possible (signaling «I see») |
| **Pupils** | Settle slightly center (less upward drift than curious) |
| **Bracket breathing** | Slightly slower (10-second period) — settled rhythm |

### Character reading
- Old archivist primary signal
- Squint deepens reading «recognized, contextualized»
- Calm acknowledgment
- «Yes, here it is» mood

### Where used
- Search results shown — Meme acknowledges «found it»
- Returning user after long absence
- Recognition of known file pattern
- Empty state «no files» — Meme knows there's nothing to retrieve, still calm
- Marketing reel: action beats following discovery (Clip 4 в DEEP-2 storyboard, satisfaction phase)

### Animation transition from Idle
- 150ms (faster than curious — acknowledgment is sharper)
- Right eye squint deepens, glow holds at L2
- Per `motion-idle-and-states.md` knowing state spec

### What this state is NOT
- Not satisfied (knowing is recognition, не satisfaction)
- Not arrogant (no «I told you so» reading)
- Not dismissive (knowing acknowledges value)
- Not bored (recognition is active, not passive)

## State 4 — Bridging

### Trigger
- Connection found between two pieces of data
- Cross-reference established
- «Похоже, это уже было — в трёх местах» moment
- Multiple sources unified в one answer

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L4 (bright, ~20% surface lift) |
| **Bracket gap** | Default 1× |
| **Bracket position** | Perfectly vertical |
| **Left eye** | Full circle, iris brighter |
| **Right eye** | Less squint than knowing, both eyes more equal momentarily |
| **Eye blink** | Hold open (no blink during bridging moment) |
| **Pupils** | Both centered on viewer (acknowledgment direct gaze) |
| **Bracket breathing** | Brief pause (2-3 seconds) — held attention |
| **Glow oscillation** | Brief brighter peak then settles back |

### Character reading
- Both child + old archivist forward simultaneously
- Peak engagement moment
- «I see the connection, this matters»
- Brief moment of satisfaction (но not warm-fuzzy — calm satisfaction)

### Where used
- Search returns results spanning multiple files
- Found duplicate / similar content across rooms
- Pattern recognition surfaces
- Marketing reel: discovery+bridge moment (Clip 3 climax to Clip 4 transition в DEEP-2 storyboard)
- Capability moment («Indexed 847 files. 8 minutes.»)

### Animation transition
- 400ms (deliberate per design-system motion duration)
- Glow lifts to L4, second arc может briefly appear visualizing connection
- Both eyes engage forward
- Per `motion-idle-and-states.md` bridging state spec

### What this state is NOT
- Not triumphant (peak но calm, не «Eureka!»)
- Not dramatic (subtle lift, не fanfare)
- Not extended (brief moment, returns к idle / knowing within seconds)
- Not over-cheerful

## State 5 — Speech (talk animation)

### Trigger
- Meme actively communicating to user
- Output rendering in real-time
- Voice over (см. `voice-audio.md` for sonic side)
- Text speech bubble actuating

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L3 baseline + **vowel-peak transient lifts** to L3.5-L4 (brief 80-120ms pulses) |
| **Bracket gap** | Variable per phoneme: D × 0.95-1.6 |
| **Bracket position** | Vertical bars stay vertical (no tilt during separation) |
| **Inner edges** | 10-15% brighter glow (на patina patches на inner-facing surfaces) |
| **Eyes** | Asymmetry preserved, vowel peaks brighten eyes 3-5%, sentence-end blink possibly |
| **Face** | Floats steadily (does NOT move with brackets) |
| **Bracket motion** | Asymmetric coupling — left/right phase offset 15-30ms |

### Character reading
- Active communication
- Brackets carry voice через X-axis separation
- Calm but engaged speech
- Eyes synchronize subtly (vowel brightening), не lip-sync mimic

### Where used
- Marketing reel speech clips (Clip 4 в DEEP-2 storyboard)
- UI moments when Meme «says» something via bubble
- Animated explainer videos
- Voice-over context (combined with audio voice per `voice-audio.md`)

### Animation
Full спецификация — `motion-talk-animation.md`. 10 sub-states (Idle / Auftakt / Vowels / Consonants / Word boundaries / Phrase boundaries / Asymmetric coupling / Emotion modulation / Face response / Patina glow modulation).

### What this state is NOT
- Not rapid / urgent (calm speech rhythm, unhurried per `voice-audio.md`)
- Not exaggerated (Calm pillar — max amplitude 1.3× per Disney 12 principles application)
- Not lip-sync mimicry (no mouth, no facial articulation pretense)
- Not robotic (asymmetric coupling, unequal accents — alive)

## State 6 — Processing

### Trigger
- Indexing in progress (parse / chunk / embed pipeline running)
- Search query actively running
- Long-running operation (>2 seconds visible)
- Background work happening

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L2 baseline, **slowly oscillating ±2%** (rhythmic work pulse) |
| **Bracket gap** | Default 1× |
| **Bracket position** | Perfectly vertical |
| **Eyes** | Asymmetry preserved |
| **Eye blink** | Half-blink at ~6-second intervals (rhythmic, not full close) |
| **Pupils** | Slow drift возможен (small lateral movement, subconscious work signal) |
| **Bracket breathing** | Slightly slower (12-second period) — focused work rhythm |
| **Glow oscillation** | Slow rhythmic pulse synchronized with bracket breath |

### Character reading
- Working, focused
- Calm but occupied
- «Просматриваю архив» / «Reading»
- Rhythmic pulsing communicates «active», не frozen

### Where used
- File upload pipeline (parse → chunk → embed → index — 4-stage)
- Search processing (longer queries)
- Generic loading states
- Background tasks visible in UI

### Animation transition
- Slow ramp-up к processing state (500-700ms)
- Establishes rhythm
- Per `motion-idle-and-states.md` processing state spec — ceremonial duration motion (700ms)

### What this state is NOT
- Not anxious / stressed (calm work)
- Not staring blankly (eyes still alive, slight motion)
- Not «thinking hard» (no furrowed brow — he's an archive, не thinking, retrieving)
- Not progress-bar mimicry (Meme presence does not represent percent completion)

## State 7 — Error

### Trigger
- Action failed / blocked
- Permission denied
- Format unrecognized
- File corrupted / unreadable
- Network error
- Other failure modes

### Visual parameters

| Parameter | Value |
|---|---|
| **Glow level** | L1 (dimmed) OR signal-error red overlay (canon TBD per nopoint approval) |
| **Bracket gap** | Default 1× (or slightly compressed 0.95×) |
| **Bracket position** | Perfectly vertical |
| **Eyes** | **Both squinted** (left eye slightly squinted matching right; right eye stays squinted) |
| **Eye blink** | Suppressed (held expression) |
| **Pupils** | Centered (focused inward) |
| **Bracket breathing** | Paused or very slow |
| **Optional overlay** | Signal-error red (#) tint на patina (red replaces cyan-teal momentarily — TBD) OR remain L1 cyan-teal dimmed |

### Character reading
- Restraint, not alarm
- Issue acknowledged без drama
- Information shared без apology («Не открывается. Формат не понятен.»)
- Calm refusal / inability

### Where used
- File upload failed
- Permission denied UI
- Format unsupported
- Storage limit reached
- Network errors

### Animation transition
- Quick (200ms) settle to error state
- Per `motion-idle-and-states.md` error state spec
- May hold for several seconds (until user dismisses or system recovers)

### What this state is NOT
- Not apologetic (Meme не says «I'm sorry» — он informs)
- Not panicked (calm refusal)
- Not aggressive (no warning glow / pulsing alarm)
- Not dramatic (subtle restraint, не theatrical)

### Open question — overlay color

Decision pending nopoint approval (см. `open-questions.md`):
- **Option A:** L1 dimmed cyan-teal — restraint reading, consistent palette
- **Option B:** Signal-error red overlay momentarily — clearer error semantic
- **Option C:** Combination — bridge briefly red, settle to L1 dimmed

Currently L1 dimmed is default until decision finalized.

## Forbidden state-toggles

### Never use as states

| Forbidden state | Why excluded |
|---|---|
| **Happy** | Mode-toggle нарушает dual personality discipline. Joy expressed через L4 bridging or capability moment glow lift, не permanent state. |
| **Sad** | Mode-toggle. Calm does not equal sad. Error state covers blocked moments without sad implication. |
| **Angry** | Brand discipline — Meme is calm archivist, never aggressive. |
| **Surprised** | Curiosity covers novelty. Surprise would be too dramatic. |
| **Confused** | Knowing or processing covers «working through» moments. Confusion implies ineffective system. |
| **Bored** | Idle is canonical present-without-action. Boredom implies absence of attention. |
| **Excited** | Bridging covers peak moments. Excitement would be too performative. |
| **Sleepy** | Idle covers low-action moments. Sleep implies system inactive (it's not — async work). |
| **Smile** | Brand discipline — no mouth, no smile. Tested в session 254 R-02 development, abandoned. Bridging covers warm peak moments via glow lift. |
| **Frown** | No mouth. Error state covers issue acknowledgment без negative-mouth signal. |
| **Wink** | Disney/cartoon trope. Not Meme. |
| **Hand wave / arm gestures** | Meme has no limbs. Brackets carry full body language через X-axis separation. |

### Why no mode-toggles

- **Brand discipline** — dual-personality is character, single-mode toggles would simplify Meme into stock cartoon character
- **Reading test** — calm dual personality reads more sophisticated, more «archivist», less performative
- **Production stability** — fewer states = less Imagen / Veo regeneration variance
- **Audience trust** — tactical theatrical states would feel manipulative; calm states feel honest

## State transitions

### Allowed transitions

Idle → any (idle is baseline)
Idle ↔ Curious (most common)
Idle ↔ Knowing (most common)
Curious → Knowing (recognition after exploration)
Curious → Bridging (connection found mid-exploration)
Knowing → Bridging (cross-reference detected)
Any → Speech (when Meme outputs)
Any → Processing (when work begins)
Processing → Idle (when work completes)
Any → Error (failure mode)
Error → Idle (recovery / dismissal)

### Forbidden transitions

- ❌ Idle → Idle (no transition, just continuous)
- ❌ Two states simultaneously (either-or, not both)
- ❌ Skipping required intermediate state in narrative (e.g., directly Discovery without preceding Curious)
- ❌ Cross-clip state changes без in-clip animation (state must transition smoothly within frames, не cut)

### Transition timing

Per `motion-idle-and-states.md`:
- Idle ↔ Curious: 250ms (standard)
- Idle ↔ Knowing: 150ms (fast)
- Idle ↔ Bridging: 400ms (deliberate)
- Idle ↔ Speech: ramp via Auftakt (80ms anticipation)
- Idle ↔ Processing: 500-700ms ceremonial
- Idle ↔ Error: 200ms quick

## State combinations and overlap

### Single-state convention

**At any one moment, Meme is in exactly one canonical state.** Не «curious AND speech simultaneously».

But:
- **Speech overlays** на underlying state — Meme может be in Curious sub-mode while speaking, expressing «curious about this thing I'm telling you»
- **Processing overlays** — UI shows processing state visualization while Meme в Idle background
- **Error interrupts** — error state takes priority, suspending other states until resolved

### Speech sub-modes

В Speech state, Meme может carry undertones of other states:
- Curious-speech: brackets actuate while child-eye widens (he's communicating something he's exploring)
- Knowing-speech: brackets actuate while old-eye squints (he's communicating recognition)
- Bridging-speech: brackets actuate while glow lifts L4 (he's communicating a found connection)

These are **modulations** on Speech canonical, не separate states. State remains «Speech» but flavored.

## Verification checklist

При generation reference / clip, identify which canonical state and verify:

- [ ] Glow level matches canonical state (L2 idle, L3 curious, etc.)
- [ ] Bracket gap matches state (1× default, 0.95-1.6× speech, possibly 0.95× error)
- [ ] Eye behavior matches state (left eye widens? right eye deepens squint?)
- [ ] Asymmetry preserved (always)
- [ ] Pupil position appropriate per state (upper-center idle, upper-edge curious, центр knowing)
- [ ] Bracket breathing rhythm appropriate
- [ ] Glow oscillation behavior matches state
- [ ] Forbidden states / state-toggles NOT present (no smile, no frown, no surprise, etc.)
- [ ] State transition smooth если visible
- [ ] One canonical state at a time (Speech as overlay, не separate)

## Drift modes warning

Common drift в Imagen / Veo:

- **Mode-toggle drift** — modal generates «happy face» or «sad face» despite spec. Reinforce «no mode-toggle facial expressions, Meme is calm in all states, character lives через asymmetry not via mode switches».
- **Smile drift** — modal adds smile despite no-mouth rule. Reinforce «no mouth, NO smile, calm dual personality».
- **State explicit description** — when prompt explicit state «curious», modal might overshoot to surprise / shock. Reinforce «subtle, calm, dual personality, asymmetry preserved».
- **Identical states** — modal renders idle и curious indistinguishably. Reinforce specific differentiators (eye widening, glow level, pupil shift).
- **Glow level drift** — wrong glow level for stated state. Reinforce specific level («L2 subtle for idle», «L3 visible for curious»).

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (allowable variations per state)
- **Glow** — `canon-bioluminescent-glow.md` (5-level scale states reference)
- **Face** — `canon-face.md` (per-state pupil position, blink behavior)
- **Composition** — `canon-composition.md` (in-context vs reference per state)
- **Lighting** — `canon-lighting.md` (lighting consistent across states)
- **Motion** — `motion-talk-animation.md` (Speech state full spec), `motion-idle-and-states.md` (Idle / Curious / Knowing / Bridging / Processing / Error transitions)
- **Voice and Copy** — `voice-and-copy.md` (per-state copy voice)
- **Voice Audio** — `voice-audio.md` (per-state vocal modulation)
- **Continuity Block** — `continuity-block.md` (paste-ready state-specific blocks)
- **Anti-patterns** — `anti-patterns.md` (forbidden mode-toggles)
- **Open Questions** — `open-questions.md` (error state overlay color decision)

## Lock status

States — **LOCKED v1 (session 254, 2026-04-26)**.

7 canonical states defined. No mode-toggles allowed. Personality through dual + asymmetry, not through modes.

Refinements которые НЕ нарушают lock:
- Уточнение exact glow oscillation phases per state
- Уточнение exact bracket breathing periods
- Per-state speech sub-mode mappings
- Error state overlay color decision (current default L1 dimmed)

History:
- v1 (session 254): 7 states canonical, transitions defined, forbidden mode-toggles enumerated
