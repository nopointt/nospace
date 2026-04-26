---
name: mascot_meme_open_questions
description: Что отложили на следующую итерацию. Sound design specifics, 3D rendering technology choice, print presence, localised variants, voice clone path, trademark/IP, animation framework choice, sound effects mapping в UI events, error state overlay color.
type: reference
version: append-only
locked: append-only (questions resolved by adding decisions to decisions-log.md)
---

# Meme — Open Questions

> Append-only список pending decisions. Каждый вопрос — context, options, blockers, expected resolution path.

## Назначение

Open questions — это **explicit acknowledgment of unfinished decisions**. Better to track them clearly than pretend canon is complete when it isn't.

Each question has:
- **Context** — почему это question возник
- **Options** — возможные resolutions
- **Blockers** — что мешает резолюции
- **Resolution path** — как it eventually closes

When question resolved → entry в `decisions-log.md`. Original question remains here с marker «RESOLVED» + reference к decision.

## Q1 — Sound design specifics

**Status:** OPEN

**Context:** Meme может иметь sound effects associated с specific UI events (file upload chime, notification ping, error tone, etc.). Currently UI silent в v1, но sonic identity beyond reel CTA voice — undefined.

**Options:**

A. **No sounds** — UI remains silent except для voice в specific moments (reel CTA only). Brand discipline: archive should be quiet.

B. **Subtle sonic icons** — small library of bronze-resonant tones для key events (file added, search complete, error). Coherent с Meme voice aesthetic.

C. **Full sound design** — comprehensive sonic palette across UI events. Risks brand inflation.

**Blockers:**
- nopoint preference unclear (preference не stated)
- UX research needed — do users actually want sound, or prefer silent UI?
- Production cost (designing sonic icons + integration)

**Resolution path:**
- Decide preferred direction после first reel deployment (gauge response к voice)
- If sounds desired — develop in coherence с voice (same texture / hue, не separate sound aesthetic)
- Document в new file `sound-effects.md` если added

**Default:** Option A (no sounds) until explicitly explored. UI silent.

## Q2 — 3D rendering technology choice

**Status:** OPEN

**Context:** Marketing video uses Veo 3.1 generation — no choice. But for **press kit hero asset** или **non-Veo 3D rendering** — choice needed.

**Options:**

A. **Voxel** — chunky pixelated 3D (think Minecraft). Stylized, distinctive. But may be too «gaming» aesthetic.

B. **Wireframe** — outline-only 3D rendering. Clean, technical. Possible alignment с design system Bauhaus aesthetic.

C. **Raymarched** — procedural 3D (signed distance fields, etc.). Smooth realistic surfaces. Most production-ready.

D. **Photorealistic 3D (Blender / Maya)** — full PBR rendering. Highest fidelity. Resource-intensive.

E. **Veo 3.1 frame extraction** — extract high-resolution frame from Veo output as «3D render». Cheapest, leverages existing pipeline.

**Blockers:**
- Use case priority unclear (where 3D rendering needed beyond marketing video?)
- Production resources / skills available
- Brand discipline preference (which fits cold Bauhaus + warm bronze archive aesthetic best)

**Resolution path:**
- Evaluate when first non-video 3D need arises (press kit hero, app icon с 3D depth, etc.)
- Test 1-2 options at smaller scale
- Pick canonical 3D rendering approach
- Document в `marketing-surfaces.md` 3D specs

**Default:** Option E (Veo frame extraction) — leverages existing production. Reconsider if higher fidelity needed.

## Q3 — Print presence (risograph)

**Status:** OPEN

**Context:** Bauhaus heritage includes print culture — risograph printing с ограниченной палитрой is favorite reference. Meme может появляться в press kit print materials.

**Options:**

A. **Yes — risograph** — limited palette risograph aesthetic для print materials. Bauhaus precedent. Tactile.

B. **No — digital only** — Контекстер digital-first product, print not priority. Save resources.

C. **Limited print** — risograph для select materials (press kit, conference, business cards) только. Not standard.

**Blockers:**
- Volume of print needs unclear
- Risograph access (specialty equipment, не universal printer)
- Brand discipline — does print presence matter в digital-first product?

**Resolution path:**
- Wait for first print need (press kit при partner request, conference appearance)
- If material need surfaces — explore Option A or C
- Document в `marketing-surfaces.md` print specs

**Default:** Option B (digital only) until specific print need.

## Q4 — Localised variants

**Status:** OPEN

**Context:** Brand bilingual (EN primary, RU secondary). Meme voice spec includes both languages. But subtle character variations possible:

- Does Meme «ворчит» differently в RU vs EN?
- Cultural nuances в dry humor (Russian dry humor = different from American dry humor)?
- Pronunciation / emphasis patterns may differ

**Options:**

A. **Identical character** — same voice character, just different languages. Per D-VOICE-04, V3 multilingual handles both.

B. **Slight cultural calibration** — same character, но slight RU-specific tonal variations (slightly more wry, slightly more weighted pauses) reflecting Russian dry humor traditions.

C. **Two distinct canonical voices** — RU canonical Meme voice + EN canonical Meme voice. Both designed к same spec, но independently calibrated.

**Blockers:**
- Pilot voice generation needed first (V3 quality assessment)
- Cultural research — Russian audience expectations of mascot voice
- Production cost (two voices vs one)

**Resolution path:**
- Pilot ElevenLabs Voice Design в both languages
- Compare cross-language consistency
- Decide if calibration needed
- Document в `voice-audio.md` localisation section

**Default:** Option A (V3 multilingual unified) per D-VOICE-04.

## Q5 — Custom voice clone path

**Status:** OPEN

**Context:** Per D-VOICE-03, custom clone deferred к post-PMF. But what's the clone path when triggered?

**Options:**

A. **Actor recording** — hire voice actor to deliver canonical voice. Professional, production-grade. Cost: actor fees.

B. **nopoint's voice** — clone nopoint's own voice. Personal, founder-led. Free но less distinguishable от nopoint personal voice.

C. **AI generation refined** — continue with Voice Design + ongoing refinement. Skip clone phase.

D. **Hybrid** — record short reference, use ElevenLabs voice clone, then refine. Mid-cost.

**Blockers:**
- PMF achievement (ill-defined trigger)
- Brand strategy — does Meme need «human» voice или AI-generated stays acceptable?
- Cost considerations

**Resolution path:**
- Reach PMF first
- Evaluate Voice Design quality after extended use
- If feedback indicates voice character lacking — upgrade к clone path
- Document в `voice-audio.md` upgrade section

**Default:** Continue с D-VOICE-03 (Voice Design generated). Upgrade triggered by user feedback indicating voice character needs improvement.

## Q6 — Trademark / IP considerations

**Status:** OPEN

**Context:** Meme как brand asset — at what point does formal IP protection need to happen?

**Options:**

A. **No formal IP** — rely на de facto branding, copyright (automatic), trademark common law (use-based).

B. **Trademark filing** — register Meme как trademark в Madrid System. International protection. ~$1500-3000 + legal fees.

C. **Selective trademark** — register в priority markets только (US, EU, RU). Lower cost.

D. **Deferred until growth** — trademark when brand has measurable value worth protecting. Currently early stage.

**Blockers:**
- Brand maturity / recognition
- Legal budget
- Geographic priorities

**Resolution path:**
- Monitor brand recognition (mentions, copycats, misuse)
- If copycat appears — accelerate trademark
- If user base reaches 1000+ — consider trademark
- Document в new file `trademark-ip.md` if action taken

**Default:** Option D (deferred) until growth signal. Document existing canon в this folder establishes documented use date for common law trademark protection.

## Q7 — Animation framework choice

**Status:** OPEN

**Context:** Per `motion-talk-animation.md` Implementation hints, multiple frameworks possible (Lottie / Framer Motion / GSAP / Rive). Production decision needed для actual implementation.

**Options:**

A. **Lottie** — pre-rendered JSON animations. Performance excellent. Static animations only (no real-time audio coupling possible easily).

B. **Framer Motion** — React-friendly, smooth interpolation, code-first. Good for state-machine based animations. Real-time coupling possible.

C. **GSAP** — versatile, fine control, performance-optimized. Industry standard for complex web animation.

D. **Rive** — state machine animation, designer-friendly tool. Per Duolingo precedent. Real-time interactive.

E. **Custom (SVG + CSS variables + JS)** — minimal framework, custom. Maximum control, more code.

**Blockers:**
- Frontend stack decision (React or other framework)
- Performance budget per platform
- Production team skills
- Real-time requirements (audio coupling)

**Resolution path:**
- Frontend dev priorities motion implementation
- Test 2-3 options at MVP scale
- Pick canonical framework
- Document в new file `animation-implementation.md` или extend existing motion files

**Default:** Hybrid — Lottie for static animations (idle, simple states), Framer Motion or GSAP для real-time (talk animation с audio coupling). Reconsider unified choice when frontend matures.

## Q8 — Sound effects mapping в UI events

**Status:** OPEN — connected к Q1

**Context:** If sound effects added (Q1 resolves к Option B/C), how do they map к specific UI events?

**Options:**

A. **Minimal — 3-5 sounds** — only key events (file added / search complete / error). Subtle.

B. **Standard — 8-12 sounds** — comprehensive coverage but не overuse.

C. **Rich — 15+ sounds** — micro-interaction sounds. High brand fidelity, but risks fatigue.

**Mapping ideas:**
- File uploaded: subtle chime (single bell tone)
- Search complete: rising tone + brief glow audio
- Connection found (bridging): slightly more elaborated chime
- Error: low gentle tone (не alarm)
- Empty state arrival: silence (just mascot)
- Loading: optional rhythmic pulse в low volume

**Blockers:**
- Q1 resolution first
- UX research / user testing

**Resolution path:**
- Resolve Q1
- If sound enabled — design palette с brand alignment
- Document в new file `sound-effects.md`

**Default:** Q1 default (no sounds) propagates here.

## Q9 — Error state overlay color

**Status:** OPEN

**Context:** Per `states.md` State 7 Error — overlay color decision pending. Current default L1 dimmed cyan-teal. Alternative: signal-error red overlay momentarily.

**Options:**

A. **L1 dimmed cyan-teal** (current default) — restraint reading, palette consistency. «Quiet error».

B. **Signal-error red overlay** — clearer error semantic. Glow color briefly shifts cyan-teal → red over 100ms, holds 1-2 seconds, settles back. «Visible error».

C. **Combination** — bridge briefly red, settle to L1 dimmed. Most narrative но complex.

**Blockers:**
- UX testing — which signals «error» more clearly to users?
- Color discipline — does adding red break «cyan-teal-only» canonical palette?

**Resolution path:**
- Pilot test in error scenarios
- Gauge user understanding clarity
- Decide based on usability data
- Update `states.md` and `canon-bioluminescent-glow.md` with decision

**Default:** Option A (L1 dimmed) until tested.

## Q10 — Mascot evolution / variants

**Status:** OPEN

**Context:** Will Meme evolve over time? (Marketing campaigns, special editions, cross-overs?)

**Options:**

A. **Static canon** — Meme stays canonical forever. All marketing uses single canonical form.

B. **Anniversary variants** — special editions for milestones (1 year, 5 years). Subtle variations.

C. **Campaign variants** — temporary themed renderings (e.g., archive opening event, partner integration). Always returns к canonical.

D. **Co-branded versions** — when partnering с другими brands, Meme может appear in joint marketing — но never altered.

**Blockers:**
- Partnership opportunities
- Brand strategy preferences
- Risk of dilution через too many variants

**Resolution path:**
- Each variant request evaluated case by case
- If variants accepted — strict canonical preservation rules apply
- Document в new file `variants.md` if first variant created

**Default:** Option A (static canon) — Meme stays canonical. Variants require explicit nopoint approval с decisions-log entry.

## Q11 — Mascot response к user emotion (UI feedback)

**Status:** OPEN

**Context:** Should Meme respond к sustained user states beyond explicit triggers? (e.g., user spending long time на one screen, user appearing frustrated based on click patterns).

**Options:**

A. **Trigger-only response** — Meme responds к explicit events (file uploaded, search complete, etc.). No inference.

B. **Mild contextual awareness** — Meme может shift state subtly если context obvious (e.g., long search returns nothing → empty state more prominent).

C. **AI-driven empathy** — Meme tracks user behavior, adjusts «mood» based on inferred user emotion. Risks creepy / manipulative.

**Blockers:**
- Privacy concerns (tracking user behavior)
- Brand discipline (Meme не sympathetic per `cute-friendliness.md`)
- Technical complexity

**Resolution path:**
- Evaluate в context of post-launch UX learnings
- If users want «more responsive» mascot — Option B carefully
- Avoid Option C unless overwhelming user demand
- Document в `states.md` if expansion adopted

**Default:** Option A (trigger-only) per current canon. Sympathetic AI not aligned с brand discipline.

## Q12 — Onboarding mascot interactions

**Status:** OPEN

**Context:** During first-time user onboarding, does Meme play special role? (Greeting? Walkthrough? Tooltips?)

**Options:**

A. **Standard mascot** — Meme behaves canonically. Onboarding text per `voice-and-copy.md` («Архив готов. Можно класть первый файл.»). No special onboarding role.

B. **Onboarding helper** — Meme guides through first steps. Tooltips appear с Meme «pointing» (но Meme has no limbs — gesture limited).

C. **Onboarding voice** — Meme voice plays during first session, narrating key steps. Per `voice-audio.md` это extension scope.

**Blockers:**
- D-VOICE-02 currently restricts voice к reel CTA only
- Brand discipline — does «onboarding helper» feel like over-design?
- Users may want simple, fast onboarding без mascot

**Resolution path:**
- Pilot launch with Option A (standard)
- Gauge user understanding / completion rates
- If onboarding completion lower than goals — consider Option B carefully
- Document в `marketing-surfaces.md` onboarding section if expanded

**Default:** Option A (standard mascot) currently.

## Q13 — Mascot in error recovery flows

**Status:** OPEN

**Context:** Error states defined per `states.md` State 7. But what about *recovery flows* — situations where user is taking corrective action?

**Examples:**
- File upload failed → user retrying
- Permission denied → user requesting access
- Network error → user reconnecting

Should Meme show «encouraging» state during recovery? Or stay в Error state until success?

**Options:**

A. **Static error until success** — Meme в Error state, transitions к Idle когда recovery succeeds (Idle → Bridging maybe для capability moment).

B. **Recovery sub-state** — additional state «Attempting» — slightly different from Error (e.g., glow returns к L2 from L1 to signal «trying»).

C. **Per-action state changes** — Meme dynamically responds к user actions during recovery.

**Blockers:**
- Adding new state increases canon complexity
- Production effort

**Resolution path:**
- Evaluate after first error encounters в production
- If users seem confused about state — consider Option B
- Document в `states.md` if added

**Default:** Option A (static error until success) per current canon.

## Resolved questions

(None yet. All listed are open as of session 254.)

When question resolves, mark здесь и cross-reference к decisions-log:

```markdown
### Q1 — Sound design specifics — **RESOLVED**
Resolution: Option A (no sounds) confirmed by nopoint 2026-XX-XX.
See decisions-log.md entry: D-MASCOT-AUDIO-01.
```

## Connection с decisions process

Open question → discussed → decision made → archived в decisions-log.md → marked RESOLVED here с reference.

This file is **not for active discussion**. It's the **list of known unknowns**. Discussions happen в chat / planning. Decisions land в decisions-log.md. This file marks status.

## Lock status

Open questions — **append-only by policy**.

New questions added here as they emerge. Resolutions happen elsewhere; back-marker added here pointing к decisions-log.md.

History:
- v1 (session 254): Initial 13 open questions enumerated
