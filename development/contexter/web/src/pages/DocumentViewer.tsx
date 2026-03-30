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
import ErrorState from "../components/ErrorState"
import { getDocumentContent } from "../lib/api"
import { getToken, isAuthenticated } from "../lib/store"
import { formatSize, formatDateFull, statusToVariant, mimeShort } from "../lib/helpers"

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
        showToast("Не удалось загрузить документ.", "error")
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
        class="flex flex-col px-4 py-8 md:px-16 max-w-[900px]"
        style={{ gap: "24px" }}
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
          Все документы
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
          <ErrorState message="Не удалось загрузить документ" onRetry={() => navigate(0)} />
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
                    "font-weight": "700",
                    color: "var(--color-text-primary)",
                    "line-height": "1.2",
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
              <div style={{ height: "1px", background: "var(--color-border-subtle)" }} />

              {/* Content body */}
              <Show
                when={d().chunkCount > 0}
                fallback={
                  <div
                    class="flex flex-col items-center justify-center"
                    style={{ padding: "48px 0", gap: "8px" }}
                  >
                    <p class="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                      Документ ещё обрабатывается — фрагменты недоступны
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
                          "border-bottom": "1px solid var(--color-border-subtle)",
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
                            "font-size": "14px",
                            color: "var(--color-text-primary)",
                            "line-height": "1.5",
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
    <span style={{ "font-size": "12px", color: "var(--color-text-primary)" }}>{props.value}</span>
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
