# STATE — Nomos

## Position
- **Phase:** Phase 1B (runner live, paper run 7 days on Hetzner) + Phase 2 Waves 0-4 DONE (Vault dashboard live)
- **Status:** Full production stack on Hetzner. `https://nomos.contexter.cc` (frontend, CF Pages) + `https://api.nomos.contexter.cc` (backend, Caddy + LE) + `nomos-runner` docker service.
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
- No implementation started (research only so far)

## Deferred
- Full trading agent implementation
- Legal compliance (KZ jurisdiction)
- Portfolio tracking system

## Metrics
- Sessions: 2
- Strategies researched: 10
