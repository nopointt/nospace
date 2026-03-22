import type { Env } from "../types/env"
import { ParserService } from "./parsers"
import type { ParserInput, ParseResult } from "./parsers"
import { ChunkerService } from "./chunker"
import type { Chunk } from "./chunker"
import { EmbedderService } from "./embedder"
import type { BatchEmbeddingResult } from "./embedder"
import { VectorStoreService } from "./vectorstore"
import type { VectorRecord } from "./vectorstore"

export interface PipelineStageResult {
  stage: string
  status: "pending" | "running" | "done" | "error"
  durationMs?: number
  data?: unknown
  error?: string
}

export interface PipelineResult {
  documentId: string
  stages: PipelineStageResult[]
}

/**
 * Full ingestion pipeline: parse → chunk → embed → index.
 * Returns stage-by-stage results for dev UI visibility.
 */
export async function runPipeline(
  documentId: string,
  input: ParserInput,
  env: Env,
  userId?: string
): Promise<PipelineResult> {
  const stages: PipelineStageResult[] = [
    { stage: "parse", status: "pending" },
    { stage: "chunk", status: "pending" },
    { stage: "embed", status: "pending" },
    { stage: "index", status: "pending" },
  ]

  const parserService = new ParserService({
    ai: env.AI,
    groqApiUrl: env.GROQ_API_URL,
    groqApiKey: env.GROQ_API_KEY,
  })

  const chunkerService = new ChunkerService()

  const embedderService = new EmbedderService(
    env.JINA_API_URL,
    env.JINA_API_KEY
  )

  const vectorStoreService = new VectorStoreService({
    db: env.DB,
    vectorIndex: env.VECTOR_INDEX,
  })

  // Ensure FTS5 table exists
  await vectorStoreService.initialize()

  // --- Stage 1: Parse ---
  let parseResult: ParseResult
  try {
    stages[0].status = "running"
    const start = Date.now()
    parseResult = await parserService.parse(input)
    stages[0].status = "done"
    stages[0].durationMs = Date.now() - start
    stages[0].data = {
      contentLength: parseResult.content.length,
      wordCount: parseResult.metadata.wordCount,
      charCount: parseResult.metadata.charCount,
      sourceFormat: parseResult.metadata.sourceFormat,
      warnings: parseResult.metadata.warnings,
      contentPreview: parseResult.content.slice(0, 500),
    }
  } catch (e) {
    stages[0].status = "error"
    stages[0].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  // --- Stage 2: Chunk ---
  let chunks: Chunk[]
  try {
    stages[1].status = "running"
    const start = Date.now()
    chunks = chunkerService.chunk(
      parseResult.content,
      parseResult.metadata.sourceFormat
    )
    stages[1].status = "done"
    stages[1].durationMs = Date.now() - start
    stages[1].data = {
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      strategy: chunks[0]?.metadata.type ?? "unknown",
      chunks: chunks.map((c) => ({
        index: c.index,
        tokenCount: c.tokenCount,
        contentPreview: c.content.slice(0, 200),
        type: c.metadata.type,
      })),
    }
  } catch (e) {
    stages[1].status = "error"
    stages[1].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  // --- Stage 3: Embed ---
  let embedResult: BatchEmbeddingResult
  try {
    stages[2].status = "running"
    const start = Date.now()
    const texts = chunks.map((c) => c.content)
    embedResult = await embedderService.embedBatch(texts)
    stages[2].status = "done"
    stages[2].durationMs = Date.now() - start
    stages[2].data = {
      totalEmbeddings: embedResult.embeddings.length,
      dimensions: embedResult.embeddings[0]?.dimensions ?? 0,
      totalTokens: embedResult.totalTokens,
    }
  } catch (e) {
    stages[2].status = "error"
    stages[2].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  // --- Stage 4: Index ---
  try {
    stages[3].status = "running"
    const start = Date.now()

    // Insert chunks into D1 (required for FTS5 content table reference)
    for (const chunk of chunks) {
      const chunkId = `${documentId}-${chunk.index}`
      await env.DB.prepare(
        "INSERT OR REPLACE INTO chunks (id, document_id, user_id, content, chunk_index, token_count) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(chunkId, documentId, userId ?? "anonymous", chunk.content, chunk.index, chunk.tokenCount)
        .run()
    }

    const records: VectorRecord[] = chunks.map((chunk, i) => ({
      id: `${documentId}-${chunk.index}`,
      vector: embedResult.embeddings[i].vector,
      metadata: {
        documentId,
        chunkIndex: chunk.index,
        content: chunk.content,
      },
    }))

    await vectorStoreService.index(records)

    stages[3].status = "done"
    stages[3].durationMs = Date.now() - start
    stages[3].data = {
      vectorsIndexed: records.length,
      ftsIndexed: records.length,
    }
  } catch (e) {
    stages[3].status = "error"
    stages[3].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  return { documentId, stages }
}
