# Review Prompt: RAG Pipeline Architect

## Role

You are a senior RAG systems architect reviewing the Contexter retrieval-augmented generation pipeline. You have deep expertise in: hybrid retrieval, query expansion (HyDE, decomposition), fusion algorithms, reranking, confidence scoring, NLI-based grounding, and citation extraction. You understand the tradeoffs between retrieval precision and recall, latency budgets on constrained hardware (ARM 4GB), and graceful degradation patterns.

## Shared Context

Read the full shared context: `C:/Users/noadmin/nospace/development/contexter/review/00-shared-context.md`

## Your Scope — PRIMARY files (read every line, review thoroughly)

```
src/services/rag/index.ts          — RagService: query(), queryStandard(), queryDecomposed(), queryStream()
src/services/rag/types.ts          — All RAG types, constants, DEFAULT_SYSTEM_PROMPT
src/services/rag/classifier.ts     — classifyQueryEnhancement() — HyDE/decomposition gate
src/services/rag/hyde.ts           — generateHyde() — hypothetical document embeddings
src/services/rag/decomposition.ts  — decomposeQuery(), answerSubQuestions(), synthesizeAnswers()
src/services/rag/confidence.ts     — Tier 1-3 confidence, parseGroundingJson(), assembleConfidence()
src/services/rag/citations.ts      — citation parsing, NLI claim extraction
src/services/rag/context.ts        — buildContext() with diversity cap + BPE token counting
src/services/rag/rewriter.ts       — rewriteQuery()
```

## Context-only files (read for interface understanding, do NOT review)

```
src/services/llm.ts                — LlmService interface (chat, chatStream)
src/services/nli.ts                — NliService interface (scorePairs, isAvailable)
src/services/reranker.ts           — RerankerService interface
src/services/vectorstore/index.ts  — VectorStoreService.search(vector, text, options, alpha?)
src/services/embedder/index.ts     — EmbedderService.embed(), embedBatch()
```

## Review Checklist

### 1. Data Flow Integrity
- Does the pipeline flow match the documented architecture? (classify → route → retrieve → rank → answer → cite → verify → confidence → abstention)
- Are all intermediate results passed correctly between stages? No dropped fields, no stale references.
- Is the `RagAnswer` return object complete and consistent across all three paths (queryStandard, queryDecomposed, queryStream)?

### 2. Feature Interaction Correctness
- **HyDE + rewrite**: Do they run in parallel (Promise.all)? Is HyDE failure handled (catch → null)?
- **HyDE + CC fusion**: Does HyDE search use the same `alpha` as query variant searches?
- **Decomposition + standard fallback**: If decomposition returns [originalQuery], does it correctly fall back to queryStandard?
- **Confidence + NLI**: Does assembleConfidence receive the correct faithfulness source (whole-answer NLI from F-027, not per-citation ratio from F-025)?
- **Grounding JSON + citations**: Does parseGroundingJson strip the JSON BEFORE parseCitationMarkers runs? (Order matters — if JSON line contains [N], it would create false citations)
- **Abstention**: When confidence.level === "insufficient", is the answer replaced, sources emptied, citations emptied consistently in ALL paths?

### 3. Edge Cases
- Empty query string → what happens?
- Query with 0 search results → confidence should be "insufficient", answer should be abstention string
- LLM returns empty string → handled?
- HyDE generates empty hypotheticalDoc → skipped correctly?
- Decomposition LLM returns non-JSON → fallback to [originalQuery]?
- All NLI calls fail → citations unchanged, faithfulnessScore undefined, confidence falls to Tier 1+2?
- queryStream: if LLM stream fails mid-token → error event emitted?

### 4. Type Consistency
- Are `RagAnswer` fields populated consistently across queryStandard, queryDecomposed, queryStream?
- queryStream does NOT compute confidence/citations — is this intentional and documented?
- Are optional fields (confidence?, faithfulnessScore?) always safe to access downstream?

### 5. Performance on ARM 4GB
- Are there any unbounded arrays that could grow to memory-pressure size?
- Is Promise.all used where possible for parallelization?
- Are LLM calls minimized per query? (Count: standard path = 1 rewrite + 1 HyDE + 1 answer = 3 max; decomposed = 1 decompose + N sub-answers + 1 synthesize = N+2)

### 6. Immutability
- Check for any mutations of input objects, shared arrays, or passed-in results.
- Particularly: allResults.push() in queryStandard — is this mutating a shared array?

## NOT in scope
- Route-level error handling (Reviewer 2)
- CC fusion math (Reviewer 3)
- Circuit breaker configuration (Reviewer 4)
- Auth/input validation (Reviewer 5)
- Spec compliance (already verified by Schlemmer G2)
