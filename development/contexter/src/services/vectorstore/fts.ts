import type { SearchResult, VectorMetadata } from "./types"

/**
 * FTS5 full-text search service on D1.
 * Uses SQLite FTS5 virtual table with BM25 ranking.
 */
export class FtsService {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  /**
   * Initialize FTS5 virtual table and sync trigger.
   * Call once during setup / migration.
   */
  async initialize(): Promise<void> {
    await this.db.batch([
      this.db.prepare(`
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
          id UNINDEXED,
          document_id UNINDEXED,
          content,
          chunk_index UNINDEXED,
          content='chunks',
          tokenize='unicode61'
        )
      `),
      this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS chunks_fts_insert AFTER INSERT ON chunks
        BEGIN
          INSERT INTO chunks_fts(id, document_id, content, chunk_index)
          VALUES (new.id, new.document_id, new.content, new.chunk_index);
        END
      `),
      this.db.prepare(`
        CREATE TRIGGER IF NOT EXISTS chunks_fts_delete AFTER DELETE ON chunks
        BEGIN
          INSERT INTO chunks_fts(chunks_fts, id, document_id, content, chunk_index)
          VALUES ('delete', old.id, old.document_id, old.content, old.chunk_index);
        END
      `),
    ])
  }

  /**
   * Insert a chunk into FTS index manually (for cases where trigger doesn't fire).
   */
  async insert(id: string, documentId: string, content: string, chunkIndex: number): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO chunks_fts(id, document_id, content, chunk_index) VALUES (?, ?, ?, ?)"
      )
      .bind(id, documentId, content, chunkIndex)
      .run()
  }

  /**
   * Search FTS5 index using BM25 ranking.
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    const sanitized = sanitizeFtsQuery(query)
    if (!sanitized) return []

    const results = await this.db
      .prepare(
        `SELECT id, document_id, content, chunk_index, rank
         FROM chunks_fts
         WHERE chunks_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .bind(sanitized, topK)
      .all<FtsRow>()

    return (results.results ?? []).map((row) => ({
      id: row.id,
      score: -row.rank, // FTS5 rank is negative (lower = better), invert for consistency
      metadata: {
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        content: row.content,
      },
    }))
  }

  /**
   * Delete all FTS entries for a document.
   */
  async deleteByDocument(documentId: string): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO chunks_fts(chunks_fts, id, document_id, content, chunk_index) SELECT 'delete', id, document_id, content, chunk_index FROM chunks_fts WHERE document_id = ?"
      )
      .bind(documentId)
      .run()
  }
}

interface FtsRow {
  id: string
  document_id: string
  content: string
  chunk_index: number
  rank: number
}

/**
 * Sanitize user query for FTS5 MATCH syntax.
 * Strips special FTS operators to prevent injection.
 */
function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/[^\w\s\u0400-\u04FF\u00C0-\u024F]/g, " ") // keep word chars, cyrillic, latin extended
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, "") // remove FTS operators
    .replace(/\s+/g, " ")
    .trim()
}
