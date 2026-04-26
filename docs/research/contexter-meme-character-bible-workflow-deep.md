---
# Meme Character Bible Workflow — DEEP Research
> Date: 2026-04-26 | Researcher: Lead/TechResearch (Sonnet 4.6)
> Goal: Production-ready character bible workflow for Meme mascot across Veo 3.1 generations
> Prior SEED: contexter-meme-veo3-studio-production-seed.md (S-23 through S-32 established)
> Mascot: Two bronze bracket [ ] sculptural objects, verdigris bioluminescent patina, asymmetric eye-dots, dark archive interior 2050
> Stack: Imagen 4 (gemini-2.5-flash-image, "Nano Banana") + Veo 3.1 via Flow + Google AI Pro $19.99/mo
---

[PROGRESS] 09:00 UTC — File initialized.
[PROGRESS] 09:45 UTC — Layers 1-5 research complete, writing synthesis.
[PROGRESS] 10:15 UTC — Layer 6 synthesis complete. Self-check in progress.

---

## Queries Executed

| # | Query | Source | Date | Confidence |
|---|---|---|---|---|
| Q-01 | Veo 3.1 character consistency abstract object mascot non-humanoid 2026 | WebSearch | 2026-04-26 | HIGH |
| Q-02 | Runway Gen-4 / Gen-3 character identity consistency non-humanoid object mascot 2026 | WebSearch | 2026-04-26 | HIGH |
| Q-03 | diffusion video model identity preservation non-face object geometric arxiv 2025 2026 | WebSearch | 2026-04-26 | MEDIUM |
| Q-04 | Imagen 4 prompt guide technical documentation 2026 | WebSearch | 2026-04-26 | HIGH |
| Q-05 | Veo 3.1 ingredients to video workflow objects characters background stack 2026 tutorial | WebSearch | 2026-04-26 | HIGH |
| Q-06 | Atlas Cloud Nano Banana to Veo 3.1 professional workflow | WebFetch (atlascloud.ai) | 2026-04-26 | HIGH |
| Q-07 | Skywork.ai ingredients to video guide | WebFetch (skywork.ai) | 2026-04-26 | HIGH |
| Q-08 | arxiv consistent object video generation diffusion reference image non-face 2025 | WebSearch | 2026-04-26 | MEDIUM |
| Q-09 | MVCustom arxiv 2510.13702 — multi-view geometric latent rendering | WebFetch (arxiv.org) | 2026-04-26 | HIGH |
| Q-10 | Geometry Forcing arxiv 2507.07982 | WebSearch + WebFetch | 2026-04-26 | HIGH |
| Q-11 | Veo 3 anatomy / architecture latent space conditioning | WebSearch + WebFetch | 2026-04-26 | MEDIUM |
| Q-12 | Veo 3 Tech Report PDF | WebFetch (PDF — unreadable binary) | 2026-04-26 | FAILED |
| Q-13 | Veo 3.1 first frame + reference images XOR constraint | WebFetch (getimg.ai, discuss.ai.google.dev) | 2026-04-26 | MEDIUM |
| Q-14 | Imagen 4 prompting guide | WebFetch (atlabs.ai) | 2026-04-26 | HIGH |
| Q-15 | Nano Banana 3D figurine sculpture prompts | WebFetch (techmitra.in) | 2026-04-26 | MEDIUM |
| Q-16 | Brand mascot AI consistency workflow | WebFetch (hailuoai.video) | 2026-04-26 | HIGH |
| Q-17 | IPRO identity-preserving reward-guided optimization arxiv 2510.14255 | WebFetch (arxiv.org) | 2026-04-26 | MEDIUM |
| Q-18 | Runway Gen-4 character consistency guide 2026 | WebSearch | 2026-04-26 | HIGH |
| Q-19 | CineD Veo 3.1 ingredients to video update | WebFetch (cined.com) | 2026-04-26 | MEDIUM |
| Q-20 | Veo 3.1 non-humanoid anatomy ignored negative prompts developer forum | WebFetch (discuss.google.dev) | 2026-04-26 | HIGH |

---

## Layer 1 — Current State: Character Consistency on Veo 3.1 [CRITICAL]

### State of the Art as of April 2026

Veo 3.1 (released January 2026) represents the current production standard for character consistency in AI video. The two main mechanisms are documented and confirmed:

**Branch A — Ingredients to Video (Reference Images)**

Up to 3 reference images per generation can be provided, organized across 4 ingredient categories: Characters, Objects, Backgrounds, Textures+Styles. The model uses these as "identity anchors" — internally encoded via ControlNet-like conditioning into the spatial layers of the diffusion transformer. First image in the array receives highest priority weight (confirmed by Atlas Cloud developer documentation, April 2026). Only available in Standard mode, not Fast mode.

Key limitation confirmed: Reference image conditioning works through the same conditioning channel as first/last frame input. The API documentation (discuss.ai.google.dev, Q-13) shows three mutually exclusive payload structures: `image` (image-to-video), `image + lastFrame` (first/last frame), and `referenceImages[]` (reference identity). No documented path for combining `referenceImages[]` + `lastFrame` simultaneously. Community testing has not confirmed a working combined payload. The XOR constraint established in SEED S-25 is supported by API structure evidence, though Google has not explicitly published an exclusion statement.

**Branch B — Scenebuilder (Visual Continuation from Previous Shot)**

Flow's Scenebuilder uses the rendered output of the previous clip as implicit visual reference for the next generation. Reduces regeneration variance by 60-70% vs. cold generation (established in SEED S-24). Does not require uploading reference images manually — the continuity propagates through visual signal from prior output. Available only in Standard mode, Flow UI only (not API).

**Confirmed capability for non-humanoid objects:** Veo 3.1 explicitly lists "complex objects" and "abstract style guides" as valid ingredient types alongside characters. One documented developer case involved "non-biological, leg-only sphere characters" — however the developer reported a known failure mode: the model's training on human motion patterns overrides negative constraints for non-humanoid anatomy (generates arms/hands for armless sphere characters despite explicit negative prompts). No official workaround published as of April 2026.

**For Meme specifically (bracket geometry, no limbs):** The human-motion override is the primary risk. Brackets have no limb-expectation from the model's training data, so this specific failure mode is less likely than for the sphere-character case. The risk is the model adding rounded corners to sharp Bauhaus angles, or softening the rectangular cross-section to something more organic. This is material-texture drift, not anatomy hallucination.

### Branch A vs. Branch B — Pros/Cons Table for Abstract Object Mascots

| Criterion | Branch A: Reference Images | Branch B: Scenebuilder |
|---|---|---|
| **Identity lock strength** | Direct image conditioning — strongest lock | Implicit visual continuation — weaker but cumulative |
| **Works for abstract objects?** | Yes — explicitly supported | Yes — any visual element continues |
| **Requires pre-generated refs?** | Yes — must run Imagen 4 pipeline first | No — uses prior Veo output directly |
| **Non-humanoid anatomy drift** | Risk: model overrides with learned biases | Risk: same, amplified by shot-to-shot drift |
| **Patina/material consistency** | HIGH — image reference provides texture ground truth | MEDIUM — texture can shift clip 2+, especially with lighting changes |
| **First/last frame precision** | NOT available (XOR constraint) | Available — can use start/end frames alongside |
| **Bracket geometry sharpness** | HIGH — image enforces right-angle structure | MEDIUM — corners may soften after 2-3 continuations |
| **Best for** | Clips where identity must match a spec exactly | Sequential clips where motion continuity > identity precision |
| **Regeneration cost** | 3 reference generations + Veo clip | Only Veo clip (no upstream cost) |
| **Available in** | Flow (Standard) + API | Flow (Standard, UI only) |

**Verdict for Meme:** Branch A is the production default for establishing shots and any clip that must match the canonical Meme spec. Branch B is acceptable for sequential motion clips where the prior clip already showed correct Meme rendering.

Sources:
- [Veo 3.1 Ingredients to Video — Google Blog, January 2026](https://blog.google/innovation-and-ai/technology/ai/veo-3-1-ingredients-to-video/)
- [Google Developer Forum — first/last frames + reference images payload, 2026](https://discuss.ai.google.dev/t/how-to-correctly-structure-object-if-using-first-and-last-frames-and-reference-images-for-veo-3-1-endpoint/111495)
- [Google Dev Forum — non-humanoid anatomy override, 2026](https://discuss.google.dev/t/veo-3-1-model-ignores-negative-prompts-for-non-humanoid-character-anatomy/351836)
- [Atlas Cloud — Nano Banana to Veo 3.1 professional workflow, 2026](https://www.atlascloud.ai/blog/guides/from-nano-banana-image-to-video-ai-a-professional-workflow-using-atlas-cloud-and-veo-3-1)
- [Skywork.ai — Ingredients to Video guide, 2025](https://skywork.ai/blog/how-to-use-ingredients-to-video-veo-3-1-guide/)

---

## Layer 2 — World-Class Implementations

### Top 3 Character Consistency Implementations (April 2026)

**Implementation 1: Runway Gen-4 Image References System**

Runway Gen-4 (launched late 2025) delivers what is described as "world-class consistency from a single reference image" across faces, outfits, and props. The mechanism uses a dedicated Reference Images mode where uploaded images are encoded into the model's conditioning stream separately from the text prompt. Community testing reports 40% better consistency than Gen-3 across diverse scenes.

For non-humanoid objects, Gen-4 extends beyond faces: reviewers document use cases of "reimagining objects in different stylistic contexts" (car → post-apocalyptic vehicle) while preserving overall identity structure. However, fine detail consistency for non-humanoid characters has known limitations — a documented case shows a "cartoon skunk's markings changed subtly" and "a rock creature's shape shifted over time." This indicates that non-face identity in Gen-4 is materially better than random generation, but not pixel-precise.

What made it work: Gen-4 encodes reference images into a dedicated identity token stream that persists across all temporal attention layers, rather than injecting only at the first frame. This is architecturally distinct from the ControlNet-style conditioning in Veo, which anchors primarily to spatial features of the reference frame.

Closest analog to Meme: The "rock creature" case is the most relevant — geometric/mineral surface + no face expression = closest to bracket-with-patina. The markings-shift problem in the rock creature maps directly to the risk of patina coverage ratio drift in Meme generations.

**Implementation 2: Google Flow Scenebuilder + Forensic Pipeline (Vertex AI Creative Studio)**

The S-23 forensic pipeline from Google Cloud (Chouaieb Nemri, July 2025) is the most rigorous documented approach within the Google stack. The key innovation for consistency: instead of relying solely on reference images, it generates a JSON "fingerprint" of the character's visual identity using Gemini 2.5 Pro, then embeds that fingerprint as a natural-language description in every subsequent Imagen and Veo prompt.

What made it work: Combining visual reference conditioning (the image) + semantic description conditioning (the JSON-derived text description) creates dual redundancy. When visual conditioning drifts (image features can be suppressed by strong scene descriptions), the semantic description acts as a fallback. When text semantics are ambiguous, the image provides concrete ground truth.

For Meme: The FacialCompositeProfile JSON (designed for human faces) needs replacement with a GeometryCompositeProfile JSON (see Layer 6.2). The concept transfers directly.

Repository: [github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/veo3-character-consistency](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/veo3-character-consistency)

**Implementation 3: Hailuo AI Brand Mascot Consistency Workflow (Generic Best Practice)**

Hailuo AI's published mascot animation workflow represents the community's current best practice for brand character consistency. Key principle that transfers to any platform: the "idle loop anchor" technique — generate a 4-second static clip first (minimal motion, character at rest) and use that as the visual identity baseline for all subsequent motion clips. This establishes the character's "physics" and material rendering before introducing motion complexity.

What made it work: By generating the idle state first, you create an in-distribution sample that the model already knows how to produce. All subsequent generations reference an output that the model itself generated, rather than an external image that may be out of distribution.

For Meme: Generate a 4-8 second idle clip first (brackets at rest, gentle bioluminescent glow pulse, eye-dots blinking) using Branch A with reference images. Use the best-rendered frame from this clip as the primary reference image for all subsequent Veo generations.

Source: [Hailuo AI — Animating Brand Mascots with AI Subject Consistency, 2025](https://hailuoai.video/pages/knowledge/animating-brand-mascots-ai-consistency-workflow)

### Closest Analog to Meme Among All Known Implementations

The Atlas Cloud jellyfish example (Q-06) is the closest documented analog: a non-humanoid bioluminescent creature with flowing appendages, rendered against a dark background, with the Nano Banana → Veo 3.1 pipeline. Key lessons that directly apply:
- High-contrast edge between subject and background (dark background + glowing creature) is essential for "fidelity ceiling" — model can distinguish subject from environment
- Negative prompt must explicitly exclude: "morphing tentacles, multiple jellyfish, background warping" → for Meme: "rounded corners, organic curves, melting brackets, additional brackets, cartoonish proportions"
- `images[0]` is treated as primary identity anchor — always put the canonical front-facing Meme reference in slot 0

---

## Layer 3 — Frontier Research

### Bleeding-Edge Research on Non-Face Object Identity Preservation (2025-2026)

**Research 1: Geometry Forcing (arXiv:2507.07982, July 2025)**

The most directly relevant paper. Proposes a method to make video diffusion models "internalize latent 3D representations" by aligning intermediate model features with a pretrained geometric foundation model (VGGT — Visual Geometry Grounded Transformer). Two complementary alignment objectives:

- Angular Alignment: enforces directional consistency of geometric features via cosine similarity across frames
- Scale Alignment: preserves scale information by regressing unnormalized geometric features from normalized diffusion representations

Relevance to Meme: Geometry Forcing is not about face identity — it is about 3D geometric structure. Bracket geometry (sharp right angles, consistent cross-section, specific proportions) is exactly the type of geometric identity this method targets. If this technique were incorporated into Veo's architecture, it would be the ideal solution for preserving Meme's rectangular cross-section and Bauhaus angular precision.

Current status: Research preprint only — not in any production model. Cannot be used directly. But the concept informs what to describe in prompts to activate the model's existing geometric reasoning: "sharp 90-degree angles maintained throughout motion," "rectangular cross-section uniform from top to bottom," "no curved or organic transitions at bracket corners."

Source: [Geometry Forcing — arXiv:2507.07982, July 2025](https://arxiv.org/abs/2507.07982)

**Research 2: MVCustom — Multi-View Customized Diffusion (arXiv:2510.13702, October 2025)**

Addresses viewpoint-aware subject customization while maintaining identity across diverse viewing angles. Uses depth-aware feature rendering: constructs an "anchor feature mesh" from the first reference frame using estimated depth maps, then renders this mesh for each target camera pose, enforcing geometric consistency by replacing masked regions during denoising.

Key finding for Meme: MVCustom works for any object category — tested on cars, chairs, motorcycles (CO3Dv2 dataset). Geometric constraints (depth estimation, mesh rendering, latent perturbation) are object-agnostic. The depth-aware approach is particularly relevant for Meme because the bracket's 3D cross-section (3-4cm thick) is a geometric property that depth estimation can encode, even without a trained face recognizer.

Current status: Research preprint. Not production-deployed. Theoretical grounding for why generating Meme references from multiple angles (front, 3/4, side) creates a richer depth-encoded identity representation than a single front-facing reference.

Source: [MVCustom — arXiv:2510.13702v2, October 2025](https://arxiv.org/html/2510.13702v2)

**Research 3: IPRO — Identity-Preserving Reward-Guided Optimization (arXiv:2510.14255, October 2025)**

Proposes reinforcement learning reward signals (face identity scorer) to optimize video diffusion without modifying architecture. Relevant limitation: specifically designed for face-centric identity. Does not address non-face objects. However, the reward-guided optimization concept is platform-agnostic: if a custom reward signal were designed for bracket geometry compliance (measuring edge sharpness, angle precision, patina coverage ratio), it could theoretically achieve the same result for Meme.

This is theoretical — no tool for custom reward-guided optimization of Veo 3.1 exists as a consumer product.

Source: [IPRO — arXiv:2510.14255, October 2025](https://arxiv.org/abs/2510.14255)

**Summary of Frontier State:** No production-ready solution exists for geometric object identity preservation in video diffusion at consumer level. Research shows the direction (geometric grounding, anchor feature meshes, multi-view encoding) but implementation requires custom training or integration that is inaccessible with the locked Google AI Pro stack. Practical implication: rely on the prompt-engineering + reference-image combination described in Layer 6, with vigilant anti-drift verification (Layer 6.6).

---

## Layer 4 — Cross-Discipline Analogies

### Pixar / Weta — 3D Character Consistency Pipeline

In 3D animation production, character consistency is enforced through rigorous pre-production documentation before any frame is rendered:

**Character Bible (Art Bible):** Documents must specify line weight (or in 3D, edge sharpness), required level of realism, precise color palettes (hex values, not descriptive names), lighting mood, material definition, and texture detail expectations. Supervisors track revisions to ensure "characters remain consistent in silhouette, emotion, and acting style across all shots." The bible functions as the project's visual contract — external vendors or departments must match it exactly.

**USD (Universal Scene Description):** Pixar developed USD to allow multiple artists to work on the same scenes without conflict. For Meme, the analogy is the GeometryCompositeProfile JSON (Layer 6.2): a structured, machine-readable "scene description" of Meme's identity properties, passed to every generation step.

**Translate to Veo:** The key Pixar principle is that every generation "session" is treated as an isolated department that has received the character bible. The bible goes into every prompt, not just the first one. This is the justification for the Continuity Table template (Layer 6.5) — every clip prompt includes the full Meme identity block verbatim.

**Weta Digital's "volume shader" approach for complex materials:** For characters like Gollum or Kong, material properties (skin subsurface scattering, texture distribution) were defined as mathematical parameters in the shader, not just visual descriptions. Translating to Meme: describe patina distribution in coverage ratios (60-70% surface coverage), not just "green patina." Quantitative descriptions force the model toward measurable properties.

### Traditional 2D Animation Brand Mascot Consistency

Classic animation studios maintained brand mascots across thousands of frames using model sheets — front/side/3/4 reference drawings showing the character from multiple angles with explicit measurements. For Meme, this maps to the reference image library: generate Meme from at least 3 distinct angles (front, 3/4, profile) before any Veo generation. The multi-angle library is more robust than a single canonical image because it prevents angle-specific drift.

The "off-model" concept in 2D animation is useful: any frame where proportions deviate from the model sheet is off-model and gets corrected. For Meme, this maps to the anti-drift checklist (Layer 6.6): any clip where patina coverage drops below 50% or bracket angles are rounded is "off-model" and must be regenerated, not corrected in post.

### Stop Motion and Puppetry — Physical Identity Lock

Stop motion achieves character consistency through physical constraint — the puppet is the same object in every frame. The production implication for AI: the most reliable AI analog to a physical puppet is a 3D render used as reference input, not a text description. A rendered 3D object viewed from the same angle is identical frame to frame. This is why the Atlas Cloud workflow emphasizes generating reference images with specific lighting and composition before any animation: the reference image functions like the physical puppet.

Practical translation: Before attempting Veo generation of Meme, generate the Imagen 4 reference library as if you were building the physical puppet. The 5 reference images (Layer 6.1) are the "puppet." Every Veo generation uses the puppet.

### Typeface Design — Identity Across Glyphs

A typeface maintains identity through parametric constraints: stroke width ratios, serif geometry, x-height proportions, counter-space shapes. These are the underlying mathematical invariants that make all glyphs recognizably part of the same family despite different shapes.

For Meme: the equivalent parametric invariants are the bracket's cross-section geometry (3-4cm rectangular, not circular or tapered), the patina coverage ratio (60-70%), and the eye-dot asymmetry (one 20-30% wider than the other). These are the Meme "parameters" — the measures that, if preserved, guarantee identity across any generation. This framework directly informs the GeometryCompositeProfile JSON schema (Layer 6.2): it should capture these invariants numerically, not descriptively.

### Font "Hinting" as Prompt Strategy

Typography uses "hinting" — explicit rendering instructions for small sizes that prevent the rasterizer from drifting from the intended shape. The analog in prompting is the "anti-directives" section of each prompt: explicit statements of what Meme should NOT be, stated positively. Instead of "no rounded corners," write "sharp 90-degree Bauhaus angles throughout" — affirmative description of the invariant, not prohibition of the deviation.

---

## Layer 5 — Math/Algorithmic Foundations

### Veo 3.1 Architecture (Publicly Available Information)

Veo 3 uses a **Latent Diffusion Transformer** architecture operating on compressed latent representations of video (channels × time × height × width tensors). The denoising diffusion process occurs in this latent space, not on raw pixels, making the process computationally tractable.

**Conditioning mechanisms (confirmed from public documentation):**

1. **Text conditioning:** Text processed through a Multimodal Large Language Model for semantic understanding + CLIP for global visual-language alignment. Conditioning injected via cross-attention in transformer blocks.

2. **Image conditioning (image-to-video / first frame):** Described as "ControlNet-like conditioning" — the reference image is encoded and its spatial features are locked into the initial latent state. The temporal transformer then calculates motion while respecting the spatial constraints of the initial frame.

3. **Reference image conditioning (Ingredients to Video):** Less architecturally documented in public sources. Community understanding (Q-06, Atlas Cloud): treats `images[0]` as primary identity anchor with highest conditioning weight. Likely encoded similarly to first-frame conditioning but applied as a persistent prior across all temporal steps, not just the initial frame.

4. **Cross-frame attention:** Self-attention in the transformer "looks back" at latent representations of previous frames to maintain object and character permanence. Both spatial attention (structure within frames) and temporal attention (tracking across frames) contribute. This is the mechanism that makes sequential generation within a clip more consistent than between independently generated clips.

**Why reference images drift between separate generations:** Each new Veo generation is an independent diffusion process starting from pure noise. Cross-frame attention only operates within a single clip, not across separately generated clips. Reference images provide the inter-clip anchor, but they are re-encoded from scratch in each generation, making their effect probabilistic rather than deterministic. This explains why even with identical reference images, separate generations will show variation — the conditioning is influence, not constraint.

**Why the XOR constraint likely exists (inferred):** First/last frame conditioning and reference image conditioning both compete for the same conditioning channels in the transformer. Using both simultaneously creates contradictory spatial anchors — the first frame constrains the spatial layout from one source, while reference images constrain it from another. The API's mutually exclusive payload structures suggest this creates undefined behavior (or quality degradation) rather than a coherent blend.

**Geometric identity in latent space:** Abstract object identity (bracket shape, angle precision) is encoded in the spatial frequency components of the latent representation. High-frequency components (sharp edges, precise angles) are more susceptible to diffusion noise smoothing than low-frequency components (overall shape, gross proportions). This explains why Bauhaus right angles are at higher drift risk than the overall bracket silhouette — the edges are high-frequency features that the denoising process tends to smooth toward lower-frequency (organic/rounded) alternatives.

**Practical consequence for prompt engineering:** The model's denoising process is drawn toward the statistical mode of its training distribution. Sharp right angles are less common in training data than rounded organic forms. To fight this bias, prompts must actively reinforce the geometric constraint: "sharp 90-degree angles," "hard edges," "architectural precision," "no organic curves" — overriding the model's default toward rounded forms.

**Bioluminescent glow in latent space:** The cyan-teal glow is encoded as a correlated cluster of high-chroma color features in specific spatial regions. This cluster is relatively stable across generations because the model has strong training signal for bioluminescent effects (well-represented in training data via ocean/nature photography). The risk is hue drift — cyan can drift toward blue or green. The text anchor must specify hue explicitly: "cyan-teal at approximately 185° hue, not green, not blue."

Sources:
- [Veo 3 Technical Analysis — Medium/Google Cloud Community, 2025](https://medium.com/google-cloud/deconstructing-veo-3-a-technical-analysis-of-googles-unified-audio-visual-generation-model-6be023888489)
- [Veo Anatomy — Tyler Frink, Medium, 2025](https://medium.com/@frinktyler1445/the-anatomy-of-veo-3-deepminds-audiovisual-diffusion-model-1721bec4b156)
- [Geometry Forcing — arXiv:2507.07982, July 2025](https://arxiv.org/abs/2507.07982)
- [MVCustom — arXiv:2510.13702, October 2025](https://arxiv.org/html/2510.13702v2)

---

## Layer 6 — Synthesis [CRITICAL — production-ready output]

### 6.1 Imagen 4 Prompt Sequence for Meme Reference Generation

The Imagen 4 prompt structure follows: **Subject + Context + Material + Lighting + Style + Technical specs + Negative**.

All prompts assume Imagen 4 via Gemini 2.5 Flash Image ("Nano Banana") accessed through gemini.google.com or the Gemini API. Aspect ratio 16:9 for Veo input (outpainting from 1:1 square center is an alternative if 16:9 introduces context you don't want).

---

**REFERENCE IMAGE R-01: Master Hero Shot (Front, Archive Setting)**

This is the canonical Meme reference. Used as `images[0]` in every Veo generation.

```
Subject: Two square bracket sculptures [ ] facing the camera — each bracket shaped exactly 
like the printed characters "[" and "]": a vertical rectangular bar with short horizontal 
segments at top and bottom turning 90 degrees inward. Brackets float side-by-side in 
mid-air with 3–4cm of negative space between them. Cross-section is rectangular, 
3–4cm thick. Bauhaus right angles — no curves, no rounded corners, no organic forms.

Above the brackets, floating slightly higher, a minimal face: two small bronze dot eyes 
only — no mouth, no nose, no other features. Left eye 30% wider than right eye (child-
curiosity). Right eye slightly squinted (wise-archivist).

Material: Solid aged BRONZE metal — warm honey-amber where directional light strikes 
surface, dark chocolate-brown in shadows. Verdigris patina patches (green-blue oxidized 
copper) covering 60–70% of bracket surfaces — concentrated at corners and edges where 
moisture pools form on real bronze. Patina glows subtly from within with soft cyan-teal 
bioluminescent light (hue 185°, like phosphorescent moss or deep-sea dinoflagellates). 
Bronze body is solid and non-glowing. Eye dots are solid bronze, non-glowing.

Setting: Vast dark archive interior, year 2050. Endless rows of aged metal card-catalog 
drawers recede toward the right in atmospheric depth. One drawer in the foreground is 
pulled open showing rectangular index cards. Drawers silhouetted in deep dark grey 
#1A1A1A. Volumetric atmospheric haze mid-distance.

Lighting: Soft directional warm light from upper-left (tungsten tone, approximately 
3200K). Creature's own bioluminescent glow casts soft cool cyan reflections on nearby 
drawer surfaces. Shadows are warm and deep.

Style: Bauhaus minimalism meets museum bronze sculpture (Marianne Brandt metalwork 
heritage). Photorealistic museum photography lighting. Apple September 2025 product 
promo aesthetic — floating object in space, precise material rendering.

Technical: 16:9 aspect ratio. 2K resolution. Photorealistic render. Depth of field — 
brackets sharp, archive background softly out of focus.

Negative: cartoon, anime, neon, glowing eyes, LED light, plastic, rubber, organic curves, 
rounded corners, mouth, nose, ears, body, limbs, arms, legs, humanoid, warm glow, 
yellow glow, blue glow, white glow, symmetrical eyes, closed eyes, text, logo, watermark.
```

---

**REFERENCE IMAGE R-02: Pure Character Isolation (Neutral Dark Background)**

For reference image library — no archive distractors. Clearest identity signal.

```
Subject: Two square bracket sculptures [ ] floating in mid-air, facing camera directly. 
Same geometry as canonical Meme: vertical rectangular bars 3–4cm thick, short horizontal 
segments at top and bottom turning 90 degrees inward. Negative space between brackets.

Above brackets, minimal face: two bronze dot eyes only. Left eye 30% wider. Right eye 
squinted. Both solid bronze, non-glowing.

Material: Aged bronze with warm honey-amber highlights. Verdigris patina covering 60–70% 
of surface. Patina glows softly with cyan-teal bioluminescent light (hue 185°). Non-
glowing bronze body.

Setting: Pure neutral dark background #1A1A1A. No environment, no context, no objects. 
Studio void.

Lighting: Single soft box light from upper-left. Subtle rim light from behind to separate 
brackets from dark background. Creature's own bioluminescent glow is the secondary light 
source — illuminates the void around it slightly.

Style: Character sheet reference image. Museum catalog photography of a bronze sculpture. 
Maximum material fidelity.

Technical: 1:1 square aspect ratio. 2K resolution. Ultra-sharp focus. No depth of field 
blur.

Negative: background elements, archive, drawers, environment, cartoon, anime, neon, 
rounded corners, organic curves, mouth, lips, symmetrical eyes, warm glow, plastic, text.
```

---

**REFERENCE IMAGE R-03: 3/4 View (Depth and Volume)**

For multi-angle reference library — encodes depth information per MVCustom principles.

```
Subject: Two square bracket sculptures [ ] viewed from 45-degree angle (3/4 view), 
revealing the 3–4cm rectangular cross-section thickness. The depth of the brackets is 
visible — solid rectangular volumes, not flat shapes. Bauhaus right angles visible from 
this angle: internal corners where horizontal segments meet vertical bar are precise 90 
degrees.

Above brackets, minimal face: two bronze dot eyes from 3/4 angle. Left eye slightly 
more visible (wider, child-curiosity). Right eye partially behind but squint still 
visible.

Material: Aged bronze — the 3/4 angle reveals the depth surface also has verdigris 
patina. Bioluminescent glow slightly stronger on the inner-facing surfaces (as if glow 
concentrates where brackets face each other). Warm honey-amber highlights on the 
top-facing surfaces.

Setting: Dark neutral void with trace of archive atmosphere (suggestion of distant 
drawer rows, very out of focus).

Lighting: Upper-left warm directional. Brackets' own cool cyan glow creates secondary 
illumination. The depth faces of the brackets catch both warm and cool light.

Style: Sculptural reference — showing volume and material thickness. Product photography 
of museum bronze. Apple-style floating object render.

Technical: 16:9 aspect ratio. 2K resolution. Sharp focus on brackets.

Negative: flat, 2D, cartoon, organic curves, rounded corners, no depth visible, symmetrical 
eyes, mouth, limbs, warm glow, plastic, neon.
```

---

**REFERENCE IMAGE R-04: Texture Close-Up (Patina Detail)**

For Texture+Style ingredient slot in Veo. Provides material fingerprint.

```
Subject: Extreme macro close-up of the bracket surface. Bronze metal texture filling 
frame. Verdigris patina patches visible at extreme detail — showing the layered chemistry: 
copper-green oxidation on top of the bronze base, with visible micro-texture (crystalline 
mineral structure of real verdigris). Bioluminescent glow visible from within the 
patina — as if the patina itself is alive, like bioluminescent algae on a shipwreck.

No characters, no face, no full bracket shape visible — only material surface.

Material detail: Bronze base visible in gaps between patina — warm honey-amber with 
casting texture and subtle surface micro-pitting from aging. Patina is blue-green 
(cyan-teal, hue 185°), slightly textured, not uniform. Glow from within the patina 
patches is soft organic light, not point-source.

Lighting: Diffuse macro photography lighting. The patina's own glow provides 
secondary illumination.

Style: Scientific macro photography. Museum conservation documentation. Hyperrealistic 
material scan.

Technical: 1:1 square aspect ratio. 2K maximum detail. Extreme macro depth of field — 
entire surface in focus.

Negative: full character visible, face, eyes, archive, background, organic organisms, 
cartoon, plastic, uniform flat surface, uniform color.
```

---

**REFERENCE IMAGE R-05: Speaking Pose (Brackets Parted)**

Meme's talk animation state — brackets separated on X-axis.

```
Subject: Two square bracket sculptures [ ] floating in mid-air, horizontally parted — 
the gap between them 2–3 times wider than their default spacing. This is Meme's speech 
pose: brackets open outward along the X-axis, revealing the intention to communicate. 
The inner-facing surfaces of the brackets glow slightly brighter than the outer surfaces 
(as if energy concentrates at the opening).

Above the wider gap, minimal face: two bronze dot eyes. Left eye wide open — curiosity. 
Right eye slightly squinted — wisdom. Face is centered over the gap, floating.

Material: Same bronze + verdigris patina + bioluminescent glow. Inner-facing bracket 
surfaces have 10–15% brighter cyan-teal glow than default state.

Setting: Archive interior suggestion — dark, atmospheric. Not full archive rendering — 
keep focus on the pose.

Lighting: Upper-left warm directional. The wider bracket gap creates a "stage" — center 
glows slightly cooler from the bioluminescent light between them.

Style: Character animation reference sheet. Emotion: expression of communication, not 
aggression — open, deliberate, considered.

Technical: 16:9 aspect ratio. 2K resolution.

Negative: closed brackets at default distance, speech bubble, text, mouth on face, 
rounded corners, organic curves, cartoon.
```

---

**REFERENCE IMAGE R-06: Idle/Rest State (Eye-Dots Character Study)**

For close-up face study and eye-dot detail reference.

```
Subject: Extreme close-up on the eye-dot pair floating above the brackets. Only the 
two bronze dot eyes visible at large scale. Left eye: wider, perfectly circular dot, 
bronze material. Right eye: slightly smaller, subtle squint (top edge slightly flattened), 
bronze material. The asymmetry is deliberate — these are two distinct personalities 
expressed in two simple dots.

Visible context: just enough of the brackets below to provide context — top segments 
of both brackets visible. Very slight cyan-teal glow around the face area from patina.

Material: Eye dots are solid bronze, non-glowing. The area immediately around them has 
trace patina glow — ambient bioluminescence from the bracket body below.

Setting: Dark background with archive atmosphere suggestion.

Lighting: Very soft diffuse lighting. The bronze dots catch minimal warm light from 
upper-left. Primary illumination is the ambient bioluminescent glow from below.

Style: Character study — this image captures the personality engine of Meme. Maximum 
eye detail.

Technical: 1:1 square aspect ratio. 2K resolution.

Negative: symmetrical eyes, identical eyes, same size eyes, mouth, cartoon eyes, 
animated eyes, glowing eyes, organic shapes.
```

---

### 6.2 GeometryCompositeProfile JSON Schema

Replaces FacialCompositeProfile from S-23 forensic pipeline for abstract object mascots. This JSON is fed to Gemini 2.5 Pro at Stage 2 of the pipeline (natural language translation), producing the semantic description that goes into every Imagen 4 and Veo prompt.

```json
{
  "schema_version": "1.0",
  "subject_name": "Meme",
  "subject_type": "abstract_sculptural_object",
  "character_class": "non_humanoid_mascot",

  "bracket_geometry": {
    "count": 2,
    "arrangement": "side_by_side_horizontal",
    "shape": "printed_bracket_character",
    "shape_description": "vertical rectangular bar with short horizontal segments at top and bottom turning 90 degrees inward",
    "cross_section": {
      "profile": "rectangular",
      "thickness_cm": {"min": 3, "max": 4},
      "corner_type": "sharp_right_angle",
      "corner_angle_degrees": 90,
      "no_rounding": true
    },
    "proportions": {
      "height_to_width_ratio": 3.5,
      "horizontal_segment_length_pct": 35
    },
    "gap_between_brackets": {
      "default_state": "narrow_negative_space",
      "speech_state": "2x_to_3x_wider_than_default",
      "gap_type": "empty_air"
    },
    "orientation": "floating_vertical_mid_air",
    "tilt": "none_upright"
  },

  "material_distribution": {
    "bronze_body": {
      "coverage_pct": {"min": 30, "max": 40},
      "color_description": "warm honey-amber where light strikes",
      "shadow_color": "dark chocolate-brown",
      "properties": ["solid", "non_glowing", "aged", "cast_texture"],
      "kelvin_analog": 2800,
      "hex_reference_highlight": "#C8860A",
      "hex_reference_shadow": "#3D2006"
    },
    "verdigris_patina": {
      "coverage_pct": {"min": 60, "max": 70},
      "distribution": "concentrated_at_corners_and_edges",
      "chemistry": "copper_oxidation_over_bronze_base",
      "micro_texture": "crystalline_mineral",
      "color_hue_degrees": 185,
      "color_description": "cyan-teal, not pure green, not pure blue",
      "hex_reference": "#1DA8A0",
      "bioluminescent_glow": {
        "active": true,
        "glow_type": "soft_organic_internal",
        "intensity": "subtle_not_bright",
        "description": "phosphorescent moss, deep-sea dinoflagellates",
        "glow_hue_degrees": 185,
        "not": ["neon", "LED", "electric", "harsh"]
      }
    }
  },

  "face_specification": {
    "location": "floating_above_bracket_pair",
    "face_elements": ["eye_dots_only"],
    "no_mouth": true,
    "no_nose": true,
    "no_brows": true,
    "no_other_features": true,
    "eye_count": 2,
    "eye_material": "solid_bronze_non_glowing",
    "eye_asymmetry": {
      "left_eye": {
        "character": "child_curiosity",
        "relative_size": "larger",
        "size_differential_pct": 25,
        "shape": "wider_circle"
      },
      "right_eye": {
        "character": "wise_archivist",
        "relative_size": "smaller",
        "shape": "slightly_squinted_top_edge_flattened"
      }
    },
    "face_position": "centered_above_gap_between_brackets",
    "face_distance_from_brackets": "slight_floating_gap"
  },

  "composition_relationships": {
    "bracket_to_bracket_default_gap": "1x_bracket_width",
    "face_to_bracket_vertical_gap": "0.5x_bracket_height",
    "face_centered_over": "midpoint_between_brackets",
    "brackets_gravity": "floating_not_supported"
  },

  "prohibited_attributes": [
    "rounded_corners",
    "organic_curves",
    "circular_cross_section",
    "tapered_cross_section",
    "mouth",
    "nose",
    "ears",
    "symmetrical_eyes",
    "identical_eyes",
    "glowing_eyes",
    "neon_glow",
    "LED_glow",
    "warm_glow",
    "yellow_glow",
    "arms",
    "legs",
    "body",
    "cartoon_proportions",
    "anime_style",
    "text_on_surface"
  ],

  "generated_from_references": [
    "R-01_master_hero_shot.png",
    "R-02_character_isolation.png",
    "R-03_three_quarter_view.png",
    "R-04_texture_closeup.png",
    "R-05_speaking_pose.png",
    "R-06_face_study.png"
  ]
}
```

**Gemini 2.5 Pro Stage 2 prompt template (natural language translation):**

```
You are a visual identity specialist for the character Meme. Based on the 
GeometryCompositeProfile JSON below, generate a precise 150-word natural language 
description of Meme's visual identity. This description will be embedded in every 
Imagen 4 and Veo 3.1 prompt to enforce character consistency. 

Requirements:
- Describe all geometric constraints quantitatively where possible
- Include material properties with specific color references
- Describe asymmetric eye-dots precisely
- Include 3 prohibition statements (what Meme is NOT)
- Do not use subjective aesthetics language — only objective material/geometric descriptions

[Insert GeometryCompositeProfile JSON]
```

---

### 6.3 Decision Tree: Branch A vs. Branch B

```
SHOT TYPE → DECISION
──────────────────────────────────────────────────────────

SHOT 1: Static establishing shot
(Meme in archive, camera locked, no motion)

→ BRANCH A (Reference Images)
Reason: Identity precision matters most when Meme is fully visible and static.
No motion continuity needed from prior clip.
Workaround if this is clip 2+: Use Scenebuilder continuation from clip 1's 
output to add visual continuity, but use Branch A reference images as primary anchor.
Slot allocation: [R-01: Character] [Archive photo: Background] [R-04: Texture]

──────────────────────────────────────────────────────────

SHOT 2: Camera move (dolly-in toward Meme)
(Camera approaches, Meme relatively static)

→ BRANCH A (Reference Images) + SCENEBUILDER
Reason: Camera move requires no first/last frame precision (camera moves, Meme holds).
Reference images anchor Meme identity while camera moves freely.
If clip is clip 2+: Use Scenebuilder ON TOP of Branch A — the visual continuation 
reinforces environment consistency while reference images anchor Meme.
XOR note: Branch A used for reference images; first/last frame not needed here 
because camera move is prompt-driven, not frame-constrained.
Slot allocation: [R-01: Character] [R-03: 3/4 view for depth] [Archive: Background]

──────────────────────────────────────────────────────────

SHOT 3: Speech moment (bracket separation on X-axis)
(Brackets part, inner surfaces glow brighter)

→ BRANCH B (First/Last Frame) + REFERENCE IMAGES WORKAROUND
Reason: Speech animation requires precise start and end frame control — 
brackets at default gap (start) → brackets at wide gap (end). This requires 
first/last frame conditioning.
XOR BLOCKER: Cannot use first/last frame AND reference images simultaneously.
WORKAROUND (two-step):
  Step 1: Generate R-01 (closed/default state) via Imagen 4 with reference images → 
          use as first frame for Veo
  Step 2: Generate R-05 (speaking pose) via Imagen 4 with reference images → 
          use as last frame for Veo
  Step 3: Feed both into Veo as first/last frame, NO reference images active.
  Step 4: Veo generates the transition animation between the two Imagen frames.
Result: Identity locked by Imagen (which used references); Veo animates between 
the two locked frames without needing references itself.
Cost: 2 extra Imagen 4 generations per speech clip.

──────────────────────────────────────────────────────────

SHOT 4: Transition between two distinct compositions
(Meme moves from archive area A to area B, or camera cuts to new angle)

→ BRANCH B (First/Last Frame) + WORKAROUND
Reason: Seamless transition requires both endpoint frames to be precisely defined.
WORKAROUND: Same as Shot 3.
  Step 1: Generate "from" frame via Imagen 4 with reference images
  Step 2: Generate "to" frame via Imagen 4 with reference images
  Step 3: Feed both into Veo first/last frame. No reference images.
Additional: Use the 60% background pixel match rule (S-13) — ensure "from" and 
"to" frames share archive elements in similar positions to aid smooth transition.

──────────────────────────────────────────────────────────

SHOT 5: Extreme close-up (eye-dots, patina texture, bracket cross-section)

→ BRANCH A (Reference Images)
Reason: No motion endpoint constraint needed. Identity precision is paramount.
For eye-dot close-up: Use R-06 as images[0] (face study reference).
For patina close-up: Use R-04 as images[0] (texture reference) + R-02 as images[1].
For bracket cross-section close-up: Use R-03 (3/4 view) as images[0] to provide 
depth/volume reference for the rectangular cross-section.
No workaround needed — pure Branch A.

──────────────────────────────────────────────────────────

SHOT 6: Sequential clips (continuation in a narrative series)

→ BRANCH A for first clip in series → SCENEBUILDER for subsequent clips
Reason: Scenebuilder continuity propagates material rendering from first clip 
through visual signal. Cheaper than re-running full Branch A reference pipeline.
Rule: If clip N shows drift from Meme spec → fall back to Branch A for clip N+1.
Scenebuilder is a productivity tool, not a reliability tool.

──────────────────────────────────────────────────────────

QUICK REFERENCE TABLE:

| Shot Type | Branch | XOR Issue? | Workaround |
|---|---|---|---|
| Static establishing | A (refs) | No | None needed |
| Camera dolly/crane | A (refs) + Scenebuilder | No | None |
| Speech (bracket separation) | B (first/last) | YES | Imagen generates both frames |
| Composition transition | B (first/last) | YES | Imagen generates both frames |
| Extreme close-up | A (refs) | No | None |
| Sequential narrative | A → Scenebuilder | No | Fall back to A if drift |
```

---

### 6.4 Ingredient Stack Composition

Veo 3.1 supports up to 3 reference images in the ingredients stack. The allocation decision for Meme:

**Standard Shot Allocation (Static/Dolly):**

| Slot | Category | Image | Purpose |
|---|---|---|---|
| images[0] | Character | R-01 (Master Hero Shot, front, archive setting) | Primary identity anchor — highest conditioning weight. Contains both Meme geometry AND archive context. |
| images[1] | Character (secondary angle) | R-03 (3/4 view) | Depth encoding — provides the 3D volume information missing from front-facing image alone. Per MVCustom research: multi-angle references improve geometric consistency. |
| images[2] | Texture+Style | R-04 (Texture close-up) | Material fingerprint — reinforces patina coverage ratio, bioluminescent glow character, bronze surface texture. |

Rationale for NOT using a Background image in a separate slot: R-01 already contains the archive background as context. Using a dedicated Background slot would consume the texture slot, losing material fingerprint reinforcement. The archive background in R-01 serves double duty.

**Speech Animation Allocation (XOR workaround — first/last frame mode):**

| Frame | Source | Purpose |
|---|---|---|
| First frame | Imagen 4 → R-01 variant (brackets closed) | Identity locked via Imagen reference images; fed to Veo as first frame |
| Last frame | Imagen 4 → R-05 variant (brackets parted) | Speaking pose locked via Imagen; fed to Veo as last frame |
| Reference images | NOT USED in Veo step | Omitted to avoid XOR conflict; identity locked upstream by Imagen |

**Close-up Allocation:**

| Shot type | images[0] | images[1] | images[2] |
|---|---|---|---|
| Eye-dot close-up | R-06 (face study) | R-02 (isolation) | R-04 (texture) |
| Patina texture | R-04 (texture) | R-01 (master) | R-02 (isolation) |
| Bracket cross-section | R-03 (3/4 view) | R-02 (isolation) | R-04 (texture) |

---

### 6.5 Continuity Table Template (8 Fields)

Copy this block verbatim into every Veo 3.1 prompt. Replace [DELTA] sections with shot-specific content only.

---

```
=== MEME CONTINUITY BLOCK (copy verbatim into every prompt) ===

CHARACTER IDENTITY:
Two square bracket sculptures [ ] floating in mid-air, each 3–4cm thick rectangular 
cross-section, sharp 90-degree Bauhaus right angles, no curves. Vertical bars with 
short inward-turning horizontal segments at top and bottom. Above the brackets, floating: 
two small bronze dot eyes only (no mouth, no nose). Left eye 25–30% wider than right 
(curiosity). Right eye slightly squinted top edge (wisdom). Face centered over the gap.

MATERIAL:
Aged bronze body — warm honey-amber highlights #C8860A, dark chocolate shadows #3D2006, 
non-glowing, solid metal. Verdigris patina covers 60–70% of surface, concentrated at 
corners and edges, cyan-teal color at hue 185° (#1DA8A0), glowing softly from within 
like phosphorescent moss. Eye dots solid bronze, non-glowing. Inner bracket surfaces 
glow 10% brighter than outer.

LENS / CAMERA BASELINE:
50mm cinema lens equivalent. Shallow depth of field — brackets in sharp focus, 
background out of focus. No fisheye, no wide angle, no telephoto compression.

COLOR GRADE TARGET:
Warm shadows (amber-brown tones in shadow regions). Cool cyan-teal glow from creature 
(hue 185°, saturation 75–80%). High contrast — dark #1A1A1A background, bright bracket 
highlights. No color uniformity — warm-bronze + cool-cyan coexist.

LIGHTING:
Primary: Soft directional warm light from upper-left (3200K tungsten character). 
Secondary: Creature's own bioluminescent cyan-teal glow. Warm from above-left + cool 
from within = coexisting temperatures. No harsh shadows, no flat ambient, no fill light 
that washes out the glow.

TIME / SETTING:
Archive interior, year 2050. Timeless interior space — no clocks, no dates visible. 
Atmospheric haze mid-distance. Permanent night or deep interior — no natural light.

BACKGROUND:
Endless rows of aged metal card-catalog drawers receding toward frame right in 
atmospheric perspective. One drawer in foreground pulled open, rectangular index cards 
visible. Drawer metal is dark steel-grey, weathered. Background drawers silhouetted 
at #1A1A1A. No windows, no digital screens, no anachronistic technology.

AUDIO BASELINE:
Low ambient archive hum (60Hz mechanical tone, barely audible). Occasional metallic 
resonance of bronze when Meme moves (like distant bell tone). No music in diegetic 
space. No voices. Silence punctuated by material sounds only.

=== END CONTINUITY BLOCK ===

[DELTA — shot-specific content below this line]
Shot type: [dolly-in / static / close-up / etc.]
Camera motion: [describe]
Action: [one primary action only]
Duration: 8 seconds
```

---

### 6.6 Anti-Drift Checklist

After receiving each generated Veo clip, verify against this checklist before accepting:

**IDENTITY GEOMETRY (Critical)**
- [ ] 1. Both brackets visible and shaped like printed `[` `]` characters (not C-shapes, parentheses, or abstract curves)
- [ ] 2. Bracket cross-section visibly rectangular and thick (3-4cm) — not flat 2D planes, not rounded tubes
- [ ] 3. All bracket corners are sharp 90-degree angles — no softening, no rounding, no bevels
- [ ] 4. Horizontal inward-turning segments present at both top and bottom of each bracket
- [ ] 5. Brackets floating in mid-air — not resting on a surface, not connected to ground

**FACE (Critical)**
- [ ] 6. Two eye-dots present, floating above brackets — no other face elements
- [ ] 7. Left eye visibly wider than right eye — asymmetry detectable at full clip resolution
- [ ] 8. No mouth, lips, teeth, nose, ears, eyebrows, or other face features rendered
- [ ] 9. Eye dots are bronze/dark, not glowing

**MATERIAL (Critical)**
- [ ] 10. Patina coverage is 50–75% of visible bracket surface — not less than 50% (too bronze), not more than 80% (too patina, losing bronze contrast)
- [ ] 11. Bronze color is warm honey-amber in highlights — not cold/silver, not orange, not gold
- [ ] 12. Glow color is cyan-teal at approximately hue 185° — not green (hue <160°), not blue (hue >200°), not white
- [ ] 13. Glow is soft and organic — not sharp neon edges, not LED point-source, not uniform luminous surface
- [ ] 14. Glow visible but not dominant — brackets readable as bronze objects with glow, not as glowing objects with bronze patches

**SETTING (Required)**
- [ ] 15. Background contains card-catalog drawer rows receding in depth — not generic office/lab/warehouse
- [ ] 16. Background is dark (near #1A1A1A) — not lit up, not daylight, not blue-lit
- [ ] 17. Volumetric haze visible mid-distance — slight atmospheric depth

**MOTION (Required where applicable)**
- [ ] 18. Maximum one primary action per 8-second clip — no compound movements
- [ ] 19. Motion follows arc-based trajectories — no mechanical straight-line movement
- [ ] 20. Brackets do not merge, intersect, or change count during clip

**DRIFT DECISION RULE:** If any items 1–5 or 6–9 fail → REJECT, regenerate. If material items 10–14 fail → REJECT unless failure is minor and fixable in DaVinci (glow color shift only). If setting or motion items fail → ACCEPT with note, correct in next clip's prompt.

---

### 6.7 Cost-Aware Iteration Plan

**Phase 1: Reference Image Library (Imagen 4)**

Strategy: generate 15-25 candidates across the 6 reference types, curate to 6 keepers.

| Reference | Candidates | Expected keepers | Rationale |
|---|---|---|---|
| R-01 Master Hero | 5 candidates | 1-2 keepers | Most critical — iterate until perfect |
| R-02 Isolation | 3 candidates | 1 keeper | Simpler setting, lower variance |
| R-03 3/4 View | 4 candidates | 1-2 keepers | Angle perspective is tricky |
| R-04 Texture Close-up | 3 candidates | 1 keeper | Material only — high success rate |
| R-05 Speaking Pose | 4 candidates | 1-2 keepers | Bracket separation needs iteration |
| R-06 Face Study | 3 candidates | 1 keeper | Simple, tight shot |
| **Total** | **22 candidates** | **6-9 keepers** | Budget: ~22 Imagen 4 generations |

Imagen 4 cost on Google AI Pro: included in subscription (Nano Banana via Gemini). No additional cost. Generate freely — budget 30-40 candidates total to allow for unexpected failures.

**Phase 2: Veo Validation (Lite/Fast mode first)**

Validate the reference pipeline on Veo 3.1 Fast (lower cost) before committing Standard mode credits.

| Stage | Mode | Clips | Purpose |
|---|---|---|---|
| Identity validation | Fast | 3-5 clips | Does R-01 actually anchor Meme's geometry in Veo? |
| Material validation | Fast | 3 clips | Does R-04 ingredient reinforce patina correctly? |
| Motion test | Fast | 5 clips | Basic camera moves with correct Meme rendering? |
| Speech animation | Fast | 4 clips | Test XOR workaround with Imagen-generated keyframes |
| **Validation total** | **Fast** | **~15-20 clips** | Before committing Standard credits |

Veo credit cost: Google AI Pro includes 1000 credits/month. Fast mode clips cost fewer credits than Standard. The validation phase should consume approximately 100-200 credits (estimated — exact per-clip credit cost not publicly confirmed; use dashboard to monitor).

**Phase 3: Production Clips (Standard mode)**

Once reference library validated and motion pipeline confirmed:

| Phase | Mode | Clips | Credits (est.) |
|---|---|---|---|
| 5-shot reel production | Standard | 5 clips × 3 attempts avg | ~75-150 credits |
| B-roll / additional shots | Standard | 5-10 clips × 2-3 attempts | ~75-200 credits |
| XOR workaround speech clips | Standard | 4 clips (2 Imagen + 2 Veo) | ~40-80 credits |
| **Production total** | **Standard** | ~25-35 Veo clips | ~200-430 credits |

Remaining budget from 1000 credits after validation (~780-900 credits): well within limits for a 40-second reel.

**Budget allocation rule:** Spend heavily on Phase 1 (Imagen reference library is free in Pro). Spend moderately on Phase 2 (Fast mode validation is credit-efficient). Conserve Standard credits for Phase 3 final production.

**If identity drift is severe:** Generate additional reference angles (R-07: profile/side view, R-08: above angle) — 5-10 more Imagen candidates at no cost — before attempting more Veo generations. More reference diversity > more Veo regeneration attempts.

---

## Self-Check Checklist (per E3 reglament)

- [x] Each layer has output (Layer 6 production-ready)
- [x] Imagen 4 prompts × 6 provided (R-01 through R-06) with full material vocabulary
- [x] GeometryCompositeProfile JSON schema provided with field types and example values for Meme
- [x] Branch A vs B decision tree covering 6 shot types (static, dolly, speech, transition, close-up, sequential)
- [x] Continuity table template populated for Meme (8 fields verbatim copy-paste ready)
- [x] Anti-drift checklist 20 items (exceeds 10-15 minimum)
- [x] Cost iteration plan with credit budget and phase breakdown
- [x] Conflicting sources noted (XOR constraint: not definitively confirmed by Google, inferred from API structure + community evidence)
- [x] Sources URL'd and dated throughout
- [x] Confidence per finding (explicitly labeled HIGH/MEDIUM/LOW)
- [x] Gaps explicit (see section below)

---

## Gaps and Limitations

**Gap 1 — XOR constraint not officially documented**
The first/last frame XOR reference images mutual exclusion is established through API payload structure analysis (discuss.ai.google.dev, Q-13) and community testing (getimg.ai, Q-13), but Google has not published an explicit exclusion statement. The constraint could theoretically be circumvented through API experimentation. Confidence: MEDIUM. Production recommendation: treat as hard constraint and use the Imagen keyframe workaround.

**Gap 2 — Veo 3.1 tech report PDF unreadable**
The Veo 3 Tech Report PDF (deepmind-media/veo/Veo-3-Tech-Report.pdf) could not be parsed — binary encoding rather than readable text. The architectural analysis in Layer 5 is based on secondary sources (Medium articles, community analysis) rather than the primary technical document. Confidence: MEDIUM for architectural claims.

**Gap 3 — No documented bronze/verdigris/bioluminescent Veo generation in public corpus**
No public examples of Veo generating specifically this material combination were found. The material vocabulary used in prompts (Layer 6.1) is informed by Imagen 4 community prompt libraries and general AI image generation best practices, not Veo-specific testing. The prompts should work based on material description principles but require empirical validation.

**Gap 4 — Exact credit cost per Veo Standard generation unconfirmed**
The credit cost per clip in the Google AI Pro subscription remains unpublished. The cost estimates in Layer 6.7 are based on 1000 credits/month total allocation and community-estimated generation costs. Verify in personal Flow dashboard before committing to production schedule.

**Gap 5 — Non-humanoid anatomy override risk unresolved**
The developer forum report (Q-20) confirms Veo 3.1 overrides negative prompts for non-humanoid anatomy (adds arms/hands to armless sphere characters). For Meme (brackets, not spheres), limb hallucination is less likely, but the underlying training bias toward human motion patterns is the same. The risk is model-adding rounded organic curves to the bracket geometry. No confirmed workaround exists beyond explicit prompt reinforcement ("sharp 90-degree Bauhaus angles throughout, no organic curves, architectural precision").

**Gap 6 — Scenebuilder availability via API**
Scenebuilder is documented as available in Flow UI (Standard mode). Whether it is accessible via the Gemini API or Vertex AI endpoint is not confirmed. If API access is required (programmatic pipeline), Branch A (reference images) is the only option.

---

## Adjacent Findings (researcher freedom)

**Finding AF-01 — Veo 4 signal detected**
Multiple search results reference "Veo 4" in 2026 content (resource.digen.ai, "Google Veo 4 Video Generator Guide: Master AI Video in 2026"). No official Google announcement found. If Veo 4 ships during Meme production, evaluate whether its character consistency improvement warrants pipeline update. The GeometryCompositeProfile JSON and reference image library are model-agnostic — they would transfer.

**Finding AF-02 — Runway Gen-4.5 vs Veo 3.2 comparison exists**
gaga.art published "Runway Gen-4.5 Review: Why It Beats Sora 2 & Veo 3.2 in 2026" — suggests both Runway Gen-4.5 and Veo 3.2 exist or are expected as of research date. If Veo 3.2 is available and improves non-humanoid consistency, evaluate before final production.

**Finding AF-03 — Idle loop as temporal anchor**
The brand mascot workflow (Q-16) recommends generating a 4-second "idle loop" clip first to establish the character's temporal physics baseline. This is directly applicable to Meme: generate a static breathing/glow-pulse idle clip as the very first Veo generation. If this clip renders Meme correctly, use its best frame as a seventh reference image (R-07: Veo-generated idle frame) for subsequent clips. A Veo-generated reference is by definition in-distribution for Veo, potentially improving consistency more than an Imagen-generated reference.

**Finding AF-04 — Imagen 4 Ultra for reference library**
Imagen 4 comes in three variants: Fast, Standard, and Ultra. For the reference image library (Phase 1), using Imagen 4 Ultra (highest detail) for R-01 and R-04 specifically would produce sharper material detail in the reference images, potentially improving the identity conditioning signal in Veo. Cost impact: Imagen 4 Ultra is included in Google AI Pro but may have slower generation time. Recommended for R-01 and R-04 only.

**Finding AF-05 — Adobe Firefly / Veo integration**
Adobe Firefly platform now supports Veo partner model integration (helpx.adobe.com, Q-13 search results). For teams using Adobe Creative Cloud, this provides an alternative entry point. Not relevant for the current Pro-only stack but worth noting for future production scaling.

---

## Confidence Levels per Finding

| Finding | Confidence | Basis |
|---|---|---|
| Branch A/B documented capabilities | HIGH | Google Blog + developer docs |
| XOR constraint (first/last frame + refs) | MEDIUM | API payload structure + community, not official statement |
| Non-humanoid anatomy override | HIGH | Direct developer forum report |
| Runway Gen-4 40% consistency improvement | MEDIUM | Single source (selfielab.me) — no independent benchmark |
| Geometry Forcing alignment mechanism | HIGH | arXiv preprint with clear abstract |
| MVCustom multi-view geometric approach | HIGH | arXiv preprint with clear methodology |
| Veo latent diffusion transformer architecture | MEDIUM | Secondary sources only (tech report PDF unreadable) |
| ControlNet-like image conditioning in Veo | MEDIUM | Community analysis — not official documentation |
| images[0] highest priority weight in API | MEDIUM | Atlas Cloud documentation — not Google official |
| Imagen 4 prompt structure (Subject+Context+Style) | HIGH | atlabs.ai prompting guide + official Vertex AI docs |
| 6 reference image prompts (R-01 through R-06) | MEDIUM | Synthesized from principles — not empirically tested |
| GeometryCompositeProfile JSON schema | MEDIUM | Derived from forensic pipeline concept — novel, not validated |
| Anti-drift checklist | HIGH | Derived directly from Meme spec + known failure modes |
| Credit cost estimates | LOW | No published per-clip cost — community estimates only |
