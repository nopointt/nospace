import { A, useLocation, useNavigate } from "@solidjs/router"
import { Show, type Component } from "solid-js"
import Logo from "./Logo"
import Button from "./Button"
import { auth, isAuthenticated, setAuth } from "../lib/store"

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
            <A href="/" class={linkClass("/")}>
              Загрузить
            </A>
            <A href="/dashboard" class={linkClass("/dashboard")}>
              Документы
            </A>
            <A href="/api" class={linkClass("/api")}>
              Подключение
            </A>
            <Show when={isAuthenticated()}>
              <A href="/settings" class={linkClass("/settings")}>
                Настройки
              </A>
            </Show>
            <Show
              when={isAuthenticated()}
              fallback={
                <Button variant="primary" onClick={() => props.onLogin ? props.onLogin() : navigate("/")}>Войти</Button>
              }
            >
              <div class="flex items-center" style={{ gap: "12px" }}>
                <div
                  class="flex items-center justify-center shrink-0 bg-black text-white"
                  style={{
                    width: "28px",
                    height: "28px",
                    "font-size": "12px",
                    "font-weight": "700",
                  }}
                >
                  {userInitial()}
                </div>
                <button
                  onClick={handleLogout}
                  class="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
                >
                  Выход
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
