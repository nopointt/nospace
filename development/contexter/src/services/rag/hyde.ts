/**
 * HyDE (Hypothetical Document Embeddings) — F-018.
 * Generates a hypothetical passage that would answer the query,
 * then embeds it with retrieval.passage task (same as corpus documents).
 * This places the probe in document space rather than query space.
 */

import type { LlmService } from "../llm"
import type { EmbedderService } from "../embedder"

export interface HydeResult {
  hypotheticalDoc: string
  vector: number[]
  tokenCount: number
}

/**
 * HyDE: generate a hypothetical passage that would answer the query,
 * then embed it with retrieval.passage task (same as corpus documents).
 * This places the probe in document space rather than query space.
 */
export async function generateHyde(
  query: string,
  llm: LlmService,
  embedder: EmbedderService
): Promise<HydeResult> {
  const prompt = `Given the following question, write a short passage (3-5 sentences) that would appear in a knowledge base article answering this question. Write as if you are the author of the source document, not as someone answering a question. Include relevant technical terms and context.

Question: ${query}

Passage:`

  const llmResult = await llm.chat(
    [{ role: "user", content: prompt }],
    200  // 3-5 sentences ≈ 100-200 tokens; cap prevents runaway generation
  )

  const hypotheticalDoc = llmResult.response.trim()

  // CRITICAL: embed with retrieval.passage (not retrieval.query).
  // This places the vector in the same manifold region as corpus documents.
  const embedResult = await embedder.embed(hypotheticalDoc, { task: "retrieval.passage" })

  return {
    hypotheticalDoc,
    vector: embedResult.vector,
    tokenCount: embedResult.tokenCount,
  }
}
