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
import PipelineIndicator from "../components/PipelineIndicator"
import AuthModal from "../components/AuthModal"
import ConnectionModal from "../components/ConnectionModal"
import DocumentModal from "../components/DocumentModal"
import Toast, { showToast } from "../components/Toast"
import KnowledgeGraph from "../components/KnowledgeGraph"
import {
  uploadFile,
  uploadText,
  getDocumentStatus,
  listDocuments,
  query as queryApi,
} from "../lib/api"
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

const MAX_FILE_SIZE = 100 * 1024 * 1024
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
const API_BASE = "https://contexter.nopoint.workers.dev"

const MCP_CONFIG = (t: string) => `{
  "contexter": {
    "command": "npx",
    "args": [
      "-y",
      "@anthropic-ai/mcp-remote",
      "${API_BASE}/sse?token=${t}"
    ]
  }
}`

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
      pending: "pending", processing: "active", completed: "done", done: "done", error: "error",
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

function statusToVariant(s: string): BadgeVariant {
  if (s === "ready" || s === "completed") return "ready"
  if (s === "error" || s === "failed") return "error"
  if (s === "processing") return "processing"
  return "pending"
}

function updateEntry(entries: readonly FileEntry[], id: string, patch: Partial<FileEntry>): FileEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
}

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); showToast("скопировано", "success") }
  catch { showToast("не удалось скопировать", "error") }
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
  const [qText, setQText] = createSignal("")
  const [qLoading, setQLoading] = createSignal(false)
  const [qResult, setQResult] = createSignal<{
    answer: string; sources: { content: string; document_name: string; score: number }[]
  } | null>(null)

  // Load docs for dashboard + resume polling for processing docs
  createEffect(async () => {
    if (!isAuthenticated()) return
    const t = getToken()
    if (!t) return
    try {
      const res = await listDocuments(t)
      setLandingDocs(res.documents)
      setLandingChunks(res.totalChunks)
      // Resume polling for docs still processing
      const processing = res.documents.filter((d: any) => d.status === "processing")
      if (processing.length > 0) {
        const existing = files()
        for (const doc of processing) {
          if (!existing.some((f) => f.documentId === doc.id)) {
            setFiles((prev) => [...prev, {
              id: doc.id, file: null as any, name: doc.name, mimeType: doc.mime_type,
              size: doc.size, status: "processing" as const, progress: 0,
              documentId: doc.id, stages: null, error: null,
            }])
          }
        }
        startPolling()
      }
    } catch {}
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
    if (file.size === 0) return `${file.name}: пустой файл`
    if (file.size > MAX_FILE_SIZE) return `${file.name}: файл больше 100MB`
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
      const result = await uploadFile(file, t)
      setFiles((prev) => updateEntry(prev, entry.id, {
        documentId: result.documentId, status: "processing",
        stages: STAGE_NAMES.map((n, i) => ({ name: n, status: (i === 0 ? "active" : "pending") as StageStatus })),
      }))
    } catch (e) {
      setFiles((prev) => updateEntry(prev, entry.id, {
        status: "error", error: e instanceof Error ? e.message : "ошибка загрузки",
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
        status: "error", error: e instanceof Error ? e.message : "ошибка загрузки",
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
        if (isDuplicate(file) && !window.confirm(`"${file.name}" уже загружен. повторно?`)) continue
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
      if (newEntries.length > 1) showToast(`${newEntries.length} файлов добавлено`, "info")
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
      if (isYT) showToast("youtube url добавлен", "info")
      else if (isUrl) showToast("url добавлен", "info")
      else showToast(`текст вставлен · ${trimmed.length} символов`, "success")
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
          // Detect stuck pipeline: processing for over 5 min with no stage progress
          const isStuck = !allDone && !hasError && data.created_at &&
            (Date.now() - new Date(data.created_at).getTime()) > 5 * 60 * 1000 &&
            stages.some((s) => s.status === "running")
          setFiles((prev) => updateEntry(prev, entry.id, {
            status: allDone ? "ready" : hasError ? "error" : isStuck ? "error" : "processing",
            stages, error: errStage?.error ?? (isStuck ? "обработка заняла слишком долго — попробуйте загрузить файл заново" : null),
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

  // Landing query
  async function handleQuery() {
    const q = qText().trim()
    if (!q) return
    const t = getToken()
    if (!t) return
    setQLoading(true); setQResult(null)
    try { setQResult(await queryApi(q, t)) }
    catch { showToast("ошибка запроса", "error") }
    finally { setQLoading(false) }
  }

  // Derived
  const processingCount = () => files().filter((f) => f.status === "processing" || f.status === "uploading").length
  const readyCount = () => files().filter((f) => f.status === "ready").length
  const hasFiles = () => files().length > 0
  const tok = () => getToken() ?? "YOUR_TOKEN"
  const mcpUrl = () => `${API_BASE}/sse?token=${tok()}`

  // ══════ RENDER ══════

  return (
    <div class="min-h-screen bg-bg-canvas font-sans">
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

      {/* ═══ SECTION 1: HERO INFO ═══ */}
      <section style={{ padding: "32px 64px 24px" }}>
        <div class="flex" style={{ gap: "64px", "align-items": "center" }}>
          <div class="flex-1 flex flex-col" style={{ gap: "16px" }}>
            <span style={{ "font-size": "13px", "font-weight": "500", color: "#1E3EA0", "letter-spacing": "0.05em", "text-transform": "uppercase" }}>
              любой формат — любой размер · скоро
            </span>
            <h1 style={{
              "font-size": "52px", "font-weight": "700", color: "#0A0A0A",
              "letter-spacing": "-1.5px", "line-height": "1.08",
            }}>
              получите доступ к файлам из любой нейросети
            </h1>
            <p style={{
              "font-size": "15px", color: "#333333", "line-height": "1.7",
              "max-width": "520px", "margin-top": "12px",
            }}>
              вы загружаете файлы — мы открываем их для всех нейросетей.
              <br />
              один раз подключите свою и она всегда будет знать что вам нужно.
            </p>
            <p style={{
              "font-family": "Inter, sans-serif",
              "font-size": "14px", "font-weight": "500", color: "#1E3EA0",
              background: "transparent", padding: "0",
              "margin-top": "20px", cursor: "pointer",
              display: "inline-block", width: "fit-content",
              "text-decoration": "underline", "text-underline-offset": "4px",
            }} onClick={() => { setConnectionClient("chatgpt"); setConnectionOpen(true) }}>
              подключить нейросеть
            </p>
          </div>
          <div class="shrink-0" style={{ width: "480px" }}>
            <KnowledgeGraph
              onNodeClick={(clientId) => {
                const openModal = () => {
                  setConnectionClient(clientId as any)
                  setConnectionOpen(true)
                }
                if (!requireAuth(openModal)) return
                openModal()
              }}
              connectedClients={[]}
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: BLACK DROP ZONE ═══ */}
      <section
        class="flex flex-col items-center justify-center cursor-pointer transition-colors duration-[150ms]"
        style={{
          background: "#0A0A0A",
          padding: "80px 64px",
          "min-height": "320px",
          border: dragOver() ? "2px solid #1E3EA0" : "2px solid transparent",
        }}
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
          class={`transition-transform duration-[80ms] ${dragOver() ? "scale-110" : ""}`}
          style={{ width: "48px", height: "48px", color: dragOver() ? "#1E3EA0" : "#FAFAFA" }}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <span style={{ "font-size": "18px", "font-weight": "500", color: "#FAFAFA", "margin-top": "24px", "text-align": "center" }}>
          перетащите файлы или вставьте текст
        </span>
        <span style={{ "font-size": "14px", color: "#999999", "margin-top": "12px", "text-align": "center" }}>
          pdf · docx · xlsx · аудио · youtube · изображения · или просто текст
        </span>

        <button
          style={{
            "margin-top": "20px",
            border: "1px solid #333333",
            padding: "8px 24px",
            "font-size": "14px",
            color: "#CCCCCC",
            background: "transparent",
            cursor: "pointer",
            transition: "border-color 80ms, color 80ms",
          }}
          onClick={(e) => { e.stopPropagation(); fileInputRef?.click() }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1E3EA0"; e.currentTarget.style.color = "#FFFFFF" }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333333"; e.currentTarget.style.color = "#CCCCCC" }}
        >
          выбрать файлы
        </button>

        <div class="flex items-center" style={{
          "margin-top": "24px", border: "1px solid #333333", padding: "12px 20px", gap: "12px",
        }}>
          <span class="font-mono" style={{
            background: "#1E3EA0", color: "#FAFAFA", "font-size": "12px", "font-weight": "500", padding: "4px 10px",
          }}>ctrl + v</span>
          <span style={{ "font-size": "13px", color: "#999999" }}>
            скопировали текст? просто вставьте — мы всё сделаем
          </span>
        </div>

        {dropError() && (
          <span class="text-signal-error" style={{ "font-size": "11px", "margin-top": "12px" }}>{dropError()}</span>
        )}
      </section>

      {/* ═══ SECTION 3: FILE LIST ═══ */}
      <Show when={hasFiles()}>
        <section style={{ padding: "24px 64px 24px" }}>
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs text-text-tertiary lowercase">файлы ({files().length})</span>
            <div class="flex items-center gap-4">
              <Show when={processingCount() > 0}>
                <span class="text-xs text-accent">обработка: {processingCount()}</span>
              </Show>
              <Show when={readyCount() > 0}>
                <span class="text-xs text-signal-success">готово: {readyCount()}</span>
              </Show>
            </div>
          </div>
          <div class="flex flex-col border border-border-default">
            <For each={files()}>
              {(entry) => (
                <div
                  class={`flex flex-col gap-3 p-4 cursor-pointer border-b border-border-subtle last:border-b-0 transition-colors duration-[80ms] ${
                    selectedId() === entry.id ? "bg-bg-canvas" : "bg-bg-surface hover:bg-bg-canvas"
                  }`}
                  onClick={() => {
                    setSelectedId(entry.id)
                    if (entry.status === "ready" && entry.documentId) {
                      setViewDocId(entry.documentId)
                    }
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
                    <PipelineIndicator stages={entry.stages} />
                  </Show>
                  <Show when={entry.status === "error" && entry.error}>
                    <div class="flex items-center justify-between gap-4 p-3 border border-signal-error bg-bg-canvas">
                      <span class="text-xs text-signal-error">{entry.error}</span>
                      <Show when={entry.documentId}>
                        <Button variant="ghost" onClick={() => handleRetry(entry.id)}>повторить</Button>
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </section>
      </Show>

      {/* ═══ SECTION 3b: POST-UPLOAD QUERY ═══ */}
      <Show when={readyCount() > 0}>
        <section style={{ padding: "32px 64px 40px", background: "#FAFAFA", "border-top": "2px solid #0A0A0A" }}>
          <div class="flex flex-col" style={{ gap: "16px" }}>
            <span style={{ "font-size": "13px", "font-weight": "500", color: "#1E3EA0", "letter-spacing": "0.05em", "text-transform": "uppercase" }}>
              готово — {readyCount()} {readyCount() === 1 ? "файл обработан" : "файлов обработано"}
            </span>
            <h2 style={{ "font-size": "28px", "font-weight": "700", color: "#0A0A0A", "letter-spacing": "-0.5px" }}>
              попробуйте задать вопрос
            </h2>
            <div class="flex" style={{ gap: "8px", "margin-top": "4px" }}>
              <input
                type="text"
                value={qText()}
                onInput={(e) => setQText(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuery() }}
                placeholder="о чём ваши документы? что в них написано?"
                disabled={qLoading()}
                style={{
                  flex: "1", padding: "16px 20px", "font-size": "16px",
                  border: "2px solid #0A0A0A", background: "#FFFFFF", color: "#0A0A0A",
                  outline: "none", "font-family": "Inter, sans-serif",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1E3EA0" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#0A0A0A" }}
              />
              <button
                disabled={!qText().trim() || qLoading()}
                onClick={handleQuery}
                style={{
                  padding: "16px 32px", "font-size": "15px", "font-weight": "600",
                  background: qText().trim() && !qLoading() ? "#0A0A0A" : "#CCCCCC",
                  color: "#FAFAFA", border: "none", cursor: qText().trim() && !qLoading() ? "pointer" : "default",
                  "font-family": "Inter, sans-serif", "white-space": "nowrap",
                  transition: "background 80ms",
                }}
                onMouseEnter={(e) => { if (qText().trim() && !qLoading()) e.currentTarget.style.background = "#1E3EA0" }}
                onMouseLeave={(e) => { if (qText().trim() && !qLoading()) e.currentTarget.style.background = "#0A0A0A" }}
              >
                {qLoading() ? "ищем..." : "спросить"}
              </button>
            </div>
            <Show when={qResult()}>
              {(r) => (
                <div class="flex flex-col gap-4" style={{ background: "#FFFFFF", padding: "24px", border: "1px solid #E5E5E5", "margin-top": "4px" }}>
                  <p class="whitespace-pre-wrap" style={{ "font-size": "15px", color: "#0A0A0A", "line-height": "1.65" }}>
                    {r().answer}
                  </p>
                  <Show when={r().sources.length > 0}>
                    <div class="flex flex-col gap-2" style={{ "padding-top": "12px", "border-top": "1px solid #E5E5E5" }}>
                      <span style={{ "font-size": "11px", "font-weight": "500", color: "#666666", "letter-spacing": "0.05em", "text-transform": "uppercase" }}>источники</span>
                      <div class="flex flex-wrap" style={{ gap: "8px" }}>
                        <For each={r().sources}>
                          {(s) => (
                            <span style={{
                              "font-size": "12px", color: "#1E3EA0",
                              padding: "3px 10px", border: "1px solid #C8D6F5", background: "#F0F4FD",
                            }}>
                              {s.document_name} · {(s.score * 100).toFixed(0)}%
                            </span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </section>
      </Show>

      {/* ═══ SECTION 4: DASHBOARD ═══ */}
      <section style={{ background: "#F2F2F2", padding: "64px" }}>
        <div class="flex items-center justify-between" style={{ "margin-bottom": "32px" }}>
          <h2 style={{ "font-size": "28px", "font-weight": "700", color: "#0A0A0A", "letter-spacing": "-0.5px" }}>
            ваши документы
          </h2>
          <Show when={isAuthenticated()}>
            <A href="/dashboard" style={{ "font-size": "12px", color: "#1E3EA0" }}>
              все документы →
            </A>
          </Show>
        </div>

        <Show
          when={isAuthenticated()}
          fallback={
            <div class="flex flex-col items-center gap-6" style={{ padding: "48px 0" }}>
              <div class="flex w-full" style={{ gap: "16px" }}>
                {(["документы", "фрагменты", "запросы"] as const).map((label) => (
                  <div class="flex-1 flex flex-col" style={{ background: "#FAFAFA", padding: "20px 24px", gap: "4px" }}>
                    <span style={{ "font-size": "32px", "font-weight": "700", color: "#CCCCCC" }}>—</span>
                    <span style={{ "font-size": "12px", "font-weight": "500", color: "#666666" }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ "font-size": "12px", color: "#666666" }}>загрузите первый файл чтобы создать базу знаний</p>
            </div>
          }
        >
          {/* Stats */}
          <div class="flex" style={{ gap: "16px", "margin-bottom": "24px" }}>
            {([
              [landingDocs().length, "документы"],
              [landingChunks(), "фрагменты"],
              [0, "запросы"],
            ] as [number, string][]).map(([v, l]) => (
              <div class="flex-1 flex flex-col" style={{ background: "#FAFAFA", padding: "20px 24px", gap: "4px" }}>
                <span style={{ "font-size": "32px", "font-weight": "700", "line-height": "1", color: "#0A0A0A" }}>{v}</span>
                <span style={{ "font-size": "12px", "font-weight": "500", color: "#666666" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Compact doc list */}
          <Show when={landingDocs().length > 0}>
            <div style={{ background: "#FAFAFA" }}>
              <div class="flex items-center" style={{ padding: "10px 16px", "border-bottom": "1px solid #E5E5E5" }}>
                <span class="flex-1" style={{ "font-size": "11px", color: "#666666", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>документ</span>
                <span style={{ width: "80px", "font-size": "11px", color: "#666666", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>фрагменты</span>
                <span style={{ width: "100px", "font-size": "11px", color: "#666666", "text-transform": "uppercase", "letter-spacing": "0.08em" }}>статус</span>
              </div>
              <For each={landingDocs().slice(0, 5)}>
                {(doc) => (
                  <div
                    class="flex items-center cursor-pointer transition-colors duration-[80ms] hover:bg-bg-elevated"
                    style={{ padding: "10px 16px", "border-bottom": "1px solid #F2F2F2" }}
                    onClick={() => setViewDocId(doc.id)}
                  >
                    <span class="flex-1 truncate" style={{ "font-size": "14px", color: "#0A0A0A" }}>{doc.name}</span>
                    <span style={{ width: "80px", "font-size": "12px", color: "#0A0A0A" }}>{doc.chunk_count}</span>
                    <span style={{ width: "100px" }}><Badge variant={statusToVariant(doc.status)} /></span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Inline query */}
          <div class="flex flex-col" style={{ "margin-top": "24px", gap: "12px" }}>
            <span style={{ "font-size": "11px", color: "#666666", "letter-spacing": "0.08em", "text-transform": "uppercase", "font-weight": "500" }}>
              вопрос по документам
            </span>
            <div class="flex" style={{ gap: "8px" }}>
              <input
                type="text"
                value={qText()}
                onInput={(e) => setQText(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleQuery() }}
                placeholder="задайте вопрос..."
                disabled={qLoading()}
                class="flex-1 px-4 py-3 text-sm border border-border-default bg-bg-canvas text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent"
              />
              <Button
                variant={qText().trim() ? "primary" : "ghost"}
                disabled={!qText().trim() || qLoading()}
                loading={qLoading()}
                onClick={handleQuery}
              >спросить</Button>
            </div>
            <Show when={qResult()}>
              {(r) => (
                <div class="flex flex-col gap-3" style={{ background: "#FAFAFA", padding: "16px", border: "1px solid #E5E5E5" }}>
                  <p class="whitespace-pre-wrap" style={{ "font-size": "12px", color: "#0A0A0A", "line-height": "1.5" }}>
                    {r().answer}
                  </p>
                  <Show when={r().sources.length > 0}>
                    <div class="flex flex-col gap-1">
                      <span style={{ "font-size": "10px", color: "#666666" }}>источники:</span>
                      <For each={r().sources}>
                        {(s) => <span style={{ "font-size": "10px", color: "#1E3EA0" }}>{s.document_name} ({(s.score * 100).toFixed(0)}%)</span>}
                      </For>
                    </div>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </Show>
      </section>

      {/* ═══ SECTION 5: CONNECTION ═══ */}
      <section style={{ padding: "64px" }}>
        <div class="flex" style={{ gap: "64px" }}>
          <div class="flex-1 flex flex-col" style={{ gap: "24px" }}>
            <h2 style={{ "font-size": "28px", "font-weight": "700", color: "#0A0A0A", "letter-spacing": "-0.5px" }}>подключение</h2>
            <p style={{ "font-size": "15px", color: "#666666", "line-height": "1.6" }}>
              откройте ChatGPT, Claude или Cursor — и спросите по вашим файлам
            </p>
            <div class="flex flex-col" style={{ gap: "20px" }}>
              {([
                ["1", "скопируйте ссылку подключения", "нажмите copy справа — ссылка скопируется"],
                ["2", "вставьте в настройки нейросети", "нажмите на нужную нейросеть выше — покажем куда вставить"],
                ["3", "спросите что-нибудь", "«какие документы загружены?» — если ответит, всё работает"],
              ] as const).map(([num, title, desc]) => (
                <div class="flex" style={{ gap: "16px" }}>
                  <span style={{
                    "font-size": "16px", "font-weight": "700", color: "#1E3EA0",
                    width: "28px", "text-align": "center", "flex-shrink": "0",
                  }}>{num}</span>
                  <div class="flex flex-col" style={{ gap: "4px" }}>
                    <span style={{ "font-size": "16px", "font-weight": "600", color: "#0A0A0A" }}>{title}</span>
                    <span style={{ "font-size": "14px", color: "#666666" }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <A href="/api" style={{ "font-size": "12px", color: "#1E3EA0", "margin-top": "8px" }}>
              подробная инструкция →
            </A>
          </div>

          <div class="flex flex-col shrink-0" style={{ width: "480px", gap: "24px" }}>
            {/* Instruction for AI */}
            <div class="flex flex-col" style={{ gap: "8px" }}>
              <span style={{ "font-size": "11px", color: "#666666", "letter-spacing": "0.08em", "text-transform": "uppercase", "font-weight": "500" }}>
                скинь это своей нейросети
              </span>
              <div style={{ border: "2px solid #1E3EA0", position: "relative" }}>
                <p style={{
                  padding: "24px 24px 20px", "font-size": "15px", color: "#0A0A0A",
                  "line-height": "1.7",
                }}>
                  Подключи мою базу знаний Contexter.
                  <br />Ссылка: <span class="font-mono" style={{ "font-size": "12px", color: "#1E3EA0", "word-break": "break-all" }}>{mcpUrl()}</span>
                  <br />Это MCP-сервер. Добавь его в настройки и используй для ответов по моим документам.
                </p>
                <button
                  onClick={() => copyText(`Подключи мою базу знаний Contexter.\nСсылка: ${mcpUrl()}\nЭто MCP-сервер. Добавь его в настройки и используй для ответов по моим документам.`)}
                  style={{
                    position: "absolute", top: "12px", right: "12px",
                    padding: "6px 16px", "font-size": "12px", "font-weight": "600", color: "#FAFAFA",
                    background: "#1E3EA0", border: "none", cursor: "pointer",
                  }}
                >скопировать</button>
              </div>
            </div>

            {/* Or choose manually */}
            <div class="flex flex-col" style={{ gap: "12px" }}>
              <span style={{ "font-size": "13px", color: "#666666" }}>
                или настройте вручную:
              </span>
              <div class="flex items-center flex-wrap" style={{ gap: "8px" }}>
                {([["chatgpt", "ChatGPT"], ["claude-web", "Claude.ai"], ["claude-desktop", "Claude Desktop"], ["perplexity", "Perplexity"], ["cursor", "Cursor"], ["antigravity", "Antigravity"]] as const).map(([id, name]) => (
                  <button
                    class="font-mono"
                    style={{
                      padding: "6px 14px", "font-size": "12px", "font-weight": "500",
                      border: "1px solid #E5E5E5", color: "#666666", background: "transparent",
                      cursor: "pointer", transition: "all 80ms",
                    }}
                    onClick={() => { setConnectionClient(id as any); setConnectionOpen(true) }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1E3EA0"; e.currentTarget.style.color = "#1E3EA0" }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.color = "#666666" }}
                  >{name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST FOOTER ═══ */}
      <footer style={{ "border-top": "1px solid #E5E5E5", padding: "20px 64px" }}>
        <div class="flex items-center flex-wrap" style={{ gap: "32px" }}>
          <span style={{ "font-size": "12px", color: "#666666", "line-height": "1.5" }}>
            ваши файлы хранятся на серверах Cloudflare в Европе
          </span>
          <span style={{ "font-size": "12px", color: "#666666", "line-height": "1.5" }}>
            данные не используются для обучения ИИ
          </span>
          <span style={{ "font-size": "12px", color: "#666666", "line-height": "1.5" }}>
            вы можете удалить все файлы в любой момент
          </span>
          <span style={{ "flex": "1" }} />
          <a
            href="mailto:support@contexter.dev"
            style={{ "font-size": "12px", color: "#666666", "text-decoration": "none", "white-space": "nowrap" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#1E3EA0" }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#666666" }}
          >
            support@contexter.dev
          </a>
        </div>
      </footer>
    </div>
  )
}

export default Hero
