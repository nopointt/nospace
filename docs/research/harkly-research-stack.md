# Harkly Research — Cloudflare Stack + Tools
> Date: 2026-03-19
> Author: Lead/TechResearch
> Status: IN PROGRESS — writing per section

---

## A. SolidStart + Cloudflare Templates

### A1. SolidStart + Cloudflare Pages — Official Deploy Path

**Official docs:** https://developers.cloudflare.com/pages/framework-guides/deploy-a-solid-start-site/
**SolidJS docs:** https://docs.solidjs.com/guides/deployment-options/cloudflare
**Workers guide:** https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/solid/

**Status: Officially supported.** Cloudflare Pages has a dedicated SolidStart guide (last updated Aug 22, 2025).

**Fastest path — create-cloudflare CLI (C3):**
```bash
npm create cloudflare@latest -- --framework=solid
```
This installs: `wrangler`, SolidStart Cloudflare Pages adapter, sets up `wrangler.toml`.

**Manual config** (`app.config.ts`):
```ts
import { defineConfig } from "@solidjs/start/config";
export default defineConfig({
  server: { preset: "cloudflare-pages" }
});
```

**Key gotcha (CRITICAL):** SolidStart since Beta 2 uses **vinxi** (fork of nitro), not pure nitro. This means `nitro-cloudflare-dev` does NOT work for local Cloudflare bindings. The binding injection for local dev is a known pain point.
- Issue: https://github.com/cloudflare/workers-sdk/issues/5912
- Workaround: use `wrangler pages dev` or special async-local-storage config.

**ISR on Cloudflare Pages:**
- Repo: https://github.com/ryoid/solidstart-cf-isr (SolidStart Nitro ISR on CF Pages)
- Blog: https://ryanjc.com/blog/solidstart-cloudflare-pages/

**Opinionated demo app:**
- `phi-ag/solid-pages` — https://github.com/phi-ag/solid-pages — Opinionated demo app running SolidStart on Cloudflare Pages. Good reference.

**Blog walkthrough:** https://ryanjc.com/blog/solidstart-cloudflare-pages/

---

### A2. SolidStart + Cloudflare Workers Templates (GitHub)

1. **cloudflare/templates** — https://github.com/cloudflare/templates
   General Cloudflare starters; includes Workers templates but not SolidStart-specific.

2. **AlexErrant/SolidStart_AuthJs_CloudflareWorkers** — https://github.com/AlexErrant/SolidStart_AuthJs_CloudflareWorkers
   Demo: Auth.js + SolidStart + Cloudflare Workers via Create JD App. Useful for auth pattern reference.

3. **jldec/create-solid-ssg** — https://github.com/jldec/create-solid-ssg
   SolidStart as static site generator with Cloudflare Pages functions.

**Gap:** No canonical SolidStart + D1 + R2 + Queues starter exists as a single repo. Must assemble from parts.

---

### A3. SolidStart + D1

**No dedicated SolidStart+D1 starter repo found.** Pattern is:

1. Add D1 binding to `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "harkly"
   database_id = "<uuid>"
   ```

2. Access in server functions via `getRequestEvent`:
   ```ts
   import { getRequestEvent } from "solid-js/web";
   const event = getRequestEvent();
   const db = (event.nativeEvent.context.cloudflare as any).env.DB;
   ```

**Known issue:** D1 binding injection in local dev does not work reliably with vinxi — see GitHub issue #1130 on solid-start.
**Workaround:** Use `wrangler pages dev --d1=DB:./local.db` for local D1.

**CF Blog reference:** https://blog.cloudflare.com/blazing-fast-development-with-full-stack-frameworks-and-cloudflare/
(SolidStart listed as Q2 2025 scheduled support for full-stack Workers dev features)

---

### A4. SolidStart + R2 Upload

No SolidStart-specific R2 example found. General pattern (applies to all Workers frameworks):

**Presigned URL flow (recommended):**
1. Client requests presigned URL from SolidStart server action
2. Server generates presigned URL using `aws4fetch` (Workers-compatible S3 SDK)
3. Client uploads directly to R2 via PUT to presigned URL
4. Server stores R2 key in D1

**Reference implementations:**
- `paschendale/r2-presigned-url` — https://github.com/paschendale/r2-presigned-url (AWS Sig V4 for CF Workers)
- Hono example: https://lirantal.com/blog/cloudflare-r2-presigned-url-uploads-hono
- Docs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- `aws4fetch` — lightweight Workers-compatible AWS sig lib (preferred over full AWS SDK)

**R2 multipart uploader:** https://github.com/datopian/r2-bucket-uploader (tested up to 10 GB)

---

### A5. SolidStart Auth Templates

**Recommendation for 2026: better-auth** (Lucia deprecated as library)

| Library | SolidStart support | CF Workers compatible | Status |
|---|---|---|---|
| **better-auth** | Yes — https://www.better-auth.com/docs/integrations/solid-start | Yes (D1 adapter) | Active, recommended |
| Auth.js (NextAuth) | Yes — https://authjs.dev/reference/solid-start | Partial (edge runtime) | Maintained |
| Lucia v3 | Yes — https://v3.lucia-auth.com/getting-started/solidstart | Yes | Deprecated as library, educational only |

**better-auth** wins: has SolidStart integration, D1 adapter, OAuth providers, session management.
Source: https://www.better-auth.com/docs/integrations/solid-start
Article: https://www.honogear.com/en/blog/engineering/best-auth-option-2026

**Auth.js + SolidStart example:** https://github.com/nextauthjs/solid-start-auth-example

---

### A6. Vinxi Cloudflare Adapter — 2026 Status

**Vinxi** = "The Full Stack JavaScript SDK" — https://github.com/nksaraf/vinxi
SolidStart is built on Vinxi (which combines Vite + Nitro internally).

**CF Pages preset:** `@solidjs/start/cloudflare-pages` (wraps Nitro cloudflare-pages preset)
**CF Workers preset:** `@solidjs/start/cloudflare` (for Workers, not Pages)

**Critical known gap:** Vinxi diverged from upstream Nitro, so `nitro-cloudflare-dev` (which injects CF bindings during local dev) does NOT work with SolidStart/Vinxi.
- Issue tracker: https://github.com/cloudflare/workers-sdk/issues/5912
- Status as of 2026-03: Cloudflare working on official fix; workaround = use `wrangler pages dev`

**Async local storage config** (required for CF):
```ts
// app.config.ts
export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    rollupConfig: { external: ["node:async_hooks"] }
  }
});
```

---

## B. Cloudflare Services Assessment

### B1. D1 — Production Readiness

**Status: GA since April 2024.** Production-ready for most workloads.

**Limits:**
| Constraint | Value |
|---|---|
| Max DB size | 10 GB (hard limit, no increase) |
| Max DBs per account | 50,000 |
| Concurrency model | Single-threaded per DB |
| Free tier rows read | 5M/day |
| Free tier rows written | 100K/day |
| Paid rows read | 25B/month included |

**Read replication:** Public beta (2025) — D1 Sessions API for read replicas. Reduces latency for read-heavy apps.

**Design pattern D1 was built for:** Many small DBs (per-user, per-tenant). NOT one giant DB.

**Limitations for Harkly:**
- 10 GB cap is fine for MVP (users, links, metadata)
- Single-threaded means no concurrent writes per DB — OK for most user-scoped operations
- Large batch migrations must be chunked (no mass UPDATE/DELETE of millions of rows)
- No full-text search (use Vectorize for semantic, or external for FTS)

**Maturity verdict:** Good enough for MVP. Not a replacement for Postgres at scale, but strong enough for Harkly's data model.

**Docs:** https://developers.cloudflare.com/d1/
**GA blog:** https://blog.cloudflare.com/making-full-stack-easier-d1-ga-hyperdrive-queues/

---

### B2. Vectorize — RAG Suitability

**Status:** GA, production-available on Workers paid plans.

**Limits:**
| Constraint | Value |
|---|---|
| Max vectors per index | 5,000,000 |
| Max indexes per account | 100 |
| Dimensions | Up to 1536 |
| Metadata filter | Basic (not hybrid search) |

**Strengths:**
- Zero-latency colocation with Workers AI (same network)
- No external API calls for inference + retrieval
- S3-class pricing ($0.05/M vectors/month)
- Works natively with `@cloudflare/ai` embeddings

**Weaknesses (vs alternatives):**
- No hybrid search (BM25 + vector combined) — significant RAG quality gap
- Metadata filtering less powerful than Weaviate/Qdrant
- Considered "a bit green" compared to mature vector DBs
- No reranking built-in

**Alternatives comparison:**
| DB | Hybrid search | Price | CF Workers compat |
|---|---|---|---|
| **Vectorize** | No | ~$0.05/M vec/mo | Native |
| Pinecone (serverless) | Yes | ~$50/mo min | HTTP API |
| pgvector (Supabase) | Yes (with pg_fts) | Free tier available | HTTP API |
| Qdrant Cloud | Yes | Free 1GB | HTTP API |
| Turbopuffer | Yes | Pay per use | HTTP API |

**Verdict for Harkly MVP:** Vectorize is fine for early RAG (semantic search on saved links). If Harkly needs hybrid search (keyword + semantic), consider Qdrant Cloud or Turbopuffer as external service alongside Vectorize.

**Comparison article:** https://liveblocks.io/blog/whats-the-best-vector-database-for-building-ai-products
**Vectorize docs:** https://developers.cloudflare.com/vectorize/

---

### B3. Cloudflare Queues — Processing Pipeline

**Status:** GA. Pull-based consumers added in 2025.

**Key specs:**
| Feature | Value |
|---|---|
| CPU time limit | No hard limit (wall time in minutes) |
| Consumer concurrency | Up to 20 concurrent invocations |
| Message delay | Supported (defer tasks) |
| Pull-based consumers | Yes (HTTP pull from any env) |
| Dead-letter queue | Supported |
| Delivery guarantee | At-least-once |

**For Harkly pipeline (video download, transcription, PDF processing):**
- Queues fit perfectly: long-running background jobs, no CPU time cap
- Producer: SolidStart server action enqueues job
- Consumer: separate Worker processes job (download → transcribe → embed → store)
- Pull consumers allow Modal.com or external service to consume queue

**Gotcha:** Queue handlers have wall-time limits (measured in minutes). For very long video downloads, chain multiple queue messages.

**Docs:** https://developers.cloudflare.com/queues/
**Long jobs guide:** https://dev.to/teaganga/triggering-long-jobs-in-cloudflare-workers-8mh

---

### B4. Workers AI — Available Models (March 2026)

**50+ models** available at the edge. Key categories for Harkly:

| Category | Notable Models |
|---|---|
| Text generation | Meta Llama 3.3 70B, Mistral 7B, Qwen 2.5 |
| Image generation | FLUX.1 [dev], FLUX.2 [klein] 4b (Jan 2026), Leonardo Phoenix |
| Embeddings | BGE-Large (1024-dim), BAAI/bge-m3 |
| Speech-to-text | Whisper Large v3, Deepgram Nova 3 (2025) |
| TTS | Deepgram Aura 2 (2025) |

**For Harkly specifically:**
- Transcription: Whisper Large v3 on Workers AI ($0.0001/min) OR Groq Whisper (faster, same model)
- Embeddings: `@cf/baai/bge-large-en-v1.5` (1024 dim) or `@cf/baai/bge-m3` (multilingual)
- LLM summaries: Llama 3.3 70B or Mistral 7B (for cost)

**Pricing:** Workers AI is free up to 10K neurons/day, $0.011/1K neurons paid.

**New models (March 2025):** https://developers.cloudflare.com/changelog/post/2025-03-17-new-workers-ai-models/
**Model catalog:** https://developers.cloudflare.com/workers-ai/models/

---

### B5. R2 — Presigned Upload Pattern

**R2 is S3-compatible.** Use `aws4fetch` (Workers-native) or `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.

**Flow for Harkly file uploads:**
1. Client sends filename + content-type to SolidStart server action
2. Server generates presigned PUT URL (15 min expiry)
3. Client uploads directly to R2 (bypasses Worker size limits)
4. Server saves R2 key to D1 after confirmation

**Presigned URL format:**
```
https://<bucket>.<account-id>.r2.cloudflarestorage.com/<key>?X-Amz-Algorithm=...
```

**Libraries:**
- `aws4fetch` — minimal, Workers-compatible: https://github.com/mhart/aws4fetch
- `@aws-sdk/s3-request-presigner` — full SDK, works in Workers with `{ requestChecksumCalculation: "WHEN_REQUIRED" }`

**Reference blog:** https://ruanmartinelli.com/blog/cloudflare-r2-pre-signed-urls/
**Docs:** https://developers.cloudflare.com/r2/api/s3/presigned-urls/

---

### B6. Workers Limits (2025-2026)

| Limit | Free | Paid (Workers Paid) |
|---|---|---|
| CPU time (default) | 10ms | 30s (configurable to 5 min) |
| CPU time (max configurable) | — | 300,000ms (5 min) — new March 2025 |
| Memory | 128 MB | 128 MB |
| Request body size | 100 MB | 100 MB (Enterprise: higher) |
| Subrequest count | 50 | 1000 |
| Worker size (compressed) | 1 MB | 10 MB |
| Concurrent connections | 6 | 6 per Worker instance |
| D1 rows read/day | 5M | 25B/month |
| D1 rows written/day | 100K | 50M/month |
| R2 Class A ops (write) | 1M/month | $4.50/M |
| R2 Class B ops (read) | 10M/month | $0.36/M |
| R2 storage | 10 GB/month | $0.015/GB |
| Queues | Unavailable | $0.40/M messages |
| Vectorize vectors | — | Free 30M, then $0.05/M |

**CPU time upgrade (March 2025):** Workers can now run up to 5 min CPU time per request.
Source: https://developers.cloudflare.com/changelog/post/2025-03-25-higher-cpu-limits/

**Workers limits docs:** https://developers.cloudflare.com/workers/platform/limits/

---

### B7. Durable Objects — Use Cases

**Status:** GA. Free tier available since April 2025.

**For Harkly — relevant use cases:**
- Real-time canvas presence (who is viewing/editing what floor)
- Collaborative cursor positions
- WebSocket connection management (many clients → one DO per canvas room)
- Rate limiting per user

**Key library:** `y-durableobjects` — https://github.com/napolab/y-durableobjects
Yjs CRDT on Durable Objects, no Node.js dependencies. Directly usable for collaborative canvas.

**New SDK:** `@cloudflare/actors` (alpha, June 2025) — higher-level abstraction over DOs with WebSocket helpers.

**Chat demo reference:** https://github.com/cloudflare/workers-chat-demo

**Limits:**
- Each DO has SQLite storage built-in
- WebSocket connections: thousands per DO object
- Creates millions of objects to partition load

**Durable Objects docs:** https://developers.cloudflare.com/durable-objects/

---

### B8. WebSockets on Workers

**Supported on all plans** including Free.
Free/Pro: up to 100,000 concurrent WebSocket connections per domain.

**Pattern for Harkly canvas:**
- Each "floor" or "canvas session" = one Durable Object
- Clients connect via WebSocket to the DO
- DO broadcasts state changes to all connected clients
- Yjs CRDT syncs via DO: `y-durableobjects`

**Alternative: SSE (Server-Sent Events)** — supported via Cloudflare Agents SDK for simpler one-way push.

**Workers WebSocket docs:** https://developers.cloudflare.com/workers/runtime-apis/websockets/
**DO + WebSocket guide:** https://developers.cloudflare.com/durable-objects/best-practices/websockets/

---

## C. External Services for Pipeline

### C1. YouTube / Video Transcript Extraction

**Option 1: youtube-transcript-api (Python, free, no key)**
- PyPI: https://pypi.org/project/youtube-transcript-api/
- Zero dependencies on yt-dlp; directly fetches YouTube caption tracks
- Status: Free, actively maintained, no API key needed
- Best for: fast transcript retrieval when captions exist
- Limitation: only works if the video has captions (auto-generated or manual)

**Option 2: yt-dlp (Python, CLI/library)**
- GitHub: https://github.com/yt-dlp/yt-dlp (75k+ stars)
- Downloads actual video/audio + subtitle files
- `yt-dlp-transcripts` (PyPI): https://pypi.org/project/yt-dlp-transcripts/ — wrapper for transcript-only extraction
- `haron/yt-dlp-transcript` on GitHub — handy wrapper
- Status: Actively maintained, 2025.x release series
- Best for: full media download + subtitle extraction in one pass

**Option 3: Hosted Transcript Services**
- `youtube-transcript.io` — web tool, not API
- No mature hosted "yt-dlp as API service" found — most teams self-host on Modal.com or Railway

**Recommended pattern for Harkly pipeline:**
```
Cloudflare Queue → Modal.com Python worker (yt-dlp + youtube-transcript-api) → R2 + D1
```
Run `youtube-transcript-api` first (fast, free). Fall back to yt-dlp audio download + Groq Whisper if no captions.

Sources:
- https://www.notelm.ai/blog/youtube-transcript-api (2026 guide)
- https://github.com/yt-dlp/yt-dlp

---

### C2. Instagram Reels Download

**Legal caveat:** Instagram ToS prohibits scraping. For Harkly, use cautiously — frame as user-initiated, not automated.

**Hosted API services:**
| Service | Type | Notes |
|---|---|---|
| **Apify Instagram Reel Scraper** | SaaS | Batch download, metadata, captions. $5–$49/mo |
| **RapidAPI Instagram Reels Downloader** | API | Pay-per-call |
| **Apify Instagram Media Downloader** | SaaS | HD reels + posts + stories |
| **Apyflux** | API | Posts + Reels + Stories |

- Apify: https://apify.com/apify/instagram-reel-scraper
- RapidAPI: https://rapidapi.com/codecrest8/api/instagram-reels-downloader2

**Open-source (fragile):**
- `VirtualPirate/insta-reel-api` — https://github.com/VirtualPirate/insta-reel-api
- `Okramjimmy/Instagram-reels-downloader` — https://github.com/Okramjimmy/Instagram-reels-downloader

**Practical recommendation for Harkly MVP:** Use Apify (pay-as-you-go) for Instagram. Self-hosting is fragile — Instagram actively blocks scrapers and rotates endpoints.

---

### C3. Groq Whisper — Transcription Pricing and Speed

**Models and Pricing:**
| Model | Price | Speed factor |
|---|---|---|
| `whisper-large-v3` | $0.111/audio-hour | 299x real-time |
| `whisper-large-v3-turbo` | $0.04/audio-hour | 216x real-time |
| `distil-whisper-large-v3-en` | $0.02/audio-hour | 240x real-time |

**Batch API:** 50% discount for non-urgent batch transcriptions.

**Practical cost for Harkly:**
- 1hr YouTube video = $0.04–$0.11
- 100 videos × 10 min avg = ~16.7 audio-hours = $0.67–$1.85/batch
- Extremely cheap at MVP scale

**Groq vs Workers AI Whisper:**
- Groq: faster, cheaper per minute, better reliability, production-grade
- Workers AI Whisper: $0.0001/min = $0.006/audio-hour — even cheaper but smaller quota, potentially slower

**Gotcha:** Groq has a 100 MB file size limit per request. Long videos must be chunked (split audio at ~30 min intervals).

Source: https://groq.com/pricing
Blog: https://groq.com/blog/whisper-large-v3-turbo-now-available-on-groq-combining-speed-quality-for-speech-recognition
Speed benchmark: https://groq.com/blog/groq-runs-whisper-large-v3-at-a-164x-speed-factor-according-to-new-artificial-analysis-benchmark

---

### C4. PDF to Text — TypeScript Libraries

| Library | CF Workers compat | Notes |
|---|---|---|
| **unpdf** | Yes (unjs) | Modern async API, alternative to pdf-parse, TypeScript-first, edge-native |
| **pdf-parse** (mehmet-kozan fork) | Partial | Pure TS, cross-platform, extracts text+images+tables |
| **pdfjs-dist** | Partial (heavy) | Mozilla's PDF.js, most feature-complete, large bundle |
| **pdf-ts** | Yes | Thin wrapper over pdfjs, simple API |

**Recommendation:**
- CF Workers (edge): `unpdf` (https://github.com/unjs/unpdf) — smallest, designed for edge runtimes, unjs ecosystem
- Node.js/Modal: `pdfjs-dist` or `pdf-parse` for more robustness with complex PDFs

Sources:
- `unjs/unpdf`: https://github.com/unjs/unpdf
- `pdf-parse` fork: https://github.com/mehmet-kozan/pdf-parse
- Strapi comparison: https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025

---

### C5. DOCX Parser — TypeScript

**Mammoth.js** is the standard choice.
- npm: https://www.npmjs.com/package/mammoth
- GitHub: https://github.com/mwilliamson/mammoth.js (2.5k+ stars)
- Version: 1.11.0 (2025, actively maintained)
- TypeScript: types included

**Key APIs:**
```ts
// Extract clean text
const result = await mammoth.extractRawText({ buffer: docxBuffer });
// → result.value = plain text

// Convert to HTML
const result = await mammoth.convertToHtml({ buffer: docxBuffer });
// → result.value = clean HTML
```

**CF Workers compatibility:** Mammoth uses Node.js Buffer API — works in Workers with compatibility flag. Potential issue with turbopack (tracked Next.js issue #72863, unrelated to Workers but worth noting).

**Alternative for CSV/Excel:** `xlsx` (SheetJS) for spreadsheet parsing.

Source: https://generalistprogrammer.com/tutorials/mammoth-npm-package-guide

---

### C6. Web Page to Clean Text (Readability/Scraping)

| Service | Type | Free tier | Output |
|---|---|---|---|
| **Jina Reader** | HTTP API (`r.jina.ai`) | 1M tokens/month | Markdown |
| **Firecrawl** | API + self-hostable | 500 credits | Markdown/JSON |
| **Spider** | API | Free credits | Markdown |
| **@mozilla/readability** | npm library | Free (in-process) | Clean HTML/text |

**Jina Reader (simplest, free for prototyping):**
```
GET https://r.jina.ai/https://example.com
Authorization: Bearer <token>  # optional for free tier
```
Returns clean Markdown. Works for most article/blog pages. Fails on heavy SPAs.

**Firecrawl (better quality):**
- Self-hostable: https://github.com/mendableai/firecrawl
- Pricing: $16/mo for 3K credits; $0.005/page overage
- API: `POST https://api.firecrawl.dev/v1/scrape`
- Better output quality, handles more site types

**@mozilla/readability (in-process, zero cost):**
- Run inside Worker using `linkedom` for DOM parsing (no browser needed)
- Zero external API calls, zero cost
- Best for simple article pages; fails on SPAs/JS-heavy sites

**Recommendation for Harkly MVP:**
1. Try Jina Reader first (free, zero setup) — handles 80% of cases
2. Fall back to Firecrawl for JS-heavy sites ($16/mo)
3. In-process fallback: `@mozilla/readability` + `linkedom`

Sources:
- https://blog.apify.com/jina-ai-vs-firecrawl/
- https://scrapegraphai.com/blog/jina-alternatives
- https://spider.cloud/blog/best-web-scraping-apis-for-ai-2026/

---

## D. Canvas + Desktop

### D1. Tauri 2 + SolidJS Templates

| Repo | URL | Tauri v2 | Key feature |
|---|---|---|---|
| **atilafassina/quantum** | https://github.com/atilafassina/quantum | Yes | SolidStart (not just SolidJS) + Tauri 2, batteries included |
| **riipandi/tauri-start-solid** | https://github.com/riipandi/tauri-start-solid | Yes | Tray menu, NanoStores, Tailwind, multi-platform |
| **AR10Dev/tauri-solid-ts-tailwind-vite** | https://github.com/AR10Dev/tauri-solid-ts-tailwind-vite | Yes | Clean minimal: Tailwind, TypeScript, HMR, ESLint/Prettier |
| **ZanzyTHEbar/SolidJSTauri** | https://github.com/ZanzyTHEbar/SolidJSTauri | Yes | Fully-featured, fully typed |
| **ZanzyTHEbar/SolidJSTauriMobile** | https://github.com/ZanzyTHEbar/SolidJSTauriMobile | Yes | iOS/Android mobile variant |

**Top pick for Harkly: `atilafassina/quantum`**
- Only template combining **SolidStart** (SSR-capable, full-stack) + Tauri 2
- "Batteries included" phrasing suggests routing, server functions, SSR-aware config
- Critical for Harkly because Harkly is SolidStart, not plain SolidJS

**Runner-up: `AR10Dev/tauri-solid-ts-tailwind-vite`**
- Clean minimal baseline if quantum turns out to be opinionated in the wrong direction
- Tailwind + TypeScript + HMR baseline

**Full curated list:** https://github.com/tauri-apps/awesome-tauri

---

### D2. Infinite Canvas Libraries

| Library | Stars | Framework | License | SolidJS compat | Notes |
|---|---|---|---|---|---|
| **tldraw** | ~44k | React only | tldraw commercial | No | Best SDK, rich shapes, collab, very customizable |
| **Excalidraw** | ~90k | React only | MIT | No | App-first, SDK-second, sketch aesthetic |
| **xyflow/reactflow** | ~25k | React/Svelte | MIT | No official | Node/edge diagrams, not freehand canvas |
| **infinitykit** | ~500 | Vanilla TS | MIT | Yes | Modular toolkit, framework-agnostic |

**SolidJS situation:**
- tldraw is React-only. `@tldraw/state` (signia) is framework-agnostic, but the UI layer (`<TLDraw />`) is React.
- Wrapping tldraw in a React island inside a SolidJS app is technically feasible but adds complexity.
- `figureland/infinitykit` (https://github.com/figureland/infinitykit) — vanilla TS, composable primitives for infinite canvas. SolidJS-native integration possible but requires more building.

**Recommendation for Harkly "Floors" canvas:**
- If canvas can be isolated as a React island (e.g., Tauri WebView with React component): use **tldraw** — best UX, collaboration via `y-durableobjects` built-in
- If canvas must be pure SolidJS: **infinitykit** + custom shape rendering on Canvas API
- Node graph / knowledge graph: **solid-flow** (see D3)

**tldraw license note:** As of 2025, tldraw has a commercial license for production SaaS. Review terms before Harkly launch.

---

### D3. Graph Visualization Libraries

| Library | Stars | Renderer | SolidJS compat | Best for |
|---|---|---|---|---|
| **xyflow / ReactFlow** | ~25k | SVG/HTML | No official | Node/edge flow builders, interactive diagrams |
| **solid-flow** | ~100 | SVG | Yes (native SolidJS) | SolidJS port of ReactFlow |
| **Cytoscape.js** | ~10k | Canvas | Yes (vanilla) | Complex graph analysis, many layout algorithms |
| **Sigma.js** | ~3k | WebGL | Yes (vanilla) | Large graphs (100k+ nodes), performance-critical |
| **D3.js force-directed** | ~110k | SVG | Yes (vanilla) | Custom layouts, maximum control |

**solid-flow:** https://github.com/miguelsalesvieira/solid-flow
- Community port of ReactFlow for SolidJS
- Low stars (~100) but SolidJS-native reactivity
- `@matthewgapp/solidjs-flow` on npm is another port — PR to xyflow main closed without merge

**xyflow SolidJS official support:** Feature request filed March 2025 (https://github.com/xyflow/xyflow/issues/5092), no official timeline yet.

**Recommendation for Harkly knowledge graph:**
- `solid-flow` for interactive node/edge diagram when node count is low (< 1000 nodes)
- `Sigma.js` if knowledge graph grows to thousands of nodes (WebGL rendering)
- `Cytoscape.js` for complex automated layouts (hierarchical, force-directed, layered)

---

## E. Auth Patterns

### E1. JWT + D1 on Cloudflare Workers

**cloudflare-worker-jwt** — zero-dependency JWT for Workers:
- GitHub: https://github.com/tsndr/cloudflare-worker-jwt
- Uses Web Crypto API (native CF Workers runtime)
- Supports HS256, RS256, ES256
- No external dependencies

**Custom auth + D1 example:**
- `G4brym/authentication-using-d1-example`: https://github.com/G4brym/authentication-using-d1-example
- Full login/register with D1, password hashing via Web Crypto, JWT sessions

**Session state via KV:**
- `devondragon/workers-users`: https://github.com/devondragon/workers-users
- Stateful sessions: session cookie → KV lookup → user state
- Includes registration, login, logout, forgot-password flows

**D1 Sessions API (2025):** D1 now supports read replicas with Sessions API for sequential consistency across read replicas — relevant if using D1 for session storage.

---

### E2. OAuth on Cloudflare Workers

**Official Cloudflare OAuth 2.1 Provider Library:**
- `@cloudflare/workers-oauth-provider` — https://github.com/cloudflare/workers-oauth-provider
- Implements OAuth 2.1 + PKCE (server-side provider role — if Harkly becomes an OAuth provider)
- Updated January 2025

**Google OAuth (client role — users sign in with Google):**
- `Schachte/cloudflare-google-auth`: https://github.com/Schachte/cloudflare-google-auth
- Blog: https://ryan-schachte.com/blog/oauth_cloudflare_workers/

**GitHub OAuth:**
- `gr2m/cloudflare-worker-github-oauth-login`: https://github.com/gr2m/cloudflare-worker-github-oauth-login
- TIL guide: https://til.simonwillison.net/cloudflare/workers-github-oauth

**Note:** For Harkly, these DIY OAuth examples are superseded by **better-auth** (section E3) which handles all of this out-of-box.

---

### E3. better-auth + D1 + SolidStart (Recommended Complete Stack)

**better-auth** is the recommended complete auth solution for 2026.

**Why better-auth wins for Harkly:**
- Native D1 support (auto-detects D1 binding, no custom adapter needed)
- SolidStart integration: https://www.better-auth.com/docs/integrations/solid-start
- OAuth providers built-in: Google, GitHub, Discord
- Session management built-in
- CLI for schema migrations: `npx auth migrate`
- v1.5 released 2025: https://better-auth.com/blog/1-5
- Active community + maintained

**better-auth-cloudflare** convenience package:
- GitHub: https://github.com/zpg6/better-auth-cloudflare
- CLI for automated D1/KV/R2 provisioning, migrations
- npm: https://www.npmjs.com/package/better-auth-cloudflare

**D1 atomicity note:** better-auth uses D1's `batch()` API for atomicity since D1 has no interactive transactions. This is safe for auth operations.

**Setup pattern for SolidStart + D1:**
```ts
// auth.ts (server-only)
import { betterAuth } from "better-auth";
export const auth = betterAuth({
  database: { type: "d1", db: env.DB },
  socialProviders: {
    google: { clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET },
    github: { clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET }
  }
});
```

**Reference implementations:**
- CF Workers + D1 + Kysely: https://kemalyilmaz.com/blog/setting-up-better-auth-with-cloudflare-workers-d1-kysely/
- Hono + Cloudflare example: https://hono.dev/examples/better-auth-on-cloudflare
- React Router + D1: https://dev.to/atman33/setup-better-auth-with-react-router-cloudflare-d1-2ad4

---

## Recommended Starter Kit

### Summary Assessment

Based on all research, here is the recommended approach for bootstrapping Harkly MVP on the Cloudflare stack.

---

### Starter Template Recommendation

**No single perfect SolidStart + Cloudflare "full-stack" template exists.** The closest reference is `phi-ag/solid-pages` (https://github.com/phi-ag/solid-pages) which covers SolidStart + D1 + KV + R2 + CF Pages — but its README has a deprecation warning (migrating to SolidStart Devinxi + Workers architecture).

**Recommended bootstrap path (March 2026):**

```bash
# Step 1: Scaffold via Cloudflare C3 CLI
npm create cloudflare@latest harkly -- --framework=solid

# Step 2: Auth — better-auth
npm install better-auth
npx better-auth init
# Edit auth config with D1 binding
npx better-auth migrate  # creates D1 auth tables

# Step 3: ORM — Drizzle for D1
npm install drizzle-orm drizzle-kit

# Step 4: R2 uploads
npm install aws4fetch

# Step 5: Web scraping
npm install @mozilla/readability linkedom
# + Jina Reader (HTTP) for fallback, no install needed

# Step 6: Document parsing
npm install unpdf mammoth
```

**For Tauri desktop shell:**
- Clone `atilafassina/quantum` (SolidStart + Tauri 2)
- Merge/adapt the CF deployment config from C3 scaffold

---

### Service Matrix for Harkly MVP

| Need | Service/Library | Notes |
|---|---|---|
| Frontend framework | SolidStart | Confirmed |
| Hosting | Cloudflare Pages (start) → Workers (mature) | C3 sets up Pages; migrate to Workers later |
| Database | Cloudflare D1 + Drizzle ORM | Good for MVP; max 10 GB/DB |
| File storage | Cloudflare R2 + presigned URLs | aws4fetch for Worker-side signing |
| Search / RAG | Cloudflare Vectorize | Good for MVP; add Qdrant if hybrid search needed |
| Auth | better-auth + D1 | Best option March 2026 |
| Background jobs | Cloudflare Queues | At-least-once delivery, pull consumers for Modal |
| Long durable jobs | Cloudflare Workflows (GA) | Consider for multi-step pipeline with retries |
| Real-time canvas | Durable Objects + y-durableobjects | WebSocket CRDT layer per canvas room |
| Video transcripts | youtube-transcript-api (free) → Groq Whisper fallback ($0.04/hr) | Two-step fallback |
| Instagram | Apify (pay-as-you-go) | Self-hosting too fragile |
| PDF parsing | unpdf (edge) / pdfjs-dist (Modal) | Split by runtime |
| DOCX parsing | mammoth.js | Standard, maintained |
| Web page extraction | Jina Reader (free) → Firecrawl ($16/mo) | Two-step fallback |
| Desktop shell | Tauri 2 + atilafassina/quantum | SolidStart + Tauri v2 |
| Infinite canvas (floors) | tldraw (React island) OR infinitykit (SolidJS native) | Architecture decision — tldraw has better UX |
| Node graph view | solid-flow | SolidJS native ReactFlow port |
| AI models (edge) | Workers AI: Llama 3.3 + Whisper + BGE-Large | Free tier generous |

---

### Critical Gotchas Summary

1. **Vinxi/SolidStart local dev + CF bindings:** `nitro-cloudflare-dev` does NOT work with SolidStart/vinxi. Use `wrangler pages dev` for local testing with D1/R2/KV bindings. This is a known open issue as of March 2026.

2. **D1 is single-threaded per DB:** One request at a time. Design schema around per-user isolation or accept serialized writes for shared tables. Not suitable as a high-concurrency shared DB.

3. **Workers 128 MB memory hard limit:** PDF parsing of large files in a Worker is risky. Offload heavy processing (large PDFs, long videos) to Modal.com workers via Queue pull consumers.

4. **tldraw is React-only:** Cannot use it natively in SolidJS without a React island wrapper. Decision: React island for canvas, SolidJS for everything else — adds bundle complexity.

5. **phi-ag/solid-pages is deprecated:** Use only as architecture reference, not as clone-and-start template.

6. **better-auth + D1 uses batch() not transactions:** Fine for auth. Verify behavior with Drizzle ORM concurrent operations.

7. **Instagram scraping ToS risk:** Build with graceful degradation — if Apify API changes or ToS enforcement increases, Harkly needs fallback.

8. **Groq 100 MB file size limit:** Must chunk audio before sending to Groq Whisper. Split at natural boundaries (silence detection) every ~25 minutes.

9. **Cloudflare Vectorize no hybrid search:** For MVP, pure semantic search is fine. When Harkly needs recall improvement, evaluate adding Qdrant Cloud alongside Vectorize or switching entirely.

10. **Workers AI quota:** Free tier is 10K neurons/day — fine for development, may hit limits at scale. Groq is cheaper per unit at high volume.

---

*Research completed: 2026-03-19*
*Sources: Cloudflare docs, GitHub repos, npm packages, vendor pricing pages — all URLs inline per section.*
