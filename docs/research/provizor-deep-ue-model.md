# Provizor — Deep Research: Complete Pharmacy Unit Economics Formula Model
> Type: DEEP | Date: 2026-04-04 | Agent: Sonnet 4.6
> Project: Provizor — 5-pharmacy chain, Kazakhstan, partner: Alimkhan
> Scope: Complete formula catalog, data model, UI hierarchy, PostgreSQL schema — implementation-ready
> Input: SEED 1 (frameworks), SEED 2 (tools), SEED 3 (business logic) + targeted synthesis

---

## Table of Contents

1. [Layer 1: Current State](#layer-1-current-state)
2. [Layer 2: World-Class Implementations](#layer-2-world-class)
3. [Layer 3: Frontier](#layer-3-frontier)
4. [Layer 4: Cross-Discipline](#layer-4-cross-discipline)
5. [Layer 5: Math Foundations — Complete Formula Catalog](#layer-5-math-foundations)
6. [Layer 6: Synthesis — Implementation Specification](#layer-6-synthesis)
7. [Self-Check](#self-check)

---

## Layer 1: Current State

### 1.1 What Exists Today — Global Baselines

**Independent Pharmacy Unit Economics (US, NCPA Digest 2024):**
| Metric | Value | Source |
|---|---|---|
| Gross Margin | 19.7% (decade low) | NCPA Digest 2024 |
| EBITDA Margin | ~3.9% | Fleming Advisors 2023 |
| Net Profit Margin | 2–4% | Industry consensus 2024 |
| Inventory Turnover | 11×/year (national avg) | PioneerRx 2024 |
| Days of Inventory | ~30 days | PBA Health 2024 |
| Labor Cost % | 9.5% of revenue | NCPA 2024 |
| Shrinkage Rate | >2% of revenue | PBA Health 2024 |
| Fill Rate / Service Level | 72.3% (all Rx) | Pharmacy Times 2024 |

**KZ Market Context (PharmReviews.kz, pharmnewskz.com 2024–2025):**
| Metric | Value |
|---|---|
| KZ retail pharmacy market | 667.4B tenge (+17% YoY) |
| Total pharmacies | ~9,324 (4,556 chain) |
| Chain market share | 76% of turnover |
| Almaty pharmacies | ~1,300 |
| Almaty avg monthly revenue/pharmacy | ~17.5M tenge |
| Import dependency | 86.6% by value |
| Regulated SKUs (GOMBP/OSMS) | 5,936 as of March 2025 |

**US Gross Margin Benchmark Applicability Warning:**
The NCPA 19.7% is dominated by Rx/PBM reimbursement clawbacks (US-specific). Provizor's OTC-heavy model without PBM structures should yield 25–35% blended gross margin. The NCPA figure is NOT a valid target for Provizor — it is a floor reference for OSMS-reimbursed drugs only.

### 1.2 What Alimkhan Currently Has vs Needs

| Dimension | Current State | Gap |
|---|---|---|
| Revenue tracking | Daily per pharmacy (manual/1С) | ✓ Has it |
| SKU-level turnover | Not tracked | ✗ Missing |
| ABC/XYZ classification | Intuitive, not systematic | ✗ Missing |
| Per-SKU profitability | Not calculated | ✗ Missing |
| Channel economics (Halyk/Wolt) | Revenue visible, margin unknown | ✗ Missing |
| Defectura tracking | "Memory of head pharmacist" | ✗ Missing |
| Retro-bonus threshold progress | Not tracked | ✗ Missing |
| Inventory turnover (days) | Not calculated | ✗ Missing |
| Dead stock identification | Monthly inventory only | Partial |
| Expiry risk forecast | Manual, reactive | ✗ Missing |
| Inter-pharmacy visibility | Per-phone-call | ✗ Missing |
| Seasonal demand planning | Reactive | ✗ Missing |

**Typical transformation timeline for this profile (from farmbazis.ru, mosapteki.ru):**
- Phase 1 (current): turnover 35–45 days, dead stock 15–25%, intuitive ordering
- Phase 2 (with Provizor): turnover target 20–25 days, dead stock <10%, data-driven ordering
- Phase 3 (mature): turnover 15–20 days, dead stock <5%, service level 94–97%, +30–50% profitability

### 1.3 KZ Regulatory Constraint Architecture

**Regressive Markup Scale (Ministry of Health RK, updated February 2025, effective March 2025):**
| Drug cost (supplier price, tenge) | Max retail markup | Max selling price formula |
|---|---|---|
| ≤ 350 | 15.0% | cost × 1.150 |
| 350 – 1,000 | 14.5% | cost × 1.145 |
| 1,000 – 3,000 | 13.75% | cost × 1.1375 |
| 3,000 – 5,000 | 12.5% | cost × 1.125 |
| 5,000 – 7,500 | 11.25% | cost × 1.1125 |
| 7,500 – 10,000 | 10.0% | cost × 1.100 |
| 10,000 – 13,500 | 9.0% | cost × 1.090 |
| 13,500 – 20,000 | 8.0% | cost × 1.080 |
| 20,000 – 40,000 | 7.0% | cost × 1.070 |
| 40,000 – 100,000 | 6.0% | cost × 1.060 |
| > 100,000 | 5.0% | cost × 1.050 |

Source: pharmnewskz.com (February 2025), aipm.kz (confirmed)

**Non-regulated drugs:** Free pricing. Alimkhan applies flat +30% markup.
**New July 2025 rule:** Dynamic ceiling = average market price from IS MPT cash receipts. This compresses margins further on competitive SKUs.

---

## Layer 2: World-Class Implementations

### 2.1 SmartApteka (CIS — Most Relevant)

**Scale:** 4,200+ pharmacies, Russia, since 2017.
**Source:** smartapteka.ru/analytics, picktech.ru independent review.

**Analytics Architecture:**
- OLAP via FastCube 2.6 (multidimensional data cubes, in-memory, real-time generation)
- Pivot-style report builder (user-configurable dimensions)
- Chain-level drill: pharmacy group → legal entity → department → SKU

**Priority Metrics SmartApteka Tracks:**
1. Merchandise turnover (товарооборот) — absolute and per-period
2. Cash flow — daily/weekly
3. Gross income (валовой доход) — margin in currency and %
4. ABC/XYZ built-in — automatically assigns classes, updates weekly
5. ЖНВЛП price auto-control — flags pricing violations in real-time
6. User-formula calculated indicators — custom KPIs via formula editor
7. Financial indicators — formula-based profitability metrics

**Display Pattern:**
- Summary dashboard → click-through to drill-down
- Per-pharmacy comparison table (all locations in one view)
- Period comparison: current vs prior month/year

**What Provizor Should Copy:**
- Drill-down hierarchy: chain → pharmacy → category → SKU
- ABC/XYZ assignment as a persistent attribute (recalculated weekly)
- Per-pharmacy comparison table as primary multi-location view
- Formula-based custom indicators (start with 5 hardcoded, expand later)

### 2.2 NCPA Digest — Methodological Structure (US, Authoritative)

**Source:** NCPA Digest 2024 (ncpa.co/pdf/digest/2024/digest-2024.pdf), Drug Topics coverage October 2024.

**NCPA's 14 Priority KPIs (adapted from PioneerRx canonical list):**
1. Gross Profit Margin %
2. Inventory Turnover Rate (annual)
3. Average Prescription Value
4. Prescriptions Dispensed per Day
5. Shrinkage % of Revenue
6. Days of Inventory on Hand
7. Generic Dispensing Rate
8. Net Profit Margin %
9. Operating Expense Ratio
10. Revenue per Pharmacist Hour
11. Average Transaction Value
12. Customer Retention Rate
13. Prescription Fill Rate
14. Controlled Substance Dispensing Rate

**Adaptation for Provizor (replacing Rx-centric metrics with OTC equivalents):**
- "Average Prescription Value" → "Average Transaction Value (Средний чек)"
- "Prescriptions per Day" → "Transactions per Day (КЧ)"
- "Controlled Substance Rate" → "Regulated Drug Revenue Share %"
- "Generic Dispensing Rate" → "Generic/Equivalent Substitution Rate"

**NCPA P&L Structure (adapted):**

```
Revenue (Товарооборот)
├── Product Sales (offline + channels)
└── Service Revenue (consultations, if any)

COGS (Себестоимость реализованных товаров)
└── Purchase price × quantity sold (all SKUs, all channels)

Gross Profit = Revenue − COGS

Operating Expenses:
├── Labor & Benefits (9–12% of revenue)
├── Rent & Occupancy (5–8%)
├── Utilities & Supplies (1–3%)
├── Marketing & Channel Commissions (0–19% of channel revenue)
├── Software & IT (0.5–1%)
├── Shrinkage & Write-offs (<2%)
└── Administrative (1–2%)

EBITDA
├── Depreciation & Amortization
└── Interest Expense

Net Profit (3–6% target for CIS independent pharmacy)
```

### 2.3 FarmBazis Profitability Model (CIS — Formula-Driven)

**Source:** farmbazis.ru/profitability-and-turnover/ (2024), farmbazis.ru/inventory-management-efficiency/ (2024).

**Core Philosophy:** Turnover improvement is more powerful than markup increase. Same 30% markup at different turnover rates:

| Turnover (days) | Profitability % | vs baseline |
|---|---|---|
| 45 days | ~20% | baseline |
| 30 days | ~30% | +50% |
| 24 days | ~37.5% | +87% |
| 20 days | ~45% | +125% |

**FarmBazis Inventory Classification (6 groups for Баланс-прогноз):**
1. Дефицит товара (deficit) — below reorder point
2. Норма запаса (normal) — within target range
3. Избыток запаса (excess) — above safety stock
4. Неликвид (illiquid) — no movement in 60+ days
5. Медленнооборачиваемый (slow-mover) — movement but below threshold
6. Просрочка/угроза (expiry risk) — less than 60 days to expiry date

**What Provizor Should Copy:**
- The 6-group inventory classification as a core data attribute per SKU
- The profitability-turnover relationship as the primary "explain your numbers" insight
- The "Баланс-прогноз" summary — how many SKUs in each group, total value

---

## Layer 3: Frontier

### 3.1 Dynamic Price Ceiling Modeling (KZ July 2025 Rule)

**The Rule (effective July 2025):**
The new regulation defines maximum retail price as the average selling price across pharmacy chains extracted from IS MPT (Information System of Market Price Tracking) cash receipt data. This is a dynamic ceiling that adjusts based on actual market prices — essentially a peer-average benchmark.

**Impact Modeling for Provizor:**
- If Alimkhan prices above market average for a regulated SKU → violation risk
- If market average drops (due to large chain discounting) → Alimkhan's ceiling also drops
- This creates a feedback loop: price competition compresses the ceiling for all participants

**Provizor Response — Dynamic Ceiling Field:**
Each regulated SKU should store:
- `max_regulated_price` — current ceiling from NDDA registry
- `market_avg_price` — estimated from IS MPT (future integration point)
- `current_selling_price` — Alimkhan's actual price
- `price_headroom_pct` — ((max_price − current_price) / max_price) × 100
- `price_violation_flag` — boolean: current_price > max_regulated_price

**Confidence:** Medium — regulation confirmed as enacted; IS MPT integration details and enforcement timeline unverified. Mark as "future feature" in Phase 1 implementation.

### 3.2 AI-Driven Demand Forecasting for Pharmacy

**Current State of the Art (2024–2025):**
- Traditional: ARIMA/Exponential Smoothing for time-series pharmacy demand
- Modern: Gradient Boosted Trees (LightGBM, XGBoost) with pharmacy-specific features
- Frontier: Foundation time-series models (Chronos by Amazon, TimesFM by Google) — pretrained on diverse time-series, require minimal historical data

**Pharmacy-Specific Features for Forecasting:**
- Seasonality index (month-of-year, week-of-year)
- Lead time from supplier
- Epidemic index (flu case counts — publicly available from epidemiological surveillance)
- Holiday calendar (KZ public holidays affect traffic patterns)
- Price changes (demand elasticity effect)
- Promotions and discounts

**For Provizor Phase 1 (practical):**
Not implemented in Phase 1 (requires 12+ months of clean historical data). Placeholder: simple moving average + seasonal coefficient table from SEED 3 (flu season Q4 = ×3–4, summer = ×0.6).

**Phase 2 roadmap:** After 12 months of data → implement LightGBM per-SKU demand model with retraining monthly.

### 3.3 Real-Time Inventory Optimization vs Batch

**Industry Standard (from SEED 2 research):**
- Batch hourly sync from 1С → aggregated analytics updated on-demand: industry standard for chain pharmacy economics
- Real-time is used only for: (a) POS transaction feed, (b) critical stock alerts (below reorder point)

**For Provizor Architecture Decision:**
- Phase 1: batch hourly/daily sync from 1С OData → PostgreSQL → computed metrics
- Real-time alerts: WebSocket push for "SKU below reorder point" events
- No real-time analytics needed for unit economics (P&L, margins are daily/weekly/monthly metrics)

**Verdict:** Batch is sufficient and appropriate. Real-time adds complexity without proportional value for unit economics use case.

---

## Layer 4: Cross-Discipline

### 4.1 E-Commerce Multi-Channel P&L Waterfall (Applied to Pharmacy)

**Standard e-commerce multi-channel P&L (adapted from retail analytics best practice):**

```
SKU Selling Price (per channel)
  − Purchase Cost (same for all channels — COGS)
  = Gross Margin per Unit

  − Channel Commission (0% offline, 5–19% Halyk, X% Wolt)
  − Fulfillment Cost per Order (packaging, delivery if applicable)
  − Refund/Return Cost (rate × cost)
  = Channel Contribution Margin per Unit

  × Volume (units sold per channel per period)
  = Total Channel Contribution Margin
```

**Channel Comparison Matrix for Provizor:**

| Channel | Commission | Fulfillment | Net Margin at 30% GM |
|---|---|---|---|
| Offline (POS) | 0% | ~0% | ~30% |
| Halyk Market (low tier) | 5% | ~1% | ~24% |
| Halyk Market (high tier) | 19% | ~1% | ~10% |
| Wolt Apteka | ~25–30%* | 0% (Wolt delivers) | ~0–5% |
| WhatsApp/iTeka | 0% | ~1–2% (courier) | ~28% |

*Wolt commission unverified — estimated from Wolt for Business general rates. Must be confirmed with Alimkhan's actual contract.

**Key Insight:** For regulated drugs with 5–15% allowed markup, selling on Halyk at 19% commission = guaranteed negative margin. Provizor should flag these SKUs automatically.

**Flag Logic:**
`channel_margin_negative = (gross_margin_pct − channel_commission_pct) < 0`
→ Show as red alert in channel analytics: "X SKUs lose money on Halyk Market"

### 4.2 SaaS Unit Economics Patterns (For Future Productization)

If Provizor grows into a SaaS product sold to other pharmacy chains:

**SaaS Metrics to Track (future, not Phase 1):**
- MRR (Monthly Recurring Revenue)
- CAC (Customer Acquisition Cost) — pharmacy chains are hard to sell to; expect high CAC
- LTV (Lifetime Value) — sticky SaaS once data is in
- NRR (Net Revenue Retention) — key for B2B SaaS
- Time-to-Value (how fast a new pharmacy sees their first insight)

**Provizor Product-Market Fit Metric:**
The single most revealing SaaS PMF metric: "What % of users log in weekly without being prompted?"
Target for B2B operational SaaS: >60%.

### 4.3 Retail Category Management → Pharmacy Adaptation

**Standard Retail Category Management (4-Step Planogram Process):**
1. Category Definition — what SKUs belong together
2. Category Role — Destination (traffic driver) / Routine (daily sales) / Convenience / Seasonal
3. Category Assessment — current performance vs opportunity
4. Category Scorecard — revenue/profit/turnover per category

**Pharmacy Adaptation (CIS standard categories):**
| Category | Role | Margin Profile | Reorder Urgency |
|---|---|---|---|
| Acute care (antivirals, antipyretics) | Destination | Low (regulated) | HIGH |
| Chronic care (hypertension, diabetes) | Routine | Low–Medium | MEDIUM |
| OTC wellness (vitamins, supplements) | Routine | HIGH (free price) | MEDIUM |
| Dermatology / Cosmetics | Convenience | HIGH | LOW |
| Baby care | Destination | Medium | HIGH |
| Orthopedic / Medical devices | Convenience | HIGH | LOW |
| Seasonal (sunscreen, allergy) | Seasonal | HIGH | TIMING-CRITICAL |

**Provizor Application:** Category is a required field on every SKU. Category-level P&L rollup is a dashboard standard view.

---

## Layer 5: Math Foundations — Complete Formula Catalog

### 5.1 P&L Formulas

---

**F-01: Revenue (Товарооборот)**
- **EN:** Gross Revenue | **RU:** Товарооборот / Выручка
- **Formula:** `Revenue = Σ (selling_price_i × units_sold_i)` across all SKUs, all channels, selected period
- **Variables:** selling_price_i = actual sold price per unit; units_sold_i = units sold
- **Input fields:** Transaction log (price + quantity per line item)
- **Output:** Currency (tenge)
- **Benchmark:** Almaty avg ~17.5M tenge/month/pharmacy (pharmreviews.kz 2024)
- **Frequency:** Real-time → daily aggregation
- **Display priority:** Level 0 (primary KPI)

---

**F-02: Cost of Goods Sold (Себестоимость)**
- **EN:** Cost of Goods Sold (COGS) | **RU:** Себестоимость реализованных товаров
- **Formula:** `COGS = Σ (purchase_price_i × units_sold_i)`
- **Variables:** purchase_price_i = weighted average purchase cost per unit (WAC)
- **Input fields:** Purchase invoices (price, quantity) → WAC per SKU; sales log
- **Output:** Currency (tenge)
- **Note:** Use Weighted Average Cost (WAC) method — standard in CIS pharmacy. FIFO is also acceptable but WAC is simpler for 1С integration.
- **Benchmark:** ~69–75% of revenue (KZ OTC-heavy model: 65–72%)
- **Frequency:** Daily aggregation
- **Display priority:** Level 2

---

**F-03: Gross Profit (Валовой Доход)**
- **EN:** Gross Profit | **RU:** Валовой доход
- **Formula:** `GP = Revenue − COGS`
- **Input fields:** F-01, F-02
- **Output:** Currency (tenge) + percentage
- **Gross Margin %:** `GM% = (GP / Revenue) × 100`
- **Benchmark:** 25–35% (KZ OTC-heavy pharmacy, estimated); 19.7% (US Rx-heavy, NCPA 2024 — NOT applicable as target)
- **Frequency:** Daily
- **Display priority:** Level 1

---

**F-04: Payroll Cost Ratio**
- **EN:** Labor Cost % | **RU:** Доля фонда оплаты труда
- **Formula:** `Payroll% = (Total Payroll + Benefits) / Revenue × 100`
- **Input fields:** Monthly payroll total (manual entry), revenue
- **Output:** Percentage
- **Benchmark:** 9–12% of revenue (US 9.5%, NCPA 2024; CIS likely 10–14% given lower automation)
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-05: Rent & Occupancy Ratio**
- **Formula:** `Rent% = Total Rent / Revenue × 100`
- **Input fields:** Monthly rent (manual entry per pharmacy), revenue
- **Output:** Percentage
- **Benchmark:** 5–8% of revenue. Almaty commercial rents are high — could reach 10% for premium locations.
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-06: Operating Expense Ratio (OPEX%)**
- **Formula:** `OPEX% = (Payroll + Rent + Utilities + Admin + Software + Marketing) / Revenue × 100`
- **Input fields:** All expense line items (monthly manual entry), revenue
- **Output:** Percentage
- **Benchmark:** 20–28% of revenue (CIS independent pharmacy)
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-07: EBITDA**
- **Formula:** `EBITDA = GP − OPEX (excl. D&A)`
- **Input fields:** F-03, F-06 components
- **Output:** Currency + EBITDA Margin %
- **EBITDA%:** `EBITDA% = EBITDA / Revenue × 100`
- **Benchmark:** 5–10% for CIS independent pharmacy (SEED 1)
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-08: Net Profit**
- **Formula:** `Net Profit = EBITDA − D&A − Interest − Tax`
- **Input fields:** EBITDA, depreciation schedule (manual), loan interest (manual), tax rate (KZ corporate: 20% standard; micro-enterprise may use simplified regime)
- **Output:** Currency + Net Margin %
- **Net Margin%:** `NM% = Net Profit / Revenue × 100`
- **Benchmark:** 3–6% for CIS independent pharmacy (SEED 1)
- **Frequency:** Monthly
- **Display priority:** Level 2

---

### 5.2 Inventory Formulas

---

**F-09: Inventory Turnover Rate (Оборачиваемость)**
- **EN:** Inventory Turnover Rate | **RU:** Коэффициент оборачиваемости запасов
- **Formula:** `ITR = COGS / Avg Inventory Value`
- **Variables:** COGS = cost of goods sold in period; Avg Inventory = (beginning inventory + ending inventory) / 2
- **Output:** Ratio (times per period)
- **Benchmark:** 10–14×/year (US PioneerRx 2024); national avg 11×; CIS target 12–20×/year
- **Frequency:** Monthly (sufficient for period-end management)
- **Display priority:** Level 1

---

**F-10: Days of Inventory (Оборачиваемость в днях)**
- **EN:** Days of Inventory (DOI) / Days on Hand | **RU:** Оборачиваемость в днях / Товарный запас в днях
- **Formula:** `DOI = Avg Inventory Value / (COGS / Days_in_period)`
- **Simplified (monthly):** `DOI = ТЗ / S × 30`
  - ТЗ = average inventory value in tenge
  - S = monthly sales (revenue in tenge)
  - 30 = normative days in month
- **Alternative:** `DOI = 365 / ITR`
- **Output:** Days
- **Benchmark (CIS pharmacy targets):**
  - Green: ≤ 20 days
  - Yellow: 21–35 days
  - Red: > 35 days
- **US benchmark for reference:** ~30 days (PBA Health 2024)
- **Frequency:** Weekly (actionable metric)
- **Display priority:** Level 1

---

**F-11: Reorder Point (Точка заказа)**
- **EN:** Reorder Point (ROP) | **RU:** Точка заказа
- **Formula:** `ROP = (Avg Daily Sales × Lead Time Days) + Safety Stock`
- **Variables:**
  - Avg Daily Sales = units sold per day (rolling 30-day average)
  - Lead Time Days = days from order to delivery (typically 1–3 days for KZ distributors)
  - Safety Stock = Avg Daily Sales × Safety Days (typically 3–7 days for A-class, 7–14 for B, 14–21 for C)
- **Input fields:** Sales history (1С sync), lead time per distributor (manual config)
- **Output:** Units (integer threshold)
- **Frequency:** Recalculated daily
- **Display priority:** Level 2 (triggers alert when stock ≤ ROP)

---

**F-12: Economic Order Quantity (Оптимальный размер заказа)**
- **EN:** Economic Order Quantity (EOQ) | **RU:** Оптимальный размер заказа
- **Formula:** `EOQ = sqrt(2 × D × S_order / H)`
- **Variables:**
  - D = annual demand in units
  - S_order = cost per order (fixed ordering cost — estimate 500–2000 tenge per order event)
  - H = holding cost per unit per year (typically 20–30% of unit purchase cost: insurance, storage, obsolescence)
- **Note:** EOQ is theoretically elegant but practically, most CIS pharmacy systems use simpler "cover X days of demand" heuristic. Implement EOQ as optional advanced feature.
- **Simplified heuristic (Phase 1):** `Order Qty = (DOI_target − current_days_stock) × Avg Daily Sales`
- **Output:** Units
- **Frequency:** Calculated on demand (reorder suggestion)
- **Display priority:** Level 3

---

**F-13: Dead Stock % (Доля неликвидов)**
- **EN:** Dead Stock Percentage | **RU:** Доля неликвидов / Мертвый запас
- **Formula:** `Dead Stock% = (Value of SKUs with 0 sales in last 60 days) / Total Inventory Value × 100`
- **Variables:** 60-day threshold is standard CIS pharmacy definition; adjust to 90 days for C-class items
- **Input fields:** Sales history, inventory snapshot
- **Output:** Percentage + absolute value in tenge
- **Benchmark:**
  - Green: < 5%
  - Yellow: 5–15%
  - Red: > 15%
- **Frequency:** Weekly
- **Display priority:** Level 1

---

**F-14: Expiry Risk Value (Стоимость товаров под угрозой списания)**
- **Formula:** `Expiry Risk = Σ (purchase_price_i × remaining_units_i)` where expiry_date_i ≤ today + 90 days
- **Variables:** 90-day horizon is standard early-warning window for pharmacy (enough time to run promotion or return to supplier)
- **Input fields:** SKU expiry dates (from 1С), current inventory levels, purchase prices
- **Output:** Currency (tenge) + count of SKUs at risk
- **Frequency:** Daily (alert trigger)
- **Display priority:** Level 1 (alert when > 0)

---

**F-15: FEFO Compliance Rate**
- **EN:** First-Expired-First-Out Compliance | **RU:** Соблюдение принципа ФЕФО
- **Formula:** `FEFO% = (Sales where oldest batch sold first / Total sales with multiple batches) × 100`
- **Note:** Requires batch tracking in 1С. If batch tracking not enabled, approximate via: flag any SKU where avg remaining shelf life is decreasing over time.
- **Output:** Percentage
- **Benchmark:** Target 95%+
- **Frequency:** Monthly
- **Display priority:** Level 3

---

### 5.3 Profitability Formulas

---

**F-16: Realized Markup % (Уровень торговой наценки, УТН)**
- **EN:** Realized Markup % | **RU:** Уровень торговой наценки (УТН) / Уровень валового дохода (УВД)
- **Formula:** `УТН = (Revenue − COGS) / COGS × 100`
- **Note:** This differs from Gross Margin % (which divides by Revenue). УТН is the CIS standard — it measures markup over cost, not margin over revenue.
- **Relationship:** `УТН = GM% / (1 − GM%)`; at 30% markup → GM% = 23.1%
- **Input fields:** Revenue, COGS
- **Output:** Percentage
- **Alimkhan's target:** 30% (his current policy for non-regulated drugs)
- **Regulated drugs:** УТН constrained by regressive scale (F-17)
- **Benchmark for Provizor:** Blended 20–28% (mix of regulated and free-price SKUs)
- **Frequency:** Daily
- **Display priority:** Level 1

---

**F-17: KZ Regulatory Max Markup (Предельная наценка РК)**
- **Formula:** Lookup by purchase_price against regressive scale table:

```
function get_max_markup_pct(purchase_price_tenge):
  if purchase_price <= 350:     return 15.0
  if purchase_price <= 1000:    return 14.5
  if purchase_price <= 3000:    return 13.75
  if purchase_price <= 5000:    return 12.5
  if purchase_price <= 7500:    return 11.25
  if purchase_price <= 10000:   return 10.0
  if purchase_price <= 13500:   return 9.0
  if purchase_price <= 20000:   return 8.0
  if purchase_price <= 40000:   return 7.0
  if purchase_price <= 100000:  return 6.0
  return 5.0
```

- **Max Selling Price:** `max_price = purchase_price × (1 + get_max_markup_pct(purchase_price) / 100)`
- **Violation Flag:** `is_violation = selling_price > max_price AND is_regulated = TRUE`
- **Input fields:** purchase_price, is_regulated (boolean from registry), selling_price
- **Output:** Max markup %, max selling price, violation boolean
- **Frequency:** Recalculate when purchase price changes or registry updates
- **Display priority:** Level 2 (violations = Level 1 alert)

---

**F-18: CIS Pharmacy Profitability Formula (FarmBazis)**
- **Formula:** `Рентабельность(%) = ReализНац(%) × (S / ТЗ) × (1 + (Кред − Деб) / (ТЗ − (Кред − Деб)))`
- **Variables:**
  - ReализНац(%) = realized markup % (= УТН, Formula F-16)
  - S = monthly sales revenue (тenge)
  - ТЗ = average inventory value (tenge)
  - Кред = accounts payable (кредиторская задолженность перед поставщиками)
  - Деб = accounts receivable (дебиторская задолженность — from Halyk Market/Wolt payouts pending)
- **Simplified (when AP ≈ AR):** `Рентабельность ≈ УТН × (S / ТЗ) × (30 / 30) = УТН`
- **Key insight:** At 30-day turnover with balanced AP/AR → Profitability = Markup %. At 20-day turnover → Profitability = 45% (at 30% markup).
- **Output:** Percentage (annualized return on invested inventory)
- **Frequency:** Monthly
- **Display priority:** Level 1 (the "single most important number" for Alimkhan)

---

**F-19: Per-SKU Gross Margin**
- **Formula:** `SKU_GM% = (selling_price − purchase_price) / selling_price × 100`
- **Per-Channel:** `SKU_GM_channel% = (channel_selling_price − purchase_price − channel_commission_amount) / channel_selling_price × 100`
- **Input fields:** selling_price per channel, purchase_price (WAC), channel_commission_pct
- **Output:** Percentage
- **Frequency:** Recalculate when price or cost changes
- **Display priority:** Level 3 (SKU detail view)

---

**F-20: Blended Gross Margin (Blended GM)**
- **Formula:** `Blended_GM% = Σ (SKU_revenue_i × SKU_GM%_i) / Total_Revenue`
- **By category:** `Category_GM% = Σ (revenue_in_cat) × SKU_GM%) / Category_Revenue`
- **Output:** Percentage
- **Benchmark:** 25–35% overall (KZ OTC-heavy, estimated)
- **Frequency:** Daily
- **Display priority:** Level 1

---

### 5.4 Defectura (Lost Sales) Formulas

---

**F-21: Defectura Rate (Уровень дефектуры)**
- **EN:** Stockout Rate / Defectura Rate | **RU:** Уровень дефектуры
- **Formula:** `Defectura% = (Unfulfilled Requests / Total Requests) × 100`
- **Alternative (when request logging unavailable):**
  `Defectura% = (SKU-days with zero stock / Total SKU-days) × 100`
- **Input fields:** "Asked but unavailable" log (manual entry or WhatsApp categorization), or daily stock snapshot per SKU
- **Output:** Percentage
- **Benchmark:**
  - Green: < 3%
  - Yellow: 3–7%
  - Red: > 7%
- **Frequency:** Daily tracking, weekly reporting
- **Display priority:** Level 1

---

**F-22: Lost Revenue from Defectura**
- **EN:** Lost Revenue from Stockouts | **RU:** Упущенная выручка от дефектуры
- **Formula:** `Lost_Revenue = Σ (days_OOS_i × avg_daily_units_i × selling_price_i)`
- **Variables:**
  - days_OOS_i = days SKU i was out of stock (zero inventory)
  - avg_daily_units_i = average daily units sold when in stock (rolling 30-day window before OOS)
  - selling_price_i = current selling price
- **Lost Margin:** `Lost_Margin = Lost_Revenue × GM%`
- **Input fields:** Daily inventory snapshot (≥0 units = in stock), sales history
- **Output:** Currency (tenge)
- **Frequency:** Weekly calculation
- **Display priority:** Level 2

---

**F-23: Fill Rate / Service Level (Уровень сервиса)**
- **EN:** Fill Rate / Service Level | **RU:** Уровень сервиса
- **Formula:** `Service_Level% = (Fulfilled Requests / Total Requests) × 100 = 100% − Defectura%`
- **For SKU-level:** `SKU_Fill_Rate% = (days_in_stock / total_days_in_period) × 100`
- **Output:** Percentage
- **Benchmark:** 94–97% (industry target for well-run pharmacy)
- **Frequency:** Weekly
- **Display priority:** Level 1

---

### 5.5 Shrinkage Formulas

---

**F-24: Shrinkage Rate (Недостача / Потери)**
- **EN:** Shrinkage Rate | **RU:** Уровень недостачи / Потери от пересорта и воровства
- **Formula:** `Shrinkage% = (Book_Inventory_Value − Physical_Inventory_Value) / Revenue × 100`
- **Variables:**
  - Book_Inventory_Value = what 1С shows should be in stock (accounting records)
  - Physical_Inventory_Value = what was actually counted (physical audit)
- **Alternative (% of inventory):** `Shrinkage_of_Inv% = (Book − Physical) / Book × 100`
- **Input fields:** Physical inventory audit results (per pharmacy, per audit date), 1С book inventory at same date
- **Output:** Percentage (of revenue or of inventory)
- **Benchmark:**
  - Green: < 1% of revenue
  - Yellow: 1–2% of revenue
  - Red: > 2% of revenue
- **Industry context:** Pharmacy avg shrinkage > 2% (PBA Health 2024); sourced from: shoplifting 37%, employee theft 29%, admin errors 21%, vendor fraud 5%, expiry/damage 8%.
- **Frequency:** Per inventory audit (monthly minimum)
- **Display priority:** Level 1 (when trend is negative)

---

**F-25: Shrinkage Decomposition**
- **Formula:** Track separately by cause category:
  - `Theft_Loss = Σ (confirmed theft incidents × value)`
  - `Resorting_Loss = Σ (mismatch between sold item and invoiced item × price delta)` — пересорт
  - `Admin_Error_Loss = Σ (documented admin mistakes × value)`
  - `Expiry_Loss = Σ (written-off units × purchase_price)` — просрочка
- **Input fields:** Audit records with cause classification
- **Output:** Currency breakdown + % per category
- **Frequency:** Per audit
- **Display priority:** Level 3

---

**F-26: Expiry Write-Off Rate**
- **Formula:** `Expiry_Writeoff% = Total_Written_Off_Value / Avg_Inventory_Value × 100`
- **Input fields:** Write-off records (date, SKU, quantity, purchase price)
- **Output:** Percentage
- **Benchmark:** < 1% of inventory value per year
- **Frequency:** Monthly
- **Display priority:** Level 2

---

### 5.6 Channel Economics Formulas

---

**F-27: Channel Revenue Share**
- **Formula:** `Channel_Share% = Channel_Revenue / Total_Revenue × 100`
- **Per channel:** offline, halyk_market, wolt, iteka, other
- **Output:** Percentage per channel
- **Frequency:** Daily
- **Display priority:** Level 2

---

**F-28: Channel Net Margin (Маржа по каналу)**
- **Formula:** `Channel_Net_Margin% = GM% − Channel_Commission% − Channel_Fulfillment_Cost%`
- **Variables:**
  - GM% = gross margin on SKUs sold in this channel
  - Channel_Commission% = platform fee (0% offline, 5–19% Halyk, ~25–30% Wolt — CONFIRM WITH ACTUAL CONTRACTS)
  - Channel_Fulfillment_Cost% = packaging, picking, delivery allocation as % of channel revenue
- **For Halyk Market specifically:**
  `Halyk_Net_Margin% = SKU_GM% − Halyk_Commission%`
  Where Halyk_Commission% is tiered (exact tiers require Alimkhan's seller account — use 10% as Phase 1 default)
- **Output:** Percentage
- **Alert condition:** Channel_Net_Margin% < 0 → negative contribution channel for this SKU mix
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-29: Blended Channel Margin**
- **Formula:** `Blended_Margin% = Σ (Channel_Share%_j × Channel_Net_Margin%_j)`
- **Output:** Percentage
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-30: SKU Channel Profitability Flag**
- **Formula per SKU per channel:**
  `SKU_Channel_GM_tenge = (selling_price − purchase_price) × units_sold − channel_commission_amount`
  `is_unprofitable_on_channel = SKU_Channel_GM_tenge < 0`
- **Output:** Boolean flag per SKU per channel
- **Frequency:** Monthly recalculation
- **Display priority:** Level 2 (bulk flagging report)

---

### 5.7 Cash Flow Formulas

---

**F-31: Days Payable Outstanding (Дни оборота кредиторской задолженности)**
- **EN:** Days Payable Outstanding (DPO) | **RU:** Оборачиваемость кредиторской задолженности в днях
- **Formula:** `DPO = (Avg Accounts Payable / COGS) × Days_in_period`
- **Variables:** Accounts Payable = outstanding balance to all suppliers
- **Input fields:** Supplier invoice register with due dates, payment dates
- **Output:** Days
- **Benchmark:** Match or exceed DOI — pharmacy should pay suppliers after goods are sold. Target DPO ≥ DOI.
- **Provizor target:** DPO ≥ 20 days (matching 14–30 day standard deferral terms)
- **Frequency:** Monthly
- **Display priority:** Level 3

---

**F-32: Days Sales Outstanding (Дни оборота дебиторской задолженности)**
- **EN:** Days Sales Outstanding (DSO) | **RU:** Оборачиваемость дебиторской задолженности
- **Formula:** `DSO = (Avg Accounts Receivable / Revenue) × Days_in_period`
- **Variables:** Accounts Receivable = outstanding balance from marketplace payouts (Halyk Market ~7–14 day payout cycle)
- **Input fields:** Marketplace payout records
- **Output:** Days
- **Benchmark:** < 14 days (marketplace payout cycle)
- **Frequency:** Monthly
- **Display priority:** Level 3

---

**F-33: Cash Conversion Cycle (Цикл оборота денежных средств)**
- **EN:** Cash Conversion Cycle (CCC) | **RU:** Цикл оборота денежных средств
- **Formula:** `CCC = DOI + DSO − DPO`
- **Variables:** F-10 + F-32 − F-31
- **Output:** Days (can be negative — pharmacy is effectively "float" financed by suppliers)
- **Benchmark:** Target ≤ 0 days (pay suppliers after receiving cash from customers). Offline pharmacy is cash-positive naturally. Marketplace payout delays create positive CCC.
- **Frequency:** Monthly
- **Display priority:** Level 3

---

**F-34: Retro-Bonus Threshold Progress**
- **Formula per distributor contract:**
  `Threshold_Progress% = Cumulative_Purchase_Value_QTD / Threshold_Target_Value × 100`
  `Expected_Bonus_Value = Cumulative_Purchase_Value_QTD × bonus_rate_pct / 100`
  `Days_to_Threshold = (Threshold_Target − Current_Purchases) / Avg_Daily_Purchase_Rate`
- **Variables:** threshold targets defined per distributor contract (manual entry)
- **Input fields:** Purchase invoice totals per distributor, manual threshold config
- **Output:** Progress %, projected bonus in tenge, days to reach threshold
- **Frequency:** Daily update
- **Display priority:** Level 2 (when within 80% of threshold → alert)

---

### 5.8 Classification Formulas

---

**F-35: ABC Classification**
- **Standard:** A = top 80% of revenue, B = next 15%, C = bottom 5%
- **Algorithm:**
  1. Calculate total revenue per SKU for trailing 90 days
  2. Sort SKUs descending by revenue
  3. Calculate cumulative revenue share
  4. Assign: A when cumulative ≤ 80%, B when ≤ 95%, C for remainder
- **Alternative thresholds (pharmacy-specific):** A = 70%, B = 20%, C = 10% (from SEED 1, FarmBazis)
- **Input fields:** Sales history (90-day rolling window recommended)
- **Output:** Enum ('A', 'B', 'C') per SKU
- **Recalculation:** Weekly (Sunday night batch)
- **Display priority:** Level 2 (filter in SKU list)

---

**F-36: XYZ Classification**
- **Formula:**
  1. Calculate monthly sales quantities for trailing 12 months (or available history)
  2. Calculate mean (μ) and standard deviation (σ) of monthly quantity
  3. Coefficient of Variation: `CV = σ / μ`
  4. Assign: X if CV < 0.5, Y if 0.5 ≤ CV < 1.0, Z if CV ≥ 1.0
- **Edge cases:**
  - New SKU (< 3 months data): assign 'Z' by default (unknown demand pattern)
  - Zero sales in all months: assign 'Z' (dead stock candidate)
  - Single month data: CV = 0 → assign 'X' tentatively, flag as "insufficient history"
- **Input fields:** Monthly sales quantity history per SKU
- **Output:** Enum ('X', 'Y', 'Z') per SKU
- **Recalculation:** Monthly (requires full month data)
- **Display priority:** Level 2

---

**F-37: ABC-XYZ Combined Matrix**

| | X (stable) | Y (variable) | Z (erratic) |
|---|---|---|---|
| **A (high revenue)** | AX — predictable top sellers; automate reorder | AY — high value, monitor closely | AZ — high value, irregular; manual management |
| **B (medium revenue)** | BX — routine reorder | BY — standard management | BZ — evaluate necessity |
| **C (low revenue)** | CX — consider reduction | CY — consider elimination | CZ — dead stock candidates; write-off or return |

**Action rules for Provizor:**
- AX/BX: automated reorder suggestion at ROP (F-11)
- AZ: manual reorder, flag for pharmacist review
- CZ: flag for dead stock review, expiry check
- Z overall: increase safety stock multiplier (higher uncertainty)

---

**F-38: VEN Classification (Optional Phase 2)**
- **V = Vital:** Life-critical drugs — must always be in stock regardless of cost
- **E = Essential:** Important for common conditions — maintain high service level
- **N = Non-essential:** Comfort, cosmetics, supplements — can tolerate stockouts
- **Input:** Manual classification by head pharmacist (requires domain knowledge)
- **Use:** Override ABC/XYZ reorder urgency. VEN-V SKUs always maintain minimum safety stock regardless of C-class assignment.
- **Frequency:** Manual, updated quarterly
- **Display priority:** Level 3

---

### 5.9 KZ Regulatory Formulas

---

**F-39: Blended Regulated/Free Margin**
- **Formula:**
  `Regulated_Revenue_Share = Σ Revenue_regulated_SKUs / Total_Revenue`
  `Free_Revenue_Share = 1 − Regulated_Revenue_Share`
  `Blended_Max_GM% = Regulated_Revenue_Share × Avg_Regulated_GM% + Free_Revenue_Share × Alimkhan_markup_GM%`
  Where:
  - `Avg_Regulated_GM%` = weighted average of regulated SKU margins (from regressive scale, F-17)
  - `Alimkhan_markup_GM%` = 30% markup → 23.1% GM (since GM% = markup% / (1 + markup%))
- **Example calculation:**
  If 40% of revenue is regulated (avg regulated markup ~10%) and 60% free (+30% markup):
  `Regulated_GM% = 10 / (1 + 0.10) = 9.09%`
  `Free_GM% = 30 / (1 + 0.30) = 23.08%`
  `Blended_GM% = 0.40 × 9.09% + 0.60 × 23.08% = 3.64% + 13.85% = 17.49%`
- **Output:** Percentage
- **Frequency:** Monthly
- **Display priority:** Level 2

---

**F-40: Price Headroom % (Запас до предельной цены)**
- **Formula:** `Price_Headroom% = (Max_Regulated_Price − Current_Selling_Price) / Max_Regulated_Price × 100`
- **For free-price drugs:** headroom = unlimited (no regulatory ceiling)
- **Output:** Percentage (0–100%; 0% = at ceiling; negative = violation)
- **Use:** Identify regulated SKUs where Alimkhan has room to increase price without violation
- **Frequency:** Recalculate when purchase price or selling price changes
- **Display priority:** Level 3 (pricing optimization screen)

---

## Layer 6: Synthesis — Implementation Specification

### 6.A Input Fields Specification

**Complete list of all inputs required by Provizor:**

#### Manual Entry — Per Pharmacy (Monthly)

| Field | Type | Required | Source | Default |
|---|---|---|---|---|
| pharmacy_id | UUID | Required | System | Auto |
| pharmacy_name | String | Required | Manual | — |
| pharmacy_address | String | Required | Manual | — |
| period_month | Date (YYYY-MM) | Required | Manual/UI | Current month |
| payroll_total_tenge | Decimal | Required | Manual | — |
| rent_total_tenge | Decimal | Required | Manual | — |
| utilities_total_tenge | Decimal | Optional | Manual | 0 |
| admin_costs_tenge | Decimal | Optional | Manual | 0 |
| software_costs_tenge | Decimal | Optional | Manual | 0 |
| marketing_costs_tenge | Decimal | Optional | Manual | 0 |
| loan_interest_tenge | Decimal | Optional | Manual | 0 |
| depreciation_tenge | Decimal | Optional | Manual | 0 |
| tax_rate_pct | Decimal | Required | Manual/Config | 20 |

#### Manual Entry — Per Inventory Audit

| Field | Type | Required | Source | Default |
|---|---|---|---|---|
| audit_date | Date | Required | Manual | — |
| pharmacy_id | UUID | Required | Manual | — |
| book_inventory_value | Decimal | Required | 1С export | — |
| physical_inventory_value | Decimal | Required | Manual count | — |
| shortage_notes | Text | Optional | Manual | — |
| shortage_by_theft_tenge | Decimal | Optional | Manual | 0 |
| shortage_by_admin_error_tenge | Decimal | Optional | Manual | 0 |
| shortage_by_expiry_tenge | Decimal | Optional | Manual | 0 |

#### Manual Entry — Per Distributor Contract

| Field | Type | Required | Source | Default |
|---|---|---|---|---|
| distributor_id | UUID | Required | Manual | — |
| distributor_name | String | Required | Manual | — |
| payment_deferral_days | Integer | Required | Manual | 30 |
| retro_bonus_threshold_tenge | Decimal | Optional | Manual | 0 |
| retro_bonus_rate_pct | Decimal | Optional | Manual | 0 |
| retro_bonus_period | Enum (monthly/quarterly) | Optional | Manual | quarterly |

#### 1С OData Sync — Sales Data (Daily/Hourly)

| Field | Type | Required | Source | Note |
|---|---|---|---|---|
| transaction_id | String | Required | 1С | External ID |
| pharmacy_id | UUID | Required | 1С | Mapped to our pharmacy |
| transaction_date | Timestamp | Required | 1С | — |
| channel | Enum | Required | 1С/Manual | offline/halyk/wolt/iteka |
| sku_id | UUID | Required | 1С | Mapped from 1С barcode |
| units_sold | Integer | Required | 1С | — |
| selling_price_tenge | Decimal | Required | 1С | Actual sold price |
| purchase_price_wac_tenge | Decimal | Required | 1С | Weighted average cost at time of sale |
| channel_commission_pct | Decimal | Optional | Config | Per channel config |

#### 1С OData Sync — Inventory Snapshot (Daily)

| Field | Type | Required | Source | Note |
|---|---|---|---|---|
| snapshot_date | Date | Required | 1С | — |
| pharmacy_id | UUID | Required | 1С | — |
| sku_id | UUID | Required | 1С | — |
| units_remaining | Integer | Required | 1С | End-of-day count |
| purchase_price_wac_tenge | Decimal | Required | 1С | Current WAC |
| inventory_value_tenge | Decimal | Calculated | System | units × WAC |

#### 1С OData Sync — SKU Master Data

| Field | Type | Required | Source | Note |
|---|---|---|---|---|
| sku_id | UUID | Required | 1С | — |
| sku_name | String | Required | 1С | Drug trade name |
| inn_name | String | Optional | 1С | International nonproprietary name |
| barcode | String | Required | 1С | EAN-13 |
| category | Enum | Required | 1С/Manual | Category classification |
| is_regulated | Boolean | Required | Registry | GOMBP/OSMS list |
| max_regulated_markup_pct | Decimal | Calculated | Registry | From F-17 |
| current_selling_price | Decimal | Required | 1С | Per pharmacy |
| current_purchase_price_wac | Decimal | Required | 1С | Current WAC |
| supplier_lead_time_days | Integer | Optional | Manual | 1–7 |
| expiry_date_earliest | Date | Optional | 1С | Earliest expiry in stock |
| abc_class | Enum | Calculated | System | Weekly recalc |
| xyz_class | Enum | Calculated | System | Monthly recalc |
| farmbazis_group | Enum | Calculated | System | From F-13/F-14 |

#### Channel Configuration (Manual, One-Time Setup)

| Field | Type | Required | Default |
|---|---|---|---|
| channel_name | String | Required | — |
| commission_pct | Decimal | Required | 0 |
| avg_fulfillment_cost_pct | Decimal | Optional | 0 |
| payout_delay_days | Integer | Optional | 0 |

---

### 6.B Calculated Fields Specification

| Metric | Formula Ref | Dependencies | Update Frequency |
|---|---|---|---|
| Revenue (daily) | F-01 | Transaction log | Daily aggregation |
| COGS (daily) | F-02 | Transaction log + WAC | Daily aggregation |
| Gross Profit | F-03 | F-01, F-02 | Daily |
| Gross Margin % | F-03 | F-01, F-02 | Daily |
| Realized Markup (УТН) | F-16 | F-01, F-02 | Daily |
| Inventory Turnover (annual) | F-09 | COGS, avg inventory | Monthly |
| Days of Inventory (DOI) | F-10 | Inventory snapshot, COGS | Weekly |
| Reorder Point per SKU | F-11 | Sales history, lead time | Daily |
| Reorder Suggestion | F-12 simplified | ROP, current stock | Daily |
| Dead Stock % | F-13 | Sales history, inventory snapshot | Weekly |
| Dead Stock Value | F-13 | Inventory snapshot, WAC | Weekly |
| Expiry Risk Value | F-14 | Inventory snapshot, expiry dates | Daily |
| Defectura Rate | F-21 | Unfulfilled log / stock-zero days | Daily/Weekly |
| Lost Revenue (defectura) | F-22 | Stock-zero days, avg sales | Weekly |
| Fill Rate % | F-23 | Defectura Rate | Weekly |
| Max Regulated Markup | F-17 | purchase_price, is_regulated | On price change |
| Regulatory Violation Flag | F-17 | selling_price, max_regulated_price | On price change |
| CIS Profitability | F-18 | УТН, S, ТЗ, Кред, Деб | Monthly |
| Per-SKU GM% | F-19 | selling_price, purchase_price | On price change |
| Per-SKU Channel GM% | F-19 | + commission | On price change |
| Channel Net Margin % | F-28 | GM%, commission, fulfillment | Monthly |
| Blended Margin % | F-29 | F-27, F-28 per channel | Monthly |
| Shrinkage Rate | F-24 | Audit results | Per audit |
| Expiry Write-off Rate | F-26 | Write-off records | Monthly |
| ABC Class | F-35 | 90-day revenue per SKU | Weekly |
| XYZ Class | F-36 | 12-month monthly qty | Monthly |
| FarmBazis Group | F-13/F-14 | Stock level, sales history, expiry | Daily |
| DPO | F-31 | AP balance, COGS | Monthly |
| DSO | F-32 | AR balance, revenue | Monthly |
| CCC | F-33 | F-10, F-31, F-32 | Monthly |
| Retro-Bonus Progress | F-34 | Purchase totals per distributor | Daily |
| Payroll % | F-04 | payroll_total, revenue | Monthly |
| OPEX % | F-06 | all OPEX fields, revenue | Monthly |
| EBITDA | F-07 | GP, OPEX | Monthly |
| EBITDA % | F-07 | EBITDA, revenue | Monthly |
| Net Profit | F-08 | EBITDA, D&A, interest, tax | Monthly |
| Net Margin % | F-08 | Net Profit, revenue | Monthly |
| Blended Regulated/Free Margin | F-39 | Revenue split, markup by type | Monthly |

---

### 6.C Data Model — PostgreSQL Schema

```sql
-- ============================================================
-- PROVIZOR DATABASE SCHEMA v1.0
-- Stack: PostgreSQL 16, Bun + Hono backend, Drizzle ORM
-- ============================================================

-- PHARMACIES
CREATE TABLE pharmacies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    address         TEXT NOT NULL,
    city            VARCHAR(100) NOT NULL DEFAULT 'Almaty',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DISTRIBUTORS (suppliers)
CREATE TABLE distributors (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(200) NOT NULL,
    payment_deferral_days       INTEGER NOT NULL DEFAULT 30,
    retro_bonus_threshold_tenge DECIMAL(15,2),
    retro_bonus_rate_pct        DECIMAL(5,2),
    retro_bonus_period          VARCHAR(20) CHECK (retro_bonus_period IN ('monthly','quarterly')),
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CHANNELS (sales channels configuration)
CREATE TABLE channels (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        VARCHAR(50) NOT NULL UNIQUE,
    -- Values: 'offline', 'halyk_market', 'wolt', 'iteka', 'telegram', 'other'
    commission_pct              DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_fulfillment_cost_pct    DECIMAL(5,2) NOT NULL DEFAULT 0,
    payout_delay_days           INTEGER NOT NULL DEFAULT 0,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE
);

-- SKU MASTER (drug/product catalog)
CREATE TABLE skus (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id                 VARCHAR(50),                    -- 1С internal ID
    barcode                     VARCHAR(20),
    trade_name                  VARCHAR(300) NOT NULL,
    inn_name                    VARCHAR(300),                   -- international nonproprietary name
    manufacturer                VARCHAR(200),
    category                    VARCHAR(100) NOT NULL,
    subcategory                 VARCHAR(100),
    dosage_form                 VARCHAR(100),
    is_regulated                BOOLEAN NOT NULL DEFAULT FALSE, -- GOMBP/OSMS registry
    is_prescription_required    BOOLEAN NOT NULL DEFAULT FALSE,
    ven_class                   CHAR(1) CHECK (ven_class IN ('V','E','N')), -- nullable until set
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SKU PER PHARMACY (prices and classification — varies by pharmacy)
CREATE TABLE sku_pharmacy (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id                      UUID NOT NULL REFERENCES skus(id),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    selling_price_tenge         DECIMAL(12,2) NOT NULL,
    purchase_price_wac_tenge    DECIMAL(12,2) NOT NULL,        -- weighted average cost
    max_regulated_price_tenge   DECIMAL(12,2),                 -- NULL if not regulated
    max_regulated_markup_pct    DECIMAL(5,2),                  -- from F-17 lookup
    is_price_violation          BOOLEAN GENERATED ALWAYS AS (
                                    selling_price_tenge > max_regulated_price_tenge
                                    AND max_regulated_price_tenge IS NOT NULL
                                ) STORED,
    supplier_lead_time_days     INTEGER DEFAULT 3,
    reorder_point_units         INTEGER,                        -- calculated F-11
    abc_class                   CHAR(1) CHECK (abc_class IN ('A','B','C')),
    xyz_class                   CHAR(1) CHECK (xyz_class IN ('X','Y','Z')),
    farmbazis_group             VARCHAR(30) CHECK (farmbazis_group IN (
                                    'deficit','normal','excess','illiquid','slow_mover','expiry_risk'
                                )),
    abc_calculated_at           DATE,
    xyz_calculated_at           DATE,
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (sku_id, pharmacy_id)
);

-- INVENTORY SNAPSHOTS (daily, from 1С sync)
CREATE TABLE inventory_snapshots (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    sku_id                      UUID NOT NULL REFERENCES skus(id),
    snapshot_date               DATE NOT NULL,
    units_remaining             INTEGER NOT NULL DEFAULT 0,
    purchase_price_wac_tenge    DECIMAL(12,2) NOT NULL,
    inventory_value_tenge       DECIMAL(15,2) GENERATED ALWAYS AS (
                                    units_remaining * purchase_price_wac_tenge
                                ) STORED,
    earliest_expiry_date        DATE,                           -- from 1С batch tracking
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pharmacy_id, sku_id, snapshot_date)
);

CREATE INDEX idx_inv_snapshot_pharmacy_date ON inventory_snapshots(pharmacy_id, snapshot_date DESC);
CREATE INDEX idx_inv_snapshot_sku_date ON inventory_snapshots(sku_id, snapshot_date DESC);

-- SALES TRANSACTIONS (from 1С sync — line-item level)
CREATE TABLE sales_transactions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id                 VARCHAR(100),                   -- 1С document ID
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    channel_id                  UUID NOT NULL REFERENCES channels(id),
    sku_id                      UUID NOT NULL REFERENCES skus(id),
    transaction_date            DATE NOT NULL,
    transaction_ts              TIMESTAMPTZ NOT NULL,
    units_sold                  INTEGER NOT NULL,
    selling_price_tenge         DECIMAL(12,2) NOT NULL,
    purchase_price_wac_tenge    DECIMAL(12,2) NOT NULL,         -- WAC at time of sale
    -- Calculated fields (stored for performance)
    revenue_tenge               DECIMAL(15,2) GENERATED ALWAYS AS (
                                    units_sold * selling_price_tenge
                                ) STORED,
    cogs_tenge                  DECIMAL(15,2) GENERATED ALWAYS AS (
                                    units_sold * purchase_price_wac_tenge
                                ) STORED,
    gross_profit_tenge          DECIMAL(15,2) GENERATED ALWAYS AS (
                                    units_sold * (selling_price_tenge - purchase_price_wac_tenge)
                                ) STORED,
    channel_commission_amount   DECIMAL(15,2),                  -- NULL if no commission
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_pharmacy_date ON sales_transactions(pharmacy_id, transaction_date DESC);
CREATE INDEX idx_sales_sku_date ON sales_transactions(sku_id, transaction_date DESC);
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date DESC);

-- FINANCIAL INPUTS (manual entry, monthly per pharmacy)
CREATE TABLE financial_periods (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    period_year                 SMALLINT NOT NULL,
    period_month                SMALLINT NOT NULL,              -- 1–12
    payroll_total_tenge         DECIMAL(15,2) NOT NULL DEFAULT 0,
    rent_total_tenge            DECIMAL(15,2) NOT NULL DEFAULT 0,
    utilities_tenge             DECIMAL(15,2) NOT NULL DEFAULT 0,
    admin_costs_tenge           DECIMAL(15,2) NOT NULL DEFAULT 0,
    software_costs_tenge        DECIMAL(15,2) NOT NULL DEFAULT 0,
    marketing_costs_tenge       DECIMAL(15,2) NOT NULL DEFAULT 0,
    loan_interest_tenge         DECIMAL(15,2) NOT NULL DEFAULT 0,
    depreciation_tenge          DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate_pct                DECIMAL(5,2) NOT NULL DEFAULT 20,
    -- Accounts for CCC calculation
    accounts_payable_tenge      DECIMAL(15,2),                  -- month-end AP balance
    accounts_receivable_tenge   DECIMAL(15,2),                  -- month-end AR (marketplace pending)
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pharmacy_id, period_year, period_month)
);

-- INVENTORY AUDITS (physical count results)
CREATE TABLE inventory_audits (
    id                                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                         UUID NOT NULL REFERENCES pharmacies(id),
    audit_date                          DATE NOT NULL,
    book_inventory_value_tenge          DECIMAL(15,2) NOT NULL, -- 1С book value at audit time
    physical_inventory_value_tenge      DECIMAL(15,2) NOT NULL, -- actual counted value
    -- Decomposition of shortage
    shortage_theft_tenge                DECIMAL(15,2) NOT NULL DEFAULT 0,
    shortage_admin_error_tenge          DECIMAL(15,2) NOT NULL DEFAULT 0,
    shortage_resorting_tenge            DECIMAL(15,2) NOT NULL DEFAULT 0,
    shortage_expiry_tenge               DECIMAL(15,2) NOT NULL DEFAULT 0,
    shortage_other_tenge                DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes                               TEXT,
    created_at                          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEFECTURA LOG (stockout / missed demand tracking)
CREATE TABLE defectura_log (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    sku_id                      UUID REFERENCES skus(id),       -- NULL if SKU not in our catalog
    sku_name_requested          VARCHAR(300) NOT NULL,          -- what customer asked for
    log_date                    DATE NOT NULL,
    channel                     VARCHAR(50),                    -- 'offline', 'whatsapp', etc.
    quantity_requested          INTEGER,
    units_available             INTEGER NOT NULL DEFAULT 0,     -- 0 = completely OOS
    was_fulfilled               BOOLEAN NOT NULL DEFAULT FALSE,
    substitute_offered          BOOLEAN DEFAULT FALSE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_defectura_pharmacy_date ON defectura_log(pharmacy_id, log_date DESC);

-- PURCHASE ORDERS (for retro-bonus tracking)
CREATE TABLE purchase_orders (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    distributor_id              UUID NOT NULL REFERENCES distributors(id),
    order_date                  DATE NOT NULL,
    delivery_date               DATE,
    total_amount_tenge          DECIMAL(15,2) NOT NULL,
    payment_due_date            DATE,
    is_paid                     BOOLEAN NOT NULL DEFAULT FALSE,
    payment_date                DATE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_distributor ON purchase_orders(distributor_id, order_date DESC);

-- ============================================================
-- COMPUTED METRICS CACHE (materialized daily after 1С sync)
-- ============================================================

-- DAILY METRICS PER PHARMACY (aggregated from sales_transactions)
CREATE TABLE daily_pharmacy_metrics (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    metric_date                 DATE NOT NULL,
    -- Revenue
    total_revenue_tenge         DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_cogs_tenge            DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_gross_profit_tenge    DECIMAL(15,2) NOT NULL DEFAULT 0,
    gross_margin_pct            DECIMAL(5,2),
    realized_markup_pct         DECIMAL(5,2),                  -- УТН
    transaction_count           INTEGER NOT NULL DEFAULT 0,
    units_sold                  INTEGER NOT NULL DEFAULT 0,
    avg_transaction_value_tenge DECIMAL(12,2),
    -- Per channel breakdown (JSONB for flexibility)
    channel_breakdown           JSONB,                          -- {halyk: {revenue, gp, orders}, offline: {...}}
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pharmacy_id, metric_date)
);

-- MONTHLY METRICS PER PHARMACY
CREATE TABLE monthly_pharmacy_metrics (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id                 UUID NOT NULL REFERENCES pharmacies(id),
    period_year                 SMALLINT NOT NULL,
    period_month                SMALLINT NOT NULL,
    -- P&L
    revenue_tenge               DECIMAL(15,2),
    cogs_tenge                  DECIMAL(15,2),
    gross_profit_tenge          DECIMAL(15,2),
    gross_margin_pct            DECIMAL(5,2),
    realized_markup_pct         DECIMAL(5,2),
    payroll_pct                 DECIMAL(5,2),
    rent_pct                    DECIMAL(5,2),
    opex_pct                    DECIMAL(5,2),
    ebitda_tenge                DECIMAL(15,2),
    ebitda_pct                  DECIMAL(5,2),
    net_profit_tenge            DECIMAL(15,2),
    net_margin_pct              DECIMAL(5,2),
    -- Inventory
    avg_inventory_value_tenge   DECIMAL(15,2),
    doi_days                    DECIMAL(5,1),
    inventory_turnover_x        DECIMAL(5,2),
    dead_stock_value_tenge      DECIMAL(15,2),
    dead_stock_pct              DECIMAL(5,2),
    expiry_risk_value_tenge     DECIMAL(15,2),
    -- Profitability (CIS formula F-18)
    cis_profitability_pct       DECIMAL(5,2),
    -- Cash flow
    dpo_days                    DECIMAL(5,1),
    dso_days                    DECIMAL(5,1),
    ccc_days                    DECIMAL(5,1),
    -- Shrinkage (from audit if available in period)
    shrinkage_rate_pct          DECIMAL(5,2),
    -- Service
    defectura_rate_pct          DECIMAL(5,2),
    fill_rate_pct               DECIMAL(5,2),
    -- Channel margins (JSONB)
    channel_margins             JSONB,
    computed_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pharmacy_id, period_year, period_month)
);

-- CHAIN-LEVEL METRICS VIEW (all pharmacies combined)
CREATE VIEW chain_monthly_metrics AS
SELECT
    period_year,
    period_month,
    COUNT(DISTINCT pharmacy_id)             AS pharmacy_count,
    SUM(revenue_tenge)                      AS chain_revenue_tenge,
    SUM(cogs_tenge)                         AS chain_cogs_tenge,
    SUM(gross_profit_tenge)                 AS chain_gross_profit_tenge,
    AVG(gross_margin_pct)                   AS avg_gross_margin_pct,
    AVG(doi_days)                           AS avg_doi_days,
    AVG(realized_markup_pct)               AS avg_utm_pct,
    SUM(dead_stock_value_tenge)             AS chain_dead_stock_value,
    SUM(expiry_risk_value_tenge)            AS chain_expiry_risk_value,
    AVG(defectura_rate_pct)                 AS avg_defectura_rate_pct,
    AVG(cis_profitability_pct)             AS avg_cis_profitability_pct
FROM monthly_pharmacy_metrics
GROUP BY period_year, period_month;
```

---

### 6.D UI Information Hierarchy

**Based on Alimkhan's mental model (SEED 3): "fast, intuition-driven for daily; slow, anxiety-driven for investments; values simplicity — tell me the ONE number"**

#### Level 0 — The ONE Number (Hero Metric)

**Primary KPI: CIS Profitability % (F-18)**
- Displayed prominently on homepage, chain-level
- Color coded: Green (>25%), Yellow (15–25%), Red (<15%)
- Subtitle: "Рентабельность вложенных средств"
- Context: "Сегодня vs прошлый месяц: [+X%]"

**Why this and not gross margin:**
- Алимкан already knows his markup is ~30%. Seeing "GM 23%" doesn't tell him what to DO.
- CIS Profitability (F-18) shows him whether his inventory is working hard enough — it's actionable.
- When Profitability = Markup%, he knows he's at perfect turnover. When it's lower, he knows he needs to accelerate inventory.

#### Level 1 — Dashboard Summary (5–7 Key Metrics at a Glance)

Displayed as cards across all 5 pharmacies, chain total:

| Card | Metric | Formula | Format | Alert condition |
|---|---|---|---|---|
| 1 | Revenue today / this month | F-01 | 1,234,567₸ | < 80% of same day last month |
| 2 | Gross Margin % | F-03 | 23.4% | < 20% |
| 3 | Days of Inventory | F-10 | 28 days | > 35 days |
| 4 | Dead Stock | F-13 | 1.2M₸ / 8% | > 15% |
| 5 | Expiry Risk | F-14 | 340K₸ / 12 SKUs | any > 0 |
| 6 | Fill Rate | F-23 | 96% | < 94% |
| 7 | Regulatory Violations | F-17 | 0 violations | any > 0 → RED |

**Alert Panel (always visible):**
- SKUs below reorder point (count + click to see list)
- Regulatory price violations (must be zero)
- Expiry within 30 days (SKU count)
- Retro-bonus thresholds approaching (distributor name + % progress)

#### Level 2 — Drill-Down (Per Pharmacy, Per Channel, Per Category)

**Tab: Pharmacies**
- Table: each pharmacy as a row
- Columns: Revenue, GM%, DOI, Dead Stock%, Fill Rate, Profitability%
- Sortable by any column
- Click → opens pharmacy detail

**Tab: Channels**
- Revenue per channel (offline / Halyk / Wolt / iTeka)
- Net Margin per channel (F-28)
- Channel share % (F-27)
- "Unprofitable SKUs on Halyk: X" — click to see list (F-30)

**Tab: P&L (Monthly)**
- Full P&L waterfall (F-01 through F-08)
- Period selector: month / quarter / YTD
- Comparison: vs prior period

**Tab: Inventory**
- DOI trend (line chart, 12 months)
- FarmBazis 6-group breakdown (F-13/F-14) — bar chart + table
- Reorder suggestions list (ROP trigger)

#### Level 3 — Deep Analytics

**Sub-tab: ABC/XYZ Matrix**
- 9-cell heatmap showing count and value of SKUs in each cell
- Click cell → filtered SKU list
- Default filter: CZ class (dead stock / write-off candidates)

**Sub-tab: SKU Profitability**
- Table: all SKUs sorted by contribution margin
- Columns: SKU name, category, ABC, XYZ, GM%, channel margins, turnover days
- Filter: by pharmacy, by category, by class

**Sub-tab: Seasonality**
- Revenue by month (current year vs prior year bar chart)
- Category-level seasonality (sparklines per category)
- Upcoming seasonal peaks (3-month lookahead)

**Sub-tab: Shrinkage Tracker**
- Audit history: date, pharmacy, shrinkage amount, cause breakdown
- Trend chart: shrinkage % over time per pharmacy
- Anomaly highlight: pharmacies above 2% threshold

**Sub-tab: Defectura Log**
- List of logged missed demands
- Filter by pharmacy, date, SKU category
- "Recurrent misses" — SKUs missing 3+ times in 30 days (top candidates to add/reorder)

---

### 6.E Benchmarks Table — Red/Yellow/Green Zones

For a 5-pharmacy KZ chain (Almaty, OTC-heavy, ~17.5M tenge/pharmacy/month):

| Metric | Red 🔴 | Yellow 🟡 | Green 🟢 | Source |
|---|---|---|---|---|
| Gross Margin % | < 18% | 18–22% | > 22% | SEED 1 + KZ OTC-heavy model |
| Realized Markup % (УТН) | < 20% | 20–27% | > 27% | FarmBazis 2024 |
| CIS Profitability % | < 15% | 15–25% | > 25% | FarmBazis 2024 |
| EBITDA % | < 3% | 3–6% | > 6% | CIS pharmacy consensus |
| Net Margin % | < 1% | 1–4% | > 4% | CIS pharmacy consensus |
| Days of Inventory | > 40 | 25–40 | < 25 | FarmBazis + CIS target |
| Inventory Turnover | < 9×/yr | 9–14×/yr | > 14×/yr | PioneerRx 2024 + CIS |
| Dead Stock % | > 15% | 5–15% | < 5% | FarmBazis 2024 |
| Expiry Write-off Rate | > 2% | 0.5–2% | < 0.5% | Pharmacy industry consensus |
| Shrinkage Rate | > 2% | 1–2% | < 1% | PBA Health 2024 |
| Defectura Rate | > 7% | 3–7% | < 3% | CIS pharmacy standard |
| Fill Rate % | < 93% | 93–96% | > 96% | Industry consensus |
| Payroll % | > 15% | 12–15% | < 12% | NCPA 2024 adapted |
| Rent % | > 10% | 8–10% | < 8% | Almaty commercial real estate context |
| OPEX % | > 30% | 25–30% | < 25% | CIS pharmacy model |
| Channel Net Margin (Halyk) | < 5% | 5–15% | > 15% | F-28 model |
| Retro-Bonus Progress | < 50% of threshold | 50–80% | > 80% of threshold | FarmBazis + SEED 3 |

**KZ-Specific Alert Thresholds:**
| Alert | Trigger | Priority |
|---|---|---|
| Regulatory price violation | Any SKU: selling_price > max_regulated_price | CRITICAL (legal risk) |
| Channel margin negative | Any SKU on Halyk/Wolt with net margin < 0 | HIGH |
| Expiry within 30 days | Any SKU count > 0 | HIGH |
| SKU below reorder point | Any SKU: current_stock ≤ reorder_point | HIGH |
| DOI > 40 days | Chain or pharmacy level | MEDIUM |
| Retro-bonus 80% threshold | Per distributor | MEDIUM (opportunity) |
| Dead stock > 15% | Per pharmacy | MEDIUM |
| Shrinkage > 2% | Per audit | HIGH |
| Defectura rate > 7% | Per pharmacy per period | MEDIUM |

---

## Self-Check

- [x] **Every claim traced to 2+ independent sources where possible:**
  - Gross margin benchmarks: NCPA 2024 + PBA Health 2024 + insightsoftware
  - KZ regulated markups: pharmnewskz.com + aipm.kz (both confirmed)
  - KZ market size: pharmreviews.kz 2024 + pharmnewskz.com 2025
  - Inventory turnover benchmarks: PioneerRx 2024 + FarmBazis 2024 + PBA Health 2024
  - Shrinkage benchmark: PBA Health 2024 + invue.com 2024
  - ABC/XYZ methodology: PMC 2022 + BioMed 2023
  - CIS profitability formula: FarmBazis 2024 (single source, medium confidence — standard CIS formula, internally consistent)
  - Seasonal coefficients: provizum.ru + iq-provision.ru (2 sources)
  - Defectura methodology: iq-provision.ru + med-academia.ru (2 sources)
  - Retro-bonus framework: verdicto.ru + suvorov.legal + ipaa.kz (3 sources)

- [x] **Each source URL verified as live:** All URLs from SEED 1, 2, 3 were verified during seed research phase (2026-04-04)

- [x] **Publication dates noted:**
  - NCPA Digest 2024 — October 2024 — recent
  - KZ regulated markup scale — February 2025 — very recent, effective March 2025
  - PharmReviews.kz KZ market — early 2025 covering 2024 — recent
  - FarmBazis formulas — 2023–2024 — recent enough
  - PBA Health shrinkage — 2024 — recent
  - ABC/XYZ PMC study — 2022 — 4 years old, but methodology is stable (unchanged since 1990s)

- [x] **Conflicting sources documented:**
  - US gross margin 19.7% (NCPA, Rx-heavy) vs KZ OTC-heavy 25–35% estimate — NOT conflicting, different market structure. Documented in Layer 1.
  - FarmBazis 15–25 day DOI target vs US 30-day target — both cited; CIS target stricter.
  - ABC thresholds: A=80% (NCPA standard) vs A=70% (FarmBazis) — both presented; 80% used as default.

- [x] **Confidence level assigned after checking:**
  - Wolt commission rate (~25–30%): LOW confidence — marked as "estimate, confirm with actual contract"
  - KZ blended gross margin (25–35%): MEDIUM — estimated from known markup rates and market structure; no KZ-specific published benchmark found
  - July 2025 KZ dynamic ceiling enforcement details: MEDIUM — rule confirmed enacted, implementation details unclear
  - Alimkhan's OSMS revenue share: UNKNOWN — no data available without actual pharmacy records

- [x] **Numerical facts from source, not training data:**
  - 5,936 regulated SKUs: pharmnewskz.com February 2025
  - 17.5M tenge/month avg Almaty pharmacy: PharmReviews.kz calculation (22.8B / 1,300)
  - 19.7% US gross margin: NCPA Digest 2024
  - 11×/year national avg turnover: PioneerRx 2024
  - >2% shrinkage: PBA Health 2024
  - 43% customers go to competitor during stockout: iq-provision.ru (MEDIUM confidence)
  - Regressive markup table: pharmnewskz.com + aipm.kz 2025

- [x] **Scope boundaries stated:**
  - Investigated: KZ/CIS pharmacy unit economics, US benchmarks for methodology, global best-in-class tools, academic ABC/XYZ literature, KZ regulatory framework, PostgreSQL schema patterns
  - NOT investigated: Hospital pharmacy models, specialty pharmacy, Chinese/Asian pharmacy models, WHO retail pharmacy economic framework (appears not to exist for retail), actual Alimkhan pharmacy data (unavailable), Wolt/Halyk actual commission contracts (require Alimkhan to share)

- [x] **Known gaps stated:**
  1. **Wolt commission rate:** Estimated at 25–30% based on general food delivery platform norms. MUST be confirmed with Alimkhan's actual Wolt for Business contract before implementing channel margin calculations.
  2. **Halyk Market commission tiers:** The 5–19% range is for Halyk marketplace generally. Pharmacy category may have different tiers. Confirm via Alimkhan's seller account.
  3. **KZ blended gross margin benchmark:** No KZ-specific published benchmark exists. The 25–35% estimate is derived from known markup policies and market structure.
  4. **OSMS/GOMBP revenue share for Alimkhan:** Unknown. This is the single most important unknown for accurate margin modeling. If OSMS drugs are 60% of revenue (possible for prescription pharmacy), blended margins are much lower than if OTC drives 80%.
  5. **IS MPT integration (July 2025 rule):** No API or integration spec found. Marked as Phase 2 feature pending regulatory clarification.
  6. **1С OData entity names for pharmacy-specific fields:** Generic 1С OData is documented. Pharmacy-specific fields (is_regulated flag, drug marking codes, serial numbers) require verification against Alimkhan's actual 1С installation.
  7. **Defectura baseline for Alimkhan's pharmacies:** WhatsApp inquiry volume is 30/day, but what % result in "не в наличии" is unknown. First 30 days of service will establish this baseline.

---

## Implementation Notes for Developer

### Priority Order (MVP for April 5 meeting)

**Phase 0 (Demo — April 5, static data):**
- Simple P&L form: revenue, COGS, payroll, rent, utilities → compute GM%, EBITDA%, Net Margin%
- DOI calculator: input avg inventory + monthly COGS → output days
- CIS Profitability calculator: input УТН%, S, ТЗ → output рентабельность %
- KZ markup checker: input cost price + is_regulated → show max markup, current markup, violation flag
- No 1С integration needed for demo — manual input is sufficient

**Phase 1 (Production MVP — 2–4 weeks):**
- Full PostgreSQL schema above (minus defectura_log, purchase_orders — defer to Phase 2)
- Manual input for all financial_periods fields
- 1С CSV import (export from 1С → upload CSV → parse → insert sales_transactions)
- Daily metrics aggregation job (compute daily_pharmacy_metrics from transactions)
- Monthly metrics aggregation job
- Dashboard: Level 0 + Level 1 (hero metric + 7 cards + alert panel)
- Per-pharmacy comparison table

**Phase 2 (Full Product — 4–8 weeks):**
- 1С OData live sync (hourly)
- ABC/XYZ classification engine (weekly batch)
- Defectura log (manual entry UI)
- Retro-bonus tracker
- Channel margin analysis (SKU-level Halyk flagging)
- Full drill-down (Level 2 all tabs)
- Expiry risk alerts

**Phase 3 (Advanced — 8–16 weeks):**
- Demand forecasting (moving average + seasonal coefficients)
- EOQ reorder optimization
- VEN classification
- IS MPT price monitoring (when July 2025 rule API becomes available)
- Multi-pharmacy inter-location stock visibility

### Tech Stack Decision

Confirmed: Bun + Hono + PostgreSQL + React (as per project brief)

```
backend/
  src/
    routes/
      pharmacies.ts      — CRUD pharmacies
      metrics.ts         — computed metrics API
      skus.ts            — SKU master + classification
      financials.ts      — manual P&L input
      alerts.ts          — alert generation
    jobs/
      daily-metrics.ts   — aggregation job (run post-1С sync)
      abc-xyz.ts         — classification batch (weekly)
      expiry-alerts.ts   — daily expiry check
    db/
      schema.ts          — Drizzle ORM schema (matches SQL above)
      migrations/        — Drizzle migration files
    utils/
      formulas.ts        — all F-01 through F-40 as pure functions

frontend/
  src/
    pages/
      Dashboard.tsx      — Level 0 + Level 1
      Pharmacies.tsx     — per-pharmacy comparison
      PnL.tsx            — P&L drill-down
      Inventory.tsx      — DOI, dead stock, FarmBazis groups
      AbcXyz.tsx         — classification matrix
      Channels.tsx       — multi-channel margin analysis
    components/
      MetricCard.tsx     — single KPI card with RAG status
      AlertPanel.tsx     — alert list
      PharmacyTable.tsx  — comparison table
```

### Formula Implementation Order (formulas.ts)

Implement in this order — each depends on prior:

1. F-01 (Revenue) — base for everything
2. F-02 (COGS) — base for everything
3. F-03 (Gross Profit, GM%) — core output
4. F-16 (УТН) — CIS standard
5. F-10 (DOI) — most actionable inventory metric
6. F-17 (KZ Markup Validation) — compliance critical
7. F-18 (CIS Profitability) — hero metric
8. F-13 (Dead Stock) — direct action trigger
9. F-14 (Expiry Risk) — direct action trigger
10. F-21 (Defectura Rate) — once logging in place
11. F-04–F-08 (Full P&L waterfall) — monthly inputs required
12. F-35 (ABC) — requires 90-day sales history
13. F-36 (XYZ) — requires 12-month history
14. F-28 (Channel Net Margin) — after channel config
15. F-31–F-33 (CCC) — requires AP/AR tracking

---

*Research conducted: 2026-04-04*
*Sources: 3 SEED research files + synthesis of 15+ cited sources*
*Author: Claude Sonnet 4.6 (Provizor DEEP Research Agent)*
*Status: Implementation-ready. Developer can build directly from this document.*
