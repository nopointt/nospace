import { createSignal, createResource, Show, For, type Component } from "solid-js"
import { useNavigate } from "@solidjs/router"
import Nav from "../components/Nav"
import Button from "../components/Button"
import Toast, { showToast } from "../components/Toast"
import { createShare, listShares, revokeShare, listDocuments } from "../lib/api"
import { auth, getToken, isAuthenticated } from "../lib/store"

const API_BASE = "https://contexter.nopoint.workers.dev"

/* ── curl examples ── */
const curlExamples = [
  {
    label: "загрузить документ",
    code: `curl -X POST ${API_BASE}/api/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf"`,
  },
  {
    label: "семантический запрос",
    code: `curl -X POST ${API_BASE}/api/query \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "ваш вопрос"}'`,
  },
  {
    label: "статус документа",
    code: `curl ${API_BASE}/api/status/DOCUMENT_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
  },
]

/* ── mcp config json ── */
const mcpConfigJson = `{
  "contexter": {
    "command": "npx",
    "args": [
      "-y",
      "@anthropic-ai/mcp-remote",
      "https://contexter.nopoint.workers.dev/sse?token=YOUR_TOKEN"
    ]
  }
}`

/* ── code block with copy ── */
function CodeBlock(props: { code: string; label?: string }) {
  const [copied, setCopied] = createSignal(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast("не удалось скопировать", "error")
    }
  }

  return (
    <div class="border border-border-subtle bg-bg-surface">
      <Show when={props.label}>
        <div class="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
          <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
            {props.label}
          </span>
        </div>
      </Show>
      <div class="relative">
        <pre class="p-4 font-mono text-[13px] leading-[1.4] text-text-primary whitespace-pre overflow-x-auto">
          <code>{props.code}</code>
        </pre>
        <button
          onClick={handleCopy}
          class="absolute top-2 right-2 px-2.5 py-1 font-mono text-[10px] text-text-tertiary hover:text-text-primary border border-border-subtle bg-bg-surface hover:bg-bg-elevated transition-colors duration-[80ms] lowercase"
        >
          {copied() ? "скопировано \u2713" : "скопировать"}
        </button>
      </div>
    </div>
  )
}

/* ── inline copy field ── */
function CopyField(props: { value: string; label?: string }) {
  const [copied, setCopied] = createSignal(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast("не удалось скопировать", "error")
    }
  }

  return (
    <div class="flex flex-col gap-1">
      <Show when={props.label}>
        <span class="text-[10px] font-medium text-text-tertiary uppercase tracking-[0.04em]">
          {props.label}
        </span>
      </Show>
      <div class="flex items-center gap-0 border border-border-default bg-bg-surface">
        <span class="flex-1 px-4 py-2.5 font-mono text-xs text-text-primary truncate select-all">
          {props.value}
        </span>
        <button
          onClick={handleCopy}
          class="shrink-0 px-4 py-2.5 font-mono text-[10px] text-text-tertiary hover:text-text-primary border-l border-border-default hover:bg-bg-elevated transition-colors duration-[80ms] lowercase"
        >
          {copied() ? "скопировано \u2713" : "скопировать"}
        </button>
      </div>
    </div>
  )
}

/* ── step component ── */
function Step(props: { num: string; title: string; children: any }) {
  return (
    <div class="flex gap-4">
      <span class="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold text-accent">
        {props.num}
      </span>
      <div class="flex flex-col gap-3 flex-1 min-w-0">
        <h4 class="text-sm font-bold lowercase text-black">{props.title}</h4>
        {props.children}
      </div>
    </div>
  )
}

/* ── main page ── */
const ApiPage: Component = () => {
  const navigate = useNavigate()
  const token = () => getToken() ?? ""
  const mcpUrl = () => `${API_BASE}/sse?token=${token()}`

  /* ── shares state ── */
  const [shares, { refetch: refetchShares }] = createResource(
    () => (isAuthenticated() ? token() : null),
    (t) => (t ? listShares(t).then((r) => r.shares) : Promise.resolve([])),
  )

  /* ── documents for scope selector ── */
  const [documents] = createResource(
    () => (isAuthenticated() ? token() : null),
    (t) => (t ? listDocuments(t).then((r) => r.documents) : Promise.resolve([])),
  )

  /* ── share creation ── */
  const [shareScope, setShareScope] = createSignal<"all" | "selected">("all")
  const [selectedDocs, setSelectedDocs] = createSignal<string[]>([])
  const [newShareToken, setNewShareToken] = createSignal<string | null>(null)
  const [creatingShare, setCreatingShare] = createSignal(false)

  const handleCreateShare = async () => {
    setCreatingShare(true)
    try {
      const scope = shareScope() === "all" ? "all" : selectedDocs()
      const result = await createShare(token(), scope as any)
      setNewShareToken(result.shareToken)
      refetchShares()
      showToast("ссылка создана", "success")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ошибка создания ссылки", "error")
    } finally {
      setCreatingShare(false)
    }
  }

  /* ── new api token (re-register to get new token) ── */
  const [newToken, setNewToken] = createSignal<string | null>(null)
  const [creatingToken, setCreatingToken] = createSignal(false)

  const handleCreateToken = async () => {
    setCreatingToken(true)
    try {
      const result = await createShare(token(), "all", "read_write")
      setNewToken(result.shareToken)
      showToast("токен создан", "success")
      refetchShares()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ошибка создания токена", "error")
    } finally {
      setCreatingToken(false)
    }
  }

  /* ── revoke ── */
  const [revoking, setRevoking] = createSignal<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = createSignal<string | null>(null)

  const handleRevoke = async (shareId: string) => {
    setRevoking(shareId)
    try {
      await revokeShare(shareId, token())
      refetchShares()
      setConfirmRevoke(null)
      showToast("токен отозван", "success")
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ошибка отзыва", "error")
    } finally {
      setRevoking(null)
    }
  }

  const toggleDoc = (docId: string) => {
    const current = selectedDocs()
    if (current.includes(docId)) {
      setSelectedDocs(current.filter((id) => id !== docId))
    } else {
      setSelectedDocs([...current, docId])
    }
  }

  /* ── not authenticated ── */
  if (!isAuthenticated()) {
    return (
      <div class="min-h-screen bg-bg-canvas font-mono">
        <Nav variant="app" />
        <div class="w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-24">
          <div class="flex flex-col items-center gap-6 text-center">
            <p class="text-text-secondary text-sm">
              войдите чтобы получить доступ к api
            </p>
            <Button variant="primary" onClick={() => navigate("/upload")}>
              начать
            </Button>
          </div>
        </div>
        <Toast />
      </div>
    )
  }

  return (
    <div class="min-h-screen bg-bg-canvas font-mono">
      <Nav variant="app" />

      <div class="w-full max-w-[1280px] mx-auto px-8 lg:px-16 py-12">
        {/* ── page header ── */}
        <h1 class="text-[24px] font-bold lowercase leading-[1.2] text-black mb-2">
          api & подключение
        </h1>
        <p class="text-text-secondary text-xs mb-12">
          эндпоинты, примеры и настройка mcp-клиентов
        </p>

        {/* ══════════════════════════════════════════════
            section 1: api endpoints
           ══════════════════════════════════════════════ */}
        <section class="mb-16">
          <h2 class="text-[20px] font-medium leading-[1.2] lowercase text-black mb-2">
            api эндпоинты
          </h2>
          <p class="text-text-tertiary text-xs mb-6">
            base url: <span class="text-text-primary">{API_BASE}</span>
          </p>

          <div class="flex flex-col gap-6">
            <For each={curlExamples}>
              {(example) => (
                <CodeBlock
                  label={example.label}
                  code={example.code.replace(/YOUR_TOKEN/g, token())}
                />
              )}
            </For>
          </div>
        </section>

        {/* ── divider ── */}
        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ══════════════════════════════════════════════
            section 2: mcp connection
           ══════════════════════════════════════════════ */}
        <section class="mb-16">
          <h2 class="text-[20px] font-medium leading-[1.2] lowercase text-black mb-2">
            mcp подключение
          </h2>
          <p class="text-text-tertiary text-xs mb-8">
            подключите contexter как mcp-сервер к claude desktop или другому
            совместимому клиенту
          </p>

          <div class="flex flex-col gap-8">
            {/* step 1 */}
            <Step num="1" title="скопируйте mcp url">
              <CopyField
                label="mcp url с токеном"
                value={mcpUrl()}
              />
            </Step>

            {/* step 2 */}
            <Step num="2" title="откройте настройки claude desktop">
              <p class="text-text-secondary text-xs leading-relaxed">
                settings &rarr; developer &rarr; mcp servers &rarr; add
              </p>
            </Step>

            {/* step 3 */}
            <Step num="3" title="добавьте сервер">
              <p class="text-text-secondary text-xs leading-relaxed mb-3">
                добавьте следующий json в конфигурацию mcp-серверов:
              </p>
              <CodeBlock
                label="claude_desktop_config.json"
                code={mcpConfigJson.replace(/YOUR_TOKEN/g, token())}
              />
            </Step>

            {/* step 4 */}
            <Step num="4" title="перезапустите claude desktop">
              <p class="text-text-secondary text-xs leading-relaxed">
                закройте и откройте claude desktop чтобы применить изменения
              </p>
            </Step>

            {/* step 5 */}
            <Step num="5" title="проверьте подключение">
              <p class="text-text-secondary text-xs leading-relaxed">
                в claude спросите:{" "}
                <span class="text-text-primary">"какие документы загружены?"</span>{" "}
                — должен вернуться список через mcp
              </p>
            </Step>
          </div>

          {/* alternative: direct streamable http */}
          <div class="mt-10 border border-border-subtle bg-bg-surface p-6">
            <h3 class="text-sm font-bold lowercase text-black mb-2">
              альтернатива: streamable http
            </h3>
            <p class="text-text-secondary text-xs leading-relaxed mb-4">
              для claude.ai projects и других клиентов с поддержкой streamable
              http — используйте url напрямую:
            </p>
            <CopyField
              label="streamable http url"
              value={mcpUrl()}
            />
          </div>
        </section>

        {/* ── divider ── */}
        <div class="w-full border-t border-border-subtle mb-16" />

        {/* ══════════════════════════════════════════════
            section 3: tokens & sharing
           ══════════════════════════════════════════════ */}
        <section>
          <h2 class="text-[20px] font-medium leading-[1.2] lowercase text-black mb-2">
            токены и шеринг
          </h2>
          <p class="text-text-tertiary text-xs mb-8">
            управление api-токенами и ссылками для совместного доступа
          </p>

          {/* current token */}
          <div class="mb-8">
            <CopyField
              label="ваш api токен"
              value={auth()?.apiToken ?? ""}
            />
          </div>

          {/* create new token */}
          <div class="mb-10">
            <h3 class="text-sm font-bold lowercase text-black mb-3">
              создать токен
            </h3>
            <Button
              variant="secondary"
              onClick={handleCreateToken}
              loading={creatingToken()}
            >
              создать токен
            </Button>
            <Show when={newToken()}>
              <div class="mt-4 border border-signal-warning bg-signal-warning/10 p-4">
                <p class="text-xs font-bold text-text-primary mb-2">
                  сохраните токен, он больше не будет показан
                </p>
                <CopyField value={newToken()!} />
              </div>
            </Show>
          </div>

          {/* create share link */}
          <div class="mb-10">
            <h3 class="text-sm font-bold lowercase text-black mb-3">
              создать ссылку для шеринга
            </h3>
            <div class="flex flex-col gap-4">
              {/* scope selector */}
              <div class="flex items-center gap-4">
                <button
                  onClick={() => setShareScope("all")}
                  class={`px-3 py-1.5 font-mono text-xs lowercase border transition-colors duration-[80ms] ${
                    shareScope() === "all"
                      ? "border-accent text-accent"
                      : "border-border-default text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  все документы
                </button>
                <button
                  onClick={() => setShareScope("selected")}
                  class={`px-3 py-1.5 font-mono text-xs lowercase border transition-colors duration-[80ms] ${
                    shareScope() === "selected"
                      ? "border-accent text-accent"
                      : "border-border-default text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  выбранные
                </button>
                <span class="inline-flex items-center px-2.5 py-1 border border-border-default text-[10px] font-medium text-text-tertiary lowercase">
                  read-only
                </span>
              </div>

              {/* document selector (when scope = selected) */}
              <Show when={shareScope() === "selected"}>
                <div class="border border-border-subtle p-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
                  <Show
                    when={documents() && documents()!.length > 0}
                    fallback={
                      <span class="text-xs text-text-tertiary">нет документов</span>
                    }
                  >
                    <For each={documents()}>
                      {(doc) => (
                        <label class="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDocs().includes(doc.id)}
                            onChange={() => toggleDoc(doc.id)}
                            class="accent-accent"
                          />
                          <span class="text-xs text-text-primary truncate">{doc.name}</span>
                        </label>
                      )}
                    </For>
                  </Show>
                </div>
              </Show>

              <div>
                <Button
                  variant="secondary"
                  onClick={handleCreateShare}
                  loading={creatingShare()}
                  disabled={shareScope() === "selected" && selectedDocs().length === 0}
                >
                  создать ссылку
                </Button>
              </div>
            </div>

            <Show when={newShareToken()}>
              <div class="mt-4 border border-signal-warning bg-signal-warning/10 p-4">
                <p class="text-xs font-bold text-text-primary mb-2">
                  сохраните токен, он больше не будет показан
                </p>
                <CopyField value={newShareToken()!} />
              </div>
            </Show>
          </div>

          {/* active shares list */}
          <div>
            <h3 class="text-sm font-bold lowercase text-black mb-3">
              активные ссылки
            </h3>
            <Show
              when={shares() && shares()!.length > 0}
              fallback={
                <p class="text-xs text-text-tertiary">нет активных ссылок</p>
              }
            >
              <div class="flex flex-col gap-0 border border-border-subtle">
                <For each={shares()}>
                  {(share) => (
                    <div class="flex items-center justify-between px-4 py-3 border-b border-border-subtle last:border-b-0">
                      <div class="flex items-center gap-4 min-w-0">
                        <span class="text-xs text-text-primary font-medium truncate max-w-[200px]">
                          {share.share_token.slice(0, 12)}...
                        </span>
                        <span class="text-[10px] text-text-tertiary">
                          {share.scope === "all" ? "все документы" : "выборочно"}
                        </span>
                        <span class="text-[10px] text-text-tertiary">
                          {new Date(share.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <Show
                        when={confirmRevoke() === share.id}
                        fallback={
                          <button
                            onClick={() => setConfirmRevoke(share.id)}
                            class="text-[10px] font-mono text-signal-error hover:underline lowercase"
                          >
                            отозвать
                          </button>
                        }
                      >
                        <div class="flex items-center gap-2">
                          <button
                            onClick={() => handleRevoke(share.id)}
                            disabled={revoking() === share.id}
                            class="text-[10px] font-mono text-signal-error font-bold hover:underline lowercase disabled:opacity-40"
                          >
                            {revoking() === share.id ? "..." : "подтвердить"}
                          </button>
                          <button
                            onClick={() => setConfirmRevoke(null)}
                            class="text-[10px] font-mono text-text-tertiary hover:text-text-primary lowercase"
                          >
                            отмена
                          </button>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </section>
      </div>

      <Toast />
    </div>
  )
}

export default ApiPage
