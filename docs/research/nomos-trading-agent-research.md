# Nomos Trading Agent System — Seed Research
> Date: 2026-03-23 | Satoshi session 1 | Status: SEED COMPLETE

---

## 1. Claude Code + Trading — Proven Cases

### Case Studies

| Case | Capital | Result | Strategy | Source |
|---|---|---|---|---|
| Jake Nesler (Medium) | $100K | Beat the market in 1 month | Multi-timeframe options, LEAPS + scalps | [Medium](https://medium.com/@jakenesler/i-gave-claude-code-100k-to-trade-with-in-the-last-month-and-beat-the-market-ece3fd6dcebc) |
| Polymarket Claude bot | $1,000 | → $14,216 (1,322% in 48h) | Claude vs OpenClaw agent, prediction markets | [Medium](https://medium.com/@weare1010/claude-ai-trading-bots-are-making-hundreds-of-thousands-on-polymarket-2840efb9f2cd) |
| Polymarket wallet 0x8dxd | $313 | → $438,000 (98% win rate) | Latency arbitrage, BTC/ETH/SOL 15-min markets | [BeInCrypto](https://beincrypto.com/claude-ai-polymarket-trading-bots-millions/) |
| Polymarket $50 → $435K | $50 | $435,000 | Latency arbitrage, reverse-engineered | Same source |
| 14 sessions, 961 tool calls | — | 15 strategies tested, 1 survived | Futures bot, multi-indicator confluence | [Dev.to](https://dev.to/ji_ai/building-an-ai-trading-bot-with-claude-code-14-sessions-961-tool-calls-4o0n) |
| 900+ hours of Claude Code trading | — | Lessons, not P&L | Mental model: Claude = junior quant | [Medium](https://medium.com/@aiintrading/900-hours-of-using-claude-code-for-trading-what-i-learned-d0a11871b16c) |

### Key Takeaways
- Claude Code builds 4,000 lines of trading code in ~10 minutes
- Multi-agent review (bullish/neutral/bearish + judge) improves signal quality
- MCP servers for live market data (Binance, CoinGecko, TradingView, Crypto.com)
- 92.4% of Polymarket wallets are unprofitable — survivorship bias is extreme
- CFTC warns about AI trading scams promising guaranteed returns

---

## 2. Open-Source Frameworks (Trading Bots)

| Framework | Stars | Focus | Key Feature | Link |
|---|---|---|---|---|
| Freqtrade + FreqAI | 39.9K | ML-powered crypto bot | CatBoost/LightGBM, backtesting, dry-run | [GitHub](https://github.com/freqtrade/freqtrade) |
| OctoBot | — | AI/Grid/DCA/TradingView | 15+ exchanges, simple UI | [GitHub](https://github.com/Drakkar-Software/OctoBot) |
| Superalgos | — | Visual bot builder | Charting, data-mining, backtesting | [GitHub](https://github.com/Superalgos/Superalgos) |
| OpenTrader | — | DCA + Grid | UI, open-source | [GitHub](https://github.com/Open-Trader/opentrader) |

---

## 3. Claude-Specific Trading Projects

| Project | Description | Link |
|---|---|---|
| claude-trader (Byte-Ventures) | Multi-indicator confluence + 3-reviewer AI + judge | [GitHub](https://github.com/Byte-Ventures/claude-trader) |
| claude-code-trading-terminal (Degentic) | Agent-native terminal, sub-agents for trades/monitoring/risk | [GitHub](https://github.com/degentic-tools/claude-code-trading-terminal) |
| claude-trade (cs50victor) | Claude as financial asset manager | [GitHub](https://github.com/cs50victor/claude-trade) |
| claude-trading-skills (tradermonty) | Trading skills for Claude Code | [GitHub](https://github.com/tradermonty/claude-trading-skills) |
| claude-code-agents-orchestra | 47 agents incl. crypto-trader, crypto-analyst, quant-analyst | [GitHub](https://github.com/0ldh/claude-code-agents-orchestra) |
| polymarket-trading-bot (discountry) | Polymarket bot with CLAUDE.md | [GitHub](https://github.com/discountry/polymarket-trading-bot) |

---

## 4. Multi-Agent LLM Trading Frameworks

| Framework | Architecture | Model Support | Link |
|---|---|---|---|
| TradingAgents (TauricResearch) | 7 roles: 4 analysts + researcher + trader + risk manager | GPT-5.x, Gemini 3.x, Claude 4.x, Grok 4.x | [GitHub](https://github.com/TauricResearch/TradingAgents) |
| StockBench | LLM agents benchmarked on real markets | Multiple LLMs | [arXiv](https://arxiv.org/html/2510.02209v1) |
| FS-ReasoningAgent | Fact-subjectivity aware crypto trading | — | [arXiv](https://arxiv.org/html/2410.12464v3) |

**Results from academic papers:**
- Top LLM agents: 2-2.4% return with lower max drawdown vs baseline
- Annualized 15-30% over strongest baseline in backtesting
- Most LLM agents FAIL to beat simple buy-and-hold (honest finding)

---

## 5. MCP Servers for Trading (Claude Code compatible)

| MCP Server | Tools | Use Case |
|---|---|---|
| Crypto.com MCP | Market data | Real-time prices, charts |
| Binance MCP | Market data + trading + account | Full exchange integration (testnet) |
| TradingView MCP | Screening, indicators, patterns | Technical analysis |
| CoinMarketCap MCP (Composio) | Asset data, exchange mapping | Research |
| Coinbase MCP (Composio) | Wallet, portfolio | Portfolio tracking |
| Bit2Me MCP | 51 tools: trade, stake, loans | Full DeFi access |

---

## 6. Viable Strategies for ~$260 (130K KZT)

### Tier 1 — Low risk, learn first
- **DCA into BTC/ETH** via Binance P2P → hold in self-custody
- **Stablecoin yield** (Aave/Compound: 5-15% APY on USDT)
- **Binance grid bot** on BTC/USDT (built-in, low config)

### Tier 2 — Medium risk, needs learning
- **Freqtrade + FreqAI** — build ML strategy, backtest, paper trade, then live
- **Copy trading** (on-chain wallet tracking) — follow proven wallets on Solana/ETH
- **Prediction markets** (Polymarket/MEXC) — if accessible from KZ

### Tier 3 — Higher risk, needs infrastructure
- **Arbitrage** — needs capital on multiple exchanges ($1K+ minimum realistically)
- **Futures grid/DCA bot** — leverage amplifies both gains and losses
- **Multi-agent LLM trading system** — high setup cost, research-grade

### Tier 4 — Aspirational (post-growth)
- **Latency arbitrage** on prediction markets
- **Full TradingAgents-style multi-agent system**
- **Custom MCP + Claude Code autonomous trading loop**

---

## 7. Architecture Blueprint (Claude Code Agent System for Trading)

```
Claude Code (Satoshi — Orchestrator)
│
├── MCP Layer (data ingestion)
│   ├── Binance MCP — market data, orders, account
│   ├── TradingView MCP — technical analysis
│   ├── CoinGecko/CMC MCP — fundamentals
│   └── News/Sentiment MCP — signal enrichment
│
├── Strategy Agents (sub-agents, parallel)
│   ├── Technical Analyst — indicators, patterns
│   ├── Sentiment Analyst — news, social, fear/greed
│   ├── Risk Manager — position sizing, stop-loss, exposure
│   └── Execution Agent — order placement, slippage control
│
├── Decision Layer
│   ├── Multi-agent debate (bullish/neutral/bearish + judge)
│   └── Confidence scoring → trade/no-trade/wait
│
├── Execution Layer
│   ├── CCXT (exchange-agnostic API)
│   ├── Order management (limit, market, stop)
│   └── Portfolio tracking (SQLite/JSON)
│
└── Memory Layer
    ├── Trade journal (every trade logged)
    ├── Strategy performance (win rate, Sharpe, drawdown)
    └── Market regime detection (bull/bear/sideways)
```

---

## 8. Key Risks & Honest Assessment

- **92.4% of Polymarket wallets unprofitable** — survivorship bias is extreme
- **Most LLM agents fail to beat buy-and-hold** in academic benchmarks
- **$260 is very small** — fees eat into profits, arbitrage needs $1K+ minimum
- **No automated system is guaranteed** — CFTC explicitly warns about AI trading scams
- **Claude API costs money** — but we're on Max plan (CLI only), no API key
- **Self-custody risk** — lose keys = lose everything
- **Leverage risk** — futures can liquidate entire position

**Honest recommendation for $260 starting capital:**
Start with DCA + learn. Build the agent system for education/paper trading first. Go live only after backtesting shows consistent results over 3+ months.
