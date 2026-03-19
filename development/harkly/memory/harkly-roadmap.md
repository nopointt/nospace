---
# harkly-roadmap.md — Harkly Roadmap
> Layer: L2 | Frequency: medium | Loaded: at session start or on demand
> Last updated: 2026-03-19
---

## Current Focus: HARKLY-18 MVP Data Layer

All resources on MVP. Everything else paused.

**MVP scope:** Upload (PDF, DOCX, CSV, TXT, audio, YouTube subs) → AI schema discovery → user confirmation → structured extraction to D1 → MCP Server (OAuth 2.1) → spatial canvas (web).

**What's NOT in MVP:** LLM chat (v1.1), video files (v2), Instagram (v2), Tauri desktop (v2), billing (last).

---

## HARKLY-18 Sub-Epics

| Sub-Epic | Scope | Status | Blocks | Parallel with |
|---|---|---|---|---|
| **18.1** Scaffold | SolidStart + CF + D1 + auth + wrangler.toml | 🔜 NEXT | — | — |
| **18.2** Upload + Process | R2 presigned, Queues, chunking, embedding, audio/Whisper, YouTube subs | ⬜ BLOCKED | 18.1 | 18.4 |
| **18.3** Schema + Extract | Discovery, confirmation UI, Zod compilation, instructor-js extraction | ⬜ BLOCKED | 18.2 | — |
| **18.4** MCP + OAuth | workers-oauth-provider, mcp-ts-template, better-auth consent, 6 MCP tools | ⬜ BLOCKED | 18.1 | 18.2 |
| **18.5** Canvas Port | harkly-shell → web SolidStart, connect to D1 data, Omnibar (hidden) | ⬜ BLOCKED | 18.3 | — |

**Dependency graph:**
```
18.1 ──→ 18.2 ──→ 18.3 ──→ 18.5
  └────→ 18.4 (parallel with 18.2)
```

---

## Active Epics

| Epic | Description | Status | L3 File |
|---|---|---|---|
| **HARKLY-18** | **MVP Data Layer Platform** | **🔶 IN PROGRESS** | `harkly-mvp-data-layer.md` |
| HARKLY-15 | UI Design in Pencil (shell + floors) | ⏸ PAUSED | `harkly-design-ui.md` |
| HARKLY-17 | Shell (Tauri + SolidJS) — desktop v2 | ⏸ PAUSED | `harkly-shell-epic.md` |
| HARKLY-14 | Marketing: Content Auto-Writing System | ⏸ PAUSED | `harkly-marketing-content.md` |
| HARKLY-05 | saas-v1: Backend Build (superseded by 18) | ⏸ PAUSED | `harkly-saas-v1.md` |
| HARKLY-16 | Claude CLI Integration (MCP path chosen) | ⏸ PAUSED | `anthropic-claudecode-inquiry.md` |
| HARKLY-12 | Canvas Workspace Redesign | ⏸ PAUSED | `harkly-canvas-redesign.md` |
| HARKLY-06 | Cold Outreach Steam | ⏸ PAUSED | `harkly-cold-outreach.md` |

## Completed Epics

| Epic | Report |
|---|---|
| HARKLY-13 Landing Page | ✅ `harkly-saas.vercel.app` live |
| HARKLY-11 Stage 3 Frontend Build | ✅ E0–E6 complete |
| HARKLY-03 ProxyMarket partnership | ✅ CLOSED 2026-03-10 |

## Legacy: saas-v1 Roadmap

→ Moved to [harkly-saas-v1-roadmap-archive.md](harkly-saas-v1-roadmap-archive.md) (historical reference)

Original 6-stage pipeline (Stages 0-6) was about the old Next.js/Vercel/Supabase stack. Superseded by HARKLY-18 MVP on SolidStart + Cloudflare.

---

## Reference

### Brand (all in `development/harkly/brand/`)
- Brand Bible: `brand-bible.md`
- Values: `values.md`
- Positioning: `positioning.md`
- Category Manifesto: `category-manifesto.md`
- TOV: `tov.md` (v3)
- Omnibar Primacy: `omnibar-primacy.md`
- UI Language: `ui-language-ru.md`
- Brand + Design Overview: `brand-and-design-overview.md`

### Design System (`nospace/design/harkly/`)
- Pencil: `harkly-ui.pen` (source of truth)
- Docs: README, foundations/, guidelines/, patterns/, components/
- Spatial rules: `harkly-spatial-interface-rules.md`

### Architecture
- **MVP (current):** `nospace/docs/research/harkly-mvp-architecture.md`
- **MVP Data Model:** `nospace/docs/research/harkly-mvp-data-model.md`
- **MVP API Spec:** `nospace/docs/research/harkly-mvp-api-spec.md`
- **MVP Copy Map:** `nospace/docs/research/harkly-mvp-copy-map.md`
- **MVP Build Plan:** `nospace/docs/research/harkly-mvp-build-plan.md`
- Old product architecture (EN): `architecture/harkly-product-architecture-en.md` (legacy)
- Old Spine process (RU): `architecture/harkly-spine-process-ru.md` (legacy)

### Research
- MVP research (9 files): `nospace/docs/research/harkly-research-*.md` + `harkly-eval-*.md`
- NotebookLM: `docs/research/notebooklm-research.md`
- LLM integration: `docs/research/llm-local-integration-research.md`
- Open APIs: `docs/research/open-apis/index.md`
