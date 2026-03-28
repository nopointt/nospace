/**
 * Citation parser: extracts [N] markers from LLM answer and maps them to sources.
 * Tier 1 — prompt-based, zero cost.
 */

export interface CitationMapping {
  /** Marker number as it appears in text, e.g. 1 for [1] */
  number: number
  /** Index into the sources array (0-based) */
  sourceIndex: number
  /** The source chunk ID */
  chunkId: string
  /** The source document ID */
  documentId: string
}

/**
 * Parse [N] citation markers from LLM answer text.
 * Returns deduplicated list of valid citations (only markers that map to a real source).
 *
 * @param answer - Raw LLM answer text, may contain [1], [2], etc.
 * @param sourceCount - Number of sources available (markers > sourceCount are invalid)
 * @returns Array of { number, sourceIndex } sorted by number ascending
 */
export function parseCitationMarkers(
  answer: string,
  sourceCount: number
): Array<{ number: number; sourceIndex: number }> {
  const regex = /\[(\d+)\]/g
  const seen = new Set<number>()
  const result: Array<{ number: number; sourceIndex: number }> = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(answer)) !== null) {
    const captured = match[1]
    if (captured === undefined) continue
    const n = parseInt(captured, 10)
    if (n >= 1 && n <= sourceCount && !seen.has(n)) {
      seen.add(n)
      result.push({ number: n, sourceIndex: n - 1 }) // [1] maps to sources[0]
    }
  }

  return result.sort((a, b) => a.number - b.number)
}

/**
 * Build full CitationMapping[] by joining parsed markers with source metadata.
 * If LLM returns no markers, returns empty array (graceful degradation).
 */
export function buildCitations(
  answer: string,
  sources: Array<{ chunkId: string; documentId: string }>
): CitationMapping[] {
  const markers = parseCitationMarkers(answer, sources.length)
  return markers.flatMap((m) => {
    const src = sources[m.sourceIndex]
    if (!src) return []
    return [{ number: m.number, sourceIndex: m.sourceIndex, chunkId: src.chunkId, documentId: src.documentId }]
  })
}
