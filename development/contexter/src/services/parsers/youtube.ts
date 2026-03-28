import type { Parser, ParserInput, ParseResult } from "./types"
import { buildMetadata } from "./types"
import { streamToBuffer } from "./utils"

export class YouTubeParser implements Parser {
  readonly formats = ["text/x-youtube-url"]

  async parse(input: ParserInput): Promise<ParseResult> {
    const buffer =
      input.file instanceof ArrayBuffer
        ? input.file
        : await streamToBuffer(input.file)

    const url = new TextDecoder().decode(buffer).trim()
    const videoId = extractVideoId(url)

    if (!videoId) {
      throw new Error(`Invalid YouTube URL: ${url}`)
    }

    const transcript = await fetchTranscript(videoId)
    const warnings: string[] = []

    if (!transcript.text || transcript.text.trim().length === 0) {
      warnings.push("No subtitles available for this video")
    }

    const content = transcript.text || ""

    return {
      content,
      metadata: buildMetadata(input, content, "youtube", {
        duration: transcript.duration,
        language: transcript.language,
        warnings,
      }),
    }
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

async function fetchTranscript(
  videoId: string
): Promise<{ text: string; duration?: number; language?: string }> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
  const response = await fetch(watchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube page: ${response.status}`)
  }

  const html = await response.text()

  const captionsMatch = html.match(/"captions":\s*(\{.*?"playerCaptionsTracklistRenderer".*?\})\s*,\s*"/)
  if (!captionsMatch) {
    throw new Error("No captions data found — video may not have subtitles")
  }

  let captionsData: CaptionsData
  try {
    captionsData = JSON.parse(captionsMatch[1])
  } catch {
    throw new Error("Failed to parse captions JSON from YouTube page")
  }

  const tracks =
    captionsData?.playerCaptionsTracklistRenderer?.captionTracks || []

  if (tracks.length === 0) {
    return { text: "", language: undefined }
  }

  const track =
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode === "ru") ||
    tracks[0]

  // SSRF guard — only allow YouTube/Google CDN hostnames for caption track URLs
  let captionHostname: string
  try {
    captionHostname = new URL(track.baseUrl).hostname
  } catch {
    throw new Error("Invalid caption track URL")
  }
  const ALLOWED_CAPTION_HOSTS = ["www.youtube.com", "youtube.com", "googlevideo.com", "www.google.com", "google.com"]
  const isAllowedHost = ALLOWED_CAPTION_HOSTS.some(
    (h) => captionHostname === h || captionHostname.endsWith(`.${h}`)
  )
  if (!isAllowedHost) {
    throw new Error("Caption track URL has disallowed hostname")
  }

  const captionResponse = await fetch(track.baseUrl + "&fmt=json3")
  if (!captionResponse.ok) {
    throw new Error(`Failed to fetch caption track: ${captionResponse.status}`)
  }

  const captionJson = (await captionResponse.json()) as CaptionJson

  const lines: string[] = []
  let maxEnd = 0

  for (const event of captionJson.events || []) {
    if (!event.segs) continue
    const text = event.segs.map((s) => s.utf8).join("")
    const cleaned = text.replace(/\n/g, " ").trim()
    if (cleaned) {
      lines.push(cleaned)
      const end = (event.tStartMs + (event.dDurationMs || 0)) / 1000
      if (end > maxEnd) maxEnd = end
    }
  }

  return {
    text: lines.join(" "),
    duration: maxEnd > 0 ? Math.round(maxEnd) : undefined,
    language: track.languageCode,
  }
}

interface CaptionsData {
  playerCaptionsTracklistRenderer?: {
    captionTracks?: Array<{
      baseUrl: string
      languageCode: string
    }>
  }
}

interface CaptionJson {
  events?: Array<{
    tStartMs: number
    dDurationMs?: number
    segs?: Array<{ utf8: string }>
  }>
}

