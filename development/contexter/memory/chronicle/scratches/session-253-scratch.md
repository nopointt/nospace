# session-scratch.md
> Closed · Axis · 2026-04-26 · session 253

<!-- ENTRY:2026-04-26:CLOSE:253:contexter:contexter-content-factory [AXIS] -->
## 2026-04-26 — сессия 253 CLOSE [Axis]

**Decisions (D-CTX15-12..15 + D-VEO-01..09):**
- D-CTX15-12: Brand visual identity expanded — dark theme as Gelb-polus pole для blog.contexter.cc + vault.contexter.cc + privacy-bound app sections. Light theme (Weiß-polus, blue accent) для main contexter.cc + app default. Theme axis carries semantic (light=public, dark=private).
- D-CTX15-13: Bauhaus yellow `#E8C018` (Itten cadmium primary triad) locked as dark theme accent. Dark canvas `#1A1A1A` (Moholy-Nagy poster canon). 24-token color system × 2 themes via theme axis.
- D-CTX15-14: Brand bible established — 9 файлов в `nospace/marketing/branding/contexter/`. Symbol = «Архивариус 2050». Mascot = Meme. Category = Public RAG + Shared Rooms + Any size, any format. Mission = «Контекстер возвращает человеку контроль над контекстом». 4 TOV pillars (Sparing/Trustworthy/Spatial/Quietly Authoritative). NN/G calibration 15/25/5/20.
- D-CTX15-15: Mascot Meme v6 LOCKED — два square brackets `[ ]` + minimal face above (eye-dots only, NO mouth) + bronze body + cyan-teal bioluminescent verdigris patina (glowing patches). Continuation of `con[text]er` wordmark. Talk animation = X-axis bracket separation (10-state spec, RAG-grounded Bauhaus principles). NO mouth = production advantage (sidesteps Veo lip-sync 25% success rate).
- D-VEO-01: Stack для video production locked — Imagen 4 / Nano Banana + Veo 3.1 + Lyria 3 Pro + DaVinci Resolve Free + ElevenLabs (optional). Subscription Google AI Pro $19.99/мес.
- D-VEO-02: Reel format = 5 × 8-sec Veo clips = 40-sec, 16:9, **Curiosity Arc** structure. State machine: curiosity → searching → discovery → satisfaction → invitation. Apple counter-dip strategy validates discovery+action в attention dip zone (sec 16-32).
- D-VEO-03: **Tier recommendation = Vertex AI from day 1** — saves ~$540 over 6 months vs Ultra. Break-even = 63 clips/мес. Below: Vertex. Above: Ultra. Pro $19.99 NOT viable (10 Quality clips/мес cap = blocks prototyping).
- D-VEO-04: Music decision tree — Lyria 3 Pro 10 attempts → Mureka V8 ($10) → Suno Premier ($30) → ElevenLabs Music → Library. Max spend before library = $40. Udio DISQUALIFIED (downloads blocked since Oct 2025 UMG/Warner settlement).
- D-VEO-05: Lyria 3 Pro single 40-sec track preferred (NOT stitched 30-sec Clips — Lyria 3 Pro launched Mar 25, supersedes SEED's stitch approach).
- D-VEO-06: Audio mix levels — Veo SFX -12dBFS / Lyria score -18dBFS / archive ambient hum -24dBFS / DaVinci master -3dBFS ceiling, -14dBFS LUFS integrated (social standard).
- D-VEO-07: Narration = NO для v1 (5 reasons in DEEP-2 §6.5: no mouth + TOV opposes + Lyria mix conflict + audience не нуждается + 85% соц-видео muted).
- D-VEO-08: DaVinci 8-node grade tree локирован. Hue 185° = #1AD4E6 для Glow Color. Resolve 20.2 Secondary Glow + Alpha-Driven Light Effects = bioluminescent recipe achievable on Free tier. 3 free LUTs (Uppbeat / FixThePhoto / CINECOLOR).
- D-VEO-09: Watermark crop ffmpeg one-liner (1890×1060 + Lanczos rescale = 1.6%, undetectable) только для prototype/personal use. NOT для hero brand film. Vertex AI dedicated path для clean output.

**Files changed/created (~5800 lines):**

Brand (9 files committed):
- `marketing/branding/contexter/brand-bible.md` (221) NEW
- `marketing/branding/contexter/tov.md` (530) NEW — 9-section CANONICAL voice contract
- `marketing/branding/contexter/values.md` (193) NEW
- `marketing/branding/contexter/positioning.md` (84) NEW
- `marketing/branding/contexter/category-manifesto.md` (130) NEW
- `marketing/branding/contexter/mascot-meme.md` (363) NEW + iterative updates v1→v6 + talk animation spec
- `marketing/branding/contexter/ui-language.md` (202) NEW — bilingual EN/RU + glossary
- `marketing/branding/contexter/interaction-pattern.md` (113) NEW — web app pattern (NOT spatial canvas)
- `marketing/branding/contexter/brand-and-design-overview.md` (147) NEW — meta-index + diff vs Harkly

Design system canon (5 files modified):
- `design/contexter/README.md` — Inter+Mono dual fix + Source of Truth section
- `design/contexter/components/inventory.md` — 7 component fonts Mono → Inter (Logo stays Mono)
- `design/contexter/guidelines/color.md` — Full Dark Theme Tokens section + WCAG verifications + Theme Application Rule
- `design/contexter/guidelines/elevation.md` — Dark theme elevation table (inverted ground)
- `design/contexter/guidelines/typography.md` — rule 01 Mono usage clarified (no pipeline labels)
- `development/contexter/landing/src/index.css` — stale "Single typeface: Mono" comment fixed

Pencil + meme renders (committed):
- `design/contexter/design-system-themes.pen` (290 KB) NEW — dual-theme Pencil source, 14 sections × 2 themes side-by-side, theme axis
- `design/contexter/meme-renders/meme-v1-flux.png` NEW — Pollinations test (rejected)
- `design/contexter/meme-renders/meme-v4-canon-prompt.md` NEW

Research артефакты (7 files, ~5500 lines, ALL VIDEO-PRODUCTION):
- `docs/research/veo-3-gemini-ui-deep-research.md` (724) — technical how-to
- `docs/research/contexter-meme-veo3-studio-production-seed.md` (465) — SEED 42 signals × 12 dim
- `docs/research/contexter-meme-character-bible-workflow-deep.md` (984) — DEEP-1
- `docs/research/contexter-meme-reel-v1-storyboard-spec-deep.md` (1114) — DEEP-2
- `docs/research/contexter-meme-music-gen-comparison-deep.md` (~850) — DEEP-3 + Adjacent supplement
- `docs/research/contexter-meme-tier-decision-deep.md` (806) — DEEP-4
- `docs/research/contexter-meme-davinci-grade-recipe-deep.md` (1120) — DEEP-5
- `docs/research/contexter-meme-production-INDEX.md` (~150) NEW — master index/bridge to next session

Regulation/infrastructure:
- `rules/regulations/file-size-regulation.md` — § 6 binary/encrypted exclusions added
- `.git/hooks/pre-commit` — case statement filter для .pen/.ipynb/.min.js/.lock/.svg/.pdf

Memory updates (`~/.claude/projects/.../memory/`):
- `feedback_design_system_conflicts.md` NEW — система conflict = active task
- `feedback_pencil_save_path_diagnostic.md` NEW — verify Pencil save filesystem state
- `reference_contexter_dark_theme.md` NEW — dark theme tokens reference
- `reference_contexter_brand_canon.md` NEW — brand canon pointer + Gemini AI Pro vs API distinction
- `MEMORY.md` — index updated

Infrastructure:
- Qdrant container started (`kernel-qdrant-1`) — 9 collections recovered, bauhaus_knowledge 10 288 vectors GREEN

**Completed:**
- Bauhaus RAG online again, Bauhaus yellow #E8C018 verified canonical via WebSearch
- Design system canon unified (Inter+Mono dual + dark theme tokens + theme axis architecture)
- Brand bible v1 written (9 файлов, mirror of Harkly structure but Cold Bauhaus + brackets mascot + Public RAG category)
- Mascot Meme 6-iteration evolution → v6 brackets + face + bronze + biolum patina LOCKED
- Talk animation 10-state spec written (Bauhaus RAG-grounded: Van Doesburg / Klee / Kandinsky / Moholy-Nagy / Schlemmer)
- Veo 3.1 production research COMPLETE: SEED + 5 DEEPs + INDEX
- Tier decision quantified: Vertex AI from day 1 saves ~$540 over 6 months vs Ultra
- Music decision tree quantified: max $40 spend before library fallback
- DaVinci 8-node grade recipe with per-clip values + free LUT URLs
- Pen file recovery process documented (Pencil save-path diagnostic memory)
- File-size-regulation § 6 binary exclusions formalized
- 6 git commits + push: 8671bde / 3e9b369 / fe57f3c / 3346412 / e5ea5a6 / 5c6fcce

**Opened:**
- **Production Playbook v1 synthesis** — pending in NEW SESSION с чистым контекстом. INDEX file at `docs/research/contexter-meme-production-INDEX.md` lists all 7 artifacts + cross-references + open gaps + next-session plan
- 6 empirical gaps требуют verify (Vertex AI exact pricing, Imagen 4 + Lyria 3 Pro credit costs, watermark exact pixel coords, RU region availability, bronze/biolum material untested, bracket X-axis novel)
- DEEP-3 supplemented Adjacent Findings myself (Mureka V8 / AIVA / Stable Audio / ElevenLabs Music) due to agent hit quota — needs review
- Pen file `design-system-themes.pen` — saved by nopoint via Pencil Save As. Contexter-ui.pen restored from git `88013fe` после accidentally being overwritten
- Talk animation spec validation pending — first Veo runs will test if X-axis bracket separation maps cleanly to motion primitives
- CTA URL placement decision pending (in-frame vs description-only) — affects Clip 5 DaVinci composition
- Open question: Меme generation в Gemini AI Pro web (already done — approved) vs Vertex AI (next phase, programmatic)
- Pre-CTX-11 commits `a5eb98a..c3f4033` всё ещё local main, не pushed (carried over from session 252)

**Notes:**
- Memory pressure peaked ~927K на closing — Opus 4.7 1M context. Below autocompact buffer. No observable degradation signals (no lost threads / no re-asking / no hypothesis drift) — but heavy session, recommend FRESH SESSION для production playbook synthesis vs in-context continuation. Per E4 reglament: «working volume on Opus 4.7 1M = 500K».
- Wave B research hit quota cap mid-flight (4:10pm KZ reset). DEEP-5 needed restart from scratch (file initialized then quota hit). DEEP-3 missed Adjacent Findings — Orchestrator self-supplemented.
- Pencil double-prefix path bug observed (`/C:/C:/...` in get_editor_state) → save dialog defaulted to Desktop. Recovery successful via git checkout 88013fe. Documented in feedback_pencil_save_path_diagnostic.md.
- Mascot evolution показала важность iteration — v1 amorphous spiral was «too logo-like», v2 added face but «too Soul Jerry», v3 bronze-not-neon resolved Jerry concern, v4 added biolum patina, v6 pivoted to brackets continuation of wordmark — final form unifies wordmark+logomark+mascot single visual language.
- Critical discovery: «no mouth» = competitive advantage for Veo (sidesteps lip-sync ~25% success rate weakness). Bracket X-axis maps to object-separation primitives Veo handles well.
- Lyria 3 Pro launched Mar 25 supersedes SEED's stitched-Clip approach — DEEP-2/DEEP-3 align on single 40-sec track.
- Pro tier credit conflict resolved DEEP-4: official Google One support = 1000 credits/мес для Pro (NOT 100 как MindStudio claimed). 10 Quality clips/мес — still insufficient for production.
- Tribeca Film Festival 2025 (Dave Clark «Freelancers» + 2 others) = clearest real-world Veo 3 production reference. Other agencies (Buck/Tendril/MPC/Framestore) silent — NDA assumption.
- Forensic 6-stage character pipeline (Chouaieb Nemri, Google Cloud July 2025) at github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/veo3-character-consistency — open-source, adaptable for Meme bracket geometry fingerprint.
- Next session должна начать с reading `docs/research/contexter-meme-production-INDEX.md` first → потом каждый артефакт full per E6 → production playbook synthesis в чистом контексте.
