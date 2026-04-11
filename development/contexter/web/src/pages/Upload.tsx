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
import DropZone from "../components/DropZone"
import PipelineIndicator, { getTimeEstimate } from "../components/PipelineIndicator"
import type { PipelineStage, StageStatus } from "../components/PipelineIndicator"
import AuthModal from "../components/AuthModal"
import Toast, { showToast } from "../components/Toast"
import { uploadText, getDocumentStatus, presignUpload, confirmUpload, uploadToR2 } from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"
import { formatSize, humanizeError } from "../lib/helpers"
import { t } from "../lib/i18n"
import { SUPPORTED_EXTENSIONS } from "../lib/formats"

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
  readonly uploadProgress?: { loaded: number; total: number }
}

type BadgeVariant = "processing" | "ready" | "error" | "pending"

// --- Constants ---

const POLL_INTERVAL = 2000
// SUPPORTED_EXTENSIONS imported from ../lib/formats.ts (308 text formats)
const STAGE_NAMES = ["parse", "chunk", "embed", "index"] as const
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
const URL_REGEX = /^https?:\/\/.+/

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
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
      running: "active",
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

const Upload: Component = () => {
  const [files, setFiles] = createSignal<readonly FileEntry[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [authOpen, setAuthOpen] = createSignal(false)
  const [dropError, setDropError] = createSignal("")
  const [pendingAction, setPendingAction] = createSignal<(() => void) | null>(null)

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
    if (file.size === 0) return t("toast.emptyFile", { name: file.name })
    const ext = getExtension(file.name)
    if (ext && !SUPPORTED_EXTENSIONS.has(ext)) {
      return t("toast.unsupportedFormat", { name: file.name, ext })
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
      // All files go through presigned upload (server never touches file bytes)
      const { uploadUrl, documentId, r2Key } = await presignUpload(
        file.name,
        file.type || "application/octet-stream",
        file.size,
        token,
      )

      await uploadToR2(uploadUrl, file, (loaded, total) => {
        setFiles((prev) =>
          updateEntry(prev, entry.id, {
            uploadProgress: { loaded, total },
          }),
        )
      })

      await confirmUpload(
        {
          documentId,
          r2Key,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
        },
        token,
      )

      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          documentId,
          status: "processing",
          uploadProgress: undefined,
          stages: STAGE_NAMES.map((name, i) => ({
            name,
            status: i === 0 ? ("active" as StageStatus) : ("pending" as StageStatus),
          })),
        }),
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload error"
      setFiles((prev) =>
        updateEntry(prev, entry.id, {
          status: "error",
          error: message,
          uploadProgress: undefined,
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
      const message = e instanceof Error ? e.message : "Upload error"
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
          // Flow 4.6 — duplicate warning
          const confirmed = window.confirm(
            t("toast.duplicateConfirm", { name: file.name }),
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
        showToast(t("toast.filesAdded", { count: newEntries.length }), "info")
      }

      // Select the first new entry
      if (!selectedId()) {
        setSelectedId(newEntries[0].id)
      }

      // Start uploads
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
          ? `YouTube: ${trimmed.slice(0, 60)}`
          : isUrl
            ? `URL: ${trimmed.slice(0, 60)}`
            : `Text (${trimmed.length} chars)`,
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
        showToast(t("toast.youtubeAdded"), "info")
      } else if (isUrl) {
        showToast(t("toast.urlAdded"), "info")
      } else {
        showToast(t("toast.textPasted", { count: trimmed.length }), "success")
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

          if (allDone && entry.status === "processing") {
            const totalDuration = stages.reduce((sum, s) => sum + (s.duration ?? 0), 0)
            if (totalDuration > 5000) {
              showToast(t("toast.readyForSearch", { name: data.name || entry.name }), "success")
            }
          }

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

  // Watch for processing entries and start/stop polling
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

  // --- Render ---

  return (
    <div class="min-h-screen bg-bg-canvas flex flex-col">
      <Nav variant="app" />
      <Toast />
      <AuthModal
        open={authOpen()}
        onClose={() => {
          setAuthOpen(false)
          setPendingAction(null)
        }}
        onSuccess={handleAuthSuccess}
      />

      <main class="flex-1 w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-8">
        {/* Header */}
        <div class="flex items-baseline justify-between mb-8">
          <h1 class="text-[20px] font-medium text-text-primary">
            {t("upload.title")}
          </h1>
          <Show when={files().length > 0}>
            <div class="flex items-center gap-4">
              <Show when={processingCount() > 0}>
                <span class="text-xs text-accent">
                  {t("upload.processing", { count: processingCount() })}
                </span>
              </Show>
              <Show when={readyCount() > 0}>
                <span class="text-xs text-signal-success">
                  {t("upload.ready", { count: readyCount() })}
                </span>
              </Show>
            </div>
          </Show>
        </div>

        {/* 8:4 Split */}
        <div class="grid grid-cols-12 gap-8">
          {/* Left column — 8 cols */}
          <div class="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {/* Drop zone */}
            <DropZone
              onFiles={handleFiles}
              onText={handleText}
              error={dropError()}
            />

            {/* File list */}
            <Show when={files().length > 0}>
              <div class="flex flex-col gap-0">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs text-text-tertiary">
                    {t("upload.files", { count: files().length })}
                  </span>
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
                            ? "bg-bg-canvas"
                            : "bg-bg-surface hover:bg-bg-canvas"
                          }
                        `}
                        onClick={() => setSelectedId(entry.id)}
                      >
                        {/* Row 1: name + badge */}
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

                        {/* Row 2: upload progress (presigned large file) */}
                        <Show when={entry.status === "uploading" && entry.uploadProgress != null}>
                          {(_) => {
                            const prog = entry.uploadProgress!
                            const pct = Math.round((prog.loaded / prog.total) * 100)
                            return (
                              <div class="flex flex-col gap-1">
                                <div class="flex items-center justify-between">
                                  <span class="text-[10px] text-text-tertiary">
                                    {formatBytes(prog.loaded)} / {formatBytes(prog.total)}
                                  </span>
                                  <span class="text-[10px] text-accent">
                                    {pct}%
                                  </span>
                                </div>
                                <div class="h-[2px] bg-border-default w-full">
                                  <div
                                    class="h-full bg-accent transition-all duration-150"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )
                          }}
                        </Show>

                        {/* Row 3: pipeline */}
                        <Show when={entry.status !== "pending"}>
                          <PipelineIndicator stages={entry.stages} mimeType={entry.mimeType} />
                          <Show when={entry.status === "processing" && getTimeEstimate(entry.mimeType) !== null}>
                            <span class="text-[10px] text-text-tertiary mt-1">
                              {t("pipeline.estimatedTime")} {getTimeEstimate(entry.mimeType)}
                            </span>
                          </Show>
                        </Show>

                        {/* Error card */}
                        <Show when={entry.status === "error" && entry.error}>
                          <div class="flex items-center justify-between gap-4 p-3 border border-signal-error bg-bg-canvas">
                            <div class="flex flex-col gap-1">
                              <span class="text-xs text-signal-error">
                                {humanizeError(entry.error)}
                              </span>
                              <Show when={entry.stages?.find((s) => s.status === "error")}>
                                {(failedStage) => (
                                  <span class="text-[10px] text-text-tertiary">stage: {
                                    {parse: "parsing", chunk: "chunking", embed: "vectorizing", index: "saving"}[failedStage().name] ?? failedStage().name
                                  }</span>
                                )}
                              </Show>
                            </div>
                            <Show when={entry.documentId}>
                              <Button
                                variant="ghost"
                                onClick={() => handleRetry(entry.id)}
                              >
                                Retry
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
          </div>

          {/* Right column — 4 cols */}
          <div class="col-span-12 lg:col-span-4">
            <div class="sticky top-20 flex flex-col gap-6">
              <Show
                when={selectedEntry()}
                fallback={
                  <div class="border border-border-default bg-bg-surface p-8 flex items-center justify-center min-h-[300px]">
                    <span class="text-xs text-text-disabled">
                      {t("upload.selectPreview")}
                    </span>
                  </div>
                }
              >
                {(entry) => (
                  <div class="flex flex-col gap-4">
                    {/* File info */}
                    <div class="flex flex-col gap-2">
                      <span class="text-xs text-text-tertiary">
                        {t("upload.preview")}
                      </span>
                      <div class="flex flex-col gap-1">
                        <span class="font-mono text-sm text-text-primary font-medium truncate">
                          {entry().name}
                        </span>
                        <div class="flex items-center gap-2">
                          <span class="font-mono text-[10px] text-text-tertiary">
                            {formatSize(entry().size)}
                          </span>
                          <span class="font-mono text-[10px] text-text-disabled">
                            {entry().mimeType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pipeline status */}
                    <div class="flex flex-col gap-2">
                      <span class="text-xs text-text-tertiary">
                        {t("upload.status")}
                      </span>
                      <Badge variant={fileBadgeVariant(entry().status)} />
                      <PipelineIndicator stages={entry().stages} mimeType={entry().mimeType} />
                    </div>

                    {/* Stats */}
                    <Show when={entry().stats}>
                      {(stats) => (
                        <div class="flex flex-col gap-2">
                          <span class="text-xs text-text-tertiary">
                            {t("upload.stats")}
                          </span>
                          <div class="grid grid-cols-2 gap-2">
                            <div class="border border-border-default p-3">
                              <span class="text-[10px] text-text-tertiary block">
                                {t("upload.chunksLabel")}
                              </span>
                              <span class="font-mono text-sm text-text-primary font-medium">
                                {stats().chunks}
                              </span>
                            </div>
                            <div class="border border-border-default p-3">
                              <span class="text-[10px] text-text-tertiary block">
                                {t("upload.tokensLabel")}
                              </span>
                              <span class="font-mono text-sm text-text-primary font-medium">
                                {stats().tokens}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </Show>

                    {/* Extraction preview */}
                    <div class="flex flex-col gap-2">
                      <span class="text-xs text-text-tertiary">
                        {t("upload.extractedText")}
                      </span>
                      <Show
                        when={entry().preview}
                        fallback={
                          <div class="border border-border-default bg-bg-surface p-4 min-h-[200px] flex items-center justify-center">
                            <span class="text-[10px] text-text-disabled">
                              {entry().status === "processing" || entry().status === "uploading"
                                ? "Waiting for parsing..."
                                : entry().status === "error"
                                  ? "Extraction error"
                                  : entry().status === "pending"
                                    ? "Upload not started"
                                    : "Preview unavailable"}
                            </span>
                          </div>
                        }
                      >
                        {(preview) => (
                          <div
                            class="border border-border-default bg-bg-canvas p-4 max-h-[400px] overflow-y-auto animate-[fadeIn_250ms_ease-out]"
                          >
                            <pre class="font-mono text-xs text-text-secondary whitespace-pre-wrap break-words leading-[1.5]">
                              {preview()}
                            </pre>
                          </div>
                        )}
                      </Show>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Upload
