# STATE — Nomos

## Position
- **Phase:** Phase 1B (runner live on Hetzner) + Phase 2 Waves 0-4 DONE (dashboard live, Waves 5-6 deferred)
- **Status:** Full production stack on Hetzner. `https://nomos.contexter.cc` (frontend, CF Pages) + `https://api.nomos.contexter.cc` (backend, Caddy + LE) + `nomos-runner` docker service. UI without "Vault/part of Contexter" branding — Nomos is independent internal project (on Contexter VPS for cost only).
- **Last session:** 2026-04-22 (Satoshi, session 5, autonomous run)
- **Orchestrator:** Satoshi

## Key Completions
- Trading infrastructure design (session 2)
- 10 strategies researched and documented
- Remizov ODE method: deep research, experimental
- **Phase 2 backend (session 5): FastAPI on Hetzner, 9 routes, 28-file package, CF Pages frontend.**
- **Runner migrated to docker service on Hetzner (session 5).**
- **Contexter design system reused via Vite alias `@contexter` (no fork).**

## Active Decisions
- D-01: Cash only, crypto path (blocked bank accounts)
- D-02: 75K KZT/mo budget constraint
- D-03: Remizov ODE method — experimental, research phase
- D-04: Self-custody for amounts > $500
- D-11..D-15: Phase 2 architecture (see `phase2-dashboard/CONTEXT.md`)

## Blockers
- Blocked bank accounts (operational constraint)
- No real money yet — paper trading until proven profitable

## Deferred
- Legal compliance (KZ jurisdiction)
- Phase 1C real money on-ramp
- Phase 2 Waves 5-6: control UI buttons, Settings/RemizovODE pages, Telegram alerts wiring, Playwright E2E, mobile 375px test
- Claude Code Routines layer for fundamentals bias / weekly review (from YouTube research `research-24-7-ai-trader-video.md`)

## Metrics
- Sessions: 5
- Strategies researched: 10
- Strategies running live paper: 3 (MACD, EMA+RSI, Remizov v2) + Cramer mirror
- Phase 2 AC: 5/8 green, 3/8 partial (see `phase2-dashboard/CONTEXT.md`)
