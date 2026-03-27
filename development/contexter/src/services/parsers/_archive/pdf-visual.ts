import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"

export class PdfVisualParser implements Parser {
  readonly formats = ["application/pdf+visual"]

  private ai: Ai

  constructor(ai: Ai) {
    this.ai = ai
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer =
      input.file instanceof ArrayBuffer
        ? input.file
        : await streamToBuffer(input.file)

    const base64 = arrayBufferToBase64(buffer)
    const warnings: string[] = []

    const messages = [
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "Extract ALL text content from this PDF page image. Preserve structure: headings, lists, tables, paragraphs. Output as markdown. If there are tables, render them as markdown tables. Do not summarize — extract verbatim.",
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/png;base64,${base64}`,
            },
          },
        ],
      },
    ]

    const response = await this.ai.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages,
      max_tokens: 4096,
    }) as AiTextGenerationOutput

    const content =
      typeof response === "string"
        ? response
        : (response as { response?: string })?.response || ""

    if (!content || content.trim().length === 0) {
      warnings.push("Vision LLM returned empty content — page may be blank or unreadable")
    }

    return {
      content,
      metadata: buildMetadata(input, content, "pdf-visual", {
        pages: 1,
        warnings,
      }),
    }
  }
}

interface AiTextGenerationOutput {
  response?: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
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
