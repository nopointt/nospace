import type { VectorRecord, SearchResult, VectorMetadata } from "./types"

/**
 * Vector search service on Cloudflare Vectorize.
 */
export class VectorService {
  private index: VectorizeIndex

  constructor(index: VectorizeIndex) {
    this.index = index
  }

  /**
   * Insert vectors into the index.
   * Batches automatically (Vectorize limit: 1000 per call).
   */
  async insert(records: VectorRecord[]): Promise<void> {
    const BATCH_SIZE = 1000
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      const vectors = batch.map((r) => ({
        id: r.id,
        values: r.vector,
        metadata: {
          documentId: r.metadata.documentId,
          userId: r.metadata.userId ?? "",
          chunkIndex: r.metadata.chunkIndex,
          content: r.metadata.content.slice(0, 1000), // Vectorize metadata size limit
        },
      }))
      await this.index.insert(vectors)
    }
  }

  /**
   * Search by vector similarity.
   * Note: Vectorize metadata filtering requires a metadata index to be created first.
   * Until `create-metadata-index` propagates for userId, we fetch topK*4 results
   * and filter post-query by userId from the returned metadata.
   */
  async search(queryVector: number[], topK: number = 10, userId?: string): Promise<SearchResult[]> {
    const queryOpts: VectorizeQueryOptions = {
      // Fetch extra results to compensate for post-query userId filtering
      topK: userId ? topK * 4 : topK,
      returnValues: false,
      returnMetadata: "all",
    }
    const results = await this.index.query(queryVector, queryOpts)

    const matches = results.matches ?? []

    // Post-query userId filter using metadata (works without a Vectorize metadata index)
    const filtered = userId
      ? matches.filter((m) => (m.metadata?.userId as string | undefined) === userId)
      : matches

    return filtered.slice(0, topK).map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: {
        documentId: (match.metadata?.documentId as string) ?? "",
        chunkIndex: (match.metadata?.chunkIndex as number) ?? 0,
        content: (match.metadata?.content as string) ?? "",
      },
    }))
  }

  /**
   * Delete vectors by IDs.
   */
  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await this.index.deleteByIds(ids)
  }
}
