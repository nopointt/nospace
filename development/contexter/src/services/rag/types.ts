export interface RagQuery {
  query: string
  userId?: string
  topK?: number
  scoreThreshold?: number
}

export interface RagAnswer {
  answer: string
  sources: RagSource[]
  queryVariants: string[]
  tokenUsage: {
    embeddingTokens: number
    llmPromptTokens: number
    llmCompletionTokens: number
  }
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

export const DEFAULT_QUERY_REWRITE_COUNT = 3
export const DEFAULT_MAX_CONTEXT_TOKENS = 3000
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant answering questions based on the provided context.
Rules:
- Use ONLY the information from the context below to answer.
- If a term in the question matches something in the context, treat it as the same thing even if spelling/case differs.
- Answer in the same language as the question.
- If the context contains the answer, give it directly — do not say "there is no information" when there is.
- If the context truly doesn't contain enough information, say so clearly.
- Cite relevant parts of the context in your answer.`
