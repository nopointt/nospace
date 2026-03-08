# UX / Product Design Debt Report — Harkly SaaS
> Date: 2026-03-08
> ICP: Dedicated UX Researchers & Research Ops
> Scope: E1-E6, Dashboard, Auth
> Methodology: Full component read + interaction audit

---

## Executive Summary

Harkly demonstrates a **solid foundation with professional-grade interaction patterns**, but has critical gaps in error handling, feedback mechanisms, and navigation clarity that would frustrate expert researchers. The product feels "mostly complete" — until users hit edge cases. The biggest vulnerability: **no destructive action confirmations** and **absent error messages on API failures**. The notebook sidebar is well-designed and non-intrusive, but the workflow lacks clear "next step" CTAs between epics.

**Overall UX maturity: 6.5/10** — works for happy path, breaks when things go wrong.

**Top 3 risks:**
1. Silent API failures — researchers think they saved data, they didn't. Trust destroyed.
2. No confirmation for destructive actions — one misclick wipes months of work.
3. No workflow continuity CTAs — users don't know what to do after each epic.

---

## Critical UX Issues (fix before any user sees this)

### 1. Silent API Failures Across All Epics
- **Where:** E1 (FramingStudio), E2 (CorpusPage), E3 (ExtractPage), E4 (InsightCanvasPage), E5 (NotebookSidebar)
- **Problem:** When API calls fail, the code catches errors and reloads data, but **shows nothing to the user**. Actions silently revert. No error toast.
- **User impact:** Researcher saves a note → nothing happens → they think it saved → refresh → it's gone. Trust in the tool plummets.
- **Fix direction:** Add `toast.error("Failed to save")` in all catch blocks for API mutations. Sonner is already imported in Share page — use it globally.

### 2. No Confirmation Before Destructive Actions
- **Where:** E2 (bulk exclude/include via keyboard shortcuts M/E/I), E5 (delete note), Dashboard (archive/delete project)
- **Problem:** Users can accidentally exclude 50 corpus documents, delete a note forever, or archive a project with no confirmation and no undo.
- **User impact:** A researcher accidentally excludes their entire corpus with a batch keyboard shortcut. No undo. Must reclassify manually.
- **Fix direction:** Confirmation modals for: bulk exclude, note deletion, project archival. Pattern already exists (FinalizationModal).

### 3. Extract Page "Finalize corpus first" Has No Link Back
- **Where:** ExtractPage — message shown when corpus not finalized
- **Problem:** Shows "Finalize your corpus first" but no clickable link to corpus page. User must navigate manually.
- **User impact:** Researcher just finalized corpus, goes to extract, sees error, doesn't know where to go.
- **Fix direction:** Add direct link: `Go to Corpus →` pointing to `/app/projects/[id]/corpus`.

### 4. Notebook Empty State Has No Value Explanation
- **Where:** NotebookSidebar — "No notes yet" empty state
- **Problem:** "No notes yet" + button — no explanation of what notes are for in research context.
- **User impact:** Researchers don't understand if notes are important or decorative.
- **Fix direction:** Add tagline: "Capture insights, link them to extractions, and tag for reuse."

---

## High Priority UX Issues (fix before beta)

### 5. No Loading Skeleton Screens — Generic "Loading..." Everywhere
- **Where:** E4 (InsightCanvasPage), E6 (SharePage), E1 (FramePage)
- **Problem:** All use full-screen "Loading..." div with no content shape indication. Inconsistent vs Dashboard (which has skeleton grid).
- **Fix direction:** Skeleton screens matching content shape. Consistent loading pattern across all epics.

### 6. Finalization Modal Doesn't Clarify What Happens to Unreviewed Docs
- **Where:** FinalizationModal
- **Problem:** "⚠ {pendingCount} unreviewed documents" — no clarification they'll be EXCLUDED from extraction.
- **User impact:** Researcher thinks "pending" docs will be analyzed. They won't. Surprised by sparse extraction results.
- **Fix direction:** "⚠ {pendingCount} unreviewed documents will NOT be extracted. Only {includedCount} included documents will be analyzed."

### 7. "Run Extraction" Enabled Even When 0 Documents Included
- **Where:** ExtractPage
- **Problem:** Button active after corpus finalization even if all docs are EXCLUDED/MAYBE. Extraction runs on empty corpus.
- **User impact:** Clicks "Run extraction" → success message → "No extractions found" → confused.
- **Fix direction:** Disable button + show message if `included_count === 0`.

### 8. Share Page: No Indication If Link Already Exists
- **Where:** SharePage — ArtifactCard "Share link" button
- **Problem:** Button shows no state — whether link exists or not. No pre-populated URL in dialog on reopen.
- **User impact:** Researcher generates duplicate share links. Shares wrong URL. Can't find the existing one.
- **Fix direction:** Show "Shared" badge on card if link exists. Pre-populate dialog with existing link.

### 9. Related Notes Feature Has No Explanation
- **Where:** NotebookSidebar — "Related to context" section
- **Problem:** Notes appear as "related" with no explanation of the mechanism (keyword-based? ML? semantic?).
- **User impact:** Researchers don't trust the feature and ignore it. Perceived value = zero.
- **Fix direction:** Tooltip/info icon: "Notes related to your current content based on keyword overlap."

### 10. No Soft-Delete for Projects — Hard Delete Only
- **Where:** Dashboard — ✕ button (hover-only, hard to discover)
- **Problem:** Projects deleted immediately on click. No undo, no recovery. Button also hidden until hover.
- **User impact:** Researcher accidentally archives/deletes a project they spent weeks on.
- **Fix direction:** Soft-delete + "Archived" tab on dashboard with restore button. Or require confirmation.

### 11. Artifact Generation "Failed" Status Has No Details or Retry
- **Where:** InsightCanvasPage — status badges
- **Problem:** Shows "Failed" in red but no error details. No retry button in failed state. No explanation.
- **User impact:** Researcher doesn't know if they should retry, wait, or contact support.
- **Fix direction:** Show error detail on hover. Add "Retry" button when status = FAILED.

### 12. Corpus Empty State on Filter Has No CTA
- **Where:** CorpusPage — when filter active and 0 results
- **Problem:** "No included documents" with no CTA to change filter or add sources.
- **User impact:** Researcher sees blank list, assumes they need to start over.
- **Fix direction:** Context-aware message: "No {filter} documents. Change filter ↑ or add more sources."

---

## Medium Priority (Stage 5 / Polish Pass)

### 13. Keyboard Shortcuts Not Discoverable
- **Where:** Dashboard (⌘K — small hint), NotebookSidebar (Cmd+Shift+N — title attribute only)
- **Problem:** Power-user shortcuts are invisible unless you know where to look.
- **Fix direction:** Persistent keyboard hint bar (VS Code-style) or onboarding tooltip on first visit.

### 14. Inline Form Validation Missing
- **Where:** E1 FrameFields (required textareas), NewNoteForm
- **Problem:** No character counts, no real-time required field feedback. Only validated on submit.
- **Fix direction:** Disable submit until required fields non-empty. Add character count on long textareas.

### 15. Extraction Type Badges Have No Tooltips
- **Where:** ExtractPage — FACT / METRIC / QUOTE / THEME / CONTRADICTION badges
- **Problem:** Tiny colored badges with no explanation. What's the difference between FACT and THEME?
- **Fix direction:** Hover tooltips: "FACT: Single factual claim. THEME: Repeated concept across ≥3 sources."

### 16. "Processing..." Badge Has No ETA or Cancel
- **Where:** CorpusPage — documents being processed
- **Problem:** No progress indication. Could take 10 minutes. Looks frozen.
- **Fix direction:** Show elapsed time or estimated progress percentage.

### 17. No Workflow Continuity CTAs Between Epics
- **Where:** All epic transitions
- **Problem:** After finalizing corpus, no "Next: Run extraction" button. After extraction completes, no "Next: Generate artifacts" CTA. Users must find their own way.
- **Fix direction:** After each epic milestone, show contextual CTA card at top of page.

### 18. Button Loading States Inconsistent
- **Where:** FramingStudio, AddSourcesPanel, FinalizationModal
- **Problem:** Some use `disabled:opacity-40`, some show "Saving...", some do both. No standard.
- **Fix direction:** Global pattern: disabled + spinner icon + text change for all async buttons.

### 19. No Responsive Design for Tablets
- **Where:** CorpusPage (40%/60% split), ExtractPage (wide table), NotebookSidebar (320px overlay)
- **Problem:** Hardcoded widths break on iPad. No `sm:` / `md:` breakpoints in key layouts.
- **Fix direction:** Add responsive breakpoints. Test on 768px viewport.

---

## Per-Epic UX Scorecard

| Epic | Empty State | Loading | Errors | Navigation | Form UX | Feedback | Score |
|------|-------------|---------|--------|------------|---------|---------|-------|
| E1 Framing | ✅ | ⚠️ skeletal | ❌ silent | ✅ clear | ⚠️ no validation | ⚠️ partial | **4/6** |
| E2 Corpus | ✅ handled | ✅ skeleton | ❌ silent | ⚠️ multi-step | ✅ checkboxes | ⚠️ no batch toast | **4.5/6** |
| E3 Extract | ✅ context | ✅ progress | ⚠️ no detail | ✅ breadcrumb | ✅ buttons | ⚠️ no verify toast | **5/6** |
| E4 Canvas | ✅ artifact-specific | ⚠️ generic | ⚠️ no fail msg | ✅ tabs | ✅ save buttons | ⚠️ status vague | **4.5/6** |
| E5 Notebook | ✅ CTA | ✅ loading | ⚠️ silent delete | ✅ sidebar | ✅ tag input | ❌ no delete confirm | **4/6** |
| E6 Share | ✅ not-generated | ⚠️ generic | ⚠️ no error state | ✅ breadcrumb | ✅ buttons | ⚠️ no link status | **4.5/6** |
| Dashboard | ✅ new project | ✅ skeleton | ✅ handled | ✅ omnibar | ⚠️ no validation | ✅ feedback | **5.5/6** |
| Auth | ✅ | ✅ button state | ✅ inline errors | ✅ links | ✅ validation | ✅ success msg | **6/6** |

---

## Top 10 Quick Wins (high impact, low effort)

1. **Global error toast** — add `toast.error("Failed to save")` to all API mutation catch blocks. 15 min. Trust fix.
2. **Confirmation dialog for note deletion** — `AlertDialog` already available. 10 min.
3. **Link to corpus in "Finalize corpus first"** message on extract page. 5 min.
4. **"No results" empty state in Notebook search** — show "No notes match '{query}'". 10 min.
5. **Disable "Run extraction" if 0 included documents.** 10 min.
6. **Finalization modal: clarify unreviewed = excluded.** Text change only. 5 min.
7. **Extraction type tooltips** — hover tooltip on TYPE badges. 15 min.
8. **Share link status badge** — show "Shared" on artifact card if link exists. 15 min.
9. **Related notes tooltip** — info icon explaining keyword-based matching. 10 min.
10. **Workflow CTA after corpus finalization** — "Corpus finalized! → Run extraction". 10 min.

---

## Researcher Experience Assessment

**What researchers would love:**
- Corpus triage keyboard shortcuts (I/E/M) = fast screening for power users
- Extraction table with confidence badges = professional and familiar
- Notebook sidebar is genuinely non-intrusive and well-integrated
- Optimistic UI updates feel snappy
- Cmd+K omnibar = expected in a professional tool

**What would frustrate them:**
- Silent saves — "Did that actually work?" is a productivity killer
- One-click irreversible corpus exclusion
- "Run extraction" → "No results" with no explanation
- Typing "xyz" in notebook search → blank screen (loading or no results?)
- "Related to context" section with no explanation of the mechanism
- 10+ minute artifact generation with no progress indicator

**What they'd want (v2 wishlist):**
- "Next step" indicator after each epic
- Batch tag/verify actions on extractions
- Auto-generated research summary editable before artifacts
- Cross-project note search

**Bottom line:** A researcher would use this tool and like it. But they'd hit a few landmines (silent failures, no undo, vague status) in the first week that would make them question reliability. The tool is 70% polished, 30% "why didn't this work?"

---

## Recommended Design Pass Priority

1. **Error feedback (CRITICAL)** — Toasts for all API failures. Non-negotiable before external user testing.
2. **Destructive action confirmations (CRITICAL)** — Delete/exclude/archive must require confirmation.
3. **Workflow continuity CTAs** — "Next: Run extraction" after corpus finalization. Reduce inter-epic friction.
4. **Extraction type education** — Tooltips on TYPE badges. Researchers need to understand what they're reviewing.
5. **Loading state consistency** — Skeleton screens. Remove all generic "Loading..." placeholders.
6. **Empty state comprehensiveness** — Every empty state needs a CTA. No dead-ends.
7. **Keyboard shortcut discoverability** — Make power-user features visible.
8. **Mobile/tablet responsiveness (Stage 5)** — Responsive breakpoints across all layouts.
