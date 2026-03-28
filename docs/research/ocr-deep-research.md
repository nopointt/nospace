# OCR for Scanned PDFs in RAG Systems — Deep Research
> Feature: OCR pipeline for Contexter
> Date: 2026-03-28
> Status: COMPLETE
> Server: Hetzner CAX11 (2 ARM vCPU, 4GB RAM, no GPU)

---

## Problem Statement

Contexter uses Docling (IBM, Docker container) for PDF/DOCX parsing. Scanned PDFs with no text layer return empty content — pipeline succeeds but chunks are empty. Need OCR capability that works on ARM CPU without GPU.

---

## Layer 1: Current State

### 1.1 Our implementation
- **What**: DoclingParser sends PDF to Docling REST API (`/v1/convert/file`), receives markdown
- **How**: Docling container runs on Hetzner CAX11 (ARM). PDF -> markdown conversion via Docling-serve 1.15.0
- **Performance**: 90s timeout per file, works well for text-based PDFs
- **Known issues**: Scanned PDFs return empty `md_content`. Warning logged but no fallback: `"Docling returned empty content — file may be image-only or protected"`

### 1.2 Metrics (baseline)
- Baseline accuracy: 100% for text PDFs, **0% for scanned PDFs** (empty output)
- Baseline latency: ~5-15s for text PDFs (Docling conversion)
- Baseline cost: EUR 4.72/mo server (Docling shares resources with app, PG, Redis, Caddy, Netdata)
- User impact: Any scanned document silently fails — chunks created but empty

### 1.3 Critical discovery: Docling ALREADY has built-in OCR

Docling natively supports multiple OCR engines. The reason scanned PDFs return empty is that **OCR is either disabled or not configured properly** in the current Docling-serve deployment. The `/v1/convert/file` endpoint accepts per-request OCR parameters:

```
do_ocr=true          (enable OCR)
force_ocr=false      (OCR only where text layer missing)
ocr_engine=easyocr   (engine selection: easyocr | tesseract_cli | tesseract | rapidocr | ocrmac)
ocr_lang=en          (language list)
```

**This means the simplest fix may be configuration, not new infrastructure.**

However, there are critical constraints on our 4GB ARM server that affect which OCR engine is viable. Research continues below.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

**Standard for scanned PDF OCR in RAG (2025-2026):**
- **Algorithm**: Hybrid pipeline — try text extraction first, fall back to OCR on empty/image pages
- **Why standard**: Avoids unnecessary OCR on digital PDFs (saves 10x+ processing time), handles mixed documents
- **Who uses it**: Docling (IBM), Unstructured.io, LlamaIndex, LangChain document loaders, Azure Document Intelligence

### 2.2 Top 3 implementations for CPU-constrained environments

| Product/Tool | Approach | Key Insight |
|---|---|---|
| **Docling + Tesseract** | Built-in Tesseract integration, CPU-native, low memory | Best for memory-constrained servers. No GPU needed. Tesseract is pure C++, ARM-native |
| **Docling + RapidOCR** | New default in Docling v2.56+. ONNX-based PaddleOCR models | Better accuracy than Tesseract, runs on CPU via ONNX Runtime. Low memory footprint |
| **OCRmyPDF + Tesseract** | Preprocessor: deskew, denoise, then Tesseract | Gold standard for scanned PDF cleanup. Adds text layer to PDF, then Docling can extract normally |

### 2.3 OCR engine comparison for our constraints (ARM CPU, 4GB RAM, no GPU)

| Engine | ARM Support | Memory Usage | Speed (CPU, x86) | Speed (est. ARM) | Russian | Install Complexity |
|---|---|---|---|---|---|---|
| **Tesseract 5** | Native (apt-get) | ~200MB | ~5-7s/page | ~8-12s/page | Good (3.7-5.8% WER) | Trivial (apt pkg) |
| **EasyOCR** | Via PyTorch CPU | ~4GB startup(!) | ~13s/page | ~20s+/page | Good (80+ langs) | Medium (Python) |
| **RapidOCR** | Via ONNX Runtime | ~300-500MB | ~3-5s/page | ~5-8s/page | Limited (CN/EN default) | Medium (ONNX) |
| **PaddleOCR** | Problematic | ~1-2GB | ~10s/page | Unsupported HPI | Good (100+ langs) | Hard (ARM issues) |
| **Surya** | Uncertain | 2-4GB+ | Unknown CPU | Likely >30s/page | 90+ langs | Hard (model DL) |

**Critical finding — EasyOCR memory leak in Docker:**
Multiple Docling GitHub issues report EasyOCR causing memory leaks in Docker containers. Memory climbs continuously and is never released, eventually OOM-killing the container. On a 4GB server this is a **hard blocker**. Switching to Tesseract resolves the memory leak.
Sources: [GitHub #1343](https://github.com/docling-project/docling/issues/1343), [GitHub #1401](https://github.com/docling-project/docling/discussions/1401), [GitHub #2115](https://github.com/docling-project/docling/discussions/2115)

### 2.4 Standard configuration (recommended)

- **Primary engine**: Tesseract (ARM-native, low memory, no leak, good Russian)
- **do_ocr**: true (always enabled)
- **force_ocr**: false (only OCR pages without text layer — hybrid mode)
- **ocr_lang**: `eng+rus` (Tesseract supports multi-language via `+` separator)
- **Fallback**: Cloud OCR API for high-value documents where accuracy is critical

### 2.5 Common pitfalls
- Using EasyOCR on memory-constrained servers (memory leak, 4GB+ startup)
- Setting `force_ocr=true` on all documents (wastes time on digital PDFs)
- Not installing language packs (Tesseract defaults to English only)
- Ignoring preprocessing (deskew, denoise) for poor-quality scans
- RapidOCR defaults to Chinese models — must configure explicitly for other languages

### 2.6 Processing time benchmarks (Docling on x86 CPU, per page)

From Docling benchmarks:
- **Without OCR**: ~3.1s/page (layout + text extraction)
- **With EasyOCR on x86 CPU**: +13s/page (OCR alone)
- **With EasyOCR on L4 GPU**: +1.6s/page
- **With Tesseract on x86 CPU**: ~5-7.5s/page (OCR alone)
- **Estimated Tesseract on ARM (2 vCPU)**: ~8-15s/page

Source: [Docling OCR Performance Discussion](https://github.com/docling-project/docling/discussions/2451)

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (2024-2026)

| Project | Date | Key Innovation | Status | Applicability |
|---|---|---|---|---|
| **ColPali** (illuin-tech) | 2024-07, updated 2025-02 | Skip OCR entirely. Embed page images as vectors using PaliGemma VLM + ColBERT late interaction. nDCG@5 81.3 | Production-ready (Vespa.ai) | NOT for us: requires GPU (3B params), 16GB+ RAM, completely different retrieval architecture |
| **ColSmol** (vidore) | 2025 | 256M param lightweight ColPali variant | Early | Still too heavy for 2 ARM vCPU + 4GB. Interesting for future GPU server |
| **PaddleOCR-VL 0.9B** (Baidu) | 2025-10 | Vision-language model for OCR, 109 languages, 14.2% faster than MinerU | Production | Too heavy for our server (0.9B params). Great accuracy but needs GPU or beefy CPU |
| **Mistral OCR 3** | 2025-12 | Cloud API, $1-2/1K pages, 94.89% accuracy, Markdown output | Production | Excellent cloud fallback option. Cheapest cloud OCR with highest accuracy |
| **Docling v2.56+ RapidOCR default** | 2025 | Switched default from EasyOCR to RapidOCR, ONNX-based, no memory leak | Production | Direct upgrade path — update Docling version |
| **OCR-free Vision RAG** (Microsoft) | 2025 | Use VLMs to answer questions directly from page images | Research | Requires GPU + fundamentally different architecture |

### 3.2 Open questions in the field
- Can ColPali/ColSmol run efficiently on CPU-only for retrieval? Current answer: no, too slow
- Will RapidOCR get first-class Russian language support? Currently CN/EN focused
- When will Docling-serve support the newer Docling v2.56+ with RapidOCR as default?

### 3.3 Bets worth making
- **Mistral OCR as cloud fallback**: At $1-2/1K pages, it's cheaper than Google Vision ($1.50/1K) with better accuracy (94.89% vs 83.42%). Good fallback for when local OCR fails or for high-value documents
- **Upgrade Docling to latest version**: v2.56+ defaults to RapidOCR which is faster and more stable than EasyOCR on CPU

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous Problem | Their Solution | Transfer Opportunity |
|---|---|---|---|
| **Medical imaging** | Extracting measurements from scanned X-rays/reports | Two-pass: fast classifier (is this a scan?) then targeted extraction | Detect scanned vs digital PDF first, skip OCR for digital — saves resources |
| **Postal/logistics** | Reading handwritten addresses on envelopes | Preprocessing pipeline: binarize, deskew, denoise, THEN recognize | OCRmyPDF does exactly this before Tesseract |
| **Audio engineering** | Extracting speech from noisy recordings | Noise reduction -> VAD (Voice Activity Detection) -> ASR | Analogous: image preprocessing -> text region detection -> OCR |
| **Signal processing** | Recovering weak signals from noise | Matched filtering, adaptive thresholding | Adaptive binarization (Sauvola/Otsu) for poor scans before OCR |

### 4.2 Engineering insights

- **Signal processing**: Adaptive thresholding (Sauvola method) dramatically improves OCR on uneven lighting/yellowed paper. Tesseract has some built-in, but OCRmyPDF's preprocessing pipeline is superior
- **Information theory**: Scanned text has inherent information loss (continuous image -> discrete characters). Lower DPI = more information lost. 300 DPI is minimum for reliable OCR; 200 DPI drops accuracy ~15-20%
- **Control systems**: Feedback loop — if OCR confidence is low, apply heavier preprocessing and retry. Two-pass approach: fast pass -> confidence check -> enhanced pass if needed

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model
- **Text extraction**: Direct byte parsing of PDF text layer (no math involved — binary format)
- **OCR**: LSTM neural networks (Tesseract 5), CRNN (EasyOCR/PaddleOCR), attention-based Transformers (Surya)
- **Assumption**: Input images are clean, properly oriented, adequate resolution
- **Where assumptions break**: Rotated scans, low DPI, mixed languages on same line, watermarks, stamps over text

### 5.2 OCR accuracy as a function of image quality

| Factor | Impact on Word Error Rate |
|---|---|
| DPI < 200 | +15-20% WER |
| DPI 300 (standard) | Baseline WER (3-6% for Tesseract eng) |
| Skew > 5 degrees | +10-30% WER without deskew |
| Noise (speckle, bleed-through) | +5-15% WER without denoise |
| Mixed RU+EN on same line | +10-20% WER (Tesseract confuses Cyrillic/Latin) |

### 5.3 Optimization opportunities
- **Current bottleneck**: Zero accuracy on scanned PDFs (no OCR at all)
- **Quick win**: Enable Tesseract OCR in Docling -> immediately go from 0% to ~94-96% accuracy on clean scans
- **Preprocessing gain**: Adding deskew + denoise before OCR can improve accuracy by 5-15% on poor scans
- **Multi-language handling**: Tesseract `eng+rus` mode handles mixed documents but with ~10-20% accuracy penalty on mixed lines. Workaround: detect dominant language per page, OCR with that language primary

### 5.4 Information-theoretic analysis
- A typical scanned A4 page at 300 DPI = ~8.4M pixels (2480x3508)
- OCR extracts ~2-3KB of text per page (~500 words)
- Compression ratio: ~2800:1 (image to text)
- Information loss is significant — layout, formatting, images, tables are partially or fully lost in pure text OCR
- For RAG: text content is primary signal; layout is secondary. Acceptable tradeoff.

### 5.5 Processing time model

For Tesseract on ARM (2 vCPU, 4GB RAM), estimated per-page processing:
```
Total = T_layout + T_ocr + T_postprocess
      = ~2s     + ~8-12s + ~0.5s
      = ~10-15s per page
```

For a 20-page scanned document: ~3-5 minutes total processing time.
This is acceptable for async (BullMQ queue) processing. Not suitable for synchronous requests.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Enable Tesseract OCR in Docling (Phase 1) + Mistral OCR fallback (Phase 2)

#### Phase 1: Docling + Tesseract (immediate, zero new infrastructure)

- **What**: Enable OCR in existing Docling-serve by passing `do_ocr=true`, `ocr_engine=tesseract_cli`, `ocr_lang=eng+rus` as form fields to the `/v1/convert/file` endpoint. Install `tesseract-ocr`, `tesseract-ocr-eng`, `tesseract-ocr-rus` in the Docling Docker container.
- **Why**:
  - Layer 1: Docling already supports OCR, we just need to enable it
  - Layer 2: Tesseract is the only engine that fits 4GB RAM + ARM constraints without memory leaks
  - Layer 5: Goes from 0% to ~94-96% accuracy on clean scans immediately
- **Expected impact**: Scanned PDFs go from 0% to ~94-96% text extraction accuracy. Russian+English support out of the box.
- **Cost**: Zero additional infrastructure cost. Tesseract adds ~50MB to Docker image. ~200MB runtime RAM.
- **Risk**:
  - Tesseract may not be installed in the stock docling-serve Docker image -> requires custom Dockerfile or updated version
  - Processing time ~10-15s/page on ARM -> 20-page doc takes 3-5 min (acceptable for async queue)
  - Mixed RU+EN lines have ~10-20% accuracy penalty
- **Implementation effort**: ~2-4 hours (modify Dockerfile + update DoclingParser request params)

#### Phase 2: Mistral OCR cloud fallback (when needed)

- **What**: Add Mistral OCR API as fallback for when local OCR produces low-confidence results or for high-value documents
- **Why**: Layer 3 — $1-2/1K pages is cheapest cloud OCR with 94.89% accuracy, outputs Markdown directly
- **Expected impact**: Near-perfect OCR for edge cases (rotated, low-DPI, complex layouts)
- **Cost**: $1-2 per 1000 pages. At low volume (< 100 pages/month) = essentially free
- **Risk**: External API dependency, latency, privacy (documents sent to Mistral)

### 6.2 Implementation spec (Phase 1)

**Input**: Scanned PDF file (image-only pages, no text layer)

**Output**: Markdown text with OCR-extracted content

**Algorithm**:
1. Detect if Tesseract is available in Docling container (startup check)
2. Modify `DoclingParser.parse()` to send OCR parameters with every request:
   - `do_ocr=true`
   - `force_ocr=false` (hybrid: only OCR pages without text)
   - `ocr_engine=tesseract_cli`
   - `ocr_lang=eng+rus`
3. Extend timeout from 90s to 180s for OCR-heavy documents
4. If content still empty after OCR attempt, log `ocr_failed` warning (future: trigger Phase 2 fallback)

**Docker changes**:
- Add to Docling container: `apt-get install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-rus`
- Set env: `TESSDATA_PREFIX=/usr/share/tesseract-ocr/5/tessdata/`
- Memory limit: keep existing (Tesseract uses ~200MB per invocation, well within 4GB)

**Config**:
- `OCR_ENABLED=true` (env var, opt-in initially)
- `OCR_ENGINE=tesseract_cli`
- `OCR_LANGUAGES=eng+rus`
- `OCR_TIMEOUT=180000` (3 min for heavy docs)

**Fallback**: If Tesseract not available, fall back to current behavior (no OCR, warning on empty content)

### 6.3 Validation plan

- **How to measure improvement**: Upload known scanned PDFs (Russian + English), compare extracted text against ground truth
- **Test documents**:
  1. Clean scan, English only (expect >95% accuracy)
  2. Clean scan, Russian only (expect >93% accuracy)
  3. Mixed RU+EN document (expect >85% accuracy)
  4. Low-quality scan, 200 DPI (expect >80% accuracy)
  5. Rotated scan (expect degraded but non-zero)
- **Minimum success criteria**: Scanned PDFs produce non-empty chunks with >85% word accuracy
- **Rollback trigger**: OCR causes OOM or container instability -> disable `do_ocr` parameter

### 6.4 Rejected alternatives

| Alternative | Why Rejected |
|---|---|
| **EasyOCR in Docling** | Memory leak in Docker, 4GB+ startup RAM. Hard blocker on 4GB server. Sources: GitHub issues #1343, #1401, #2115 |
| **RapidOCR in Docling** | Promising but Russian language support is limited (defaults to CN/EN). Would need custom model download and configuration. Consider for Phase 3 when Docling v2.56+ matures |
| **PaddleOCR standalone** | ARM aarch64 HPI not supported. Installation on ARM is problematic. Heavy dependencies (PaddlePaddle framework) |
| **Surya OCR** | 2-4GB+ RAM, uncertain ARM support, slow on CPU (~30s+/page estimate). Better suited for GPU environments |
| **ColPali / ColSmol** | Fundamentally different architecture (image embeddings, not text extraction). Requires GPU, 16GB+ RAM, different vector DB schema. Interesting for future but not applicable now |
| **Google Cloud Vision API** | $1.50/1K pages — more expensive than Mistral OCR ($1/1K) with lower accuracy (83% vs 95%). Privacy concerns |
| **AWS Textract** | $1.50/1K pages basic, up to $50/1K for forms. Overkill for our needs. Vendor lock-in |
| **OCRmyPDF as preprocessor** | Adds text layer to PDF, then Docling extracts. Two-step pipeline adds complexity. Better as optional enhancement in Phase 3 |
| **Upgrade Docling to v2.56+** | Good idea but risky as a first step — may introduce breaking changes. Better to first prove OCR works with current version + Tesseract, then upgrade |

### 6.5 Future phases

**Phase 3 (when needed)**:
- Upgrade Docling to v2.56+ with RapidOCR as default engine (better accuracy, still CPU-friendly)
- Add OCRmyPDF preprocessing for low-quality scans (deskew, denoise, binarize)
- Implement confidence scoring: if OCR confidence < threshold, queue for cloud re-processing

**Phase 4 (when GPU available)**:
- ColPali/ColSmol for vision-native document retrieval
- PaddleOCR-VL for best-in-class multilingual OCR
- Surya for complex document layouts

---

## Sources

### Docling OCR
- [Docling Pipeline Options](https://docling-project.github.io/docling/reference/pipeline_options/)
- [Docling Force Full Page OCR Example](https://docling-project.github.io/docling/examples/full_page_ocr/)
- [Docling OCR Models — DeepWiki](https://deepwiki.com/docling-project/docling/4.1-ocr-models)
- [Docling-serve GitHub](https://github.com/docling-project/docling-serve)
- [Docling-serve API Reference — DeepWiki](https://deepwiki.com/docling-project/docling-serve/4-api-reference)
- [Docling-serve Configuration — DeepWiki](https://deepwiki.com/docling-project/docling-serve/3.2-configuration)
- [Using Docling's OCR with RapidOCR — DEV Community](https://dev.to/aairom/using-doclings-ocr-features-with-rapidocr-29hd)
- [Docling Document Intelligence — Medium](https://medium.com/@Shamimw/docling-advanced-document-intelligence-and-ocr-platform-d710c267ce7f)
- [Open Source Document Parser with OCR — Niklas Heidloff](https://heidloff.net/article/document-parser-ocr-docling/)

### Memory Issues
- [EasyOCR Memory Leak — Docling #1343](https://github.com/docling-project/docling/issues/1343)
- [EasyOCR Memory Leak in Docker — Docling #1401](https://github.com/docling-project/docling/discussions/1401)
- [Memory Usage After Recognition — Docling-serve #2115](https://github.com/docling-project/docling/discussions/2115)
- [RAM Not Released — Docling-serve #474](https://github.com/docling-project/docling-serve/issues/474)

### OCR Engines
- [Tesseract OCR Benchmark — OpenBenchmarking](https://openbenchmarking.org/test/system/tesseract-ocr)
- [Tesseract Benchmarks — GitHub](https://github.com/tesseract-ocr/tessdoc/blob/main/Benchmarks.md)
- [8 Top Open-Source OCR Models Compared — Modal](https://modal.com/blog/8-top-open-source-ocr-models-compared)
- [7 Best Open-Source OCR Models 2025 — E2E Networks](https://www.e2enetworks.com/blog/complete-guide-open-source-ocr-models-2025)
- [OCR Benchmark 2025 — Qnovi](https://www.qnovi.de/en/blog/ocr-benchmarks-2025-the-best-open-source-models-in-a-practical-test/)
- [Comparing Best Open Source OCR Tools 2026 — Unstract](https://unstract.com/blog/best-opensource-ocr-tools/)
- [OCR Performance Discussion — Docling #2451](https://github.com/docling-project/docling/discussions/2451)

### Surya OCR
- [Surya GitHub — datalab-to](https://github.com/datalab-to/surya)
- [Surya Hardware Benchmarking — GitHub](https://github.com/Jl16ExA/Surya-OCR-Hardware-Benchmarking)
- [E-ARMOR Multilingual OCR Benchmark — arXiv](https://arxiv.org/html/2509.03615v1)

### PaddleOCR
- [PaddleOCR GitHub](https://github.com/PADDLEPADDLE/PADDLEOCR)
- [PaddleOCR-VL 0.9B Guide — DEV Community](https://dev.to/czmilo/2025-complete-guide-paddleocr-vl-09b-baidus-ultra-lightweight-document-parsing-powerhouse-1e8l)
- [PaddleOCR-VL Paper — arXiv](https://arxiv.org/html/2510.14528v1)
- [PaddleOCR ARM Discussion — GitHub #15772](https://github.com/PaddlePaddle/PaddleOCR/discussions/15772)

### ColPali
- [ColPali Paper — arXiv](https://arxiv.org/abs/2407.01449)
- [ColPali Blog — Hugging Face](https://huggingface.co/blog/manu/colpali)
- [ColPali — Vespa.ai](https://vespa.ai/solutions/visual-retrieval-augmented-generation/colpali/)
- [ColPali GitHub — illuin-tech](https://github.com/illuin-tech/colpali)
- [OCR-Free Vision RAG — Microsoft](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/introduction-to-ocr-free-vision-rag-using-colpali-for-complex-documents/4276357)
- [Scaling ColPali to Billions — Vespa Blog](https://blog.vespa.ai/scaling-colpali-to-billions/)

### Cloud OCR
- [Google Cloud Vision Pricing](https://cloud.google.com/vision/pricing)
- [Mistral OCR 3 Technical Review — PyImageSearch](https://pyimagesearch.com/2025/12/23/mistral-ocr-3-technical-review-sota-document-parsing-at-commodity-pricing/)
- [Mistral AI Pricing](https://mistral.ai/pricing)

### RAG Pipeline Best Practices
- [PDF Hell and Practical RAG — Unstract](https://unstract.com/blog/pdf-hell-and-practical-rag-applications/)
- [Vision-Based Document Retrieval — arXiv](https://arxiv.org/html/2505.05666v1)
- [Best LLM-Ready Document Parsers 2025 — Reducto](https://llms.reducto.ai/best-llm-ready-document-parsers-2025)

### Tesseract Russian
- [Tesseract Languages/Scripts](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)
- [OCRmyPDF Language Packs](https://ocrmypdf.readthedocs.io/en/latest/languages.html)
- [OCRmyPDF GitHub](https://github.com/ocrmypdf/OCRmyPDF)
