import type { Chunk } from "./types"
import { countTokens } from "./tokenizer"

/**
 * Table chunker: splits markdown tables by rows.
 * Each row becomes a chunk with the header prepended for context.
 * Groups small rows together up to maxTokens.
 */
export function chunkTable(text: string, maxTokens: number = 500): Chunk[] {
  const chunks: Chunk[] = []
  const tables = extractTables(text)
  const nonTableParts = extractNonTableParts(text, tables)

  // Non-table content as a single chunk (if any)
  for (const part of nonTableParts) {
    if (part.text.trim().length > 0) {
      chunks.push({
        content: part.text.trim(),
        index: chunks.length,
        tokenCount: countTokens(part.text),
        startOffset: part.offset,
        endOffset: part.offset + part.text.length,
        metadata: { type: "row" },
      })
    }
  }

  // Each table: header + groups of rows
  for (const table of tables) {
    const lines = table.text.split("\n").filter((l) => l.trim().length > 0)
    if (lines.length < 2) continue

    const header = lines[0]
    const separator = lines[1]
    const headerBlock = `${header}\n${separator}`
    const headerTokens = countTokens(headerBlock)
    const dataRows = lines.slice(2)

    let currentRows: string[] = []
    let currentTokens = headerTokens

    for (const row of dataRows) {
      const rowTokens = countTokens(row)

      if (currentTokens + rowTokens > maxTokens && currentRows.length > 0) {
        chunks.push({
          content: `${headerBlock}\n${currentRows.join("\n")}`,
          index: chunks.length,
          tokenCount: currentTokens,
          startOffset: table.offset,
          endOffset: table.offset + table.text.length,
          metadata: {
            type: "row",
            sheet: table.sheetName,
          },
        })
        currentRows = []
        currentTokens = headerTokens
      }

      currentRows.push(row)
      currentTokens += rowTokens
    }

    if (currentRows.length > 0) {
      chunks.push({
        content: `${headerBlock}\n${currentRows.join("\n")}`,
        index: chunks.length,
        tokenCount: currentTokens,
        startOffset: table.offset,
        endOffset: table.offset + table.text.length,
        metadata: {
          type: "row",
          sheet: table.sheetName,
        },
      })
    }
  }

  return chunks
}

interface TableBlock {
  text: string
  offset: number
  sheetName?: string
}

function extractTables(text: string): TableBlock[] {
  const tables: TableBlock[] = []
  const lines = text.split("\n")
  let i = 0

  while (i < lines.length) {
    // Look for separator row (|---|---|)
    if (i > 0 && /^\|[\s\-:|]+\|$/.test(lines[i].trim())) {
      // Found separator — header is previous line, collect data rows after
      const headerIdx = i - 1
      let endIdx = i + 1
      while (endIdx < lines.length && lines[endIdx].trim().startsWith("|")) {
        endIdx++
      }
      const tableLines = lines.slice(headerIdx, endIdx)
      const tableText = tableLines.join("\n")
      const offset = text.indexOf(lines[headerIdx])
      tables.push({ text: tableText, offset })
      i = endIdx
    } else {
      i++
    }
  }

  return tables
}

function extractNonTableParts(
  text: string,
  tables: TableBlock[]
): Array<{ text: string; offset: number }> {
  if (tables.length === 0) return [{ text, offset: 0 }]

  const parts: Array<{ text: string; offset: number }> = []
  let lastEnd = 0

  for (const table of tables) {
    if (table.offset > lastEnd) {
      parts.push({ text: text.slice(lastEnd, table.offset), offset: lastEnd })
    }
    lastEnd = table.offset + table.text.length
  }

  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), offset: lastEnd })
  }

  return parts
}
