import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"
import { streamToBuffer } from "./utils"
import { randomUUID } from "crypto"
import { unlink, writeFile, stat } from "fs/promises"
import { existsSync } from "fs"
import { segmentAndTranscribe } from "./audio-segmenter"

const MAX_DIRECT_BYTES = 23 * 1024 * 1024

export class VideoParser implements Parser {
  readonly formats = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
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

    const id = randomUUID()
    const videoPath = `/tmp/${id}-input`
    const audioPath = `/tmp/${id}.wav`

    try {
      // Write video buffer to temp file
      await writeFile(videoPath, Buffer.from(buffer))

      // Extract audio using ffmpeg:
      //   -vn       : no video
      //   -acodec pcm_s16le : WAV format
      //   -ar 16000 : 16 kHz sample rate (Whisper optimal)
      //   -ac 1     : mono channel
      const ffmpeg = Bun.spawn(
        ["ffmpeg", "-y", "-i", videoPath, "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audioPath],
        {
          stdout: "pipe",
          stderr: "pipe",
        }
      )

      const exitCode = await Promise.race([
        ffmpeg.exited,
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            ffmpeg.kill()
            reject(new Error("ffmpeg timed out after 5 minutes"))
          }, 5 * 60 * 1000)
        ),
      ])

      if (exitCode !== 0) {
        const stderrText = await new Response(ffmpeg.stderr).text()
        // No audio track is a known case — return empty content gracefully
        if (stderrText.includes("no streams") || stderrText.includes("Invalid data") || !existsSync(audioPath)) {
          return {
            content: "",
            metadata: buildMetadata(input, "", "video", {
              warnings: ["Video has no audio track or could not be decoded by ffmpeg"],
            }),
          }
        }
        throw new Error(`ffmpeg exited with code ${exitCode}: ${stderrText.slice(0, 500)}`)
      }

      // Check WAV size to decide transcription path
      const wavSize = (await stat(audioPath)).size

      if (wavSize <= MAX_DIRECT_BYTES) {
        return this.transcribeDirectWhisper(audioPath, id, input)
      }

      // Large WAV: use silence-aware segmenter
      // segmentAndTranscribe expects the input path + ext; WAV is already 16kHz mono
      const result = await segmentAndTranscribe({
        inputPath: audioPath,
        ext: "wav",
        groqApiUrl: this.groqApiUrl,
        groqApiKey: this.groqApiKey,
      })

      const content = result.text
      return {
        content,
        metadata: buildMetadata(input, content, "video", {
          duration: result.duration,
          language: result.language,
          warnings: result.warnings,
        }),
      }
    } finally {
      // Clean up temp files unconditionally
      for (const path of [videoPath, audioPath]) {
        if (existsSync(path)) {
          await unlink(path).catch((e) =>
            console.error(`Failed to clean up temp file ${path}:`, e instanceof Error ? e.message : String(e))
          )
        }
      }
    }
  }

  private async transcribeDirectWhisper(
    audioPath: string,
    id: string,
    input: ParserInput
  ): Promise<ParseResult> {
    const { readFile } = await import("fs/promises")
    const wavBuffer = await readFile(audioPath)

    const formData = new FormData()
    const blob = new Blob([wavBuffer], { type: "audio/wav" })
    formData.append("file", blob, `${id}.wav`)
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
      metadata: buildMetadata(input, content, "video", {
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
