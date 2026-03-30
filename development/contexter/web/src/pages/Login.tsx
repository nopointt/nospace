import { createSignal, type Component } from "solid-js"
import { A, useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import Button from "../components/Button"
import Input from "../components/Input"
import { API_BASE } from "../lib/api"
import { setAuth } from "../lib/store"

const Login: Component = () => {
  const navigate = useNavigate()

  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")

  const handleSubmit = async () => {
    const e = email().trim()
    const p = password()

    if (!e) {
      setError("Укажите email")
      return
    }
    if (!p) {
      setError("Укажите пароль")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e, password: p }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || "Неверный email или пароль"
        )
      }

      const data = await res.json()

      // better-auth sets HttpOnly cookie — no token in response body
      // Store user info for UI, auth flows via cookie (credentials: "include")
      setAuth({
        userId: data.user?.id ?? "",
        name: data.user?.name,
        email: data.user?.email,
      })

      navigate("/app")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти — попробуйте ещё раз"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = `${API_BASE}/api/auth/google`
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div class="min-h-screen bg-bg-canvas flex flex-col">
      {/* Header */}
      <div class="w-full border-b border-border-subtle" style={{ height: "56px" }}>
        <div class="h-full flex items-center justify-center">
          <A href="/">
            <Logo size="md" />
          </A>
        </div>
      </div>

      {/* Form */}
      <div class="flex-1 flex items-start justify-center pt-16 md:pt-24 px-4">
        <div class="w-full max-w-[400px] flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
              Вход
            </h1>
            <p class="text-sm text-text-secondary">
              Войдите в аккаунт Contexter
            </p>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border-default bg-white hover:bg-interactive-hover transition-colors duration-[80ms] text-sm font-mono font-medium text-text-primary"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Войти через Google
          </button>

          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-border-default" />
            <span class="text-xs text-text-tertiary font-mono">или</span>
            <div class="flex-1 h-px bg-border-default" />
          </div>

          {/* Email / Password */}
          <div class="flex flex-col gap-4">
            <Input
              placeholder="Email"
              type="email"
              value={email()}
              onInput={setEmail}
              onKeyDown={handleKeyDown}
            />
            <Input
              placeholder="Пароль"
              type="password"
              value={password()}
              onInput={setPassword}
              onKeyDown={handleKeyDown}
              error={error()}
            />
          </div>

          <div class="flex flex-col gap-4">
            <Button
              variant="primary"
              type="submit"
              onClick={handleSubmit}
              loading={loading()}
              class="w-full"
            >
              Войти
            </Button>

            <div class="flex items-center justify-between">
              <A
                href="/forgot-password"
                class="text-xs text-text-tertiary hover:text-accent transition-colors duration-[80ms] font-mono"
              >
                Забыли пароль?
              </A>
              <A
                href="/register"
                class="text-xs text-accent hover:text-[#162f78] transition-colors duration-[80ms] font-mono"
              >
                Создать аккаунт
              </A>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
