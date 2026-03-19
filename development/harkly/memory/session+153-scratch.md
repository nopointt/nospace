<!-- ENTRY:2026-03-18:CHECKPOINT:153:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — checkpoint 153 [Axis]

**Decisions:**
- Component library built inside Pencil as reusable nodes (not external file) — matches existing token doc pattern
- SpineProgress as segmented pill control: done/active/pending states via fill color
- Source badges use brand colors (Reddit #FF4500, HN #FF6600) with tinted bg — not Bauhaus primaries
- Badge/Count uses inverted (dark bg, light text) for contrast density signal

**Files changed:**
- Pencil `untitled.pen` — 17 reusable components created: Button ×5, Input ×2, Badge ×7, Card ×2, SpineProgress ×1
- `nospace/docs/research/open-apis/index.md` — created (background agent)
- `nospace/docs/research/open-apis/scraping-apis-for-devs.md` — created
- `nospace/docs/research/open-apis/public-apis-relevant.md` — created
- `nospace/docs/research/open-apis/scrapling-library.md` — created
- `nospace/development/harkly/memory/harkly-about.md` — Open APIs section + link added
- `nospace/development/tLOS/memory/tlos-about.md` — Open APIs section + link added
- `nospace/development/harkly/memory/product-use-cases.md` — Summary Matrix expanded with confirmed APIs per UC

**Completed:**
- Full Harkly component library in Pencil (17 reusable components)
- Open APIs research docs (4 files, Tavily + HN Algolia + Scrapling as key finds)
- L1 links in harkly-about.md and tlos-about.md
- Checkpoint #152

**In progress:**
- Screen design: Framing Studio or Research Canvas (user to decide next)

**Opened:**
- Design Framing Studio screen (UC-2/UC-3 entry point: PICO question input)
- Design Research Canvas screen (artifact view with spine progress)
- Omnibar component (not yet built — needed for infinite canvas nav)

**Notes:**
- Tavily API = AI-native search, no scraping needed → strong fit for Spine Ingestion step
- Scrapling (Python) = StealthyFetcher for App Store/Google Play, DynamicFetcher (Playwright) for JS-heavy
- UC-4 source list expanded: Twitter/X, LinkedIn, ORB Intelligence, Domainsdb, Clearbit + Scrapling
- All 17 Pencil components use variable references ($--accent-blue etc.) not hardcoded hex
- lib frame id: ejLN6, SpineProgress id: 1QdMm
