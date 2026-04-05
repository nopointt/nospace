# session-scratch.md
> Placeholder · Axis · 2026-04-05 · session 231
> Last processed checkpoint: #6

<!-- ENTRY:[2026-04-05]:CLOSE:[7]:contexter:contexter-gtm-launch [AXIS] -->
## 2026-04-05 — session 7 CLOSE Axis

**Decisions:**
- D-39: Artem (CPO ProxyMarket) = co-founder for GTM/marketing. Revenue share model.
- D-40: cdn.contexter.cc = R2 custom domain for public assets (video, knowledge hub)
- D-41: Knowledge hub at cdn.contexter.cc/public/artem/ — shared materials for co-founder

**Files changed:**
- `web/src/pages/Landing.tsx` — nav fix: replaced absolute centering with flex justify-between (Russian text overlap)
- `docs/cofounder-briefing-artem.md` — created: 11-section co-founder briefing (product, market, competitors, finmodel, GTM, design)
- `docs/artem/` — created: 29 files (MD + HTML) + index.html + convert.ts. Full knowledge hub.
- `nospace/docs/research/reddit-marketing-guide-smetnyov.md` — extracted from PDF: 13-chapter Reddit marketing guide (Smetnyov/Skyeng)

**Completed:**
- Nav overlap bug fixed and deployed to production
- Co-founder briefing document created (comprehensive, 11 sections)
- Knowledge hub set up: cdn.contexter.cc/public/artem/ with all 29 research files as HTML
- Reddit marketing guide extracted from PDF and added to hub
- Screencast video uploaded: cdn.contexter.cc/public/contexter-screencast.mp4
- Memory registered: reference_artem_knowledge_hub.md, project_contexter_artem_cofounder.md

**Opened:**
- W1-01: Apply copy audit (still pending, critical-path)
- LemonSqueezy approval still pending

**Notes:**
- cdn.contexter.cc configured via wrangler r2 bucket domain add (zone-id required)
- convert.ts uses `marked` library for MD→HTML batch conversion
- Reddit guide: algorithm formula score = log10(max(|up-down|, 1)) + t / 45000
