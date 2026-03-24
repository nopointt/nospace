import { A, useLocation, useNavigate } from "@solidjs/router"
import { Show, type Component } from "solid-js"
import Logo from "./Logo"
import Button from "./Button"
import { isAuthenticated, setAuth } from "../lib/store"

interface NavProps {
  variant?: "hero" | "app"
}

const Nav: Component<NavProps> = (props) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isHero = () => props.variant === "hero"

  const linkClass = (path: string) =>
    `font-mono text-[14px] lowercase transition-colors duration-[80ms] ${
      location.pathname === path
        ? "text-text-primary font-medium"
        : "text-text-tertiary hover:text-text-primary"
    }`

  const handleLogout = () => {
    setAuth(null)
    window.location.href = "/"
  }

  return (
    <nav
      class="sticky top-0 z-[100] w-full bg-white border-b border-border-subtle"
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
              отправить
            </A>
            <A href="/dashboard" class={linkClass("/dashboard")}>
              документы
            </A>
            <A href="/api" class={linkClass("/api")}>
              api
            </A>
            <A href="/settings" class={linkClass("/settings")}>
              подключение
            </A>
            <Show
              when={isAuthenticated()}
              fallback={
                <Button variant="primary" onClick={() => navigate("/")}>начать</Button>
              }
            >
              <button
                onClick={handleLogout}
                class="font-mono text-[14px] lowercase text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
              >
                выход
              </button>
            </Show>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Nav
