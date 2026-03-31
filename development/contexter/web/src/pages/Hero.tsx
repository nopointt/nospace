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
const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "docx", "xlsx", "pptx", "csv", "json", "txt", "md",
  "png", "jpg", "jpeg", "webp", "svg",
  "mp3", "wav", "ogg", "m4a",
  "mp4", "webm", "mov",
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
  try { await navigator.clipboard.writeText(text); showToast("Скопировано", "success") }
  catch { showToast("Не удалось скопировать", "error") }
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
    if (file.size === 0) return `${file.name}: Пустой файл`
    // No file size limit — presigned upload handles any size
    const ext = getExtension(file.name)
    if (ext && !SUPPORTED_EXTENSIONS.has(ext)) return `${file.name}: .${ext} не поддерживается`
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
        status: "error", error: e instanceof Error ? e.message : "Ошибка загрузки",
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
        status: "error", error: e instanceof Error ? e.message : "Ошибка загрузки",
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
        if (isDuplicate(file) && !window.confirm(`"${file.name}" уже загружен. Повторно?`)) continue
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
      if (newEntries.length > 1) showToast(`${newEntries.length} файлов добавлено`, "success")
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
    const isYT = YOUTUBE_REGEX.test(trimmed)
    const isUrl = URL_REGEX.test(trimmed)
    const action = () => {
      const entry: FileEntry = {
        id: generateId(),
        name: isYT ? `youtube: ${trimmed.slice(0, 60)}` : isUrl ? `url: ${trimmed.slice(0, 60)}` : `текст (${trimmed.length} символов)`,
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
              showToast(`«${data.name || entry.name}» готов к поиску`, "success")
            }
          }
          setFiles((prev) => updateEntry(prev, entry.id, {
            status: allDone ? "ready" : hasError ? "error" : isStuck ? "error" : "processing",
            stages, error: errStage?.error ?? (isStuck ? "Обработка заняла слишком долго" : null),
            name: data.name || entry.name, mimeType: data.mime_type || entry.mimeType, size: data.size || entry.size,
          }))
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
          Перетащите файлы или вставьте текст
        </span>
        <span class="text-[14px] text-text-disabled mt-3 text-center">
          PDF · DOCX · XLSX · Аудио · YouTube · Изображения · или просто текст
        </span>

        <div class="flex items-center gap-3 mt-5">
          <button
            class="border border-text-secondary py-2 px-6 text-sm text-text-disabled bg-transparent cursor-pointer transition-[border-color,color] duration-[80ms]"
            onClick={(e) => { e.stopPropagation(); fileInputRef?.click() }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-white)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-text-secondary)"; e.currentTarget.style.color = "var(--color-text-disabled)" }}
          >
            Выбрать файлы
          </button>
          <span class="text-text-disabled text-xs">или</span>
          <button
            class="border border-text-secondary py-2 px-6 text-sm text-text-disabled bg-transparent cursor-pointer transition-[border-color,color] duration-[80ms]"
            onClick={(e) => { e.stopPropagation() }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-white)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-text-secondary)"; e.currentTarget.style.color = "var(--color-text-disabled)" }}
          >
            ctrl+v
          </button>
        </div>
        <span class="text-text-disabled text-xs mt-3 text-center">
          Скопировали что-то? Просто нажмите ctrl+v — мы всё подхватим
        </span>

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
                    <Badge variant={fileBadgeVariant(entry.status)} />
                  </div>
                  <Show when={entry.status !== "pending"}>
                    <PipelineIndicator stages={entry.stages} mimeType={entry.mimeType} />
                    <Show when={entry.status === "processing" && getTimeEstimate(entry.mimeType) !== null}>
                      <span class="text-[10px] text-text-tertiary mt-1">
                        ожидаемое время: {getTimeEstimate(entry.mimeType)}
                      </span>
                    </Show>
                  </Show>
                  <Show when={entry.status === "error" && entry.error}>
                    <div class="flex items-center justify-between gap-4 p-3 border border-signal-error bg-bg-canvas">
                      <div class="flex flex-col gap-1">
                        <span class="text-xs text-signal-error">{humanizeError(entry.error)}</span>
                        <Show when={entry.stages?.find((s) => s.status === "error")}>
                          {(failedStage) => (
                            <span class="text-[10px] text-text-tertiary">этап: {
                              {parse: "распознавание", chunk: "разбивка", embed: "векторизация", index: "сохранение"}[failedStage().name] ?? failedStage().name
                            }</span>
                          )}
                        </Show>
                      </div>
                      <Show when={entry.documentId}>
                        <Button variant="ghost" onClick={() => handleRetry(entry.id)}>Повторить</Button>
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
            Ваши документы
          </h2>
          <Show when={isAuthenticated() && landingDocs().length > 5}>
            <A href="/dashboard" class="text-accent" style={{ "font-size": "12px" }}>
              Все документы →
            </A>
          </Show>
        </div>

        <Show
          when={isAuthenticated() && landingDocs().length > 0}
          fallback={
            <div class="flex flex-col items-center gap-4" style={{ padding: "48px 0" }}>
              <span class="text-text-tertiary" style={{ "font-size": "14px" }}>
                {isAuthenticated() ? "Загрузите первый файл, чтобы создать базу знаний" : "Войдите, чтобы увидеть ваши документы"}
              </span>
            </div>
          }
        >
          {/* Stats row */}
          <div class="flex flex-wrap gap-4 mb-6">
            {([
              [landingDocs().length, "документов"],
              [landingChunks(), "фрагментов"],
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
              <span class="flex-1 text-text-tertiary" style={{ "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>документ</span>
              <span class="text-text-tertiary" style={{ width: "80px", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>фрагменты</span>
              <span class="text-text-tertiary" style={{ width: "100px", "font-size": "10px", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>статус</span>
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

      {/* 4. CONNECTION */}
      <Show when={isAuthenticated()}>
        <section class="border-t border-border-subtle px-4 py-12 md:px-16">
          <div class="flex flex-col md:flex-row gap-8 md:gap-16">
            <div class="flex-1 flex flex-col" style={{ gap: "20px" }}>
              <h2 class="text-black" style={{ "font-size": "24px", "font-weight": "700", "letter-spacing": "-0.5px" }}>Подключение</h2>
              <p class="text-text-tertiary" style={{ "font-size": "14px", "line-height": "1.5" }}>
                Откройте ChatGPT, Claude или Cursor — и спросите по вашим файлам
              </p>
              <div class="flex flex-col" style={{ gap: "16px" }}>
                {([
                  ["1", "Скопируйте ссылку подключения", "Нажмите «скопировать» справа"],
                  ["2", "Вставьте в настройки нейросети", "Нажмите на нужную нейросеть ниже — покажем куда"],
                  ["3", "Спросите что-нибудь", "«Какие документы загружены?»"],
                ] as const).map(([num, title, desc]) => (
                  <div class="flex" style={{ gap: "12px" }}>
                    <span class="text-accent" style={{ "font-size": "14px", "font-weight": "700", width: "20px", "flex-shrink": "0" }}>{num}</span>
                    <div class="flex flex-col" style={{ gap: "2px" }}>
                      <span class="text-black" style={{ "font-size": "14px", "font-weight": "700" }}>{title}</span>
                      <span class="text-text-tertiary" style={{ "font-size": "12px" }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div class="flex flex-col shrink-0 w-full md:w-[440px]" style={{ gap: "20px" }}>
              {/* MCP URL card */}
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <span class="text-text-tertiary" style={{ "font-size": "10px", "letter-spacing": "0.08em", "text-transform": "uppercase", "font-weight": "500" }}>
                  Ссылка подключения
                </span>
                <div class="flex flex-col" style={{ gap: "8px" }}>
                  <div class="border-2 border-accent" style={{ padding: "12px 16px" }}>
                    <span class="font-mono block truncate text-accent" style={{ "font-size": "12px" }}>{mcpUrl()}</span>
                  </div>
                  <div class="flex" style={{ gap: "8px" }}>
                    <button
                      onClick={() => copyText(mcpUrl())}
                      style={{
                        padding: "6px 16px", "font-size": "12px", "font-weight": "700", cursor: "pointer", "white-space": "nowrap",
                      }}
                      class="text-white bg-accent border border-accent"
                    >Скопировать ссылку</button>
                    <button
                      onClick={() => copyText(mcpUrl().match(/token=(.+)$/)?.[1] ?? "")}
                      style={{
                        padding: "6px 16px", "font-size": "12px", "font-weight": "700", cursor: "pointer", "white-space": "nowrap",
                      }}
                      class="text-accent bg-transparent border border-accent"
                    >Скопировать токен</button>
                  </div>
                </div>
              </div>

              {/* Client buttons */}
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <span class="text-text-tertiary" style={{ "font-size": "10px", "letter-spacing": "0.08em", "text-transform": "uppercase", "font-weight": "500" }}>
                  Инструкция для
                </span>
                <div class="flex items-center flex-wrap" style={{ gap: "8px" }}>
                  {([["chatgpt", "ChatGPT"], ["claude-web", "Claude.ai"], ["claude-desktop", "Claude Desktop"], ["perplexity", "Perplexity"], ["cursor", "Cursor"]] as const).map(([id, name]) => (
                    <button
                      class="font-mono text-text-tertiary border border-border-subtle bg-transparent"
                      style={{
                        padding: "6px 14px", "font-size": "12px", "font-weight": "500",
                        cursor: "pointer", transition: "all 80ms",
                      }}
                      onClick={() => { setConnectionClient(id as any); setConnectionOpen(true) }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-subtle)"; e.currentTarget.style.color = "var(--color-text-tertiary)" }}
                    >{name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </Show>

      {/* 5. FOOTER */}
      <footer class="border-t border-border-subtle mt-auto px-4 py-5 md:px-16">
        <div class="flex items-center flex-wrap" style={{ gap: "32px" }}>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            Ваши файлы хранятся на серверах в Европе
          </span>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            Данные не используются для обучения ИИ
          </span>
          <span class="text-text-tertiary" style={{ "font-size": "12px" }}>
            Вы можете удалить все файлы в любой момент
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
