# SEED 3: Pharmacy Business Logic & Decision-Making
> Type: SEED | Date: 2026-04-04 | Agent: Sonnet | Scope: Russia/Kazakhstan pharmacy operations

---

## Ranked Signals

| # | Signal | Confidence | Expertise Value | Source |
|---|--------|-----------|----------------|--------|
| 1 | Inventory turnover is the single most powerful lever for pharmacy profitability — improving turnover from 36→24 days increases profitability by 50% without changing markup | HIGH | 10/10 | farmbazis.ru, 2024 |
| 2 | Kazakhstan market consolidating fast: chain pharmacies now hold 76% of total retail turnover; 9,324 total pharmacies, 4,556 chain | HIGH | 9/10 | pharmnewskz.com, 2025 |
| 3 | ~90-95% of pharmacy chains (including large ones) lack proper category management — major competitive gap | MEDIUM | 9/10 | mosapteki.ru, date unknown |
| 4 | Seasonality is extreme: cold/flu season (Q4) = 53-55% of annual sales; summer = minimum. Seasonal coefficient can reach 600% for some categories | HIGH | 9/10 | provizum.ru, iq-provision.ru |
| 5 | Chains >5 pharmacies cannot maintain individualized assortment matrices per store — requires centralized matrix + standard ordering | HIGH | 8/10 | mosapteki.ru |
| 6 | Over 64% of independent pharmacies experience inventory-related losses annually (NCPA survey) | HIGH | 8/10 | pharmacytimes.com, NCPA |
| 7 | Manual ordering creates 30-36% excess inventory in low-turnover items — key source of dead stock | HIGH | 8/10 | farmbazis.ru |
| 8 | US independent pharmacy gross margin benchmark: ~21% (dropped to 19.7% in 2024). Inventory turnover ideal: 10-12x/year (every 30 days) | HIGH | 7/10 | fleming-advisors.com, NCPA Digest 2024 |
| 9 | Centralized ordering for 10+ pharmacy chains increases gross profit 3-15%; category management adds 10-12% | HIGH | 8/10 | mosapteki.ru |
| 10 | Retro-bonuses from suppliers are standard in pharma distribution — paid retroactively upon hitting volume thresholds | HIGH | 7/10 | verdicto.ru, suvorov.legal |
| 11 | Small chains (3-5) should use democratic management style; all decisions concentrated in 1-2 people enabling fast response | MEDIUM | 7/10 | pharmvestnik.ru, mosapteki.ru |
| 12 | Pharmacist theft detection: primary method is inventory audits; employees have 2 business days to explain shortages in writing | HIGH | 8/10 | pharmskills.ru |
| 13 | Almaty pharmacy market: Rauza-ADE dominates with 25.71-25.92% share; top 3 chains control ~40% of city turnover | HIGH | 7/10 | pharmnewskz.com, 2024-2025 |
| 14 | "Missed demand" tracking (recording requested items not in stock) is a key informal practice by experienced pharmacy staff | MEDIUM | 9/10 | multiple Russian pharmacy forums |
| 15 | Payment deferral (отсрочка платежа) from suppliers is standard and critical for cash flow — typical terms 14-45 days | HIGH | 7/10 | law.ru, multiple sources |

---

## Daily Decision Patterns

### What a Pharmacy Owner/Manager Checks Every Morning

Based on synthesis of pharmacy management sources (iq-provision.ru, mosapteki.ru, multiple operational guides):

**Morning opening routine (first 30 minutes):**
1. Previous day's revenue vs plan — was the daily target met?
2. Cash register reconciliation — any discrepancy overnight?
3. Critical stock alerts — what's about to run out?
4. Pending supplier orders — what's due for delivery today?
5. Staff attendance — who's working, any absences to cover?
6. Expiry check — any products expiring this week?

**Daily decisions (made by manager/owner):**
- Reorder decisions for fast-moving SKUs (daily or every 2-3 days for high-velocity items)
- Handling customer complaints and atypical requests
- Pricing corrections for competitive products
- Staff scheduling adjustments
- WhatsApp inquiries routing (in smaller operations the owner handles these directly)

**Weekly decisions:**
- ABC/XYZ analysis review — which categories are underperforming?
- Reviewing "missed demand" — what did customers ask for that wasn't available?
- Reconciliation with major suppliers
- Inter-pharmacy stock rebalancing (if chain)
- Training/briefing for staff

**Monthly decisions:**
- Full inventory revision (аптека Алимкана: monthly manual revision is standard for their stage)
- Supplier relationship review — retro-bonus threshold tracking
- Assortment matrix adjustments — adding/removing SKUs
- Financial performance review — turnover, margin, profit per pharmacy
- Expiry risk management — planning promotions or returns for items nearing expiry

### Key Metrics Actually Used in Daily Operations

From farmbazis.ru and operational sources:
- **Оборачиваемость (Turnover in days)**: ТЗ / S × 30 — target 15-25 days for well-run pharmacies
- **Выручка vs план (Revenue vs target)**: daily/weekly/monthly
- **Уровень сервиса (Service level)**: % of demand satisfied from stock — target 94-97%
- **Дефектура (Stockout rate)**: % of SKUs that went to zero — critical to minimize
- **Просрочка (Expiry losses)**: % of goods written off due to expiry
- **Недостача (Shortage/theft)**: detected at inventory; compared against norm

---

## Mistakes & Failure Cases

### Most Common Inventory Management Mistakes

**1. Ordering by habit, not by algorithm**
- Most pharmacies order based on "how we usually do it" (e.g., always order 4-5 units of X) rather than calculating from actual consumption rate + lead time
- Result: some SKUs chronically overstock, others chronically understock
- Source: farmbazis.ru (HIGH confidence)

**2. Not separating ABC categories in purchasing**
- Treating a Category A drug (20% of SKUs, 80% of sales) the same as Category C
- Category A needs daily/frequent monitoring; Category C can be reviewed weekly
- Fix: implement ABC+XYZ matrix, category-specific reorder rules
- Source: multiple Russian pharmacy management sources (HIGH)

**3. Manual corrections destroying algorithmic order accuracy**
- When automated ordering is introduced but managers override 50%+ of suggestions based on intuition
- "Psychological resistance to minimal stock levels" — managers feel safer with more stock
- Source: farmbazis.ru (HIGH)

**4. Dead stock accumulation (6 known causes)**
- Incorrect demand forecasting for seasonal or one-time items
- Purchasing based on supplier promotions/discounts rather than actual demand
- Poor assortment decisions (bringing in untested SKUs)
- Changing patient behavior (doctor stops prescribing a drug)
- Competition-driven price undercutting making own stock non-competitive
- Expiry stock not rotated (FIFO/FEFO not followed)
- Source: iq-provision.ru (HIGH)

**5. Assortment bloat**
- 6-7K SKUs is manageable but requires systematic ABC analysis — without it, ~20% of SKUs generate 80% of losses
- Small chains trying to match large chains' assortment breadth with insufficient capital
- Source: mosapteki.ru (MEDIUM)

**6. Pricing mistakes — two failure modes**
- Too high on competitive/marker products → customers go to competitor, volume drops
- Too low across the board → margins evaporate, can't sustain losses on non-competitive items
- "Increased markups can decrease sales" — price elasticity is high for common medications
- Kazakhstan context: market has "аптеки низких цен" competing aggressively; Almaty has Rauza-ADE with 25%+ market share
- Source: imprice.ru, pharmvestnik.ru (HIGH)

**7. Theft/shortage ignored until inventory**
- Monthly manual inventory (Алимкан's current practice) is the industry minimum, but leaves 30-day windows for accumulating losses
- Pharmacist schemes: register manipulation, not scanning items, returning items to stock after "sale"
- Prevention: segregation of duties, two-person rule, regular spot checks, camera surveillance, daily cash reconciliation
- Source: pharmskills.ru, rld.nm.gov (HIGH)

### Case Pattern: Unprofitable → Profitable

No direct case study found for Kazakhstan, but the transformation pattern from Russian sources is consistent:

**Phase 1 (unprofitable):** Owner looks at revenue only; stock turnover is 35-45 days; dead stock 15-25% of total inventory; reordering done by pharmacist intuition; no ABC analysis; pricing uniform markup (+30% cost = their current approach)

**Phase 2 (intervention):** Introduce systematic ABC/XYZ analysis; set turnover targets per category; automate reorder calculation; implement FEFO for expiry management; differentiate pricing (competitive on A-items, maintain margin on C-items); reduce assortment breadth to high-movers

**Phase 3 (profitable):** Turnover drops to 15-25 days; dead stock < 5%; service level maintained at 94-97%; profitability increases 30-50% from turnover improvement alone (math from farmbazis.ru)

---

## Supplier & Procurement Logic

### How Pharmacies Actually Buy

**Distributor landscape (Kazakhstan):**
- Pharmacies work through distributors (дистрибьюторы), not directly with manufacturers in most cases
- Major distributors operate nationally; regional ones add coverage in smaller cities
- A pharmacy typically works with 3-7 distributors simultaneously to ensure availability and price competition

**Payment terms (отсрочка платежа):**
- Standard deferral: 14-30 days for smaller pharmacies, up to 45-60 days for established chains
- Negotiating longer deferrals is a primary cash flow lever — pharmacy receives goods, sells them, then pays
- Missing payment deadlines damages supplier relationships and can result in credit limit reduction

**Retro-bonuses (ретро-бонусы):**
- Paid retroactively by distributor/manufacturer to pharmacy upon reaching volume thresholds
- Structure: percentage of total purchases over a period (month/quarter)
- Example: "Buy 500K tenge worth of Product X this quarter, get 5% back"
- For small chains: retro-bonuses may be 2-8% of purchase volume — significant income
- Requires active tracking: pharmacy owner must know which thresholds are close and plan orders accordingly
- Kazakhstan tax context: retro-bonuses are subject to taxation (confirmed by IPAA Kazakhstan)
- Source: verdicto.ru, suvorov.legal, ipaa.kz (HIGH)

**Volume discounts:**
- Direct discounts for larger single orders
- Minimum order quantities (МОЗ) often force pharmacies to buy more than needed — creates dead stock risk
- Trade-off: lower per-unit cost vs higher inventory carrying cost

**Supplier selection for same drug:**
- Price difference between distributors for same SKU can be 5-15%
- Pharmacies compare quotes from multiple distributors before ordering
- Relationship value: reliable distributor who delivers on time > cheapest distributor with delivery problems
- Emergency suppliers: most pharmacies have 1-2 "emergency" distributors with small minimums for urgent needs

**How small chains (3-5 pharmacies) typically procure:**
- Either each pharmacy orders independently (pharmacist or manager calls/orders online)
- Or owner centralizes — reviews orders from all locations, consolidates, submits to distributor
- Centralization benefits: better volume discounts, retro-bonus thresholds hit faster, avoids duplicate purchases
- Sources: iq-provision.ru, mosapteki.ru (HIGH)

---

## Seasonality Patterns

### Annual Sales Cycle

**Q1 (January-March):** 
- February-March: second peak for cold/flu products (post-New Year surge)
- March: antihistamines start rising (early allergy season)
- Overall: moderate, declining from Q4 peak

**Q2 (April-June):**
- April-May: peak antihistamine season (seasonal allergies, pollinosis)
- Transition to summer products: sunscreen, insect repellents, anti-fungals
- Cognitive enhancers (ноотропы) and hepatoprotectors increase in spring

**Q3 (July-September):**
- Minimum overall sales volume
- Products selling: sunscreen, anti-diarrheal, urological, anti-fungal
- September: start of back-to-school surge; immune boosters, vitamins

**Q4 (October-December):**
- October-November: pre-season preparation products, vitamins, immune stimulators
- November-December: peak — cold/flu season, 53-55% of annual sales concentrated here
- Highest single demand period: November-December for antivirals, antipyretics

**Seasonality coefficient examples:**
- Antivirals in December: KC ~300-400% of annual average
- Sunscreen in July: KC ~600% of annual average
- Antihistamines in May: KC ~250-300% of annual average
- Source: provizum.ru (HIGH confidence)

### Procurement Lead Times for Seasonality

Industry practice:
- Begin ordering seasonal stock **6-14 weeks before peak demand**
- Sunscreen/summer products: order in April for July peak
- Cold/flu products: order in August-September for November peak
- Monitor epidemiological forecasts (in Kazakhstan: Committee for Sanitary Epidemiological Control)

### Kazakhstan Climate Specifics

- Almaty: continental climate, cold winters (-15°C typical), hot summers (+35°C)
- Flu season alignment: similar to Russian pattern, November-March
- Spring allergy season: late April-May (poplar, steppe grasses)
- Summer: heat-related health issues, GI infections higher risk
- These patterns are predictable and well-known to experienced pharmacists
- Source: inference from climate data + Russian pharmacy seasonality patterns (MEDIUM confidence, needs local validation)

---

## Small Chain Management

### 3-5 Pharmacy Chain Specifics

**Organizational structure:**
- Owner-operator model: owner makes strategic decisions, each pharmacy has a заведующий (head pharmacist/manager)
- Owner typically visits each location 1-3x per week
- Morning review of all pharmacies' sales via software/phone
- Democratic management style recommended (vs authoritarian for crisis, libertarian for high-skill teams)

**Decision authority split:**
- Owner decides: assortment additions/removals, pricing strategy, supplier contracts, major purchases, staffing
- Head pharmacist decides: day-to-day orders within approved matrix, staff scheduling, local customer service
- Pharmacist decides: product recommendations, substitutions when item not available

**Centralization status at 5-pharmacy scale:**
- 5 pharmacies is transition point: can still be individually managed but efficiency gains from centralization start to matter
- If >5 pharmacies: cannot maintain individual assortment matrices — requires unified matrix
- Алимкан's 5 pharmacies: likely at the point where centralized purchasing would immediately improve profitability

**Inter-pharmacy stock transfers:**
- For small chains: "phone call" logistics — head pharmacist at location A calls location B to check availability
- In automated systems: transfer order created, physical delivery (owner's car or courier)
- Risk: transfer without documentation creates internal accounting problems
- Small chains often resist transfers due to effort — this leads to simultaneous overstocking in one pharmacy and stockouts in another
- Source: iq-provision.ru, mosapteki.ru (MEDIUM confidence)

**Owner-operator vs hired manager:**
- When owner is present: faster decisions, higher accountability, better theft control
- When hired manager: risk of misalignment, need for clear KPIs and reporting structure
- Common pattern: owner handles all 5 pharmacies personally at first, then hires manager when overwhelmed — creates control gap
- Source: multiple pharmacy management articles (MEDIUM)

**Technology typical at 5-pharmacy scale:**
- 1C:Аптека (dominant in Kazakhstan, confirmed by 1c-rating.kz) or similar pharmacy software
- Basic reporting: daily sales, stock levels, order history
- What's usually MISSING: automated reorder calculation, ABC/XYZ analysis, inter-pharmacy visibility
- Source: 1c-rating.kz, maksoft-optima.ru (HIGH)

---

## Expert Voices

### From Russian Pharmacy Management Literature

**On inventory management (farmbazis.ru):**
> "Improvement in inventory turnover is the most effective way to increase profitability. Rather than raising prices (which risks customer loss), optimizing stock levels proves more practical."

> "Automatic ordering algorithms are essential yet 'practically absent' in most pharmacy software. Manual adjustments typically create 30-36% excess inventory in low-turnover items, undermining profitability gains."

**On category management (mosapteki.ru):**
> "Approximately 90-95% of pharmacy chains, including large ones, lack proper category management, representing a critical competitive disadvantage."

> "Chains exceeding 5 locations cannot maintain individualized assortment matrices per store."

**On small pharmacy advantages (pharmvestnik.ru):**
> "Small business format allows faster decisions on inventory adjustments based on local customer needs."
> "All decisions are typically concentrated in one person's hands — this enables rapid implementation."

**On daily practice (provizor forum synthesis):**
> "Fix in a notebook those medications that customers frequently ask for but aren't available — make sure to always have at least a few packages, even if the drug isn't cheap." [Practical tip from experienced pharmacist]

**On theft/losses:**
> "Workers are not legally responsible for theft of goods displayed in open-access retail areas, as pharmacists cannot watch all inventory even with video surveillance."
> Implication: closed storage for high-value items is necessary; open display creates unavoidable shrinkage.

**On profitability math (farmbazis.ru):**
> "At 30-day turnover with balanced payables/receivables, profitability equals the markup percentage."
> At +30% markup (Алимкан's current setting) and 30-day turnover → theoretical profitability = 30%.
> At 45-day turnover with same markup → profitability drops to ~20%.
> At 20-day turnover → profitability rises to ~45%.

---

## Mental Model: Pharmacy Owner (Алимкан Archetype)

Based on synthesis of all research, here is what a pharmacy owner managing 5 pharmacies in Kazakhstan with ~3 years experience likely thinks about, worries about, and optimizes for:

### What Алимкан Looks At Every Morning
- Did each pharmacy hit yesterday's revenue target?
- Any unusual shortages or complaints from head pharmacists?
- What large deliveries are expected today?
- Is anyone calling in sick?

### What Keeps Him Up at Night
1. **Theft by pharmacists** — he knows it happens, can't fully prevent it, monthly inventory is too infrequent to catch patterns early
2. **Mis-sorting (пересорт)** — pharmacist gives wrong drug or wrong quantity, creates liability + inventory discrepancy
3. **Dead stock building up** — money frozen in inventory that won't sell before expiry
4. **Cash flow** — being squeezed between supplier payment deadlines and aggregate collection rate
5. **Competition from chains** — Rauza-ADE and others in Almaty are aggressively expanding with better pricing on marquee products
6. **Aggregator dependency** — Halyk Market/Wolt/iTeka bring volume but at what margin cost? (unknown from his perspective)

### What He Optimizes For (Consciously)
- Revenue per pharmacy per day — simple, visible metric
- Not running out of fast-moving items (дефектура = customer goes to competitor = lost forever)
- Supplier relationships — good payment history = better terms, better service
- Staff reliability — each head pharmacist needs to be trustworthy

### What He Doesn't Optimize For (Yet) — The Hidden Opportunity
- Inventory turnover in days — probably doesn't calculate this explicitly
- ABC/XYZ categorization — probably does it intuitively but not systematically
- True profitability per SKU — knows some things sell well but may not know which are actually profitable after markup
- Retro-bonus threshold tracking — probably aware of retro-bonuses but doesn't actively manage them
- Inter-pharmacy stock visibility — each pharmacy managed somewhat independently
- Demand forecasting for seasonality — probably reactive (runs out of flu meds in November) rather than proactive

### Decision-Making Style (Probable)
- Fast, intuition-driven for small daily decisions
- Slow, anxiety-driven for large investment decisions (new supplier, new location)
- Trusts head pharmacists until something goes wrong, then micro-manages temporarily
- Responds to problems rather than preventing them (reactive mode)
- Values simplicity: "tell me the number I need to watch" over complex dashboards

### What Would Make His Life Noticeably Better
- Single view of all 5 pharmacies' stock, sales, and orders in one place
- Early warning: "this SKU will run out in 3 days"
- Automated answer to "should I reorder X and how much?"
- Clear identification of which pharmacists have suspicious patterns
- Seasonal purchasing recommendations before he has to react

---

## Gaps

### What This Research Did NOT Cover
1. **Алимкан-specific data**: no direct interviews, no actual data from his 5 pharmacies. All patterns are from Russian/Kazakhstan general sources.
2. **Aggregator margin impact**: no data found on actual margin impact of Halyk Market / Wolt sales for Kazakhstan pharmacies. Are these profitable channels?
3. **Kazakhstan distributor specifics**: which distributors dominate, actual payment term norms in KZ context, retro-bonus structures in Kazakhstan market (found general info, not KZ-specific)
4. **WhatsApp order management**: 30 daily WhatsApp inquiries is a significant operational pattern — no research found on how pharmacies manage this channel at scale
5. **Regulatory environment**: Kazakhstan drug markup regulations (есть ли регулируемые наценки?), mandatory drug marking impact on small chains
6. **Actual Almaty competition at local level**: large chains' presence in specific districts where Алимкан operates
7. **Real inventory turnover benchmarks for CIS/Kazakhstan context**: US benchmarks (10-12x/year) may not apply; Russian farmbazis.ru suggests 15-25 days optimal for CIS pharmacies
8. **Supplier credit programs in Kazakhstan**: whether Kazakh distributors offer special programs for small chains
9. **Peresorting (пересорт) patterns**: found that this is a problem but no data on frequency or financial impact
10. **Staff wage structure**: how pharmacists are paid in Kazakhstan — base + commission? flat salary? this affects incentive alignment

---

## DEEP Candidates

| Topic | Priority | Rationale |
|-------|----------|-----------|
| Inventory turnover optimization for Provizor | P0 | This is the single biggest lever for profitability — need formulas, implementation approach, and how to build this into the product |
| ABC/XYZ analysis for pharmacy automation | P0 | Core feature; need exact algorithm, edge cases, display UX |
| Aggregator margin economics (Halyk Market/Wolt) | P1 | Алимкан has 43 sales/day on Halyk Market — is this profitable? What are the fees? Does Provizor need to track this channel separately? |
| Kazakhstan pharmacy regulation & price controls | P1 | Are there legal constraints on markup levels? Mandatory marking status and its impact on small chains? |
| Theft detection patterns & automated anomaly detection | P1 | High pain point for Алимкан; what signals predict pharmacist theft? can we build a detection system? |
| Demand forecasting for small pharmacy (seasonal) | P1 | Seasonality is extreme (53-55% in Q4) — how to build seasonal forecasting with only 1-2 years of history? |
| Supplier relationship management & retro-bonus tracking | P2 | Tracking retro-bonus thresholds could be a high-value feature with near-zero implementation cost |
| Inter-pharmacy stock transfer logic | P2 | When to transfer vs reorder; transfer cost vs stockout cost; routing logic |
| WhatsApp order processing automation | P2 | 30 daily inquiries × 5 pharmacies = 150 inquiries/day — significant operational load |

---

## Self-Check

- [x] Every claim traced to 2+ independent sources where possible; single-source claims marked with confidence level
- [x] Each source URL verified as live (all URLs returned valid content during research session)
- [x] Publication dates noted: pharmnewskz.com 2025, farmbazis.ru 2024, NCPA Digest 2024; some Russian pharmacy management articles undated (marked MEDIUM confidence)
- [x] Conflicting sources: US benchmarks (gross margin 19-21%) may not apply to Kazakhstan; Russian farmbazis.ru suggests different turnover benchmarks — both noted without resolution
- [x] Confidence levels assigned after checking, not before
- [x] Numerical facts injected from sources: turnover benchmarks from farmbazis.ru, market share from pharmnewskz.com, NCPA statistics from pharmacytimes.com
- [x] Scope boundaries stated: primarily Russia/Kazakhstan pharmacy management literature; no direct field research with Алимкан; US benchmarks flagged as potentially non-applicable
- [x] Known gaps stated explicitly in Gaps section

---

## Sources Reference

1. [farmbazis.ru — Inventory Management Efficiency Analysis](https://farmbazis.ru/inventory-management-efficiency/) — Core metrics, profitability formulas
2. [farmbazis.ru — Profitability and Turnover](https://farmbazis.ru/profitability-and-turnover/) — Turnover-profitability math
3. [pharmnewskz.com — Kazakhstan Pharmacy Market Architecture 2025](https://pharmnewskz.com/ru/article/aptechnyy-rynok-kazahstana-inflyacionnyy-rost-i-novaya-arhitektura-setey_25877) — Market structure data
4. [pharmnewskz.com — Top 15 Pharmacy Chains Kazakhstan 2024](https://pharmnewskz.com/ru/article/top-15-aptechnyh-setey-na-roznichnom-rynke-kazahstana-v-2024-godu_24396) — Competitive landscape
5. [provizum.ru — Seasonal Products in Pharmacy](https://provizum.ru/articles/sezonnye-tovary-v-apteke-kak-sformirovat-assortiment-i-podgotovitsya-k-sprosu/) — Seasonality patterns and coefficients
6. [iq-provision.ru — Seasonal Products](https://iq-provision.ru/articles/sezonnye-tovary-v-apteke) — Seasonal demand calendar
7. [mosapteki.ru — Pharmacy Chain Management](https://mosapteki.ru/material/aptechnye-seti-pravilno-upravlyat-i-vyigryvat-8011) — Chain management insights
8. [pharmvestnik.ru — Advantages of Small Pharmacy Chains](https://pharmvestnik.ru/content/articles/V-chem-preimushestva-odinochnyh-i-nebolshih-setevyh-aptek.html) — Small chain dynamics
9. [pharmskills.ru — Material Liability in Pharmacy](https://pharmskills.ru/media/articles/materialnaya-otvetstvennost-v-apteke-razbor-realnykh-situatsiy/) — Theft/loss cases
10. [fleming-advisors.com — Pharmacy Profitability Metrics](https://www.fleming-advisors.com/post/the-pharmacy-profitability-playbook-understanding-key-metrics-and-margins) — US benchmarks
11. [pharmznanie.ru — Pharmacist Material Liability](https://pharmznanie.ru/article/materialnaya-otvetstvennost-farmacevta-apteki) — Legal framework for losses
12. [proximaresearch.com — Kazakhstan Q1 2025 Pharma Market](https://proximaresearch.com/kz/en/news/pharmaceutical-market-of-kazakhstan-stability-and-challenges/) — Market size data
13. [iq-provision.ru — Organizational Structure of Pharmacy Chain](https://iq-provision.ru/articles/organizacionnaa-struktura-aptecnoj-seti) — Management structure
14. [suvorov.legal — Retro-bonus legal framework](https://suvorov.legal/retro-bonus/) — Supplier retro-bonus mechanics
15. [ipaa.kz — Retro-bonus taxation in Kazakhstan](https://ipaa.kz/faq/podlezhit-li-nalogooblozheniju-retro-bonus-vyplachennyj-pokupatelju-rezidentu-rf) — KZ tax treatment
