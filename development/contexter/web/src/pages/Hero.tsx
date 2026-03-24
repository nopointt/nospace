import { A } from "@solidjs/router"
import {
  createSignal,
  createEffect,
  onCleanup,
  For,
  Show,
  type Component,
} from "solid-js"
import Nav from "../components/Nav"
import Button from "../components/Button"
import Badge from "../components/Badge"
import PipelineIndicator from "../components/PipelineIndicator"
import AuthModal from "../components/AuthModal"
import Toast, { showToast } from "../components/Toast"
import { uploadFile, uploadText, getDocumentStatus } from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"

// --- Types ---

interface FileEntry {
  readonly id: string
  readonly name: string
  readonly size: number
  readonly mimeType: string
  readonly documentId: string | null
  readonly status: "pending" | "uploading" | "processing" | "ready" | "error"
  readonly stages: PipelineStage[]
  readonly preview: string | null
  readonly error: string | null
  readonly stats: { chunks: number; tokens: number } | null
}

type BadgeVariant = "processing" | "ready" | "error" | "pending"

import type { PipelineStage, StageStatus } from "../components/PipelineIndicator"

// --- Constants ---

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const POLL_INTERVAL = 2000
const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx", "pptx", "csv", "json", "txt", "md",
  "png", "jpg", "jpeg", "gif", "webp", "svg",
  "mp3", "wav", "ogg", "m4a", "flac",
  "mp4", "webm", "mov",
])
const STAGE_NAMES = ["parse", "chunk", "embed", "index"] as const
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
const URL_REGEX = /^https?:\/\/.+/

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? ""
}

function makeInitialStages(): PipelineStage[] {
  return STAGE_NAMES.map((name) => ({ name, status: "pending" as StageStatus }))
}

function mapApiStages(
  apiStages: { type: string; status: string; progress: number; error_message?: string }[],
): PipelineStage[] {
  return STAGE_NAMES.map((name) => {
    const apiStage = apiStages.find((s) => s.type === name)
    if (!apiStage) return { name, status: "pending" as StageStatus }

    const statusMap: Record<string, StageStatus> = {
      pending: "pending",
      processing: "active",
      completed: "done",
      done: "done",
      error: "error",
    }
    const stage: PipelineStage = {
      name,
      status: statusMap[apiStage.status] ?? "pending",
    }
    if (apiStage.error_message) {
      return { ...stage, error: apiStage.error_message }
    }
    return stage
  })
}

function fileBadgeVariant(status: FileEntry["status"]): BadgeVariant {
  switch (status) {
    case "pending":
    case "uploading":
      return "pending"
    case "processing":
      return "processing"
    case "ready":
      return "ready"
    case "error":
      return "error"
  }
}

function updateEntry(
  entries: readonly FileEntry[],
  id: string,
  patch: Partial<FileEntry>,
): FileEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

// --- Component ---

const Hero: Component = () => {
  const [files, setFiles] = createSignal<readonly FileEntry[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [authOpen, setAuthOpen] = createSignal(false)
  const [dropError, setDropError] = createSignal("")
  const [dragOver, setDragOver] = createSignal(false)
  const [pendingAction, setPendingAction] = createSignal<(() => void) | null>(null)
  let fileInputRef: HTMLInputElement | undefined

  // Polling timer ref
  let pollTimer: ReturnType<typeof setInterval> | undefined

  // --- Auth gate ---

  function requireAuth(action: () => void): boolean {
    if (isAuthenticated()) return true
    setPendingAction(() => action)
    setAuthOpen(true)
    return false
  }

  function handleAuthSuccess() {
    const action = pendingAction()
    if (action) {
      setPendingAction(null)
      action()
    }
  }

  // --- Validation ---

  function validateFile(file: File): string | null {
    if (file.size === 0) return `${file.name}: пустой файл`
    if (file.size > MAX_FILE_SIZE) return `${file.name}: файл больше 100MB`
    const ext = getExtension(file.name)
    if (ext && !SUPPORTED_EXTENSIONS.has(ext)) {
      return `${file.name}: формат .${ext} не поддерживается`
    }
    return null
  }

  function isDuplicate(file: File): boolean {
    return files().some(
      (f) => f.name === file.name && f.size === file.size && f.status !== "error",
    )
  }

  // --- Upload logic ---

  async function processFileUpload(file: File, entry: FileEntry) {
    const token = getToken()
    if (!token) return

    setFiles((prev) => updateEntry(prev, entry.id, { status: "uploading" }))

    try {
      const result = await uploadFile(file, token)
      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          documentId: result.documentId,
          status: "processing",
          stages: STAGE_NAMES.map((name, i) => ({
            name,
            status: i === 0 ? ("active" as StageStatus) : ("pending" as StageStatus),
          })),
        }),
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : "ошибка загрузки"
      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          status: "error",
          error: message,
        }),
      )
    }
  }

  async function processTextUpload(text: string, entry: FileEntry) {
    const token = getToken()
    if (!token) return

    setFiles((prev) => updateEntry(prev, entry.id, { status: "uploading" }))

    try {
      const result = await uploadText(text, token)
      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          documentId: result.documentId,
          status: "processing",
          stages: STAGE_NAMES.map((name, i) => ({
            name,
            status: i === 0 ? ("active" as StageStatus) : ("pending" as StageStatus),
          })),
        }),
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : "ошибка загрузки"
      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          status: "error",
          error: message,
        }),
      )
    }
  }

  // --- File handlers ---

  function handleFiles(incoming: File[]) {
    setDropError("")

    const action = () => {
      const newEntries: FileEntry[] = []
      const errors: string[] = []

      for (const file of incoming) {
        const validationError = validateFile(file)
        if (validationError) {
          errors.push(validationError)
          continue
        }

        if (isDuplicate(file)) {
          const confirmed = window.confirm(
            `"${file.name}" уже загружен. загрузить повторно?`,
          )
          if (!confirmed) continue
        }

        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          documentId: null,
          status: "pending",
          stages: makeInitialStages(),
          preview: null,
          error: null,
          stats: null,
        }
        newEntries.push(entry)
      }

      if (errors.length > 0) {
        setDropError(errors.join("; "))
        showToast(errors[0], "error")
      }

      if (newEntries.length === 0) return

      setFiles((prev) => [...prev, ...newEntries])

      if (newEntries.length > 1) {
        showToast(`${newEntries.length} файлов добавлено в очередь`, "info")
      }

      if (!selectedId()) {
        setSelectedId(newEntries[0].id)
      }

      for (const entry of newEntries) {
        const file = incoming.find((f) => f.name === entry.name && f.size === entry.size)
        if (file) processFileUpload(file, entry)
      }
    }

    if (!requireAuth(action)) return
    action()
  }

  function handleText(text: string) {
    setDropError("")
    const trimmed = text.trim()
    if (!trimmed) return

    const isYouTube = YOUTUBE_REGEX.test(trimmed)
    const isUrl = URL_REGEX.test(trimmed)

    const action = () => {
      const entry: FileEntry = {
        id: generateId(),
        name: isYouTube
          ? `youtube: ${trimmed.slice(0, 60)}`
          : isUrl
            ? `url: ${trimmed.slice(0, 60)}`
            : `текст (${trimmed.length} символов)`,
        size: new Blob([trimmed]).size,
        mimeType: isUrl ? "text/uri-list" : "text/plain",
        documentId: null,
        status: "pending",
        stages: makeInitialStages(),
        preview: isUrl ? null : trimmed.slice(0, 2000),
        error: null,
        stats: null,
      }

      setFiles((prev) => [...prev, entry])
      setSelectedId(entry.id)

      if (isYouTube) {
        showToast("youtube url добавлен", "info")
      } else if (isUrl) {
        showToast("url добавлен", "info")
      } else {
        showToast(`текст вставлен · ${trimmed.length} символов`, "success")
      }

      processTextUpload(trimmed, entry)
    }

    if (!requireAuth(action)) return
    action()
  }

  // --- Retry ---

  function handleRetry(entryId: string) {
    const entry = files().find((f) => f.id === entryId)
    if (!entry || !entry.documentId) return

    setFiles((prev) =>
      updateEntry(prev, entryId, {
        status: "processing",
        error: null,
        stages: STAGE_NAMES.map((name) => {
          const existing = entry.stages.find((s) => s.name === name)
          if (existing && existing.status === "done") return existing
          return { name, status: "pending" as StageStatus }
        }),
      }),
    )
  }

  // --- Polling ---

  function startPolling() {
    if (pollTimer) return
    pollTimer = setInterval(async () => {
      const token = getToken()
      if (!token) return

      const processingEntries = files().filter(
        (f) => (f.status === "processing" || f.status === "uploading") && f.documentId,
      )

      if (processingEntries.length === 0) {
        clearInterval(pollTimer)
        pollTimer = undefined
        return
      }

      for (const entry of processingEntries) {
        try {
          const data = await getDocumentStatus(entry.documentId!, token)
          const stages = mapApiStages(data.stages)
          const allDone = stages.every((s) => s.status === "done")
          const hasError = stages.some((s) => s.status === "error")
          const errorStage = stages.find((s) => s.status === "error")

          setFiles((prev) =>
            updateEntry(prev, entry.id, {
              status: allDone ? "ready" : hasError ? "error" : "processing",
              stages,
              error: errorStage?.error ?? null,
              name: data.name || entry.name,
              mimeType: data.mime_type || entry.mimeType,
              size: data.size || entry.size,
            }),
          )
        } catch {
          // Network error during polling — don't mark as failed, will retry
        }
      }
    }, POLL_INTERVAL)
  }

  createEffect(() => {
    const hasProcessing = files().some(
      (f) => f.status === "processing" || f.status === "uploading",
    )
    if (hasProcessing) {
      startPolling()
    }
  })

  onCleanup(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = undefined
    }
  })

  // --- Derived ---

  const selectedEntry = () => files().find((f) => f.id === selectedId()) ?? null

  const processingCount = () =>
    files().filter((f) => f.status === "processing" || f.status === "uploading").length

  const readyCount = () => files().filter((f) => f.status === "ready").length

  const hasFiles = () => files().length > 0

  // --- Render ---

  return (
    <div class="min-h-screen bg-white font-mono">
      <Nav variant="hero" />
      <Toast />
      <AuthModal
        open={authOpen()}
        onClose={() => {
          setAuthOpen(false)
          setPendingAction(null)
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* ══════ DROP ZONE — 580px ══════ */}
      <div
        class={`
          flex flex-col items-center justify-center cursor-pointer
          transition-all duration-[150ms]
          ${dragOver()
            ? "bg-white border-2 border-accent border-solid"
            : "border border-solid border-border-default"
          }
        `}
        style={{
          height: "clamp(200px, 40vh, 420px)",
          background: dragOver() ? "#FFFFFF" : "#F2F2F2",
          "border-color": dragOver() ? undefined : "#CCCCCC",
          gap: "16px",
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false)
          const droppedFiles = Array.from(e.dataTransfer?.files ?? [])
          if (droppedFiles.length > 0) handleFiles(droppedFiles)
        }}
        onClick={() => fileInputRef?.click()}
        onPaste={(e) => {
          const pastedFiles = Array.from(e.clipboardData?.files ?? [])
          if (pastedFiles.length > 0) { handleFiles(pastedFiles); return }
          const text = e.clipboardData?.getData("text/plain")
          if (text) handleText(text)
        }}
        tabIndex={0}
      >
        <input ref={fileInputRef} type="file" multiple class="hidden" onChange={(e) => {
          const selected = Array.from(e.target.files ?? [])
          if (selected.length > 0) handleFiles(selected)
          e.target.value = ""
        }} />

        {/* Upload icon — 48x48 */}
        <svg
          class={`${dragOver() ? "text-accent" : "text-text-tertiary"} transition-all duration-[80ms]`}
          style={{ width: "48px", height: "48px" }}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>

        {/* Main text — 14px #808080 */}
        <span
          class="text-text-tertiary text-center"
          style={{ "font-size": "14px" }}
        >
          перетащите файлы или вставьте текст
        </span>

        {/* Format hint — 12px #CCCCCC */}
        <span
          class="text-text-disabled text-center"
          style={{ "font-size": "12px" }}
        >
          pdf · docx · xlsx · аудио · youtube · изображения · или просто текст
        </span>

        {/* Paste hint bar — bg #F2F2F2, border 1px #CCCCCC */}
        <div
          class="flex items-center"
          style={{
            background: "#F2F2F2",
            border: "1px solid #CCCCCC",
            padding: "12px 20px",
            gap: "12px",
          }}
        >
          <span
            class="shrink-0"
            style={{
              background: "#1E3EA0",
              color: "#FAFAFA",
              "font-size": "11px",
              "font-weight": "500",
              padding: "4px 8px",
            }}
          >
            ctrl + v
          </span>
          <span
            style={{
              "font-size": "11px",
              color: "#333333",
            }}
          >
            скопировали текст? просто вставьте — мы всё сделаем
          </span>
        </div>

        {dropError() && (
          <span class="text-[11px] text-signal-error mt-2">{dropError()}</span>
        )}
      </div>

      {/* ══════ FILE LIST (appears after upload) ══════ */}
      <Show when={hasFiles()}>
        <div
          class="flex flex-col gap-0 w-full"
          style={{ padding: "16px 64px" }}
        >
          <div class="flex items-center justify-between mb-3">
            <span class="font-mono text-xs text-text-tertiary lowercase">
              файлы ({files().length})
            </span>
            <div class="flex items-center gap-4">
              <Show when={processingCount() > 0}>
                <span class="font-mono text-xs text-accent">
                  обработка: {processingCount()}
                </span>
              </Show>
              <Show when={readyCount() > 0}>
                <span class="font-mono text-xs text-signal-success">
                  готово: {readyCount()}
                </span>
              </Show>
            </div>
          </div>

          <div class="flex flex-col gap-0 border border-border-default">
            <For each={files()}>
              {(entry) => (
                <div
                  class={`
                    flex flex-col gap-3 p-4 cursor-pointer
                    border-b border-border-subtle last:border-b-0
                    transition-colors duration-[80ms]
                    ${selectedId() === entry.id
                      ? "bg-white"
                      : "bg-bg-surface hover:bg-white"
                    }
                  `}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="font-mono text-sm text-text-primary truncate">
                        {entry.name}
                      </span>
                      <span class="font-mono text-[10px] text-text-tertiary shrink-0">
                        {formatSize(entry.size)}
                      </span>
                      <span class="font-mono text-[10px] text-text-disabled shrink-0">
                        {entry.mimeType}
                      </span>
                    </div>
                    <Badge variant={fileBadgeVariant(entry.status)} />
                  </div>

                  <Show when={entry.status !== "pending"}>
                    <PipelineIndicator stages={entry.stages} />
                  </Show>

                  <Show when={entry.status === "error" && entry.error}>
                    <div class="flex items-center justify-between gap-4 p-3 border border-signal-error bg-white">
                      <span class="font-mono text-xs text-signal-error">
                        {entry.error}
                      </span>
                      <Show when={entry.documentId}>
                        <Button
                          variant="ghost"
                          onClick={() => handleRetry(entry.id)}
                        >
                          повторить
                        </Button>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* ══════ BOTTOM CONTENT — headline + details ══════ */}
      <div
        class="flex"
        style={{
          padding: "48px 64px",
          gap: "64px",
        }}
      >
        {/* LEFT — Headline Area (fill container) */}
        <div class="flex-1 flex flex-col" style={{ gap: "16px" }}>
          <span
            style={{
              "font-size": "12px",
              "font-weight": "500",
              color: "#1E3EA0",
            }}
          >
            единое хранилище знаний
          </span>
          <h1
            style={{
              "font-size": "48px",
              "font-weight": "700",
              color: "#0A0A0A",
              "letter-spacing": "-2px",
              "line-height": "1.05",
            }}
          >
            загрузите файлы —<br/>доступ из любого ии чата
          </h1>
        </div>

        {/* RIGHT — Details Area (480px fixed) */}
        <div
          class="flex flex-col shrink-0"
          style={{ width: "480px", gap: "24px" }}
        >
          <span
            style={{
              "font-size": "14px",
              "font-weight": "700",
              color: "#0A0A0A",
            }}
          >
            как это работает
          </span>

          {/* Details table */}
          <div class="flex flex-col">
            {([
              ["форматы", "pdf, docx, xlsx, аудио, youtube, изображения"],
              ["результат", "база знаний с семантическим поиском"],
              ["подключение", "claude, chatgpt, cursor, любой mcp-клиент"],
              ["скорость", "до 30 секунд на файл"],
            ] as const).map(([key, val]) => (
              <div
                class="flex"
                style={{
                  "border-bottom": "1px solid #E5E5E5",
                  "padding-top": "8px",
                  "padding-bottom": "8px",
                }}
              >
                <span
                  class="shrink-0"
                  style={{
                    width: "140px",
                    "font-size": "12px",
                    color: "#808080",
                  }}
                >
                  {key}
                </span>
                <span
                  style={{
                    "font-size": "12px",
                    "font-weight": "500",
                    color: "#0A0A0A",
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Description */}
          <p
            style={{
              "font-size": "12px",
              color: "#333333",
              "line-height": "1.5",
            }}
          >
            вы загружаете файл — мы извлекаем текст, разбиваем на смысловые блоки,
            создаём эмбеддинги и сохраняем в векторную базу на edge.
            подключите через mcp к любому ии-клиенту — он начнёт отвечать
            на вопросы по вашим документам с цитатами и источниками.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Hero
