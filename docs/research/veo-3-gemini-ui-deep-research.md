---
# Veo 3 / 3.1 через Gemini UI — DEEP Research
> Date: 2026-04-26 | Author: Axis (Orchestrator) | Status: actionable how-to
> Goal: дать nopoint полное знание для генерации Meme mascot videos через web UI
> Scope: Veo 3 / 3.1 / 3.1 Fast / 3.1 Lite через gemini.google.com и labs.google/flow
> Не покрыто: Vertex AI enterprise tier, API direct calls (отдельная research если понадобится)
---

## Executive Summary — что нужно знать за 30 секунд

1. **Veo 3.1** — текущая версия (январь 2026). 1080p (4K в Vertex AI / Flow Lite upscale), 8 sec max per clip, 16:9 / 9:16, native audio (dialogue + SFX + ambient), lip-sync 80% single-character / 40% multi.
2. **Gemini AI Pro $19.99/мес** — у тебя есть. Доступ к Veo 3.1 в Gemini app, **~5 generations / day**. Для большего объёма → Flow tool в `labs.google/flow`.
3. **Два разных интерфейса**: `gemini.google.com` (общий ассистент с видео-tab) vs `labs.google/flow` (специализированный editor). **Flow — это где делается реальная работа**, Gemini app — для быстрых одиночных генераций.
4. **Структура промпта** в одном предложении: `[Cinematography] + [Subject] + [Action] + [Context] + [Style and Audio]`. Опционально JSON для production-grade control.
5. **Image-to-video работает.** Загружаешь approved Meme PNG → используется как первая фрейм. + текстовый промпт для движения и звука.
6. **8-second limit** — обходится через Flow Frames-to-Video или Extend. Сохраняешь last frame как asset → стартуешь следующую сцену оттуда. Так делается video на 30+ сек.
7. **Watermark "veo"** в bottom-right на всех видео кроме Ultra-tier через Flow. Plus и Pro tier — visible watermark всегда.
8. **Commercial use разрешён** на Pro/Ultra plan (Google ToS), но visible watermark остаётся. Для clean output — Ultra subscription или Vertex API.

---

## 1. Доступ через subscription tiers

| Tier | Price | Veo 3 access | Daily Veo limit | Watermark |
|---|---|---|---|---|
| Free | $0 | Limited / occasional | very low | yes |
| **Google AI Plus** | $7.99/mo | Veo 3.1 **Fast only** через Flow + Gemini app | not specified | yes |
| **Google AI Pro** | **$19.99/mo** ← у тебя | Veo 3.1 (full) + Veo 3.1 Fast, через Gemini app + Flow | **~5/день в Gemini app**, 1000 monthly credits в Flow | yes |
| **Google AI Ultra** | top tier | Veo 3.1 standard + fast, Flow priority | ~5/день в app, **12 500 monthly credits в Flow** | **No visible watermark in Flow** |

Источник: arsturn.com, finout.io, gemini.google/subscriptions, 9to5google (April 2026).

**Важное:** «5/day в Gemini app» — для standard Veo 3 в Gemini chat. Через Flow — credit-based, и кредитов сильно больше (Pro = 1000/мес, что эквивалентно ~50 standard Veo 3.1 generations).

**Conflict found:** Pro tier дневной лимит указывается как ~5 generations в Gemini app. В Flow лимит cost-based (credits), а не daily count. Источники не уточняют сколько credits стоит одна Veo 3.1 generation в Flow — есть оценки 20 credits (тогда Pro = 50/мес) до 100 credits (тогда Pro = 10/мес). **Confidence: MEDIUM. Уточнить эмпирически — посмотреть в личном кабинете Flow счётчик credits после первой генерации.**

---

## 2. Какую версию выбирать — Veo 3 / 3.1 / Fast / Lite

| Model | Resolution | Duration | Audio | Speed | Use when |
|---|---|---|---|---|---|
| Veo 2 | 720p max | 5-8 sec | **silent** | fast | legacy / Extend feature still uses it |
| Veo 3 (legacy) | 1080p | 4/6/8 sec | yes | standard | superseded by 3.1 |
| **Veo 3.1** | 1080p (4K в Flow upscale) | 4/6/8 sec | rich audio | standard | **production quality, default choice** |
| **Veo 3.1 Fast** | 1080p | 4/6/8 sec | yes | **2× faster** | prototyping, quick iterations |
| Veo 3.1 Lite | 1080p | 4/6/8 sec | yes | even faster | high-volume, less detail |

Источник: cloud.google.com/blog Veo 3.1 update Jan 2026, mindstudio.ai, picsart.com, fal.ai.

**Decision rule:**
- **Prototyping / итерации** → Veo 3.1 Fast. Save credits.
- **Final hero rendering** → Veo 3.1 Standard. Best quality.
- **Bulk / quantity** → Veo 3.1 Lite (если доступен на твоём tier).

---

## 3. Где работать — Gemini app vs Flow

### `gemini.google.com` — Gemini app

**Когда использовать:**
- Quick one-shot generations.
- Когда нужно 1 клип без последующего редактирования.
- Текстовый чат-стиль workflow (просто промпт + image upload).

**Как:**
1. Открыть `gemini.google.com`
2. В bottom — Tools button → **Create video** (если не видно → 3 dots → expand options)
3. Опционально загрузить image: **Add image** button
4. Ввести промпт в text box
5. Submit
6. Когда готово — play в чате → download MP4

**Лимиты:** ~5 generations/day на Pro tier. Visible "veo" watermark.

Источник: support.google.com/gemini/answer/16126339, blog.google photo-to-video.

### `labs.google/flow` — Flow (production tool)

**Когда использовать:**
- Multi-clip videos (>8 sec через chaining).
- Storyboard workflows.
- Character consistency через reference images / ingredients.
- Нужно extend/edit/transition между clips.
- **Default for serious work с Meme mascot.**

**Что есть в Flow что нет в Gemini app:**
- **Ingredients to Video** — до 4 reference images для locking character
- **Frames to Video** — start frame + end frame, Veo бы вставит motion между ними
- **Extend** — продлить clip (но Extend пока работает на Veo 2, не на 3 — итеративно фиксят)
- **Storyboard Editor** — sequence multiple clips, transitions, single download
- **Save frame as asset** — последний фрейм одного clip → start point следующего
- **Element references** — сохранить subject/style как переиспользуемый ingredient

**Workflow (Flow):**
1. Открыть `labs.google/flow`
2. Sign in with Google account имеющим Pro/Ultra
3. Create new project
4. Pick mode: Text-to-Video / Image-to-Video / Frames-to-Video / Ingredients-to-Video
5. Upload reference images если нужно
6. Write prompt
7. Generate → preview → iterate
8. Add to storyboard / extend / chain
9. Download final sequence as continuous video

Источник: labs.google/flow/about, blog.google Veo updates Flow, skywork.ai.

**Recommendation для Meme:** **используй Flow** для финальной hero animation. Gemini app — только для quick прототипа.

---

## 4. Структура промпта — что Veo понимает

### Текстовый формат (один абзац)

```
[Cinematography] + [Subject] + [Action] + [Context] + [Style and Audio]
```

- **Cinematography** — shot type, camera movement, lens behavior
- **Subject** — who or what (с distinctive details)
- **Action** — short verb phrase
- **Context** — location, time of day, weather, props, background motion
- **Style and Lighting** — genre, palette, lighting quality, texture
- **Audio** — dialogue, sound effects, ambient sound

**Best practices:**
- Front-load most important element
- Visually specific («bronze with green-blue verdigris patina») > abstract («metallic look»)
- Separate instructions clearly (camera, action, audio как distinct sections)
- Read like director's note, not story description

Источник: cloud.google.com Ultimate prompting guide, deepmind.google prompt-guide, replicate.com blog.

### JSON формат (для production-grade control)

```json
{
  "scene": "Dark archive interior, 2050",
  "style": "Bauhaus minimalism, museum bronze sculpture, deep-sea bioluminescence",
  "camera": {
    "movement": "slow dolly forward",
    "angle": "low eye level, slightly tilted up",
    "lens": "50mm equivalent, shallow depth of field"
  },
  "lighting": "warm directional from upper-left + creature's own cool cyan-teal bioluminescent glow",
  "subject": {
    "primary": "two square brackets [ ] floating in mid-air, bronze with bioluminescent verdigris patina",
    "details": "asymmetric face above brackets — two bronze dot eyes, no mouth"
  },
  "action": "brackets gently breathe — separate by 5% on X-axis then return — repeating slow rhythm",
  "audio": {
    "dialogue": "none",
    "sfx": "soft archival room hum, faint metallic resonance from creature, distant card-drawer click",
    "ambient": "deep dark archive room tone"
  },
  "duration": 8,
  "aspect_ratio": "16:9",
  "negative": "no walking figure, no human silhouette, no neon LED, no Tron lines, no white/cyan flat colors, no exclamation, no rapid motion"
}
```

JSON benefits: structured, repeatable, easy to swap individual elements without rewriting whole prompt.

Источник: imagine.art JSON guide, opodab.com JSON prompts, github.com/aliswl20/Veo-3-Json-Prompt.

**Conflict:** не все sources подтверждают что Veo 3 натив парсит JSON. Часть utilities — это prompt generators которые конвертят JSON в text. **Confidence: MEDIUM.** Эмпирически: JSON работает в Vertex API напрямую, в Gemini UI ведёт себя как structured text — Veo читает как обычный prompt.

---

## 5. Камера и кинематография

Veo понимает cinematic vocabulary:

| Term | Effect |
|---|---|
| **Pan** | horizontal camera rotation |
| **Tilt** | vertical camera rotation |
| **Dolly** | camera body translates forward/back |
| **Truck** | camera body translates side-to-side |
| **Crane** | camera body translates up/down |
| **Tracking shot** | camera follows subject |
| **POV** | camera as first-person view |
| **Aerial / drone** | camera high above |
| **Slow pan** | gentle horizontal sweep |
| **Dolly-in** | camera moves toward subject |
| **Parallel trucking** | camera moves alongside subject |
| **Whip pan** | extremely fast pan (use sparingly — artifacts) |
| **Push-in** | rapid dolly toward |
| **Pull-back** | reveal shot |

**Lens vocabulary:**
- "shallow depth of field" — bokeh / blurred background
- "wide-angle" — distortion, expansive
- "telephoto" — compressed depth
- "macro" — extreme close-up
- "anamorphic" — cinematic widescreen with horizontal flares

**Lighting vocabulary:**
- "golden hour" — warm low-angle
- "blue hour" — cool twilight
- "rim light" — silhouette outline
- "volumetric haze" — dust + atmosphere
- "Rembrandt lighting" — triangle on cheek
- "noir" — high contrast shadows

Источник: medium.com/@miguelivanov, james-palm.medium.com (40 prompts list).

---

## 6. Audio + Dialogue

Native audio generation — biggest leap от Veo 2.

### Three audio categories

1. **Dialogue** — characters / narrators speaking
2. **Sound effects** — phone ringing, water splashing, creak of door
3. **Ambient noise** — city traffic, ocean waves, room tone

### Dialogue technique

**Quote marks для exact speech:**
```
A woman smiles softly and says, "Welcome to Veo 3."
```

Formula: `[character description] + [action] + quoted dialogue`

**Length:** Keep dialogue short (under 8 sec, one line).

**Emotional modifiers:** angrily / nervously / softly / excitedly / archly / wearily.

**Lip-sync rates:**
- Single-character: 80% success
- Multi-character: 40% success

Источник: eastondev.com Veo 3 audio guide, mindstudio.ai.

### Sound effects

Bind to visual actions с словами `as` или `when`:
- "As the door creaks open, a gust of wind rushes in"
- "When the bracket spreads, a soft metallic resonance"

### Ambient sound

Layered approach (foreground / midground / background):
- "Rain pattering (foreground), thunder echoing in distance (midground), car passing faintly (background)"

Maximum 3-4 audio layers per segment.

### Subtitle problem

Veo 3 commonly generates **misspelled subtitles** when dialogue exists. Fix:
- Put dialogue after colon: `The man says: "Hello."`
- Add `(no subtitles)` to prompt
- Use negative prompt: `no text overlay, no subtitles, no captions`

---

## 7. Image-to-Video (для нашего Meme workflow)

### Это критично для нашей задачи

У нас approved Meme image (brackets + face, archive setting). Хотим animation. Image-to-Video — наш рабочий путь.

**Способы:**

1. **Single image → animated video.** Загружаешь Meme PNG, Veo использует как первую фрейм + добавляет motion из промпта.
2. **First and last frame.** Загружаешь обе границы (старт + конец), Veo генерирует transition с audio.
3. **Ingredients to Video.** До 4 reference images для locking character/style, плюс text prompt для action.

### Critical limitation

**Veo 3 не позволяет use first frame и reference images simultaneously.** Выбираешь либо first frame (опционально + last frame), либо набор 1-3 reference images. Не оба.

### Practical для Meme

- **Если 1 hero scene** (8 sec) → upload Meme image как first frame, prompt описывает action + audio. Простой путь.
- **Если multi-scene story** (30+ sec) → Ingredients-to-Video с 2-3 Meme reference images в разных позах + per-scene prompts. Подходит для polished story.

Источник: ulazai.com, getimg.ai Veo 3.1 review, sider.ai.

---

## 8. Character consistency через сцены

### Reference images

Standard Veo 3.1 поддерживает до **4 reference images** для locking character identity / objects / style.

**Best practice:** 2-3 images **одного character в neutral lighting**:
- front-facing portrait
- three-quarter angle
- profile

(У нас Meme это abstract object — angles differ less radically, но 2-3 variants в разных positions помогут.)

### Текстовая consistency

В каждом промпте через scene chain ПОВТОРЯТЬ:
- character description (bracket pair, bronze + bioluminescent patina)
- specific traits (asymmetric face, two bronze dot eyes, no mouth)
- environment (dark archive 2050)
- lighting (warm directional from upper-left + creature's own cool glow)

Если повторение опускается — character drifts: цвет patina чуть меняется, размер brackets сдвигается, etc.

### Save Element / Save frame as asset

В Flow:
- **Save establishing shot as Element** — этот scene становится reusable reference
- **Save frame as asset** — конкретный кадр становится start frame для следующего clip

Это лучший способ chaining clips с consistency.

---

## 9. Negative prompts — что отсекать

### Common artifacts

```
no motion blur, no face distortion, no warping, no morphing,
no duplicate limbs, no inconsistent lighting, no background shifting,
no floating objects, no extra limbs, no glitch morphs, no object warping,
no jump cuts within clips, no text overlays, no oversaturation,
no plastic skin, no over-sharpening, no soap opera effect,
no blurry faces, no distorted hands, no compression artifacts,
no camera shake, no lip-sync issues, no poor audio quality
```

### Specifically для Meme

```
no walking figure, no human silhouette, no biped, no arms, no legs,
no anthropomorphic creature, no Tron neon lines, no LED glow,
no white/cyan flat colors, no neon outline character,
no bouncing, no squash-and-stretch, no exaggerated motion,
no cartoon-style expressions, no anime eyes, no smiling mouth,
no symmetric perfect motion, no metronomic timing,
no text in scene, no watermarks, no logos, no UI overlays
```

### Style switching trick

Vместо «no cars» (instructive) лучше «empty deserted street» (positive description what you want). Veo лучше отвечает на positive description чем на negation в main prompt.

**Используй negative prompt section отдельно** для исключений, а main prompt — для desired state.

Источник: skywork.ai 10 mistakes article, veed.io guide.

---

## 10. SynthID + commercial use

### Watermarking

**Two-layer system:**

1. **Visible "veo"** в bottom-right corner — **на всех видео** кроме Flow rendered Ultra-tier subscribers.
2. **SynthID invisible** — embedded во всех Veo outputs, не убираемый.

### Commercial rights

- **Pro / Ultra subscription** через Google ToS — commercial use **разрешён**
- API через Vertex AI — commercial use разрешён
- Output owned by user (subject to Google terms)

### Watermark removal

- API output БЕЗ visible "veo" watermark (только SynthID invisible). Для clean professional output → API path.
- Visible watermark removal через third-party tools — **violates Google ToS**, не делать
- SynthID removal — невозможно robustly, нарушение ToS

**Practical для Meme video brand assets:**
- Если нужно видео БЕЗ visible watermark для marketing → **Ultra tier через Flow** или **Vertex API** (paid tier)
- Если Pro tier ok с watermark в углу → можно использовать сейчас

Источник: bgr.com Veo watermarks article, glbgpt.com commercial use guide, skywork.ai agencies/commercial guide.

---

## 11. Extending video beyond 8 seconds

### The 8-second limit

Веp 3.1 max 8 sec per clip. Hard limit — не обходится одним промптом.

### Method 1 — Flow Extend feature

Click `+` icon next to clip → Extend. Веп starts generation continuing from last frame + motion of previous segment.

**Caveat:** Extend currently uses **Veo 2 Fast**, не Veo 3 — silent + lower quality. Это fix-in-progress per community reports. **Confidence: MEDIUM, время может изменить.**

### Method 2 — Frames-to-Video chain (recommended)

```
Clip 1 (8 sec) → hover last frame → "Save frame as asset"
Clip 2: start with that asset as first frame → new prompt → 8 sec
Clip 3: same pattern...
Final: Flow Storyboard Editor → arrange clips → download as continuous video
```

**Critical rule:** В каждом prompt repeat character description, outfit/material, background, lighting, vibe, sound. Иначе drift между clips.

### Method 3 — Storyboard pre-prepared frames

Pre-design 5-10 storyboard frames (через Imagen, Photoshop, Pencil). Each frame → Frames-to-Video с prompt. Chain через Storyboard Editor.

**Confidence: HIGH** — этот workflow стабильный per community 2025-2026 sources.

Источник: skywork.ai storyboard guide, aifreeapi.com extend guide, toolfolio.io.

---

## 12. Common failure modes

### Top 10 frustrations from community

1. **Inconsistent character across clips** → use reference images + repeat description
2. **"Something went wrong" errors** especially mid-task → wait, retry; Pro plan blocking known issue
3. **Code spit out instead of video** in Gemini app → bug, retry / different chat
4. **Regional limits** — paid Pro/Ultra in unsupported regions get only Veo 2 → check region eligibility
5. **8-second cliff** — abrupt ends → use chaining
6. **Subtitle bug** with poorly spelled text → use negative + colon technique
7. **Lip-sync drift** in multi-character → keep dialogue single-character per clip
8. **Style drift** between extended clips → repeat full style description
9. **Motion blur** unwanted → negative prompt + slower motion specification
10. **Plastic-looking textures** → specify material details («patinated», «brushed metal»)

### Veo 3 vs Veo 3.1 improvements (Jan 2026)

- 4K upscale option (Vertex AI / Flow Lite)
- Native 9:16 vertical video
- Up to 4 reference images
- Character identity consistency across scenes (was a major pain in 3.0)
- Lip-sync 80% improvement
- Reduced flickering / morphing
- Up to 60 sec scene coherence в optimal conditions (vs 30-45 в 3.0)

Источник: superprompt.com Jan 2026 update, veo3ai.io guide.

---

## 13. Step-by-step UI walkthrough — Gemini app

```
1. Browser → gemini.google.com (must be signed in with Pro/Ultra account)
2. Bottom toolbar → Tools menu (or 3-dots if hidden)
3. Click "Create video"
4. Optional: Add image → upload Meme PNG
5. Type prompt в text box (single paragraph format works best in chat)
6. Submit
7. Wait 60-180 sec for generation
8. Click play in chat to preview
9. Three-dots menu → Download → MP4 saved
```

**Best for:** quick prototype iteration на одиночных clips.

**Limitations:** no editing, no chaining, no reference images library, watermark always visible.

---

## 14. Step-by-step UI walkthrough — Flow

```
1. Browser → labs.google/flow
2. Sign in (Pro/Ultra account)
3. "Create new project"
4. Select mode:
   - Text-to-Video
   - Image-to-Video (1 starting image)
   - Frames-to-Video (start + end image)
   - Ingredients-to-Video (up to 4 reference images)
5. Upload reference images if applicable
6. Write prompt в structured form (cinematography + subject + action + context + style + audio)
7. Pick model: Veo 3.1 Standard / Fast / Lite
8. Pick aspect ratio: 16:9 or 9:16
9. Pick duration: 4 / 6 / 8 sec
10. Generate → wait 60-300 sec
11. Preview clip
12. If good → save to project
13. To extend: hover last frame → Save frame as asset → new clip with that asset
14. Storyboard Editor: arrange clips, add transitions
15. Export → Download as continuous MP4
```

**Best for:** any serious project. Clip chaining, character consistency, multi-scene storytelling.

---

## 15. Recommended workflow specifically для Meme mascot

### Phase 1 — establishing shot (single clip)

1. Open Flow → Image-to-Video mode
2. Upload approved Meme PNG (the bronze brackets + face in archive)
3. Prompt for hero animation (idle breath state):

```
[Cinematography] Slow dolly-in from medium-wide to medium shot, 50mm lens equivalent, shallow depth of field on background card-drawers.

[Subject] Two square brackets — bronze with green-blue verdigris patina that subtly glows from within with cyan-teal bioluminescent light. Asymmetric face above the bracket pair: two bronze dot eyes (one slightly larger curious child, one squinted wise old archivist), NO mouth.

[Action] The brackets gently breathe — slowly separating outward by 5% on the X-axis over 2 seconds, then returning to base position over 2 seconds, asymmetric (left lags right by 30ms). The patina glow softly pulses with the breath, dimming and brightening 8% in sync. The eye dots brighten subtly at the peak of each separation.

[Context] Vast dark archive interior of 2050. Endless rows of metal card-catalog drawers receding into atmospheric depth toward right side of frame. One drawer is pulled open in foreground showing rectangular index cards. Volumetric haze. Soft directional warm light from upper-left.

[Style] Bauhaus minimalism meets museum bronze sculpture meets deep-sea bioluminescence. Cinematic, moody, quiet.

[Audio] Soft archival room tone (foreground), distant card-drawer settling click (midground at 4 sec), faint metallic resonance from the bronze creature breathing (background, sub-audible). NO dialogue.

Duration: 8 seconds. Aspect ratio: 16:9.

Negative: no walking figure, no human silhouette, no arms or legs, no Tron lines, no LED glow, no white or cyan flat colors, no rapid motion, no bouncing, no squash-and-stretch, no anthropomorphic creature, no anime expressions, no smiling mouth, no text overlay, no subtitles, no watermarks (other than required).
```

4. Veo 3.1 Standard model, 8 sec, 16:9
5. Generate → check → iterate prompt 2-3x if drift

### Phase 2 — second clip (curious state)

Save last frame of Phase 1 as asset → new clip:

```
[Cinematography] Static medium shot. Same scene continues.

[Subject] Same brackets as previous clip — bronze body, bioluminescent verdigris patina, asymmetric face, no mouth.

[Action] The brackets tilt slightly toward the open card-catalog drawer to the right, as if curious. The left bracket separates from the right by 8% over 1.5 sec (leading the right by 30ms — asymmetric). The child eye dot widens by 10%. Patina glow brightens 12% at the peak.

[Context, Style, Audio same as previous]

Duration: 6 seconds.
```

### Phase 3 — speech clip (talk animation)

Save last frame → new clip:

```
[Cinematography] Static medium shot.

[Subject] Same brackets, same face.

[Action] The brackets perform talk animation — separating and returning along the X-axis with unequal accents. Vowel peaks at 1.4× base spread (200ms hold), consonant snaps at 0.95×. Asymmetric coupling (left bracket lags right by 15-30ms). Patina glow pulses with vowel peaks (5-10% amplitude). Face eye dots brighten at vowel peaks. NO mouth movement (mouth doesn't exist).

[Audio] A quiet voice with measured tempo says, in the bronze creature's voice (low, calm, slightly grizzled): "Memory belongs to you. Not to me. I just keep it filed."

[Context, Style same]

Duration: 8 seconds.

Negative: no lip-sync issues, no mismatched motion, no metronomic uniform separation, no perfect symmetry between left and right bracket.
```

### Phase 4 — Storyboard assembly

Flow Storyboard Editor → arrange Phase 1+2+3 clips → optional fade transitions → Download as continuous MP4 (~22 sec).

### Phase 5 — quality check

- Watermark в bottom-right (Pro tier — присутствует, accepted)
- Audio sync — check if bracket motion correlates with vowel peaks
- Character consistency — patina pattern should not drift between clips (если drift — repeat material description в каждом prompt)

### Estimated cost (Pro tier credits)

- 3 clips × ~20 credits estimated = 60 credits
- Pro tier 1000 credits/month → 60/1000 = 6% monthly budget
- Эмпирически — может варьироваться, проверить после первой генерации

---

## 16. Self-check (per E3 reglament)

### Confidence levels

| Area | Confidence | Why |
|---|---|---|
| Subscription tier features | HIGH | Multiple sources from Google official + community 2026 |
| Resolution / duration / aspect ratio limits | HIGH | Documented in cloud.google.com и Google blog |
| Audio capabilities + lip-sync rates | HIGH | Multiple eastondev / mindstudio sources confirm |
| JSON prompts native parsing in Gemini UI | MEDIUM | Sources mixed — utilities convert JSON to text vs native parse claim |
| Daily Veo 3 limit на Pro tier | MEDIUM | "~5/day in Gemini app" widely cited but exact count unclear from primary docs |
| Flow credits cost per generation | LOW-MEDIUM | Estimates 20-100 credits varying by source |
| Extend feature still uses Veo 2 Fast | MEDIUM | Community reports as of early 2026, may have changed |
| SynthID robustness | HIGH | Multiple Google official sources |
| Commercial use rights | HIGH | Google ToS clear |

### Conflicts documented

- **Pro tier daily limit:** 5 / day cited (arsturn) vs unspecified в other sources. Newer wins for tech claims → ~5/day default assumption, verify via in-app counter.
- **JSON in Gemini UI:** opodab.com / imagine.art / dev.to claim native parsing; cloud.google.com prompting guide doesn't explicitly mention JSON. Likely: Veo treats JSON as structured text, not parses keys. Functional outcome same.
- **Flow Extend Veo 2 vs 3:** TikTok community thread July 2025 + several July-Sept 2025 sources say Extend uses Veo 2 Fast; possibly fixed by Jan 2026 — source freshness on this point is borderline.

### Scope boundaries

**Investigated:**
- Veo 3 / 3.1 / Fast / Lite через Gemini app + Flow
- Subscription tiers Free / Plus / Pro / Ultra
- Prompt structure (text + JSON)
- Camera + cinematography vocabulary
- Audio (dialogue / SFX / ambient) techniques
- Image-to-Video / first-last-frame / ingredients
- Character consistency across clips
- Negative prompts + common failures
- SynthID + watermarks + commercial rights
- Extending beyond 8 sec
- Step-by-step UI walkthrough

**Not investigated (out of scope):**
- Vertex AI enterprise tier specifics
- Direct API calls (Gemini API generateVideos endpoint)
- Pricing math comparisons across tiers (already via finout.io but not deep)
- Veo 3 in Google Vids product (different product surface)
- Performance benchmarks against Sora / Runway / Pika
- Legal jurisdiction-specific commercial use details
- Detailed Vertex AI API rate limits

### Known gaps

1. **Exact Pro tier credit cost per generation in Flow** — estimate range 20-100, real value unconfirmed. Verify в-app после первой генерации.
2. **Veo 3 в Gemini app vs Flow feature parity** — некоторые features (Ingredients) могут быть Flow-only. Confirm by attempting в обоих.
3. **Russian region availability** — Pro subscription может работать но Veo 3 access могут блокировать. Test from nopoint's region.
4. **JSON prompt actual behavior** — does Gemini UI truly parse keys или treats as structured text? Empirical test needed.
5. **Veo 3.1 Lite availability** — некоторые источники упоминают 3.1 Lite, другие только 3.1 Fast. Check в личном Flow.

---

## 17. Sources

### Primary (Google official)

- [Veo — DeepMind](https://deepmind.google/models/veo/)
- [Ultimate prompting guide for Veo 3.1 — Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [Bringing new Veo 3.1 updates into Flow — blog.google](https://blog.google/technology/ai/veo-updates-flow/)
- [Introducing Gemini with photo to video capability — blog.google](https://blog.google/products/gemini/photo-to-video/)
- [Generate videos with Gemini Apps — support.google.com](https://support.google.com/gemini/answer/16126339?hl=en)
- [Generate videos with Veo 3.1 in Gemini API — Google AI for Developers](https://ai.google.dev/gemini-api/docs/video)
- [Flow — labs.google](https://labs.google/flow/about)
- [Google AI Pro & Ultra — gemini.google/subscriptions](https://gemini.google/subscriptions/)
- [Veo 3 and Veo 3 Fast — new pricing — Google Developers Blog](https://developers.googleblog.com/veo-3-and-veo-3-fast-new-pricing-new-configurations-and-better-resolution/)
- [Veo 3.1 Lite and Vertex AI upscaling — Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/veo-3-1-lite-and-a-new-veo-upscaling-capability-on-vertex-ai)
- [Introducing Veo 3.1 and new creative capabilities — Google Developers Blog](https://developers.googleblog.com/introducing-veo-3-1-and-new-creative-capabilities-in-the-gemini-api/)

### Community + Practical

- [Veo 3 Limited Access on Gemini — arsturn.com](https://www.arsturn.com/blog/veo-3-gemini-premium-limited-access-explained)
- [How to prompt Veo 3 — Replicate blog](https://replicate.com/blog/using-and-prompting-veo-3)
- [Veo 3.1 Prompt Guide — DreamHost](https://www.dreamhost.com/blog/veo-3-1-prompt-guide/)
- [Veo 3.1 Prompt Guide — LTX Studio](https://ltx.studio/blog/veo-prompt-guide)
- [How to Prompt Veo 3 and Veo 3.1 — Visla](https://www.visla.us/blog/guides/how-to-prompt-veo-3-and-veo-3-1/)
- [10 Most Common Veo 3.1 Prompting Mistakes — Skywork](https://skywork.ai/blog/veo-3-1-prompting-mistakes-fixes/)
- [Mastering Veo 3 — Miguel Ivanov Medium](https://medium.com/@miguelivanov/mastering-veo-3-an-expert-guide-to-optimal-prompt-structure-and-cinematic-camera-control-693d01ae9f8b)
- [Complete List of VEO 3 Camera Movements — James Palm Medium](https://james-palm.medium.com/veo3-camera-movements-shot-types-prompts-cf8ba7d01135)
- [JSON Prompting Guide for Veo 3 — ImagineArt](https://www.imagine.art/blogs/veo-3-json-prompting-guide)
- [Stop Guessing Start Directing Veo 3 JSON — Opodab](https://www.opodab.com/2025/09/google-veo-3-json-prompts-cinematic-guide.html)
- [Veo 3 Character Consistency — UlazAI](https://ulazai.com/character-consistency/)
- [How Veo 3.1 Maintains Character Consistency — Sider](https://sider.ai/blog/ai-tools/how-veo-3_1-maintains-character-scene-consistency-in-ai-video)
- [Veo 3.1 Multi-Prompt Storytelling — Skywork](https://skywork.ai/blog/multi-prompt-multi-shot-consistency-veo-3-1-best-practices/)
- [Veo 3 audio generation — eastondev.com](https://eastondev.com/blog/en/posts/ai/20251207-veo3-audio-generation-guide/)
- [Veo 3 audio technology — veo3ai.io](https://www.veo3ai.io/blog/veo-3-audio-generation-how-it-works-2026)
- [How to extend Veo 3 beyond 8 sec — aifreeapi.com](https://www.aifreeapi.com/en/posts/veo-3-extend-video-length)
- [Storyboard images to Veo 3.1 — Skywork](https://skywork.ai/blog/how-to-convert-storyboard-images-to-veo-3-1-videos-in-flow/)
- [Veo 3 vs Veo 2 vs Veo 3.1 — Picsart](https://picsart.com/blog/veo-models-comparison/)
- [Veo 3.1 Fast — MindStudio](https://www.mindstudio.ai/blog/what-is-google-veo-3-1-fast-video)
- [Veo 3.1 Jan 2026 update 4K — Superprompt](https://superprompt.com/blog/google-veo-3-1-update-4k-vertical-video-ingredients)
- [Veo 3 watermarks — BGR](https://www.bgr.com/tech/those-amazing-veo-3-videos-will-finally-tell-you-they-were-made-with-ai/)
- [Commercial use of Veo 3.1 — Global GPT](https://www.glbgpt.com/hub/can-i-use-veo-3-1-for-commercial-use/)
- [Veo FAQ commercial rights — Flowith](https://flowith.io/blog/veo-faq-commercial-rights-watermarks/)
- [Veo 3.1 New Features Guide — veo3ai.io](https://www.veo3ai.io/blog/veo-3-1-new-features-guide)
- [Google Vids 2026 Update Veo 3.1 — veo3ai.io](https://www.veo3ai.io/blog/google-vids-2026-update-veo-3-1-ai-music-avatars)
- [Veo 3.1 vs Veo 3.1 Fast vs Light — MindStudio](https://www.mindstudio.ai/blog/veo-3-1-vs-fast-vs-light-comparison)
- [Veo 3 vs Veo 3.1 should you upgrade — MindStudio](https://www.mindstudio.ai/blog/google-veo-3-vs-veo-3-1-whats-new-upgrade)

### Subscription tier specifics

- [Gemini Pricing 2026 — Finout](https://www.finout.io/blog/gemini-pricing-in-2026)
- [Veo 3.1 Pricing Guide 2026 — AI Free API](https://www.aifreeapi.com/en/posts/veo-3-1-pricing)
- [Gemini AI Pro vs Ultra features — 9to5Google](https://9to5google.com/2026/04/11/google-ai-pro-ultra-features/)

### Community frustrations / debug

- [Why Veo 3 and Gemini show errors — PUPUWEB](https://pupuweb.com/why-are-veo-3-and-gemini-showing-something-went-wrong-tips-for-a-smooth-experience/)
- [Veo 3 photo to video community thread — Gemini Apps Community](https://support.google.com/gemini/thread/348091329/veo-3-photo-to-video?hl=en)

---

## 18. Queries Executed

| # | Query | Returned | Used in section | Notes |
|---|---|---|---|---|
| 1 | `Veo 3 Gemini UI access subscription tier Pro Ultra limits quotas 2026 daily generation` | 10 | §1 Subscription tiers | finout, arsturn primary; vertu secondary |
| 2 | `Veo 3 prompt structure best practices guide image to video reference frame audio dialogue` | 10 | §4 Prompt structure, §6 Audio, §7 Image-to-video | cloud.google.com primary, replicate secondary |
| 3 | `Veo 3 camera movement controls cinematography prompt syntax dolly pan tracking shot 2025 2026` | 10 | §5 Camera | james-palm, miguel ivanov, opodab |
| 4 | `Veo 3 vs Veo 3 Fast vs Veo 2 differences resolution duration aspect ratio 8 seconds limit` | 10 | §2 Version comparison | picsart, mindstudio, fal.ai |
| 5 | `Veo 3 character consistency reference image start frame end frame ingredients elements lock identity` | 10 | §8 Character consistency | ulazai, getimg, sider |
| 6 | `Veo 3 negative prompts what to avoid common failures motion artifacts limitations problems` | 10 | §9 Negative prompts, §12 Failure modes | skywork mistakes, veed |
| 7 | `Veo 3 audio dialogue sound effects ambient sync speech generation quote marks tips` | 10 | §6 Audio | eastondev primary, veo3ai secondary |
| 8 | `Veo 3 SynthID watermark commercial use license rights video output download` | 10 | §10 Watermarks | bgr, glbgpt, flowith |
| 9 | `Veo 3 Flow Google tool extending scene video beyond 8 seconds storyboard multiple shots workflow` | 10 | §11 Extend beyond 8 sec | toolfolio, aifreeapi, skywork storyboard |
| 10 | `Veo 3 Gemini app reddit user experience tips tricks frustrations 2026 review` | 10 | §12 Failure modes | pupuweb, gemini community threads |
| 11 | `Veo 3.1 features update what changed 2026 last frame reference image audio improvements` | 10 | §12 Veo 3.1 improvements | superprompt, veo3ai |
| 12 | `Veo 3 prompt template JSON structure cinematic shot list example abstract mascot character logo brand` | 10 | §4 JSON format | imagine.art, opodab, github aliswl20 |
| 13 | `how to use Veo 3 in Gemini app step by step image upload create video button workflow guide` | 10 | §13 Gemini app walkthrough | support.google.com, blog.google photo-to-video |
| 14 | `labs.google Flow Veo 3 vs Gemini app difference features which to use` | 10 | §3 Gemini app vs Flow, §14 Flow walkthrough | labs.google, blog.google Veo updates Flow |

---

## TL;DR — actionable next steps для Meme

1. **Открой `labs.google/flow`** через свой Pro subscription (не Gemini app — он ограничен)
2. **Image-to-Video mode** → upload approved Meme PNG (bronze brackets+face archive scene)
3. **Используй prompt template из секции 15** для establishing shot
4. **Veo 3.1 Standard** model, 8 sec, 16:9
5. После первой генерации — **проверь credit counter** (закроет gap про Pro tier credit cost)
6. Если ок — chain через Frames-to-Video для multi-clip story
7. Последовательность: idle breath (8 sec) → curious tilt toward drawer (6 sec) → speech moment (8 sec) → final settling (4 sec). Total ~26 sec.
8. **Watermark "veo"** в углу — ок для пробных, для clean final → API path или Ultra tier upgrade
