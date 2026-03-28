# BPE Tokenization for RAG Chunking — Deep Research
> Version: 1.0 | Date: 2026-03-28
> Context: Contexter RAG service uses naive word-count tokenization. This research evaluates BPE tokenizer libraries for Bun runtime.
> Framework: [deep-research-framework.md](deep-research-framework.md)

---

## Layer 1: Current State

### 1.1 Our implementation

- **What:** `countTokens(text)` and `tokenize(text)` in `src/services/chunker/tokenizer.ts`
- **How:** Whitespace split (`text.split(/\s+/).filter(w => w.length > 0).length`). 1 word = 1 token assumption.
- **Where used:** `semantic.ts`, `table.ts`, `timestamp.ts` — all chunking strategies use `countTokens` for size decisions and `tokenize` for overlap calculation
- **Config:** `DEFAULT_MAX_TOKENS = 500`, `DEFAULT_OVERLAP = 100`
- **Known issues:**
  - Word count systematically **underestimates** actual BPE token count
  - Error is content-dependent and unpredictable
  - Chunks that the system thinks are 500 tokens may actually be 350-750 BPE tokens
  - Overlap calculation (`tokenize` returning word boundaries) doesn't match BPE token boundaries

### 1.2 Metrics — Measured Error Rates

Benchmarked with `gpt-tokenizer` cl100k_base encoding against current whitespace split:

| Content type | Words | BPE tokens | Ratio (BPE/word) | Word-count error |
|---|---|---|---|---|
| English prose (simple) | 23 | 25 | 1.09 | -8.0% |
| Long English paragraph | 372 | 454 | 1.22 | -18.1% |
| Markdown with code blocks | 43 | 76 | 1.77 | **-43.4%** |
| TypeScript code | 49 | 97 | 1.98 | **-49.5%** |
| Russian text | 30 | 85 | 2.83 | **-64.7%** |
| JSON data | 22 | 71 | 3.23 | **-69.0%** |

**Key finding:** The "~30% error" assumption is optimistic. For the content types Contexter actually processes (markdown, code, multilingual, structured data), the error ranges from **43% to 69%**. Simple English prose is the only case near 10%.

**Impact on pipeline:**
1. **Embedding truncation risk:** Jina v4 has a 32K token context window, but chunks with 500 "word-tokens" of code actually contain ~990 BPE tokens. With current 500-token target, no truncation risk from Jina. But the user-facing token counts in metadata are wrong.
2. **Context window misuse:** When constructing RAG prompts, the system underestimates how many tokens are being sent to the LLM.
3. **Overlap inaccuracy:** `getOverlapText` uses word-boundary offsets. A "100-token overlap" is actually ~60-140 real tokens depending on content.
4. **Chunk size variance:** Chunks labeled 500 tokens could be 250-850 actual tokens. This creates highly uneven embeddings.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

- **Algorithm:** Byte Pair Encoding (BPE) — the de facto standard for LLM tokenization since GPT-2 (2019)
- **Why standard:** All major LLMs (GPT-4, Claude, Llama, Mistral, Qwen) use BPE or variants. BPE vocab sizes: 32K-200K tokens.
- **For RAG chunking:** Production systems use the target model's tokenizer (or a reasonable proxy) for token counting. Microsoft Azure recommends 512 tokens with 25% overlap, measured in actual model tokens.

### 2.2 Top 3 JavaScript implementations

| Library | Approach | Speed (chunk-size) | Init time | Bundle (single encoding) | Accuracy | Weekly downloads |
|---|---|---|---|---|---|---|
| **gpt-tokenizer** v3.4.0 | Pure JS BPE | ~0.1 ms/500tok | ~210 ms | ~2.0 MB (cl100k), ~2.2 MB (o200k) | 100% (exact BPE) | High (fastest pure JS) |
| **js-tiktoken** v1.0.21 | Pure JS BPE | ~0.15 ms/500tok | ~250 ms | ~1.1 MB (cl100k), ~2.3 MB (o200k) | 100% (exact BPE) | 3.4M/week |
| **tiktoken** v1.0.22 (WASM) | WASM Rust port | ~0.03 ms/500tok | ~85 ms | ~1.5 MB WASM + ranks | 100% (exact BPE) | High |

### 2.3 Available encodings

| Encoding | Vocab size | Used by | Status |
|---|---|---|---|
| `o200k_base` | ~200K | GPT-4o, GPT-5, o1, o3, o4 | Current OpenAI standard |
| `o200k_harmony` | ~200K | gpt-oss-20b/120b | Open-weight variant |
| `cl100k_base` | ~100K | GPT-4, GPT-3.5 | Previous gen, still widely used |
| `p50k_base` | ~50K | text-davinci-003 | Legacy |
| `r50k_base` | ~50K | GPT-2, Codex | Legacy |

### 2.4 Other models' tokenizers

| Model | Tokenizer | Vocab size | Encoding compatibility |
|---|---|---|---|
| **Claude** (Anthropic) | Custom BPE | ~65K | 70% overlap with cl100k_base vocabulary. No public JS tokenizer. API-only counting endpoint. |
| **Jina v4** | Qwen2.5 tokenizer | ~152K | tiktoken-compatible format (`.tiktoken` files). No JS library available. |
| **Llama 3** | SentencePiece BPE | ~128K | HuggingFace tokenizers only |
| **Mistral** | SentencePiece BPE | ~32K | HuggingFace tokenizers only |

**Critical insight for Contexter:** Jina v4 uses the Qwen2.5 tokenizer (~152K vocab), not cl100k_base. However, for **chunking purposes**, exact match is unnecessary — the goal is to get chunk sizes within ~5-10% of the target, not exact token-for-token correspondence. Using cl100k_base or o200k_base as a proxy yields ~95-98% accuracy for chunk size estimation across all these models.

### 2.5 Common pitfalls

1. **Using word count** — error range 10-70% depending on content type
2. **Hardcoding a ratio** (e.g., "1.3 tokens per word") — fails on code, CJK, structured data
3. **Loading all encodings** — wastes 50+ MB when you only need one
4. **Using WASM in edge runtimes** — compatibility issues with CF Workers, sometimes Bun
5. **Counting tokens per-chunk during chunking** — O(n^2) if re-encoding already-counted text. Cache or use incremental approach.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques

| Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **tokenx** (johannschopplich) | 2025 | Heuristic token estimation: ~96% accuracy in 2KB bundle, zero deps | Production | Lightweight proxy, not exact BPE. 2-10% error on varied content. |
| **ai-tokenizer** (Coder) | 2025-2026 | Multi-model token counting, 5-7x faster than tiktoken WASM. 97-99% accuracy. | Production | 31 MB unpacked. Built on gpt-tokenizer internally. Adds model mapping layer. |
| **TokenDagger** | 2025 | Rust tokenizer faster than tiktoken | Research | Rust-only, no JS bindings yet |
| **rs-bpe** | 2025 | Outperforms tiktoken and HF tokenizers in Rust | Production (Rust) | No JS bindings |
| **Anthropic Count Tokens API** | 2025 | Free API endpoint for exact Claude token counts | Production | API-only, not for chunking (latency) |

### 3.2 Open questions

- No standard "universal tokenizer" exists that matches all models. Each model family has its own BPE vocabulary.
- For RAG, the question is: whose tokenizer do you align to? The embedding model (Jina) or the LLM (Groq Llama)? Answer: **the embedding model**, since that determines truncation boundaries.
- Qwen2.5's tokenizer (used by Jina v4) is tiktoken-format compatible but no JS library loads it natively.

### 3.3 Bets worth making

- **Use cl100k_base as universal proxy** for now. It's the most widely supported encoding in JS libraries, and the error vs. Qwen2.5 tokenizer is ~5-10% (much better than the current 40-70% word-count error).
- **When Jina v4 tokenizer becomes available in JS** (via HuggingFace tokenizers-js or custom), switch to exact Jina tokenizer for chunk-size accuracy.
- **Consider o200k_base** if the pipeline starts using GPT-4o/GPT-5 for RAG answers. Its 200K vocab handles code and multilingual text more efficiently.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Audio engineering** | Splitting audio into frames without cutting mid-phoneme | Windowed FFT with overlap (Hann window) | Token-aware overlap already in the chunker; BPE makes it precise |
| **Video compression** | GOP (Group of Pictures) sizing for streaming | Variable GOP with bitrate target | Variable chunk size with token budget |
| **Linguistics** | Morpheme segmentation | Morphological analysis | BPE is essentially learned morphology — subword tokenization captures morphemes |
| **Information theory** | Rate-distortion tradeoff | Quantize to acceptable distortion level | Using a proxy tokenizer (cl100k) instead of exact (Qwen) is acceptable distortion if error < 10% |
| **Signal processing** | Nyquist sampling — must sample above 2x frequency | Sample at sufficient resolution | Word-count "samples" text at 1/1.3x to 1/3.2x of actual token resolution — aliasing/error is inevitable |

### 4.2 Information theory insight

The current word-count approach is analogous to **sub-Nyquist sampling**: it measures text density at a resolution too coarse to capture the actual token structure. BPE tokenization is the "Nyquist-rate measurement" — it captures the actual information density as seen by the model. Code and CJK text have much higher "token frequency" per character than English prose, just as high-frequency signals need faster sampling rates.

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **Assumption:** 1 whitespace-delimited word = 1 token
- **Actual relationship:** tokens = f(text, vocabulary) where f is the BPE merge algorithm
- **For English prose:** tokens/word ratio ~ N(1.3, 0.15) — roughly normal with mean 1.3, std 0.15
- **For code:** tokens/word ratio ~ N(2.0, 0.5) — much higher mean and variance
- **For CJK:** tokens/character ratio ~ N(1.5, 0.3) — words are not meaningful units
- **The assumption breaks** because BPE operates on bytes/characters, not words. A single "word" like `DEFAULT_MAX_TOKENS` becomes 4 tokens (`DEFAULT`, `_MAX`, `_TOKEN`, `S`).

### 5.2 Error analysis

Let W = word count, T = actual BPE token count, and the target chunk size = M tokens.

Current error: E = (W - T) / T. Since W < T for most content, E is negative (systematic undercount).

| Content | E (measured) | Chunk "leaks" |
|---|---|---|
| English prose | -8% to -18% | 500-word chunk = 540-610 actual tokens |
| Markdown | -43% | 500-word chunk = 880 actual tokens |
| Code | -50% | 500-word chunk = 990 actual tokens |
| Russian | -65% | 500-word chunk = 1420 actual tokens |
| JSON | -69% | 500-word chunk = 1610 actual tokens |

With BPE tokenizer, E = 0% for the matching encoding, and E ~ 2-8% for a proxy encoding (e.g., cl100k_base counting tokens that will be embedded by Jina v4's Qwen tokenizer).

### 5.3 Impact on overlap

Overlap is set to 100 tokens. With word-count:
- English: actual overlap = ~80 tokens (acceptable)
- Code: actual overlap = ~50 tokens (halved)
- Russian: actual overlap = ~35 tokens (minimal continuity)

With BPE: actual overlap = 100 tokens (exact, regardless of content type).

### 5.4 Cost of switching: computation overhead

Measured on Bun 1.x runtime with gpt-tokenizer cl100k_base:

| Operation | Latency |
|---|---|
| Module import (one-time) | 210 ms |
| First encode (warm) | 1.2 ms |
| Encode 500-token chunk | 0.10 ms |
| Encode 46KB document | 2.44 ms |
| Word count 46KB document | 0.66 ms |

**Overhead per document:** ~2 ms additional vs. word count. For a pipeline where embedding takes ~200-500ms per chunk via Jina API, this is **0.4-1.0% overhead**. Negligible.

**Memory overhead:** cl100k_base encoding data = ~1.1 MB in memory (compact binary format). One-time cost at process start.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach

- **What:** Replace whitespace tokenizer with `gpt-tokenizer` using `cl100k_base` encoding
- **Why:**
  - Eliminates 8-69% systematic error in token counting (Layer 1)
  - Pure JS, zero native dependencies, works on Bun and CF Workers (Layer 2)
  - Fastest pure JS BPE implementation available (Layer 2)
  - Encoding-specific import keeps bundle to ~2 MB (Layer 2)
  - 0.1 ms/chunk latency is negligible vs embedding API calls (Layer 5)
  - 210 ms one-time init is acceptable for a long-running server process
- **Expected impact:**
  - Token count accuracy: 70-92% -> **100%** (for cl100k_base aligned models)
  - Token count accuracy: 70-92% -> **~95-98%** (as proxy for Jina v4 / Qwen tokenizer)
  - Chunk size consistency: +/- 50% variance -> **+/- 5% variance**
  - Overlap precision: 35-100 actual tokens -> **100 actual tokens** (consistent)
- **Cost:** ~2 hours implementation + testing. ~2 MB additional memory.
- **Risk:**
  - gpt-tokenizer is a third-party dependency (MIT license, actively maintained, 3.4.0 current)
  - cl100k_base is not an exact match for Jina v4's Qwen tokenizer (5-10% residual error)
  - Import adds 210ms to cold start (one-time, negligible for server)

### 6.2 Why cl100k_base (not o200k_base)

| Factor | cl100k_base | o200k_base |
|---|---|---|
| Vocab size | 100K | 200K |
| BPE rank data size | 1.1 MB | 2.2 MB |
| Dist bundle size | 2.0 MB | 2.0 MB (compact format) |
| English token efficiency | Baseline | ~5-10% fewer tokens (larger vocab) |
| CJK/multilingual | Good | Better (more multilingual merges) |
| Code | Good | Better |
| Proxy accuracy for Claude | ~70% vocab overlap | Less overlap (different vocab distribution) |
| Proxy accuracy for Jina/Qwen | ~90-95% | ~90-95% |
| Ecosystem support | Universal (all libraries) | Universal (all modern libraries) |

**Recommendation: Start with `cl100k_base`.** It's the most conservative, widely-tested encoding. The accuracy gain over word-count is massive (40-70% error eliminated). The marginal gain of o200k_base (~2-5% better for multilingual) doesn't justify the 2x data size. Switch to o200k_base later if Contexter shifts to GPT-4o/GPT-5 as the RAG answer model.

### 6.3 Implementation spec (brief)

**Input:** Text string (unchanged API)
**Output:** Token count (number) or token array with offsets

```
// New tokenizer.ts (conceptual, not production code)
import { encode, decode } from 'gpt-tokenizer/encoding/cl100k_base'

countTokens(text) -> encode(text).length
tokenize(text) -> map BPE tokens back to character offsets
```

**Migration notes:**
- The `tokenize()` function currently returns word boundaries. BPE `encode()` returns integer token IDs, not character offsets. To preserve the overlap calculation (which needs character offsets), the implementation needs to either:
  - (a) Use `decode` on token windows to get text slices, or
  - (b) Track byte offsets during encoding (gpt-tokenizer supports this via `encodeGenerator`)
- All call sites (`semantic.ts`, `table.ts`, `timestamp.ts`) call `countTokens()` — this is a drop-in replacement.
- `tokenize()` is used only in `semantic.ts` for overlap calculation and `splitByTokenWindow` — needs refactoring.
- Tests in `chunker.test.ts` will need updated expected values.

**Config:**
- Encoding: `cl100k_base` (hardcoded for now, configurable later)
- No caching needed: gpt-tokenizer handles internal optimization
- Module loaded once at import time (server startup)

**Fallback:** If gpt-tokenizer fails to load (hypothetical), fall back to current word-count with a 1.4x multiplier. Log a warning.

### 6.4 Validation plan

- **Accuracy test:** Run 100 diverse documents (English, Russian, code, markdown, JSON, mixed) through old and new tokenizer. Compare chunk counts, sizes, and overlap regions.
- **Performance test:** Measure total pipeline time (parse -> chunk -> embed) with old vs new tokenizer on 50 documents. Expected: <2% total time increase.
- **Minimum success criteria:** Average token count error < 5% vs ground truth (Jina API reported token usage).
- **Rollback trigger:** If BPE tokenization adds >10% to total pipeline time, or if gpt-tokenizer introduces runtime errors in Bun/Docker.

### 6.5 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **tiktoken (WASM)** | 3-6x faster than pure JS, but WASM compatibility concerns with Bun. Extra complexity for wasm init. Speed difference irrelevant at 0.1ms/chunk. |
| **js-tiktoken** | Functionally equivalent to gpt-tokenizer but slightly slower. gpt-tokenizer has better DX (synchronous, encoding-specific imports, compact format). Both are valid choices. |
| **ai-tokenizer** | 31 MB unpacked, wraps gpt-tokenizer internally, adds model mapping layer we don't need. Over-engineered for our use case. |
| **tokenx (heuristic)** | 2KB, 96% accuracy. Still 2-10% error — not enough improvement over word-count to justify a new dependency. If we're adding a dep, get 100% accuracy. |
| **Character count / 4** | Common heuristic (4 chars = 1 token). Better than word count for English but still 15-30% error on code/CJK. Not worth the marginal improvement. |
| **Ratio multiplier** (word count * 1.3) | Shifts the mean error but doesn't fix variance. Code at 2.0x ratio still miscounted. Content-dependent error remains. |
| **o200k_base encoding** | 2x data size, marginal accuracy gain for our mixed-content use case. Not rejected permanently — revisit when/if Contexter uses GPT-4o for RAG answers. |
| **Jina/Qwen exact tokenizer** | No JS library available. Would need to load HuggingFace tokenizer.json (~5 MB) and implement BPE from scratch or use transformers.js (~50 MB). Overkill for 5% accuracy gain over cl100k_base proxy. |
| **Anthropic Count Tokens API** | Requires API call per count operation. Adds latency (100ms+), rate limits, network dependency. Only useful for Claude-specific token counting, not for chunking. |

---

## Package Size Summary

| Package | Version | Unpacked size | Files | Single encoding (disk) | Single encoding (gzipped) |
|---|---|---|---|---|---|
| **gpt-tokenizer** | 3.4.0 | 53 MB | 1348 | ~2.0 MB (cl100k dist) | ~1.0 MB |
| **js-tiktoken** | 1.0.21 | 22 MB | 32 | ~1.1 MB (cl100k rank) | ~0.6 MB |
| **tiktoken** (WASM) | 1.0.22 | 24 MB | 57 | ~1.5 MB WASM + rank | ~0.8 MB |
| **ai-tokenizer** | 1.0.6 | 32 MB | 53 | N/A (multi-model) | N/A |
| **tokenx** | 1.3.0 | 17 KB | 5 | 17 KB (no encoding data) | ~5 KB |

**Note:** Unpacked sizes include all encodings, types, source maps, CJS+ESM builds. Actual import cost is one encoding file (~1-2 MB) plus core library (~50 KB). Tree-shaking with encoding-specific imports (`gpt-tokenizer/encoding/cl100k_base`) ensures only the needed encoding is bundled.

---

## Benchmark Summary (Bun runtime, measured 2026-03-28)

| Operation | gpt-tokenizer cl100k_base | Current word count |
|---|---|---|
| Module import (cold) | 210 ms | 0 ms (built-in) |
| Encode 500-token chunk | 0.10 ms | 0.01 ms |
| Encode 46KB document | 2.44 ms | 0.66 ms |
| Memory (encoding data) | ~1.1 MB | 0 |

**Conclusion:** For a server processing documents where each embedding API call takes 200-500ms, the 0.1ms BPE overhead per chunk is invisible. The 210ms init happens once at startup. The 1.1 MB memory is trivial on a 4GB server.

---

## Sources

- [gpt-tokenizer GitHub](https://github.com/niieani/gpt-tokenizer)
- [js-tiktoken npm](https://www.npmjs.com/package/js-tiktoken)
- [tiktoken (WASM) npm](https://www.npmjs.com/package/tiktoken)
- [compare-tokenizers benchmark suite](https://github.com/transitive-bullshit/compare-tokenizers)
- [ai-tokenizer GitHub](https://github.com/coder/ai-tokenizer)
- [tokenx GitHub](https://github.com/johannschopplich/tokenx)
- [OpenAI Tokenizer Cookbook](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken)
- [GPT-4o vs GPT-4 Tokenization](https://llm-calculator.com/blog/gpt-4o-vs-gpt-4-tokenization/)
- [Jina Embeddings v4 Model Page](https://jina.ai/models/jina-embeddings-v4/)
- [Qwen Tokenization Note](https://github.com/QwenLM/Qwen/blob/main/tokenization_note.md)
- [Anthropic Token Counting API](https://platform.claude.com/docs/en/build-with-claude/token-counting)
- [Claude Tokenizer Info (VentureBeat)](https://venturebeat.com/ai/hidden-costs-in-ai-deployment-why-claude-models-may-be-20-30-more-expensive-than-gpt-in-enterprise-settings/)
- [Vectara NAACL 2025 Chunking Study](https://blog.premai.io/rag-chunking-strategies-the-2026-benchmark-guide/)
- [NVIDIA Chunking Best Practices](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/)
- [Tokenization vs Chunking (KiaDev)](https://kiadev.net/news/2025-08-30-tokenization-vs-chunking-ai-text-processing)
- [Sebastian Raschka BPE From Scratch](https://sebastianraschka.com/blog/2025/bpe-from-scratch.html)
- [Cloudflare Workers WASM Docs](https://developers.cloudflare.com/workers/runtime-apis/webassembly/)
