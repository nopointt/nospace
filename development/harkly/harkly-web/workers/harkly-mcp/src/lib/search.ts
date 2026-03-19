import type { Env } from "./types";

interface SearchResult {
  id: string;
  content: string;
  score: number;
  sourceTitle: string;
  sourceType: string;
  chunkIndex: number;
}

/**
 * Hybrid search: FTS5 (BM25) + Vectorize (cosine) + RRF merge.
 * Adapted from cloudflare-rag.
 */
export async function hybridSearch(
  query: string,
  userId: string,
  env: Env,
  options: { kbId?: string; limit?: number } = {},
): Promise<SearchResult[]> {
  const limit = options.limit ?? 10;

  // Run FTS5 and vector search in parallel
  const [ftsResults, vectorResults] = await Promise.all([
    searchFts(query, userId, env, options.kbId, limit * 2),
    searchVector(query, userId, env, options.kbId, limit * 2),
  ]);

  // RRF merge
  const merged = reciprocalRankFusion(ftsResults, vectorResults);

  // Fetch full chunk content for top results
  const topIds = merged.slice(0, limit).map((r) => r.id);
  if (topIds.length === 0) return [];

  // Batch fetch (SQLite 999-var limit → batch to 100)
  const chunks = await fetchChunksByIds(topIds, env);

  // Build result array preserving RRF order
  const chunkMap = new Map(chunks.map((c) => [c.id, c]));
  return merged
    .slice(0, limit)
    .map((r) => {
      const chunk = chunkMap.get(r.id);
      if (!chunk) return null;
      return {
        id: chunk.id,
        content: chunk.content,
        score: r.score,
        sourceTitle: chunk.sourceTitle ?? "",
        sourceType: chunk.sourceType ?? "",
        chunkIndex: chunk.chunkIndex ?? 0,
      };
    })
    .filter((r): r is SearchResult => r !== null);
}

/**
 * FTS5 full-text search using D1.
 * Sorts by rank ASC (lower = better match in FTS5).
 */
async function searchFts(
  query: string,
  userId: string,
  env: Env,
  kbId: string | undefined,
  limit: number,
): Promise<{ id: string; rank: number }[]> {
  const sanitized = sanitizeFtsQuery(query);
  if (!sanitized) return [];

  let sql = `
    SELECT dc.id, fts.rank
    FROM document_chunks_fts fts
    JOIN document_chunks dc ON dc.rowid = fts.rowid
    JOIN sources s ON s.id = dc.source_id
    WHERE document_chunks_fts MATCH ?
      AND s.tenant_id = ?
  `;
  const params: unknown[] = [sanitized, userId];

  if (kbId) {
    sql += " AND dc.project_id = ?";
    params.push(kbId);
  }

  sql += " ORDER BY fts.rank ASC LIMIT ?";
  params.push(limit);

  try {
    const result = await env.KB_DB.prepare(sql).bind(...params).all();
    return result.results.map((r: any) => ({ id: r.id as string, rank: r.rank as number }));
  } catch {
    // FTS5 table may not exist yet
    return [];
  }
}

/**
 * Vectorize semantic search.
 * Embeds query → cosine similarity search.
 */
async function searchVector(
  query: string,
  userId: string,
  env: Env,
  kbId: string | undefined,
  limit: number,
): Promise<{ id: string; score: number }[]> {
  try {
    // Embed query
    const embedResult = await env.AI.run("@cf/baai/bge-large-en-v1.5" as any, {
      text: [query],
    });
    const vector = (embedResult as any).data?.[0];
    if (!vector) return [];

    // Query Vectorize
    const filter: Record<string, string> = { tenantId: userId };
    if (kbId) filter.kbId = kbId;

    const matches = await env.VECTORIZE_INDEX.query(vector, {
      topK: limit,
      filter,
    });

    return matches.matches.map((m) => ({
      id: m.id,
      score: m.score ?? 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Reciprocal Rank Fusion — merges FTS5 and vector results.
 * Score = Σ 1/(k + rank_i) where k=60.
 * Adapted from cloudflare-rag.
 */
function reciprocalRankFusion(
  ftsResults: { id: string; rank: number }[],
  vectorResults: { id: string; score: number }[],
): { id: string; score: number }[] {
  const k = 60;
  const scores: Record<string, number> = {};

  // FTS results (already sorted by rank ASC)
  ftsResults.forEach((result, index) => {
    scores[result.id] = (scores[result.id] ?? 0) + 1 / (k + index);
  });

  // Vector results (already sorted by score DESC)
  vectorResults.forEach((result, index) => {
    scores[result.id] = (scores[result.id] ?? 0) + 1 / (k + index);
  });

  return Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Sanitize FTS5 query to prevent injection.
 * Escapes special characters: ", *, (, ), OR, AND, NOT.
 */
function sanitizeFtsQuery(query: string): string {
  return query
    .replace(/"/g, '""')
    .replace(/[*()]/g, " ")
    .replace(/\b(OR|AND|NOT)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch chunks by IDs, batched to avoid SQLite 999-var limit.
 */
async function fetchChunksByIds(
  ids: string[],
  env: Env,
): Promise<{ id: string; content: string; sourceTitle?: string; sourceType?: string; chunkIndex?: number }[]> {
  const batchSize = 100;
  const results: any[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const placeholders = batch.map(() => "?").join(",");
    const sql = `
      SELECT dc.id, dc.content, dc.chunk_index as chunkIndex,
             s.title as sourceTitle, s.type as sourceType
      FROM document_chunks dc
      LEFT JOIN sources s ON s.id = dc.source_id
      WHERE dc.id IN (${placeholders})
    `;
    const result = await env.KB_DB.prepare(sql).bind(...batch).all();
    results.push(...result.results);
  }

  return results;
}
