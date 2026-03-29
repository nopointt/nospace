/** An image extracted from a parsed document. */
export interface ParsedImage {
  /** Raw base64-encoded image data (no data URI prefix). */
  base64: string
  /** MIME type, e.g. "image/png". */
  mimeType: string
  /** 1-based page number where the image appears. */
  page: number
  /** Width in pixels. */
  width: number
  /** Height in pixels. */
  height: number
  /** Caption text detected near the image, if any. */
  caption?: string
}

/** A ParsedImage after being persisted to R2. */
export interface StoredImage extends ParsedImage {
  /** R2 object key for this image. */
  r2Key: string
}

/**
 * A single element from Docling's ML-based document structure analysis.
 * Sourced from json_content.texts[] in the Docling API response.
 */
export interface DoclingElement {
  /** Docling element label (e.g. "title", "section_header", "narrative_text"). */
  label: string
  /** Extracted text for this element. */
  text: string
  /** 1-based page number (first provenance entry). */
  page?: number
}

export interface ParseResult {
  content: string
  metadata: ParseMetadata
  /** Images extracted from the document (PDF only, optional). */
  images?: ParsedImage[]
  /**
   * Typed elements from Docling's ML-based structure analysis.
   * Present when the Docling parser is used and json_content is available.
   * Used by the chunker for more accurate block classification than regex.
   */
  doclingElements?: DoclingElement[]
}

export interface ParseMetadata {
  sourceFormat: string
  fileName: string
  fileSize: number
  pages?: number
  sheets?: string[]
  rows?: number
  columns?: number
  wordCount: number
  charCount: number
  duration?: number
  language?: string
  warnings: string[]
}

export interface Parser {
  readonly formats: string[]
  parse(input: ParserInput): Promise<ParseResult>
}

export interface ParserInput {
  file: ArrayBuffer | ReadableStream
  fileName: string
  mimeType: string
  fileSize: number
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length
}

export function buildMetadata(
  input: ParserInput,
  content: string,
  sourceFormat: string,
  extra: Partial<ParseMetadata> = {}
): ParseMetadata {
  return {
    sourceFormat,
    fileName: input.fileName,
    fileSize: input.fileSize,
    wordCount: countWords(content),
    charCount: content.length,
    warnings: [],
    ...extra,
  }
}
