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
  db: D1Database
  vectorIndex: VectorizeIndex
}

export class VectorStoreService {
  private vector: VectorService
  private fts: FtsService

  constructor(config: VectorStoreConfig) {
    this.vector = new VectorService(config.vectorIndex)
    this.fts = new FtsService(config.db)
  }

  /**
   * Initialize FTS5 tables and triggers.
   */
  async initialize(): Promise<void> {
    await this.fts.initialize()
  }

  /**
   * Index chunks: insert into both Vectorize and FTS5.
   */
  async index(records: VectorRecord[]): Promise<void> {
    // Insert into Vectorize only.
    // FTS5 is populated by D1 trigger on chunks table insert (done by pipeline).
    await this.vector.insert(records)
  }

  /**
   * Hybrid search: vector + FTS5 → Reciprocal Rank Fusion.
   */
  async search(
    queryVector: number[],
    queryText: string,
    options: SearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    const topK = options.topK ?? DEFAULT_TOP_K
    const threshold = options.scoreThreshold ?? DEFAULT_SCORE_THRESHOLD

    // Run both searches in parallel
    const [vectorResults, ftsResults] = await Promise.all([
      this.vector.search(queryVector, topK * 2),
      this.fts.search(queryText, topK * 2),
    ])

    // Fuse results
    const fused = reciprocalRankFusion(vectorResults, ftsResults, topK)

    // Apply score threshold
    return fused.filter((r) => r.score >= threshold)
  }

  /**
   * Vector-only search (when FTS not applicable).
   */
  async searchVector(queryVector: number[], topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.vector.search(queryVector, topK)
  }

  /**
   * FTS-only search (keyword search).
   */
  async searchFts(queryText: string, topK: number = DEFAULT_TOP_K): Promise<SearchResult[]> {
    return this.fts.search(queryText, topK)
  }

  /**
   * Delete all indexed data for a document.
   */
  async deleteByDocument(documentId: string, chunkIds: string[]): Promise<void> {
    await Promise.all([
      this.vector.deleteByIds(chunkIds),
      this.fts.deleteByDocument(documentId),
    ])
  }
}
