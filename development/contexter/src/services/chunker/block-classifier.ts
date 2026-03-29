/**
 * Block classifier for structure-aware chunking.
 * Scans markdown/text line by line and classifies contiguous ranges into typed blocks.
 * Code blocks, tables, and lists are detected as atomic units that should not be split.
 * Headings are detected as section boundaries.
 */
import { countTokensSync } from "./tokenizer"

export type BlockType = "heading" | "code_block" | "table" | "list" | "paragraph"

export interface Block {
  type: BlockType
  content: string
  startOffset: number
  endOffset: number
  tokenCount: number
  /** Active heading path at this block's position (e.g. "API > Authentication") */
  headingPath?: string
  /** Heading level 1-6 (heading blocks only) */
  headingLevel?: number
  /** Heading text without # prefix (heading blocks only) */
  headingText?: string
  /** Code fence language hint (code_block only) */
  language?: string
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/
const CODE_FENCE_RE = /^(`{3,}|~{3,})(.*)/
const LIST_ITEM_RE = /^(\s*)([-*+]|\d+\.)\s/
const TABLE_ROW_RE = /^\s*\|/

/**
 * Returns true if the line is a markdown table separator (e.g. |---|:---:|).
 * Requires at least one cell with 3+ dashes.
 */
function isTableSeparator(line: string): boolean {
  return TABLE_ROW_RE.test(line) && /\|[\s:-]*-{3,}[\s:-]*\|/.test(line)
}

/**
 * Returns true if a closing code fence matches the opening fence.
 * Closing fence must have at least as many fence chars as opening, no other content.
 */
function isClosingFence(line: string, openFenceChar: string, openFenceLen: number): boolean {
  const trimmed = line.trim()
  if (trimmed.length < openFenceLen) return false
  let count = 0
  while (count < trimmed.length && trimmed[count] === openFenceChar) count++
  return count >= openFenceLen && trimmed.slice(count).trim() === ""
}

/**
 * Classify text into structural blocks.
 *
 * Priority (highest first):
 * 1. Code fences (``` or ~~~) — everything between fences is one block
 * 2. Headings (# through ######)
 * 3. Tables (| rows with separator)
 * 4. Lists (- / * / + / 1. items with continuations)
 * 5. Paragraphs (everything else, split on blank lines)
 */
export function classifyBlocks(text: string): Block[] {
  if (!text || text.trim().length === 0) return []

  const lines = text.split("\n")
  const blocks: Block[] = []

  // Accumulator state
  let inCodeBlock = false
  let codeFenceChar = ""
  let codeFenceLen = 0
  let codeLanguage = ""
  let accLines: string[] = []
  let accStartOffset = 0
  let accType: BlockType = "paragraph"

  // Heading path hierarchy (same as old buildHeadingEvents logic)
  const headingLevels = new Map<number, string>()
  let currentHeadingPath: string | undefined

  let offset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineOffset = offset
    offset += line.length + 1 // +1 for \n

    // === Inside code block: only look for closing fence ===
    if (inCodeBlock) {
      if (isClosingFence(line, codeFenceChar, codeFenceLen)) {
        accLines.push(line)
        flushAs("code_block")
      } else {
        accLines.push(line)
      }
      continue
    }

    // === Code fence opening ===
    const fenceMatch = CODE_FENCE_RE.exec(line)
    if (fenceMatch) {
      flush()
      codeFenceChar = fenceMatch[1][0]
      codeFenceLen = fenceMatch[1].length
      codeLanguage = fenceMatch[2].trim()
      accType = "code_block"
      accStartOffset = lineOffset
      accLines = [line]
      inCodeBlock = true
      continue
    }

    // === Heading ===
    const headingMatch = HEADING_RE.exec(line)
    if (headingMatch) {
      flush()
      const level = headingMatch[1].length
      const headingText = headingMatch[2].trim()

      // Update heading hierarchy: set this level, clear all deeper levels
      headingLevels.set(level, headingText)
      for (const key of Array.from(headingLevels.keys())) {
        if (key > level) headingLevels.delete(key)
      }
      currentHeadingPath = Array.from(
        new Map([...headingLevels.entries()].sort((a, b) => a[0] - b[0])).values()
      ).join(" > ")

      blocks.push({
        type: "heading",
        content: line,
        startOffset: lineOffset,
        endOffset: lineOffset + line.length,
        tokenCount: countTokensSync(line),
        headingPath: currentHeadingPath,
        headingLevel: level,
        headingText,
      })
      continue
    }

    // === Blank line ===
    if (line.trim() === "") {
      if (accType === "list") {
        // Lists survive blank lines between items — accumulate and decide later.
        // Trailing blanks are trimmed on flush.
        accLines.push(line)
        continue
      }
      flush()
      continue
    }

    // === Table row (starts with |) ===
    if (TABLE_ROW_RE.test(line)) {
      if (accType !== "table") {
        flush()
        accType = "table"
        accStartOffset = lineOffset
        accLines = []
      }
      accLines.push(line)
      continue
    }

    // === List item ===
    if (LIST_ITEM_RE.test(line)) {
      if (accType !== "list") {
        flush()
        accType = "list"
        accStartOffset = lineOffset
        accLines = []
      }
      accLines.push(line)
      continue
    }

    // === List continuation: indented line while accumulating a list ===
    if (accType === "list" && /^\s{2,}\S/.test(line)) {
      accLines.push(line)
      continue
    }

    // === Non-list content ends a list block ===
    if (accType === "list") {
      flush()
    }

    // === Regular text → paragraph ===
    if (accType !== "paragraph") {
      flush()
    }
    if (accLines.length === 0) {
      accType = "paragraph"
      accStartOffset = lineOffset
    }
    accLines.push(line)
  }

  // Flush remaining content (handles unclosed code blocks gracefully)
  if (inCodeBlock) {
    flushAs("code_block")
  } else {
    flush()
  }

  return blocks

  /** Flush accumulator as its detected type. */
  function flush(): void {
    flushAs(accType)
  }

  /** Flush accumulator, forcing a specific block type. */
  function flushAs(type: BlockType): void {
    if (accLines.length === 0) return

    // Trim trailing blank lines (especially from lists that survived blank lines)
    let trimmedLines = accLines
    if (type !== "code_block") {
      while (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1].trim() === "") {
        trimmedLines = trimmedLines.slice(0, -1)
      }
    }
    if (trimmedLines.length === 0) {
      accLines = []
      accType = "paragraph"
      return
    }

    const content = trimmedLines.join("\n")

    // Validate table: must have a separator row to be a real markdown table
    let finalType = type
    if (type === "table" && !trimmedLines.some(isTableSeparator)) {
      finalType = "paragraph"
    }

    blocks.push({
      type: finalType,
      content,
      startOffset: accStartOffset,
      endOffset: accStartOffset + content.length,
      tokenCount: countTokensSync(content),
      headingPath: currentHeadingPath,
      language: type === "code_block" ? (codeLanguage || undefined) : undefined,
    })

    // Reset accumulator
    accLines = []
    accType = "paragraph"
    codeLanguage = ""
    inCodeBlock = false
  }
}
