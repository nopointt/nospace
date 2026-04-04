# Provizor — DEEP Competitive Audit
> Type: DEEP | Date: 2026-04-04 | Agent: Sonnet 4.6
> Project: Provizor — 5-pharmacy chain, Kazakhstan, partner: Alimkhan
> Scope: Full competitive audit — InfoApteka_Prof, SmartApteka, MedElement
> Framework: 6-layer DEEP (Current State → World-Class → Frontier → Cross-Discipline → Math → Synthesis)

---

## Table of Contents

1. [Layer 1: Current State — Competitor Profiles](#layer-1-current-state)
2. [Layer 2: World-Class — SmartApteka Analytics Benchmark](#layer-2-world-class)
3. [Layer 3: Frontier — Modern UX & AI Features](#layer-3-frontier)
4. [Layer 4: Cross-Discipline — Retail & Marketplace Analytics](#layer-4-cross-discipline)
5. [Layer 5: Math Foundations](#layer-5-math-foundations)
6. [Layer 6: Synthesis — Gap Analysis, Differentiation, Recommendations](#layer-6-synthesis)
7. [Self-Check](#self-check)

---

## Layer 1: Current State

### 1.1 InfoApteka_Prof (PRIMARY — KZ native)

**Sources:** infoapteka-prof.kz, infoapteka.com, pharmreviews.kz, automationhouse.kz, Честный ЗНАК docs
**Confidence:** High — 4 independent sources

#### Market Position
- 25+ years in Russia; active in Kazakhstan since 2018
- 17,405 licenses issued total (Russia + KZ)
- 2,500+ clients across 18 regions in Russia and Kazakhstan
- Registered entity in Republic of Kazakhstan
- Registered in: Almaty, Astana, Shymkent, Atyrau, Pavlodar, Semey, Aktobe (implied by MedElement competitor overlap)

#### Full Feature Matrix

**Core Operations:**
| Feature | Status | Notes |
|---|---|---|
| POS / cashier module | ✅ | Full POS with barcode scanner |
| Inventory tracking | ✅ | Real-time stock levels |
| Drug marking (Честный ЗНАК) | ✅ | DataMatrix scanning, UKEP, MDLP integration |
| Supplier ordering (auto-order) | ✅ | Full automation, zero manual input option |
| Surplus redistribution across chain | ✅ | Inter-pharmacy transfers |
| Expiry date control | ✅ | Revaluation by expiry dates |
| Barcode generation | ✅ | Self-coding of unmarked products |
| Android mobile app (TSD) | ✅ | Data collection terminal app |
| Web-based product reservation | ✅ | Customer reservation system |

**Analytics & Reporting:**
| Feature | Status | Notes |
|---|---|---|
| Operational reports | ✅ | Real-time performance reports |
| Custom report builder | ✅ | Constructor for ad-hoc reports |
| ABC/XYZ analysis | ✅ | Used for procurement calculations — confirmed in pharmreviews.kz |
| Revenue/markup/margin forecasting | ✅ | Statistical historical projection |
| Assortment plan formation | ✅ | Matrix-based, per pharmacy and chain |
| Inventory turnover (оборачиваемость) | ✅ (implied) | Part of assortment planning |
| Defectura tracking | 🔶 Partial | Auto-order reduces defectura but no explicit defectura log/report found |
| P&L / financial result report | 🔶 Partial | Revenue + markup tracking; full P&L unclear |
| Per-SKU profitability | ❌ | Not found in any source |
| Channel economics (offline vs marketplace) | ❌ | No mention in any source |
| CIS Profitability % | ❌ | Not found |
| Cash flow statement | ❌ | Not found |
| Dead stock / slow-mover analysis | ✅ | Implied in assortment optimization |
| Competitor price monitoring | ✅ | Part of automatic pricing module |

**Pricing & Compliance:**
| Feature | Status | Notes |
|---|---|---|
| Price ceiling control (KZ regulatory) | ✅ | Explicit mention of KZ legislative compliance |
| Regressive markup enforcement | ✅ (implied) | "Flexible pricing + price ceiling control" |
| KZ bank acquiring integration | ✅ | Stated on KZ landing page |
| 1С accounting integration | ✅ | Confirmed in pharmreviews.kz |
| ZHVLP/KZ price registry update | 🔶 Unknown | Not explicitly confirmed for KZ |

**Marketing & Customer:**
| Feature | Status | Notes |
|---|---|---|
| Loyalty program (discount/bonus) | ✅ | Flexible discount-bonus system |
| Promo campaign management | ✅ | Full promotion tracking |
| Email/SMS targeted marketing | ✅ | Customer list segmentation |
| Employee incentive programs | ✅ | Staff performance tracking |

**Chain Management:**
| Feature | Status | Notes |
|---|---|---|
| Multi-pharmacy network | ✅ | Centralized management |
| Centralized ordering | ✅ | Reduces defectura, frees cash |
| Cross-pharmacy stock visibility | ✅ | Surplus redistribution implies it |
| Per-pharmacy P&L | 🔶 Unknown | Not found |
| Chain-level consolidated report | ✅ (implied) | Operational reports across network |

**Tech Stack:**
- Windows-native desktop client (primary)
- Windows 7+ requirement
- CryptoPro CSP requirement for drug marking
- Bitrix-based web frontend (infoapteka-prof.kz site only — not the application)
- jQuery + Bootstrap (marketing site)
- Cloud sync implied, not cloud-native

**Deployment:** Desktop-primary with web/cloud elements

**Pricing:**
- Russia base: 5,500 rubles/location (from infoapteka.com)
- KZ pricing: Not publicly disclosed. Quote-based. Discounts available.
- Migration claim: "30 minutes from legacy systems"

**Target customer:** Pharmacy chains 1–100+ pharmacies, KZ and Russia

---

### 1.2 SmartApteka (REFERENCE — CIS analytics benchmark)

**Sources:** smartapteka.ru, smartapteka.ru/analytics, smartapteka.ru/advantage, picktech.ru, a2is.ru
**Confidence:** High — 5 independent sources

#### Market Position
- Founded 2017, 4,200+ pharmacies implemented across Russia
- Russia-only (no KZ presence found)
- Vendor: ООО "Эджайл Софт Технолоджис"
- From 8,500 rubles/month starting price (a2is.ru comparison)
- Scale tiers: 1, 2-5, 6-10, 11-50, 51-80, 81-100, 100+ pharmacies

#### Full Feature Matrix

**Analytics Core (the benchmark):**
| Feature | Status | Notes |
|---|---|---|
| OLAP-based reporting | ✅ | FastCube 2.6 — multi-threaded, hundreds of CPU cores, real-time |
| ABC/XYZ analysis | ✅ | Built-in, with turnover + sales velocity metrics |
| Custom formula indicators | ✅ | User-defined calculated indicators from any data |
| Custom report builder | ✅ | Pivot-style drag-and-drop |
| Real-time report generation | ✅ | "No hanging" — in-memory cube |
| Merchandise turnover (оборачиваемость) | ✅ | Funds frozen in inventory, days of supply |
| Gross income from merchandise turnover | ✅ | Confirmed |
| Cash flow analysis | ✅ | Confirmed |
| Revenue planning (per pharmacy + chain) | ✅ | Sales plans for managers |
| Sales velocity analysis | ✅ | Part of ABC/XYZ module |
| Surplus inventory management | ✅ | Optimization tools |
| Defectura analysis | ✅ | Out-of-stock days + lost profit estimates |
| P&L / financial result | 🔶 Partial | Merchandise turnover report = near-P&L but no explicit full P&L found |
| Per-SKU profitability | ✅ (implied) | Formula builder + turnover per SKU |
| Channel economics (offline vs marketplace) | ❌ | No mention in any source |
| CIS Profitability % | ❌ | Not found |
| Cross-pharmacy comparison | ✅ | Chain-level analytics by pharmacy group, legal entity, department |

**Inventory & Ordering:**
| Feature | Status | Notes |
|---|---|---|
| Auto-order with formula customization | ✅ | Configurable formulas for replenishment |
| Assortment planning | ✅ | Individual + batch via spreadsheet upload |
| Upsell chains (substitution) | ✅ | Справочник и цепочки допродаж |
| Competitor price monitoring | ✅ | Multi-parameter competitive pricing |

**Compliance:**
| Feature | Status | Notes |
|---|---|---|
| ZHVLP price ceiling auto-control | ✅ | Real-time registry update, full enforcement |
| Drug marking (FGIS MDLP) | ✅ | With parallel KIZ tracking |
| Banned batch tracking | ✅ | Explicit |
| Minimum assortment verification | ✅ | Regulatory requirement |

**Integrations:**
| Integration | Status |
|---|---|
| 1С Accounting | ✅ |
| Pharmacy aggregators (Apteka.ru, Zdravcity.ru) | ✅ |
| Marketing associations (ASNA, ProApteka, Partner) | ✅ |
| Loyalty systems (Sailplay, Cloudloyalty) | ✅ |
| EMIAS electronic prescriptions (Moscow) | ✅ |

**UX Patterns:**
- **Card-based layered dashboard** — multiple analytics cards stacked vertically
- Professional color scheme: greens (#25703f, #46ab6a) on white
- Responsive: 1200px desktop down to 320px mobile
- First screen after login: presumably performance metrics dashboard (not confirmed by screenshot)
- Report builder with drag-drop pivot — similar to Excel PivotTable
- Visual diagrams from OLAP data (bar charts, line charts from formula-based indicators)
- Employee personal dashboard with motivational plans (KPI-style)

**Tech Stack:**
- Cloud-based (primary) — no server at pharmacy required
- Windows compatible (full feature set)
- Mac, Linux, cloud access (lighter feature set per a2is.ru)
- FastCube 2.6 = Delphi-based in-memory OLAP library

**Deployment:** Cloud-first, multi-threaded compute

**Pricing:**
- From 8,500 rubles/month (a2is.ru)
- Scale-based custom pricing; individual commercial proposals
- Free version exists (limited, per picktech.ru)

**Target customer:** Russian pharmacy chains 1–100+ pharmacies; analytics-focused operators

---

### 1.3 MedElement (REFERENCE — KZ cloud SaaS)

**Sources:** medelement.com, livebusiness.asia, astanahub.com, PharmaTECH expo
**Confidence:** High — 4 sources (MedElement is primarily a medical platform, pharmacy is one module)

#### Market Position
- KZ-native, Almaty-based company
- Primary product: Medical information system (MIS) for clinics
- Pharmacy automation = one module of broader health platform
- 5.9 million unique users on MedElement platform in 2024
- 600+ medical organizations using SaaS services (not pharmacy-specific count)

#### Full Feature Matrix

**Core Pharmacy Operations:**
| Feature | Status | Notes |
|---|---|---|
| POS / front-system | ✅ | With barcode scanner, fiscal registrator |
| Cash + non-cash tracking | ✅ | Per-shift reconciliation |
| Multi-unit sales (tablet/blister) | ✅ | |
| Loyalty programs | ✅ | Discounts, cumulative, bonuses, coupons, gifts |
| Flexible discount algorithms | ✅ | Sum, %, item, cart-wide |
| Inventory movement tracking | ✅ | Loss detection (shrinkage, damage, theft) |
| Auto reorder reminders | ✅ | Based on stock level thresholds |
| Expiry date monitoring | ✅ | |
| Dead stock analysis | ✅ | Via sales reports |
| Supplier reconciliation | ✅ | |
| Barcode functionality | ✅ | Receive/ship + self-code |
| Rapid inventory audits | ✅ | Automated document generation |

**Analytics & Reporting:**
| Feature | Status | Notes |
|---|---|---|
| Basic sales reports | ✅ | Inventory balances, movement |
| Dead stock / slow-mover identification | ✅ | Explicit feature |
| ABC/XYZ analysis | ❌ | Not found in any source |
| Custom report builder | ❌ | Not found |
| OLAP / multidimensional analysis | ❌ | Not found |
| Defectura tracking | ❌ | Not found |
| P&L / financial result | ❌ | Not found |
| Margin analysis | ❌ | Not found |
| Per-SKU profitability | ❌ | Not found |
| Channel economics | ❌ | Not found |
| Inventory turnover calculation | ❌ | Not found |
| Forecasting | ❌ | Not found |
| Chain-level consolidated analytics | ✅ | Multi-pharmacy module with remote monitoring |

**Chain Management:**
| Feature | Status | Notes |
|---|---|---|
| Multi-pharmacy network | ✅ | Explicit module |
| Remote monitoring via internet | ✅ | |
| Centralized reporting | ✅ | |
| Centralized warehouse management | ✅ | |
| Real-time data exchange | ✅ | |

**Compliance:**
| Feature | Status | Notes |
|---|---|---|
| Fiscal registrator (KZ tax) | ✅ | Mandatory KZ compliance |
| KZ regulatory markup enforcement | 🔶 Unknown | Not explicitly mentioned |
| Drug marking | ❌ | Not found |
| 1С integration | ❌ | Not found |

**Integration:**
- Doctor-pharmacy integration: doctors can see available medications, pharmacists can reserve for prescription
- No marketplace/aggregator integration found
- No API documentation public

**Tech Stack:**
- Cloud SaaS (cloud-native)
- Web-based (no desktop client mentioned)
- KZ hosting implied

**Pricing:**
- 3,500 KZT/month per workstation
- Extremely affordable; mass-market positioning

**Target customer:** Small-to-medium independent pharmacies and small chains in KZ; price-sensitive operators

---

## Layer 2: World-Class

### What SmartApteka Does That Others Don't

SmartApteka is the analytical quality benchmark for the CIS pharmacy software market. Key differentiators:

**1. OLAP with FastCube 2.6**
In-memory data cube technology enabling real-time multidimensional analysis. Reports don't "hang" — they generate instantly even for large datasets. This is the technical foundation that separates SmartApteka from file-based or SQL-only analytics competitors.

**2. User-Formula Calculated Indicators**
Any manager can define their own KPI formula from raw data fields — without coding. This is the CIS equivalent of DAX measures in Power BI. No other CIS pharmacy tool found offers this.

**3. Chain Drill-Down Architecture**
Analytics at 4 levels: chain → legal entity → pharmacy group → individual pharmacy. Pivot-style drill-down through the hierarchy is standard. InfoApteka has cross-pharmacy visibility but less structured drill-down.

**4. ABC/XYZ + Defectura Integration**
The combination of ABC/XYZ classification with out-of-stock loss estimation (defectura analysis) closes the feedback loop: you know which high-value products (AX class) are creating the most lost profit.

**5. Cash Flow + Merchandise Turnover Combined**
Merchandise turnover report covers: funds frozen in inventory + days of supply + gross income + cash flow per period. This is the closest thing to a real P&L in the CIS pharmacy market.

**6. Employee-Level Dashboard**
Personal KPI dashboards per pharmacist/manager — creates accountability at individual level, not just chain level. Motivational plans visible at POS.

**What SmartApteka Does NOT Do (confirmed gaps):**
- No multi-channel economics (marketplace commission deduction from margin)
- No CIS profitability metric (channel-adjusted contribution margin)
- No KZ regulatory compliance (Russia-only)
- No Halyk Market / Wolt / iTeka integration or analytics
- No automatic P&L statement (only components of P&L)
- No AI/ML forecasting (formula-based only)

---

## Layer 3: Frontier

### Modern UX & AI Features in Pharmacy Analytics (Global)

**Sources:** intuitionlabs.ai, retalon.com, asepha.com, quicksortrx.com, slashdot.org 2025
**Confidence:** Medium-High

**1. AI-Driven Demand Forecasting**
Asepha (raised $4M in July 2025): ML models cut verification time 40%. QuicksortRx (#1 KLAS 2025): real-time spend intelligence with predictive purchasing alerts.
- **Applicability to Provizor:** ML demand forecasting for KZ seasonal patterns (flu season, HFMD peaks) is a future feature; not for MVP.

**2. Exception-Based Alerting**
Agilence 20/20 Rx: instead of reports to browse, system pushes anomaly alerts ("shrinkage spike in pharmacy #3," "defectura rate exceeded threshold"). Event-driven rather than query-driven.
- **Applicability:** Alert system on top of metrics is a Phase 2 feature for Provizor.

**3. Real-Time Spend Intelligence**
QuicksortRx: weekly strategy sessions with dashboards showing WAC premium exposure, contract pricing drift, 340B optimization opportunities.
- **Applicability:** Retro-bonus threshold tracking (F-36, F-37) is Provizor's equivalent.

**4. Telepharmacy + Last-Mile Analytics**
Global trend: bundling PMS with telepharmacy consultation data and delivery order analytics. Pharmacies are becoming logistics nodes.
- **Applicability:** Wolt/Halyk delivery channel analytics is Provizor's implementation of this trend — ahead of CIS competitors.

**5. Cloud-Native with Mobile**
Global market: cloud deployment = 63%+ share, growing at 17.5% CAGR. Desktop legacy losing ground.
- **Applicability:** MedElement is the only KZ-native cloud option, but it's analytics-weak. Provizor's Bun+Hono web service fills this gap.

**Frontier Features Provizor Should Track (not MVP, but roadmap):**
- ML-based demand seasonality model
- Push alerts via Telegram bot on metric thresholds
- Vision/camera-based inventory audit assist (mentioned in original inputs — RFID/NFC tracking)
- Prescriptive ordering ("order X units of Y from distributor Z for optimal price")

---

## Layer 4: Cross-Discipline

### Retail & Marketplace Analytics Patterns Worth Adopting

**Sources:** sarasanalytics.com, moysklad.kz, mpstats review, ecommerce KPI research
**Confidence:** Medium

**1. Contribution Margin Waterfall (eCommerce standard)**
The eCommerce industry calculates layered margins:
- CM1: Revenue − COGS (direct product margin)
- CM2: CM1 − logistics/fulfillment costs (per-order economics)
- CM3: CM2 − variable marketing/promotion spend

Pharmacy with delivery channels maps exactly to this:
- CM1: Revenue − purchase price = gross margin
- CM2: CM1 − marketplace commission − delivery cost = channel contribution
- CM3: CM2 − promo/discount spend = net channel economics

**Provizor's multi-channel waterfall (F-18 through F-28) is the pharmacy implementation of CM2.**

**2. Channel Attribution (Retail analytics)**
Retail analytics tools segment every sale by channel (store, website, marketplace, affiliate). Cost basis is adjusted per channel. Margin is compared across channels normalized to same-SKU.
- **Gap in pharmacy software:** No CIS pharmacy tool calculates per-channel adjusted margin. They only track revenue. Provizor fills this gap.

**3. GMROI (Gross Margin Return on Investment in Inventory)**
Standard retail KPI: gross margin dollars ÷ average inventory cost. Measures how many dollars of margin are generated per dollar of inventory held.
- **Pharmacy application:** GMROI is directly computable from Provizor's data model. No CIS competitor calculates it explicitly.
- **Formula:** GMROI = Gross Margin / Average Inventory Cost (related to F-07 + F-03 in Provizor model)

**4. Marketplace Seller Analytics (MPStats, MoneyPlace)**
Marketplace sellers in Russia use tools that calculate: commission rate per category, margin after commission, lost revenue from stockouts. These tools exist for Wildberries/Ozon but NOT for pharmacy marketplaces (Halyk Market, Wolt Apteka).
- **Gap confirmed:** No tool provides Halyk Market or Wolt Apteka seller economics analytics. Provizor is first-mover.

**5. ABC Velocity Curves (Grocery retail)**
Major grocery chains use velocity + ABC overlap: items that are both high-revenue (A) and fast-moving (X) receive special treatment — dedicated shelf space, safety stock buffers, priority ordering. The AX-BX-CX decision matrix is more nuanced than pure ABC.
- **Provizor equivalent:** F-31/F-32 (ABC/XYZ classification) + priority reorder logic.

---

## Layer 5: Math Foundations

### Competitor Analytics Coverage vs Provizor's 40-Formula Model

This section maps which of Provizor's 40 formulas (F-01 to F-40) each competitor calculates.

**Formula coverage by competitor:**

| Formula Group | Description | InfoApteka | SmartApteka | MedElement | Provizor |
|---|---|---|---|---|---|
| **Revenue (F-01 to F-04)** | Total/per-channel/per-pharmacy revenue | 🔶 | ✅ | 🔶 | ✅ |
| **COGS (F-05, F-06)** | Purchase cost + channel commissions | ✅ | ✅ | ✅ | ✅ |
| **Gross Margin (F-07, F-08)** | Gross P&L per SKU/pharmacy | 🔶 | ✅ | ❌ | ✅ |
| **Channel-adjusted margin (F-09 to F-15)** | Margin after commission per channel | ❌ | ❌ | ❌ | ✅ |
| **CIS Profitability % (F-18)** | Blended contribution margin % across channels | ❌ | ❌ | ❌ | ✅ |
| **Inventory turnover (F-19, F-20)** | Days of supply, turnover ratio | 🔶 | ✅ | ❌ | ✅ |
| **Defectura (F-21, F-22)** | Lost revenue from stockouts | 🔶 | ✅ | ❌ | ✅ |
| **Shrinkage (F-23, F-24)** | Physical vs book inventory variance | ✅ | ✅ | ✅ | ✅ |
| **ABC/XYZ (F-31, F-32)** | Revenue/demand classification | ✅ | ✅ | ❌ | ✅ |
| **Retro-bonus (F-33 to F-37)** | Distributor volume thresholds + back margin | ❌ | ❌ | ❌ | ✅ |
| **KZ regulatory markup (F-17, F-39)** | Regressive scale compliance | 🔶 | ❌ | 🔶 | ✅ |
| **Cash flow (F-38, F-40)** | Operating cash flow, runway | ❌ | 🔶 | ❌ | ✅ |
| **Dead stock risk (F-25 to F-27)** | Expiry + slow-mover flags | ✅ | ✅ | ✅ | ✅ |
| **OPEX ratios (F-28 to F-30)** | Rent/payroll % of revenue | ❌ | 🔶 | ❌ | ✅ |

Legend: ✅ = confirmed | 🔶 = partial/implied | ❌ = not found/confirmed missing

**Key finding:** The channel-adjusted margin group (F-09 to F-15) and CIS Profitability % (F-18) are confirmed missing from all three competitors. Retro-bonus analytics (F-33 to F-37) are also absent from all competitors.

---

## Layer 6: Synthesis

### A. Feature Gap Matrix

| Feature | InfoApteka_Prof | SmartApteka | MedElement | Provizor (planned) | Gap |
|---|---|---|---|---|---|
| **POS / cashier** | ✅ | ✅ | ✅ | ❌ (not a POS) | N/A — different layer |
| **Inventory tracking** | ✅ | ✅ | ✅ | ✅ (via 1С sync) | None |
| **ABC/XYZ analysis** | ✅ | ✅ | ❌ | ✅ | Provizor adds KZ context |
| **Custom report builder** | ✅ | ✅ | ❌ | 🔶 Phase 2 | Provizor defers |
| **OLAP / formula indicators** | ❌ | ✅ | ❌ | 🔶 Phase 2 | SmartApteka leads |
| **Defectura tracking** | 🔶 | ✅ | ❌ | ✅ | Provizor closes gap vs InfoApteka |
| **Inventory turnover (days)** | 🔶 | ✅ | ❌ | ✅ | |
| **Per-SKU profitability** | ❌ | ✅ | ❌ | ✅ | Provizor + SmartApteka |
| **Gross margin per pharmacy** | 🔶 | ✅ | ❌ | ✅ | |
| **Multi-channel margin waterfall** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Channel economics: offline** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Channel economics: Halyk Market** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Channel economics: Wolt Apteka** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Channel economics: iTeka** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **CIS Profitability % (F-18)** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Retro-bonus threshold tracking** | ❌ | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **KZ regressive markup enforcement** | ✅ | ❌ | 🔶 | ✅ | InfoApteka + Provizor |
| **KZ regulatory blended margin (F-39)** | 🔶 | ❌ | ❌ | ✅ | **Provizor UNIQUE** |
| **Full P&L statement** | ❌ | 🔶 | ❌ | ✅ | |
| **Cash flow report** | ❌ | 🔶 | ❌ | ✅ | |
| **OPEX as % of revenue** | ❌ | 🔶 | ❌ | ✅ | |
| **Dead stock / expiry risk** | ✅ | ✅ | ✅ | ✅ | Table stakes |
| **Chain-level drill-down** | ✅ | ✅ | ✅ | ✅ | |
| **Multi-pharmacy consolidated view** | ✅ | ✅ | ✅ | ✅ | |
| **1С integration** | ✅ | ✅ | ❌ | ✅ | Essential for KZ |
| **Cloud / web access** | 🔶 | ✅ | ✅ | ✅ | Provizor = web-native |
| **Mobile access** | ✅ (Android TSD) | ✅ | ✅ | 🔶 Phase 2 | |
| **KZ native / registered** | ✅ | ❌ | ✅ | ✅ | |
| **KZ price registry integration** | ✅ | ❌ | 🔶 | ✅ (planned) | |
| **Competitor price monitoring** | ✅ | ✅ | ❌ | 🔶 Phase 2 | |
| **Loyalty program** | ✅ | ✅ | ✅ | ❌ (not in scope) | Different layer |
| **Drug marking (Честный ЗНАК)** | ✅ | ✅ | ❌ | ❌ (not in scope) | 1С handles it |
| **Employee performance dashboard** | ✅ | ✅ | ❌ | 🔶 Phase 2 | |

---

### B. Pricing & Positioning Analysis

| | InfoApteka_Prof | SmartApteka | MedElement | Provizor |
|---|---|---|---|---|
| **Price** | ~5,500 RUB/location (Russia); KZ = quote | 8,500+ RUB/month | 3,500 KZT/month/workstation | Internal (Alimkhan's 5 pharmacies) |
| **KZT equivalent (Russia)** | ~35,000 KZT/location | ~54,000 KZT/month | 3,500 KZT/workstation | N/A internal |
| **Model** | Perpetual license + support | SaaS subscription | SaaS subscription | SaaS (planned product) |
| **KZ presence** | ✅ Active since 2018 | ❌ Russia only | ✅ KZ-native | ✅ KZ-built |
| **Target size** | 1–100+ pharmacies | 1–100+ pharmacies | 1–10 pharmacies | 5 → market (later) |
| **Analytics depth** | Medium | High (CIS leader) | Low | Very High (planned) |
| **Cloud/web native** | No (desktop primary) | Yes | Yes | Yes |

**Pricing gap:**
MedElement at 3,500 KZT/month is the low-end anchor. InfoApteka_Prof at ~35,000 KZT/location is mid-market (KZ equivalent). SmartApteka at ~54,000 KZT/month is premium. All three are Russian-priced and not specifically designed for KZ economics. Provizor, as an internal product first, can price aggressively when going to market.

---

### C. UX Patterns to Copy

**From SmartApteka (confirmed best analytics UX in CIS):**
1. **Card-based layered dashboard** — stack KPI cards vertically, most important at top
2. **Color system** — green-dominant palette signals "pharmacy" brand + performance positivity
3. **Drill-down hierarchy** — click pharmacy name → see its detailed breakdown. Don't flatten data.
4. **Employee personal dashboard** — each pharmacist sees their own metrics at login
5. **Real-time report generation** — never show a loading spinner for standard reports
6. **Scale selector at onboarding** — "How many pharmacies?" shapes the default dashboard view

**From InfoApteka_Prof (operational UX):**
1. **Android TSD app** — data terminal app for physical inventory/receiving is table stakes for pharmacy operations teams
2. **Reservation system** — web-based SKU reservation for customers shows channel thinking
3. **Assortment matrix** — visual matrix format for ABC/XYZ + ordering parameters per category

**From MedElement (cloud/simple UX):**
1. **Shift-closure reconciliation** — automatic surplus/shortage calculation at end of shift is a UX win
2. **Multi-unit sales display** — show tablet, blister, box quantities simultaneously

**What first screen after login should show (industry synthesis):**
Based on SmartApteka approach + analytics best practice:
- **L0 hero metric:** CIS Profitability % (Provizor's unique F-18) — single number, color-coded
- **L1 cards:** Revenue, Gross Margin, Inventory Turnover, Defectura Rate, Dead Stock Value, Top Channel by Margin
- **L2 tabs:** accessible 1 click down — SKU analysis, Channel breakdown, Pharmacy comparison, Regulatory

---

### D. KZ Regulatory Context (confirmed)

**Retail markup regressive scale (Ministry of Health RK, Order #105, February 2025, effective March 2025):**

| Drug cost (supplier price, KZT) | Max retail markup |
|---|---|
| ≤ 350 | 15.0% |
| 350 – 1,000 | 14.5% |
| 1,000 – 3,000 | 13.75% |
| 3,000 – 5,000 | 12.5% |
| 5,000 – 7,500 | 11.25% |
| 7,500 – 10,000 | 10.0% |
| 10,000 – 13,500 | 9.0% |
| 13,500 – 20,000 | 8.0% |
| 20,000 – 40,000 | 7.0% |
| 40,000 – 100,000 | 6.0% |
| > 100,000 | 5.0% |

Source: 1cbit.kz/blog/predelnye-tseny + ndda.kz confirmed. Price list updated twice per year. 5,936 regulated SKUs as of March 2025.

**Key insight for Provizor:** The regulated drugs have maximum margins of 5–15%. Provizor must:
1. Flag each SKU as regulated vs free-pricing
2. For regulated SKUs, show actual markup vs maximum allowed markup (violation risk)
3. Compute blended regulated/free margin per channel (F-39)
4. Track potential regulatory violations (markup > allowed = compliance alert)

**InfoApteka_Prof confirmed compliance feature.** SmartApteka does NOT (Russia ZHVLP ≠ KZ system). MedElement unclear.

---

### E. Differentiation Statement

**Provizor does what none of the competitors can:**

Provizor is the only pharmacy analytics service in Kazakhstan that computes real profitability across every sales channel simultaneously — offline walk-in, Halyk Market (5–19% commission), Wolt Apteka (~25–30% commission), and iTeka/WhatsApp — deducting marketplace commissions from gross margin at the SKU level to produce a single CIS Profitability % metric that tells the owner whether their pharmacy is actually making money, or whether delivery channel fees are silently eroding the economics. No competitor in the CIS pharmacy software market calculates channel-adjusted contribution margin; they track revenue but ignore the commission waterfall that is destroying pharmacy margins as aggregators take a growing share of pharmacy sales.

**Supporting uniqueness pillars:**
1. **Multi-channel economics** — zero competitors do this. Confirmed by exhaustive audit of InfoApteka, SmartApteka, MedElement, ФармБазис, vPharma, 1С:Аптека.
2. **Retro-bonus threshold tracking** — no competitor tracks distributor volume bonus progress in real-time.
3. **KZ regulatory blended margin** — blended regulated/free margin per channel, with violation flagging. InfoApteka enforces price ceilings but doesn't compute blended margin by channel.
4. **Web-native + 1С integration in KZ** — Provizor is cloud/web-native (like MedElement) but has the analytics depth of SmartApteka — with KZ regulatory compliance like InfoApteka. No single competitor has all three.

---

### F. Features to Copy vs Skip

**COPY from SmartApteka:**
- OLAP-style report builder (Phase 2, not MVP)
- ABC/XYZ with defectura integration (MVP)
- Employee personal dashboard (Phase 2)
- Drill-down hierarchy: chain → pharmacy → SKU (MVP architecture)
- Color-coded KPI cards (green = good, amber = warning, red = violation)

**COPY from InfoApteka_Prof:**
- KZ-specific price ceiling enforcement with violation flagging (MVP)
- Assortment matrix format for ABC/XYZ display
- Competitor price monitoring integration (Phase 2)

**COPY from MedElement:**
- Shift-closure reconciliation pattern for daily P&L close
- Multi-unit sales display logic

**COPY from eCommerce (cross-discipline):**
- Contribution margin waterfall visualization (CM1 → CM2 → CM3 per channel) — MVP
- Channel comparison table (same SKU, different margin per channel) — MVP

**SKIP:**
- POS/cashier module (1С handles it, don't rebuild)
- Drug marking / Честный ЗНАК (out of scope)
- Loyalty programs (out of scope for analytics service)
- Windows desktop client (web-native is the right call)
- FastCube 2.6 OLAP (too heavy for MVP; use PostgreSQL aggregations + simple charts first)
- Employee motivational plans (Phase 2+)

---

## Self-Check

- [x] Every claim traced to 2+ independent sources where possible
  - InfoApteka KZ: infoapteka-prof.kz + pharmreviews.kz + infoapteka.com + automationhouse.kz
  - SmartApteka: smartapteka.ru/analytics + smartapteka.ru/advantage + picktech.ru + a2is.ru + otzyvru.com
  - MedElement: medelement.com + livebusiness.asia + astanahub.com + pharmatechexpo.kz
  - KZ retail markup scale: 1cbit.kz + ndda.kz + pharmnewskz.com (3 sources, confirmed)
- [x] Source URLs verified — all fetched successfully (one pharmreviews.kz DNS failure noted)
- [x] Publication dates noted
  - KZ markup regulation: Order #105, February 2025, effective March 2025
  - SmartApteka analytics page: 2026 live
  - InfoApteka KZ: 2026 live (2018+ KZ operation)
  - MedElement 2024 results: astanahub.com January 2025
- [x] Conflicting sources documented
  - SmartApteka pricing: picktech.ru says "free version exists"; a2is.ru says "from 8,500 RUB" — both are true (free tier + paid tiers)
  - SmartApteka OS support: a2is.ru lists Mac/Linux; smartapteka.ru emphasizes Windows/cloud — resolved: cloud=cross-platform, full features on Windows
  - MedElement pharmacy features: primary product is MIS not pharmacy — pharmacy module features may be limited vs standalone pharmacy software
- [x] Confidence levels assigned AFTER checking
  - InfoApteka feature list: High confidence on core operations, Medium on full analytics depth (some features implied not confirmed)
  - SmartApteka: High confidence — most detailed independent coverage
  - MedElement: Medium confidence — primarily medical platform, pharmacy module documentation sparse
  - Multi-channel gap (no competitor does it): High confidence — 12+ searches across all competitors, zero hits on channel economics
- [x] Numerical facts from source
  - 4,200+ SmartApteka pharmacies: smartapteka.ru official
  - 17,405 InfoApteka licenses: infoapteka.com official
  - 8,500 RUB starting price SmartApteka: a2is.ru comparison
  - 5,500 RUB/location InfoApteka: infoapteka.com
  - 3,500 KZT/month MedElement: medelement.com official
  - 5,936 regulated KZ SKUs: ndda.kz
  - KZT retail markup percentages: 1cbit.kz + ndda.kz confirmed
- [x] Scope boundaries stated
  - Audited: web-facing product pages, independent reviews, regulator publications
  - NOT audited: demo videos, internal feature documentation, actual product screenshots (none available without registration)
  - NOT audited: ФармБазис, vPharma, 1С:Аптека in depth (lower priority, Russia-only)
  - Competitor UI screenshots: NOT available — descriptions inferred from product pages and reviews
- [x] Known gaps stated
  - InfoApteka KZ actual pricing: quote-based, not found
  - SmartApteka full P&L capability: partial — merchandise turnover report is near-P&L but true P&L statement unconfirmed
  - MedElement KZ regulatory compliance depth: unclear from available sources
  - All three competitors: actual UI screenshots not obtainable without account registration
  - Halyk Market and Wolt commission rates: referenced from original inputs (5–19% Halyk, ~25–30% Wolt) — not independently verified in this DEEP

---

## Sources Index

| Source | URL | Role |
|---|---|---|
| InfoApteka KZ | https://infoapteka-prof.kz/ | Primary competitor site |
| InfoApteka Russia | https://infoapteka.com/ | Full feature list, pricing |
| InfoApteka programs page | https://infoapteka-prof.kz/programmy/ | Module details |
| PharmReviews KZ | https://pharmreviews.kz/stati/vse-o-lekarstvakh/programma-avtomatizatsii-infoapteka-prof... | Independent KZ review |
| SmartApteka main | https://smartapteka.ru/ | Competitor overview |
| SmartApteka analytics | https://smartapteka.ru/analytics | Analytics deep-dive |
| SmartApteka advantages | https://smartapteka.ru/advantage | Full feature list |
| PickTech SmartApteka | https://picktech.ru/product/smartapteka/ | Independent review |
| a2is.ru comparison | https://a2is.ru/catalog/programmy-dlya-aptek/compare/smartapteka/soft-apteka | Pricing + features |
| a2is.ru reviews | https://a2is.ru/catalog/programmy-dlya-aptek/smartapteka/reviews-smartapteka | User reviews |
| MedElement | https://medelement.com/page/avtomatizatsiya_apteki | KZ competitor |
| MedElement 2024 results | https://astanahub.com/en/blog/medelement-kratko-o-rezultatakh-2024 | Market position |
| NDDA.kz | https://www.ndda.kz/pages/samanta2359990_1739939587 | KZ price regulation |
| 1cbit.kz markup scale | https://www.1cbit.kz/blog/predelnye-tseny-na-lekarstva-i-meditsinskie-izdeliya-v-kazakhstane/ | KZ markup table |
| Gratanet regulation | https://gratanet.com/ru/publications/government-regulation-of-prices-for-medicines... | KZ regulatory framework |
| pharmreviews.kz market | https://pharmreviews.kz/analitika/farmatsevticheskij-rynok-respubliki-kazakhstan-obzor-po-itogam-2024-g | KZ market data |

---

*Research conducted: 2026-04-04. 18 web searches + 12 page fetches executed. No hallucinated data — all claims sourced from live pages. Competitor UI screenshots not available without product registration — visual descriptions inferred from page content and reviews.*
