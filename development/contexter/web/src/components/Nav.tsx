import { A, useLocation, useNavigate } from "@solidjs/router"
import { createResource, Show, type Component } from "solid-js"
import Logo from "./Logo"
import Button from "./Button"
import { auth, isAuthenticated, setAuth } from "../lib/store"
import { getSupporterMe } from "../lib/api"
import { t, lang, toggleLang } from "../lib/i18n"

interface NavProps {
  variant?: "hero" | "app"
  onLogin?: () => void
}

const Nav: Component<NavProps> = (props) => {
  const location = useLocation()
  const navigate = useNavigate()

  const linkClass = (path: string) =>
    `text-[14px] tracking-wide transition-colors duration-[80ms] ${
      location.pathname === path
        ? "text-text-primary font-medium"
        : "text-text-tertiary hover:text-text-primary"
    }`

  const handleLogout = () => {
    setAuth(null)
    window.location.href = "/"
  }

  const userInitial = () => {
    const a = auth()
    if (a?.name) return a.name[0].toUpperCase()
    if (a?.userId) return a.userId[0].toUpperCase()
    return "U"
  }

  // Supporter status fetch — gated on auth. When unauthed, source is false
  // and createResource does not fetch. Errors are swallowed silently — Nav is
  // core UX and must not flash or break for supplementary info.
  const [supporter] = createResource(
    () => (isAuthenticated() ? true : null),
    async () => {
      try {
        return await getSupporterMe()
      } catch {
        return null
      }
    },
  )

  const supporterBadgeLabel = () => {
    const s = supporter()
    if (!s || s === null || s.isSupporter !== true) return null
    if (s.rank === null) return t("supporters.nav.badge")
    return `${t("supporters.nav.badge")} #${s.rank}`
  }

  return (
    <nav
      class="sticky top-0 z-[100] w-full bg-bg-canvas border-b border-border-subtle"
      style={{ height: "56px" }}
    >
      <div
        class="w-full h-full flex items-center justify-between"
        style={{ "padding-left": "64px", "padding-right": "64px" }}
      >
        <A href="/" class="flex items-center">
          <Logo size="md" />
        </A>

        <div class="flex items-center gap-6">
          <div class="flex items-center" style={{ gap: "32px" }}>
            <A href="/app" class={linkClass("/app")}>
              {t("nav.upload")}
            </A>
            <A href="/dashboard" class={linkClass("/dashboard")}>
              {t("nav.documents")}
            </A>
            <A href="/api" class={linkClass("/api")}>
              {t("nav.connection")}
            </A>
            <Show when={isAuthenticated()}>
              <A href="/settings" class={linkClass("/settings")}>
                {t("nav.settings")}
              </A>
            </Show>
            <a
              href="https://t.me/nopointsovereign"
              target="_blank"
              rel="noopener"
              class="text-[14px] text-accent hover:text-accent-hover transition-colors duration-[80ms]"
            >
              {t("landing.nav.contact")}
            </a>
            <button
              onClick={toggleLang}
              class="text-[12px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms] bg-transparent border border-border-subtle px-2 py-0.5 cursor-pointer"
            >
              {lang() === "en" ? "RU" : "EN"}
            </button>
            <Show
              when={isAuthenticated()}
              fallback={
                <Button variant="primary" onClick={() => props.onLogin ? props.onLogin() : navigate("/")}>
                  {t("nav.login")}
                </Button>
              }
            >
              <div class="flex items-center" style={{ gap: "12px" }}>
                <Show when={supporterBadgeLabel()}>
                  <span
                    class="inline-flex items-center px-2 py-0.5 border border-accent text-accent text-[10px] font-medium font-mono uppercase tracking-[0.08em]"
                  >
                    {supporterBadgeLabel()}
                  </span>
                </Show>
                <div
                  class="flex items-center justify-center shrink-0 bg-black text-white w-7 h-7 text-xs font-bold"
                >
                  {userInitial()}
                </div>
                <button
                  onClick={handleLogout}
                  class="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
                >
                  {t("nav.logout")}
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Nav
