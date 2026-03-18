---
# harkly-roadmap.md — Harkly Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start or on demand
> Last updated: 2026-03-18
---

## saas-v1 — 6-Stage Roadmap

| Stage | Name | Status |
|---|---|---|
| 0 | Research Foundation | ✅ DONE |
| 1 | Business Design (Opus) | ✅ DONE — `opus_business_brief.md` written |
| 2 | Spec Lock | ✅ DONE — 8 specs (E0, E0.5, E1–E6), DoR 100% |
| 3 | G3 Frontend Build | ✅ DONE — E0–E6 all complete |
| 4 | Tech Debt Analysis | ✅ DONE — `tech-debt-frontend.md` + `ux-debt-report.md` |
| 3.5 | Canvas Workspace Redesign | ⏸ ON-HOLD — floor nav + per-floor content pending |
| L | Landing Page | ✅ DONE — deployed harkly-saas.vercel.app |
| **5** | **G3 Backend Build** | **🔜 NEXT — highest priority** |
| 6 | Manual Testing + Beta | 🔒 blocked by Stage 5 |

## HARKLY-05 G3 Roadmap (Stage 5 — строгая очерёдность)

1. **G3 #5** — Backend security: rate limiting (governor/tower) + input validation (appid, limit, name)
2. **Deploy** — Cloudflare Workers (Rust→Wasm via `worker` crate) + CF Pages (Next.js) via Wrangler
3. **JTBD Report** — full Jobs-to-be-Done feature analysis
4. **G3 #4** — UI completeness: Create Research form + auth guard + logout

**G3 rule:** prompt via file (`cat spec.md`). Claude = Coach, does not write code.
**CF Workers:** Rust→Wasm requires `worker` crate + `wrangler deploy`. PostgreSQL → Hyperdrive.

## Active Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **HARKLY-15** | **UI Design in Pencil MCP (shell + floors)** | **🔶 IN PROGRESS** | `harkly-design-ui.md` |
| **HARKLY-14** | **Marketing: Content Auto-Writing System** | **🔶 IN PROGRESS** | `harkly-marketing-content.md` |
| HARKLY-05 | saas-v1: Stage 5 G3 Backend Build | 🔜 NEXT | `harkly-saas-v1.md` |
| HARKLY-12 | saas-v1: Canvas Workspace Redesign (3.5) | ⏸ on-hold | `harkly-canvas-redesign.md` |
| HARKLY-06 | Cold outreach Steam indie games | ⏸ on-hold | `harkly-cold-outreach.md` |
| HARKLY-13 | saas-v1: Landing Page | ✅ DONE — harkly-saas.vercel.app | — |
| HARKLY-11 | saas-v1: Stage 3 G3 Frontend Build | ✅ DONE — E0–E6 done | — |
| HARKLY-03 | ProxyMarket partnership | ✅ CLOSED 2026-03-10 | — |

## Completed Epics → Summaries

| Epic | Report |
|---|---|
| E0 Scaffold + Auth | `chronicle/summaries/harkly-e0-report.md` |
| E0.5 Canvas Shell | `chronicle/summaries/harkly-e05-report.md` |
| E1–E6 Frames | `chronicle/summaries/harkly-e1-e6-report.md` |

## Next Priority

1. **HARKLY-15 UI Design** — F0 rebuild (PICOT → JTBD), F1–F5 screens ← **активно сейчас**
2. **HARKLY-14 Marketing Content System** — Brand TOV + channel agents + Idea Hub + pipeline
3. **Stage 5 — G3 Backend Build** (G3 #5: rate limiting + validation)
4. **Apply pending SQL migrations** (e4_artifacts.sql + e6_share.sql in Supabase)
5. **Canvas 3.5** — floor navigation + per-floor content (after Stage 5)

## Reference

- Full spec: `branches/feat-saas-v1/Harkly Architecture Spec.md`
- Business brief: `branches/feat-saas-v1/opus_business_brief.md`
- Methodology schools: `branches/feat-saas-v1/methodology_schools_detailed.md`
- Specs E0–E6: `branches/feat-saas-v1/specs/`
