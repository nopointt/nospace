/**
 * Query decomposition — F-019.
 * Breaks a complex multi-part query into focused sub-questions,
 * answers each independently, then synthesizes a final answer.
 */

import type { LlmService } from "../llm"
import type { EmbedderService } from "../embedder"
import type { VectorStoreService } from "../vectorstore"
import type { RagConfig, RagSource } from "./types"
import { buildContext } from "./context"

export interface SubAnswer {
  subQuestion: string
  answer: string
  sources: RagSource[]
}

export interface DecompositionConfig {
  maxSubQuestions: number       // default: 5
  complexityThreshold: number   // default: 2 (matches COMPLEXITY_THRESHOLD in classifier)
}

export const DEFAULT_DECOMPOSITION_CONFIG: DecompositionConfig = {
  maxSubQuestions: 5,
  complexityThreshold: 2,
}

/**
 * Step 1: LLM decomposes the complex query into 2–maxSubQuestions independent sub-questions.
 * Returns parsed sub-questions array. Returns [originalQuery] on parse failure (safe fallback).
 */
export async function decomposeQuery(
  query: string,
  llm: LlmService,
  maxSubQuestions: number = DEFAULT_DECOMPOSITION_CONFIG.maxSubQuestions
): Promise<string[]> {
  const prompt = `You are a search query decomposer for a knowledge base. Break down the complex question into 2-5 independent sub-questions that together cover the full information need.

Rules:
- Each sub-question must be answerable independently from a knowledge base
- Keep ALL proper nouns, brand names, product names, and technical terms EXACTLY as they appear
- If the original question compares entities, create one sub-question per entity
- If the original question asks about a time range, create one sub-question per time period
- If the question asks "explain why" or "explain the trend", add a sub-question specifically for the causal/explanatory aspect
- Do NOT decompose further than necessary -- 2-3 sub-questions is typical, 5 is the maximum
- Return ONLY the sub-questions as a JSON array of strings, no explanations

Question: "${query}"`

  const result = await llm.chat([{ role: "user", content: prompt }], 512)

  try {
    // Extract JSON array from response (LLM may add surrounding text)
    const jsonMatch = result.response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error("No JSON array found in decomposition response")

    const parsed = JSON.parse(jsonMatch[0]) as unknown[]
    if (!Array.isArray(parsed)) throw new Error("Parsed result is not an array")

    const subQuestions = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, maxSubQuestions)

    if (subQuestions.length < 2) throw new Error("Fewer than 2 sub-questions parsed")

    return subQuestions
  } catch (err) {
    // Fallback: treat entire query as single question (standard path behavior)
    console.warn("Query decomposition parse failed, falling back to original query:", err)
    return [query]
  }
}

/**
 * Step 2: For each sub-question, retrieve context and generate a sub-answer.
 * All sub-questions are processed in parallel.
 */
export async function answerSubQuestions(
  subQuestions: string[],
  llm: LlmService,
  embedder: EmbedderService,
  vectorStore: VectorStoreService,
  ragConfig: Required<RagConfig>,
  searchOptions: { topK: number; scoreThreshold: number; userId?: string }
): Promise<SubAnswer[]> {
  const subAnswerPromises = subQuestions.map(async (subQuestion): Promise<SubAnswer> => {
    // Embed sub-question (single query, no rewriting — each sub-question is already focused)
    const embedResult = await embedder.embed(subQuestion, { task: "retrieval.query" })

    // Retrieve context for this sub-question
    const results = await vectorStore.search(
      embedResult.vector,
      subQuestion,
      searchOptions
    )

    const { context, sources } = buildContext(results, ragConfig.maxContextTokens)

    if (!context || context.length === 0) {
      return {
        subQuestion,
        answer: "No relevant information found for this aspect.",
        sources: [],
      }
    }

    // Generate focused sub-answer
    const llmResult = await llm.chat([
      {
        role: "user",
        content: `Answer this question based on the provided context: ${subQuestion}\n\nContext:\n${context}`,
      },
    ], 512)

    return {
      subQuestion,
      answer: llmResult.response.trim() || "No answer generated.",
      sources,
    }
  })

  return Promise.all(subAnswerPromises)
}

/**
 * Step 3: Synthesize N sub-answers into one final coherent answer.
 */
export async function synthesizeAnswers(
  originalQuery: string,
  subAnswers: SubAnswer[],
  llm: LlmService
): Promise<{ answer: string; promptTokens: number; completionTokens: number }> {
  const subAnswerBlock = subAnswers
    .map((sa) => `Q: ${sa.subQuestion}\nA: ${sa.answer}`)
    .join("\n\n")

  const prompt = `You are synthesizing a comprehensive answer from sub-answers to the original question.

Original question: "${originalQuery}"

Sub-answers:
${subAnswerBlock}

Rules:
- Combine the sub-answers into a single coherent response that fully addresses the original question
- If sub-answers conflict, note the discrepancy
- If any sub-answer says "not enough information", reflect that gap in your final answer
- Answer in the same language as the original question
- Cite which aspects come from which sub-answers`

  const result = await llm.chat([{ role: "user", content: prompt }], 1024)

  return {
    answer: result.response.trim() || "Could not synthesize a final answer.",
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  }
}
