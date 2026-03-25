import type { RagQuery, RagAnswer, RagConfig } from "./types"
import {
  DEFAULT_QUERY_REWRITE_COUNT,
  DEFAULT_MAX_CONTEXT_TOKENS,
  DEFAULT_SYSTEM_PROMPT,
} from "./types"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { HybridSearchResult } from "../vectorstore/types"
import { rewriteQuery } from "./rewriter"
import { buildContext } from "./context"

export type { RagQuery, RagAnswer, RagConfig, RagSource } from "./types"

export interface RagServiceDeps {
  ai: Ai
  embedder: EmbedderService
  vectorStore: VectorStoreService
  config?: RagConfig
  docsMeta?: string
}

export class RagService {
  private ai: Ai
  private embedder: EmbedderService
  private vectorStore: VectorStoreService
  private config: Required<RagConfig>
  private docsMeta: string

  constructor(deps: RagServiceDeps) {
    this.ai = deps.ai
    this.embedder = deps.embedder
    this.vectorStore = deps.vectorStore
    this.docsMeta = deps.docsMeta ?? ""
    this.config = {
      queryRewriteCount: deps.config?.queryRewriteCount ?? DEFAULT_QUERY_REWRITE_COUNT,
      maxContextTokens: deps.config?.maxContextTokens ?? DEFAULT_MAX_CONTEXT_TOKENS,
      systemPrompt: deps.config?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    }
  }

  async query(input: RagQuery): Promise<RagAnswer> {
    // 1. Rewrite query to N variants
    const queryVariants = await rewriteQuery(
      input.query,
      this.config.queryRewriteCount,
      this.ai
    )

    // 2. Embed all query variants
    const queryEmbeddings = await this.embedder.embedBatch(
      queryVariants,
      { task: "retrieval.query" }
    )

    // 3. Search with each variant, merge results
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

    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score)

    // 4. Build context from top results
    const { context, sources } = buildContext(
      allResults,
      this.config.maxContextTokens
    )

    // 5. Generate answer with LLM
    const { answer, promptTokens, completionTokens } = await this.generateAnswer(
      input.query,
      context
    )

    return {
      answer,
      sources,
      queryVariants,
      tokenUsage: {
        embeddingTokens: queryEmbeddings.totalTokens,
        llmPromptTokens: promptTokens,
        llmCompletionTokens: completionTokens,
      },
    }
  }

  private async generateAnswer(
    query: string,
    context: string
  ): Promise<{ answer: string; promptTokens: number; completionTokens: number }> {
    // Build full context: document metadata + search results
    const metaSection = this.docsMeta
      ? `\nDocuments in knowledge base:\n${this.docsMeta}\n`
      : ""
    const fullContext = `${metaSection}${context}`.trim()

    if (!fullContext || fullContext.length === 0) {
      return {
        answer: "В базе знаний пока нет документов. Загрузите файлы чтобы начать.",
        promptTokens: 0,
        completionTokens: 0,
      }
    }

    const messages = [
      { role: "system" as const, content: this.config.systemPrompt },
      {
        role: "user" as const,
        content: `Context:\n${fullContext}\n\nQuestion: ${query}`,
      },
    ]

    const response = await this.ai.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 1024,
    }) as AiResponse

    const answer = response?.response || ""
    const promptTokens = estimateTokens(this.config.systemPrompt + context + query)
    const completionTokens = estimateTokens(answer)

    return { answer, promptTokens, completionTokens }
  }
}

interface AiResponse {
  response?: string
}

function estimateTokens(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}
