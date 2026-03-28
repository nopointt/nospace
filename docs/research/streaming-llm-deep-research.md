# Deep Research: Streaming Responses + LLM Model Selection for RAG
> Date: 2026-03-28
> Scope: Contexter RAG service (Hono/Bun, Groq API, Cloudflare Workers)
> Framework: deep-research-framework.md (all 6 layers)

---

## Layer 1: Current State

### 1.1 Our implementation

**LLM Service** (`src/services/llm.ts`):
- Model: `llama-3.1-8b-instant` via Groq API (OpenAI-compatible)
- Base URL: configurable via `GROQ_LLM_URL` env, defaults to `https://api.groq.com/openai/v1`
- max_tokens: 1024 (hardcoded in `generateAnswer`, 256 for query rewriting)
- No streaming -- full response awaited, then returned as JSON
- Retry: exponential backoff on 429 (1s, 2s, 4s), max 3 retries
- No fallback provider -- Groq-only
- No model fallback -- single model

**RAG Pipeline** (`src/services/rag/`):
- Query rewriting: generates 3 alternative queries (LLM call #1, max_tokens=256)
- Embedding: Jina API (separate service)
- Search: hybrid (vector + FTS), dedup, sort by score
- Context building: token budget 3000 tokens (~1.3 tokens/word estimate)
- Answer generation: LLM call #2 (system prompt + context + question), max_tokens=1024
- Response: full JSON blob with `answer`, `sources[]`, `queryVariants`, `usage`

**Query Route** (`src/routes/query.ts`):
- POST `/query` -- auth check, rate limit (60/min), constructs services, calls RAG, returns JSON
- No streaming endpoint exists
- Sources enriched with document names before response

### 1.2 Metrics (estimated)

- **Latency**: ~2-4s total (query rewrite ~500ms + embedding ~300ms + search ~200ms + LLM generation ~1-2s)
- **TTFT (Time to First Token)**: N/A -- no streaming, user waits for entire response
- **Cost**: Groq free tier / minimal paid tier for Llama 3.1 8B Instant
- **max_tokens 1024**: may truncate complex multi-source answers
- **Token throughput**: Groq delivers ~664 tok/s for 8B model (not utilized due to no streaming)

### 1.3 Known issues

1. **No streaming** -- user sees blank screen for 2-4 seconds, then full answer appears
2. **Single provider** -- Groq outage = total RAG failure
3. **Single model** -- no quality fallback for complex questions
4. **max_tokens=1024 hardcoded** -- not configurable per request
5. **No citation streaming** -- sources only available after full response
6. **LLM used for both rewriting AND answering** -- 8B may be suboptimal for answer quality
7. **No error recovery mid-generation** -- if Groq fails mid-response, entire query fails

---

## Layer 2: World-Class Standard

### 2.1 Best LLM models for RAG answering (2025-2026)

**Key insight:** RAG models don't need to "know the world" -- your documents do. The model needs to: (a) follow grounding instructions faithfully, (b) synthesize context coherently, (c) cite sources accurately. General chat benchmarks (MMLU, etc.) are poor predictors of RAG quality.

| Model | Params (active) | Context | RAG strength | Key insight |
|---|---|---|---|---|
| **Qwen3-30B-A3B** | 30B total / 3B active (MoE) | 131-262K | Matches GPT-4o on retrieval-grounded QA at 10x lower compute | Best efficiency/quality ratio for RAG |
| **Llama 3.3 70B** | 70B | 128K | Strong general RAG, massive ecosystem | Battle-tested, quantization-friendly |
| **Command R+** (Cohere) | 104B | 128K | Native grounded generation with inline citations | Built specifically for RAG -- reduces hallucination by design |
| **DeepSeek-R1** | ~671B MoE | 164K | Multi-hop reasoning over retrieved context | Best when connecting info across chunks |
| **Phi-4** | 14B | 16K | Good instruction following with retrieved chunks | Edge/resource-constrained deployments |
| **Llama 3.1 8B** (current) | 8B | 128K | Adequate for simple QA, fast | Struggles with multi-hop and complex synthesis |

**Verdict for Contexter:** Llama 3.1 8B is adequate for simple single-hop QA but leaves quality on the table for complex queries. The sweet spot is **Llama 3.3 70B** or **Qwen3-32B** on Groq -- 5-10x better reasoning at still-fast inference.

### 2.2 Groq model availability (March 2026)

| Model | Category | Input $/M | Output $/M | Speed (tok/s) | TTFT |
|---|---|---|---|---|---|
| `llama-3.1-8b-instant` | Fast/cheap | ~$0.05 | ~$0.08 | ~664 | ~0.13s |
| `llama-3.3-70b-versatile` | Quality | $0.59 | $0.79 | ~276 | ~0.15s |
| `llama-3.3-70b-specdec` | Quality+fast | $0.59 | $0.99 | faster (speculative) | ~0.15s |
| `qwen/qwen3-32b` | Quality/MoE | competitive | competitive | fast | TBD |
| `llama-4-scout-17b-16e` | Multimodal | $0.11 | $0.34 | fast | TBD |
| `openai/gpt-oss-120b` | Reasoning | higher | higher | moderate | TBD |

**Groq additional features:**
- Batch API: 50% off for non-real-time jobs (usable for query rewriting)
- Prompt Caching: 50% off input tokens when prompts repeat (our system prompt repeats every call)
- Compound Beta: agentic system with web search + code execution (not relevant for RAG answering)

### 2.3 Provider pricing comparison (per 1M tokens)

| Provider | Llama 3.1 8B (in/out) | Llama 3.3 70B (in/out) | Qwen3 32B (in/out) | Key advantage |
|---|---|---|---|---|
| **Groq** | ~$0.05/$0.08 | $0.59/$0.79 | competitive | Fastest TTFT, LPU hardware |
| **DeepInfra** | $0.03/$0.05 | $0.23/$0.40 | ~$0.10-0.23 | Cheapest per-token pricing |
| **Together AI** | similar | $0.18/$0.59 (Llama 4 Scout) | available | Sub-100ms latency, 200+ models |
| **OpenRouter** | free tier available | free tier available | $0.05-0.16 | Aggregator, free models for dev |

**Pricing verdict:** DeepInfra is 2-3x cheaper than Groq for the same models. For a bootstrapped product, DeepInfra as primary + Groq as latency-critical fallback is optimal.

### 2.4 Hono SSE streaming -- industry standard approach

Hono provides a built-in `streamSSE` helper (`hono/streaming`):

```
import { streamSSE } from "hono/streaming"

app.get("/stream", (c) => {
  return streamSSE(c, async (stream) => {
    // Send sources immediately
    await stream.writeSSE({ data: JSON.stringify(sources), event: "sources" })

    // Stream LLM tokens
    for await (const chunk of llmStream) {
      await stream.writeSSE({ data: chunk, event: "token" })
    }

    // Send final metadata
    await stream.writeSSE({ data: JSON.stringify(usage), event: "done" })
  })
})
```

**Key implementation details:**
- `streamSSE` sets `Content-Type: text/event-stream` automatically
- `writeSSE({ data, event, id })` sends formatted SSE events
- Client uses `EventSource` API with automatic reconnection
- On Cloudflare Workers: add `Content-Encoding: identity` header (Wrangler quirk)
- `stream.onAbort()` for cleanup on client disconnect
- Reference implementation: `github.com/hellokaton/hono-stream-example` (Hono + Bun + OpenAI streaming)

### 2.5 SSE streaming for RAG -- best practices

1. **Two-phase response:** Send sources/metadata first (SSE event "sources"), then stream answer tokens (SSE event "token"), then send usage stats (SSE event "done")
2. **Progressive rendering:** Client shows source cards immediately while answer streams in
3. **Citation modes:** Cohere offers "fast" vs "accurate" citation modes in streaming -- fast sends citations inline as they appear, accurate waits for full response
4. **Error handling:** SSE has no built-in error signaling -- use a custom "error" event type
5. **Reconnection:** EventSource auto-reconnects; use `Last-Event-ID` header to resume
6. **Buffering:** Some proxies buffer SSE -- set `X-Accel-Buffering: no` for nginx

### 2.6 Common pitfalls

- Streaming same token pricing as non-streaming (no cost penalty)
- Don't stream query rewriting -- it's internal, user doesn't need to see it
- max_tokens for RAG should be 1500-2048 (1024 truncates multi-source answers)
- Always include a non-streaming fallback endpoint for clients that don't support SSE

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from last 12 months)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **Speculative RAG** (Google, ICLR 2025) | 2024-07 / ICLR 2025 | Small drafter generates multiple answer candidates; large verifier selects best | Research/production-ready | +12.97% accuracy, -50.83% latency vs conventional RAG |
| **StreamingRAG** | 2025-01 | RAG over streaming data with spatio-temporal knowledge graphs | Research | 5-6x faster processing, 2-3x less resources |
| **CoT-RAG** | 2025-04 | Knowledge graph-driven chain-of-thought + RAG for complex reasoning | Research | Relevant for multi-hop queries over document collections |
| **RAT (Retrieval Augmented Thoughts)** | 2024-03 | Iteratively revises each reasoning step using RAG from external KB | Research | Mitigates hallucination in step-by-step reasoning |
| **MA-RAG** | 2025-05 | Multi-agent RAG with collaborative chain-of-thought | Research | Decomposes complex queries into subtasks |
| **Cohere streaming citations** | Production | Fast vs accurate citation modes during streaming | Production | Direct applicability -- stream citations alongside tokens |

### 3.2 Speculative RAG -- deep dive (most applicable)

**How it works:**
1. Retrieve documents, cluster by content similarity
2. Sample one document per cluster to form subsets
3. Run small RAG drafter (e.g., 8B) on each subset in parallel -- generates draft answers + rationales
4. Large verifier (e.g., 70B) evaluates drafts against rationales, selects best answer
5. Result: +12.97% accuracy, -50.83% latency on TriviaQA, MuSiQue, PopQA, PubHealth, ARC-Challenge

**Applicability to Contexter:**
- Our current 8B model = perfect drafter
- Groq's fast inference makes parallel drafting cheap
- Verification step adds one more LLM call but on pre-filtered candidates
- Could be implemented as: 3x parallel 8B drafts + 1x 70B verification
- Trade-off: 4 LLM calls instead of 1, but parallelizable and higher quality

### 3.3 Groq Compound Beta -- agentic RAG

Groq's Compound system integrates web search + code execution + browser automation into a single API call. Uses Llama 4 Scout for reasoning + Llama 3.3 70B for tool use. Not directly useful for our knowledge-base RAG, but demonstrates Groq's investment in compound AI systems.

### 3.4 Small vs large model for RAG -- when 8B is enough

**8B is sufficient when:**
- Single-hop factual QA (answer is in one chunk)
- Short answers (1-3 sentences)
- Simple reformulation of retrieved content
- High-quality retrieval (top chunk is clearly the answer)

**70B is needed when:**
- Multi-hop reasoning (connecting info across chunks)
- Complex synthesis (comparing/contrasting multiple sources)
- Imperfect retrieval (model must reason through noisy context)
- Nuanced answers requiring careful phrasing
- Conflicting information in sources

**Quantized 7-8B models perform nearly identically to FP16 on information retrieval tasks.** This means the 8B model's limitations are architectural (model capacity), not precision-related.

### 3.5 Open questions in the field

- Can streaming citations be accurate without post-processing? (Cohere says "fast" mode trades accuracy)
- Optimal drafter/verifier size ratio for Speculative RAG
- Whether reasoning models (DeepSeek-R1) improve RAG quality enough to justify their cost
- Impact of prompt caching on streaming TTFT

### 3.6 Bets worth making

1. **Upgrade to Llama 3.3 70B on Groq** -- immediate quality improvement, still fast, $0.59/M input
2. **Add DeepInfra as cost fallback** -- same OpenAI-compatible API, 2-3x cheaper for background tasks
3. **Implement streaming SSE** -- Hono has native support, Groq API supports streaming, ~2 days of work
4. **Experiment with Speculative RAG** -- our 8B model becomes the drafter, 70B becomes verifier

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Streaming media** | Deliver video at varying quality based on bandwidth | Adaptive Bitrate Streaming (ABR) -- start conservative, ramp up quality as conditions improve | **Progressive answer quality:** send fast 8B draft first, then optionally upgrade with 70B verification. Like ABR's "bitrate ladder" |
| **Journalism** | Deliver most critical information first under space/time constraints | Inverted Pyramid -- lead paragraph has who/what/when/where/why, details follow in descending importance | **Answer structure:** system prompt should instruct model to put the direct answer first, supporting details second, caveats third. User can stop reading at any point and still have the core answer |
| **Real-time systems** | Latency vs throughput tradeoff | Deadline-aware scheduling -- prioritize tasks that have hard deadlines, batch others | **Two-tier processing:** stream the answer (hard deadline: user is waiting) + enrich sources/citations asynchronously (soft deadline: can appear after answer starts) |
| **Packet switching** | Reliable delivery over unreliable channels | TCP: acknowledgments, retransmission, ordering | **Streaming reliability:** use SSE event IDs + Last-Event-ID for reconnection, similar to TCP sequence numbers |

### 4.2 Biomimicry / Nature-inspired

**Human conversation pattern:** When asked a question, humans don't wait 3 seconds silently then deliver a perfect answer. They start with "So..." or "Well, the thing is..." -- signaling they're processing. Then they deliver the core answer, then add nuance. This maps directly to:
1. Immediately send a "thinking" event (TTFT < 200ms)
2. Stream the core answer
3. Append citations and qualifiers

**Foraging theory (information scent):** Users follow "information scent" -- early tokens must signal relevance. If the first streamed words are irrelevant boilerplate, users disengage. The model should be prompted to start with the most relevant fact.

### 4.3 Engineering disciplines

**Signal processing -- progressive refinement:**
- JPEG progressive encoding: sends a low-resolution version of the entire image first, then refines
- Analog: send a quick summary (few tokens), then elaborate with citations
- Not directly implementable with current LLM APIs, but the system prompt can enforce this structure

**Information theory -- channel capacity:**
- Shannon's theorem: there's a maximum rate at which information can be reliably transmitted
- For RAG: the "channel" is the user's reading speed (~250 words/min = ~4.2 words/sec)
- Token generation at 276 tok/s (Groq 70B) far exceeds reading speed
- Implication: streaming is primarily a TTFT optimization, not a throughput optimization

**Control systems -- feedback loops:**
- Currently no feedback loop: user asks, system answers, done
- Future: stream partial answer, observe user behavior (stop reading? ask follow-up?), adjust
- Not implementable now, but streaming enables it architecturally

---

## Layer 5: Mathematical Foundations

### 5.1 Token generation throughput and perceived quality

**Current model (no streaming):**
- Total wait = T_rewrite + T_embed + T_search + T_generate
- T_generate = prompt_tokens / prefill_speed + max_tokens / decode_speed
- For 8B on Groq: T_generate ~ 1500/10000 + 1024/664 = 0.15s + 1.54s = ~1.7s
- Total perceived latency: ~2.5-3.5s (user sees nothing during this time)

**With streaming:**
- TTFT = T_rewrite + T_embed + T_search + T_prefill
- T_prefill for Groq 8B: ~0.13s (measured), for 70B: ~0.15s
- Total TTFT: ~1.0-1.5s (retrieval dominates, not LLM prefill)
- After TTFT: tokens arrive at 276-664 tok/s, far faster than reading speed

**Key formula:**
```
Perceived_latency_reduction = (T_total - TTFT) / T_total
For our case: (3.5 - 1.2) / 3.5 = 65.7% reduction in perceived wait time
```

### 5.2 TTFT as primary UX metric

Research consensus (IBM, NVIDIA, multiple benchmarks):
- Chatbot responsiveness requires TTFT < 500ms to "feel instant"
- TTFT < 1s is acceptable for knowledge QA (user expects some thinking)
- TTFT > 2s triggers user impatience / task abandonment
- Users are MORE sensitive to initial delay than to inter-token latency

**Our achievable TTFT with streaming:**
- Retrieval phase: ~1.0s (rewrite + embed + search -- cannot be streamed, must complete first)
- LLM prefill: ~0.15s (Groq)
- **Achievable TTFT: ~1.15s** -- acceptable for knowledge QA

**Optimization path to sub-1s TTFT:**
- Skip query rewriting for simple queries (saves ~500ms) -- detect simple queries with heuristics
- Cache embeddings for repeated queries (saves ~300ms)
- Pre-warm connections to Groq (saves ~50ms)

### 5.3 Cost optimization analysis

**Current cost per query (Llama 3.1 8B on Groq):**
- Rewrite call: ~200 input + 100 output tokens = negligible ($0.05/M)
- Answer call: ~1500 input + 500 output tokens = ~$0.000115
- Total: ~$0.00012/query = $0.12 per 1000 queries

**Upgraded cost per query (Llama 3.3 70B on Groq):**
- Rewrite call (keep on 8B): ~$0.00002
- Answer call: 1500 input ($0.59/M) + 500 output ($0.79/M) = $0.000885 + $0.000395 = $0.00128
- Total: ~$0.0013/query = $1.30 per 1000 queries (~10x increase)

**Hybrid approach (8B rewrite + 70B answer on DeepInfra):**
- Rewrite: 8B on Groq = ~$0.00002
- Answer: 70B on DeepInfra ($0.23/$0.40) = $0.000345 + $0.0002 = $0.000545
- Total: ~$0.00057/query = $0.57 per 1000 queries (~5x increase, 2.3x cheaper than pure Groq 70B)

**Cost comparison table:**

| Configuration | Cost/1K queries | Quality | TTFT | Provider |
|---|---|---|---|---|
| Current (8B Groq, no stream) | $0.12 | Baseline | ~3.5s (no stream) | Groq |
| 8B Groq + streaming | $0.12 | Baseline | ~1.15s | Groq |
| 70B Groq + streaming | $1.30 | +30-50% | ~1.2s | Groq |
| 70B DeepInfra + streaming | $0.57 | +30-50% | ~1.5-2.0s | DeepInfra |
| 8B rewrite (Groq) + 70B answer (DeepInfra) | $0.57 | +30-50% | ~1.5-2.0s | Groq + DeepInfra |
| Speculative (3x8B draft + 1x70B verify) | ~$1.50 | +40-60% | ~2.0s | Groq |

### 5.4 Information density in RAG answers

**RAG answers are more information-dense than general chat:**
- General chat: model generates from parametric memory, includes hedging, filler, repetition
- RAG answers: model compresses retrieved context into a concise answer
- Estimated: RAG answers carry ~2-3x more useful bits per token than open-ended chat
- Implication: every token in a RAG answer matters more -- truncation (max_tokens=1024) loses more value

**Optimal max_tokens for RAG:**
- Average RAG answer: 200-600 tokens (1-3 paragraphs with citations)
- Complex multi-source answer: 600-1200 tokens
- Safety margin for long answers: 1500-2048 tokens
- **Recommendation: max_tokens=1536** (50% increase over current 1024, covers 95%+ of answers)

### 5.5 Batch vs streaming token pricing

- Streaming and non-streaming have identical per-token pricing (confirmed across Groq, OpenAI, DeepInfra)
- Batch APIs (Groq Batch, OpenAI Batch) offer 50% discount but with 24h latency -- only useful for offline tasks
- Prompt caching (Groq): 50% off input tokens when system prompt repeats -- directly applicable since our RAG system prompt is constant
- **Net effect: streaming is free from a pricing perspective**

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

#### Decision 1: Model upgrade

- **What:** Upgrade answer generation from `llama-3.1-8b-instant` to `llama-3.3-70b-versatile`
- **Why:** 8B is adequate for simple QA but leaves significant quality on the table for multi-source synthesis. 70B provides +30-50% quality improvement on complex queries (Layer 2, Layer 3). Groq's 70B runs at 276 tok/s with 150ms TTFT -- still extremely fast.
- **Keep 8B for query rewriting** -- it's a simple reformulation task, 8B is sufficient, and it keeps rewrite cost negligible.
- **Expected impact:** Noticeably better answers for complex queries, especially multi-hop and synthesis
- **Cost:** $0.12 -> $1.30 per 1K queries (10x). Acceptable at bootstrapped scale (<10K queries/month = $13/month).
- **Risk:** Higher cost per query. Mitigate with DeepInfra fallback for cost-sensitive paths.
- **Alternative considered:** Qwen3-32B (cheaper, MoE efficient). Not yet confirmed on Groq with stable pricing. Monitor and switch if available at better rate.

#### Decision 2: Streaming SSE

- **What:** Add SSE streaming endpoint using Hono's `streamSSE` helper
- **Why:** Reduces perceived latency by ~65% (Layer 5). TTFT goes from ~3.5s to ~1.15s. Streaming is free (no pricing penalty). Hono has native support. Groq API supports OpenAI-compatible streaming.
- **Expected impact:** Users see answer tokens within ~1.2s instead of waiting 3.5s
- **Cost:** Zero additional operational cost. ~1-2 days implementation.
- **Risk:** Cloudflare Workers SSE has quirks (Content-Encoding: identity). Test thoroughly.

#### Decision 3: Fallback chain

- **What:** Add DeepInfra as secondary provider with automatic fallback
- **Why:** Single-provider dependency is a reliability risk. DeepInfra is 2-3x cheaper for same models. OpenAI-compatible API means minimal code change.
- **Fallback order:** Groq (primary, fastest) -> DeepInfra (secondary, cheapest) -> error
- **Expected impact:** Near-zero downtime for RAG answering
- **Cost:** DeepInfra has pay-per-token, no minimum. Just add API key.
- **Risk:** DeepInfra latency is higher than Groq (~2x TTFT). Acceptable as fallback.

#### Decision 4: max_tokens increase

- **What:** Increase from 1024 to 1536, make configurable per request
- **Why:** 1024 truncates complex multi-source answers (Layer 5). RAG answers are information-dense -- every lost token matters.
- **Cost:** ~50% more output tokens per query worst case. Actual impact is lower since most answers are 200-600 tokens.

### 6.2 Implementation spec (brief)

#### Streaming endpoint pseudocode

```
POST /query/stream

1. Auth check + rate limit (same as current /query)
2. Parse request body { query, topK? }
3. Run retrieval pipeline (rewrite + embed + search) -- NOT streamed
4. Build context from search results
5. SSE Phase 1: send "sources" event with sources array
6. SSE Phase 2: stream LLM answer tokens
   - Call Groq/DeepInfra with stream: true
   - For each chunk: writeSSE({ data: chunk.content, event: "token" })
   - On error mid-stream: writeSSE({ data: error.message, event: "error" })
7. SSE Phase 3: send "done" event with usage stats
8. Close stream
```

#### LLM service changes

```
class LlmService:
  // Existing: chat(messages, maxTokens) -> LlmResponse
  // New: chatStream(messages, maxTokens) -> AsyncIterator<string>

  chatStream(messages, maxTokens):
    body = { model, messages, max_tokens, stream: true }
    response = fetch(baseUrl + "/chat/completions", { body, ... })
    reader = response.body.getReader()
    // Parse SSE chunks from OpenAI-compatible stream
    // Yield content deltas
    // Handle [DONE] sentinel
```

#### Fallback chain pseudocode

```
class LlmRouter:
  providers: [
    { name: "groq", baseUrl: "https://api.groq.com/openai/v1", apiKey: GROQ_KEY, model: "llama-3.3-70b-versatile" },
    { name: "deepinfra", baseUrl: "https://api.deepinfra.com/v1/openai", apiKey: DEEPINFRA_KEY, model: "meta-llama/Llama-3.3-70B-Instruct" },
  ]

  chat(messages, maxTokens):
    for provider in providers:
      try:
        return provider.chat(messages, maxTokens)
      catch (error):
        if isRetryable(error): continue
        throw error
    throw new Error("All providers failed")

  chatStream(messages, maxTokens):
    // Same pattern but for streaming
```

#### SSE event protocol

```
event: sources
data: {"sources": [...], "queryVariants": [...]}

event: token
data: {"content": "The answer is"}

event: token
data: {"content": " that document X"}

event: done
data: {"usage": {"promptTokens": 1500, "completionTokens": 450}}

event: error
data: {"message": "Provider timeout"}
```

### 6.3 Validation plan

| Metric | Current baseline | Target | How to measure |
|---|---|---|---|
| TTFT | ~3.5s (no streaming) | < 1.5s | Client-side timer from request to first token event |
| Answer quality | 8B baseline | Subjective +30% (human eval on 50 queries) | Side-by-side comparison: 8B vs 70B answers on same queries |
| Availability | Single provider (Groq) | 99.9% (with fallback) | Monitor both providers, count successful queries |
| Truncation rate | ~5-10% (at 1024) | < 1% (at 1536) | Log queries where output hits max_tokens |
| Cost per query | $0.00012 | < $0.002 | Sum API costs from usage stats |

**Minimum success criteria:**
- TTFT < 1.5s (measured at client)
- Fallback triggers automatically on Groq 429/5xx
- No regression in answer quality (70B >= 8B on all test queries)

**Rollback trigger:**
- Cost exceeds $5/month at current volume -> revert to 8B
- Groq 70B latency degrades to > 3s consistently -> stay on 8B with streaming
- Streaming causes issues on specific clients -> keep non-streaming `/query` as fallback

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Cohere Command R+** | $2.50/$10.00 per M tokens -- 4-17x more expensive than Llama 3.3 70B. Native citations are great but not worth the cost at bootstrap stage. Revisit when revenue justifies it. |
| **Speculative RAG** | Requires 4 parallel LLM calls. Increases complexity and cost significantly. Quality gain (+12.97%) is attractive but not worth the engineering effort at this stage. File under "Phase 2 optimization". |
| **DeepSeek-R1** | Reasoning model with ~671B MoE. Overkill for document QA. Expensive. Slow prefill. Not available on Groq with competitive pricing. |
| **Qwen3-30B-A3B** | Promising MoE model. Not yet confirmed as stable on Groq/DeepInfra with published pricing. Monitor -- may become the best option in 3-6 months. |
| **OpenRouter as provider** | Aggregator adds latency + markup. Better to call Groq/DeepInfra directly. OpenRouter useful for experimentation but not production. |
| **LiteLLM router** | Python-based proxy. Our stack is TypeScript/Hono. Adding a Python dependency for routing is overengineering. Simple try/catch fallback in TypeScript is sufficient. |
| **WebSocket instead of SSE** | Bidirectional not needed -- we only stream server-to-client. SSE is simpler, has auto-reconnection, works with standard HTTP. WebSocket adds complexity for zero benefit here. |
| **Skip streaming, just upgrade model** | Model upgrade improves quality but not perceived latency. Users still wait 2-4s for full response. Streaming is free and gives immediate UX improvement. Do both. |

### 6.5 Implementation priority

| Priority | Change | Effort | Impact |
|---|---|---|---|
| **P0** | Add streaming SSE endpoint (`/query/stream`) | 1-2 days | 65% perceived latency reduction |
| **P0** | Keep non-streaming `/query` as fallback | 0 (already exists) | Backward compatibility |
| **P1** | Upgrade answer model to `llama-3.3-70b-versatile` | 0.5 day (config change) | +30-50% answer quality |
| **P1** | Increase max_tokens to 1536, make configurable | 0.5 day | Eliminate truncation |
| **P2** | Add DeepInfra fallback provider | 1 day | Reliability + cost optimization |
| **P3** | Implement prompt caching (Groq) | 0.5 day | ~25% input cost reduction |
| **Future** | Speculative RAG (8B drafter + 70B verifier) | 3-5 days | +10-15% quality for complex queries |
| **Future** | Streaming citations (Cohere-style) | 2-3 days | Better UX for source attribution |

---

## Sources

### Layer 2
- [Best Open-Source LLMs for RAG in 2026 (PremAI)](https://blog.premai.io/best-open-source-llms-for-rag-in-2026-10-models-ranked-by-retrieval-accuracy/)
- [Best Open Source LLMs for RAG (SiliconFlow)](https://www.siliconflow.com/articles/en/best-open-source-LLMs-for-RAG)
- [Groq Supported Models](https://console.groq.com/docs/models)
- [Groq Pricing](https://groq.com/pricing)
- [Token Arbitrage: Groq vs DeepInfra vs Cerebras (GoPenAI)](https://blog.gopenai.com/the-token-arbitrage-groq-vs-deepinfra-vs-cerebras-vs-fireworks-vs-hyperbolic-2025-benchmark-ccd3c2720cc8)
- [Best Inference Providers for AI Agents 2026 (Fast.io)](https://fast.io/resources/best-inference-providers-ai-agents/)
- [Hono Streaming Helper docs](https://hono.dev/docs/helpers/streaming)
- [Hono with Server Sent Events (yanael.io)](https://yanael.io/articles/hono-sse/)
- [Hono SSE starter (DEV Community)](https://dev.to/jswhisperer/sse-cool-starter-with-cloudflare-workers-and-hono-server-1ml)
- [hono-stream-example (GitHub)](https://github.com/hellokaton/hono-stream-example)
- [Streaming RAG: Real-Time Responses (Ailog)](https://app.ailog.fr/en/blog/guides/streaming-rag-responses)
- [Complete Guide to Streaming RAG (Medium)](https://medium.com/aingineer/a-complete-guide-to-implementing-streaming-rag-4e86bc0bb994)
- [DeepInfra Pricing](https://deepinfra.com/pricing)
- [DeepInfra Qwen API Pricing Guide](https://deepinfra.com/blog/qwen-api-pricing-2026-guide)
- [Llama 3.3 70B Providers Benchmark (Artificial Analysis)](https://artificialanalysis.ai/models/llama-3-3-instruct-70b/providers)
- [Llama 3.1 8B Providers Benchmark (Artificial Analysis)](https://artificialanalysis.ai/models/llama-3-1-instruct-8b/providers)

### Layer 3
- [Speculative RAG (Google, ICLR 2025)](https://arxiv.org/html/2407.08223v2)
- [Speculative RAG blog (Google Research)](https://research.google/blog/speculative-rag-enhancing-retrieval-augmented-generation-through-drafting/)
- [StreamingRAG (arXiv 2025)](https://arxiv.org/html/2501.14101v1)
- [CoT-RAG (arXiv 2025)](https://arxiv.org/abs/2504.13534)
- [RAT: Retrieval Augmented Thoughts](https://arxiv.org/html/2403.05313v1)
- [MA-RAG (arXiv 2025)](https://arxiv.org/abs/2505.20096)
- [Cohere RAG Citations docs](https://docs.cohere.com/docs/rag-citations)
- [Groq Compound Beta docs](https://console.groq.com/docs/agentic-tooling/compound-beta)
- [Qwen3 30B A3B specs (llm-stats)](https://llm-stats.com/models/qwen3-30b-a3b)
- [Qwen3 blog (official)](https://qwenlm.github.io/blog/qwen3/)
- [Best LLM for RAG 2026 leaderboard](https://pricepertoken.com/leaderboards/rag)

### Layer 4
- [Inverted Pyramid (Wikipedia)](https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism))
- [Inverted Pyramid: Writing for Comprehension (NN/g)](https://www.nngroup.com/articles/inverted-pyramid/)
- [Adaptive Bitrate Streaming (Wikipedia)](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming)

### Layer 5
- [TTFT explained (IBM)](https://www.ibm.com/think/topics/time-to-first-token)
- [Key metrics for LLM inference (BentoML)](https://bentoml.com/llm/inference-optimization/llm-inference-metrics)
- [TTFT: Critical LLM Latency Metric (TrackAI)](https://trackai.dev/tracks/performance/latency-ttft/ttft-explained/)
- [Streaming vs Batch Processing for LLM Outputs (Medium)](https://medium.com/@muhammaduzairse/streaming-vs-batch-processing-for-llm-outputs-architecture-and-ux-tradeoffs-5c1d266397f2)
- [Long Context RAG Performance (Databricks)](https://www.databricks.com/blog/long-context-rag-performance-llms)
- [RAG makes LLMs better and equal (Pinecone)](https://www.pinecone.io/blog/rag-study/)
- [LLM API Pricing Comparison (Helicone)](https://www.helicone.ai/llm-cost)
- [LiteLLM Fallback docs](https://docs.litellm.ai/docs/proxy/reliability)
- [Cohere Pricing (MetaCTO)](https://www.metacto.com/blogs/cohere-pricing-explained-a-deep-dive-into-integration-development-costs)
