---
# Contexter / Meme Production Research — Master Index
> Date: 2026-04-26 | Session: 253 | Status: ALL RESEARCH COMPLETE — ready for consolidation
> Next session task: synthesize executable production playbook v1 from these 7 artifacts
---

## Research artifacts (7 files, ~5000 lines combined)

| # | File | Purpose | Lines |
|---|---|---|---|
| **A** | `nospace/marketing/branding/contexter/mascot-meme.md` | Brand: Meme spec — bracket form + bronze biolum patina + talk animation 10-state spec | 363 |
| **B** | `nospace/docs/research/veo-3-gemini-ui-deep-research.md` | Technical how-to: Veo 3.1 + Gemini UI subscription, prompt structure, camera vocab, Flow vs Gemini app | 724 |
| **C** | `nospace/docs/research/contexter-meme-veo3-studio-production-seed.md` | SEED horizon scan: 42 signals × 12 dimensions for studio-quality production | 465 |
| **D** | `nospace/docs/research/contexter-meme-character-bible-workflow-deep.md` | DEEP-1: 6 Imagen 4 prompts (R-01..R-06) + GeometryCompositeProfile JSON + Branch A/B decision tree + ingredient slot allocation + continuity table 8 fields + anti-drift checklist 20 items | 984 |
| **E** | `nospace/docs/research/contexter-meme-reel-v1-storyboard-spec-deep.md` | DEEP-2: 5 complete JSON prompts (Curiosity Arc) + Lyria 3 Pro full prompt + audio mix levels dB + DaVinci 8-node grade + cost ~780 credits | 1114 |
| **F** | `nospace/docs/research/contexter-meme-music-gen-comparison-deep.md` | DEEP-3: Lyria vs Suno vs Udio decision matrix + Mureka V8 fallback + ElevenLabs Music + revised decision tree | ~850 |
| **G** | `nospace/docs/research/contexter-meme-tier-decision-deep.md` | DEEP-4: Pro/Ultra/Vertex AI cost matrix + ffmpeg crop one-liner + Vertex setup 7 steps + decision tree (break-even 63 clips/мес) + regulatory section | 806 |
| **H** | `nospace/docs/research/contexter-meme-davinci-grade-recipe-deep.md` | DEEP-5: 8-node DaVinci recipe + Hue 185° = #1AD4E6 + Resolve 20.2 Secondary Glow + Alpha-Driven Light Effects + per-clip Glow FX values + 3 free LUT URLs + DNxHR HQX export | 1120 |

## Locked decisions (от nopoint в session 253)

- **Mascot:** Meme = brackets `[ ]` + asymmetric face above (eye-dots only, NO mouth) + bronze + cyan-teal bioluminescent patina
- **Setting:** dark archive 2050
- **Stack:** Imagen 4 / Nano Banana + Veo 3.1 + Lyria 3 + DaVinci Resolve Free + ElevenLabs (optional narration)
- **Subscription:** Google AI Pro $19.99/мес (current). Pro = 1000 credits/мес, 10 Quality clips/мес — INSUFFICIENT for prototyping
- **Reel format:** v1 = 5 × 8-sec clips = 40-sec total
- **Structure:** Curiosity Arc (S-40 / Section 6.1 of E) — confirmed empirically per Apple counter-dip strategy
- **State machine:** curiosity → searching → discovery → satisfaction → invitation
- **CTA:** TBD — URL in video frame OR description-only (open question for nopoint)

## Top-level recommendations across all DEEPs

| Domain | Recommendation | Source |
|---|---|---|
| Tier | **Vertex AI from day 1** — saves ~$540 over 6 months vs Ultra; clean output; API-native для CTX-15 automation | DEEP-4 |
| Music | **Lyria 3 Pro 10 attempts → Mureka V8 ($10) → Suno Premier ($30) → ElevenLabs → Library** | DEEP-3 |
| Image gen | **Imagen 4 Ultra для R-01 + R-04** (sharp material detail), Standard для R-02/R-03/R-05/R-06 | DEEP-1 |
| Character bible | 6 reference frames с GeometryCompositeProfile JSON для forensic pipeline | DEEP-1 |
| Branch strategy | Branch A (refs) для establishing/dolly/close-ups. Branch B (first/last frame, Imagen workaround) для speech + transitions | DEEP-1 |
| Score | Single 40-sec Lyria 3 Pro track, NOT stitched 30-sec Clips (Lyria 3 Pro launched Mar 25, supersedes SEED's stitch) | DEEP-2, DEEP-3 |
| Audio mix | Veo SFX -12dBFS / Lyria -18dBFS / archive hum -24dBFS / DaVinci master -3 ceiling, -14 LUFS | DEEP-2 |
| Grade | Hue 185° = #1AD4E6 для Glow / 8-node tree per-clip / Free LUTs from Uppbeat/FixThePhoto/CINECOLOR | DEEP-5 |
| Narration | NO для v1 (5 reasons in DEEP-2 §6.5) | DEEP-2 |
| Watermark | If Vertex AI — clean. If Pro — ffmpeg one-liner crop, but signals "был watermarked" — wrong для hero brand | DEEP-4 |

## Open gaps requiring empirical verification

1. **Vertex AI exact pricing** — cloud.google.com pricing page не surfaces Veo. Estimated $0.50/sec Standard. Verify after first billing statement.
2. **Pro tier credit cost per Imagen 4 + Lyria 3 Pro generation** — unconfirmed. Verify в Flow/Gemini dashboard.
3. **Watermark exact pixel coords** — 1890×1060 crop is safe estimate. Verify by generating 1 Pro clip и инспекцией.
4. **JSON prompts native parsing в Gemini UI vs Vertex API** — likely treated as structured text, не parsed as keys.
5. **Russian region availability** — некоторые Pro/Ultra регионы dropped to Veo 2. Check after Vertex AI / Ultra access.
6. **«Quality» vs «Standard»** naming — likely same model, mapping unclear.
7. **Bronze/verdigris/biolum material** не tested empirically в Veo public corpus — first prototype runs valididate.
8. **Bracket X-axis speech mechanism** — novel prompt, no precedent. MED confidence Veo executes cleanly.

## What next session должен сделать

**Production Playbook v1 — single executable document.** Synthesize from these 7 artifacts:

1. **Pre-production phase** (week 1):
   - Vertex AI setup (DEEP-4 §6.3, 7 steps)
   - Imagen 4 reference library generation (DEEP-1 §6.1, 6 prompts × 22 candidates)
   - GeometryCompositeProfile JSON instantiation (DEEP-1 §6.2)
   - DaVinci project file setup (DEEP-5 §6.1)
   - Free LUTs download + import (DEEP-5 §6.3)

2. **Production phase** (week 1-2):
   - 5-clip generation per DEEP-2 §6.2 JSON prompts (with continuity block from DEEP-1 §6.5 replacing placeholder character description)
   - Lyria 3 Pro 5-variant generation per DEEP-2 §6.3 prompt + DEEP-3 §6.2 specific evaluation
   - Anti-drift verification per DEEP-1 §6.6 checklist (20 items)
   - Failure mode contingencies per DEEP-2 §6.8

3. **Post-production phase** (week 2):
   - DaVinci 8-node grade per DEEP-5 §6.2 with per-clip keyframes
   - Audio mix per DEEP-2 §6.4 layer architecture
   - Export ProRes master + H.264 social per DEEP-2 §6.6 / DEEP-5 export section

4. **Delivery decisions** (need nopoint input):
   - CTA URL placement (in-frame vs description-only)
   - Tier choice confirmation (Vertex AI from day 1 vs Ultra month 1 hybrid)
   - Distribution platforms priority order (HN, Reddit, Twitter, LinkedIn, Telegram, blog.contexter.cc)

## Cross-references between DEEPs (consolidation hints)

- **DEEP-2 §6.2** uses placeholder character description. Replace with **DEEP-1 §6.5** continuity block before execution.
- **DEEP-2 §6.3** Lyria prompt enriched by **DEEP-3 §6.2** Lyria-specific evaluation (5-variant prediction + prompt compensations for known weaknesses).
- **DEEP-2 §6.6** DaVinci 8-node tree expanded to per-clip keyframe values in **DEEP-5 §6.2**.
- **DEEP-2 §6.7** cost estimate (78% Pro budget) superseded by **DEEP-4 §6.6** Vertex AI recommendation ($960 over 6 months).

## File commit status (session 253)

- A: committed `fe57f3c` (mascot-meme.md update)
- B: committed `e5ea5a6` (Veo 3 how-to)
- C: in repository (SEED — earlier commit)
- D, E: in repository (DEEP-1, DEEP-2 — to be committed in this session's final batch)
- F, G, H: just completed — to be committed now

## Recommendation: new session

Total context for synthesis = 7 artifacts × avg 800 lines = ~5600 lines. Per E4 (working volume 500K Opus 4.7), production playbook synthesis should be done in fresh context to avoid compounding error from current session's 900K+ fill.

**Action for nopoint:**
1. Confirm commits below
2. /closeaxis to checkpoint session 253
3. Open new session with /continueaxis OR /startaxis
4. Direct new session to read this INDEX file first → read each artifact full per E6 → produce production playbook v1

---

**This INDEX is the bridge between research and execution.** Do not lose it.
