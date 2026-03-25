import { createSignal, createEffect, Show, For, type Component } from "solid-js"
import { showToast } from "./Toast"
import { getToken } from "../lib/store"

// --- Types ---

type ClientId = "chatgpt" | "claude-web" | "claude-desktop" | "perplexity" | "cursor"

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
  id: "chatgpt" | "claude" | "perplexity" | "cursor" | "other"
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
    subtitle: "самый популярный ии-чат",
    plan: "нужен Plus, Pro, Team или Enterprise план",
    iconBg: "#10A37F",
    iconLabel: "G",
  },
  {
    id: "claude",
    label: "Claude",
    subtitle: "от Anthropic",
    plan: "нужен Pro, Team или Enterprise план (или бесплатно через Desktop)",
    iconBg: "#CC785C",
    iconLabel: "C",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    subtitle: "поиск с ИИ",
    plan: "нужен платный план",
    iconBg: "#20808D",
    iconLabel: "P",
  },
  {
    id: "cursor",
    label: "Cursor",
    subtitle: "редактор кода",
    plan: "бесплатно",
    iconBg: "#7C3AED",
    iconLabel: "↗",
  },
  {
    id: "other",
    label: "другой клиент",
    subtitle: "любая программа с поддержкой MCP",
    plan: "зависит от клиента",
    iconBg: "#333333",
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
    detail: "в браузере",
    plan: "нужен Pro, Team или Enterprise план",
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    detail: "приложение",
    plan: "бесплатно, нужен Node.js",
  },
]

// --- Data ---

const API_BASE = "https://contexter.nopoint.workers.dev"

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
      gotcha: "нужна программа Node.js — скачайте на nodejs.org",
    },
    {
      id: "perplexity",
      label: "Perplexity",
      transport: "нативный",
      steps: [
        { action: "Settings → MCP Servers", detail: "Откройте perplexity.ai → Settings (⚙) → MCP Servers" },
        { action: "Add Server → вставьте URL", detail: "Нажмите Add Server. Имя: Contexter. URL: вставьте ссылку выше" },
        { action: "Спросите что-нибудь", detail: "В новом чате Perplexity спросите по вашим документам" },
      ],
      config: null,
      gotcha: "работает на платном плане Perplexity. бесплатный план — только для Mac",
    },
    {
      id: "cursor",
      label: "Cursor",
      transport: "нативный",
      steps: [
        { action: "Settings → MCP → Add new", detail: "Cursor Settings (Ctrl+Shift+J) → вкладка MCP → Add new MCP server" },
        { action: "тип подключения: через ссылку", detail: "или создайте файл ~/.cursor/mcp.json — вставьте JSON ниже" },
        { action: "Откройте чат (Ctrl+L)", detail: "Индикатор MCP-серверов появится в чате. Спросите по документам" },
      ],
      config: JSON.stringify({
        mcpServers: {
          contexter: { url },
        },
      }, null, 2),
      gotcha: "Cursor подключится автоматически",
    },
  ]
}

// --- Copy helper ---

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast("скопировано", "success")
  } catch {
    showToast("не удалось скопировать", "error")
  }
}

// --- URL field with copy ---

const UrlField: Component<{ url: string }> = (props) => (
  <div class="flex items-center" style={{ border: "1px solid #333333", "margin-bottom": "16px" }}>
    <span
      class="flex-1 truncate font-mono"
      style={{ padding: "10px 14px", "font-size": "12px", color: "#CCCCCC" }}
    >
      {props.url}
    </span>
    <button
      onClick={() => copyToClipboard(props.url)}
      class="shrink-0 font-mono"
      style={{
        padding: "10px 14px", "font-size": "11px", color: "#808080",
        "border-left": "1px solid #333333", background: "transparent", cursor: "pointer",
      }}
    >
      скопировать
    </button>
  </div>
)

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
      color: "#FFFFFF",
      "font-family": "Inter, sans-serif",
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

  // Close on Escape
  createEffect(() => {
    if (!props.open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") props.onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
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
    if (isOnSelect()) return "подключение"
    if (isOnClaudeSub()) return "Claude"
    return "подключение"
  }

  // Icon lookup for tab rendering
  const iconForClient = (id: ClientId): { bg: string; label: string } => {
    if (id === "chatgpt") return { bg: "#10A37F", label: "G" }
    if (id === "claude-web" || id === "claude-desktop") return { bg: "#CC785C", label: "C" }
    if (id === "perplexity") return { bg: "#20808D", label: "P" }
    if (id === "cursor") return { bg: "#7C3AED", label: "↗" }
    return { bg: "#333333", label: "?" }
  }

  return (
    <Show when={props.open}>
      {/* Overlay */}
      <div
        class="fixed inset-0 z-[200] flex items-center justify-center"
        style={{ background: "rgba(10, 10, 10, 0.72)" }}
        onClick={(e) => { if (e.target === e.currentTarget) props.onClose() }}
      >
        {/* Modal */}
        <div
          class="flex flex-col"
          style={{
            width: "560px",
            "max-height": "80vh",
            background: "#141414",
            border: "1px solid #333333",
            "margin-top": "-5vh",
            animation: "modalIn 120ms ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            class="flex items-center justify-between shrink-0"
            style={{ height: "56px", padding: "0 24px", background: "#0A0A0A", "border-bottom": "1px solid #333333" }}
          >
            <div class="flex items-center" style={{ gap: "12px" }}>
              {/* Back arrow — visible on claude-sub and instructions */}
              <Show when={!isOnSelect()}>
                <button
                  aria-label="назад"
                  onClick={handleBack}
                  style={{
                    width: "28px", height: "28px", display: "flex", "align-items": "center",
                    "justify-content": "center", background: "transparent", border: "none",
                    cursor: "pointer", color: "#808080", padding: "0",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="10,3 5,8 10,13" />
                  </svg>
                </button>
              </Show>
              <span style={{ "font-size": "16px", "font-weight": "600", color: "#FAFAFA" }}>
                {headerTitle()}
              </span>
            </div>
            <button
              aria-label="закрыть"
              onClick={props.onClose}
              style={{
                width: "32px", height: "32px", display: "flex", "align-items": "center", "justify-content": "center",
                background: "transparent", border: "none", cursor: "pointer", color: "#808080",
              }}
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
              <p style={{ "font-size": "13px", color: "#808080", "margin-bottom": "16px", "line-height": "1.4" }}>
                какую нейросеть вы используете?
              </p>
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <For each={SELECTION_CARDS}>
                  {(card) => {
                    const icon = card.id === "other"
                      ? { bg: "#333333", label: "…" }
                      : card.id === "claude"
                        ? { bg: "#CC785C", label: "C" }
                        : (() => {
                            const m: Record<string, { bg: string; label: string }> = {
                              chatgpt: { bg: "#10A37F", label: "G" },
                              perplexity: { bg: "#20808D", label: "P" },
                              cursor: { bg: "#7C3AED", label: "↗" },
                            }
                            return m[card.id] ?? { bg: "#333333", label: "?" }
                          })()

                    return (
                      <button
                        onClick={() => handleCardClick(card)}
                        class="flex items-center text-left"
                        style={{
                          gap: "16px",
                          padding: "16px",
                          background: "#0A0A0A",
                          border: "1px solid #333333",
                          cursor: "pointer",
                          transition: "border-color 80ms",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E3EA0" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333333" }}
                      >
                        <ClientIcon bg={icon.bg} label={icon.label} size={40} />
                        <div class="flex flex-col flex-1" style={{ gap: "3px", "min-width": "0" }}>
                          <div class="flex items-center" style={{ gap: "10px" }}>
                            <span style={{ "font-size": "16px", "font-weight": "600", color: "#FAFAFA", "font-family": "Inter, sans-serif" }}>
                              {card.label}
                            </span>
                            <Show when={card.id === "claude"}>
                              <span style={{
                                "font-size": "10px", "font-weight": "500", color: "#808080",
                                background: "#1A1A1A", border: "1px solid #333333",
                                padding: "2px 6px", "letter-spacing": "0.04em",
                                "font-family": "Inter, sans-serif",
                              }}>
                                2 варианта
                              </span>
                            </Show>
                          </div>
                          <span style={{ "font-size": "13px", color: "#666666", "font-family": "Inter, sans-serif" }}>
                            {card.subtitle}
                          </span>
                          <span style={{ "font-size": "11px", color: "#4A4A4A", "margin-top": "4px", "font-family": "Inter, sans-serif" }}>
                            {card.plan}
                          </span>
                        </div>
                        {/* Chevron */}
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4A4A4A" stroke-width="1.5" style={{ "flex-shrink": "0" }}>
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
              <p style={{ "font-size": "13px", color: "#808080", "margin-bottom": "16px", "line-height": "1.4" }}>
                выберите способ использования Claude
              </p>
              <div class="flex flex-col" style={{ gap: "8px" }}>
                <For each={CLAUDE_SUB_CHOICES}>
                  {(choice) => (
                    <button
                      onClick={() => handleSubChoice(choice.id)}
                      class="flex items-center text-left"
                      style={{
                        gap: "16px",
                        padding: "16px",
                        background: "#0A0A0A",
                        border: "1px solid #333333",
                        cursor: "pointer",
                        transition: "border-color 80ms",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1E3EA0" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#333333" }}
                    >
                      <ClientIcon bg="#CC785C" label="C" size={40} />
                      <div class="flex flex-col flex-1" style={{ gap: "3px" }}>
                        <span style={{ "font-size": "16px", "font-weight": "600", color: "#FAFAFA", "font-family": "Inter, sans-serif" }}>
                          {choice.label}
                        </span>
                        <span style={{ "font-size": "13px", color: "#666666", "font-family": "Inter, sans-serif" }}>
                          {choice.detail}
                        </span>
                        <span style={{ "font-size": "11px", color: "#4A4A4A", "margin-top": "4px", "font-family": "Inter, sans-serif" }}>
                          {choice.plan}
                        </span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4A4A4A" stroke-width="1.5" style={{ "flex-shrink": "0" }}>
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
              class="flex items-end shrink-0"
              style={{ height: "40px", background: "#0A0A0A", "border-bottom": "1px solid #333333", "padding-left": "24px" }}
            >
              <For each={clients()}>
                {(client) => (
                  <button
                    onClick={() => setActiveTab(client.id)}
                    aria-label={`подключение через ${client.label}`}
                    class="font-mono"
                    style={{
                      padding: "0 16px",
                      height: "40px",
                      "font-size": "12px",
                      "font-weight": "500",
                      color: activeTab() === client.id ? "#FAFAFA" : "#808080",
                      background: "transparent",
                      border: "none",
                      "border-bottom": activeTab() === client.id ? "2px solid #1E3EA0" : "2px solid transparent",
                      cursor: "pointer",
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
                    <span style={{
                      width: "24px", "flex-shrink": "0", "padding-top": "2px",
                      "font-size": "11px", "font-weight": "700", color: "#1E3EA0", "letter-spacing": "0.04em",
                    }}>
                      {String(i() + 1).padStart(2, "0")}
                    </span>
                    <div class="flex flex-col" style={{ gap: "4px" }}>
                      <span style={{ "font-size": "15px", "font-weight": "500", color: "#FAFAFA", "line-height": "1.3" }}>
                        {step.action}
                      </span>
                      <span style={{ "font-size": "13px", color: "#808080", "line-height": "1.5" }}>
                        {step.detail}
                      </span>
                    </div>
                  </div>
                )}
              </For>

              {/* Config block */}
              <Show when={activeClient().config}>
                <div style={{ position: "relative", background: "#0A0A0A", border: "1px solid #333333", "margin-bottom": "16px" }}>
                  <pre
                    class="font-mono"
                    style={{
                      padding: "16px 14px 44px", "font-size": "12px", color: "#CCCCCC",
                      "line-height": "1.5", "white-space": "pre", "overflow-x": "auto",
                    }}
                  >
                    {activeClient().config}
                  </pre>
                  <button
                    onClick={handleCopyConfig}
                    class="font-mono"
                    style={{
                      position: "absolute", bottom: "8px", right: "8px",
                      padding: "6px 12px", "font-size": "12px", "font-weight": "600",
                      color: copied() ? "#FAFAFA" : "#808080",
                      background: copied() ? "#1E3EA0" : "transparent",
                      border: `1px solid ${copied() ? "#1E3EA0" : "#333333"}`,
                      cursor: "pointer", transition: "all 80ms",
                    }}
                  >
                    {copied() ? "скопировано" : "скопировать"}
                  </button>
                </div>
              </Show>

              {/* URL-only clients — show URL to paste */}
              <Show when={activeTab() === "chatgpt" || activeTab() === "claude-web" || activeTab() === "perplexity"}>
                <div style={{ background: "#0A0A0A", border: "1px solid #333333", padding: "16px", "margin-bottom": "16px" }}>
                  <span style={{ "font-size": "11px", color: "#808080", "text-transform": "uppercase", "letter-spacing": "0.08em", display: "block", "margin-bottom": "8px" }}>
                    ссылка для подключения
                  </span>
                  <span class="font-mono" style={{ "font-size": "12px", color: "#CCCCCC", "word-break": "break-all" }}>
                    {mcpUrl()}
                  </span>
                </div>
              </Show>

              {/* Gotcha */}
              <div class="flex items-start" style={{ gap: "8px", "margin-top": "4px" }}>
                <span style={{ color: "#1E3EA0", "font-size": "11px", "flex-shrink": "0", "margin-top": "2px" }}>*</span>
                <span style={{ "font-size": "12px", color: "#808080" }}>
                  {activeClient().gotcha}
                </span>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "#333333", margin: "16px 0" }} />

              {/* Verify section */}
              <div class="flex items-center justify-between">
                <div class="flex items-center" style={{ gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", background: "#333333", "flex-shrink": "0" }} />
                  <span style={{ "font-size": "12px", color: "#808080" }}>
                    спросите: «какие документы загружены?»
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
