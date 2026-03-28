# Spec: Delivery — F-012, F-014, F-015, F-016
> Contexter RAG | Written: 2026-03-28
> Implementor: Mies (backend player)

---

## Stack context

| Layer | Detail |
|---|---|
| Runtime | Bun on Hetzner CAX11 (ARM64) |
| API framework | Hono ^4.12.8 |
| LLM provider | Groq (`https://api.groq.com/openai/v1`) — OpenAI-compatible |
| Current LLM model | `llama-3.1-8b-instant` (single model, all uses) |
| Source root | `src/` |
| Entry point | `src/index.ts` — Hono app, BullMQ worker, Bun server |
| Key service | `src/services/llm.ts` — `LlmService` class |
| Key route | `src/routes/query.ts` — `POST /api/query` |
| RAG orchestrator | `src/services/rag/index.ts` — `RagService.query()` |
| Env injection | `src/index.ts` builds `Env` object, injected via `c.set("env", env)` middleware |
| Env type | `src/types/env.ts` — `interface Env` |

**Frozen interfaces (do not change):**
- `RagService.query(input: RagQuery): Promise<RagAnswer>` — signature stays as-is
- `POST /api/query` request/response shape — stays as-is
- Auth flow via `resolveAuth()` — reuse exactly as in query.ts
- Rate limiting pattern via Redis — reuse exactly as in query.ts

---

## F-015: LLM model upgrade (70B answer model)

> Implement this first — F-012 and F-014 build on the split-model structure.

### Current state

`LlmService` takes a single `model` constructor argument (default `"llama-3.1-8b-instant"`).
In `src/index.ts`, the `Env` object has one field `GROQ_LLM_MODEL` (used nowhere in query route — query route calls `new LlmService(env.GROQ_API_KEY)` with no model arg, so the default string is always used).

Both uses of the LLM — query rewriting (`rag/rewriter.ts` calls `llm.chat()`) and answer generation (`rag/index.ts` `generateAnswer()`) — use the same `LlmService` instance and therefore the same model.

### Implementation

**Goal:** query rewriting uses cheap 8B; answer generation uses quality 70B. Two separate `LlmService` instances, injected into `RagService`.

#### Step 1 — Extend `RagServiceDeps` in `src/services/rag/index.ts`

Add an optional second LLM instance for answer generation:

```typescript
export interface RagServiceDeps {
  llm: LlmService           // used for query rewriting (8B)
  llmAnswer?: LlmService    // used for answer generation (70B) — falls back to llm if not provided
  embedder: EmbedderService
  vectorStore: VectorStoreService
  config?: RagConfig
  docsMeta?: string
}
```

In `RagService` constructor, store both:
```typescript
this.llm = deps.llm
this.llmAnswer = deps.llmAnswer ?? deps.llm
```

In `generateAnswer()`, change `this.llm.chat(...)` to `this.llmAnswer.chat(...)`.

#### Step 2 — Extend `Env` in `src/types/env.ts`

Add two new optional fields:
```typescript
GROQ_REWRITE_MODEL: string   // default: "llama-3.1-8b-instant"
GROQ_ANSWER_MODEL: string    // default: "llama-3.3-70b-versatile"
```

#### Step 3 — Update `src/index.ts`

In the `Env` object construction block (around line 60–72), add:
```typescript
GROQ_REWRITE_MODEL: process.env.GROQ_REWRITE_MODEL ?? "llama-3.1-8b-instant",
GROQ_ANSWER_MODEL: process.env.GROQ_ANSWER_MODEL ?? "llama-3.3-70b-versatile",
```

#### Step 4 — Update `src/routes/query.ts`

Replace the single `LlmService` instantiation with two:
```typescript
const llmRewrite = new LlmService(env.GROQ_API_KEY, env.GROQ_REWRITE_MODEL)
const llmAnswer = new LlmService(env.GROQ_API_KEY, env.GROQ_ANSWER_MODEL)
const rag = new RagService({ llm: llmRewrite, llmAnswer, embedder, vectorStore, docsMeta })
```

#### Cost note

This upgrade changes answer generation cost: `$0.12 → $1.30 per 1,000 queries` (Groq pricing for 70B vs 8B). At ≤10K queries/month = ~$13/month. Acceptable at current scale. Query rewriting stays at 8B (cheap, simple task — model quality irrelevant).

Monitor `llama-3.3-70b-versatile` availability on Groq — if quota issues arise, fall back via env var without code change.

### Files changed

| File | Change |
|---|---|
| `src/types/env.ts` | Add `GROQ_REWRITE_MODEL`, `GROQ_ANSWER_MODEL` fields |
| `src/index.ts` | Populate new env fields from `process.env` |
| `src/services/rag/index.ts` | Add `llmAnswer` to `RagServiceDeps`, store and use in `generateAnswer()` |
| `src/routes/query.ts` | Instantiate two `LlmService` instances, pass `llmAnswer` to `RagService` |

### Verification

```bash
# 1. Check model is being used — inspect logs during a query
curl -s -X POST https://api.contexter.cc/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main topic of the documents?"}' | jq '.answer'
# Expected: non-empty answer string

# 2. Confirm env defaults work without setting vars
GROQ_ANSWER_MODEL= bun run src/index.ts &
# Expected: server starts, no crash — defaults kick in

# 3. Verify split is active via temporary log (add + remove after verification)
# In generateAnswer(), add: console.log("Answer model:", this.llmAnswer)
# Run query → logs should show llmAnswer baseUrl/model = 70B
```

---

## F-016: Groq prompt caching

### Current state

`LlmService.chat()` sends bare `Authorization` and `Content-Type` headers only. No cache-control headers. Every request re-processes the system prompt from scratch on Groq's side.

The system prompt (`DEFAULT_SYSTEM_PROMPT` in `rag/types.ts`) is constant across all queries — it is the same prefix on every `chat()` call in `generateAnswer()`.

### Implementation

Groq prompt caching is activated per-message by adding a `cache_control` object inside the message body. The format follows Anthropic-style cache markers but is sent to Groq via their OpenAI-compatible endpoint.

**Exact request body change in `LlmService.chat()` — messages field:**

The system message must include a `cache_control` marker. Groq caches the prefix up to and including the last message that has `"cache_control": {"type": "ephemeral"}`.

In `LlmService.chat()`, the `body` sent to `fetch()` must be changed from:
```typescript
body: JSON.stringify({
  model: this.model,
  messages,
  max_tokens: maxTokens,
})
```

To:
```typescript
body: JSON.stringify({
  model: this.model,
  messages: messages.map((m, i) => {
    // Cache the system message (index 0, always the system prompt)
    if (m.role === "system") {
      return { ...m, cache_control: { type: "ephemeral" } }
    }
    return m
  }),
  max_tokens: maxTokens,
})
```

**Why this works:** Groq detects repeated prefix (same system message + same cache_control marker) and returns a cache hit. No server-side configuration needed. Cache hit reduces input token cost by ~50% for the cached prefix.

**Important:** the `cache_control` field is Groq-specific extended syntax. If `baseUrl` is switched to a non-Groq provider (e.g. DeepInfra in F-012), the extra field is silently ignored by OpenAI-compatible endpoints — no breakage.

**Verification of cache hits:** after enabling, check Groq usage dashboard at `console.groq.com` → Usage → look for `cached_tokens` metric in response metadata. The API response JSON also includes `usage.prompt_tokens_details.cached_tokens` when a cache hit occurs — log this optionally for observability.

### Files changed

| File | Change |
|---|---|
| `src/services/llm.ts` | Map over `messages` in `chat()`, attach `cache_control: { type: "ephemeral" }` to system-role messages |

### Verification

```bash
# Run two identical queries back-to-back and check Groq dashboard for cached_tokens
curl -s -X POST https://api.contexter.cc/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "summarize the documents"}' | jq '.usage'
# Run again immediately:
curl -s -X POST https://api.contexter.cc/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "summarize the documents"}' | jq '.usage'
# Expected: second call has lower llmPromptTokens (cached prefix not counted)
# Confirm in Groq dashboard: Usage → cached_tokens > 0 after second call
```

---

## F-012: DeepInfra LLM fallback provider

### Current state

`LlmService` has a single provider: Groq. Constructor reads `process.env.GROQ_LLM_URL` for base URL (defaults to `https://api.groq.com/openai/v1`). On 429, it retries up to 3 times with exponential backoff (`[1000, 2000, 4000]ms`) against the same provider. After 3 retries it throws: `"Groq API rate limit after 3 retries"`. On non-429 errors (5xx) it throws immediately without retry.

There is no secondary provider — a Groq outage or sustained rate limit means complete LLM failure.

### Implementation

Add DeepInfra as a secondary provider. The fallback chain is:

```
Groq (primary) → on 429 after retries OR on 5xx → DeepInfra (secondary) → on failure → raw context passthrough
```

**DeepInfra API details:**
- Base URL: `https://api.deepinfra.com/v1/openai`
- Auth: `Authorization: Bearer <DEEPINFRA_API_KEY>`
- API: fully OpenAI-compatible (`/chat/completions`)
- Models: same model names as Groq — `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` are available
- TTFT: ~1.5–2.0s (acceptable as fallback vs Groq's ~0.15s)

**Raw context passthrough:** if both providers fail, return a synthesized answer: `"Here are the relevant passages:\n\n{context}"`. This ensures the RAG route always returns something useful even during total LLM outage.

#### Changes to `src/services/llm.ts`

**1. New interface and constructor:**

```typescript
export interface LlmProviderConfig {
  apiKey: string
  baseUrl: string
}

export class LlmService {
  private primary: LlmProviderConfig
  private fallback: LlmProviderConfig | null
  private model: string

  constructor(
    apiKey: string,
    model: string = "llama-3.1-8b-instant",
    fallbackConfig?: LlmProviderConfig
  ) {
    this.primary = {
      apiKey,
      baseUrl: process.env.GROQ_LLM_URL ?? "https://api.groq.com/openai/v1",
    }
    this.fallback = fallbackConfig ?? null
    this.model = model
  }
}
```

**2. Refactor `chat()` to try primary then fallback:**

```typescript
async chat(messages: LlmMessage[], maxTokens: number = 1024): Promise<LlmResponse> {
  try {
    return await this.chatWithProvider(this.primary, messages, maxTokens)
  } catch (primaryError) {
    const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError)
    const isPrimaryRecoverable = errMsg.includes("rate limit") || errMsg.includes("429") || /5\d\d/.test(errMsg)

    if (this.fallback && isPrimaryRecoverable) {
      console.warn(`LLM primary failed (${errMsg.slice(0, 100)}), trying fallback provider`)
      try {
        return await this.chatWithProvider(this.fallback, messages, maxTokens)
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error(`LLM fallback also failed: ${fbMsg.slice(0, 100)}`)
      }
    }

    // Both failed (or no fallback configured) — return raw context passthrough
    console.error(`LLM unavailable, returning raw context passthrough. Primary error: ${errMsg.slice(0, 100)}`)
    return {
      response: this.extractContextPassthrough(messages),
      promptTokens: 0,
      completionTokens: 0,
    }
  }
}
```

**3. New private method `chatWithProvider()`** — extracts the current `chat()` fetch logic, parameterized by provider:

```typescript
private async chatWithProvider(
  provider: LlmProviderConfig,
  messages: LlmMessage[],
  maxTokens: number
): Promise<LlmResponse> {
  let lastError = ""

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => {
          if (m.role === "system") return { ...m, cache_control: { type: "ephemeral" } }
          return m
        }),
        max_tokens: maxTokens,
      }),
    })

    if (res.status === 429 && attempt < MAX_RETRIES) {
      lastError = await res.text()
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]))
      continue
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`LLM API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json() as GroqResponse

    if (!data.choices?.length) {
      console.warn("LLM returned empty choices — possible content filtering")
      return { response: "", promptTokens: 0, completionTokens: 0 }
    }

    return {
      response: data.choices[0]?.message?.content ?? "",
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    }
  }

  throw new Error(`LLM rate limit after ${MAX_RETRIES} retries: ${lastError}`)
}
```

Note: `cache_control` is included here (F-016 merged in). It is silently ignored by DeepInfra's OpenAI-compatible endpoint.

**4. New private method `extractContextPassthrough()`:**

```typescript
private extractContextPassthrough(messages: LlmMessage[]): string {
  const userMsg = messages.find((m) => m.role === "user")
  if (!userMsg) return "LLM unavailable."
  // Extract the context block from the user message
  const contextMatch = userMsg.content.match(/Context:\n([\s\S]*?)\n\nQuestion:/)
  if (contextMatch?.[1]) {
    return `Here are the relevant passages:\n\n${contextMatch[1].trim()}`
  }
  return "LLM unavailable. Please try again later."
}
```

**5. Update `src/routes/query.ts`** — pass fallback config when constructing `LlmService`:

```typescript
const fallbackConfig = env.DEEPINFRA_API_KEY
  ? { apiKey: env.DEEPINFRA_API_KEY, baseUrl: "https://api.deepinfra.com/v1/openai" }
  : undefined

const llmRewrite = new LlmService(env.GROQ_API_KEY, env.GROQ_REWRITE_MODEL, fallbackConfig)
const llmAnswer = new LlmService(env.GROQ_API_KEY, env.GROQ_ANSWER_MODEL, fallbackConfig)
```

**6. Extend `Env` in `src/types/env.ts`:**

```typescript
DEEPINFRA_API_KEY?: string   // optional — fallback disabled if not set
```

**7. Update `src/index.ts`** — populate from env:

```typescript
DEEPINFRA_API_KEY: process.env.DEEPINFRA_API_KEY,  // optional
```

**Interaction with F-014 (SSE streaming):** the streaming path (`chatStream()`) must also implement the same fallback logic. See F-014 section — `chatStream()` wraps `chatStreamWithProvider()` in the same primary→fallback pattern. If fallback is triggered during streaming, the fallback provider must also support `stream: true` — DeepInfra does. If both streaming providers fail, emit an `error` SSE event (not raw context passthrough, since streaming is already started).

**Distinction from F-022:** F-012 is business logic fallback (provider routing). F-022 (circuit breakers, not in this spec) will wrap `LlmService` externally with resilience policies. Do not implement circuit breaker state in this ticket.

### Files changed

| File | Change |
|---|---|
| `src/services/llm.ts` | Add `LlmProviderConfig`, refactor to `chatWithProvider()`, add fallback routing in `chat()`, add `extractContextPassthrough()` |
| `src/types/env.ts` | Add optional `DEEPINFRA_API_KEY?: string` |
| `src/index.ts` | Populate `DEEPINFRA_API_KEY` from `process.env` |
| `src/routes/query.ts` | Build `fallbackConfig`, pass to both `LlmService` constructors |

### Verification

```bash
# 1. Normal path — should use Groq, return answer
curl -s -X POST https://api.contexter.cc/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq '.answer'
# Expected: non-empty answer string

# 2. Simulate Groq failure — temporarily set invalid Groq key, valid DeepInfra key
GROQ_API_KEY=invalid DEEPINFRA_API_KEY=$REAL_DEEPINFRA_KEY bun run src/index.ts &
curl -s -X POST http://localhost:3000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq '.answer'
# Expected: non-empty answer (via DeepInfra fallback)
# Expected in logs: "LLM primary failed ... trying fallback provider"

# 3. Simulate both failing — invalid Groq + no DeepInfra key
GROQ_API_KEY=invalid bun run src/index.ts &
curl -s -X POST http://localhost:3000/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq '.answer'
# Expected: answer starts with "Here are the relevant passages:"
```

---

## F-014: SSE streaming endpoint

### Current state

`POST /api/query` (mounted at `/api/query/` via `app.route("/api/query", query)`) is synchronous. The full RAG pipeline runs — rewrite → embed → search → LLM — then returns a single JSON response. Typical latency: 3–5s before client sees first byte.

`LlmService.chat()` calls `fetch()` and awaits the full response body before returning. No streaming fetch.

Hono `streamSSE` is available in `hono/streaming` — confirmed present in `node_modules/hono/dist/types/helper/streaming/sse.d.ts`. The `SSEStreamingApi` has a `writeSSE({ data, event, id })` method.

### Implementation

Add a new route handler `POST /query/stream` inside `src/routes/query.ts`. Keep `POST /` (the existing handler) completely unchanged.

The SSE streaming architecture:
1. **Retrieval phase** runs synchronously (non-streamed) — rewrite + embed + search
2. **`sources` event** sent immediately when retrieval is complete — client can render citations before LLM finishes
3. **`token` events** stream LLM content deltas as they arrive from Groq
4. **`done` event** sent when LLM stream completes — carries usage stats
5. **`error` event** on any failure — carries error message, connection closes

#### SSE event protocol (exact format)

All events use Hono's `writeSSE({ event, data })`. The `data` field is always a JSON string.

**Event: `sources`** — sent once, after retrieval completes, before LLM starts
```
event: sources
data: {"sources":[{"documentId":"...","document_name":"...","content":"...","score":0.025,"source":"..."}],"queryVariants":["...","..."]}
```

**Event: `token`** — sent for each content delta from the LLM stream
```
event: token
data: {"token":"word"}
```

**Event: `done`** — sent once when stream finishes
```
event: done
data: {"usage":{"embeddingTokens":42,"llmPromptTokens":850,"llmCompletionTokens":320}}
```

**Event: `error`** — sent on any failure (retrieval or LLM)
```
event: error
data: {"error":"Rate limit exceeded"}
```

#### New `chatStream()` method in `src/services/llm.ts`

```typescript
async *chatStream(
  messages: LlmMessage[],
  maxTokens: number = 1536
): AsyncIterable<string> {
  try {
    yield* this.chatStreamWithProvider(this.primary, messages, maxTokens)
  } catch (primaryError) {
    const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError)
    const isPrimaryRecoverable = errMsg.includes("rate limit") || errMsg.includes("429") || /5\d\d/.test(errMsg)

    if (this.fallback && isPrimaryRecoverable) {
      console.warn(`LLM stream primary failed (${errMsg.slice(0, 100)}), trying fallback provider`)
      try {
        yield* this.chatStreamWithProvider(this.fallback, messages, maxTokens)
        return
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        console.error(`LLM stream fallback also failed: ${fbMsg.slice(0, 100)}`)
      }
    }

    // Both failed — re-throw so the route handler can emit an SSE error event
    throw primaryError
  }
}

private async *chatStreamWithProvider(
  provider: LlmProviderConfig,
  messages: LlmMessage[],
  maxTokens: number
): AsyncIterable<string> {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: this.model,
      messages: messages.map((m) => {
        if (m.role === "system") return { ...m, cache_control: { type: "ephemeral" } }
        return m
      }),
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LLM stream API error ${res.status}: ${text.slice(0, 200)}`)
  }

  if (!res.body) throw new Error("LLM stream: no response body")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue
      const payload = line.slice(6).trim()
      if (payload === "[DONE]") return
      try {
        const chunk = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] }
        const token = chunk.choices?.[0]?.delta?.content
        if (token) yield token
      } catch {
        // malformed chunk — skip
      }
    }
  }
}
```

**Note on `max_tokens`:** `chatStream()` defaults to `1536` (increased from `1024` in `chat()`). RAG answers are information-dense — 1024 causes truncation at the end of long answers. The `chat()` method default stays at `1024` to avoid breaking non-streaming callers. The streaming route always calls `chatStream()` with the 1536 default.

#### New streaming method on `RagService` in `src/services/rag/index.ts`

Add `queryStream()` method — parallel to existing `query()`, never modifies it:

```typescript
async *queryStream(input: RagQuery): AsyncIterable<RagStreamEvent> {
  // Phase 1: retrieval (same as query())
  const queryVariants = await rewriteQuery(input.query, this.config.queryRewriteCount, this.llm)

  const queryEmbeddings = await this.embedder.embedBatch(
    queryVariants,
    { task: "retrieval.query" }
  )

  const allResults: HybridSearchResult[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < queryVariants.length; i++) {
    const results = await this.vectorStore.search(
      queryEmbeddings.embeddings[i].vector,
      queryVariants[i],
      {
        topK: input.topK ?? 10,
        scoreThreshold: input.scoreThreshold ?? 0,
        userId: input.userId,
      }
    )
    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        allResults.push(result)
      }
    }
  }

  allResults.sort((a, b) => b.score - a.score)
  const { context, sources } = buildContext(allResults, this.config.maxContextTokens)

  // Yield sources immediately — client can render citations before LLM starts
  yield { type: "sources", sources, queryVariants, embeddingTokens: queryEmbeddings.totalTokens }

  // Phase 2: LLM streaming
  const metaSection = this.docsMeta
    ? `\nDocuments in knowledge base:\n${this.docsMeta}\n`
    : ""
  const fullContext = `${metaSection}${context}`.trim()

  if (!fullContext || fullContext.length === 0) {
    yield { type: "token", token: "В базе знаний пока нет документов. Загрузите файлы чтобы начать." }
    yield { type: "done", llmPromptTokens: 0, llmCompletionTokens: 0 }
    return
  }

  const messages: LlmMessage[] = [
    { role: "system", content: this.config.systemPrompt },
    { role: "user", content: `Context:\n${fullContext}\n\nQuestion: ${input.query}` },
  ]

  // Use llmAnswer (70B) for streaming too
  for await (const token of this.llmAnswer.chatStream(messages)) {
    yield { type: "token", token }
  }

  yield { type: "done", llmPromptTokens: 0, llmCompletionTokens: 0 }
  // Note: token counts are not available from streaming responses in the standard OpenAI SSE format.
  // Groq may include usage in the final [DONE] chunk — if needed, capture it in chatStreamWithProvider.
}
```

Add `RagStreamEvent` type to `src/services/rag/types.ts` (or inline in `rag/index.ts`):

```typescript
export type RagStreamEvent =
  | { type: "sources"; sources: RagSource[]; queryVariants: string[]; embeddingTokens: number }
  | { type: "token"; token: string }
  | { type: "done"; llmPromptTokens: number; llmCompletionTokens: number }
```

#### New route handler in `src/routes/query.ts`

Add after the existing `query.post("/", ...)` handler. Import `streamSSE` at the top of the file.

**Import addition:**
```typescript
import { streamSSE } from "hono/streaming"
```

**New handler:**
```typescript
query.post("/stream", async (c) => {
  const sql = c.get("sql")
  const env = c.get("env")
  const redis = c.get("redis")
  const auth = await resolveAuth(sql, c.req.raw)
  if (!auth) return c.json({ error: "Unauthorized." }, 401)

  let body: { query?: string; topK?: number }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body." }, 400)
  }

  if (!body.query || body.query.trim().length === 0) return c.json({ error: "Query is required." }, 400)
  if (body.query.length > 2000) return c.json({ error: "Query exceeds 2000 character limit." }, 400)

  // Rate limit — same pattern as /query
  const queryRateKey = `rate:query:${auth.userId}`
  try {
    const count = await redis.incr(queryRateKey)
    if (count === 1) await redis.expire(queryRateKey, 60)
    if (count > 60) {
      return c.json({ error: "Query rate limit exceeded. Maximum 60 queries per minute." }, 429)
    }
  } catch (e) {
    console.error("Redis query rate limit check failed, allowing request:", e instanceof Error ? e.message : String(e))
  }

  const embedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStore = new VectorStoreService({ sql })
  await vectorStore.initialize()

  const docsMeta = (await sql<{ name: string; mime_type: string; status: string; chunk_count: number }[]>`
    SELECT d.name, d.mime_type, d.status,
      (SELECT COUNT(*)::int FROM chunks WHERE document_id = d.id) as chunk_count
    FROM documents d WHERE d.user_id = ${auth.userId} ORDER BY d.created_at DESC LIMIT 50
  `)
    .map((d) => `- ${d.name} (${d.mime_type}, ${d.status}, ${d.chunk_count} chunks)`)
    .join("\n")

  const fallbackConfig = env.DEEPINFRA_API_KEY
    ? { apiKey: env.DEEPINFRA_API_KEY, baseUrl: "https://api.deepinfra.com/v1/openai" }
    : undefined

  const llmRewrite = new LlmService(env.GROQ_API_KEY, env.GROQ_REWRITE_MODEL, fallbackConfig)
  const llmAnswer = new LlmService(env.GROQ_API_KEY, env.GROQ_ANSWER_MODEL, fallbackConfig)
  const rag = new RagService({ llm: llmRewrite, llmAnswer, embedder, vectorStore, docsMeta })

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of rag.queryStream({
        query: body.query!.trim(),
        userId: auth.userId,
        topK: Math.min(body.topK ?? 5, 20),
        scoreThreshold: 0,
      })) {
        if (event.type === "sources") {
          // Filter + enrich sources (same as /query)
          const filteredSources = event.sources.filter((s) => {
            if (auth.scope === "all") return true
            return auth.scope.includes(s.documentId)
          })
          const docIds = [...new Set(filteredSources.map((s) => s.documentId))]
          const docs = docIds.length > 0
            ? await sql<{ id: string; file_name: string }[]>`
                SELECT id, name as file_name FROM documents WHERE id = ANY(${docIds})`
            : []
          const nameMap = Object.fromEntries(docs.map((d) => [d.id, d.file_name]))
          await stream.writeSSE({
            event: "sources",
            data: JSON.stringify({
              sources: filteredSources.map((s) => ({
                documentId: s.documentId,
                document_name: nameMap[s.documentId] ?? s.documentId,
                content: s.content,
                score: s.score,
                source: s.source,
              })),
              queryVariants: event.queryVariants,
            }),
          })
        } else if (event.type === "token") {
          await stream.writeSSE({
            event: "token",
            data: JSON.stringify({ token: event.token }),
          })
        } else if (event.type === "done") {
          await stream.writeSSE({
            event: "done",
            data: JSON.stringify({
              usage: {
                embeddingTokens: 0,   // set from sources event if needed
                llmPromptTokens: event.llmPromptTokens,
                llmCompletionTokens: event.llmCompletionTokens,
              },
            }),
          })
        }
      }
    } catch (e) {
      await stream.writeSSE({
        event: "error",
        data: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      })
    }
  })
})
```

**Route registration in `src/index.ts`:** no change needed. `query.ts` exports the `query` Hono app, which is already mounted at `/api/query`. The new handler at `query.post("/stream", ...)` becomes `POST /api/query/stream` automatically.

**CORS note:** the existing CORS middleware in `src/index.ts` applies to all routes. SSE clients must send `Authorization` header — this is already in `allowHeaders`. No CORS changes needed.

### Files changed

| File | Change |
|---|---|
| `src/services/llm.ts` | Add `chatStream()` generator, `chatStreamWithProvider()` private generator |
| `src/services/rag/index.ts` | Add `queryStream()` method, `RagStreamEvent` type |
| `src/routes/query.ts` | Add `import { streamSSE } from "hono/streaming"`, add `query.post("/stream", ...)` handler |

### Verification

```bash
# 1. Basic streaming test — verify SSE event sequence
curl -N -X POST https://api.contexter.cc/api/query/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the main topics covered in the knowledge base?"}' \
  --no-buffer

# Expected output (streaming, each line arrives as it's generated):
# event: sources
# data: {"sources":[...],"queryVariants":["...",..."]}
#
# event: token
# data: {"token":"The"}
#
# event: token
# data: {"token":" main"}
#
# [... many token events ...]
#
# event: done
# data: {"usage":{"embeddingTokens":0,"llmPromptTokens":0,"llmCompletionTokens":0}}

# 2. Verify sources arrive before tokens (timing)
curl -N -X POST https://api.contexter.cc/api/query/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' \
  --no-buffer 2>&1 | head -20
# Expected: "event: sources" appears FIRST, before any "event: token"

# 3. Verify error event on bad auth
curl -N -X POST https://api.contexter.cc/api/query/stream \
  -H "Authorization: Bearer bad-token" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
# Expected: HTTP 401, JSON body {"error":"Unauthorized."}

# 4. Verify existing /query still works (no regression)
curl -s -X POST https://api.contexter.cc/api/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}' | jq 'keys'
# Expected: ["answer","queryVariants","sources","usage"]

# 5. Verify SSE Content-Type header
curl -I -X POST https://api.contexter.cc/api/query/stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
# Expected header: Content-Type: text/event-stream
```

---

## Acceptance Criteria

| ID | Criteria | How to verify |
|---|---|---|
| AC-1 | `POST /api/query` returns same JSON shape as before (no regression) | `curl /api/query` → `jq 'keys'` returns `["answer","queryVariants","sources","usage"]` |
| AC-2 | Answer generation uses `llama-3.3-70b-versatile` by default | Set `GROQ_ANSWER_MODEL=""` → defaults to `"llama-3.3-70b-versatile"` in logs or Groq dashboard |
| AC-3 | Query rewriting uses `llama-3.1-8b-instant` | Set `GROQ_REWRITE_MODEL=""` → defaults to `"llama-3.1-8b-instant"` |
| AC-4 | System message has `cache_control: { type: "ephemeral" }` in LLM request body | Add temp log in `chatWithProvider()`, run a query, confirm field present |
| AC-5 | Groq 429 triggers DeepInfra fallback when `DEEPINFRA_API_KEY` is set | Set invalid Groq key + valid DeepInfra key → query returns non-empty answer + logs show fallback |
| AC-6 | Both providers failing returns raw context passthrough (non-stream) | Set both keys invalid → `answer` field starts with `"Here are the relevant passages:"` |
| AC-7 | `POST /api/query/stream` responds with `Content-Type: text/event-stream` | `curl -I /api/query/stream` |
| AC-8 | SSE event sequence: `sources` arrives before first `token` | `curl -N /api/query/stream \| head -5` → first event is `sources` |
| AC-9 | `sources` SSE event contains correct JSON with `sources[]` and `queryVariants[]` | Parse SSE output, validate structure |
| AC-10 | `done` SSE event is always the last event | `curl -N /api/query/stream` → last event is `done`, connection closes |
| AC-11 | SSE `error` event emitted on LLM failure during streaming | Simulate LLM error → client receives `event: error` data, not a broken stream |
| AC-12 | Streaming DeepInfra fallback works (F-012 × F-014 interaction) | Set invalid Groq key, valid DeepInfra → stream tokens arrive from DeepInfra |
| AC-13 | Rate limit (60/min) applies to `/query/stream` same as `/query` | Send 61 requests in 60s → 61st returns HTTP 429 |
| AC-14 | `max_tokens` in streaming calls is 1536, not 1024 | Add temp log in `chatStreamWithProvider`, confirm `maxTokens=1536` |
| AC-15 | Service starts without `DEEPINFRA_API_KEY` set — fallback gracefully disabled | Start without env var → no crash, queries work normally via Groq |

---

## Implementation order

1. **F-015** — split model config (foundation for everything else)
2. **F-016** — add `cache_control` to `chatWithProvider()` (trivial, low risk)
3. **F-012** — add DeepInfra fallback routing (refactor `chat()` into `chatWithProvider()`)
4. **F-014** — add `chatStream()` + `queryStream()` + `/query/stream` route (largest change, builds on F-012's refactored structure)

Each step is independently deployable and testable.
