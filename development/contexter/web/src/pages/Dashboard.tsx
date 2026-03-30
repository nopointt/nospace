import { A, useNavigate } from "@solidjs/router"
import {
  createSignal,
  createEffect,
  onMount,
  Show,
  For,
  type Component,
} from "solid-js"
import Nav from "../components/Nav"
import Button from "../components/Button"
import Badge from "../components/Badge"
import Input from "../components/Input"
import Toast, { showToast } from "../components/Toast"
import DocumentModal from "../components/DocumentModal"
import { listDocuments, query as queryApi, getDocumentStatus, deleteDocument } from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"

/* ── types ── */

interface Document {
  id: string
  name: string
  mime_type: string
  size: number
  status: string
  chunk_count: number
  created_at: string
}

interface DocumentDetail extends Document {
  stages: { type: string; status: string; progress: number; error_message?: string }[]
}

interface QuerySource {
  content: string
  document_name: string
  score: number
}

interface QueryResult {
  answer: string
  sources: QuerySource[]
}

/* ── helpers ── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}.${mm}`
}

function formatDateFull(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function statusToVariant(status: string): "processing" | "ready" | "error" | "pending" {
  if (status === "ready" || status === "completed") return "ready"
  if (status === "error" || status === "failed") return "error"
  if (status === "processing") return "processing"
  return "pending"
}

function mimeShort(mime: string): string {
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
  return map[mime] ?? mime.split("/").pop() ?? mime
}

/* ── confirm dialog ── */

const ConfirmDialog: Component<{
  message: string
  onConfirm: () => void
  onCancel: () => void
}> = (props) => (
  <div class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40">
    <div class="bg-bg-canvas border border-border-default p-6 max-w-[400px] w-full mx-4 flex flex-col gap-4">
      <p class="text-sm text-text-primary">{props.message}</p>
      <div class="flex items-center gap-3 justify-end">
        <Button variant="ghost" onClick={props.onCancel}>
          Отмена
        </Button>
        <Button variant="danger" onClick={props.onConfirm}>
          Удалить
        </Button>
      </div>
    </div>
  </div>
)

/* ── dashboard page ── */

const Dashboard: Component = () => {
  const navigate = useNavigate()

  /* state */
  const [documents, setDocuments] = createSignal<Document[]>([])
  const [totalChunks, setTotalChunks] = createSignal(0)
  const [totalVectors, setTotalVectors] = createSignal(0)
  const [totalQueries, setTotalQueries] = createSignal(0)
  const [loading, setLoading] = createSignal(true)
  const [loadError, setLoadError] = createSignal(false)
  const [selectedId, setSelectedId] = createSignal<string | null>(null)
  const [selectedDetail, setSelectedDetail] = createSignal<DocumentDetail | null>(null)
  const [detailLoading, setDetailLoading] = createSignal(false)

  /* query state */
  const [queryText, setQueryText] = createSignal("")
  const [queryLoading, setQueryLoading] = createSignal(false)
  const [queryResult, setQueryResult] = createSignal<QueryResult | null>(null)
  const [queryError, setQueryError] = createSignal<string | null>(null)

  /* document modal */
  const [viewDocId, setViewDocId] = createSignal<string | null>(null)

  /* delete */
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  /* auth guard */
  onMount(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true })
      return
    }
    loadDocuments()
  })

  async function loadDocuments() {
    const token = getToken()
    if (!token) return
    setLoading(true)
    setLoadError(false)
    try {
      const res = await listDocuments(token)
      setDocuments(res.documents)
      setTotalChunks(res.totalChunks)
      setTotalVectors(res.totalChunks)
    } catch (e) {
      setLoadError(true)
      showToast("Не удалось загрузить документы.", "error")
    } finally {
      setLoading(false)
    }
  }

  /* load doc detail when selected */
  createEffect(async () => {
    const id = selectedId()
    if (!id) {
      setSelectedDetail(null)
      return
    }
    const token = getToken()
    if (!token) return
    setDetailLoading(true)
    try {
      const res = await getDocumentStatus(id, token)
      const doc = documents().find((d) => d.id === id)
      setSelectedDetail({
        id: res.id,
        name: res.name,
        mime_type: res.mime_type,
        size: res.size,
        status: res.status,
        chunk_count: doc?.chunk_count ?? 0,
        created_at: res.created_at,
        stages: res.stages,
      })
    } catch {
      showToast("Не удалось загрузить детали документа.", "error")
    } finally {
      setDetailLoading(false)
    }
  })

  /* select doc — click: open modal */
  function selectDoc(doc: Document) {
    setViewDocId(doc.id)
  }

  /* query */
  async function handleQuery() {
    const q = queryText().trim()
    if (!q) return
    const token = getToken()
    if (!token) return

    setQueryLoading(true)
    setQueryResult(null)
    setQueryError(null)

    try {
      const res = await queryApi(q, token)
      setTotalQueries((prev) => prev + 1)
      if (res.sources.length === 0 && !res.answer) {
        setQueryError("По вашему запросу ничего не найдено.")
      } else {
        setQueryResult({ answer: res.answer, sources: res.sources })
      }
    } catch {
      setQueryError("Не удалось получить ответ. Повторите запрос.")
    } finally {
      setQueryLoading(false)
    }
  }

  function handleQueryKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && queryText().trim()) {
      handleQuery()
    }
  }

  /* delete */
  async function handleDelete() {
    const token = getToken()
    const id = selectedId()
    if (!token || !id) return

    setDeleting(true)
    try {
      await deleteDocument(id, token)
      setShowDeleteConfirm(false)
      setSelectedId(null)
      setSelectedDetail(null)
      showToast("Документ удалён.", "success")
      await loadDocuments()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не удалось удалить документ.", "error")
    } finally {
      setDeleting(false)
    }
  }

  /* ── render ── */
  return (
    <div class="min-h-screen bg-bg-canvas font-sans">
      <Nav variant="app" />
      <Toast />

      {/* document modal */}
      <DocumentModal
        docId={viewDocId()}
        onClose={() => setViewDocId(null)}
      />

      {/* confirm dialog */}
      <Show when={showDeleteConfirm()}>
        <ConfirmDialog
          message="Удалить документ? Это действие необратимо."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </Show>

      {/* ══════ BODY — horizontal split ══════ */}
      <div
        class="flex"
        style={{
          padding: "32px max(16px, min(64px, 5vw))",
          gap: "32px",
          "min-height": "calc(100vh - 56px)",
        }}
      >
        {/* ── LEFT: fill container — Stats + Documents ── */}
        <div class="flex-1 flex flex-col" style={{ gap: "24px" }}>
          {/* Stats Row — 4 cards */}
          <div class="flex" style={{ gap: "16px" }}>
            <StatCard value={documents().length} label="Документы" />
            <StatCard value={totalChunks()} label="Фрагменты" />
            <StatCard value={totalQueries()} label="Запросы" />
          </div>

          {/* Documents Table */}
          <div class="flex flex-col">
            {/* Header row */}
            <div
              class="flex items-center bg-bg-surface"
              style={{
                padding: "10px 16px",
              }}
            >
              <span class="flex-1" style={headerCellStyle}>Документ</span>
              <span style={{ ...headerCellStyle, width: "80px" }}>Тип</span>
              <span style={{ ...headerCellStyle, width: "80px" }}>Фрагменты</span>
              <span style={{ ...headerCellStyle, width: "100px" }}>Статус</span>
              <span style={{ ...headerCellStyle, width: "80px" }}>Дата</span>
            </div>

            {/* Loading skeleton */}
            <Show when={loading()}>
              <For each={[1, 2, 3, 4]}>
                {() => (
                  <div
                    class="flex items-center border-b border-border-subtle"
                    style={{
                      padding: "10px 16px",
                    }}
                  >
                    <div class="flex-1">
                      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "60%" }} />
                    </div>
                    <div style={{ width: "80px" }}>
                      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "40px" }} />
                    </div>
                    <div style={{ width: "60px" }}>
                      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "30px" }} />
                    </div>
                    <div style={{ width: "100px" }}>
                      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "60px" }} />
                    </div>
                    <div style={{ width: "80px" }}>
                      <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "40px" }} />
                    </div>
                  </div>
                )}
              </For>
            </Show>

            {/* Error state */}
            <Show when={!loading() && loadError()}>
              <div
                class="flex flex-col items-start"
                style={{ padding: "32px 16px", gap: "12px" }}
              >
                <p class="text-signal-error" style={{ "font-size": "12px" }}>
                  Не удалось загрузить документы
                </p>
                <button
                  onClick={loadDocuments}
                  class="text-accent"
                  style={{
                    "font-size": "12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0",
                    "text-decoration": "underline",
                  }}
                >
                  Повторить
                </button>
              </div>
            </Show>

            {/* Empty state */}
            <Show when={!loading() && !loadError() && documents().length === 0}>
              <div
                class="flex flex-col items-center justify-center gap-4"
                style={{ padding: "48px 16px" }}
              >
                <span class="text-sm text-text-primary">
                  Документов пока нет
                </span>
                <span class="text-xs text-text-tertiary">
                  Загрузите первый файл для начала работы
                </span>
                <A href="/">
                  <Button variant="primary">Загрузить файл</Button>
                </A>
              </div>
            </Show>

            {/* Data rows */}
            <Show when={!loading()}>
              <For each={documents()}>
                {(doc) => (
                  <div
                    class={`
                      flex items-center cursor-pointer
                      transition-colors duration-[80ms]
                      hover:bg-interactive-hover border-b border-border-subtle
                      ${selectedId() === doc.id ? "bg-interactive-hover" : ""}
                    `}
                    style={{
                      padding: "10px 16px",
                    }}
                    onClick={() => selectDoc(doc)}
                  >
                    <span
                      class="flex-1 truncate text-black"
                      style={{ "font-size": "12px" }}
                    >
                      {doc.name}
                    </span>
                    <span class="text-black" style={{ width: "80px", "font-size": "12px" }}>
                      {mimeShort(doc.mime_type)}
                    </span>
                    <span class="text-black" style={{ width: "60px", "font-size": "12px" }}>
                      {doc.chunk_count}
                    </span>
                    <span style={{ width: "100px" }}>
                      <Badge variant={statusToVariant(doc.status)} />
                    </span>
                    <span
                      class="text-black"
                      style={{ width: "80px", "font-size": "12px" }}
                      title={formatDateFull(doc.created_at)}
                    >
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>

        {/* ── RIGHT: 420px fixed — Query Panel ── */}
        <div
          class="shrink-0 flex flex-col border-l border-border-subtle"
          style={{
            width: "420px",
            padding: "32px 0px 32px 32px",
            gap: "24px",
          }}
        >
          {/* ВОПРОС section */}
          <div class="flex flex-col" style={{ gap: "12px" }}>
            <span style={sectionLabelStyle}>ВОПРОС</span>
            <Input
              value={queryText()}
              onInput={setQueryText}
              onKeyDown={handleQueryKeyDown}
              placeholder="Задайте вопрос по документам..."
              disabled={queryLoading()}
            />
            <Button
              variant={queryText().trim() ? "primary" : "ghost"}
              disabled={!queryText().trim() || queryLoading()}
              loading={queryLoading()}
              onClick={handleQuery}
            >
              Спросить
            </Button>
          </div>

          {/* ОТВЕТ section */}
          <div class="flex flex-col" style={{ gap: "8px" }}>
            <span style={sectionLabelStyle}>ОТВЕТ</span>
            <Show when={queryLoading()}>
              <div class="flex flex-col gap-2">
                <div class="h-3 bg-bg-elevated animate-pulse w-full" />
                <div class="h-3 bg-bg-elevated animate-pulse w-[90%]" />
                <div class="h-3 bg-bg-elevated animate-pulse w-[75%]" />
              </div>
            </Show>
            <Show when={queryError()}>
              <p class="text-signal-error" style={{ "font-size": "12px" }}>{queryError()}</p>
            </Show>
            <Show when={queryResult()}>
              {(result) => (
                <p
                  class="whitespace-pre-wrap text-black"
                  style={{
                    "font-size": "12px",
                    "line-height": "1.5",
                  }}
                >
                  {result().answer}
                </p>
              )}
            </Show>
            <Show when={!queryLoading() && !queryError() && !queryResult()}>
              <p style={{ "font-size": "12px", color: "var(--color-text-tertiary)" }}>
                Ответ появится здесь после запроса
              </p>
            </Show>
          </div>

          {/* ИСТОЧНИКИ section */}
          <div class="flex flex-col" style={{ gap: "8px" }}>
            <span style={sectionLabelStyle}>ИСТОЧНИКИ</span>
            <Show when={queryResult()}>
              {(result) => (
                <Show
                  when={result().sources.length > 0}
                  fallback={
                    <p style={{ "font-size": "10px", color: "var(--color-text-tertiary)" }}>
                      Нет источников
                    </p>
                  }
                >
                  <For each={result().sources}>
                    {(source) => (
                      <div
                        class="flex items-center bg-bg-surface"
                        style={{
                          padding: "8px 12px",
                          gap: "8px",
                        }}
                      >
                        <span
                          class="shrink-0 bg-accent"
                          style={{
                            width: "6px",
                            height: "6px",
                          }}
                        />
                        <span class="text-black" style={{ "font-size": "10px" }}>
                          {source.document_name} ({(source.score * 100).toFixed(0)}%)
                        </span>
                      </div>
                    )}
                  </For>
                </Show>
              )}
            </Show>
            <Show when={!queryResult()}>
              <p style={{ "font-size": "10px", color: "var(--color-text-tertiary)" }}>
                Источники появятся после запроса
              </p>
            </Show>
          </div>

          {/* Developer link */}
          <A href="/api" class="text-accent" style={{ "font-size": "12px" }}>
            Для разработчиков → /api
          </A>
        </div>
      </div>

      {/* fade-in keyframe */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Stat Card ── */

const StatCard: Component<{ value: number; label: string }> = (props) => (
  <div
    class="flex-1 flex flex-col bg-bg-surface"
    style={{
      padding: "16px 20px",
      gap: "4px",
    }}
  >
    <span
      class="text-black"
      style={{
        "font-size": "32px",
        "font-weight": "700",
        "line-height": "1",
      }}
    >
      {props.value}
    </span>
    <span
      style={{
        "font-size": "10px",
        "font-weight": "500",
        color: "var(--color-text-tertiary)",
      }}
    >
      {props.label}
    </span>
  </div>
)

/* ── Style constants ── */

const headerCellStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-tertiary)",
  "text-transform": "uppercase" as const,
  "letter-spacing": "1px",
}

const sectionLabelStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-tertiary)",
  "letter-spacing": "1px",
}

export default Dashboard
