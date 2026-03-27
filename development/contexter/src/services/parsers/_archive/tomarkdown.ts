import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"

export class ToMarkdownParser implements Parser {
  readonly formats = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/csv",
    "application/json",
    "text/plain",
    "text/markdown",
    "text/html",
    "text/xml",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
  ]

  private ai: Ai

  constructor(ai: Ai) {
    this.ai = ai
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer =
      input.file instanceof ArrayBuffer
        ? input.file
        : await streamToBuffer(input.file)

    const blob = new Blob([buffer], { type: input.mimeType })
    const warnings: string[] = []

    const response = await this.ai.toMarkdown([
      { name: input.fileName, blob },
    ])

    if (!response || response.length === 0) {
      throw new Error(`toMarkdown returned empty response for ${input.fileName}`)
    }

    const result = response[0]
    const content = result.data

    if (!content || content.trim().length === 0) {
      warnings.push("toMarkdown returned empty content — file may be image-only or protected")
    }

    const extra: Record<string, unknown> = { warnings }

    if (result.tokens_used !== undefined) {
      extra.tokensUsed = result.tokens_used
    }

    return {
      content: content || "",
      metadata: buildMetadata(input, content || "", detectFormat(input.mimeType), {
        warnings,
      }),
    }
  }
}

function detectFormat(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/csv": "csv",
    "application/json": "json",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/html": "html",
    "text/xml": "xml",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "application/vnd.oasis.opendocument.text": "odt",
    "application/vnd.oasis.opendocument.spreadsheet": "ods",
  }
  return map[mimeType] || "unknown"
}

async function streamToBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
  const reader = stream.getReader()
  const parts: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
  }
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result.buffer
}
