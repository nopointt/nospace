---
name: mascot_meme_motion_talk_animation
description: Полная Talk Animation v1 спецификация. 10 sub-states (Idle / Auftakt / Vowels / Consonants / Word boundaries / Phrase boundaries / Asymmetric coupling / Emotion modulation / Face response / Patina glow modulation). RAG-grounded по Bauhaus + Disney 12 principles + Pixar Luxo Jr precedent. Implementation hints для SVG / Web Audio / Framer Motion / Lottie.
type: reference
version: v1
locked: 2026-04-26 (session 253 talk animation lock)
---

# Meme — Talk Animation Specification v1

> Анимация речи. Этот файл — про motion когда Meme «говорит». Brackets раздвигаются по X-axis вместо lip sync. Сам form / material — отдельные canon файлы. Idle / non-speech motion — `motion-idle-and-states.md`.

## Концептуальная модель

Talk animation работает **через горизонтальное отдаление brackets по X-axis**, без mouth, без lip-sync.

Это критически важно: текст не «произносится ртом», а **bracketing-event происходит** — каждый звук это акт раскрытия/смыкания brackets.

Метафорика: говорить = открывать brackets, чтобы выпустить контекст. Молчать = brackets at default distance.

Ритм speech передаётся через **rhythm of bracket separation**, не через morphological mouth shape variation.

### Why this approach

1. **No mouth design** — `philosophy.md` принципиально excludes mouth from Meme. Talk animation должна работать без visible mouth articulation.
2. **Bauhaus rhythm** — per Van Doesburg P-17, rhythm of unequal accents is principle. Talk animation operates at pure rhythmic level (bracket spread amplitude + timing), не на articulatory level (mouth shape + phoneme).
3. **Production stability** — lip sync в Veo 3.1 ~25-40% reliable rate. No-mouth bracket motion is **architecturally simpler** — Veo handles object separation cleanly.
4. **Distinctive character signature** — bracket X-axis separation как «speech» is novel design choice. Once established, becomes recognizable «Meme is speaking» visual signature.

## RAG sources

### Bauhaus principles applied to motion

| Source | Principle | Application к talk |
|---|---|---|
| **Van Doesburg P-17** (1925, Rhythmus) | «Rhythm of UNEQUAL accents» | Brackets никогда не двигаются metronomically. Каждый раз амплитуда чуть другая. Mechanical = death; unequal = life. |
| **Klee P-16** (1925, rhythm structural) | «Design system so any unit can be removed/added and rhythm holds» | Не создавать unique-moment-tied keyframes per phoneme. Animation = structural pattern, не precise lip-sync. Phonetic approximation достаточна. |
| **Kandinsky P-19** (1926, point/line) | «Punkt = rest, Linie = inner-moved tension born of movement» | Closed brackets = Punkt (rest state). Opening = Linie (tension carrying intention). Cycle: Punkt → Linie → Punkt. |
| **Moholy-Nagy P-03** (1929, Schwingung) | «Hand registers Schwingung (oscillation) and Druck (pressure)» | Brackets oscillate с pressure dynamics. Не uniform пульс — variable amplitude и timing. |
| **Schlemmer P-09** (1925, stage as organism) | «Every element's behavior affects every other» | Если brackets двигаются, face response обязателен. Eye dots пульсируют синхронно с vowel peaks. |
| **Schlemmer Bewegung** (1925) | «Sequential frames, incremental repositioning» | Animation работает в discrete keyframes (внутренние 12-15 fps), плавная интерполяция между. |
| **Kandinsky Sprache** (vocab) | «Visual language formed by point-line combinations — unreachable by words» | Talk не воспроизводит слова — он создаёт визуальный язык параллельный речи. |

### Web research sources

| Source | Principle | Application |
|---|---|---|
| Disney/Pixar 12 principles (1981 Thomas/Johnston) | Anticipation: small action before main action | 80ms перед первым словом — brackets squeeze inward 2% (tension before release) |
| Luxo Jr. (Pixar 1986) | Personality without face — through timing/squash/stretch only | Прямой precedent для Meme. Brackets carry character без mouth |
| Phoneme research (linguistics) | Mouth opening correlates with vowel duration | Bracket separation amplitude = vowel openness; time held = duration |
| Linguistic research (vowels before fricatives) | Vowels longer before fricatives than stops | Brackets hold longer for /a/-/f/-/o/ sequence than /a/-/p/-/o/ |
| NN/G research (robot mouth study, 2023) | Robot with mouth perceived more lifelike + less sad | But Meme не робот — Meme является brand symbol, и геометрический язык скобок усиливает не уменьшает character |
| Wall-E character design | Two eyes + body language conveys full personality without mouth | Confirms no-mouth design viable для extended emotional range |
| BB-8 character design | Head tilt + sound = communication signal | Head-position equivalent в Meme = bracket gap variation |

## Animation states (10 sub-states)

### State 1 — Idle (no speech)

**Function:** Default state. Meme present, not speaking.

| Parameter | Value |
|---|---|
| Bracket distance | **D₀** (default gap, 3-4 cm equivalent) |
| Micro-breath oscillation | ±1% amplitude, 8-second period, irregular phase |
| Eye blink interval | Every 6-12 seconds, irregular |
| Blink duration | 80ms close → 40ms hold (variable) → 80ms open |
| Patina glow oscillation | ±3% amplitude, 8-second period (slower than breath, creating polyrhythm) |

Note: Idle is shared with `motion-idle-and-states.md`. Repeated here для completeness в talk animation context.

### State 2 — Speech opening (Auftakt / anticipation)

**Function:** Anticipation before speech begins. Disney 12 principles principle 1 (Anticipation).

| Parameter | Value |
|---|---|
| Timing | T = -80ms (80ms before first word) |
| Brackets squeeze | Inward by 2% (D₀ × 0.98) — anticipation compression |
| Patina glow | Brightens by 5% (anticipation energy) |
| Child eye dot | Widens by 5% (alertness) |
| Old eye dot | Remains (он уже знал что щас будут говорить — wisdom in foresight) |

**T = 0ms** — speech begins.

### State 3 — Vowels (open, sustain)

**Function:** Vowel sounds carry through bracket separation. Open mouth shape → wide bracket spread.

| Vowel category | Bracket spread | Hold duration | Curve |
|---|---|---|---|
| **Open /a/, /o/** (открытые) | D₀ × 1.40-1.60 | 80-120ms | ease-out opening, ease-in closing |
| **Front /e/, /i/** (передние) | D₀ × 1.15-1.25 | 50-80ms | ease-out, ease-in |
| **Rounded /u/, /ю/** (округлённые) | D₀ × 1.05-1.10 | 60-80ms | gentle curve |

При vowel peak — eye dots brighten by 3-5% (Schlemmer organism response).

### State 4 — Consonants

**Function:** Consonants carry through compression / vibration / quick movements.

| Type | Bracket behavior | Duration |
|---|---|---|
| **Stops /p t k b d g/** | Snap close to D₀ × 0.95, then return to D₀ | 30-50ms total, hard edges |
| **Fricatives /f s sh v z/** | Hold at D₀ × 1.05 with 5-10Hz micro-vibration (sustained narrow channel) | 80-150ms |
| **Nasals /m n/** | Close to D₀ × 0.92 (compressed) | 50-80ms |
| **Liquids /l r/** | D₀ × 1.10 with smooth flow | 80-120ms |

### State 5 — Word boundaries

**Function:** Brief pauses между words.

| Parameter | Value |
|---|---|
| Pause duration | 60-100ms |
| Bracket position | Return to D₀ (rest, mini-Punkt — Kandinsky) |
| Glow modulation | Dims by 5% during pause (breath in) |
| Face eye dots | Steady, no blink |

### State 6 — Phrase / sentence boundaries

**Function:** Longer pauses между phrases / at sentence ends.

| Parameter | Value |
|---|---|
| Pause duration | 200-300ms |
| Bracket position | Return to D₀ (full rest) |
| Glow modulation | Dims by 10%, breathes back up over 200ms |
| Optional blink | At sentence end (50% probability, irregular) |

### State 7 — Asymmetric coupling (CRITICAL — это что делает organic)

**Function:** Left и right brackets двигаются АСИММЕТРИЧНО. Per Van Doesburg P-17.

| Parameter | Value |
|---|---|
| Phase offset | 5-15° always present между left and right |
| Lag/lead behavior | Left lags right by 15-30ms on opening, leads on closing (or vice versa per phrase) |
| Amplitude difference | Left = 100% reference, right = 90-110% (varies per phrase, by ±10%) |

**Это ключ к organic vs mechanical.** Perfect mirror motion = robot. Slight lag/lead = alive.

Per Van Doesburg P-17: «rhythm of UNEQUAL accents». Equal = death.

### State 8 — Emotion modulation (Calm pillar capped)

**Function:** Speech intensity adjusts per character mood. But Calm pillar enforces ceiling.

| Mode | Amplitude scale |
|---|---|
| Whisper / contemplation | 0.6× |
| Default speech | 1.0× |
| Question / curious peak | 1.2× |
| Excited (rare) | 1.3× MAX |
| **Никогда** | >1.3× (Calm pillar Bauhaus — нет «крика») |

### State 9 — Face response (Schlemmer organism principle)

**Function:** Face does NOT lip-sync. Eyes respond as «organism» reacting к speech via Schlemmer P-09.

| Event | Eye response |
|---|---|
| Vowel peak | Eye dots brighten by 3-5% |
| Sentence end | Blink (80ms close → 80ms open) |
| Question (rising intonation) | Eyes raise 2-3px upward at sentence end |
| Period | Eyes settle back to neutral position |
| Curiosity moment | Child eye (larger) opens 10% wider, old eye stays squinted |

Face НЕ движется по X-axis вместе с brackets. Face floats steadily — она awareness, не часть speech apparatus.

### State 10 — Patina glow modulation

**Function:** Glow brightness syncs with speech rhythm.

| Parameter | Value |
|---|---|
| Glow vowel pulses | 5-10% amplitude over 80-120ms на vowel peaks |
| Loudness coupling | Glow intensity loosely correlates with audio amplitude |
| Color stability | Color stays cyan-teal — НИКОГДА не shifts during speech (color = identity, not emotion) |

## Implementation hints

### Web (SVG / CSS)

- SVG path morphing для bracket shapes
- CSS variable transforms: `--bracket-spread`, `--patina-glow`, `--eye-scale`
- Web Audio API → AnalyserNode → RAF loop driving CSS variables

```css
:root {
  --bracket-spread: 1.0;
  --patina-glow: 0.30;
  --eye-scale: 1.0;
}

.bracket-left { transform: translateX(calc(-1 * var(--bracket-spread) * 50%)); }
.bracket-right { transform: translateX(calc(var(--bracket-spread) * 50%)); }
.patina-patch { opacity: var(--patina-glow); }
.eye-dot { transform: scale(var(--eye-scale)); }
```

### Web Audio coupling

- AnalyserNode → frequency band split → bracket spread coupled to mid frequencies (300-3kHz speech band)
- RMS amplitude alone gives 80% of organic feel
- Phoneme detection optional — RMS amplitude alone достаточно для baseline

```javascript
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const dataArray = new Uint8Array(analyser.frequencyBinCount);

function tick() {
  analyser.getByteFrequencyData(dataArray);
  const speechBand = dataArray.slice(2, 12); // ~300-3kHz
  const rms = Math.sqrt(speechBand.reduce((s, v) => s + v * v, 0) / speechBand.length);
  const spread = 1.0 + (rms / 255) * 0.6; // map 0-1 → 1.0-1.6
  document.documentElement.style.setProperty('--bracket-spread', spread);
  requestAnimationFrame(tick);
}
```

### Animation library options

- **Framer Motion** — keyframe-based с smooth interpolation. Good for pre-defined sequences.
- **GSAP** — versatile, fine control, performance-optimized. Good for complex choreography.
- **Lottie** — sprite-sheet pre-rendered. Good for static animations не coupled to runtime audio.
- **Rive** — state machine animation. Good for complex character animation с triggers (см. `references-rag-sources.md` Duolingo Rive precedent).

For real-time TTS sync: **GSAP или Framer Motion + Web Audio API**.
For pre-rendered explainer videos: **Lottie или After Effects export**.

### Frame rate

- **Internal logical fps:** 12-15 fps (Schlemmer sequential frames)
- **Render fps:** 60fps with smooth bezier interpolation
- **Don't render at 60fps native** — feels too smooth, loses Bauhaus discrete-step character

This means: keyframes spaced at ~80ms (12fps), но playback interpolates smoothly.

### Voice sync

If using ElevenLabs voice (см. `voice-audio.md`):
- Generate audio first
- Use phoneme-level timing data (если available — некоторые ElevenLabs APIs return phoneme timings)
- Sync bracket spread peaks к vowel timings
- If no phoneme data — use RMS amplitude coupling as fallback

For pre-rendered explainer:
- Voice generated и imported into DaVinci
- Animation timeline aligned to voice manually
- Hand-keyframed bracket spread per phoneme timing

## Don'ts (Calm pillar enforcement)

- ❌ No bouncing
- ❌ No squash-and-stretch beyond ±5% per axis
- ❌ No exaggeration peaks beyond 1.3× amplitude
- ❌ No emoji-style expressions or expression swaps
- ❌ No "happy / sad" mode toggles — единая dual personality всегда
- ❌ No color shifts during speech (glow color = identity)
- ❌ No perfect bilateral symmetry (Van Doesburg P-17)
- ❌ No metronomic timing (always unequal accents)
- ❌ No additional gesture beyond bracket separation (no «hand wave» equivalents)
- ❌ No mouth animation despite spec (no mouth period)
- ❌ No vibration outside fricative consonant context (no «trembling» Meme)
- ❌ No glow halo expanding beyond patina patches (per `canon-bioluminescent-glow.md`)
- ❌ No background color shifts during speech
- ❌ No bracket geometry deformation (rectangles stay rectangles)

## Reference cycle (1 second of speech, simplified)

```
T=0ms:    [   ]  D₀ idle (canonical)
T=-80ms:  [  ]   D₀ × 0.98 anticipation (State 2)
T=0ms:    [    ] D₀ × 1.4 vowel /a/, hold 100ms, glow +8% (State 3 + State 10)
T=100ms:  [  ]   D₀ × 0.95 stop /t/, snap, 40ms (State 4)
T=140ms:  [   ]  D₀ × 1.05 fricative /s/, vibrate 5Hz, 100ms (State 4)
T=240ms:  [   ]  D₀ pause 80ms, glow -5% (State 5)
T=320ms:  [    ] D₀ × 1.2 vowel /e/, hold 70ms (State 3)
T=390ms:  [  ]   D₀ × 0.92 nasal /n/, 60ms (State 4)
T=450ms:  [    ] D₀ × 1.45 vowel /a/, hold 100ms, glow +8% (State 3)
T=550ms:  [   ]  D₀ × 1.10 liquid /r/, smooth, 90ms (State 4)
T=640ms:  [   ]  D₀ rest 60ms (word boundary, State 5)
T=700ms:  [next word ...]
```

Asymmetry: каждый из этих frames — left и right bracket двигаются с 15-30ms phase offset (per State 7 — асимметричное coupling).

## Visualization vs audio sync

### Pure visual (silent context)

In silent UI moments where Meme «говорит» через text bubble только (e.g., loading state «Просматриваю»):
- Bracket animation runs at canonical timing (per State 1-10 spec)
- No audio coupling needed
- Text appears синхронно с bracket separation rhythm
- Default 1.0× amplitude

### Audio-coupled (with voice)

When Meme has voice (per `voice-audio.md`):
- Audio drives bracket spread
- Speech band RMS → bracket spread amplitude
- Phoneme timings (если available) → vowel/consonant state transitions
- Asymmetric coupling preserved через slight time-offset on left vs right bracket animation

## Performance considerations

### Web

- Smooth 60fps target
- Use CSS transforms (GPU-accelerated)
- Avoid layout thrashing (don't change width/height; use transform: translateX)
- Limit AnalyserNode FFT size (256 bins enough)

### Pre-rendered video

- 24fps cinematic standard (matches Veo native output)
- Higher fps possible если delivered к platforms supporting (60fps на YouTube, etc.)
- Bauhaus discrete-step character: render at 24fps, не 60fps native

### Mobile

- Respect prefers-reduced-motion (CSS @media)
- Reduce bracket spread amplitude в reduced-motion fallback (e.g., 50% scale)
- Or: replace animation с static state с occasional minimal pulse

## Verification checklist

При implementation talk animation:

- [ ] Brackets separate via X-axis (не tilt, не rotate, не deform)
- [ ] Vertical bars stay vertical during separation
- [ ] Default rest gap visible between speech moments
- [ ] Vowel amplitudes match table (1.4-1.6× для open, 1.15-1.25× для front, 1.05-1.10× для rounded)
- [ ] Consonant behaviors match (stops snap quick, fricatives vibrate, nasals close, liquids flow)
- [ ] Asymmetric coupling preserved (left/right phase offset 15-30ms)
- [ ] Word boundaries visible (60-100ms returns к D₀)
- [ ] Phrase boundaries visible (200-300ms returns + glow dim)
- [ ] Eye blink at sentence ends (50% probability)
- [ ] Vowel peaks brighten eyes 3-5%
- [ ] Glow modulation syncs с vowel peaks (5-10% amplitude)
- [ ] Calm pillar respected — no amplitude > 1.3× even в excited mode
- [ ] No color shifts during speech (glow stays cyan-teal)
- [ ] No metronomic perfect timing
- [ ] No mouth, no facial articulation pretense
- [ ] Calm dual personality preserved через character

## Drift modes warning

Common drift в Veo / hand-animation:

- **Lip-sync drift** — animator или Veo tries to add mouth despite spec. Reinforce «no mouth, talk through bracket separation only».
- **Bracket tilt during speech** — brackets rotate or tilt. Reinforce «vertical bars stay vertical, only X-axis separation».
- **Symmetric motion drift** — left/right move перfectly synchronized. Reinforce «asymmetric coupling, 15-30ms phase offset, organic не mechanical».
- **Excessive amplitude drift** — modal generates >1.3× amplitude (excited / loud reading). Reinforce «Calm pillar capped, max 1.3×».
- **Color shift drift** — glow shifts color during speech (red anger / blue sad). Reinforce «glow color stays cyan-teal — color is identity, not emotion».
- **Metronomic drift** — perfect even timing. Reinforce «unequal accents per Van Doesburg, varied amplitude/timing».
- **Eye animation drift** — eyes animate too dramatically (winking, lash flutter). Reinforce «face response only via Schlemmer organism principle: vowel brightening, sentence-end blink».

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (bracket geometry which animates)
- **Material** — `canon-material-bronze.md`, `canon-material-patina.md` (materials don't change during animation)
- **Glow** — `canon-bioluminescent-glow.md` (glow modulation per State 10, level shifts)
- **Face** — `canon-face.md` (face response per State 9)
- **States** — `states.md` (Speech state references this spec)
- **Motion Idle** — `motion-idle-and-states.md` (Idle / Curious / Knowing / Bridging / Processing / Error animations)
- **Voice Audio** — `voice-audio.md` (audio coupling, sonic sync)
- **Voice Copy** — `voice-and-copy.md` (what Meme говорит — text triggering animation)
- **References** — `references-rag-sources.md` (Bauhaus + Disney + Pixar precedents)
- **Continuity Block** — `continuity-block.md` (talk animation context for Veo prompts)

## Lock status

Talk Animation — **LOCKED v1 (session 253, 2026-04-26)**.

10 sub-states defined. RAG sources cited. Disney/Bauhaus principles applied. Calm pillar capped. Asymmetric coupling — non-negotiable.

Refinements которые НЕ нарушают lock:
- Уточнение exact phoneme amplitude values
- Уточнение exact phase offset ranges
- Per-language tuning (RU vs EN phoneme inventories слегка различаются)
- Implementation framework recommendations refinement

History:
- v1 (session 253): Talk Animation 10-state spec finalized concurrent с form lock v6
