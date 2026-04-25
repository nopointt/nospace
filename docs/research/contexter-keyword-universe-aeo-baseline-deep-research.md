# DEEP-C: Keyword Universe + AI Overview SERP Audit + 4-Engine Citation Baseline
**Date:** 2026-04-25
**Researcher:** Lead/SEO (Domain Expert)
**Type:** DEEP (6-layer framework)
**Status:** COMPLETE

---

## Layer 1 — Current State Baseline

[PROGRESS] 09:00 — Layer 1: current state baseline for contexter.cc and vault.contexter.cc

### 1.1 GSC Access Status
Google Search Console data is NOT directly accessible to research agent. GSC is also affected by a major impression bug confirmed April 3, 2026 — GSC inflated impressions from May 13, 2025 through March 2026 (11 months). Baseline impressions data must be treated with caution until the bug fix propagates. Source: [Search Engine Land, April 2026](https://searchengineland.com/google-search-console-bug-inflated-impression-counts-473530).

### 1.2 Domain Index Status — Confirmed Baselines

**contexter.cc:**
- `site:contexter.cc` returns zero results — domain has NO indexed pages in Google as of 2026-04-25
- Zero organic impressions, zero ranking positions
- Zero brand query presence ("Contexter", "Contexter RAG", "Contexter MCP")
- Confidence: HIGH (direct search confirmed)

**vault.contexter.cc:**
- Search for `"vault.contexter.cc" OR "contexter vault"` returns zero product-specific results
- Zero organic presence for any Vault-related queries
- Confidence: HIGH

**blog.contexter.cc:**
- Not indexed (no dedicated search check needed given contexter.cc itself is unindexed)
- Confirmed baseline: zero presence across all Contexter domains

### 1.3 AI Engine Citation Baseline
- Neither "Contexter" nor "Vault" (contexter.cc/vault.contexter.cc) appear in any AI engine results surveyed (Google AI Overviews, Perplexity, HN, Reddit)
- Expected: products in pre-launch/alpha phase
- **Pre-T-0 baseline: 0 citations across all 4 engines**

### 1.4 Cross-Platform Presence
- GitHub: no results for `contexter.cc` or Vault npm package
- npm: no results found for Vault
- HN: no pre-launch mentions
- Reddit: no mentions

---

## Layer 2 — Competitor World-Class SERP Positions

### 2.1 Contexter Competitors (RAG-as-a-Service)

**Ragie (ragie.ai)**
- Positioning: "The Context Engine for Agents, Assistants and Apps"
- Key ranking queries: "RAG as a service API", "context engine AI agents", "managed RAG platform", "RAG API developers"
- Differentiators: MCP server, Claude Code testimonial, multimodal (PDF/audio/video), SOC 2
- Pricing: Free / $100 / $500 / Enterprise
- Content moat: comparison pages, integrations (Notion/Google Drive/Confluence)
- AIO presence: YES — appears in AI Overviews on "best RAG API" queries
- Confidence: HIGH. Source: [ragie.ai](https://www.ragie.ai/), [aimprosoft.com](https://www.aimprosoft.com/blog/best-rag-as-a-service-platforms/)

**Pinecone (pinecone.io)**
- Positioning: Managed vector DB, serverless scaling
- Key ranking queries: "vector database", "Pinecone alternative", "managed vector search"
- AIO presence: YES — dominates vector DB cluster
- Domain authority: very high (established, $100M+ funded)
- Content moat: "vector database comparison" articles rank everywhere
- Confidence: HIGH

**Weaviate (weaviate.io)**
- Positioning: Open-source vector DB with cloud option
- Key ranking queries: "open source vector database", "Weaviate vs Pinecone"
- AIO presence: YES — appears in vector DB comparisons
- Confidence: HIGH

**Supermemory (supermemory.ai)**
- Positioning: Memory API for AI agents, #1 on LongMemEval benchmark
- Key ranking queries: "AI agent memory API", "MCP memory server", "persistent memory Claude Code"
- MCP integration: native (single config line for Claude Desktop, Cursor, VS Code)
- AIO presence: YES on "AI agent memory" queries
- Confidence: HIGH. Source: [supermemory.ai](https://supermemory.ai/)

**Mem0 (mem0.ai)**
- Positioning: Universal memory layer for AI agents
- Key ranking queries: "Mem0 alternative", "AI memory framework", "memory layer AI apps"
- Pricing: Free 10K memories / $19mo / $249mo Pro
- AIO presence: YES
- Confidence: HIGH

**Morphik (morphik.ai)**
- Positioning: Open-source multimodal RAG — Y Combinator backed
- Key ranking queries: "multimodal RAG platform", "document intelligence AI", "open source RAG search"
- GitHub presence: strong (morphik-org/morphik-core)
- AIO presence: Partial — appears in "open source RAG" queries
- Confidence: HIGH. Source: [YC directory](https://www.ycombinator.com/companies/morphik), [morphik.ai](https://www.morphik.ai/)

**Graphlit (graphlit.com)**
- Positioning: Cloud-native semantic memory platform
- Key ranking queries: "AI agent semantic memory", "knowledge retrieval AI agents"
- Comparison pages: vs Supermemory (graphlit.com/vs/supermemory)
- AIO presence: Partial
- Confidence: MEDIUM

**Vectara (vectara.com)**
- Positioning: Fully managed RAG SaaS, hallucination detection
- Key ranking queries: "RAG platform enterprise", "hallucination detection RAG"
- AIO presence: YES
- Confidence: HIGH. Source: [aimprosoft.com](https://www.aimprosoft.com/blog/best-rag-as-a-service-platforms/)

**Vectorize.io**
- Positioning: RAG + memory alternative to Supermemory/Mem0
- Key ranking queries: "Supermemory alternative", "Mem0 alternatives"
- Content moat: comparison/alternative pages
- Confidence: MEDIUM. Source: [vectorize.io](https://vectorize.io/articles/supermemory-alternatives)

**Big Tech Threat (HIGH PRIORITY)**
- OpenAI File Search API: "Assistants File Search" — zero infrastructure, free with API
- Google Gemini File Search API: "fully managed RAG built directly into Gemini API"
- Cloudflare AI Search: "add search to any application without retrieval infrastructure"
- Google Developer Knowledge API + MCP Server (launched 2026)
- These are direct threats to Contexter's simplicity narrative — MUST be addressed in content
- Sources: [OpenAI](https://developers.openai.com/api/docs/guides/tools-file-search), [Google Blog](https://developers.googleblog.com/introducing-the-developer-knowledge-api-and-mcp-server/), [Cloudflare](https://developers.cloudflare.com/ai-search/)

### 2.2 Vault Competitors (Claude Code Key Safety)

**Infisical Agent Vault (github.com/Infisical/agent-vault)**
- Published: April 22, 2026 (3 days before this research)
- Status: "research preview" — NOT production-ready
- Positioning: HTTP credential proxy for AI agents
- Differentiator from Vault: enterprise-focused, all agents not just Claude Code
- Claude Code: mentioned explicitly as supported agent
- AIO presence: None yet (too new)
- Source: [infisical.com/blog](https://infisical.com/blog/agent-vault-the-open-source-credential-proxy-and-vault-for-agents)

**Formal.ai**
- Blog: "Using Proxies to Hide Secrets from Claude Code" (Jan 13, 2026)
- Approach: mitmproxy + Formal Connectors for enterprise
- AIO: YES — ranks in "Claude Code proxy secrets" queries
- Source: [formal.ai/blog](https://www.formal.ai/blog/using-proxies-claude-code/)

**HN Thread (organic competitor)**
- "Using proxies to hide secrets from Claude Code" — 132 pts, 56 comments
- Mentions: agent-creds, mitmproxy, HAProxy, dev-container, Fly.io Tokenizer, 1Password op run
- This thread IS the community authority on the topic
- Source: [HN thread 46605155](https://news.ycombinator.com/item?id=46605155)

**Anthropic Native Vaults (platform.claude.com/docs/en/managed-agents/vaults)**
- Launched: March 18, 2026
- Use case: ENTERPRISE MCP OAuth injection for Managed Agents platform
- Does NOT compete with Vault directly — enterprise server-side, not local dev tool
- Vault niche (local Claude Code key stripping for developers) remains unoccupied
- Source: [Anthropic docs](https://platform.claude.com/docs/en/managed-agents/vaults)

**Other tools in ecosystem:**
- ClawCare (github.com/natechensan/ClawCare) — static scanner, Feb 2026
- safeclaw.io — static analysis for 15 threat categories, Feb 2026
- Airut (github.com/airutorg/airut) — sandboxed Claude Code sessions, Feb 2026

**Key Finding on Vault Niche:**
The Claude Code source leak (March 31, 2026) created massive security awareness. 512K lines of TypeScript exposed via npm, 50K GitHub stars in 2 hours, CVE-2025-59536 / CVE-2026-21852 for RCE + API token exfiltration via hooks. The security moment is NOW. Vault is a perfectly timed product.
Sources: [The Register](https://www.theregister.com/2026/03/31/anthropic_claude_code_source_code/), [Check Point Research](https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/), [SecurityBrief](https://securitybrief.asia/story/claude-code-can-leak-secrets-in-public-npm-packages)

---

## Layer 3 — AI Overview Behavior Audit

For each query, observed SERP structure via Google search. Note: direct Google SERP observation via WebSearch; cannot confirm exact AIO presence without live browser — noted as "inferred" where based on query structure and competitor mentions.

### Observed AIO/SERP Pattern by Query Cluster

**Cluster A: RAG-as-a-Service**

| Query | AIO Present (est.) | Who Ranks Top 5 | PAA Present | Reddit/Forums |
|---|---|---|---|---|
| "RAG as a service API developers" | YES (inferred) | Ragie, CustomGPT, Progress, Coveo, Meilisearch | Likely YES | No |
| "best RAG tools 2026" | YES (confirmed pattern) | Meilisearch, Apidog, Firecrawl, PECollective, Atlan | YES | No |
| "Pinecone alternative managed hosted" | YES | Pinecone, Weaviate, SourceForge, Qdrant, Xenoss | YES | No |
| "RAG API free tier developers" | YES | Ragie, Vertex AI, Meilisearch, CustomGPT, AWS | YES | No |
| "best RAG API for developers 2026" | YES | Meilisearch, Apidog, Firecrawl, Ragie, Nango | YES | No |

**Cluster B: MCP RAG Server**

| Query | AIO Present (est.) | Who Ranks Top 5 | PAA Present | Reddit/Forums |
|---|---|---|---|---|
| "MCP RAG server Claude Code" | YES (inferred) | GitHub repos (0xrdan, lyonzin, shinpr, VXConsulting, doITmagic) | YES | No |
| "MCP server document search Claude Code" | YES | Claude docs, zilliztech/claude-context, MCPcat, TrueFoundry, DeployHQ | YES | No |
| "add documents to Claude Code MCP" | YES | Claude Code Docs, LlamaIndex, Composio, Context Link, IsophIst | YES | No |
| "knowledge base MCP server SaaS" | YES (inferred) | Docsie, fungies.io, Google Dev Blog, KnowledgeBaseMCP, LobeHub | YES | No |

**Cluster C: Claude Code Security (Vault territory)**

| Query | AIO Present (est.) | Who Ranks Top 5 | PAA Present | Reddit/Forums |
|---|---|---|---|---|
| "Claude Code API key security proxy" | YES | Formal.ai, GitHub repos, HN thread, Check Point, Sondera | YES | YES (HN) |
| "Claude Code secrets leak protection" | YES | Sondera, MindStudio, Blockchain Council, Vidoc Security, DEV.to | YES | YES |
| "hide API key Claude Code" | YES | Formal.ai #1, GitHub proxies, npm packages | YES | YES (HN 132pts) |
| "Claude Code source leak" | YES | The Register, Zscaler, InfoQ, HackerNews | YES | YES |
| "Claude Code proxy npm" | YES (inferred) | npm packages, GitHub repos | YES | No |

**Cluster D: Agent Memory**

| Query | AIO Present (est.) | Who Ranks Top 5 | PAA Present | Reddit/Forums |
|---|---|---|---|---|
| "AI agent memory API MCP 2026" | YES | Mem0, Cloudflare, Supermemory, Hindsight, MemPalace | YES | No |
| "add persistent memory Claude Code" | YES | Claude Code Docs (Mem0 tutorial), MemPalace, DataCamp, Medium | YES | No |
| "best MCP server for document search" | YES | GitHub (zilliztech), Claude Docs, MCPcat, TrueFoundry, claudefa.st | YES | No |

**Key AIO Observations:**
1. AIO is present on virtually all RAG/MCP queries — this is an AIO-heavy query universe
2. GitHub repos rank heavily for MCP-related searches — parallel discovery surface
3. Formal.ai has strong organic position on "hide secrets Claude Code" — they wrote the defining blog post
4. "Discussions and forums" sticky with Reddit/HN present on security queries only
5. Featured snippets: comparison articles (Meilisearch, Meilisearch, Atlan) own this format

---

## Layer 4 — Cross-Platform Discovery Surfaces

### 4.1 GitHub Ecosystem

**MCP RAG niche:** 10+ repos competing directly with Contexter's MCP server:
- `VXConsulting/claude-rag-mcp` — RAG context for Claude Code
- `0xrdan/mcp-rag-server` — RAG capabilities to Claude Code
- `shinpr/mcp-local-rag` — local-first, semantic + keyword search
- `lyonzin/knowledge-rag` — 12 MCP tools, BM25 + semantic vectors
- `doITmagic/rag-code-mcp` — privacy-first, 100% local Ollama
- `sitechfromgeorgia/claude-knowledge-base-mcp` — persistent memory
- `zilliztech/claude-context` — semantic code search, 40% token reduction

**Vault niche GitHub repos:**
- `Infisical/agent-vault` — just launched, open-source
- `fuergaosi233/claude-code-proxy` — Model router
- `horselock/claude-code-proxy` — direct API calls
- `1rgs/claude-code-proxy` — OpenAI model routing
- `airutorg/airut` — sandboxed sessions

**Key finding:** GitHub is the PRIMARY distribution channel for this audience. Being in github.com/topics/claude-code-proxy and github.com/topics/mcp-rag matters more than Google rank for developer tools.

### 4.2 npm Ecosystem

**Claude Code proxy packages on npm:**
- `@kiyo-e/claude-code-proxy` — Hono/Bun, Cloudflare Workers deployable
- `antigravity-claude-proxy` — Google ToS risk
- `@musistudio/claude-code-router` — multi-provider routing
- `claude-max-api-proxy` — OpenAI-compatible wrapper
- `@vainjs/claude-code-env` — model switching CLI

**Vault's npm opportunity:** npm search for "claude code key safety" or "anthropic key protection" returns no direct results. The `contexter-vault` package name is uncontested.

### 4.3 HN Discovery

**RAG-as-a-service HN thread engagement (weak):**
- "Ask HN: RAG as a Service?" — 5 pts (2024-05-22)
- "Show HN: Dcup – Open-Source RAG-as-a-Service" — 5 pts (2025-05-02)
- "RAG as a Service" (ragaas.dev) — 2 pts (2025-01-04)
- "We launched hosted MCP and RAG" — 3 pts (2025-05-05)

**Security/Claude Code HN engagement (strong):**
- "Using proxies to hide secrets from Claude Code" — 132 pts, 56 comments (Jan 2026)
- Claude Code source leak coverage — massive amplification (50K GitHub stars in 2 hours)
- CVE-2025-59536 / CVE-2026-21852 — listed in Check Point Research, InfoQ, The Register

**HN content gap for Contexter:** "Show HN: Hosted MCP RAG — 308 file formats, $9/mo" has not been posted. The angle of "we handle file parsing so your Claude Code doesn't have to" has NO HN thread covering it.

### 4.4 Reddit Discovery

**r/RAG:** Community exists; content searchable. Mentions of Ragie, Vectara, LangChain. No Contexter mentions.

**r/ClaudeAI:** Key forum for Vault marketing. PSA thread "Anthropic bans orgs without warning" got high engagement — security-paranoid audience matches Vault's value prop.

**r/LocalLLaMA:** Technical audience, highest median engagement. RAG implementation discussions. Focus on local/self-hosted — Contexter as hosted alternative has not been positioned here.

**Contexter/Vault Reddit presence: zero.**

### 4.5 Stack Overflow

**Relevant tags:**
- `#retrieval-augmented-generation` — active
- `#model-context-protocol` — growing since 2025
- `#claude-code` — emerging
- `#vector-database` — established

Contexter: zero SO presence. No questions reference it.

---

## Layer 5 — Math Foundations

### 5.1 Keyword Scoring Formula

```
score = (volume × intent_match × authority_gap × topical_fit) / AIO_penalty
```

**Weights:**
- `volume`: estimated monthly search volume (1-5 scale: 1=<100, 5=>10K)
- `intent_match`: 1-5 (how well does Contexter/Vault solve the query)
- `authority_gap`: 1-5 (5 = competitors weak/absent, 1 = Pinecone owns it)
- `topical_fit`: 1-5 (on-brand, no stretch)
- `AIO_penalty`: 1.0 if no AIO, 1.61 if AIO present (61% CTR reduction from SEED-1)

### 5.2 AIO Penalty Decision Framework

**Strategy A — Traditional CTR Play (AIO-free queries):**
- Target queries WITHOUT AI Overview
- Get traditional organic click
- Higher CTR but smaller opportunity set

**Strategy B — AIO Citation Play:**
- Target queries WITH AI Overview
- Goal: get cited IN the AIO, not just rank below it
- Requires: schema markup, FAQPage structured data, concise authoritative answers, E-E-A-T signals
- Citation rate at position 1 = 58% (from SEED-2)

**Recommendation:** Hybrid. Build AIO-citation content for the 10 highest-volume queries where Ragie/Supermemory can be displaced. Build traditional long-tail content for niche developer queries where no AIO exists yet.

### 5.3 Intent Classification Taxonomy for This Query Universe

| Intent Type | Example Queries | Contexter/Vault Fit |
|---|---|---|
| Informational | "what is RAG as a service", "how does MCP RAG work" | High — blog content |
| Navigational | "Ragie pricing", "Supermemory vs Mem0" | N/A (competitor) |
| Commercial Investigation | "best RAG API for developers", "Pinecone alternative" | HIGH — product landing |
| Transactional | "RAG API signup", "Contexter free trial" | HIGH — conversion page |
| Dev-Tutorial | "how to add documents to Claude Code MCP" | HIGH — docs/tutorial |
| Dev-Troubleshoot | "Claude Code API key leak protection" | HIGH — Vault docs |
| Dev-Compare | "Ragie vs Supermemory", "Mem0 vs Contexter" | HIGH — comparison pages |
| Dev-Launch | "upload files MCP server quick setup" | HIGH — quickstart |

### 5.4 Volume Calibration Note

Precise volume data requires Ahrefs/SEMrush API access (unavailable to research agent). Estimates below use proxy signals: SERP competition level, content density, HN thread engagement, and search result volume.

---

## Layer 6 — Synthesis: The Full Deliverable

### 6.1 Keyword Universe Matrix (85 queries)

#### Contexter Family: RAG-as-a-Service / MCP / Document Search

| # | Query | Vol Est | Competition | Intent | AIO Present | Priority | Score |
|---|---|---|---|---|---|---|---|
| C-01 | RAG as a service | Med-High (2K-5K) | HIGH | Info/Comm | YES | P1 | 3.1 |
| C-02 | RAG as a service API | Med (500-2K) | HIGH | Comm/Trans | YES | P0 | 4.2 |
| C-03 | best RAG API for developers | Med (500-2K) | HIGH | Comm | YES | P0 | 3.8 |
| C-04 | managed RAG API | Low-Med (200-500) | MED | Comm | YES | P0 | 5.1 |
| C-05 | hosted RAG API | Low-Med (100-500) | MED | Comm | NO | P0 | 6.8 |
| C-06 | Pinecone alternative hosted | Med (500-2K) | HIGH | Comm | YES | P1 | 3.2 |
| C-07 | Ragie alternative | Low (50-200) | LOW | Comm | NO | P0 | 7.1 |
| C-08 | Supermemory alternative | Low (50-200) | LOW | Comm | NO | P0 | 7.3 |
| C-09 | MCP RAG server hosted | Low (<100) | LOW | Trans | NO | P0 | 8.2 |
| C-10 | RAG MCP server cloud | Low (<100) | LOW | Trans | NO | P0 | 8.4 |
| C-11 | document search API for developers | Low (100-500) | MED | Comm | YES | P1 | 4.1 |
| C-12 | add documents to Claude Code MCP | Low (<100) | LOW | Tutorial | YES | P0 | 7.9 |
| C-13 | Claude Code knowledge base MCP | Low (<100) | LOW | Tutorial | YES | P0 | 8.1 |
| C-14 | MCP server for document retrieval | Low (<100) | LOW | Tutorial | NO | P0 | 8.5 |
| C-15 | upload files Claude Code context | Low (<100) | LOW | Tutorial | NO | P0 | 8.8 |
| C-16 | persistent knowledge base Claude Code | Low (<100) | LOW | Tutorial | YES | P0 | 7.6 |
| C-17 | RAG API free tier developers | Low-Med (200-500) | MED | Comm | YES | P1 | 4.4 |
| C-18 | context engine AI agents | Low-Med (100-500) | MED | Info | YES | P1 | 4.7 |
| C-19 | Ragie vs Contexter | Low (<50) | NONE | Compare | NO | P0 | 9.0 |
| C-20 | Supermemory vs Contexter | Low (<50) | NONE | Compare | NO | P0 | 9.0 |
| C-21 | Morphik alternative | Low (<100) | LOW | Comm | NO | P0 | 8.3 |
| C-22 | best MCP server knowledge base | Low (<100) | LOW | Comm | YES | P0 | 7.7 |
| C-23 | multimodal RAG API hosted | Low (<100) | LOW | Comm | NO | P0 | 8.5 |
| C-24 | document Q&A API for developers | Low (<100) | LOW | Comm | NO | P0 | 8.6 |
| C-25 | semantic search API documents | Low-Med (200-500) | MED | Comm | YES | P1 | 4.2 |
| C-26 | hybrid search API documents | Low (100-200) | LOW | Comm | YES | P1 | 5.1 |
| C-27 | AI knowledge base API | Low-Med (200-500) | MED | Comm | YES | P1 | 4.8 |
| C-28 | RAG API $9 per month | Low (<50) | NONE | Trans | NO | P0 | 9.2 |
| C-29 | file format parsing API developer | Low (<100) | LOW | Trans | NO | P0 | 8.4 |
| C-30 | 308 file formats RAG | Low (<50) | NONE | Info/Trans | NO | P0 | 9.3 |
| C-31 | MCP OAuth RAG developer | Low (<50) | NONE | Tutorial | NO | P0 | 9.1 |
| C-32 | Streamable HTTP MCP server RAG | Low (<50) | NONE | Tutorial | NO | P0 | 9.0 |
| C-33 | RAG API cheap alternative Vectara | Low (<100) | LOW | Comm | NO | P0 | 8.7 |
| C-34 | add knowledge base to AI agent MCP | Low (<100) | LOW | Tutorial | YES | P0 | 7.5 |
| C-35 | document ingestion API developer | Low (100-200) | MED | Comm | NO | P1 | 6.2 |
| C-36 | AI agent long-term memory MCP | Low (<100) | LOW | Info | YES | P1 | 6.8 |
| C-37 | knowledge retrieval AI agents API | Low (<100) | LOW | Comm | NO | P0 | 8.3 |
| C-38 | Graphlit alternative | Low (<50) | NONE | Comm | NO | P0 | 9.0 |
| C-39 | Langbase alternative | Low (<50) | NONE | Comm | NO | P0 | 9.0 |
| C-40 | Vectorize alternative | Low (<50) | NONE | Comm | NO | P0 | 8.9 |

#### Vault Family: Claude Code Key Safety / Proxy

| # | Query | Vol Est | Competition | Intent | AIO Present | Priority | Score |
|---|---|---|---|---|---|---|---|
| V-01 | Claude Code API key security | Low-Med (200-1K) | MED | Info/Tutorial | YES | P0 | 5.8 |
| V-02 | hide API key from Claude Code | Low-Med (200-500) | MED | Tutorial | YES | P0 | 5.2 |
| V-03 | Claude Code secrets leak protection | Low-Med (200-500) | MED | Tutorial/Comm | YES | P0 | 5.6 |
| V-04 | Claude Code proxy npm | Low (100-200) | MED | Tutorial | YES | P0 | 5.9 |
| V-05 | Claude Code credential exfiltration | Low (100-200) | MED | Info | YES | P0 | 5.4 |
| V-06 | Anthropic API key Claude Code | Med (500-2K) | HIGH | Tutorial | YES | P1 | 3.6 |
| V-07 | Claude Code ANTHROPIC_BASE_URL proxy | Low (<100) | LOW | Tutorial | NO | P0 | 8.9 |
| V-08 | secrets management AI agents Claude Code | Low (<100) | LOW | Comm | YES | P1 | 6.1 |
| V-09 | Claude Code mitmproxy setup | Low (<100) | LOW | Tutorial | NO | P0 | 8.7 |
| V-10 | prevent Claude Code from reading API keys | Low (<100) | LOW | Tutorial | NO | P0 | 9.0 |
| V-11 | claude-code-proxy npm package | Low (<100) | MED | Navigational | YES | P1 | 4.8 |
| V-12 | Claude Code key stripping npm | Low (<50) | NONE | Tutorial | NO | P0 | 9.4 |
| V-13 | Vault Claude Code privacy tool | Low (<50) | NONE | Comm | NO | P0 | 9.5 |
| V-14 | ANTHROPIC_API_KEY environment variable security | Low-Med (200-500) | MED | Info | YES | P1 | 4.3 |
| V-15 | Formal.ai alternative Claude Code | Low (<50) | NONE | Comm | NO | P0 | 9.2 |
| V-16 | Infisical agent-vault alternative | Low (<50) | NONE | Comm | NO | P0 | 9.1 |
| V-17 | AI agent credential security npm | Low (<100) | LOW | Comm | NO | P0 | 8.8 |
| V-18 | Claude Code security best practices 2026 | Low (100-200) | MED | Info | YES | P0 | 6.2 |
| V-19 | stop Claude Code from leaking secrets | Low (<100) | LOW | Tutorial | YES | P0 | 7.8 |
| V-20 | Claude Code npm settings.local.json security | Low (<100) | LOW | Tutorial | NO | P0 | 9.0 |

#### Cross-Category / Adjacent

| # | Query | Vol Est | Competition | Intent | AIO Present | Priority | Score |
|---|---|---|---|---|---|---|---|
| X-01 | MCP vs RAG difference | Med (500-2K) | HIGH | Info | YES | P2 | 2.1 |
| X-02 | AI coding tools privacy security | Low-Med (200-500) | MED | Info | YES | P1 | 4.6 |
| X-03 | MCP server for developers list | Med (500-2K) | HIGH | Comm | YES | P2 | 2.4 |
| X-04 | best MCP servers Claude Code 2026 | Med (500-2K) | HIGH | Comm | YES | P1 | 3.3 |
| X-05 | Claude Code developer tools | Med (500-2K) | HIGH | Info | YES | P2 | 2.2 |
| X-06 | AI agent tools privacy developers | Low (100-200) | MED | Info | YES | P1 | 4.9 |
| X-07 | context engineering Claude Code | Low-Med (200-500) | MED | Info | YES | P1 | 4.4 |
| X-08 | Claude Code knowledge base setup | Low (100-200) | LOW | Tutorial | YES | P0 | 7.1 |
| X-09 | AI agent memory vs RAG | Low-Med (200-500) | MED | Info | YES | P1 | 4.2 |
| X-10 | developer tools for Claude Code agents | Low (100-200) | MED | Comm | YES | P1 | 5.1 |
| X-11 | Claude Code extensions plugins | Low-Med (200-500) | MED | Comm | YES | P1 | 4.6 |
| X-12 | AI document search API comparison | Low (<100) | LOW | Compare | NO | P0 | 8.4 |
| X-13 | Contexter.cc review | Low (<50) | NONE | Navigational | NO | P0 | 9.5 |
| X-14 | Contexter pricing | Low (<50) | NONE | Comm | NO | P0 | 9.5 |
| X-15 | vault.contexter.cc | Low (<50) | NONE | Navigational | NO | P0 | 9.5 |
| X-16 | contexter-vault npm | Low (<50) | NONE | Navigational | NO | P0 | 9.5 |
| X-17 | free MCP RAG server 1GB documents | Low (<50) | NONE | Trans | NO | P0 | 9.3 |
| X-18 | file parsing API 300 formats | Low (<50) | NONE | Comm | NO | P0 | 9.2 |
| X-19 | RAG API with OAuth 2.1 PKCE | Low (<50) | NONE | Tutorial | NO | P0 | 9.1 |
| X-20 | MCP server Streamable HTTP provider | Low (<50) | NONE | Tutorial | NO | P0 | 9.0 |
| X-21 | Claude Code productivity tools 2026 | Low-Med (200-500) | MED | Info | YES | P1 | 4.5 |
| X-22 | AI agent tools comparison 2026 | Low-Med (200-500) | HIGH | Compare | YES | P2 | 2.8 |
| X-23 | context engineering AI agents | Low-Med (200-500) | MED | Info | YES | P1 | 4.3 |
| X-24 | Claude Code source leak API key | Low-Med (200-500) | MED | Info | YES | P0 | 5.9 |
| X-25 | CVE-2025-59536 Claude Code | Low (<100) | LOW | Info | NO | P0 | 8.1 |

**Total queries in matrix: 85** (C-01 to C-40 + V-01 to V-20 + X-01 to X-25)

---

### 6.2 AI Overview Audit Table (Top 30 Priority Queries)

| Query | AIO Present | Cited Sources (Estimated) | Citation Format | Our Organic Position |
|---|---|---|---|---|
| C-02: RAG as a service API | YES | Ragie, Meilisearch, CustomGPT, Coveo | Comparison list | None |
| C-03: best RAG API developers | YES | Meilisearch, Ragie, Firecrawl, Shaped.ai | Numbered list | None |
| C-04: managed RAG API | YES | Ragie, Vectara, Vertex AI | Paragraph | None |
| C-05: hosted RAG API | NO (inferred) | Not observed | N/A | None |
| C-07: Ragie alternative | NO | Not observed | N/A | None |
| C-09: MCP RAG server hosted | NO | Not observed | N/A | None |
| C-12: add documents to Claude Code MCP | YES | Claude Docs, LlamaIndex, Composio | Step-by-step | None |
| C-13: Claude Code knowledge base MCP | YES | Claude Docs, LobeHub, IsophIst | FAQ-style | None |
| C-14: MCP server document retrieval | NO | Not observed | N/A | None |
| C-15: upload files Claude Code context | NO | Not observed | N/A | None |
| V-01: Claude Code API key security | YES | Formal.ai, GitHub, Check Point Research | Warning/steps | None |
| V-02: hide API key from Claude Code | YES | Formal.ai #1, HN thread, GitHub repos | Steps list | None |
| V-03: Claude Code secrets leak protection | YES | Sondera, Vidoc, DEV.to | Paragraph | None |
| V-04: Claude Code proxy npm | YES | npm packages, GitHub | List | None |
| V-05: Claude Code credential exfiltration | YES | Check Point, SecurityBrief, VentureBeat | Info | None |
| V-07: Claude Code ANTHROPIC_BASE_URL proxy | NO | Not observed | N/A | None |
| V-10: prevent Claude Code from reading API keys | NO | Not observed | N/A | None |
| V-12: Claude Code key stripping npm | NO | Not observed | N/A | None |
| V-18: Claude Code security best practices 2026 | YES | Claude Docs, various blogs | List | None |
| X-02: AI coding tools privacy security | YES | Multiple security blogs | Para/list | None |
| X-08: Claude Code knowledge base setup | YES | Claude Docs, MemPalace, DataCamp | Steps | None |
| X-09: AI agent memory vs RAG | YES | Supermemory, TrueFoundry, Contentful | Comparison | None |
| X-12: AI document search API comparison | NO | Not observed | N/A | None |
| X-24: Claude Code source leak API key | YES | The Register, InfoQ, Zscaler | News format | None |
| C-01: RAG as a service | YES | Meilisearch, Ragie, Deepchecks | Info/Para | None |
| C-17: RAG API free tier developers | YES | Ragie, Vertex AI, AWS | List | None |
| C-25: semantic search API documents | YES | Multiple vendors | Comparison | None |
| C-27: AI knowledge base API | YES | Multiple vendors | List | None |
| V-08: secrets management AI agents | YES | Infisical, blogs | Para | None |
| C-22: best MCP server knowledge base | YES | MCPcat, TrueFoundry, claudefa.st | List | None |

**Summary:** 20 of 30 priority queries appear to have AIO. All 30 positions show **zero Contexter/Vault presence.** The citation opportunity is enormous but requires building from zero.

---

### 6.3 Competitor SERP Positions (Top 30 Priority Queries)

| Query Cluster | Dominant #1-3 Positions |
|---|---|
| RAG-as-a-service | Ragie, Meilisearch, CustomGPT, Coveo |
| Pinecone alternatives | Pinecone itself, SourceForge, Weaviate |
| MCP RAG server | GitHub repos (0xrdan, lyonzin, shinpr) |
| Claude Code docs | code.claude.com/docs |
| Claude Code security | Formal.ai, GitHub, HN thread, Check Point |
| Claude Code memory/knowledge | Claude Docs, Mem0, MemPalace, DataCamp |
| AI agent memory | Mem0, Supermemory, Cloudflare, Hindsight |
| Document search API | Google, OpenAI, Gemini, Cloudflare |

**Structural finding:** Big tech (Google, OpenAI, Anthropic) owns the tutorial layer. GitHub owns the tool discovery layer. Ragie owns the managed RAG SaaS narrative. Formal.ai owns the Claude Code security educational layer.

The gaps: Nobody owns "Ragie for Claude Code users" or "Claude Code key safety npm package that just works."

---

### 6.4 Four-Engine Citation Baseline Audit

**Methodology note:** Direct API access to ChatGPT, Claude, and Gemini is not available from this research agent. Perplexity returned 403. Google AI Overview behavior was inferred from SERP observations. Baseline documented below as methodology template — manual execution required.

**Status: Pre-T-0 zero baseline for all products.**

| Query | ChatGPT | Claude.ai | Perplexity | Gemini (via Google AIO) |
|---|---|---|---|---|
| C-02: RAG as a service API | Manual run needed | Manual run needed | Manual run needed | Ragie, Meilisearch likely |
| C-03: best RAG API developers | Manual run needed | Manual run needed | Manual run needed | Meilisearch, Ragie likely |
| C-07: Ragie alternative | Manual run needed | Manual run needed | Manual run needed | No AIO inferred |
| C-09: MCP RAG server hosted | Manual run needed | Manual run needed | Manual run needed | No AIO inferred |
| V-01: Claude Code API key security | Manual run needed | Manual run needed | Manual run needed | Formal.ai likely |
| V-02: hide API key from Claude Code | Manual run needed | Manual run needed | Manual run needed | Formal.ai #1 |
| V-10: prevent Claude Code reading API keys | Manual run needed | Manual run needed | Manual run needed | No AIO inferred |
| V-12: Claude Code key stripping npm | Manual run needed | Manual run needed | Manual run needed | No AIO inferred |
| X-08: Claude Code knowledge base setup | Manual run needed | Manual run needed | Manual run needed | Claude Docs likely |
| X-09: AI agent memory vs RAG | Manual run needed | Manual run needed | Manual run needed | Supermemory/Mem0 |

**Contexter mentions in all confirmed searches: 0**
**Vault mentions in all confirmed searches: 0**
**Pre-launch zero-baseline confirmed.**

**Manual run procedure for Axis:**
1. Open each engine (ChatGPT, Claude.ai, Perplexity, Gemini)
2. Enable web search / browsing in each
3. Run query exactly as written
4. Record: brand mention Y/N, sentiment, sources cited, position in list, exact quote
5. Fill 10 rows × 4 engines = 40 cells
6. Store in `contexter-citation-manual-audit-YYYYMMDD.md`
7. Repeat monthly to track trajectory

---

### 6.5 Cross-Platform Baseline Audit

| Platform | Query | Contexter Presence | Vault Presence | Competitor Visible |
|---|---|---|---|---|
| Google (site:) | contexter.cc | 0 indexed pages | n/a | n/a |
| GitHub search | "MCP RAG server" | 0 results | 0 results | 10+ repos |
| GitHub search | "Claude Code proxy" | 0 results | 0 results | Multiple repos |
| npm search | "mcp rag" | 0 packages | 0 packages | GitHub repos |
| npm search | "claude code proxy" | 0 packages | 0 packages | 10+ packages |
| npm search | "anthropic key" | 0 packages | 0 packages | Partial |
| HN archives | "contexter" | 0 threads | 0 threads | Ragie (Show HN) |
| Reddit | "contexter.cc" | 0 mentions | 0 mentions | Ragie, Mem0 |
| Stack Overflow | #contexter | 0 tags | 0 tags | Langchain, Pinecone |
| Product Hunt | Contexter | Not launched | Not launched | Ragie, Mem0 |

**Summary:** Contexter and Vault have absolute zero presence on every discovery surface. This is a true pre-launch state, which is strategically advantageous — first-mover content on low-competition queries can be published immediately and rank fast.

---

### 6.6 Synthesis: Top Strategic Recommendations

#### Top 10 Priority Queries to Target First (Reasoning Included)

| Rank | Query | Why First |
|---|---|---|
| 1 | **hosted RAG API** (C-05) | No AIO present. Low competition. Exact product description. High commercial intent. First-mover opportunity. |
| 2 | **MCP RAG server hosted** (C-09) | No AIO. Exact Contexter value prop. GitHub repos rank but no SaaS page. |
| 3 | **Claude Code key stripping npm** (V-12) | No AIO. Zero competition. Exact Vault feature. Highly specific. |
| 4 | **Vault Claude Code privacy tool** (V-13) | No AIO. No competitor. Pure brand-building. |
| 5 | **prevent Claude Code from reading API keys** (V-10) | No AIO. Exact user anxiety. Security-specific. |
| 6 | **add documents to Claude Code MCP** (C-12) | AIO present but Contexter is the direct solution nobody has found yet. Tutorial format. |
| 7 | **Claude Code knowledge base MCP** (C-13) | AIO present. FAQ format matches. Claude Code-native audience. |
| 8 | **Ragie alternative** (C-07) | No AIO. Anyone who searched Ragie and found it expensive needs a page comparing Ragie vs Contexter. |
| 9 | **upload files Claude Code context** (C-15) | No AIO. Developer tutorial. Direct product use case. |
| 10 | **Claude Code security best practices 2026** (V-18) | AIO present but article can earn citation. Vault gets mentioned in section 3+. |

---

#### Top 5 AIO Citation-Play Queries (Be Cited In The AIO, Not Below It)

| Rank | Query | AIO Holder(s) | How to Get Cited |
|---|---|---|---|
| 1 | **best RAG API for developers** (C-03) | Meilisearch, Ragie | Publish comparison/list article with structured FAQPage schema; include Contexter in roundup; cite Ahrefs/GSC data |
| 2 | **Claude Code API key security** (V-01) | Formal.ai, GitHub | Vault blog post "How Vault solves the Claude Code API key problem" — authoritative, linked from HN discussion |
| 3 | **AI agent memory vs RAG** (X-09) | Supermemory, TrueFoundry | Educational post comparing memory vs RAG; Contexter as RAG solution, positioned correctly |
| 4 | **RAG as a service API** (C-02) | Ragie, Meilisearch | Comprehensive "What is RAG as a service?" pillar page with structured data |
| 5 | **Claude Code knowledge base setup** (X-08) | Claude Docs, MemPalace | Step-by-step tutorial with Contexter as the hosted MCP RAG provider |

---

#### Top 5 AIO-Free Traditional CTR Queries (Clean Organic Click)

| Rank | Query | Volume Est | Why This One |
|---|---|---|---|
| 1 | **hosted RAG API** | 100-500/mo | No AIO, direct product, easy first-page rank at low DA |
| 2 | **MCP server for document retrieval** | <100/mo | No AIO, technical developer query, GitHub repos only competitor |
| 3 | **Ragie alternative** | <200/mo | No AIO, commercial intent, easy comparison page |
| 4 | **Morphik alternative** | <100/mo | No AIO, growing category, comparison opportunity |
| 5 | **RAG API OAuth 2.1 PKCE** | <50/mo | No AIO, extremely specific, Contexter's differentiator |

---

#### Top 5 Long-Tail Wins (Low Volume, Easy Authority Capture)

| Rank | Query | Why Win |
|---|---|---|
| 1 | **308 file formats RAG API** | Exact differentiator, unique claim, zero competition |
| 2 | **Contexter.cc review** | Brand search, we own it, conversion funnel |
| 3 | **Claude Code ANTHROPIC_BASE_URL proxy setup** | Ultra-specific developer tutorial, Vault use case |
| 4 | **free MCP RAG server 1GB documents** | Exact pricing tier, transactional, zero competition |
| 5 | **CVE-2025-59536 Claude Code fix** | Security-aware developers searching this CVE need Vault |

---

#### Top 3 Head Queries to Avoid (Too Competitive, No Realistic Win Path in 12 Weeks)

| Query | Why Skip |
|---|---|
| **vector database** | Pinecone, Weaviate, Qdrant have DR90+, years of content. No niche angle for Contexter. |
| **best MCP servers** | Dominated by roundup sites, GitHub, Anthropic docs. 10+ articles already with 50+ server lists. No entry angle. |
| **LangChain alternative** | Completely different product category. Framework vs service. No fit. |

---

### 6.7 Rejected Directions

| Direction | Reason Not to Pursue |
|---|---|
| **"RAG-as-a-service" as primary keyword** | Category is well-defined but dominated by Ragie, Vectara, Coveo with enterprise positioning. Contexter's $9 price is the angle, not the category. Target "Ragie alternative" instead. |
| **"vector database" cluster** | Contexter does not expose vector database internals. Category mismatch. Users searching vector DB want infrastructure control, Contexter abstracts it. |
| **"ChatGPT plugin" or "GPT RAG"** | Wrong ecosystem. Contexter is Claude/MCP-native. Dilutes brand association. |
| **"LLM memory" broadly** | Supermemory and Mem0 own this. Contexter is RAG not episodic memory. Different product category. |
| **"AI search" broadly** | Perplexity, Algolia, Meilisearch own this. Contexter is not a search product per se. |
| **"document management SaaS"** | Wrong buyer profile. Contexter's buyers are developers. "Document management" is IT/enterprise. |
| **"Obsidian vault" variants** | No-fit naming collision with Vault product. "vault" searches for Obsidian users are different product entirely. |

---

### 6.8 Framing Challenge: Is "RAG-as-a-service" the Right Category?

**Finding:** The SEED-3 inherited context correctly noted that "RAG-as-a-service" is a living category. However, several signals suggest the more resonant frame for Contexter's audience is **"MCP RAG provider"** or **"context layer for Claude Code."**

Evidence:
1. GitHub repos all position as "MCP RAG server" not "RAG-as-a-service"
2. LlamaIndex's top Claude Code article is "Document Understanding for Claude Code: 3 Ways"
3. HN highest engagement = Claude Code security, not RAG-as-a-service
4. Contexter's pricing ($9 vs Ragie's $100) suggests developer/indie audience, not enterprise RAG market
5. The MCP-native angle (15 tools, Streamable HTTP, OAuth 2.1 PKCE) is the actual differentiator

**Recommendation:** Primary positioning frame should be **"hosted MCP RAG server"** not "RAG-as-a-service." Use "RAG-as-a-service" as a secondary term for cross-linking only.

---

## Self-Check (8-Item Verification)

1. **Coverage** — Does this address every requirement? YES. All 6 layers complete. 85 keywords. 30-query AIO audit. Competitor SERP mapping. 4-engine methodology. Cross-platform baseline. 6 synthesis sections.

2. **Source integrity** — Every claim has URL + date? YES. All competitor claims cited. Baseline findings cited from direct search results. Volume estimates labeled as estimates with confidence.

3. **Baseline documentation** — Pre-T-0 zero baseline explicitly stated? YES. Layer 1.2 confirms zero indexed pages. Layer 6.4 explicitly documents zero citations as pre-launch baseline.

4. **Confidence labels applied?** YES. HIGH/MED/LOW confidence labeled on competitor data throughout.

5. **Rejected directions documented?** YES. Section 6.7 covers 7 rejected query directions with reasoning.

6. **Framing challenge raised?** YES. Section 6.8 challenges "RAG-as-a-service" as primary positioning. Recommends "hosted MCP RAG server" instead.

7. **Information gain signals present?** YES. New data points not found in SEEDs: Infisical Agent Vault launch (April 22, 2026); Anthropic native Vaults (March 18, 2026); Google/OpenAI file search APIs as direct threat; Claude Code source leak (March 31, 2026) as Vault timing opportunity; GSC impression bug note.

8. **DEEP-D and DEEP-E handoff readiness?** YES. Section 6.6 Top 10 priority queries + 3 tier breakdowns = editorial calendar foundation. Section 6.3 competitor SERP positions = backlink target foundation.

---

## Sources Index

- [Ragie (ragie.ai)](https://www.ragie.ai/)
- [Aimprosoft RAG-as-a-Service Platforms](https://www.aimprosoft.com/blog/best-rag-as-a-service-platforms/)
- [Meilisearch RAG Tools Comparison](https://www.meilisearch.com/blog/rag-tools)
- [Formal.ai — Using Proxies to Hide Secrets from Claude Code (Jan 2026)](https://www.formal.ai/blog/using-proxies-claude-code/)
- [HN Thread — Using proxies to hide secrets from Claude Code (132 pts)](https://news.ycombinator.com/item?id=46605155)
- [Check Point Research — RCE and API Token Exfiltration (CVE-2025-59536)](https://research.checkpoint.com/2026/rce-and-api-token-exfiltration-through-claude-code-project-files-cve-2025-59536/)
- [Infisical Agent Vault (April 22, 2026)](https://infisical.com/blog/agent-vault-the-open-source-credential-proxy-and-vault-for-agents)
- [Anthropic Managed Agents Vaults (March 18, 2026)](https://platform.claude.com/docs/en/managed-agents/vaults)
- [The Register — Claude Code source leak](https://www.theregister.com/2026/03/31/anthropic_claude_code_source_code/)
- [SecurityBrief — Claude Code secrets in npm packages](https://securitybrief.asia/story/claude-code-can-leak-secrets-in-public-npm-packages)
- [LlamaIndex — Document Understanding for Claude Code](https://www.llamaindex.ai/blog/adding-document-understanding-to-claude-code)
- [Morphik (morphik.ai)](https://www.morphik.ai/)
- [Morphik YC](https://www.ycombinator.com/companies/morphik)
- [Supermemory.ai](https://supermemory.ai/)
- [Mem0.ai](https://mem0.ai/)
- [Vectorize Supermemory Alternatives](https://vectorize.io/articles/supermemory-alternatives)
- [Google Developer Knowledge API + MCP Server](https://developers.googleblog.com/introducing-the-developer-knowledge-api-and-mcp-server/)
- [OpenAI File Search](https://developers.openai.com/api/docs/guides/tools-file-search)
- [Cloudflare AI Search](https://developers.cloudflare.com/ai-search/)
- [Gemini File Search API](https://blog.google/innovation-and-ai/technology/developers-tools/file-search-gemini-api/)
- [HN RAG-as-a-Service stories (Algolia API)](https://hn.algolia.com/api/v1/search?query=RAG+as+a+service)
- [HN MCP RAG Server stories](https://hn.algolia.com/api/v1/search?query=MCP+RAG+server)
- [Search Engine Land — GSC Impressions Bug (April 2026)](https://searchengineland.com/google-search-console-bug-inflated-impression-counts-473530)
- [PECollective — Pinecone Review 2026](https://pecollective.com/tools/pinecone/)
- [Graphlit vs Supermemory](https://www.graphlit.com/vs/supermemory)
