import { createSignal, createEffect, onCleanup, Show, For, type Component } from "solid-js"
import { showToast } from "./Toast"
import { getToken } from "../lib/store"
import { API_BASE } from "../lib/api"

// --- Types ---

type ClientId = "chatgpt" | "claude-web" | "claude-desktop" | "perplexity" | "cursor" | "antigravity"

interface ClientInfo {
  id: ClientId
  label: string
  transport: string
  steps: { action: string; detail: string }[]
  config: string | null
  gotcha: string
}

// --- Pre-qualification card data ---

interface SelectionCard {
  /** Card id — "claude" opens sub-choice, others map directly to a ClientId */
  id: "chatgpt" | "claude" | "perplexity" | "cursor" | "antigravity" | "other"
  label: string
  subtitle: string
  plan: string
  iconBg: string
  iconLabel: string
}

const SELECTION_CARDS: SelectionCard[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    subtitle: "Самый популярный ИИ-чат",
    plan: "Нужен Plus, Pro, Team или Enterprise план",
    iconBg: "#10A37F",
    iconLabel: "G",
  },
  {
    id: "claude",
    label: "Claude",
    subtitle: "От Anthropic",
    plan: "Нужен Pro, Team или Enterprise план (или бесплатно через Desktop)",
    iconBg: "#CC785C",
    iconLabel: "C",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    subtitle: "Поиск с ИИ",
    plan: "Нужен платный план",
    iconBg: "#20808D",
    iconLabel: "P",
  },
  {
    id: "cursor",
    label: "Cursor",
    subtitle: "Редактор кода",
    plan: "Бесплатно",
    iconBg: "#7C3AED",
    iconLabel: "↗",
  },
  {
    id: "antigravity",
    label: "Antigravity",
    subtitle: "IDE от Google",
    plan: "Бесплатно",
    iconBg: "#4285F4",
    iconLabel: "A",
  },
  {
    id: "other",
    label: "Другой клиент",
    subtitle: "Любая программа с поддержкой MCP",
    plan: "Зависит от клиента",
    iconBg: "#808080",
    iconLabel: "…",
  },
]

// Sub-choice for Claude
interface ClaudeSubChoice {
  id: ClientId
  label: string
  detail: string
  plan: string
}

const CLAUDE_SUB_CHOICES: ClaudeSubChoice[] = [
  {
    id: "claude-web",
    label: "Claude.ai",
    detail: "В браузере",
    plan: "Нужен Pro, Team или Enterprise план",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    detail: "Приложение",
    plan: "Бесплатно, нужен Node.js",
  },
]

// --- Data ---

function makeClients(token: string): ClientInfo[] {
  const url = `${API_BASE}/sse?token=${token}`
  return [
    {
      id: "chatgpt",
      label: "ChatGPT",
      transport: "нативный",
      steps: [
        { action: "Settings → Connectors → Advanced", detail: "Нажмите на аватар (внизу слева) → Settings → Connectors → включите Developer mode" },
        { action: "Connectors → Create", detail: "Имя: Contexter. Вставьте ссылку выше. Authentication: No authentication" },
        { action: "В чате нажмите + → Developer Mode", detail: "Откройте новый чат → + в строке ввода → More → Developer Mode → Add sources → включите Contexter" },
      ],
      config: null,
      gotcha: "Только Plus / Pro / Team / Enterprise планы",
    },
    {
      id: "claude-web",
      label: "Claude.ai",
      transport: "нативный",
      steps: [
        { action: "Settings → Connectors", detail: "Нажмите на аватар (внизу слева) → Settings → Connectors" },
        { action: "Add custom connector", detail: "Прокрутите вниз → Add custom connector. Name: Contexter. Remote MCP server URL: вставьте ссылку выше → Add" },
        { action: "Готово — спросите что-нибудь", detail: "Contexter появится в списке коннекторов. Откройте новый чат и спросите по документам" },
      ],
      config: null,
      gotcha: "Max / Team / Enterprise план. Коннектор работает во всех чатах",
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop",
      transport: "mcp-remote bridge",
      steps: [
        { action: "Settings → Developer → Edit Config", detail: "Откройте Claude Desktop → нажмите ⚙ (Settings) → Developer → Edit Config" },
        { action: "Вставьте JSON в открывшийся файл", detail: "Файл claude_desktop_config.json откроется в редакторе. Вставьте блок ниже и сохраните" },
        { action: "Закройте и откройте Claude Desktop", detail: "Quit из меню (не просто закрыть окно). Иконка молотка в чате = MCP работает" },
      ],
      config: JSON.stringify({
        mcpServers: {
          contexter: {
            command: "npx",
            args: ["-y", "@anthropic-ai/mcp-remote", url],
          },
        },
      }, null, 2),
      gotcha: "Нужна программа Node.js — скачайте на nodejs.org",
    },
    {
      id: "perplexity",
      label: "Perplexity",
      transport: "нативный",
      steps: [
        { action: "Settings → Connectors", detail: "Нажмите на аватар (внизу слева) → Connectors" },
        { action: "+ Custom connector", detail: "Нажмите + Custom connector (вверху справа). Name: Contexter. MCP server URL: вставьте ссылку выше. Отметьте галочку → Add" },
        { action: "Добавьте коннектор в чат", detail: "В новом чате нажмите + рядом с полем ввода → выберите Contexter. Может запросить авторизацию — подтвердите" },
        { action: "Спросите что-нибудь", detail: "Спросите по вашим документам — Perplexity будет использовать Contexter как источник" },
      ],
      config: null,
      gotcha: "Нужен Pro план Perplexity",
    },
    {
      id: "cursor",
      label: "Cursor",
      transport: "нативный",
      steps: [
        { action: "Settings → MCP → Add new", detail: "Cursor Settings (Ctrl+Shift+J) → вкладка MCP → Add new MCP server" },
        { action: "Тип подключения: через ссылку", detail: "Или создайте файл ~/.cursor/mcp.json — вставьте JSON ниже" },
        { action: "Откройте чат (Ctrl+L)", detail: "Индикатор MCP-серверов появится в чате. Спросите по документам" },
      ],
      config: JSON.stringify({
        mcpServers: {
          contexter: { url },
        },
      }, null, 2),
      gotcha: "Cursor подключится автоматически",
    },
    {
      id: "antigravity",
      label: "Antigravity",
      transport: "нативный",
      steps: [
        { action: "Manage MCP Servers", detail: "Откройте Antigravity → вверху чат-панели нажмите Manage MCP Servers → View raw config" },
        { action: "Вставьте JSON в mcp_config.json", detail: "Файл откроется в редакторе. Вставьте блок ниже и сохраните" },
        { action: "Перезапустите Antigravity", detail: "Закройте и откройте Antigravity. MCP-сервер появится в списке инструментов" },
      ],
      config: JSON.stringify({
        mcpServers: {
          contexter: { serverUrl: url },
        },
      }, null, 2),
      gotcha: "Используйте serverUrl (не url). Максимум 50 инструментов одновременно",
    },
  ]
}

// --- Copy helper ---

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast("Скопировано", "success")
  } catch {
    showToast("Не удалось скопировать", "error")
  }
}

// --- URL field with copy ---

const UrlField: Component<{ url: string }> = (props) => {
  const tokenFromUrl = () => {
    const match = props.url.match(/token=(.+)$/)
    return match ? match[1] : ""
  }

  return (
    <div class="flex items-center border border-border-default mb-4">
      <span
        class="flex-1 truncate font-mono text-text-disabled text-xs"
        style={{ padding: "10px 14px" }}
      >
        {props.url}
      </span>
      <button
        onClick={() => copyToClipboard(tokenFromUrl())}
        class="shrink-0 font-mono text-text-tertiary border-l border-border-default bg-transparent cursor-pointer text-xs"
        style={{ padding: "10px 14px" }}
      >
        Скопировать токен
      </button>
      <button
        onClick={() => copyToClipboard(props.url)}
        class="shrink-0 font-mono text-text-tertiary border-l border-border-default bg-transparent cursor-pointer text-xs"
        style={{ padding: "10px 14px" }}
      >
        Скопировать ссылку
      </button>
    </div>
  )
}

// --- Client Icon ---

const ClientIcon: Component<{ bg: string; label: string; size?: number }> = (props) => (
  <div
    style={{
      width: `${props.size ?? 40}px`,
      height: `${props.size ?? 40}px`,
      background: props.bg,
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "flex-shrink": "0",
      "font-size": `${Math.round((props.size ?? 40) * 0.4)}px`,
      "font-weight": "700",
      color: "var(--color-white)",
      "font-family": "var(--font-sans)",
    }}
  >
    {props.label}
  </div>
)

// --- Component ---

interface ConnectionModalProps {
  open: boolean
  initialClient?: ClientId
  onClose: () => void
}

type ScreenState =
  | { screen: "select" }
  | { screen: "claude-sub" }
  | { screen: "instructions" }

const ConnectionModal: Component<ConnectionModalProps> = (props) => {
  const [screenState, setScreenState] = createSignal<ScreenState>(
    props.initialClient ? { screen: "instructions" } : { screen: "select" }
  )
  const [activeTab, setActiveTab] = createSignal<ClientId>(props.initialClient ?? "chatgpt")
  const [copied, setCopied] = createSignal(false)

  let modalRef: HTMLDivElement | undefined
  let previousFocus: Element | null = null

  // When modal opens: if initialClient is set, jump straight to instructions; otherwise selection screen
  createEffect(() => {
    if (props.open) {
      if (props.initialClient) {
        setActiveTab(props.initialClient)
        setScreenState({ screen: "instructions" })
      } else {
        setScreenState({ screen: "select" })
      }
    }
  })

  // Close on Escape + focus management
  createEffect(() => {
    if (!props.open) return
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

  const token = () => getToken() ?? "ВАШ_ТОКЕН"
  const clients = () => makeClients(token())
  const activeClient = () => clients().find((c) => c.id === activeTab()) ?? clients()[0]
  const mcpUrl = () => `${API_BASE}/sse?token=${token()}`

  const handleCopyConfig = async () => {
    const cfg = activeClient().config
    if (!cfg) return
    await copyToClipboard(cfg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCardClick = (card: SelectionCard) => {
    if (card.id === "claude") {
      setScreenState({ screen: "claude-sub" })
      return
    }
    if (card.id === "other") {
      // Default to chatgpt instructions for "other" — shows the URL prominently
      setActiveTab("chatgpt")
      setScreenState({ screen: "instructions" })
      return
    }
    setActiveTab(card.id as ClientId)
    setScreenState({ screen: "instructions" })
  }

  const handleSubChoice = (clientId: ClientId) => {
    setActiveTab(clientId)
    setScreenState({ screen: "instructions" })
  }

  const handleBack = () => {
    const s = screenState()
    if (s.screen === "claude-sub") {
      setScreenState({ screen: "select" })
    } else {
      setScreenState({ screen: "select" })
    }
  }

  const isOnSelect = () => screenState().screen === "select"
  const isOnClaudeSub = () => screenState().screen === "claude-sub"
  const isOnInstructions = () => screenState().screen === "instructions"

  // Header title varies by screen
  const headerTitle = () => {
    if (isOnSelect()) return "Подключение"
    if (isOnClaudeSub()) return "Claude"
    return "Подключение"
  }

  // Icon lookup for tab rendering
  const iconForClient = (id: ClientId): { bg: string; label: string } => {
    if (id === "chatgpt") return { bg: "#10A37F", label: "G" }
    if (id === "claude-web" || id === "claude-desktop") return { bg: "#CC785C", label: "C" }
    if (id === "perplexity") return { bg: "#20808D", label: "P" }
    if (id === "cursor") return { bg: "#7C3AED", label: "↗" }
    if (id === "antigravity") return { bg: "#4285F4", label: "A" }
    return { bg: "#808080", label: "?" }
  }

  return (
    <Show when={props.open}>
      {/* Overlay */}
      <div
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
        onClick={(e) => { if (e.target === e.currentTarget) props.onClose() }}
      >
        {/* Modal */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="connectionmodal-title"
          class="flex flex-col bg-bg-surface border border-border-default"
          style={{
            width: "min(560px, 95vw)",
            "max-height": "80vh",
            "margin-top": "-5vh",
            animation: "modalIn 120ms ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class="flex items-center justify-between shrink-0 bg-bg-canvas border-b border-border-default"
            style={{ height: "56px", padding: "0 24px" }}
          >
            <div class="flex items-center" style={{ gap: "12px" }}>
              {/* Back arrow — visible on claude-sub and instructions */}
              <Show when={!isOnSelect()}>
                <button
                  aria-label="назад"
                  onClick={handleBack}
                  class="text-text-tertiary bg-transparent border-none cursor-pointer p-0 flex items-center justify-center"
                  style={{ width: "28px", height: "28px" }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="10,3 5,8 10,13" />
                  </svg>
                </button>
              </Show>
              <span id="connectionmodal-title" class="text-black font-bold" style={{ "font-size": "16px" }}>
                {headerTitle()}
              </span>
            </div>
            <button
              aria-label="закрыть"
              onClick={props.onClose}
              class="text-text-tertiary bg-transparent border-none cursor-pointer flex items-center justify-center"
              style={{ width: "32px", height: "32px" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          </div>

          {/* === SCREEN 1: Selection === */}
          <Show when={isOnSelect()}>
            <div class="flex-1 overflow-y-auto" style={{ padding: "20px 24px 24px" }}>
              <p class="text-text-tertiary text-xs" style={{ "margin-bottom": "16px", "line-height": "1.4" }}>
                Какую нейросеть вы используете?
              </p>
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <For each={SELECTION_CARDS}>
                  {(card) => {
                    const icon = card.id === "other"
                      ? { bg: "#808080", label: "…" }
                      : card.id === "claude"
                        ? { bg: "#CC785C", label: "C" }
                        : (() => {
                            const m: Record<string, { bg: string; label: string }> = {
                              chatgpt: { bg: "#10A37F", label: "G" },
                              perplexity: { bg: "#20808D", label: "P" },
                              cursor: { bg: "#7C3AED", label: "↗" },
                            }
                            return m[card.id] ?? { bg: "#808080", label: "?" }
                          })()

                    return (
                      <button
                        onClick={() => handleCardClick(card)}
                        class="flex items-center text-left bg-bg-canvas border border-border-default cursor-pointer w-full"
                        style={{
                          gap: "16px",
                          padding: "16px",
                          transition: "border-color 80ms",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-default)" }}
                      >
                        <ClientIcon bg={icon.bg} label={icon.label} size={40} />
                        <div class="flex flex-col flex-1" style={{ gap: "3px", "min-width": "0" }}>
                          <div class="flex items-center" style={{ gap: "10px" }}>
                            <span class="text-black font-medium" style={{ "font-size": "16px" }}>
                              {card.label}
                            </span>
                            <Show when={card.id === "claude"}>
                              <span class="text-text-tertiary bg-bg-surface border border-border-default font-mono"
                                style={{
                                  "font-size": "10px",
                                  padding: "2px 6px", "letter-spacing": "0.04em",
                                }}>
                                2 варианта
                              </span>
                            </Show>
                          </div>
                          <span class="text-text-secondary text-xs">
                            {card.subtitle}
                          </span>
                          <span class="text-text-tertiary text-xs" style={{ "margin-top": "4px" }}>
                            {card.plan}
                          </span>
                        </div>
                        {/* Chevron */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="text-border-strong shrink-0">
                          <polyline points="6,3 11,8 6,13" />
                        </svg>
                      </button>
                    )
                  }}
                </For>
              </div>
            </div>
          </Show>

          {/* === SCREEN 1.5: Claude sub-choice === */}
          <Show when={isOnClaudeSub()}>
            <div class="flex-1 overflow-y-auto" style={{ padding: "20px 24px 24px" }}>
              <p class="text-text-tertiary text-xs" style={{ "margin-bottom": "16px", "line-height": "1.4" }}>
                Выберите способ использования Claude
              </p>
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <For each={CLAUDE_SUB_CHOICES}>
                  {(choice) => (
                    <button
                      onClick={() => handleSubChoice(choice.id)}
                      class="flex items-center text-left bg-bg-canvas border border-border-default cursor-pointer w-full"
                      style={{
                        gap: "16px",
                        padding: "16px",
                        transition: "border-color 80ms",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-default)" }}
                    >
                      <ClientIcon bg="#CC785C" label="C" size={40} />
                      <div class="flex flex-col flex-1" style={{ gap: "3px" }}>
                        <span class="text-black font-medium" style={{ "font-size": "16px" }}>
                          {choice.label}
                        </span>
                        <span class="text-text-secondary text-xs">
                          {choice.detail}
                        </span>
                        <span class="text-text-tertiary text-xs" style={{ "margin-top": "4px" }}>
                          {choice.plan}
                        </span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="text-border-strong shrink-0">
                        <polyline points="6,3 11,8 6,13" />
                      </svg>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* === SCREEN 2: Instructions === */}
          <Show when={isOnInstructions()}>
            {/* Tab Strip */}
            <div
              class="flex items-end shrink-0 bg-bg-canvas border-b border-border-default"
              style={{ height: "40px", "padding-left": "24px" }}
            >
              <For each={clients()}>
                {(client) => (
                  <button
                    onClick={() => setActiveTab(client.id)}
                    aria-label={`подключение через ${client.label}`}
                    class="font-mono bg-transparent border-none cursor-pointer text-xs"
                    style={{
                      padding: "0 16px",
                      height: "40px",
                      "font-weight": "500",
                      color: activeTab() === client.id ? "var(--color-black)" : "var(--color-text-tertiary)",
                      "border-bottom": activeTab() === client.id ? "2px solid var(--color-accent)" : "2px solid transparent",
                      transition: "color 80ms",
                    }}
                  >
                    {client.label}
                  </button>
                )}
              </For>
            </div>

            {/* Content (scrollable) */}
            <div class="flex-1 overflow-y-auto" style={{ padding: "28px 24px 24px" }}>
              {/* MCP URL */}
              <UrlField url={mcpUrl()} />

              {/* Steps */}
              <For each={activeClient().steps}>
                {(step, i) => (
                  <div class="flex" style={{ gap: "16px", "margin-bottom": "20px" }}>
                    <span class="font-mono text-accent font-bold shrink-0 text-xs"
                      style={{ width: "24px", "padding-top": "2px", "letter-spacing": "0.04em" }}>
                      {String(i() + 1).padStart(2, "0")}
                    </span>
                    <div class="flex flex-col" style={{ gap: "4px" }}>
                      <span class="text-black font-medium text-sm" style={{ "line-height": "1.3" }}>
                        {step.action}
                      </span>
                      <span class="text-text-tertiary text-xs" style={{ "line-height": "1.5" }}>
                        {step.detail}
                      </span>
                    </div>
                  </div>
                )}
              </For>

              {/* Config block */}
              <Show when={activeClient().config}>
                <div class="relative bg-bg-canvas border border-border-default mb-4">
                  <pre
                    class="font-mono text-text-secondary text-xs"
                    style={{
                      padding: "16px 14px 44px",
                      "line-height": "1.5", "white-space": "pre", "overflow-x": "auto",
                    }}
                  >
                    {activeClient().config}
                  </pre>
                  <button
                    onClick={handleCopyConfig}
                    class="font-mono absolute text-xs"
                    style={{
                      bottom: "8px", right: "8px",
                      padding: "6px 12px", "font-weight": "500",
                      color: copied() ? "var(--color-white)" : "var(--color-text-tertiary)",
                      background: copied() ? "var(--color-accent)" : "transparent",
                      border: `1px solid ${copied() ? "var(--color-accent)" : "var(--color-border-default)"}`,
                      cursor: "pointer", transition: "all 80ms",
                    }}
                  >
                    {copied() ? "Скопировано" : "Скопировать"}
                  </button>
                </div>
              </Show>

              {/* URL-only clients — show URL to paste */}
              <Show when={activeTab() === "chatgpt" || activeTab() === "claude-web" || activeTab() === "perplexity"}>
                <div class="bg-bg-canvas border border-border-default mb-4" style={{ padding: "16px" }}>
                  <span class="text-text-tertiary font-mono block mb-2 text-xs"
                    style={{ "text-transform": "uppercase", "letter-spacing": "0.08em" }}>
                    Ссылка для подключения
                  </span>
                  <span class="font-mono text-text-secondary text-xs" style={{ "word-break": "break-all" }}>
                    {mcpUrl()}
                  </span>
                </div>
              </Show>

              {/* Gotcha */}
              <div class="flex items-start" style={{ gap: "8px", "margin-top": "4px" }}>
                <span class="text-accent shrink-0 text-xs" style={{ "margin-top": "2px" }}>*</span>
                <span class="text-text-tertiary text-xs">
                  {activeClient().gotcha}
                </span>
              </div>

              {/* Divider */}
              <div class="border-t border-border-default" style={{ margin: "16px 0" }} />

              {/* Verify section */}
              <div class="flex items-center justify-between">
                <div class="flex items-center" style={{ gap: "8px" }}>
                  <span class="bg-border-default shrink-0" style={{ width: "8px", height: "8px" }} />
                  <span class="text-text-tertiary text-xs">
                    Спросите: «Какие документы загружены?»
                  </span>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Animation keyframe */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Show>
  )
}

export default ConnectionModal
