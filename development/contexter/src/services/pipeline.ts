import type { Sql } from "postgres"
import type { Env } from "../types/env"
import { ParserService } from "./parsers"
import type { ParserInput, ParseResult } from "./parsers"
import { ChunkerService } from "./chunker"
import type { Chunk } from "./chunker"
import { EmbedderService } from "./embedder"
import type { BatchEmbeddingResult } from "./embedder"
import { VectorStoreService } from "./vectorstore"
import type { VectorRecord } from "./vectorstore"
import { GetObjectCommand } from "@aws-sdk/client-s3"

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

// Timeouts relaxed — no CF Workers 30s wall clock limit on Bun
const STAGE_TIMEOUT_MS: Record<StageType, number> = {
  parse: 120_000,
  chunk: 30_000,
  embed: 120_000,
  index: 60_000,
}

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

async function updateJobStatus(
  sql: Sql,
  jobId: string,
  status: "pending" | "running" | "done" | "error",
  progress?: number,
  errorMessage?: string | null
): Promise<void> {
  await sql`
    UPDATE jobs SET status = ${status}, progress = ${progress ?? 0},
      error_message = ${errorMessage ?? null}, updated_at = NOW()
    WHERE id = ${jobId}
  `
}

export async function createPendingJobs(
  sql: Sql,
  documentId: string,
  userId: string
): Promise<Record<StageType, string>> {
  const jobIds: Record<string, string> = {}

  for (const stageType of STAGE_ORDER) {
    const jobId = `${documentId}-${stageType}`
    jobIds[stageType] = jobId

    await sql`
      INSERT INTO jobs (id, document_id, user_id, type, status, progress, error_message, created_at, updated_at)
      VALUES (${jobId}, ${documentId}, ${userId}, ${stageType}, 'pending', 0, NULL, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET status = 'pending', progress = 0, error_message = NULL, updated_at = NOW()
    `
  }

  return jobIds as Record<StageType, string>
}

function createServices(env: Env, sql: Sql) {
  const parserService = new ParserService({
    doclingUrl: env.DOCLING_URL,
    groqApiUrl: env.GROQ_API_URL,
    groqApiKey: env.GROQ_API_KEY,
  })
  const chunkerService = new ChunkerService()
  const embedderService = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStoreService = new VectorStoreService({ sql })
  return { parserService, chunkerService, embedderService, vectorStoreService }
}

export async function runPipeline(
  documentId: string,
  input: ParserInput,
  env: Env,
  sql: Sql,
  userId?: string
): Promise<PipelineResult> {
  const stages: PipelineStageResult[] = [
    { stage: "parse", status: "pending" },
    { stage: "chunk", status: "pending" },
    { stage: "embed", status: "pending" },
    { stage: "index", status: "pending" },
  ]

  const { parserService, chunkerService, embedderService, vectorStoreService } = createServices(env, sql)

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

  let chunks: Chunk[]
  try {
    stages[1].status = "running"
    const start = Date.now()
    chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)
    stages[1].status = "done"
    stages[1].durationMs = Date.now() - start
    stages[1].data = {
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
      strategy: chunks[0]?.metadata.type ?? "unknown",
    }
  } catch (e) {
    stages[1].status = "error"
    stages[1].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  let embedResult: BatchEmbeddingResult
  try {
    stages[2].status = "running"
    const start = Date.now()
    embedResult = await embedderService.embedBatch(chunks.map((c) => c.content), {
      lateChunking: true,
    })
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

  try {
    stages[3].status = "running"
    const start = Date.now()

    const chunkRows = chunks.map((chunk) => ({
      id: `${documentId}-${chunk.index}`,
      document_id: documentId,
      user_id: userId ?? "anonymous",
      content: chunk.content,
      chunk_index: chunk.index,
      token_count: chunk.tokenCount,
    }))
    await sql`
      INSERT INTO chunks ${sql(chunkRows)}
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, token_count = EXCLUDED.token_count
    `

    const records: VectorRecord[] = chunks.map((chunk, i) => ({
      id: `${documentId}-${chunk.index}`,
      vector: embedResult.embeddings[i].vector,
      metadata: { documentId, userId: userId ?? "anonymous", chunkIndex: chunk.index, content: chunk.content },
    }))
    await vectorStoreService.index(records)

    stages[3].status = "done"
    stages[3].durationMs = Date.now() - start
    stages[3].data = { vectorsIndexed: records.length, ftsIndexed: records.length }
  } catch (e) {
    stages[3].status = "error"
    stages[3].error = e instanceof Error ? e.message : String(e)
    return { documentId, stages }
  }

  return { documentId, stages }
}

export async function runPipelineAsync(
  documentId: string,
  input: ParserInput,
  env: Env,
  sql: Sql,
  userId: string,
  jobIds: Record<StageType, string>
): Promise<void> {
  const { parserService, chunkerService, embedderService, vectorStoreService } = createServices(env, sql)

  const MAX_DECOMPRESSED_BYTES = 50 * 1024 * 1024

  let parseResult: ParseResult
  try {
    await updateJobStatus(sql, jobIds.parse, "running")
    parseResult = await withTimeout(parserService.parse(input), STAGE_TIMEOUT_MS.parse, "parse")
    // NEW-007: zip bomb protection — reject documents whose decompressed content exceeds 50MB
    if (parseResult.content.length > MAX_DECOMPRESSED_BYTES) {
      const msg = "decompressed content exceeds 50MB limit"
      await updateJobStatus(sql, jobIds.parse, "error", 0, msg)
      await updateDocumentStatus(sql, documentId, "failed", msg)
      return
    }
    await updateJobStatus(sql, jobIds.parse, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.parse, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  let chunks: Chunk[]
  try {
    await updateJobStatus(sql, jobIds.chunk, "running")
    chunks = await withTimeout(
      Promise.resolve(chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)),
      STAGE_TIMEOUT_MS.chunk, "chunk"
    )
    await updateJobStatus(sql, jobIds.chunk, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.chunk, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  let embedResult: BatchEmbeddingResult
  try {
    await updateJobStatus(sql, jobIds.embed, "running")
    embedResult = await withTimeout(
      embedderService.embedBatch(chunks.map((c) => c.content), {
        lateChunking: true,
      }),
      STAGE_TIMEOUT_MS.embed, "embed"
    )
    await updateJobStatus(sql, jobIds.embed, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.embed, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  try {
    await updateJobStatus(sql, jobIds.index, "running")

    const chunkRows = chunks.map((chunk) => ({
      id: `${documentId}-${chunk.index}`,
      document_id: documentId,
      user_id: userId,
      content: chunk.content,
      chunk_index: chunk.index,
      token_count: chunk.tokenCount,
    }))
    await sql`
      INSERT INTO chunks ${sql(chunkRows)}
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, token_count = EXCLUDED.token_count
    `

    const records: VectorRecord[] = chunks.map((chunk, i) => ({
      id: `${documentId}-${chunk.index}`,
      vector: embedResult.embeddings[i].vector,
      metadata: { documentId, userId, chunkIndex: chunk.index, content: chunk.content },
    }))
    await vectorStoreService.index(records)

    await updateJobStatus(sql, jobIds.index, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.index, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  await updateDocumentStatus(sql, documentId, "ready", null)
}

export async function resumePipelineFromStage(
  documentId: string,
  startFromStage: StageType,
  env: Env,
  sql: Sql,
  userId: string,
  jobIds: Record<StageType, string>
): Promise<void> {
  const startIndex = STAGE_ORDER.indexOf(startFromStage)

  for (let i = startIndex; i < STAGE_ORDER.length; i++) {
    await updateJobStatus(sql, jobIds[STAGE_ORDER[i]], "pending", 0, null)
  }
  await updateDocumentStatus(sql, documentId, "processing", null)

  const docs = await sql`SELECT r2_key, name, mime_type, size FROM documents WHERE id = ${documentId}`
  if (docs.length === 0) {
    await updateDocumentStatus(sql, documentId, "error", "Document not found for retry")
    return
  }
  const doc = docs[0]

  // Fetch file from R2 via S3 API
  const cmd = new GetObjectCommand({ Bucket: env.storageBucket, Key: doc.r2_key as string })
  const r2Res = await env.storage.send(cmd)
  if (!r2Res.Body) {
    await updateDocumentStatus(sql, documentId, "error", "File not found in R2 for retry")
    return
  }
  const buffer = await r2Res.Body.transformToByteArray()

  // P3-014: buffer.buffer may be larger than the Uint8Array view — slice to exact bounds
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

  const input: ParserInput = {
    file: arrayBuffer as ArrayBuffer,
    fileName: doc.name as string,
    mimeType: doc.mime_type as string,
    fileSize: doc.size as number,
  }

  const { parserService, chunkerService, embedderService, vectorStoreService } = createServices(env, sql)

  // Re-parse (needed for all retry paths)
  let parseResult: ParseResult
  try {
    if (startIndex <= 0) await updateJobStatus(sql, jobIds.parse, "running")
    parseResult = await parserService.parse(input)
    if (startIndex <= 0) await updateJobStatus(sql, jobIds.parse, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds[startFromStage], "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  let chunks: Chunk[]
  try {
    if (startIndex <= 1) await updateJobStatus(sql, jobIds.chunk, "running")
    chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat)
    if (startIndex <= 1) await updateJobStatus(sql, jobIds.chunk, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds[startFromStage], "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  let embedResult: BatchEmbeddingResult
  try {
    if (startIndex <= 2) await updateJobStatus(sql, jobIds.embed, "running")
    embedResult = await embedderService.embedBatch(chunks.map((c) => c.content), {
      lateChunking: true,
    })
    if (startIndex <= 2) await updateJobStatus(sql, jobIds.embed, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds[startFromStage], "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  if (startIndex <= 3) {
    try {
      await updateJobStatus(sql, jobIds.index, "running")
      const chunkRows = chunks.map((chunk) => ({
        id: `${documentId}-${chunk.index}`,
        document_id: documentId,
        user_id: userId,
        content: chunk.content,
        chunk_index: chunk.index,
        token_count: chunk.tokenCount,
      }))
      await sql`
        INSERT INTO chunks ${sql(chunkRows)}
        ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, token_count = EXCLUDED.token_count
      `
      // P1-011: include userId in metadata for vector scope filtering on retry
      const records: VectorRecord[] = chunks.map((chunk, i) => ({
        id: `${documentId}-${chunk.index}`,
        vector: embedResult.embeddings[i].vector,
        metadata: { documentId, userId, chunkIndex: chunk.index, content: chunk.content },
      }))
      await vectorStoreService.index(records)
      await updateJobStatus(sql, jobIds.index, "done", 100)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await updateJobStatus(sql, jobIds.index, "error", 0, msg)
      await updateDocumentStatus(sql, documentId, "error", msg)
      return
    }
  }

  await updateDocumentStatus(sql, documentId, "ready", null)
}

async function updateDocumentStatus(sql: Sql, documentId: string, status: string, errorMessage: string | null): Promise<void> {
  await sql`UPDATE documents SET status = ${status}, error_message = ${errorMessage}, updated_at = NOW() WHERE id = ${documentId}`
}
