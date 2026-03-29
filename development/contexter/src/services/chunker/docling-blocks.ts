/**
 * Converts Docling ML-classified elements into Block[] for structure-aware chunking.
 *
 * Docling's element labels come from its ML pipeline and are more accurate than
 * regex-based detection for PDF/DOCX/PPTX — e.g., a PDF table without pipe syntax
 * is still correctly identified.
 *
 * Label mapping:
 *   title, section_header  → heading   (split boundary)
 *   code                   → code_block (atomic)
 *   table                  → table      (atomic)
 *   list_item              → list       (contiguous items accumulated)
 *   narrative_text         → paragraph  (normal)
 *   caption                → paragraph  (attach to preceding block)
 *   footnote, page_header,
 *   page_footer            → (skipped)
 */
import type { DoclingElement } from "../parsers/types"
import type { Block, BlockType } from "./block-classifier"
import { countTokensSync } from "./tokenizer"

/** Labels that produce structural blocks. */
const LABEL_TO_TYPE: Record<string, BlockType> = {
  title: "heading",
  section_header: "heading",
  code: "code_block",
  table: "table",
  list_item: "list",
  narrative_text: "paragraph",
  caption: "paragraph",
}

/** Labels that should be excluded from chunking entirely. */
const SKIPPED_LABELS = new Set(["footnote", "page_header", "page_footer"])

/**
 * Convert Docling-typed elements into Block[] compatible with the semantic chunker.
 *
 * Contiguous list_item elements are accumulated into a single list block so the
 * chunker treats them as one atomic unit — matching classifyBlocks() behaviour.
 *
 * Offsets are character-position estimates within the reconstructed text stream.
 * They are used only for overlap calculation in the semantic chunker and do not
 * need to match byte positions in the original document.
 */
export function doclingElementsToBlocks(elements: DoclingElement[]): Block[] {
  if (elements.length === 0) return []

  const blocks: Block[] = []
  let pendingListLines: string[] = []
  let listStartOffset = 0
  let currentOffset = 0

  // Heading path tracking — mirrors classifyBlocks() heading hierarchy logic
  const headingLevels = new Map<number, string>()
  let currentHeadingPath: string | undefined

  for (const element of elements) {
    if (SKIPPED_LABELS.has(element.label)) {
      currentOffset += element.text.length + 1
      continue
    }

    const blockType = LABEL_TO_TYPE[element.label]
    if (!blockType) {
      currentOffset += element.text.length + 1
      continue
    }

    // Flush accumulated list when a non-list element arrives
    if (blockType !== "list" && pendingListLines.length > 0) {
      blocks.push(buildListBlock(pendingListLines, listStartOffset, currentHeadingPath))
      pendingListLines = []
    }

    if (blockType === "list") {
      if (pendingListLines.length === 0) {
        listStartOffset = currentOffset
      }
      pendingListLines.push(`- ${element.text}`)
      currentOffset += element.text.length + 1
      continue
    }

    if (blockType === "heading") {
      // Heading level: title → 1, section_header → 2
      const level = element.label === "title" ? 1 : 2
      const headingText = element.text

      headingLevels.set(level, headingText)
      for (const key of Array.from(headingLevels.keys())) {
        if (key > level) headingLevels.delete(key)
      }
      currentHeadingPath = Array.from(
        new Map([...headingLevels.entries()].sort((a, b) => a[0] - b[0])).values()
      ).join(" > ")

      const content = `${"#".repeat(level)} ${headingText}`
      blocks.push({
        type: "heading",
        content,
        startOffset: currentOffset,
        endOffset: currentOffset + content.length,
        tokenCount: countTokensSync(content),
        headingPath: currentHeadingPath,
        headingLevel: level,
        headingText,
      })
      currentOffset += content.length + 1
      continue
    }

    // paragraph, code_block, table
    const content = element.text
    blocks.push({
      type: blockType,
      content,
      startOffset: currentOffset,
      endOffset: currentOffset + content.length,
      tokenCount: countTokensSync(content),
      headingPath: currentHeadingPath,
    })
    currentOffset += content.length + 1
  }

  // Flush any trailing list
  if (pendingListLines.length > 0) {
    blocks.push(buildListBlock(pendingListLines, listStartOffset, currentHeadingPath))
  }

  return blocks
}

function buildListBlock(
  lines: string[],
  startOffset: number,
  headingPath: string | undefined,
): Block {
  const content = lines.join("\n")
  return {
    type: "list",
    content,
    startOffset,
    endOffset: startOffset + content.length,
    tokenCount: countTokensSync(content),
    headingPath,
  }
}
