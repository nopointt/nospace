import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"

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
