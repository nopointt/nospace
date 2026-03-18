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

## HARKLY-05 Stage 5 — Backend Build (pending)

Backend approach TBD after UI design (HARKLY-15) completes. Code will be rewritten from Pencil mockups.
Deploy: Vercel (current). G3 rule: prompt via file (`cat spec.md`). Axis = Coach.

## Active Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **HARKLY-15** | **UI Design in Pencil MCP (shell + floors)** | **🔶 IN PROGRESS** | `harkly-design-ui.md` |
| **HARKLY-14** | **Marketing: Content Auto-Writing System** | **🔶 IN PROGRESS** | `harkly-marketing-content.md` |
| HARKLY-05 | saas-v1: Stage 5 G3 Backend Build | 🔜 NEXT | `harkly-saas-v1.md` |
| HARKLY-12 | saas-v1: Canvas Workspace Redesign (3.5) | ⏸ on-hold | `harkly-canvas-redesign.md` |
| HARKLY-16 | Claude Code CLI integration — ToS inquiry + architecture | 📬 PENDING REPLY | `anthropic-claudecode-inquiry.md` |
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

1. **HARKLY-15 UI Design** — F0 done (JTBD ✅), design system done ✅, F1–F5 screens pending ← **активно сейчас**
2. **HARKLY-14 Marketing Content System** — Brand TOV + channel agents + Idea Hub + pipeline
3. **Stage 5 — G3 Backend Build** (G3 #5: rate limiting + validation)
4. **Apply pending SQL migrations** (e4_artifacts.sql + e6_share.sql in Supabase)
5. **Canvas 3.5** — floor navigation + per-floor content (after Stage 5)

## Reference

### Brand (all in `development/harkly/brand/`)
- Brand Bible: `brand-bible.md` (consolidated source)
- Values: `values.md` (canonical 5 values, vibe, symbol, methodology)
- Positioning: `positioning.md` (audience, GTM, metric)
- Category Manifesto: `category-manifesto.md`
- TOV: `tov.md` (v3 — 4 pillars, infostyle, inner child)
- Omnibar Primacy: `omnibar-primacy.md` (spatial canvas rules)
- UI Language: `ui-language-ru.md` (RU translations for all UI elements)
- Brand + Design Overview: `brand-and-design-overview.md` (full inventory)

### Design System (`nospace/design/harkly/`)
- Pencil: `harkly-ui.pen` (source of truth — tokens, components, artboards)
- Docs: README, foundations/, guidelines/, patterns/, components/
- Spatial rules: `harkly-spatial-interface-rules.md`
- RAG: `bauhaus-rag-results.md` + `bauhaus-validation-results.md`
- Upstream: `nospace/design/design_system/` (tLOS) + `nospace/design/tlos-ui.pen`

### Architecture (`development/harkly/architecture/`)
- Product architecture (EN): `harkly-product-architecture-en.md`
- Spine-процесс (RU): `harkly-spine-process-ru.md`
- Business brief: `opus_business_brief.md`
- Methodology schools: `branches/feat-saas-v1/methodology_schools_detailed.md`
- Specs E0–E6: `branches/feat-saas-v1/specs/`

### Research
- F1: `docs/research/f1-connector-ux-research.md` · `f1-pm-sources-web-research.md` · `f1-audience-sources-mining.md`
- Framing frameworks: `docs/research/framing-frameworks-research.md`

### Archive
- `development/harkly/archive/` — old copies of restructured files
