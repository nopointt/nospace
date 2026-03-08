# Tech Debt Report — Harkly SaaS
> Date: 2026-03-08
> Scope: src/ + prisma/
> Methodology: Static analysis — Explore agent (very thorough)

---

## Executive Summary

The Harkly SaaS frontend shows **good overall code health** with consistent auth patterns and proper input validation on most API routes. However, there are **critical gaps in test coverage**, a **serious security vulnerability in project ownership validation**, and several **medium-priority issues with error handling and component composition**.

**Top 3 risks:**
1. **Zero test coverage** — no unit, integration, or E2E tests exist (CRITICAL)
2. **Missing project ownership check** — any authenticated user can access ANY project by ID (CRITICAL SECURITY)
3. **Multiple API routes lack database error handling** — Prisma calls unprotected by try/catch in 6+ routes (HIGH)

**Recommended first actions:**
1. Add project ownership validation to all project-scoped API routes (security fix, 1 day)
2. Wrap all Prisma calls in try/catch
3. Establish test infrastructure

---

## Critical Issues (fix before beta)

### 1. Zero Test Coverage Across Entire Codebase
- **Files affected:** All — no *.test.ts or *.spec.ts files found
- **Problem:** No unit, integration, or E2E tests exist
- **Risk:** Undetected regressions in critical flows (artifact generation, extraction, note creation, project CRUD). Cannot verify auth protection or input validation.
- **Fix:** Jest + React Testing Library for components; integration tests for API routes; Cypress/Playwright for E2E. Target 80%+ coverage before release.

### 2. Project Ownership NOT Verified in API Routes
- **Files affected:** ALL project-scoped routes:
  - `src/app/api/projects/[id]/route.ts`
  - `src/app/api/projects/[id]/sources/route.ts`
  - `src/app/api/projects/[id]/artifacts/route.ts`
  - `src/app/api/projects/[id]/notes/route.ts`
  - 10+ other project-scoped routes
- **Problem:** Routes check session exists but **do NOT verify the user owns the project**. A malicious user with a valid session can access, modify, or delete ANY project by guessing the UUID.
- **Risk:** Data breach. User A can read/modify/delete User B's research projects.
- **Example:**
  ```typescript
  // ❌ Vulnerable pattern:
  const project = await prisma.researchProject.findUnique({ where: { id } });
  // No check: if (!project || project.user_id !== session.user.id)
  ```
- **Fix:** Every project-scoped route must verify `project.user_id === session.user.id` before proceeding.

### 3. Database Errors Unhandled in Multiple API Routes
- **Files affected:**
  - `src/app/api/projects/[id]/sources/route.ts` (POST — 2 Prisma calls without try/catch)
  - `src/app/api/projects/[id]/extraction/run/route.ts` (loop with unprotected Prisma calls)
  - `src/app/api/projects/[id]/corpus/finalize/route.ts`
  - `src/app/api/projects/[id]/documents/[docId]/route.ts` (PATCH without try/catch)
- **Problem:** Unhandled Prisma exceptions crash the request handler, return opaque 500 errors
- **Risk:** Silent failures. Users see generic errors. Debugging blind.
- **Fix:** Wrap all Prisma calls in try/catch at route level; return explicit 500 with logged error context.

---

## High Priority Issues (fix in Стадия 4)

### 1. Client Components Doing Data Fetching + Business Logic + Rendering
- **Files affected:**
  - `src/components/corpus/CorpusPage.tsx` (9 useState hooks, polling, fetch, UI mixed)
  - `src/components/extract/ExtractPage.tsx` (462 lines: fetch + state + filtering + UI)
  - `src/components/insights/InsightCanvasPage.tsx` (223 lines: data fetching + state + rendering)
  - `src/components/notebook/NotebookSidebar.tsx` (288 lines: 6 useState hooks, fetch, debounce, UI)
- **Problem:** Breaks server-side data fetching patterns. Heavy state management = hard to test.
- **Risk:** Slower perceived performance. State synchronization bugs. Race conditions.
- **Fix:** Move initial data fetching to Server Components; use SWR/React Query for client-side; extract fetch logic to custom hooks; decompose large components.

### 2. Fetch Errors Silently Ignored in Client Components
- **Files affected:**
  - `src/components/corpus/CorpusPage.tsx` (line 75: `catch { /* silent */ }`)
  - `src/components/notebook/NotebookSidebar.tsx` (lines 63-66: catch swallows errors)
  - `src/components/insights/InsightCanvasPage.tsx` (implicit error handling missing)
- **Problem:** Components catch fetch errors but show nothing to the user
- **Risk:** Users unaware of data loading failures. Silent data inconsistencies.
- **Fix:** Add `error` state. Display error messages with retry button.

### 3. Hardcoded Mock Data Mixed with Production Code
- **Files affected:**
  - `src/app/api/projects/[id]/sources/route.ts` (MOCK_CONTENT hardcoded string)
  - `src/app/api/projects/[id]/extraction/run/route.ts` (MOCK_EXTRACTIONS array)
  - `src/app/api/ai/frame-suggest/route.ts` (hardcoded Anthropic API URL)
- **Problem:** Mock data blocks real implementation. Hardcoded URLs block environment switching.
- **Risk:** If mocks reach production, data is fake. Switching providers requires code changes.
- **Fix:** Feature-flag mocks via env var (`MOCK_EXTRACTIONS=true`). Move URLs to `.env`.

---

## Medium Priority Issues (track, fix in Стадия 5)

### 1. Prisma JSON Field Casting Using `as unknown as X`
- **Files affected:** `artifacts/route.ts`, `artifacts/[artifactId]/export/route.ts`, `types/framing.ts`
- **Problem:** Double-cast bypasses TypeScript safety entirely
- **Fix:** Runtime validation with `zod` before casting. Type guard functions.

### 2. Missing Input Validation on Some POST/PATCH Routes
- **Files affected:** `notes/route.ts` (validates presence, not max length), `frame/route.ts` (frame_data not validated)
- **Fix:** Use `zod` schema validation on all mutation routes. Server-side length limits.

### 3. No Rate Limiting on File Upload Route
- **File:** `src/app/api/upload/route.ts`
- **Problem:** Any authenticated user can upload 10MB repeatedly without limit
- **Fix:** Per-user rate limit. Monitor upload directory size.

### 4. Missing Loading States in Artifact Generation
- **Files affected:** `FactPackTab.tsx`, `EvidenceMapTab.tsx`, `EmpathyMapTab.tsx`
- **Problem:** No feedback while generation is in progress. Buttons not disabled.
- **Fix:** Show spinner. Disable button during async operations.

### 5. Accessibility: Missing Alt Text and Aria Labels
- **Problem:** Dynamic images in corpus/document rendering likely missing alt text
- **Fix:** Add meaningful alt text to all `<img>` tags.

---

## Low Priority / Nice to Have

- `console.error` in production routes → use error tracking service (Sentry)
- No environment variable validation at startup → fail fast if required vars missing
- Prisma seed script has no top-level try/catch
- No type return annotations on async API route functions
- No `.env.example` file for new developers

---

## Summary Table

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 0 | 1 | 0 |
| Tests | 1 | 0 | 0 | 0 |
| Error Handling | 1 | 1 | 1 | 1 |
| Architecture | 0 | 1 | 1 | 1 |
| TypeScript | 0 | 0 | 1 | 1 |
| Performance | 0 | 0 | 1 | 0 |
| a11y | 0 | 0 | 1 | 0 |
| **Total** | **3** | **2** | **6** | **3** |

---

## Recommended Fix Order

1. **Add project ownership validation to all project-scoped routes** — prevent data breach (1 day, HIGH URGENCY)
2. **Wrap all Prisma calls in try/catch** across API routes (1-2 days)
3. **Add error state + user-visible error messages** to client components (2-3 days)
4. **Move mocks behind env feature flags** — `MOCK_EXTRACTIONS=true` (1 day)
5. **Establish test infrastructure** — Jest + React Testing Library (3-5 days setup)
6. **Decompose large components** (CorpusPage, ExtractPage, NotebookSidebar) (3-5 days)
7. **Add zod validation** on all POST/PATCH routes (2-3 days)
8. **Add file upload rate limiting** (1 day)
9. **Add loading states** to artifact generation flows (1-2 days)
10. **Fix a11y issues** — alt text, aria labels (1-2 days)
