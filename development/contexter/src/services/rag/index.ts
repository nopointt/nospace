import type { RagQuery, RagAnswer, RagConfig, RagSource, RagStreamEvent } from "./types"
import {
  DEFAULT_QUERY_REWRITE_COUNT,
  DEFAULT_MAX_CONTEXT_TOKENS,
  DEFAULT_SYSTEM_PROMPT,
} from "./types"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { HybridSearchResult } from "../vectorstore/types"
import type { LlmService } from "../llm"
import { RerankerService } from "../reranker"
import type { RerankCandidate } from "../reranker"
import { rewriteQuery } from "./rewriter"
import { buildContext } from "./context"
import { buildCitations } from "./citations"
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
      queryRewriteCount: deps.config?.queryRewriteCount ?? DEFAULT_QUERY_REWRITE_COUNT,
      maxContextTokens: deps.config?.maxContextTokens ?? DEFAULT_MAX_CONTEXT_TOKENS,
      systemPrompt: deps.config?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    }
  }

  async query(input: RagQuery): Promise<RagAnswer> {
    // F-013: retrieval phase timer starts at query rewrite
    const retrievalStart = Date.now()

    const queryVariants = await rewriteQuery(input.query, this.config.queryRewriteCount, this.deps.llm)

    const queryEmbeddings = await this.deps.embedder.embedBatch(
      queryVariants,
      { task: "retrieval.query" }
    )

    const allResults = await this.fetchResults(input, queryVariants, queryEmbeddings.embeddings)
    const requestedTopK = input.topK ?? 10
    const ranked = await this.rankResults(allResults, input.query, requestedTopK)
    // F-017: replace child chunks with their parent content before building context
    const orderedResults = await this.resolveParents(ranked)
    const { context, sources } = buildContext(orderedResults, this.config.maxContextTokens)

    // F-013: retrieval phase ends, generation phase starts
    const retrievalLatencyMs = Date.now() - retrievalStart
    const generationStart = Date.now()

    const { answer, promptTokens, completionTokens } = await this.generateAnswer(input.query, context)

    const generationLatencyMs = Date.now() - generationStart

    // F-013: mean L2 norm of query embedding vectors
    const embeddingL2NormMean = computeL2NormMean(
      queryEmbeddings.embeddings.map((e) => e.vector)
    )

    return {
      answer,
      sources,
      citations: buildCitations(answer, sources),
      queryVariants,
      tokenUsage: {
        embeddingTokens: queryEmbeddings.totalTokens,
        llmPromptTokens: promptTokens,
        llmCompletionTokens: completionTokens,
      },
      retrievalLatencyMs,
      generationLatencyMs,
      embeddingL2NormMean,
    }
  }

  // F-014: streaming variant — yields RagStreamEvent
  async *queryStream(input: RagQuery): AsyncGenerator<RagStreamEvent> {
    const queryVariants = await rewriteQuery(input.query, this.config.queryRewriteCount, this.deps.llm)

    const queryEmbeddings = await this.deps.embedder.embedBatch(
      queryVariants,
      { task: "retrieval.query" }
    )

    const allResults = await this.fetchResults(input, queryVariants, queryEmbeddings.embeddings)
    const requestedTopK = input.topK ?? 10
    const ranked = await this.rankResults(allResults, input.query, requestedTopK)
    // F-017: replace child chunks with their parent content before building context
    const orderedResults = await this.resolveParents(ranked)
    const { context, sources } = buildContext(orderedResults, this.config.maxContextTokens)
    const embeddingTokens = queryEmbeddings.totalTokens

    // Step 1: emit sources immediately after retrieval
    yield { type: "sources", sources, embeddingTokens }

    const messages = this.buildAnswerMessages(input.query, context)
    const answerLlm = this.deps.llmAnswer ?? this.deps.llm

    let llmPromptTokens = 0
    let llmCompletionTokens = 0

    try {
      if (!context || context.length === 0) {
        yield { type: "token", content: "В базе знаний пока нет документов. Загрузите файлы чтобы начать." }
      } else {
        // Step 2: stream tokens
        for await (const token of answerLlm.chatStream(messages, 1024)) {
          llmCompletionTokens += approximateTokenCount(token)
          yield { type: "token", content: token }
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
    embeddings: { vector: number[] }[]
  ): Promise<HybridSearchResult[]> {
    const requestedTopK = input.topK ?? 10
    // F-010: widen retrieval to give reranker a meaningful candidate pool
    const fetchTopK = requestedTopK * 2
    const allResults: HybridSearchResult[] = []
    const seenIds = new Set<string>()

    for (let i = 0; i < queryVariants.length; i++) {
      const results = await this.deps.vectorStore.search(
        embeddings[i]!.vector,
        queryVariants[i]!,
        {
          topK: fetchTopK,
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
