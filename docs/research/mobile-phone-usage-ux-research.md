# Mobile Phone Usage UX Research
> Deep research on how people use phones, for Contexter mobile breakpoint design.
> Date: 2026-03-22

---

## 1. Physical Ergonomics

### Steven Hoober's 1,333 Observations Study

Steven Hoober conducted 1,333 observations of people using mobile devices in natural settings (streets, airports, bus stops, cafes, trains) — published 2013 via UXmatters. Of these, 780 involved active screen interaction.

**Grip distribution (780 active-use observations):**

| Grip | % | Detail |
|---|---|---|
| One-handed | 49% | Right thumb: 67%, Left thumb: 33% |
| Cradling (hold in one hand, tap with other) | 36% | Thumb input: 72%, Finger input: 28%. Left hand holds: 79% |
| Two-handed | 15% | Portrait: 90%, Landscape: 10% |

**Critical finding:** "Users change the way they're holding their phone very often — sometimes every few seconds." Grip is not static; it shifts based on context, content, and task.

**Thumb drives 75% of all phone interactions** (Josh Clark's research, referenced by Hoober).

Sources:
- [UXmatters: How Do Users Really Hold Mobile Devices?](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php)
- [Smashing Magazine: Touch Design for Mobile Interfaces (book)](https://www.smashingmagazine.com/printed-books/touch-design-for-mobile-interfaces/)

### Thumb Zone

Three zones defined by ease of thumb reach:

| Zone | Location | Description |
|---|---|---|
| **Natural/Easy** | Bottom-center of screen | Effortless thumb reach. ~33% of screen on 5" devices |
| **Stretch** | Mid-screen, far edges | Reachable but uncomfortable for repeated taps |
| **Hard-to-reach** | Top corners, far edges | Requires grip change or second hand |

**On 6.5"+ devices, the natural zone shrinks to approximately 22% of total screen area** — leaving 78% in stretch or hard-to-reach territory.

Thumb zone for different hand sizes (Kim & Ji, 2019 — Springer):
- Large hands: >50% of touchscreen accessible
- Small/medium hands: ~30% accessible across all smartphone sizes

**Swiping pattern:** Users swipe diagonally downward from device edge toward middle, not purely horizontal.

Sources:
- [Smashing Magazine: The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- [Springer: Natural Thumb Zone on Smartphone with One-Handed Interaction](https://link.springer.com/chapter/10.1007/978-3-319-96071-5_50)

### Screen Size Impact

- Average smartphone screen size in 2025: 6.1–6.7 inches (sweet spot), with continued demand for 6.5–7.0"
- Most popular resolution: 360x800 (~11% market share), followed by 1080x2400 (FHD+, premium/mid-range standard)
- Key mobile breakpoints: 375–430px cover majority of modern devices (iPhone 375x812 = 16.79% NA, Android 390x844 = 13.72%)

**Ergonomic studies confirm:** Under one-hand operation, screen size significantly affects operation performance. Devices >5.5" show measurably higher error rates and longer task completion times.

The Android Accessibility Lab (2023) found gesture navigation users completed tasks 27% faster with 41% fewer correction attempts compared to button navigation — because swipe zones tolerate more angular/speed variation than fixed 48dp buttons.

Sources:
- [ResearchGate: Ergonomic Study on Touch-screen Phone Size](https://www.researchgate.net/publication/292347794)
- [StatCounter: Mobile Screen Resolution Stats](https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide)

---

## 2. Attention & Cognitive Load

### Attention Span Data (2024–2026)

| Metric | Value | Source | Sample |
|---|---|---|---|
| Average screen-based attention | **43 seconds** | NNGroup Digital Focus Report (2026) | 67,000 users (NA, Europe, SE Asia) |
| Average attention span (general) | **7.6 seconds** (2026) | MIT Media Lab + Stanford | 45,000 participants, 13-year longitudinal |
| Attention on any screen (Gloria Mark) | **47 seconds** (down from 2.5 min in 2004) | UC Irvine / "Attention Span" book (2023) | Multi-year field studies |
| Decline since 2000 | **-36.7%** | MIT/Stanford study | — |
| Daily task switches (workday) | **566 per 8-hour day** (~51 sec between switches) | NNGroup 2026 | — |
| Self-interruption rate | **49%** | Gloria Mark | — |
| Recovery time from interruption | **25 minutes** | Gloria Mark | — |

**Generation gaps:**
- Millennials: 10.8s
- Boomers: 18.4s
- Silent Generation: 23.7s
- Mobile-first users (18–34): 6.8 seconds
- Gen Z: 68% abandon video in <4 seconds

### "Brain Drain" Effect

**Study:** Ward et al. (2017) — "Brain Drain: The Mere Presence of One's Own Smartphone Reduces Available Cognitive Capacity" (Journal of the Association for Consumer Research, Vol 2, No 2).

**Finding:** Even when participants successfully maintained attention and did NOT check their phones, the mere physical presence of the smartphone reduced available cognitive capacity. Effect was strongest for those with highest smartphone dependence.

**Meta-analysis (2023, PMC):** 56 studies, n=7,093 — only working memory showed statistically significant impairment from phone presence. Other cognitive functions showed null effects. The effect is real but more nuanced than originally proposed.

**Design implication:** Users accessing Contexter on mobile are already cognitively taxed by the phone's presence itself. Interface must minimize additional cognitive demands.

Sources:
- [Brain Drain study (Journal)](https://www.journals.uchicago.edu/doi/full/10.1086/691462)
- [Meta-analysis (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10525686/)
- [Amra & Elma: Attention Span Statistics 2026](https://www.amraandelma.com/user-attention-span-statistics/)

### Small Screens = Lower Cognitive Load (Counterintuitive)

**Study:** Alasmari (2021) — "The Effect of Screen Size on Students' Cognitive Load in Mobile Learning" (JETL — Journal of Education, Teaching and Learning).

**Sample:** 1,570 students, University of Jeddah, 8 online courses.

**Finding:** Small screen display size produced the lowest cognitive load compared to larger displays. The researchers suggest that smaller screens naturally constrain information, forcing a focused presentation that reduces overload.

**Implication for Contexter:** Mobile's constraint is actually an advantage — forced simplicity and progressive disclosure naturally reduce cognitive burden. Do not try to replicate desktop density on mobile.

Sources:
- [JETL: Effect of Screen Size on Cognitive Load](https://journal.stkipsingkawang.ac.id/index.php/JETL/article/view/2203/0)

---

## 3. Mental Model: From Thought to Value

### Google Micro-Moments Framework

**Source:** Google "Micro-Moments: Your Guide to Winning the Shift to Mobile" (Think with Google).

Four types:
1. **I-want-to-know** — exploring, researching (not yet ready to buy)
2. **I-want-to-go** — looking for a local business or place
3. **I-want-to-do** — need help completing a task or trying something new
4. **I-want-to-buy** — ready to make a purchase, need help deciding what/how

**Key stat:** Users experience approximately **150 micro-moments per day** across ~4.7 hours of daily smartphone use.

**For Contexter:** The dominant micro-moment is **I-want-to-know**. User has a question about their knowledge base, wants an answer immediately. The phone is a reflex device: question arises -> phone unlocked -> query typed -> answer expected within seconds.

Sources:
- [Google Micro-Moments PDF](https://think.storage.googleapis.com/images/micromoments-guide-to-winning-shift-to-mobile-download.pdf)
- [Think with Google: Micro-Moments](https://www.thinkwithgoogle.com/marketing-strategies/micro-moments/)

### "One Eyeball, One Thumb" (Luke Wroblewski)

**Concept:** Mobile users operate with "one eyeball and one thumb" — one hand holding/operating the device, partial attention divided between phone and environment.

**Polar app test:** Luke W. set a design target of completing the core task (creating a photo poll) in under 60 seconds using only one thumb. After initial learning, users achieved ~30 seconds.

**Key quote (Dan Formosa, via Luke W.):** "What we need to do to design is to look at the extremes. The middle will take care of itself."

**Stats:**
- People check phones **150 times/day** (Luke W. data)
- 39% of smartphone users admit to bathroom usage
- Most sessions last only a few minutes

**Design principle:** If users can complete a task efficiently under constrained conditions (one thumb, partial attention, distraction), they'll perform even better with full focus.

Sources:
- [LukeW: Testing One Thumb, One Eyeball](https://www.lukew.com/ff/entry.asp?1664)
- [IxDF: One Thumb One Eyeball Test](https://www.interaction-design.org/literature/article/using-mobile-apps-the-one-thumb-one-eyeball-test-for-good-mobile-design)

### Phone as Reflex Device

Mobile usage patterns show:
- Average daily phone usage: **4h 37m** globally (5h 16m online via smartphone, Q3 2025)
- Phone checks: **58 times/day** average (up to 150 in some studies)
- Phone touches: **2,617 times/day** average (US)
- **90%+ of time in apps** vs. browsers (US adults: 3h 45m apps vs. 18 min browser)
- **62.73%** of global web traffic is mobile (Q2 2025)

**For Contexter:** Mobile use is overwhelmingly app-based and characterized by brief, intent-driven sessions. A web-based RAG tool on mobile competes with this app-first behavior. Must feel app-like: instant load, minimal chrome, task-focused.

Sources:
- [DemandSage: Smartphone Usage Statistics 2026](https://www.demandsage.com/smartphone-usage-statistics/)
- [Backlinko: Smartphone Usage Statistics](https://backlinko.com/smartphone-usage-statistics)

---

## 4. User Expectations (What's "Obvious")

### Speed Expectations

| Threshold | Impact | Source |
|---|---|---|
| 1 second delay | **-7% conversions**, -11% page views, -16% satisfaction | Aberdeen Group |
| 0.1 second improvement | **+8.4% retail conversions**, +9.2% AOV | Deloitte "Milliseconds Make Millions" (2020) |
| 0.1 second improvement (travel) | **+10.1% conversions** | Same Deloitte study |
| 3 second load time | **53% of mobile visitors leave** | Google "Need for Mobile Speed" |
| 1→3 second load | Bounce probability increases **32%** | Google |
| 1→5 second load | Bounce probability increases **90%** | Google |
| 1 second faster | **+27% mobile conversions** | Google |

**Deloitte methodology:** 37 brands across retail, travel, luxury, lead gen — US + Europe, 4-week measurement period.

Sources:
- [Deloitte: Milliseconds Make Millions](https://www.deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html)
- [Google: 53% abandon after 3 seconds](https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/426070/)

### Hardwired Gesture Expectations

Users have muscle-memory for these gestures — violating them creates confusion and frustration:

| Gesture | Expected behavior | Platform |
|---|---|---|
| Swipe from left edge | Navigate back | iOS (universal since iOS 7), increasingly Android |
| Pull down at top | Refresh content | Both platforms |
| Swipe left on list item | Delete/archive action | Both platforms |
| Pinch | Zoom in/out | Both platforms |
| Long press | Context menu / selection mode | Both platforms |
| Swipe up from bottom | Home / app switcher | Both platforms (gesture nav) |

**Key insight:** "Gestures that fight against muscle memory create confusion. When an app hijacks established patterns for different actions, users get confused and frustrated."

**iOS swipe-back is particularly critical:** It's been part of iOS since version 7, and users are deeply conditioned to expect it. Any mobile interface that blocks this gesture breaks fundamental navigation expectations.

Sources:
- [Smashing Magazine: In-App Gestures](https://www.smashingmagazine.com/2016/10/in-app-gestures-and-mobile-app-user-experience/)
- [NNGroup: iPhone X Gestures](https://www.nngroup.com/articles/iphone-x/)

### Loading Indicators

**Skeleton screens vs. spinners:**

| Indicator | Best for | Research finding |
|---|---|---|
| Skeleton screens | Content-heavy interfaces (feeds, dashboards, search results) | Perceived as faster, higher satisfaction (ECCE'18 study) |
| Spinners | Short, clear actions (saving, authenticating, payments) | Best for 2–10 second waits; clear that system is working |
| Progress bars | Long operations with known duration | Gives time estimate, reduces uncertainty |

**ECCE'18 study (2018):** Skeleton screens scored higher on both perceived speed and ease of navigation. However, one study (Viget, 2017) found skeleton screens performed worst for perceived duration — the research is not entirely unanimous.

**For Contexter:** RAG queries have variable latency. Use skeleton screens for result display (content-heavy) but consider a subtle progress indicator during the actual query/retrieval phase.

Sources:
- [NNGroup: Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [ResearchGate: ECCE'18 Skeleton Screen Study](https://www.researchgate.net/publication/326858669)

### Haptic Feedback

- Optimal haptic latency: **<10ms** for brain to pair touch with visual feedback
- Confirmation haptics should be "decisive, short" — never ambiguous or buzzy
- Study: 30ms latency haptic vs. 200ms — significant difference in perceived responsiveness

Sources:
- [Saropa: 2025 Guide to Haptics](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)

---

## 5. Touch Interaction Specifics

### Touch Target Sizes

| Standard | Minimum size | Physical size | Source |
|---|---|---|---|
| Apple HIG | 44x44 points | ~7.7mm | Apple Human Interface Guidelines |
| Google Material | 48x48 dp | ~9mm | Material Design 3 |
| WCAG 2.1 AA | 44x44 CSS px | ~7.7mm | W3C |
| NNGroup recommendation | 1cm x 1cm | 10mm | Based on Parhi, Karlson & Bederson (2006) |

**MIT Touch Lab finger dimensions:**
- Average fingertip width: 1.6–2.0 cm (0.6–0.8 inches)
- Average thumb impact area: 2.5 cm (1 inch) wide

**Spacing:** Minimum 8dp gap between interactive elements (Google Material). Well-spaced 44pt button performs better than 48pt button with no surrounding space. Spacing is as critical as target size itself.

**View-tap asymmetry problem:** Elements visible enough to read but too small to accurately select — common when porting desktop designs to touch.

**Larger targets needed for:**
- Primary CTAs
- Use during movement (walking)
- Young children, seniors
- Large public touchscreens

Sources:
- [NNGroup: Touch Target Size](https://www.nngroup.com/articles/touch-target-size/)
- [LogRocket: All Accessible Touch Target Sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)

### Touch Keyboard Impact (Baymard Institute)

| Orientation | Keyboard coverage |
|---|---|
| Portrait | ~50% of screen |
| Landscape | 70–80% of screen |

**Impact:** Users get "lost in the page" during form filling — extreme lack of page overview. Severe usability implications for any input-heavy interaction.

**Keyboard optimization failures:** Of top 50 mobile e-commerce sites:
- **60% fail** 2 of 5 keyboard optimizations
- **79%** neglect auto-correction settings
- **27%** neglect auto-capitalization settings

**For Contexter:** The search/query input is the core interaction. When keyboard is open, only 50% of screen is visible. The query input and any immediate feedback/suggestions must live in that top 50%.

Sources:
- [Baymard: Mobile Touch Keyboards](https://baymard.com/blog/mobile-touch-keyboards)
- [Baymard: Touch Keyboard Types Cheat Sheet](https://baymard.com/labs/touch-keyboard-types)

### Gesture Conflicts

**The problem:** Vertical drag gestures (e.g., drag to reorder, pull to expand) conflict with scroll behavior. The scroll view's pan gesture recognizer and custom drag gestures compete.

**Solutions:**
- Set minimum dragging distance on custom gestures (scroll always wins first)
- Use long-press to activate drag mode (so pan doesn't block scroll)
- Ensure horizontal swipe zones don't overlap vertical scroll areas

**For Contexter:** If implementing swipeable cards, bottom sheets, or drag interactions — must carefully manage gesture priority to avoid breaking scroll.

Sources:
- [Android Developers: Gesture Navigation Conflicts](https://medium.com/androiddevelopers/gesture-navigation-handling-gesture-conflicts-8ee9c2665c69)

---

## 6. Mobile Content Patterns

### Progressive Disclosure (NNGroup)

**Core principle:** "Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request."

**Rules:**
- Correct split between initial and secondary features (task analysis + analytics)
- Clear progression mechanics with strong information scent
- Max 2 disclosure levels — beyond 2, users get lost
- "Deferring secondary material is a key guideline for mobile design"

**Implementation patterns for mobile:**
- Bottom sheets (contextual info without leaving page)
- Accordions (overview + drill-down)
- Modal windows (focused task)
- Expandable cards

Sources:
- [NNGroup: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)

### Bottom Sheets (NNGroup, Jan 2024)

**Definition:** Overlay anchored to bottom edge, displays additional details or actions.

**When to use:**
- Temporary contextual information
- Quick-access options for brief interactions
- When user needs to reference underlying content while interacting with the sheet

**When NOT to use:**
- Always-needed information or core tools
- Replacing standard page navigation
- Lengthy content or complex interactions
- Stacking multiple sheets

**Critical guidelines:**
- Support back button/gesture dismissal
- Include visible Close/X button (accessibility)
- Never stack sheets
- Keep interactions brief — sheets are transient UI

**Reachability myth debunked:** "Contrary to common assumptions, bottom-screen placement doesn't reliably improve mobile reachability — the middle screen area is most easily tappable across varied grip positions."

Sources:
- [NNGroup: Bottom Sheets](https://www.nngroup.com/articles/bottom-sheet/)

### Tabs vs. Scrolling vs. Accordions

| Pattern | Best for | Weakness |
|---|---|---|
| **Tabs** | Chunking content into scannable pieces, reducing cognitive load | Taxes short-term memory when users need to compare across tabs |
| **Scrolling** | Linear content consumption | Attention drops sharply: 57% of viewing time above fold, 74% in first 2 screenfuls |
| **Accordions** | Dense content on mobile, overview + drill-down | Works better than tabs on mobile due to limited screen space |

**NNGroup scrolling data (desktop, applicable principle):**
- 57% of page-viewing time above the fold
- 74% in first two screenfuls
- >42% of viewing time in top 20% of page
- Sharp attention decrease after the fold

**Accordion advantages on mobile:**
- Provide page overview without scrolling
- Support lazy loading (performance)
- Allow direct access to content of interest
- 2025 trend: hybrid accordion-tab-card components

Sources:
- [NNGroup: Tabs Used Right](https://www.nngroup.com/articles/tabs-used-right/)
- [NNGroup: Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)

### Cards as Mobile-Native Container

Cards are the dominant mobile content pattern because they:
- Present scannable information chunks at a glance
- Reduce cognitive load through visual separation (whitespace between cards)
- Act as natural touch targets (tap to interact — no extra effort)
- Scale responsively across screen sizes
- Support gesture interactions (swipe to dismiss/archive)
- Group related content with clear visual hierarchy

Sources:
- [NNGroup: Cards Component](https://www.nngroup.com/articles/cards-component/)
- [The Next Web: Why Cards Dominate Mobile Design](https://thenextweb.com/news/why-cards-are-dominating-mobile-design)

### Typography

| Guideline | Value | Reason |
|---|---|---|
| Minimum body text | **16px** | Lower edge of comfortable readability at 25–35cm holding distance |
| iOS form input minimum | **16px** | Below 16px, Safari auto-zooms into input — breaks layout |
| Secondary text (captions, labels) | 13–14px | Still readable, clear hierarchy |
| WCAG compliance | Do NOT use `user-scalable=no` | Prevents zoom = accessibility violation (WCAG 1.4.4) |

Sources:
- [CSS-Tricks: 16px Prevents iOS Form Zoom](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)
- [LearnUI: Font Size Guidelines](https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html)

---

## 7. Implications for Contexter (RAG SaaS, Developer-Focused)

### The User's Mental Model

A developer or AI user opens Contexter on mobile because they have a **question right now** — they're reading documentation, debugging, in a meeting, or away from their desk. This is a pure **I-want-to-know** micro-moment.

The mental model: **unlock phone -> open Contexter -> type/paste question -> get answer -> close phone**. Total time budget: 30–60 seconds. One thumb, partial attention.

### Critical Mobile Design Requirements

**1. Query Input is King**
- Must be accessible in the natural thumb zone (bottom 33% of screen)
- When keyboard opens (covers 50% of screen), the input and any autocomplete/suggestions must remain visible
- Minimum 16px font size on input (prevents iOS zoom)
- Consider voice input as alternative to typing

**2. Speed is Non-Negotiable**
- First meaningful content must appear in <1 second
- Use skeleton screens for RAG results (content-heavy)
- Subtle progress indicator during retrieval phase
- 0.1s improvement = 8.4% more engagement (Deloitte)

**3. Progressive Disclosure for Results**
- Show answer summary first (the "one eyeball" content)
- Source citations as expandable cards or accordion
- Full document context behind tap/expand
- Max 2 levels of disclosure

**4. Leverage Mobile Constraints as Advantages**
- Smaller screen = lower cognitive load (JETL study)
- Forced simplicity improves comprehension
- One clear answer > wall of text
- Cards for source documents, accordion for metadata

**5. Respect Hardwired Gestures**
- Swipe-back must work (iOS convention)
- Pull-to-refresh for re-querying
- Don't hijack scroll for custom gestures
- Touch targets: minimum 44x44pt, 8dp spacing

**6. Design for Interruption**
- Save query state (user will leave mid-session)
- Allow resuming from where they left off
- Session duration: expect 72 seconds (NNGroup mobile average)
- Support copy-to-clipboard for answers (user will paste elsewhere)

**7. Bottom Sheet for Source Preview**
- Tap source citation -> bottom sheet with document preview
- User can reference answer while reading source
- Don't navigate away from results page
- Include close button + back gesture support

**8. Minimize Typing**
- Recent queries easily accessible
- Suggested queries based on knowledge base
- Copy-paste friendly input
- Voice input option

### Anti-Patterns to Avoid

- Desktop-density layouts shrunk to mobile
- Hamburger menus hiding core functionality
- Multiple navigation levels (tabs within tabs)
- Auto-playing content or animations
- Blocking scroll with custom gestures
- Stacking bottom sheets
- Inputs smaller than 16px
- Touch targets smaller than 44pt

---

## Key Researcher Quotes

> "Users change the way they're holding their phone very often — sometimes every few seconds."
> — Steven Hoober

> "What we need to do to design is to look at the extremes. The middle will take care of itself."
> — Dan Formosa (via Luke Wroblewski)

> "Initially, show users only a few of the most important options. Offer a larger set of specialized options upon request."
> — NNGroup (Progressive Disclosure)

> "A sheet is inherently a transient UI element — it is meant to support quick interactions."
> — NNGroup (Bottom Sheets)

> "The cognitive costs [of smartphone presence] are highest for those highest in smartphone dependence."
> — Ward et al. (Brain Drain study)

---

## Master Data Reference

| Data Point | Value | Source |
|---|---|---|
| One-handed grip | 49% | Hoober (1,333 obs) |
| Thumb-driven interactions | 75% | Josh Clark |
| Natural thumb zone (5" screen) | ~33% | Smashing Magazine |
| Natural zone (6.5"+ screen) | ~22% | Thumb zone optimization research |
| NNGroup screen attention | 43 seconds | NNGroup 2026, 67K sample |
| Gloria Mark screen attention | 47 seconds | UC Irvine, multi-year |
| MIT/Stanford attention span | 7.6 seconds | 45K participants, 13 years |
| Attention decline since 2000 | -36.7% | MIT/Stanford |
| Self-interruption rate | 49% | Gloria Mark |
| Daily micro-moments | 150 | Google |
| Phone checks per day | 58–150 | Multiple studies |
| Phone touches per day | 2,617 | US average |
| Daily phone usage | 4h 37m | Global average 2025 |
| Mobile session duration | 72 seconds | NNGroup |
| Desktop session duration | 150 seconds | NNGroup |
| Mobile web traffic share | 62.73% | Q2 2025 |
| 1-second delay conversion loss | -7% | Aberdeen Group |
| 0.1s improvement conversion gain | +8.4% | Deloitte |
| 3-second load abandonment | 53% | Google |
| Touch target minimum (Apple) | 44x44pt | Apple HIG |
| Touch target minimum (Google) | 48x48dp | Material Design |
| Touch target minimum (NNGroup) | 1cm x 1cm | Parhi et al. (2006) |
| Target spacing minimum | 8dp | Material Design |
| Fingertip width | 1.6–2.0cm | MIT Touch Lab |
| Thumb impact area | 2.5cm | MIT Touch Lab |
| Keyboard coverage (portrait) | ~50% | Baymard |
| Keyboard coverage (landscape) | 70–80% | Baymard |
| Keyboard optimization failure rate | 60% of top 50 sites | Baymard |
| Body text minimum | 16px | Multiple (iOS zoom threshold) |
| Viewing time above fold | 57% | NNGroup |
| Viewing time in first 2 screenfuls | 74% | NNGroup |
| Small screen cognitive load | Lowest | JETL (1,570 students) |
| Brain drain (working memory) | Significant impairment | Meta-analysis, k=56, n=7,093 |
| Haptic latency threshold | <10ms | Industry standard |
| Time in apps vs. browser | 90%+ in apps | US adults |
| Gesture nav error reduction | -41% corrections | Android Accessibility Lab 2023 |
