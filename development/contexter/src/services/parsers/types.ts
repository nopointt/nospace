export interface ParseResult {
  content: string
  metadata: ParseMetadata
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
