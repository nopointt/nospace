import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { sources, documents, documentChunks } from "../schema";
import { extractText } from "./text-extractor";
import { validateAndTruncateContent } from "./token-counter";
import { chunkText } from "./chunker";
import { embedChunks } from "./embedder";
import { generateId, ensureSafeId } from "./id-utils";

interface Env {
  KB_DB: D1Database;
  HARKLY_R2: R2Bucket;
  VECTORIZE_INDEX: VectorizeIndex;
  AI: Ai;
}

export async function processSource(
  env: Env,
  sourceId: string,
): Promise<void> {
  const db = drizzle(env.KB_DB);

  // 1. Get source record
  const [source] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId))
    .limit(1);

  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  try {
    // 2. Update status to processing
    await db
      .update(sources)
      .set({ status: "processing", updatedAt: new Date().toISOString() })
      .where(eq(sources.id, sourceId));

    // 3. Fetch file from R2
    if (!source.r2Key) {
      throw new Error("Source has no R2 key");
    }
    const r2Object = await env.HARKLY_R2.get(source.r2Key);
    if (!r2Object) {
      throw new Error(`R2 object not found: ${source.r2Key}`);
    }

    // 4. Extract text
    const rawText = await extractText(r2Object, source.mimeType || "text/plain");

    // 5. Validate and truncate
    const content = validateAndTruncateContent(rawText);

    // 6. Insert document
    const docId = generateId();
    await db.insert(documents).values({
      id: docId,
      projectId: source.projectId,
      sourceId: source.id,
      tenantId: source.tenantId,
      title: source.title,
      content,
      wordCount: content.split(/\s+/).length,
    });

    // 7. Chunk text
    const chunks = chunkText(content);

    // 8. Process in batches: embed + store chunks + upsert vectors
    const CHUNK_BATCH = 10;
    for (let i = 0; i < chunks.length; i += CHUNK_BATCH) {
      const batch = chunks.slice(i, i + CHUNK_BATCH);
      const batchTexts = batch.map((c) => c.content);

      // Generate embeddings
      const embeddings = await embedChunks(env.AI, batchTexts);

      // Insert chunk rows and prepare vectors
      const vectors: VectorizeVector[] = [];

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const chunkId = generateId();

        await db.insert(documentChunks).values({
          id: chunkId,
          documentId: docId,
          projectId: source.projectId,
          tenantId: source.tenantId,
          chunkIndex: chunk.index,
          content: chunk.content,
          tokenCount: chunk.content.split(/\s+/).length,
        });

        if (embeddings[j]) {
          vectors.push({
            id: ensureSafeId(chunkId),
            values: embeddings[j],
            metadata: {
              tenantId: source.tenantId,
              projectId: source.projectId,
              documentId: docId,
              chunkId,
              chunkIndex: chunk.index,
              content: chunk.content.substring(0, 2000),
              sourceType: source.type,
            },
          });
        }
      }

      // Upsert vectors to Vectorize
      if (vectors.length > 0) {
        await env.VECTORIZE_INDEX.upsert(vectors);
      }
    }

    // 9. Update source status to processed
    await db
      .update(sources)
      .set({ status: "processed", updatedAt: new Date().toISOString() })
      .where(eq(sources.id, sourceId));
  } catch (error) {
    // 10. On error: mark as failed
    const message = error instanceof Error ? error.message : String(error);
    await db
      .update(sources)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(sources.id, sourceId));
    throw error;
  }
}
