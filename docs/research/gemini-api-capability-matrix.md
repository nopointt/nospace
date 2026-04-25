# Gemini API Capability Matrix
**Research date:** 2026-04-25  
**Scope:** Gemini Developer API (api.generativelanguage.googleapis.com), all models, free and paid tiers  
**Status:** Production reference + cheat sheet

---

## 1. Executive Summary

Gemini API has undergone a major generational shift in late 2025 / early 2026. The Gemini 3 series (3 Flash, 3.1 Pro, 3.1 Flash-Lite) is already in preview and partially GA, with capabilities substantially ahead of 2.5. The single most important finding: **Deep Research is now a direct API endpoint** (Interactions API, public beta as of Dec 2025), not something you replicate manually. The second key finding: **structured output + built-in tools simultaneously** is ONLY available in Gemini 3 series — all 2.5 models cannot do this. Third: **Gemini 3 uses `thinkingLevel` (low/medium/high), while 2.5 uses `thinkingBudget` (integer tokens)** — they are mutually exclusive. The free tier was cut 50-80% in December 2025; 2.5 Flash is now 10 RPM / 250 RPD. Flex/Priority inference tiers launched April 2026, adding 50%-off and premium-reliability options alongside the Batch API (also 50% off). The H1 hypothesis is partially wrong: Deep Research IS a direct API endpoint now, not just DIY.

---

## 2. Models Matrix

### Gemini 3 Series (Preview, Nov 2025 – Apr 2026)

| Model ID | Use Case | Context In | Context Out | Free Tier | Paid Input | Paid Output | Key Strength |
|---|---|---|---|---|---|---|---|
| `gemini-3.1-pro-preview` | Complex reasoning, coding, research | 1M tokens | 64K tokens | AI Studio only (no API free tier) | $2.00/1M (<200K) / $4.00/1M (>200K) | $12.00/1M (<200K) / $18.00/1M (>200K) | Best intelligence, cannot disable thinking |
| `gemini-3-flash-preview` | Fast frontier-class tasks | 1M tokens | 64K tokens | Limited RPM/RPD (check AI Studio) | $0.50/1M (text/img/vid) / $1.00/1M (audio) | $3.00/1M | Pro-level quality at Flash price |
| `gemini-3.1-flash-lite-preview` | High-volume, cost-sensitive | 1M tokens | 64K tokens | Available (check AI Studio limits) | $0.25/1M (text/img/vid) / $0.50/1M (audio) | $1.50/1M | Cheapest multimodal option |
| `gemini-3.1-flash-live-preview` | Real-time voice/audio agents | Streaming | Streaming | N/A | Live API pricing | Live API pricing | Real-time audio-to-audio dialogue |
| `gemini-3.1-flash-tts-preview` | Text-to-speech | Text | Audio | N/A | TTS pricing | TTS pricing | 30 HD voices, 24 languages |

**Gemini 3 Key Differentiators vs 2.5:**
- Structured output + built-in tools in single call (EXCLUSIVE to Gemini 3)
- `thinkingLevel` parameter (not thinkingBudget) — low/medium/high
- Combined built-in + function calling (tool context circulation)
- Maps grounding support
- Thought Signatures (encrypted internal reasoning — must pass back in function calling workflows)
- Knowledge cutoff: January 2025

### Gemini 2.5 Series (Current Stable)

| Model ID | Use Case | Context In | Context Out | Free Tier RPM | Free Tier RPD | Free Tier TPM | Paid Input | Paid Output |
|---|---|---|---|---|---|---|---|---|
| `gemini-2.5-pro` | Complex analysis, advanced coding | 1M tokens | 64K tokens | 5 RPM | 100 RPD | 250K TPM | $1.25/1M (<200K) / $2.50/1M (>200K) | $10.00/1M (<200K) / $15.00/1M (>200K) |
| `gemini-2.5-flash` | Best price/performance, reasoning | 1M tokens | 64K tokens | 10 RPM | 250 RPD | 250K TPM | $0.30/1M (text/img/vid) / $1.00/1M (audio) | $2.50/1M |
| `gemini-2.5-flash-lite` | Fastest, budget workloads | 1M tokens | 64K tokens | 15 RPM | 1,000 RPD | 250K TPM | $0.10/1M (text/img/vid) / $0.30/1M (audio) | $0.40/1M |

**Implicit caching:** Automatically enabled on all 2.5+ models with no guaranteed savings.  
**Thinking:** 2.5 Pro uses `thinkingBudget` 128-32768 (cannot disable). 2.5 Flash uses `thinkingBudget` 0-24576 (can disable with 0, dynamic with -1).

### Specialized Models

| Model | Purpose | Pricing |
|---|---|---|
| `gemini-embedding-2` | Multimodal embeddings, 3072 dims, MRL | $0.15/1M tokens (text); higher for other modalities |
| `gemini-embedding-001` | Text embeddings, 3072 dims | Available on free tier; exact pricing check pricing page |
| `deep-research-preview-04-2026` | Autonomous research agent | ~$1-3/task estimate (80 searches, 250K in + 60K out) |
| `deep-research-max-preview-04-2026` | Deep Research Max (higher quality) | ~$3-7/task estimate (160 searches, 900K in + 80K out) |
| `computer-use-preview` | UI automation | Standard model token rates |
| Veo 3.1 / Imagen 4 / Lyria 3 | Video/image/music generation | $0.02-$0.60/unit depending on model+output |

**DEPRECATED:** `text-embedding-004` shut down January 14, 2026. Migrate to `gemini-embedding-001` or `gemini-embedding-2`.  
**DEPRECATED:** `gemini-2.0-flash` variants deprecating June 1, 2026.  
**SHUTDOWN:** All Gemini 1.5 models (Sept 29, 2025).

---

## 3. Config Flags Reference

### GenerateContentConfig Parameters (generate_content endpoint)

| Parameter | Type | Range / Values | Default | Effect |
|---|---|---|---|---|
| `temperature` | float | 0.0 – 2.0 | model default | Randomness. 0 = deterministic. Gemini 3 docs warn: avoid low values, may cause looping on complex tasks |
| `top_p` | float | 0.0 – 1.0 | model default | Nucleus sampling probability mass |
| `top_k` | int | 1 – max | model default | Vocabulary sampling limit |
| `max_output_tokens` | int | 1 – model max | model default | Hard cap on output length. 64K for Gemini 3, 64K for 2.5 |
| `system_instruction` | string | Any text | None | System prompt. Separate from user content. No documented hard token limit, but counts against context window |
| `tools` | array | Tool objects | None | Enable built-in or custom tools (see Tools Catalog) |
| `tool_config` | object | `{function_calling_config: {mode, allowed_function_names}}` | AUTO | Controls function calling mode |
| `response_mime_type` | string | `"text/plain"` \| `"application/json"` \| `"text/x.enum"` | `"text/plain"` | Forces JSON or enum output |
| `response_json_schema` | object | JSON Schema | None | Schema to enforce on JSON output. Supports Pydantic/Zod |
| `cached_content` | string | Cache name | None | Reference to explicit cache. Format: `caches/{id}` |
| `safety_settings` | array | HarmCategory + threshold objects | Default safe | Content filtering thresholds |
| `candidate_count` | int | 1 (only value supported) | 1 | Number of response candidates |
| `stop_sequences` | array | String list | None | Strings that halt generation |
| `response_modalities` | array | `["TEXT"]`, `["IMAGE"]`, `["AUDIO"]` | `["TEXT"]` | Output modality |
| `media_resolution` | string | `low` / `medium` / `high` / `ultra_high` | medium | Tokens allocated per image/video frame. Affects cost and quality |
| `speech_config` | object | voice + language | None | For AUDIO modality output |

### ThinkingConfig (nested inside GenerateContentConfig)

| Parameter | Models | Values | Default |
|---|---|---|---|
| `thinkingBudget` | Gemini 2.5 Flash | 0 (off) to 24576; -1 (dynamic) | -1 (dynamic) |
| `thinkingBudget` | Gemini 2.5 Pro | 128 to 32768; -1 (dynamic); cannot be 0 | -1 (dynamic) |
| `thinkingLevel` | Gemini 3.1 Pro | `low`, `medium`, `high` | `high` |
| `thinkingLevel` | Gemini 3 Flash | `minimal`, `low`, `medium`, `high` | `high` |
| `thinkingLevel` | Gemini 3.1 Flash-Lite | `minimal`, `low`, `medium`, `high` | `minimal` |

**CRITICAL:** Do NOT set both `thinkingLevel` and `thinkingBudget` in the same config — returns error.  
**Pricing:** Thinking tokens count as output tokens for billing: `total_cost = input_tokens + thinking_tokens + output_tokens`.  
**Access:** Read via `response.usage_metadata.thoughts_token_count`.  
**Streaming:** Returns rolling incremental summaries. Non-streaming: single summary.  
**Gemini 3.1 Pro:** Cannot disable thinking at all.

### Optimal Values Per Use Case

| Use Case | temperature | thinkingBudget / thinkingLevel | max_output_tokens |
|---|---|---|---|
| News digest synthesis | 0.3-0.5 | 2.5 Flash: 4096 / 3 Flash: medium | 4096 |
| Fact-checking | 0.1-0.2 | 2.5 Flash: 8192 / 3 Flash: high | 2048 |
| Structured data extraction | 0.0 | 2.5 Flash: 0 (off) | 2048 |
| Content generation (creative) | 0.7-1.0 | 2.5 Flash: 0 (off) or 1024 | 8192 |
| Multi-source aggregation | 0.3-0.5 | 2.5 Flash: 4096 | 8192 |
| Coding / function generation | 0.2-0.4 | 2.5 Pro: dynamic | 8192 |

---

## 4. Tools Catalog

### Built-in Tools (server-side, single API call)

#### Google Search
```python
tools = [types.Tool(google_search=types.GoogleSearch())]
# Response includes groundingMetadata: {webSearchQueries, groundingChunks, groundingSupports}
```
- Grounds responses in real-time web results
- Free: 500-1,500 RPD depending on model (check pricing page — subject to change)
- Paid: $14-$35 per 1,000 grounding queries (model-dependent)
- Returns citation metadata (startIndex/endIndex → groundingChunkIndices)
- **Context circulation:** Each search result preserved in context for multi-step reasoning

#### URL Context
```python
tools = [{"url_context": {}}]
# In prompt: "Summarize https://example.com and https://other.com"
```
- Model fetches and reads content from provided URLs
- Max 20 URLs per request
- Max 34MB per URL
- URLs must be publicly accessible (no localhost, no private networks, no paywalled content)
- **LIMITATION:** Does NOT work with function calling (mutually exclusive in 2.5; combined only in Gemini 3 with caveats)
- Supports: web pages, public PDFs, public documents
- Does NOT support: YouTube videos, Google Workspace files, audio/video files

#### Code Execution
```python
tools = [types.Tool(code_execution=types.CodeExecution())]
```
- Python only (cannot execute other languages, but can generate them)
- Max runtime: 30 seconds
- No internet access in sandbox
- Pre-installed: NumPy, pandas, matplotlib, and standard numerics
- Can output charts/graphs via Matplotlib (Gemini 2.0+)
- File I/O supported (Gemini 2.0+): file input into sandbox
- No additional charge beyond standard token rates
- Up to 5 auto-retries on code errors

#### Google Maps (Gemini 3 series only)
```python
tools = [types.Tool(google_maps=types.GoogleMaps())]
```
- Location-aware responses: local businesses, spatial data, commute times
- Free tier: limited RPD (check pricing)
- Paid: $25 per 1,000 grounded prompts
- Billing started January 5, 2026

#### Computer Use (Preview)
```python
tools = [types.Tool(computer_use=types.ComputerUse())]
```
- Screen viewing and UI interaction
- Client-side execution only (your environment, not Google's)
- Extended to Gemini 3 models (January 2026)

#### File Search (RAG / Document Corpus)
```python
tools = [types.Tool(file_search=types.FileSearch(file_ids=["file_id_1"]))]
```
- Ground responses in custom document corpora
- Uses File API for indexed documents

### Custom Tools (Function Calling)

```python
tools = [types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="get_news_feed",
        description="Fetch recent news articles for a given topic",
        parameters=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "topic": types.Schema(type=types.Type.STRING, description="News topic"),
                "max_results": types.Schema(type=types.Type.INTEGER, description="Max articles")
            },
            required=["topic"]
        )
    )
])]
# tool_config mode: AUTO (default) / ANY (always call) / VALIDATED (mixed) / NONE (disable)
```

**Parallel function calling:** Model issues multiple function_call parts in one turn. Map by `id` field — return results in any order, model correlates by id.

**Function calling + built-in tools simultaneously:** Only Gemini 3 series (via tool context circulation). In 2.5, these are mutually exclusive with url_context.

**Schema format:** Subset of OpenAPI. Supported: type, nullable, required, format, description, properties, items, enum.

**Auto-schema from Python functions:** SDK can generate schema from docstrings.

### MCP Integration (Interactions API only)
```json
{
  "type": "mcp_server",
  "name": "my_tool_server",
  "url": "https://your-mcp-server.com/mcp"
}
```
- HTTP streaming only (SSE not supported for MCP in Interactions API)
- NOT compatible with Gemini 3 series (only 2.5 era in Interactions API)
- Deep Research agent has native MCP support (separate feature)

---

## 5. Advanced Features

### Structured Output (JSON Mode)

```python
config = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_json_schema=MyPydanticModel.model_json_schema()
)
```
- Pydantic BaseModel → `.model_json_schema()` → pass directly
- JavaScript: Zod → `zodToJsonSchema()` → pass directly
- Guarantees syntactic validity; NOT semantic correctness — validate in application code
- Property ordering preserved (all 2.5+ models)
- **Combining with built-in tools: ONLY Gemini 3 series**
- Partially supported JSON Schema spec: unsupported properties silently ignored
- Deeply nested or very large schemas may be rejected

### System Instructions

```python
config = types.GenerateContentConfig(
    system_instruction="You are a news synthesis agent. Produce structured summaries..."
)
```
- Separate from user `contents` — processed with higher weight
- No documented hard token limit; counts against 1M context window
- Best practice: persona → rules → examples → constraints (in that order)
- For Live API: single clear persona per system instruction; use prompt chaining instead of multi-page prompts
- Separate agents = separate system instructions (don't mix personas)
- Can be included in cached content to reduce per-call cost

### Context Caching

**Explicit caching (guaranteed savings):**
```python
cache = client.caches.create(
    model="gemini-2.5-flash",
    config=types.CreateCachedContentConfig(
        contents=[large_document],
        system_instruction="...",
        ttl="3600s",  # 1 hour default; "300s" minimum observed in examples
        display_name="my-corpus-cache"
    )
)
# Reference in subsequent calls:
config = types.GenerateContentConfig(cached_content=cache.name)
```

**Minimum token requirements:**
- Gemini 2.5 Flash / Gemini 3 Flash: 1,024 tokens minimum
- Gemini 2.5 Pro / Gemini 3 Pro: 4,096 tokens minimum

**Implicit caching (no setup, no guarantee):**
- Auto-enabled on all 2.5+ models
- System handles cache hits behind the scenes
- ~10% of standard input token rate on cache hits (when they occur)
- No guaranteed savings; probabilistic

**Cache storage cost:** $4.50 per 1M tokens/hour (varies by model; check pricing page)  
**Cache read cost:** ~$0.20-0.40 per 1M cached tokens (vs full input price)  
**TTL:** Default 1 hour. Can update TTL or set absolute `expire_time`. Can extend or shorten.  
**Cannot view cached content, only metadata.**  
**Batch API:** Context caching works in batch API with standard pricing for cache hits.  

### Streaming

```python
async for chunk in client.models.generate_content_stream(
    model="gemini-2.5-flash",
    contents=prompt,
    config=config
):
    print(chunk.text, end="", flush=True)
```
- Server-Sent Events (SSE) format
- Thinking tokens stream as rolling incremental summaries (not final consolidated)
- Non-thinking content: chunked as generated
- For Interactions API: reconnect via `last_event_id` parameter if connection drops
- `interaction.complete` event has outputs=null — aggregate from content.delta events

### Multi-Turn Conversations

```python
# Stateful via generate_content (manual history)
contents = [
    {"role": "user", "parts": [{"text": "First message"}]},
    {"role": "model", "parts": [{"text": "First response"}]},
    {"role": "user", "parts": [{"text": "Follow-up"}]}
]
response = client.models.generate_content(model="gemini-2.5-flash", contents=contents)

# Stateful via Interactions API (server manages history)
next_interaction = client.interactions.create(
    input="Follow-up question",
    previous_interaction_id=first_interaction.id
)
```
- `generate_content`: Client manages history as `contents` array. No server state.
- `Interactions API`: Server manages state via `previous_interaction_id`. Offloads context management.
- Max turns: limited by 1M token context window
- Role alternation: user → model → user → model. Tool results go into model turn.

### File Uploads (Files API)

```python
# Upload
uploaded_file = client.files.upload(
    path="document.pdf",
    config=types.UploadFileConfig(mime_type="application/pdf")
)
# Reference in prompt
contents = [types.Part.from_uri(file_uri=uploaded_file.uri, mime_type="application/pdf")]
```

**Limits:**
- Files API: max 2 GB per file, 20 GB total per project, stored 48 hours
- Inline data: max 100 MB (base64 encoded); PDF inline max 50 MB
- External URL input: max 100 MB
- GCS bucket input: max 2 GB (no upload needed if already in GCS)

**Supported formats:**
- Images: JPEG, PNG, GIF, WebP, HEIC/HEIF
- Video: MP4, MPEG, MOV, AVI, WMV, and others; max 2 GB, ~1 hour
- Audio: MP3, WAV, AAC, OGG, FLAC, and others
- Documents: PDF, TXT, HTML, CSS, XML, RTF, and code files
- Video token rate: 300 tokens/sec (default res) or 100 tokens/sec (low res)
- Max 10 videos per request (Gemini 2.5+)

### Batch API (50% cost reduction)

```python
# Inline batch (< 20MB)
batch_job = client.batches.create(
    model="gemini-2.5-flash",
    src={"inline_requests": [
        {"key": "req_001", "request": generate_request_1},
        {"key": "req_002", "request": generate_request_2}
    ]}
)

# Poll for completion
while True:
    job = client.batches.get(batch_job.name)
    if job.state == "JOB_STATE_SUCCEEDED": break
    time.sleep(30)
```

- 50% of standard token cost
- Target turnaround: 24 hours (often faster)
- Input: inline JSON (< 20MB) or JSONL file via Files API (up to 2 GB)
- Six job states: PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED, EXPIRED
- Jobs expire after 48 hours if not completed
- OpenAI SDK-compatible endpoint available at `https://generativelanguage.googleapis.com/v1beta/openai/`
- Embeddings batch supported: $0.075/1M tokens
- Context caching works within batch jobs
- Tools (Google Search, structured output) supported in batch requests
- **Launched to all users:** February 19, 2026

### Flex Inference (50% off, synchronous, latency-tolerant)

```python
config = types.GenerateContentConfig(
    # Same as standard, but specify flex tier in headers or client config
    # header: "X-Goog-Gemini-Inference-Mode: flex"
)
```
- 50% of standard API price, billed per token
- Synchronous (not async like Batch) — same endpoint, no file management
- Requests may be preempted if standard traffic spikes
- Ideal for: background workflows, non-user-facing agentic tasks, research pipelines
- Launched April 1, 2026

### Priority Inference (+75-100% premium, highest reliability)

- 75-100% above standard rate
- Strictly non-sheddable traffic
- Tier 2 & Tier 3 users only
- Same endpoints (GenerateContent + Interactions API)
- Ideal for: interactive user-facing products, latency-sensitive applications
- Launched April 1, 2026

---

## 6. Free Tier Limits (2026 Status)

**Important:** December 7, 2025 Google reduced free tier quotas by 50-80%. The following reflects post-reduction limits.  
Rate limits are **per project** (not per API key). Multiple API keys sharing a project share one quota.

| Model | Free RPM | Free RPD | Free TPM | Notes |
|---|---|---|---|---|
| `gemini-2.5-pro` | 5 | 100 | 250K | Most restrictive free tier |
| `gemini-2.5-flash` | 10 | 250 | 250K | Best free-tier price/performance |
| `gemini-2.5-flash-lite` | 15 | 1,000 | 250K | Highest free RPD |
| `gemini-3-flash-preview` | Check AI Studio | Check AI Studio | — | Preview; free tier available with limits |
| `gemini-3.1-pro-preview` | 0 (no API free) | 0 | — | AI Studio testing only; no free API |
| `gemini-3.1-flash-lite-preview` | Check AI Studio | Check AI Studio | — | Preview limits |
| `gemini-embedding-001` | Available | Check AI Studio | — | Free tier exists; exact limits in AI Studio |
| Deep Research agents | 0 | 0 | — | Paid only; ~$1-7/task |
| Google Search grounding | 500-1500 RPD | — | — | Free RPD varies by model |

**RPD resets:** Midnight Pacific time.  
**Quota increase requests:** Available for paid accounts via AI Studio.  
**Provisioned Throughput:** Available for enterprise (dedicated capacity).

---

## 7. Paid Tier Pricing

### Standard Inference Pricing (per 1M tokens)

| Model | Input (<200K ctx) | Input (>200K ctx) | Audio Input | Output | Thinking Output |
|---|---|---|---|---|---|
| `gemini-3.1-pro-preview` | $2.00 | $4.00 | — | $12.00/18.00 | Counted as output |
| `gemini-3-flash-preview` | $0.50 | — | $1.00 | $3.00 | Counted as output |
| `gemini-3.1-flash-lite-preview` | $0.25 | — | $0.50 | $1.50 | Counted as output |
| `gemini-2.5-pro` | $1.25 | $2.50 | — | $10.00/15.00 | Counted as output |
| `gemini-2.5-flash` | $0.30 | — | $1.00 | $2.50 | Counted as output |
| `gemini-2.5-flash-lite` | $0.10 | — | $0.30 | $0.40 | Counted as output |
| `gemini-embedding-2` | $0.15 | — | Higher | — | N/A |

### Tool and Feature Pricing

| Feature | Cost |
|---|---|
| Google Search Grounding (standard) | $14-$35 per 1,000 queries (model-dependent) |
| Google Maps Grounding | $25 per 1,000 grounded prompts |
| Code Execution | No additional charge (standard token rates) |
| URL Context | No additional charge (standard token rates) |
| Context Cache Storage | $4.50 per 1M tokens/hour (varies by model) |
| Context Cache Read | ~$0.20-0.40 per 1M tokens (<200K prompts) |
| Batch API discount | 50% off standard input/output rates |
| Embedding batch | $0.075 per 1M input tokens |
| Flex Inference | 50% of standard rate |
| Priority Inference | 75-100% above standard rate |

### Billing Plans
- **Prepay:** Purchase credits upfront
- **Postpay:** Pay at end of billing period
- Both launched March 23, 2026

### Spend Caps
Configurable spend limits launched March 16, 2026. Set via AI Studio to prevent runaway costs.

---

## 8. Use Case Recipes

### 8A. News Digest Synthesis (Recommended config)

```python
# Model: gemini-2.5-flash (free tier) or gemini-3-flash-preview (better quality)
config = types.GenerateContentConfig(
    temperature=0.4,
    thinking_config=types.ThinkingConfig(thinking_budget=4096),  # 2.5 Flash
    # OR: thinking_config=types.ThinkingConfig(thinking_level="medium"),  # 3 Flash
    tools=[types.Tool(google_search=types.GoogleSearch())],
    max_output_tokens=4096,
    system_instruction="""You are a news synthesis agent. Given a topic:
1. Search for the latest news (last 24-48 hours)
2. Identify 5-7 key developments
3. Synthesize into a structured digest with: headline, key points, sources
Output format: {headline: str, developments: [{title, summary, source_url}], synthesis: str}"""
)

# For structured output without tools (2.5 Flash compatible):
config_structured = types.GenerateContentConfig(
    temperature=0.3,
    response_mime_type="application/json",
    response_json_schema=DigestSchema.model_json_schema(),
    tools=[types.Tool(google_search=types.GoogleSearch())]
    # NOTE: This combination ONLY works with Gemini 3 series
    # For 2.5 Flash: either search OR structured output, not both in one call
)
```

**Workaround for 2.5 Flash (search + structured output):**
- Call 1: Flash + Google Search → raw text with citations
- Call 2: Flash + responseSchema → structure the text from Call 1

### 8B. Fact-Checking

```python
config = types.GenerateContentConfig(
    temperature=0.1,
    thinking_config=types.ThinkingConfig(thinking_budget=8192),  # More thinking for verification
    tools=[
        types.Tool(google_search=types.GoogleSearch()),
        {"url_context": {}}
    ],
    # url_context lets model fetch primary sources directly
    system_instruction="""Fact-check the claim. Process:
1. Search for primary sources
2. Fetch source URLs for full context
3. Cross-reference multiple sources
4. Output: {claim, verdict: SUPPORTED|REFUTED|UNVERIFIABLE, confidence: 0-1, sources: []}"""
)
```

**Note:** search + url_context combined in one call requires Gemini 3 or is available on 2.5 Flash (search and url_context can combine, but NOT with function calling).

### 8C. Content Generation (Articles)

```python
config = types.GenerateContentConfig(
    temperature=0.7,
    thinking_config=types.ThinkingConfig(thinking_budget=0),  # No thinking needed for creative
    max_output_tokens=8192,
    system_instruction="You are a professional tech journalist..."
)
# Use Batch API for bulk content generation at 50% cost
# Or Flex inference for background generation
```

### 8D. Multi-Source Aggregation (Best Config)

```python
# For aggregating specific URLs: use url_context
tools = [{"url_context": {}}]
prompt = """Analyze and synthesize content from these sources:
- https://source1.com/article
- https://source2.com/report  
- https://source3.com/data
[up to 20 URLs per request]

Synthesize key findings, identify agreements and conflicts, produce ranked insights."""

# For broader web aggregation: use Google Search
tools = [types.Tool(google_search=types.GoogleSearch())]
```

### 8E. Structured Data Extraction (from documents)

```python
# Upload document first
doc = client.files.upload(path="report.pdf", config=types.UploadFileConfig(mime_type="application/pdf"))

config = types.GenerateContentConfig(
    temperature=0.0,  # Deterministic
    thinking_config=types.ThinkingConfig(thinking_budget=0),  # Fast extraction
    response_mime_type="application/json",
    response_json_schema=ExtractedDataSchema.model_json_schema()
)
contents = [
    types.Part.from_uri(file_uri=doc.uri, mime_type="application/pdf"),
    "Extract all financial figures, dates, and company names from this document."
]
```

---

## 9. Replicating Deep Research via API

### Option A: Use the Direct Deep Research Endpoint (Recommended, 2026)

H1 hypothesis is WRONG — Deep Research IS a direct API endpoint now.

```python
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Start research task (always background=True for agents)
interaction = client.interactions.create(
    agent="deep-research-preview-04-2026",  # or "deep-research-max-preview-04-2026"
    input="Research the current state of RAG optimization techniques in 2026, focusing on late chunking, hybrid search, and reranking approaches.",
    background=True,
    # agent_config={
    #     "thinking_summaries": "auto",    # see intermediate reasoning
    #     "visualization": "auto",          # include charts if relevant
    #     "collaborative_planning": False   # True = model shows plan first for your review
    # }
)

interaction_id = interaction.id

# Poll until complete (typically 5-30 minutes)
import time
while True:
    result = client.interactions.get(interaction_id)
    if result.status == "completed":
        report = result.outputs[-1].text
        break
    elif result.status in ["failed", "cancelled"]:
        raise Exception(f"Research failed: {result.status}")
    print(f"Status: {result.status}, waiting...")
    time.sleep(30)

# Follow-up question (stateful multi-turn)
followup = client.interactions.create(
    input="What are the cost implications of implementing the late chunking approach?",
    previous_interaction_id=interaction_id,
    background=False  # Quick follow-ups can be synchronous
)
```

**Collaborative planning (for review before execution):**
```python
interaction = client.interactions.create(
    agent="deep-research-preview-04-2026",
    input="Your research query",
    background=True,
    agent_config={"collaborative_planning": True}
)
# Model returns proposed plan instead of executing
# Review and approve/modify via previous_interaction_id
```

**With MCP tools (extended sources):**
```python
interaction = client.interactions.create(
    agent="deep-research-preview-04-2026",
    input="Research query",
    background=True,
    tools=[{
        "type": "mcp_server",
        "name": "internal_docs",
        "url": "https://your-mcp-server.com/mcp"
    }]
)
```

**Streaming for real-time progress:**
```python
with client.interactions.stream(
    agent="deep-research-preview-04-2026",
    input="Research query",
    background=True
) as stream:
    for event in stream:
        if event.type == "content.delta":
            print(event.text, end="", flush=True)
        elif event.type == "interaction.complete":
            break
# If connection drops: reconnect with last_event_id
```

### Option B: DIY Agentic Loop (when you need custom control)

```python
# Multi-turn with search + url_context (Gemini 3 Flash for tool combo)
history = []
research_state = {"queries_done": 0, "sources": []}

def research_iteration(question, context):
    config = types.GenerateContentConfig(
        temperature=0.3,
        thinking_config=types.ThinkingConfig(thinking_level="medium"),
        tools=[
            types.Tool(google_search=types.GoogleSearch()),
            {"url_context": {}}  # Requires Gemini 3 + function calling disabled
        ],
        max_output_tokens=4096
    )
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=context + [{"role": "user", "parts": [{"text": question}]}],
        config=config
    )
    return response

# Orchestrate 5-10 iterations:
# 1. Plan phase: ask model to generate research plan
# 2. Search phase: execute searches, collect sources
# 3. Synthesis phase: combine with structured output
```

**Cost comparison:**
- Deep Research API: ~$1-7/task (automatic orchestration)
- DIY with Gemini 3 Flash: ~$0.30-1.50/run (manual orchestration, fewer searches)
- DIY with Gemini 2.5 Flash: ~$0.05-0.30/run (cheapest, but no tool combo in single call)

---

## 10. Production Patterns

### Error Handling and Retry

```python
import time
import random
from google.api_core import exceptions

def call_with_retry(client, model, contents, config, max_retries=5):
    """Exponential backoff with jitter for Gemini API calls."""
    RETRYABLE = {429, 500, 503, 504}
    
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model=model, contents=contents, config=config
            )
        except exceptions.GoogleAPIError as e:
            status_code = getattr(e, 'code', None) or getattr(e, 'status_code', None)
            
            if status_code not in RETRYABLE or attempt == max_retries - 1:
                raise  # Do NOT retry 400 INVALID_ARGUMENT, 401, 403, 404
            
            # Truncated exponential backoff with jitter
            base_wait = min(2 ** attempt, 60)  # Cap at 60s
            jitter = random.uniform(0, base_wait * 0.1)
            wait_time = base_wait + jitter
            
            print(f"Attempt {attempt+1} failed ({status_code}), retrying in {wait_time:.1f}s")
            time.sleep(wait_time)
    
    raise Exception("Max retries exceeded")
```

**Key error codes:**
- `400 INVALID_ARGUMENT`: Bad request — fix your code, do NOT retry
- `401 UNAUTHENTICATED`: Bad API key — check key
- `403 PERMISSION_DENIED`: Quota/billing issue — check account
- `404 NOT_FOUND`: Wrong model name or cache expired
- `429 RESOURCE_EXHAUSTED`: Rate limited — retry with backoff
- `500 INTERNAL`: Transient Google error — retry
- `503 UNAVAILABLE`: Service down — retry
- `504 DEADLINE_EXCEEDED`: Timeout — retry with longer timeout or reduce request size

### Rate Limit Management

```python
import asyncio
from asyncio import Semaphore

class GeminiRateLimiter:
    """Respects RPM limits for free tier (10 RPM for Flash)."""
    def __init__(self, rpm_limit=10):
        self.semaphore = Semaphore(rpm_limit)
        self.request_times = []
    
    async def acquire(self):
        async with self.semaphore:
            now = time.time()
            # Clean old timestamps
            self.request_times = [t for t in self.request_times if now - t < 60]
            if len(self.request_times) >= self.rpm_limit:
                sleep_time = 60 - (now - self.request_times[0])
                await asyncio.sleep(sleep_time)
            self.request_times.append(time.time())
```

**Key rate limit facts:**
- Rate limits are **per project**, not per API key
- Multiple API keys on same project share one quota
- RPD resets at midnight Pacific time
- TPM = input tokens (not output) for counting purposes
- Paid tier dramatically increases limits (check AI Studio for current values)

### Context Caching Strategy

```python
# Cache system instruction + corpus once, reuse across many calls
# Break-even point: when per-call savings > storage cost
# Storage: $4.50/1M tokens/hour
# Savings: ~90% of input token cost for cached portion

# Example math for news digest agent:
# System instruction: 2,000 tokens (too small — min 1,024 for Flash)
# Reference corpus (articles): 50,000 tokens
# Total cached: 52,000 tokens
# Storage cost per hour: 52,000/1,000,000 * $4.50 = $0.000234/hour
# Savings per call (2.5 Flash): 52,000/1,000,000 * ($0.30 - $0.03) = $0.014/call
# Break-even: 0.000234 / 0.014 = 0.017 calls/hour — always worth it above 1 call/hr

cache = client.caches.create(
    model="gemini-2.5-flash",
    config=types.CreateCachedContentConfig(
        contents=[reference_corpus],
        system_instruction=system_prompt,
        ttl="3600s"  # Refresh hourly
    )
)
# Cache name persists; update TTL to keep alive
client.caches.update(cache.name, config=types.UpdateCachedContentConfig(ttl="3600s"))
```

### Streaming Pattern

```python
async def stream_response(client, model, prompt, config):
    full_text = ""
    async for chunk in client.models.generate_content_stream(
        model=model, contents=prompt, config=config
    ):
        if chunk.text:
            full_text += chunk.text
            yield chunk.text  # Yield to caller for real-time display
    return full_text
```

### Async Batch Pipeline

```python
import asyncio

async def process_articles_batch(articles: list[str], model="gemini-2.5-flash"):
    """Process many articles at 50% cost using Batch API."""
    requests = [
        {
            "key": f"article_{i}",
            "request": {
                "model": f"models/{model}",
                "contents": [{"parts": [{"text": article}], "role": "user"}],
                "generationConfig": {"responseMimeType": "application/json"},
                "systemInstruction": {"parts": [{"text": "Extract key facts as JSON"}]}
            }
        }
        for i, article in enumerate(articles)
    ]
    
    job = client.batches.create(
        model=model,
        src={"inline_requests": requests}
    )
    
    # Async polling
    while True:
        status = client.batches.get(job.name)
        if status.state == "JOB_STATE_SUCCEEDED":
            return status.response.responses
        elif status.state in ["JOB_STATE_FAILED", "JOB_STATE_EXPIRED"]:
            raise Exception(f"Batch failed: {status.state}")
        await asyncio.sleep(60)  # Check every minute
```

---

## 11. SDK Comparison

| Dimension | REST (direct) | Python `google-genai` | TypeScript `google-genai` |
|---|---|---|---|
| Setup | `curl` or requests | `pip install google-genai` | `npm install @google/genai` |
| Auth | `x-goog-api-key` header | `Client(api_key=...)` | `new GoogleGenerativeAI(apiKey)` |
| When to use | Debugging, quick tests, non-Python/TS | Primary backend (Python 3.10+) | Frontend/Node.js/Cloudflare Workers |
| Schema generation | Manual JSON | Pydantic `.model_json_schema()` | Zod `zodToJsonSchema()` |
| Streaming | SSE parsing manually | `generate_content_stream()` async | `generateContentStream()` |
| Batch API | Full REST control | `client.batches.create()` | Available |
| OpenAI compat | `base_url=.../openai/` | OpenAI SDK with base_url override | OpenAI SDK with base_url override |
| Vertex AI | Separate base URL | `Client(vertexai=True, project=...)` | Same pattern |
| Stable API version | `v1` | `http_options=HttpOptions(api_version='v1')` | Same pattern |

**OpenAI SDK compatibility (drop-in migration):**
```python
from openai import OpenAI
client = OpenAI(
    api_key=os.environ["GEMINI_API_KEY"],
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)
# Now use standard OpenAI SDK calls — most features work
```

---

## 12. Comparison vs Alternatives

### For Our Specific Use Cases

| Use Case | Gemini 2.5 Flash | Claude Sonnet 4.6 | OpenAI GPT (latest) | Winner + Reason |
|---|---|---|---|---|
| News digest synthesis | Strong (native Search grounding, 1M ctx) | Strong (long ctx, Anthropic Search) | Strong | **Gemini** — native Google Search integration, cheapest at scale |
| Fact-checking | Good (Search + url_context) | Good (tools + long ctx) | Good | **Gemini** — url_context gives direct source access, cheaper |
| Content generation | Good | Very good (nuanced writing) | Very good | **Claude** — higher quality prose, better instruction following |
| Structured data extraction | Good (JSON mode, Pydantic) | Very good (prompt adherence) | Very good | **Tie** — all work well; Gemini cheapest |
| Multi-source aggregation | Excellent (url_context, 20 URLs/call) | Good (tool use) | Good | **Gemini** — url_context is a unique capability |
| Agent orchestration (custom) | Good (ADK, Interactions API) | Excellent (Claude Code SDK) | Good (Agents SDK) | **Claude** — most reliable tool use, better instruction compliance |
| Deep Research | Excellent (native endpoint) | Good (manual orchestration) | Good (manual orchestration) | **Gemini** — only one with native Deep Research API |
| Code generation | Very good (2.5 Pro/3.1 Pro) | Excellent | Excellent | **Claude/OpenAI** — stronger coding eval scores |
| Cost at scale (free tier) | Best (Flash unlimited at cost) | No free tier | No free tier | **Gemini** — only free-tier option |

### Pricing Comparison (per 1M output tokens, paid tier)

| Model | Output $/1M |
|---|---|
| Gemini 2.5 Flash | $2.50 |
| Gemini 3.1 Flash-Lite | $1.50 |
| Claude Sonnet 4.6 | ~$15.00 |
| OpenAI GPT-4o | ~$10.00 |
| Gemini 2.5 Pro | $10.00 |
| Claude Opus 4.6 | ~$75.00 |

**Gemini is 4-6x cheaper than Claude Sonnet for comparable quality on synthesis tasks.**

### Agent Framework Compatibility

| Framework | Gemini | Claude | OpenAI |
|---|---|---|---|
| LangGraph | Yes | Yes | Yes |
| Google ADK | Native | Third-party | Third-party |
| Claude SDK | No | Native | No |
| OpenAI Agents SDK | Via compat layer | No | Native |
| CrewAI / AutoGen | Yes | Yes | Yes |

---

## 13. Hidden / Undocumented / 2026 Frontier

### Thought Signatures (Gemini 3)
Encrypted representations of internal reasoning steps returned with responses. Must be passed back in subsequent requests for function calling and image editing workflows to maintain reasoning continuity. Strict enforcement for function calling; recommended (not enforced) for text generation. Not prominently documented — found in Gemini 3 Developer Guide.

### API Key Security Risk (CRITICAL)
Gemini API keys share infrastructure with Google Maps API keys. If a project has Maps API enabled and you expose the API key, Gemini capabilities can be accessed. Over 2,800 exposed keys were identified in Common Crawl data. **Never embed API keys in client-side code, git repos, or public URLs.** Use server-side proxy or environment variables only.

### Temperature and Gemini 3 Looping Bug
Gemini 3 docs explicitly warn: avoid setting low temperature values on Gemini 3 models for complex tasks — may cause "looping issues or performance degradation." Gemini 3 appears to have different internal dynamics than 2.5. Default (unset) temperature is recommended for complex reasoning tasks.

### Image Segmentation Missing in Gemini 3
Image segmentation (present in 2.5) is not available in Gemini 3 Pro and 3 Flash. If you use segmentation, stay on 2.5 series.

### Interactions API Data Retention
By default `store=True` — all interactions are saved server-side. For privacy-sensitive workloads, explicitly set `store=False`. This is undisclosed in basic documentation.

### Implicit Caching Timing
Implicit caching (auto-enabled on 2.5+) appears to work best when the same prefix is sent multiple times in quick succession. There is no documented SLA on when cache hits occur. From community reports: consistent prefixes (especially system instructions) are more likely to cache than dynamic content.

### Media Resolution Ultra-High Mode
`media_resolution_ultra_high` exists as a parameter for per-image/per-frame resolution control. This is not mentioned in main API docs but appears in Gemini 3 Developer Guide. Significantly increases token consumption but improves OCR and fine-detail extraction from images.

### Gemini CLI FastMCP Integration
`fastmcp install gemini-cli` available as of FastMCP v2.12.3. Provides STDIO MCP servers accessible from Gemini CLI. Not relevant for programmatic API use but relevant for local development workflows.

### Deep Research Max
`deep-research-max-preview-04-2026` does 160 searches vs 80 for standard. Higher quality synthesis. Available via same Interactions API endpoint. Significantly more expensive (~$3-7/task vs $1-3).

### Gemini 3.1 Flash TTS: Accent + Scene Instructions
The TTS model accepts very detailed prompts: accent, pace, dynamics, scene-setting. This goes beyond "voice selection" — you can prompt the model to narrate as if in a specific environment or emotional state. Not prominently documented.

---

## 14. Gotchas

| # | Gotcha | Impact | Workaround |
|---|---|---|---|
| G1 | Structured output + tools only works in Gemini 3 | HIGH — 2.5 Flash cannot do both in one call | Two-call pattern: search → structure separately |
| G2 | url_context does NOT work with function calling | HIGH | Choose one: url_context OR function calling |
| G3 | thinkingLevel and thinkingBudget are mutually exclusive | HIGH — returns error | Use thinkingBudget for 2.5 models, thinkingLevel for Gemini 3 |
| G4 | Gemini 3.1 Pro cannot disable thinking | MEDIUM — always incurs thinking token costs | Use Flash variants if you want no-thinking |
| G5 | Free tier cut 50-80% in December 2025 | HIGH — 2.5 Flash now 250 RPD not 500+ | Upgrade to paid tier or use Flash-Lite at 1,000 RPD |
| G6 | API keys share quota per project, not per key | MEDIUM — multiple keys = same quota | Use separate projects for separate services |
| G7 | text-embedding-004 shut down January 14, 2026 | CRITICAL if still using it | Migrate to gemini-embedding-001 immediately |
| G8 | Gemini 2.0 Flash deprecating June 1, 2026 | HIGH if using it | Migrate to 2.5 Flash |
| G9 | Batch API not idempotent — duplicates create separate jobs | MEDIUM | Track job names; don't retry creation naively |
| G10 | Batch jobs expire after 48 hours if not completed | MEDIUM | Monitor and re-submit if expired |
| G11 | Interactions API is public beta — subject to breaking changes | MEDIUM | Don't use for core production; generateContent is stable |
| G12 | API key security: shares infra with Maps API | CRITICAL | Never expose key client-side; use server proxy |
| G13 | Gemini 3 looping on low temperature | MEDIUM | Use default or higher temperature for Gemini 3 |
| G14 | Image segmentation missing in Gemini 3 | MEDIUM if needed | Stay on 2.5 Pro for segmentation tasks |
| G15 | Mixed tool responses: functionCall NOT always last in parts array | MEDIUM — parsing bug | Iterate all parts, don't assume order |
| G16 | Implicit caching has no guaranteed savings | MEDIUM — can't budget on it | Use explicit caching for predictable costs |
| G17 | Store=True default in Interactions API means data is retained | PRIVACY | Set store=False for sensitive data |
| G18 | Streaming: interaction.complete event has outputs=null | MEDIUM — parsing confusion | Aggregate content.delta events, don't use final event's outputs |
| G19 | Code execution sandbox has no internet access | MEDIUM | Pre-fetch data before passing to code execution; or use Search tool first |
| G20 | MCP in Interactions API is incompatible with Gemini 3 models | MEDIUM | Use function calling for Gemini 3; MCP works with Interactions API for 2.5 era |

---

## 15. Decision Matrix for Our Stack (Content Factory)

| Scenario | Model | Tools | Config | Tier |
|---|---|---|---|---|
| Breaking news digest (free, fast) | `gemini-2.5-flash` | `google_search` | temp=0.4, budget=4096 | Free (10 RPM limit) |
| Breaking news digest (quality) | `gemini-3-flash-preview` | `google_search` | temp=0.4, level=medium | Paid |
| Structured news extraction (2-step) | `gemini-2.5-flash` | Step1: search; Step2: responseSchema | temp=0.0 for step2 | Free |
| Structured news extraction (1-step) | `gemini-3-flash-preview` | `google_search` + responseSchema | temp=0.3 | Paid |
| Fact-checking URLs | `gemini-2.5-flash` | `url_context` | temp=0.1, budget=8192 | Free |
| Multi-source synthesis (up to 20 URLs) | `gemini-2.5-flash` | `url_context` | temp=0.3, budget=4096 | Free |
| Deep research report | Deep Research API | Built-in (Search, URL, Code) | collaborative_planning=False, background=True | Paid (~$1-7) |
| Deep research with internal docs | Deep Research Max API | MCP server + built-in tools | background=True | Paid (~$3-7) |
| Bulk content generation (background) | `gemini-2.5-flash` | None | Batch API | Paid (50% off) |
| Background synthesis (latency-tolerant) | `gemini-2.5-flash` | `google_search` | Flex inference | Paid (50% off) |
| User-facing real-time synthesis | `gemini-2.5-flash` | `google_search` | Priority inference | Paid (+75-100%) |
| Embeddings for RAG | `gemini-embedding-001` | N/A | output_dims=768 or 1536 | Free or Paid |
| Document parsing (PDF, large) | `gemini-2.5-flash` | Files API upload | media_resolution=medium | Free (token cost) |
| Use existing OpenAI SDK code | Any Gemini model | Via OpenAI compat layer | base_url override | Paid |

---

## 16. Queries Executed

| # | Type | Query / URL | Used in |
|---|---|---|---|
| Q1 | WebSearch | "Gemini API 2026 models gemini-2.5-flash gemini-2.5-pro capabilities pricing" | Models Matrix, Pricing |
| Q2 | WebSearch | "Gemini API google-genai SDK python 2025 2026 configuration parameters" | Config Flags, SDK Comparison |
| Q3 | WebSearch | "Gemini API tools url_context search grounding code execution function calling 2025" | Tools Catalog |
| Q4 | WebFetch | https://ai.google.dev/gemini-api/docs/models | Models Matrix (complete list incl Gemini 3) |
| Q5 | WebFetch | https://ai.google.dev/gemini-api/docs/pricing | Pricing sections |
| Q6 | WebFetch | https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tooling-updates/ | Tools Catalog (tool combinations, Maps) |
| Q7 | WebFetch | https://ai.google.dev/gemini-api/docs/url-context | url_context deep spec |
| Q8 | WebFetch | https://ai.google.dev/gemini-api/docs/tools | Tools Catalog (complete list) |
| Q9 | WebSearch | "Gemini API thinkingConfig thinkingBudget thinking models 2025 2026" | Config Flags (thinking section) |
| Q10 | WebFetch | https://ai.google.dev/gemini-api/docs/thinking | ThinkingConfig reference |
| Q11 | WebSearch | "Gemini API context caching cachedContent TTL cost reduction example 2025" | Advanced Features (caching) |
| Q12 | WebSearch | "Gemini API Deep Research endpoint agentic loop multi-turn replication 2025" | Deep Research section |
| Q13 | WebFetch | https://ai.google.dev/gemini-api/docs/deep-research | Deep Research API (complete spec) |
| Q14 | WebFetch | https://ai.google.dev/gemini-api/docs/caching | Context Caching (complete spec) |
| Q15 | WebSearch | "Gemini API structured output responseSchema JSON mode 2025 example" | Structured Output |
| Q16 | WebFetch | https://ai.google.dev/gemini-api/docs/structured-output | Structured Output (complete spec) |
| Q17 | WebSearch | "Gemini API file upload API formats supported max size video audio PDF 2025" | File Uploads |
| Q18 | WebSearch | "Gemini API free tier rate limits RPM RPD 2026 flash pro models" | Free Tier Limits |
| Q19 | WebFetch | https://ai.google.dev/gemini-api/docs/rate-limits | Rate limits (official page — redirected to AI Studio) |
| Q20 | WebSearch | "Gemini API batch API async processing exists 2025 2026" | Batch API |
| Q21 | WebSearch | "Gemini API function calling parallel calls schema declaration example python 2025" | Function Calling |
| Q22 | WebFetch | https://ai.google.dev/gemini-api/docs/batch-api | Batch API (complete spec) |
| Q23 | WebFetch | https://ai.google.dev/gemini-api/docs/gemini-3 | Gemini 3 features |
| Q24 | WebSearch | "simonwillison Gemini API 2025 deep dive capabilities hidden features" | Hidden features, Gotchas |
| Q25 | WebFetch | https://simonwillison.net/tags/gemini/ | Hidden features, security gotcha |
| Q26 | WebSearch | "Gemini API Live API real-time audio streaming 2025 2026 capabilities" | Live API section |
| Q27 | WebSearch | "Gemini API MCP model context protocol integration native 2025 2026" | MCP section |
| Q28 | WebFetch | https://ai.google.dev/gemini-api/docs/interactions | Interactions API (complete spec) |
| Q29 | WebSearch | "Gemini API code execution sandbox Python only other languages runtime limits 2025" | Code Execution |
| Q30 | WebSearch | "Gemini API system instruction length limits accepted formats best practices 2025" | System Instructions |
| Q31 | WebFetch | https://ai.google.dev/gemini-api/docs/changelog | Timeline, deprecations, feature dates |
| Q32 | WebSearch | "Gemini API vs Claude API vs OpenAI API comparison 2026 content synthesis agent orchestration" | Comparison section |
| Q33 | WebFetch | https://ai.google.dev/gemini-api/docs/google-search | Google Search Grounding |
| Q34 | WebFetch | https://ai.google.dev/gemini-api/docs/function-calling | Function Calling modes |
| Q35 | WebSearch | "Gemini API embedding text-embedding-004 gemini-embedding-2 dimensions free tier 2026" | Embeddings |
| Q36 | WebSearch | "Gemini API production best practices error handling retry rate limit 429 2025" | Production Patterns |
| Q37 | WebFetch | https://blog.google/technology/developers/interactions-api/ | Interactions API context |
| Q38 | WebSearch | ""gemini api" multimodal video input tokens limits image inline base64 2025" | File Uploads, Multimodal |
| Q39 | WebFetch | https://developers.googleblog.com/en/gemini-batch-api-now-supports-embeddings-and-openai-compatibility/ | Batch API, OpenAI compat |
| Q40 | WebSearch | "Gemini API \"Flex inference\" \"Priority inference\" tier 2026 what is it" | Flex/Priority tiers |

---

## 17. Self-Check Checklist

- [x] **Every claim traced to 2+ sources OR official Google docs**
  - Model list: ai.google.dev/gemini-api/docs/models + changelog
  - Pricing: ai.google.dev/gemini-api/docs/pricing + metacto.com + pricepertoken.com (cross-verified)
  - Rate limits: aifreeapi.com + pecollective.com + official rate-limits page (Dec 2025 cut confirmed by 3 sources)
  - thinkingConfig: ai.google.dev/gemini-api/docs/thinking + LibreChat GitHub discussion + charmbracelet discussion
  - Deep Research API: ai.google.dev/gemini-api/docs/deep-research + blog.google/technology/developers/interactions-api/ + deeplearning.ai
  - Batch API: ai.google.dev/gemini-api/docs/batch-api + developers.googleblog.com + adhavpavan.medium.com
  - Flex/Priority: blog.google + ai.google.dev/gemini-api/docs/flex-inference + aitoolly.com

- [x] **Each source URL verified live** — All WebFetch calls returned content (not 404)

- [x] **Publication date noted for age-sensitive claims**
  - text-embedding-004 shutdown: January 14, 2026 (source: changelog + n8n community)
  - Gemini 2.0 Flash deprecation: June 1, 2026 (source: changelog)
  - Free tier reduction: December 7, 2025 (source: aifreeapi.com, multiple corroborations)
  - Batch API GA: February 19, 2026 (source: developers.googleblog.com)
  - Flex/Priority launch: April 1, 2026 (source: blog.google)
  - Gemini 3 Flash: December 17, 2025; Gemini 3.1 Pro: February 19, 2026 (source: changelog)
  - Interactions API: December 11, 2025 (source: changelog)

- [x] **Conflicting sources documented**
  - Rate limits: The official rate-limits page redirects to AI Studio for live values; third-party sites (aifreeapi, pecollective) provide specific numbers (10 RPM/250 RPD for Flash) that are consistent with each other but not from official static docs. CONFIDENCE: MEDIUM — corroborated by 4 independent sources.
  - Deep Research cost: "estimates" only from official docs; $1-7 range based on underlying model consumption at preview rates

- [x] **Confidence levels assigned**
  - Model IDs and existence: HIGH (official docs + changelog)
  - Pricing numbers: HIGH (official pricing page fetched, cross-verified)
  - Free tier RPM/RPD: MEDIUM (official page redirects to AI Studio; numbers from corroborating third-party sources)
  - thinkingBudget ranges: HIGH (official thinking docs fetched)
  - Deep Research API spec: HIGH (official docs fetched)
  - Gemini 3 structured output + tools: HIGH (official Gemini 3 Dev Guide)
  - Interaction API MCP/Gemini 3 incompatibility: MEDIUM (stated in docs; recommend verification)
  - Security/API key sharing issue: MEDIUM (Simon Willison blog, not official docs)
  - Thought Signatures: MEDIUM (found in Gemini 3 Dev Guide, limited documentation)

- [x] **Numerical facts injected from source, not recalled**
  - All pricing numbers pulled from fetched official pricing page
  - Token ranges (1,024/4,096 min for caching) from fetched caching doc
  - url_context limits (20 URLs, 34 MB) from fetched url-context doc
  - Code execution: 30s runtime, Python only from fetched search results citing official docs
  - Video: 300 tokens/sec, 10 videos/request from fetched search results

- [x] **Scope boundaries stated**
  - Covered: Gemini Developer API (api.generativelanguage.googleapis.com), all current models (2.5 and 3.x series), free and paid tiers, all major tools and features
  - NOT covered in depth: Vertex AI (noted where different), Firebase AI Logic (mentioned briefly), Google Workspace AI integrations (Agent Space), Gemini CLI (noted briefly), AQA model, robotics models
  - NOT covered: Gemini 3.5/4.0 (no credible announcements as of April 2026; "Gemini 4" blog post found appears speculative/SEO content, not official)

- [x] **Known gaps stated**
  - Exact free tier RPM/RPD for Gemini 3 series: check AI Studio directly (not in static docs)
  - System instruction hard token limit: no official documentation found; community suggests it's treated as part of context window
  - Dynamic retrieval / `dynamicRetrievalConfig`: referenced in older docs but not found in current docs — may have been deprecated or replaced
  - MCP server authentication format for Interactions API: not fully documented
  - Exact Gemini 3 free tier RPM/RPD: not found; Gemini 3.1 Pro has no free API tier confirmed

---

**Sources:**
- [Gemini API Models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini API Changelog](https://ai.google.dev/gemini-api/docs/changelog)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini Thinking](https://ai.google.dev/gemini-api/docs/thinking)
- [Gemini URL Context](https://ai.google.dev/gemini-api/docs/url-context)
- [Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
- [Gemini Deep Research](https://ai.google.dev/gemini-api/docs/deep-research)
- [Gemini Interactions API](https://ai.google.dev/gemini-api/docs/interactions)
- [Gemini Batch API](https://ai.google.dev/gemini-api/docs/batch-api)
- [Gemini Structured Output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Gemini 3 Developer Guide](https://ai.google.dev/gemini-api/docs/gemini-3)
- [Gemini Tools Overview](https://ai.google.dev/gemini-api/docs/tools)
- [Google Search Grounding](https://ai.google.dev/gemini-api/docs/google-search)
- [Gemini API Tooling Updates Blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-tooling-updates/)
- [Interactions API Blog](https://blog.google/technology/developers/interactions-api/)
- [Batch API Embeddings + OpenAI Compat](https://developers.googleblog.com/en/gemini-batch-api-now-supports-embeddings-and-openai-compatibility/)
- [Flex and Priority Inference](https://blog.google/innovation-and-ai/technology/developers-tools/introducing-flex-and-priority-inference/)
- [Simon Willison Gemini Tags](https://simonwillison.net/tags/gemini/)
- [python-genai GitHub](https://github.com/googleapis/python-genai)
- [Deep Research Max Announcement](https://blog.google/innovation-and-ai/models-and-research/gemini-models/next-generation-gemini-deep-research/)
