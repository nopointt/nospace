# session-scratch.md

<!-- ENTRY:2026-03-28:CLOSE:195:contexter:contexter-gtm [AXIS] -->
## 2026-03-28 — сессия 195 CLOSE [Axis]

**Decisions:**
- CTX-01 MVP closed as MLP COMPLETE, CTX-07 Production Hardening closed as MLP COMPLETE
- CTX-08 GTM Strategy epic created — positioning "One memory. Every AI."
- Target audience: non-technical IT/non-IT specialists (not developers)
- Contexter = SaaS (not self-hosted) — self-hosted is internal infra, not user-facing
- Context = documents + conversations (not just docs)
- Two killer features: 1) connects to all LLMs, 2) any format any size
- Reverted P1-002 (token leak fix) to restore idempotent login — proper auth deferred to CTX-04

**Files changed:**
- `memory/contexter-production.md` — L3 full rewrite with 92-issue verified status
- `memory/contexter-gtm.md` — NEW L3 epic CTX-08
- `memory/contexter-product-brief.md` — product brief for landing page
- `memory/contexter-mvp.md` — status → MLP COMPLETE
- `memory/contexter-roadmap.md` — L2 MLP done, CTX-08 added
- `memory/contexter-about.md` — L1 CTX-01/07 closed, CTX-08 active
- `src/routes/auth.ts` — idempotent registration (return token on duplicate email)
- `src/services/pipeline.ts` — zip bomb protection 50MB limit
- `src/routes/upload.ts` — transactional upload with cleanup
- `src/index.ts` — strip token from logged URL path
- `web/src/pages/DocumentViewer.tsx` — null date guard
- `web/src/pages/Dashboard.tsx` — error retry button
- `web/src/pages/Landing.tsx` — NEW full marketing landing page
- `web/src/index.tsx` — routing: / → Landing, /app → Hero
- `landing/` directory — separate CF Pages project for testing
- `docs/research/contexter-gtm-*.md` — 14 research files
- Server: docker-compose.yml (non-root, security_opt, CPU limits, CF origin cert)
- Server: /opt/contexter/backup.sh + cron daily pg_dump → R2

**Completed:**
- Groq API key rotated (local + server)
- CTX-01 + CTX-07 closed as MLP COMPLETE
- pg_dump backup cron to R2 (daily 03:00 UTC)
- NEW-007 zip bomb, NEW-014 transactional upload, NEW-003 token strip
- NEW-019 null date, NEW-020 retry button
- NEW-002 non-root containers, NEW-006 security_opt + CPU limits
- P3-007 CF origin cert (valid 2041)
- CTX-08 Phase 0: market landscape + 5 direct + 15 indirect + second brain
- CTX-08 Phase 1: 6 competitor deep dives (Ragie, Graphlit, Morphik, Vectorize, Langbase, Supermemory)
- CTX-08 Phase 2: competitive map + positioning synthesis
- CTX-08 Phase 3: product brief + Pencil design + frontend implementation
- Landing page deployed to contexter.cc (/ → Landing, /app → Hero)

**Opened:**
- Landing page copy/design iterations
- Pricing tiers finalization
- Product video (deferred)
- Testimonials collection (Artem demo)
- Git push for session 193 commits (unblocked, pushed)

**Notes:**
- Supermemory is closest positioning competitor — "context infrastructure for AI agents"
- Category "context storage" is forming now — naming race in progress
- Walled garden players (OpenAI, Anthropic, Google) structurally cannot build model-agnostic memory
- Landing page lives at both contexter-landing.pages.dev (test) and contexter.cc (prod)
