---
name: mascot_meme_marketing_surfaces
description: Где Meme появляется. Favicon (0D), loading screens (1D), empty states (2D), hero (2.5D), marketing video (3D), blog illustrations, social avatars, press kit. Per-surface size and complexity rules. Per-surface theme.
type: reference
version: v1
locked: 2026-04-26 (session 254)
---

# Meme — Marketing Surfaces

> Где Meme появляется в продукте и маркетинге. Этот файл — про per-surface usage. Что Meme — `philosophy.md` + canon-* files. Как анимируется — `motion-*` files.

## Концептуальная модель

Meme — **одна форма, рендеренная разной размерностью под surface**. НЕ разные иллюстрации в разных стилях. Один контур → разные дименсии.

Это N-dimensional behavior: Meme adapts complexity к context. Favicon (16×16px) показывает only silhouette. Marketing video показывает full 3D rendering with material и motion. **Identity preserved через все** dimensions через canonical proportions, geometry, и character signature.

## N-dimensional rendering

| Размерность | Surface examples | Form |
|---|---|---|
| **0D** (point / dot) | Favicon, notification dot, status indicator | Single pixel, simplified silhouette |
| **1D** (line / wave) | Loading bar, progress indicator, inline cursor | Animated wave between bracket-anchor points |
| **2D** (silhouette / outline) | Lockup в логотипе, иллюстрации блога, social cards, empty states | Open spiral + arc, outlined |
| **2.5D** (parallax / layered) | Hero на лендинге, transition states | 2D form + depth layer offsets |
| **3D** (volumetric) | Marketing video, key-art, press kit | Full bronze + patina + glow + material reflection |
| **4D** (motion + time) | UI animations, idle states, talk animation | Same form animated через transitional arcs and bracket separation |

**Принцип:** одна форма читается через все dimensions. Subscription к brand identity preserved.

## Per-surface specifications

### 1. Favicon (`contexter.cc`)

**Format:** ICO + PNG variants (16×16, 32×32, 192×192)

**Size class:** 0D

**Rendering:**
- Pure silhouette of bracket pair с two eye-dots
- Simplified geometry — bracket form recognizable but без detail (no patina texture, no glow render)
- Color: per theme:
  - Light theme (default): bracket silhouette в `--accent` `#1E3EA0` blue
  - Dark theme: bracket silhouette в `--accent` `#E8C018` yellow
- No background (transparent) или solid background per theme

**Composition:**
- Centered
- Mascot occupies ~80-90% of frame
- Aspect ratio: 1:1

**Use:**
- Browser tab favicon
- Bookmark icon
- App icon (если приложение mobile / desktop appears later)
- PWA manifest icon

### 2. Loading screens (1D)

**Format:** Inline SVG animation

**Size class:** 1D

**Rendering:**
- Bracket pair as anchor points
- Wave animation between brackets — представляет «processing»
- Wave color: `--accent` per theme
- Brackets simplified line outline (не full body)
- Possibly brackets как marks at start/end of bar with wave moving between

**Composition:**
- Horizontal orientation typically
- Width variable (depends on context — full-width inline, или fixed 200-400px)
- Height ~24-48px
- Wave amplitude ±5-10% of height

**Animation:**
- Wave cycles continuously per `motion-idle-and-states.md` Processing state — slow (1 cycle / 8 sec) or faster для active processing (1 cycle / 3 sec)
- Smooth ease-in-out curve

**Use:**
- File parsing progress
- Search loading
- Sync indication
- Generic «working» signal in UI

### 3. Empty states (2D)

**Format:** SVG illustration

**Size class:** 2D

**Rendering:**
- Full Meme silhouette + minimal context illustration
- Outlined line art (1-2px stroke)
- Stroke color `--accent` per theme
- Optional subtle fill (10-20% opacity bronze color tone)
- No glow rendering в 2D simplified form (or implied with very subtle glow halo)

**Composition:**
- Centered or slight offset
- Background simple (light grey `#F0F0F0` в light theme, dark `#1A1A1A` в dark theme)
- Subject scale ~30-50% of frame
- Often accompanied by short text below per `voice-and-copy.md` («Архив пуст. Можно начать.»)

**State variants:**
- No files: Meme idle с empty drawer rendered nearby
- No matches: Meme curious looking searching
- No shared rooms: Meme idle with abstract «room» implied
- Error: Meme в error state с signal-error tint

**Use:**
- Empty file list
- No search results
- Empty shared rooms list
- New user dashboard before first upload

### 4. Hero (2.5D)

**Format:** Layered SVG / WebGL / Canvas

**Size class:** 2.5D

**Rendering:**
- Full Meme prominently positioned
- Layered behind: archive context elements (drawers, atmospheric haze)
- Layered in front: subtle particles / dust catching light
- Material rendering more detailed than 2D — bronze color visible, patina tint visible, subtle glow
- Layers move с slight parallax on scroll или mouse move (subtle, не aggressive)

**Composition:**
- Mascot prominently positioned (often centered or 1/3 grid)
- Frame ratio responsive (16:9 desktop, square or 9:16 mobile)
- Mascot scale: ~40-60% frame height на desktop, ~50-70% mobile

**Animation:**
- Subtle idle motion (per `motion-idle-and-states.md` State 1)
- Parallax responding к scroll position
- Per `motion-talk-animation.md` если hero включает Meme «say» quote

**Use:**
- Landing page hero (`contexter.cc`)
- Vault landing hero (`vault.contexter.cc`)
- Major announcement section

### 5. Marketing video (3D)

**Format:** Pre-rendered video (MP4, MOV)

**Size class:** 3D + 4D (volume + time)

**Rendering:**
- Full canonical Meme: bronze body + verdigris patina + bioluminescent glow + material reflections
- Full geometry с 3D cross-section visible
- Camera motion variable per shot (per DEEP-2 storyboard for production reel)
- Background: archive interior (drawer rows, atmospheric haze) per `canon-composition.md` R-01 master hero specifications

**Composition:**
- Per DEEP-2 5-clip Curiosity Arc structure
- Cinematic 16:9 aspect ratio default
- 9:16 vertical variant для social
- 1:1 square for some platforms

**Animation:**
- Per `motion-talk-animation.md` and `motion-idle-and-states.md`
- Continuity table preserved across clips
- Transitions per design system motion tokens

**Voice:**
- Reel CTA voice (3-second slogan) per `voice-audio.md` D-VOICE-02 scope

**Use:**
- Production reel v1 (40-second, 5 × 8 sec, Curiosity Arc)
- Marketing campaign content
- Social distribution (HN, Reddit, Twitter, LinkedIn, Telegram, blog)
- Press kit demo

**Production stack:** Veo 3.1 + Lyria 3 Pro + DaVinci Resolve Free (per video research artifacts).

### 6. Blog illustrations

**Format:** SVG / PNG illustrations

**Size class:** 2D

**Rendering:**
- 2D Meme в разных «настроениях» (curious / knowing / bridging)
- Outlined or with subtle fill
- Color per theme (light blue accent, dark yellow accent)
- Optional subtle archive context elements

**Composition:**
- Variable per article context
- Often used as opening illustration or section break
- Mascot scale variable (small inline icon to large opening illustration)

**Use:**
- Blog posts на `blog.contexter.cc`
- Article opening illustrations
- Section break illustrations
- Dev.to / Medium / Hashnode cross-post adaptations

### 7. Social avatars

**Format:** Square PNG/JPG

**Size class:** 2D simplified silhouette

**Rendering:**
- Meme silhouette
- Solid color background (could be brand accent или neutral)
- Each platform may need slightly different crop/treatment per platform conventions

**Composition:**
- 1:1 square
- Mascot fills ~70-80% frame с padding
- Background solid brand color (e.g., `#1A1A1A` dark mode, `#FAFAFA` light mode)

**Per-platform variants:**
- Twitter/X: 400×400px
- LinkedIn: 300×300px
- HackerNews: тop right text-only username (no avatar typically)
- Reddit: 256×256px
- Telegram: 512×512px (chat / channel avatar)
- GitHub: 460×460px

**Use:**
- Profile pictures
- Channel avatars
- Bot avatars (если automation appears)

### 8. Press kit

**Format:** Multi-format archive (ZIP с PNG / SVG / PDF)

**Size class:** Multi-dimensional (всё from 0D к 3D)

**Contents:**
- Logo lockup variants (light, dark, monochrome)
- Mascot illustrations (2D / 2.5D / 3D)
- Animation reference (видео files showing 10-state talk animation, idle motion, transitions)
- Color palette swatches (canonical hex values)
- Typography reference
- Sample copy phrases (per `voice-and-copy.md`)
- Brand bible PDF (compressed brand-bible.md + visuals)

**Composition:**
- Each asset clearly labeled
- Folder structure organized

**Use:**
- Media inquiries
- Partner relationships
- Conference / event presentations
- Investor pitches

## Per-theme rendering

### Light theme (Weiß-polus)

| Element | Color/treatment |
|---|---|
| Background | `#FAFAFA` |
| Mascot accent | `#1E3EA0` blue |
| Bronze body | `#C8860A` (per `canon-material-bronze.md`) |
| Patina | `#1DA8A0` (per `canon-material-patina.md`) |
| Glow | `#1AD4E6` (per `canon-bioluminescent-glow.md`) |

Note: bronze, patina, glow material colors stay **canonical regardless of theme**. Theme accents (blue/yellow) apply to mascot **outline/silhouette** в 0D-2D simplified renderings, не к 3D rendered material colors.

### Dark theme (Gelb-polus)

| Element | Color/treatment |
|---|---|
| Background | `#1A1A1A` |
| Mascot accent | `#E8C018` yellow |
| Bronze body | `#C8860A` (canonical, unchanged) |
| Patina | `#1DA8A0` (canonical, unchanged) |
| Glow | `#1AD4E6` (canonical, unchanged) |

## Per-surface theme assignment

| Surface | Default theme |
|---|---|
| Main `contexter.cc` (marketing landing) | Light |
| App default (`app.contexter.cc`) | Light (user can toggle) |
| Blog (`blog.contexter.cc`) | Dark |
| Vault (`vault.contexter.cc`) | Dark |
| Privacy-bound app sections | Dark |
| Shared rooms | Dark when room visible to <5 people; light when public |
| Marketing video | Mostly dark (archive setting) |
| Press kit | Both light и dark variants provided |
| Social avatars | Both light и dark variants provided |
| Blog illustrations | Dark (matches blog) |

## Rendering complexity per surface

### Minimal (0D-1D)

- Favicon
- Loading bar
- Notification dot

These render с minimum geometry — silhouette only, accent color, no material rendering.

### Simple (2D)

- Empty state illustration
- Blog illustrations
- Social avatars
- 2D version of mascot для articles

These render с outlined geometry, solid colors, optional 10-20% fill, no glow.

### Medium (2.5D)

- Hero illustration
- Layered marketing graphics
- Some advanced UI states

These render с layered depth, parallax, subtle material color hints.

### Full (3D)

- Marketing video
- Animated explainer
- Press kit hero asset

These render с full canonical material (bronze + patina + glow), full geometry, motion (per motion-* files).

## Forbidden uses

| Forbidden | Why excluded |
|---|---|
| **Plush merch** | Brand discipline — Meme не toy. Не продаётся как plush. Cute через геометрию, не через антропоморфизм. |
| **Product placement** | Meme не «использует» продукты внутри иллюстраций. Не reading book, не drinking coffee. He's archive consciousness, не character actor. |
| **Sticker pack** | Meme не emoji-style sticker. Brand против emoji-stamp aesthetic. |
| **Mascot dance** | Meme не dances. Calm pillar enforces. |
| **Holiday outfit** | Meme не gets «Santa hat» or «New Year» costumes. Brand discipline. |
| **Romantic mascot couples** | No second mascot. No relationship implied. |
| **Mascot eating / drinking** | Meme is body-less consciousness in archive — eating/drinking metaphors don't apply. |
| **Mascot sleeping** | Idle state ≠ sleep. No «zzz» symbols, no closed eyes for sleep. |
| **Personal pronoun «I» в копирайте** | Meme observes («Похоже, ...»), не reports first-person («Я нашёл») |
| **Talking «to» other mascots** | Meme exists alone (in archive). Не interacting with brand mascots from other companies. |

## Sizing guidelines

### Pixel sizes per surface

| Surface | Min size | Recommended | Max size |
|---|---|---|---|
| Favicon | 16×16 | 32×32 | 192×192 |
| Loading bar | 24px high | 32-48px high | 80px high |
| Inline icon | 16×16 | 24×24 | 48×48 |
| Notification dot | 8×8 | 12×12 | 16×16 |
| Empty state illustration | 200×200 | 320×320 | 600×600 |
| Hero illustration | 800×800 | 1200×1200 | 2400×2400 |
| Blog illustration | 600×400 | 1200×800 | 2400×1600 |
| Social avatar | 256×256 | 512×512 | 1024×1024 |
| Marketing video | 1280×720 | 1920×1080 | 3840×2160 (4K) |
| Press kit hero | 2400×1600 | 4800×3200 | 7680×4320 (8K) |

### Min size for canonical geometry

При sizes >= 64×64px — full 2D Meme (bracket pair + face) renderable canonical.

При sizes < 64×64px — simplification:
- 32×32: bracket pair + simplified eye dots (single pixel each)
- 16×16: silhouette only — bracket pair recognizable, eyes implied as single area

## Brand mascot vs. logo

**Логотип Контекстера:** `con[text]er` typographic wordmark.

**Маскот Meme:** rendered figure (brackets + face).

These are **separate brand elements**. Логотип used in:
- Header / navigation
- Footer
- Press references
- Domain text

Маскот used in:
- Loading states
- Empty states
- Blog illustrations
- Social avatars
- Marketing video
- Hero (often с logo nearby)

**Неrules:**
- ❌ Маскот не replaces логотип в header
- ❌ Меме не embedded в логотип wordmark
- ❌ Logo wordmark не replaces маскот в illustration

But sometimes лockup:
- ✅ Logo wordmark + Meme stylized как hero composition («con[text]er» wordmark с brackets matching Meme bracket form aesthetically)

## Verification checklist

При creating Meme asset for any surface:

- [ ] Surface complexity matches canon (0D / 1D / 2D / 2.5D / 3D)
- [ ] Theme assignment correct (light для public, dark для private/blog/vault)
- [ ] Material colors canonical (`#C8860A`, `#1DA8A0`, `#1AD4E6`) если 3D rendering
- [ ] Accent colors canonical (`#1E3EA0` light, `#E8C018` dark) если 0D-2D simplified rendering
- [ ] Sizing within recommended range
- [ ] Mascot identity preserved через rendering complexity
- [ ] Composition rules respected (centered or appropriate composition per surface)
- [ ] Forbidden uses не violated (no plush, no product placement, etc.)
- [ ] Background appropriate per theme

## Drift modes warning

Common drift в asset production:

- **Theme color contamination** — material colors shift при theme change. Reinforce «material colors canonical regardless of theme; only accent colors change».
- **Logo replacement drift** — designer uses Meme as logo. Reinforce «логотип = `con[text]er` wordmark; Meme = separate mascot».
- **Sizing creep** — assets render below min size with corrupted geometry. Reinforce min size guidelines (favicon 16×16 minimum, inline icon 16×16 minimum).
- **Forbidden use creep** — sticker pack / plush concepts surface. Reinforce «brand discipline via this file's forbidden list».
- **Identity loss across surfaces** — favicon Meme и hero Meme not recognizable as same character. Reinforce canonical proportions (height-to-width ratio, eye scale ratio, asymmetry).

## Связь с другими файлами

- **Geometry** — `canon-geometry.md` (canonical proportions preserved across surfaces)
- **Material** — `canon-material-bronze.md`, `canon-material-patina.md`, `canon-bioluminescent-glow.md` (full rendering for 3D)
- **Composition** — `canon-composition.md` (reference shot rules)
- **States** — `states.md` (which state per surface context)
- **Motion** — `motion-talk-animation.md`, `motion-idle-and-states.md` (animations applicable per surface)
- **Voice Copy** — `voice-and-copy.md` (text accompanying mascot in surfaces)
- **Cute Friendliness** — `cute-friendliness.md` (cute через geometry, не via plush merch)
- **Anti-patterns** — `anti-patterns.md` (forbidden use cases)
- **Decisions Log** — `decisions-log.md`

## Lock status

Marketing surfaces — **LOCKED v1 (session 254, 2026-04-26)**.

N-dimensional rendering paradigm (0D-4D) — locked. Per-surface theme assignment — locked. Forbidden uses (10 items) — non-negotiable. Sizing guidelines — locked.

Refinements которые НЕ нарушают lock:
- New surfaces adding с decisions-log entry
- Per-platform avatar specs refinement
- Sizing edge cases уточнение
- New press kit components

History:
- v1 (session 254): Surfaces fully spec'd, N-dimensional paradigm explicit, forbidden uses enumerated
