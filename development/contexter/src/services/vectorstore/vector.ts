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
          chunkIndex: r.metadata.chunkIndex,
          content: r.metadata.content.slice(0, 1000), // Vectorize metadata size limit
        },
      }))
      await this.index.insert(vectors)
    }
  }

  /**
   * Search by vector similarity.
   */
  async search(queryVector: number[], topK: number = 10): Promise<SearchResult[]> {
    const results = await this.index.query(queryVector, {
      topK,
      returnValues: false,
      returnMetadata: "all",
    })

    return (results.matches ?? []).map((match) => ({
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
