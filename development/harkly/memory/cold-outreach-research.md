# Cold Outreach Funnels for Harkly: Indie Dev Edition

## Section 1: Subject Line Psychology (Indie Founders)

### What Gets Opened vs. Deleted

A solo indie dev checking email between commits is in a **threat-detection state**. Their inbox is a minefield of:
- VC pitch decks from "partners" who want 20% equity
- Asset store spam
- "Collaboration opportunities" that are actually unpaid work
- Press outlets asking for free keys

**What gets opened:**
- Specificity that proves you actually looked at *their* game
- Numbers that create curiosity gaps
- Peer-language, not vendor-language
- Subject lines that read like they came from another dev, not a sales team

**What gets deleted:**
- Anything that could be mass-sent to 500 studios
- Vague value propositions
- Enthusiasm that signals desperation

---

### 10 Subject Line Anti-Patterns (Instant Delete Triggers)

| # | Anti-Pattern | Why It Fails |
|---|--------------|--------------|
| 1 | "Quick question about [Game Name]" | Overused by every SDR trainee; signals template |
| 2 | "Partnership opportunity" | Means "give me something for nothing" |
| 3 | "I love your game!" | Empty flattery; no proof, no specificity |
| 4 | "[Game Name] + [Your Company] = 🚀" | Emoji + equation = obvious marketing automation |
| 5 | "Following up" (as first email) | Lies are obvious; burns trust immediately |
| 6 | "Are you the right person to talk to?" | Cowardly; you already scraped their contact info |
| 7 | "Exclusive invitation" | Nothing is exclusive; they know it |
| 8 | "Saw you on Product Hunt" | If you didn't reference something specific from the launch, it's noise |
| 9 | "Boost your reviews by 300%" | Implausible claim from unknown sender = spam |
| 10 | "Re:" (without prior conversation) | Deceptive subject line padding; instantly recognizable |

---

### 5 Subject Line Templates for Harkly

**Template 1: Competitor Fan Signal**
```
Subject: 18% of your negative reviews are from ETS2 players
```
**Why it works:** Specific percentage + named competitor creates immediate curiosity. "Wait, how do they know that?" The dev *needs* to open this to understand the data source. It's not a claim—it's a statement of fact that demands explanation.

---

**Template 2: Review Count + Pattern**
```
Subject: [Studio Name] — 47 negative reviews, same complaint cluster
```
**Why it works:** The review count proves you pulled real data (not a template). "Same complaint cluster" implies a *fixable pattern*, not random negativity. Indie devs are pattern-matchers; this triggers their debugging instinct.

---

**Template 3: Private Ratio Hook**
```
Subject: 63% of your reviewers have private profiles — here's what that means
```
**Why it works:** High private ratio is a metric they can't easily see themselves. It signals you have infrastructure they don't. "Here's what that means" promises interpretation, not just data dumping.

---

**Template 4: Top Cluster Specificity**
```
Subject: "Missing tutorial" is your #1 negative review cluster (22 occurrences)
```
**Why it works:** Quotes actual review language (scrapable from Steam). The occurrence count proves aggregation, not cherry-picking. This reads like a bug report, not a sales pitch.

---

**Template 5: Competitor + Legitimacy Angle**
```
Subject: Your Player Profile Report — 31% "Competitor Fan" legitimacy flag
```
**Why it works:** "Player Profile Report" sounds like a deliverable, not a demo. "Legitimacy flag" introduces a concept they haven't considered—some negative reviews may not be from genuine players. This is threat-detection for their game's reputation.

---

## Section 2: First Message (80-120 Words Max)

### Structure Breakdown
```
[One-sentence hook with specific game data]
→ [What it means for them]
→ [What Harkly found]
→ [Frictionless CTA: "reply to this email"]
```

### Rules Enforced
- ❌ No "I wanted to reach out" (weak, self-focused)
- ❌ No "free analysis" (devalues the work)
- ✅ CTA = "reply to this email" (lowest friction)

---

### Message A: High Competitor Fan Signal (>15%)

```
18% of your negative Steam reviews are from players whose profiles show 
ETS2 as their top game by hours. That's 9 out of 51 negatives — not 
random toxicity, but a specific audience mismatch.

These reviewers aren't your target. They found your game through 
algorithmic recommendations, expected a trucking sim, and rated based 
on that expectation. The legitimacy score on these reviews averages 2.3/5.

I pulled a Player Profile Report showing the competitor fan distribution 
across all your negative reviews, plus the complaint clusters that map 
to actual bugs vs. preference mismatches.

Reply to this email if you want the report. No call, no demo — just 
the data.
```

**Word count:** 108

**Why this works:** The 18% → 9/51 conversion makes the abstract concrete. "Legitimacy score 2.3/5" introduces a metric they can't see on Steam. The CTA explicitly removes friction (no call, no demo).

---

### Message B: High Private Profile Ratio (>60%)

```
63% of your negative reviewers have private Steam profiles — 32 out of 
51. That's unusually high for a game at your review volume, and it 
limits what you can learn from surface-level scraping.

High private ratios typically signal two things: review bombing from 
alt accounts, or genuine players who don't maintain public profiles. 
The difference matters for how you respond.

I ran a Player Profile Report that clusters the public data we *can* 
access — top complaint themes, reviewer history patterns, and a 
legitimacy score for each negative review based on playtime and 
account age.

Reply if you want the report. It's yours either way.
```

**Word count:** 112

**Why this works:** Acknowledges the data limitation (builds trust). Offers a framework (bombing vs. genuine) that positions you as an analyst, not a vendor. "It's yours either way" removes transactional pressure.

---

### Message C: Dominant Complaint Cluster → Fixable Feature

```
"Missing tutorial" appears in 22 of your 51 negative reviews — 43%. 
That's not opinion drift; that's a fixable onboarding gap.

The cluster isn't scattered. It concentrates in players with <2 hours 
playtime, which means they're bouncing before experiencing core loops. 
These aren't lost causes — they're tutorial-shaped holes in your 
funnel.

I pulled a Player Profile Report showing the complaint clusters mapped 
to playtime breakpoints, plus reviewer legitimacy scores (so you can 
separate signal from noise).

Reply to this email and I'll send the report. No strings.
```

**Word count:** 106

**Why this works:** "43%" + "<2 hours" creates a specific, actionable insight. "Tutorial-shaped holes in your funnel" uses their language (funnel, onboarding). Positions the problem as *solvable*, which is psychologically relieving for a stressed dev.

---

## Section 3: 5-Touch Follow-Up Sequence

### Overview

| Touch | Day | Angle | Psychological Driver |
|-------|-----|-------|---------------------|
| 1 | 0 | Insight hook (initial email) | Curiosity + specificity |
| 2 | 3 | Different data angle | Persistence without repetition |
| 3 | 7 | Social proof via specificity | "Others like you found this useful" |
| 4 | 14 | Breakup that opens a door | Loss aversion + autonomy |
| 5 | 21 | Channel pivot | Multi-touchpoint presence |

---

### Touch 1: Day 0 — Insight Hook

**Template:** (See Section 2 messages A/B/C)

**If opened, no reply:** Wait 3 days. Do not send Touch 2 early — pacing signals you're not desperate.

**If no open:** Send Touch 2 with a *different subject line* from the same data pool. The email client may have filtered Touch 1; a new subject line can bypass filters.

---

### Touch 2: Day 3 — Different Data Angle

**Subject:** `One more thing from your Player Profile data`

**Body:**
```
Quick addition to my earlier note — I noticed your review velocity 
spiked after the [patch version / Steam update date] on [date]. 

The negative review cluster shifted post-update: "performance" mentions 
went from 3 → 14 occurrences. That's worth isolating from the baseline 
complaints.

The Player Profile Report separates pre-update vs. post-update clusters, 
so you can see what changed.

Reply if you want it.
```

**Why it works:** References a *temporal* data point (update date) that's auto-fetchable from Steam. Shows you're tracking dynamics, not just static snapshots. "Quick addition" feels like a colleague dropping a note, not a sales follow-up.

**If opened, no reply:** Proceed to Touch 3 on day 7.

**If no open:** Try a subject line with a number: `22 reviews, same complaint` — numeric subjects sometimes bypass spam filters.

---

### Touch 3: Day 7 — Social Proof Without Case Studies

**Subject:** `What [similar indie game] found in their review data`

**Body:**
```
Not a case study — just a data point that might be relevant.

A solo dev with a similar review profile (58 negatives, 61% private 
ratio) ran the Player Profile Report last month. Turned out 34% of 
their negatives were from "Genre Expert" reviewers — players who 
mainly review games in the category, not casual buyers.

They prioritized fixes for the complaints that came from low-legitimacy 
reviewers first. Review rating stabilized within 3 weeks.

Your data shows a similar Genre Expert concentration (28%). The report 
breaks it down by reviewer type.

Reply if you want to see it.
```

**Why it works:** "Not a case study" disarms skepticism. The specificity (58 negatives, 61%, 34%, 28%) *is* the social proof — you can't fake those numbers convincingly. "Review rating stabilized within 3 weeks" is an outcome, not a testimonial.

**If opened, no reply:** Touch 4 is your breakup — make it count.

**If no open:** At this point, they're either not checking this inbox or actively avoiding. Touch 4 should acknowledge this.

---

### Touch 4: Day 14 — Breakup That Opens a Door

**Subject:** `Closing the loop on this`

**Body:**
```
I've sent the Player Profile Report data a few times — if it's not 
relevant right now, I'll close the loop.

One last thing: your competitor fan percentage (18%) is above the 
threshold where it typically correlates with review rating drag. If 
that shifts post-update, it's worth isolating from genuine player 
feedback.

If you want the report later, it's available. No need to reply to 
this email — just reach out when it's timely.

Either way, good luck with [Game Name].
```

**Why it works:** "I'll close the loop" gives them autonomy — you're not chasing. The "one last thing" provides genuine value even if they never reply. "No need to reply" removes all pressure, which paradoxically increases reply rates. "Good luck" is peer language, not vendor language.

**If opened, no reply:** This is your last email touch. Proceed to Touch 5 as a channel pivot.

**If no open:** They're not engaging with email. Touch 5 pivots to Twitter/Discord if they're active there.

---

### Touch 5: Day 21 — Channel Pivot

**Subject:** `Finding you on Twitter instead`

**Body:**
```
Email might not be your thing — I get it.

I'm on Twitter as [@harkly_handle]. If you're active there, DMs are 
open. I can share the Player Profile Report data in a thread format 
if that's easier.

No pressure either way. Just leaving the door open on a different 
channel.
```

**Why it works:** Acknowledges email fatigue (common among indie devs). Offers an alternative without demanding action. "No pressure either way" maintains the peer dynamic. This is your final touch — after this, you stop outreach unless they initiate.

**If opened, no reply:** Stop outreach. They've had 5 touches across 21 days. Further contact becomes harassment.

**If no open:** Stop outreach. Add to a "re-engage in 90 days" list if your CRM supports it.

---

## Section 4: Twitter/X DM for Indie Devs (Zero Prior Engagement)

### Constraints
- 280 characters max
- Peer tone (dev-to-dev, not vendor-to-buyer)
- Reference only auto-fetchable context (Steam update date, review count, rating)

---

### Anti-Patterns (What Gets You Blocked)

| Anti-Pattern | Why Devs Block |
|--------------|----------------|
| "Hey!" as opener | Wastes their character budget; forces them to ask "what?" |
| Link in first DM | Instant spam signal; no context for the link |
| "I love your game!" | Empty; could be sent to 1000 devs |
| Asking for a call | High friction; you haven't earned 30 minutes |
| Vague "partnership" | Means "I want something" |
| Emoji-heavy messages | Signals marketing automation |
| "Quick question" | There's no such thing; questions take time |

---

### Harkly DM Template (280 Chars)

```
[Game Name] hit 51 negative reviews last week — 18% are from players 
whose top game is ETS2. That's a competitor fan signal, not random 
toxicity. 

I pull Player Profile Reports that show who's writing negatives 
(competitor fan / genre expert / casual) + legitimacy scores. 

Not selling — just sharing the data if it's useful. DM me if you 
want the report.
```

**Character count:** 276

**Why it works:** Leads with data, not introduction. "Not selling" disarms. "DM me if you want" is opt-in, not pushy. The specificity (51, 18%, ETS2) proves this isn't copy-pasted.

---

### DM Sequence: If Ignored After 3 Days

**Do not send a follow-up DM.** Twitter DMs don't have the same "inbox" mental model as email — they're more intrusive. One message is your shot.

**Alternative:** Engage publicly first. Reply to one of their tweets with something genuinely useful (not promotional). After 1-2 public interactions, *then* DM is less cold. But this requires patience — you're building a micro-relationship, not blasting outreach.

**If they view the DM but don't reply:** They saw it and decided it wasn't timely. Respect that. Add them to a "re-engage in 60 days" list and move on.

---

## Section 5: Response Handling Scripts

### Scenario 1: "Interesting, tell me more"

**Bridge to report + pricing mention:**

```
Happy to share more. I'll send over the Player Profile Report — it 
shows:

- Reviewer type breakdown (Competitor Fan / Genre Expert / Casual / 
  Collector)
- Legitimacy score for each negative review
- Complaint clusters mapped to playtime breakpoints

The report is free as a sample. If you want ongoing monitoring or 
deeper analysis (review velocity tracking, update impact isolation), 
that's a paid tier starting at $99/mo.

Where should I send the report?
```

**Why this works:** Bullet points make the deliverable concrete. "Free as a sample" sets expectations — there *is* a paid tier, but this touchpoint is no-pressure. "Where should I send it?" is a low-friction question that moves the conversation forward.

---

### Scenario 2: "How much?"

**Anchoring for $99-499 USD range, recurring upsell:**

```
Two tiers:

- Player Profile Report (one-time): $99
  Full breakdown of current negative reviews, reviewer types, 
  legitimacy scores, complaint clusters

- Ongoing Monitoring: $249/mo
  Weekly report updates, review velocity tracking, post-update 
  impact analysis, alert triggers when competitor fan % spikes

Most indie studios start with the one-time report, then upgrade 
to monitoring if the data proves useful.

Want to start with the report?
```

**Why this works:** Anchors the one-time option at $99 (accessible for indie budgets). The $249/mo tier makes $99 feel reasonable. "Most indie studios start with..." provides social proof without naming names. Ends with a clear next step.

---

### Scenario 3: "Not Interested"

**One-sentence salvage attempt:**

```
Totally get it — if review analysis becomes a priority later, the 
Player Profile Report will still be available. No hard feelings.
```

**Why this works:** Validates their decision (no pressure). Leaves the door open without being pushy. "No hard feelings" is peer language — it signals you're not a desperate salesperson.

---

### Scenario 4: "Send Me the Report"

**Conditions + transition to paid:**

```
Great — I'll generate the Player Profile Report for [Game Name] and 
send it over within 24 hours.

The report is complimentary as a first touch. If you find it useful 
and want ongoing monitoring (weekly updates, velocity tracking, 
post-update analysis), that's available at $249/mo. But no obligation 
— the report is yours either way.

Confirming: send to [their email]?
```

**Why this works:** Sets delivery expectation (24 hours). Clarifies the free/paid boundary without being transactional. "No obligation — the report is yours either way" reinforces trust. Email confirmation ensures you have the right contact.

---

## Section 6: Anti-Patterns and Credibility Without Case Studies

### Top 5 Mistakes That Kill Indie Dev Cold Outreach

| # | Mistake | Why It Fails | Fix |
|---|---------|--------------|-----|
| 1 | Leading with your company | They don't care about Harkly; they care about their reviews | Lead with *their* data, introduce Harkly as the source |
| 2 | Asking for a call | 30 minutes is a huge ask from a stranger | Offer a deliverable first; calls come after value is proven |
| 3 | Vague value props | "Improve your reviews" is meaningless | "18% of negatives are from ETS2 players" is specific |
| 4 | Over-enthusiasm | "Excited to connect!" signals sales training | Peer tone: neutral, factual, no exclamation points |
| 5 | Ignoring their constraints | Indie devs are time-poor and cash-poor | Acknowledge constraints; offer low-friction options |

---

### How to Signal "Not a Bot" in Automated Outreach

1. **Reference something only a human would notice:** "Your review velocity spiked after patch 1.2.3" — bots don't correlate patches with review dates.

2. **Use imperfect language:** Bots optimize for grammar perfection. A sentence fragment or em-dash usage feels human.

3. **Acknowledge uncertainty:** "That's *typically* a sign of..." — bots state facts; humans hedge.

4. **Offer an out:** "If this isn't relevant, no worries" — bots push forward; humans respect boundaries.

5. **Sign off like a person:** Just your name, no title, no company tagline. "— Alex" not "Alex Chen | VP of Sales | Harkly"

---

### How to Use Data Specificity as Credibility Proxy

You don't need testimonials if your data is specific enough to prove you actually did the work.

**Weak:** "We analyzed your reviews and found some interesting patterns."

**Strong:** "47 negative reviews. 22 mention 'missing tutorial.' 19 of those 22 are from players with <2 hours playtime."

The second statement *cannot* be templated. It proves you pulled real data. Specificity *is* credibility.

**Tactics:**
- Always include exact counts (not "many" or "some")
- Include percentages that don't round cleanly (23%, not 25%)
- Reference dates that are auto-fetchable (Steam update timestamps)
- Name specific competitors (ETS2, not "similar games")

---

### CAN-SPAM / GDPR One-Liner for Cold Email

```
This is a cold email — if you'd prefer not to receive these, reply 
"opt out" and I'll remove you from my list.
```

**Why this works:** It's honest (acknowledges it's cold). It's easy (one reply). It's compliant (offers opt-out). It doesn't pretend to be something it's not.

**For GDPR specifically (EU contacts):**
```
I'm processing your contact data based on legitimate interest for 
B2B outreach. Reply "remove" and I'll delete your data within 7 days.
```

---

## Final Note: The Psychology of Indie Dev Outreach

Indie founders are **threat-saturated**. Every day brings:
- Publishers offering "partnerships" that are actually exploitative
- Influencers demanding free keys
- "Marketing experts" promising visibility for upfront fees

Your outreach lands in a inbox that's a **minefield of extraction attempts**.

The only way through is **specificity + autonomy**:
- Specificity proves you're not a bot or a template-sprayer
- Autonomy gives them control (reply if you want, no pressure)

Harkly's advantage is that you have *actual data* about their game. Most cold outreach is vapor — claims without proof. You can lead with proof.

Use it.