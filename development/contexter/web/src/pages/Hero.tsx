import { A, useNavigate } from "@solidjs/router"
import {
  createSignal,
  createEffect,
  onCleanup,
  For,
  Show,
  type Component,
} from "solid-js"
import Nav from "../components/Nav"
import { t } from "../lib/i18n"
import Button from "../components/Button"
import Badge from "../components/Badge"
import PipelineIndicator, { getTimeEstimate } from "../components/PipelineIndicator"
import AuthModal from "../components/AuthModal"
import ConnectionModal from "../components/ConnectionModal"
import DocumentModal from "../components/DocumentModal"
import Toast, { showToast } from "../components/Toast"
import {
  uploadText,
  getDocumentStatus,
  listDocuments,
  presignUpload,
  confirmUpload,
  uploadToR2,
  API_BASE,
  createSupportInvoice,
} from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"
import { formatSize, statusToVariant, humanizeError } from "../lib/helpers"

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

const POLL_INTERVAL = 2000
// Alpha: text-only formats (TextParser, zero external deps)
// Post-alpha formats (pdf, docx, audio, video, images) re-enabled after alpha.
const SUPPORTED_EXTENSIONS = new Set([
  // Documents
  "txt", "md", "csv", "json", "xml", "odt", "html",
  "yaml", "yml", "toml", "tsv", "log", "rst", "tex", "ini", "cfg",
  // Environment / config
  "env", "conf", "hcl", "tf",
  // Subtitles
  "srt", "vtt",
  // Data
  "sql", "ndjson", "jsonl", "geojson",
  // Source code
  "py", "js", "ts", "jsx", "tsx",
  "go", "rs", "java", "c", "cpp", "h", "hpp",
  "cs", "rb", "php", "swift", "kt", "scala",
  "lua", "r", "pl", "sh", "bash", "zsh", "bat", "ps1",
  // Named configs (no extension — matched by extension check)
  "dockerfile", "makefile", "gitignore", "dockerignore", "editorconfig", "nginx",
  // Markup
  "adoc", "org", "wiki", "textile",
])
const STAGE_NAMES = ["parse", "chunk", "embed", "index"] as const
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/
const URL_REGEX = /^https?:\/\/.+/

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
      pending: "pending", processing: "active", running: "active", completed: "done", done: "done", error: "error",
    }
    const stage: PipelineStage = { name, status: statusMap[apiStage.status] ?? "pending" }
    if (apiStage.error_message) return { ...stage, error: apiStage.error_message }
    return stage
  })
}

function fileBadgeVariant(status: FileEntry["status"]): BadgeVariant {
  switch (status) {
    case "pending": case "uploading": return "pending"
    case "processing": return "processing"
    case "ready": return "ready"
    case "error": return "error"
  }
}

function updateEntry(entries: readonly FileEntry[], id: string, patch: Partial<FileEntry>): FileEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); showToast(t("common.copied"), "success") }
  catch { showToast(t("common.copyFailed"), "error") }
}

// --- Component ---

const Hero: Component = () => {
  const navigate = useNavigate()

  // Upload state
  const [files, setFiles] = createSignal<readonly FileEntry[]>([])
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [viewDocId, setViewDocId] = createSignal<string | null>(null)
  const [authOpen, setAuthOpen] = createSignal(false)
  const [dropError, setDropError] = createSignal("")
  const [dragOver, setDragOver] = createSignal(false)
  const [connectionOpen, setConnectionOpen] = createSignal(false)
  const [connectionClient, setConnectionClient] = createSignal<"chatgpt" | "claude-web" | "claude-desktop" | "perplexity" | "cursor" | "antigravity">("chatgpt")
  const [pendingAction, setPendingAction] = createSignal<(() => void) | null>(null)
  const [pasteDisplay, setPasteDisplay] = createSignal("")
  const [supportAmount, setSupportAmount] = createSignal(10)
  const [supportLoading, setSupportLoading] = createSignal(false)
  let pasteImageCount = 0
  let fileInputRef: HTMLInputElement | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined

  // Dashboard state
  const [landingDocs, setLandingDocs] = createSignal<
    { id: string; name: string; status: string; chunk_count: number }[]
  >([])
  const [landingChunks, setLandingChunks] = createSignal(0)

  // Load docs + resume polling
  async function loadInitialDocs() {
    const t = getToken()
    if (!t) return
    try {
      const res = await listDocuments(t)
      setLandingDocs(res.documents)
      setLandingChunks(res.totalChunks)
      const processing = res.documents.filter((d: any) => d.status === "processing")
      if (processing.length > 0) {
        const existing = files()
        for (const doc of processing) {
          if (!existing.some((f) => f.documentId === doc.id)) {
            setFiles((prev) => [...prev, {
              id: doc.id, name: doc.name, mimeType: doc.mime_type,
              size: doc.size, status: "processing" as const,
              documentId: doc.id, stages: makeInitialStages(),
              preview: null, error: null, stats: null,
            }])
          }
        }
        startPolling()
      }
    } catch {}
  }

  createEffect(() => {
    if (!isAuthenticated()) return
    loadInitialDocs()
  })

  // Refresh docs when files finish processing
  let prevReady = 0
  createEffect(() => {
    const cur = files().filter((f) => f.status === "ready").length
    if (cur > prevReady && isAuthenticated()) {
      const t = getToken()
      if (t) listDocuments(t).then((res) => {
        setLandingDocs(res.documents)
        setLandingChunks(res.totalChunks)
      }).catch(() => {})
    }
    prevReady = cur
  })

  // Auth gate
  function requireAuth(action: () => void): boolean {
    if (isAuthenticated()) return true
    setPendingAction(() => action)
    setAuthOpen(true)
    return false
  }

  function handleAuthSuccess() {
    const action = pendingAction()
    if (action) { setPendingAction(null); action() }
  }

  // Validation
  function validateFile(file: File): string | null {
    if (file.size === 0) return t("toast.emptyFile", { name: file.name })
    // No file size limit — presigned upload handles any size
    const ext = getExtension(file.name)
    if (ext && !SUPPORTED_EXTENSIONS.has(ext)) return t("toast.unsupportedFormat", { name: file.name, ext })
    return null
  }

  function isDuplicate(file: File): boolean {
    return files().some((f) => f.name === file.name && f.size === file.size && f.status !== "error")
  }

  // Upload logic
  async function processFileUpload(file: File, entry: FileEntry) {
    const t = getToken()
    if (!t) return
    setFiles((prev) => updateEntry(prev, entry.id, { status: "uploading" }))
    try {
      const { uploadUrl, documentId, r2Key } = await presignUpload(
        file.name, file.type || "application/octet-stream", file.size, t,
      )
      await uploadToR2(uploadUrl, file, () => {})
      await confirmUpload({ documentId, r2Key, fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size }, t)
      setFiles((prev) => updateEntry(prev, entry.id, {
        documentId, status: "processing",
        stages: STAGE_NAMES.map((n, i) => ({ name: n, status: (i === 0 ? "active" : "pending") as StageStatus })),
      }))
    } catch (e) {
      setFiles((prev) => updateEntry(prev, entry.id, {
        status: "error", error: e instanceof Error ? e.message : t("toast.uploadError"),
      }))
    }
  }

  async function processTextUpload(text: string, entry: FileEntry) {
    const t = getToken()
    if (!t) return
    setFiles((prev) => updateEntry(prev, entry.id, { status: "uploading" }))
    try {
      const result = await uploadText(text, t)
      setFiles((prev) => updateEntry(prev, entry.id, {
        documentId: result.documentId, status: "processing",
        stages: STAGE_NAMES.map((n, i) => ({ name: n, status: (i === 0 ? "active" : "pending") as StageStatus })),
      }))
    } catch (e) {
      setFiles((prev) => updateEntry(prev, entry.id, {
        status: "error", error: e instanceof Error ? e.message : t("toast.uploadError"),
      }))
    }
  }

  function handleFiles(incoming: File[]) {
    setDropError("")
    const action = () => {
      const newEntries: FileEntry[] = []
      const errors: string[] = []
      for (const file of incoming) {
        const err = validateFile(file)
        if (err) { errors.push(err); continue }
        if (isDuplicate(file) && !window.confirm(t("toast.duplicateConfirm", { name: file.name }))) continue
        newEntries.push({
          id: generateId(), name: file.name, size: file.size,
          mimeType: file.type || "application/octet-stream",
          documentId: null, status: "pending", stages: makeInitialStages(),
          preview: null, error: null, stats: null,
        })
      }
      if (errors.length > 0) { setDropError(errors.join("; ")); showToast(errors[0], "error") }
      if (newEntries.length === 0) return
      setFiles((prev) => [...prev, ...newEntries])
      if (newEntries.length > 1) showToast(t("toast.filesAdded", { count: newEntries.length }), "success")
      if (!selectedId()) setSelectedId(newEntries[0].id)
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
    const isUrl = URL_REGEX.test(trimmed)
    const action = () => {
      const entry: FileEntry = {
        id: generateId(),
        name: isUrl ? `url: ${trimmed.slice(0, 60)}` : `Text (${trimmed.length} chars)`,
        size: new Blob([trimmed]).size, mimeType: isUrl ? "text/uri-list" : "text/plain",
        documentId: null, status: "pending", stages: makeInitialStages(),
        preview: isUrl ? null : trimmed.slice(0, 2000), error: null, stats: null,
      }
      setFiles((prev) => [...prev, entry])
      setSelectedId(entry.id)
      processTextUpload(trimmed, entry)
    }
    if (!requireAuth(action)) return
    action()
  }

  function handleRetry(entryId: string) {
    const entry = files().find((f) => f.id === entryId)
    if (!entry?.documentId) return
    setFiles((prev) => updateEntry(prev, entryId, {
      status: "processing", error: null,
      stages: STAGE_NAMES.map((n) => {
        const ex = entry.stages.find((s) => s.name === n)
        return ex?.status === "done" ? ex : { name: n, status: "pending" as StageStatus }
      }),
    }))
  }

  // Support payment
  async function handleSupportPay() {
    const amount = supportAmount()
    if (amount < 10) { showToast("Minimum $10", "error"); return }
    setSupportLoading(true)
    try {
      const { invoiceUrl } = await createSupportInvoice(amount)
      window.open(invoiceUrl, "_blank")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to create invoice", "error")
    } finally {
      setSupportLoading(false)
    }
  }

  // Paste input handler
  function handlePasteInput(e: ClipboardEvent) {
    e.preventDefault()
    e.stopPropagation()

    // 1. Files (images, documents, etc.)
    let pasteFiles = Array.from(e.clipboardData?.files ?? [])

    // Fallback: extract files from clipboardData.items (some browsers)
    if (pasteFiles.length === 0 && e.clipboardData?.items) {
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.kind === "file") {
          const f = item.getAsFile()
          if (f) pasteFiles.push(f)
        }
      }
    }

    if (pasteFiles.length > 0) {
      const labels = pasteFiles.map((f) => {
        if (f.type.startsWith("image/")) {
          pasteImageCount++
          return `[image #${pasteImageCount}]`
        }
        return `[file: ${f.name}]`
      })
      setPasteDisplay(labels.join(", "))
      handleFiles(pasteFiles)
      return
    }

    // 2. Text (plain text, URLs, YouTube links)
    const text = e.clipboardData?.getData("text/plain")
    if (text?.trim()) {
      const trimmed = text.trim()
      if (URL_REGEX.test(trimmed)) {
        const domain = trimmed.replace(/^https?:\/\//, "").split("/")[0]
        setPasteDisplay(`[link: ${domain}]`)
      } else {
        setPasteDisplay(`[pasted text ${trimmed.length} chars]`)
      }
      handleText(trimmed)
      return
    }

    // 3. HTML without plain text (rare)
    const html = e.clipboardData?.getData("text/html")
    if (html?.trim()) {
      const stripped = html.replace(/<[^>]*>/g, "").trim()
      if (stripped) {
        setPasteDisplay(`[pasted text ${stripped.length} chars]`)
        handleText(stripped)
      }
    }
  }

  // Polling
  function startPolling() {
    if (pollTimer) return
    pollTimer = setInterval(async () => {
      const t = getToken()
      if (!t) return
      const active = files().filter((f) => (f.status === "processing" || f.status === "uploading") && f.documentId)
      if (active.length === 0) { clearInterval(pollTimer); pollTimer = undefined; return }
      for (const entry of active) {
        try {
          const data = await getDocumentStatus(entry.documentId!, t)
          const stages = mapApiStages(data.stages)
          const allDone = stages.every((s) => s.status === "done")
          const hasError = stages.some((s) => s.status === "error")
          const errStage = stages.find((s) => s.status === "error")
          const isStuck = !allDone && !hasError && data.created_at &&
            (Date.now() - new Date(data.created_at).getTime()) > 5 * 60 * 1000 &&
            stages.some((s) => s.status === "running")
          if (allDone && entry.status === "processing") {
            const totalDuration = stages.reduce((sum, s) => sum + (s.duration ?? 0), 0)
            if (totalDuration > 5000) {
              showToast(t("toast.readyForSearch", { name: data.name || entry.name }), "success")
            }
          }
          const newStatus = allDone ? "ready" : hasError ? "error" : isStuck ? "error" : "processing"
          setFiles((prev) => updateEntry(prev, entry.id, {
            status: newStatus,
            stages, error: errStage?.error ?? (isStuck ? t("toast.processingTooLong") : null),
            name: data.name || entry.name, mimeType: data.mime_type || entry.mimeType, size: data.size || entry.size,
          }))
          // Auto-remove error entries after 10s
          if (newStatus === "error") {
            setTimeout(() => setFiles((prev) => prev.filter((f) => f.id !== entry.id)), 10_000)
          }
        } catch {}
      }
    }, POLL_INTERVAL)
  }

  createEffect(() => {
    if (files().some((f) => f.status === "processing" || f.status === "uploading")) startPolling()
  })
  onCleanup(() => { if (pollTimer) { clearInterval(pollTimer); pollTimer = undefined } })

  // Derived
  const processingCount = () => files().filter((f) => f.status === "processing" || f.status === "uploading").length
  const readyCount = () => files().filter((f) => f.status === "ready").length
  const hasFiles = () => files().length > 0
  const tok = () => getToken() ?? "YOUR_TOKEN"
  const mcpUrl = () => `${API_BASE}/sse?token=${tok()}`

  // ══════ RENDER ══════

  return (
    <div class="min-h-screen bg-bg-canvas font-sans flex flex-col">
      {/* 1. HEADER */}
      <Nav variant="hero" onLogin={() => setAuthOpen(true)} />
      <Toast />
      <AuthModal
        open={authOpen()}
        onClose={() => { setAuthOpen(false); setPendingAction(null) }}
        onSuccess={handleAuthSuccess}
      />
      <ConnectionModal
        open={connectionOpen()}
        initialClient={connectionClient()}
        onClose={() => setConnectionOpen(false)}
      />
      <DocumentModal
        docId={viewDocId()}
        onClose={() => setViewDocId(null)}
      />

      {/* 2. DROP ZONE */}
      <section
        class={`flex flex-col items-center justify-center cursor-pointer transition-colors duration-[150ms] bg-black px-4 py-12 md:px-16 md:py-20 min-h-[240px] md:min-h-[320px] ${dragOver() ? "border-2 border-accent" : "border-2 border-transparent"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false) }}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false)
          const f = Array.from(e.dataTransfer?.files ?? [])
          if (f.length > 0) handleFiles(f)
        }}
        onClick={() => fileInputRef?.click()}
        onPaste={(e) => {
          const f = Array.from(e.clipboardData?.files ?? [])
          if (f.length > 0) { handleFiles(f); return }
          const text = e.clipboardData?.getData("text/plain")
          if (text) handleText(text)
        }}
        tabIndex={0}
      >
        <input ref={fileInputRef} type="file" multiple class="hidden" onChange={(e) => {
          const sel = Array.from(e.target.files ?? [])
          if (sel.length > 0) handleFiles(sel)
          e.target.value = ""
        }} />

        <svg
          class={`transition-transform duration-[80ms] ${dragOver() ? "scale-110 text-accent" : "text-white"}`}
          style={{ width: "48px", height: "48px" }}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <span class="text-[20px] font-medium text-white mt-6 text-center">
          {t("hero.dropTitle")}
        </span>
        <span class="text-[14px] text-text-disabled mt-3 text-center">
          {t("hero.dropFormats")}
        </span>

        <div class="flex flex-col items-center gap-3 mt-5 w-full" style={{ "max-width": "480px" }}>
          <button
            class="border border-text-secondary py-2 px-6 text-sm text-text-disabled bg-transparent cursor-pointer transition-[border-color,color] duration-[80ms]"
            onClick={(e) => { e.stopPropagation(); fileInputRef?.click() }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-white)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-text-secondary)"; e.currentTarget.style.color = "var(--color-text-disabled)" }}
          >
            {t("hero.selectFiles")}
          </button>
          <input
            type="text"
            value={pasteDisplay()}
            placeholder={t("hero.pastePlaceholder")}
            onPaste={handlePasteInput}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              const isModifier = e.ctrlKey || e.metaKey
              const isShortcut = isModifier && ["KeyV", "KeyC", "KeyA"].includes(e.code)
              const isNav = ["Tab", "Backspace", "Delete", "Escape", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
              if (!isShortcut && !isNav) e.preventDefault()
            }}
            class="w-full bg-transparent border border-text-secondary text-text-disabled text-sm py-2 px-4 text-center outline-hidden placeholder:text-text-disabled transition-[border-color] duration-[80ms] focus:border-accent"
          />
        </div>

        {dropError() && (
          <span class="text-signal-error text-[10px] mt-3">{dropError()}</span>
        )}
      </section>

      {/* Pipeline progress (current uploads) */}
      <Show when={hasFiles()}>
        <section class="bg-bg-canvas border-b border-border-subtle px-4 py-4 md:px-16">
          <div class="flex flex-col border border-border-default bg-bg-canvas">
            <For each={files()}>
              {(entry) => (
                <div
                  class={`flex flex-col gap-3 p-4 cursor-pointer border-b border-border-subtle last:border-b-0 transition-colors duration-[80ms] ${
                    selectedId() === entry.id ? "bg-bg-canvas" : "hover:bg-bg-canvas"
                  }`}
                  onClick={() => {
                    setSelectedId(entry.id)
                    if (entry.status === "ready" && entry.documentId) setViewDocId(entry.documentId)
                  }}
                >
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-sm text-text-primary truncate">{entry.name}</span>
                      <span class="text-[10px] text-text-tertiary shrink-0">{formatSize(entry.size)}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <Badge variant={fileBadgeVariant(entry.status)} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((f) => f.id !== entry.id)) }}
                        class="text-text-disabled hover:text-text-primary transition-colors duration-[80ms] p-1"
                        aria-label="close"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                          <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <Show when={entry.status !== "pending"}>
                    <PipelineIndicator stages={entry.stages} mimeType={entry.mimeType} />
                    <Show when={entry.status === "processing" && getTimeEstimate(entry.mimeType) !== null}>
                      <span class="text-[10px] text-text-tertiary mt-1">
                        {t("pipeline.estimatedTime")} {getTimeEstimate(entry.mimeType)}
                      </span>
                    </Show>
                  </Show>
                  <Show when={entry.status === "error" && entry.error}>
                    <div class="flex items-center justify-between gap-4 p-3 border border-signal-error bg-bg-canvas">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs text-signal-error">{humanizeError(entry.error)}</span>
                        <Show when={entry.stages?.find((s) => s.status === "error")}>
                          {(failedStage) => (
                            <span class="text-[10px] text-text-tertiary">stage: {
                              {parse: "parsing", chunk: "chunking", embed: "vectorizing", index: "saving"}[failedStage().name] ?? failedStage().name
                            }</span>
                          )}
                        </Show>
                      </div>
                      <Show when={entry.documentId}>
                        <Button variant="ghost" onClick={() => handleRetry(entry.id)}>{t("common.retry")}</Button>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      {/* 3. DOCUMENTS */}
      <section class="px-4 py-12 md:px-16 flex-1">
        <div class="flex items-center justify-between" style={{ "margin-bottom": "24px" }}>
          <h2 class="text-black" style={{ "font-size": "24px", "font-weight": "700", "letter-spacing": "-0.5px" }}>
            {t("hero.yourDocs")}
          </h2>
          <Show when={isAuthenticated() && landingDocs().length > 5}>
            <A href="/dashboard" class="text-accent" style={{ "font-size": "12px" }}>
              {t("hero.allDocs")}
            </A>
          </Show>
        </div>

        <Show
          when={isAuthenticated() && landingDocs().length > 0}
          fallback={
            <div class="flex flex-col items-center gap-4" style={{ padding: "48px 0" }}>
              <span class="text-text-tertiary" style={{ "font-size": "14px" }}>
                {isAuthenticated() ? t("hero.noDocs") : t("hero.noDocsAuth")}
              </span>
            </div>
          }
        >
          {/* Stats row */}
          <div class="flex flex-wrap gap-4 mb-6">
            {([
              [landingDocs().length, t("hero.documents")],
              [landingChunks(), t("hero.chunks")],
            ] as [number, string][]).map(([v, l]) => (
              <div class="flex items-baseline gap-2 bg-bg-canvas" style={{ padding: "16px 20px" }}>
                <span class="text-black" style={{ "font-size": "32px", "font-weight": "700", "line-height": "1" }}>{v}</span>
                <span class="text-text-tertiary" style={{ "font-size": "12px" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Document table */}
          <div class="bg-bg-canvas border border-border-subtle">
            <div class="flex items-center border-b border-border-subtle" style={{ padding: "10px 16px" }}>
              <span class="flex-1 text-text-tertiary" style={{ "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>{t("hero.docHeader")}</span>
              <span class="text-text-tertiary" style={{ width: "80px", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>{t("hero.chunksHeader")}</span>
              <span class="text-text-tertiary" style={{ width: "100px", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>{t("hero.statusHeader")}</span>
            </div>
            <For each={landingDocs().slice(0, 10)}>
              {(doc) => (
                <div
                  class="flex items-center cursor-pointer transition-colors duration-[80ms] hover:bg-bg-canvas"
                  style={{ padding: "10px 16px", "border-bottom": "1px solid var(--color-bg-surface)" }}
                  onClick={() => setViewDocId(doc.id)}
                >
                  <span class="flex-1 truncate text-black" style={{ "font-size": "14px" }}>{doc.name}</span>
                  <span class="text-black" style={{ width: "80px", "font-size": "12px" }}>{doc.chunk_count}</span>
                  <span style={{ width: "100px" }}><Badge variant={statusToVariant(doc.status)} /></span>
                </div>
              )}
            </For>
          </div>

        </Show>
      </section>

      {/* 4. CONNECT YOUR AI */}
      <Show when={isAuthenticated()}>
        <section class="border-t border-border-subtle px-4 py-16 md:px-16">
          <div class="flex flex-col items-center text-center" style={{ gap: "16px" }}>
            <h2 class="text-[24px] font-bold text-text-primary leading-[1.2]" style={{ "letter-spacing": "-0.03em" }}>
              Connect your AI
            </h2>
            <p class="text-[14px] text-text-secondary leading-[1.5]" style={{ "max-width": "480px" }}>
              Link ChatGPT, Claude, Gemini, Perplexity, or Cursor to your knowledge base. Takes 2 minutes.
            </p>
            <a
              href="/api"
              class="text-[14px] font-medium bg-accent text-white px-8 py-3 hover:bg-accent-hover transition-colors duration-[80ms] mt-2"
            >
              Connect
            </a>
          </div>
        </section>
      </Show>

      {/* 5. PRE-ORDER */}
      <section id="preorder" class="bg-bg-surface border-t border-border-subtle px-4 py-16 md:px-16">
        {/* Header */}
        <div class="flex flex-col items-center text-center mx-auto" style={{ "max-width": "720px" }}>
          <span class="text-[10px] font-medium text-accent uppercase tracking-[0.04em]">
            {t("preorder.betaNote")}
          </span>
          <h2
            class="text-[32px] font-bold text-text-primary leading-[1.2] mt-2"
            style={{ "letter-spacing": "-0.03em" }}
          >
            {t("preorder.title")}
          </h2>
          <p
            class="text-[14px] text-text-secondary leading-[1.5] mt-3 mx-auto"
            style={{ "max-width": "480px" }}
          >
            {t("preorder.subtitle")}
          </p>
        </div>

        {/* Benefits Bar */}
        <div class="flex flex-wrap justify-center items-center mt-8" style={{ gap: "12px" }}>
          <span class="bg-bg-elevated px-3 py-1 inline-flex items-center" style={{ gap: "8px" }}>
            <span class="text-[12px] font-bold text-accent">—</span>
            <span class="text-[12px] text-text-secondary">{t("preorder.benefit1")}</span>
          </span>
          <span class="bg-bg-elevated px-3 py-1 inline-flex items-center" style={{ gap: "8px" }}>
            <span class="text-[12px] font-bold text-accent">—</span>
            <span class="text-[12px] text-text-secondary">{t("preorder.benefit2")}</span>
          </span>
          <span class="bg-bg-elevated px-3 py-1 inline-flex items-center" style={{ gap: "8px" }}>
            <span class="text-[12px] font-bold text-accent">—</span>
            <span class="text-[12px] text-text-secondary">{t("preorder.benefit3")}</span>
          </span>
        </div>

        {/* Payment Block — Crypto */}
        <div
          class="border border-border-default bg-bg-canvas p-6 flex flex-col mt-8 mx-auto w-full"
          style={{ gap: "16px", "max-width": "720px" }}
        >
          <span class="text-[10px] font-medium text-accent uppercase tracking-[0.04em]">
            {t("preorder.crypto")}
          </span>
          <p class="text-[12px] text-text-tertiary leading-[1.5]">
            {t("preorder.cryptoDesc")}
          </p>
          <div class="flex items-center" style={{ gap: "8px" }}>
            <div class="flex items-stretch border border-border-default" style={{ height: "40px" }}>
              <span class="px-3 text-[14px] text-text-tertiary flex items-center border-r border-border-default">
                $
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={supportAmount()}
                onInput={(e) => setSupportAmount(Math.max(10, Number((e.target as HTMLInputElement).value)))}
                class="w-20 px-3 font-mono text-[16px] text-text-primary bg-transparent border-none outline-hidden"
              />
            </div>
            <button
              onClick={handleSupportPay}
              disabled={supportLoading()}
              class="bg-accent text-white text-[14px] font-medium px-6 border border-accent cursor-pointer disabled:opacity-50"
              style={{ height: "40px" }}
            >
              {supportLoading() ? "..." : t("preorder.crypto")}
            </button>
            <span class="text-[12px] text-text-tertiary whitespace-nowrap">
              = {Math.floor(supportAmount() / 10)} mo Pro
            </span>
          </div>
        </div>

        {/* Payment Block — Bank transfer / Card */}
        <div
          class="border border-border-default bg-bg-canvas p-6 flex flex-col mx-auto w-full"
          style={{ gap: "16px", "max-width": "720px", "margin-top": "12px" }}
        >
          <span class="text-[10px] font-medium text-accent uppercase tracking-[0.04em]">
            {t("preorder.card")}
          </span>
          {/* Card number */}
          <div class="flex items-center" style={{ gap: "12px" }}>
            <span
              class="font-mono text-[16px] font-bold text-text-primary"
              style={{ "letter-spacing": "0.08em" }}
            >
              {t("preorder.cardNumber")}
            </span>
            <span class="text-[12px] text-text-tertiary">Visa</span>
            <button
              onClick={() => copyText("4405639710713882")}
              class="border border-border-default bg-transparent text-[12px] font-medium text-text-secondary px-3 py-1 cursor-pointer hover:border-accent hover:text-accent transition-colors duration-[80ms]"
            >
              {t("preorder.copyNumber")}
            </button>
          </div>
          {/* Wire transfer details */}
          <div class="flex flex-col" style={{ gap: "8px" }}>
            <div class="flex items-baseline" style={{ gap: "12px" }}>
              <span class="text-[10px] text-text-tertiary uppercase tracking-[0.04em]" style={{ width: "80px", "flex-shrink": "0" }}>Beneficiary</span>
              <span class="font-mono text-[12px] text-text-primary">{t("preorder.beneficiary")}</span>
            </div>
            <div class="flex items-baseline" style={{ gap: "12px" }}>
              <span class="text-[10px] text-text-tertiary uppercase tracking-[0.04em]" style={{ width: "80px", "flex-shrink": "0" }}>Bank</span>
              <span class="text-[12px] text-text-primary">{t("preorder.cardBank")}</span>
            </div>
            <div class="flex items-baseline" style={{ gap: "12px" }}>
              <span class="text-[10px] text-text-tertiary uppercase tracking-[0.04em]" style={{ width: "80px", "flex-shrink": "0" }}>SWIFT</span>
              <span class="font-mono text-[12px] text-text-primary">{t("preorder.swift")}</span>
            </div>
            <div class="flex items-baseline" style={{ gap: "12px" }}>
              <span class="text-[10px] text-text-tertiary uppercase tracking-[0.04em]" style={{ width: "80px", "flex-shrink": "0" }}>IBAN (USD)</span>
              <span class="font-mono text-[12px] text-text-primary">{t("preorder.ibanUsd")}</span>
            </div>
          </div>
        </div>

        {/* After-payment Note */}
        <p
          class="text-[12px] text-text-tertiary leading-[1.5] mt-4 mx-auto"
          style={{ "max-width": "720px" }}
        >
          {t("preorder.afterPayment", { email: "nopoint@contexter.cc" })}
        </p>

        {/* Why $500 Disclosure */}
        <div
          class="border-t border-border-subtle pt-6 mt-8 mx-auto"
          style={{ "max-width": "720px" }}
        >
          <p class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em] mb-3">
            {t("preorder.whyTitle")}
          </p>
          <div class="flex justify-between items-baseline py-2 border-b border-border-subtle">
            <span class="text-[12px] text-text-secondary">Jina AI embeddings</span>
            <span class="text-[12px] font-bold text-text-primary">$50</span>
          </div>
          <div class="flex justify-between items-baseline py-2 border-b border-border-subtle">
            <span class="text-[12px] text-text-secondary">Server + API credits</span>
            <span class="text-[12px] font-bold text-text-primary">$150</span>
          </div>
          <div class="flex justify-between items-baseline py-2">
            <span class="text-[12px] text-text-secondary">Banking setup (Stripe)</span>
            <span class="text-[12px] font-bold text-text-primary">$300</span>
          </div>
          <div class="flex justify-between items-baseline mt-2 border-t border-border-default pt-2">
            <span class="text-[10px] font-medium text-text-secondary uppercase tracking-[0.04em]">TOTAL</span>
            <span class="text-[14px] font-bold text-text-primary">$500</span>
          </div>
        </div>
      </section>

      {/* 6. ROADMAP */}
      <section class="border-t border-border-subtle px-4 py-12 md:px-16 bg-bg-canvas">
        <p class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3">
          {t("roadmap.label")}
        </p>
        <h2 class="text-black mb-8" style={{ "font-size": "20px", "font-weight": "700", "letter-spacing": "-0.04em" }}>
          {t("roadmap.title")}
        </h2>
        <div
          class="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "1px", background: "var(--color-border-subtle)" }}
        >
          {([
            { labelKey: "roadmap.now", descKey: "roadmap.nowDesc", featureKeys: ["roadmap.now.f1","roadmap.now.f2","roadmap.now.f3","roadmap.now.f4","roadmap.now.f5"], isNow: true },
            { labelKey: "roadmap.q2",  descKey: "roadmap.q2Desc",  featureKeys: ["roadmap.q2.f1","roadmap.q2.f2","roadmap.q2.f3","roadmap.q2.f4","roadmap.q2.f5","roadmap.q2.f6","roadmap.q2.f7","roadmap.q2.f8"],   isNow: false },
            { labelKey: "roadmap.q3",  descKey: "roadmap.q3Desc",  featureKeys: ["roadmap.q3.f1","roadmap.q3.f2","roadmap.q3.f3","roadmap.q3.f4","roadmap.q3.f5","roadmap.q3.f6"],   isNow: false },
          ] as { labelKey: string; descKey: string; featureKeys: string[]; isNow: boolean }[]).map((phase) => (
            <div
              class={`bg-bg-canvas p-6 flex flex-col${phase.isNow ? " border-l-2 border-accent" : ""}`}
              style={{ gap: "16px" }}
            >
              <div class="flex flex-col" style={{ gap: "6px" }}>
                <span
                  style={{ "font-size": "11px", "text-transform": "uppercase", "letter-spacing": "0.15em", "font-weight": "500" }}
                  class={phase.isNow ? "text-accent" : "text-text-tertiary"}
                >
                  {t(phase.labelKey)}
                </span>
                <span class="text-black" style={{ "font-size": "15px", "font-weight": "700", "letter-spacing": "-0.03em" }}>
                  {t(phase.descKey)}
                </span>
              </div>
              <div class="flex flex-col" style={{ gap: "10px" }}>
                {phase.featureKeys.map((key) => (
                  <div class="flex items-start" style={{ gap: "10px" }}>
                    <span
                      class={phase.isNow ? "text-accent" : "text-text-tertiary"}
                      style={{ "font-size": "12px", "font-weight": "700", "line-height": "1.5", "flex-shrink": "0" }}
                    >
                      {phase.isNow ? "✓" : "—"}
                    </span>
                    <span class="text-text-secondary" style={{ "font-size": "13px", "line-height": "1.5" }}>
                      {t(key)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer class="border-t border-border-subtle mt-auto px-4 py-5 md:px-16">
        <div class="flex items-center flex-wrap" style={{ gap: "32px" }}>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            {t("hero.footerEurope")}
          </span>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            {t("hero.footerNoTraining")}
          </span>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            {t("hero.footerDelete")}
          </span>
          <span style={{ flex: "1" }} />
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            © 2026 Contexter
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Hero
