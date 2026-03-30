export function formatSize(bytes: number | null | undefined): string {
  if (!bytes || isNaN(bytes)) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}`
}

export function formatDateFull(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function statusToVariant(status: string): "processing" | "ready" | "error" | "pending" {
  if (status === "ready" || status === "completed") return "ready"
  if (status === "error" || status === "failed") return "error"
  if (status === "processing") return "processing"
  return "pending"
}

export function humanizeError(raw: string | null | undefined): string {
  if (!raw) return "Ошибка обработки. Попробуйте ещё раз."
  const lower = raw.toLowerCase()
  if (lower.includes("timed out") || lower.includes("timeout")) return "Время ожидания истекло. Попробуйте файл меньшего размера."
  if (lower.includes("no parser found") || lower.includes("unsupported")) return "Формат файла не поддерживается."
  if (lower.includes("exceeds") || lower.includes("too large") || lower.includes("limit")) return "Файл слишком большой."
  if (lower.includes("groq") || lower.includes("whisper") || lower.includes("transcri")) return "Ошибка транскрипции. Попробуйте позже."
  if (lower.includes("docling")) return "Ошибка распознавания документа. Попробуйте другой формат."
  return "Ошибка обработки. Попробуйте ещё раз."
}

export function mimeShort(mime: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "application/json": "json",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "video/mp4": "mp4",
  }
  if (!mime) return "файл"
  return map[mime] ?? mime.split("/").pop() ?? mime
}
