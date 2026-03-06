# Harkly Cold Outreach Strategy
> Draft — edit before use
> Created: 2026-03-06

---

## Goal

Fast revenue. First 5 paying clients in 30 days.
Offer: Player Profile Report — free sample, paid follow-up.
Price: $49–99 one-time report / $49/mo subscription.

---

## Target Profile

- Indie Steam game, 50+ negative reviews
- Price >= $1 (not free-to-play)
- Active players in last 2 weeks (average_2weeks > 0)
- Small studio — not Focus, SEGA, Bandai Namco, Nacon, 2K, EA, Ubisoft
- Has reachable channels: website, email, Twitter, Discord, Reddit

---

## 5-Touch Sequence

| Day | Channel | Action |
|-----|---------|--------|
| 0   | Email   | First email — full insight inline, no links/attachments, no CTA to buy |
| 2   | Twitter DM | "Hey, sent you an analysis of your Steam reviews on email — worth a look" |
| 7   | Email   | Follow-up — one new data point, soft ask |
| 10  | Discord / Reddit | Community touch — mention the analysis, link if allowed |
| 14  | Email   | Closing email — final offer, clear ask |

---

## Email Structure

### Touch 1 (Day 0) — Lead with insight, no ask

Subject line (pick one based on strongest signal):
- Competitor Fan >= 15%: `"Your [game] reviews — a lot of ETS2/ATS fans in there"`
- Private ratio >= 60%: `"X% of your negative reviewers are invisible — here's what we found"`
- Default: `"Your top complaint cluster: \"[cluster name]\""`

Body:
- `"Hey,"` — peer-to-peer, not corporate
- One sentence what we did
- Insight block inline (no attachment, no link):
  - Total reviews analyzed
  - Private ratio %
  - Dominant reviewer type + %
  - Top complaint cluster + description
  - Legitimacy score if available
  - Competitor Fan % if significant
- Close: `"If any of this is useful — happy to talk through what it means. No strings attached."`
- Sign: `— Harkly`

Rules:
- No links in first email
- No attachments
- No mention of pricing
- Full report only after they reply

### Touch 2 (Day 2) — Twitter/X DM

```
Hey, sent a player profile analysis of [game name] to your email —
breakdown of who's leaving negative reviews and why.
Worth a look if you haven't seen it.
```

### Touch 3 (Day 7) — Email follow-up

Subject: `"One more thing about [game] reviews"`

Body:
- Reference first email
- Add one new angle (e.g. "Genre Experts left X% of 1-star reviews with avg Yh playtime — that's a legitimacy signal")
- Soft ask: "Happy to hop on a 15-min call if you want to dig into this"

### Touch 4 (Day 10) — Discord / Reddit

- Discord: post in #feedback or #dev channel if public
- Reddit: comment on relevant thread or send modmail
- Message: "We analyzed [game]'s Steam reviews — found some interesting patterns around [top cluster]. DM if curious."

### Touch 5 (Day 14) — Closing email

Subject: `"Last note on [game] review analysis"`

Body:
- Reference previous touches briefly
- State the offer clearly: full report, free as sample
- Hard deadline: "Happy to send it over this week"
- If no reply after this — move on

---

## What We Send After Reply

Only after they engage:
1. Full Player Profile Report (MD or PDF)
2. Brief explanation of methodology
3. Offer: $49 one-time additional report, or $49/mo for ongoing monitoring
4. No hard sell — let the report speak

---

## Manual Filter Before Sending

Before running batch_pipeline, filter targets.json:
- Remove: Focus Entertainment, SEGA, Bandai Namco, Nacon, 2K Games, EA, Ubisoft, THQ Nordic
- Keep: solo devs, 2-10 person studios, unknown publishers
- Prioritize: 200–2000 negative reviews (big enough to hurt, small enough to care)

---

## Metrics to Track (batch_pipeline CSV)

- appid, studio, email found (y/n), touch 1 sent (date), reply (y/n), converted (y/n)
- Target: 20% email found rate, 5% reply rate, 1% conversion

---

## Open Questions (edit here)

- [ ] Gmail app password setup for --send flag
- [ ] Domain / sender address (harkly.io?) — waiting on Artem
- [ ] Stripe ready for payment link in follow-ups?
- [ ] Report format: MD or PDF? (PDF looks more professional)
- [ ] Pricing final: $49 or $99 first report?
- [ ] Subscription offer: when to introduce? after first paid report?
