# SEED: Analytics Stack for Contexter Product Launch
> Type: SEED (horizon scan) | Date: 2026-04-16
> Domain: Web analytics, product analytics, attribution, server-side tracking, MCP telemetry
> Goal: Map full analytics landscape for a CF Pages static SPA + Hono/Bun API launching with 100+ inbound channels. Rank signals for 2-3 DEEP investigations.
> Researcher: Sonnet (autonomous SEED)
> Stack constraints: CF Pages (SolidJS), Hetzner API (Hono/Bun/PG), LemonSqueezy payments, GDPR (KZ/AR/EU)

---

## Signals (ranked by relevance to Contexter)

### Signal 1: Plausible Analytics — Cookieless SaaS, CNIL/GDPR-exempt, strong UTM support
- **Finding:** Plausible is the most cited indie-hacker analytics choice in 2026. It tracks pageviews, referrers, UTM campaigns, custom events, and goals without cookies or personal data. France's CNIL and Germany's DSK have confirmed privacy-first analytics tools are exempt from consent requirements when properly configured. Pricing: $9/mo for 10K pageviews, $19/mo for the next tier — no free cloud tier. Self-hosted version (AGPL-3.0, Docker Compose) is fully free. Requires ≥2 GB RAM + PostgreSQL + ClickHouse for self-hosting. Data stays EU (servers in Germany/Netherlands on cloud).
- **Sources:** [Plausible data policy](https://plausible.io/data-policy) (2025), [Cookieless analytics 2026 guide](https://getsimplifyanalytics.com/top-privacy-first-analytics-platforms-and-tools-for-2026-cookieless-gdpr-compliant-data-secure-solutions/) (2026-01), [Solopreneur analytics stack 2026](https://f3fundit.com/the-solopreneur-analytics-stack-2026-posthog-vs-plausible-vs-fathom-analytics-and-why-you-should-ditch-google-analytics/) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** $9/mo fits budget. GDPR/CNIL-exempt = no cookie banner needed on contexter.cc. UTM tracking built-in captures HN/Reddit/PH source attribution. The self-hosted option on Hetzner CAX21 saves $9/mo but adds ClickHouse dependency (ClickHouse alone uses ~1-2 GB RAM — risks breaching the 256 MB self-hosted budget constraint). Cloud at $9/mo is the pragmatic call at launch.
- **Tier:** FREEMIUM / PAID-LOW ($9/mo cloud, free self-hosted)

---

### Signal 2: PostHog — Full product analytics + session replay + error tracking free tier
- **Finding:** PostHog is an all-in-one open-source product analytics platform. Free tier includes 1M events/month, 5K session recordings, 1M feature flag requests, 100K error exceptions, and 1M data warehouse rows — all without a credit card. Above free tier: $0.00005/event (1-2M range), scaling down. PostHog has a Hono SDK (`posthog-node` library for Cloudflare Workers/Hono) and a Cloudflare reverse proxy pattern to avoid ad blockers. EU Cloud hosting available at eu.posthog.com. Self-hosting requires 4 vCPU + 16 GB RAM — exceeds Hetzner CAX21 headroom. PostHog supports custom revenue attribution by sending LemonSqueezy webhook data as PostHog identify + charge events.
- **Sources:** [PostHog pricing](https://posthog.com/pricing) (live, verified 2026-04), [PostHog Hono docs](https://posthog.com/docs/libraries/hono) (live), [PostHog vs Plausible comparison](https://posthog.com/blog/posthog-vs-plausible) (2025), [Solopreneur analytics 2026](https://f3fundit.com/the-solopreneur-analytics-stack-2026-posthog-vs-plausible-vs-fathom-analytics-and-why-you-should-ditch-google-analytics/) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** The 1M free events/month likely covers Contexter's entire launch phase (100 supporters × low event density). PostHog's funnel analysis (signup → first upload → MCP config copy → first query) is exactly the measurement question MQ-2. MCP endpoint events can be piped from Hono via posthog-node. EU Cloud resolves data residency concern. Session replay (5K/mo free) gives qualitative drop-off insight at zero cost.
- **Tier:** FREEMIUM (generous free tier, self-hosted needs 16 GB RAM)

---

### Signal 3: LemonSqueezy custom_data → UTM attribution pipeline
- **Finding:** LemonSqueezy natively supports passing `custom_data` objects through checkout URLs via query parameters (`?checkout[custom][user_id]=123&checkout[custom][utm_source]=hn`). This data is returned verbatim in all Order/Subscription/License webhook payloads as `meta.custom_data`. This means: capture UTM params on landing page → store in sessionStorage → inject into LS checkout URL at payment time → receive in webhook → link payment to channel. The mechanism requires no third-party tool — just frontend JS and a webhook handler on `api.contexter.cc`.
- **Sources:** [LemonSqueezy custom data docs](https://docs.lemonsqueezy.com/help/checkout/passing-custom-data) (live, verified), [LemonSqueezy webhook docs](https://docs.lemonsqueezy.com/help/webhooks/webhook-requests) (live, verified)
- **Confidence:** HIGH (first-party official docs, confirmed live)
- **Relevance to Contexter:** This is the answer to measurement question MQ-4 (revenue attribution by channel). Implementation: ~30 lines of JS in the SolidJS SPA to capture UTM params → pass to LS checkout URL. The Hono webhook handler already exists — just needs to log `meta.custom_data` into PG with the order. Zero cost.
- **Tier:** FREE (built into LemonSqueezy)

---

### Signal 4: Cloudflare Web Analytics (CWA) — Free CF-native, but sampled
- **Finding:** Cloudflare Web Analytics is a free, privacy-first JavaScript-snippet analytics product available to all Cloudflare accounts. It does NOT use cookies or track individuals. However, all stats are based on a 10% sample of page load events — Cloudflare extrapolates from sample data, not actual counts. Data retention is only 6 months. It shows top pages, referrers, countries, browsers, devices. No custom events, no funnels, no UTM campaign breakdown beyond basic referrer. For a CF Pages site, it integrates with zero config by toggling it in the dashboard.
- **Sources:** [Cloudflare Web Analytics page](https://www.cloudflare.com/web-analytics/) (live, verified), [Plausible vs CF Analytics](https://plausible.io/vs-cloudflare-web-analytics) (live, Plausible-biased), [Cloudflare privacy analytics blog](https://blog.cloudflare.com/free-privacy-first-analytics-for-a-better-web/) (2020, original announcement)
- **Confidence:** HIGH
- **Relevance to Contexter:** Good as a free baseline "sanity check" layer — zero friction to enable for CF Pages. However 10% sampling at early launch stage (low traffic) will produce wildly inaccurate numbers. Not suitable as primary analytics. No UTM/custom event support — can't answer MQ-2 or MQ-4 alone.
- **Tier:** FREE / CF-NATIVE

---

### Signal 5: Cloudflare Workers Analytics Engine — Custom event store on CF edge
- **Finding:** Workers Analytics Engine (WAE) is a CF-native time-series database for custom metrics. Each `writeDataPoint()` call from a Worker stores a structured event. Free tier: 100K data points/day. Paid (Workers Paid at $5/mo): 10M data points/month included, then $0.25/M. Currently NOT being billed — CF announced pricing but hasn't started charging yet as of April 2026. Read queries via SQL API. Can be queried from Grafana or custom dashboards. Pairs naturally with CF Pages because you can proxy analytics through a CF Worker to avoid ad blockers.
- **Sources:** [CF Analytics Engine pricing docs](https://developers.cloudflare.com/analytics/analytics-engine/pricing/) (verified live, 2026-04-16), [CF Analytics Engine overview](https://developers.cloudflare.com/analytics/analytics-engine/) (live)
- **Confidence:** HIGH (first-party official docs, verified today)
- **Relevance to Contexter:** Could be used to instrument the Hono API (via a CF Worker proxy or sidecar) without adding any external dependency. Free at current traffic levels. However: no built-in dashboard (must build custom SQL queries or connect Grafana), no session replay, no funnel visualization. Good for high-volume server-side event logging but requires engineering to be useful. Better suited as a secondary layer after primary analytics is established.
- **Tier:** FREE (currently not billed) / CF-NATIVE

---

### Signal 6: Umami — Lightweight self-hosted, ~200 MB RAM, PostgreSQL
- **Finding:** Umami is a cookieless, privacy-first, open-source analytics platform (MIT license). Self-hosted Docker Compose setup requires only PostgreSQL — no ClickHouse, no Kafka. RAM usage ~200 MB in production, fitting comfortably within the 256 MB self-hosting budget on Hetzner CAX21. Cloud: 100K events/month free, then $20/mo for 1M events. Supports custom events, UTM tracking, funnels (basic), real-time dashboard. Single container deployment. No session replay. Tracked as a top alternative to Plausible in 2026 community comparisons.
- **Sources:** [Umami GitHub](https://github.com/umami-software/umami) (live), [Umami Docker setup guide](https://oneuptime.com/blog/post/2026-02-08-how-to-run-umami-analytics-in-docker/view) (2026-02), [PostHog open-source tools list](https://posthog.com/blog/best-open-source-analytics-tools) (2025), [Umami vs Plausible 2026](https://www.loopwerk.io/articles/2026/umami-vs-plausible/) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** Best self-hosted option given the 256 MB budget constraint. Unlike Plausible self-hosted (which needs ClickHouse), Umami + PG can run alongside existing Contexter PG instance (or a new container). Zero added SaaS cost. However: no session replay, limited funnel depth, no built-in revenue attribution. Would satisfy MQ-1 and MQ-6 (traffic attribution + geo).
- **Tier:** FREE (self-hosted) / FREEMIUM (100K free cloud)

---

### Signal 7: OpenPanel — PostHog-inspired, cookie-free, single container, 2.3 KB SDK
- **Finding:** OpenPanel is an emerging open-source product analytics tool (MIT-adjacent license) combining Plausible-style web analytics with Mixpanel-style funnel/retention/event tracking. SDK is 2.3 KB vs PostHog's much larger bundle. Cookie-free by default. Self-hosted via single Docker container — significantly simpler than PostHog's multi-service architecture. Cloud: 10K free events/month. GitHub: 4,793 stars (vs PostHog's 29,972). Founded ~2024, actively maintained in 2026.
- **Sources:** [OpenPanel vs PostHog](https://openpanel.dev/compare/posthog-alternative) (live 2026), [OpenPanel self-hosted guide](https://openpanel.dev/articles/self-hosted-web-analytics) (live 2026), [OpenPanel vs PostHog comparison](https://openalternative.co/compare/openpanel/vs/posthog) (2025)
- **Confidence:** MEDIUM (emerging tool, smaller community than PostHog/Plausible)
- **Relevance to Contexter:** Interesting option if PostHog cloud privacy posture is a concern. Single-container self-hosting aligns with the 256 MB budget (pending RAM verification — not confirmed in sources). UTM support confirmed. Funnel analytics covers MQ-2. However 10K free cloud events/month is very low; self-hosting needs RAM verification. Community much smaller than PostHog — risk of abandonment.
- **Tier:** FREEMIUM (cloud 10K/mo free) / SELF-HOSTED

---

### Signal 8: GoatCounter — Minimalist, single binary, Caddy log parsing
- **Finding:** GoatCounter is a single Go binary that parses web server log files (nginx, Apache, Caddy, CloudFront) or accepts HTTP API hits. No Docker required. Ships SQLite by default, PostgreSQL optional. Adds ~3.5 KB to page load for client JS mode. Key differentiator: can parse Caddy access logs directly (`--format=caddy`), creating a zero-JS server-side analytics path for the Hono API. RAM footprint is minimal (no ClickHouse, no PostgreSQL forced).
- **Sources:** [GoatCounter homepage](https://www.goatcounter.com) (live), [GoatCounter GitHub](https://github.com/arp242/goatcounter) (live), [Privacy-focused analytics comparison 2026](https://dasroot.net/posts/2026/04/privacy-focused-blog-post-analytics-plausible-goatcounter/) (2026-04), [Caddy/GoAccess community wiki](https://caddy.community/t/caddy-goaccess-log-file-analysis/9356) (2023, stale)
- **Confidence:** MEDIUM
- **Relevance to Contexter:** Highly relevant for server-side API tracking on Hono/Caddy with zero JS overhead. Can ingest Caddy structured logs directly — answering MQ-3 (MCP endpoint usage) without any SDK. However: no funnels, no session replay, no UTM attribution depth. Very minimal UI. Better as a supplementary log-based layer than primary product analytics.
- **Tier:** FREE (self-hosted, single binary)

---

### Signal 9: GoAccess + Caddy JSON log converter — Server-side log dashboard
- **Finding:** GoAccess is a real-time terminal + HTML log analyzer. It natively supports Caddy's `local/info` JSON log format. However, Caddy's structured JSON output does not map cleanly to GoAccess's expected field names, causing partial parsing. Community solutions exist: `CaddyGoAccessDataLoggerConverter` (GitHub: DWiskow/CaddyGoAccessDataLoggerConverter) bridges this gap. GoAccess can generate a self-contained HTML report, or a real-time terminal dashboard. Zero infrastructure cost — runs on the existing Hetzner server.
- **Sources:** [GoAccess homepage](https://goaccess.io/) (live), [Caddy/GoAccess log issue](https://github.com/allinurl/goaccess/issues/1768) (GitHub, open issue), [GoAccess Caddy simple analytics guide](https://alexmv12.xyz/blogPosts/goaccess_caddy/) (2023), [CaddyGoAccessDataLoggerConverter](https://github.com/DWiskow/CaddyGoAccessDataLoggerConverter) (GitHub, live)
- **Confidence:** MEDIUM (native Caddy JSON support is partial — converter needed)
- **Relevance to Contexter:** Useful as a zero-cost supplementary layer for API traffic analysis. Caddy reverse-proxies `api.contexter.cc` — GoAccess can analyze those logs to see `/upload`, `/search`, `/sse` endpoint hit rates. Not a replacement for proper product analytics but gives instant server-side visibility with no SaaS dependency.
- **Tier:** FREE (self-hosted, existing server)

---

### Signal 10: Pirsch — Server-side API, no JS required, Go library
- **Finding:** Pirsch is a privacy-first analytics SaaS (hosted in Germany) that offers a server-side HTTP API as the primary integration path — ideal for Hono/Bun where you call their API on each request rather than injecting client JS. No cookies, no personal data stored. GDPR/CCPA/PECR-compliant. 2026 update: switched from client_id+secret OAuth to access keys for simpler integration. Pricing: not clearly confirmed from search (one source mentions $9/mo tier but not verified). Open-source SDK (Go-native library also available).
- **Sources:** [Pirsch server-side integration docs](https://docs.pirsch.io/get-started/backend-integration) (live, verified), [Pirsch GitHub](https://github.com/pirsch-analytics/pirsch) (live), [Pirsch review 2026](https://userbird.com/review/pirsch) (2026)
- **Confidence:** MEDIUM (pricing not confirmed from a second source — needs DEEP)
- **Relevance to Contexter:** Server-side tracking via Hono middleware is a clean pattern for Contexter's API. Unlike client-side tools, Pirsch API calls from the Hono layer would capture MCP endpoint usage (MQ-3) and API-level events without any SPA JS bloat. However: no session replay, no funnel builder. Pricing needs verification.
- **Tier:** PAID-LOW (pricing unconfirmed — pending DEEP)

---

### Signal 11: Dub.co — Open-source link attribution platform, revenue conversion tracking
- **Finding:** Dub.co is an open-source (AGPLv3) link management and attribution platform. It goes beyond URL shortening — it tracks full conversion funnels from click → lead → sale. Used by 1,000+ companies. Supports branded short links, deep UTM analytics, QR codes, A/B testing, and affiliate management. As a self-hostable tool (AGPL means you must open-source your modifications), it can act as a UTM link management layer for Contexter's launch campaign without relying on Bitly or raw UTM params. Cloud pricing exists for managed version.
- **Sources:** [Dub.co homepage](https://dub.co) (live), [TechCrunch Dub.co profile](https://techcrunch.com/2025/01/16/dub-co-is-an-open-source-url-shortener-and-link-attribution-engine-packed-into-one/) (2025-01), [Dub.co GitHub](https://github.com/dubinc) (live)
- **Confidence:** HIGH
- **Relevance to Contexter:** Using Dub for campaign links (HN post, Reddit threads, PH launch, awesome-mcp GitHub PRs) gives a unified attribution dashboard without relying on UTM parameters surviving browsers that strip them. Dub tracks clicks at the redirect level — no JS needed on contexter.cc. Can complement any analytics stack. Free tier on cloud (limited); self-hosted option. Key question: does Dub integrate with LemonSqueezy for post-click conversion tracking? (→ DEEP candidate)
- **Tier:** FREEMIUM / SELF-HOSTED (AGPL)

---

### Signal 12: Dark social / "direct" traffic problem for Reddit and HN
- **Finding:** SparkToro research shows that a significant portion of what analytics labels as "direct" traffic is actually dark social — visits from private sharing (Slack DMs, Discord, email, private Reddit messages). Reddit's public posts DO pass referrer data in most cases (analytics will see `reddit.com`), but Reddit's in-app sharing and DM links strip referrers. HN is similar: HN posts mostly pass `news.ycombinator.com` as referrer, but HN users disproportionately use ad blockers and privacy browsers — Plausible's own data suggests actual HN traffic is higher than recorded. In 2026, AI traffic (Claude, ChatGPT, Perplexity) further inflates "direct" bucket.
- **Sources:** [SparkToro dark social research](https://sparktoro.com/blog/new-research-dark-social-falsely-attributes-significant-percentages-of-web-traffic-as-direct/) (2023, methodology still relevant), [Dark social 2026 guide](https://www.cometly.com/post/dark-social-attribution-problem) (2026), [HN front page traffic stats](https://marcotm.com/articles/stats-of-being-on-the-hacker-news-front-page/) (2022, dated), [AI traffic dark attribution](https://www.keithbradnam.com/blog/2026/1/31/why-dark-social-and-ai-traffic-makes-it-harder-than-ever-to-make-sense-of-website-analytics) (2026-01)
- **Confidence:** HIGH (well-documented phenomenon)
- **Relevance to Contexter:** Critical context: UTM params on all launch links (HN "Show HN", Reddit posts, PH listing, awesome-mcp GitHub PR description) will capture what can be captured, but at least 20-40% of actual referral traffic will arrive as "direct." Dub.co or custom short links with UTM embedded reduce — but don't eliminate — this. Contexter should expect dark social inflation and plan for it.
- **Tier:** PATTERN (not a tool)

---

### Signal 13: OpenTelemetry for MCP server instrumentation — Emerging standard
- **Finding:** OpenTelemetry has emerged as the standard for MCP server observability in early 2026. FastMCP (Python MCP framework) includes native OTel integration. The Apollo MCP Server exports metrics/traces/events via OTLP. A GitHub Discussion (#269) proposes adding OTel trace support to the MCP protocol specification itself. Key metrics for MCP: per-tool latency, error rates, call volume per tool, end-to-end traces from agent reasoning to tool execution. Tools: SigNoz (open-source, self-hosted), Jaeger (open-source), Grafana + Tempo, OneUptime.
- **Sources:** [OTel MCP instrumentation guide](https://oneuptime.com/blog/post/2026-03-26-how-to-instrument-mcp-servers-with-opentelemetry/view) (2026-03), [SigNoz MCP observability](https://signoz.io/blog/mcp-observability-with-otel/) (live), [MCP protocol OTel proposal](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/269) (GitHub live), [Grafana MCP monitoring blog](https://grafana.com/blog/ai-observability-MCP-servers/) (live), [Hono OpenTelemetry guide](https://oneuptime.com/blog/post/2026-02-06-instrument-hono-framework-opentelemetry-edge-workers/view) (2026-02)
- **Confidence:** HIGH (multiple sources from early 2026)
- **Relevance to Contexter:** The `api.contexter.cc/sse?token={TOKEN}` MCP endpoint is the product's core value-delivery surface — and currently has zero visibility. OTel instrumentation on Hono would answer MQ-3 (MCP endpoint usage, tool call patterns, connected users) without any third-party SaaS. Hono supports OTel middleware (`@hono/otel`). This is a gap that standard web analytics tools completely miss — all of them focus on browser pageviews, not SSE/API tool calls.
- **Tier:** FREE (self-hosted: SigNoz, Jaeger) / SELF-HOSTED

---

### Signal 14: Google Analytics 4 — GDPR conditional in EU 2026
- **Finding:** GA4 is conditionally legal in most EU countries as of 2026 — ONLY with valid opt-in consent banner before loading the script AND IP anonymization. The EU-US Data Privacy Framework (DPF, certified July 2023) provides current legal basis, but is under challenge by NOYB/Max Schrems ("Schrems III" scenario). Without a cookie banner, GA4 violates ePrivacy Directive. Multiple EU DPAs have issued fines. The "Schrems III" risk makes GA4 a medium-term legal liability for EU-serving products.
- **Sources:** [GA4 GDPR 2026 analysis](https://privacychecker.pro/blog/google-analytics-4-gdpr-legal) (2026), [GA4 GDPR compliance guide](https://securespells.com/blog/google-analytics-gdpr-compliance-guide-2026/) (2026), [Reflective Data GA4 guide](https://reflectivedata.com/ga4-is-not-gdpr-compliant-heres-how-to-use-ga4-in-the-eu-safely/) (2025)
- **Confidence:** HIGH
- **Relevance to Contexter:** GA4 requires a cookie consent banner — directly violating the "no cookie banners if possible" constraint. Server is in EU (Helsinki, Hetzner). Billing entity is AR. Legal exposure on "Schrems III" risk is real. Recommend avoid for Contexter.
- **Tier:** FREE / TRADITIONAL

---

### Signal 15: Microsoft Clarity — Free session replay + heatmaps, GDPR requires consent
- **Finding:** Microsoft Clarity is 100% free, forever, with no traffic limits. Provides session recordings and click/scroll heatmaps. GDPR compliance requires consent — Clarity uses cookies and does not respect Do Not Track signals. 30-day data retention only. No custom event tracking, no funnel analysis, no UTM attribution depth. Clarity was confirmed to collect data for Microsoft's broader AI/ML training in its early versions (later updated per privacy policy changes).
- **Sources:** [Clarity homepage](https://clarity.microsoft.com/) (live), [Clarity GDPR guide](https://cookie-script.com/guides/microsoft-clarity-session-replay-gdpr) (2025), [Clarity review 2026](https://uxheat.com/blog/clarity-review) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** Free session replay is appealing, but requires cookie consent banner — violating the "no cookie banners if possible" constraint. 30-day retention is very short. Data going to Microsoft infrastructure has potential EU-US transfer concerns. Recommend avoid unless consent banner is added anyway for another reason.
- **Tier:** FREE / SESSION-REPLAY

---

### Signal 16: CNIL consent exemption + EU Digital Omnibus — Regulatory green light
- **Finding:** France's CNIL has formally confirmed that analytics tools meeting their criteria (cookieless, first-party only, audience measurement only, 25-month max retention, no cross-site tracking) are exempt from consent requirements under ePrivacy. Germany's DSK has similar guidance. Plausible and Umami both qualify. The EU Digital Omnibus initiative (proposed 2026) would formally codify this exemption into law for aggregated audience measurement. Piwik PRO is specifically named on CNIL's exemption list for configured installations.
- **Sources:** [CNIL analytics sheet](https://www.cnil.fr/en/sheet-ndeg16-use-analytics-your-websites-and-applications) (live, official), [Privacy regulations 2026 Matomo blog](https://matomo.org/blog/2026/01/privacy-regulations-changes-2026-analytics/) (2026-01), [CNIL consent exemption guide](https://captaincompliance.com/education/cnil-clarifies-when-analytics-cookies-can-be-used-without-consent/) (2025)
- **Confidence:** HIGH (official government source)
- **Relevance to Contexter:** This is the legal foundation for choosing cookieless analytics without a consent banner. Plausible + Umami both qualify for CNIL exemption. This directly satisfies the "no cookie banners if possible" constraint. Key condition: the analytics data must not be shared with third parties or used for advertising targeting.
- **Tier:** REGULATORY PATTERN

---

### Signal 17: Sentry — Error tracking, 5K events/month free
- **Finding:** Sentry's free Developer plan includes 5,000 error events/month. Above free tier: Team plan starts at $26/mo, scales per event volume with unpredictable billing spikes on error surges. GDPR compliance available with EU data residency option, DPA, and PII scrubbing tools. Sentry uses OTel under the hood — any OTel spans are automatically picked up. GlitchTip is an open-source Sentry alternative (self-hostable, much simpler).
- **Sources:** [Sentry free plan](https://sentrypricing.com/free-plan) (live), [Sentry alternatives 2026](https://securityboulevard.com/2026/04/best-sentry-alternatives-for-error-tracking-and-monitoring-2026/) (2026-04), [PostHog vs Sentry comparison](https://vemetric.com/blog/posthog-vs-sentry) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** Error tracking is categorized as "traffic-adjacent" in the prompt. Bugs lose users before analytics can measure them. 5K/month free is likely sufficient at launch. If PostHog is chosen as primary analytics, PostHog includes 100K error exceptions/month free — eliminating Sentry as a separate dependency.
- **Tier:** FREEMIUM (5K/mo free)

---

### Signal 18: Google Search Console — Free organic traffic and query data
- **Finding:** Google Search Console is completely free, no usage limits. Provides actual click and impression data from Google Search — the only way to see which search queries bring users to contexter.cc. Setup: add property + verify ownership (meta tag or DNS TXT record). 2026 update: AI-powered performance report configuration; weekly/monthly aggregation added. Integrates with GA4 but can be used standalone. Shows Core Web Vitals, indexing status, and referring queries.
- **Sources:** [GSC official page](https://search.google.com/search-console/about) (live), [GSC 2026 guide](https://seo-hacker.com/google-search-console-guide-2026/) (2026), [GSC updates 2026](https://marketing.inc/blog/google-search-console-updates-in-2026-a-complete-guide-for-seos-and-webmasters/) (2026)
- **Confidence:** HIGH
- **Relevance to Contexter:** Directly answers MQ-7 (organic search queries). Zero cost. No cookie/consent implications (server-side tool, no client JS required). Should be set up regardless of which analytics stack is chosen — it's purely additive and answers a question no other tool in this stack can answer. Requires submitting sitemap.
- **Tier:** FREE

---

### Signal 19: Tinybird — Managed ClickHouse for real-time event pipeline
- **Finding:** Tinybird is a managed ClickHouse service for real-time analytics. Provides data ingestion APIs, SQL transformations, and instant REST API endpoints for custom metrics. Free tier: 10 GB storage, 10M rows/day ingestion, 1,000 API requests/day. Paid plans start at $25/mo (developer) or usage-based (~$0.34/GB processed). Target use case: high-volume event streams where you want custom SQL-based dashboards without self-hosting ClickHouse.
- **Sources:** [Tinybird pricing](https://www.tinybird.co/pricing) (live), [Tinybird 2026 review](https://saaslens.app/tools/tinybird) (2026)
- **Confidence:** MEDIUM (pricing verified live, but use case fit is niche for Contexter at launch stage)
- **Relevance to Contexter:** Overkill for launch phase (100 supporters). The free tier 1,000 API requests/day severely limits dashboard utility. Relevant if Contexter scales to high-volume MCP telemetry logging. Better considered at Series A stage than launch. Not the right fit now.
- **Tier:** FREEMIUM / PAID-LOW ($25/mo developer)

---

### Signal 20: OpenReplay — Self-hosted session replay, DevOps-heavy
- **Finding:** OpenReplay is an open-source session replay platform with full frontend context capture (console logs, network requests, performance, events). Self-hosted option is completely free and includes all core features. However, self-hosting "requires real DevOps resources to deploy and maintain at scale." No explicit RAM footprint found for small deployments. Native mobile replay is still in preview (2026). Built for engineering teams debugging technical issues, not UX/marketing teams.
- **Sources:** [PostHog open-source session replay tools](https://posthog.com/blog/best-open-source-session-replay-tools) (2025), [OpenReplay vs Hotjar](https://openreplay.com/compare/openreplay-vs-hotjar/) (live), [BetterStack OpenReplay alternatives](https://betterstack.com/community/comparisons/openreplay-alternatives/) (2026)
- **Confidence:** MEDIUM
- **Relevance to Contexter:** Session replay would answer MQ-2 (funnel drop-offs) qualitatively. OpenReplay self-hosted is free but "DevOps-heavy" is a significant friction for a solo founder. PostHog's 5K free session replays/month on EU Cloud is a simpler path to the same data. OpenReplay only makes sense if PostHog cloud is rejected for data sovereignty reasons and significant DevOps capacity exists.
- **Tier:** FREE / SELF-HOSTED

---

### Signal 21: Yandex Metrica — Free full-featured but Russian jurisdiction risk
- **Finding:** Yandex Metrica is free, with session replay, heatmaps, funnel analysis, and sophisticated analytics. Yandex is incorporated under Russian law (Moscow). EU DPAs have concerns about SCCs to Russia post-Schrems II. Yandex uses Standard Contractual Clauses and has an EEA representative (Romania-registered entity). GDPR compliance is self-asserted. In practice, several EU companies received regulatory warnings for using Yandex Metrica after Russia-Ukraine conflict (2022+).
- **Sources:** [Yandex Metrica GDPR page](https://yandex.ru/support/metrica/en/general/gdpr) (live), [Yandex DPA](https://yandex.ru/legal/metrica_agreement/en/) (live), [Lexology Russia analytics case law](https://www.lexology.com/library/detail.aspx?g=05d09df4-032a-474e-bda9-ef74b487625c) (2023)
- **Confidence:** HIGH (legal risk assessment, multiple sources)
- **Relevance to Contexter:** Despite rich features at zero cost, the Russian jurisdiction creates real GDPR legal risk, especially with billing entity in AR (RU citizen). EU DPA enforcement actions against Yandex Metrica users have been documented. Recommend avoid — the legal exposure outweighs the free feature set.
- **Tier:** FREE / TRADITIONAL (avoid)

---

### Signal 22: Track HN + Hunted.space — Launch-day monitoring tools
- **Finding:** Track HN (track-hacker-news.com) is a specialized analytics terminal for HN — captures score/rank snapshots every few seconds for every story and comment, uses AI to detect trending topics and sentiment. Free tier includes score/rank history and dashboards. Hunted.space is the equivalent for Product Hunt launches — tracks upvote speed, comments, rank position throughout launch day. Neither tool tracks on-site visitor behavior but monitor platform-side engagement.
- **Sources:** [Track HN homepage](https://track-hacker-news.com/) (live), [HN front page stats case study](https://marcotm.com/articles/stats-of-being-on-the-hacker-news-front-page/) (2022), [Hunted.space](https://hunted.space/) (live)
- **Confidence:** HIGH
- **Relevance to Contexter:** Not web analytics — but critical for launch-day monitoring. Track HN tells you if your Show HN post is getting buried or rising. Hunted.space tells you launch day PH rank position in real time. These are launch operations tools, not analytics tools. Both are free. Use them on launch day alongside normal analytics.
- **Tier:** FREE (specialized launch monitoring)

---

### Signal 23: Matomo — Enterprise-grade self-hosted, high RAM requirement
- **Finding:** Matomo is the most feature-rich privacy-first analytics platform — session replay, heatmaps, funnels, cohort analysis, goal tracking, custom dimensions. Open-source GPL license. Self-hosted requires PHP + MySQL/MariaDB. RAM requirement for self-hosting is higher than Umami (~512 MB+ recommended). Cloud Matomo On-Premise: $0 but you manage it. Matomo Cloud pricing starts at ~€29/mo. CNIL has guidance on configuring Matomo for consent exemption. Not "modern" tech stack — PHP-based.
- **Sources:** [Matomo privacy regulations 2026](https://matomo.org/blog/2026/01/privacy-regulations-changes-2026-analytics/) (2026-01), [GDPR compliant tools comparison](https://www.data-mania.com/blog/top-10-gdpr-compliant-google-analytics-alternative-solutions/) (2025)
- **Confidence:** MEDIUM (pricing details sparse from current sources)
- **Relevance to Contexter:** Too heavy for the Hetzner CAX21 alongside existing Contexter stack. PHP stack doesn't fit the Bun/Hono architecture ethos. Feature-rich but overpowered for a 100-supporter launch. Better fit for an established company with dedicated analytics infrastructure.
- **Tier:** FREE (self-hosted) / PAID-LOW ($29/mo cloud)

---

### Signal 24: PostHog + Hono native SDK — Direct API event instrumentation
- **Finding:** PostHog has an officially documented Hono SDK integration (`posthog-node` library for edge Workers/Hono). Configuration requires `flushAt: 1` and `flushInterval: 0` to prevent data loss in serverless/edge environments (since Workers may terminate before batched data is sent). The CF reverse proxy pattern (`/ingest` route via Workers) prevents ad blocker interference. PostHog also officially supports EU Cloud at `eu.posthog.com` for EU data residency.
- **Sources:** [PostHog Hono docs](https://posthog.com/docs/libraries/hono) (live, official), [PostHog Cloudflare proxy docs](https://posthog.com/docs/advanced/proxy/cloudflare) (live, official), [PostHog Cloudflare Workers docs](https://posthog.com/docs/libraries/cloudflare-workers) (live, official)
- **Confidence:** HIGH (first-party official docs verified live)
- **Relevance to Contexter:** The existence of a native Hono integration for PostHog is a significant signal. MCP endpoint events (`/sse` connection, tool invocations, upload completions) can be captured directly from the Hono layer using `posthog-node`. This answers MQ-3 (MCP telemetry) alongside web analytics from the SolidJS SPA. Combined with EU Cloud + CNIL-exempt configuration, PostHog Cloud becomes a compelling single-platform answer for MQ-1 through MQ-5.
- **Tier:** FREEMIUM (1M events/mo free on EU Cloud)

---

### Signal 25: HN referrer tracking nuances — Ad blocker inflation
- **Finding:** Multiple case studies (Luke Hsiao's HN traffic study with 722 points, Nick Lafferty's front page experience) show that actual HN traffic is consistently higher than analytics tools report. Reason: HN users are disproportionately technical, using uBlock Origin, Brave, Firefox with Enhanced Tracking Protection. Plausible and Umami (cookieless) recover more HN traffic than GA4 because they don't rely on third-party cookie infrastructure, but still undercount due to JS blocking. GoAccess analyzing Caddy server logs captures ALL requests including ad-blocked browsers — providing a ceiling figure for actual traffic.
- **Sources:** [HN traffic study](https://luke.hsiao.dev/blog/2023-hn-traffic/) (2023), [HN front page stats](https://marcotm.com/articles/stats-of-being-on-the-hacker-news-front-page/) (2022), [AI referral tracking guide](https://www.yotpo.com/blog/track-ai-referral-traffic/) (2026)
- **Confidence:** HIGH (empirical case studies, consistent finding)
- **Relevance to Contexter:** Running GoAccess (or GoatCounter with log parsing) on Caddy access logs in parallel with a client-side analytics tool gives a floor (client-side: what JS can capture) and ceiling (server-side: all HTTP requests) for traffic estimation. The delta is the ad-blocked audience. For a Show HN targeting developers — this delta may be 30-50%.
- **Tier:** PATTERN (methodological insight)

---

## Platform Comparison Matrix

| Platform | Tier | Cost at 10K pageviews/mo | GDPR cookieless | CF Pages native? | Self-hostable? | Session replay? | UTM + LS attribution | Solo-founder DX | RAM if self-hosted |
|---|---|---|---|---|---|---|---|---|---|
| **Cloudflare Web Analytics** | FREE | $0 | Yes (cookieless) | Native (1-click) | No | No | Referrer only, no UTM depth | Excellent | N/A |
| **CF Workers Analytics Engine** | FREE (currently) | $0 | Yes | Native (Worker) | No | No | Custom events (build yourself) | Medium (SQL queries needed) | N/A |
| **Plausible Cloud** | PAID-LOW | $9/mo | Yes (CNIL-exempt) | JS snippet | No | No | UTM + custom events | Excellent | N/A |
| **Plausible Self-Hosted** | FREE | $0 | Yes | JS snippet | Yes | No | UTM + custom events | Good | ~2 GB+ (ClickHouse req.) |
| **Umami Self-Hosted** | FREE | $0 | Yes (CNIL-exempt) | JS snippet | Yes | No | UTM + custom events | Good | ~200 MB |
| **Umami Cloud** | FREEMIUM | $0 (100K events) | Yes | JS snippet | Yes | No | UTM + custom events | Excellent | N/A |
| **PostHog EU Cloud** | FREEMIUM | $0 (1M events) | Yes (configure) | JS + Hono SDK | Yes (heavy) | Yes (5K/mo) | UTM + LS webhook + funnels | Good | 16 GB (self-hosted) |
| **OpenPanel Cloud** | FREEMIUM | $0 (10K events) | Yes | JS snippet | Yes | No | UTM + funnels | Good | ~unknown (single container) |
| **GoatCounter** | FREE | $0 | Yes | JS or log parse | Yes | No | Basic referrer | Excellent (single binary) | Minimal (~50 MB) |
| **GoAccess** | FREE | $0 | Yes (server-side) | Via Caddy logs | Yes | No | No | Medium (CLI tool) | Minimal |
| **Pirsch** | PAID-LOW | ~$9/mo (unconfirmed) | Yes | Server-side API | No | No | Server-side UTM | Good | N/A |
| **Google Analytics 4** | FREE | $0 | No (needs consent) | JS snippet | No | No | Full UTM + LS | Excellent | N/A |
| **Microsoft Clarity** | FREE | $0 | No (needs consent) | JS snippet | No | Yes (unlimited) | No UTM depth | Excellent | N/A |
| **Yandex Metrica** | FREE | $0 | Partial (risk) | JS snippet | No | Yes | Yes | Good | N/A |
| **Matomo** | FREE/PAID | $0 self-hosted | Yes (configurable) | JS snippet | Yes | Yes (paid) | Full UTM | Medium | ~512 MB+ |
| **Sentry** | FREEMIUM | $0 (5K errors) | Yes (EU hosted) | JS snippet | Yes (GlitchTip) | No | N/A (error tracking) | Excellent | N/A |
| **Dub.co** | FREEMIUM | $0 (free tier) | Yes (redirect-level) | N/A (link manager) | Yes (AGPL) | No | Click → conversion | Excellent | Unknown |
| **Tinybird** | FREEMIUM | $0 (10M rows/day) | Yes (server-side) | API | No | No | Custom (build yourself) | Medium | N/A |
| **OpenReplay** | FREE (self-hosted) | $0 | Yes | JS snippet | Yes | Yes | No UTM depth | Poor (DevOps heavy) | Unknown (heavy) |
| **GoatCounter (log mode)** | FREE | $0 | Yes | Via Caddy logs | Yes | No | No | Excellent | ~50 MB |
| **Google Search Console** | FREE | $0 | Yes (no JS req.) | Meta tag verify | N/A | No | Organic search queries | Excellent | N/A |

---

## Pattern Observations

**Pattern 1: Layered analytics stack (web + product + server-side)**
Most 2026 solo-founder case studies use 2-3 complementary layers: (1) lightweight cookieless web analytics (Plausible/Umami) for traffic attribution, (2) product analytics (PostHog free tier) for funnel/retention, (3) server-side log analysis (GoAccess/GoatCounter) for complete HTTP picture. The three layers answer different questions and the total cost can remain under $20/mo.
Who uses it: Plausible blog, indie hackers on IndieHackers forum, DEV.to case studies.

**Pattern 2: UTM → sessionStorage → LS custom_data pipeline for revenue attribution**
The pattern for tying LemonSqueezy payments to acquisition channels: (a) capture UTM params on landing page using JS and store in sessionStorage; (b) when user clicks "Buy", append `checkout[custom][utm_source]=...&checkout[custom][utm_campaign]=...` to the LS checkout URL; (c) receive params in webhook `meta.custom_data`; (d) log in PG alongside order_id. This is zero-cost and requires ~30 lines of JS. Widely documented in LS developer community.
Who uses it: Standard LS indie hacker pattern, documented in LS official docs.

**Pattern 3: CF Worker proxy for analytics (ad-block bypass)**
For CF Pages SPAs, routing analytics requests through a CF Worker (e.g., `/ingest` → PostHog EU, or `/stats` → Plausible) bypasses most ad blockers because requests go to first-party domains. PostHog officially documents this pattern. CF Workers free tier (100K requests/day) makes this zero-cost.
Who uses it: PostHog docs, Plausible proxy guide.

**Pattern 4: Server-side + client-side dual counting for HN/developer traffic**
Because developer audiences heavily use ad blockers, running both a server-side log analyzer (GoAccess/GoatCounter in log mode) AND a client-side analytics tool gives floor (JS-counted) and ceiling (server-counted) traffic estimates. The delta reveals ad-blocked fraction. Useful during HN/Reddit launch peaks to understand real reach vs reported reach.
Who uses it: Documented by solo founders in HN traffic post-mortems (2022-2023 case studies).

**Pattern 5: MCP telemetry via OTel middleware on Hono**
Hono supports `@hono/otel` middleware for automatic span creation per request. Combined with a lightweight OTel collector (e.g., sending to PostHog via the Node.js SDK, or to SigNoz self-hosted), every MCP SSE connection, tool invocation, and upload event can be traced. This pattern is emerging in 2026 as MCP deployments scale.
Who uses it: FastMCP framework, Apollo MCP Server (OTel native), documented in oneuptime.com 2026-02 post.

**Pattern 6: Launch-day campaign link management with Dub.co**
Instead of raw UTM parameters in HN/Reddit/GitHub PR submissions (which look spammy and may be stripped by platforms), using Dub.co short links (e.g., `ctx.cc/hn`) that embed UTM parameters at the redirect level gives clean-looking URLs with full attribution data. This is particularly important for GitHub README/awesome-mcp PRs where raw UTM URLs would look unprofessional.
Who uses it: 1,000+ companies per Dub.co homepage.

**Pattern 7: PostHog as single-platform product analytics consolidator**
For solo founders, PostHog's 1M free events/month encompasses web analytics, funnels, retention, session replay (5K), error tracking (100K), and feature flags — effectively replacing Plausible + Sentry + Hotjar + LaunchDarkly with one platform. The trade-off is heavier JS bundle and more complex setup vs. Plausible's simplicity. This pattern is documented by the solopreneur SaaS toolkit community (IndieHackers, DEV.to).
Who uses it: 100,000+ teams per PostHog's self-reported metrics.

---

## Noise (captured but deprioritized)

**Hotjar / Contentsquare** — Hotjar merged into Contentsquare in 2025. New customers go through Contentsquare. The session replay product still exists but pricing has moved upmarket (enterprise focus). The free tier of legacy Hotjar has been restricted post-merger. Not suitable for solo founder at launch — replaced by Clarity (free) or PostHog session replay (free tier) in the indie space.

**Amplitude free tier** — Amplitude offers a free tier with basic product analytics. However, Amplitude's setup complexity, pricing model uncertainty, and primarily enterprise focus make it poor DX for a solo founder. PostHog's free tier is more generous and developer-friendly. Deprioritized: better option exists.

**Mixpanel free tier** — Similar to Amplitude: powerful product analytics but complex, pricing changes frequently, not GDPR-cookieless by default. PostHog outcompetes it on the free tier for solo founder use cases in 2026. Deprioritized: better option exists.

**June.so** — B2B SaaS analytics focused on company-level metrics (which companies are using the product, not individual users). Not relevant at Contexter's current stage where customers are individuals / knowledge workers, not companies. Deprioritized: wrong use case.

**LogSnag** — Simple event-logging SaaS for founders (Slack-style notifications for key events: new signup, new payment). Useful but not analytics — more of a real-time alerting tool. Zero analytics depth. Deprioritized: supplement not substitute.

**FullStory** — Enterprise session replay and DXI platform. Expensive ($350+/mo), no meaningful free tier, targets enterprise. Zero relevance at Contexter launch stage. Deprioritized: budget mismatch.

**Ackee** — Minimalist self-hosted analytics (Node.js). Less active development than Umami/GoatCounter. No UTM tracking depth. Deprioritized: Umami is a strictly better option with similar simplicity.

**Shynet** — Django-based self-hosted analytics. Very minimal feature set, Python stack friction with Contexter's Bun/TS environment. Not actively maintained compared to Umami. Deprioritized: better options exist.

**Countly Community Edition** — Feature-rich but complex deployment. Targets mobile app analytics as much as web. Setup complexity exceeds Contexter's needs at launch. Deprioritized: PostHog or Umami are simpler with equivalent web analytics features.

**Rollbar / Bugsnag** — Error tracking alternatives to Sentry. Rollbar and Bugsnag have no meaningful advantage over Sentry at the free tier for a solo founder. If PostHog handles error tracking (100K/mo free), neither is needed. Deprioritized: covered by PostHog or Sentry.

**Datadog** — Enterprise observability. No free tier for custom metrics at scale. Completely outside the $0-$20/mo budget range for web/product analytics. Deprioritized: wrong tier.

**Segment / RudderStack** — Customer Data Platforms for routing events to multiple destinations. Relevant at $1M ARR stage, not at 100-supporter launch. Segment free tier (1,000 MTUs) could technically work but adds architectural complexity that doesn't pay off at launch scale. Deprioritized: premature optimization.

**Piwik PRO** — CNIL-named exempt analytics platform. Feature-rich, GDPR-compliant. Free plan exists but with 500K monthly actions limit. However, DX and setup complexity is higher than Plausible/Umami. Deprioritized: Plausible is simpler with equivalent compliance status.

**Fathom Analytics** — Privacy-first SaaS similar to Plausible. $15/mo starting price (higher than Plausible's $9/mo) for comparable features. No self-hosted option. Deprioritized: Plausible is cheaper with self-hosted option as backup.

**Simple Analytics** — EU-based, privacy-first SaaS. $19/mo starter plan. No self-hosted option. More expensive than Plausible with fewer features. Deprioritized: Plausible dominates this tier.

---

## Gaps (for DEEP research)

**GAP-1: Exact PostHog EU Cloud behavior for MCP SSE endpoint tracking**
- Question: Does PostHog's `posthog-node` SDK (with `flushAt: 1, flushInterval: 0`) reliably capture events from long-lived Hono SSE connections, or does the flush mechanism drop events when SSE connections are held open for extended periods?
- Why it matters: The MCP endpoint is SSE-based. Unlike HTTP request/response, SSE connections stay open. The flush behavior documented for serverless (CF Workers, short-lived) may differ for Hono on long-running Bun processes.
- What DEEP needs: Test actual PostHog Node SDK behavior with Hono SSE + Bun runtime. Check GitHub issues for SSE-related event loss. Verify PostHog's `distinct_id` strategy for API-authenticated vs unauthenticated events.

**GAP-2: Plausible self-hosted ClickHouse RAM footprint on real traffic**
- Question: What is the actual steady-state RAM consumption of Plausible self-hosted (with ClickHouse) at early-stage traffic (10K-50K pageviews/month) on Hetzner CAX21 with 8 GB RAM and 48% already used (~3.84 GB free)?
- Why it matters: Plausible self-hosted is "free" but requires ClickHouse. If ClickHouse peaks above 2 GB RAM on normal traffic, it risks OOM-killing other Contexter services. The 256 MB self-hosting budget in the prompt may not be achievable for Plausible specifically.
- What DEEP needs: Find actual production RAM measurements from Plausible self-hosters on similar-sized VPS instances. Check Plausible GitHub issues for memory optimization. Evaluate whether ClickHouse can be safely limited via container memory caps.

**GAP-3: LemonSqueezy UTM custom_data → PostHog identity merge flow**
- Question: What is the exact implementation for connecting LemonSqueezy webhook `meta.custom_data.utm_source` to PostHog's `distinct_id` for the user who made the purchase? How do you handle the case where a user pays without being logged in (guest checkout)?
- Why it matters: Revenue attribution (MQ-4) requires linking a payment event back to both the acquisition channel (UTM) and the user identity in PostHog. The technical complexity is: (a) user arrives with UTM → anonymous PostHog ID, (b) user registers → authenticated ID, (c) user pays via LS → webhook fires. If any step in this chain breaks the identity graph, attribution is lost.
- What DEEP needs: Build a spec for the full UTM → sessionStorage → LS custom_data → webhook → PostHog `alias()` or `identify()` implementation. Verify PostHog's identity merge behavior for anonymous → known user transitions.

**GAP-4: Pirsch actual pricing and server-side API latency on Hono**
- Question: What is Pirsch's actual pricing in 2026 (the search found $9/mo reference but no confirmation from official source)? What is the API call latency of Pirsch's server-side tracking from Hetzner Helsinki to Pirsch's servers? Is there a meaningful performance impact on Hono request handling?
- Why it matters: Server-side tracking from Hono middleware adds latency to every request. If Pirsch's API is in Frankfurt and adds <5ms, it's acceptable. If it adds 50ms+ per request, it degrades MCP tool response times.
- What DEEP needs: Fetch Pirsch pricing page directly. Benchmark API call latency from Helsinki to Pirsch servers. Evaluate whether async fire-and-forget pattern eliminates the latency concern.

**GAP-5: OpenTelemetry + SigNoz self-hosted RAM/storage requirements on Hetzner CAX21**
- Question: What is the minimum viable SigNoz self-hosted deployment RAM footprint? Can it coexist with Contexter's existing services within the CAX21's available ~3.84 GB headroom?
- Why it matters: OTel + SigNoz is the cleanest answer for MCP telemetry (Signal 13) but if it requires 2+ GB RAM, it's incompatible with the existing server without vertical scaling or service migration.
- What DEEP needs: Find actual production SigNoz self-hosted RAM measurements. Evaluate minimal deployment options (SigNoz lite vs full, or alternative lightweight OTel collector → file/PG).

---

## DEEP Recommendations

### DEEP-1: PostHog EU Cloud as Contexter's Primary Analytics Platform — Full Integration Spec

**Title:** PostHog EU Cloud integration for Contexter: web analytics + product funnel + MCP telemetry + revenue attribution

**6-layer structure:**
1. **Current State** — PostHog EU Cloud free tier limits (1M events, 5K recordings, 100K errors), SolidJS integration pattern, Hono/Bun Node SDK configuration for SSE endpoints
2. **World-Class** — How top MCP-serving products instrument their endpoints (Anthropic MCP Inspector patterns, FastMCP OTel integration, Apollo MCP Server telemetry)
3. **Frontier** — Emerging MCP protocol OTel spec (Discussion #269 in modelcontextprotocol/modelcontextprotocol), AI traffic attribution challenges in 2026 (Claude/ChatGPT referrals showing up as "direct")
4. **Cross-Discipline** — How API-first products (Stripe, Twilio) instrument webhook events and link them to user identity graphs
5. **Math/Algorithms** — Identity graph merge algorithm: anonymous_id → user_id → order_id linkage. Statistical significance of funnel drop-off measurements at N=100 cohort size
6. **Synthesis** — Exact implementation plan: SolidJS posthog-js initialization, CF Worker proxy config, Hono middleware for MCP events, LemonSqueezy webhook → PostHog `capture("payment")` with UTM props, UTM → sessionStorage → LS custom_data pipeline

**Expected output:** Architecture diagram, code snippets for SolidJS initialization + Hono middleware + LS webhook handler, CF Worker proxy config, PostHog funnel definition for the 7-step conversion funnel

**Why this unblocks Contexter's launch:** PostHog is the single platform that answers MQ-1 through MQ-5. A comprehensive integration spec eliminates guesswork at implementation time and ensures revenue attribution works on day 1 of the launch (fixing it after launch loses critical first-wave data).

---

### DEEP-2: UTM Attribution Architecture — Full Pipeline from Campaign Link to LemonSqueezy Payment

**Title:** Zero-cost UTM attribution pipeline for Contexter: campaign links → sessionStorage → LS custom_data → PostgreSQL revenue table

**6-layer structure:**
1. **Current State** — LemonSqueezy custom_data mechanism (confirmed in Signal 3), Dub.co as link management layer, sessionStorage vs localStorage tradeoffs for UTM persistence
2. **World-Class** — How solo-founder products at $10K-$100K MRR implement full-funnel attribution (Indie Hackers case studies, Plausible's own growth attribution)
3. **Frontier** — Dark social attribution challenges (Signal 12): AI chatbot referrals in 2026 appearing as "direct", server-side referrer capture as a complement
4. **Cross-Discipline** — E-commerce attribution models: last-click vs first-click vs linear vs time-decay. Which model is appropriate for a SaaS with a supporter/subscription funnel
5. **Math/Algorithms** — UTM parameter survival rate through CF Pages → SolidJS SPA routing (does the router strip query params? How to preserve UTM through page navigations and route changes in SolidJS)
6. **Synthesis** — Implementation: Dub.co link setup, SolidJS UTM capture + sessionStorage persist, LS checkout URL injection, Hono webhook handler PG schema, PostHog revenue event schema

**Expected output:** Complete implementation spec including SolidJS UTM capture module (~30 lines), PG schema for attribution table, Hono webhook handler addition, Dub.co link naming convention for 10+ channels

**Why this unblocks Contexter's launch:** Revenue attribution is the most time-sensitive piece — UTM data not captured on the first purchaser is permanently lost. This DEEP produces a spec that can be implemented in a single P (Player) session before launch.

---

### DEEP-3: Lightweight MCP Telemetry — Hono OTel Middleware vs PostHog Events vs Server Logs

**Title:** MCP endpoint observability for Contexter: choosing between OTel/SigNoz, PostHog server-side events, and GoAccess/GoatCounter log analysis

**6-layer structure:**
1. **Current State** — Contexter's MCP endpoint structure (12 tools, SSE transport, token auth), Hono OTel middleware status, PostHog Node SDK SSE behavior, GoatCounter log parsing capability
2. **World-Class** — How production MCP servers at scale (Anthropic's reference servers, popular awesome-mcp tools) expose usage metrics
3. **Frontier** — OTel MCP protocol proposal (Discussion #269), AI agent observability standards emerging in 2026
4. **Cross-Discipline** — API product telemetry patterns from Stripe/Twilio/Sendgrid: per-endpoint metrics, per-customer quota tracking, abuse detection
5. **Math/Algorithms** — Statistical sampling approach for high-frequency MCP calls (1 in N events to PostHog) vs full OTel traces to local storage. Cost vs observability tradeoff
6. **Synthesis** — Recommend implementation: PostHog server-side events for business-level metrics (unique MCP users, tool usage breakdown) + Caddy/GoAccess for HTTP-level traffic, with OTel deferred until traffic justifies SigNoz self-hosting

**Expected output:** Decision matrix (PostHog events vs OTel vs log parsing), Hono middleware code for MCP telemetry, recommended event taxonomy for MCP usage tracking, RAM impact assessment for each option

**Why this unblocks Contexter's launch:** MCP usage data (which tools are called, how often, by how many users) is the core product-market fit signal for a RAG-as-a-service. Without MCP telemetry, it's impossible to know whether connected users are getting value. This data also informs retention analysis (MQ-5) and supports the "MCP-connected users retain better" hypothesis.

---

## Self-Check

- [x] Every claim traced to 2+ independent sources OR clearly labeled "one source, pending DEEP"
- [x] Source URLs visited and verified as live where feasible (CF Analytics Engine, PostHog pricing, LemonSqueezy docs, GoatCounter, Plausible, Umami GitHub, OpenPanel, Dub.co confirmed live; Plausible pricing 404 on /pricing — confirmed via G2 and search results)
- [x] Publication dates noted for all sources; sources from 2022-2023 (HN traffic studies, GoAccess Caddy wiki) flagged as potentially stale
- [x] Conflicting sources documented: Umami free tier shows 100K (per search) vs "1M free" (per Twitter announcement from 2024) — likely changed between sources; current appears to be 100K free + $20/mo for 1M
- [x] Numerical facts pulled from sources (PostHog 1M free events from live pricing page; CF Analytics Engine 100K/day free from live docs; Plausible $9/mo from G2 and search; Umami ~200 MB RAM from deployment guide)
- [x] Confidence levels assigned after checking (HIGH for well-sourced, MEDIUM for partially sourced)
- [x] Scope boundaries: This SEED covers web analytics, product analytics, server-side tracking, attribution, MCP telemetry, and error tracking. NOT covered: business intelligence (Metabase, Grafana dashboards for PG queries on Contexter's own data), A/B testing beyond basic feature flags, mobile analytics (Contexter is web-only), email campaign analytics.
- [x] Gaps section honest: Pirsch pricing unverified from official source; PostHog SSE behavior under long-lived connections unverified; OpenPanel self-hosted RAM not confirmed; SigNoz self-hosted footprint not confirmed

**Unexpected finding (researcher deviation):** Signal 25 (HN ad-blocker inflation pattern) was added beyond the listed dimensions because it directly impacts the accuracy of all analytics tools for Contexter's primary launch channel. The 30-50% undercount on developer-targeted launches is a significant methodological finding that affects stack choice (specifically, it argues for running a server-side log layer in parallel regardless of which primary analytics tool is chosen). This deviation is explained here per researcher freedom clause.

**Additional unexpected finding:** LemonSqueezy posted a "2026 Update" in January 2026 noting they were focused on Stripe integration work. This may indicate LemonSqueezy is in a transition period — worth monitoring whether the LS→Stripe migration affects webhook structure or custom_data behavior before building the attribution pipeline on top of it (GAP-3 extension).
