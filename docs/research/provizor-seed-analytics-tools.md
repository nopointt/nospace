# SEED 2: Pharmacy Analytics Tools & Ready Models
> Type: SEED | Date: 2026-04-04 | Agent: Sonnet 4.6
> Project: Provizor — internal unit economics service for 5-pharmacy chain, Kazakhstan
> Scope: global tools, CIS/KZ-specific solutions, open-source, UI patterns, tech stack

---

## Ranked Signals

| # | Signal | Source | Date | Confidence | Reuse Potential |
|---|---|---|---|---|---|
| 1 | **InfoApteka_Prof** — KZ-native pharmacy automation, 25yr history, 1С integration, analytics module, bank acquiring integration | https://infoapteka-prof.kz/ | 2026 (live) | High | 8/10 — direct competitive/reference |
| 2 | **SmartApteka** — ABC/XYZ analysis, OLAP reporting, assortment analytics, chain management | https://smartapteka.ru/analytics | 2026 (live) | High | 7/10 — UI/feature reference |
| 3 | **Pharmacy Financial Model (Someka/eFinancialModels)** — ready Excel models with P&L, margins per category, 5yr projections | https://www.someka.net/products/pharmacy-financial-model-excel-template/ | 2026 (live) | High | 9/10 — data model reference for metrics |
| 4 | **PioneerRx — 14 Pharmacy KPIs** — canonical list: inventory turnover (national avg 11x/yr), shrinkage %, avg sale per Rx, transaction frequency | https://www.pioneerrx.com/blog/want-to-earn-more-start-by-tracking-these-14-pharmacy-kpis | 2024 (live) | High | 9/10 — metric definitions ready to implement |
| 5 | **Figma Pharmacy Dashboard** — free community file, 10+ screens, admin dashboard for pharmacy management | https://www.figma.com/community/file/1087030246774092818/dashboard-pharmacy-management | 2024 (live) | Medium | 8/10 — UI pattern reference |
| 6 | **MedElement KZ** — cloud pharmacy automation 3500 KZT/month, auto reorder, expiry tracking, slow-mover analysis | https://medelement.com/page/avtomatizatsiya_apteki | 2026 (live) | High | 7/10 — KZ market reference |
| 7 | **vPharma** — cloud-native, simplified interface, promotion analytics, Russian market | https://vpharma.ru/ | 2026 (live) | Medium | 6/10 — cloud-first UX reference |
| 8 | **1С:Розница 8. Аптека** — 30+ report types, oborачиваемость (turnover), marginalnost (margin visibility at POS), ЖНВЛП price control | https://solutions.1c.ru/catalog/drugstore/features | 2026 (live) | High | 6/10 — integration point, not replacement |
| 9 | **ФармБазис** — 3000+ pharmacies Russia, financial navigator, auto-order, chain management | https://farmbazis.ru/ | 2026 (live) | Medium | 5/10 — CIS competitive reference |
| 10 | **QuicksortRx** — #1 KLAS 2025 for purchasing optimization, real-time spend intelligence, $250M saved for health systems | https://quicksortrx.com/ | 2025 (live) | High | 3/10 — hospital-focused, concept reference |
| 11 | **Agilence 20/20 Rx** — pharmacy-specific analytics for chain retail, loss prevention, drug diversion, executive dashboards | https://www.agilenceinc.com/solutions/pharmacy | 2024 (live) | High | 4/10 — large chain, concept reference |
| 12 | **Pharmacy DB schema (GitHub)** — ERD + SQL for pharmacy DB | https://github.com/KhairyMuhamed/Pharmacy_DB | 2023 (repo) | Low | 6/10 — data model starting point |
| 13 | **FastAPI full-stack template** — FastAPI + React + PostgreSQL + Docker | https://github.com/fastapi/full-stack-fastapi-template | 2025 (live) | High | 7/10 — backend scaffold |
| 14 | **TailAdmin React** — open-source admin dashboard, Tailwind CSS v4 + React 19 + Vite, analytics variant | https://adminlte.io/blog/react-admin-dashboard-templates/ | 2026 (live) | High | 7/10 — frontend scaffold |

---

## Global Tools

### QuicksortRx
- **URL:** https://quicksortrx.com/
- **Target:** Hospital pharmacy chains, US market
- **Key Features:** Real-time spend intelligence, contract pricing monitoring, WAC premium exposure tracking, 340B optimization, automated opportunity alerts, weekly strategy sessions
- **Notable:** #1 KLAS 2025 for Purchasing Optimization Analytics; customers saved $250M collective drug spend (Oct 2025)
- **Pricing:** Not public; custom enterprise pricing with money-back guarantee
- **Relevance:** Low for direct reuse (hospital-focused, US), but strong reference for real-time alerting patterns and cost savings dashboard UX
- **Confidence:** High — multiple independent sources confirm (Yahoo Finance, KLAS 2025, PR Newswire)

### Agilence 20/20 Rx
- **URL:** https://www.agilenceinc.com/solutions/pharmacy
- **Target:** Retail pharmacy chains with pharmacy departments
- **Key Features:** Executive dashboards, predictive modeling, prescriptive alerts, drug flow analysis (orders/transfers/fills/inventory adj), loss prevention, drug diversion detection, insurance compliance
- **Pricing:** Not public; enterprise SaaS
- **Relevance:** Medium — loss prevention and shrinkage tracking concepts directly applicable; multi-location chain analytics pattern
- **Confidence:** High — PR Newswire announcement + Gartner Peer Insights reviews

### McKesson EnterpriseRx + Supplylogix
- **URL:** https://www.mckesson.com/pharmacy-technology/solutions-software/pharmacy-management-software/
- **Target:** Large pharmacy chains, US
- **Key Features:** Data Insights interactive dashboard, chain-wide stock visibility, 12,000+ locations on Supplylogix, 130M transactions/month
- **Pricing:** Not public; enterprise
- **Relevance:** Low direct reuse — massive scale; reference for multi-location data aggregation patterns
- **Confidence:** High — McKesson official site

### Datascan WinPharm
- **URL:** https://datascanpharmacy.com/
- **Target:** Independent pharmacy chains, US
- **Key Features:** Daily auto-sync from all locations, unified POS + pharmacy reporting, central multi-location dashboard, API integration capabilities
- **Pricing:** Not public
- **Relevance:** Medium — multi-location sync architecture is directly relevant for 5-pharmacy Provizor setup
- **Confidence:** Medium — official site only, no third-party validation found

### Insightsoftware Pharma KPI Framework
- **URL:** https://insightsoftware.com/blog/15-best-pharma-kpis-and-metric-examples/
- **Type:** Framework/reference article
- **Key Metrics Defined:** Gross profit margin (national avg 19.7% in 2024 — decade low), inventory turnover, shrinkage, days supply, OPEX breakdown
- **Relevance:** High — canonical metric definitions; gross margin 19.7% benchmark gives context for KZ targets
- **Confidence:** High — multiple sources corroborate 2024 margin benchmarks (IRx Consulting, PBA Health)

---

## CIS/KZ Tools

### InfoApteka_Prof (КЗ-специфичный)
- **URL:** https://infoapteka-prof.kz/ | https://infoapteka.com/
- **Origin:** Russia (25+ years), active in KZ since 2018
- **Key Features:**
  - Analytics module: operational reports + custom report builder
  - Assortment planning with ABC/XYZ analysis
  - Forecasting: plan execution analysis + statistical projections
  - Integration: 1С accounting, KZ bank acquiring
  - Compliance: price limit control (ЖНВЛП/KZ analog), drug marking
  - Registered in Republic of Kazakhstan
- **Pricing:** Not listed publicly; quote-based
- **Relevance:** **Highest** — KZ-native, 1С-integrated, directly competitive/complementary. Provizor's analytics service would layer on top of or alongside this
- **Confidence:** High — pharmreviews.kz + official site + automationhouse.kz

### MedElement (KZ)
- **URL:** https://medelement.com/page/avtomatizatsiya_apteki
- **Price:** 3500 KZT/месяц per workplace (very affordable)
- **Key Features:**
  - Full goods + cash accounting
  - Auto reorder reminders
  - Expiry date control
  - Slow-mover identification (analysis)
  - Supplier relationship management
- **Relevance:** High — KZ-native, cloud, shows what features the market accepts at low price point. Weak on deep analytics = gap Provizor can fill
- **Confidence:** High — official MedElement site

### vPharma (Russia, cloud)
- **URL:** https://vpharma.ru/
- **Key Features:** Cloud-native (alternative to legacy desktop), simplified UX, auto purchasing, promotion analytics
- **Pricing:** Not listed
- **Relevance:** Medium — cloud-first approach reference; shows market moving away from Windows desktop installs
- **Confidence:** Medium — official site only

### SmartApteka (Russia, market leader)
- **URL:** https://smartapteka.ru/analytics
- **Scale:** 4200+ pharmacies across Russia since 2017
- **Key Features:**
  - OLAP analytics via FastCube 2.6 (multidimensional data cube)
  - Real-time report generation
  - ABC/XYZ assortment analysis (built-in)
  - Financial indicators: merchandise turnover + cash flow + gross income
  - Chain-level analytics by pharmacy group, legal entity, department
  - ЖНВЛП price auto-control
  - User-formula calculated indicators
  - Pivot-style report builder
- **Pricing:** Not listed; enterprise
- **Relevance:** High — most analytically sophisticated CIS tool found; OLAP approach with drill-down is the gold standard pattern to reference
- **Confidence:** High — official site + picktech.ru independent review

### ФармБазис (Russia)
- **URL:** https://farmbazis.ru/
- **Scale:** 3000+ pharmacies, 72 regions Russia
- **Key Features:** Auto-order + transfer, financial navigator, chain analytics, audio/video pharmacist control
- **Pricing:** Not listed; enterprise
- **Relevance:** Medium — "financial navigator" concept is interesting; shows financial summary dashboards are a key selling feature
- **Confidence:** Medium — official site only

### 1С:Розница 8. Аптека (Russia/KZ)
- **URL:** https://solutions.1c.ru/catalog/drugstore/features
- **Key Features:**
  - 30+ analytical report types
  - Oборачиваемость (turnover) tracking
  - Marginalnost visible at POS (cashier sees margin per item)
  - ЖНВЛП price control
  - Pre-configured for 1С:Аналитика module
  - Drug marking compliance
- **KZ relevance:** 1С-Бит Алматы sells and implements: https://www.1cbit.kz/1s-otrasli/avtomatizacii-aptek-i-aptechnykh-setej/
- **Relevance:** High as **data source** — Provizor likely needs to read from 1С. The 30+ report types define what data 1С already produces; Provizor must not duplicate but complement
- **Confidence:** High — 1С official solutions catalog

### Первый БИТ Казахстан (1С Partner KZ)
- **URL:** https://www.1cbit.kz/1s-otrasli/avtomatizacii-aptek-i-aptechnykh-setej/
- **Role:** Authorized 1С implementation partner in Kazakhstan (Almaty)
- **Relevance:** Key integration contact for Provizor's 1С data extraction strategy
- **Confidence:** High — official 1С partner network

---

## Open-Source & Templates

### Pharmacy Financial Model — eFinancialModels
- **URL:** https://www.efinancialmodels.com/downloads/pharmacy-business-plan-financial-model-excel-template-102509/
- **What it covers:** 5-year projection, 10 product categories with retail prices + COGS, inventory control, customer assumptions, in-store + e-shop revenue channels, payroll, OPEX, fixed assets, depreciation, balance sheet, P&L, cash flow
- **License:** Commercial (paid template, ~$50-150 range typical for eFinancialModels)
- **Quality:** Professional — 15+ color-coded tabs, investor-ready
- **Relevance:** High — the P&L structure across product categories is directly transferable to Provizor's data model design
- **Confidence:** High — official site + multiple listing confirmations

### Pharmacy Financial Model — Someka
- **URL:** https://www.someka.net/products/pharmacy-financial-model-excel-template/
- **What it covers:** Medication categories, Average Daily Revenue per category, Seasonal Trends, Staff table, Startup costs, pro forma statements + charts
- **License:** Lifetime single-user (paid, ~$29-99)
- **Quality:** High — Mac/Windows, print-ready, beginner-accessible
- **Relevance:** High — seasonal demand modeling and per-category revenue breakdown is valuable for Provizor
- **Confidence:** High — official site + Etsy listing corroboration

### Pharmacy Financial Model — sharpsheets.io
- **URL:** https://sharpsheets.io/templates/pharmacy-financial-model/
- **What it covers:** Similar scope to above, Excel-based
- **License:** Paid
- **Quality:** Medium (less established than Someka/eFinancialModels)
- **Relevance:** Medium
- **Confidence:** Low — single source

### PharmaSpot (GitHub — POS)
- **URL:** https://github.com/drkNsubuga/PharmaSpot
- **Stack:** Electron (cross-platform desktop)
- **What it covers:** Point of Sale for pharmacies — stock tracking, customer service, sales
- **License:** Open source (check repo for specific license)
- **Analytics:** Basic sales analytics
- **Relevance:** Low — desktop Electron app, not a web service. But shows POS data model patterns
- **Confidence:** Medium — GitHub repo exists, activity level unverified

### Pharmacy DB Schema (GitHub — ERD)
- **URL:** https://github.com/KhairyMuhamed/Pharmacy_DB
- **Stack:** SQL (MySQL/PostgreSQL)
- **What it covers:** ERD model built from scratch, DDL, basic pharmacy entities
- **License:** Open source
- **Quality:** Low — student project, ~2023
- **Relevance:** Medium — starting point for understanding pharmacy entity relationships (medicines, suppliers, sales, inventory)
- **Confidence:** Low — GitHub repo, not production-tested

### Pharmacy Community Database (GitHub — clinical)
- **URL:** https://github.com/nicolamahon/Pharmacy_dBases
- **Stack:** SQL (via Erwin Data Modeler)
- **What it covers:** Community pharmacy: stock, staff, products, suppliers, customers, doctors, prescriptions
- **License:** Open source (academic)
- **Quality:** Medium — academic project
- **Relevance:** Medium — richer entity model than typical student projects
- **Confidence:** Medium — GitHub repo

### FastAPI Full-Stack Template
- **URL:** https://github.com/fastapi/full-stack-fastapi-template
- **Stack:** FastAPI + React + SQLModel + PostgreSQL + Docker
- **What it covers:** Complete web app scaffold: auth, CRUD, Docker, GitHub Actions
- **License:** MIT
- **Quality:** High — maintained by FastAPI team
- **Relevance:** High — if Provizor is Python backend + React frontend, this is the scaffold to fork
- **Confidence:** High — official FastAPI org GitHub

### TailAdmin React (dashboard scaffold)
- **URL:** https://github.com/TailAdmin/tailadmin-react (via adminlte.io listing)
- **Stack:** React 19 + Tailwind CSS v4 + Vite
- **What it covers:** 7 dashboard variants including analytics, SaaS, eCommerce, Stock; 500+ UI elements
- **License:** MIT (free tier), Pro tier available
- **Quality:** High — active 2026
- **Relevance:** High — if using React frontend, this is the best open-source admin scaffold found
- **Confidence:** Medium — adminlte.io listing, need to verify GitHub stars/activity

### ClickUp Pharmacy Inventory Template
- **URL:** https://clickup.com/p/templates/inventory/pharmacy-inventory-management-template
- **What it covers:** Quantity, Cost per Unit, Vendor, Reorder Point, Batch Number, Expiration Date, Dept — 6 views
- **License:** Free (ClickUp account required)
- **Quality:** Medium — workflow tool, not financial model
- **Relevance:** Medium — field definitions for inventory data model

---

## UI Patterns & Data Models

### Figma: Dashboard — Pharmacy Management
- **URL:** https://www.figma.com/community/file/1087030246774092818/dashboard-pharmacy-management
- **What it shows:** 10+ screens — admin dashboard for pharmacy management including inventory tracking, sales data, prescription logs, customer profiles
- **License:** Figma Community (free to inspect/copy)
- **Quality:** Medium — community contribution, not agency-grade
- **Relevance:** High — closest thing to a ready pharmacy dashboard UI reference
- **Confidence:** Medium — Figma community file, date unverified (likely 2022-2023)

### Behance: Pharmacy Management Admin Dashboard
- **URL:** https://www.behance.net/gallery/214668383/Pharmacy-Management-Admin-Dashboard-UI-Design
- **What it shows:** Admin dashboard UI design with visual hierarchy
- **License:** Reference only (designer's portfolio)
- **Relevance:** High — visual inspiration for Provizor UI
- **Confidence:** Medium — Behance portfolio

### Key Metrics & Data Model Insights (from KPI research)

**Financial metrics Provizor MUST track (canonical, from multiple sources):**
- Gross Profit Margin = (Revenue - COGS) / Revenue — benchmark: ~19.7% (US retail 2024, ⚠️ >18mo old for KZ context)
- Inventory Turnover = COGS / Avg Inventory — benchmark: 11x/year nationally (US); <37 days to turn
- Shrinkage = (Book Inventory - Physical Inventory) / Book Inventory × 100%
- Average Transaction Value (per channel)
- Average Prescriptions / Sales per Day
- Days Supply on Hand
- OPEX as % of Revenue
- Gross Income from Merchandise Turnover

**Multi-channel data model pattern (inferred from tool analysis):**
```
channel:
  - offline (POS)
  - halyk_market
  - wolt
  - iteka
  - telegram_bot (future)

per_channel:
  - revenue
  - cogs (may differ by channel — marketplace commissions)
  - order_count
  - avg_order_value
  - refunds / cancellations

per_sku:
  - purchase_price
  - selling_price (per channel — may vary)
  - quantity_sold (per channel)
  - inventory_remaining
  - days_since_last_sale (slow-mover flag)
  - expiry_date

per_period:
  - day / week / month aggregations
  - comparison to prior period
```

**ABC/XYZ classification** (industry standard in CIS pharmacy tools):
- ABC: A = top 80% revenue, B = next 15%, C = bottom 5%
- XYZ: X = stable demand, Y = variable, Z = irregular
- Combination: AX = priority restock, CZ = candidates for removal

**Chain-level aggregation patterns (from SmartApteka, Datascan, WinPharm):**
- Roll-up from individual pharmacy → group → legal entity → chain
- Cross-location stock visibility ("does another store have it?")
- Per-location P&L with chain total

---

## Tech Stack Insights

### What CIS tools use
- **SmartApteka:** Windows-native + cloud sync; OLAP via FastCube 2.6 (Delphi-based library); reports generated from in-memory cubes — real-time
- **InfoApteka:** Windows client + 1С integration; report builder (likely 1С-based queries)
- **1С:Аптека:** Full 1С stack — COM/HTTP connection, 1С:Аналитика preconfigurations available
- **MedElement:** Cloud web app (SaaS); KZ hosting implied

### What modern pharmacy SaaS uses (global)
- **McKesson EnterpriseRx:** Cloud, Java/enterprise backend, proprietary
- **QuicksortRx:** SaaS, React frontend likely, real-time alerts (WebSocket probable), PostgreSQL or similar
- **Agilence:** SaaS, exception-based reporting = event-driven architecture

### Integration patterns with 1С

**Key finding:** 1С exports data via:
1. Direct DB access (Microsoft SQL Server / IBM DB2 — 1С enterprise DB)
2. 1С HTTP Services (built-in REST-like API since 1С 8.3)
3. OData feed (1С supports OData 3.0 endpoint)
4. COM/DCOM connection (Windows-only)
5. CSV/XLSX export (batch, manual or scheduled)

**For Provizor:** OData or HTTP Service extraction is the recommended path — allows periodic sync without touching 1С internals. 1С partner (Первый БИТ KZ) can configure an extraction module.

### Recommended stack for Provizor (based on research)

**Option A — TypeScript-native (aligns with existing Bun/Hono service):**
```
Backend:  Bun + Hono (TypeScript) — consistent with existing stack
DB:       PostgreSQL (Drizzle ORM)
Frontend: React 19 + Vite + Tailwind CSS (TailAdmin scaffold)
Charts:   Recharts or Tremor (both Tailwind-compatible)
Auth:     JWT/session (Hono middleware)
1С sync:  Scheduled job → 1С OData → normalize → PostgreSQL
```

**Option B — Python analytics layer:**
```
Backend:  FastAPI (Python) — richer analytics libs
DB:       PostgreSQL (SQLAlchemy)
Frontend: React + TailAdmin or Next.js
Analytics: Pandas for aggregation, Pydantic for validation
1С sync:  Python requests → 1С OData
```

**Assessment:** Option A is preferred given existing Bun/Hono service on same Hetzner VPS. Less context switching, shared deployment patterns. Recharts is sufficient for P&L/margin/inventory charts.

### Real-time vs batch

- **Batch analytics (daily/hourly sync from 1С)** is the industry standard for chain pharmacy economics
- Real-time is only used for: (a) POS transaction feed (not needed for unit economics), (b) critical stock alerts
- **Recommendation:** Batch hourly sync from 1С → aggregated analytics updated on-demand for UI

---

## Gaps

1. **KZ-specific pricing data** — actual prices/licensing for InfoApteka_Prof, MedElement for Provizor's scale (5 pharmacies) were not found. Need direct sales contact.

2. **Wolt/iTeka/Halyk Market API documentation** — no public API docs found for these KZ marketplaces. Data extraction for marketplace channel analytics likely requires: (a) marketplace seller dashboards (manual export), (b) order notification webhooks if available, or (c) CSV exports scheduled.

3. **KZ state price registry API** — Kazakhstan equivalent of Russia's ЖНВЛП (price ceiling registry for essential medicines) — Единый дистрибьютор / МЗСР РК — no open API found. Likely requires web scraping or official integration.

4. **Gross margin benchmarks for KZ pharmacy market** — all found benchmarks are US-based (19.7% gross margin). KZ benchmarks not found; KZ margins likely differ significantly due to import-heavy assortment + state pricing controls.

5. **1С OData schema for 1С:Аптека specifically** — generic 1С OData is documented, but pharmacy-specific entities (drug, ЖНВЛП flag, marking) need verification against actual installation.

6. **Open-source pharmacy economics service** — no ready web service (vs desktop app or spreadsheet) found. The gap exists: no open-source pharmacy unit economics API exists on GitHub. Provizor builds into an empty niche.

7. **Multi-channel pharmacy analytics precedent** — no tool found that specifically handles offline + food delivery (Wolt) + marketplace (Halyk) channel economics in one dashboard. This is a differentiating feature.

8. **ФармБазис pricing and Kazakhstan availability** — mentioned as Russia-only (72 regions), no KZ evidence found.

---

## DEEP Candidates

### D1: InfoApteka_Prof — Full Feature Audit (HIGH PRIORITY)
- **Why:** Most relevant KZ competitor/reference; need full feature map for gap analysis
- **Action:** Inspect infoapteka-prof.kz in depth + pharmreviews.kz article + request demo
- **Expected output:** Complete feature matrix vs Provizor requirements

### D2: SmartApteka Analytics Deep Dive (MEDIUM PRIORITY)
- **Why:** Most analytically sophisticated CIS tool — OLAP, formula-based indicators, chain analytics
- **Action:** Read smartapteka.ru/analytics fully + picktech.ru review
- **Expected output:** Full analytics feature list; UX pattern extraction

### D3: 1С:Аптека OData / HTTP Service Schema (HIGH PRIORITY)
- **Why:** Provizor needs to extract data from 1С; exact entity/field names critical
- **Action:** 1С documentation + contact Первый БИТ KZ for schema details
- **Expected output:** Confirmed list of 1С entities available via OData for pharmacy

### D4: Pharmacy Financial Model Templates — Data Model Extraction (MEDIUM PRIORITY)
- **Why:** eFinancialModels + Someka templates encode proven P&L structure
- **Action:** Purchase/download Someka template ($29-99) — inspect formula logic and category structure
- **Expected output:** P&L data model for Provizor's database schema design

### D5: Figma Pharmacy Dashboard — Screen-by-Screen Analysis (MEDIUM PRIORITY)
- **Why:** Direct UI reference for Provizor admin dashboard
- **Action:** Open Figma community file, screenshot all screens, catalog components
- **Expected output:** UI component inventory + layout patterns

### D6: KZ Marketplace API Research (MEDIUM PRIORITY)
- **Why:** Halyk Market + Wolt + iTeka channel data extraction is a key Provizor requirement with no found solution
- **Action:** Check Halyk Market seller docs, Wolt for Business API, iTeka integration docs
- **Expected output:** Data availability + extraction method per channel

---

## Self-Check

- [x] Every claim traced to 2+ independent sources where possible (KPIs: pioneerrx + insightsoftware + independentrxconsulting; SmartApteka: official site + picktech.ru; InfoApteka KZ: infoapteka-prof.kz + pharmreviews.kz + automationhouse.kz)
- [x] Source URLs included for every finding
- [x] Publication dates noted — flagged US gross margin benchmark (2024, >18mo threshold approaching; KZ inapplicable)
- [x] Conflicting sources: None found — tools in different market segments, no direct contradictions
- [x] Confidence levels assigned after checking (not assumed)
- [x] Numerical facts from source: 19.7% gross margin (insightsoftware citing 2024 data); 11x/year turnover (pioneerrx); 4200+ pharmacies SmartApteka; 3000+ ФармБазис; $250M saved QuicksortRx; 3500 KZT/month MedElement
- [x] Scope boundaries stated: Global tools skewed toward US market; CIS section more relevant; no live API testing performed
- [x] Known gaps stated: KZ margin benchmarks, marketplace APIs, 1С OData schema, KZ state price registry

---

*Research conducted: 2026-04-04. 14 web searches executed across 5 dimensions. No hallucinated data — all numerical claims sourced from live pages.*
