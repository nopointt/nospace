import type { Parser, ParserInput, ParseResult } from "./types"
import { DoclingParser, TextParser } from "./docling"
import { AudioParser } from "./audio"
import { VideoParser } from "./video"
import { YouTubeParser } from "./youtube"

export type { Parser, ParserInput, ParseResult, ParseMetadata, ParsedImage, StoredImage } from "./types"

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
      new YouTubeParser(config.groqApiUrl, config.groqApiKey),
    ]
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const baseMime = input.mimeType.split(";")[0].trim()
    const parser = this.parsers.find((p) => p.formats.includes(baseMime))

    if (!parser) {
      throw new Error(`No parser found for MIME type: ${baseMime}`)
    }

    return parser.parse({ ...input, mimeType: baseMime })
  }

  supports(mimeType: string): boolean {
    const baseMime = mimeType.split(";")[0].trim()
    return this.parsers.some((p) => p.formats.includes(baseMime))
  }

  supportedFormats(): string[] {
    return this.parsers.flatMap((p) => p.formats)
  }
}
