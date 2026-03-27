import type { RagQuery, RagAnswer, RagConfig } from "./types"
import {
  DEFAULT_QUERY_REWRITE_COUNT,
  DEFAULT_MAX_CONTEXT_TOKENS,
  DEFAULT_SYSTEM_PROMPT,
} from "./types"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { HybridSearchResult } from "../vectorstore/types"
import type { LlmService } from "../llm"
import { rewriteQuery } from "./rewriter"
import { buildContext } from "./context"

export type { RagQuery, RagAnswer, RagConfig, RagSource } from "./types"

export interface RagServiceDeps {
  llm: LlmService
  embedder: EmbedderService
  vectorStore: VectorStoreService
  config?: RagConfig
  docsMeta?: string
}

export class RagService {
  private llm: LlmService
  private embedder: EmbedderService
  private vectorStore: VectorStoreService
  private config: Required<RagConfig>
  private docsMeta: string

  constructor(deps: RagServiceDeps) {
    this.llm = deps.llm
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
    const { answer, promptTokens, completionTokens } = await this.generateAnswer(input.query, context)

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

    const result = await this.llm.chat([
      { role: "system", content: this.config.systemPrompt },
      { role: "user", content: `Context:\n${fullContext}\n\nQuestion: ${query}` },
    ], 1024)

    return {
      answer: result.response,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
    }
  }
}
