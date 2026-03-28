import type { Chunk, ChunkerOptions } from "./types"
import {
  PARENT_MAX_TOKENS,
  PARENT_MIN_TOKENS,
  CHILD_MAX_TOKENS,
  CHILD_MIN_TOKENS,
} from "./types"
import { chunkSemantic } from "./semantic"
import { countTokensSync } from "./tokenizer"

/**
 * Hierarchical chunker: produces parent chunks (up to 1024 tokens) and child
 * chunks (up to 200 tokens) from each parent.
 *
 * Return order: [parent_0, child_0_0, child_0_1, ..., parent_1, child_1_0, ...]
 * This ordering lets the pipeline assign IDs before inserting.
 *
 * Edge case: if the entire document yields only one parent with fewer than
 * PARENT_MIN_TOKENS, a single flat chunk is returned instead.
 */
export function chunkHierarchical(text: string, options: ChunkerOptions = {}): Chunk[] {
  const parents = chunkSemantic(text, { ...options, maxTokens: PARENT_MAX_TOKENS, overlap: 0 })

  // Short document — skip hierarchy, emit flat
  if (parents.length === 1 && parents[0]!.tokenCount < PARENT_MIN_TOKENS) {
    return [{ ...parents[0]!, chunkType: "flat", parentIndex: undefined }]
  }

  const result: Chunk[] = []
  let globalIndex = 0

  for (let pi = 0; pi < parents.length; pi++) {
    const parent = parents[pi]!
    const parentChunk: Chunk = {
      ...parent,
      index: globalIndex,
      chunkType: "parent",
      parentIndex: undefined,
    }
    result.push(parentChunk)
    globalIndex++

    const children = splitIntoChildren(
      parent.content,
      parent.startOffset,
      parent.metadata.sectionHeading
    )

    for (const child of children) {
      result.push({
        ...child,
        index: globalIndex,
        chunkType: "child",
        parentIndex: pi,
      })
      globalIndex++
    }
  }

  return result
}

/**
 * Split a parent chunk's content into child chunks at sentence boundaries.
 * Children inherit the parent's sectionHeading.
 * Children smaller than CHILD_MIN_TOKENS are merged into the preceding child.
 */
function splitIntoChildren(
  content: string,
  baseOffset: number,
  sectionHeading: string | undefined
): Chunk[] {
  // Split at sentence boundaries using lookbehind
  const sentenceRegex = /(?<=[.!?])\s+/
  const rawSentences = content.split(sentenceRegex).filter((s) => s.length > 0)

  const children: Chunk[] = []
  let currentParts: string[] = []
  let currentTokens = 0
  let partOffset = 0

  const flush = (forceInclude: boolean = false) => {
    if (currentParts.length === 0) return
    const childContent = currentParts.join(" ")
    const tokenCount = countTokensSync(childContent)
    const startOff = baseOffset + partOffset

    if (!forceInclude && tokenCount < CHILD_MIN_TOKENS && children.length > 0) {
      // Merge into the last child
      const last = children[children.length - 1]!
      const merged = last.content + " " + childContent
      children[children.length - 1] = {
        ...last,
        content: merged,
        tokenCount: countTokensSync(merged),
        endOffset: startOff + childContent.length,
      }
    } else {
      children.push({
        content: childContent,
        index: 0, // reassigned by caller
        tokenCount,
        startOffset: startOff,
        endOffset: startOff + childContent.length,
        metadata: { type: "semantic", sectionHeading },
        chunkType: "child",
      })
    }
    // Advance partOffset past the flushed content + separator
    partOffset += childContent.length + 1
    currentParts = []
    currentTokens = 0
  }

  let consumed = 0
  for (const sentence of rawSentences) {
    const sentTokens = countTokensSync(sentence)

    // Single sentence exceeds limit — emit as sole child regardless of size
    if (sentTokens > CHILD_MAX_TOKENS) {
      flush()
      const childContent = sentence
      const startOff = baseOffset + consumed
      children.push({
        content: childContent,
        index: 0,
        tokenCount: sentTokens,
        startOffset: startOff,
        endOffset: startOff + childContent.length,
        metadata: { type: "semantic", sectionHeading },
        chunkType: "child",
      })
      consumed += sentence.length + 1
      partOffset = consumed - baseOffset
      continue
    }

    if (currentTokens + sentTokens > CHILD_MAX_TOKENS && currentParts.length > 0) {
      flush()
    }

    if (currentParts.length === 0) {
      partOffset = consumed
    }
    currentParts.push(sentence)
    currentTokens += sentTokens
    consumed += sentence.length + 1
  }

  flush(true)

  return children
}
