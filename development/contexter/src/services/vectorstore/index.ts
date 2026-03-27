import type { Sql } from "postgres"
import type { VectorRecord, SearchResult, HybridSearchResult, SearchOptions } from "./types"
import { DEFAULT_TOP_K, DEFAULT_SCORE_THRESHOLD } from "./types"
import { VectorService } from "./vector"
import { FtsService } from "./fts"
import { reciprocalRankFusion } from "./hybrid"

export type { VectorRecord, SearchResult, HybridSearchResult, SearchOptions }
export { reciprocalRankFusion } from "./hybrid"
export { FtsService } from "./fts"
export { VectorService } from "./vector"

export interface VectorStoreConfig {
  sql: Sql
}

export class VectorStoreService {
  private vector: VectorService
  private fts: FtsService

  constructor(config: VectorStoreConfig) {
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
   * Hybrid search: pgvector cosine + tsvector → Reciprocal Rank Fusion.
   */
  async search(
    queryVector: number[],
    queryText: string,
    options: SearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    const topK = options.topK ?? DEFAULT_TOP_K
    const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD
    const userId = options.userId

    const [vectorResults, ftsResults] = await Promise.all([
      this.vector.search(queryVector, topK * 2, userId),
      this.fts.search(queryText, topK * 2, userId),
    ])

    const fused = reciprocalRankFusion(vectorResults, ftsResults, topK)
    return fused.filter((r) => r.score >= threshold)
  }

  async searchVector(queryVector: number[], topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.vector.search(queryVector, topK)
  }

  async searchFts(queryText: string, topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.fts.search(queryText, topK)
  }

  async deleteByDocument(_documentId: string, chunkIds: string[]): Promise<void> {
    await this.vector.deleteByIds(chunkIds)
    // FTS entries auto-deleted via CASCADE on chunks table
  }
}
