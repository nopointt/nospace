# Contexter Inference Pricing Research
> Date: 2026-03-25 | Load model: 248M emb tokens + 1.9B LLM tokens + 750h Whisper + 9K images/mo

---

## 1. Embeddings (248M tokens/month)

| Provider | Model | $/M tokens | Monthly cost | Notes |
|---|---|---|---|---|
| **Mistral** | **Mistral Embed** | **$0.01** | **$2.48** | **Cheapest commercial. 1024 dims** |
| OpenAI | text-embedding-3-small | $0.02 | $4.96 | 1536 dims, batch $0.01/M = $2.48 |
| Voyage AI | voyage-3.5-lite | $0.02 | $4.96 | 1024 dims, batch 33% off = $3.31 |
| Voyage AI | voyage-3.5 | $0.06 | $14.88 | Higher quality |
| CF Workers AI | bge-small-en-v1.5 | $0.02 | $4.96 | 384 dims, edge, 10K free neurons/day |
| CF Workers AI | bge-base-en-v1.5 | $0.067 | $16.62 | 768 dims |
| Cohere | Embed v3 | $0.10 | $24.80 | Multilingual |
| Cohere | Embed 4 | $0.12 | $29.76 | Multimodal |
| OpenAI | text-embedding-3-large | $0.13 | $32.24 | 3072 dims |
| Google | Gemini Embedding 001 | $0.15 | $37.20 | Free tier exists but rate-limited |
| Mistral | Codestral Embed | $0.15 | $37.20 | Code-specialized |
| Voyage AI | voyage-code-3 | $0.18 | $44.64 | Code-specialized |
| Google | Gemini Embedding 2 | $0.20 | $49.60 | Multimodal |
| Jina AI | jina-embeddings-v4 | Contact sales | ~$12-25 est | 1024 dims, 32K context, multimodal |
| **Self-hosted** | **bge-large / gte-large** | **~$0.001** | **~$0.25** | **L4 $0.44/hr, ~5K emb/sec, need ~14 hrs/mo** |

### Embedding verdict

- **Cheapest API:** Mistral Embed at $2.48/mo. OpenAI small & Voyage lite tied at $4.96 (OpenAI batch = $2.48).
- **Cheapest overall:** Self-hosted bge-large on L4 for ~$0.25/mo but requires DevOps overhead.
- **Best value for Contexter:** OpenAI text-embedding-3-small (batch) or Mistral Embed. Both under $5/mo at 248M tokens.
- **Current Jina v4:** Cannot get exact pricing (sales only). Likely $0.05-0.10/M = $12-25/mo. Switching to OpenAI small or Mistral saves 3-10x.
- **Note on dims:** Current Contexter uses 1024 dims (Jina v4). Mistral Embed (1024), Voyage-3.5-lite (1024), OpenAI small (supports truncate to 1024) all compatible. Vectorize index would need rebuild.

---

## 2. LLM Inference (1.9B tokens/month)

Assuming ~60% input / ~40% output split (1.14B input + 760M output) for RAG workloads.

| Provider | Model | $/M in | $/M out | Monthly cost | Speed |
|---|---|---|---|---|---|
| **DeepInfra** | **Llama 3.1 8B (Turbo FP8)** | **$0.02** | **$0.03** | **$45.60** | **Fast** |
| Novita | Llama 3.1 8B | $0.02 | $0.05 | $60.80 | Fast |
| Nebius | Llama 3.1 8B | $0.02 | $0.05 | $60.80 | Fast |
| DeepInfra | Llama 3.1 8B | $0.03 | $0.05 | $72.20 | Fast |
| Groq | Llama 3.1 8B instant | $0.05 | $0.08 | $117.80 | 840 tok/s |
| Cerebras | Llama 3.1 8B | $0.10 | $0.10 | $190.00 | 2200 tok/s, fastest |
| Together.ai | Llama 3.1 8B Turbo | $0.18 | $0.18 | $342.00 | Fast |
| Fireworks.ai | Llama 3.1 8B (4-16B tier) | $0.20 | $0.20 | $380.00 | Fast |
| CF Workers AI | Llama 3.1 8B fast (FP8) | $0.045 | $0.384 | $343.56 | Edge, 10K free neurons/day |
| CF Workers AI | Llama 3.1 8B instruct | $0.282 | $0.827 | $950.33 | Edge, full precision |
| Self-hosted | Llama 3.1 8B vLLM (L4) | ~$0.01 | ~$0.01 | ~$320* | L4 $0.44/hr, 24/7 = $320/mo |
| Self-hosted | Llama 3.1 8B vLLM (4090) | ~$0.005 | ~$0.005 | ~$245* | 4090 $0.34/hr, 24/7 = $245/mo |

*Self-hosted costs assume dedicated 24/7 GPU. Actual per-token cost depends on utilization. At 1.9B tokens/mo you need ~100-200 hrs of GPU time, not 24/7.

### Self-hosted LLM refined estimate

- L4 GPU: ~5,000 tok/s throughput with vLLM for 8B model
- 1.9B tokens / 5,000 tok/s = 380,000 seconds = ~106 hours
- 106 hrs x $0.44/hr (RunPod L4) = **$46.64/mo**
- RTX 4090: ~5,000 tok/s, 106 hrs x $0.34/hr = **$36.04/mo**

| Provider | Model | Monthly cost (refined) |
|---|---|---|
| **Self-hosted 4090** | **Llama 3.1 8B vLLM** | **~$36** |
| **DeepInfra** | **Llama 3.1 8B Turbo FP8** | **~$46** |
| Self-hosted L4 | Llama 3.1 8B vLLM | ~$47 |
| Novita / Nebius | Llama 3.1 8B | ~$61 |
| Groq | Llama 3.1 8B instant | ~$118 |
| Cerebras | Llama 3.1 8B | ~$190 |
| CF Workers AI | Llama 3.1 8B fast FP8 | ~$344 |

### LLM verdict

- **Cheapest API:** DeepInfra Turbo FP8 at ~$46/mo. No DevOps needed.
- **Cheapest overall:** Self-hosted 4090 at ~$36/mo but requires serverless setup + cold starts.
- **Best value for Contexter:** DeepInfra ($46/mo) or Novita ($61/mo). Simple API, no infra management.
- **Current Workers AI:** 10K free neurons/day covers only ~1.6M tokens/day (fast variant) = ~50M tokens/mo. At 1.9B tokens that's 38x over free tier. Cost would be $344/mo for fast variant -- 7x more expensive than DeepInfra.
- **Groq:** Fast (840 tok/s) but 2.5x price of DeepInfra. Worth it only if latency matters more than cost.
- **Cerebras:** Fastest (2200 tok/s) but 4x price of DeepInfra. Premium for speed.

---

## 3. Whisper Transcription (750 hours/month)

| Provider | Model | $/hour | Monthly cost | Speed | Notes |
|---|---|---|---|---|---|
| **Groq** | **Distil-Whisper** | **$0.02** | **$15.00** | **Fast** | **Slightly lower accuracy** |
| Groq | Whisper Large v3 Turbo | $0.04 | $30.00 | 228x RT | Good accuracy/cost ratio |
| Groq | Whisper Large v3 | $0.111 | $83.25 | 217x RT | Highest accuracy |
| **AssemblyAI** | **Universal-2** | **$0.15** | **$112.50** | **--** | **185h free/mo = $97 net** |
| AssemblyAI | Universal-3 Pro | $0.21 | $157.50 | -- | Higher accuracy |
| Deepgram | Nova-3 mono | $0.462/hr | $346.50 | -- | $200 free credit initial |
| Deepgram | Nova-1/2 | $0.348/hr | $261.00 | -- | Older models |
| Self-hosted | faster-whisper L4 | ~$0.03-0.04 | ~$22-33 | 20-40x RT | Need ~19-38 GPU-hrs |

### Self-hosted Whisper refined estimate

- faster-whisper large-v3 on L4: ~20x real-time factor (conservative)
- 750 hours audio / 20x = 37.5 GPU-hours
- 37.5 hrs x $0.44/hr (RunPod L4) = **$16.50/mo**
- With turbo model (faster): ~30x RTF = 25 GPU-hrs = **$11.00/mo**

| Provider | Monthly cost |
|---|---|
| Self-hosted faster-whisper turbo (L4) | ~$11 |
| **Groq Distil-Whisper** | **$15** |
| Self-hosted faster-whisper large-v3 (L4) | ~$17 |
| Groq Whisper Large v3 Turbo | $30 |
| Groq Whisper Large v3 | $83 |
| AssemblyAI Universal-2 (net after free) | ~$97 |
| Deepgram Nova-1/2 | $261 |
| Deepgram Nova-3 | $347 |

### Whisper verdict

- **Cheapest API:** Groq Distil-Whisper at $15/mo. If accuracy matters, Groq Turbo at $30/mo.
- **Cheapest overall:** Self-hosted faster-whisper turbo on L4 at ~$11/mo.
- **Best value for Contexter:** Groq Whisper Large v3 Turbo ($30/mo). Best accuracy/cost ratio, no infra management, 228x real-time speed. Current Groq Whisper (large-v3 at $83) can save 60% by switching to Turbo.
- **Groq batch API:** 50% discount = $15/mo for Turbo. Excellent if non-real-time is OK.

---

## 4. Document Parsing / OCR (9,000 images/month)

| Provider | Model/Method | $/page or $/image | Monthly cost | Notes |
|---|---|---|---|---|
| **CF Workers AI** | **toMarkdown()** | **~free** | **~$0-2** | **Included in Workers plan, uses neurons** |
| Self-hosted | Docling (CPU) | ~$0 | ~$3-5 | 3.1s/page CPU, ~7.75 CPU-hrs for 9K |
| Self-hosted | Marker (GPU) | ~$0.001 | ~$2-4 | L4 GPU, ~0.5s/page = ~1.25 GPU-hrs |
| LlamaParse | Fast (1 credit) | $0.00125 | $11.25 | 1K credits = $1.25 |
| LlamaParse | Cost-effective (3 cr) | $0.00375 | $33.75 | With LLM assistance |
| **Unstructured.io** | **API** | **$0.03** | **$270.00** | **Most expensive** |
| LlamaParse | Agentic (90 cr) | $0.1125 | $1,012.50 | Overkill for most docs |

### Document parsing verdict

- **Cheapest:** CF Workers AI toMarkdown() -- effectively free within the Workers plan neuron budget. Already in use.
- **Best self-hosted:** Docling on CPU for ~$3-5/mo. No GPU needed, 3.1s/page on x86.
- **Best paid API:** LlamaParse Fast at $11.25/mo (10K free pages on free plan covers most of 9K).
- **Avoid:** Unstructured.io at $270/mo -- 100x more expensive than CF toMarkdown.
- **Current setup (CF toMarkdown) is optimal.** No change needed.

---

## 5. Total Monthly Cost Comparison

### Current setup (estimated)

| Service | Provider | Est. monthly cost |
|---|---|---|
| Embeddings | Jina v4 | ~$12-25 (estimated, sales pricing) |
| LLM | Workers AI Llama 3.1 8B | ~$50-344 (depends on variant, free tier covers ~50M) |
| Whisper | Groq Large v3 | $83.25 |
| Doc parsing | CF toMarkdown | ~$0-2 |
| **Total** | | **~$145-454** |

### Optimized setup (cheapest APIs, no self-hosting)

| Service | Provider | Monthly cost |
|---|---|---|
| Embeddings | Mistral Embed ($0.01/M) | $2.48 |
| LLM | DeepInfra Turbo FP8 ($0.02/$0.03) | $45.60 |
| Whisper | Groq Turbo ($0.04/hr) | $30.00 |
| Doc parsing | CF toMarkdown (keep) | ~$0-2 |
| **Total** | | **~$80** |

### Ultra-cheap setup (batch + aggressive optimization)

| Service | Provider | Monthly cost |
|---|---|---|
| Embeddings | OpenAI small batch ($0.01/M) | $2.48 |
| LLM | DeepInfra Turbo FP8 | $45.60 |
| Whisper | Groq Turbo batch (50% off) | $15.00 |
| Doc parsing | CF toMarkdown (keep) | ~$0-2 |
| **Total** | | **~$65** |

### Self-hosted setup (cheapest possible, max DevOps)

| Service | Provider | Monthly cost |
|---|---|---|
| Embeddings | Self-hosted bge-large (L4 on-demand) | ~$6* |
| LLM | Self-hosted vLLM 4090 (on-demand) | ~$36 |
| Whisper | Self-hosted faster-whisper turbo (L4) | ~$11 |
| Doc parsing | Self-hosted Docling (CPU) | ~$5 |
| **Total** | | **~$58** |

*Self-hosted embedding cost includes realistic overhead (cold starts, idle time, management).

---

## 6. Recommendations for Contexter

### Immediate wins (no architecture changes)

1. **Switch Whisper to Groq Turbo** ($0.04/hr vs $0.111/hr) -- saves ~$53/mo, same API
2. **Switch embeddings to Mistral Embed or OpenAI small** -- saves ~$10-20/mo vs Jina v4
3. **Add DeepInfra as primary LLM** fallback, keep Workers AI for free-tier usage

### Medium-term (architecture changes)

1. **Fallback chain for LLM:** Workers AI (free tier, ~50M tokens) -> DeepInfra (paid overflow)
2. **Batch embedding:** Queue document chunks, embed in batches via OpenAI Batch API ($0.01/M)
3. **Groq batch for non-real-time Whisper:** 50% discount on transcription

### Self-hosting only makes sense if:

- Volume grows 5-10x (saves significant money at scale)
- Privacy requirements prevent external API usage
- Already have GPU infrastructure

At current volumes (248M emb + 1.9B LLM + 750h Whisper), API-based approach is optimal: **~$80/mo total with optimized providers vs ~$58 self-hosted but with significant DevOps burden.**

---

## Sources

- [Groq Pricing](https://groq.com/pricing)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [DeepInfra Pricing](https://deepinfra.com/pricing)
- [Together.ai Pricing](https://www.together.ai/pricing)
- [Fireworks.ai Pricing](https://fireworks.ai/pricing)
- [Cerebras Pricing](https://www.cerebras.ai/pricing)
- [Voyage AI Pricing](https://docs.voyageai.com/docs/pricing)
- [Cohere Pricing](https://cohere.com/pricing)
- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Jina AI Embeddings](https://jina.ai/embeddings/)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Deepgram Pricing](https://deepgram.com/pricing)
- [AssemblyAI Pricing](https://www.assemblyai.com/pricing)
- [Unstructured.io Pricing](https://unstructured.io/pricing)
- [LlamaParse Pricing](https://www.llamaindex.ai/pricing)
- [RunPod GPU Pricing](https://www.runpod.io/gpu-pricing)
- [Embedding Models Pricing Comparison (March 2026)](https://awesomeagents.ai/pricing/embedding-models-pricing/)
- [Llama 3.1 8B Provider Comparison](https://pricepertoken.com/pricing-page/model/meta-llama-llama-3.1-8b-instruct)
- [Cheapest LLM APIs 2026](https://blogs.novita.ai/cheapest-llm-apis-in-2026/)
- [Self-hosted Whisper Benchmark](https://blog.salad.com/whisper-large-v3/)
- [Docling Technical Report](https://arxiv.org/html/2408.09869v4)
