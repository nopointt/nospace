import type { Chunk, ChunkerOptions } from "./types"
import { DEFAULT_MAX_TOKENS, DEFAULT_OVERLAP } from "./types"
import { countTokensSync, tokenize } from "./tokenizer"

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/m

interface HeadingEvent {
  offset: number
  path: string
}

/**
 * Scan all lines in text and build a sorted array of heading change events.
 * Each event records the character offset at which a new heading path becomes active.
 */
function buildHeadingEvents(text: string): HeadingEvent[] {
  const events: HeadingEvent[] = []
  const headingLevels = new Map<number, string>()
  const lineRegex = /^.*$/gm
  let match: RegExpExecArray | null

  while ((match = lineRegex.exec(text)) !== null) {
    const line = match[0]
    const headingMatch = HEADING_REGEX.exec(line)
    if (headingMatch) {
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()

      headingLevels.set(level, headingText)

      // Reset all child levels whenever a parent heading changes
      for (const key of Array.from(headingLevels.keys())) {
        if (key > level) {
          headingLevels.delete(key)
        }
      }

      const path = Array.from(
        new Map([...headingLevels.entries()].sort((a, b) => a[0] - b[0])).values()
      ).join(" > ")

      events.push({ offset: match.index, path })
    }
  }

  return events
}

/**
 * Return the active heading path for a paragraph at the given character offset.
 * Picks the latest heading event whose offset is <= paraOffset.
 * Returns undefined when no heading precedes the paragraph.
 */
function getActiveHeading(events: HeadingEvent[], paraOffset: number): string | undefined {
  let active: string | undefined
  for (const event of events) {
    if (event.offset <= paraOffset) {
      active = event.path
    } else {
      break
    }
  }
  return active
}

/**
 * Semantic chunker: splits markdown/text by paragraph boundaries,
 * then groups paragraphs into chunks up to maxTokens.
 * Overlap re-includes trailing tokens from previous chunk.
 * Heading-aware: attaches the active sectionHeading to each chunk.
 */
export function chunkSemantic(text: string, options: ChunkerOptions = {}): Chunk[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
  const overlap = options.overlap ?? DEFAULT_OVERLAP

  if (!text || text.trim().length === 0) return []

  const headingEvents = buildHeadingEvents(text)
  const paragraphs = splitParagraphs(text)
  const chunks: Chunk[] = []
  let currentParts: string[] = []
  let currentTokenCount = 0
  let chunkStartOffset = 0
  let chunkSectionHeading: string | undefined

  for (const para of paragraphs) {
    const paraTokens = countTokensSync(para.text)
    const paraHeading = getActiveHeading(headingEvents, para.offset)

    // Single paragraph exceeds maxTokens — force-split by token window
    if (paraTokens > maxTokens) {
      // Flush current buffer first
      if (currentParts.length > 0) {
        chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset, chunkSectionHeading))
        const overlapText = getOverlapText(currentParts.join("\n\n"), overlap)
        currentParts = overlapText ? [overlapText] : []
        currentTokenCount = countTokensSync(currentParts.join("\n\n"))
        chunkStartOffset = para.offset - (overlapText?.length ?? 0)
        chunkSectionHeading = paraHeading
      }

      // Split large paragraph by token windows
      const subChunks = splitByTokenWindow(para.text, maxTokens, overlap, para.offset)
      for (const sub of subChunks) {
        chunks.push(buildChunk(sub.text, chunks.length, sub.offset, paraHeading))
      }
      currentParts = []
      currentTokenCount = 0
      chunkStartOffset = para.offset + para.text.length
      chunkSectionHeading = undefined
      continue
    }

    // Adding this paragraph would exceed limit — flush
    if (currentTokenCount + paraTokens > maxTokens && currentParts.length > 0) {
      chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset, chunkSectionHeading))
      const overlapText = getOverlapText(currentParts.join("\n\n"), overlap)
      currentParts = overlapText ? [overlapText] : []
      currentTokenCount = countTokensSync(currentParts.join("\n\n"))
      chunkStartOffset = para.offset - (overlapText?.length ?? 0)
      chunkSectionHeading = paraHeading
    }

    if (currentParts.length === 0) {
      chunkStartOffset = para.offset
      chunkSectionHeading = paraHeading
    }
    currentParts.push(para.text)
    currentTokenCount += paraTokens
  }

  // Flush remainder
  if (currentParts.length > 0) {
    chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset, chunkSectionHeading))
  }

  return chunks
}

function buildChunk(content: string, index: number, startOffset: number, sectionHeading?: string): Chunk {
  return {
    content,
    index,
    tokenCount: countTokensSync(content),
    startOffset,
    endOffset: startOffset + content.length,
    metadata: { type: "semantic", sectionHeading },
    chunkType: "flat",
  }
}

interface Paragraph {
  text: string
  offset: number
}

function splitParagraphs(text: string): Paragraph[] {
  const parts: Paragraph[] = []
  const regex = /[^\n]+(?:\n(?!\n)[^\n]*)*/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim()
    if (trimmed.length > 0) {
      parts.push({ text: trimmed, offset: match.index })
    }
  }
  return parts
}

function getOverlapText(text: string, overlapTokens: number): string | null {
  if (overlapTokens <= 0) return null
  // Use BPE token count (countTokensSync) instead of word count for accurate overlap measurement.
  // Approximate char offset: proportion of tokens from the end.
  const totalBpeTokens = countTokensSync(text)
  if (totalBpeTokens <= overlapTokens) return null
  const overlapChars = Math.floor(text.length * (overlapTokens / Math.max(totalBpeTokens, 1)))
  return text.slice(text.length - overlapChars)
}

function splitByTokenWindow(
  text: string,
  maxTokens: number,
  overlap: number,
  baseOffset: number
): Array<{ text: string; offset: number }> {
  const tokens = tokenize(text)
  const result: Array<{ text: string; offset: number }> = []
  let i = 0

  while (i < tokens.length) {
    const end = Math.min(i + maxTokens, tokens.length)
    const slice = text.slice(tokens[i].start, tokens[end - 1].end)
    result.push({ text: slice, offset: baseOffset + tokens[i].start })
    i = end - overlap
    if (i >= tokens.length || end === tokens.length) break
  }

  return result
}
