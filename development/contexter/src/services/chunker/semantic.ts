import type { Chunk, ChunkerOptions } from "./types"
import { DEFAULT_MAX_TOKENS, DEFAULT_OVERLAP } from "./types"
import { countTokens, tokenize } from "./tokenizer"

/**
 * Semantic chunker: splits markdown/text by paragraph boundaries,
 * then groups paragraphs into chunks up to maxTokens.
 * Overlap re-includes trailing tokens from previous chunk.
 */
export function chunkSemantic(text: string, options: ChunkerOptions = {}): Chunk[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
  const overlap = options.overlap ?? DEFAULT_OVERLAP

  if (!text || text.trim().length === 0) return []

  const paragraphs = splitParagraphs(text)
  const chunks: Chunk[] = []
  let currentParts: string[] = []
  let currentTokenCount = 0
  let chunkStartOffset = 0
  let runningOffset = 0

  for (const para of paragraphs) {
    const paraTokens = countTokens(para.text)

    // Single paragraph exceeds maxTokens — force-split by token window
    if (paraTokens > maxTokens) {
      // Flush current buffer first
      if (currentParts.length > 0) {
        chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset))
        const overlapText = getOverlapText(currentParts.join("\n\n"), overlap)
        currentParts = overlapText ? [overlapText] : []
        currentTokenCount = countTokens(currentParts.join("\n\n"))
        chunkStartOffset = para.offset - (overlapText?.length ?? 0)
      }

      // Split large paragraph by token windows
      const subChunks = splitByTokenWindow(para.text, maxTokens, overlap, para.offset)
      for (const sub of subChunks) {
        chunks.push(buildChunk(sub.text, chunks.length, sub.offset))
      }
      currentParts = []
      currentTokenCount = 0
      chunkStartOffset = para.offset + para.text.length
      continue
    }

    // Adding this paragraph would exceed limit — flush
    if (currentTokenCount + paraTokens > maxTokens && currentParts.length > 0) {
      chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset))
      const overlapText = getOverlapText(currentParts.join("\n\n"), overlap)
      currentParts = overlapText ? [overlapText] : []
      currentTokenCount = countTokens(currentParts.join("\n\n"))
      chunkStartOffset = para.offset - (overlapText?.length ?? 0)
    }

    if (currentParts.length === 0) {
      chunkStartOffset = para.offset
    }
    currentParts.push(para.text)
    currentTokenCount += paraTokens
  }

  // Flush remainder
  if (currentParts.length > 0) {
    chunks.push(buildChunk(currentParts.join("\n\n"), chunks.length, chunkStartOffset))
  }

  return chunks
}

function buildChunk(content: string, index: number, startOffset: number): Chunk {
  return {
    content,
    index,
    tokenCount: countTokens(content),
    startOffset,
    endOffset: startOffset + content.length,
    metadata: { type: "semantic" },
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
  const tokens = tokenize(text)
  if (tokens.length <= overlapTokens) return null
  const start = tokens[tokens.length - overlapTokens].start
  return text.slice(start)
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
