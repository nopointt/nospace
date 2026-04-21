# Research: "I Turned Claude Opus 4.7 Into a 24/7 Trader"

> Source: https://youtu.be/6MC1XqZSltw
> Saved: 2026-04-22 (Satoshi session 5)
> Transcript: 43KB, auto-subs via yt-dlp (cached at `/tmp/6MC1XqZSltw-clean.txt` — ephemeral)

---

## TL;DR

Author built a 24/7 AI trading agent using **Claude Code Routines** (new Anthropic feature — scheduled cron-like triggers inside Claude Code Desktop app) + Alpaca US equities API + Perplexity research + ClickUp notifications. Previous 30-day run with Opus 4.6 beat S&P by ~8% on $10K paper account.

**Key message: the video shows the framework, not the strategy.** Author hides his actual `strategy.md` / `sell-signals.md` content.

---

## What's new / useful

### Claude Code Routines (Anthropic feature)

- Scheduled triggers in Claude Code Desktop app
- Two modes: **local** (runs on user machine) vs **remote** (runs in Anthropic cloud, needs GitHub repo)
- Remote = machine-off tolerant; clones repo, runs, commits back to main
- Requires env-var injection for API keys (not `.env` in repo)
- Requires permission "allow unrestricted branch pushes"
- Costs session tokens from Max/Pro plan (not API billing)
- Each routine ~200K token budget (keep context lean)

### Risk rules / guardrails (concrete numbers author uses)

- **5%** max portfolio per position
- **10%** trailing stop on every position
- **-7%** cut loser threshold (midday routine)
- **3** new positions max per week
- Daily loss cap (number not disclosed)
- No options ever
- Tighten stops on winners at midday

### Cron cadence (weekdays only, Friday includes review)

| Time (local) | Routine | Action | Notify |
|---|---|---|---|
| 06:00 | pre-market | Research catalysts, draft trade ideas | Only if urgent |
| 08:30 | market open | Execute planned trades, set 10% trailing stops | Only if trade placed |
| 12:00 | midday | Cut -7% losers, tighten stops on winners | Only if trade |
| 15:00 | close | EOD log only | Summary notification |
| Friday 16:00 | weekly review | Portfolio vs S&P, self-grade A/B/C/D, learnings | Summary |

### Memory architecture (file-based)

```
memory/
  strategy.md          # human-written thesis + rules
  sell-signals.md      # sell triggers
  key-learnings.md     # accumulated lessons (routine writes here)
  trade-log.md         # append-only trade history (routine writes)
  research-log.md      # append-only research notes
  weekly-review-YYYY-WW.md  # weekly self-grade + tweaks
  portfolio-current.md # latest snapshot
```

Each routine: read all memory → do work → write updates back.
`claude.md` = system prompt (~150 lines observed).

### Opus 4.7 benchmark interpretation

- Agentic Financial Analysis: **64.4%** (up ~4% from 4.6)
- Benchmark rewards: digesting SEC filings, writing coherent fundamentals thesis
- Benchmark does NOT reward: technical analysis (MACD, candles), day trading
- **Correct use: swing / long-term / fundamentals-driven**

### Migration pattern (from any other setup → Claude Code)

Author's exact flow: "Claude, here's zip of my old OpenClaw files (strategy + logs + learnings). Get acclimated. Propose folder structure. Ask me questions. Brainstorm."
Claude reorganises into `scripts/` + `memory/` + `commands/` + `routines/` + `claude.md`.

---

## Applicable to Nomos

### HIGH value — build next

1. **Fundamentals/news layer via Claude routine** (daily, 08:00 UTC)
   - Perplexity: "major crypto news last 24h, macro indicators, BTC/ETH sentiment"
   - Writes `finance/nomos/memory/trading/bias/{date}.json` with sentiment vector
   - Runner reads bias at tick start → soft filter (reduce position size if negative bias, skip buy on "cautious" pairs)
   - Low risk, Opus 4.7 strong here

2. **Weekly review routine** (Friday 22:00 UTC)
   - Reads last 7 days of journal.jsonl + scoreboard.md
   - Grades week (A/B/C/D with reasoning)
   - Writes `memory/trading/weekly-reviews/{week}.md`
   - Proposes strategy tweaks in `memory/trading/proposed-changes/{week}.md`
   - Human review before merge to `runner/config.json`

3. **Monthly retro routine** (1st of month)
   - 30-day performance vs buy-and-hold BTC + vs S&P (for reference)
   - Per-strategy win/loss breakdown
   - Cramer mirror verdict: do any strategies beat inversion?

### MEDIUM value

4. **Risk numbers — adopt in `runner/config.json`:**
   - `max_position_size_pct` already 20% — consider lowering to 5% per video
   - Add `trailing_stop_pct: 10.0`
   - Add `cut_loser_pct: -7.0` (midday cleanup)
   - Add `max_new_positions_per_week: 3`

5. **Memory files structure extension** (for Claude routine consumption)
   - `finance/nomos/memory/trading/strategy.md` — human thesis
   - `finance/nomos/memory/trading/learnings.md` — append-only
   - `finance/nomos/memory/trading/bias/` — daily sentiment
   - `finance/nomos/memory/trading/proposed-changes/` — Claude suggestions

### LOW value / skip

- Alpaca API — US equities only, not for us (Binance crypto)
- ClickUp notifications — we use Telegram, fine as is
- "Beat the S&P" framing — for crypto we'd compare vs BTC buy-and-hold + `USDT HODL` (0%) as two baselines

---

## Why Claude routines would NOT replace our Python runner

- Python runner runs every 5min × 3 strategies × 2 pairs = high-frequency technical loop
- Claude routine would cost too many tokens at that cadence
- Our runner = **fast technical layer** (cheap, deterministic)
- Claude routines = **slow fundamentals layer** (expensive, judgment-based)
- Combine: runner consumes `bias/*.json` + `halt.flag` written by Claude routines

---

## Open questions (for nopoint to decide next session)

- Do we set up Claude routines on nopoint's laptop Desktop app, or skip remote mode and just run `claude --print` from a Hetzner cron?
- If remote — need private GitHub repo mirroring `/opt/nomos/memory/trading/` subset (can't expose testnet keys, but non-secret files fine)
- Perplexity API key — do we have one? Or swap to Jina/native WebSearch?

---

## Raw transcript location

Full cleaned transcript was at `C:/Users/noadmin/AppData/Local/Temp/6MC1XqZSltw-clean.txt` (ephemeral — regenerate with `python -m yt_dlp --write-auto-sub --sub-lang en --skip-download -o "6MC1XqZSltw.%(ext)s" "https://youtu.be/6MC1XqZSltw"` if needed again).
