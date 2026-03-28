import type { CitationMapping } from "./citations"

export interface RagQuery {
  query: string
  userId?: string
  topK?: number
  scoreThreshold?: number
}

export interface RagAnswer {
  answer: string
  sources: RagSource[]
  citations: CitationMapping[]   // [N] markers mapped to sources
  queryVariants: string[]
  tokenUsage: {
    embeddingTokens: number
    llmPromptTokens: number
    llmCompletionTokens: number
  }
  // F-013: latency instrumentation
  retrievalLatencyMs: number
  generationLatencyMs: number
  // F-013: mean L2 norm of query embedding vectors
  embeddingL2NormMean: number
  // F-031: assembled context string for LLM evaluation — populated by rag/index.ts
  context?: string
}

export interface RagSource {
  chunkId: string
  documentId: string
  content: string
  score: number
  source: "vector" | "fts" | "both"
}

export interface RagConfig {
  queryRewriteCount?: number
  maxContextTokens?: number
  systemPrompt?: string
}

// F-014: streaming event union — yielded by RagService.queryStream()
export type RagStreamEvent =
  | { type: "sources"; sources: RagSource[]; embeddingTokens: number }
  | { type: "token"; content: string }
  | { type: "done"; llmPromptTokens: number; llmCompletionTokens: number; embeddingTokens: number }
  | { type: "error"; message: string }

export const DEFAULT_QUERY_REWRITE_COUNT = 3
export const DEFAULT_MAX_CONTEXT_TOKENS = 3000
export const MMR_MAX_CHUNKS_PER_DOCUMENT = 3
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant answering questions based on the provided context.
Rules:
- Use ONLY the information from the context below to answer.
- If a term in the question matches something in the context, treat it as the same thing even if spelling/case differs.
- Answer in the same language as the question.
- If the context contains the answer, give it directly — do not say "there is no information" when there is.
- If the context truly doesn't contain enough information, say so clearly.
- Cite relevant parts of the context in your answer.`
