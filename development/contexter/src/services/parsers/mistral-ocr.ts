/**
 * F-024: Mistral OCR API fallback for documents where local OCR (Docling/Tesseract)
 * produces empty output.
 *
 * Endpoint: POST https://api.mistral.ai/v1/ocr
 * Model: mistral-ocr-latest
 * Cost: ~$1-2 per 1000 pages.
 * Privacy: raw document bytes are sent to Mistral servers.
 *          Opt-in only via OCR_CLOUD_FALLBACK_ENABLED=true.
 */

export interface MistralOcrResult {
  content: string
  pageCount: number
}

/** MIME types accepted by the Mistral OCR endpoint. */
const MISTRAL_OCR_SUPPORTED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
])

export function isMimeTypeSupportedByMistral(mimeType: string): boolean {
  return MISTRAL_OCR_SUPPORTED_MIMES.has(mimeType)
}

export class MistralOcrService {
  private readonly apiKey: string
  private readonly baseUrl = "https://api.mistral.ai/v1"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Send a document buffer to Mistral OCR API.
   * Uses base64-encoded document body (no file-upload pre-step for <= 10 MB files).
   * For larger files the same approach works — Mistral's API accepts it.
   *
   * @throws Error if Mistral API returns non-2xx status.
   */
  async ocr(buffer: ArrayBuffer, mimeType: string): Promise<MistralOcrResult> {
    const bytes = new Uint8Array(buffer)

    // Convert to base64 in chunks to avoid call-stack overflow on large buffers
    let binary = ""
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)

    const requestBody = {
      model: "mistral-ocr-latest",
      document: {
        type: "base64_document",
        data: base64,
        media_type: mimeType,
      },
    }

    const res = await fetch(`${this.baseUrl}/ocr`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Mistral OCR error ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json() as MistralOcrResponse

    const content = (data.pages ?? [])
      .map((p) => p.markdown ?? "")
      .filter((t) => t.trim().length > 0)
      .join("\n\n")

    return {
      content,
      pageCount: data.pages?.length ?? 0,
    }
  }
}

interface MistralOcrResponse {
  pages?: Array<{ markdown?: string; index?: number }>
  usage?: { pages_processed?: number }
}
