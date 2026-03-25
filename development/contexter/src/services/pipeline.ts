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

export type StageType = "parse" | "chunk" | "embed" | "index"

const STAGE_ORDER: readonly StageType[] = ["parse", "chunk", "embed", "index"] as const

// Per-stage timeout in ms. CF Workers kill waitUntil() tasks at ~30s wall clock.
// Parse can be slow for large PDFs (Workers AI). Embed can be slow for many chunks.
const STAGE_TIMEOUT_MS: Record<StageType, number> = {
  parse: 25_000,
  chunk: 5_000,
  embed: 25_000,
  index: 20_000,
}

/**
 * Run a stage function with a timeout. Rejects with a clear message if exceeded.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stageName: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Stage "${stageName}" timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

/**
 * Update a job row in D1. Creates immutable update (new prepared statement each call).
 */
async function updateJobStatus(
  db: D1Database,
  jobId: string,
  status: "pending" | "running" | "done" | "error",
  progress?: number,
  errorMessage?: string | null
): Promise<void> {
  await db.prepare(
    "UPDATE jobs SET status = ?, progress = ?, error_message = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, progress ?? 0, errorMessage ?? null, jobId).run()
}

/**
 * Create pending job rows for all 4 pipeline stages.
 * Returns a map of stageType -> jobId.
 */
export async function createPendingJobs(
  db: D1Database,
  documentId: string,
  userId: string
): Promise<Record<StageType, string>> {
  const jobIds: Record<string, string> = {}

  for (const stageType of STAGE_ORDER) {
    const jobId = `${documentId}-${stageType}`
    jobIds[stageType] = jobId

    await db.prepare(
      "INSERT OR REPLACE INTO jobs (id, document_id, user_id, type, status, progress, error_message, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', 0, NULL, datetime('now'), datetime('now'))"
    ).bind(jobId, documentId, userId, stageType).run()
  }

  return jobIds as Record<StageType, string>
}

/**
 * Full ingestion pipeline: parse -> chunk -> embed -> index.
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
        userId: userId ?? "anonymous",
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

/**
 * Run pipeline asynchronously with D1 job tracking.
 * Each stage writes status to the jobs table before and after execution.
 * On completion, updates the document status to "ready" or "error".
 */
export async function runPipelineAsync(
  documentId: string,
  input: ParserInput,
  env: Env,
  userId: string,
  jobIds: Record<StageType, string>
): Promise<void> {
  const db = env.DB

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

  await vectorStoreService.initialize()

  // --- Stage 1: Parse ---
  let parseResult: ParseResult
  try {
    await updateJobStatus(db, jobIds.parse, "running")
    parseResult = await withTimeout(
      parserService.parse(input),
      STAGE_TIMEOUT_MS.parse,
      "parse"
    )
    await updateJobStatus(db, jobIds.parse, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(db, jobIds.parse, "error", 0, msg)
    await updateDocumentStatus(db, documentId, "error", msg)
    return
  }

  // --- Stage 2: Chunk ---
  let chunks: Chunk[]
  try {
    await updateJobStatus(db, jobIds.chunk, "running")
    chunks = await withTimeout(
      Promise.resolve(chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)),
      STAGE_TIMEOUT_MS.chunk,
      "chunk"
    )
    await updateJobStatus(db, jobIds.chunk, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(db, jobIds.chunk, "error", 0, msg)
    await updateDocumentStatus(db, documentId, "error", msg)
    return
  }

  // --- Stage 3: Embed ---
  let embedResult: BatchEmbeddingResult
  try {
    await updateJobStatus(db, jobIds.embed, "running")
    const texts = chunks.map((c) => c.content)
    embedResult = await withTimeout(
      embedderService.embedBatch(texts),
      STAGE_TIMEOUT_MS.embed,
      "embed"
    )
    await updateJobStatus(db, jobIds.embed, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(db, jobIds.embed, "error", 0, msg)
    await updateDocumentStatus(db, documentId, "error", msg)
    return
  }

  // --- Stage 4: Index ---
  try {
    await updateJobStatus(db, jobIds.index, "running")

    const indexWork = async (): Promise<void> => {
      for (const chunk of chunks) {
        const chunkId = `${documentId}-${chunk.index}`
        await db.prepare(
          "INSERT OR REPLACE INTO chunks (id, document_id, user_id, content, chunk_index, token_count) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(chunkId, documentId, userId, chunk.content, chunk.index, chunk.tokenCount).run()
      }

      const records: VectorRecord[] = chunks.map((chunk, i) => ({
        id: `${documentId}-${chunk.index}`,
        vector: embedResult.embeddings[i].vector,
        metadata: {
          documentId,
          userId: userId ?? "anonymous",
          chunkIndex: chunk.index,
          content: chunk.content,
        },
      }))

      await vectorStoreService.index(records)
    }

    await withTimeout(indexWork(), STAGE_TIMEOUT_MS.index, "index")
    await updateJobStatus(db, jobIds.index, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(db, jobIds.index, "error", 0, msg)
    await updateDocumentStatus(db, documentId, "error", msg)
    return
  }

  // All stages complete -- mark document ready
  await updateDocumentStatus(db, documentId, "ready", null)
}

/**
 * Resume pipeline from a specific stage. Used by the retry endpoint.
 * Re-runs the failed stage and all subsequent stages.
 */
export async function resumePipelineFromStage(
  documentId: string,
  startFromStage: StageType,
  env: Env,
  userId: string,
  jobIds: Record<StageType, string>
): Promise<void> {
  const db = env.DB
  const startIndex = STAGE_ORDER.indexOf(startFromStage)

  // Reset failed and subsequent stages to pending
  for (let i = startIndex; i < STAGE_ORDER.length; i++) {
    const stageType = STAGE_ORDER[i]
    await updateJobStatus(db, jobIds[stageType], "pending", 0, null)
  }

  // Update document status back to processing
  await updateDocumentStatus(db, documentId, "processing", null)

  // We need to re-fetch file from R2 to re-run pipeline
  const doc = await db.prepare(
    "SELECT r2_key, name, mime_type, size FROM documents WHERE id = ?"
  ).bind(documentId).first<{ r2_key: string; name: string; mime_type: string; size: number }>()

  if (!doc) {
    await updateDocumentStatus(db, documentId, "error", "Document not found for retry")
    return
  }

  const r2Object = await env.STORAGE.get(doc.r2_key)
  if (!r2Object) {
    await updateDocumentStatus(db, documentId, "error", "File not found in R2 for retry")
    return
  }

  const buffer = await r2Object.arrayBuffer()
  const input: ParserInput = {
    file: buffer,
    fileName: doc.name,
    mimeType: doc.mime_type,
    fileSize: doc.size,
  }

  const parserService = new ParserService({
    ai: env.AI,
    groqApiUrl: env.GROQ_API_URL,
    groqApiKey: env.GROQ_API_KEY,
  })
  const chunkerService = new ChunkerService()
  const embedderService = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStoreService = new VectorStoreService({ db: env.DB, vectorIndex: env.VECTOR_INDEX })
  await vectorStoreService.initialize()

  // --- Stage 1: Parse (skip if already done) ---
  let parseResult: ParseResult | null = null
  if (startIndex <= 0) {
    try {
      await updateJobStatus(db, jobIds.parse, "running")
      parseResult = await parserService.parse(input)
      await updateJobStatus(db, jobIds.parse, "done", 100)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await updateJobStatus(db, jobIds.parse, "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  } else {
    // Parse already done -- re-parse to get content (no cached result in D1)
    try {
      parseResult = await parserService.parse(input)
    } catch (e) {
      const msg = `Retry failed: could not re-parse for stage recovery. ${e instanceof Error ? e.message : String(e)}`
      await updateJobStatus(db, jobIds[startFromStage], "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  }

  // --- Stage 2: Chunk (skip if already done and not retrying) ---
  let chunks: Chunk[] | null = null
  if (startIndex <= 1) {
    try {
      await updateJobStatus(db, jobIds.chunk, "running")
      chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)
      await updateJobStatus(db, jobIds.chunk, "done", 100)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await updateJobStatus(db, jobIds.chunk, "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  } else {
    // Chunk already done -- re-chunk to get content
    try {
      chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)
    } catch (e) {
      const msg = `Retry failed: could not re-chunk for stage recovery. ${e instanceof Error ? e.message : String(e)}`
      await updateJobStatus(db, jobIds[startFromStage], "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  }

  // --- Stage 3: Embed (skip if already done and not retrying) ---
  let embedResult: BatchEmbeddingResult | null = null
  if (startIndex <= 2) {
    try {
      await updateJobStatus(db, jobIds.embed, "running")
      const texts = chunks.map((c) => c.content)
      embedResult = await embedderService.embedBatch(texts)
      await updateJobStatus(db, jobIds.embed, "done", 100)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await updateJobStatus(db, jobIds.embed, "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  } else {
    // Embed already done -- re-embed to get vectors
    try {
      const texts = chunks.map((c) => c.content)
      embedResult = await embedderService.embedBatch(texts)
    } catch (e) {
      const msg = `Retry failed: could not re-embed for stage recovery. ${e instanceof Error ? e.message : String(e)}`
      await updateJobStatus(db, jobIds[startFromStage], "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  }

  // --- Stage 4: Index (always runs if we get here and startIndex <= 3) ---
  if (startIndex <= 3) {
    try {
      await updateJobStatus(db, jobIds.index, "running")

      for (const chunk of chunks) {
        const chunkId = `${documentId}-${chunk.index}`
        await db.prepare(
          "INSERT OR REPLACE INTO chunks (id, document_id, user_id, content, chunk_index, token_count) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(chunkId, documentId, userId, chunk.content, chunk.index, chunk.tokenCount).run()
      }

      const records: VectorRecord[] = chunks.map((chunk, i) => ({
        id: `${documentId}-${chunk.index}`,
        vector: embedResult!.embeddings[i].vector,
        metadata: {
          documentId,
          chunkIndex: chunk.index,
          content: chunk.content,
        },
      }))

      await vectorStoreService.index(records)
      await updateJobStatus(db, jobIds.index, "done", 100)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await updateJobStatus(db, jobIds.index, "error", 0, msg)
      await updateDocumentStatus(db, documentId, "error", msg)
      return
    }
  }

  // All stages complete
  await updateDocumentStatus(db, documentId, "ready", null)
}

/**
 * Update document status in D1.
 */
async function updateDocumentStatus(
  db: D1Database,
  documentId: string,
  status: string,
  errorMessage: string | null
): Promise<void> {
  await db.prepare(
    "UPDATE documents SET status = ?, error_message = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(status, errorMessage, documentId).run()
}
