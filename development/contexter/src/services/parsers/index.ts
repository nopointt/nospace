import type { Parser, ParserInput, ParseResult } from "./types"
import { ToMarkdownParser } from "./tomarkdown"
import { AudioParser } from "./audio"
import { YouTubeParser } from "./youtube"
import { PdfVisualParser } from "./pdf-visual"

export type { Parser, ParserInput, ParseResult, ParseMetadata } from "./types"

export interface ParserServiceConfig {
  ai: Ai
  groqApiUrl: string
  groqApiKey: string
}

export class ParserService {
  private parsers: Parser[]

  constructor(config: ParserServiceConfig) {
    this.parsers = [
      new ToMarkdownParser(config.ai),
      new AudioParser(config.groqApiUrl, config.groqApiKey),
      new YouTubeParser(),
      new PdfVisualParser(config.ai),
    ]
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const parser = this.parsers.find((p) => p.formats.includes(input.mimeType))

    if (!parser) {
      throw new Error(`No parser found for MIME type: ${input.mimeType}`)
    }

    return parser.parse(input)
  }

  supports(mimeType: string): boolean {
    return this.parsers.some((p) => p.formats.includes(mimeType))
  }

  supportedFormats(): string[] {
    return this.parsers.flatMap((p) => p.formats)
  }
}
