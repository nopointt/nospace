import { useNavigate, useParams } from "@solidjs/router"
import {
  createSignal,
  createResource,
  onMount,
  Show,
  For,
  type Component,
} from "solid-js"
import Nav from "../components/Nav"
import Badge from "../components/Badge"
import Toast, { showToast } from "../components/Toast"
import { getDocumentContent } from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"

/* ── helpers (duplicated from Dashboard to keep files independent) ── */

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

/* ── page ── */

const DocumentViewer: Component = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()

  /* auth guard */
  onMount(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true })
    }
  })

  const [doc] = createResource(
    () => ({ id: params.id, token: getToken() }),
    async ({ id, token }) => {
      if (!token) throw new Error("no token")
      try {
        return await getDocumentContent(id, token)
      } catch (e) {
        showToast("не удалось загрузить документ.", "error")
        throw e
      }
    },
  )

  const fullText = () =>
    doc()
      ?.chunks.map((c) => c.content)
      .join("\n\n") ?? ""

  return (
    <div class="min-h-screen bg-bg-canvas font-sans">
      <Nav variant="app" />
      <Toast />

      <div
        class="flex flex-col"
        style={{ padding: "32px max(16px, min(64px, 5vw))", gap: "24px", "max-width": "900px" }}
      >
        {/* ── Back link ── */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            display: "flex",
            "align-items": "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            "font-size": "12px",
            color: "var(--color-text-tertiary)",
          }}
          class="hover:text-text-primary transition-colors duration-[80ms]"
        >
          <span style={{ "font-size": "14px", "line-height": "1" }}>←</span>
          все документы
        </button>

        {/* ── Loading state ── */}
        <Show when={doc.loading}>
          <div class="flex flex-col" style={{ gap: "12px" }}>
            <div class="h-6 bg-bg-elevated animate-pulse" style={{ width: "40%" }} />
            <div class="h-4 bg-bg-elevated animate-pulse" style={{ width: "25%" }} />
            <div style={{ "margin-top": "24px", gap: "8px", display: "flex", "flex-direction": "column" }}>
              {[100, 90, 95, 80, 85].map((w) => (
                <div class="h-3 bg-bg-elevated animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </Show>

        {/* ── Error state ── */}
        <Show when={doc.error && !doc.loading}>
          <div
            class="flex flex-col items-start"
            style={{ gap: "12px", "padding-top": "48px" }}
          >
            <p style={{ "font-size": "14px", color: "#D32F2F" }}>
              не удалось загрузить документ
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                "font-size": "12px",
                color: "#1E3EA0",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
              }}
            >
              вернуться к списку
            </button>
          </div>
        </Show>

        {/* ── Document loaded ── */}
        <Show when={doc() && !doc.loading}>
          {(d) => (
            <>
              {/* Document header */}
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <h1
                  style={{
                    "font-size": "20px",
                    "font-weight": "600",
                    color: "#0A0A0A",
                    "line-height": "1.3",
                    margin: "0",
                    "word-break": "break-word",
                  }}
                >
                  {d().name}
                </h1>

                {/* Meta row */}
                <div
                  class="flex flex-wrap items-center"
                  style={{ gap: "16px" }}
                >
                  <MetaItem label="тип" value={mimeShort(d().mime_type)} />
                  <MetaItem label="размер" value={formatSize(d().size)} />
                  <MetaItem label="фрагменты" value={String(d().chunkCount)} />
                  <MetaItem label="дата" value={formatDateFull(d().created_at)} />
                  <div class="flex items-center" style={{ gap: "6px" }}>
                    <span style={metaLabelStyle}>статус</span>
                    <Badge variant={statusToVariant(d().status)} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#E5E5E5" }} />

              {/* Content body */}
              <Show
                when={d().chunkCount > 0}
                fallback={
                  <div
                    class="flex flex-col items-center justify-center"
                    style={{ padding: "48px 0", gap: "8px" }}
                  >
                    <p style={{ "font-size": "13px", color: "var(--color-text-tertiary)" }}>
                      документ ещё обрабатывается — фрагменты недоступны
                    </p>
                  </div>
                }
              >
                {/* Chunk count bar */}
                <div
                  class="flex items-center justify-between"
                  style={{ gap: "8px" }}
                >
                  <span style={sectionLabelStyle}>СОДЕРЖАНИЕ</span>
                  <span style={{ "font-size": "10px", color: "var(--color-text-tertiary)" }}>
                    {d().chunkCount} фрагм.
                  </span>
                </div>

                {/* Text content */}
                <div
                  class="flex flex-col"
                  style={{ gap: "0" }}
                >
                  <For each={d().chunks}>
                    {(chunk) => (
                      <div
                        style={{
                          "border-bottom": "1px solid #F0F0F0",
                          padding: "16px 0",
                        }}
                      >
                        {/* Chunk index marker */}
                        <div
                          style={{
                            "font-size": "9px",
                            "font-weight": "500",
                            color: "var(--color-text-tertiary)",
                            "letter-spacing": "1px",
                            "text-transform": "uppercase",
                            "margin-bottom": "8px",
                          }}
                        >
                          #{chunk.index + 1}
                          {chunk.tokenCount != null ? ` · ${chunk.tokenCount} токенов` : ""}
                        </div>

                        {/* Chunk text */}
                        <p
                          class="whitespace-pre-wrap"
                          style={{
                            "font-size": "13px",
                            color: "#0A0A0A",
                            "line-height": "1.65",
                            margin: "0",
                          }}
                        >
                          {chunk.content}
                        </p>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}

/* ── Meta item ── */

const MetaItem: Component<{ label: string; value: string }> = (props) => (
  <div class="flex items-center" style={{ gap: "6px" }}>
    <span style={metaLabelStyle}>{props.label}</span>
    <span style={{ "font-size": "12px", color: "#0A0A0A" }}>{props.value}</span>
  </div>
)

/* ── Style constants ── */

const metaLabelStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-tertiary)",
  "letter-spacing": "1px",
  "text-transform": "uppercase" as const,
}

const sectionLabelStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-tertiary)",
  "letter-spacing": "1px",
  "text-transform": "uppercase" as const,
}

export default DocumentViewer
