import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"
import { streamToBuffer } from "./utils"
import { MistralOcrService, isMimeTypeSupportedByMistral } from "./mistral-ocr"

/**
 * Document parser using Docling API (IBM, MIT license).
 * Replaces Workers AI toMarkdown.
 * Supports: PDF, DOCX, XLSX, PPTX, images, HTML.
 * Docling runs as a Docker container with REST API.
 */
export class DoclingParser implements Parser {
  // P3-009: ODS added here — it's a ZIP-based format that TextDecoder garbles
  readonly formats = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.spreadsheet",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/html",
  ]

  private doclingUrl: string

  constructor(doclingUrl: string) {
    this.doclingUrl = doclingUrl.replace(/\/$/, "")
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer = input.file instanceof ArrayBuffer
      ? input.file
      : await streamToBuffer(input.file)

    const formData = new FormData()
    const blob = new Blob([buffer], { type: input.mimeType })
    formData.append("files", blob, input.fileName)

    // P0-003: Docling-serve 1.15.0 API is at /v1/convert/file (no /api prefix)
    // P2-007: 90s timeout — shorter than 120s pipeline timeout to get clean error
    const res = await fetch(`${this.doclingUrl}/v1/convert/file`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(90_000),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Docling API error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json() as DoclingResponse
    const content = data.document?.md_content ?? data.md_content ?? ""
    const warnings: string[] = []

    if (!content || content.trim().length === 0) {
      warnings.push("Docling returned empty content — file may be image-only or protected")
    }

    // F-024: Mistral OCR cloud fallback
    // Triggers when local OCR produced empty output AND cloud fallback is enabled
    const cloudFallbackEnabled = process.env.OCR_CLOUD_FALLBACK_ENABLED === "true"
    const ocrFailed = !content || content.trim().length === 0
    const mimeSupported = isMimeTypeSupportedByMistral(input.mimeType)

    if (cloudFallbackEnabled && ocrFailed && mimeSupported) {
      console.log(JSON.stringify({
        event: "mistral_ocr_fallback_triggered",
        fileName: input.fileName,
        mimeType: input.mimeType,
      }))

      try {
        const mistralApiKey = process.env.MISTRAL_API_KEY
        if (!mistralApiKey) {
          warnings.push("Mistral OCR fallback enabled but MISTRAL_API_KEY not set")
        } else {
          const mistralOcr = new MistralOcrService(mistralApiKey)
          const fallback = await mistralOcr.ocr(buffer, input.mimeType)

          if (fallback.content.trim().length > 0) {
            console.log(JSON.stringify({
              event: "mistral_ocr_success",
              fileName: input.fileName,
              pageCount: fallback.pageCount,
              contentLength: fallback.content.length,
            }))
            return {
              content: fallback.content,
              metadata: buildMetadata(input, fallback.content, detectFormat(input.mimeType), {
                warnings: ["Content extracted via Mistral OCR cloud fallback"],
              }),
            }
          } else {
            warnings.push("Mistral OCR also returned empty content")
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        warnings.push(`Mistral OCR fallback failed: ${msg}`)
        console.error(JSON.stringify({ event: "mistral_ocr_fallback_failed", error: msg }))
      }
    }

    return {
      content: content || "",
      metadata: buildMetadata(input, content || "", detectFormat(input.mimeType), { warnings }),
    }
  }
}

/**
 * Simple text parser for formats that don't need Docling.
 * Handles: TXT, MD, CSV, JSON, XML, SVG, ODT.
 * Note: ODS (spreadsheet) moved to DoclingParser — ZIP-based, TextDecoder garbles it.
 */
export class TextParser implements Parser {
  readonly formats = [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/xml",
    "image/svg+xml",
    "application/vnd.oasis.opendocument.text",
  ]

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer = input.file instanceof ArrayBuffer
      ? input.file
      : await streamToBuffer(input.file)

    const content = new TextDecoder().decode(buffer)

    return {
      content,
      metadata: buildMetadata(input, content, detectFormat(input.mimeType), {}),
    }
  }
}

interface DoclingResponse {
  document?: { md_content?: string }
  md_content?: string
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
  }
  return map[mimeType] || "unknown"
}

