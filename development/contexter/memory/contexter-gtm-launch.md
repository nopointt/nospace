---
# contexter-gtm-launch.md — CTX-10 GTM Launch
> Layer: L3 | Epic: CTX-10 | Status: 🔶 IN PROGRESS
> Created: 2026-04-01 (session 225)
> Last updated: 2026-04-01 (session 227 — SEED researches done, plan restructured)
> Deadline: 2026-04-08 (7 days)
> Predecessor: CTX-08 GTM Strategy (CLOSED — positioning + research + landing page)
---

## Goal

100 платящих supporters по $10 за 7 дней (до 08.04.2026). $0 маркетинг бюджет. EN глобальный рынок. Все бесплатные каналы.

## Context

CTX-08 (closed 2026-03-30) дал:
- Positioning: "One memory. Every AI." — white space верифицирован (universal + non-tech = пустой квадрант)
- 14 research files: market landscape, 6 competitor deep dives, user pain research (17 quotes), copy variants (5 EN + 5 RU)
- Product brief: 12-section landing page structure, video script, objection busters, CTA strategy
- Copy audit: 50+ jargon issues найдены, NOT applied
- Financial model: break-even ~100 paying users, ARPU $4.24 (Month 1)

Текущее состояние (после DB cleanup 2026-04-01):
- 2 реальных юзера, 26 документов, 519 чанков
- API: healthy (PG + S3 + Redis + Groq OK)
- Auth: email+password + Google OAuth + Resend DNS verified
- Payments: NOWPayments (crypto) + Halyk bank transfer (мамин счёт)
- Landing: 12+ секций (EN/RU), pricing ($0/$9/$29), pre-order $10
- MCP: 12 tools, Streamable HTTP, tested in Perplexity + Claude.ai
- 0 social accounts, 0 marketing channels, 0 presence

## Key Decisions

- D-01: **$10 = support donation**, not subscription. NOWPayments crypto + Halyk bank transfer. Supporters получат Pro access manually после launch.
- D-02: **EN global market** primary. RU secondary (landing bilingual, but launch content EN).
- D-03: **CTX-08 renamed** to "GTM Strategy" (was "GTM Strategy & Positioning") — no conflict with CTX-10 "GTM Launch".
- D-04: **All free channels**: ProductHunt, HackerNews, Reddit, Twitter/X, MCP directories, IndieHackers, Dev.to, AI Discord/Telegram communities.
- D-05: **Co-founder search** — revenue share model (% от LTV привлечённых юзеров). Platforms: YC Co-Founder Matching, IndieHackers, Twitter/X, AngelList Talent.
- D-06: **Copy audit MUST be applied** before any public launch — jargon kills non-tech conversion.
- D-07: **Analytics** — separate epic (CTX-11), but basic tracking (Plausible/Umami) deployed as part of CTX-10.
- D-08: **Research methodology** — two-phase (SEED 20% → DEEP 80%), save to `nospace/docs/research/` as you go, ≥2 sources per claim, self-check protocol.
- D-32: **Research restructured** — 11 R-topics → 4 SEED domains + 2 targeted DEEPs (Reddit + HN).
- D-33: **LemonSqueezy = primary payment** — MoR, KZ+AR payouts, no entity. Crypto-only kills ~93% conversion.
- D-34: **"Founding Supporter"** framing for $10 (20-30% lift). Counter "X/100 spots" = authentic scarcity.
- D-35: **HN > PH** as primary launch channel (10-30K vs 800-1K visitors, 3-5x conversion). Stagger launches.
- D-36: **First 100 = 70-80 devs** + 20-30 knowledge workers. Dev channels dominate.
- D-37: **MCP directories + GitHub awesome-mcp** PRs = zero-cost, submit before launch.
- D-38: **MCP connection fixed** — Claude.ai was on old workers.dev. Must fix Perplexity too.

## Research Plan

11 research topics. Each = separate file in `nospace/docs/research/`. Follow research-methodology-best-practices.md strictly.

### R1: Zero-Budget SaaS Launch to First 100 Paying Users
- **File:** `contexter-gtm-zero-budget-launch-research.md`
- **Scope:** Real cases of B2C/prosumer SaaS products that got first 100 paying users with $0 budget in 2024-2026. Channels used, timeline, tactics, conversion rates. Special focus on developer tools, productivity tools, AI tools.
- **Anti-scope:** Enterprise sales, paid ads, influencer marketing (paid), outbound cold email.
- **Key questions:** What channels produced the first 100? What was the time from launch to 100? What content/message worked? What failed?
- **Agent:** Sonnet, general-purpose, WebSearch-heavy

### R2: ProductHunt Launch Playbook 2026
- **File:** `contexter-gtm-producthunt-launch-research.md`
- **Scope:** Optimal PH launch strategy in 2026. Preparation timeline, assets required, hunter selection, first comment strategy, upvote dynamics, timing (day, hour). Analyze PH launches of: Supermemory, Mem.ai, Ragie, NotebookLM alternatives, similar MCP/AI tools. What separated top 5 from flops.
- **Anti-scope:** PH for physical products, enterprise SaaS, mobile apps.
- **Key questions:** What day/time is optimal? What makes a PH first comment convert? Should we use a hunter or self-launch? What assets are required (logo, screenshots, video, tagline)?

### R3: HackerNews Show HN Strategy
- **File:** `contexter-gtm-hackernews-launch-research.md`
- **Scope:** Successful "Show HN" posts for AI/developer tools 2024-2026. Format, title patterns, timing, how to engage comments. Posts that got to front page. What killed engagement.
- **Anti-scope:** Regular HN submissions, Ask HN, hiring posts.
- **Key questions:** What title format gets upvotes? When to post (day/hour)? How to handle "why not just use X" comments? Should we show technical details or keep it simple?

### R4: Reddit Community Marketing for AI/SaaS
- **File:** `contexter-gtm-reddit-strategy-research.md`
- **Scope:** Subreddits where Contexter's target audience lives (r/ChatGPT, r/ClaudeAI, r/artificial, r/SideProject, r/startups, r/Entrepreneur, r/MachineLearning, r/productivity). Rules for self-promotion. Successful "I built X" posts. Format that works.
- **Anti-scope:** Reddit ads, bot/astroturfing, karma farming.
- **Key questions:** Which subreddits allow self-promotion? What format (text, link, image)? What gets upvoted vs deleted? How to avoid shadowban?

### R5: MCP Directory & Marketplace Ecosystem
- **File:** `contexter-gtm-mcp-directories-research.md`
- **Scope:** All MCP directories (PulseMCP, mcp.so, glama.ai, smithery, MCPHub, etc.). How to submit, listing requirements, traffic estimates, pricing (free vs paid listing). Which ones drive actual installs.
- **Anti-scope:** Non-MCP directories (Chrome extensions, app stores).
- **Key questions:** Which directories have the most traffic? Submission process? How long from submit to live? Do they drive real installs?

### R6: AI Community Mapping
- **File:** `contexter-gtm-ai-communities-research.md`
- **Scope:** Where non-technical AI users congregate: Discord servers, Telegram channels, Twitter/X communities, Facebook groups, Slack communities, newsletters. Focus on English-speaking communities with >1000 members.
- **Anti-scope:** Developer-only communities (unless they also serve non-tech), <500 member groups.
- **Key questions:** Size, engagement level, self-promotion rules, best way to introduce a product. Which communities are most active in 2026?

### R7: Co-Founder Matching & Revenue Share Models
- **File:** `contexter-gtm-cofounder-matching-research.md`
- **Scope:** Platforms for finding marketing/growth co-founders or partners in 2026. YC Co-Founder Matching, IndieHackers, Twitter/X, AngelList Talent, CoFoundersLab, etc. Revenue share models (% of LTV, affiliate commission, equity). What attracts a marketing person to an early-stage product.
- **Anti-scope:** Full-time hiring, freelancers on Upwork, agencies.
- **Key questions:** Which platform has the highest quality marketing co-founder pool? What's a competitive revenue share offer? How to pitch an unpaid role?

### R8: Content Marketing $0 Budget for AI/Dev Tools
- **File:** `contexter-gtm-content-marketing-research.md`
- **Scope:** SEO strategy for AI/RAG tools. Comparison pages ("Contexter vs NotebookLM"), how-to tutorials, blog posts that drive organic traffic. Dev.to, Medium, Hashnode publishing strategies. Keywords to target.
- **Anti-scope:** Paid content promotion, influencer partnerships, video content (separate topic).
- **Key questions:** Which keywords have traffic + low competition for RAG/AI memory tools? What content format converts free readers to users? Which publishing platforms drive the most referral traffic?

### R9: Free-to-Paid Conversion Optimization
- **File:** `contexter-gtm-conversion-optimization-research.md`
- **Scope:** How prosumer SaaS tools convert free users to paid. Activation metrics, onboarding flow optimization, in-app nudges, email sequences, upgrade CTAs. Special focus on AI tools and knowledge management products.
- **Anti-scope:** Enterprise upsell, sales-led conversion.
- **Key questions:** What's the "aha moment" for products like ours (first successful MCP query)? What's typical free→paid conversion for prosumer SaaS? What nudges work without being annoying?

### R10: $10 Supporter/Pre-Order Model — Payment Friction & Messaging
- **File:** `contexter-gtm-supporter-model-research.md`
- **Scope:** Products that successfully used supporter/pre-order/early bird pricing. Crypto payment friction for mainstream users. How to frame "pay $10 to support" vs "pre-order" vs "early bird". Bank transfer as alternative. Messaging that converts.
- **Anti-scope:** Crowdfunding (Kickstarter/IndieGoGo), ICO/token sales.
- **Key questions:** What's the typical conversion rate for $10 supporter tiers? Does crypto-only hurt or help? How to frame the bank transfer ("мой мамин счёт" angle — endearing or unprofessional)?

### R11: Maximum Seeding — All Platforms & Directories to Register On
- **File:** `contexter-gtm-platform-seeding-research.md`
- **Scope:** Exhaustive list of ALL platforms and directories where an AI/SaaS/developer tool should have a presence in 2026. Goal: maximum surface area. Include obvious AND non-obvious. Categories to cover:
  - **Startup directories:** BetaList, BetaPage, StartupBase, Launching Next, SaaSHub, AlternativeTo, StackShare, G2, Capterra, GetApp, There's An AI For That, FutureTools, TopAI.tools, AI Tool Directory, etc.
  - **Developer directories:** GitHub (README/topics), npm/bun packages, Awesome lists (awesome-mcp, awesome-rag, awesome-ai-tools), Libraries.io, DevHunt
  - **MCP-specific:** PulseMCP, mcp.so, glama.ai, smithery, MCPHub, Composio, official MCP registry
  - **AI tool aggregators:** There's An AI For That, FutureTools, AI Tool Hunt, TopAI.tools, ToolPilot, AI Scout, Futurepedia, AIcyclopedia
  - **Product directories:** ProductHunt (ship page before launch), Crunchbase, AngelList, F6S, Indie Hackers product page
  - **SEO/backlink directories:** free business directories, tech tool comparison sites, "best X" lists that accept submissions
  - **Community profiles:** Reddit, HN, IndieHackers, Dev.to, Hashnode, Medium, Twitter/X, LinkedIn (personal + company page), Mastodon, Bluesky, Threads
  - **Video platforms:** YouTube channel (for future demos), Loom library
  - **Newsletter directories:** Newsletter platforms that feature new tools (Ben's Bites, TLDR, The Rundown AI, etc.) — how to get featured
  - **Unconventional/non-obvious:** Quora answers, Stack Overflow profiles, Wikipedia (if notable), Hacker News "Who is hiring?" threads, Slack communities directory, Discord server directories, Telegram bot directories, Chrome Web Store (if applicable), VS Code marketplace (MCP extension?), Raycast extensions, Alfred workflows
- **Anti-scope:** Paid listings >$50/month. Platforms that require legal entity. Platforms in non-Latin scripts (Chinese, Japanese, Korean — for now).
- **Key questions:** Which platforms are free to register? Which have the most organic traffic for AI tools? Which provide dofollow backlinks (SEO value)? Which have editorial review (slower but higher quality)? What's the optimal order — register on all in one day or stagger? Which platforms auto-cross-post (register once, appear in multiple places)?
- **Output format:** Master checklist table with columns: Platform | Category | URL | Free? | Traffic estimate | Submission process | Backlink? | Priority (P0/P1/P2)

## Waves

### Wave 0: Research (April 1-2)
Restructured from 11 R-topics → 4 SEED domains + 2 targeted DEEPs.

**SEED (completed 2026-04-01):**
- [x] S1: Distribution — where are first 100 paying supporters (channels, communities, audience mapping)
- [x] S2: Launch Mechanics — solo founder coordinated multi-channel launch (timing, assets, sequencing)
- [x] S3: Payment & Conversion — $10 ask framing, payment platform, friction reduction
- [x] S4: Viral Patterns & Cases — 15 case studies, 10 common patterns, non-obvious platforms
- [x] SEED Synthesis — cross-domain findings, priority stack, DEEP plan

**DEEP (planned for 2026-04-01 night):**
- [ ] D-DEEP-1: Reddit post anatomy — r/ChatGPT, r/ClaudeAI successful product posts, format, rules
- [ ] D-DEEP-2: HN Show HN optimization — top 20 MCP/RAG Show HN posts, title patterns, timing
- [ ] Reddit warmup: u/Cute_Baseball2875 (7mo, karma=1). Target 50-100 karma via helpful comments in r/ChatGPT, r/ClaudeAI, r/artificial before launch posts

### Wave 1: Product Readiness (April 1-2)
Fix everything that blocks conversion before going public.

- [ ] W1-01: Apply copy audit — replace ALL jargon (50+ items from contexter-copy-audit.md)
- [ ] W1-02: Playwright full site audit — screenshot every page, identify visual bugs
- [ ] W1-03: Full user flow test — register → upload → MCP connect → query in Claude/Perplexity
- [ ] W1-04: Fix any issues found in W1-02 and W1-03
- [ ] W1-05: Deploy basic analytics (Plausible Cloud free or Umami self-hosted)
- [ ] W1-06: Add "Support Us — $10" page/section with NOWPayments + Halyk bank transfer
- [ ] W1-07: Create Open Graph / social preview meta tags (og:image, og:title, og:description)
- [ ] W1-08: Verify pricing page shows current tiers correctly ($0/$9/$29 + $10 supporter)
- [ ] W1-09: Ensure landing page hero variant is the strongest (test with screenshots)

### Wave 2: Channel Setup (April 2-3)
Create all accounts and prepare launch assets.

- [ ] W2-01: Twitter/X account — profile, bio, header, pin tweet draft
- [ ] W2-02: ProductHunt maker page — logo, tagline, description, screenshots (4-6), first comment draft
- [ ] W2-03: Reddit — warm up account if needed, draft "I built X" posts for 4-5 subreddits
- [ ] W2-04: HackerNews — draft "Show HN" post title + comment
- [ ] W2-05: MCP directories — submit to all (from R5 research)
- [ ] W2-05b: Register on ALL platforms from R11 master checklist (P0 first, then P1, P2)
- [ ] W2-06: IndieHackers profile + launch story draft
- [ ] W2-07: Dev.to — article "I built an AI memory that works with every LLM"
- [ ] W2-08: GitHub README optimization — add badges, demo GIF, clear value prop
- [ ] W2-09: Co-founder search — post on YC Co-Founder Matching, IndieHackers, Twitter
- [ ] W2-10: Email to Artem (ProxyMarket CPO) — demo follow-up, ask for testimonial

### Wave 3: Launch Execution (April 3-5)
Simultaneous launch across all channels.

Day 1 (April 3, Thursday):
- [ ] W3-01: ProductHunt launch (schedule for 00:01 PT)
- [ ] W3-02: Twitter/X launch thread (timed with PH)
- [ ] W3-03: HackerNews "Show HN" post (9-11 AM ET)
- [ ] W3-04: Reddit posts (stagger across subreddits, 2-3 hour gaps)
- [ ] W3-05: IndieHackers launch post
- [ ] W3-06: Dev.to article publish
- [ ] W3-07: Engage with every comment, reply within 30 min

Day 2-3 (April 4-5):
- [ ] W3-08: Follow-up tweets (learnings, stats, behind-the-scenes)
- [ ] W3-09: Cross-post to AI Discord/Telegram communities (from R6 research)
- [ ] W3-10: Direct outreach to people from pain research quotes (if contactable)

### Wave 4: Post-Launch (April 5-8)
Iterate based on feedback, optimize conversion, push to 100.

- [ ] W4-01: Analyze traffic + conversion data
- [ ] W4-02: Collect testimonials from first users
- [ ] W4-03: Write follow-up content based on launch feedback
- [ ] W4-04: A/B hero variant if traffic allows
- [ ] W4-05: Second wave of community posts (different angle/subreddits)
- [ ] W4-06: Comparison articles: "Contexter vs NotebookLM", "Contexter vs Claude Projects"
- [ ] W4-07: Co-founder outreach follow-ups
- [ ] W4-08: Daily progress thread on Twitter/X

## Blockers

- **LemonSqueezy approval pending:** Email sent with demo video + pricing + overview. Store rename Harkly→Contexter requested. BLOCKS payment collection.
- **Perplexity MCP URL:** Still on old workers.dev — needs same fix as Claude.ai (→ api.contexter.cc/sse?token=...).
- **Copy audit not applied:** W1-01 is critical-path — 50+ jargon items on landing page kill non-tech conversion.
- **Solo founder:** All execution on nopoint. Bandwidth = bottleneck.

**Resolved this session:**
- ~~Payment friction: Crypto-only~~ → LemonSqueezy (D-33)
- ~~No video demo~~ → Demo video recorded and sent to LemonSqueezy
- ~~MCP connection broken (Claude.ai on workers.dev)~~ → Fixed to api.contexter.cc

## AC

| ID | Criteria | Verify |
|---|---|---|
| AC-1 | 11 research files completed in `nospace/docs/research/` | `ls nospace/docs/research/contexter-gtm-*-research.md \| wc -l` → 11+ |
| AC-2 | Copy audit applied (0 instances of "чанки", "mcp url", "api токен" in frontend) | `grep -r "чанки\|mcp url\|api токен" web/src/ \| wc -l` → 0 |
| AC-3 | All MCP directories submitted | Manual checklist |
| AC-4 | ProductHunt page live | URL accessible |
| AC-5 | Twitter/X account created with >10 tweets | Manual check |
| AC-6 | HackerNews "Show HN" posted | URL accessible |
| AC-7 | Reddit posts in ≥3 subreddits | URLs accessible |
| AC-8 | Analytics deployed (Plausible/Umami) | Dashboard accessible |
| AC-9 | ≥100 registered users | `SELECT count(*) FROM users` → ≥100 |
| AC-10 | ≥100 supporters ($10 each) | NOWPayments + bank transfer count ≥100 |

## Dependencies

- **CTX-04 (Auth):** Wave 5 deployed and working ✅
- **CTX-08 (GTM Strategy):** All research available ✅ (14 files)
- **CTX-09 (UI/UX Polish):** Landing + app pages polished ✅
- **CTX-11 (Analytics):** Basic deployment part of W1-05, full epic separate

## Research Foundation (inherited from CTX-08)

| File | Content | Relevance |
|---|---|---|
| `contexter-gtm-market-landscape.md` | TAM $2.76-3.33B, MCP de facto standard, 12-18mo window | Market validation |
| `contexter-gtm-synthesis-competitive-map.md` | White space confirmed: universal + non-tech = empty quadrant | Positioning anchor |
| `contexter-gtm-synthesis-positioning.md` | 5 EN + 5 RU hero variants, objection busters, video script | Copy ready for launch |
| `contexter-gtm-v2-nontechnical-pain.md` | 17 user quotes, grief language, workaround patterns | Pain framing for launch content |
| `contexter-product-brief.md` | 12-section landing structure, CTA strategy, copy rules | Implementation blueprint |
| `contexter-copy-audit.md` | 50+ jargon issues found, replacements specified | W1-01 input |
| `contexter-financial-model.md` | Break-even ~100 users, ARPU $4.24 (Month 1) | Target validation |
| `contexter-competitor-sentiment-analysis.md` | User sentiment on competitors | Content angles |
| `content-autopublishing-channels-research.md` | Habr, LinkedIn, Telegram, blog channels | Publishing channel options |
