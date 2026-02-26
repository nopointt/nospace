# HANDSHAKE — 2026-02-26
> Operative context for the next session. Read this LAST during /startgsession.
> Written by: Assistant Agent at session close.

---

## 🔴 CRITICAL — Read First

- **OPS-TODO-01 (Critical):** Encrypt `private_knowledge/context/longterm/cloudflare-root.env` and `neon-db-master.env` with `age`. Unencrypted credentials on disk — must resolve before team expansion.
- **HARKLY-04 incomplete:** Economics model review hit context limit mid-session. Files read: `docs/harkly/economics/model.py`, `results.md`, `dashboard.html`. Resume analysis next session — re-read all three files and complete the review.
- **Comet is active:** Run `/sync` at session start to pull any Comet changes to PRD v2 or other docs.

---

## Active Work

| Item | Status | Next Action |
|---|---|---|
| HARKLY-04: economics model review | in-progress / interrupted | Re-read model.py + results.md + dashboard.html, complete review |
| HARKLY-01: PRD v2 push | blocked (Comet) | Pull via /sync — check if Comet pushed `prd-horizon-1.md` |
| HARKLY-02: npm install + scraper test | pending | `cd development/harkly/src/desktop && npm install` |
| HARKLY-03: CPO ProxyMarket call | pending nopoint | nopoint schedules call |
| /agents/* push to repo | pending | Verify agents/ not in .gitignore, then /sync |

---

## Context Snapshot

**Workspace phase:** active-dev
**Active projects:** tLOS (paused), harkly (active)
**Last action:** Read harkly economics files (model.py, results.md, dashboard.html) for analysis — hit context limit before completing

---

## Open Decisions

- [ ] Claude ↔ Comet async channel: Issues with `comet` label vs memory/ files — nopoint decides
- [ ] harkly investor pitch: which of 3 scenarios (SaaS / API / White-Label) to lead with for specific investor
- [ ] harkly API migration: when to start? (deferred)
- [ ] agent-identity-regulation JWT: Phase 2 (HTTP identity server) not yet implemented
- [ ] vector-search-regulation: Qdrant + Ollama stack not yet deployed
- [ ] Data residency: RU-юрисдикция или Cloudflare? — pending юристы ProxyMarket
- [ ] Calibration data для Prediction Layer — уточнить на созвоне с CPO

---

## Files Changed This Session

- `memory/current-context-global.md` — added HARKLY-04 epic, added context-limit blocker
- `memory/episodic-context-global.md` — appended session 2026-02-26 entry
- `memory/handshake.md` — overwritten (this file)

---

## Recommended First Action Next Session

> Run `/sync` to pull any Comet changes. Then resume HARKLY-04: re-read `docs/harkly/economics/model.py`, `results.md`, and `dashboard.html` to complete the economics model review that was interrupted by context limit.
