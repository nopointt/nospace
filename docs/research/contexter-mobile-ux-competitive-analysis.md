# Contexter Mobile UX — Competitive Analysis

> Date: 2026-03-22
> Scope: How 8 SaaS products handle mobile/tablet design
> Purpose: Inform Contexter's responsive/mobile design decisions

---

## 1. Product-by-Product Analysis

### 1.1 Notion (Mobile App)

**Navigation pattern:** Hamburger sidebar + bottom action bar. The home tab shows workspace tree (teamspaces, pages). Bottom bar has 3 quick-access buttons: Search, Inbox, Create New Page. Sidebar slides in from left with full page hierarchy. Workspace switcher at top of sidebar.

**Primary actions on mobile:**
- Browse/read pages and databases
- Create new pages (bottom bar shortcut)
- Quick search across workspace
- Inbox notifications
- Toggle nested pages
- Basic text editing
- Database views (list, table — collapsed to single column)

**Missing on mobile:**
- No column layouts (desktop columns collapse to single column)
- No multi-block selection
- No data import
- No account/workspace settings changes
- No workspace deletion
- Very limited offline (pre-opened pages only, text-only edits)
- No database creation offline

**Upload/file handling:** Basic file attachment within pages. No dedicated file management view.

**Search/query UX:** Tap magnifying glass in bottom bar. Opens search overlay with recent pages + text search across workspace.

**Content density:** Clean, minimalist, distraction-free. However, on mobile it collapses complex layouts aggressively — databases become simplified, columns flatten. Performance issues reported (lag, slow load, typing glitches — especially Android).

**Key user complaints:**
- Mobile app described as "average-at-best" and a "major letdown"
- Offline access is a deal-breaker for many users
- Copy-paste glitching
- Less intuitive than desktop
- Performance issues especially on Android

**Breakpoints:** Adaptive grid that resizes without breaking functionality. Standard mobile/tablet/desktop tiers.

---

### 1.2 Linear (Mobile App)

**Navigation pattern:** Bottom toolbar (customizable) + top "Create Issue" button on every screen. Rebuilt navigation in Oct 2025 redesign. Users can rearrange bottom toolbar items, pin specific projects/initiatives/documents. Tab bar expands to sidebar on iPad. Custom frosted glass visual design system.

**Primary actions on mobile:**
- Review assigned/created/subscribed issues ("My Issues")
- Create issues with rich formatting (code blocks, quotes, media)
- Triage notifications with Inbox
- Comment on issues, update status
- Manage favorites
- Toggle todo checkboxes in descriptions
- Delegate issues to agents
- Semantic search (hybrid keyword + semantic)
- Create/edit project title and summary

**Missing on mobile:**
- No offline support (critical gap — commute use case broken)
- Board view and advanced settings likely desktop-only
- Deep editing of Project boards requires desktop
- Advanced integrations configuration desktop-only
- Full workflow customization desktop-only

**Search/query UX:** Hybrid semantic search engine that goes beyond keyword matching. Available directly from bottom toolbar.

**Content density:** High information density but clean. Tight transitions, focused interactions. Linear design philosophy = "be direct, offer minimal choices."

**Notification flow:** Push notifications for mentions, assignments, review requests. Triage in Inbox with swipe actions. Deep links from notification straight to issue. Bottom toolbar provides quick access to Inbox.

**Breakpoints:** Phone bottom toolbar, iPad sidebar expansion. Responsive layouts.

---

### 1.3 ChatGPT (Mobile App) — PRIMARY COMPETITOR FOR RAG UX

**Navigation pattern:** Left sidebar (swipe or hamburger) for conversation list + Projects. Chat interface dominates. Composer always present at bottom. Sidebar has pinned chats, project folders, search.

**Primary actions on mobile:**
- Start new conversation
- Continue existing conversations (sync across devices)
- Voice conversation (inline in chat thread, not separate mode)
- Upload images (camera, gallery), files (PDFs, docs)
- Projects: view project workspaces (full creation on web/Windows only)
- Pin chats for quick access (long-press)
- Switch between Auto/Fast/Thinking modes
- Copilot integration

**Missing on mobile:**
- Projects: can view but full creation/management is web/Windows only
- Advanced file management limited
- Custom GPT creation desktop-only
- Some enterprise features

**Upload/file handling:** Paperclip icon in composer. Supports PDF, docs, images, spreadsheets. Up to 80 files per 3 hours, 10GB per user. Files become chat context for extraction/reasoning.

**Search/query UX:** Composer always visible at bottom. Large microphone and image buttons. Touch-optimized. Voice input now works inline (no separate voice-only mode). Real-time transcription. Can reference all past conversations.

**Content density:** Medium — conversation thread format. Long answers create scrolling issues (autoscroll gets stuck, hard to pause midway on mobile). Markdown rendering with formatting but spacing can be inconsistent. Generative UI emerging (interactive cards instead of text walls).

**Source citations:** Numbered footnotes linked to open-access sources. Moderate transparency — sometimes links, sometimes mentions without linking, sometimes blends web + training data without clear delineation. Not as prominent as Perplexity.

**Voice UX:** Best-in-class. Voice conversations happen directly inside ongoing chat. Responses appear as text + visuals in real-time. Transcriptions saved in history. Six voice options. Can switch between voice and text freely. Screen sharing supported.

**Key UX issues:**
- Autoscroll problems — gets stuck after answer generation
- Extensive scrolling in long conversations is frustrating
- Limited screen real estate makes scrolling more intrusive
- Spacing/formatting inconsistencies between platforms

**Breakpoints:** Standard responsive. Sidebar hidden by default on mobile, swipe to reveal.

---

### 1.4 Perplexity (Mobile App) — RAG-SPECIFIC COMPETITOR

**Navigation pattern:** Minimal bottom interface. Three primary modes visible: Ask, Pro Search, Voice. Library accessible from menu. Collections for organizing research.

**Primary actions on mobile:**
- Search/ask questions with inline citations
- Pro Search (deeper research)
- Deep Research (long-form analysis)
- Voice search (tap-and-hold microphone)
- Thread follow-ups (conversational refinement)
- Save to Collections
- Share answers
- Switch Focus Modes (adjusts how AI prioritizes sources)

**Missing on mobile:**
- Labs access (experimental models, ultra-long context agents)
- Deep Research results in compact scroll vs desktop's side-by-side panes
- Enterprise features optimized for desktop
- Some advanced configurations

**Upload/file handling:** File uploads supported for analysis (PDFs, documents). Citation tracking on uploaded content.

**Search/query UX:** Central search bar. Tap-and-hold microphone for voice. Focus Mode selector. Suggested follow-up questions after answers. Can type "summarize sources" or "explain in simpler terms" to refine without restarting.

**Content density:** Information-rich but structured. Sources panel at top of response. Numbered inline citations throughout answer text. Follow-up suggestions below. Compact scroll format for Deep Research on mobile (vs side-by-side on desktop).

**Source citations — BEST IN CLASS:**
- Sources displayed at very top of each response
- Numbered inline footnotes throughout answer text
- Click citation number to expand snippet from original source
- Favicon + title metadata for scanning relevance
- Real-time: as voice answer plays, source links appear simultaneously on screen
- Citation-forward design philosophy — UI foregrounds sources as first-class citizens

**Voice UX:**
- Tap-and-hold microphone for voice input
- Interactive Voice Mode for follow-up conversations
- Six distinct voice options
- Real-time search results displayed while voice answer plays
- Clear, easy-to-understand spoken delivery

**Breakpoints:** Standard responsive. Narrowed scope = tailored UI for information seeking.

---

### 1.5 Vercel Dashboard (Mobile Web)

**Navigation pattern:** Floating bottom bar optimized for one-handed use. Resizable sidebar (hidden on mobile). Scope name only shown on mobile (saves space). New sidebar with consistent tabs across team/project levels.

**Primary actions on mobile:**
- View production deployment status
- View preview deployments
- Check build logs
- Monitor deployment screenshots
- Switch between projects (project as filter)
- View CI/CD status in browser tab icon
- Navigate between team and project pages

**Missing on mobile:** The dashboard aims for full parity on mobile web. Complex configuration (environment variables, domain settings, integration setup) likely better on desktop due to form complexity, though not explicitly restricted.

**Content density:** Deployment-focused. Prioritizes the two most important aspects: production deployment and preview deployments. Screenshots of latest production deployments for visual overview.

**Breakpoints:** Mobile shows only scope name (space-saving). Sidebar hidden on mobile, floating bottom bar replaces it.

---

### 1.6 Supabase Dashboard (Mobile Web)

**Navigation pattern:** Dual sidebar system — separate sidebars for Projects and Organizations. Organization picker in top header. Tabbed navigation within table views. "Responsive" but described as "just a first step toward a more complete mobile experience."

**Primary actions on mobile:**
- Browse database tables
- View/sort/filter data
- Navigate foreign key relationships (tap to explore)
- Switch between Organizations and Projects
- View user profiles, subscription statuses
- Basic table editing

**Missing on mobile:**
- SQL Editor poorly suited for mobile (Monaco editor, syntax highlighting, autocomplete — desktop-oriented)
- Table Editor performance issues (minutes to become usable)
- Complex foreign key management
- Advanced database operations
- Full RLS policy editing
- Basically: monitoring OK, management limited

**Content density:** Dense — database tables, SQL, API docs are inherently desktop content. Mobile forces simplification but Supabase hasn't fully optimized this.

**Breakpoints:** Standard responsive. Tables adapt to screen size with horizontal scrolling.

---

### 1.7 Google Drive / Dropbox (Mobile Apps)

**Navigation pattern (Google Drive):** Bottom tab bar (Home, Starred, Shared, Files) + FAB (Floating Action Button) with + icon. Camera FAB shortcut above main FAB. Testing: "Scan" as dedicated bottom tab. Grid/List view toggle in toolbar.

**Navigation pattern (Dropbox):** Bottom tab bar + tabbed file upload layout. Upload Details icon for progress tracking.

**Primary actions on mobile:**
- Browse files (grid or list view)
- Upload files (FAB + button, camera scan)
- Document scanning (camera shortcut)
- Search files (name, type, creation date)
- Sort and filter
- Preview files (docs, sheets, slides — opens in corresponding app)
- Share with permissions
- Offline access (cached/downloaded copies)
- Real-time sync

**Missing on mobile:**
- No drag-and-drop (button-based upload instead)
- Advanced sharing/permission management limited
- Folder structure management more cumbersome
- Batch operations limited

**Upload/file handling — KEY PATTERNS:**
- FAB (+ button) at bottom-right with multiple options: Folder, Upload, Scan, Google Docs/Sheets/Slides
- Camera shortcut FAB above main FAB for quick document scanning
- Upload progress via "Upload Details" icon (Dropbox)
- BUT: progress indicators reported as buggy/missing on Android (Dropbox)
- Immediate visual feedback expected but not always delivered

**Content density:** Medium. Grid view for visual browsing, list view for detailed info. Sorting options accessible from toolbar.

**Breakpoints:** Standard responsive. Grid adapts column count to screen width.

---

### 1.8 GitHub Mobile (App)

**Navigation pattern:** Bottom tab bar (Home, Notifications, Explore, Profile). Clean native mobile design. iOS 26 support with refined visuals. Home screen widgets for PR overview. Pinnable repositories.

**Primary actions on mobile:**
- Notifications triage (swipe actions, "Focused" filter)
- PR review and merge
- Issue management (label, assign, manage)
- Comment on issues/PRs
- Check CI status before merging
- Code review (Copilot AI-assisted code review)
- Light file editing (text, code, Markdown)
- Global code search
- Copilot Chat (free for all users)
- Coding Agent live notifications

**Missing on mobile:**
- Complex code editing (bulk edits, refactoring)
- Codespaces
- Project boards (advanced editing)
- Actions UI
- Advanced repo settings
- Re-request review (feature request pending)
- Complex configuration

**Content density:** Medium-high for a developer tool. Focused on actionable items (notifications, PRs, issues). Code diffs readable but not ideal for large reviews.

**Breakpoints:** Native app — adapts to device. Consistent with iOS/Android platform conventions.

---

## 2. Comparison Table

| Product | Nav Pattern | Primary Mobile Use | Desktop-Only | Upload | Search/Query | Content Density | Citation UX |
|---|---|---|---|---|---|---|---|
| **Notion** | Hamburger sidebar + bottom bar (3 icons) | Read pages, quick create, search | Columns, multi-select, import, settings | File attachments in pages | Bottom bar search icon | Minimal (collapses on mobile) | N/A |
| **Linear** | Customizable bottom toolbar + top create | Issue triage, create, inbox | Offline, board view, integrations config | Media in issues | Semantic hybrid search | High but clean | N/A |
| **ChatGPT** | Left sidebar + always-on composer | Conversation, voice, file upload | Project creation, custom GPTs | Paperclip in composer (images, docs, PDFs) | Always-visible composer + voice | Medium (scroll issues) | Numbered footnotes (moderate) |
| **Perplexity** | Minimal bottom (Ask/Pro/Voice) | Search with citations, voice | Labs, Deep Research side-by-side, enterprise | File upload for analysis | Central search bar + voice + Focus modes | Rich + structured | **Best: inline numbered + source panel** |
| **Vercel** | Floating bottom bar | Deployment monitoring, status | Complex config (env vars, domains) | N/A | N/A | Focused (deployment status) | N/A |
| **Supabase** | Dual sidebar (Org/Project) | Table browsing, data monitoring | SQL editor, complex DB ops, RLS | N/A | Table filtering | Dense (database tables) | N/A |
| **Google Drive** | Bottom tabs + FAB | File browse, upload, scan | Drag-drop, batch ops, advanced sharing | FAB + camera scan shortcut | File search with filters | Medium (grid/list toggle) | N/A |
| **GitHub** | Bottom tabs (Home/Notif/Explore/Profile) | PR triage, notifications, issues | Code editing, Codespaces, Actions, settings | N/A | Global code search | Medium-high | N/A |

---

## 3. Common Patterns Identified

### Navigation
1. **Bottom bar is universal.** Every product uses bottom navigation in some form — tabs, toolbar, or floating bar. Hamburger-only is dead for primary navigation.
2. **Bottom bar is customizable** in best implementations (Linear lets users rearrange and pin items).
3. **3-5 items max** in bottom bar. Linear pushes beyond 5 with expandable toolbar → sidebar on tablet.
4. **Sidebar becomes supplementary** on mobile — hidden by default, swipe or hamburger to reveal. Primary nav moves to bottom.
5. **FAB for primary creation action** (Google Drive's + button, Linear's create issue). Always accessible, thumb-friendly.

### Search & Query
1. **Always-accessible search** — either in bottom bar (Notion) or as the primary interface (Perplexity, ChatGPT).
2. **Voice input** is table stakes for AI products — ChatGPT and Perplexity both have sophisticated voice UX.
3. **Semantic search** replacing keyword-only (Linear's hybrid search engine).
4. **Composer/input at bottom** for chat-based products — thumb zone, always visible.

### Content & Citations
1. **Inline numbered citations** (Perplexity) outperform grouped-at-end citations for mobile readability.
2. **Source panel at top** of response (Perplexity) provides immediate credibility before reading the answer.
3. **Expandable citation snippets** on tap — balances information density with clean initial view.
4. **Progressive disclosure** — show summary first, details on demand.

### File Upload
1. **FAB (+ button)** replaces drag-and-drop on mobile. Always bottom-right.
2. **Camera integration** for document scanning (Google Drive).
3. **Progress indicators** are expected but poorly implemented (Dropbox bugs).
4. **Paperclip icon** in composer for chat-based file context (ChatGPT).

### Mobile-First Principles
1. **Triage over creation** — mobile excels at reviewing, triaging, quick actions. Heavy creation stays desktop.
2. **Single-column layouts** — complex multi-column/multi-pane layouts collapse (Notion, Perplexity Deep Research).
3. **Offline is expected but rarely delivered well** (Notion and Linear both fail here; users vocally frustrated).
4. **Cross-device sync is mandatory** — ChatGPT, Perplexity, Google Drive all sync seamlessly.

---

## 4. Best-in-Class Examples

| UX Pattern | Best-in-Class | Why |
|---|---|---|
| **Source/citation display** | Perplexity | Inline numbered refs + source panel at top + expandable snippets + favicon metadata |
| **Voice input** | ChatGPT | Inline voice in chat thread, real-time transcription, seamless voice/text switching |
| **Bottom navigation** | Linear | Customizable toolbar, expandable to sidebar on tablet, pinnable items |
| **File upload on mobile** | Google Drive | FAB + camera scan shortcut + multiple creation options in one menu |
| **Notification → action** | GitHub | Focused filter, swipe triage, deep links to PR/issue, home screen widgets |
| **Search UX** | Perplexity | Central search + Focus modes + suggested follow-ups + voice |
| **Content density balance** | Perplexity | Rich but structured — sources at top, inline citations, follow-up suggestions |
| **Deployment monitoring** | Vercel | Floating bottom bar, scope-only label on mobile, status in browser tab icon |
| **Developer mobile UX** | GitHub | Optimized for triage/review, not trying to replicate desktop IDE |

---

## 5. Anti-Patterns to Avoid

1. **Forcing desktop UI onto mobile** (Supabase SQL Editor, Notion columns). If it requires a mouse or wide viewport, don't show it — offer a simplified alternative.

2. **No offline at all** (Linear). For a tool used on commutes, this is a deal-breaker. Even basic read-only cache helps.

3. **Autoscroll that locks users out** (ChatGPT). When generating long answers, users need to scroll freely. Auto-scroll to bottom that can't be paused is hostile UX.

4. **Inconsistent progress indicators** (Dropbox). Upload/processing feedback must be reliable. Missing progress bars create anxiety ("is it working?").

5. **Full feature parity as a goal** — none of the best products try this. They identify the 3-5 core mobile jobs-to-be-done and optimize those. Everything else is explicitly desktop-only.

6. **Hamburger-only navigation** — hides primary actions, reduces discoverability. Always supplement with bottom bar.

7. **Complex forms on mobile** (settings, configuration, integrations). These should redirect to desktop or be dramatically simplified.

8. **Text walls without structure** — long AI answers need headers, bullet points, expandable sections on mobile. Not just raw streaming text.

---

## 6. Recommendations for Contexter

Based on competitor analysis, Contexter (upload files -> parse -> chunk -> embed -> query with AI answers) should adopt these patterns:

### Navigation
- **Bottom tab bar** with 3-4 items: Query (search/ask), Documents (file list), History (past queries), Settings
- **FAB (+)** for primary action: Upload Document — bottom-right, always visible
- On tablet: bottom tabs expand to sidebar

### Query Interface (the core screen)
- **Perplexity-inspired query UX**: central input field with voice button
- **Always-visible composer** at bottom (like ChatGPT)
- **Focus mode selector**: choose which documents/collections to query against
- **Suggested follow-up questions** after each answer
- Voice input for hands-free querying

### Answer Display
- **Source panel at top of answer**: show which uploaded documents were used (with document icon + name)
- **Inline numbered citations**: [1], [2], [3] referencing specific chunks from uploaded documents
- **Tap citation to expand**: show the exact chunk text + page number/section
- **Structured formatting**: headers, bullets, code blocks — never raw text walls
- **Controlled scrolling**: user can interrupt auto-scroll during generation

### Document Upload & Management
- **FAB (+ button)** with options: Upload File, Camera Scan, URL Import
- **Processing status bar**: clear progress for parse -> chunk -> embed pipeline
  - "Parsing document..." -> "Chunking..." -> "Embedding..." -> "Ready to query"
  - Percentage or step indicator (not just spinner)
- **Document list**: card-based with status badge (processing / ready / error)
- **Swipe actions**: delete, share, re-process

### Mobile-Only Scope (don't try everything)
**DO on mobile:**
- Query documents with AI answers
- Upload new documents
- Browse document list and status
- View query history
- Voice query

**KEEP DESKTOP-ONLY:**
- Chunk size configuration
- Embedding model selection
- API key management
- Advanced settings
- Bulk upload management
- Analytics/usage dashboards

### Offline Strategy
- Cache recent query results for offline reading
- Queue uploads for when connection returns
- Show "last synced" timestamp
- Don't promise full offline — just don't break when connectivity drops

### Responsive Breakpoints
- **Mobile**: < 480px — single column, bottom tabs, FAB
- **Tablet**: 481-1024px — sidebar + main content, FAB optional
- **Desktop**: > 1024px — full sidebar + main + detail panel (three-column possible)

### Citation Pattern (Contexter-specific)
Since Contexter queries user-uploaded documents (not web), citations should:
- Reference **document name + page/section** (not URLs)
- Show **chunk confidence score** subtly (relevance indicator)
- Allow **tap-to-view source chunk** in a bottom sheet
- Support **"Show in document"** action to open original file at cited location

---

## Sources

- [Notion Help — Mobile](https://www.notion.com/help/notion-for-mobile)
- [Notion Help — Sidebar](https://www.notion.com/help/navigate-with-the-sidebar)
- [Top 5 Complaints About Notion 2025](https://blog.herdr.io/work-management/title-top-5-complaints-about-notion-in-2025-what-users-are-saying/)
- [Why Users Abandon Notion](https://medium.com/@ruslansmelniks/why-users-abandon-notion-complexity-limitations-and-the-rise-of-ai-alternatives-cba91a95b535)
- [Linear Mobile App Redesign (Oct 2025)](https://linear.app/changelog/2025-10-16-mobile-app-redesign)
- [Customize Linear Mobile Navigation (Jan 2026)](https://linear.app/changelog/2026-01-22-customize-your-navigation-in-linear-mobile)
- [Linear UI Refresh (Mar 2026)](https://linear.app/changelog/2026-03-12-ui-refresh)
- [Linear Design Trend — LogRocket](https://blog.logrocket.com/ux-design/linear-design/)
- [ChatGPT Voice Mode Unified Interface](https://www.techbuzz.ai/articles/chatgpt-voice-gets-major-ux-upgrade-with-unified-interface)
- [ChatGPT Voice Mode in Conversations — MacRumors](https://www.macrumors.com/2025/11/26/chatgpt-voice-mode-update-seamless-chat/)
- [ChatGPT Projects](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)
- [ChatGPT File Uploads FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq)
- [ChatGPT Release Notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- [Perplexity — Citation-Forward Answers](https://www.unusual.ai/blog/perplexity-platform-guide-design-for-citation-forward-answers)
- [Perplexity — UX Lessons — NN/g](https://www.nngroup.com/articles/perplexity-henry-modisett/)
- [Perplexity Mobile vs Desktop](https://www.datastudios.org/post/perplexity-mobile-app-vs-desktop-interface-features-integrations-and-usability)
- [Perplexity Voice Assistant iOS](https://www.perplexity.ai/help-center/en/articles/11132456-how-to-use-the-perplexity-voice-assistant-for-ios)
- [AI Citation Patterns — ShapeofAI](https://www.shapeof.ai/patterns/citations)
- [How AI Engines Cite Sources — Medium](https://medium.com/@shuimuzhisou/how-ai-engines-cite-sources-patterns-across-chatgpt-claude-perplexity-and-sge-8c317777c71d)
- [Vercel Dashboard Redesign](https://vercel.com/blog/dashboard-redesign)
- [Vercel New Dashboard Navigation](https://vercel.com/changelog/new-dashboard-navigation-available)
- [Vercel Dashboard UX Analysis — Medium](https://medium.com/design-bootcamp/vercels-new-dashboard-ux-what-it-teaches-us-about-developer-centric-design-93117215fe31)
- [Supabase Dashboard Navigation Discussion](https://github.com/orgs/supabase/discussions/33670)
- [Supabase SQL Editor](https://supabase.com/features/sql-editor)
- [Google Drive FAB Redesign — 9to5Google](https://9to5google.com/2025/02/13/google-drive-large-fab/)
- [Google Drive Scanner Bottom Bar — 9to5Google](https://9to5google.com/2025/06/17/google-drive-scanner-bottom-bar/)
- [Dropbox Upload Progress Issues](https://www.dropboxforum.com/discussions/101001013/how-can-i-see-the-uploading-progress-on-my-dropbox-account-on-my-desktop/380396)
- [GitHub Mobile Features 2024](https://github.com/orgs/community/discussions/149901)
- [GitHub Copilot Code Review on Mobile](https://github.blog/changelog/2025-07-08-copilot-code-review-now-generally-available-on-github-mobile/)
- [GitHub File Editing on Mobile](https://github.blog/news-insights/product-news/file-editing-on-github-mobile-keeps-leveling-up/)
- [GitHub Mobile iOS 26 Update](https://github.blog/changelog/2025-09-14-github-mobile-now-supports-ios-26-with-refined-visuals-and-smoother-navigation/)
- [Responsive Design Breakpoints 2025 — BrowserStack](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [Mobile Navigation UX Best Practices — DesignStudio](https://www.designstudiouiux.com/blog/mobile-navigation-ux/)
- [Bottom Navigation Bar Guide 2025 — AppMySite](https://blog.appmysite.com/bottom-navigation-bar-in-mobile-apps-heres-all-you-need-to-know/)
