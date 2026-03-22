# Mobile Touch Interaction Patterns, Form UX & File Upload Research

> Research date: 2026-03-22
> Context: Contexter (RAG-as-a-service) — users upload files and query them on mobile
> Status: RESEARCH ONLY — no code, no design

---

## 1. Touch Targets & Spacing

### Platform Guidelines Comparison

| Standard | Minimum Size | Physical Size | Level |
|---|---|---|---|
| Apple HIG | 44 x 44 pt | ~7.7mm | Recommended |
| Google Material Design | 48 x 48 dp | ~9mm | Recommended |
| WCAG 2.5.8 (AA) | 24 x 24 CSS px | ~4.2mm | Mandatory (AA) |
| WCAG 2.5.5 (AAA) | 44 x 44 CSS px | ~7.7mm | Enhanced (AAA) |
| Microsoft (Fluent) | 40 x 40 px | ~7mm | Recommended |
| visionOS (Apple) | 60 pt (80px) | — | Recommended |

### Spacing Requirements

- Google Material Design: minimum **8dp gap** between interactive elements
- WCAG 2.5.8: if target < 24px, a 24px-diameter circle centered on its bounding box must **not intersect** another target's circle
- Best practice: **8-12px** spacing between touch targets reduces accidental taps

### Fitts's Law Applied to Mobile

- **Core principle:** Time to acquire target = f(distance / target_size). Larger targets + closer placement = faster + more accurate
- Touch input achieves throughput of **6.67 bits/s** with movement time as low as **0.5s** — highest of all input modalities when targets are sized correctly
- MIT Touch Lab: average fingertip width = **1.6-2cm (0.6-0.8in)**; average thumb impact area = **2.5cm (1in)**

### NNGroup Research Findings

- Minimum recommended: **1cm x 1cm (0.4in x 0.4in)** in physical, rendered size
- Parhi, Karlson and Bederson study: for quick + accurate selection, minimum **1cm x 1cm**
- Error rates **decline as target size increases**; performance plateaus at **20mm** for non-disabled users
- Elements smaller than 44pt are **missed or tapped incorrectly by >25% of users**, especially those with motor impairments

### WCAG 2.5.8 Exceptions (Level AA)

Target size < 24px is acceptable when:
1. **Spacing:** 24px-diameter circles centered on undersized targets don't intersect other targets
2. **Equivalent:** Another control achieving the same function meets the size requirement
3. **Inline:** Target is within a sentence/block of text (e.g., hyperlinks)
4. **User agent control:** Size determined by user agent, not author
5. **Essential:** Specific presentation is legally/functionally essential

---

## 2. Gesture Vocabulary — What Users Expect

### Standard Gesture Conventions

| Gesture | Expected Behavior | Platform Notes |
|---|---|---|
| Tap | Primary action (click equivalent) | Universal |
| Double tap | Zoom in / Like (Instagram) | Context-dependent |
| Long press (500ms+) | Context menu / secondary actions | iOS: peek/preview; Android: select mode |
| Swipe left/right | Delete, archive, actions | iOS Mail popularized; Android adopted |
| Swipe from left edge | Back navigation | iOS system gesture; Android: back gesture from either edge |
| Pull down | Refresh content | Universal (invented by Loren Brichter, 2008, Tweetie app) |
| Pinch in/out | Zoom out/in | Universal |
| Two-finger pan | Scroll/pan within zoomed content | Universal |
| Drag | Move elements, reorder | Slower, more controlled than swipe |
| Fling | Fast scroll, dismiss | Faster, no on-screen target |

### Platform-Specific Differences

**iOS:**
- Swipe from left edge = back navigation (system-level)
- 3D Touch / Haptic Touch for quick actions on home screen
- Swipe down from top-left = Notification Center
- Swipe down from top-right = Control Center (iPhone X+)
- Swipe up from bottom = Home / App Switcher

**Android:**
- Bottom edge swipe up = Home
- Bottom edge swipe up + hold = Recent apps
- Back gesture from either screen edge (Android 10+)
- Navigation bar alternative: 3-button (back, home, recents)

### When Custom Gestures FAIL

**The core problem: discoverability.** Gestures are invisible — users won't use what they can't see.

Key findings:
- "Every time you remove UI clutter, the app's learning curve goes up" (Smashing Magazine)
- Long press has **low discoverability** — users won't know it exists unless taught
- Custom gestures require **onboarding tutorials**, animations, or visual hints
- **Rule:** Any action available only via gesture should also be available via visible UI element
- Visual signifiers (subtle animations, drag handles, tooltip hints) are mandatory for non-standard gestures

### Gesture Anti-Patterns

1. **Gesture-only actions** with no visible alternative
2. **Conflicting gestures** (e.g., swipe-to-delete on a horizontally scrollable list)
3. **Overloading system gestures** (e.g., edge swipe that conflicts with OS back gesture)
4. **Complex multi-finger gestures** requiring learning (>2 fingers)
5. **Gestures without haptic/visual feedback** — users don't know if gesture was recognized

---

## 3. File Upload on Mobile — Alternatives to Drag-Drop

### Why Drag-and-Drop Fails on Mobile

- No hover state exists on touchscreens — drop zone indication impossible
- Finger obscures content while dragging
- Accidental drops are common due to imprecision
- Long press to "pick up" conflicts with other gestures
- **On narrow mobile screens:** "Move to" button pattern is better than drag

### Primary Upload Patterns (Ranked by Reliability)

| Pattern | Description | Mobile Support | Best For |
|---|---|---|---|
| **Button → Native File Picker** | Tap button, OS file picker opens | Universal | Primary upload method |
| **Camera Capture** | Direct camera access via `<input capture>` | iOS + Android | Photos, document scanning |
| **Share Sheet / Web Share Target API** | Share from other apps into your PWA | Android (full), iOS (limited) | Cross-app workflow |
| **Cloud Service Pickers** | Google Drive, Dropbox, iCloud integrations | Via SDKs/APIs | Enterprise users |
| **Clipboard Paste** | Paste images/files from clipboard | Modern browsers (Clipboard API) | Quick screenshots |
| **Voice Memo** | Record audio directly | Via MediaRecorder API | Audio content |
| **Drag-and-Drop** | Desktop only, fallback | Not on mobile | Desktop supplement |

### Button → Native File Picker (Primary)

- The **simplest and most reliable** pattern
- `<input type="file" accept=".pdf,.doc,.txt">` triggers OS file picker
- `multiple` attribute enables multi-file selection
- `accept` attribute filters visible file types
- Native picker handles permissions, storage access, cloud providers (iCloud, Google Drive appear in iOS/Android pickers natively)

### Camera Capture

- `<input type="file" capture="environment">` opens rear camera
- `<input type="file" capture="user">` opens front camera
- Critical for **document scanning** workflows in RAG products
- Users can photograph physical documents for upload

### Share Sheet Integration (Web Share Target API)

- PWA registers as share target in `manifest.json` via `share_target` member
- OS-level integration: app appears in native share sheet alongside email, messages
- **Requires PWA installation** (not available in browser tab)
- Receives files via POST with `multipart/form-data`
- Service worker handles file reception (Cache API or IndexedDB for temp storage)
- **Android:** Full support. **iOS Safari:** Limited support for Web Share Target

### Clipboard Paste

- Clipboard API: `navigator.clipboard.read()` for files/images
- Listen to `paste` event on document level
- Supported in all modern browsers since 2021 (Chrome 62+, Safari 13.1+)
- **Security requirement:** HTTPS + recent user interaction (transient activation)
- Great for screenshots, copied images from other apps

### Upload Progress & Background Upload

**Progress Indication:**
- Progress bars for deterministic processes (file upload %)
- Real-time percentage display is critical on small screens
- Chunked uploads enable accurate per-chunk progress

**Chunked Uploads:**
- Divide files into 500KB-5MB segments
- Sequential upload with per-chunk retry
- Partial recovery: if chunk 3 fails, retry only chunk 3
- Accurate progress: `chunks_completed / total_chunks`
- Resumable uploads: store upload state, resume from last successful chunk

**Background Uploads:**
- **iOS:** `URLSession` background sessions — continue if user switches apps or locks screen. **Stops** on force-close from app switcher
- **Android:** Native services continue even if app process terminates
- Both platforms: notification center progress indicators

### Contexter-Specific Implications

For a RAG product where users upload documents:
1. **Primary:** Large "Upload" button → native file picker (PDF, DOCX, TXT, MD)
2. **Secondary:** Camera capture for photographing physical documents
3. **Tertiary:** Share sheet (share PDFs from other apps directly to Contexter)
4. **Power user:** Clipboard paste for screenshots/copied content
5. **Must-have:** Chunked upload with resume for large files over mobile networks
6. **Must-have:** Upload progress indicator with percentage
7. **Nice-to-have:** Background upload notification

---

## 4. Form Input on Mobile

### Keyboard Impact on Screen Real Estate

| Orientation | Screen Lost to Keyboard | Available Content Area |
|---|---|---|
| Portrait | ~50% | ~50% |
| Landscape | ~70-80% | ~20-30% |

- This creates "extreme lack of page overview" (Baymard)
- Single-column layout + top-aligned labels = best practice
- Optimized forms achieve **34% higher completion rates**
- Forms exceeding 6 questions drop below **50% completion rate**

### Input Type Optimization

| Input Field | HTML `type` / `inputmode` | Keyboard Shown | Impact |
|---|---|---|---|
| Email | `type="email"` | @ symbol visible | Fewer typos |
| Phone | `type="tel"` | Numeric pad | 521% larger keys |
| URL | `type="url"` | . / / keys visible | Faster entry |
| Number | `inputmode="numeric"` | Numeric pad | Fewer errors |
| Search | `type="search"` | Search button on keyboard | Faster submit |
| Password | `type="password"` with `autocomplete="current-password"` | Standard + password manager | Autofill support |

### Baymard Institute Findings

- **54% of mobile sites** fail to utilize all relevant mobile-optimized keyboards
- Of top 50 mobile e-commerce sites, **60% fail 2 of 5** keyboard optimizations
- **79% neglect** auto-correction configuration
- **27% neglect** auto-capitalization configuration
- Purpose-built numeric keyboard keys are **521% larger** than standard keyboard keys (iPhone)
- Users **negatively comment** when proper keyboards aren't used
- Significantly **more typos** recorded without optimized keyboards

### `enterkeyhint` Attribute

Controls the label/icon on the Enter key of virtual keyboards:

| Value | Label | Use Case |
|---|---|---|
| `enter` | ↵ Enter | New line (textarea) |
| `done` | Done | Last field in form |
| `go` | Go | URL/search navigation |
| `next` | Next | Multi-field form, move to next |
| `previous` | Previous | Move to previous field |
| `search` | Search | Search input |
| `send` | Send | Chat/message input |

### iOS Zoom Prevention

- **Root cause:** Safari zooms into inputs with `font-size < 16px`
- **Fix:** Set `font-size: 16px` (or larger) on all `<input>`, `<select>`, `<textarea>` elements
- **Anti-pattern:** `maximum-scale=1` or `user-scalable=no` — blocks legitimate zoom, fails accessibility
- **Best practice:** Use 16px as base input font size — solves zoom + improves readability

### Form Validation on Mobile

**Inline validation (preferred):**
- Show error next to the field, not in a separate area
- Position error **above** input to avoid occlusion by keyboard, autofill, magnifying software
- Subtle animations (200-300ms) keep error visible without being intrusive
- Use `aria-live="assertive"` or `"polite"` for screen reader announcements

**Timing:**
- Validate on blur (when user leaves field), not on every keystroke
- Don't show errors while user is still typing
- Show success state (green check) after valid input on blur

**Autofill / Password Manager Support:**
- Use semantic `autocomplete` attributes: `name`, `email`, `tel`, `address-line1`, etc.
- iOS QuickType bar shows password autofill suggestions above keyboard
- Android inline autofill since Android 11 (suggestions in keyboard area)
- Passkey/WebAuthn: conditional UI shows passkey suggestions in autofill dropdown

### Contexter-Specific Implications

For a RAG query interface:
- **Query input:** Large textarea with `enterkeyhint="send"`, `font-size: 16px`
- **Search:** `type="search"` with `enterkeyhint="search"` for document search
- **Login/signup:** Proper `autocomplete` attributes for password manager support
- Keep forms minimal — the fewer fields, the higher completion rate

---

## 5. Loading & Feedback Patterns

### Skeleton Screens vs. Spinners

| Metric | Skeleton Screens | Spinners |
|---|---|---|
| Perceived speed | **20-30% faster** (same actual load time) | Baseline |
| User satisfaction | Higher | Lower |
| Abandonment rate | **Up to 30% lower** | Baseline |
| Waiting type | Active (user processes visual info) | Passive (user stares at animation) |
| Best for | Content loading (feeds, search results, dashboards) | Short system operations (<1s) |
| Psychological effect | Communicates progress | Communicates activity only |

**Key finding:** "A spinner provides no sense of advancement. Every second looks identical to the previous one. Users perceive the wait as longer than it actually is."

### When to Use Each

| Scenario | Pattern | Rationale |
|---|---|---|
| Document list loading | Skeleton screen | Content-heavy, deterministic layout |
| File upload | Progress bar (%) | Deterministic, user needs to know progress |
| RAG query processing | Skeleton + streaming | Show results as they arrive |
| Button action (delete, save) | Spinner (inline) | Brief, <1s operation |
| Background indexing | Toast notification on completion | Non-blocking, long-running |

### Haptic Feedback Timing

| Duration | Use Case |
|---|---|
| 10-15ms | Keyboard presses, list scrolling (micro-interaction) |
| 20-30ms | Button taps, selections (confirmation) |
| 50-100ms | Success confirmations, error alerts |

**Critical rule:** Haptic response must arrive within **10-20ms** of touch event. 100ms+ delay = perceived lag.

**Pattern design:** Two quick taps = success; Three short pulses with longer gaps = error.

**Accessibility:** Always provide Minimal/Off setting for users with touch sensitivity.

### Optimistic Updates

- Show result immediately, assuming server success
- **Rollback** on server failure — revert to stored previous state
- Show non-intrusive error (inline, not modal) on failure
- Essential for perceived speed in query-response interfaces

### Error States on Mobile

| Pattern | When to Use | Pros | Cons |
|---|---|---|---|
| **Inline** (next to element) | Field validation, row-level errors | Contextual, non-disruptive | Can be hidden by keyboard |
| **Toast/Snackbar** | Transient success/failure feedback | Non-blocking, auto-dismiss | Easy to miss, far from cause |
| **Banner** (top of screen) | Global/page-level errors | Visible, persistent | Takes screen space |
| **Modal/Dialog** | Critical errors requiring acknowledgment | Forces attention | Disruptive, overused |
| **Empty state** | No results, no content | Opportunity for guidance | Requires design investment |

**Best practice:** "The more we can connect an error with its cause, the less likely it is to be overlooked."

**Anti-pattern:** Toast messages for form errors — users miss them, and the message disappears before being read.

### Pull-to-Refresh

- Invented by Loren Brichter (2008) for Tweetie (Twitter client)
- Created in a **single afternoon** with no user testing — became universal pattern
- Brichter's motivation: toolbar space was "the most valuable real estate" — refresh button wasted it
- Now universal on iOS and Android for list/feed content
- Material Design: "Swipe to Refresh" pattern — indicator appears at top of content area

### Contexter-Specific Implications

- **Document list:** Skeleton screens while loading
- **File upload:** Progress bar with percentage + background upload notification
- **RAG query:** Streaming response with skeleton → progressive text reveal
- **Document processing pipeline:** Multi-step progress indicator (uploaded → parsing → chunking → embedding → ready)
- **Error on upload:** Inline error with retry button, not toast
- **Pull-to-refresh:** On document list to check for new/updated documents

---

## 6. Mobile-Specific UI Patterns

### Bottom Sheets

**What:** Dialog that slides up from bottom, fills horizontal space, three snap points (peek, half, full).

**Why they work:**
- Snap to bottom = **thumb-friendly** (natural reach zone)
- More space than centered dialogs (3 of 4 screen edges used)
- **25-30% higher engagement** than traditional modals
- Reduced cognitive load — feels like "page-in-page"
- Easy to dismiss (swipe down)

**Use cases for Contexter:**
- File upload options (choose source: file picker, camera, cloud)
- Document actions (share, delete, rename, move to collection)
- Query settings (model selection, temperature, context window)
- Filter/sort options for document list

### Action Sheets (iOS) / Bottom Dialogs (Android)

- List of actions triggered by long press or button tap
- Non-modal variant stays visible while main content is interactive
- Modal variant dims background, requires dismiss

### Floating Action Button (FAB)

- Material Design pattern for **single most important action** per screen
- Position: bottom-right (right-handed default)
- Material 3 Expressive (Google I/O 2025): **FAB Menu** — small menu panel opens from FAB for related actions (replaces old stacked secondary FABs)
- Snackbar must appear **above** FAB, not behind it

**For Contexter:**
- FAB = "New Query" or "Upload Document" (primary action per screen)
- FAB Menu = Upload options (file, camera, URL)

### Snackbar for Undo

- Brief message at bottom of screen
- Auto-dismisses after 4-10 seconds
- Optional action button ("Undo")
- Only one snackbar at a time
- Must not overlap FAB

**For Contexter:** "Document deleted" with "Undo" action

### Segmented Controls

- iOS: UISegmentedControl (toggle between 2-5 options)
- Android: Material Segmented Button
- Best for: switching views, filters, tabs
- **For Contexter:** Toggle between "My Documents" / "Shared" / "Recent"

### Search Bar Placement

- **Top of screen, sticky** = most common and expected pattern
- Pull-to-reveal search (iOS pattern): hidden search bar revealed by pulling down on list
- Auto-focus: consider NOT auto-focusing on mobile (triggers keyboard, loses 50% screen)
- **For Contexter:** Sticky search bar at top for querying documents; don't auto-focus

### Empty States

**Best practices:**
- Centered layout: headline + description + illustration + CTA button
- Actionable: let user do something (e.g., "Upload your first document" button)
- Tone: encouraging, not apologetic
- Modern trend: interactive empty states (upload directly from empty state screen)

**For Contexter:**
- "No documents yet" → prominent upload button + brief explanation
- "No results for your query" → suggest rephrasing + show related documents
- "Processing..." → show pipeline progress

### Thumb Zone Design

**Steven Hoober's Research:**
- **49% of users** hold phone with one hand
- **75% of interactions** are thumb-driven (Clark's extension of Hoober)

**Reachability Zones:**
| Zone | Location | Usage |
|---|---|---|
| Green (Natural) | Bottom-center of screen | Primary actions, navigation |
| Yellow (Stretch) | Top-center, sides | Secondary actions |
| Red (Hard-to-reach) | Top corners | Infrequent actions only |

**Design implications:**
- Place primary actions (upload, query, send) in bottom half of screen
- Bottom navigation bar > top navigation bar for key actions
- FAB position (bottom-right) is thumb-reachable for right-handed users
- Critical: top-left hamburger menu is in the **hardest-to-reach** zone

---

## 7. Accessibility on Mobile

### Screen Reader Compatibility

**VoiceOver (iOS):**
- Reads all on-screen elements aloud
- Swipe right/left to navigate between elements
- Double-tap to activate
- Rotor gesture for navigation mode (headings, links, form fields)

**TalkBack (Android):**
- Spoken feedback + vibration cues
- Swipe right/left for linear navigation
- Double-tap to activate
- Read from top gesture for full page reading

**Implementation requirements:**
- All interactive elements must have `aria-label` or visible text
- Logical reading order = DOM order (not CSS visual order)
- Live regions (`aria-live`) for dynamic content updates
- Focus management: move focus to new content (e.g., after file upload completes)
- Headings hierarchy for navigation (h1 → h2 → h3)

### Dynamic Type / Font Scaling

- **iOS:** Dynamic Type — system-wide font size preference
- **Android:** Font scaling via accessibility settings (sp units)
- Implementation: use relative units (`rem`, `em`, `sp`) — never fixed `px` for text
- Layouts must reflow without truncation when font size increases
- Test at 200% font scale minimum

### Reduced Motion Preferences

- CSS: `@media (prefers-reduced-motion: reduce)` — disable/simplify animations
- iOS: Settings → Accessibility → Motion → Reduce Motion
- Android: Settings → Accessibility → Remove animations
- **Must respect:** skeleton screen pulse, page transitions, loading animations
- Provide static alternatives: progress text instead of animated progress bar

### Color Contrast Requirements

| Standard | Ratio | Applies To |
|---|---|---|
| WCAG AA (normal text) | 4.5:1 | Body text, labels, placeholders |
| WCAG AA (large text, 18px+) | 3:1 | Headings, large UI text |
| WCAG AAA (normal text) | 7:1 | Enhanced contrast |
| WCAG AA (non-text UI) | 3:1 | Icons, borders, focus indicators |

**Outdoor/bright screen considerations:**
- Mobile devices used outdoors where **glare impacts visibility**
- Target **higher than minimum** contrast ratios for mobile
- Test with increased brightness setting
- Consider high-contrast mode support

### One-Handed Mode / Reachability

- iOS: Reachability (swipe down on bottom edge) — shifts entire screen down
- Android: One-handed mode (shrinks display to bottom)
- Design implication: don't place sole critical actions in top corners
- **75% of smartphone interactions** are one-handed (thumb-driven)

### Touch Target Accessibility Summary

| Requirement | Size | Level |
|---|---|---|
| Apple HIG | 44 x 44 pt | Recommended |
| Material Design | 48 x 48 dp | Recommended |
| WCAG 2.5.8 (Minimum) | 24 x 24 CSS px | AA (mandatory) |
| WCAG 2.5.5 (Enhanced) | 44 x 44 CSS px | AAA |
| NNGroup recommendation | 1cm x 1cm (physical) | Research-backed |
| MIT Touch Lab (fingertip) | 1.6-2cm wide | Physical constraint |

---

## Consolidated Best Practices Checklist

### Touch & Layout
- [ ] All touch targets >= 44x44pt (Apple) or 48x48dp (Android)
- [ ] Minimum 8dp spacing between interactive elements
- [ ] Primary actions in thumb-reachable zone (bottom half of screen)
- [ ] Bottom navigation for key app sections
- [ ] No critical actions in top corners (red zone)

### File Upload (Contexter-specific)
- [ ] Primary: large "Upload" button → native file picker
- [ ] Accept attribute filters to relevant file types (PDF, DOCX, TXT, MD)
- [ ] Multi-file selection support
- [ ] Camera capture option for document scanning
- [ ] Share sheet integration (Web Share Target API for PWA)
- [ ] Clipboard paste support for images/screenshots
- [ ] Chunked upload with resume for large files
- [ ] Upload progress bar with percentage
- [ ] Background upload with notification on completion
- [ ] Clear error messaging with retry on upload failure

### Forms & Input
- [ ] Font-size >= 16px on all inputs (prevents iOS zoom)
- [ ] Correct `type` / `inputmode` for each field
- [ ] `enterkeyhint` set appropriately (search, send, next, done)
- [ ] `autocomplete` attributes for password manager support
- [ ] Single-column layout, top-aligned labels
- [ ] Inline validation on blur, errors positioned above input
- [ ] Minimal fields — every removed field increases completion rate

### Loading & Feedback
- [ ] Skeleton screens for content loading (not spinners)
- [ ] Progress bars for file upload (deterministic)
- [ ] Streaming response display for RAG queries
- [ ] Haptic feedback within 10-20ms of touch event
- [ ] Optimistic updates for instant-feel interactions
- [ ] Toast/snackbar for transient success feedback
- [ ] Inline errors for form validation (not toast)
- [ ] Pull-to-refresh on document lists

### Mobile UI Patterns
- [ ] Bottom sheets for progressive disclosure (upload options, settings)
- [ ] FAB for primary screen action (Upload or Query)
- [ ] Snackbar with Undo for destructive actions
- [ ] Actionable empty states with CTA
- [ ] Sticky search bar at top (don't auto-focus on mobile)

### Accessibility
- [ ] All elements labeled for VoiceOver/TalkBack
- [ ] Logical DOM order = visual order
- [ ] Dynamic Type / font scaling support (relative units)
- [ ] `prefers-reduced-motion` respected
- [ ] Color contrast >= 4.5:1 for body text, 3:1 for large text/UI
- [ ] Test at 200% font scale
- [ ] Test in bright/outdoor conditions
- [ ] One-handed usability verified

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It Fails | Alternative |
|---|---|---|
| Drag-and-drop as primary upload on mobile | No hover state, finger obscures content | Button → native file picker |
| Auto-focus search on mobile | Keyboard takes 50% screen on load | Tap-to-focus, visible search bar |
| Toast for form errors | Users miss them, disappears before read | Inline error next to field |
| Spinner for content loading | Perceived as 20-30% slower | Skeleton screen |
| Custom gestures without visual hints | Users never discover them | Visual affordances + onboarding |
| Font-size < 16px on inputs | iOS auto-zooms, disorienting | Use 16px minimum |
| `user-scalable=no` viewport | Blocks accessibility zoom | Fix font sizes instead |
| Hamburger menu in top-left corner | Hardest-to-reach zone on mobile | Bottom navigation or bottom sheet |
| Modal dialogs for all errors | Disruptive, breaks flow | Inline for minor, modal only for critical |
| Gesture-only actions | Low discoverability, high learning curve | Gesture + visible button alternative |
| Landscape keyboard (full-screen) | 70-80% screen loss | Design for portrait primary |
| Monolithic file upload (no chunking) | Fails on mobile networks, no resume | Chunked upload with resume |

---

## Sources

### Touch Targets & Spacing
- [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Google Material Design — Touch Target Size](https://support.google.com/accessibility/android/answer/7101858?hl=en)
- [Material Design 2 — Touch Target](https://m2.material.io/develop/web/supporting/touch-target)
- [Material Design 3 — Accessibility Designing](https://m3.material.io/foundations/designing/structure)
- [WCAG 2.5.8 — Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.5.5 — Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
- [NNGroup — Touch Targets on Touchscreens](https://www.nngroup.com/articles/touch-target-size/)
- [NNGroup — Fitts's Law and Its Applications in UX](https://www.nngroup.com/articles/fitts-law/)
- [W3C — Summary of Research on Touch/Pointer Target Size](https://www.w3.org/WAI/GL/mobile-a11y-tf/wiki/Summary_of_Research_on_Touch/Pointer_Target_Size)
- [LogRocket — All Accessible Touch Target Sizes](https://blog.logrocket.com/ux-design/all-accessible-touch-target-sizes/)
- [AllAccessible — WCAG 2.5.8 Implementation Guide](https://www.allaccessible.org/blog/wcag-258-target-size-minimum-implementation-guide)
- [Smashing Magazine — Finger-Friendly Design](https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/)

### Gesture Vocabulary
- [Smashing Magazine — In-App Gestures and Mobile App User Experience](https://www.smashingmagazine.com/2016/10/in-app-gestures-and-mobile-app-user-experience/)
- [NNGroup — iPhone X: The Rise of Gestures](https://www.nngroup.com/articles/iphone-x/)
- [Elaris Software — Mobile UX Thumb Zones 2025](https://elaris.software/blog/mobile-ux-thumb-zones-2025/)
- [Sidekick Interactive — Gesture Navigation Best Practices](https://www.sidekickinteractive.com/designing-your-app/gesture-navigation-in-mobile-apps-best-practices/)
- [Material Design — Gestures Patterns](https://m1.material.io/patterns/gestures.html)
- [Codebridge — Impact of Gestures on Mobile UX](https://www.codebridge.tech/articles/the-impact-of-gestures-on-mobile-user-experience)
- [CreateWithSwift — Pitfalls of Gestural Interfaces](https://www.createwithswift.com/navigating-pitfalls-the-dos-and-donts-of-gestural-interfaces/)
- [IxDF — Gesture-Based Interaction](https://ixdf.org/literature/topics/gesture-interaction)

### File Upload
- [Uploadcare — File Uploader UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Mobbin — Drop Zone / File Uploader](https://mobbin.com/glossary/drop-zone-file-uploader)
- [Eleken — File Upload UI Tips](https://www.eleken.co/blog-posts/file-upload-ui)
- [Smart Interface Design Patterns — Drag-and-Drop UX](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [LogRocket — Designing Drag and Drop UIs](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [FileStack — High-Performance Smartphone File Upload](https://blog.filestack.com/developing-high-performance-smartphone-file-upload-app/)
- [DevsTrEe — Reliable Large-File Uploads Using Chunking](https://www.devstree.com/improve-mobile-apps-file-uploads-chunking-methods/)
- [Chrome Developers — Web Share Target API](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- [MDN — share_target Manifest Member](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target)
- [web.dev — Paste Files](https://web.dev/patterns/clipboard/paste-files)
- [MDN — Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)

### Form Input
- [Baymard — Touch Keyboard Types Cheat Sheet](https://baymard.com/labs/touch-keyboard-types)
- [Baymard — Touch Keyboard Implementations](https://baymard.com/blog/mobile-touch-keyboards)
- [Baymard — Mobile Form Usability: Single Input Fields](https://baymard.com/blog/mobile-form-usability-single-input-fields)
- [Baymard — Mobile UX Trends 2025](https://baymard.com/blog/mobile-ux-ecommerce)
- [CSS-Tricks — 16px or Larger Text Prevents iOS Form Zoom](https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/)
- [MDN — enterkeyhint Global Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/enterkeyhint)
- [CSS-Tricks — enterkeyhint](https://css-tricks.com/enterkeyhint/)
- [UXPin — Error Feedback Best Practices Mobile Forms](https://www.uxpin.com/studio/blog/error-feedback-best-practices-mobile-forms/)
- [MobileSpoon — 10 Usability Rules for Keyboard in Mobile Apps](https://www.mobilespoon.net/2018/12/10-usability-rules-keyboard-mobile-app.html)

### Loading & Feedback
- [NNGroup — Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [NNGroup — Skeleton Screens vs. Progress Bars vs. Spinners](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)
- [LogRocket — Skeleton Loading Screen Design](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [Onething Design — Skeleton Screens vs Loading Spinners](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [ResearchGate — Effect of Skeleton Screens on Perceived Speed](https://www.researchgate.net/publication/326858669_The_effect_of_skeleton_screens_Users'_perception_of_speed_and_ease_of_navigation)
- [Saropa — 2025 Guide to Haptics](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774)
- [Android Developers — Haptics Design Principles](https://developer.android.com/develop/ui/views/haptics/haptics-principles)
- [Smashing Magazine — Designing Better Error Messages UX](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/)
- [Smashing Magazine — How To Design Error States For Mobile Apps](https://www.smashingmagazine.com/2016/09/how-to-design-error-states-for-mobile-apps/)
- [NNGroup — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)

### Mobile UI Patterns
- [NNGroup — Bottom Sheets: Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- [LogRocket — How to Design Bottom Sheets](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [Material Design 3 — FAB](https://m3.material.io/components/floating-action-button/overview)
- [Material Design 2 — Snackbars](https://m2.material.io/design/components/snackbars.html)
- [NNGroup — Designing Empty States in Complex Applications](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Smashing Magazine — The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/)
- [Addy Osmani — Modern Touch-Friendly Design](https://addyosmani.com/blog/touch-friendly-design/)
- [Wikipedia — Pull-to-refresh](https://en.wikipedia.org/wiki/Pull-to-refresh)

### Accessibility
- [A11Y Pros — Mobile Accessibility Testing Checklist 2025](https://a11ypros.com/blog/mobile-accessibility-testing-checklist-2025-edition)
- [Deque — Guide for Mobile Text Scaling](https://docs.deque.com/devtools-mobile/2025.7.2/en/text-scaling/)
- [W3C — Mobile Accessibility Mapping](https://www.w3.org/TR/mobile-accessibility-mapping/)
- [web.dev — Accessible Motion](https://web.dev/learn/accessibility/motion)
- [ACM Queue — Accessibility Considerations for Mobile Applications](https://queue.acm.org/detail.cfm?id=3704628)
- [IBM Design — Accessible Motion](https://medium.com/design-ibm/accessible-motion-why-its-essential-and-how-to-do-it-right-ff38afcbc7a9)
