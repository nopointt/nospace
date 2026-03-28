import type { RagQuery, RagAnswer, RagConfig, RagSource, RagStreamEvent } from "./types"
import {
  DEFAULT_QUERY_REWRITE_COUNT,
  DEFAULT_MAX_CONTEXT_TOKENS,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_MAX_SUB_QUESTIONS,
  DEFAULT_ENABLE_DECOMPOSITION,
} from "./types"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { HybridSearchResult } from "../vectorstore/types"
import type { LlmService } from "../llm"
import { RerankerService } from "../reranker"
import type { RerankCandidate } from "../reranker"
import { rewriteQuery } from "./rewriter"
import { buildContext } from "./context"
import { buildCitations, extractSentenceAroundCitation } from "./citations"
import type { CitationMapping } from "./citations"
import { nliService, NLI_THRESHOLD_VALUE } from "../nli"
import { classifyQueryEnhancement } from "./classifier"
import { classifyQuery } from "../vectorstore/classifier"
import { generateHyde } from "./hyde"
import { decomposeQuery, answerSubQuestions, synthesizeAnswers } from "./decomposition"
import { parseGroundingJson, assembleConfidence, computeFaithfulnessNli } from "./confidence"
import type { Sql } from "postgres"

export type { RagQuery, RagAnswer, RagConfig, RagSource, RagStreamEvent } from "./types"

export interface RagServiceDeps {
  llm: LlmService
  // F-015: separate answer model — if omitted, falls back to llm
  llmAnswer?: LlmService
  embedder: EmbedderService
  vectorStore: VectorStoreService
  reranker?: RerankerService
  config?: RagConfig
  docsMeta?: string
  // F-017: sql connection for parent chunk lookup — required for hierarchical chunks
  sql?: Sql
}

export class RagService {
  private deps: RagServiceDeps
  private config: Required<RagConfig>
  private docsMeta: string

  constructor(deps: RagServiceDeps) {
    this.deps = deps
    this.docsMeta = deps.docsMeta ?? ""
    this.config = {
      queryRewriteCount:   deps.config?.queryRewriteCount   ?? DEFAULT_QUERY_REWRITE_COUNT,
      maxContextTokens:    deps.config?.maxContextTokens    ?? DEFAULT_MAX_CONTEXT_TOKENS,
      systemPrompt:        deps.config?.systemPrompt        ?? DEFAULT_SYSTEM_PROMPT,
      maxSubQuestions:     deps.config?.maxSubQuestions     ?? DEFAULT_MAX_SUB_QUESTIONS,
      enableDecomposition: deps.config?.enableDecomposition ?? DEFAULT_ENABLE_DECOMPOSITION,
    }
  }

  async query(input: RagQuery): Promise<RagAnswer> {
    if (!input.query || input.query.trim().length === 0) {
      return {
        answer: "Please provide a question.",
        sources: [],
        citations: [],
        queryVariants: [],
        tokenUsage: { embeddingTokens: 0, llmPromptTokens: 0, llmCompletionTokens: 0 },
        retrievalLatencyMs: 0,
        generationLatencyMs: 0,
        embeddingL2NormMean: 0,
        confidence: assembleConfidence([], undefined, undefined),
      }
    }

    const { shouldHyde, shouldDecompose } = classifyQueryEnhancement(input.query)

    // F-019: complex path takes priority — decompose first
    if (this.config.enableDecomposition && shouldDecompose) {
      return this.queryDecomposed(input)
    }

    // F-018 + standard path
    return this.queryStandard(input, shouldHyde)
  }

  // F-018 + standard path: query rewrite + optional HyDE as 4th retrieval signal
  private async queryStandard(input: RagQuery, useHyde: boolean): Promise<RagAnswer> {
    // F-013: retrieval phase timer starts at query rewrite
    const retrievalStart = Date.now()

    // F-021: classify original query once to select adaptive alpha for CC fusion
    const { alpha } = classifyQuery(input.query)

    // Run rewrite and HyDE in parallel (zero serial latency increase)
    const [queryVariants, hydeResult] = await Promise.all([
      rewriteQuery(input.query, this.config.queryRewriteCount, this.deps.llm),
      useHyde
        ? generateHyde(input.query, this.deps.llm, this.deps.embedder).catch((err: Error) => {
            console.warn("HyDE generation failed, proceeding with query variants only:", err.message)
            return null
          })
        : Promise.resolve(null),
    ])

    const queryEmbeddings = await this.deps.embedder.embedBatch(
      queryVariants,
      { task: "retrieval.query" }
    )

    const allResults = await this.fetchResults(input, queryVariants, queryEmbeddings.embeddings, alpha)

    // F-018: HyDE as 4th additive signal (not replacement for any variant)
    if (hydeResult !== null && hydeResult.hypotheticalDoc.length > 0) {
      const seenIds = new Set(allResults.map((r) => r.id))
      const fetchTopK = (input.topK ?? 10) * 2
      const hydeSearchResults = await this.deps.vectorStore.search(
        hydeResult.vector,
        "",  // No FTS for HyDE — synthetic passage, not a real query
        { topK: fetchTopK, scoreThreshold: input.scoreThreshold ?? 0, userId: input.userId },
        alpha  // F-021: apply same alpha to HyDE search
      )
      for (const result of hydeSearchResults) {
        if (!seenIds.has(result.id)) {
          allResults.push(result)
        }
      }
    }

    const requestedTopK = input.topK ?? 10
    const ranked = await this.rankResults(allResults, input.query, requestedTopK)
    // F-017: replace child chunks with their parent content before building context
    const orderedResults = await this.resolveParents(ranked)
    const { context, sources } = buildContext(orderedResults, this.config.maxContextTokens)

    // F-013: retrieval phase ends, generation phase starts
    const retrievalLatencyMs = Date.now() - retrievalStart
    const generationStart = Date.now()

    const { answer: rawAnswer, promptTokens, completionTokens } = await this.generateAnswer(input.query, context)

    const generationLatencyMs = Date.now() - generationStart

    // Guard: empty LLM response → abstention
    if (rawAnswer.trim().length === 0) {
      return {
        answer: "I don't have enough information to answer this reliably.",
        sources: [], citations: [], queryVariants,
        tokenUsage: { embeddingTokens: queryEmbeddings.totalTokens, llmPromptTokens: promptTokens, llmCompletionTokens: completionTokens },
        retrievalLatencyMs, generationLatencyMs, embeddingL2NormMean: 0, context,
        confidence: assembleConfidence([], undefined, undefined),
      }
    }

    // F-013: mean L2 norm of query embedding vectors
    const embeddingL2NormMean = computeL2NormMean(
      queryEmbeddings.embeddings.map((e) => e.vector)
    )

    const embeddingTokens = queryEmbeddings.totalTokens + (hydeResult?.tokenCount ?? 0)

    // F-026: strip grounding JSON from answer tail
    const { answer: cleanAnswer, groundingScore } = parseGroundingJson(rawAnswer)

    const rawCitations = buildCitations(cleanAnswer, sources)

    // F-025: NLI citation verification (best-effort, degrades gracefully)
    // F-027: whole-answer faithfulness NLI (runs in parallel with F-025)
    const [{ verifiedCitations }, wholeFaithfulness] = await Promise.all([
      this.verifyClaimsNli(rawCitations, sources, cleanAnswer),
      computeFaithfulnessNli(context, cleanAnswer),
    ])

    // F-027: whole-answer faithfulness is the Tier 3 signal (more reliable than per-citation ratio)
    const confidence = assembleConfidence(sources, groundingScore, wholeFaithfulness)

    const finalAnswer = confidence.level === "insufficient"
      ? "I don't have enough information to answer this reliably."
      : cleanAnswer
    const finalSources = confidence.level === "insufficient" ? [] : sources
    const finalCitations = confidence.level === "insufficient" ? [] : verifiedCitations

    return {
      answer: finalAnswer,
      sources: finalSources,
      citations: finalCitations,
      queryVariants,
      tokenUsage: {
        embeddingTokens,
        llmPromptTokens: promptTokens,
        llmCompletionTokens: completionTokens,
      },
      retrievalLatencyMs,
      generationLatencyMs,
      embeddingL2NormMean,
      confidence,
      faithfulnessScore: wholeFaithfulness,
    }
  }

  // F-019: decompose complex query → parallel sub-answers → synthesize
  private async queryDecomposed(input: RagQuery): Promise<RagAnswer> {
    const searchOptions = {
      topK: input.topK ?? 10,
      scoreThreshold: input.scoreThreshold ?? 0,
      userId: input.userId,
    }

    // Step 1: Decompose (1 LLM call)
    const subQuestions = await decomposeQuery(
      input.query,
      this.deps.llm,
      this.config.maxSubQuestions
    )

    // Fallback: if decomposition returned only the original query, run standard path
    if (subQuestions.length === 1 && subQuestions[0] === input.query) {
      return this.queryStandard(input, classifyQueryEnhancement(input.query).shouldHyde)
    }

    // Step 2: Retrieve + answer each sub-question in parallel (N LLM calls + N embed + N search)
    const subAnswers = await answerSubQuestions(
      subQuestions,
      this.deps.llm,
      this.deps.embedder,
      this.deps.vectorStore,
      this.config,
      searchOptions
    )

    // Step 3: Synthesize (1 LLM call)
    const { answer: rawAnswer, promptTokens, completionTokens } = await synthesizeAnswers(
      input.query,
      subAnswers,
      this.deps.llm
    )

    // Collect all sources (deduplicated by chunkId)
    const allSources: RagSource[] = []
    const seenSourceIds = new Set<string>()
    for (const sa of subAnswers) {
      for (const src of sa.sources) {
        if (!seenSourceIds.has(src.chunkId)) {
          seenSourceIds.add(src.chunkId)
          allSources.push(src)
        }
      }
    }

    // F-026: strip grounding JSON from synthesized answer, assemble confidence
    const { answer: cleanAnswer, groundingScore } = parseGroundingJson(rawAnswer)

    // F-027: whole-answer faithfulness — build context string from all collected sources
    const decomposedContext = allSources.map((s) => s.content).join("\n\n")
    const wholeFaithfulness = await computeFaithfulnessNli(decomposedContext, cleanAnswer)

    const confidence = assembleConfidence(allSources, groundingScore, wholeFaithfulness)

    const finalAnswer = confidence.level === "insufficient"
      ? "I don't have enough information to answer this reliably."
      : cleanAnswer
    const finalSources = confidence.level === "insufficient" ? [] : allSources
    const finalCitations = confidence.level === "insufficient" ? [] : buildCitations(cleanAnswer, allSources)

    return {
      answer: finalAnswer,
      sources: finalSources,
      citations: finalCitations,
      queryVariants: subQuestions,  // surface sub-questions as "variants" for observability
      tokenUsage: {
        embeddingTokens: 0,          // TODO: sum from subAnswers when SubAnswer includes tokenCount
        llmPromptTokens: promptTokens,
        llmCompletionTokens: completionTokens,
      },
      retrievalLatencyMs: 0,
      generationLatencyMs: 0,
      embeddingL2NormMean: 0,
      confidence,
    }
  }

  // F-014: streaming variant — yields RagStreamEvent
  // NOTE: queryStream intentionally omits confidence scoring, citations, and NLI.
  // Streaming prioritizes TTFT. Use batch endpoint for confidence.
  async *queryStream(input: RagQuery): AsyncGenerator<RagStreamEvent> {
    // F-021: classify original query once to select adaptive alpha for CC fusion
    const { alpha } = classifyQuery(input.query)

    const queryVariants = await rewriteQuery(input.query, this.config.queryRewriteCount, this.deps.llm)

    const queryEmbeddings = await this.deps.embedder.embedBatch(
      queryVariants,
      { task: "retrieval.query" }
    )

    const allResults = await this.fetchResults(input, queryVariants, queryEmbeddings.embeddings, alpha)
    const requestedTopK = input.topK ?? 10
    const ranked = await this.rankResults(allResults, input.query, requestedTopK)
    // F-017: replace child chunks with their parent content before building context
    const orderedResults = await this.resolveParents(ranked)
    const { context, sources } = buildContext(orderedResults, this.config.maxContextTokens)
    const embeddingTokens = queryEmbeddings.totalTokens

    // Step 1: emit sources immediately after retrieval
    yield { type: "sources", sources, queryVariants, embeddingTokens }

    const messages = this.buildAnswerMessages(input.query, context)
    const answerLlm = this.deps.llmAnswer ?? this.deps.llm

    let llmPromptTokens = 0
    let llmCompletionTokens = 0

    try {
      if (!context || context.length === 0) {
        yield { type: "token", token: "В базе знаний пока нет документов. Загрузите файлы чтобы начать." }
      } else {
        // Step 2: stream tokens
        for await (const t of answerLlm.chatStream(messages, 1536)) {
          llmCompletionTokens += approximateTokenCount(t)
          yield { type: "token", token: t }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      yield { type: "error", message }
    }

    // Step 3: done is always last
    yield { type: "done", llmPromptTokens, llmCompletionTokens, embeddingTokens }
  }

  /**
   * F-025: Verify each citation against its source chunk using NLI.
   * Best-effort: returns citations unchanged if NLI unavailable or errors.
   */
  private async verifyClaimsNli(
    citations: CitationMapping[],
    sources: RagSource[],
    answer: string
  ): Promise<{ verifiedCitations: CitationMapping[]; faithfulnessScore: number | undefined }> {
    if (citations.length === 0 || !nliService.isAvailable()) {
      return { verifiedCitations: citations, faithfulnessScore: undefined }
    }

    const pairs = citations.map((cm) => ({
      premise: sources[cm.sourceIndex]?.content ?? "",
      hypothesis: extractSentenceAroundCitation(answer, cm.number),
    }))

    const scores = await nliService.scorePairs(pairs)
    if (scores === null) {
      return { verifiedCitations: citations, faithfulnessScore: undefined }
    }

    let verifiedCount = 0
    const verifiedCitations: CitationMapping[] = citations.map((cm, i) => {
      const nliScore = scores[i]
      if (nliScore === undefined) return cm
      const nliVerified = nliScore >= NLI_THRESHOLD_VALUE
      if (nliVerified) verifiedCount++
      return { ...cm, nliScore, nliVerified }
    })

    const faithfulnessScore = citations.length > 0 ? verifiedCount / citations.length : undefined

    return { verifiedCitations, faithfulnessScore }
  }

  /**
   * F-017: Replace child chunk results with their parent's full content.
   * De-duplicates: if two children share a parent, only the parent appears once (highest score wins).
   * Flat chunks and legacy chunks pass through unchanged.
   * No-op when sql is not provided in deps.
   */
  private async resolveParents(results: HybridSearchResult[]): Promise<HybridSearchResult[]> {
    if (!this.deps.sql) return results

    const childResults = results.filter(
      (r) => r.metadata.chunkType === "child" && r.metadata.parentId
    )
    const flatResults = results.filter(
      (r) => !r.metadata.chunkType || r.metadata.chunkType === "flat" || r.metadata.chunkType === "parent"
    )

    if (childResults.length === 0) return results

    const childIds = childResults.map((r) => r.id)
    const childScores = childResults.map((r) => r.score)

    const parentRows = await this.deps.vectorStore.fetchParentsForChildren(childIds, childScores)

    // Build HybridSearchResult entries from parent rows — deduplicated by parentId
    const parentMap = new Map<string, HybridSearchResult>()
    for (const row of parentRows) {
      if (!parentMap.has(row.parentId)) {
        // Approximate the documentId from the first child that had this parentId
        const firstChild = childResults.find((r) => r.metadata.parentId === row.parentId)
        parentMap.set(row.parentId, {
          id: row.parentId,
          score: row.bestChildScore,
          source: "vector" as const,
          metadata: {
            documentId: firstChild?.metadata.documentId ?? "",
            chunkIndex: -1,
            content: row.parentContent,
            chunkType: "parent",
          },
        })
      }
    }

    const resolved = [...Array.from(parentMap.values()), ...flatResults]
    return resolved.sort((a, b) => b.score - a.score)
  }

  /**
   * F-010: Rank results via reranker if available, otherwise sort by score descending.
   * Slices to topK before returning.
   */
  private async rankResults(
    results: HybridSearchResult[],
    query: string,
    topK: number
  ): Promise<HybridSearchResult[]> {
    if (this.deps.reranker) {
      const candidates: RerankCandidate[] = results.map((r) => ({
        id: r.id,
        text: r.metadata.content,
        originalScore: r.score,
      }))
      const reranked = await this.deps.reranker.rerank(query, candidates)

      const resultById = new Map(results.map((r) => [r.id, r]))
      return reranked
        .slice(0, topK)
        .map((r) => {
          const original = resultById.get(r.id)
          if (!original) return null
          return { ...original, score: r.relevanceScore }
        })
        .filter((r): r is HybridSearchResult => r !== null)
    }

    return [...results].sort((a, b) => b.score - a.score).slice(0, topK)
  }

  private async fetchResults(
    input: RagQuery,
    queryVariants: string[],
    embeddings: { vector: number[] }[],
    alpha?: number  // F-021: adaptive alpha from classifyQuery
  ): Promise<HybridSearchResult[]> {
    const requestedTopK = input.topK ?? 10
    // F-010: widen retrieval to give reranker a meaningful candidate pool
    const fetchTopK = requestedTopK * 2
    const allResults: HybridSearchResult[] = []
    const seenIds = new Set<string>()

    // Run all variant searches in parallel (was sequential)
    const searchPromises = queryVariants.map((variant, i) =>
      this.deps.vectorStore.search(
        embeddings[i]!.vector,
        variant,
        {
          topK: fetchTopK,
          scoreThreshold: input.scoreThreshold ?? 0,
          userId: input.userId,
        },
        alpha  // F-021: pass adaptive alpha to CC fusion
      )
    )
    const searchResults = await Promise.all(searchPromises)

    for (const results of searchResults) {
      for (const result of results) {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id)
          allResults.push(result)
        }
      }
    }

    return allResults
  }

  private async generateAnswer(
    query: string,
    context: string
  ): Promise<{ answer: string; promptTokens: number; completionTokens: number }> {
    const fullContext = this.buildFullContext(context)

    if (!fullContext || fullContext.length === 0) {
      return {
        answer: "В базе знаний пока нет документов. Загрузите файлы чтобы начать.",
        promptTokens: 0,
        completionTokens: 0,
      }
    }

    // F-015: use llmAnswer if provided, otherwise fall back to llm (rewrite model)
    const answerLlm = this.deps.llmAnswer ?? this.deps.llm
    const result = await answerLlm.chat(this.buildAnswerMessages(query, fullContext), 1024)

    return {
      answer: result.response,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    }
  }

  private buildFullContext(context: string): string {
    const metaSection = this.docsMeta
      ? `\nDocuments in knowledge base:\n${this.docsMeta}\n`
      : ""
    return `${metaSection}${context}`.trim()
  }

  private buildAnswerMessages(query: string, context: string): import("../llm").LlmMessage[] {
    const fullContext = context.length > 0 ? context : this.buildFullContext(context)
    return [
      { role: "system", content: this.config.systemPrompt },
      { role: "user", content: `Context:\n${fullContext}\n\nQuestion: ${query}` },
    ]
  }
}

// F-013: mean L2 norm across an array of embedding vectors
function computeL2NormMean(vectors: number[][]): number {
  if (vectors.length === 0) return 0
  const norms = vectors.map((v) => {
    const sumSq = v.reduce((acc, x) => acc + x * x, 0)
    return Math.sqrt(sumSq)
  })
  return norms.reduce((acc, n) => acc + n, 0) / norms.length
}

// Rough token count for streaming — ~4 chars per token
function approximateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}
