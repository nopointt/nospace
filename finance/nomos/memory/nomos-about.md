---
# nomos-about.md — Nomos Project Reference
> Layer: L1 | Frequency: slow | Loaded: at session start
> Last updated: 2026-03-19 (session 0 — project created)
---

## Identity

Nomos = personal finance & crypto investment project.
Name: from Greek nomos (law, distribution) — the root of "economy" (oikonomia = oikos + nomos).
Orchestrator: Claude Code = **Satoshi** (third primary agent, peer to Axis and Logos).
Participants: nopoint + brother.

## Context

- Both brothers have blocked bank accounts (debt enforcement / исполнительное производство)
- Total debt: ~700K KZT (nopoint 400K + brother 300K) — not a priority to repay
- Starting capital: 75,000 KZT (~$150) cash
- Monthly replenishment: ~75,000 KZT cash
- On-ramp: cash → Kaspi of brother's girlfriend → Binance/Bybit P2P → crypto
- Storage: exchange → self-custody wallet (long-term)
- Goal: systematic capital growth, no fixed timeline
- Debt repayment: will happen from profits eventually, not the focus

## Constraints

- No bank accounts (seized by bailiffs)
- No brokerage accounts (would be seized)
- No third-party proxy accounts (girlfriend unstable, mom has business — risky)
- Crypto = only viable investment path
- Self-custody = enforcement-resistant (bailiffs can't access private keys)
- KYC on exchanges = theoretical risk (not enforced in civil cases yet, 2026)

## Key Paths

| Resource | Path |
|---|---|
| Project root | `nospace/finance/nomos/` |
| L1 (this file) | `finance/nomos/memory/nomos-about.md` |
| L2 (roadmap) | `finance/nomos/memory/nomos-roadmap.md` |
| L3 (active epic) | see Active L3 table below |
| L4 (scratches) | `finance/nomos/memory/scratches/` |
| Chronicle | `finance/nomos/memory/chronicle/` |
| Knowledge base (RAG) | `finance/nomos/knowledge/` |
| Strategies | `finance/nomos/strategies/` |
| Portfolio DB | `finance/nomos/portfolio/` |
| Research (legal) | `nospace/docs/research/nomos-legal-kz-research.md` |
| Research (instruments) | `nospace/docs/research/nomos-instruments-kz-research.md` |
| Research (trading agent) | `nospace/docs/research/nomos-trading-agent-*.md` (6 files) |
| Research (Remizov ODE) | `nospace/docs/research/nomos-remizov-trading-research.md` |
| Freqtrade | `finance/nomos/tools/freqtrade/` (Docker, config, strategies) |
| Trading memory | `finance/nomos/memory/trading/` (journal, portfolio, scoreboard) |
| Agent definitions | `finance/nomos/agents/` (scanner, analyst, risk) |
| MCP config | `finance/nomos/config/ccxt-accounts.json` |
| Testnet keys | `~/.tlos/binance-testnet` (chmod 600) |

All paths relative to: `C:\Users\noadmin\`

## Agent Hierarchy

```
nopoint
  ├── Axis    (Claude Code — primary orchestrator, tLOS + Harkly)
  ├── Logos   (Claude Code — data/DB)
  └── Satoshi (Claude Code — finance/Nomos, ex-Praxis)
        └── Eidolon{hash} × N  (ephemeral subagents)
              registry: ~/.tlos/eidolons.json
```

## On-Ramp Flow

```
Cash (KZT) → Brother's girlfriend Kaspi → Binance P2P (buy USDT/BTC) → Exchange wallet → Self-custody
```

Fees: 0% Binance P2P + 1-3% seller markup. Total: ~1-3% per transaction.

## Legal Context (KZ 2025-2026)

- 14 AIFC-licensed crypto platforms (Binance, Bybit, OKX, etc.)
- Crypto tax: 10% on profit (capital gain), form 270.00
- Self-custody wallets: practically unreachable by civil bailiffs
- Exchange accounts (KYC): theoretically seizable, not enforced yet
- National Bank + AIFC dual regulation framework
- New Tax Code 2026 includes detailed crypto provisions
- Full research: `nospace/docs/research/nomos-legal-kz-research.md`

## Project-Specific Rules

- **Satoshi = financial advisor + portfolio manager + trading bot brain**
- nopoint is a complete beginner — explain everything simply
- **Never risk money needed for next month** — emergency reserve first
- **DCA over timing** — don't try to time the market
- **Self-custody for anything > $500** — don't keep large amounts on exchange
- Track every transaction (date, amount, price, fee)
- All strategies must be backtested or researched before deployment

## Knowledge Base (RAG)

Status: NOT YET BUILT
Plan: collect finance/trading books → extract → index in Qdrant
Collection name: `nomos_knowledge` (planned)
Embedding: jina-embeddings-v4 (2048-dim, same as Bauhaus)

## Active L3 (single source of truth)

| Epic | File | Status |
|---|---|---|
| Phase 1 — Setup & First Buy | nomos-phase1.md | 🔶 IN PROGRESS |

> Update this table when epics change.

## Navigation

| Need | File |
|---|---|
| Roadmap | nomos-roadmap.md (L2) |
| Active epic | see Active L3 table above |
| Chronicle index | memory/chronicle/index.md |
| Research | `nospace/docs/research/nomos-*.md` |
