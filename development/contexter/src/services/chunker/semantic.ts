/**
 * Structure-aware semantic chunker.
 *
 * Two-stage algorithm:
 *   Stage 1: classifyBlocks() detects structural boundaries (headings, code, tables, lists)
 *   Stage 2: Pack blocks into chunks respecting soft/hard token limits and atomicity
 *
 * Atomic blocks (code_block, table, list) are never split unless they exceed hardMax.
 * Headings always start a new chunk. Overlap only between paragraph-ending chunks.
 */
import type { Chunk, ChunkerOptions } from "./types"
import { resolveTokenLimits } from "./types"
import { countTokensSync, tokenize } from "./tokenizer"
import { classifyBlocks } from "./block-classifier"
import type { Block } from "./block-classifier"

/**
 * Chunk text using structure-aware two-stage splitting.
 * Accepts optional pre-classified blocks to avoid duplicate classification.
 */
export function chunkSemantic(text: string, options: ChunkerOptions = {}, preClassified?: Block[]): Chunk[] {
  if (!text || text.trim().length === 0) return []

  const { softMax, hardMax, overlap } = resolveTokenLimits(options)
  const blocks = preClassified ?? classifyBlocks(text)
  const chunks: Chunk[] = []

  let buffer: Block[] = []
  let bufferTokens = 0
  let activeHeadingPath: string | undefined

  for (const block of blocks) {
    // --- Headings start a new section ---
    if (block.type === "heading") {
      // Flush if buffer has non-heading content (don't emit heading-only chunks)
      if (buffer.some((b) => b.type !== "heading")) {
        flushBuffer()
      }
      activeHeadingPath = block.headingPath
      buffer.push(block)
      bufferTokens += block.tokenCount
      continue
    }

    // --- Atomic blocks: code, table, list — keep whole when possible ---
    if (block.type === "code_block" || block.type === "table" || block.type === "list") {
      // Oversized atomic block: flush buffer, then force-split the block
      if (block.tokenCount > hardMax) {
        flushBuffer()
        const subChunks = splitAtomicBlock(block, hardMax)
        for (const sub of subChunks) {
          chunks.push(buildChunk(sub.content, chunks.length, sub.startOffset, headingForBlock(block)))
        }
        continue
      }

      // Would exceed hardMax with buffer → flush first, then add
      if (bufferTokens + block.tokenCount > hardMax && buffer.length > 0) {
        flushBuffer()
      }

      buffer.push(block)
      bufferTokens += block.tokenCount

      // Exceeded softMax → flush (the atomic block is already included)
      if (bufferTokens >= softMax) {
        flushBuffer()
      }
      continue
    }

    // --- Paragraph blocks: standard packing ---
    // Oversized paragraph: flush, then split by token window
    if (block.tokenCount > hardMax) {
      flushBuffer()
      const subs = splitByTokenWindow(block.content, hardMax, overlap, block.startOffset)
      for (const sub of subs) {
        chunks.push(buildChunk(sub.text, chunks.length, sub.offset, headingForBlock(block)))
      }
      continue
    }

    // Would exceed softMax → flush, then add
    if (bufferTokens + block.tokenCount > softMax && buffer.length > 0) {
      flushBuffer()
    }

    buffer.push(block)
    bufferTokens += block.tokenCount
  }

  flushBuffer()
  return chunks

  // --- Internal helpers ---

  function headingForBlock(block: Block): string | undefined {
    return activeHeadingPath ?? block.headingPath
  }

  function flushBuffer(): void {
    if (buffer.length === 0) return

    const content = buffer.map((b) => b.content).join("\n\n")
    const startOffset = buffer[0].startOffset
    const heading = activeHeadingPath ?? buffer[0].headingPath

    chunks.push(buildChunk(content, chunks.length, startOffset, heading))

    // Overlap: carry trailing tokens forward, but only from paragraph-ending buffers.
    // Overlapping from code/table/list endings produces broken fragments.
    const lastBlock = buffer[buffer.length - 1]
    const shouldOverlap = overlap > 0 && lastBlock.type === "paragraph"

    if (shouldOverlap) {
      const overlapText = getOverlapText(content, overlap)
      if (overlapText) {
        buffer = [{
          type: "paragraph",
          content: overlapText,
          startOffset: startOffset + content.length - overlapText.length,
          endOffset: startOffset + content.length,
          tokenCount: countTokensSync(overlapText),
        }]
        bufferTokens = buffer[0].tokenCount
        return
      }
    }

    buffer = []
    bufferTokens = 0
  }
}

// ─── Chunk construction ───

function buildChunk(
  content: string,
  index: number,
  startOffset: number,
  sectionHeading?: string,
): Chunk {
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

// ─── Overlap ───

function getOverlapText(text: string, overlapTokens: number): string | null {
  if (overlapTokens <= 0) return null
  const totalTokens = countTokensSync(text)
  if (totalTokens <= overlapTokens) return null
  const overlapChars = Math.floor(text.length * (overlapTokens / Math.max(totalTokens, 1)))
  return text.slice(text.length - overlapChars)
}

// ─── Token-window fallback for oversized paragraphs ───

function splitByTokenWindow(
  text: string,
  maxTokens: number,
  overlap: number,
  baseOffset: number,
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

// ─── Force-split strategies for oversized atomic blocks ───

interface SplitFragment {
  content: string
  startOffset: number
}

/**
 * Split an atomic block that exceeds hardMax into smaller pieces.
 * Each type has a domain-specific split strategy:
 *  - code_block: split at blank lines, preserve fences
 *  - table: split by rows, prepend header to each fragment
 *  - list: split at top-level item boundaries
 */
function splitAtomicBlock(block: Block, hardMax: number): SplitFragment[] {
  switch (block.type) {
    case "code_block":
      return splitCodeBlock(block, hardMax)
    case "table":
      return splitTableBlock(block, hardMax)
    case "list":
      return splitListBlock(block, hardMax)
    default:
      return [{ content: block.content, startOffset: block.startOffset }]
  }
}

/**
 * Split oversized code block at blank lines within the code.
 * Each sub-block gets the opening/closing fences re-applied.
 */
function splitCodeBlock(block: Block, hardMax: number): SplitFragment[] {
  const lines = block.content.split("\n")
  if (lines.length < 3) return [{ content: block.content, startOffset: block.startOffset }]

  const openFence = lines[0]
  const closeFence = lines[lines.length - 1]
  const innerLines = lines.slice(1, lines.length - 1)

  const groups = splitLinesAtBoundaries(
    innerLines,
    hardMax,
    (line) => line.trim() === "",
    (group) => countTokensSync([openFence, ...group, closeFence].join("\n")),
  )

  return groups.map((group) => ({
    content: [openFence, ...group, closeFence].join("\n"),
    startOffset: block.startOffset,
  }))
}

/**
 * Split oversized table by rows, prepending header+separator to each fragment.
 */
function splitTableBlock(block: Block, hardMax: number): SplitFragment[] {
  const lines = block.content.split("\n")

  // Find separator row to determine header
  const sepIdx = lines.findIndex((l) => /^\s*\|[\s:-]*-{3,}[\s:-]*\|/.test(l))
  if (sepIdx < 0) return [{ content: block.content, startOffset: block.startOffset }]

  const headerLines = lines.slice(0, sepIdx + 1)
  const dataLines = lines.slice(sepIdx + 1).filter((l) => l.trim().length > 0)
  const headerText = headerLines.join("\n")
  const headerTokens = countTokensSync(headerText)

  const groups = splitLinesAtBoundaries(
    dataLines,
    hardMax,
    () => true, // every row is a valid split point
    (group) => countTokensSync([headerText, ...group].join("\n")),
  )

  return groups.map((group) => ({
    content: [headerText, ...group].join("\n"),
    startOffset: block.startOffset,
  }))
}

/**
 * Split oversized list at top-level item boundaries.
 * Top-level items start with a list marker at zero or minimal indentation.
 */
function splitListBlock(block: Block, hardMax: number): SplitFragment[] {
  const lines = block.content.split("\n")

  // Find top-level item start indices (lines matching list marker with ≤1 space indent)
  const itemStarts: number[] = []
  for (let i = 0; i < lines.length; i++) {
    if (/^(\s{0,1})([-*+]|\d+\.)\s/.test(lines[i])) {
      itemStarts.push(i)
    }
  }

  if (itemStarts.length <= 1) {
    // Single item or no items — fall back to token window split
    return splitByTokenWindow(block.content, hardMax, 0, block.startOffset).map((s) => ({
      content: s.text,
      startOffset: s.offset,
    }))
  }

  // Group items so each group fits in hardMax
  const fragments: SplitFragment[] = []
  let groupLines: string[] = []

  for (let idx = 0; idx < itemStarts.length; idx++) {
    const itemStart = itemStarts[idx]
    const itemEnd = idx + 1 < itemStarts.length ? itemStarts[idx + 1] : lines.length
    const itemLines = lines.slice(itemStart, itemEnd)
    const combined = [...groupLines, ...itemLines].join("\n")

    if (countTokensSync(combined) > hardMax && groupLines.length > 0) {
      fragments.push({ content: groupLines.join("\n"), startOffset: block.startOffset })
      groupLines = itemLines
    } else {
      groupLines = [...groupLines, ...itemLines]
    }
  }

  if (groupLines.length > 0) {
    fragments.push({ content: groupLines.join("\n"), startOffset: block.startOffset })
  }

  return fragments
}

// ─── Utility: split lines into groups at valid boundary points ───

/**
 * Split an array of lines into groups that fit within tokenBudget.
 * `isBoundary(line)` returns true for lines where a split is preferred.
 * `measureGroup(lines)` returns the token count for a group (may include header overhead).
 */
function splitLinesAtBoundaries(
  lines: string[],
  tokenBudget: number,
  isBoundary: (line: string) => boolean,
  measureGroup: (group: string[]) => number,
): string[][] {
  const groups: string[][] = []
  let current: string[] = []

  for (const line of lines) {
    const candidate = [...current, line]
    if (measureGroup(candidate) > tokenBudget && current.length > 0) {
      groups.push(current)
      current = [line]
    } else {
      current = candidate
    }
  }

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
}
