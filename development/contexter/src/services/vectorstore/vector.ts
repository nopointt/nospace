import type { Sql } from "postgres"
import type { VectorRecord, SearchResult } from "./types"

/**
 * Vector search service on PostgreSQL with pgvector.
 * Replaces Cloudflare Vectorize — native userId filtering, no metadata size limits.
 */
export class VectorService {
  private sql: Sql

  constructor(sql: Sql) {
    this.sql = sql
  }

  /**
   * Update embedding for a chunk (chunk row must already exist).
   * Batch via unnest to avoid N+1 round-trips.
   */
  async upsertEmbeddings(records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return
    const ids = records.map((r) => r.id)
    const vectors = records.map((r) => `[${r.vector.join(",")}]`)
    await this.sql`
      UPDATE chunks SET embedding = v.vec::vector
      FROM unnest(${this.sql.array(ids)}::text[], ${this.sql.array(vectors)}::text[]) AS v(id, vec)
      WHERE chunks.id = v.id
    `
  }

  /**
   * Search by vector cosine similarity.
   * Native userId filtering via WHERE clause — no post-query hack needed.
   */
  async search(queryVector: number[], topK: number = 10, userId?: string): Promise<SearchResult[]> {
    const vectorStr = `[${queryVector.join(",")}]`

    const rows = userId
      ? await this.sql`
          SELECT id, document_id, content, chunk_index,
            1 - (embedding <=> ${vectorStr}::vector) as score
          FROM chunks
          WHERE user_id = ${userId} AND embedding IS NOT NULL
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${topK}
        `
      : await this.sql`
          SELECT id, document_id, content, chunk_index,
            1 - (embedding <=> ${vectorStr}::vector) as score
          FROM chunks
          WHERE embedding IS NOT NULL
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${topK}
        `

    return rows.map((row) => ({
      id: row.id as string,
      score: Number(row.score),
      metadata: {
        documentId: row.document_id as string,
        chunkIndex: row.chunk_index as number,
        content: row.content as string,
      },
    }))
  }

  /**
   * Delete embeddings by setting to NULL (chunk rows deleted via CASCADE).
   */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.sql`UPDATE chunks SET embedding = NULL WHERE id = ANY(${ids})`
  }
}
