# Nomos Trading Agent Architecture: Deep Research Report

> **Date:** 2026-03-23
> **Agent:** Opus 4.6 (1M context)
> **Scope:** MCP servers for crypto trading, multi-agent pipeline design, CCXT, memory layer, Freqtrade/FreqAI, step-by-step implementation
> **Context:** Claude Code Max plan (no API key), $260 capital, Kazakhstan, Binance/Bybit via P2P

---

## Table of Contents

1. [MCP Servers for Trading](#1-mcp-servers-for-trading)
   - 1.1 Exchange MCP Servers
   - 1.2 Market Data MCP Servers
   - 1.3 News & Sentiment MCP Servers
   - 1.4 On-Chain Analytics MCP Servers
   - 1.5 Technical Analysis MCP Servers
   - 1.6 Backtesting MCP Servers
   - 1.7 Bot Framework MCP Servers
   - 1.8 Utility MCP Servers
2. [Multi-Agent Pipeline Design](#2-multi-agent-pipeline-design)
   - 2.1 TradingAgents (TauricResearch) Architecture
   - 2.2 Claude Code Multi-Agent Adaptation
   - 2.3 Debate/Consensus Mechanism
   - 2.4 Agent Definitions with Prompts
3. [CCXT as Exchange Abstraction](#3-ccxt-as-exchange-abstraction)
4. [Memory Layer Design](#4-memory-layer-design)
5. [Freqtrade + FreqAI Integration](#5-freqtrade--freqai-integration)
6. [Step-by-Step Implementation Plan](#6-step-by-step-implementation-plan)
   - Step 1: MCP Setup
   - Step 2: Agent Definitions
   - Step 3: Backtesting
   - Step 4: Paper Trading
   - Step 5: Live Trading
   - Step 6: Monitoring
7. [Sources](#7-sources)

---

## 1. MCP Servers for Trading

### 1.1 Exchange MCP Servers

#### CCXT MCP Servers (Multi-Exchange)

| Server | GitHub | Install | Tools | Status | Notes |
|--------|--------|---------|-------|--------|-------|
| **lazy-dinosaur/ccxt-mcp** | [GitHub](https://github.com/lazy-dinosaur/ccxt-mcp) | `npx -y @lazydino/ccxt-mcp` | ~20 | Active | 100+ exchanges, trading + analytics, win rate tracking, risk controls |
| **doggybee/mcp-server-ccxt** | [GitHub](https://github.com/doggybee/mcp-server-ccxt) | `npm install -g @mcpfun/mcp-server-ccxt` | 31 | Active | 20+ exchanges, LRU caching, rate limiting, spot+futures+swap |
| **Nayshins/mcp-server-ccxt** | [GitHub](https://github.com/Nayshins/mcp-server-ccxt) | `pip install mcp ccxt` | 7 | Active | Read-only market data, 10 exchanges (Binance, Bybit, OKX, Hyperliquid) |
| **jcwleo/ccxt-mcp-server** | [GitHub](https://github.com/jcwleo/ccxt-mcp-server) | Manual clone | ~15 | Active | Exposes CCXT functions as LLM tools |

**Best pick for Nomos:** `lazy-dinosaur/ccxt-mcp` — most comprehensive, supports trading + analytics, win rate tracking, risk controls. Single server covers all exchanges.

#### Binance-Specific

| Server | GitHub | Install | Tools | Status | Notes |
|--------|--------|---------|-------|--------|-------|
| **nirholas/Binance-MCP** | [GitHub](https://github.com/nirholas/Binance-MCP) | `git clone` + `npm install` + `npm run build` | **478+** | Active | Most comprehensive: spot, futures, margin, staking, P2P, algo, copy trading, 24 modules |
| **AnalyticAce/binance-mcp-server** | [GitHub](https://github.com/AnalyticAce/binance-mcp-server) | `pip install` | ~20 | Active | Trading + portfolio tracking |
| **TermiX-official/binance-mcp** | [GitHub](https://github.com/TermiX-official/binance-mcp) | Manual | ~15 | Active | Portfolio view, convert, trade |
| **tygwan/binance-mcp** | Via LobeHub | Manual | ~10 | Active | Market data + trading |

#### Bybit-Specific

| Server | GitHub | Install | Tools | Status | Notes |
|--------|--------|---------|-------|--------|-------|
| **ethancod1ng/bybit-mcp-server** | [GitHub](https://github.com/ethancod1ng/bybit-mcp-server) | `npm install -g bybit-mcp-server` | 11 | Active | **Defaults to testnet**, trading + market data |
| **sammcj/bybit-mcp** | [GitHub](https://github.com/sammcj/bybit-mcp) | `pnpm i` | 14 | Active | **Read-only**, alpha quality, testnet support |
| **dlwjdtn535/bybit** | Via PulseMCP | Manual | ~15 | Active | Spot + futures |

#### OKX-Specific

| Server | GitHub | Install | Tools | Status | Notes |
|--------|--------|---------|-------|--------|-------|
| **okx/agent-trade-kit** (OFFICIAL) | [GitHub](https://github.com/okx/agent-trade-kit) | `npm install -g @okx_ai/okx-trade-mcp` then `okx-trade-mcp setup --client claude-code` | **107** | Official, Active | 8 modules: market, spot, swap, futures, options, account, earn, bot. Local signing (HMAC-SHA256). Read-only mode. |
| **mbarinov/okx-mcp** | [GitHub](https://github.com/mbarinov/okx-mcp) | Manual | ~15 | Active | Portfolio + trading |
| **esshka/okx-mcp** | [GitHub](https://github.com/esshka/okx-mcp) | Manual | ~8 | Active | Price data + rate limiting |

#### Hyperliquid-Specific

| Server | GitHub | Install | Tools | Status | Notes |
|--------|--------|---------|-------|--------|-------|
| **edkdev/hyperliquid-mcp** | [GitHub](https://github.com/edkdev/hyperliquid-mcp) | `pip install hyperliquid-mcp` | ~15 | Active | Official SDK, bracket orders, position management |
| **6rz6/HYPERLIQUID-MCP-Server** | [GitHub](https://github.com/6rz6/HYPERLIQUID-MCP-Server) | Manual | 8 | Active | 200+ pairs, candlestick data |
| **kukapay/hyperliquid-info-mcp** | [GitHub](https://github.com/kukapay/hyperliquid-info-mcp) | Manual | ~6 | Active | Perp DEX data, analytics |

---

### 1.2 Market Data MCP Servers

| Server | GitHub / URL | Install | Tools | Free Tier | Notes |
|--------|-------------|---------|-------|-----------|-------|
| **CoinGecko (OFFICIAL)** | [Docs](https://docs.coingecko.com/docs/mcp-server) | `claude mcp add coingecko -- npx -y @coingecko/coingecko-mcp` | 15+ | Yes (30 calls/min, 10K credits/mo, 1yr history) | 15K+ coins, 1000+ exchanges, on-chain DEX via GeckoTerminal (8M+ tokens, 200+ networks) |
| **CoinMarketCap (OFFICIAL)** | [MCP](https://coinmarketcap.com/api/mcp/) | HTTP: `https://mcp.coinmarketcap.com/mcp` | 12 | Yes (30 calls/min, 10K credits/mo) | Technical analysis, global metrics, trending narratives, macro events, news |
| **Crypto.com (OFFICIAL)** | [Docs](https://mcp.crypto.com/docs/claude) | `claude mcp add --transport http -s user crypto-market-data https://mcp.crypto.com/market-data/mcp` | ~8 | Yes (no key needed) | Public market data only, no auth required |
| **Chainlink Feeds** | [GitHub](https://github.com/kukapay/chainlink-feeds-mcp) | Manual | 3 | Yes | On-chain price feeds, decentralized |

---

### 1.3 News & Sentiment MCP Servers

| Server | GitHub | Install | Tools | Notes |
|--------|--------|---------|-------|-------|
| **crypto-feargreed-mcp** | [GitHub](https://github.com/kukapay/crypto-feargreed-mcp) | `npx -y @smithery/cli install @kukapay/crypto-feargreed-mcp --client claude` | 3 | Fear & Greed Index: current, historical, trend analysis |
| **CMC Fear & Greed** | [GitHub](https://github.com/heyzgj/coinmarketcap-fear-greed-index) | Manual | 2 | CoinMarketCap's own index |
| **crypto-sentiment-mcp** | [GitHub](https://github.com/kukapay/crypto-sentiment-mcp) | Manual | ~3 | Sentiment analysis for agents |
| **crypto-news-mcp** | [GitHub](https://github.com/kukapay/crypto-news-mcp) | Manual | ~3 | Aggregated news from NewsData |
| **cointelegraph-mcp** | [GitHub](https://github.com/kukapay/cointelegraph-mcp) | Manual | ~3 | Real-time Cointelegraph news |
| **cryptopanic-mcp-server** | [GitHub](https://github.com/kukapay/cryptopanic-mcp-server) | Manual | ~3 | CryptoPanic aggregated news |
| **blockbeats-mcp** | [GitHub](https://github.com/kukapay/blockbeats-mcp) | Manual | ~3 | BlockBeats news |
| **binance-announcements-mcp** | [GitHub](https://github.com/kukapay/binance-announcements-mcp) | Manual | ~2 | Binance listing/delisting alerts |
| **bybit-announcements-mcp** | [GitHub](https://github.com/kukapay/bybit-announcements-mcp) | Manual | ~2 | Bybit announcements |

---

### 1.4 On-Chain Analytics MCP Servers

| Server | GitHub | Install | Tools | Notes |
|--------|--------|---------|-------|-------|
| **dcSpark/mcp-server-defillama** | [GitHub](https://github.com/dcSpark/mcp-server-defillama) | Manual | ~6 | TVL data, token prices, stablecoin info |
| **IQAIcom/defillama-mcp** | [GitHub](https://github.com/IQAIcom/defillama-mcp) | `pnpm dlx @iqai/defillama-mcp` | 8+ | TVL, DEX volumes, fees, stablecoins, yields, prices |
| **kukapay/dune-analytics-mcp** | [GitHub](https://github.com/kukapay/dune-analytics-mcp) | Manual | 2 | Execute Dune queries by ID, CSV output |
| **mcp-web3-stats** | [GitHub](https://github.com/dennisonbertram/mcp-web3-stats) | Manual | ~6 | Dune + Blockscout, Streamable HTTP |
| **wallet-inspector-mcp** | [GitHub](https://github.com/kukapay/wallet-inspector-mcp) | Manual | ~3 | Wallet balances, on-chain activity |
| **whale-tracker-mcp** | [GitHub](https://github.com/kukapay/whale-tracker-mcp) | Manual | ~3 | Whale Alert API, large transactions |
| **hive-crypto-mcp** | [GitHub](https://github.com/hive-intel/hive-crypto-mcp) | Manual | 10+ | Unified crypto/DeFi/Web3 analytics |
| **Blockscout** | [GitHub](https://github.com/blockscout/mcp-server) | Manual | ~8 | Blockchain data, balances, tokens, NFTs |

**Note on Nansen:** No dedicated Nansen MCP server exists as of March 2026. Nansen data is proprietary and requires a paid subscription ($150+/month). For on-chain analytics, DeFiLlama + Dune Analytics + whale tracking covers most needs for free.

---

### 1.5 Technical Analysis MCP Servers

| Server | GitHub | Install | Tools | Notes |
|--------|--------|---------|-------|-------|
| **crypto-indicators-mcp** | [GitHub](https://github.com/kukapay/crypto-indicators-mcp) | `node index.js` (clone) | **76** (24 trend + 9 momentum + 11 volatility + 9 volume + 23 strategies) | CCXT-based, configurable exchange. Outputs BUY/HOLD/SELL signals. Covers: EMA, SMA, MACD, RSI, Bollinger, ATR, VWAP, Ichimoku, Stochastic, Williams %R, ADX, and more. |
| **tradingview-mcp** | [GitHub](https://github.com/atilaahmettaner/tradingview-mcp) | `uv tool run --from git+https://github.com/atilaahmettaner/tradingview-mcp.git tradingview-mcp` | 7 | Top gainers/losers, Bollinger scan, coin analysis, candlestick patterns. Multi-exchange: Binance, Bybit, OKX, KuCoin, etc. Multi-timeframe: 5m to monthly. |
| **bidouilles/mcp-tradingview-server** | [GitHub](https://github.com/bidouilles/mcp-tradingview-server) | Manual | ~5 | TradingView indicators + OHLCV |
| **funding-rates-mcp** | [GitHub](https://github.com/kukapay/funding-rates-mcp) | Manual | 1 | Cross-exchange funding rate comparison with divergence detection |
| **crypto-orderbook-mcp** | [GitHub](https://github.com/kukapay/crypto-orderbook-mcp) | Manual | ~3 | Order book depth + imbalance analysis |
| **crypto-liquidations-mcp** | [GitHub](https://github.com/kukapay/crypto-liquidations-mcp) | Manual | ~2 | Liquidation event stream |

---

### 1.6 Backtesting MCP Servers

| Server | GitHub | Install | Tools | Notes |
|--------|--------|---------|-------|-------|
| **kukapay/backtrader-mcp** | [GitHub](https://github.com/kukapay/backtrader-mcp) | Manual | ~5 | Turns Backtrader into AI-accessible trading sandbox |
| **whchien/ai-trader** | [GitHub](https://github.com/whchien/ai-trader) | `python3 -m ai_trader.mcp` | 10+ | Backtrader-powered, 20+ strategies, multi-market, CLI tools + MCP. Stocks, crypto, forex. |

---

### 1.7 Bot Framework MCP Servers

| Server | GitHub | Install for Claude Code | Tools | Notes |
|--------|--------|------------------------|-------|-------|
| **kukapay/freqtrade-mcp** | [GitHub](https://github.com/kukapay/freqtrade-mcp) | `claude mcp add-json "freqtrade-mcp" '{"command":"uv","args":["--directory","/path/to/freqtrade-mcp","run","__main__.py"],"env":{...}}'` | 18 | OHLCV data, bot status, P&L, whitelist/blacklist, trade placement, bot start/stop |
| **hummingbot/mcp** | [GitHub](https://github.com/hummingbot/mcp) | `claude mcp add --transport stdio hummingbot -- docker run --rm -i ... hummingbot/hummingbot-mcp:latest` | 15+ | Market making, grid, DCA. Multi-exchange. Portfolio, orders, positions, bots. |

---

### 1.8 Utility MCP Servers

| Server | GitHub | Notes |
|--------|--------|-------|
| **crypto-portfolio-mcp** | [GitHub](https://github.com/kukapay/crypto-portfolio-mcp) | Portfolio allocation tracking |
| **etf-flow-mcp** | [GitHub](https://github.com/kukapay/etf-flow-mcp) | Crypto ETF fund flows |
| **crypto-funds-mcp** | [GitHub](https://github.com/kukapay/crypto-funds-mcp) | Crypto investment fund data |
| **honeypot-detector-mcp** | [GitHub](https://github.com/kukapay/honeypot-detector-mcp) | Scam token detection (ETH, BSC, Base) |
| **rug-check-mcp** | [GitHub](https://github.com/kukapay/rug-check-mcp) | Solana meme token risk detection |
| **polymarket-predictions-mcp** | [GitHub](https://github.com/kukapay/polymarket-predictions-mcp) | Prediction market odds |

---

## 2. Multi-Agent Pipeline Design

### 2.1 TradingAgents (TauricResearch) Architecture

**Source:** [GitHub](https://github.com/TauricResearch/TradingAgents) | [Paper](https://arxiv.org/abs/2412.20138) | 38.2K stars | Apache 2.0

TradingAgents implements a multi-agent trading framework built on LangGraph that mirrors real-world trading firm dynamics. It supports Claude 4.6 (Anthropic), GPT-5.4, Gemini 3.1, Grok, Ollama.

#### The 7+ Roles

```
                    +------------------+
                    |  Fund Manager    |  (approves/rejects final decision)
                    +--------+---------+
                             |
                    +--------v---------+
                    | Risk Management  |  (3 perspectives: aggressive/neutral/conservative)
                    +--------+---------+
                             |
                    +--------v---------+
                    |     Trader       |  (synthesizes all inputs into position)
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v----------+     +-----------v---------+
    | Bullish Researcher |<--->| Bearish Researcher  |
    +--------------------+     +---------------------+
              |   debate (n rounds)   |
              +-----------+-----------+
                          |
         +-----+-----+---+---+------+
         |     |     |       |      |
    +----v+ +--v--+ +v----+ +v---+
    |Fund.| |Sent.| |News | |Tech|
    |Analy| |Analy| |Analy| |Anal|
    +-----+ +-----+ +-----+ +----+
```

**Analyst Team (4 agents, run in parallel):**
1. **Fundamental Analyst** -- Evaluates financial statements, earnings reports, insider transactions. Identifies valuation opportunities and red flags.
2. **Sentiment Analyst** -- Processes social media posts, sentiment scores. Gauges investor behavior impact on short-term price.
3. **News Analyst** -- Monitors global news, government announcements, macroeconomic indicators. Interprets event impact on markets.
4. **Technical Analyst** -- Calculates MACD, RSI, moving averages, volume patterns. Detects trading patterns and forecasts price movements.

**Researcher Team (2 agents, structured debate):**
5. **Bullish Researcher** -- Advocates investment opportunities, highlights positive indicators.
6. **Bearish Researcher** -- Emphasizes downsides, risks, unfavorable market signals.

Both query the analyst reports, then engage in n rounds of natural language debate. A facilitator reviews debate history and selects the prevailing perspective.

**Execution Layer:**
7. **Trader Agent** -- Synthesizes analyst insights + researcher consensus into timing, sizing, and position decisions.

**Risk Management Team (3 sub-agents within one layer):**
- **Aggressive** -- Pursues higher-risk strategies
- **Neutral** -- Balances reward and safety
- **Conservative** -- Prioritizes capital preservation

They deliberate for n rounds, then adjust the trading plan within risk constraints.

**Fund Manager** -- Final approval/rejection before execution.

#### Performance (from paper, 3-month backtest Jan-Mar 2024)

| Metric | AAPL | GOOGL | AMZN |
|--------|------|-------|------|
| Cumulative Return | 26.62% | 24.36% | 23.21% |
| Annualized Return | 30.5% | 27.58% | 24.90% |
| Sharpe Ratio | 8.21 | 6.39 | 5.60 |
| Max Drawdown | 0.91% | 1.69% | 2.11% |

**Caveat:** These are stock results on a short bull period. Crypto markets are structurally different. The architecture is the valuable takeaway, not the specific numbers.

#### Configuration

```python
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "anthropic"
config["deep_think_llm"] = "claude-opus"
config["quick_think_llm"] = "claude-sonnet"
config["max_debate_rounds"] = 2

ta = TradingAgentsGraph(debug=True, config=config)
_, decision = ta.propagate("BTC", "2026-03-23")
```

**Limitation for Nomos:** TradingAgents requires an `ANTHROPIC_API_KEY` environment variable. Since Nomos operates on Claude Max plan (CLI only, no API key), TradingAgents cannot be used directly. The architecture must be reimplemented within Claude Code's agent system.

---

### 2.2 Claude Code Multi-Agent Adaptation

Since Claude Max has no API key, the TradingAgents architecture must be adapted to Claude Code's native agent/subagent system.

**Architecture:**

```
Orchestrator (Claude Code main session)
  |
  +-- Data Collection Agent (subagent)
  |     Uses MCP tools: CCXT, CoinGecko, CoinMarketCap, Fear&Greed, news
  |     Output: structured market data report (markdown file)
  |
  +-- Analysis Team (parallel subagents)
  |     +-- Technical Analyst (subagent) -- reads data, uses crypto-indicators-mcp
  |     +-- Sentiment Analyst (subagent) -- reads news/sentiment data
  |     +-- Fundamental/On-Chain Analyst (subagent) -- reads DeFiLlama/whale data
  |     Output: analysis reports (markdown files)
  |
  +-- Debate/Consensus (subagent)
  |     Reads all analysis reports, generates bull/bear thesis
  |     n rounds of structured argumentation
  |     Output: consensus report with conviction score
  |
  +-- Risk Manager (subagent)
  |     Reads consensus + portfolio state + trade journal
  |     Applies position sizing (Kelly/fractional Kelly)
  |     Output: approved/rejected trade plan with size
  |
  +-- Execution Agent (subagent)
  |     Only runs if Risk Manager approves
  |     Uses CCXT MCP to place orders
  |     Output: execution confirmation, updates trade journal
  |
  Orchestrator: updates memory files, logs to chronicle
```

This maps directly to Claude Code's Agent tool (subagent isolation), where each agent has its own context window and receives only the data it needs.

---

### 2.3 Debate/Consensus Mechanism

The debate mechanism is the key innovation from TradingAgents. Here is how to implement it in Claude Code:

**Round structure:**

```
Round 1:
  Bull: "Based on [data], I argue BTC is bullish because..."
  Bear: "I counter that [risk], [divergence], [macro headwind]..."

Round 2:
  Bull: "Addressing the bear's concerns: [mitigation], [counterpoint]..."
  Bear: "The bull ignores [key risk], and historical precedent shows..."

Facilitator decision:
  "After 2 rounds, the prevailing thesis is [BULL/BEAR/NEUTRAL].
   Conviction: [1-10]. Key factors: [list].
   Recommended action: [BUY/SELL/HOLD]. Size modifier: [0.5x-2x]."
```

**Implementation as single subagent with structured prompt:**

The debate can run as a single Claude subagent that role-plays both sides (saves context vs. running 3 separate agents). The prompt instructs it to:
1. Write the strongest bull case from the analysis data
2. Write the strongest bear case from the analysis data
3. Have each side rebut the other for n rounds
4. Produce a final verdict with conviction score

---

### 2.4 Agent Definitions with Prompts

#### Data Collection Agent

```markdown
# Role: Market Data Collector

You are a data collection agent. Your job is to gather current market data
for the specified trading pair using your MCP tools.

## Required Data Points
1. Current price, 24h change, 7d change, 30d change
2. Volume (24h, 7d average)
3. Order book snapshot (top 5 bids/asks)
4. OHLCV data: 1h (last 24 candles), 4h (last 30 candles), 1d (last 90 candles)
5. Fear & Greed Index (current + 7d trend)
6. Funding rates across exchanges
7. Latest 5 relevant news headlines
8. BTC dominance, total market cap

## Output Format
Write structured markdown to: memory/market-data/{pair}-{timestamp}.md
Include all raw data. Do not analyze. Analysis is done by other agents.
```

#### Technical Analyst Agent

```markdown
# Role: Technical Analyst

You analyze price data using technical indicators. You have access to
crypto-indicators-mcp and tradingview-mcp tools.

## Analysis Framework
1. Trend: EMA20/50/200 alignment, ADX strength
2. Momentum: RSI (overbought/oversold), MACD crossover, Stochastic
3. Volatility: Bollinger Bands width, ATR, Keltner Channel
4. Volume: OBV trend, VWAP deviation, volume profile
5. Key levels: support/resistance from recent price action
6. Timeframe confluence: check 1h, 4h, 1d alignment

## Output Format
Write to: memory/analysis/technical-{pair}-{timestamp}.md

Conclude with:
- Signal: STRONG_BUY / BUY / NEUTRAL / SELL / STRONG_SELL
- Confidence: 1-10
- Key levels: entry, stop loss, take profit targets
- Timeframe: scalp (hours) / swing (days) / position (weeks)
```

#### Sentiment Analyst Agent

```markdown
# Role: Sentiment Analyst

You analyze market sentiment from news, social data, and fear/greed metrics.

## Data Sources
1. Fear & Greed Index value and trend direction
2. News headlines sentiment (positive/negative/neutral count)
3. Exchange announcements (new listings, delistings, regulatory)
4. Funding rates (positive = overleveraged longs, negative = overleveraged shorts)
5. Liquidation data (if available)

## Analysis Framework
1. Crowd sentiment: is the crowd fearful or greedy?
2. Smart money signals: whale movements, exchange flows
3. Contrarian indicators: extreme fear = potential buy, extreme greed = potential sell
4. News catalyst: any upcoming events that could move price?

## Output Format
Write to: memory/analysis/sentiment-{pair}-{timestamp}.md

Conclude with:
- Sentiment: EXTREME_FEAR / FEAR / NEUTRAL / GREED / EXTREME_GREED
- Contrarian signal: if extreme, what does contrarian logic suggest?
- Catalyst risk: HIGH / MEDIUM / LOW (upcoming events)
- Confidence: 1-10
```

#### Debate Agent

```markdown
# Role: Market Debate Facilitator

You conduct a structured bull vs. bear debate on the current trading opportunity.

## Input
Read these files:
- memory/analysis/technical-{pair}-{timestamp}.md
- memory/analysis/sentiment-{pair}-{timestamp}.md
- memory/analysis/onchain-{pair}-{timestamp}.md (if exists)

## Process
### Round 1 - Opening Arguments
Write a strong BULL case (3-5 paragraphs) citing specific data points.
Then write a strong BEAR case (3-5 paragraphs) citing specific data points.

### Round 2 - Rebuttals
Bull responds to bear's strongest points.
Bear responds to bull's strongest points.

### Verdict
After the debate, step back as a neutral judge:
- Which side had stronger evidence?
- What is the consensus direction? (LONG / SHORT / FLAT)
- Conviction score: 1-10 (10 = overwhelming evidence)
- What would change your mind? (invalidation criteria)

## Output Format
Write to: memory/debate/{pair}-{timestamp}.md
```

#### Risk Manager Agent

```markdown
# Role: Risk Manager

You protect capital. You have VETO power over any trade.

## Input
- memory/debate/{pair}-{timestamp}.md (consensus)
- memory/portfolio/current-state.md (positions, P&L, balance)
- memory/journal/trade-journal.md (recent trade history)

## Risk Rules (HARD LIMITS)
1. Max risk per trade: 2% of portfolio ($5.20 on $260)
2. Max open positions: 3
3. Max daily loss: 5% of portfolio ($13)
4. Max weekly loss: 10% of portfolio ($26)
5. No trading if Fear & Greed > 85 (extreme greed) for longs
6. No trading if 3 consecutive losses (cool-down 24h)
7. Every trade MUST have a stop loss

## Position Sizing
Use fractional Kelly (half-Kelly):
- f* = (p * b - q) / b  where p=win_rate, b=avg_win/avg_loss, q=1-p
- Position = balance * f* * 0.5 (half-Kelly for safety)
- Cap at 5% of portfolio regardless of Kelly output
- Minimum position: $10 (below this, fees eat profits)

## Output Format
Write to: memory/risk/{pair}-{timestamp}.md
- APPROVED / REJECTED
- If approved: position size, entry, stop loss, take profit
- If rejected: reason and what would need to change
```

---

## 3. CCXT as Exchange Abstraction

### Overview

CCXT (CryptoCurrency eXchange Trading Library) is the de facto standard for programmatic exchange access.

- **Repository:** [github.com/ccxt/ccxt](https://github.com/ccxt/ccxt)
- **Languages:** JavaScript/TypeScript, Python, C#, PHP, Go
- **Exchanges:** 108+ supported (including Binance, Bybit, OKX, Hyperliquid, KuCoin, Gate.io)
- **License:** MIT
- **npm:** `ccxt` | **PyPI:** `ccxt`

### Capabilities

| Feature | REST API | WebSocket (CCXT Pro) |
|---------|----------|---------------------|
| Market data (ticker, orderbook, OHLCV) | Yes | Yes (real-time push) |
| Place market orders | Yes | Limited (exchange-dependent) |
| Place limit orders | Yes | Limited |
| Stop loss / Take profit | Yes (via `stopLossPrice`/`takeProfitPrice` params) | N/A |
| Trailing stop | Partial (exchange-dependent, some require workarounds) | N/A |
| OCO (One-Cancels-Other) | Exchange-dependent | N/A |
| Account balance | Yes | Yes |
| Position management | Yes | Yes |
| Funding rates | Yes | Yes |
| Historical OHLCV | Yes | N/A |
| Testnet/Sandbox mode | Yes (`exchange.set_sandbox_mode(True)`) | Yes |

### Latency

| Method | Typical Latency | Use Case |
|--------|----------------|----------|
| REST API call | 100-300ms round-trip | Swing trading, daily rebalancing |
| WebSocket (CCXT Pro) | 10-50ms for market data | Scalping, real-time monitoring |
| ECDSA signing (pure Python) | ~45ms | Order signing |
| ECDSA signing (coincurve) | <0.05ms | Order signing (recommended) |

**For Nomos:** REST API is sufficient. With $260 capital and beginner level, high-frequency trading is irrelevant. Focus on 4h/1d timeframes where 100-300ms latency is negligible.

### Supported Order Types via CCXT

```python
# Market order
exchange.create_market_buy_order('BTC/USDT', amount)

# Limit order
exchange.create_limit_buy_order('BTC/USDT', amount, price)

# Stop loss (trigger order)
exchange.create_order('BTC/USDT', 'market', 'sell', amount, None, {
    'triggerPrice': stop_price
})

# Take profit
exchange.create_order('BTC/USDT', 'market', 'sell', amount, None, {
    'takeProfitPrice': tp_price
})

# Position with SL + TP (Binance futures)
exchange.create_market_buy_order('BTC/USDT', amount, {
    'stopLoss': {'triggerPrice': sl_price},
    'takeProfit': {'triggerPrice': tp_price}
})
```

### Sandbox/Testnet Setup

```python
import ccxt

# Binance testnet
binance = ccxt.binance({
    'apiKey': 'testnet_key',
    'secret': 'testnet_secret',
    'enableRateLimit': True,
})
binance.set_sandbox_mode(True)

# Bybit testnet
bybit = ccxt.bybit({
    'apiKey': 'testnet_key',
    'secret': 'testnet_secret',
    'enableRateLimit': True,
})
bybit.set_sandbox_mode(True)
```

### Limitations

1. **No built-in backtesting** -- CCXT fetches data; backtesting logic must be built separately or use btrccts/vectorbt
2. **Trailing stops** -- Implementation varies by exchange; not universally supported
3. **OCO orders** -- Not unified across exchanges; requires exchange-specific params
4. **Rate limits** -- Each exchange has different limits; CCXT handles this with `enableRateLimit` but aggressive strategies may still hit limits
5. **WebSocket order placement** -- Most exchanges don't support placing orders via WebSocket; REST API is required for execution
6. **Historical data depth** -- Some exchanges limit OHLCV history (e.g., Binance: 1000 candles per request, must paginate)

---

## 4. Memory Layer Design

### Architecture

All memory lives in the filesystem under `nospace/finance/nomos/memory/trading/`. Claude Code reads/writes these files directly.

```
nomos/memory/trading/
  +-- portfolio/
  |     +-- current-state.md          # Current balance, positions, allocation
  |     +-- allocation-history.md     # Historical allocation changes
  |
  +-- journal/
  |     +-- trade-journal.md          # Master trade log (append-only)
  |     +-- trades/
  |           +-- 2026-03-23-BTC-LONG.md  # Individual trade records
  |
  +-- analysis/
  |     +-- technical-{pair}-{ts}.md
  |     +-- sentiment-{pair}-{ts}.md
  |     +-- onchain-{pair}-{ts}.md
  |
  +-- debate/
  |     +-- {pair}-{ts}.md
  |
  +-- risk/
  |     +-- {pair}-{ts}.md
  |
  +-- market-data/
  |     +-- {pair}-{ts}.md
  |
  +-- performance/
  |     +-- weekly-review.md          # Weekly performance summary
  |     +-- monthly-review.md         # Monthly performance summary
  |     +-- strategy-tracker.md       # Win rate, Sharpe, drawdown per strategy
  |
  +-- regime/
        +-- current-regime.md         # Bull/Bear/Sideways classification
        +-- regime-history.md         # Historical regime changes
```

### Trade Journal Format

```markdown
# Trade Journal

## Trade #001
- **Date:** 2026-03-23 14:30 UTC
- **Pair:** BTC/USDT
- **Direction:** LONG
- **Entry:** $67,450.00
- **Size:** 0.0004 BTC ($27.00)
- **Risk:** $2.70 (1% of portfolio)
- **Stop Loss:** $66,775.00 (-1.0%)
- **Take Profit 1:** $68,800.00 (+2.0%) -- 50% of position
- **Take Profit 2:** $70,150.00 (+4.0%) -- 50% of position
- **Strategy:** EMA crossover + RSI oversold bounce
- **Conviction:** 7/10
- **Debate consensus:** BULL (conviction 7)
- **Risk Manager:** APPROVED (half-Kelly: 10.4% -> capped at 5%)
- **Status:** OPEN
- **Exit:** (pending)
- **P&L:** (pending)
- **Duration:** (pending)
- **Notes:** Entered on 4h EMA20/50 golden cross with RSI bouncing from 35.
             Fear & Greed at 42 (fear). Contrarian signal aligned with technical.
```

### Portfolio State Format

```markdown
# Portfolio State

**Last updated:** 2026-03-23 14:30 UTC

## Balance
- Total: $260.00
- Available: $233.00
- In positions: $27.00
- Unrealized P&L: +$1.20

## Open Positions
| # | Pair | Direction | Entry | Size | Current | P&L | Stop Loss |
|---|------|-----------|-------|------|---------|-----|-----------|
| 1 | BTC/USDT | LONG | $67,450 | $27 | $67,480 | +$1.20 | $66,775 |

## Daily Limits
- Daily loss used: $0 / $13 max
- Weekly loss used: $0 / $26 max
- Open positions: 1 / 3 max
- Consecutive losses: 0

## Allocation
- USDT: 89.6%
- BTC: 10.4%
```

### Strategy Performance Tracker

```markdown
# Strategy Performance

## EMA Crossover + RSI
- Total trades: 15
- Win rate: 60% (9W / 6L)
- Avg win: +2.8%
- Avg loss: -1.2%
- Profit factor: 2.33
- Win/Loss ratio: 2.33
- Sharpe ratio (30d): 1.45
- Max drawdown: -4.2%
- Kelly optimal: 16.7%
- Half-Kelly: 8.3%

## Grid DCA (BTCUSDT)
- Total trades: 22
- Win rate: 72% (16W / 6L)
- Avg win: +0.8%
- Avg loss: -0.5%
- Profit factor: 1.92
- Sharpe ratio (30d): 1.82
- Max drawdown: -2.1%
```

### Market Regime Detection

Regime detection uses a simple rule-based approach (suitable for a beginner with small capital):

```markdown
# Current Market Regime

**Regime:** SIDEWAYS (ranging)
**Since:** 2026-03-15
**BTC price range:** $65,000 - $69,000

## Detection Rules
1. BULL: BTC above 200-day EMA AND 50-day EMA > 200-day EMA AND ADX > 25
2. BEAR: BTC below 200-day EMA AND 50-day EMA < 200-day EMA AND ADX > 25
3. SIDEWAYS: ADX < 25 OR price oscillating within 10% range for >2 weeks

## Strategy Mapping
- BULL: trend-following (EMA crossover, breakout)
- BEAR: short or stay flat (no longs without strong reversal signals)
- SIDEWAYS: mean-reversion (grid, RSI bounce from extremes)

## Regime History
| Start | End | Regime | Duration | BTC range |
|-------|-----|--------|----------|-----------|
| 2026-01-15 | 2026-02-20 | BULL | 36 days | $58K-$72K |
| 2026-02-20 | 2026-03-15 | BEAR | 23 days | $72K-$64K |
| 2026-03-15 | present | SIDEWAYS | 8 days | $65K-$69K |
```

---

## 5. Freqtrade + FreqAI Integration

### Can Claude Code Orchestrate Freqtrade?

**Yes.** The integration path is:

```
Claude Code (Orchestrator)
  |
  +-- freqtrade-mcp (MCP server, 18 tools)
  |     Connects to Freqtrade REST API
  |
  +-- Freqtrade (Docker container)
        Runs trading strategies
        REST API on port 8080
        FreqAI for ML predictions
```

### Setup Steps

#### 1. Run Freqtrade in Docker

```bash
# Create directory
mkdir -p ~/freqtrade && cd ~/freqtrade

# Download docker-compose
curl https://raw.githubusercontent.com/freqtrade/freqtrade/stable/docker-compose.yml -o docker-compose.yml

# Pull image
docker compose pull

# Create user directory
docker compose run --rm freqtrade create-userdir --userdir user_data

# Create config (interactive)
docker compose run --rm freqtrade new-config --config user_data/config.json
```

#### 2. Enable REST API in Freqtrade Config

Add to `user_data/config.json`:
```json
{
    "api_server": {
        "enabled": true,
        "listen_ip_address": "0.0.0.0",
        "listen_port": 8080,
        "username": "freqtrader",
        "password": "SuperSecretPassword",
        "jwt_secret_key": "somethingrandom",
        "CORS_origins": [],
        "verbosity": "error"
    }
}
```

#### 3. Expose Port in docker-compose.yml

```yaml
services:
  freqtrade:
    image: freqtradeorg/freqtrade:stable
    ports:
      - "8080:8080"
    volumes:
      - ./user_data:/freqtrade/user_data
    command: >
      trade
        --config user_data/config.json
        --strategy SampleStrategy
```

#### 4. Connect Claude Code via MCP

```bash
# Clone freqtrade-mcp
git clone https://github.com/kukapay/freqtrade-mcp.git ~/freqtrade-mcp

# Install dependencies
cd ~/freqtrade-mcp && pip install freqtrade-client mcp[cli]

# Add to Claude Code
claude mcp add-json "freqtrade" '{
  "command": "python",
  "args": ["-m", "__main__"],
  "cwd": "/c/Users/noadmin/freqtrade-mcp",
  "env": {
    "FREQTRADE_API_URL": "http://127.0.0.1:8080",
    "FREQTRADE_USERNAME": "freqtrader",
    "FREQTRADE_PASSWORD": "SuperSecretPassword"
  }
}'
```

#### 5. Available Operations via MCP

| Tool | Description |
|------|-------------|
| `fetch_market_data` | OHLCV by pair and timeframe |
| `fetch_bot_status` | Current bot state, open trades |
| `fetch_profit` | P&L summary |
| `fetch_balance` | Wallet balance |
| `fetch_performance` | Performance per pair |
| `fetch_whitelist` | Tradeable pairs list |
| `fetch_blacklist` | Blocked pairs list |
| `fetch_trades` | Trade history |
| `fetch_config` | Current config |
| `fetch_locks` | Pair locks |
| `place_trade` | Force buy/sell |
| `start_bot` / `stop_bot` | Bot lifecycle |
| `reload_config` | Hot-reload config |
| `add_blacklist` / `delete_blacklist` | Dynamic blacklist management |
| `delete_lock` | Remove pair lock |

### FreqAI Integration

FreqAI is Freqtrade's built-in ML module. It supports:

- **Supervised ML:** Scikit-learn (RandomForest, XGBoost, LightGBM, CatBoost)
- **Reinforcement Learning:** Stable-Baselines3 (PPO, A2C, DQN)
- **Feature engineering:** Auto-generates 10K+ features from price data
- **Self-adaptive retraining:** Models retrain on live data at configurable intervals
- **Purging/embargoing:** Prevents data leakage in time-series cross-validation

**Claude's role with FreqAI:**
1. Claude generates strategy files (Python) based on market analysis
2. Claude pushes strategy files to Freqtrade's `user_data/strategies/` directory
3. Claude triggers `reload_config` via MCP to load new strategy
4. Claude monitors performance via `fetch_profit` / `fetch_performance`
5. Claude decides when to switch strategies based on regime detection

**Limitation:** FreqAI requires significant compute for training. On a local machine with no GPU, training can take 10-30 minutes per model. For a $260 account, the complexity/reward ratio of FreqAI is questionable. Start with simple rule-based strategies.

---

## 6. Step-by-Step Implementation Plan

### Step 1 -- MCP Setup (Minimum Viable Trading Stack)

#### Essential MCP Servers (install these first)

```bash
# 1. CCXT multi-exchange (trading + market data)
claude mcp add-json "ccxt" '{
  "command": "npx",
  "args": ["-y", "@lazydino/ccxt-mcp", "--config", "/c/Users/noadmin/nospace/finance/nomos/config/ccxt-accounts.json"]
}'

# 2. CoinGecko (market overview, trending, historical)
claude mcp add coingecko -- npx -y @coingecko/coingecko-mcp

# 3. Crypto.com market data (free, no key)
claude mcp add --transport http -s user crypto-market-data https://mcp.crypto.com/market-data/mcp

# 4. Fear & Greed Index
claude mcp add-json "feargreed" '{
  "command": "uv",
  "args": ["--directory", "/c/Users/noadmin/crypto-feargreed-mcp", "run", "main.py"]
}'

# 5. Technical indicators (76 tools!)
claude mcp add-json "crypto-indicators" '{
  "command": "node",
  "args": ["/c/Users/noadmin/crypto-indicators-mcp/index.js"],
  "env": {"EXCHANGE_NAME": "binance"}
}'

# 6. TradingView screening
claude mcp add-json "tradingview" '{
  "command": "uv",
  "args": ["tool", "run", "--from", "git+https://github.com/atilaahmettaner/tradingview-mcp.git", "tradingview-mcp"]
}'
```

#### CCXT Account Config File

Create `/c/Users/noadmin/nospace/finance/nomos/config/ccxt-accounts.json`:

```json
{
  "accounts": [
    {
      "name": "binance_testnet",
      "exchangeId": "binance",
      "apiKey": "YOUR_TESTNET_KEY",
      "secret": "YOUR_TESTNET_SECRET",
      "defaultType": "spot",
      "sandbox": true
    },
    {
      "name": "bybit_testnet",
      "exchangeId": "bybit",
      "apiKey": "YOUR_TESTNET_KEY",
      "secret": "YOUR_TESTNET_SECRET",
      "defaultType": "spot",
      "sandbox": true
    }
  ]
}
```

#### Phase 2 MCP Servers (add after paper trading works)

```bash
# News aggregation
# Clone kukapay servers you need, then add to Claude

# CoinMarketCap (requires free API key from pro.coinmarketcap.com)
# Add via HTTP transport to https://mcp.coinmarketcap.com/mcp

# DeFiLlama (DeFi metrics)
# pnpm dlx @iqai/defillama-mcp

# Funding rates (arbitrage detection)
# Clone kukapay/funding-rates-mcp

# Order book analysis
# Clone kukapay/crypto-orderbook-mcp
```

---

### Step 2 -- Agent Definitions (Minimum Viable Agent Set)

For v1, use 3 agents (not 7). Complexity must match capital size.

#### v1 Agent Set

| Agent | Type | Tools | Purpose |
|-------|------|-------|---------|
| **Market Scanner** | Subagent | ccxt, coingecko, feargreed, tradingview | Gather data, identify opportunities |
| **Analyst** | Subagent | crypto-indicators, ccxt (OHLCV) | Technical analysis + bull/bear mini-debate |
| **Risk Gate** | Subagent | File read (portfolio state, journal) | Position sizing, approval/rejection |

The Orchestrator (main session) coordinates these and handles execution directly (no separate execution agent needed for v1 -- reduces complexity).

#### Agent Files

Create these as Claude Code agent definitions in `~/.claude/agents/`:

**`~/.claude/agents/nomos-scanner.md`**
```markdown
# Nomos Market Scanner

You scan cryptocurrency markets for trading opportunities.

## Tools Available
- ccxt MCP (prices, orderbooks, OHLCV)
- coingecko MCP (market overview, trending)
- feargreed MCP (sentiment index)
- tradingview MCP (screening, top gainers/losers)

## Task
1. Check Fear & Greed Index
2. Scan top gainers/losers on major exchanges
3. Check BTC trend (4h and 1d timeframe)
4. Identify top 3 opportunities based on:
   - Volume spike (>2x average)
   - Technical setup (near support/resistance)
   - Sentiment alignment

## Output
Write to: nospace/finance/nomos/memory/trading/market-data/scan-{date}.md
Format: structured markdown with data tables
```

**`~/.claude/agents/nomos-analyst.md`**
```markdown
# Nomos Technical Analyst

You perform technical analysis on crypto pairs and conduct an internal
bull vs. bear debate.

## Tools Available
- crypto-indicators MCP (76 technical indicators + 23 strategy signals)
- ccxt MCP (OHLCV data)

## Task
Given a trading pair from the scanner:
1. Calculate indicators: RSI, MACD, EMA20/50/200, Bollinger, ATR, VWAP
2. Get strategy signals from crypto-indicators-mcp
3. Identify key support/resistance levels
4. Conduct mini-debate:
   - BULL case (3 strongest arguments with data)
   - BEAR case (3 strongest arguments with data)
   - VERDICT: direction + conviction (1-10)
5. Suggest entry, stop loss, take profit levels

## Output
Write to: nospace/finance/nomos/memory/trading/analysis/{pair}-{date}.md
```

**`~/.claude/agents/nomos-risk.md`**
```markdown
# Nomos Risk Manager

You protect capital. You have VETO power.

## Input Files
- nospace/finance/nomos/memory/trading/analysis/{latest}.md
- nospace/finance/nomos/memory/trading/portfolio/current-state.md
- nospace/finance/nomos/memory/trading/journal/trade-journal.md
- nospace/finance/nomos/memory/trading/performance/strategy-tracker.md

## Hard Rules
1. Max risk per trade: 2% of portfolio
2. Max open positions: 3
3. Max daily loss: 5%
4. Max weekly loss: 10%
5. Every trade MUST have a stop loss
6. No longs if Fear & Greed > 85
7. No trading after 3 consecutive losses (24h cool-down)
8. Minimum position: $10

## Position Sizing
Half-Kelly: f* = (p*b - q) / b, then * 0.5
Cap at 5% of portfolio.
If win rate unknown (new strategy): use 1% fixed risk.

## Output
Write to: nospace/finance/nomos/memory/trading/risk/{pair}-{date}.md
Decision: APPROVED (with size, SL, TP) or REJECTED (with reason)
```

---

### Step 3 -- Backtesting (CCXT + Python, no Freqtrade)

#### Option A: Manual Backtesting with CCXT + Pandas

```python
"""
Simple backtesting framework using CCXT for data + pandas for logic.
Claude Code generates this script, runs it, and analyzes results.
"""
import ccxt
import pandas as pd
import numpy as np

# Fetch historical data
exchange = ccxt.binance({'enableRateLimit': True})
ohlcv = exchange.fetch_ohlcv('BTC/USDT', '4h', limit=1000)
df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

# Calculate indicators
df['ema20'] = df['close'].ewm(span=20).mean()
df['ema50'] = df['close'].ewm(span=50).mean()
df['rsi'] = compute_rsi(df['close'], 14)  # implement RSI calculation

# Generate signals
df['signal'] = 0
df.loc[(df['ema20'] > df['ema50']) & (df['rsi'] < 30), 'signal'] = 1   # BUY
df.loc[(df['ema20'] < df['ema50']) & (df['rsi'] > 70), 'signal'] = -1  # SELL

# Simulate trades
initial_capital = 260
capital = initial_capital
position = 0
trades = []

for i in range(1, len(df)):
    if df.iloc[i]['signal'] == 1 and position == 0:
        # Buy: risk 2% of capital
        risk = capital * 0.02
        entry_price = df.iloc[i]['close']
        stop_loss = entry_price * 0.99  # 1% SL
        position_size = risk / (entry_price - stop_loss)
        position = position_size
        entry_idx = i
    elif (df.iloc[i]['signal'] == -1 or
          df.iloc[i]['low'] <= stop_loss) and position > 0:
        # Sell
        exit_price = min(df.iloc[i]['close'], stop_loss) if df.iloc[i]['low'] <= stop_loss else df.iloc[i]['close']
        pnl = (exit_price - entry_price) * position
        capital += pnl
        trades.append({
            'entry': entry_price, 'exit': exit_price,
            'pnl': pnl, 'pnl_pct': pnl/capital*100
        })
        position = 0

# Calculate metrics
wins = [t for t in trades if t['pnl'] > 0]
losses = [t for t in trades if t['pnl'] <= 0]
win_rate = len(wins) / len(trades) if trades else 0
avg_win = np.mean([t['pnl_pct'] for t in wins]) if wins else 0
avg_loss = np.mean([t['pnl_pct'] for t in losses]) if losses else 0
sharpe = (np.mean([t['pnl_pct'] for t in trades]) /
          np.std([t['pnl_pct'] for t in trades]) *
          np.sqrt(365/len(trades)*len(df))) if trades else 0

print(f"Trades: {len(trades)}, Win rate: {win_rate:.1%}")
print(f"Avg win: {avg_win:.2f}%, Avg loss: {avg_loss:.2f}%")
print(f"Final capital: ${capital:.2f} ({(capital/initial_capital-1)*100:+.1f}%)")
print(f"Sharpe ratio: {sharpe:.2f}")
```

#### Option B: btrccts (CCXT-compatible backtesting)

```bash
pip install btrccts
```

btrccts provides a backtest exchange with the same interface as CCXT. Write your strategy once, backtest it, then run live -- same code.

```python
from btrccts import parse_params_and_execute

async def strategy(exchange, period_start):
    # Same CCXT interface!
    ohlcv = await exchange.fetch_ohlcv('BTC/USDT', '1h')
    balance = await exchange.fetch_balance()
    # ... strategy logic ...
    await exchange.create_market_buy_order('BTC/USDT', amount)

parse_params_and_execute(strategy)
```

#### Option C: VectorBT (fastest, NumPy-accelerated)

```bash
pip install vectorbt
```

```python
import vectorbt as vbt

# Fetch data
data = vbt.CCXTData.download('BTC/USDT', exchange='binance', timeframe='4h',
                              start='2025-01-01', end='2026-03-01')
price = data.get('Close')

# Fast EMA crossover backtest
fast_ema = vbt.MA.run(price, 20, short_name='fast')
slow_ema = vbt.MA.run(price, 50, short_name='slow')
entries = fast_ema.ma_crossed_above(slow_ema)
exits = fast_ema.ma_crossed_below(slow_ema)

pf = vbt.Portfolio.from_signals(price, entries, exits,
                                 init_cash=260, fees=0.001)
print(pf.stats())
```

#### Option D: Backtrader MCP (AI-accessible)

Use `kukapay/backtrader-mcp` or `whchien/ai-trader` to run backtests directly from Claude Code via MCP tools.

**Recommendation for Nomos:** Start with Option A (manual, educational), then graduate to Option C (vectorbt) for speed. Option D is useful later when you want Claude to autonomously iterate on strategies.

---

### Step 4 -- Paper Trading

#### Binance Testnet Setup

1. Go to [testnet.binance.vision](https://testnet.binance.vision)
2. Log in with GitHub account
3. Generate API key + secret
4. Save credentials securely

```bash
# Store testnet keys (not in git!)
mkdir -p ~/.nomos
echo "BINANCE_TESTNET_KEY=your_key" > ~/.nomos/.env
echo "BINANCE_TESTNET_SECRET=your_secret" >> ~/.nomos/.env
```

#### Bybit Testnet Setup

1. Go to [testnet.bybit.com](https://testnet.bybit.com)
2. Create account
3. Generate API key (read + trade permissions)
4. Get test funds from faucet

#### CCXT Sandbox Mode

Update `ccxt-accounts.json` to use sandbox mode:

```json
{
  "accounts": [
    {
      "name": "binance_paper",
      "exchangeId": "binance",
      "apiKey": "TESTNET_KEY",
      "secret": "TESTNET_SECRET",
      "defaultType": "spot",
      "sandbox": true
    }
  ]
}
```

#### Paper Trading Workflow

```
1. Claude runs Market Scanner agent -> identifies opportunity
2. Claude runs Analyst agent -> produces analysis + recommendation
3. Claude runs Risk Gate agent -> approves/rejects with position size
4. If APPROVED:
   a. Claude places order via CCXT MCP (testnet)
   b. Claude logs trade to journal
   c. Claude sets alerts for SL/TP levels
5. Claude monitors position (periodic checks)
6. On exit: Claude logs result, updates performance tracker
```

**Duration:** Paper trade for minimum 2-4 weeks. Aim for 20+ trades to get statistically meaningful win rate data.

**Success criteria before going live:**
- Win rate > 50%
- Profit factor > 1.5
- Max drawdown < 15%
- At least 20 completed trades
- Consistent process execution (no skipped risk checks)

#### Bybit MCP Alternative (built-in testnet)

The `ethancod1ng/bybit-mcp-server` defaults to testnet. Configuration:

```json
{
  "mcpServers": {
    "bybit": {
      "command": "npx",
      "args": ["bybit-mcp-server"],
      "env": {
        "BYBIT_API_KEY": "your_testnet_key",
        "BYBIT_API_SECRET": "your_testnet_secret",
        "BYBIT_ENVIRONMENT": "testnet"
      }
    }
  }
}
```

---

### Step 5 -- Live Trading (Minimum Safe Setup)

#### Prerequisites (MUST be satisfied)

- [ ] Paper trading completed (20+ trades, 2+ weeks)
- [ ] Win rate > 50% on paper
- [ ] Max drawdown < 15% on paper
- [ ] All risk rules enforced consistently
- [ ] Stop losses used on every trade
- [ ] Trade journal maintained for every trade

#### Capital Allocation

Starting capital: $260 (130,000 KZT via P2P)

```
Phase 1 (weeks 1-4): $50 live capital
  - Trade only BTC/USDT and ETH/USDT (most liquid)
  - Spot only (no leverage, no futures)
  - Max position: $10 (20% of allocated capital)
  - Max risk per trade: $1 (2% of $50)
  - Rest ($210) stays in USDT, untouched

Phase 2 (weeks 5-8): $100 live capital (if Phase 1 profitable)
  - Add 1-2 more pairs (SOL, BNB)
  - Max position: $20
  - Max risk per trade: $2

Phase 3 (weeks 9+): $200 live capital (if Phase 2 profitable)
  - Full strategy deployment
  - Consider futures with 2-3x leverage max
  - Reserve $60 as emergency/opportunity fund
```

#### Switching to Live

Update `ccxt-accounts.json`:

```json
{
  "accounts": [
    {
      "name": "binance_live",
      "exchangeId": "binance",
      "apiKey": "LIVE_KEY",
      "secret": "LIVE_SECRET",
      "defaultType": "spot",
      "sandbox": false
    }
  ]
}
```

#### Safety Checklist (before every live trade)

```markdown
## Pre-Trade Checklist
- [ ] Risk Gate agent APPROVED the trade
- [ ] Stop loss is SET (not mental, actual order)
- [ ] Position size <= 2% risk
- [ ] Not exceeding max open positions (3)
- [ ] Not exceeding daily loss limit (5%)
- [ ] Not in cool-down period (after 3 losses)
- [ ] Market regime identified and strategy matches regime
- [ ] No major news events in next 4 hours (FOMC, CPI, etc.)
```

#### Exchange API Key Security

```
Binance API key restrictions:
- Enable IP whitelist (your server IP only)
- Enable spot trading ONLY (disable futures, margin, withdrawal)
- Set trading pair restrictions if possible
- NEVER enable withdrawal permission

Bybit API key restrictions:
- IP whitelist
- Read + Trade only
- No transfer/withdrawal
```

---

### Step 6 -- Monitoring

#### Trade Journal Format (Master File)

File: `nospace/finance/nomos/memory/trading/journal/trade-journal.md`

```markdown
# Nomos Trade Journal

## Summary
| Metric | Value |
|--------|-------|
| Total trades | 0 |
| Win rate | N/A |
| Total P&L | $0.00 |
| Best trade | N/A |
| Worst trade | N/A |
| Current streak | 0 |
| Max drawdown | 0% |
| Sharpe (30d) | N/A |

## Trade Log

| # | Date | Pair | Dir | Entry | Exit | Size | P&L | P&L% | Strategy | Duration |
|---|------|------|-----|-------|------|------|-----|------|----------|----------|
| (trades will be appended here) |
```

#### Weekly Review Template

File: `nospace/finance/nomos/memory/trading/performance/weekly-review.md`

```markdown
# Weekly Review: 2026-W13 (Mar 24-30)

## Performance
- Starting balance: $260.00
- Ending balance: $___
- Weekly P&L: $___  (___%)
- Trades taken: ___
- Win rate this week: ___%

## What Worked
- (list)

## What Failed
- (list)

## Regime Assessment
- Current regime: BULL / BEAR / SIDEWAYS
- Strategy alignment: was I trading the right strategy for the regime?

## Lessons
- (list)

## Next Week Plan
- Focus pairs: ___
- Strategy: ___
- Risk adjustment: ___
```

#### Alerting System

Claude Code has no built-in alerting. Options:

1. **Manual check schedule:** Run analysis agent every 4 hours during active trading
2. **Freqtrade bot:** Set up Freqtrade with Telegram notifications (built-in feature)
3. **Simple Python script:**

```python
"""
Price alert checker. Run via cron or Windows Task Scheduler.
Sends notification via Telegram bot.
"""
import ccxt
import requests

TELEGRAM_TOKEN = "your_bot_token"
TELEGRAM_CHAT_ID = "your_chat_id"

exchange = ccxt.binance()

# Check alerts
alerts = [
    {"pair": "BTC/USDT", "above": 70000, "msg": "BTC above 70K!"},
    {"pair": "BTC/USDT", "below": 65000, "msg": "BTC below 65K - check SL!"},
]

for alert in alerts:
    ticker = exchange.fetch_ticker(alert["pair"])
    price = ticker["last"]
    if "above" in alert and price > alert["above"]:
        requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                     json={"chat_id": TELEGRAM_CHAT_ID, "text": f"{alert['msg']} Price: {price}"})
    if "below" in alert and price < alert["below"]:
        requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                     json={"chat_id": TELEGRAM_CHAT_ID, "text": f"{alert['msg']} Price: {price}"})
```

#### Portfolio Dashboard

No external dashboard needed. The `portfolio/current-state.md` file IS the dashboard. Claude reads it at the start of every session and can generate summaries on demand.

For a visual dashboard option, Freqtrade includes **FreqUI** -- a web-based dashboard that shows:
- Open trades with P&L
- Trade history
- Performance graphs
- Balance over time

Access at `http://localhost:8080` when Freqtrade is running.

---

## Appendix A: Kazakhstan Legal Context

- Crypto is legal in Kazakhstan. Binance is authorized by AFSA within AIFC. Source: [lightspark.com](https://www.lightspark.com/knowledge/is-crypto-legal-in-kazakhstan)
- Kazakhstan lifted restrictions on crypto mining and trading in November 2025. Source: [caspiannews.com](https://caspiannews.com/news-detail/kazakhstan-lifts-restrictions-on-cryptocurrency-mining-trading-2025-11-17-36/)
- Digital assets added to Banking Law in late 2025. Source: [ventureburn.com](https://ventureburn.com/kazakhstan-adds-digital-assets-to-banking-law-crypto-rules/)
- P2P trading: No specific restrictions found. Binance P2P operates in KZ. Bybit is not explicitly restricted.
- Tax implications: Miners taxed at 15%. Individual trading tax rules unclear -- consult local tax advisor.

## Appendix B: Recommended Starting Strategy

For a complete beginner with $260:

**Strategy: Simple EMA Crossover with RSI Filter**

```
Rules:
- Timeframe: 4h
- Pairs: BTC/USDT, ETH/USDT
- LONG entry: EMA20 crosses above EMA50 AND RSI(14) < 60
- LONG exit: EMA20 crosses below EMA50 OR RSI(14) > 75
- Stop loss: 2% below entry (or below recent swing low)
- Take profit: 2:1 risk-reward ratio
- Position size: 2% risk (half-Kelly if enough trade history)
- Only trade in BULL or SIDEWAYS regime (no longs in BEAR)
```

This is boring by design. Boring strategies survive. Complex strategies on small capital die from fees and slippage.

## Appendix C: Fee Considerations for Small Capital

| Exchange | Spot Maker | Spot Taker | Min Order |
|----------|-----------|-----------|-----------|
| Binance | 0.10% | 0.10% | $5-10 depending on pair |
| Bybit | 0.10% | 0.10% | $1 (varies by pair) |

On a $10 trade with 0.1% taker fee:
- Entry fee: $0.01
- Exit fee: $0.01
- Total round-trip: $0.02 (0.2% of position)

A strategy needs to make >0.2% per trade just to break even. On a $10 position, that means the price needs to move >$0.02 in your favor. This is why scalping on small capital is futile -- fees eat all profit.

**Minimum viable trade size:** $10-$20 per trade to keep fees manageable.

---

## 7. Sources

### MCP Server Repositories
- [lazy-dinosaur/ccxt-mcp](https://github.com/lazy-dinosaur/ccxt-mcp) -- Multi-exchange CCXT MCP
- [doggybee/mcp-server-ccxt](https://github.com/doggybee/mcp-server-ccxt) -- High-performance CCXT MCP (31 tools)
- [Nayshins/mcp-server-ccxt](https://github.com/Nayshins/mcp-server-ccxt) -- Read-only CCXT MCP
- [nirholas/Binance-MCP](https://github.com/nirholas/Binance-MCP) -- Binance 478+ tools
- [ethancod1ng/bybit-mcp-server](https://github.com/ethancod1ng/bybit-mcp-server) -- Bybit with testnet default
- [sammcj/bybit-mcp](https://github.com/sammcj/bybit-mcp) -- Bybit read-only
- [okx/agent-trade-kit](https://github.com/okx/agent-trade-kit) -- OKX official (107 tools)
- [edkdev/hyperliquid-mcp](https://github.com/edkdev/hyperliquid-mcp) -- Hyperliquid trading
- [kukapay/kukapay-mcp-servers](https://github.com/kukapay/kukapay-mcp-servers) -- 77-server suite
- [kukapay/crypto-indicators-mcp](https://github.com/kukapay/crypto-indicators-mcp) -- 76 technical indicators
- [kukapay/crypto-feargreed-mcp](https://github.com/kukapay/crypto-feargreed-mcp) -- Fear & Greed Index
- [kukapay/freqtrade-mcp](https://github.com/kukapay/freqtrade-mcp) -- Freqtrade integration
- [kukapay/funding-rates-mcp](https://github.com/kukapay/funding-rates-mcp) -- Cross-exchange funding rates
- [kukapay/dune-analytics-mcp](https://github.com/kukapay/dune-analytics-mcp) -- Dune Analytics bridge
- [atilaahmettaner/tradingview-mcp](https://github.com/atilaahmettaner/tradingview-mcp) -- TradingView screening
- [hummingbot/mcp](https://github.com/hummingbot/mcp) -- Hummingbot market making
- [IQAIcom/defillama-mcp](https://github.com/IQAIcom/defillama-mcp) -- DeFiLlama DeFi data
- [dcSpark/mcp-server-defillama](https://github.com/dcSpark/mcp-server-defillama) -- DeFiLlama TVL data
- [hive-intel/awesome-crypto-mcp-servers](https://github.com/hive-intel/awesome-crypto-mcp-servers) -- Curated list
- [royyannick/awesome-blockchain-mcps](https://github.com/royyannick/awesome-blockchain-mcps) -- Curated list

### Market Data Providers
- [CoinGecko MCP Docs](https://docs.coingecko.com/docs/mcp-server) -- Official CoinGecko MCP
- [CoinMarketCap MCP](https://coinmarketcap.com/api/mcp/) -- Official CMC MCP (12 tools)
- [Crypto.com MCP](https://mcp.crypto.com/docs/claude) -- Free market data

### Frameworks & Libraries
- [ccxt/ccxt](https://github.com/ccxt/ccxt) -- 108+ exchange unified API
- [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) -- Multi-agent LLM trading (LangGraph)
- [freqtrade/freqtrade](https://github.com/freqtrade/freqtrade) -- Open-source trading bot
- [btrccts/btrccts](https://github.com/btrccts/btrccts) -- CCXT-compatible backtesting
- [polakowo/vectorbt](https://github.com/polakowo/vectorbt) -- NumPy-accelerated backtesting
- [whchien/ai-trader](https://github.com/whchien/ai-trader) -- Backtrader + MCP

### Research Papers
- [TradingAgents: Multi-Agents LLM Financial Trading Framework](https://arxiv.org/abs/2412.20138) -- Bull/bear debate mechanism
- [TradingGroup: Multi-Agent with Self-Reflection](https://arxiv.org/html/2508.17565v1)
- [Adaptive Multi-Agent Bitcoin Trading](https://arxiv.org/pdf/2510.08068)

### Documentation
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp) -- How to add MCP servers
- [Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams) -- Multi-agent orchestration
- [Claude Code Memory System](https://code.claude.com/docs/en/memory) -- CLAUDE.md and file-based memory
- [Freqtrade Docker Quickstart](https://www.freqtrade.io/en/stable/docker_quickstart/) -- Docker setup
- [Freqtrade REST API](https://www.freqtrade.io/en/stable/rest-api/) -- API configuration
- [FreqAI Documentation](https://www.freqtrade.io/en/stable/freqai/) -- ML integration
- [CCXT Manual](https://github.com/ccxt/ccxt/wiki/manual) -- Unified API docs
- [Binance Testnet](https://testnet.binance.vision) -- Paper trading
- [Bybit Testnet](https://testnet.bybit.com) -- Paper trading
- [Bybit Demo Trading API](https://bybit-exchange.github.io/docs/v5/demo) -- Demo environment

### Market Analysis
- [Crypto Fear & Greed Index](https://alternative.me/crypto/fear-and-greed-index/) -- Data source
- [CoinMarketCap Fear & Greed](https://coinmarketcap.com/charts/fear-and-greed-index/)
- [Kelly Criterion in Crypto](https://coinmarketcap.com/academy/article/what-is-the-kelly-bet-size-criterion-and-how-to-use-it-in-crypto-trading)

### Kazakhstan Legal
- [Crypto Legal Status in Kazakhstan](https://www.lightspark.com/knowledge/is-crypto-legal-in-kazakhstan)
- [Kazakhstan Lifts Crypto Restrictions (Nov 2025)](https://caspiannews.com/news-detail/kazakhstan-lifts-restrictions-on-cryptocurrency-mining-trading-2025-11-17-36/)
- [Kazakhstan Banking Law Update](https://ventureburn.com/kazakhstan-adds-digital-assets-to-banking-law-crypto-rules/)
- [Binance Supported Countries](https://www.datawallet.com/crypto/binance-restricted-countries)
