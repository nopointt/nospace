import type { Sql } from "postgres"
import type { Env } from "../types/env"
import { ParserService } from "./parsers"
import type { ParserInput, ParseResult, StoredImage } from "./parsers"
import { ChunkerService } from "./chunker"
import type { Chunk } from "./chunker"
import { EmbedderService } from "./embedder"
import type { BatchEmbeddingResult } from "./embedder"
import { CachedEmbedderService } from "./embedder/cache"
import { ImageEmbedderService } from "./embedder/image"
import { VectorStoreService } from "./vectorstore"
import type { VectorRecord } from "./vectorstore"
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { addContextualPrefixes } from "./chunker/contextual"
import { ensureEncoderLoaded } from "./chunker/tokenizer"
import { findNearDuplicate } from "./embedder/dedup"
import { scanForInjection } from "./content-filter"

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
  const rawEmbedder = new EmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const embedderService = new CachedEmbedderService(rawEmbedder, env.redis)
  const imageEmbedderService = new ImageEmbedderService(env.JINA_API_URL, env.JINA_API_KEY)
  const vectorStoreService = new VectorStoreService({ sql })
  return { parserService, chunkerService, embedderService, imageEmbedderService, vectorStoreService }
}

/**
 * Store extracted images to R2 and return StoredImage[] with r2Keys.
 * Non-fatal: logs and returns empty array on failure.
 */
async function storeImagesToR2(
  parseResult: ParseResult,
  documentId: string,
  userId: string,
  env: Env,
): Promise<StoredImage[]> {
  if (!parseResult.images || parseResult.images.length === 0) return []

  const stored: StoredImage[] = []
  for (const [i, img] of parseResult.images.entries()) {
    try {
      const imageBuffer = Buffer.from(img.base64, "base64")
      const r2Key = `${userId}/${documentId}/images/p${img.page}_i${i}.png`
      await env.storage.send(new PutObjectCommand({
        Bucket: env.storageBucket,
        Key: r2Key,
        Body: imageBuffer,
        ContentType: img.mimeType,
      }))
      stored.push({ ...img, r2Key })
    } catch (e) {
      console.warn(JSON.stringify({
        event: "image_r2_store_failed",
        documentId,
        page: img.page,
        index: i,
        error: e instanceof Error ? e.message : String(e),
      }))
    }
  }
  return stored
}

/**
 * Build image Chunk objects from stored images, appended after text chunks.
 */
function buildImageChunks(storedImages: StoredImage[], startIndex: number): Chunk[] {
  return storedImages.map((img, i) => ({
    index: startIndex + i,
    content: img.caption ?? `[Image from page ${img.page}]`,
    tokenCount: 10,
    startOffset: 0,
    endOffset: 0,
    metadata: {
      type: "semantic" as const,
      page: img.page,
    },
    chunkType: "flat" as const,
    // Carry image-specific info in an extension field read during index stage
    _imageR2Key: img.r2Key,
    _imageMimeType: img.mimeType,
    _imageBase64: img.base64,
    _imageWidth: img.width,
    _imageHeight: img.height,
  } as Chunk & ImageChunkExt))
}

/** Extra fields carried on image chunks through the embed → index stages. */
interface ImageChunkExt {
  _imageR2Key: string
  _imageMimeType: string
  _imageBase64: string
  _imageWidth: number
  _imageHeight: number
}

/**
 * Resolve parentIndex (position in parents array) → parent_id (DB chunk ID).
 * For hierarchical chunks, each child's parentIndex refers to the Nth parent chunk.
 * Returns a Map from child chunk.index → parent DB ID string.
 */
function resolveParentIds(chunks: Chunk[], documentId: string): Map<number, string> {
  const parents = chunks.filter((c) => c.chunkType === "parent")
  const map = new Map<number, string>()
  for (const chunk of chunks) {
    if (chunk.chunkType === "child" && chunk.parentIndex !== undefined) {
      const parent = parents[chunk.parentIndex]
      if (parent) {
        map.set(chunk.index, `${documentId}-${parent.index}`)
      }
    }
  }
  return map
}

/**
 * Build DB rows for chunks, separating canonical from duplicate.
 * Includes parent_id for hierarchical chunks.
 */
async function buildChunkRows(
  chunks: Chunk[],
  embedResult: BatchEmbeddingResult,
  documentId: string,
  userId: string,
  sql: Sql,
  parentIdMap: Map<number, string>,
): Promise<{ canonicalRows: object[]; duplicateRows: object[] }> {
  const canonicalRows: object[] = []
  const duplicateRows: object[] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    const ext = chunk as Chunk & Partial<ImageChunkExt>
    const embedding = embedResult.embeddings[i]!.vector
    const duplicateOf = await findNearDuplicate(sql, embedding, userId)
    const isImage = ext._imageR2Key !== undefined
    const row = {
      id: `${documentId}-${chunk.index}`,
      document_id: documentId,
      user_id: userId,
      content: chunk.content,
      chunk_index: chunk.index,
      token_count: chunk.tokenCount,
      context_prefix: chunk.contextPrefix ?? null,
      context_version: chunk.contextPrefix ? 1 : 0,
      duplicate_of: duplicateOf ?? null,
      chunk_type: isImage ? "image" : (chunk.chunkType ?? "flat"),
      parent_id: parentIdMap.get(chunk.index) ?? null,
      page_number: chunk.metadata.page ?? null,
      section_heading: isImage ? (ext._imageR2Key ?? null) : (chunk.metadata.sectionHeading ?? null),
    }
    if (duplicateOf !== null) {
      duplicateRows.push(row)
    } else {
      canonicalRows.push(row)
    }
  }

  return { canonicalRows, duplicateRows }
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

  const { parserService, chunkerService, embedderService, imageEmbedderService, vectorStoreService } = createServices(env, sql)

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

  // Store extracted images to R2 (non-fatal, best-effort)
  const resolvedUserId = userId ?? "anonymous"
  const storedImages = await storeImagesToR2(parseResult, documentId, resolvedUserId, env)

  // Warm up BPE encoder before synchronous chunking to avoid wordCount*1.4 fallback
  await ensureEncoderLoaded()

  let chunks: Chunk[]
  try {
    stages[1].status = "running"
    const start = Date.now()
    chunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat, {
      doclingElements: parseResult.doclingElements,
    })

    // Append image chunks after text chunks
    if (storedImages.length > 0) {
      chunks = [...chunks, ...buildImageChunks(storedImages, chunks.length)]
    }

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

  // F-020: contextual prefix (non-fatal — proceed without if Groq fails)
  // Only apply to text chunks (image chunks have no contextual prefix)
  const imageChunkStart = chunks.length - storedImages.length
  try {
    const textChunks = chunks.slice(0, imageChunkStart)
    const contextualizedText = await addContextualPrefixes(
      parseResult.content,
      textChunks,
      env.GROQ_LLM_URL,
      env.GROQ_API_KEY,
      env.GROQ_LLM_MODEL
    )
    chunks = [...contextualizedText, ...chunks.slice(imageChunkStart)]
  } catch (e) {
    console.warn("contextual prefix generation failed, proceeding without:", e instanceof Error ? e.message : String(e))
  }

  let embedResult: BatchEmbeddingResult
  try {
    stages[2].status = "running"
    const start = Date.now()

    const textEmbedResult = await embedderService.embedBatch(
      chunks.slice(0, imageChunkStart).map((c) => c.content),
      { lateChunking: true },
    )

    // Embed image chunks with jina-clip-v2 (separate model — see image.ts TODO)
    let imageEmbedResult: BatchEmbeddingResult = { embeddings: [], totalTokens: 0 }
    if (storedImages.length > 0) {
      imageEmbedResult = await imageEmbedderService.embedImages(
        storedImages.map((img) => img.base64),
        storedImages.map((img) => img.mimeType),
      )
    }

    embedResult = {
      embeddings: [...textEmbedResult.embeddings, ...imageEmbedResult.embeddings],
      totalTokens: textEmbedResult.totalTokens + imageEmbedResult.totalTokens,
    }

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

    const parentIdMap = resolveParentIds(chunks, documentId)
    const { canonicalRows, duplicateRows } = await buildChunkRows(
      chunks, embedResult, documentId, resolvedUserId, sql, parentIdMap,
    )

    const allRows = [...canonicalRows, ...duplicateRows]
    await sql`
      INSERT INTO chunks ${sql(allRows)}
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        token_count = EXCLUDED.token_count,
        context_prefix = EXCLUDED.context_prefix,
        context_version = EXCLUDED.context_version,
        duplicate_of = EXCLUDED.duplicate_of,
        chunk_type = EXCLUDED.chunk_type,
        parent_id = EXCLUDED.parent_id,
        page_number = EXCLUDED.page_number,
        section_heading = EXCLUDED.section_heading
    `

    const records: VectorRecord[] = canonicalRows.map((row) => {
      const r = row as { id: string; chunk_index: number; content: string }
      const chunkIdx = chunks.findIndex((c) => `${documentId}-${c.index}` === r.id)
      return {
        id: r.id,
        vector: embedResult.embeddings[chunkIdx]!.vector,
        metadata: { documentId, userId: resolvedUserId, chunkIndex: r.chunk_index, content: r.content },
      }
    })
    if (records.length > 0) {
      await vectorStoreService.index(records)
    }

    stages[3].status = "done"
    stages[3].durationMs = Date.now() - start
    stages[3].data = { vectorsIndexed: records.length, duplicatesSkipped: duplicateRows.length, ftsIndexed: records.length }
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
  console.log(JSON.stringify({ event: "pipeline_start", documentId, fileName: input.fileName, mimeType: input.mimeType, fileSize: input.fileSize }))
  const { parserService, chunkerService, embedderService, imageEmbedderService, vectorStoreService } = createServices(env, sql)

  const MAX_DECOMPRESSED_BYTES = 500 * 1024 * 1024

  let parseResult: ParseResult
  try {
    console.log(JSON.stringify({ event: "pipeline_stage", documentId, stage: "parse", status: "start" }))
    await updateJobStatus(sql, jobIds.parse, "running")
    parseResult = await withTimeout(parserService.parse(input), STAGE_TIMEOUT_MS.parse, "parse")
    // NEW-007: zip bomb protection — reject documents whose decompressed content exceeds 500MB
    if (parseResult.content.length > MAX_DECOMPRESSED_BYTES) {
      const msg = "decompressed content exceeds 500MB limit"
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

  // Content filter: scan for prompt injection patterns (non-blocking, flag only)
  const filterResult = scanForInjection(parseResult.content)
  if (filterResult.flagged) {
    console.log(JSON.stringify({
      event: "content_filter_flagged",
      documentId,
      riskScore: filterResult.riskScore,
      matchCount: filterResult.matches.length,
      categories: [...new Set(filterResult.matches.map((m) => m.category))],
      patterns: filterResult.matches.map((m) => m.pattern),
    }))
    // Store flag in document metadata for admin review
    const filterMeta = {
      injectionRiskScore: filterResult.riskScore,
      injectionPatterns: filterResult.matches.map((m) => m.pattern),
      injectionFlaggedAt: new Date().toISOString(),
    }
    await sql`
      UPDATE documents
      SET metadata = ${sql.json(filterMeta)}
      WHERE id = ${documentId}
    `
  }

  // Store extracted images to R2 (non-fatal, best-effort)
  const storedImages = await storeImagesToR2(parseResult, documentId, userId, env)

  // Warm up BPE encoder before synchronous chunking to avoid wordCount*1.4 fallback
  await ensureEncoderLoaded()

  let chunks: Chunk[]
  try {
    console.log(JSON.stringify({ event: "pipeline_stage", documentId, stage: "chunk", status: "start" }))
    await updateJobStatus(sql, jobIds.chunk, "running")
    const textChunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat, {
      doclingElements: parseResult.doclingElements,
    })
    chunks = storedImages.length > 0
      ? [...textChunks, ...buildImageChunks(storedImages, textChunks.length)]
      : textChunks
    await updateJobStatus(sql, jobIds.chunk, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.chunk, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  // F-020: contextual prefix (non-fatal — reuse chunk job status slot)
  // Only apply to text chunks; image chunks are appended after
  const imageChunkStart = chunks.length - storedImages.length
  try {
    await updateJobStatus(sql, jobIds.chunk, "running")
    const contextualizedText = await withTimeout(
      addContextualPrefixes(
        parseResult.content,
        chunks.slice(0, imageChunkStart),
        env.GROQ_LLM_URL,
        env.GROQ_API_KEY,
        env.GROQ_LLM_MODEL
      ),
      STAGE_TIMEOUT_MS.chunk,
      "contextual-prefix"
    )
    chunks = [...contextualizedText, ...chunks.slice(imageChunkStart)]
    await updateJobStatus(sql, jobIds.chunk, "done", 100)
  } catch (e) {
    await updateJobStatus(sql, jobIds.chunk, "done", 100)
    console.warn("contextual prefix generation failed, proceeding without:", e instanceof Error ? e.message : String(e))
  }

  let embedResult: BatchEmbeddingResult
  try {
    console.log(JSON.stringify({ event: "pipeline_stage", documentId, stage: "embed", status: "start", chunkCount: chunks.length }))
    await updateJobStatus(sql, jobIds.embed, "running")

    const textEmbedResult = await withTimeout(
      embedderService.embedBatch(
        chunks.slice(0, imageChunkStart).map((c) => c.content),
        { lateChunking: true },
      ),
      STAGE_TIMEOUT_MS.embed, "embed"
    )

    let imageEmbedResult: BatchEmbeddingResult = { embeddings: [], totalTokens: 0 }
    if (storedImages.length > 0) {
      imageEmbedResult = await withTimeout(
        imageEmbedderService.embedImages(
          storedImages.map((img) => img.base64),
          storedImages.map((img) => img.mimeType),
        ),
        STAGE_TIMEOUT_MS.embed, "embed-images"
      )
    }

    embedResult = {
      embeddings: [...textEmbedResult.embeddings, ...imageEmbedResult.embeddings],
      totalTokens: textEmbedResult.totalTokens + imageEmbedResult.totalTokens,
    }

    // Semantic anomaly detection: flag documents with outlier L2 norms
    // Normal Jina v4 512-dim embeddings have L2 norms ~1.0 (±0.3).
    // Outliers (>2.0 or <0.3) indicate garbage content, encoding errors, or injection payloads.
    if (embedResult.embeddings.length > 0) {
      const norms = embedResult.embeddings.map((e) => {
        const sumSq = e.vector.reduce((acc, x) => acc + x * x, 0)
        return Math.sqrt(sumSq)
      })
      const meanNorm = norms.reduce((a, b) => a + b, 0) / norms.length
      const maxNorm = Math.max(...norms)
      const minNorm = Math.min(...norms)
      const outlierCount = norms.filter((n) => n > 2.0 || n < 0.3).length

      if (outlierCount > 0 || meanNorm > 1.5 || meanNorm < 0.5) {
        console.log(JSON.stringify({
          event: "embedding_anomaly_detected",
          documentId,
          meanNorm: +meanNorm.toFixed(4),
          minNorm: +minNorm.toFixed(4),
          maxNorm: +maxNorm.toFixed(4),
          outlierCount,
          totalChunks: norms.length,
        }))
        // Update document metadata with anomaly flag (non-blocking)
        const anomalyMeta = JSON.stringify({
          embeddingAnomalyDetected: true,
          embeddingMeanNorm: +meanNorm.toFixed(4),
          embeddingOutlierCount: outlierCount,
        })
        await sql`
          UPDATE documents
          SET metadata = COALESCE(metadata, '{}'::jsonb) || ${anomalyMeta}::jsonb
          WHERE id = ${documentId}
        `.catch(() => {}) // non-fatal
      }
    }

    await updateJobStatus(sql, jobIds.embed, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.embed, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  try {
    console.log(JSON.stringify({ event: "pipeline_stage", documentId, stage: "index", status: "start" }))
    await updateJobStatus(sql, jobIds.index, "running")

    const parentIdMap = resolveParentIds(chunks, documentId)
    const { canonicalRows, duplicateRows } = await buildChunkRows(
      chunks, embedResult, documentId, userId, sql, parentIdMap,
    )

    const allRows = [...canonicalRows, ...duplicateRows]
    await sql`
      INSERT INTO chunks ${sql(allRows)}
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        token_count = EXCLUDED.token_count,
        context_prefix = EXCLUDED.context_prefix,
        context_version = EXCLUDED.context_version,
        duplicate_of = EXCLUDED.duplicate_of,
        chunk_type = EXCLUDED.chunk_type,
        parent_id = EXCLUDED.parent_id,
        page_number = EXCLUDED.page_number,
        section_heading = EXCLUDED.section_heading
    `

    const records: VectorRecord[] = canonicalRows.map((row) => {
      const r = row as { id: string; chunk_index: number; content: string }
      const chunkIdx = chunks.findIndex((c) => `${documentId}-${c.index}` === r.id)
      return {
        id: r.id,
        vector: embedResult.embeddings[chunkIdx]!.vector,
        metadata: { documentId, userId, chunkIndex: r.chunk_index, content: r.content },
      }
    })
    if (records.length > 0) {
      await vectorStoreService.index(records)
    }

    await updateJobStatus(sql, jobIds.index, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds.index, "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  await updateDocumentStatus(sql, documentId, "ready", null)
  console.log(JSON.stringify({ event: "pipeline_complete", documentId }))
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

  const { parserService, chunkerService, embedderService, imageEmbedderService, vectorStoreService } = createServices(env, sql)

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

  // Store extracted images to R2 (non-fatal, best-effort)
  const storedImages = await storeImagesToR2(parseResult, documentId, userId, env)

  await ensureEncoderLoaded()

  let chunks: Chunk[]
  try {
    if (startIndex <= 1) await updateJobStatus(sql, jobIds.chunk, "running")
    const textChunks = chunkerService.chunk(parseResult.content, parseResult.metadata.sourceFormat, {
      doclingElements: parseResult.doclingElements,
    })
    chunks = storedImages.length > 0
      ? [...textChunks, ...buildImageChunks(storedImages, textChunks.length)]
      : textChunks
    if (startIndex <= 1) await updateJobStatus(sql, jobIds.chunk, "done", 100)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await updateJobStatus(sql, jobIds[startFromStage], "error", 0, msg)
    await updateDocumentStatus(sql, documentId, "error", msg)
    return
  }

  // F-020: contextual prefix (non-fatal)
  const imageChunkStart = chunks.length - storedImages.length
  try {
    if (startIndex <= 1) {
      const contextualizedText = await addContextualPrefixes(
        parseResult.content,
        chunks.slice(0, imageChunkStart),
        env.GROQ_LLM_URL,
        env.GROQ_API_KEY,
        env.GROQ_LLM_MODEL
      )
      chunks = [...contextualizedText, ...chunks.slice(imageChunkStart)]
    }
  } catch (e) {
    console.warn("contextual prefix generation failed, proceeding without:", e instanceof Error ? e.message : String(e))
  }

  let embedResult: BatchEmbeddingResult
  try {
    if (startIndex <= 2) await updateJobStatus(sql, jobIds.embed, "running")

    const textEmbedResult = await embedderService.embedBatch(
      chunks.slice(0, imageChunkStart).map((c) => c.content),
      { lateChunking: true },
    )

    let imageEmbedResult: BatchEmbeddingResult = { embeddings: [], totalTokens: 0 }
    if (storedImages.length > 0) {
      imageEmbedResult = await imageEmbedderService.embedImages(
        storedImages.map((img) => img.base64),
        storedImages.map((img) => img.mimeType),
      )
    }

    embedResult = {
      embeddings: [...textEmbedResult.embeddings, ...imageEmbedResult.embeddings],
      totalTokens: textEmbedResult.totalTokens + imageEmbedResult.totalTokens,
    }
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

      const parentIdMap = resolveParentIds(chunks, documentId)
      const { canonicalRows, duplicateRows } = await buildChunkRows(
        chunks, embedResult, documentId, userId, sql, parentIdMap,
      )

      const allRows = [...canonicalRows, ...duplicateRows]
      await sql`
        INSERT INTO chunks ${sql(allRows)}
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          token_count = EXCLUDED.token_count,
          context_prefix = EXCLUDED.context_prefix,
          context_version = EXCLUDED.context_version,
          duplicate_of = EXCLUDED.duplicate_of,
          chunk_type = EXCLUDED.chunk_type,
          parent_id = EXCLUDED.parent_id,
          page_number = EXCLUDED.page_number,
          section_heading = EXCLUDED.section_heading
      `

      const records: VectorRecord[] = canonicalRows.map((row) => {
        const r = row as { id: string; chunk_index: number; content: string }
        const chunkIdx = chunks.findIndex((c) => `${documentId}-${c.index}` === r.id)
        return {
          id: r.id,
          vector: embedResult.embeddings[chunkIdx]!.vector,
          metadata: { documentId, userId, chunkIndex: r.chunk_index, content: r.content },
        }
      })
      if (records.length > 0) {
        await vectorStoreService.index(records)
      }

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
