import type { Parser, ParserInput, ParseResult, ParsedImage } from "./types"
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
    // Request both MD (text) and JSON (images) output formats
    formData.append("to_formats", "md")
    formData.append("to_formats", "json")
    // Embed images as base64 in the JSON output for extraction
    formData.append("image_export_mode", "embedded")

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
    // Extract images from Docling JSON output (PDFs only)
    const images = input.mimeType === "application/pdf"
      ? extractImagesFromDocling(data)
      : undefined

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
      images: images && images.length > 0 ? images : undefined,
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

interface DoclingPictureItem {
  self_ref?: string
  /** Base64-encoded image data URI or raw base64 string. */
  data?: string
  /** Image dimensions reported by Docling. */
  size?: { width?: number; height?: number }
  /** 1-based page number. */
  prov?: Array<{ page_no?: number }>
}

interface DoclingDocumentJson {
  pictures?: DoclingPictureItem[]
  /** Docling may nest items under "body.children" */
  body?: { children?: DoclingPictureItem[] }
  texts?: Array<{ text?: string; label?: string; prov?: Array<{ page_no?: number }> }>
}

interface DoclingResponse {
  document?: {
    md_content?: string
    /** Parsed JSON document structure when json format is requested. */
    json_content?: DoclingDocumentJson
  }
  md_content?: string
  json_content?: DoclingDocumentJson
}

// Minimum decoded size (5 KB) — skip decorative or blank images
const MIN_IMAGE_BYTES = 5 * 1024
// Minimum dimension — skip icons, bullets
const MIN_IMAGE_DIM = 150

/**
 * Extract images from Docling JSON response, applying size/dimension filters.
 * Returns ParsedImage[] ready for R2 storage.
 */
function extractImagesFromDocling(data: DoclingResponse): ParsedImage[] {
  const jsonDoc: DoclingDocumentJson | undefined =
    data.document?.json_content ?? data.json_content

  if (!jsonDoc?.pictures || jsonDoc.pictures.length === 0) {
    return []
  }

  // Build a quick lookup: page_no → nearest text (caption candidate)
  const captionByPage = buildCaptionLookup(jsonDoc)

  const images: ParsedImage[] = []

  for (const pic of jsonDoc.pictures) {
    if (!pic.data) continue

    // Strip data URI prefix if present: "data:image/png;base64,<data>"
    const colonSemi = pic.data.indexOf(";base64,")
    const raw = colonSemi !== -1 ? pic.data.slice(colonSemi + 8) : pic.data
    const mimeType = colonSemi !== -1
      ? pic.data.slice(5, colonSemi)  // "image/png"
      : "image/png"

    // Dimension check
    const width = pic.size?.width ?? 0
    const height = pic.size?.height ?? 0
    if (width < MIN_IMAGE_DIM || height < MIN_IMAGE_DIM) continue

    // Decoded size check — base64 is 4/3 ratio
    const approxBytes = Math.floor(raw.length * 0.75)
    if (approxBytes < MIN_IMAGE_BYTES) continue

    const page = pic.prov?.[0]?.page_no ?? 1

    images.push({
      base64: raw,
      mimeType,
      page,
      width,
      height,
      caption: captionByPage.get(page),
    })
  }

  return images
}

/**
 * Build a map from page number to the first "caption"-labelled text on that page.
 * Falls back to empty map if no texts are present.
 */
function buildCaptionLookup(doc: DoclingDocumentJson): Map<number, string> {
  const map = new Map<number, string>()
  if (!doc.texts) return map
  for (const t of doc.texts) {
    if (t.label !== "caption" || !t.text) continue
    const page = t.prov?.[0]?.page_no ?? 0
    if (page > 0 && !map.has(page)) {
      map.set(page, t.text)
    }
  }
  return map
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

