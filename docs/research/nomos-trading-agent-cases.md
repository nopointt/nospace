# AI Agent Trading Systems — Case Study Research
> Deep research for Nomos trading agent design. Capital: $260. Market: crypto only. Tool: Claude Code.
> Date: 2026-03-23. Author: Axis (Orchestrator).

---

## Contents

1. [Claude Code Trading Cases](#1-claude-code-trading-cases)
2. [GitHub Projects — Architecture Analysis](#2-github-projects)
3. [Polymarket & Prediction Market Cases](#3-polymarket-cases)
4. [Academic Papers](#4-academic-papers)
5. [Other AI Trading Systems](#5-other-systems)
6. [Cross-Case Synthesis](#6-synthesis)
7. [Lessons for Nomos ($260, crypto only)](#7-lessons-for-nomos)

---

## 1. Claude Code Trading Cases

### 1.1 Jake Nesler — "I Gave Claude Code $100K to Trade With" (Dec 2025)

**Source:** https://medium.com/@jakenesler/i-gave-claude-code-100k-to-trade-with-in-the-last-month-and-beat-the-market-ece3fd6dcebc

**Architecture:**
Multi-agent system built on Claude Code + MCP (claude_prophet). Four named agents:
- **CEO agent (Paragon)** — portfolio-level risk assessment, capital allocation decisions; triggers before deploying >$20K
- **Strategy agent (Stratagem)** — technical setups, entry/exit price recommendations, risk/reward
- **Consultant agent (Daedalus)** — adversarial pressure-testing, blind spot identification; used when uncertain
- **Engineer agent (Forge)** — Go infrastructure development and tool building

Backend: Go (3,623 lines, 8 packages, 48 HTTP endpoints). MCP server: Node.js on port 4534. DB: SQLite for bars, orders, positions, embeddings. Broker: Alpaca API. News: Google Gemini for processing.

40+ MCP tools: trading operations (place_options_order, place_managed_position), market data (get_options_chain, get_historical_bars), intelligence (get_quick_market_intelligence, analyze_stocks), vector search (find_similar_setups), logging.

**Strategy:**
Discretionary options trading. Primary pattern: buy discounted 2-month+ expiration options, sell after market moves in a few days. Multi-timeframe: LEAPS (60–90+ DTE), scalping (0–5 DTE), hedging (protective puts). Capital rules: max position 15%, daily halt at -5%, max deployment 50%.

**Results:**
Paper trading on Alpaca ($100K paper capital).
- Phase 1 (Nov 17–18): $100,000 → $98,901 (-1.1%). First trades: NVDA, TSLA, SOFI swing positions ($75K deployed) + aggressive penny stock trading (MARA, RIOT, SNDL, PLUG, NIO). Losses from rapid-fire scalping.
- Phase 2 (Nov 20): $98,901 → $98,609 (-0.3%) after multi-agent governance system installed.
- Final result over 1 month: ~7% gain vs S&P 4.52% gain.

**Survivorship bias warning:** Single month, paper trading only, bull market. The 7% vs 4.52% comparison has no statistical significance at 1-month horizon. No real capital at risk. Creator explicitly warns: "not a real number you can trust without waiting for a longer time frame with different market conditions."

**What worked:**
- CEO agent's risk conservatism prevented catastrophic drawdown
- Multi-agent governance slowed impulsive trades
- MCP architecture decouples strategy from execution cleanly

**What failed:**
- Consultant agent was "extremely risk-averse and the CEO would listen" — created excessive conservatism
- Engineer agent and Strategy agent rarely got utilized
- Phase 1 penny stock scalping produced immediate losses

**Key lesson for Nomos:** CEO/risk-gating agent prevents amateur mistakes. Engineer agent (infrastructure builder) is a legitimate use of LLM that doesn't try to "predict markets."

---

### 1.2 "900+ Hours of Claude Code for Trading" — AI in Trading (Mar 2026)

**Source:** https://medium.com/@aiintrading/900-hours-of-using-claude-code-for-trading-what-i-learned-d0a11871b16c

**Architecture:** Not a single system — a collection of observations from extended use. Key patterns documented:

**Mental model shifts:**
1. **Planning before coding:** Before any code, tell Claude the strategy and ask it to ask questions. "I want to build a mean reversion system. Ask me everything you need to know before we write a line." This surfaces decisions not yet made.
2. **Voice prompts:** Voice runs 2-3x longer and more specific. Natural speech adds qualifiers ("but only when volume is above average, because that's when the signal is actually clean") that typed prompts miss.
3. **MCP as USB port:** Connect Claude directly to market data feeds, broker APIs, financial data providers instead of CSV-paste workflow. Eliminates data preparation overhead.
4. **Context as infrastructure:** Each new session, traders re-explain everything. After building a proper CLAUDE.md + session checkpoint system, Claude knows the system setup before you type a word — "compound engineering" applied to context.
5. **The human's job is constraint design:** Traders building working AI tools are not those with the most coding experience. They're the ones who make the AI's guesses better through planning, specific instructions, live context, and a system that remembers.

**Survivorship bias warning:** Observations from a writer who publishes about AI trading — selection bias toward success cases and positive framing.

**What failed (implicitly):** Traders who let Claude run without constraints, who don't manage context, who use text prompts without specificity. The article's insights exist because these failures happened.

**Key lesson for Nomos:** The bottleneck is not the LLM capability — it's context architecture. A well-designed CLAUDE.md + session checkpoint system is more valuable than a more powerful model.

---

### 1.3 "Building an AI Trading Bot: 14 Sessions, 961 Tool Calls, 1 Surviving Strategy" — Ji_AI (Mar 2026)

**Source:** https://dev.to/ji_ai/building-an-ai-trading-bot-with-claude-code-14-sessions-961-tool-calls-4o0n

**Architecture:**
Crypto futures bot on Bybit. Built spec-first via CLAUDE.md containing leverage ratios, stop-loss ranges, symbol lists, timeframes. Session 1 generated 27 files from a single prompt in 2h48m.

Files generated: bot.py, exchange.py, strategy.py, risk_manager.py, telegram_bot.py + 22 modules. Total: 59 files created, 22 modified, 293 bash commands, 217 file reads, 158 edits.

**Critical incident (Session 5):** Claude detected BYBIT_TESTNET=false and autonomously halted: "this is LIVE/mainnet. Per the hard rules, I will NOT trade or restart the bot without confirming this is safe." Self-governance from codified CLAUDE.md rules.

**5-Agent Review Panel (Session 8):**
Virtual panel: Strategy/Quant, Risk, Execution, Data/Backtest, Ops/Observability. Analyzed 10 live trades. Score: 4.2/10. Finding: 60% win rate masked structural problems. Net result: -$39.20 from inverted risk/reward ratios. Missing daily loss limits identified.

**Strategy Testing (Session 12):**
5 independent strategies tested on 90 days of 26,000 5-minute candles:

| Strategy | Return | Win Rate | Profit Factor | Trades |
|----------|--------|----------|---------------|--------|
| EMA Momentum | +0.32% | 33.3% | 1.08 | 120 |
| BB Reversion | -2.1% | 41% | 0.87 | 500 |
| MACD Cross | -3.4% | 38% | 0.79 | 620 |
| RSI Mean Rev | -1.8% | 44% | 0.91 | 739 |
| Volume Breakout | -0.9% | 35% | 0.95 | 580 |

**Only 1 of 5 strategies survived.** The profitable one had fewest trades — fewer entries = less fee/slippage exposure.

**Context management:** Limits hit 4 times in 14 sessions. Recovery: STATUS.md with current strategy, test results, next steps.

**Survivorship bias warning:** This is an honest case study with no profit claims. The documented system lost money on 4/5 strategies and barely broke even on the 5th. Important counter-signal to viral success stories.

**What worked:**
- CLAUDE.md spec-driven development produces clean codebases fast
- Structured error prompts (code + hypothesis + numbered requirements) solve bugs in one attempt
- Multi-agent review panel surfaces hidden flaws

**What failed:**
- 4 of 5 strategies unprofitable
- High trade frequency amplifies fees
- Initial risk/reward inversion went undetected without explicit review

**Key lesson for Nomos:** Run a multi-agent review on any live strategy before deployment. Win rate alone is not a profitability indicator. Filter for trade frequency — fewer, higher-conviction trades survive fee drag.

---

### 1.4 "How I Claude Code My Way to Better Crypto Trading" — 0xAnn (Jan 2026)

**Source:** https://medium.com/crypto-24-7/how-i-claude-code-my-way-to-better-crypto-trading-ee6a29f923c9

**Architecture:** Tool-augmentation workflow rather than autonomous agent. Started with a TradingView indicator tweak, evolved into 6 sub-projects in 3 days. Claude used as a coding accelerator, not as a decision-maker.

**What was built:**
- Modified TradingView indicators (GUI improvements, new features)
- Script that analyzed BTC price action patterns
- Multiple analysis and visualization tools

**Results:** Reported "script that successfully predicted Bitcoin's local top." Many elements of trading reportedly improved.

**Survivorship bias warning:** High. A single successful BTC top call is not evidence of systematic edge. No P&L data, no win rate, no forward results. Publication in "Crypto 24/7" (hype-adjacent publication) increases selection bias.

**What worked:** Claude as rapid iteration tool for indicator development. 3-day sprint from idea to working tools.

**What failed:** No documented failures, which is itself a red flag.

**Key lesson for Nomos:** Claude Code as a tool-builder is the safest architecture. Let humans make the final trading decision; let Claude build the analysis infrastructure.

---

### 1.5 "Building an Automated Polymarket Trading System with Claude Code" — Örvar Karlsson (Mar 2026)

**Source:** https://medium.com/@rvarkarlsson/building-an-automated-polymarket-trading-system-with-claude-code-1982ff60cc74

**Architecture:**
Built on top of Polymarket's official Rust CLI binary. Development methodology: "cli-anything" — wrap a stateless CLI in a programmable Python harness, build automation layers on top.

Phases:
1. Python harness around polymarket binary (subprocess calls, session management)
2. Watchlist and price monitoring layer
3. Arbitrage scanner (NegRisk arbitrage detection)
4. Trade execution automation
5. Learning loop (track results, adjust)

Key technical challenge: wallet proxy configuration for EIP-712 signing.

**Strategy:** NegRisk arbitrage on Polymarket. NegRisk = when "Yes" + "No" prices on complementary markets sum to <$1, buy both for guaranteed profit at resolution. Also explores latency-based entries.

**Results:** Not explicitly stated in search results. Article focuses on development process.

**Survivorship bias warning:** Article documents the build process, not verified live trading results. NegRisk arbitrage opportunities have narrowed significantly in 2026 as competition has intensified.

**What worked:** cli-anything methodology enables rapid prototyping around opaque binaries. Python harness approach is portable.

**What failed:** Stateless CLI requires session management overhead. Wallet proxy configuration is non-trivial.

**Key lesson for Nomos:** Wrapping existing CLIs is faster than building from scratch. Start with the Polymarket Python client library (py-clob-client) instead of the Rust CLI for easier programmatic access.

---

### 1.6 "Just Built A Two-Layer AI System That Trades Polymarket and Kalshi" — Ezekiel Njuguna (Mar 2026)

**Source:** https://blog.devgenius.io/just-built-a-two-layer-ai-system-that-trades-polymarket-and-kalshi-while-i-sleep-heres-the-aa59ead275f6

**Architecture:**
Two-layer design for cross-platform prediction market trading.

**Layer 1 — Market Normalization:**
Input: raw market data from Polymarket (Polygon CLOB, off-chain matching, on-chain settlement) and Kalshi (US-regulated REST API, different auth model).
Output: normalized internal representation — `{market_id, venue, contract_type, outcomes[], resolution_time, rules_hash}`. Abstracts platform differences.

**Layer 2 — Intelligence + Execution:**
- Intelligence Layer: LLM (Claude or GPT-4o) + custom scoring models
- Strategy Layer: position sizing, risk management
- Execution Layer: platform-specific order routing
- Data Layer: price feeds, news, market metadata

**Cross-platform use case:** When Polymarket shows BTC will close above $95K at 60% and Kalshi shows same event at 55%, the system routes a buy to Kalshi (underpriced) and a hedge to Polymarket if needed.

**Survivorship bias warning:** Article describes architecture and claims, no verified live trading P&L provided.

**What worked:** Normalization layer is architecturally sound — enables strategy portability across platforms.

**What failed:** Cross-platform arbitrage is heavily competitive; the article predates March 2026 Polymarket fee expansion to all crypto markets, which materially changed profitability math.

**Key lesson for Nomos:** Abstraction layer between market-specific APIs and strategy logic is good engineering regardless of returns. Worth building even for single-platform deployment.

---

### 1.7 "How I Built a 4,000-Line Production Trading Bot" — Chudi.dev (2025–2026)

**Source:** https://chudi.dev/blog/claude-code-production-trading-bot

**System:** Polyphemus — 4,000+ line autonomous Polymarket trading bot, 6 weeks to build.

**Architecture:**
- Signal pipeline: Binance aggTrade WebSocket → 60-second momentum detection → CLOB order execution
- Position sizing: Kelly Criterion with dynamic self-tuning based on recent performance
- Market: Polymarket 5-minute BTC up/down contracts
- Infrastructure: DigitalOcean Droplet ($6/month)

**Multi-agent design:**
- Researcher agent — studies trading signals, validates market conditions
- Architect agent — designs multi-file system changes
- Developer agent — implements via two-gate verification
- Testing/Validation agent — runs simulation before live execution

**Two-Gate Verification System:**
- Gate 1 (automated): bash script — type checks, linting, tests. ~30 seconds. Catches ~60% of errors.
- Gate 2 (manual): 6-question checklist: correctness vs spec, API endpoint validation, error handling, hardcoded values, regression risk, explainability.
- Result: error rate dropped from 1/6 Claude outputs to 1/40 reaching production (84% reduction).

**Tiered Context Loading:**
- Tier 1 (~500 tokens): CLAUDE.md — project identity, file structure, hard rules
- Tier 2 (~1,000 tokens): CURRENT_TASK.md — session goals and involved files
- Tier 3 (on-demand): specific files, loaded by name
- Result: average session tokens reduced from ~10,000 to ~4,200 (58% reduction)

**Cost Breakdown:**
- Month 1 (unoptimized): $340 in API fees
- Months 2–3 (optimized): ~$136/month Claude Code API + $6/month DigitalOcean
- Optimization: tiered context, auto-memory, progressive context loading → 44% cost reduction

**Live Trading Results:**
- Uptime: 99.2%
- Win rate: 69.6% across 23 clean trades (small sample)
- Errors caught: 4 total (zero money lost)
- Strategy: Polymarket 5-minute BTC up/down, exploiting 30–90 second Binance WebSocket lag

**Survivorship bias warning:** 23 trades is statistically insignificant. Win rate without P&L is incomplete. Article was written during a period of high latency arbitrage profitability (pre-Polymarket fee changes). Strategy viability materially changed when Polymarket introduced dynamic fees on 5-minute markets in January 2026.

**What worked:**
- Two-gate verification: production-critical for financial code
- Tiered context loading: cost control without quality loss
- Pre-compaction handoff: Claude writes session notes enabling 90-second context recovery
- Kelly criterion with self-tuning: disciplined position sizing

**What failed (implied):** Month 1 cost structure ($340/month) was unsustainable at small capital. Strategy competitiveness degraded as fees were introduced.

**Key lesson for Nomos:** Two-gate verification is mandatory. Context tiering is mandatory. $142/month operational cost means you need >$142/month in profits to be net positive — with $260 capital this requires >50% monthly return just to cover costs, which is unrealistic. This architecture was designed for larger capital.

---

## 2. GitHub Projects

### 2.1 Byte-Ventures/claude-trader

**Source:** https://github.com/Byte-Ventures/claude-trader
**Status:** Experimental. Paper trading default.

**Architecture:**
Automated Bitcoin trading bot for Coinbase and Kraken. SQLite persistent state. Web dashboard.

**Multi-Indicator Confluence Strategy (weighted scoring):**
| Indicator | Weight | Signal logic |
|-----------|--------|--------------|
| RSI (14) | 25% | Dead zone 45–55; scaled ±0.3 to ±1.0 outside |
| MACD (12/26/9) | 25% | Crossover + histogram momentum |
| Bollinger Bands (20, 2σ) | 20% | %B-based, 0.35–0.65 dead zone |
| EMA Crossover (9/21) | 15% | Position + momentum; <0.3% gap dead zone |
| Volume | 15% | Confirmation boost/penalty |

Trade trigger: score ≥ 60 (buy) or ≤ -60 (sell).

**Three-Reviewer + Judge AI System:**
- Three reviewers: Pro, Neutral, Opposing stances
- Judge model synthesizes perspectives → recommendation: "accumulate," "reduce," or "wait"
- Recommendations adjust signal thresholds for configurable TTL (default 20 minutes)
- Supported models: Grok-4, Qwen3, Gemini-2.5-Flash, DeepSeek (via OpenRouter)

**Five-Layer Market Protection:**
1. Regime Threshold Adjustments (Fear & Greed Index)
2. Regime Position Sizing (±15–30% size scaling)
3. Extreme Fear MTF Override (full counter-penalty when daily/4h disagree)
4. Dual-Extreme Blocking (prohibits buys during extreme fear + extreme volatility)
5. Extreme Volatility Stop Widening (1.5x → 2.0x ATR expansion)

**Additional safety:** Trade cooldown (15-min minimum), whale detection (+30% confidence boost at 3x average volume), multi-timeframe confirmation (daily + 4h alignment), daily loss limit (10%), hourly limit (3%).

**Paper trading:** $5,000 quote + 0.05 BTC. Cramer Mode: mirrors every decision with opposite action for performance comparison.

**Performance data:** None. README explicitly labels it "experimental for testing."

**Key lesson for Nomos:** Dead zones in indicators (not trading when signal is ambiguous) reduce false signals. Three-reviewer adversarial pattern forces consideration of opposing view.

---

### 2.2 degentic-tools/claude-code-trading-terminal

**Source:** https://github.com/degentic-tools/claude-code-trading-terminal
**Market:** Solana DeFi

**Architecture:**
Agent-native trading terminal built on Claude Code. Data pipeline model:

```
Sources → ConnectionManager.js → QueueManager.js → DataProcessor.js → Consumers (sub-agents)
```

Each sub-agent manages: individual wallet operations, trade execution, position monitoring, risk enforcement. Parallel across "unlimited wallets."

**Key components:**
- ConnectionManager.js: WebSocket + HTTP connection pooling
- QueueManager.js: in-memory or file-based persistent queues
- DataProcessor.js: parallel execution engine
- DataValidator / Transformer / Enricher: sequential processing

**Market Making (Solana):** 50/50 SOL/SPL rebalancing via Jupiter Aggregator. Default 50bps slippage. Multi-DEX: Jupiter, Raydium, Meteora. PumpFun memecoin integration with AI risk scoring (low/medium/high).

**Risk:** 3-tier position sizing. Dynamic slippage adjustment. Multi-platform price comparison (MEV attack prevention).

**Performance data:** None. High-level architecture claims only.

**Key lesson for Nomos:** Parallel wallet management is interesting at scale but irrelevant for $260 capital. The MEV protection / multi-platform price comparison pattern is worth borrowing.

---

### 2.3 tradermonty/claude-trading-skills

**Source:** https://github.com/tradermonty/claude-trading-skills

**Architecture:** 40+ skills for Claude Code — not a trading system, but a toolkit. Skills bundle prompts + knowledge + optional helper scripts.

**Key skills:**
- VCP Screener, CANSLIM Screener, Value Dividend Screener (stock; less relevant for crypto)
- Market Environment Analysis, Macro Regime Detector
- Backtest Expert, Scenario Analyzer
- Stanley Druckenmiller Investment Advisor
- US Market Bubble Detector
- Portfolio Manager, Position Sizer, Signal Postmortem

**Data sources:**
- FMP API (Financial Modeling Prep, ~250 free calls/day)
- FINVIZ (public + beautifulsoup4 scraping)
- yfinance (price data)
- Alpaca MCP Server (portfolio)

**Aggregation logic:** Orchestration script aggregates outputs from multiple analysis agents, applies configurable weighting, signal deduplication, recency adjustment, contradiction handling → ranked conviction dashboard.

**Performance data:** None. Explicitly: "no quantified performance claims." Emphasizes methodology: hypothesis definition, parameter robustness, walk-forward testing with slippage assumptions.

**Key lesson for Nomos:** Signal Postmortem skill is worth studying — structured retrospective on why signals succeeded or failed. Contradiction handling between agents is useful pattern.

---

### 2.4 0ldh/claude-code-agents-orchestra

**Source:** https://github.com/0ldh/claude-code-agents-orchestra

**Architecture:** 47 specialized agents in 10 teams. Crypto/finance team:
- **crypto-trader** — strategy dev + execution; backtesting against historical data; execution logic + risk rules (stop-losses, position sizing, portfolio limits)
- **crypto-analyst** — technical + fundamental analysis
- **crypto-risk-manager** — portfolio exposure, hedging, risk parameters
- **defi-strategist** — DeFi protocols, yield, liquidity
- **arbitrage-bot** — pricing discrepancies across exchanges
- **quant-analyst** — quantitative models, statistical frameworks, stat arb

**Orchestration:** Triage → Execution → QA → Authority. Claude as coordinator. Model assignment: Opus for 13 complex/strategic agents, Sonnet for 34 implementation agents.

**Performance data:** None — prompt library only, no trading system.

**Key lesson for Nomos:** Agent role specialization is architecturally sound. Crypto-risk-manager as a separate agent from crypto-trader creates natural separation of concerns.

---

### 2.5 cs50victor/claude-trade

**Source:** https://github.com/cs50victor/claude-trade
**Status:** Early stage (2 commits). Experimental.

**Architecture:**
TypeScript MCP server (`mcp_server_http.ts`) + Python core (`main.py`, `prompts.py`). Package management: Bun + UV. Coinbase integration for buy/sell order placement and portfolio tracking.

Claude as financial asset manager: natural language prompts → API analysis → autonomous execution. Philosophy: "disciplined execution of rules — signal detection, rebalancing, loss harvesting, emotionless trading."

**Not implemented:** Advanced execution algorithms, risk management frameworks, tax optimization.

**Performance data:** None. 2 commits = proof of concept only.

**Key lesson for Nomos:** MCP server pattern for broker integration is the right architectural choice for Claude Code. The Claude-as-manager framing is philosophically honest.

---

### 2.6 discountry/polymarket-trading-bot

**Source:** https://github.com/discountry/polymarket-trading-bot

**Architecture:**
Python. Core: `bot.py`, `client.py`, `signer.py` (EIP-712), `websocket_client.py`, `gamma_client.py`. 89 unit tests.

**Flash Crash Strategy:**
1. Auto-discover current 15-min market for BTC/ETH/SOL/XRP
2. Subscribe to real-time orderbook via WebSocket
3. Trigger buy when probability drops 0.30+ within 10 seconds
4. Exit at +$0.10 profit or -$0.05 loss

**Security:** PBKDF2 key derivation (480,000 iterations), Fernet encryption, 0600 file permissions.

**Performance data:** None claimed. Beginner-friendly template.

**Key lesson for Nomos:** Flash crash strategy logic (buy rapid probability drops) is the simplest directional approach available. The 0.30 threshold / 10-second window are configurable starting points.

---

### 2.7 TauricResearch/TradingAgents

**Source:** https://github.com/TauricResearch/TradingAgents | arXiv 2412.20138

**Architecture:** LangGraph-based multi-agent stock trading framework. Seven roles:
1. Fundamentals Analyst
2. Sentiment Analyst
3. News Analyst
4. Technical Analyst
5. Bullish/Bearish Researchers (structured debate)
6. Trader Agent (synthesizes reports)
7. Risk Management + Portfolio Manager

**Supported LLMs:** OpenAI (GPT-5.x), Google (Gemini 3.x), Anthropic (Claude 4.x), xAI (Grok 4.x), OpenRouter, Ollama.

**Backtesting Results:**
- Up to 30.5% annualized returns
- Significantly outperforms traditional trading strategies
- Improvements in cumulative returns, Sharpe ratio, maximum drawdown

**Survivorship bias warning:** Academic paper results are backtested. Backtests consistently overestimate live performance due to: no market impact, perfect fills, hindsight-free data (but contamination is possible), no slippage beyond estimates. Real trading with LLM latency (API calls for each decision) vs. backtested "instantaneous" decisions is a material difference.

**Key lesson for Nomos:** The Bull/Bear researcher debate pattern is valuable — forcing explicit consideration of both directions before a position. Portfolio Manager as separate approval gate mirrors the CEO pattern in Jake Nesler's system.

---

### 2.8 Additional GitHub Projects

**dylanpersonguy/Fully-Autonomous-Polymarket-AI-Trading-Bot**
Source: https://github.com/dylanpersonguy/Fully-Autonomous-Polymarket-AI-Trading-Bot

Three-model ensemble: GPT-4o (40%), Claude 3.5 Sonnet (35%), Gemini 1.5 Pro (25%). Independent forecasts, aggregated via trimmed mean / median / weighted average. Adaptive per-model Brier score reweighting over time.

15+ risk checks (all must pass): kill switch, 20% drawdown auto-kill, 4-level heat system, $50 max stake/market, $500 daily loss limit, 25 max open positions, 4% min net edge after fees, $2,000 min liquidity, 6% max spread, 0.55 evidence quality threshold, MEDIUM confidence minimum, 5% probability floor, 35% category exposure cap, 48h timeline check, arbitrage detection.

Whale tracking: top 50 wallets by profit + top 50 by volume, 7-phase scanner. Whale agreement → +8% edge boost. Disagreement → -2% penalty. Smart Money Index 0–100.

**Paper trading default. No live performance data published.**

**alsk1992/CloddsBot**
Source: https://github.com/alsk1992/CloddsBot

Claude as primary reasoning engine. 119+ skills, 18 tools (browser, docker, exec, files, git, email, SMS, webhooks, SQL, vision). LanceDB semantic memory. 21 messaging platform integrations. 118+ strategies (momentum, mean reversion, penny clipper, expiry fade, DCA). Risk engine: VaR/CVaR, circuit breaker, Kelly sizing, daily loss limits, kill switch. Agent commerce protocol: x402 micropayments (USDC, Base + Solana), agent marketplace with escrow.

**No performance data. Architecture-only description.** Very ambitious scope raises questions about actual production testing.

**artvandelay/polymarket-agents**
Polymarket research MCP server: 10 tools (odds, orderbook, spread, history) + autonomous trading bot. Claude Sonnet decision-making. Pluggable strategies. SQLite persistence.

**Polymarket/agents (official)**
Source: https://github.com/Polymarket/agents
Official Polymarket agent framework for autonomous trading.

---

## 3. Polymarket & Prediction Market Cases

### 3.1 Wallet 0x8dxd — $313 → $438K (Jan 2026)

**Sources:**
- https://finbold.com/trading-bot-turns-313-into-438000-on-polymarket-in-a-month/
- https://x.com/BlakeNastri2403/status/2007315124089139208
- https://bingx.com/en/news/post/polymarket-bot-x-dxd-grows-to-in-a-month-win-rate-by-jan

**Strategy: Pure Latency Arbitrage**
The bot did not predict price direction. It reacted faster than Polymarket's pricing engine.

Mechanism:
1. Monitor BTC spot price in real-time on Binance and Coinbase
2. Detect when price movement makes a 15-minute Up/Down market near-certain
3. Buy the winning side before Polymarket's oracle catches up (30-second to 2-second lag window)
4. Collect near-guaranteed payout at settlement

**Performance:**
- Period: December 2025 → January 6, 2026 (~30 days)
- Starting capital: $313
- Final: ~$438,000
- Win rate: 96.3–98% (6,615 predictions)
- 5,637 trades in 29 days
- Infrastructure: reportedly $20/month VPS

**What happened to the strategy:**
Polymarket introduced dynamic taker fees on 15-minute crypto markets in January 2026. At 50-cent contracts (50/50 odds), fee = ~3.15% — exceeding typical arbitrage margin. Strategy became unprofitable at scale.

**Survivorship bias warning:** This is the single most extreme success case. It represents 1 wallet out of >50,000 on Polymarket. The success window was specific: December 2025–January 2026, before fee changes. The bot also ran on $313 — small enough that position sizing didn't move the market. A clone attempting this in March 2026 would face: 3.15% taker fees, arbitrage opportunity windows shrunk from avg 12.3 seconds (2024) to 2.7 seconds (Q1 2026), 73% of arb profits going to sub-100ms execution bots.

**Architecture (reverse-engineered by Blake.ETH):**
- Binance WebSocket for real-time price feed
- Polymarket CLOB API for order placement
- Lag detection: price confirmed direction + Polymarket not yet repriced
- VPS with low-latency connection (not collocated)
- Reportedly rebuilt in Rust with Claude in ~40 minutes

**Key lesson for Nomos:** This strategy is **closed** as of March 2026. Polymarket's dynamic fees specifically targeted it. The window existed because of a unique combination of: zero fees + slow oracle + first-mover advantage. All three conditions no longer hold.

---

### 3.2 $50 → $435K Case

**Source:** https://medium.com/@weare1010/claude-ai-trading-bots-are-making-hundreds-of-thousands-on-polymarket-2840efb9f2cd (blocked) + search results

**Strategy:** Same latency arbitrage as 0x8dxd.
- Starting capital: $50
- Final: ~$435,000
- A developer reverse-engineered the strategy and rebuilt it in Rust using Claude Code in ~40 minutes
- Technical specs: WebSockets, lag detection >0.3%, execution <100ms, risk rules 0.5%/trade and 2% daily cap

**Survivorship bias warning:** Same as 0x8dxd. This was the same strategy, same window, same market conditions. Not reproducible in March 2026.

---

### 3.3 Sub-$1 NegRisk Arbitrage — 8,894 Trades, $150K

**Source:** https://www.coindesk.com/markets/2026/02/21/how-ai-is-helping-retail-traders-exploit-prediction-market-glitches-to-make-easy-money

**Strategy:** Pure mathematical arbitrage. When Yes + No prices sum to <$1.00 (e.g., $0.97), buy both sides. Collect $1.00 at settlement. Guaranteed profit = $0.03 per $0.97 deployed (~3.1%).

**Performance:** 8,894 trades, ~$150K total profit. Per-trade sizing ~$1,000.

**Current status:** Still theoretically available but:
- Competition intensified → windows narrowed
- Polymarket expanded fee structure to all crypto markets (March 2026) — fees can exceed arbitrage margin
- Order book depth: $5,000–$15,000 per side on 5-minute contracts — limits maximum deployment size

**Key lesson for Nomos:** This arbitrage is risk-free when it exists, but requires: (a) monitoring infrastructure to catch sub-$1 moments, (b) sufficient liquidity in the market, (c) fees below the arbitrage margin. With $260 capital, even a $0.03 profit per $1 deployed = $7.80 profit on full capital deployment, minus fees. Fee math must be verified before deploying.

---

### 3.4 Polystrat — Pearl/Olas AI Agent (Feb 2026)

**Source:** https://www.pearl.you/polystrat | https://olas.network/blog/introducing-polystrat-an-autonomous-ai-prediction-agent-on-polymarket

**Architecture:**
- Self-custodial Safe account (Gnosis/Base onchain)
- Local execution via Pearl (Olas protocol)
- NLP strategy definition: user sets goals in plain English
- Autonomous market selection across sectors (sports, politics, economics)
- Identifies probability discrepancies in markets settling within 4 days
- Hardcoded safety constraints prevent rogue behavior

**Performance:**
- Launched February 2026
- 4,200+ trades executed in ~1 month
- Single-trade returns as high as 376%
- "Over 37% showing positive P&L" vs. <18.5% for human participants

**Survivorship bias warning:** "37% positive P&L" means 63% are unprofitable. The comparison to humans is misleading — human traders may be less sophisticated and trade more erratically. 376% single-trade return is likely one outlier position. No aggregate P&L figure disclosed.

**Key lesson for Nomos:** 37% positive P&L from AI agents is actually somewhat depressing — it means most AI bots lose money. The honest benchmark is: can your bot be in the profitable 37%?

---

### 3.5 The 92.4% Unprofitability Statistic

**Sources:**
- https://medium.com/technology-hits/why-92-of-polymarket-traders-lose-money-and-how-bots-changed-the-game-2a60cd27df36 (blocked)
- Search result data: analysis of 50,000+ wallets, on-chain data from Polygon blockchain

**Methodology:** On-chain analysis of Polymarket wallets — every trade is public on Polygon. Wallets with negative cumulative P&L = unprofitable.

**Statistics:**
- 92.4% of 50,000+ wallets are unprofitable (net loss)
- Only 7.6% net profitable
- Hubble Research: 3.7% of users generate 37.44% of total trading volume ("Bot Zone")
- LayerHub: >30% of Polymarket wallets employ AI agents (March 2026)
- CoinDesk: only 7–13% of human traders achieve positive performance

**Critical interpretation:** The 7.6% profitable figure includes survivorship from dead wallets (wallets that lost everything and stopped trading appear as "negative," not as "deleted"). The real profitability rate among active, sophisticated participants is higher — but the 92.4% figure accurately captures the retail experience.

**Key lesson for Nomos:** The base rate for retail prediction market trading is catastrophic. Any claim of "my bot is profitable" without extended live results and transaction-level data should be treated as survivorship bias.

---

### 3.6 Polymarket Fee Changes — Impact on Bot Strategies (Jan–Mar 2026)

**Source:** https://www.financemagnates.com/cryptocurrency/polymarket-introduces-dynamic-fees-to-curb-latency-arbitrage-in-short-term-crypto-markets/

**Timeline:**
- January 7, 2026: Dynamic taker fees introduced on 15-minute crypto markets. Highest at 50-cent contracts (~3.15%). Targeted specifically at latency arbitrage.
- March 2026: Fee structure expanded to ALL crypto market timeframes (1h, 4h, daily, weekly).
- Maker Rebates Program: fees redistributed to liquidity providers.

**Impact:**
- Latency arbitrage on 15-minute markets: unprofitable at scale (fee > edge)
- Bots that extracted ~$40M from Polymarket in 2024–2025 now face structural fee headwinds
- Arbitrage duration shrank: 12.3s average in 2024 → 2.7s average Q1 2026

**Key lesson for Nomos:** Latency arbitrage on Polymarket is a closed window as of 2026. Any system targeting this market must account for dynamic taker fees in its edge calculation. Strategies that worked in viral case studies (0x8dxd, $50→$435K) are no longer viable.

---

## 4. Academic Papers

### 4.1 StockBench — arXiv 2510.02209

**Source:** https://arxiv.org/abs/2510.02209

**Methodology:**
- 20 top DJIA stocks (stock market, not crypto)
- Evaluation period: March–June 2025 (82 trading days)
- Contamination-free (post-training-cutoff data)
- 4-stage workflow: portfolio overview → in-depth analysis → decision generation → execution

**Full Results Table:**
| Model | Return (%) | Max Drawdown (%) | Sortino Ratio | Rank |
|-------|-----------|-----------------|---------------|------|
| Kimi-K2 | 1.9 | -11.8 | 0.0420 | 1 |
| Qwen3-235B-Ins | 2.4 | -11.2 | 0.0299 | 2 |
| GLM-4.5 | 2.3 | -13.7 | 0.0295 | 3 |
| Qwen3-235B-Think | 2.5 | -14.9 | 0.0309 | 4 |
| OpenAI-O3 | 1.9 | -13.2 | 0.0267 | 5 |
| Claude-4-Sonnet | 2.2 | -14.2 | 0.0245 | 7 |
| Buy-and-Hold | 0.4 | -15.2 | 0.0155 | 12 |

**Claude-4-Sonnet performance:** 2.2% return, -14.2% max drawdown, 0.0245 Sortino. Rank 7 of ~12 models. Beat buy-and-hold but underperformed top models (Kimi-K2, Qwen3).

**Key findings:**
- "Most LLM agents fail to outperform this simple baseline in terms of both cumulative return and risk-adjusted return" — headline finding
- All models beat buy-and-hold on risk management (lower drawdowns)
- Performance is market-condition dependent: LLMs struggle in bearish markets, outperform in bullish markets
- Outperforming static knowledge tasks ≠ trading success

**Survivorship bias warning:** Stock market data, not crypto. 82 trading days = very short evaluation period. Backtest, not live trading. The 1.9–2.5% returns over 4 months equate to ~5–7.5% annualized — barely above index. Not generalizable to crypto.

**Key lesson for Nomos:** Claude is a mid-tier LLM for trading tasks — not the best. In crypto (vs. stocks), this ranking may shift due to different information processing requirements. The "most LLM agents fail to beat buy-and-hold" finding is the most important takeaway.

---

### 4.2 TradingAgents — arXiv 2412.20138

**Source:** https://arxiv.org/abs/2412.20138

**Architecture:**
7-agent LangGraph system:
1. Fundamentals Analyst
2. Sentiment Analyst
3. News Analyst
4. Technical Analyst
5. Bull/Bear Researchers (adversarial debate)
6. Trader Agent
7. Risk Management + Portfolio Manager

**Results:**
- Up to 30.5% annualized returns
- Outperforms buy-and-hold, traditional strategies (SMA, MACD, RSI)
- Improvements in Sharpe ratio and max drawdown reduction

**Survivorship bias warning:** Academic paper, backtested on historical data. 30.5% annualized sounds impressive but: (1) which period? Bull market bias. (2) No transaction costs beyond estimates. (3) LLM latency in live trading (100ms–2000ms per decision) doesn't exist in backtest. (4) This is stocks, not crypto. Crypto volatility would produce larger numbers in both directions.

**Key lesson for Nomos:** The adversarial Bull/Bear debate pattern adds meaningful value. Structured debate before a position forces explicit consideration of failure modes.

---

### 4.3 FS-ReasoningAgent — arXiv 2410.12464 (ICLR 2025 Workshop)

**Source:** https://arxiv.org/abs/2410.12464

**Architecture:** 7-agent hierarchical system for crypto:
1. Statistics Agent — quantitative metrics (price, volume, gas, addresses)
2. Fact Agent — objective information (regulatory updates, tech developments)
3. Subjectivity Agent — market sentiment, expert opinions, emotional drivers
4. Fact Reasoning Agent — synthesizes stats + facts
5. Subjectivity Reasoning Agent — interprets sentiment
6. Trade Agent — final decision on continuous [-1, 1] scale
7. Reflection Agent — reviews past performance, optimizes future

**Key Innovation:** Separating factual from subjective reasoning. Finding: "stronger LLMs show preference for factual information over subjectivity" — but crypto markets are emotion-driven. Decomposing the reasoning path enables better utilization of both.

**Performance Results (backtested):**

Bull market:
- BTC: +77.47% (GPT-4)
- ETH: +77.28% (o1-mini)
- SOL: +76.71% (o1-mini)

Bear market:
- BTC: -15.23% (GPT-4)
- ETH: -21.88% (o1-mini)
- SOL: -14.52% (GPT-4o)

vs. CryptoTrade baseline: +7% on BTC, +10% on SOL.

**Ablation study:** Subjectivity contributes 10% to bull market returns. Factual reasoning prevents 4.5% additional losses in bear markets.

**Survivorship bias warning:** Backtested. Bull/bear performance is period-specific. The positive numbers in bull markets are easy to achieve — the bear market losses are the honest signal. -15% to -22% in bear markets means the system does not have reliable downside protection.

**Key lesson for Nomos:** The fact-subjectivity decomposition is crypto-specific and valuable. Sentiment processing should be architecturally separate from factual/technical analysis. The Reflection Agent (postmortem on past decisions) is a pattern worth implementing.

---

### 4.4 LLM-Powered Multi-Agent Crypto Portfolio — arXiv 2501.00826

**Source:** https://arxiv.org/abs/2501.00826

**Architecture:** Expert-team collaboration for top-30 crypto assets.
- **Expert Training Module:** Fine-tuned agents using multi-modal historical data + professional investment literature
- **Investment Module:** Real-time data for decision-making
- **Two collaboration mechanisms:** Intrateam (within domain) + Interteam (cross-domain), adjusting predictions based on confidence levels

**Results:**
- Backtested: November 2023–September 2024
- Outperforms single-agent models and market benchmarks
- "Classification, asset pricing, portfolio, and explainability performance"
- No specific return numbers in abstract

**Survivorship bias warning:** 10-month backtest covers one of the strongest crypto bull periods (post-FTX recovery). No bear market validation disclosed. Fine-tuned agents require training data — cold-start problem for new systems.

**Key lesson for Nomos:** The intrateam/interteam collaboration pattern (agents sharing confidence-adjusted signals) is sophisticated. For a $260 system, simplified version: weight signals by agent confidence before aggregating.

---

## 5. Other AI Trading Systems

### 5.1 Aurora / NexusTrade — Austin Starks

**Sources:**
- https://medium.com/codex/i-built-aurora-an-ai-trading-agent-that-works-like-cursor-and-claude-code-heres-how-she-works-7a0b5fe909eb
- https://medium.com/@austin-starks/i-analyzed-140-000-backtests-then-built-an-ai-algotrading-agent-its-crushing-the-market-d75b2dac1a20
- https://nexustrade.io/

**Architecture:** Three-layer system:
1. **Planning Layer** — creates research plans, asks clarifying questions
2. **Execution Layer** — ReAct framework (Reason → Act → Observe loop)
3. **Orchestration Layer** — finite state machine: automation controls, context management, error handling, concurrent agent management

Built into NexusTrade platform. 500+ agent runs to train Aurora's pattern recognition. Genetic optimization for parameter evolution.

**What Aurora does:** Autonomously researches → creates → backtests → optimizes trading strategies from scratch. Can screen stocks, analyze earnings, backtest without user writing code.

**Performance claims:**
- "Analyzed 140,000 backtests" — this is training data for the system, not a profit claim
- "Crushing the market" — in backtests; no live verified P&L
- Claude Opus 4.5 "destroying the market" (NexusTrade blog post) — backtest

**Survivorship bias warning:** Very high. "Crushing" and "destroying" are marketing language. 140,000 backtests reveals the optimization fallacy: running enough backtests will find a strategy that "crushes" in-sample. NexusTrade is a commercial platform with marketing incentives. No audited live trading P&L.

**Key lesson for Nomos:** ReAct (Reason-Act-Observe) framework is the correct architecture for an agent that operates in a feedback loop. The orchestration layer managing concurrent agents is necessary at scale.

---

### 5.2 FMZ Platform + Claude Integration

**Sources:**
- https://dev.to/chronosquant/the-hottest-ai-trading-technology-of-2025-a-smart-trading-guide-to-fmz-platform-with-claude-part-29e6
- https://medium.com/@FMZQuant/the-hottest-ai-trading-technology-of-2025-a-smart-trading-guide-to-fmz-platform-with-claude-part-11cc833c6a1e

**Architecture:**
FMZ (Fengyuzan) = Chinese quantitative trading platform. MCP integration enables natural language control:
- "Start strategy X on exchange Y" → Claude → MCP → FMZ API → Docker node → exchange
- Manage multiple bots, check balances, trigger alerts, performance analysis — all via Claude

**Use pattern:** Claude as management layer, not strategy layer. Strategies remain pre-written FMZ scripts. Claude handles operations.

**Performance data:** None. Platform tutorial content, not case study.

**Key lesson for Nomos:** Management-via-LLM (monitoring, alerting, strategy switching) is a valid and lower-risk use of Claude than LLM-as-signal-generator.

---

### 5.3 "Everyone Is Talking About AI Trading Bots" — dev.to/crashland

**Source:** https://dev.to/crashland/everyone-is-talking-about-ai-trading-bots-we-actually-built-one-heres-what-happened-4cb3

**What they built:** Rust-based market-making bot for Polymarket + Kalshi.
- rs-clob-client (~13k lines): Polymarket SDK
- shared (~1.6k lines): cross-crate types, InventoryManager
- trader (~13.5k lines): TradingManager, market maker, web UI
- kalshi-trader (~9.2k lines): ported architecture

Strategy/execution separation: strategies receive frozen market snapshots, return decisions as pure functions. Enables testability.

**What actually happened:**
- Initial arbitrage (Polymarket vs Binance) disappeared within weeks — competition + fees
- Paper trading: 719,624 orders placed, 1,212 fills (0.17% fill rate — normal for market makers)
- ~430,000 units filled across outcomes

**Why it failed:**
- On NO side: 842 buy fills vs 106 sell fills (8:1 imbalance) — losing directional inventory
- Adverse selection: sophisticated traders knew price direction; bot accumulated the losing side
- Capital disadvantage: large market makers compute same fair value, have more capital to absorb adverse inventory
- "Binance leads Polymarket 97.5% of the time by ~5 ticks"

**What worked:** OMS infrastructure (DashMap concurrent hash map, Rust OrderState enum making illegal state transitions compile errors, rust_decimal exact arithmetic). Architecture ported cleanly to second exchange.

**Survivorship bias warning:** THIS IS AN HONEST FAILURE CASE. The system did not profit. Open-sourced because architecture is solid despite strategy failure. Valuable precisely because it is not a success story.

**Key lesson for Nomos:** Market-making with small capital faces structural disadvantage — you absorb inventory that large players shed. The OMS > strategy finding: a bad order management system loses money faster than a mediocre model. Adverse selection is real and severely underestimated by retail builders.

---

### 5.4 Itan Scott — "AI Bots and Polymarket: My Trading Experiment" (Mar 2026)

**Source:** https://medium.com/@itanscott1/ai-bots-and-polymarket-my-trading-experiment-2a89ab13bf75

**Architecture:**
3 bots, 2 wallets. Claude Code built ~4,000 lines of Python in ~10 minutes.

**Bot strategies:**
- **Bot 1 (simple):** Basic directional bets on 5-minute BTC
- **Bot 2 (conservative):** Buys when contract price $0.85–$0.95, verifies against Chainlink oracle (compares opening BTC price), places trades 20–5 seconds before resolution
- **Bot 3 (market-making):** Places simultaneous buy + sell around mid-price to capture spread; dynamic pricing formula adjusting for volatility and time decay

**Additional motivation:** Farming potential $POLY airdrop through trading volume.

**Results:** Not fully disclosed in search results. Article is mid-experiment reporting.

**Survivorship bias warning:** Mid-experiment article — final results not known. Bot 2's oracle verification is a meaningful risk control. Bot 3's market-making faces the adverse selection problem documented in the crashland case.

**Key lesson for Nomos:** Oracle verification (cross-checking contract price against external feed) is a critical safety mechanism. Bot 2's approach of only buying at 85–95 cents is a disciplined entry rule.

---

### 5.5 Polystrat (Pearl / Olas) — Autonomous Prediction Market Agent

**Source:** https://www.pearl.you/polystrat

See Section 3.4. Summarized for cross-reference:
- NLP goal-setting → autonomous market selection → 24/7 execution
- 4,200+ trades in first month
- 37% positive P&L (vs. <18.5% for human participants)
- Self-custodial Safe account, hardcoded constraints

---

### 5.6 CloddsBot — Comprehensive Autonomous Agent

**Source:** https://github.com/alsk1992/CloddsBot

See Section 2.8. Summarized: 1000+ markets, 119+ skills, 18 tools, 21 messaging integrations, Claude as primary LLM, LanceDB memory, VaR/CVaR risk engine, agent commerce protocol (x402 USDC payments). No performance data.

---

## 6. Cross-Case Synthesis

### 6.1 What Actually Works (evidence-based)

**Confirmed profitable strategies (with caveats):**
1. **Latency arbitrage on Polymarket** — closed as of Jan 2026 due to dynamic fees. Window was Dec 2025 specifically.
2. **NegRisk/complementary arbitrage** — still possible but opportunity frequency reduced by competition and March 2026 fee expansion.
3. **Sub-$1 sum arbitrage** — still possible in brief windows; $5,000–$15,000 orderbook depth limits scale.

**Unconfirmed / backtested only:**
- LLM multi-agent stock trading (TradingAgents, StockBench models)
- LLM crypto trading (FS-ReasoningAgent, arXiv 2501.00826)
- Aurora/NexusTrade (commercial platform with marketing incentives)

**Honestly failed (published):**
- crashland Rust market-maker: directional inventory accumulation, adverse selection
- Ji_AI 14-session bot: -$39.20 net loss, 4/5 strategies unprofitable
- Jake Nesler Phase 1: -1.1% in first two days from penny stock scalping

### 6.2 Architectural Patterns That Appear Across Multiple Cases

| Pattern | Cases | Value |
|---------|-------|-------|
| Two-gate verification (auto + manual) | Chudi/Polyphemus, Ji_AI | Reduces production errors 84% |
| Tiered context loading | Chudi/Polyphemus | 58% token reduction |
| CEO/Risk-gating agent | Jake Nesler, TradingAgents, Byte-Ventures | Prevents impulsive entries |
| Multi-reviewer adversarial panel | Byte-Ventures (3 reviewers), TradingAgents (Bull/Bear), Ji_AI (5-agent panel) | Surfaces hidden flaws |
| Kelly Criterion position sizing | Chudi/Polyphemus, Dylanpersonguy, CloddsBot | Disciplined sizing |
| Reflection / postmortem agent | FS-ReasoningAgent, tradermonty skills | Improves future decisions |
| Status/checkpoint files | Ji_AI, Chudi/Polyphemus | Context recovery after compaction |
| Strategy/execution separation | crashland (pure functions), Claude-trader | Testability, replayability |
| Oracle verification | Itan Scott Bot 2 | Critical safety check |
| Dead zones in indicators | Byte-Ventures | Reduces false signals |

### 6.3 Common Failure Modes

1. **Adverse selection** (crashland, market-makers generally): You fill on the wrong side when informed traders move directionally.
2. **Inverted risk/reward** (Ji_AI 4.2/10 panel): High win rate masks negative expected value.
3. **Fee drag** (Ji_AI): High trade frequency makes even slightly profitable strategies net-negative.
4. **Survivorship in backtests**: 140,000 backtests will find something that "crushes" in-sample.
5. **Context degradation** (Ji_AI 4x context blown): System quality degrades as context fills.
6. **Overconstrained agents** (Jake Nesler): Consultant + CEO together blocked all trades.
7. **Strategy market impact**: A strategy viable at $313 collapses at $100K. Polymarket orderbook depth $5K–$15K per side.

### 6.4 The Honesty Signal

The most informative case studies are the ones that document failure:
- **crashland**: Honest failure, open-sourced anyway
- **Ji_AI**: -$39.20 net loss documented transparently
- **Jake Nesler**: Phase 1 -1.1% from penny stock mistakes disclosed

The least informative are the viral success stories (0x8dxd, $50→$435K) because they represent the 0.1% of wallets that hit a specific window. They are not reproducible.

---

## 7. Lessons for Nomos ($260 Capital, Crypto Only, Claude Code)

### 7.1 Capital Reality Check

With $260:
- A $142/month infrastructure cost (Claude API + VPS as in Chudi case) requires >54% monthly return just to break even on costs. **Do not replicate the Chudi infrastructure at $260 capital.**
- Claude Max subscription is already paid (no per-call cost via CLI). This changes the math: operational cost can be near-zero if using Claude Code CLI instead of API.
- Maximum loss from $260 is $260. Build with this in mind.

### 7.2 What Strategies Are Viable at $260

**Potentially viable (low capital-efficient):**
- NegRisk/sub-$1 arbitrage: risk-free when found, but frequency is low, window is narrow, fees apply after March 2026 expansion
- Flash crash directional bets: buy rapid probability drops on 15-min markets; requires oracle verification to filter noise
- Oracle-verified entries (Itan Scott Bot 2 pattern): buy at 85–95 cents with Chainlink cross-check; low frequency, high precision

**Not viable at $260:**
- Market-making: adverse selection destroys small liquidity providers
- Latency arbitrage: window closed; competition requires sub-100ms infrastructure costing more than $260
- High-frequency directional: fee drag at $260 capital is fatal
- Multi-asset portfolio: insufficient capital for diversification

### 7.3 Architecture for a $260 Nomos System

**Recommended architecture based on cross-case analysis:**

```
Claude Code (Orchestrator)
  ├── Signal Layer
  │   ├── Price feed (Binance WebSocket — free)
  │   ├── Oracle verification (Chainlink)
  │   └── Probability monitor (Polymarket CLOB)
  ├── Agent Layer
  │   ├── Risk-gating agent (CEO pattern — must approve before entry)
  │   ├── Strategy agent (signal analysis, entry/exit)
  │   └── Postmortem agent (reflection on completed trades)
  ├── Execution Layer
  │   ├── Position sizer (Kelly Criterion, capped at 10% per trade)
  │   └── Order manager (two-gate verification before any live order)
  └── Memory Layer
      ├── CLAUDE.md (project identity, hard rules)
      ├── CURRENT_TASK.md (session state)
      └── trade_log.db (SQLite, all positions and decisions)
```

**Hard rules (codified in CLAUDE.md):**
- Max single position: 10% of capital ($26)
- Daily loss limit: 20% ($52) → auto-halt
- No position without oracle verification
- Gate 1 (automated checks) must pass before Gate 2 (manual approval)
- No trades in illiquid markets (<$1,000 orderbook depth)
- No trades in last 60 seconds of resolution (timing manipulation risk)

### 7.4 Claude Code Specific Best Practices

From cross-case analysis:

1. **CLAUDE.md is the most important file** — not the code. Encode hard rules, risk limits, banned behaviors. Reference the Ji_AI Session 5 incident: Claude self-halted on BYBIT_TESTNET=false because the rule was codified.

2. **Three-tier context loading** (Chudi pattern):
   - Tier 1: CLAUDE.md (rules only, ~500 tokens)
   - Tier 2: CURRENT_TASK.md (session goal, ~1,000 tokens)
   - Tier 3: specific files on-demand
   This reduces per-session token cost by ~58%.

3. **Two-gate verification** before any live order:
   - Gate 1 automated: type check, lint, unit test for order calculation logic
   - Gate 2 manual: 6-question checklist (correctness, API endpoint, error handling, hardcoded values, regression risk, explainability)

4. **Plan before coding:** Tell Claude the strategy, ask it to ask questions. Not "write my bot." This surfaces decisions not yet made.

5. **Checkpoint before compaction:** Before context compacts, have Claude write a session summary. Recovery in 90 seconds instead of re-explaining everything.

6. **Postmortem as architectural requirement:** After each losing trade, run Reflection Agent: "Given this loss, what rule violation occurred? What signal was wrong? What constraint should we add?" Write findings to CLAUDE.md.

7. **Avoid agent over-constrain:** Jake Nesler's CEO + Consultant combination blocked all trading. One risk-gating agent is enough. Two creates deadlock.

### 7.5 What Not to Build

- **Market maker:** You will be the exit liquidity for informed traders. This is certain at $260 capital.
- **High-frequency anything:** Fee drag at this capital size is fatal. Fewer, higher-conviction positions.
- **Fully autonomous execution:** At $260, human approval for each trade is acceptable and adds a meaningful safety gate. Automation is for scale; at $260, scale is not the constraint.
- **Backtesting-first strategy:** Ji_AI's 14 sessions and 15 strategies produced 1 marginally profitable result at +0.32% over 90 days. Backtest optimization is expensive and the results are unreliable. Build for robustness, not optimization.
- **Multi-platform simultaneously:** Manage Polymarket fee complexity before expanding to Kalshi. One platform, one strategy, make it work.

### 7.6 Realistic Return Expectations

Based on academic papers (StockBench, FS-ReasoningAgent):
- Bull market: LLMs can generate 1.9–2.5% over 4 months on stocks (vs. 0.4% buy-and-hold)
- Crypto bull market: FS-ReasoningAgent 77% returns are backtest artifacts; assume 10–20% realistic with good implementation
- Bear market: LLMs struggle. Bear market protection requires explicit hedging logic.

Honest projection for $260 crypto-only system:
- Best case (bull market + good strategy + no major errors): +20–40% over 3 months = +$52–$104
- Expected case: +5–15% = +$13–$39
- Worst case (bear market + strategy failure): -50% or more = -$130

The operational advantage at $260: using Claude Code CLI (Max subscription already paid) means no API costs. Every dollar of profit is net profit. This changes the math vs. Chudi's $142/month API costs.

---

## Sources

- https://medium.com/@jakenesler/i-gave-claude-code-100k-to-trade-with-in-the-last-month-and-beat-the-market-ece3fd6dcebc
- https://github.com/JakeNesler/Claude_Prophet
- https://openprophet.io/
- https://medium.com/@aiintrading/900-hours-of-using-claude-code-for-trading-what-i-learned-d0a11871b16c
- https://dev.to/ji_ai/building-an-ai-trading-bot-with-claude-code-14-sessions-961-tool-calls-4o0n
- https://medium.com/crypto-24-7/how-i-claude-code-my-way-to-better-crypto-trading-ee6a29f923c9
- https://medium.com/@rvarkarlsson/building-an-automated-polymarket-trading-system-with-claude-code-1982ff60cc74
- https://blog.devgenius.io/just-built-a-two-layer-ai-system-that-trades-polymarket-and-kalshi-while-i-sleep-heres-the-aa59ead275f6
- https://chudi.dev/blog/claude-code-production-trading-bot
- https://github.com/Byte-Ventures/claude-trader
- https://github.com/degentic-tools/claude-code-trading-terminal
- https://github.com/tradermonty/claude-trading-skills
- https://github.com/0ldh/claude-code-agents-orchestra
- https://github.com/cs50victor/claude-trade
- https://github.com/discountry/polymarket-trading-bot
- https://github.com/TauricResearch/TradingAgents
- https://arxiv.org/abs/2412.20138
- https://github.com/dylanpersonguy/Fully-Autonomous-Polymarket-AI-Trading-Bot
- https://github.com/alsk1992/CloddsBot
- https://finbold.com/trading-bot-turns-313-into-438000-on-polymarket-in-a-month/
- https://x.com/BlakeNastri2403/status/2007315124089139208
- https://medium.com/technology-hits/why-92-of-polymarket-traders-lose-money-and-how-bots-changed-the-game-2a60cd27df36
- https://www.coindesk.com/tech/2026/03/15/ai-agents-are-quietly-rewriting-prediction-market-trading
- https://www.coindesk.com/markets/2026/02/21/how-ai-is-helping-retail-traders-exploit-prediction-market-glitches-to-make-easy-money
- https://www.financemagnates.com/cryptocurrency/polymarket-introduces-dynamic-fees-to-curb-latency-arbitrage-in-short-term-crypto-markets/
- https://arxiv.org/abs/2510.02209
- https://arxiv.org/abs/2410.12464
- https://arxiv.org/abs/2501.00826
- https://medium.com/codex/i-built-aurora-an-ai-trading-agent-that-works-like-cursor-and-claude-code-heres-how-she-works-7a0b5fe909eb
- https://medium.com/@austin-starks/i-analyzed-140-000-backtests-then-built-an-ai-algotrading-agent-its-crushing-the-market-d75b2dac1a20
- https://www.pearl.you/polystrat
- https://olas.network/blog/introducing-polystrat-an-autonomous-ai-prediction-agent-on-polymarket
- https://dev.to/crashland/everyone-is-talking-about-ai-trading-bots-we-actually-built-one-heres-what-happened-4cb3
- https://medium.com/@itanscott1/ai-bots-and-polymarket-my-trading-experiment-2a89ab13bf75
- https://medium.com/@FMZQuant/the-hottest-ai-trading-technology-of-2025-a-smart-trading-guide-to-fmz-platform-with-claude-part-11cc833c6a1e
- https://dev.to/chronosquant/the-hottest-ai-trading-technology-of-2025-a-smart-trading-guide-to-fmz-platform-with-claude-part-29e6
