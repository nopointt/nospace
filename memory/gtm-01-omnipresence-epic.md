# GTM-01 — Omnipresence Launch (cross-project)
> Layer: L3 | Epic: GTM-01 | Status: 🎯 NEXT | Scope: cross-project
> Created: 2026-04-23 (Axis session 6, continuing autonomous CTX-14)
> Owner: Axis. Consumer: all 4 product leads (Vault, Contexter, Harkly, Nomos).

---

## Goal

Coordinated public presence for all Contexter-orbit products across every high-ROI platform in a single structured campaign. One epic to run once properly, so we don't come back to "wait, did we list on Peerlist yet?" a month from now.

**Target outcomes (90 days):**
- `contexter-vault` — 5,000 GitHub stars, 500+ weekly npm downloads
- `Contexter` — 100 supporters × $10 (per CTX-10), inbound trial signups
- `Harkly` — 5-10 pilot B2B conversations (CX/CSM buyer audience)
- `Nomos` — 1,000+ newsletter/blog subs (retail crypto self-custody)
- 30+ external mentions across press/influencers
- 5+ platforms with listing + profile for each product (matrix: product × platform)
- Blog engine producing 1 post/week sustained

## Scope Boundaries

**IN:**
- Coordinated launch waves T-0 to T+90
- Per-platform onboarding x per-project matrix (up to 28 profiles for Tier 1)
- Content production (3 blog posts for vault + 2 for each other product)
- Directory submissions (Tier 2 dev + Tier 3 AI)
- Regional presence (RU/Habr/Vc.ru where project-fit)
- Influencer + press outreach (~15 target list)
- Demo assets (GIF, video, press kit)
- HN Show HN x2 events (primary + V-08 relaunch)

**OUT:**
- Paid advertising (D-GTM01-06)
- Sales funnel / automated outreach (manual per-recipient only)
- Telegram/Discord bot automation
- Translation into more than 1 RU language pair
- Patreon / GitHub Sponsors / crowdfunding setup (deferred, separate)

## Active Decisions (locked)

| ID | Decision |
|---|---|
| D-GTM01-01 | Epic coordinator = Axis. Sub-specialists (lead-seo, lead-copywriting, lead-market-analysis) executed per wave via G3 pairs where spec-heavy. |
| D-GTM01-02 | Primary language = English. Secondary RU only for Habr/Vc.ru and only for projects with RU-market fit (Harkly, Contexter). Vault = English-only. Nomos = English + RU. |
| D-GTM01-03 | Single source of truth per project: own domain (`blog.contexter.cc` for Contexter/Vault articles, `harkly.io/blog` for Harkly if exists, `nomos.pro/blog` or dedicated). Cross-posts ALWAYS carry `rel=canonical` back to original. |
| D-GTM01-04 | Platform accounts created under individual nopoint identity + product-branded where available. No fake accounts, no sockpuppet upvoting, no astroturfing. |
| D-GTM01-05 | Vault launch is the anchor — first HN Show HN, other projects piggyback on reputation signal after. |
| D-GTM01-06 | No paid ads first 90 days. Organic + influencer outreach only. Proves PMF before burning. |
| D-GTM01-07 | Quality > velocity: every post/submission goes through Редакция (Layer 1+2 mandatory, Layer 3 external claims). Broken submissions = pause wave + fix before continuing. |
| D-GTM01-08 | Per-platform posting handbook (posting-guide-{platform}.md) created BEFORE first use for that platform. Never "wing it". |
| D-GTM01-09 | All assets versioned in git (blog posts, Twitter threads, press kit). Copy changes = commit. Nothing copy-pasted ad-hoc. |
| D-GTM01-10 | Cross-post timing: primary publish → minimum 48h delay before cross-posts → all cross-posts carry canonical → monitor Google indexing before next cross-post to avoid dupe-filter. |
| D-GTM01-11 | No mass submission bursts to AI directories same day. Paced 3-5/day max to avoid pattern-flag. |
| D-GTM01-12 | HN Show HN submits = Tuesday 9am ET slot only. Single shot → V-08 Desktop relaunch = second shot Day 30-45. |
| D-GTM01-13 | Per-project analytics: unified tagging strategy. Every external link carries UTM (utm_source=<platform>, utm_medium=<channel>, utm_campaign=<wave>). CF Web Analytics + project-specific PostHog (CTX-11). |
| D-GTM01-14 | Founder voice (nopoint) = authentic first-person, honest-about-tradeoffs, technical-specific. No corporate PR speak. TOV per `brand/tov.md` for Vault; parallel TOVs drafted per project as needed. |
| D-GTM01-15 | Rollback safety: every submission that gets flagged/rejected on any platform = immediate document in `gtm-rejections.md` + cooldown period + revised approach before re-submit. No repeated spam. |
| D-GTM01-16 | **Cross-platform thread bridging** — separate ongoing tactic. Two patterns: (A) Hot HN thread → start matching Reddit post (or vice versa) ONLY when target sub has no existing thread on the topic AND our post adds angle not covered upstream. (B) Same topic has threads on both platforms → comment on one with a distilled summary of the other's best points (attribution-first: "from the HN thread: [summary]"). Hard rules: (1) search both platforms first with 3 query variants to confirm no existing bridge; (2) never just drop a link — always add an original insight or summary paragraph; (3) check target sub rules for cross-link tolerance (r/programming ok, r/ClaudeAI ok, r/LocalLLaMA case-by-case, r/technology strict); (4) max 1 bridge per day per account to avoid pattern-flag; (5) bridges NEVER promote our own products — only topic discussions. Log every bridge attempt in `gtm-cross-platform-bridges.md` with: source URL / target URL / added value / response quality. |
| **D-GTM01-17** | **T-0 LOCKED = 2026-04-29 09:00 ET = 14:00 UTC (Tuesday).** Arxiv study of 138 HN repo launches confirmed optimal slot. One shot — Primary HN submission, all other Wave 1 actions anchored to this. |
| **D-GTM01-18** | **HN post v2 per DEEP-01.** Title LOCKED: `Show HN: I built a local proxy that strips API keys from Claude Code before they reach Anthropic` (primary) + backup available. v1 draft REJECTED (AI-tool+compliance framing = Watchtower fate: 4 points / 1 comment). Body 280 words opens with NDA moment. First comment pre-empts #1 objection (mike-cardwell "if AI can use it, it can read it" from HN #46605155) BEFORE others raise it. Source: `docs/research/gtm-platforms-deep-01-hn-show-hn.md`. |
| **D-GTM01-19** | **HN karma reality: target 25-30 by T-1 (Apr 28), not 250 "safe threshold".** DEEP-01 confirms 250 unreachable in 6 days. Mitigation: quality comments daily + verify account age ≥ 2 weeks + green-username check. Structural risk accepted. |
| **D-GTM01-20** | **Reddit karma gate is #1 blocker per DEEP-02.** `Cute_Baseball2875` at 6 karma = below threshold for 6 of 7 target subs. Critical path Apr 24-28: comment-farm to 50+ karma (3-5 r/ClaudeAI, 2-3 r/LocalLLaMA, 1-2 r/selfhosted/r/devops). Mandatory: **verify account email** to boost CQS tier (Low → Low-Moderate+). Source: `docs/research/gtm-platforms-deep-02-reddit-strategy.md`. |
| **D-GTM01-21** | **Reddit wave RE-SEQUENCED — NOT same-day.** Per DEEP-02 revised timing: r/ClaudeAI (D-0 11:00 ET, existing foothold) → r/LocalLLaMA (D-0 12:30 ET, 90 min stagger) → r/selfhosted (D+1, Contexter primary) → r/devops (D+2, CI/CD angle) → r/privacy (D+4, waits for karma) → r/netsec (D+7, only if 100+ karma + research writeup not product post) → r/programming (D+14, ONLY if LLM ban lifted AND 200+ karma, check D-1). Replaces D-V09-22 same-day wave plan. |
| **D-GTM01-22** | **Reddit per-sub body rewrite MANDATORY.** NEVER copy-paste same body across subs (Reddit duplicate detection = ban cascade). Each sub gets different angle: r/ClaudeAI = builder story + Claude-specific pain point; r/LocalLLaMA = contrarian technical claim ("I chose AES-256-GCM over libsodium secretbox, was that right?"); r/privacy = loss framing, consumer-oriented; r/netsec = 500+ word technical research writeup with tool as appendix; r/devops = CI/CD operational risk framing; r/selfhosted = Contexter self-hosted RAG with Docker Compose pattern. DO NOT use words "solution/platform/SaaS/startup" on r/ClaudeAI. Exact bodies in DEEP-02 Layer 6. |
| **D-GTM01-23** | **r/programming = conditional SKIP.** Temporary LLM content ban (started April 2026, "2-4 week trial"). Check D-1 (Apr 28) for ban status. If active → skip for launch wave. If lifted + karma ≥ 200 → blog #2 SSE algorithm article (title MUST NOT mention Claude/AI/LLM — frame as networking protocol piece). |
| **D-GTM01-24** | **MCP directory track per DEEP-03 — NEW high-ROI channel for Contexter.** 8 directories + Anthropic Connector Directory identified. Submission order: Phase 1 Week 1 (Official MCP Registry → auto-propagates, PulseMCP, mcp.so); Phase 2 Week 1-2 (Glama auto-indexes annotations, Smithery CLI, awesome-mcp PRs); Phase 3 Week 3-6 (Anthropic Connector Directory — millions of Claude.ai users if approved). Expected 500-900 visitors/month base case + 200-1000/month with Anthropic approval. Source: `docs/research/gtm-platforms-deep-03-mcp-directories.md`. |
| **D-GTM01-25** | **3 Contexter MCP blockers before any directory submission** (per DEEP-03): (1) add `title` field to ALL 15 tools в `src/routes/mcp-remote.ts` — Anthropic review criteria explicitly requires it, blocker rejection; (2) fix `SERVER_INFO` — currently only `{name, version}`, missing `description` field sent during MCP `initialize` handshake; (3) draft public privacy policy covering data collection/usage/retention — required by Anthropic + baseline credibility everywhere. Also: create public GitHub repo (required by Official Registry + Anthropic rejects closed-source). |
| **D-GTM01-26** | **Corrected MCP tool count: 15 (not 12).** Source-verified from `src/routes/mcp-remote.ts`: search_knowledge, list_documents, get_document, add_context, upload_document, delete_document, get_document_content, ask_about_document, get_stats, create_share, summarize_document, rename_document, create_room, list_rooms, get_room_stats. Update all references in GTM-01 + contexter-about.md. |
| **D-GTM01-27** | **Product Hunt reality per DEEP-01/SEED-01:** not primary acquisition — one launch for DR 91 backlink + AI-discovery multiplier (LLMs recommend tools they've indexed — AI traffic +527% Jan-May 2025). Featured rate dropped 66% since 2023 (47/day → 16/day). One shot, not bet-heavy. Acquisition weight re-distributed to HN + MCP directories + Indie Hackers. |
| **D-GTM01-28** | **Indie Hackers upgraded to primary acquisition channel** per SEED-01 finding: **7.5x conversion rate vs PH (23.1% vs 3.1%).** Requires sustained 4-6 month presence, not single launch event. Primary fit: Contexter + Harkly (bootstrapped builder narrative), secondary Vault. Wave 2+ sustained cadence required. |
| **D-GTM01-29** | **r/LocalLLaMA winning formula** per DEEP-02 confirmed example (Patent Search AI, March 2026, 65 upvotes + 20 comments in 2 hours): "Big number + specific hardware + contrarian technical choice + 'then built' + practical outcome + zero-log architecture." Vault post template: "My Claude Code was sending API keys in plaintext — built a local proxy (500 LOC Bun, AES-256-GCM) — chose AES-256-GCM over libsodium secretbox, was that right?" Contrarian debate angle = 3x engagement per sub data. |
| **D-GTM01-30** | **r/netsec posting = research writeup, NOT product announcement.** 500+ words technical audit of threat model, tool as appendix, not CTA. Posting framing: "I investigated ANTHROPIC_BASE_URL request chain and found [finding], here's methodology + PoC implementation." Karma gate 100+ required. Timing D+7 earliest. If karma not reached by D+7, skip for this launch cycle and revisit with v0.3 Desktop release. |
| **D-GTM01-31** | **LinkedIn = professional anchor for B2B Contexter inquiries + recruiter discovery + founder credibility.** Separate voice from X (no irony, longer-form). Headline Variant 1 locked (148 char product-led). About section ~1100 chars. T-0 launch post = long-form essay (1800 chars), distinct copy from X tweet thread. Cadence post-launch 1-2 posts/week, types = build-in-public milestone / technical mini-essay / monthly founder reflection / industry observation. Drafts in `docs/gtm/linkedin-profile-drafts.md`. |

---

## Phase Structure — 9 Waves (T-0 through T+90)

Timing anchored to **T-0 = HN Show HN submit day** (target Tuesday 2026-04-29 09:00 ET = 21:00 MSK). Calendar below assumes that T-0.

### Wave 0 — Pre-launch foundations (T-6..T-1, 2026-04-23..2026-04-28)

**Goal:** Ship everything that needs to be live BEFORE Day 0.

**Tasks:**
1. **CTX-14 ship finalize**
   - Action: Merge `feat/astro-migration` → main; complete DNS; Web Analytics; Lighthouse 95+ check
   - Verify: `curl -sI https://vault.contexter.cc` + `curl -sI https://blog.contexter.cc` = 200; Lighthouse CI JSON reports 95+ on all 4 metrics on both domains
   - Done: both domains live with HTTPS + analytics active
2. **V-09 launch asset QA**
   - Action: re-check all assets for current metrics (GitGuardian stat, CVE reference) + run Редакция on updated versions + Twitter thread em-dash fix
   - Verify: `contexter-vault check --surface {each}` returns PASS for every asset; 0 em-dashes body-density; 0 TOV violations
   - Done: HN post + 7 Reddit drafts + 11 tweets + 5 awesome-list submissions + console.dev email all Redaction-PASS
3. **GitHub repo polish (Vault)**
   - Action: Enable Discussions; add 7 topic tags (`claude-code`, `claude-code-proxy`, `ai-security`, `secrets-management`, `bun`, `mcp-security`, `llm-proxy`); add SECURITY.md + CODE_OF_CONDUCT.md check; pin 3 key issues; star-count badge in README
   - Verify: `gh api repos/nopointt/contexter-vault` returns `has_discussions: true`, `topics: [...7 tags]`, `security_and_analysis.secret_scanning.status = "enabled"`
   - Done: GitHub checklist complete
4. **HN karma continue warmup**
   - Action: 2 thoughtful comments/day on tech threads (per warmup cheatsheet)
   - Verify: `curl https://news.ycombinator.com/user?id=nopointtttt | grep karma` — target ≥ 25 by T-1
   - Done: karma ≥ 25
5. **Reddit karma continue**
   - Action: 1-2 quality comments per target sub per 48h
   - Verify: karma ≥ 15 across active subs
   - Done: karma ≥ 15
6. **Demo GIF produce**
   - Action: asciinema recording of `contexter-vault init → add → Claude chat redacted view`
   - Verify: `asciinema play {file.cast}` renders, converted to animated SVG/GIF <15s, <500KB
   - Done: GIF embeddable in HN comment + README + tweets
7. **Press kit skeleton**
   - Action: `nospace/brand/press-kit/` — logo SVG/PNG, 4 screenshots, 1-paragraph pitch, 30-word & 100-word summaries, founder quote
   - Verify: `ls nospace/brand/press-kit/*.{svg,png,md}` returns ≥ 8 files
   - Done: press kit linkable from blog
8. **UTM scheme lock**
   - Action: `docs/gtm/utm-scheme.md` — every outbound URL uses `?utm_source=<platform>&utm_medium=<channel>&utm_campaign=gtm-01-wave-{N}`. Platforms catalogued per D-GTM01-13.
   - Verify: file exists, all 5 waves have distinct utm_campaign values
   - Done: Axis uses scheme for every external link

### Wave 1 — T-0 Primary launch (2026-04-29, single day)

**Goal:** Hit HN front page OR top-20 sustained 4+ hours. Coordinated Reddit wave. Twitter thread live.

**Schedule (Tuesday, ET):**
- 09:00 — HN Show HN submit (post title A variant per D-V09-18)
- 11:00 — r/ClaudeAI post (wait for HN to settle)
- 13:00 — Twitter thread published (11 tweets)
- 13:02 — r/LocalLLaMA post
- 13:05 — Claude Discord #show-and-tell
- 14:00 — Ring 1 influencer DMs sent (5 accounts from outreach list)
- 15:00 — HN engagement wave — respond to every top-5 comment within 30min
- 17:00 — r/selfhosted post (different audience, no conflict)
- 20:00 — End-of-day status capture (stars, downloads, HN rank, Reddit upvotes)

**Verify:**
- HN: `curl -s https://news.ycombinator.com/item?id=<post_id> | grep rank` — target ≤ 30 for ≥ 4h window
- Reddit: each sub post with upvote ratio ≥ 80%, comment count ≥ 5 within 2h
- Twitter: thread impressions > 10K by EOD (reasonable organic first-day)
- GitHub stars: `gh api repos/nopointt/contexter-vault --jq .stargazers_count` — target ≥ 300 by EOD

**Done when:**
- HN ended Day 0 with ≥ 100 points OR front-page achieved
- Reddit posts x4 all survived 24h without removal
- Twitter thread pinned
- GitHub stars ≥ 300 day-0

### Wave 2 — Amplification (T+1..T+7, 2026-04-30..2026-05-05)

**Goal:** Convert Day 0 viewers to stars + sustain momentum.

**Tasks:**
1. `r/programming` post (SSE redaction algorithm angle) — Day 2 (Thursday)
2. Product Hunt submit (Vault) — Day 7 (Tuesday)
3. Indie Hackers founder journey post — Day 3
4. Blog post #2 draft: "How SSE redaction works" — target publish Day 7
5. Blog post #1 cross-posts: dev.to + Medium + Hashnode + HackerNoon (all with canonical)
6. Influencer DM wave 2 (5 more accounts)
7. awesome-lists submissions — 5 PRs (awesome-claude-code, awesome-mcp, awesome-selfhosted, awesome-privacy, awesome-developer-tools)
8. Dev.to profile + first cross-post
9. console.dev email (relink newsletter)
10. LinkedIn personal post announcing launch

**Verify:**
- `gh api repos/nopointt/contexter-vault --jq .stargazers_count` ≥ 800 by T+7
- npm weekly downloads ≥ 200 by T+7
- 5 awesome-lists PRs opened (at least 1 merged)
- Product Hunt top-20 of day

**Done:**
- Cross-posts live with canonical URLs
- Blog post #2 published
- Stars ≥ 800

### Wave 3 — Tier 1 presence saturation (T+7..T+14)

**Goal:** Every project has account + initial post on every Tier 1 platform.

**Matrix** (product × platform):

| Platform | Vault | Contexter | Harkly | Nomos |
|---|---|---|---|---|
| Dev.to | ✓ account + 1 post | ✓ account + 1 post | — (B2B bad fit) | — |
| Hashnode | ✓ | ✓ | — | — |
| Medium | ✓ | ✓ | ✓ | ✓ |
| Twitter/X | ✓ thread | ✓ thread | ✓ | ✓ |
| LinkedIn (personal) | ✓ post | ✓ post | ✓ (primary) | ✓ |
| LinkedIn (company page) | — | — | ✓ | — |
| Indie Hackers | ✓ journey | ✓ journey | ✓ | ✓ |
| Product Hunt | ✓ (done Wave 2) | scheduled T+21 | — | scheduled T+30 |

**28 touchpoints total.** Each has spec = `docs/gtm/posting-guides/{platform}.md` with:
- Account creation checklist
- First-post template (adapted per project)
- Photo/cover specs
- Tag conventions
- Cross-post canonical rules
- Expected response timing

**Verify per touch:** Account live + at least 1 post with correct canonical + UTM link back.

**Done:** Matrix 28/28 complete OR documented skip reason per cell.

### Wave 4 — Tier 2 dev directories (T+14..T+21)

**Tasks:**
1. `alternativeto.net` — Vault vs Formal.ai/mitmproxy + Contexter vs Pinecone/Vectara
2. `Libraries.io` — verify auto-listing from npm; add maintainer info
3. `Peerlist` — profile + products for all 4
4. `Uneed.best` — submit Vault + Contexter
5. `SaaSHub` — Contexter + Harkly
6. `StackShare` — Contexter stack listing
7. `awesome-lists` round 2 (awesome-claude-tools, awesome-typescript)

**Verify:** Submissions confirmed in each platform; profile links working.

**Done:** 10+ Tier 2 listings live.

### Wave 5 — Tier 3 AI directories (T+21..T+28)

**Note:** Many AI directories are low-signal. D-GTM01-11 paces submissions.

**Target directories:**
- Futurepedia, There's An AI For That, Futuretools.io, Toolify.ai, TopAI.tools, AItool.report, AITools.fyi

**Per-platform check (before submit):**
- DA > 40? (MOZ metric)
- Traffic > 100K/month? (SimilarWeb)
- Charges for submission? Free tier exists?
- Requires backlink? (rejects if no)
- Review time?

**Only submit if:** Free + DA > 40 + no shady backlink requirement.

**Verify:** 5+ submissions accepted (some reject, some charge).

**Done:** 5+ live listings across AI directories.

### Wave 6 — Long-form content (T+28..T+45)

**Tasks:**
1. Blog post #3 draft — "Extending vault to Claude Desktop (V-08 angle)" — target publish Day 45 aligned with HN #2
2. HackerNoon cross-post blog #1 + blog #2 (with canonical)
3. Blog post on contexter.cc (CTX side) — product narrative
4. Dev.to in-depth technical blogs x2 (original content or cross-post)
5. Substack setup — newsletter infrastructure
6. First newsletter draft (launch retrospective)

**Verify:** 3+ blog posts live on own domain; 4+ cross-posts with canonical; newsletter account active.

**Done:** Content engine producing at 1 post/week sustained rate.

### Wave 7 — HN Show HN #2 + regional (T+45..T+60)

**Tasks:**
1. HN Show HN #2 — "now works with Claude Desktop (HTTPS MITM explainer)" — Tuesday T+45..60
2. Habr post — Harkly or Contexter (RU audience)
3. Vc.ru post — Harkly/Nomos
4. r/LocalLLaMA re-engagement with V-08 Desktop angle
5. MCP server registry submit (Contexter)
6. Claude Discord V-08 announce
7. LocalLLaMA Discord V-08 announce

**Verify:** HN #2 ≥ 50 points; regional posts receive engagement (comments ≥ 10 Habr, ≥ 5 Vc.ru).

**Done:** Regional presence + niche channels coverage complete.

### Wave 8 — Sustain + outreach (T+60..T+90)

**Tasks:**
1. Weekly changelog posts (every Friday, both blogs)
2. Issue/PR response <24h always
3. Influencer DM follow-up — every 7 days for non-responders
4. Press kit distribution to 5 dev-focused outlets (The Register Developer, Console.dev recurring, etc)
5. Monthly retrospective blog post
6. Quarter-end announcements (V-08 Desktop if shipped)

**Verify:** 4+ weekly changelog posts live; press outreach sent to ≥ 5 outlets.

**Done:** Sustained content cadence + outreach loops alive.

---

### Ongoing track — Cross-Platform Thread Bridging (per D-GTM01-16)

**Not time-boxed. Runs parallel to all waves from T+7 onwards (once baseline karma established).**

**Operational loop:**

1. **Scan (daily, 10-15 min):**
   - Top 30 of HN (threads that match our topic map: AI infra, LLM security, self-hosted tooling, dev workflows, privacy)
   - Hot posts of 7 target subs (r/ClaudeAI, r/LocalLLaMA, r/selfhosted, r/netsec, r/programming, r/privacy, r/sideproject)
   - Log discovered threads in `docs/gtm/thread-watch.md` with: platform, URL, topic, candidacy (summary / new-post / skip)

2. **Decide per candidate:**
   - **Summary comment** if a bridge thread exists on the other side — post a distilled digest of the other platform's best points as a standalone valuable comment (no product drop)
   - **New post** if no bridge exists AND target sub permits cross-sourced topics AND we have a unique angle
   - **Skip** if: controversial topic (avoid reputation risk), product-drop temptation too high, sub rules forbid, our account lacks karma for the sub

3. **Execute:**
   - Run target text through Редакция (Layer 1+2)
   - Verify no `contexter-vault` / `Contexter` / `Harkly` mention (bridges are NEUTRAL — separate from product launch)
   - Post with 1-2 sentence attribution header ("From the HN thread [URL]: [summary]")

4. **Track impact:**
   - Upvote ratio after 6h, 24h, 7d
   - Any reply engagement
   - Any karma/credibility shift observed

**Verify (monthly):** `docs/gtm/gtm-cross-platform-bridges.md` has ≥ 4 bridge entries per month; net karma delta on each account positive.

**Done when:** Steady bridge cadence (4-8 per month across both accounts), no flagged posts, measurable reputation signal (comment karma trend up, autoflag rate down).

**Topic map (initial seed):**
- AI coding tools workflow + debugging
- LLM + code review automation
- Self-hosted AI infra
- Privacy/secrets in developer tooling
- MCP / agent protocol discussions
- Open source vs hosted developer tool tradeoffs

Expand topic map in `docs/gtm/thread-watch.md` as new themes emerge organically.

---

## Acceptance Criteria

| ID | Criterion | Verify | Target |
|---|---|---|---|
| AC-1 | Vault GitHub stars | `gh api repos/nopointt/contexter-vault --jq .stargazers_count` | ≥ 5000 by Day 90 |
| AC-2 | Vault npm weekly downloads | `npm-stat --pkg contexter-vault` | ≥ 500/week by Day 60 |
| AC-3 | HN front page (top 30) | HN archive | Hit ≥ 1 time for Vault launch |
| AC-4 | Product Hunt top-10 of day | PH post stats | ≥ 1 project achieves |
| AC-5 | Tier 1 matrix complete | `docs/gtm/tier1-matrix.md` cells filled | ≥ 24 of 28 live (others skip-documented) |
| AC-6 | Tier 2 directory listings | catalog file | ≥ 10 live |
| AC-7 | Tier 3 AI directory listings | catalog file | ≥ 5 live |
| AC-8 | Blog posts on own domain | blog.contexter.cc post count | ≥ 3 |
| AC-9 | External mentions (not paid) | mention log `docs/gtm/external-mentions.md` | ≥ 30 |
| AC-10 | Cross-posts with canonical | each post has `rel=canonical` to own domain | 100% |
| AC-11 | UTM tagging compliance | Random sample of 10 outbound links | 10/10 have UTM |
| AC-12 | Редакция pass rate on outbound | Redaction log | 100% (D-GTM01-07) |
| AC-13 | No rejected/flagged posts | `gtm-rejections.md` | 0 or investigated+mitigated |
| AC-14 | Platform posting guides | `docs/gtm/posting-guides/*.md` | ≥ 1 per platform used |
| AC-15 | Press kit complete | `brand/press-kit/` | logo + 4 screenshots + 2 pitch sizes + founder quote |

## Dependencies

- ✅ CTX-14 vault.contexter.cc + blog.contexter.cc LIVE (blocker for Wave 0-1)
- ✅ `contexter-vault@0.2.0` on npm
- ✅ V-09 assets drafted (HN post, Reddit, Twitter thread, awesome-lists)
- ⬜ Twitter/X account + LinkedIn company page (create Wave 0)
- ⬜ Demo GIF (Wave 0)
- ⬜ Press kit (Wave 0)
- ⬜ UTM scheme locked (Wave 0 task 8)
- ⬜ Per-platform posting guides — created just-in-time Wave 3+

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| HN flop (no front page Day 0) | HIGH | V-08 relaunch Wave 7; HN archive still indexes good posts long-tail |
| AI-directory rejection mass | MED | D-GTM01-11 paced submissions; D-GTM01-15 rejection log prevents spam pattern |
| Twitter thread caps (algorithm suppression on links) | MED | First tweet no link; link in reply; longer-form on Medium cross-post |
| Influencer non-response (cold DM) | MED | 3-wave follow-up over 21 days; personalized; no templating tell |
| Content burnout (3 blogs + cross-posts + weekly changelog) | MED | Pre-draft batch in Wave 2; editorial calendar |
| Platform ToS change mid-campaign | LOW | Archive all posts locally before submit |
| Dupe content penalty (SEO) | MED | D-GTM01-10 canonical enforcement + 48h delay minimum |
| Reddit AutoMod shadowban | MED | Warmup karma already underway; per-sub pace limits; avoid self-promo patterns |
| Project attention split (vault priority vs Contexter/Harkly parallel) | HIGH | D-GTM01-05 Vault-first; other projects get scaffolded presence, deep launch deferred |

## Write Authority

| File | Owner |
|---|---|
| `nospace/memory/gtm-01-omnipresence-epic.md` (this L3) | Axis |
| `nospace/memory/gtm-01-autonomous-report.md` | Axis (append-only per J4) |
| `nospace/docs/gtm/posting-guides/*.md` | Axis + lead-copywriting per platform |
| `nospace/docs/gtm/external-mentions.md` | Axis — append-only |
| `nospace/docs/gtm/gtm-rejections.md` | Axis — append-only |
| `nospace/docs/gtm/utm-scheme.md` | Axis |
| `nospace/docs/gtm/tier1-matrix.md` | Axis — matrix tracker |
| `nospace/docs/research/gtm-platforms-*.md` | SEED/DEEP research subagents |
| `nospace/brand/press-kit/**` | Axis + lead-visual-design |
| Platform-specific content (blog posts, threads, issue drafts) | Axis + lead-copywriting |
| Wave progress chat reports | Axis only |

## Sub-epics / linked work

| Link | Relationship |
|---|---|
| `development/contexter-vault/memory/contexter-vault-v9.md` | V-09 = GTM-01 Wave 0-2 execution for Vault |
| `development/contexter/memory/contexter-astro-blog.md` | CTX-14 = Wave 0 infra prerequisite |
| `development/contexter/memory/contexter-gtm-launch.md` | CTX-10 = GTM-01 Contexter-specific execution |
| `development/contexter/memory/contexter-reddit-gtm.md` | CTX-13 = Contexter Reddit track within GTM-01 |
| `development/contexter-vault/memory/contexter-vault-v8.md` | V-08 Desktop = pre-req for HN Show HN #2 (Wave 7) |

## Research track

### Completed (2026-04-23)

| ID | Topic | File | Key findings → decisions |
|---|---|---|---|
| **SEED-01** | GTM platforms landscape (31 queries, 51 sources) | `docs/research/gtm-platforms-seed-01.md` | MCP directories new #1 Contexter channel (D-GTM01-24); IH 7.5x PH conversion (D-GTM01-28); PH primary-for-backlink (D-GTM01-27); AI traffic +527%; RAGHub + daily.dev + Lobste.rs surfaced |
| **DEEP-01** | HN Show HN playbook Vault-specific | `docs/research/gtm-platforms-deep-01-hn-show-hn.md` | T-0 LOCKED 2026-04-29 09:00 ET (D-GTM01-17); title v2 locked (D-GTM01-18); pre-empt objection in first comment; karma 25-30 realistic (D-GTM01-19); Watchtower anti-pattern |
| **DEEP-02** | Reddit 7 subs submission strategy | `docs/research/gtm-platforms-deep-02-reddit-strategy.md` | CQS + email verify mandatory (D-GTM01-20); karma gate #1 blocker; Reddit wave RE-SEQUENCED over D0-D14 (D-GTM01-21); per-sub body rewrite mandatory (D-GTM01-22); r/programming conditional skip (D-GTM01-23); r/LocalLLaMA contrarian formula (D-GTM01-29); r/netsec research-writeup (D-GTM01-30); Hot Score math; exact bodies per sub |
| **DEEP-03** | MCP directories submission Contexter | `docs/research/gtm-platforms-deep-03-mcp-directories.md` | 8 directories ranked Phase 1-3 (D-GTM01-24); 3 blockers before submission (D-GTM01-25); 15 tools corrected count (D-GTM01-26); Context7 success pattern analyzed; Anthropic Connector Directory = highest-ROI surface |

### Pending / future waves

- **DEEP-04**: PH launch checklist (given new algorithm 10% featured rate, post-Wave 2 need)
- **DEEP-05**: Indie Hackers sustained 4-6 month engagement strategy (D-GTM01-28 elevated)
- **DEEP-06**: Habr + vc.ru Russian content strategy (Harkly/Contexter RU, Wave 7)
- **DEEP-07**: Kazakhstan Telegram channels for Nomos (Wave 7 — KZ "Eurasia's crypto hub" opportunity per SEED-01)
- **DEEP-08**: Influencer outreach list — 15 targets with personalized angles (Wave 2-3)
- **DEEP-09**: TAAFT $347 ROI audit — worth paid vs free X thread (Wave 5)

Each research output = `nospace/docs/research/gtm-{id}-{topic}.md` incremental writes (E6).

## Decision Log (append-only)

- **2026-04-23 (session 6):** GTM-01 epic opened. 15 decisions locked. 9 waves + 9 research items. Scope = 4 projects × 6 tiers = ~76 atomic tasks plus wave-level coordination. Anchor = HN Show HN 2026-04-29 T-0. Quality > velocity (D-GTM01-07). Full Редакция pipeline mandatory on every outbound.
- **2026-04-23 (session 6, later):** SEED-01 + DEEP-01 + DEEP-02 + DEEP-03 complete. 14 new decisions locked (D-GTM01-17..30). Major updates: T-0 timing confirmed (LOCKED 2026-04-29 09:00 ET); HN post v2 replaces v1 (Watchtower anti-pattern avoided); Reddit wave RE-SEQUENCED over D0-D14 (not same-day); MCP directories new primary track for Contexter with 3 code blockers identified; Indie Hackers upgraded vs PH (7.5x conversion); PH demoted to one-launch-for-backlink; r/programming conditional skip due to LLM ban; 15 MCP tools count corrected.
- **2026-04-25 (session 250):** Content Factory pipeline shipped как multi-tier OSINT model. HN + Reddit correspondent agents production tested first cycle (21:00 UTC evening digest). First master blog post written (1620 words, all editorial gates pass). 8 D-CONTENT decisions locked (correspondents architecture, voice rules, length cap, asymmetric Bauhaus weighting, Gemini API as synthesis-only layer, 2-pass triangulation, r/programming LLM ban LIFTED verified, design system existing). 8-correspondent roadmap planning artifact written. Pencil content factory v1 visualization built. Triangulation v1/v2 iterations completed — Pass 1 structural success, Pass 2 (Deep Research enrichment) deferred. **GTM-01 status:** T-0 = 2026-04-29 09:00 ET, T-3 days remain. Reddit warmup, MCP directory submissions, content factory daily cycles становятся pre-launch infrastructure.
- **2026-04-25 (session 251):** Editorial Layer 4 shipped — genre macrostructure layer added к 3-layer Редакция. Layer 4 spec at `nospace/development/contexter/content-factory/specs/editorial-layer-4-digest.md` (mode decision tree A/B/C/D + opener types + per-item template + depth distribution NEVER 33/33/33 + closing valve mandatory + Russian rubric grid + 7 anti-patterns). Sub-layers: 4.1 англицизмы фильтр (19-term replacement table) + 4.2 non-tech reader filter (PM-test). Master article process documented at `content-factory/specs/master-article-process.md` (5-stage pipeline). morningDigest + eveningDigest skills locked. 25.04 master post v4 — proof-of-concept mode A meta-thesis «контроль над AI-стеком». 3 D-CONTENT (09/10/11) locked. Reddit karma 7, HN karma 14 — warmup продолжается. **GTM-01 status:** T-0 через 4 дня, content factory готов к daily production cycles.
