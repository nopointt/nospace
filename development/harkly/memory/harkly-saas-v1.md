---
# harkly-saas-v1.md — Epic: saas-v1 Stage 5
> Layer: L3 | Frequency: fast | Epic: saas-v1
> Last updated: 2026-03-14
---

## Epic Overview

**Goal:** Build Harkly backend (Stage 5: G3 Backend Build). Make the research platform production-ready with proper API, security, and deploy.
**Status:** Stage 5 NOT STARTED — highest priority.

## Frontend State (Stage 3 — DONE)

All 7 modules shipped and deployed:

| Module | Route | Status |
|---|---|---|
| E0 Scaffold + Auth | `/auth/*`, `/app/dashboard` | ✅ DONE |
| E0.5 Canvas Shell | `/app/[workspaceId]` | ✅ DONE |
| E1 Framing Studio | `/app/projects/[id]/frame` | ✅ DONE |
| E2 Corpus Triage | `/app/projects/[id]/corpus` | ✅ DONE |
| E3 Evidence Extractor | `/app/projects/[id]/extract` | ✅ DONE |
| E4 Insight Canvas | `/app/projects/[id]/canvas` | ✅ DONE |
| E5 Research Notebook | `/app/projects/[id]/notebook` | ✅ DONE |
| E6 Share + Export | `/app/projects/[id]/share`, `/share/[token]` | ✅ DONE |

## Canvas Workspace (Stage 3.5 — ON-HOLD)

| Component | Status |
|---|---|
| ChatPanel | ✅ redesigned |
| ChatSettingsBar | ✅ redesigned |
| AgentStatusBar | ✅ redesigned |
| FloorBadge | ✅ redesigned |
| Omnibar | ✅ connected |
| Floor navigation | ⬜ TODO |
| Per-floor canvas content | ⬜ TODO |

## Stage 5 Task Queue (strict order)

- [ ] G3 #5 — Backend security: rate limiting (governor/tower) + input validation
- [ ] Apply pending SQL migrations: `e4_artifacts.sql` + `e6_share.sql` in Supabase
- [ ] Deploy CF Workers (Rust→Wasm) + CF Pages (Next.js) via Wrangler
- [ ] JTBD Report — Jobs-to-be-Done analysis of all features
- [ ] G3 #4 — UI completeness: Create Research form + auth guard + logout

## Blockers

| Blocker | Status |
|---|---|
| `prisma migrate dev` зависает | Use `DATABASE_URL=<DIRECT_URL> bunx prisma db execute --stdin` |
| E4 + E6 SQL migrations not applied | ⚠️ Apply in Supabase SQL editor before backend work |
| Zero test coverage | Critical debt — needs test infra |

## Key Artifacts

| Artifact | File | Status |
|---|---|---|
| Business brief | `branches/feat-saas-v1/opus_business_brief.md` | ✅ |
| Architecture Spec | `branches/feat-saas-v1/Harkly Architecture Spec.md` | ✅ |
| Specs E0–E6 | `branches/feat-saas-v1/specs/` | ✅ DoR 100% |
| Prisma schema | `harkly-saas/prisma/schema.prisma` | ✅ |
| E6 Share migration | `harkly-saas/prisma/migrations/e6_share.sql` | ⚠️ not applied |
| E4 Artifacts migration | `harkly-saas/prisma/migrations/e4_artifacts.sql` | ⚠️ not applied |
| Tech debt report | `memory/tech-debt-frontend.md` | ✅ |
| UX debt report | `memory/ux-debt-report.md` | ✅ |

## Open Questions

- [ ] CF Workers vs Vercel Edge for backend — final decision?
- [ ] Test infrastructure approach (Playwright E2E? Vitest unit?)
- [ ] 152-ФЗ migration plan — when? (currently pre-launch, no real users)
- [ ] Артём roles and responsibilities TBD
