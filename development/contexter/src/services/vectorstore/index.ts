import type { Sql } from "postgres"
import type { VectorRecord, SearchResult, HybridSearchResult, SearchOptions, ParentRow } from "./types"
import { DEFAULT_TOP_K, DEFAULT_SCORE_THRESHOLD } from "./types"
import { VectorService } from "./vector"
import { FtsService } from "./fts"
import { convexCombinationFusion } from "./hybrid"

export type { VectorRecord, SearchResult, HybridSearchResult, SearchOptions, ParentRow }
export { convexCombinationFusion } from "./hybrid"
export { classifyQuery } from "./classifier"
export type { ClassifierResult, QueryType } from "./classifier"
export { FtsService } from "./fts"
export { VectorService } from "./vector"

/** Configuration required to instantiate {@link VectorStoreService}. */
export interface VectorStoreConfig {
  /** Postgres connection used by both vector and FTS sub-services. */
  sql: Sql
}

/**
 * Unified entry point for hybrid vector + full-text search over indexed chunks.
 *
 * Internally delegates to {@link VectorService} (pgvector) and {@link FtsService}
 * (tsvector), then merges results with Convex Combination Fusion (CC).
 */
export class VectorStoreService {
  private vector: VectorService
  private fts: FtsService
  // F-030: sql reference for feedback_score multiplier lookup
  private sql: Sql

  /** @param config - Postgres connection config. */
  constructor(config: VectorStoreConfig) {
    this.sql = config.sql
    this.vector = new VectorService(config.sql)
    this.fts = new FtsService(config.sql)
  }

  /**
   * No-op: PG handles FTS via generated column + GIN index.
   */
  async initialize(): Promise<void> {
    await this.fts.initialize()
  }

  /**
   * Index chunks: update embeddings in pgvector.
   * FTS is auto-populated via generated tsvector column.
   */
  async index(records: VectorRecord[]): Promise<void> {
    await this.vector.upsertEmbeddings(records)
  }

  /**
   * Hybrid search: pgvector cosine + tsvector → Convex Combination fusion.
   * @param alpha - F-021 adaptive alpha override. Undefined → CC uses FUSION_ALPHA default (0.5).
   */
  async search(
    queryVector: number[],
    queryText: string,
    options: SearchOptions = {},
    alpha?: number
  ): Promise<HybridSearchResult[]> {
    const topK = options.topK ?? DEFAULT_TOP_K
    const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
    const userId = options.userId

    const [vectorResults, ftsResults] = await Promise.all([
      this.vector.search(queryVector, topK * 2, userId),
      this.fts.search(queryText, topK * 2, userId),
    ])

    const fused = convexCombinationFusion(vectorResults, ftsResults, topK, alpha)

    // F-030: apply feedback_score multiplier from chunks table
    if (fused.length > 0) {
      const ids = fused.map((r) => r.id)
      const feedbackRows = await this.sql<{ id: string; feedback_score: number }[]>`
        SELECT id, feedback_score FROM chunks WHERE id = ANY(${ids})
      `
      const scoreMap = new Map(feedbackRows.map((r) => [r.id, Number(r.feedback_score)]))

      const adjusted = fused.map(r => ({ ...r, score: r.score * (scoreMap.get(r.id) ?? 1.0) }))
      return adjusted.toSorted((a, b) => b.score - a.score).filter(r => r.score >= threshold)
    }

    return fused.filter((r) => r.score >= threshold)
  }

  /**
   * Vector-only search via pgvector cosine similarity.
   * @param queryVector - Embedding to search against.
   * @param topK - Maximum results to return.
   */
  async searchVector(queryVector: number[], topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.vector.search(queryVector, topK)
  }

  /**
   * Full-text-search-only query via tsvector.
   * @param queryText - Plaintext query; tokenised internally by Postgres.
   * @param topK - Maximum results to return.
   */
  async searchFts(queryText: string, topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.fts.search(queryText, topK)
  }

  /**
   * Remove all chunks belonging to a document from the vector index.
   * FTS entries are removed automatically via CASCADE on the chunks table.
   * @param _documentId - Unused; retained for API symmetry.
   * @param chunkIds - Exact chunk IDs to delete from pgvector.
   */
  async deleteByDocument(_documentId: string, chunkIds: string[]): Promise<void> {
    await this.vector.deleteByIds(chunkIds)
    // FTS entries auto-deleted via CASCADE on chunks table
  }

  /**
   * F-017: Fetch parent chunks for a set of child IDs.
   * Returns one row per unique parent, using the highest child score.
   * Children that share a parent are deduplicated — only the best-scoring child wins.
   */
  async fetchParentsForChildren(childIds: string[], childScores: number[]): Promise<ParentRow[]> {
    if (childIds.length === 0) return []

    if (childIds.length !== childScores.length) {
      throw new Error(`fetchParentsForChildren: length mismatch — ids=${childIds.length} scores=${childScores.length}`)
    }

    const rows = await this.sql<{
      parent_id: string
      parent_content: string
      section_heading: string | null
      page_number: number | null
      best_child_score: number
    }[]>`
      SELECT
        p.id            AS parent_id,
        p.content       AS parent_content,
        p.section_heading,
        p.page_number,
        MAX(hits.score) AS best_child_score
      FROM (
        SELECT unnest(${childIds}::text[]) AS child_id,
               unnest(${childScores}::float8[]) AS score
      ) AS hits
      JOIN chunks c ON c.id = hits.child_id
      JOIN chunks p ON p.id = c.parent_id
      WHERE c.chunk_type = 'child'
      GROUP BY p.id, p.content, p.section_heading, p.page_number
      ORDER BY best_child_score DESC
    `

    return rows.map((r) => ({
      parentId: r.parent_id,
      parentContent: r.parent_content,
      sectionHeading: r.section_heading,
      pageNumber: r.page_number,
      bestChildScore: Number(r.best_child_score),
    }))
  }

  /**
   * Count total children per parent for a set of parent IDs.
   * Used by resolveParents auto-merge to compute retrieved/total ratio.
   */
  async fetchChildrenCountByParent(parentIds: string[]): Promise<Map<string, number>> {
    if (parentIds.length === 0) return new Map()

    const rows = await this.sql<{ parent_id: string; child_count: string }[]>`
      SELECT parent_id, COUNT(*)::text AS child_count
      FROM chunks
      WHERE parent_id = ANY(${parentIds}) AND chunk_type = 'child'
      GROUP BY parent_id
    `

    return new Map(rows.map((r) => [r.parent_id, Number(r.child_count)]))
  }
}
