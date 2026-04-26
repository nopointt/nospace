---
name: mascot_meme_voice_audio
description: Звуковая подпись маскота Meme. 12-dimension sonic signature (pitch / age / gender / pace / rhythm / texture / tone / modulation / linguistic / precedents / sync / never). Real-world precedents (TARS / Bilbo / Каневский). ElevenLabs Voice Design implementation. Multilingual treatment.
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Voice Audio (Sonic Signature)

> Как Meme **звучит**. Этот файл — про audio voice. Что Meme **говорит** в тексте — `voice-and-copy.md`. Brand TOV в long-form — `nospace/marketing/branding/contexter/tov.md`.

## Концептуальная модель

У Meme — **есть голос**. Не narrator-voiceover. Не chatbot TTS smooth professional. Свой собственный sonic identity — голос Архивариуса 2050.

Identity в одной фразе:

> **Архивариус, который уже всё помнит — и не торопится произносить.**

Calm, slightly dry, slightly aged, mid-range, present without performance.

### Where this voice applies

Voice применяется в:
- **Reel video CTA** (3-second slogan на финальном кадре production reel) — primary v1 use
- **Marketing explainer videos** (long-form narrated content — phase 2)
- **Sound design moments** в product (если sound effects добавятся в UI — TBD per `open-questions.md`)

Voice **не применяется** в (current canon):
- Product UI loading states (UI silent в v1)
- Notification sounds (если будут — отдельный TBD canon)
- Voice assistant integration (out of scope сейчас)

См. `open-questions.md` для evolving usage.

### Sonic philosophy

Двойственность ребёнок+старик передаётся через **single voice который ОДНОВРЕМЕННО carries оба**, не через alternating «детский голос → старческий».

- Mid-range pitch — slight raspy edge (старик), но clean projection (ребёнок)
- Calm pacing с occasional brighter inflections (ребёнок прорывается на curiosity moments)
- Slight dry humour (NN/G 25% funny per TOV calibration)
- Indeterminate age — 40-55 perceived

«Lived experience but still curious» — single emotional register containing both.

## 12 dimensions sonic spec

### Dimension 1 — Pitch / range

| Aspect | Value |
|---|---|
| Pitch range | Mid-range, чуть ниже neutral |
| In EN | Mid-baritone (Hz range ~110-180Hz fundamental, varies by speaker) |
| In RU | Mid-tenor / baritone-tenor blend |
| Avoidance | NOT bass (становится movie villain / narrator), NOT high (becomes cartoon child) |
| Brighter inflections | Occasional moments — ребёнок-component прорывается на curiosity / connection моменты |

**Why mid-range:**
- Bass voice = villain / drama narrator territory
- High voice = cartoon child territory
- Mid = present without being performative

### Dimension 2 — Age perception

| Aspect | Value |
|---|---|
| Perceived age | 40-55 indeterminate |
| Quality | «Lived experience but still curious» |
| Не молодой | Voice не teenager / 20s |
| Не старик | Voice не grandfather voice |
| Texture | Slight raspy edge (старик), но clean projection (ребёнок) |

Age comes из **texture and confidence**, не из pitch lowering trickery.

### Dimension 3 — Gender

| Aspect | Value |
|---|---|
| Default canonical | Andro-leaning male |
| Localised variants possible | RU female calm reading может быть alternative (decision pending nopoint) |
| Avoidance | Голос не должен быть obviously gendered to break universal mascot читаемость |

**Why male default:**
- Mascot duality (ребёнок + старик) historically narrated в male в литературе
- But andro-leaning — not deeply male
- Variants for accessibility / cultural calibration возможны

### Dimension 4 — Pace

| Aspect | Value |
|---|---|
| Overall | Unhurried |
| Pause between phrases | 200-400ms |
| Pause between sentences | 500-800ms |
| Sparing pillar applied | Each word earns its place в audio |
| No filler | НЕТ «um», «well», verbal tics, false starts |

**Calm pace** is signature. Никогда не rushed.

### Dimension 5 — Rhythm

| Aspect | Value |
|---|---|
| Pattern | Asymmetric, не metronomic |
| Per Van Doesburg P-17 | Rhythm of unequal accents |
| Sentence length variation | Each sentence чуть другой длины, paused non-uniform |
| Mechanical = death | No metronomic timing |
| Unequal = life | Per Bauhaus principles |

Это same principle что и в talk animation State 7 (asymmetric coupling). Voice rhythm matches motion rhythm philosophy.

### Dimension 6 — Texture / timbre

| Aspect | Value |
|---|---|
| Bronze undertone | Light bronze undertone — голос как будто резонирует в metal cavity, очень subtle |
| Recording approach | Natural recording в reverb-light room + lightly EQ-ed |
| EQ guidance | Boost ~200Hz body, slight 3kHz presence cut for warmth |
| Avoidance | NO synth processing, NO pitched, NO autotune |
| Reading | Human voice с лёгким bronze warm coloration |

**Bronze undertone** — subtle texture connecting voice к material identity (bronze body). Achievable through natural production technique, не plugin processing.

### Dimension 7 — Tone baseline

| Aspect | Value |
|---|---|
| Baseline | Calm, measured, slightly dry |
| Reading | Like archivist explaining что было в drawer — не sales, не narration, не tutorial |
| Style | Direct, no preamble |
| Slight wry edge | Permitted (NN/G 25% funny) |
| Never | Sarcastic, performative |

Slight wry edge means: occasional dry observation. «Похоже, это уже было в трёх местах» reads slightly wry.

### Dimension 8 — Emotional modulation per state

| State | Vocal modulation |
|---|---|
| Idle (canonical baseline) | 1.0× baseline pitch, pace, intensity |
| Curious | 1.05× brightness, slight pitch lift (ребёнок forward) |
| Knowing | 0.95× brightness, slight pitch dip, more pause (старик forward) |
| Bridging | 1.1× brightness, slight emphasis (peak moment) |
| Speech (talk animation) | 1.0× normal — speech is action, не state shift |
| Processing | Dim, half-volume — work mode |
| Error | Dry-flat, no apology в voice |
| **Никогда** | >1.2× amplitude (Calm pillar) |
| **Никогда** | «Cheerful announcement» интонации |

### Dimension 9 — Linguistic style

#### RU

| Aspect | Value |
|---|---|
| Pronoun | «Вы» |
| Style | Информационный (Ильяхов framework) |
| Avoidance | Канцелярные обороты («является», «осуществляет», «в рамках») |
| Voice | Активный залог |
| Pronunciation | Sentence case произношение — без emphatic capitalization |
| Numbers | Spoken specifically («тридцать два файла», not «много файлов») |

#### EN

| Aspect | Value |
|---|---|
| Pronoun | «you» (never «u», never «ya'll») |
| Voice | Active voice, present tense |
| Pronunciation | Clean American neutral, no regional |
| Slight academic precision | Permitted |
| Numbers | Spoken specifically («thirty-two files») |

### Dimension 10 — Real-world voice precedents

Reference voices что близко к Meme:

#### Primary precedents

| Precedent | Source | What we take |
|---|---|---|
| **TARS** | Interstellar (2014) | Calm, dry humour, never performative. Slightly mechanical в delivery в lightest possible way. Confident dry observations. |
| **Bilbo Baggins (Ian Holm)** | LOTR / Hobbit films | Knowing, weary но warm, slightly hesitant. Lived-in voice. Wisdom без announce. |
| **Леонид Каневский** | «Следствие вели» Russian narrator | Calm baritone, slightly knowing, dry tone, present without excess. RU canonical reference. |

#### Secondary references

| Precedent | What relevant |
|---|---|
| Сергей Чонишвили | Calm baritone, present, dry tone (RU) |
| David Attenborough | Wisdom + warmth — но **too narrator** for Meme, take only confidence |
| Matrix Architect | Academic, precise — relevant для confident knowing |
| TAR-21 / Knight Rider KITT | Robotic warmth — too synthesized, не подходит, but rhythmic style близко |

#### What we DON'T take

| Anti-reference | Why excluded |
|---|---|
| HAL 9000 | Too sinister — calm but threatening |
| Mickey Mouse / cartoon high-pitched | Wrong age/character |
| Movie trailer dramatic announcer | Too performative |
| ChatGPT TTS smooth professional | Too generic AI assistant |
| Ray Liotta narrating Goodfellas | Too criminal-coded |
| Sam Elliott Big Lebowski | Too American-Western |
| Cheerful corporate VP voice | Too sales |
| Vocal fry casual millennial | Too informal |
| Whisper ASMR breathy | Wrong intimacy register |

### Dimension 11 — Synchronization с talk animation

| Aspect | Value |
|---|---|
| Audio onset sync | Coincides с bracket X-axis separation moments |
| Vowel peaks | → glow brightening sync (per `motion-talk-animation.md` State 10) |
| Phrase boundaries | → brackets return to default gap + glow dim |
| RMS amplitude | Correlates с patina glow modulation (loudness-coupled) |
| Lip-sync | NOT required — Meme has no mouth, sync is rhythmic не articulatory |

В production:
- ElevenLabs может generate phoneme timings (если available в API response)
- These timings drive bracket spread amplitude per phoneme
- Or: RMS amplitude alone drives bracket spread (80% of organic feel per `motion-talk-animation.md` implementation)

### Dimension 12 — NEVER (anti-patterns)

Forbidden vocal characteristics:

- ❌ **Cartoon high-pitched** — child cartoon voice
- ❌ **Movie-trailer dramatic announcer** — «In a world ...»
- ❌ **Sales-pitch upsell intonation** — «But wait, there's more!»
- ❌ **Vocal fry casual** — millennial fashion-blogger reading
- ❌ **Corporate VP voice** — «Synergize your workflow!»
- ❌ **Warm grandfatherly excessive** — «Come, my dear, sit awhile»
- ❌ **ChatGPT TTS smooth professional default** — too generic
- ❌ **Robotic synth voice** — sci-fi mechanical
- ❌ **Whisper ASMR breathy** — too intimate
- ❌ **Excited fanfare** — «Awesome! Yes! Got it!»
- ❌ **Sympathetic «I know how you feel» tone** — therapeutic
- ❌ **Apology-loaded error voice** — «I'm sorry, but ...»
- ❌ **Sycophantic openers** — «Great question!»
- ❌ **Filler** — «um», «well», «so», «just»

## Implementation path

### Pilot — ElevenLabs Voice Design

**Pilot phase (current):**
1. Use ElevenLabs Pro tier Voice Design feature
2. Describe Meme voice using 12 dimensions выше (translate to ElevenLabs prompt format)
3. Generate 5-10 voice candidates
4. Curate to one canonical Meme voice profile
5. Save в ElevenLabs library как `meme-canonical-v1`

ElevenLabs Voice Design prompt template:
```
Voice gender: andro-leaning male
Voice age: indeterminate 40-55
Pitch: mid-range, slightly lower than neutral, mid-baritone
Pace: unhurried, calm, with intentional pauses
Rhythm: organic asymmetric, not metronomic
Tone: calm, slightly dry, slight wry edge, never sarcastic, never performative
Texture: slight bronze warm undertone, natural recording, no synth processing
Style: direct, observational, like an archivist explaining
Reference voices: TARS from Interstellar (calm, dry humour), Bilbo Baggins (Ian Holm — knowing, weary, warm)
NOT like: HAL 9000 (too sinister), narrator dramatic (too performative), ChatGPT TTS (too generic), cartoon voice (too high-pitched)
Use case: brand mascot for software product Contexter — speaks calmly during loading states, found connections, capability moments
```

### Backup — Voice Library pick

If Voice Design не yields satisfactory result:
- Browse ElevenLabs Voice Library
- Filter: male, mid-range, calm, narrator
- Test 5-10 candidates
- Pick closest to spec
- Minimal tweak via prompt augmentation

### Long-term — Custom clone

Future phase (post-PMF):
- Record reference voice (actor or specific source)
- Clone в ElevenLabs (requires Creator+ tier)
- Customize fine-tune parameters
- Custom Meme voice profile

For pilot: Voice Design generated voice. Custom clone deferred per D-VOICE-03.

## Multilingual treatment

### Same character across RU + EN

Per D-VOICE-04: same character voice через ElevenLabs multilingual V3 model.

Both languages should preserve:
- Same pitch range (mid-baritone)
- Same pace (unhurried)
- Same rhythm character (asymmetric)
- Same tone (calm dry)
- Same texture (bronze undertone)

But adapt to language phonemes:
- RU phonetic inventory differs from EN (more vowel forms, different consonant clusters)
- Pace may slightly differ (RU sentences often longer than EN equivalents)
- Stress patterns differ (mobile в RU, fixed positions per word)

ElevenLabs V3 handles multilingual через single voice profile — voice identity preserved через language switch.

### Alternative — separate canonical voices

Если V3 не deliver consistency:
- Generate two separate canonical voices (one RU, one EN)
- Both designed к same spec (12 dimensions)
- Brand recognizes either as «Meme»
- Used contextually per content language

Decision deferred until pilot tests V3 multilingual quality.

## Production scope (v1)

### Reel CTA voice (3-second)

Per D-VOICE-02: voice used в reel CTA only в v1.

Specifically:
- 3-second voice over в Clip 5 of production reel (per DEEP-2 storyboard)
- Russian: «Контекстер. Ваша память — ваша.» (~2.1 seconds, 24 chars)
- English: «Contexter. Your memory. Yours.» (~2.0 seconds)
- Placement: seconds 33-36 of 40-second reel
- After Meme's invitation gesture, before music fade

### What v1 voice does NOT include

- ❌ UI loading state voice
- ❌ Notification sounds (TBD)
- ❌ Marketing explainer (next phase)
- ❌ Voice assistant integration (out of scope)
- ❌ Audio podcast / interviews (далёкая phase)

## Sound effects (related but separate)

Sound effects (SFX) для UI moments — **separate canon** (TBD per `open-questions.md`).

Possible SFX exploration:
- Loading state subtle ping
- Empty state silence
- Found connection chime
- Error tone

These would have own sonic spec, designed coherent с Meme voice (similar timbre / aesthetic) но not voiced phrases — just sonic icons.

Decision deferred to post-v1.

## Synchronization rules

### Voice + Talk animation

Per `motion-talk-animation.md` State 10 — patina glow modulates with vowel peaks.

Voice production должен:
1. Audio file loaded в timeline
2. RMS amplitude analysis runs (или phoneme timings if available)
3. Animation system reads RMS → drives bracket separation amplitude per phoneme
4. Glow intensity follows audio amplitude with slight latency (organic не perfect sync)

### In pre-rendered video

- Voice generated first
- Animation timeline aligned to voice timings (manual или automated phoneme)
- DaVinci timeline shows both audio waveform и animation overlay

### In real-time UI (если applicable post-v1)

- Voice playback drives animation state
- Web Audio AnalyserNode → bracket spread variable (per `motion-talk-animation.md` implementation)

## Recording / production considerations

### Natural recording approach

Voice should sound **natural**, не processed:
- Recording в acoustically dampened room (low reverb)
- Quality microphone (large-diaphragm condenser preferred)
- Direct distance ~6-12 inches от mouth
- No singing inflection, no announcer projection
- Sustained calm baseline без demonstrable breathing

### Post-processing

Light EQ:
- 200Hz boost for body (warm bronze undertone)
- 3kHz slight cut for warmth (avoiding presence harshness)
- 12kHz subtle lift (air, не overly bright)

No:
- ❌ Compression beyond gentle (3:1 ratio max)
- ❌ Reverb add (natural room sound only)
- ❌ Pitch correction
- ❌ Time stretching beyond minimal
- ❌ Multi-band processing
- ❌ Vocoder / robotic effects

### Mix levels (для DaVinci master per DEEP-2 §6.4)

If used в reel CTA:
- Voice peak: -12dBFS
- Voice avg: -18dBFS
- Lyria score under voice: -18dBFS reduces к -22dBFS during voice phrase
- Archive ambient hum: -24dBFS continuous

## Pre-pilot questions (для nopoint approval)

Before pilot voice generation:

1. **Gender confirmation** — andro-leaning male default, или female alternative reading нужна?
2. **Reference voice** — TARS / Bilbo / Каневский (canonical proposal) ok, или другая reference?
3. **Multilingual approach** — V3 unified, или separate RU+EN voices?
4. **Pilot path** — ElevenLabs Voice Design (proposed) или сразу planning под custom clone?
5. **Reel CTA scope** — voice используется в CTA reel (proposed), или silent reel и voice откладывается на explainer?

Per autonomous mode D-VOICE decisions committed defaults — proceed unless nopoint overrides.

## Verification checklist

При generating voice samples:

- [ ] Pitch reads mid-range (not bass, not high)
- [ ] Age perceived 40-55 (not teen, not granddad)
- [ ] Pace unhurried (not rushed, not sleepy)
- [ ] Rhythm asymmetric (not metronomic)
- [ ] Tone calm with slight dry edge
- [ ] No filler («um», «well»)
- [ ] No sycophantic intonation
- [ ] No movie-trailer drama
- [ ] No cheerful announcer
- [ ] No apology in error context
- [ ] Bronze undertone subtle (warm body present без heavy processing)
- [ ] References pass: «closer to TARS / Bilbo / Каневский than HAL / cartoon»
- [ ] Multilingual consistency (если V3 — same voice читаем в RU and EN)

## Drift modes warning

Common drift в voice design / generation:

- **Cheerful drift** — voice becomes upbeat enthusiastic. Reinforce «calm dry, never cheerful, never enthusiastic».
- **Narrator drift** — voice becomes movie-trailer dramatic. Reinforce «archivist observational, не narrator performative».
- **Robotic drift** — voice becomes synth-processed. Reinforce «natural human voice с light bronze coloration, не synth, не processed».
- **High-pitch drift** — voice becomes cartoon. Reinforce «mid-baritone, indeterminate adult».
- **Sympathetic drift** — voice becomes therapeutic. Reinforce «direct calm, не sympathetic, не reassuring».
- **ASMR drift** — voice becomes whispery intimate. Reinforce «normal projection, не whisper, не breathy».

## Связь с другими файлами

- **Brand TOV** — `nospace/marketing/branding/contexter/tov.md` (TOV pillars informing voice character)
- **UI Language** — `nospace/marketing/branding/contexter/ui-language.md` (bilingual rules)
- **Voice Copy** — `voice-and-copy.md` (what Meme says when voice speaks)
- **Philosophy** — `philosophy.md` (origin of dual personality which informs voice character)
- **States** — `states.md` (per-state vocal modulation table)
- **Motion Speech** — `motion-talk-animation.md` (sync rules between voice и talk animation)
- **Decisions Log** — `decisions-log.md` (D-VOICE-01 through D-VOICE-04)
- **Open Questions** — `open-questions.md` (sound effects, custom clone path)
- **References** — `references-rag-sources.md` (TARS / Bilbo / Каневский precedent details)

## Lock status

Voice audio — **LOCKED v1 (session 254, 2026-04-26)**.

12-dimension sonic spec defined. Default canonical voice (andro-leaning male, mid-range, indeterminate 40-55, calm dry, bronze undertone) — locked. Real-world precedents (TARS / Bilbo / Каневский) — canonical. ElevenLabs Voice Design implementation path для pilot — locked.

Refinements которые НЕ нарушают lock:
- Specific ElevenLabs voice profile pick после pilot
- Custom clone exploration post-PMF
- Multilingual V3 vs separate voices decision after pilot test
- Sound effects canon (separate file post-v1)

History:
- v1 (session 254): 12-dimension sonic signature finalized, ElevenLabs implementation path locked, reel CTA scope defined
