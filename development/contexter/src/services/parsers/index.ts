import type { Parser, ParserInput, ParseResult } from "./types"
import { DoclingParser, TextParser } from "./docling"
import { AudioParser } from "./audio"
import { VideoParser } from "./video"
import { YouTubeParser } from "./youtube"

export type { Parser, ParserInput, ParseResult, ParseMetadata } from "./types"

export interface ParserServiceConfig {
  doclingUrl: string
  groqApiUrl: string
  groqApiKey: string
}

export class ParserService {
  private parsers: Parser[]

  constructor(config: ParserServiceConfig) {
    this.parsers = [
      new DoclingParser(config.doclingUrl),
      new TextParser(),
      new AudioParser(config.groqApiUrl, config.groqApiKey),
      new VideoParser(config.groqApiUrl, config.groqApiKey),
      new YouTubeParser(),
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
