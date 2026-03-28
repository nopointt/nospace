# Answer Grounding & Citation — Deep Research
> Date: 2026-03-28 | Feature: Sentence-level attribution and inline citations for Contexter RAG
> Status: Complete

---

## Layer 1: Current State

### 1.1 Our implementation

- **What**: Contexter RAG returns an `answer` string + an array of `RagSource[]` objects. Each source contains `chunkId`, `documentId`, `content`, `score`, and retrieval `source` type (vector/fts/both).
- **How**: Context is built by labeling chunks as `[Source 1]`, `[Source 2]`, etc. in the prompt context window (`context.ts`). The system prompt says "Cite relevant parts of the context in your answer" but provides no structured citation format, no enforcement, and no verification.
- **Performance**: The LLM occasionally mentions "according to the document" or paraphrases but never produces machine-parseable citations like `[1]`, `[2]`. There is zero sentence-to-source mapping in the response. Users receive sources as a separate list but cannot trace which sentence came from which source.
- **Known issues**:
  - No sentence-level attribution (the entire answer is ungrounded from the user's perspective)
  - System prompt is vague: "Cite relevant parts" without specifying format
  - No post-hoc verification of whether the answer is faithful to retrieved context
  - No hallucination detection — if the LLM fabricates beyond context, nothing catches it
  - Sources are returned as a flat list, not linked to answer segments

### 1.2 Metrics (measure before improving)

- **Baseline faithfulness**: Unknown (not measured). Industry benchmarks (GaRAGe, ACL 2025) show SOTA LLMs reach at most 60% Relevance-Aware Factuality and 58.9% F1 in attribution — our unstructured prompt is likely well below this.
- **Baseline latency**: Single LLM call (~1-3s depending on model). No verification pass.
- **Baseline cost**: 1 LLM generation call per query (embedding + generation). No additional verification overhead.
- **User complaints**: "Where does this come from?" — users see sources but can't verify which part of the answer maps to which document.

---

## Layer 2: World-Class Standard

### 2.1 Industry standard approach

- **Algorithm**: Prompt-engineered inline citations with numbered source references `[1]`, `[2]`, injected during generation. Sources labeled in context, LLM instructed to cite by number. Post-generation, citations are parsed and linked to source metadata.
- **Why it's standard**: Zero additional model calls. Works with any LLM. Perplexity, Google, Bing Copilot, and most production RAG systems use this pattern. Cohere has it built into Command-R natively.
- **Who uses it**: Perplexity AI, Google AI Overview, Bing Copilot, Cohere Command-R/R+, LlamaIndex CitationQueryEngine, LangChain citation chains, OpenAI with web browsing.

### 2.2 Top 3 implementations

| Product/Paper | Approach | Benchmark | Key insight |
|---|---|---|---|
| **Perplexity AI** | Retrieval-first architecture. Ranked excerpts + metadata + citation markers embedded in structured prompt. Model tracks provenance during generation. Superscript numbers link facts to URLs. | Not public, but widely considered gold standard for consumer citation UX | "You are not supposed to say anything that you didn't retrieve" — citations are structural, not cosmetic. The orchestration engine assembles a highly structured prompt with citation markers that guide generation. |
| **Cohere Command-R/R+** | Model natively trained for grounded generation. Returns `citations[]` array with `start`/`end` character positions, `text`, and `document_ids`. Two modes: "accurate" (post-generation alignment, default) and "fast" (inline during streaming). | Trained specifically on grounded generation tasks; citation accuracy benchmarked internally | First-class API support: `citation_options={"mode": "accurate"}`. Citations are character-level spans in the response mapped to document IDs. No prompt engineering needed — it's in the model weights. |
| **Google Vertex AI Check Grounding** | Separate API endpoint. Takes answer candidate + facts array. Returns: support score (0-1), cited_chunks, and claims-to-citations mapping. Configurable citation_threshold (default 0.6). | Support score loosely approximates fraction of grounded claims. Perfect grounding = every claim supported by >= 1 fact. | Decoupled verification — can be added to ANY RAG pipeline as a post-processing step. Does not require the generation model to produce citations itself. |

### 2.3 Standard configuration

**Recommended defaults (prompt-based approach):**

1. Label each source chunk with a unique identifier in the context:
   ```
   [Source 1] (document: "Architecture Guide", chunk: 3)
   {chunk content here}

   [Source 2] (document: "API Reference", chunk: 7)
   {chunk content here}
   ```

2. System prompt with explicit citation contract:
   ```
   You are a helpful assistant answering questions based on the provided context.

   Rules:
   - Answer ONLY using information from the sources provided below.
   - For EVERY factual claim, include an inline citation using [1], [2], etc.
     corresponding to the source number.
   - If multiple sources support a claim, cite all: [1][3].
   - If a claim cannot be supported by any source, do NOT include it.
   - If no sources contain relevant information, say "I don't have enough
     information to answer this question."
   - Answer in the same language as the question.
   - Be concise and direct.
   ```

3. Parse citations from the response using regex: `/\[(\d+)\]/g`

4. Map parsed citation numbers back to source metadata.

**Common pitfalls:**
- Vague citation instructions ("cite relevant parts") — LLM ignores or invents its own format
- Citation format in context doesn't match format requested in output instructions
- Not including document metadata (title, filename) in source labels — reduces LLM's ability to ground
- Placing instructions in the middle of context — LLMs attend less to middle content (lost-in-the-middle effect)
- Not validating that cited source numbers actually exist in the provided sources

**Migration path from current state:**
- Effort: **Small** (2-4 hours). Modify `context.ts` to enrich source labels. Rewrite system prompt. Add citation parser to response processing. No new models, no new API calls.

---

## Layer 3: Frontier Innovation

### 3.1 Emerging techniques (papers from last 6 months)

| Paper/Project | Date | Key innovation | Status | Applicability |
|---|---|---|---|---|
| **ReClaim: Ground Every Sentence** (Xia et al., NAACL 2025 Findings) | 2024-07 / 2025-05 | Interleaved reference-claim generation: model alternates between outputting a reference marker and a factual claim, achieving 90% citation accuracy at sentence level | Research + GitHub code | High. Could be adapted as a prompt pattern for Contexter without fine-tuning. The interleaved format forces the model to "think in citations." |
| **Concise and Sufficient Sub-Sentence Citations** (Chen et al., arXiv 2509.20859) | 2025-09 | Goes below sentence level: citations point to minimal sufficient text spans, not entire paragraphs. Reduces user verification effort. Annotation guidelines + dataset provided. | Research | Medium-future. Requires fine-tuning or very sophisticated prompting. Over-engineering for current Contexter scale but indicates where the field is heading. |
| **HALT-RAG** (arXiv 2509.07475) | 2025-09 | Post-hoc hallucination detection using ensemble of two frozen NLI models + lexical signals. Task-adaptable via lightweight classifier head. Includes abstention (model says "I don't know" when confidence is low). | Research | High. Could be added as verification layer after generation. Uses off-the-shelf NLI models (no fine-tuning needed). |
| **LettuceDetect** (KRLabs, arXiv 2502.17125) | 2025-02 | Token-level hallucination detector built on ModernBERT. Processes 30-60 examples/sec on single GPU. F1 of 79.22% on RAGTruth. Multilingual (7 languages as of v0.1.7). MIT license. | Production-ready OSS | **Very high**. Lightweight, fast, MIT-licensed. Can flag unsupported segments in Contexter answers. Under 600MB RAM. |
| **HaluGate** (vLLM Blog, 2025-12) | 2025-12 | Token-level truth detection integrated with vLLM serving. Two-stage: LettuceDetect for recall + NLI for precision/explainability. Real-time (~12ms with Rust/Candle). | Production prototype | Medium. Requires vLLM infrastructure. The two-stage pattern (fast detector + NLI verifier) is the key insight. |
| **GaRAGe Benchmark** (Amazon, ACL 2025 Findings) | 2025-06 | 2366 questions, 35K annotated passages, human-curated long-form answers with grounding annotations. New metric: Reference-Aware Factuality (RAF) score. Shows SOTA LLMs max out at 60% RAF. | Benchmark | High for evaluation. Can be used to benchmark Contexter's citation quality once implemented. |
| **"Correctness is not Faithfulness"** (Wallat et al., SIGIR 2025) | 2024-12 / 2025 | Formalizes distinction: a citation can be *correct* (document supports claim) but *unfaithful* (model didn't actually use that document — post-rationalization). Up to 57% of citations are post-rationalized. | Research | Critical conceptual insight. Prompt-based citations may look correct but be fabricated. Verification pass is not optional — it's essential. |
| **EvidenceRL** (arXiv 2603.19532) | 2026-03 | Reinforcement learning to train LLMs for evidence consistency. Reward signal based on whether generated text is supported by retrieved evidence. | Very recent research | Low for now. Requires RL training loop. But signals that the field is moving toward training-time grounding, not just inference-time. |

### 3.2 Open questions in the field

- **Post-rationalization detection**: How to tell if a citation is genuine (model used the source) vs. post-rationalized (model knew the answer and found a matching source)? SIGIR 2025 paper shows this affects up to 57% of citations. No production-ready solution exists.
- **Sub-sentence granularity cost**: Is the UX benefit of sub-sentence citations worth the implementation complexity? No user studies demonstrate clear preference over sentence-level.
- **Multilingual citation faithfulness**: Most benchmarks are English-only. Contexter serves Russian users primarily. Citation behavior in non-English languages is under-studied.
- **Calibration of NLI scores for citation thresholds**: What entailment probability threshold should trigger a citation? Current approaches use 0.5-0.6 but these are not well-calibrated across domains.

### 3.3 Bets worth making

- **LettuceDetect as verification layer**: MIT-licensed, fast (30-60 ex/sec), multilingual. Can be deployed on Cloudflare Workers (or as a sidecar) for real-time verification. Low risk, high trust signal for users.
- **Interleaved citation prompting (ReClaim pattern)**: Even without fine-tuning, the "reference first, then claim" prompt pattern may improve citation accuracy. Worth A/B testing against standard "[cite after claim]" pattern.
- **Structured output for citations**: Using JSON mode or tool-use format to force the LLM to output structured citation objects rather than inline text markers. Eliminates parsing errors at the cost of slightly more tokens.

---

## Layer 4: Cross-Disciplinary Transfer

### 4.1 Analogous problems in other fields

| Field | Analogous problem | Their solution | Transfer opportunity |
|---|---|---|---|
| **Supply chain management** | Tracking provenance of goods from origin to consumer. "Where did this come from? Can I trust it?" | Chain-of-custody documentation. Each handler signs/stamps. Blockchain for immutable audit trail. GS1 barcodes for unique identification. | Each chunk gets a unique "barcode" (already have `chunkId`). The answer generation creates a "chain of custody" log: claim -> source -> document. Immutable audit trail of which sources were used for which claims. |
| **Legal citation (law)** | Every legal argument must cite precedent. Judges reject uncited claims. | Formal citation systems (Bluebook, OSCOLA). Hierarchical: case > statute > commentary. Parallel citation for the same source in different reporters. Pinpoint citations (specific paragraph/page). | Formalize citation format. Different "weight" for different source types. Pinpoint citations (specific sentence in chunk, not just chunk ID). Consider a "citation score" like legal relevance ranking. |
| **Academic peer review** | Verifying that claims in a paper are supported by cited references. Reviewers check citations. | Peer reviewers manually verify key citations. Automated tools (scite.ai) classify citations as supporting/contrasting/mentioning. Citation context analysis. | Post-hoc verification pass = "automated peer review." Classify each citation as supporting/contradicting/tangential. Surface contradictions to the user. |
| **Journalism (source attribution)** | Every factual claim needs a named source. Editors verify sources before publication. "According to X..." or direct quotes with attribution. | Two-source rule for major claims. On-the-record vs. background. Fact-checking departments. Wire services have strict attribution standards. | Two-source rule: if a claim is supported by 2+ sources, confidence is higher. Flag single-source claims differently. The "according to [Source X]" pattern is natural for LLMs. |
| **Forensic accounting (audit trail)** | Tracing financial transactions back to source documents. Every number must be traceable. | Audit trail: every transaction links to a source document (invoice, receipt, contract). Materiality thresholds. Sampling methodology. | Materiality concept: not every word needs a citation. Focus citations on factual claims, numbers, names, dates. Skip citations for logical connectors and common knowledge. |

### 4.2 Biomimicry / Nature-inspired

- **Memory attribution in neuroscience**: Human episodic memory includes "source monitoring" — we remember not just facts but where we learned them (a person, a book, an experience). Source monitoring failures cause confabulation (the brain's version of hallucination). NLI verification is analogous to the brain's reality monitoring process that distinguishes real memories from imagined ones.

### 4.3 Engineering disciplines

- **Signal processing — Source separation**: In audio, blind source separation (BSS) decomposes a mixed signal into individual sources. Similarly, a RAG answer is a "mixed signal" of information from multiple sources. Citation is the process of "demixing" the answer back into its component sources.
- **Information theory — Mutual information**: The citation quality can be measured as mutual information I(claim; source) — how much knowing the cited source reduces uncertainty about the claim's truth. A perfect citation maximizes this mutual information. A hallucinated claim has I(claim; source) ≈ 0.
- **Control systems — Feedback loops**: The verification pass acts as a feedback controller. The generation model is the "plant," the NLI verifier is the "sensor," and the citation threshold is the "setpoint." A closed-loop system (generate → verify → flag/regenerate) is more robust than open-loop (generate → hope for the best).

---

## Layer 5: Mathematical Foundations

### 5.1 Current mathematical model

- **What math we use**: None for attribution. The answer is generated via autoregressive token prediction conditioned on context. Citations, if any, emerge from the model's token probabilities, not from an explicit attribution function.
- **Assumptions**: We assume the LLM will naturally attribute when asked. We assume the system prompt is sufficient to control citation behavior.
- **Where assumptions break**: LLMs are stochastic. Citation behavior is inconsistent across runs, models, and languages. The model may hallucinate citations (cite [3] when only 2 sources exist) or omit citations for supported claims. Up to 57% of citations may be post-rationalized (SIGIR 2025).

### 5.2 Alternative mathematical approaches

| Approach | From field | Key advantage | Complexity | Papers |
|---|---|---|---|---|
| **NLI entailment probability** | Computational linguistics | P(entailment \| premise=source, hypothesis=claim) gives a continuous score [0,1] for each claim-source pair. Can be thresholded for binary grounding decisions. | O(n*m) where n=claims, m=sources. DeBERTa-v3-large: ~12ms per pair. | MNLI benchmark; DeBERTa-v3 (He et al., 2023); HALT-RAG |
| **Bipartite matching (claims ↔ sources)** | Graph theory / Operations research | Model answer as a bipartite graph: claims on one side, sources on the other. Edge weight = entailment score. Optimal assignment maximizes total grounding. | O(n*m) for scoring + O(n^3) for Hungarian algorithm. In practice n,m < 20 so this is instant. | Classic assignment problem; applicable via scipy.optimize.linear_sum_assignment |
| **Information-theoretic attribution** | Information theory | Measure mutual information I(claim; source) using embedding similarity or NLI scores as proxy. High MI = strong attribution. | Requires computing conditional entropy, approximated by NLI scores. | Custom — no direct paper, but connects to work on probing LLM internal representations. |
| **Claim decomposition + independent verification** | RAGAS framework | Decompose answer into atomic claims. Verify each independently. Faithfulness = |supported claims| / |total claims|. | O(n) LLM calls for decomposition + O(n*m) NLI calls for verification. Most expensive approach. | RAGAS (Es et al., 2023); DeepEval |

### 5.3 Optimization opportunities

- **Current bottleneck**: No attribution computation at all — this is the bottleneck. Adding any form of structured citation is a step function improvement.
- **Better objective function**: Optimize for *faithfulness* (each claim is supported by a cited source) rather than *correctness* (the answer is factually true regardless of sources). Faithfulness is measurable against retrieved context; correctness requires external ground truth.
- **Approximation tricks**:
  - Skip NLI verification for short answers (< 3 sentences) — the risk of hallucination is lower.
  - Batch NLI calls: verify all claim-source pairs in a single model forward pass using cross-encoder batching.
  - Use embedding similarity as a fast pre-filter: only run NLI on pairs where cosine(claim_embedding, source_embedding) > 0.5.

### 5.4 Information-theoretic analysis

- **How much information is in our citations?** A citation `[k]` carries log2(K) bits where K = number of sources. For 5 sources, each citation carries ~2.3 bits. Sub-sentence citations carry more information (exact span) but at higher annotation cost.
- **Citation entropy**: If citations are uniformly distributed across sources, entropy is maximized — the answer uses all sources equally. If one source dominates, entropy is low. A balanced citation distribution may indicate better synthesis quality.
- **Compression vs. verification tradeoff**: More verbose answers with per-claim citations are easier to verify but costlier to generate and read. The optimal point is sentence-level citation (industry standard) — sufficient granularity for verification without excessive overhead.

### 5.5 Linear algebra / geometry insights

- **Claim-source alignment in embedding space**: A well-grounded claim should have high cosine similarity with its cited source embedding. This can be computed cheaply as a proxy for NLI verification. However, the "semantic illusion" paper (arXiv 2512.15068) shows that modern hallucinations are semantically indistinguishable from truth using vector similarity — embedding distance fails catastrophically for RLHF-aligned model hallucinations.
- **Practical implication**: Embedding similarity is useful as a fast pre-filter but MUST NOT be the sole verification method. NLI or LLM-as-judge is required for reliable grounding verification.

---

## Layer 6: Synthesis & Decision

### 6.1 Recommended approach: Three-tier citation system

**Tier 1 — Prompt-based inline citations (implement immediately)**
- **What**: Restructure the system prompt and context format to force numbered inline citations `[1]`, `[2]`, etc. Parse citations from the response. Map to source metadata. Return enriched `RagAnswer` with citation mappings.
- **Why**: Layers 2 + 3 converge: this is the universal standard (Perplexity, Google, Cohere, LlamaIndex). Zero additional cost. Works with any LLM. Migration effort is minimal.
- **Expected impact**: From 0% machine-parseable citations to ~70-85% of factual claims cited (based on industry benchmarks for prompted citation behavior).
- **Cost**: Zero additional API/model cost. 2-4 hours implementation.
- **Risk**: LLM may occasionally hallucinate citation numbers or skip citations. Mitigated by Tier 2.

**Tier 2 — Lightweight verification pass (implement after Tier 1 is validated)**
- **What**: After generation, decompose the answer into claims (sentences). For each claim, verify against cited source(s) using a lightweight NLI model (HHEM-2.1-Open or LettuceDetect). Flag unsupported claims. Compute a faithfulness score.
- **Why**: Layers 3 + 5 show that prompt-based citations alone have up to 57% post-rationalization. Verification catches hallucinated citations and unsupported claims. LettuceDetect is MIT-licensed, <600MB, processes 30-60 ex/sec.
- **Expected impact**: Faithfulness score visible to users. Unsupported claims flagged or stripped. Trust metric that differentiates Contexter from unverified RAG.
- **Cost**: +50-200ms latency per query (LettuceDetect on GPU) or +1-2s on CPU. No API cost if self-hosted. Alternatively, HHEM-2.1-Open runs on CPU under 1.5s for 2K tokens.
- **Risk**: Verification model has its own error rate (~79% F1 for LettuceDetect). May flag legitimate claims as unsupported or miss actual hallucinations.

**Tier 3 — External grounding API (evaluate later)**
- **What**: Use Google Vertex AI Check Grounding API or Cohere's grounded generation mode as a higher-quality verification backend.
- **Why**: Google's API returns support scores + claim-level citations. Cohere's Command-R returns character-level citation spans natively.
- **Expected impact**: Higher verification quality than self-hosted NLI. But adds external dependency and cost.
- **Cost**: Google: $35/1000 grounded requests ($0.035 per query). Cohere: model token pricing + grounded generation overhead.
- **Risk**: External dependency. Latency penalty. Cost scales linearly. Not suitable if Contexter targets cost-sensitive or offline deployments.

### 6.2 Implementation spec (Tier 1 — the immediate win)

**Input:** User query + retrieved chunks (already available in `RagService.query()`)

**Output:** Enhanced `RagAnswer` with:
```typescript
interface RagAnswer {
  answer: string                    // Answer text with inline [1], [2] citations
  sources: RagSource[]              // Existing source list (unchanged)
  citations: CitationMapping[]      // NEW: parsed citation-to-source mappings
  queryVariants: string[]
  tokenUsage: { ... }
}

interface CitationMapping {
  citationNumber: number            // The [N] reference in the answer
  sourceIndex: number               // Index into sources[] array
  sentenceText: string              // The sentence containing this citation
}
```

**Algorithm (step by step):**

1. **Enrich source labels** in `buildContext()`:
   Change from:
   ```
   [Source 1]
   {content}
   ```
   To:
   ```
   [1] (from: "{documentTitle}")
   {content}
   ```
   Include document title/filename if available in metadata.

2. **Replace system prompt** with citation-enforcing version:
   ```
   You are a helpful assistant answering questions based ONLY on the provided sources.

   CITATION RULES (mandatory):
   - Every factual statement MUST include a citation like [1], [2], etc.
   - The number refers to the source number in the context.
   - If multiple sources support a claim, cite all: [1][3].
   - Do NOT make claims that aren't supported by any source.
   - If sources don't contain enough information, say so clearly.
   - Answer in the same language as the question.
   - Be concise and direct.

   FORMAT EXAMPLE:
   The system uses a microservices architecture [1] with NATS as the message broker [2].
   Authentication is handled via OAuth 2.0 [1][3].
   ```

3. **Parse citations** from the generated answer:
   ```typescript
   function parseCitations(answer: string, sources: RagSource[]): CitationMapping[] {
     const sentences = answer.split(/(?<=[.!?])\s+/)
     const mappings: CitationMapping[] = []
     for (const sentence of sentences) {
       const refs = [...sentence.matchAll(/\[(\d+)\]/g)]
       for (const ref of refs) {
         const num = parseInt(ref[1])
         if (num >= 1 && num <= sources.length) {
           mappings.push({
             citationNumber: num,
             sourceIndex: num - 1,
             sentenceText: sentence.trim(),
           })
         }
       }
     }
     return mappings
   }
   ```

4. **Validate citations**: Check that all cited numbers exist in the sources array. Log warnings for invalid citations. Optionally strip invalid citation markers from the answer.

5. **Return enriched response** with `citations` array alongside existing `sources`.

**Config:**
- `citationFormat`: "inline" (default) | "footnote" (future)
- `requireCitations`: boolean (default true) — if true, system prompt enforces citations
- `maxSourcesPerClaim`: number (default 3) — limit citation density

**Fallback:** If the LLM ignores citation instructions (returns answer without `[N]` markers), fall back to returning the answer as-is with empty `citations[]`. The sources list is still available as before. No degradation from current behavior.

### 6.3 Validation plan

**How to measure improvement:**
1. **Citation coverage**: % of sentences in the answer that contain at least one `[N]` citation. Target: >80%.
2. **Citation validity**: % of `[N]` references that map to an actual source in the context. Target: >95%.
3. **Faithfulness score** (once Tier 2 is added): RAGAS-style faithfulness = supported claims / total claims. Target: >0.85.
4. **User trust signal**: Qualitative — do users click/verify cited sources? (Track if citation links are followed.)

**Minimum success criteria:**
- Tier 1: >70% of factual sentences contain valid inline citations after prompt change.
- Tier 2: Faithfulness score >0.80 with verification pass.

**Rollback trigger:**
- If citation prompt degrades answer quality (shorter, less helpful answers due to over-constraining)
- If latency of Tier 2 verification exceeds 3s per query on target hardware
- If false positive rate of verification (flagging correct claims as unsupported) > 20%

### 6.4 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| **Fine-tuning a model for grounded generation** (like Cohere Command-R) | Requires training infrastructure, dataset creation, and ongoing model maintenance. Overkill for Contexter's scale. Prompt-based approach achieves 70-85% of the benefit at near-zero cost. |
| **ReClaim interleaved generation** (reference-then-claim pattern) | Requires fine-tuning or very precise few-shot prompting that may not generalize across models. Worth experimenting with as a prompt variant but not as the primary approach. |
| **Sub-sentence citation** (Chen et al., 2025) | Over-engineering for current use case. Requires custom annotation, fine-tuning, or extremely complex prompting. Sentence-level is sufficient for Contexter's document Q&A use case. |
| **Google Vertex AI Check Grounding as primary** | $0.035 per query adds up at scale. Creates external dependency on Google Cloud. Adds 200-500ms latency. Better as an optional premium tier than the default. |
| **LLM-as-judge verification** (RAGAS/TruLens style) | Requires a second full LLM call per query. Doubles cost and latency. Overkill when lightweight NLI models (LettuceDetect, HHEM) provide comparable accuracy at 100x lower cost. |
| **Structured JSON output for citations** | Forces the model into JSON mode, which reduces answer fluency and readability. Inline `[N]` markers in natural language text are more user-friendly and easier to stream. |
| **Embedding similarity as sole verification** | The "semantic illusion" paper (2025) shows embedding-based verification fails catastrophically on modern hallucinations. RLHF-aligned models produce hallucinations that are semantically indistinguishable from truth in embedding space. NLI or classifier-based verification is required. |

---

## Appendix A: Key Models & Tools for Implementation

| Tool | Type | Size | Latency | License | Best for |
|---|---|---|---|---|---|
| **LettuceDetect** (ModernBERT) | Token-level hallucination detector | <600MB | 30-60 ex/sec GPU, ~1s CPU | MIT | Tier 2 verification. Fast, multilingual, open-source. |
| **HHEM-2.1-Open** (Vectara) | Hallucination evaluation classifier (T5-based) | ~600MB | <1.5s CPU for 2K tokens | Apache 2.0 | Alternative to LettuceDetect. Slightly different strengths. |
| **DeBERTa-v3-large-MNLI** | NLI cross-encoder | ~1.5GB | ~12ms per pair (GPU) | MIT | Fine-grained claim-source entailment scoring. Use for Tier 2 if per-claim verification needed. |
| **Cohere Command-R** | LLM with native citation | API only | Standard LLM latency | Commercial API | Drop-in replacement for generation step if Cohere pricing is acceptable. Citations "for free" in model output. |
| **Google Check Grounding API** | Verification API | N/A | 200-500ms | Pay-per-use ($35/1K) | Premium verification tier. Highest quality but highest cost. |
| **Cleanlab TLM** | Trustworthiness wrapper | Any LLM | 2-3x base LLM | Commercial | Wraps any LLM to add trustworthiness scores. Good for evaluation, expensive for production. |

## Appendix B: Exact System Prompt (recommended)

```
You are a helpful assistant answering questions based ONLY on the provided sources.

CITATION RULES (mandatory):
- Every factual statement MUST include an inline citation like [1], [2], etc. matching the source number.
- If multiple sources support a claim, cite all relevant ones: [1][3].
- Do NOT make any factual claim that is not directly supported by a provided source.
- If the sources don't contain enough information to answer, say: "The available sources don't contain enough information to answer this question."
- Never invent or assume information beyond what the sources state.

FORMATTING:
- Answer in the same language as the question.
- Be concise and direct.
- Use natural prose with inline citations, not bullet lists of source quotes.

EXAMPLE:
Sources say the system processes 10,000 requests per second [1] using a distributed architecture [2]. The caching layer reduces latency by 40% [1][3].
```

## Appendix C: Research Sources

### Papers
- Xia et al., "Ground Every Sentence: Improving Retrieval-Augmented LLMs with Interleaved Reference-Claim Generation," NAACL 2025 Findings. [arXiv:2407.01796](https://arxiv.org/abs/2407.01796), [GitHub](https://github.com/pdxthree/ReClaim)
- Chen et al., "Concise and Sufficient Sub-Sentence Citations for RAG," 2025. [arXiv:2509.20859](https://arxiv.org/abs/2509.20859)
- Wallat et al., "Correctness is not Faithfulness in RAG Attributions," SIGIR 2025. [arXiv:2412.18004](https://arxiv.org/pdf/2412.18004)
- HALT-RAG, "A Task-Adaptable Framework for Hallucination Detection with Calibrated NLI Ensembles," 2025. [arXiv:2509.07475](https://arxiv.org/abs/2509.07475)
- LettuceDetect, "A Hallucination Detection Framework for RAG Applications," 2025. [arXiv:2502.17125](https://arxiv.org/abs/2502.17125), [GitHub](https://github.com/KRLabsOrg/LettuceDetect)
- GaRAGe, "A Benchmark with Grounding Annotations for RAG Evaluation," ACL 2025 Findings. [arXiv:2506.07671](https://arxiv.org/abs/2506.07671), [GitHub](https://github.com/amazon-science/GaRAGe)
- Es et al., "RAGAS: Automated Evaluation of Retrieval Augmented Generation," 2023. [arXiv:2309.15217](https://arxiv.org/abs/2309.15217)
- HaluGate, "Token-Level Truth: Real-Time Hallucination Detection for Production LLMs," vLLM Blog, 2025-12. [Blog](https://blog.vllm.ai/2025/12/14/halugate.html)
- "The Semantic Illusion: Certified Limits of Embedding-Based Hallucination Detection," 2025. [arXiv:2512.15068](https://arxiv.org/html/2512.15068)

### Products & APIs
- [Perplexity AI Architecture](https://www.datastudios.org/post/perplexity-ai-models-explained-and-how-answers-are-generated-architecture-retrieval-model-selecti)
- [Cohere RAG Citations](https://docs.cohere.com/docs/rag-citations)
- [Cohere Grounded Summarization](https://docs.cohere.com/v2/page/grounded-summarization)
- [Google Vertex AI Check Grounding](https://docs.cloud.google.com/generative-ai-app-builder/docs/check-grounding)
- [Vertex AI Grounding Overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/overview)
- [RAGAS Faithfulness Metric](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)
- [Vectara HHEM-2.1](https://www.vectara.com/blog/hhem-2-1-a-better-hallucination-detection-model)
- [Cleanlab TLM](https://help.cleanlab.ai/tlm/)

### Implementation References
- [LlamaIndex Citation Query Engine](https://developers.llamaindex.ai/python/examples/workflow/citation_query_engine/)
- [Tensorlake Citation-Aware RAG](https://www.tensorlake.ai/blog/rag-citations)
- [RAG Prompt Engineering: Context Placement & Citation Strategies](https://mbrenndoerfer.com/writing/rag-prompt-engineering-context-citations)
- [Citations in the Key of RAG](https://cianfrani.dev/posts/citations-in-the-key-of-rag/)
- [Building Trustworthy RAG Systems with In-Text Citations](https://haruiz.github.io/blog/improve-rag-systems-reliability-with-citations)
- [RankStudio: LLM Citations Explained](https://rankstudio.net/articles/en/ai-citation-frameworks)
