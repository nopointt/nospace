import { createSignal, Show, type Component } from "solid-js"
import { A, useSearchParams, useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import Button from "../components/Button"
import Input from "../components/Input"
import { API_BASE } from "../lib/api"

const ResetPassword: Component = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [password, setPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")
  const [success, setSuccess] = createSignal(false)

  const token = () => searchParams.token ?? ""

  const handleSubmit = async () => {
    const t = token()
    if (!t) {
      setError("Ссылка для сброса пароля недействительна")
      return
    }
    if (!password()) {
      setError("Укажите новый пароль")
      return
    }
    if (password().length < 8) {
      setError("Пароль должен быть не менее 8 символов")
      return
    }
    if (password() !== confirmPassword()) {
      setError("Пароли не совпадают")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: t, newPassword: password() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || "Не удалось сбросить пароль"
        )
      }

      setSuccess(true)
      setTimeout(() => navigate("/login"), 3000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось сбросить пароль — попробуйте ещё раз"
      )
    } finally {
      setLoading(false)
    }
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
          <Show
            when={!success()}
            fallback={
              /* Success state */
              <div class="flex flex-col gap-4">
                <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                  Пароль обновлён
                </h1>
                <p class="text-sm text-text-secondary leading-[1.6]">
                  Ваш пароль успешно изменён. Перенаправление на страницу входа...
                </p>
                <A
                  href="/login"
                  class="text-xs text-accent hover:text-accent-hover transition-colors duration-[80ms] font-mono mt-2"
                >
                  Войти сейчас
                </A>
              </div>
            }
          >
            <Show
              when={token()}
              fallback={
                /* No token state */
                <div class="flex flex-col gap-4">
                  <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                    Недействительная ссылка
                  </h1>
                  <p class="text-sm text-text-secondary leading-[1.6]">
                    Ссылка для сброса пароля отсутствует или истекла.
                    Запросите новую ссылку.
                  </p>
                  <A
                    href="/forgot-password"
                    class="text-xs text-accent hover:text-accent-hover transition-colors duration-[80ms] font-mono mt-2"
                  >
                    Запросить новую ссылку
                  </A>
                </div>
              }
            >
              {/* Form state */}
              <div class="flex flex-col gap-2">
                <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                  Новый пароль
                </h1>
                <p class="text-sm text-text-secondary">
                  Придумайте новый пароль для вашего аккаунта
                </p>
              </div>

              <div class="flex flex-col gap-4">
                <Input
                  placeholder="Новый пароль"
                  type="password"
                  value={password()}
                  onInput={setPassword}
                  onKeyDown={handleKeyDown}
                />
                <Input
                  placeholder="Подтвердите пароль"
                  type="password"
                  value={confirmPassword()}
                  onInput={setConfirmPassword}
                  onKeyDown={handleKeyDown}
                  error={error()}
                />
              </div>

              <Button
                variant="primary"
                type="submit"
                onClick={handleSubmit}
                loading={loading()}
                class="w-full"
              >
                Сохранить пароль
              </Button>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
