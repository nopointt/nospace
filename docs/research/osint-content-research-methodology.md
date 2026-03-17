# OSINT Methodology for Content Research
> Topic: Information gathering and validation before writing — adapted for B2B content pipeline
> Audience: PostResearcher agent (IdeaMaker → PostResearcher → TGWriter)
> Target channel: Harkly (Telegram, B2B, PM/UX researchers)
> Created: 2026-03-17 | Status: COMPLETE

---

## Section 1 — Triangulation: Cross-Validating Information from Multiple Sources

### What triangulation means in OSINT

Triangulation is the practice of confirming a claim or signal by finding it independently in at least **three sources that do not share a common origin**. The keyword is *independent* — three articles all citing the same Nielsen report is not triangulation, it is amplification of a single source.

The concept is borrowed from navigation and surveying: when three independent bearings converge on the same point, confidence in the location is high. When only two converge, you have corroboration but not confirmation. When all three disagree, the discrepancy is itself informative.

### Minimum source threshold

| Confidence level | Source count | Condition |
|---|---|---|
| Low | 1 | Single source, unverified |
| Medium | 2 | Two independent sources agree |
| High | 3+ | Three+ independent sources, no shared origin |
| Confirmed | 3+ | Primary evidence + independent corroboration |

For content research (not security), **2 independent sources is an acceptable working threshold** for factual claims. For the main thesis of a post, require 3+.

### What counts as independent

Sources are NOT independent when:
- One cites the other as origin
- Both derive from the same press release, study, or tweet
- Both are from the same publication (even different authors)
- Both are from the same "cluster" (e.g., two MarTech blogs that share content syndication)

Sources ARE independent when:
- They reached the same conclusion through different investigative paths
- They represent different stakeholder types (practitioner forum + academic paper + industry report)
- They are geographically or institutionally separate

### Contradiction detection during triangulation

Run triangulation as a matrix, not a list:

```
Claim: "Customer interviews are declining in B2B product teams"

Source A (Reddit r/ProductManagement): confirms — multiple threads, 2025
Source B (Nielsen Norman Group report): partially confirms — says frequency dropped 30%
Source C (UserInterviews.com survey): contradicts — says volume is up but quality is down

Result: Contradiction detected. The claim requires refinement.
Refined claim: "Interview volume may be stable but perceived quality and rigor are declining"
```

This is an example of contradiction producing a better, more nuanced signal than blind confirmation.

### Triangulation in practice for PostResearcher

1. State the claim to be verified before searching
2. Find sources without looking at each other first — separate searches
3. Record source, date, quote, and URL for each
4. Map all three into a brief matrix: confirms / contradicts / neutral
5. If 2/3 confirm: mark claim as Medium-High confidence
6. If 1/2 contradict: flag for deeper investigation or reframe the claim
7. If all three contradict: the topic is contested — that is the story

Sources:
- Barracuda Networks on OSINT verification pipelines: https://blog.barracuda.com/2025/01/09/understanding-osint-modern-research
- SOS Intelligence on OSINT evaluation: https://sosintel.co.uk/evaluating-osint-why-it-matters-and-how-to-do-it-right/
- Imperva on OSINT methodology: https://www.imperva.com/learn/application-security/open-source-intelligence-osint/

---

## Section 2 — Source Layering: Primary, Secondary, Tertiary

### The three-layer model

OSINT research distinguishes sources by proximity to the original signal:

**Layer 1 — Primary sources (raw signals)**
Direct, unmediated data from people experiencing the topic:
- Reddit threads, Slack communities, Discord servers
- Hacker News comments and Ask HN threads
- LinkedIn posts from practitioners (not thought leaders — actual doers)
- Product reviews on G2, Capterra, Trustpilot
- Twitter/X threads from domain practitioners
- Job postings (reveal real organizational pain)
- GitHub issues and discussions
- Conference talk questions (audience pain, not speaker positioning)
- User research community forums (e.g., ResearchOps Community Slack)

For PM/UX research audience: Reddit r/ProductManagement, r/UXResearch, UX Mastery forums, Lean Startup community threads.

**Layer 2 — Secondary sources (processed signals)**
Journalists, bloggers, and aggregators who interpret primary signals:
- Industry news sites (TechCrunch, Product Coalition, UX Collective)
- Newsletters (Lenny's Newsletter, Product School)
- Blog posts from product companies (Amplitude, Notion, Figma, UserTesting)
- Podcast episode descriptions and key takeaways
- Conference talk recordings and slides

**Layer 3 — Tertiary sources (synthesized signals)**
Academic and institutional synthesis of secondary sources:
- Academic papers (Google Scholar, Semantic Scholar)
- Industry reports (Gartner, Nielsen Norman Group, Baymard Institute)
- Books and frameworks
- Government and standards-body publications

### How to weight each layer for content research

The goal is **resonance + credibility**. Different layers serve different functions:

| Layer | Resonance with audience | Factual authority | Recency sensitivity | Primary use |
|---|---|---|---|---|
| Primary | High (they recognize it) | Low (anecdotal) | Very high | Topic discovery, pain validation |
| Secondary | Medium | Medium | High | Frame and angle development |
| Tertiary | Low (too academic) | High | Low (often lagged) | Backing claims, lending authority |

**Rule of thumb for a Harkly post:**
- Primary layer: generates the hook and the "they feel seen" moment
- Tertiary layer: provides the one or two facts that make the post credible
- Secondary layer: connects them — shows the pattern is not just anecdotal

### Layer contamination warning

Secondary and tertiary sources frequently misrepresent primary data. Common patterns:
- Stats cited without original methodology ("70% of PMs say X" — which PMs? n=?)
- Academic findings generalized beyond their study scope
- Primary forum posts quoted selectively, reversing original sentiment

**Always trace tertiary claims back to primary origin before using them in content.**

Sources:
- Wikipedia OSINT overview: https://en.wikipedia.org/wiki/Open-source_intelligence
- Recorded Future on OSINT framework: https://www.recordedfuture.com/threat-intelligence-101/intelligence-sources-collection/osint-framework
- Knowlesys credibility assessment: https://knowlesys.com/en/articles/93/Assessing_Credibility_of_Platform_Derived_OSINT.html

---

## Section 3 — Signal vs Noise: Filtering for Credibility

### What makes a signal credible

Professional OSINT analysts use a structured evaluation model. The most durable framework is the **Admiralty Code** (NATO STANAG 2511), adapted here for content research:

**Source Reliability (A–F)**

| Rating | Meaning | Content research equivalent |
|---|---|---|
| A | Reliable — consistent, verified track record | Peer-reviewed source, well-known practitioner with verifiable background |
| B | Usually reliable — minor doubts | Established industry publication, recognized practitioner |
| C | Fairly reliable — significant doubts | Medium-sized blog, pseudonymous practitioner with some credibility signals |
| D | Not usually reliable — poor track record | Low-authority blog, anonymous source |
| E | Unreliable — consistently wrong | Clickbait, SEO farm, unverified aggregator |
| F | Cannot be judged | Brand-new source, no history |

**Information Credibility (1–6)**

| Rating | Meaning | Content research equivalent |
|---|---|---|
| 1 | Confirmed — independently corroborated | Triangulated across 3+ independent sources |
| 2 | Probably true — consistent but not independently confirmed | 2 independent sources agree |
| 3 | Possibly true — consistent with other information but not confirmed | Plausible, consistent with domain knowledge |
| 4 | Doubtful — inconsistent with other information | Contradicts known evidence |
| 5 | Improbable — strongly contradicted | Contradicts confirmed evidence |
| 6 | Cannot be judged | Insufficient information to assess |

**Target for a Harkly post: B2 or better for key claims. A1 for quoted statistics.**

### Five-filter credibility check

For each signal passing initial collection:

1. **Recency filter** — Is the data fresh enough for the claim? Hard rule: statistics older than 3 years require explicit "as of [year]" labeling. Methodological claims can be older if still considered current practice.

2. **Volume filter** — Is the signal present in multiple independent conversations? A single viral tweet is not a signal. A pattern of similar complaints across r/ProductManagement, G2 reviews, and LinkedIn comments is a signal.

3. **Cross-source confirmation filter** — Does the signal appear in at least two different source types (e.g., a community forum AND a practitioner blog)? Same type of source sharing same origin = noise amplification, not confirmation.

4. **Motivation filter** — What does the source gain by publishing this? Vendor-produced research has incentive to skew. Practitioner forum complaints have incentive toward authenticity (they gain social recognition for articulating shared pain accurately).

5. **Specificity filter** — Is the claim specific enough to be falsifiable? "Teams struggle with stakeholder alignment" is noise. "Senior PMs in 50+ person teams report spending 40% of time on alignment that produces no design decisions" is a signal.

### AI-generated content contamination

A growing problem in 2025-2026: LLM-generated content floods secondary and tertiary layers with plausible-sounding but fabricated statistics. Detection heuristics:
- Suspiciously round numbers ("67% of researchers say...")
- No original methodology section or raw data link
- Cited studies that cannot be found in Google Scholar
- Dates that are vague or contradictory within the article

**Rule: never cite a statistic you cannot trace to a primary study or a named survey with disclosed methodology.**

Sources:
- SOS Intelligence Admiralty Code framework: https://sosintel.co.uk/evaluating-osint-why-it-matters-and-how-to-do-it-right/
- ThreatConnect on noise vs signal: https://threatconnect.com/blog/noise-vs-signal-from-zero-day-chatter-to-actionable-intelligence/
- Deepwatch on extracting insights from OSINT: https://www.deepwatch.com/blog/beyond-the-noise-extracting-actionable-insights-from-osint-reporting/

---

## Section 4 — Temporal Analysis: Trending vs Evergreen vs Dying

### The three temporal categories

**Trending topic** — accelerating interest, fresh, volume growing week over week
- Signs: Google Trends shows upward slope in last 90 days, Reddit threads increasing in frequency, new terminology appearing (not just mentions of old terminology)
- Opportunity: high relevance window, competitive for attention, requires fast production
- Risk: may be hype cycle, not sustained interest

**Evergreen topic** — stable, persistent demand, always relevant
- Signs: Google Trends flat or slow-moving over 2+ years, recurring questions in community forums (same questions asked every few months), textbook-level content
- Opportunity: compounding value, can be referenced repeatedly, builds channel authority
- Risk: harder to differentiate, needs fresh angle or new data to stand out

**Dying topic** — decelerating, declining relevance
- Signs: Google Trends downward slope, fewer new threads, older dates on top-ranking content
- Opportunity: contrarian angle ("why everyone stopped talking about X — and why that was right/wrong")
- Risk: audience has moved on, post lands to silence

### Temporal analysis procedure

**Step 1 — Google Trends velocity check**
- Search the topic in Google Trends, 12-month window
- Note the slope direction (accelerating, flat, decelerating)
- Compare to a 5-year window for baseline
- Check related queries section — rising queries indicate topic expansion

**Step 2 — Forum thread dating**
- Search Reddit, HN, LinkedIn for the topic
- Sort by "New" to see if fresh conversations are starting
- Sort by "Top" and check dates — if all top posts are 2+ years old, topic may be stagnating
- Note: presence of old content with recent comments = evergreen, not dying

**Step 3 — Publication pulse**
- Search the topic on Google News with a 30-day filter
- Count how many new pieces are being published
- Compare to a 6-month window — is publication frequency increasing or decreasing?

**Step 4 — Terminology evolution check**
- Are new terms appearing around the core topic? (indicates active community development)
- Are practitioners using the topic's language in job descriptions? (indicates operational adoption)
- Are tools/products launching around it? (indicates commercial validation of demand)

### Temporal classification matrix for PostResearcher

| Signal | Trending | Evergreen | Dying |
|---|---|---|---|
| Google Trends slope | Rising | Flat | Falling |
| New forum threads (monthly) | Increasing | Stable | Decreasing |
| New publications (30d) | High | Moderate | Low |
| Terminology evolution | Active | Stable | Calcifying |
| Practitioner language | Adopting | Standard | Obsolete |
| Post strategy | "Why this matters now" | "Definitive guide" | "Retrospective" |

### Application to Harkly's PM/UX audience

Harkly's audience follows the practitioner adoption curve, not the media hype cycle. A topic can be "dying" in media coverage but still "evergreen" for practitioners who are just now implementing it. Always check the primary layer (forums, communities) separately from the secondary layer (tech press).

Sources:
- OSINT Times on temporal analysis: https://osintimes.substack.com/p/temporal-analysis-in-osint-investigations
- Google Trends SEO velocity methodology: https://www.yotpo.com/blog/google-trends-seo-strategy/
- Microsoft ISE on real-time trending topics detection: https://devblogs.microsoft.com/ise/real-time-time-series-analysis-at-scale-for-trending-topics-detection/

---

## Section 5 — Contradiction Handling: When Sources Disagree

### The ACH framework for content research

Intelligence analysis uses the **Analysis of Competing Hypotheses (ACH)**, developed by CIA analyst Richards Heuer. For content research, ACH translates into a structured method for handling contradictory sources without defaulting to the most convenient interpretation.

Core ACH principle: **prioritize disconfirming evidence over confirming evidence**. The hypothesis least burdened by contradictions is the most defensible claim. This directly counters confirmation bias, the most common failure mode in content research.

### The hypothesis matrix (adapted for content)

When sources contradict, build a small matrix:

```
Claim under investigation: "AI tools are replacing user researchers"

Hypothesis A: AI tools ARE replacing researchers (jobs declining)
Hypothesis B: AI tools AUGMENT researchers (jobs stable or growing, work changes)
Hypothesis C: AI tools create NEW research roles (jobs transforming)

Evidence               | H-A          | H-B          | H-C
-----------------------|--------------|--------------|---------------
LinkedIn job cuts data | Consistent   | Inconsistent | Neutral
UXR salary reports     | Inconsistent | Consistent   | Neutral
r/UXResearch threads   | Mixed        | Consistent   | Consistent
NN/g 2025 report       | Inconsistent | Consistent   | Consistent

Least contradicted: H-B. Most defensible claim.
```

### Three contradiction scenarios and responses

**Scenario 1: Sources contradict on facts**
- Example: one report says 40% of PMs use AI daily, another says 15%
- Response: investigate methodology differences (sample size, definition of "use AI", date, geography). Report the range and the methodological reason. "Estimates vary from 15% to 40% depending on how 'regular use' is defined" is a credible, honest framing.

**Scenario 2: Sources contradict on interpretation**
- Example: same data on declining interview counts interpreted as "researchers are burned out" vs "teams are becoming more efficient"
- Response: both interpretations may be valid simultaneously for different segments. This is an opportunity for nuanced content that shows multiple stakeholder perspectives.

**Scenario 3: Contradiction is the story**
- Example: industry thought leaders say "continuous discovery is standard practice" but practitioner forums show most teams still do episodic research
- Response: the gap between prescribed practice and actual practice IS the post. The contradiction surfaces a real tension your audience lives daily.

### When to stop investigating and publish

Use this decision rule:
- If you can name the reason for the contradiction (different sample, different definition, different time period) → publish with caveat noted
- If the contradiction cannot be explained → the topic is genuinely contested → that is what you say
- If 2/3 sources agree and the third is an outlier with lower reliability → note the outlier, weight toward the majority
- If all sources are high-reliability and all contradict → this is the story

**Rule: never suppress a contradiction to simplify the post. Use it.**

Sources:
- SOS Intelligence ACH guide: https://sosintel.co.uk/mastering-the-analysis-of-competing-hypotheses-ach-a-practical-framework-for-clear-thinking/
- ACH Wikipedia overview: https://en.wikipedia.org/wiki/Analysis_of_competing_hypotheses
- CIA Tradecraft Primer (ACH): https://www.cia.gov/resources/csi/static/Tradecraft-Primer-apr09.pdf

---

## Section 6 — Research Brief Structure for Content Pipeline

### Purpose of the research brief

The research brief is the handoff document between PostResearcher and TGWriter. It must answer:
1. What is the confirmed claim (the post's thesis)?
2. What evidence supports it, at what confidence level?
3. What is the temporal status of the topic?
4. What contradictions exist and how were they resolved?
5. What angle/frame is recommended?

The brief is NOT a draft. It is structured intelligence that TGWriter turns into copy.

### Standard research brief format

```markdown
# Research Brief: [Topic]
Date: YYYY-MM-DD
Researcher: PostResearcher
Target: TGWriter → Harkly channel
Audience: PM/UX researchers, B2B

---

## 1. THESIS (confirmed claim)
One sentence. The main point the post will make.
Confidence: [High / Medium / Low] — based on triangulation result

## 2. CORE EVIDENCE
Three to five evidence items, each with:
- Claim (one sentence)
- Source: [URL] — [date] — [layer: primary/secondary/tertiary]
- Reliability: [Admiralty A-F] / Credibility: [1-6]
- Note: any caveats, contradictions, or scope limits

## 3. TEMPORAL STATUS
- Category: [Trending / Evergreen / Dying]
- Google Trends: [description of slope, timeframe checked]
- Forum pulse: [recent thread activity — platform, frequency, direction]
- Publication pulse: [recent publication volume — increasing/stable/declining]

## 4. CONTRADICTIONS LOG
List all contradictions found during research:
- [Contradiction description]: [sources involved] → [resolution or "unresolved"]
- If unresolved: recommend making contradiction the post angle

## 5. SOURCE INVENTORY
Complete list of sources consulted:
| # | URL | Date | Layer | Reliability | Used? |
|---|-----|------|-------|-------------|-------|
| 1 | ... | ... | Primary | B | Yes |

## 6. RECOMMENDED ANGLE
One paragraph. Based on evidence, temporal status, and contradiction analysis:
- What hook opens the post?
- What is the core insight?
- What practitioner tension does it resolve or name?
- What call to action or takeaway?

## 7. GAPS AND CAUTIONS
Anything PostResearcher could not verify. Topics that need more research.
Stats that appear suspicious and should not be cited.
```

### Confidence level calibration for Harkly

| Level | Meaning | When to use |
|---|---|---|
| High | Thesis triangulated from 3+ independent sources, all B2 or better (Admiralty) | Lead claim of post |
| Medium | 2 independent sources agree, or 3 sources with one contradiction | Supporting claims |
| Low | Single source or unverified, use only as "one perspective" framing | Quotes, anecdotes |
| Contested | Sources genuinely disagree — make the disagreement visible | Frame as "the debate" |

### How to cite organic signals in the brief

For primary sources (Reddit, community forums), cite with:
- Platform + subreddit or community name
- Thread title (if public)
- Approximate date
- Pattern description (e.g., "pattern observed across 6+ threads in Q1 2026")

Do NOT link to specific user profiles or posts if they contain identifying information. Describe the pattern, not the person.

For secondary sources: URL + publication name + date + author if named.

For tertiary sources: full citation — author, title, year, institution, DOI or URL.

Sources:
- Intelligence report writing structure: https://www.specialeurasia.com/2024/11/27/report-writing-for-intelligence/
- Research brief guidelines: https://popresearchcenters.org/tools-training/guidelines-for-a-one-page-research-summary-for-policymakers/
- IFF Research on effective research briefs: https://www.iffresearch.com/resources/how-to-write-an-effective-research-brief/

---

## Section 7 — PostResearcher Agent Prompt Template

This section translates the methodology above into an operational prompt for the PostResearcher agent in the Harkly pipeline.

### Agent context

**Role:** PostResearcher
**Input:** Topic + IdeaMaker signal summary
**Output:** Research brief (Section 6 format)
**Target downstream agent:** TGWriter
**Audience:** PM/UX researchers in B2B Telegram channel

### Prompt template

```
You are PostResearcher, a specialist in content intelligence for the Harkly B2B Telegram channel.
Your audience: product managers and UX researchers in B2B companies.
Your job: deep research on a single topic, producing a structured research brief.

## Input
Topic: {TOPIC}
IdeaMaker signal: {IDEAMAKER_SUMMARY}

## Research Protocol

### Step 1 — Source Collection (triangulation)
Search for the topic across three layers:
- Primary: Reddit (r/ProductManagement, r/UXResearch), LinkedIn practitioner posts, G2/Capterra reviews, HN threads
- Secondary: Product blogs (Lenny's, UX Collective, Product Coalition), newsletters, podcast summaries
- Tertiary: NNG reports, academic papers (Google Scholar), industry surveys with disclosed methodology

For each layer, find at least 2-3 sources independently. Do not follow citation chains — find independent paths.

### Step 2 — Triangulation matrix
For the main thesis claim, build a 3-column matrix: confirms / contradicts / neutral.
Mark the confidence level per Admiralty (A-F for source, 1-6 for information).
Require A2-B2 minimum for thesis-level claims.

### Step 3 — Temporal classification
- Check Google Trends: 90-day slope and 5-year baseline
- Check Reddit/HN: thread frequency trend (increasing, stable, declining)
- Check publication pulse: Google News, 30-day vs 6-month comparison
- Classify: Trending / Evergreen / Dying

### Step 4 — Contradiction log
Document every contradiction found.
For each: identify the type (factual vs interpretive) and resolve it or flag it as "contested".
If contradiction is unresolvable: recommend it as the post angle.

### Step 5 — Brief assembly
Write the research brief using this structure:
1. THESIS (confirmed claim) + confidence level
2. CORE EVIDENCE (3-5 items with source, layer, Admiralty rating)
3. TEMPORAL STATUS
4. CONTRADICTIONS LOG
5. SOURCE INVENTORY (table)
6. RECOMMENDED ANGLE (hook, insight, tension, takeaway)
7. GAPS AND CAUTIONS

## Output format
Markdown. Brief must be self-contained — TGWriter receives only this document.
Length: 600-1000 words. Dense, structured, no filler.
Language: Russian (channel language) for angle and thesis; source citations in original language.

## Hard rules
- Never cite a statistic without tracing it to original methodology
- Never suppress a contradiction — use it or flag it
- Never confuse amplification (many sources citing one origin) with triangulation
- Never use data older than 3 years without explicit date labeling
- Primary layer signals are the hook; tertiary layer provides credibility
```

---

## Summary and Applicability

This methodology adapts professional intelligence analysis (OSINT/FININT tradecraft) to B2B content research for the Harkly pipeline. The six core dimensions map to specific failure modes in typical content research:

| Failure mode | Methodology applied |
|---|---|
| Citing unverified statistics | Admiralty credibility scoring (Section 3) |
| Mistaking noise for signal | Five-filter credibility check (Section 3) |
| Publishing outdated content as current | Temporal classification (Section 4) |
| Confirmation bias | ACH contradiction handling (Section 5) |
| False confidence from source echo chambers | Independent triangulation (Section 1) |
| TGWriter lacking structured input | Research brief format (Section 6) |

The PostResearcher agent prompt (Section 7) operationalizes the full methodology into a repeatable production step.

---

*Sources consolidated: Admiralty Code, ACH (CIA Heuer), OSINT Times temporal analysis, SOS Intelligence evaluation framework, Google Trends velocity methodology, Knowlesys credibility scoring.*
