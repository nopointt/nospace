import {
  createSignal,
  createResource,
  createEffect,
  onCleanup,
  Show,
  For,
  type Component,
} from "solid-js"
import Badge from "./Badge"
import ErrorState from "./ErrorState"
import { getDocumentContent } from "../lib/api"
import { getToken } from "../lib/store"
import { formatSize, formatDateFull, statusToVariant, mimeShort } from "../lib/helpers"

/* ── props ── */

interface DocumentModalProps {
  docId: string | null
  onClose: () => void
}

/* ── component ── */

const DocumentModal: Component<DocumentModalProps> = (props) => {
  let modalRef: HTMLDivElement | undefined
  let previousFocus: Element | null = null

  /* close on Escape + focus management */
  createEffect(() => {
    if (!props.docId) return
    previousFocus = document.activeElement
    queueMicrotask(() => {
      const focusable = modalRef?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    })
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { props.onClose(); return }
      if (e.key === "Tab" && modalRef) {
        const focusable = modalRef.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener("keydown", handler)
    onCleanup(() => {
      window.removeEventListener("keydown", handler)
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus()
        previousFocus = null
      }
    })
  })

  const [doc] = createResource(
    () => props.docId,
    async (docId) => {
      const token = getToken()
      if (!token) throw new Error("Не авторизован")
      if (!docId) throw new Error("Нет ID документа")
      return await getDocumentContent(docId, token)
    },
  )

  return (
    <Show when={props.docId}>
      {/* overlay */}
      <div
        class="fixed inset-0 z-[250] flex items-center justify-center bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) props.onClose() }}
      >
        {/* panel */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="documentmodal-title"
          class="flex flex-col bg-bg-canvas border border-border-subtle"
          style={{
            width: "min(720px, 95vw)",
            "max-height": "80vh",
            animation: "docModalIn 120ms ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── header ── */}
          <div
            class="shrink-0 flex items-start justify-between bg-bg-canvas border-b border-border-subtle"
            style={{
              padding: "20px 24px 16px",
            }}
          >
            <div class="flex flex-col" style={{ gap: "8px", "min-width": "0", flex: "1" }}>
              {/* loading skeleton for name */}
              <Show when={doc.loading}>
                <div
                  class="animate-pulse bg-bg-elevated"
                  style={{ height: "20px", width: "55%" }}
                />
                <div
                  class="animate-pulse bg-bg-elevated"
                  style={{ height: "12px", width: "35%", "margin-top": "4px" }}
                />
              </Show>

              <Show when={doc.error && !doc.loading}>
                <ErrorState message="Не удалось загрузить документ" />
              </Show>

              <Show when={doc() && !doc.loading}>
                {(d) => (
                  <>
                    <h2
                      id="documentmodal-title"
                      style={{
                        "font-size": "16px",
                        "font-weight": "700",
                        color: "var(--color-text-primary)",
                        "line-height": "1.3",
                        margin: "0",
                        "word-break": "break-word",
                      }}
                    >
                      {d().name}
                    </h2>
                    <div class="flex flex-wrap items-center" style={{ gap: "16px" }}>
                      <MetaItem label="тип" value={mimeShort(d().mime_type)} />
                      {d().size ? <MetaItem label="размер" value={formatSize(d().size)} /> : null}
                      <MetaItem label="фрагменты" value={String(d().chunkCount ?? 0)} />
                      {d().created_at ? <MetaItem label="дата" value={formatDateFull(d().created_at)} /> : null}
                      <div class="flex items-center" style={{ gap: "6px" }}>
                        <span style={metaLabelStyle}>статус</span>
                        <Badge variant={statusToVariant(d().status)} />
                      </div>
                    </div>
                  </>
                )}
              </Show>
            </div>

            {/* close button */}
            <button
              aria-label="закрыть"
              onClick={props.onClose}
              style={{
                "flex-shrink": "0",
                width: "32px",
                height: "32px",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-tertiary)",
                "margin-left": "12px",
                "margin-top": "-4px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          </div>

          {/* ── body (scrollable) ── */}
          <div class="flex-1 overflow-y-auto" style={{ padding: "0 24px 24px" }}>
            {/* loading skeleton */}
            <Show when={doc.loading}>
              <div class="flex flex-col" style={{ gap: "8px", "padding-top": "24px" }}>
                {[100, 90, 95, 80, 88, 75].map((w) => (
                  <div
                    class="animate-pulse bg-bg-elevated"
                    style={{ height: "12px", width: `${w}%` }}
                  />
                ))}
              </div>
            </Show>

            {/* content */}
            <Show when={doc() && !doc.loading}>
              {(d) => (
                <Show
                  when={d().chunkCount > 0}
                  fallback={
                    <div
                      class="flex items-center justify-center"
                      style={{ padding: "48px 0" }}
                    >
                      <p
                        style={{
                          "font-size": "12px",
                          color: "var(--color-text-disabled)",
                          margin: "0",
                        }}
                      >
                        Документ ещё обрабатывается — фрагменты недоступны
                      </p>
                    </div>
                  }
                >
                  {/* chunk count row */}
                  <div
                    class="flex items-center justify-between"
                    style={{
                      "padding-top": "16px",
                      "padding-bottom": "12px",
                      "border-bottom": "1px solid var(--color-border-subtle)",
                      "margin-bottom": "0",
                    }}
                  >
                    <span style={sectionLabelStyle}>СОДЕРЖАНИЕ</span>
                    <span
                      style={{
                        "font-size": "10px",
                        color: "var(--color-text-disabled)",
                      }}
                    >
                      {d().chunkCount} фрагм.
                    </span>
                  </div>

                  {/* chunks */}
                  <For each={d().chunks}>
                    {(chunk) => (
                      <div
                        style={{
                          "border-bottom": "1px solid var(--color-border-subtle)",
                          padding: "16px 0",
                        }}
                      >
                        <div
                          style={{
                            "font-size": "10px",
                            "font-weight": "500",
                            color: "var(--color-text-disabled)",
                            "letter-spacing": "1px",
                            "text-transform": "uppercase",
                            "margin-bottom": "8px",
                          }}
                        >
                          #{chunk.index + 1}
                          {chunk.tokenCount != null
                            ? ` · ${chunk.tokenCount} токенов`
                            : ""}
                        </div>
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
                </Show>
              )}
            </Show>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes docModalIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Show>
  )
}

/* ── MetaItem ── */

const MetaItem: Component<{ label: string; value: string }> = (props) => (
  <div class="flex items-center" style={{ gap: "6px" }}>
    <span style={metaLabelStyle}>{props.label}</span>
    <span style={{ "font-size": "12px", color: "var(--color-text-primary)" }}>{props.value}</span>
  </div>
)

/* ── style constants ── */

const metaLabelStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-disabled)",
  "letter-spacing": "1px",
  "text-transform": "uppercase" as const,
}

const sectionLabelStyle = {
  "font-size": "10px",
  "font-weight": "500",
  color: "var(--color-text-disabled)",
  "letter-spacing": "1px",
  "text-transform": "uppercase" as const,
}

export default DocumentModal
