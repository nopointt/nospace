import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"
import { streamToBuffer } from "./utils"
import { randomUUID } from "crypto"
import { writeFile, unlink } from "fs/promises"
import { existsSync } from "fs"
import { segmentAndTranscribe } from "./audio-segmenter"

const MAX_DIRECT_BYTES = 23 * 1024 * 1024

export class AudioParser implements Parser {
  readonly formats = [
    "audio/mpeg",
    "audio/wav",
    "audio/mp4",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
  ]

  private groqApiUrl: string
  private groqApiKey: string

  constructor(groqApiUrl: string, groqApiKey: string) {
    this.groqApiUrl = groqApiUrl
    this.groqApiKey = groqApiKey
  }

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer =
      input.file instanceof ArrayBuffer
        ? input.file
        : await streamToBuffer(input.file)

    if (buffer.byteLength <= MAX_DIRECT_BYTES) {
      return this.parseDirectWhisper(buffer, input)
    }

    return this.parseSegmented(buffer, input)
  }

  private async parseDirectWhisper(buffer: ArrayBuffer, input: ParserInput): Promise<ParseResult> {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: input.mimeType })
    formData.append("file", blob, input.fileName)
    formData.append("model", "whisper-large-v3")
    formData.append("response_format", "verbose_json")

    const response = await fetch(this.groqApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.groqApiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(110_000),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Groq Whisper error ${response.status}: ${error}`)
    }

    const result = (await response.json()) as WhisperResponse
    const warnings: string[] = []

    if (!result.text || result.text.trim().length === 0) {
      warnings.push("Whisper returned empty transcription — audio may be silent or corrupted")
    }

    const content = result.text || ""

    return {
      content,
      metadata: buildMetadata(input, content, "audio", {
        duration: result.duration,
        language: result.language,
        warnings,
      }),
    }
  }

  private async parseSegmented(buffer: ArrayBuffer, input: ParserInput): Promise<ParseResult> {
    const id = randomUUID()
    // Derive extension from fileName or mimeType
    const ext = deriveExtension(input.fileName, input.mimeType)
    const inputPath = `/tmp/${id}-input.${ext}`

    try {
      await writeFile(inputPath, Buffer.from(buffer))

      const result = await segmentAndTranscribe({
        inputPath,
        ext,
        groqApiUrl: this.groqApiUrl,
        groqApiKey: this.groqApiKey,
      })

      const content = result.text

      return {
        content,
        metadata: buildMetadata(input, content, "audio", {
          duration: result.duration,
          language: result.language,
          warnings: result.warnings,
        }),
      }
    } finally {
      if (existsSync(inputPath)) {
        await unlink(inputPath).catch((e) =>
          console.error(`Failed to clean up ${inputPath}:`, e instanceof Error ? e.message : String(e))
        )
      }
    }
  }
}

function deriveExtension(fileName: string, mimeType: string): string {
  const fromName = fileName.split(".").pop()
  if (fromName && fromName.length > 0 && fromName.length <= 5) return fromName

  const mimeMap: Record<string, string> = {
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
  }
  return mimeMap[mimeType] ?? "audio"
}

interface WhisperResponse {
  text: string
  language: string
  duration: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}
