import type { Sql } from "postgres"

// F-028: Semantic dedup — find a near-duplicate canonical chunk for a given embedding.
// "Canonical" means duplicate_of IS NULL — avoids chains of duplicates pointing to duplicates.

/**
 * Query pgvector for the closest existing chunk (same user, canonical only).
 * Returns the matching chunk id if cosine similarity exceeds the threshold, else null.
 *
 * Threshold 0.98: catches near-exact semantic duplicates (same text, minor formatting diff)
 * without flagging genuinely different chunks on the same topic.
 */
export async function findNearDuplicate(
  sql: Sql,
  embedding: number[],
  userId: string,
  threshold = 0.98,
): Promise<string | null> {
  const vectorStr = `[${embedding.join(",")}]`
  const rows = await sql`
    SELECT id, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM chunks
    WHERE user_id = ${userId}
      AND embedding IS NOT NULL
      AND duplicate_of IS NULL
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT 1
  `
  if (rows.length === 0) return null
  const similarity = Number(rows[0]!.similarity)
  return similarity > threshold ? (rows[0]!.id as string) : null
}
