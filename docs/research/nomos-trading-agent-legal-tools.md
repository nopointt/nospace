# Nomos: Legal & Tax (Kazakhstan 2026) + Trading Tools Competitive Landscape

> Research date: 2026-03-23
> Purpose: Personal decision-making research for Nomos crypto trading project.
> NOT legal advice. Every claim is sourced or explicitly flagged as unverified.

---

## Direction 6: Legal and Tax Aspects (Kazakhstan 2026)

### 6.1 Crypto Taxation in Kazakhstan

#### The Basic Rule: 10% IPN on Capital Gains

Kazakhstan imposes Individual Income Tax (IPN / ИПН) at a flat **10%** on the positive difference between the sale price and the acquisition cost of digital assets. This applies to individuals who are Kazakhstan tax residents.

**Formula:**
```
Tax base = Sale price (KZT) − Acquisition cost (KZT)
Tax owed = Tax base × 10%
```

**Example:** Bought BTC equivalent for 2,000,000 KZT, sold for 2,500,000 KZT → Tax base = 500,000 KZT → Tax = 50,000 KZT.

**Sources:**
- [mybuh.kz — Crypto income and taxes](https://mybuh.kz/news/kriptovalyuta-kak-schitat-dokhod-i-nalogi-kak-otrazhat-v-otchetnosti/)
- [Morgan Lewis — Capital Gains under New Tax Code Kazakhstan](https://www.morganlewis.com/pubs/2025/06/taxation-of-income-from-capital-gains-under-new-tax-code-of-kazakhstan)
- [Kazakhstan's 2026 Crypto Tax Changes for Foreign Residents](https://beaumont-capitalmarkets.co.uk/kazakhstan-2026-expat-crypto-tax-guide/)

#### How Acquisition Cost is Calculated

The law says: taxable income = **positive difference between sale value and acquisition cost**. The Tax Code does not explicitly mandate a specific accounting method (FIFO/LIFO/HIFO) for individual retail crypto traders in the published 2025–2026 sources.

**Practical conclusion:** Kazakhstan tax law does not specify FIFO/LIFO for individuals (unlike the US or Germany). The safest approach is to document each purchase separately with its KZT equivalent at purchase time, and match each sale against that specific lot. If you can't match lots specifically, use FIFO as the most internationally accepted default — document your methodology consistently and stick to it.

**P2P markup complication:** When buying via P2P (cash → Kaspi → Binance P2P), the acquisition cost is the KZT amount actually paid, including any P2P markup. If you paid 50,000 KZT for crypto worth 45,000 KZT at spot, your cost basis is 50,000 KZT. This is more conservative (reduces your eventual tax base), but harder to document without receipts. Keep Binance P2P transaction history + any Kaspi transfer records as documentation.

**Source:** [MEXC Wiki — Crypto Taxes in Kazakhstan](https://blog.mexc.com/wiki/are-there-any-taxes-for-crypto-in-kazakhstan/)

#### Form 270.00 — When to File, Process, Deadlines

**Universal Declaration system (Всеобщее декларирование):** Kazakhstan rolled out mandatory asset and income declaration in phases. As of 2025–2026, all individuals must file:

- **Form 250.00** — Declaration on Assets and Liabilities (initial snapshot)
- **Form 270.00** — Declaration on Income and Property (annual filing for income received in the reporting year)

**Deadline:** No later than **September 15** of the year following the reporting year.
- For income earned in 2025 → file Form 270.00 by **September 15, 2026**
- For income earned in 2026 → file Form 270.00 by **September 15, 2027**

**Tax payment deadline:** Within **10 days** after the submission date.

**How to file:** Via the [КГД (Committee for State Revenue) online portal](https://cabinet.salyk.kz/) or through the Egov.kz portal. Crypto income is reported under "прочие доходы" (other income) in Form 270.00.

**Sources:**
- [mybuh.kz — Form 270: who files in 2026](https://mybuh.kz/useful/forma-270-kto-sdaet-v-2025-g-i-chto-obnovitsya-v-perspektive.html)
- [mybuh.kz — How to reflect crypto in Form 250/270](https://mybuh.kz/useful/kak-v-fno-250-270-otrazhat-kriptovalyutu-bitkoin-.html)
- [zhts.kgd.gov.kz — Who files Form 270 in 2025](https://zhts.kgd.gov.kz/ru/news/vseobshchee-deklarirovanie-kto-podaet-deklaraciyu-270-v-2025-godu-21-157498)

#### Minimum Threshold for Declaration

**No authoritative source found** specifying a KZT threshold below which crypto gains are exempt from declaration. Based on all reviewed sources, the declaration obligation appears to apply regardless of transaction size.

The standard personal tax deduction (30 MCI/month = 117,960 KZT/month at 2026 MCI = 3,932 KZT) reduces general taxable income but is not specific to crypto. Crypto gains in KZ are treated as "property income" — it is unclear whether the general deduction applies to offset them; this requires confirmation with a tax advisor.

**Practical reality:** Given that Kazakhstan's enforcement focus is on systematic traders and those with large volumes (the tax authority collected 13.1 billion KZT from crypto in Jan–Sep 2025), small retail traders have low practical risk. But legally, there is no stated minimum.

**Source:** [Caspian Post — Kazakhstan Sees Sharp Rise in Cryptocurrency Tax Collection](https://caspianpost.com/kazakhstan/kazakhstan-sees-sharp-rise-in-cryptocurrency-tax-collection-in-2025)

#### DeFi Yield, Staking Rewards — Taxable?

**Yes, taxable at 10% IPN.** Any income from staking, DeFi yield, or similar mechanisms is treated as income from digital assets. The tax event occurs at the moment you receive the tokens.

Key expert position (mybuh.kz, sber-invest.kz): "If you received a coin, you have income subject to 10% IPN, regardless of how crypto was received — mining, staking, DeFi, airdrops or any other form."

**Cost basis for staking rewards:** The fair market value (in KZT) at the date of receipt becomes your acquisition cost for future sales. If you later sell staked rewards, tax is on the gain since receipt, not from zero.

**Sources:**
- [mybuh.kz — Crypto trading taxes in Kazakhstan](https://mybuh.kz/useful/torgovlya-kriptovalyutoy-v-kazakhstane-kakie-nalogi-platit.html)
- [sber-invest.kz — 10 main questions about crypto taxes in KZ](https://sber-invest.kz/article/1010)

#### Airdrops and Fork Tokens — Taxable?

**Yes, taxable.** Based on the Kazakhstan framework (all digital asset receipts are income) and internationally consistent expert guidance: airdrop tokens are taxable income at fair market value when received.

For **hard forks**: when new tokens are airdropped after a fork, taxable income arises at the time you gain control over the new tokens (i.e., when you can sell/transfer them). The value at that moment becomes your cost basis.

**Practical issue:** Many airdrops have near-zero value at receipt and significant value later. The income at receipt can be minimal; the large gain comes at sale (taxed again as capital gain on the difference from the airdrop receipt value).

**No Kazakhstan-specific legal text found** addressing airdrops explicitly — the general "any crypto receipt = income" rule is applied by local tax advisors.

#### Trading Between Crypto Pairs (BTC→ETH) — Taxable Event?

**No authoritative Kazakhstan-specific source found** that explicitly addresses crypto-to-crypto swaps. The current law taxes the "positive difference between sale value and acquisition cost" upon **реализация (sale/disposal)** of digital assets.

**Risk assessment:** Swapping BTC for ETH is technically a disposal of BTC (you receive value for it) — in most jurisdictions this is treated as a taxable event. Given Kazakhstan's broad "any income from digital assets" framing, the conservative interpretation is: **yes, BTC→ETH is a taxable event** (you "sold" BTC). The counter-argument is that without KZT leaving the system there is no "income" — but this position has no authoritative backing.

**Practical recommendation:** If you only trade on Binance and never convert to KZT, the tax authority has limited visibility. However, once you off-ramp, any undeclared crypto-to-crypto gains could theoretically be discovered. Treat all crypto-to-crypto swaps as taxable and keep records.

---

### 6.2 P2P via Someone Else's Card

#### Legal Framework: What Is Allowed

**The core problem:** Under Kazakhstan law (Law on Digital Assets, 2023), P2P crypto trading is only legal on **licensed platforms**. Binance P2P operated on the global Binance platform (not Binance Kazakhstan's AIFC-licensed entity) is legally in a grey/illegal zone.

The Digital Rights Center (kz.drc.law) has directly stated: "P2P exchanges (between two individuals) are illegal in the country."

**Licensed P2P alternative:** As of 2026, AIFC-licensed platforms include Binance Kazakhstan, Bybit, ATAIX Eurasia, and others. Binance Kazakhstan (the licensed entity) may have P2P functionality, but local products differ from global Binance.

**Sources:**
- [kz.drc.law — Legal uncertainty: P2P under ban?](https://kz.drc.law/blog/pravovaya-neopredelennost-v-sfere-kriptovalyut-v-kazakhstane-p2p-pod-zapretom/)
- [inbusiness.kz — Prison or exchange: can you legally trade crypto in Kazakhstan?](https://inbusiness.kz/ru/news/v-tyurmu-ili-na-birzhu-mozhno-li-zakonno-torgovat-kriptovalyutoj-v-kazahstane)

#### Legal Risks for the Card Owner (Girlfriend/Friend)

**Risk level: Significant if volumes are high or flagged.**

From 2026, banks are required to report to the tax authority if an individual receives **100+ transfers from different people in a single month, for 3 consecutive months**, AND total exceeds 3 minimum wages (~255,000 KZT in 2025 terms). If the friend's card triggers this threshold, tax authorities will see the inflows and may require explanation.

If the card owner cannot explain the origin of funds (i.e., they cannot say "this is my own earnings"), they face:
- **Tax audit / demand for income declaration** for the received amounts
- Potential reclassification as unregistered entrepreneurial activity (ст. 214 УК РК — illegal entrepreneurship)
- In extreme cases, AML investigation if transactions are linked to crypto P2P patterns that authorities already monitor

**The money laundering angle:** KZ authorities cracked down on ~22 underground crypto exchanges in 2025, freezing ~20,000 "proxy cards." The friend's card, if used repeatedly for crypto cash-in, matches the exact pattern that AML systems flag. This is not a theoretical risk.

**Sources:**
- [tadviser.ru — Cryptocurrencies in Kazakhstan](https://www.tadviser.ru/index.php/%D0%A1%D1%82%D0%B0%D1%82%D1%8C%D1%8F:%D0%9A%D1%80%D0%B8%D0%BF%D1%82%D0%BE%D0%B2%D0%B0%D0%BB%D1%8E%D1%82%D1%8B_%D0%B2_%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD%D0%B5)
- [dtf.ru — Transfers to/from Kazakhstan 2026](https://dtf.ru/howto/4851059-perevody-v-kazahstan-i-iz-kazahstana)

#### Legal Risks for You (The User)

If your bank accounts are frozen under enforcement proceedings (исполнительное производство), you have an existing relationship with judicial executors. Any large cash movements — even through a third party — can potentially be traced if investigators are motivated.

**Specific risks for you:**
- **Tax evasion** if gains are not declared (ст. 245 УК РК)
- **Illegal financial operations** if the intermediary arrangement is characterized as a scheme to hide assets from creditors
- **Accessory liability** for the card owner's tax issues if you orchestrated the scheme

**Practical risk calibration:** With a 700K KZT debt and standard enforcement proceedings (not criminal investigation), the practical risk of active investigation is low unless there are very large volumes involved. Judicial executors (частные судебные исполнители) in Kazakhstan generally work by sending standard requests to banks and government databases — they do not conduct financial investigations.

#### Safe Limit Per Month (Kaspi Monitoring Thresholds)

**Official Kaspi transfer limits (2025–2026):**
- Between Kaspi Gold cards: up to **2,000,000 KZT per day**, no monthly cap
- To other bank cards: up to **~5,000,000 KZT/month** (10,000 USD limit under Visa/Mastercard rules)

**Tax monitoring trigger (from 2026):**
- 100+ incoming transfers from different senders in a month, sustained for 3 months
- Total incoming from different senders > 3 minimum wages per month (~255,000 KZT)

**Practical safe range:** If the friend receives occasional transfers from you specifically (one person, not many), the "100 different senders" trigger does not apply. The risk is more about the cash → card → crypto pattern being visible to AML systems, not about the Kaspi transfer cap itself.

**Sources:**
- [guide.kaspi.kz — Transfer limits FAQ](https://guide.kaspi.kz/client/ru/bank/transfers/general/q747)
- [moneypanda.kz — Kaspi Gold transfer limits 2025](https://moneypanda.kz/kz/news/limity-na-perevody-kaspi-otkuda-oni-berutsya-i-mozhno-li-ikh-oboyti-805)
- [dtf.ru — Transfers to/from Kazakhstan 2026](https://dtf.ru/howto/4851059-perevody-v-kazahstan-i-iz-kazahstana)

#### What If Bailiffs Track the Friend's Kaspi Transactions?

Kazakhstan's bailiff system (AIS OP — Автоматизированная Информационная Система Органов Исполнительного Производства) sends automated requests to banks for the **debtor's own accounts**. They do not have routine access to third-party accounts without a court order.

A bailiff would need a specific legal basis to request a third party's bank statements. If your debt is standard consumer/enforcement debt (not criminal), bailiffs are unlikely to investigate your girlfriend's/friend's accounts unless they have a specific reason to suspect asset concealment.

**However:** If enforcement escalates to a criminal investigation for asset concealment (сокрытие имущества от взыскания), a prosecutor could subpoena bank records of associated persons. For 700K KZT total debt, this level of escalation is very unlikely.

**Source:** [bailiff.kz — Article 62: Arrest of debtor property](https://bailiff.kz/zan/article62/)

#### Practical Precedents — Has Anyone Been Prosecuted for This in KZ?

**Criminal precedents found:**
- In January 2025, Kazakhstan citizens were **sentenced to prison** for illegal crypto turnover — these were organized P2P exchange operators running systematic services, not retail users. (Source: [rbc.ru/crypto — KZ citizens sentenced for illegal crypto](https://www.rbc.ru/crypto/news/678e25839a7947a3370359c3))
- One resident was suspected of illegal P2P trading — this was an individual systematically operating as a P2P merchant, not a casual buyer.
- 12 criminal cases under Art. 214 (illegal entrepreneurship) were opened related to crypto in early 2024.

**Key distinction:** Prosecution is targeting **organized operators**, not retail buyers using P2P services. No case was found of a regular individual being prosecuted for a one-off P2P purchase through a friend's card.

---

### 6.3 AIFC Regulation

#### Do Individual Retail Traders Fall Under AIFC Regulation?

**Not directly.** The AIFC (МФЦА) regulates entities operating digital asset services — exchanges, custodians, brokers. Individual retail traders are not themselves licensed or regulated by AIFC.

However: if you trade on an AIFC-licensed platform (Binance Kazakhstan, Bybit, etc.), you are subject to that platform's KYC/AML requirements as a customer, and the platform reports to AFSA.

As of 2026, the **dual regulatory framework** is:
- **AFSA (AIFC):** Governs international/institutional operations and AIFC-registered entities
- **National Bank of Kazakhstan:** Governs domestic retail investors and local market participants

Individual retail traders are under the National Bank's purview for tax and reporting purposes.

**Source:** [Euronews — Kazakhstan positioning as Eurasia's next crypto hub](https://www.euronews.com/business/2026/02/11/kazakhstan-is-positioning-itself-as-eurasias-next-crypto-hub)

#### 14 Licensed Platforms — Does Trading on Them Change Your Legal Status?

**Yes, materially.** Trading on a licensed platform (Binance Kazakhstan, Bybit, ATAIX Eurasia, etc.) is the only fully legal way to buy/sell crypto in Kazakhstan. It means:
- Your identity is KYC-verified on record with the platform
- The platform reports transaction data as required by law
- You are legally protected as a client of a regulated entity
- Your trading history is available to you for tax declaration purposes

Trading on global (unlicensed for KZ) Binance is technically in violation of the law, though enforcement against retail buyers is rare.

**Source:** [lightspark.com — Is Crypto Legal in Kazakhstan?](https://www.lightspark.com/knowledge/is-crypto-legal-in-kazakhstan)

#### What Happens If I Trade on Unlicensed Platforms?

For **individuals** (not operators):
- Administrative fines up to 2,000 MRP (~7.86M KZT at 2026 rates) for illegal digital asset circulation
- Equipment/asset confiscation in serious cases
- Criminal liability under Art. 214 (illegal entrepreneurship) if the activity is deemed systematic and income exceeds 2,000 MRP

For context: these penalties are designed for operators/organizers, not retail buyers. However, legal uncertainty exists, and the risk profile is increasing as enforcement tightens.

**Sources:**
- [femida-justice.com — Legal aspects of crypto in Kazakhstan](https://femida-justice.com/pravo/yuridicheskoe-soprovozhdenie-it%E2%80%91proektov-i-startapov-ot-idei-do-kommerczializaczii/yuridicheskie-aspektyi-kriptovalyut-v-kazaxstane/)
- [gofaizen-sherle.com — Crypto License in Kazakhstan 2026](https://gofaizen-sherle.com/crypto-license/kazakhstan)

#### AIFC vs National Bank — Who Regulates What

| Domain | Regulator |
|---|---|
| AIFC-registered crypto exchanges | AFSA (Astana Financial Services Authority) |
| Domestic retail crypto trading | National Bank of Kazakhstan |
| Mining operations | National Bank (after 2024 regulatory expansion) |
| AML/CFT compliance | Financial Monitoring Agency (АФМ) |
| Tax reporting for individuals | Committee for State Revenue (КГД) |
| Enforcement proceedings / debt collection | Ministry of Justice (bailiffs) |

**Source:** [AFSA — New Rulebook on Digital Asset Activities](https://afsa.aifc.kz/afsa-announces-new-rulebook-on-digital-asset-activities-3/)

---

### 6.4 Self-Custody and Bailiffs

#### Can Kazakhstan Bailiffs Seize Crypto in Self-Custody Wallets?

**Technically: No. Legally: Uncertain but practically unenforceable.**

**The technical reality:** A self-custody wallet (MetaMask, Trust Wallet, hardware wallet) is protected by a private key. No external party can access funds without the private key. Bailiffs have no technical mechanism to seize these funds.

**The legal reality:** Kazakhstan law on enforcement proceedings (Закон РК об исполнительном производстве, updated December 2025) does not contain specific provisions for seizing cryptocurrency from self-custody wallets. The law lists attachable assets (bank accounts, real estate, vehicles, receivables) — crypto is not explicitly listed.

**Expert conclusion** (femida-justice.com, migron.kz): "Bailiffs cannot seize crypto wallets because the Central Bank does not recognize cryptocurrency as a payment means and current legislation does not properly regulate its circulation."

**However:** A court could theoretically compel you to disclose your wallet addresses and transfer assets. There is a Russian precedent (9th Arbitration Court of Appeals) where a debtor was ordered to provide wallet passwords to a bankruptcy administrator. No Kazakhstan-specific such case was found.

**Source:** [femida-justice.com — Digital assets in Kazakhstan: regulation and practice 2026](https://femida-justice.com/pravo/czifrovyie-aktivyi-zakonyi,-riski-i-otvetstvennost-v-kazaxstane/)

#### Exchange Accounts with KYC — Risk of Seizure?

**Yes, real risk.** If you have a verified account on Binance Kazakhstan (AIFC-licensed, KYC-complete), a court could order Binance to freeze and transfer your balance to satisfy a debt judgment.

**Known precedent:** According to nur.kz and bcc.kz sources, there are documented cases of courts ordering seizure of "digital assets placed on the Binance cryptocurrency exchange" belonging to suspects/debtors. This applies when the exchange is legally operating in Kazakhstan and subject to court orders.

**Binance law enforcement cooperation:** Binance processed over **71,000 law enforcement requests globally in 2025** and maintains a Government Law Enforcement Request System (LERS). Binance Kazakhstan, as an AFSA-licensed entity, is legally obligated to comply with Kazakhstan court orders.

**Risk mitigation:** Using global Binance (non-KZ entity) reduces the ease of seizure — a KZ court would need to go through international legal channels. However, Binance's global compliance posture is strong, and KZ court orders for domestic users may be honored.

**Sources:**
- [nur.kz — What crypto operations risk arrest in Kazakhstan](https://www.nur.kz/nurfin/stock/2153691-za-kakie-operacii-s-kriptovalutoy-kazahstancam-mozhet-grozit-arest-rasskazali-eksperty/)
- [binance.com — Government Law Enforcement Request System](https://www.binance.com/en/support/law-enforcement)

#### Have There Been Cases of Crypto Seizure by KZ Bailiffs?

**Found cases:**
1. Criminal suspects had exchange (Binance) account balances seized under court order — confirmed.
2. Kazakhstan created a national crypto fund specifically to hold "crypto investments seized from criminals" (National Bank announcement).
3. Kazakhstan seized $17M in crypto and shut down 130 illegal exchanges in 2025.

**No case found** of a standard consumer debt bailiff seizing retail self-custody crypto. The documented seizures are all from criminal/organized crime contexts.

**Sources:**
- [blockonomi.com — Kazakhstan Seizes $17M in Crypto](https://blockonomi.com/kazakhstan-seizes-17m-in-crypto-shuts-down-130-illegal-exchanges/)
- [centralbanking.com — Kazakh crypto fund for seized assets](https://www.centralbanking.com/central-banks/reserves/7974929/kazakh-crypto-fund-to-hold-assets-seized-from-criminals-report)

---

### 6.5 New Tax Code 2026

Kazakhstan adopted a **new Tax Code on July 18, 2025**, replacing the 2017 code. Effective January 1, 2026. Key changes for crypto:

#### Explicit Capital Gains Rules for Digital Assets

The new code explicitly addresses:
- **Sale of digital assets:** Taxable as capital gain (positive difference, 10% IPN)
- **Contribution of digital assets to charter capital:** Taxable event
- **Reorganization transactions involving digital assets:** Taxable event
- **Mining income:** 15% for mining entities (legal entities), progressive 10–15% for individual entrepreneurs engaged in mining

#### Valuation Methodology

New "Rules for Determining the Value of Digital Assets" (effective January 1, 2026) significantly clarify and centralize the methodology for valuing digital assets for tax purposes, compared to the previous 2024 framework.

**Source:** [mondaq.com — Taxation of Mining and Cryptocurrency Circulation in Kazakhstan Part II](https://www.mondaq.com/fintech/1758832/taxation-of-mining-and-cryptocurrency-circulation-in-kazakhstan-part-ii)

#### Enhanced Reporting Requirements

A **new reporting form** is expected to enter into force on **April 25, 2026**, covering:
- Disclosure of offshore exchange holdings
- Wallet addresses (for large holders)
- Transaction histories for significant amounts

**Source:** [beaumont-capitalmarkets.co.uk — Kazakhstan 2026 Crypto Tax Changes](https://beaumont-capitalmarkets.co.uk/kazakhstan-2026-expat-crypto-tax-guide/)

#### Platform Reporting (new from 2026)

From January 1, 2026, digital platform operators (exchanges, brokers) must report user data to tax authorities. This is analogous to bank reporting.

**Source:** [kpmg.com — Kazakhstan Platform Reporting Requirements 2026](https://kpmg.com/us/en/taxnewsflash/news/2026/02/kazakhstan-platform-reporting-requirements-2026.html)

#### Bank Reporting of P2P Transfers

Also effective 2026: Banks report to tax authorities when an individual receives **100+ transfers from different persons within a month, for 3 consecutive months**, with total exceeding 3 minimum wages. This directly impacts P2P crypto cash-in schemes.

**Source:** [dtf.ru — Transfers to/from Kazakhstan 2026](https://dtf.ru/howto/4851059-perevody-v-kazahstan-i-iz-kazahstana)

---

### 6.6 Practical Recommendations

#### What to Track from Day One

| Record | Format | Why |
|---|---|---|
| Each purchase: date, amount KZT paid, crypto received, source | CSV or spreadsheet | Cost basis for tax declaration |
| Kaspi/bank transfer to friend's card | Screenshot + amount | Proof of payment for acquisition cost |
| Binance P2P trade confirmations | Screenshot + PDF export | Documents purchase price |
| Binance account statements | Monthly export | Proves holdings and transactions |
| Exchange rate at time of purchase | Screenshot of Binance rate OR CoinGecko | Confirms KZT equivalent |
| Sale records: date, crypto sold, KZT received | Binance statement | Tax base calculation |
| Staking/DeFi rewards: date and FMV at receipt | DeFi platform export | Separate income category |

#### Recommended Record-Keeping Format

```
Date | Operation | Coin | Amount | KZT_paid | KZT_received | Rate_source | Notes
2026-03-15 | BUY | BTC | 0.001 | 52,000 | — | Binance P2P | via Kaspi transfer
2026-03-20 | SELL | BTC | 0.001 | — | 55,000 | Binance | gain=3,000 KZT
```

Maintain this in a Google Sheet or Excel file. Backup monthly. This is your primary evidence for Form 270.00.

#### When to Consult a Local Tax Advisor

- When your annual realized crypto gains exceed **500,000 KZT** (at this level, declaration is definitely required and stakes are non-trivial)
- Before your first Form 270.00 filing that includes crypto
- If you receive a notice from КГД (Committee for State Revenue)
- If you are considering opening an IE (Individual Entrepreneur) for trading purposes

**Cost estimate:** A one-time consultation with a Kazakhstan tax consultant on crypto matters: approximately 30,000–80,000 KZT.

#### Tax Optimization Strategies (Legal)

1. **Hold longer to accumulate losses for offset:** If you have both gains and losses in the same year, net them. Kazakhstan taxes the "positive difference" — losses can theoretically offset gains in the same reporting period (consult advisor to confirm).

2. **Stagger sales across tax years:** If you have large unrealized gains, consider partial sales in December vs. January to spread the tax burden across two Form 270.00 filings.

3. **Keep P2P costs well-documented:** High P2P markup = higher cost basis = lower taxable gain at sale. Every extra KZT you paid for crypto reduces your eventual tax.

4. **DCA into bear markets:** Lower average cost basis means smaller eventual tax exposure.

5. **No wash-sale equivalent found in KZ law:** Unlike the US, no "wash sale" prohibition was identified. You can sell at a loss and rebuy immediately to realize a loss for tax purposes (verify with advisor).

6. **IE registration consideration:** As an Individual Entrepreneur on simplified tax regime (6% of turnover, not 10% of gain), tax treatment changes — but also requires formal registration, reporting, and the gain calculation changes entirely. Only worth it at scale (>5M KZT/year turnover) and if accounts are not blocked.

---

## Direction 7: Competitive Landscape of Trading Tools

### 7.1 Master Comparison Table

| Criterion | Freqtrade | OctoBot | 3Commas | Pionex | Bitsgap | HaasOnline | Superalgos | OpenTrader | Claude Code Custom |
|---|---|---|---|---|---|---|---|---|---|
| **Cost** | Free (OSS) | Free self-hosted; cloud $9.99–$29.99/mo | $15–$374/mo | Free (0.05% trade fee) | $23–$146/mo | $9–$149/mo | Free (OSS) | Free (OSS, Apache 2.0) | Max plan $200/mo (already paid for other work) |
| **AI/ML capability** | FreqAI: full ML pipeline (scikit-learn, PyTorch, Keras, XGBoost, LSTM) | AI connector (OpenAI, Ollama/llama, custom) for strategy signals | Basic AI grid bot | No ML | No ML | No built-in ML | No ML | No ML | Full LLM reasoning (Claude Sonnet/Opus), MCP ecosystem, natural language strategy |
| **Backtesting** | Excellent — realistic tick-level, OHLCV, FreqAI auto-retrain | Built-in backtesting engine with historical data | 10 backtests/mo on Pro plan | None | Limited | HaasScript backtesting | Visual backtesting engine | Basic backtesting | None built-in (must integrate Freqtrade or write custom) |
| **Supported exchanges** | 100+ via CCXT | 15+ (Binance, Hyperliquid, Coinbase, MEXC, HTX, Gate.io) | 20+ (Binance, Bybit, OKX, Coinbase, KuCoin, Kraken) | ~320 pairs (Binance + HTX aggregated, own exchange) | 15+ | Multiple (Binance, Bybit, Kraken, etc.) | Multiple (via CCXT) | 100+ via CCXT | Depends on what APIs you integrate |
| **Minimum capital** | No minimum (technically $1) | No minimum stated | No minimum (Starter at $15/mo) | 11 USDT ($10 practical min, 50 USDT recommended) | No minimum stated | No minimum | No minimum | No minimum | No minimum |
| **Setup complexity (1=easy, 10=hard)** | 7 — Python env, config files, CLI | 5 — Web UI, Docker option, beginner-friendly | 2 — SaaS, web UI | 1 — Built into exchange | 2 — SaaS, web UI | 8 — HaasScript learning curve | 9 — Very steep, weeks to learn | 4 — npm install, web UI | 6 — Requires Claude Code setup, scripting knowledge |
| **Customization depth** | 10 — Full Python strategy code | 8 — Python tentacles architecture | 4 — Config parameters only | 2 — Grid/DCA params | 3 — Config parameters | 9 — HaasScript is full programming language | 9 — Visual + code | 7 — TypeScript strategies, Apache 2.0 | 10 — Unrestricted, natural language + code |
| **Copy trading** | No native | No native | Yes — Signal bots, marketplace | No | No | No native | No | No | Could be implemented via webhook |
| **Grid trading** | Yes (basic, via strategy) | Yes — advanced grid, fine-tuned | Yes — AI Grid Bot | Yes — 16+ bot types including Infinity Grid | Yes — GRID, COMBO bots | Yes — customizable via HaasScript | Yes | Yes — GridBot strategy | Implementable via code |
| **DCA** | Yes — built into strategy framework | Yes — "Smart DCA", configurable entries/exits | Yes — flagship feature, 50 bots on Pro | Yes — DCA Bot | Yes — BTD, DCA bots | Yes | Yes | Yes — DCA strategy native | Implementable via code |
| **Arbitrage** | No native (possible via custom strategy) | No native | No | Futures Arbitrage bot (spot-futures) | Yes — semi-auto, shows spreads across 25 exchanges | Yes — market making/arbitrage via HaasScript | No | No | Possible via multi-exchange coordination |
| **Self-hosted** | Yes — fully self-hosted | Yes — Docker, or cloud subscription | No — SaaS only | No — their exchange | No — SaaS only | Yes — Docker/binary, or managed cloud | Yes — runs locally | Yes — Docker | Yes — runs in Claude Code session |
| **Active development** | Very active — 30K+ GitHub stars, regular releases | Active — 5K+ GitHub stars | Active (proprietary) | Active | Active (proprietary) | Active (proprietary) | Moderate (Superalgos/Superalgos GitHub) | Active (Open-Trader/opentrader GitHub) | Anthropic continuous model updates |
| **Security** | API keys local, open-source auditable | Encrypted API key vault (cloud); local for self-hosted | API keys on their servers; 2FA, encrypted | API keys on Pionex exchange | RSA 2048-bit encryption, no history of breaches | API keys on server (cloud) or local (self-hosted) | Local, open-source | Local, open-source | Local to your machine, API keys in .env |
| **Open source** | Yes (GPL-3.0) | Yes (MIT) | No | No | No | No | Yes | Yes (Apache 2.0) | Yes (Claude Code is the tool; strategies are your code) |

---

### 7.2 Deep Dive: Key Platforms

#### Freqtrade

**What it is:** The gold standard of open-source crypto trading bots. Python, GPL-3.0, 30K+ GitHub stars, active community.

**FreqAI module:**
- Supports scikit-learn, PyTorch, Keras, XGBoost, Catboost, LightGBM
- Self-adaptive model retraining during live trading
- Backtesting with realistic auto-retrain simulation
- Feature engineering: 10K+ features possible
- LSTM networks, custom ML models
- GPU acceleration support

**Backtesting quality:** Industry-leading for open-source. Tick-accurate, handles fees, slippage simulation, realistic order execution.

**Exchanges:** All major exchanges via CCXT (100+). Binance supported.

**Key limitation for Nomos:** No built-in GUI for strategy configuration (CLI-heavy). Requires Python knowledge. No built-in arbitrage.

**Sources:**
- [freqtrade.io — FreqAI documentation](https://www.freqtrade.io/en/stable/freqai/)
- [github.com/freqtrade/freqtrade](https://github.com/freqtrade/freqtrade)

#### OctoBot

**What it is:** Python, MIT license, modular "tentacles" architecture. Focus on being beginner-accessible while supporting advanced use.

**AI capability:** Unique feature — native LLM connector (OpenAI, Ollama). You can configure OctoBot to use a local LLM (e.g., Llama via Ollama) to generate trading signals. This is the closest existing bot to Claude Code's natural language strategy concept.

**Pricing:** Free self-hosted, or cloud at $9.99/month (Basic) / $29.99/month (Pro). Pro includes crypto basket strategies, AI bots, DCA bots.

**Supported exchanges:** 15+, including Binance, Hyperliquid, Coinbase, MEXC, HTX, Gate.io.

**Limitation:** Community smaller than Freqtrade; fewer third-party strategies available. OctoBot's backtesting is solid but not as battle-tested as Freqtrade's.

**Sources:**
- [github.com/Drakkar-Software/OctoBot](https://github.com/Drakkar-Software/OctoBot)
- [octobot.cloud](https://www.octobot.cloud)
- [coincodecap.com — OctoBot Cloud Review](https://coincodecap.com/octobot-cloud-review)

#### 3Commas

**What it is:** Most popular SaaS trading bot. Non-technical users, polished UI.

**Pricing (2026):**
- Starter: $15/mo — 1 exchange, 5 DCA bots, 2 Grid bots, spot only
- Pro: $50/mo — 50 DCA bots, 10 Grid bots, 500 active trades, 10 backtests/mo
- Asset Manager: $374/mo

**DCA implementation:** Industry-standard quality. Configurable steps, trailing, multiple take profits, stop-loss breakeven.

**Limitation for Nomos:** Closed source, API keys on their servers, monthly fee adds up, limited customization compared to Freqtrade.

**Sources:**
- [3commas.io/pricing](https://3commas.io/pricing)
- [cryptoadventure.com — 3Commas Review 2026](https://cryptoadventure.com/3commas-review-2026-trading-bots-smarttrade-pricing-and-security/)

#### Pionex

**What it is:** An exchange AND bot platform combined. 16 free built-in bots. Liquidity aggregated from Binance + HTX.

**Why it's special:** Zero monthly fee. 0.05% trading fee (competitive with Binance). Best for simple grid/DCA without infrastructure management.

**Minimum capital:** 11 USDT. Recommended 50 USDT to start.

**Bots included free:** Grid Bot, Infinity Grid Bot, DCA Bot, Futures Arbitrage Bot, Rebalancing Bot, Smart Trade, TWAP, and more.

**Limitation for Nomos:** No customization, no ML, no self-hosting, must keep funds on Pionex (not your own Binance). KYC required.

**Sources:**
- [pionex.com — Minimum investment](https://www.pionex.com/blog/the-minimum-investment-required-to-start-on-pionex/)
- [coinbureau.com — Pionex Review 2026](https://coinbureau.com/review/pionex-review)

#### Bitsgap

**What it is:** SaaS platform, semi-auto arbitrage, grid/DCA bots, multi-exchange dashboard.

**Pricing (2026):** Basic $23/mo, Advanced $67/mo, Pro $146/mo. No trading commissions.

**Arbitrage:** Shows live spread opportunities across 25+ exchanges. Semi-automated — you must have funds ready on both sides, then execute in one click. Not fully automated cross-exchange arbitrage.

**Security:** No breaches since 2017 launch. RSA 2048-bit encryption.

**Limitation:** Not self-hosted, closed source, expensive at scale.

**Sources:**
- [bitsgap.com/pricing](https://bitsgap.com/pricing)
- [coincodex.com — Bitsgap Review](https://coincodex.com/article/32674/bitsgap-review/)

#### HaasOnline

**What it is:** Professional-grade self-hosted trading automation with HaasScript — a full domain-specific programming language for trading strategies.

**Pricing:** $9–$149/mo. Cloud-managed or self-hosted (Docker).

**HaasScript:** Visual editor + code editor. Build market-making, arbitrage, scalping, custom rule sets. Most powerful customization of any commercial bot.

**Self-hosted:** Yes — can run on own infrastructure. API keys stay local. Data stays private.

**Limitation:** Very steep learning curve (HaasScript is a real programming language). Not beginner-friendly.

**Sources:**
- [haasonline.com/pricing](https://haasonline.com/pricing/)
- [cryptoadventure.com — HaasOnline Review 2026](https://cryptoadventure.com/haasonline-review-2026-pro-grade-crypto-automation-with-haasscript/)

#### Superalgos

**What it is:** Free, open-source, visual strategy builder with charting, data mining, backtesting, paper trading, live trading.

**Key feature:** Entirely visual programming — no code required for basic strategies. Drag-and-drop strategy design.

**Limitation:** Enormous learning curve. "The system's sheer size means it may take some time to master." Multiple weeks of tutorials before productive use. Not suitable for quick deployment.

**Source:** [github.com/Superalgos/Superalgos](https://github.com/Superalgos/Superalgos)

#### OpenTrader

**What it is:** Newer open-source bot (Apache 2.0), TypeScript-based, web UI, 100+ exchanges via CCXT. Native Grid, DCA, RSI strategies.

**Strengths:** Modern stack (TypeScript/Node.js), clean UI, Docker deployment, paper trading, backtesting, extensible strategy system.

**Limitation:** Smaller community, less battle-tested than Freqtrade. "Deployment is somewhat cumbersome" per user review.

**Source:** [github.com/Open-Trader/opentrader](https://github.com/Open-Trader/opentrader)

---

### 7.3 Claude Code Custom — Analysis

#### Unique Capabilities

**What Claude Code does that no other bot does:**

1. **Natural language strategy definition:** Describe a strategy in plain Russian/English → Claude Code generates implementation. "Buy BTC when RSI < 30 and MACD crosses up, sell when RSI > 70 or stop-loss 5%" → produces executable code.

2. **Adaptive reasoning on market context:** Can analyze news, sentiment, on-chain data and synthesize a trading decision in a way that rule-based bots cannot.

3. **MCP ecosystem:** Through MCP servers, Claude Code can access Binance API, read market data, execute trades, monitor P&L — all via natural language orchestration.

4. **Multi-agent architecture:** Separate agents for Strategy, Risk Management, Execution, Monitoring — each specialized, running in parallel. Matches complex trading workflows.

5. **News interpretation:** A Freqtrade strategy cannot read "Kazakhstan bans stablecoins" and adjust accordingly. Claude Code can.

6. **Debugging in plain language:** When a strategy fails, ask Claude to diagnose it. No HaasScript manual required.

#### Disadvantages

| Limitation | Impact |
|---|---|
| No built-in backtesting | Must build custom or integrate Freqtrade as backend |
| No GUI | Terminal-only unless you build one |
| Requires Max subscription for full capability | $200/mo (but already paid for other work in your case) |
| Rate limits on Claude sessions | Long-running strategies need careful session management |
| Not purpose-built for trading | No native order management, position tracking |
| Latency | LLM inference adds latency; not suitable for HFT |
| Context window | Long-running sessions accumulate context; need /compact management |

#### Cost Comparison

| Option | Monthly Cost | Notes |
|---|---|---|
| Freqtrade | $0 | Requires Python server (VPS ~$5/mo) |
| OctoBot (cloud) | $9.99–$29.99 | Managed |
| 3Commas (Pro) | $50 | Most features |
| Bitsgap (Advanced) | $67 | With arbitrage |
| HaasOnline | $9–$149 | Depending on tier |
| Claude Code Custom | $0 marginal | Max plan already paid |

**The killer argument for Nomos:** The $200/mo Max plan is already being used for other work (Thelos, Harkly). The marginal cost of using Claude Code for trading is **zero**. This makes the cost comparison trivially favorable.

#### Can Claude Code Orchestrate Freqtrade/OctoBot? (Hybrid Approach)

**Yes — this is the recommended architecture for Nomos.**

```
Claude Code (Orchestrator)
  ├── Strategy reasoning (natural language → params)
  ├── Market context analysis (news, macro)
  ├── Risk assessment (position sizing, drawdown)
  └── Freqtrade / OctoBot (Execution layer)
        ├── CCXT exchange connectivity
        ├── Order management
        ├── Backtesting engine
        └── Position tracking
```

**How it works:**
1. Claude Code analyzes market conditions and decides strategy parameters
2. Writes/updates Freqtrade strategy file or OctoBot config
3. Freqtrade/OctoBot handles actual execution with exchange APIs
4. Claude Code monitors output and adjusts

**Real-world examples found:**
- "Building an AI Trading Bot with Claude Code: 14 Sessions, 961 Tool Calls" — documented case study on DEV Community
- Claude Opus 4.5 used to "autonomously develop a trading strategy" that reportedly beat the market (nexustrade.io)
- Multi-agent trading architectures with 5 specialized roles (Strategy/Quant, Risk, Execution, Data/Backtest, Ops)

**Sources:**
- [dev.to — Building an AI Trading Bot with Claude Code](https://dev.to/ji_ai/building-an-ai-trading-bot-with-claude-code-14-sessions-961-tool-calls-4o0n)
- [nexustrade.io — Claude Opus 4.5 trading strategy](https://nexustrade.io/blog/i-asked-claude-opus-45-to-autonomously-develop-a-trading-strategy-it-is-destroying-the-market-20251125)

---

### 7.4 Telegram Trading Bots Landscape 2026

These are **on-chain execution bots** (primarily Solana/EVM), not algorithmic bots in the traditional sense. They are designed for rapid retail trading of meme coins and new token launches.

| Bot | Chains | Fee | Key Feature | Automation |
|---|---|---|---|---|
| **Trojan** | Solana | 1% (0.9% with referral) | Fast execution, tools | Limited |
| **BONKbot** | Solana | 1% | Sub-500ms execution, MEV protection, limit orders, DCA, trailing stops | DCA native |
| **Maestro** | ETH, BNB, SOL, TON, TRON, Base | Free + 1% OR $200/mo Premium | Token sniping, anti-rug detection | Sniping automation |
| **Banana Gun** | Multi-chain | 0.5% manual / 1% auto | Sniping, copy trading, MEV protection | Sniping, copy trade |
| **GMGN AI** | SOL, BNB, ETH, Base, TRON | ~1% | Meme coin trading, copy trading, wallet tracking | Copy trading, auto |

**Revenue context:** Banana Gun is described as "the outlier — leading Web3 bot profitability" suggesting significant trading volumes through these bots.

#### Are Telegram Bots Automatable via Claude Code?

**Yes, partially.** Approach:
1. Claude Code monitors a wallet/token alert feed (via WebSocket or API)
2. Makes buy/sell decision based on criteria
3. Executes via Telegram bot API (sends messages/commands to the bot)

**Limitations:**
- Telegram bots require manual wallet connection setup initially
- Rate limits on Telegram API
- BONKbot/Maestro have programmatic APIs limited — primarily designed for Telegram interaction
- Better approach for automation: use Solana program directly (Jito, Jupiter API) bypassing Telegram bots entirely

**Practical recommendation for Nomos:** Telegram bots are for manual meme coin sniping. For algorithmic strategies on Binance spot/futures, stick to Freqtrade + Claude Code orchestration.

**Sources:**
- [coingecko.com — Top 5 Telegram Trading Bots 2025](https://www.coingecko.com/learn/top-telegram-trading-bots)
- [bonkbot.io](https://bonkbot.io/)
- [solanatradingbots.com — Top 5 Solana Trading Bots 2026](https://solanatradingbots.com/)

---

### 7.5 Recommended Architecture for Nomos

Given the constraints (Kazakhstan, blocked bank accounts, Binance P2P on-ramp, Max plan already active, small initial capital):

**Phase 1: Simple DCA + Manual**
- Use **Pionex** built-in DCA bot (free, 0.05% fee, 50 USDT minimum)
- Keep it simple: weekly DCA into BTC/ETH
- No infrastructure management needed

**Phase 2: Claude Code + Freqtrade Hybrid**
- Set up Freqtrade on a $5/mo VPS (Contabo, Hetzner)
- Claude Code generates and refines strategies
- Freqtrade executes, tracks positions, backtests
- Claude Code monitors daily, adjusts parameters

**Phase 3: Full Multi-Agent System**
- Claude Code orchestrates: Market Analysis Agent, Risk Agent, Execution Agent
- Freqtrade as execution backend
- OctoBot as alternative executor for grid strategies
- MCP tools for exchange data, news feeds, on-chain analytics

**Rationale:** This architecture costs $0 marginal (Max plan paid), gives full control, leverages the best of purpose-built tools (Freqtrade's backtesting, OctoBot's grid) with Claude's reasoning capabilities on top.

---

## Summary: Key Actionable Findings

### Legal/Tax (Kazakhstan)

| Finding | Action |
|---|---|
| 10% IPN on gains, Form 270.00, deadline September 15 | Start tracking cost basis from first trade |
| No explicit FIFO mandate for individuals | Use FIFO by default, document methodology |
| Staking/DeFi/airdrops: taxable at receipt | Record FMV at receipt date for each reward |
| Crypto-to-crypto swaps: likely taxable | Treat as taxable events conservatively |
| Self-custody wallets: practically unseizable | Safe storage for long-term holdings |
| KYC exchange accounts: seizure risk exists | Consider risk vs. regulatory compliance |
| Friend's card: triggers 2026 bank reporting if >100 transfers | Keep volumes low, vary the sender pattern |
| P2P on unlicensed global Binance: technically illegal | Understand risk; prosecutions target operators, not buyers |
| New Tax Code 2026: platform reporting begins | Assume KGD will receive trade data from licensed exchanges |

### Tools

| Finding | Action |
|---|---|
| Freqtrade is the best open-source foundation | Use for execution + backtesting |
| OctoBot's LLM connector is unique | Consider for AI-driven signal generation |
| Claude Code + Freqtrade hybrid is optimal | Build this as Phase 2 architecture |
| Pionex is lowest-friction start | Use for Phase 1 DCA |
| Telegram bots are for meme sniping, not algo trading | Not relevant for Nomos systematic approach |
| 3Commas/Bitsgap add monthly cost without matching customization | Skip for a technical user |

---

*Research compiled: 2026-03-23. Sources noted inline. Legal claims should be verified with a qualified Kazakhstan tax/legal professional before acting. This document is for informational and personal decision-making purposes only.*
