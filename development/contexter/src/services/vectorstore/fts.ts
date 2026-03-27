import type { Sql } from "postgres"
import type { SearchResult } from "./types"

/**
 * Full-text search service on PostgreSQL with tsvector + GIN index.
 * Replaces SQLite FTS5. tsvector column is auto-generated via GENERATED ALWAYS AS.
 */
export class FtsService {
  private sql: Sql

  constructor(sql: Sql) {
    this.sql = sql
  }

  /**
   * No initialization needed — tsvector column and GIN index created by migration.
   */
  async initialize(): Promise<void> {
    // No-op: PG tsvector is GENERATED ALWAYS AS, GIN index in migration
  }

  /**
   * No manual insert needed — tsvector auto-populated on chunk INSERT.
   */
  async insert(_id: string, _documentId: string, _content: string, _chunkIndex: number): Promise<void> {
    // No-op: tsvector generated column updates automatically
  }

  /**
   * Search using PostgreSQL tsvector with ts_rank ranking.
   * Native userId filtering via WHERE clause.
   */
  async search(query: string, topK: number = 10, userId?: string): Promise<SearchResult[]> {
    const sanitized = sanitizeFtsQuery(query)
    if (!sanitized) return []

    const rows = userId
      ? await this.sql`
          SELECT id, document_id, content, chunk_index,
            ts_rank(tsv, plainto_tsquery('simple', ${sanitized})) as score
          FROM chunks
          WHERE tsv @@ plainto_tsquery('simple', ${sanitized}) AND user_id = ${userId}
          ORDER BY score DESC
          LIMIT ${topK}
        `
      : await this.sql`
          SELECT id, document_id, content, chunk_index,
            ts_rank(tsv, plainto_tsquery('simple', ${sanitized})) as score
          FROM chunks
          WHERE tsv @@ plainto_tsquery('simple', ${sanitized})
          ORDER BY score DESC
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
   * No explicit delete needed — chunks table CASCADE handles it.
   */
  async deleteByDocument(_documentId: string): Promise<void> {
    // No-op: tsvector entries deleted when chunk rows are deleted via CASCADE
  }
}

/**
 * Sanitize user query for PostgreSQL plainto_tsquery.
 * P4-001: Use Unicode Letter class to support CJK/Arabic/Hebrew and all scripts.
 */
function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}
