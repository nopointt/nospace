import { createSignal, Show, type Component } from "solid-js"
import { A } from "@solidjs/router"
import Logo from "../components/Logo"
import Button from "../components/Button"
import Input from "../components/Input"
import { API_BASE } from "../lib/api"

const ForgotPassword: Component = () => {
  const [email, setEmail] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")
  const [sent, setSent] = createSignal(false)

  const handleSubmit = async () => {
    const e = email().trim()
    if (!e) {
      setError("Укажите email")
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/forget-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e, redirectTo: `${window.location.origin}/reset-password` }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || "Не удалось отправить письмо"
        )
      }

      setSent(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось отправить письмо — попробуйте ещё раз"
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
            when={!sent()}
            fallback={
              /* Success state */
              <div class="flex flex-col gap-4">
                <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                  Письмо отправлено
                </h1>
                <p class="text-sm text-text-secondary leading-[1.6]">
                  Мы отправили ссылку для сброса пароля на{" "}
                  <span class="font-mono text-text-primary">{email()}</span>.
                  Проверьте почту и перейдите по ссылке.
                </p>
                <div class="flex items-center gap-4 mt-4">
                  <A
                    href="/login"
                    class="text-xs text-accent hover:text-accent-hover transition-colors duration-[80ms] font-mono"
                  >
                    Вернуться ко входу
                  </A>
                </div>
              </div>
            }
          >
            {/* Form state */}
            <div class="flex flex-col gap-2">
              <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                Сброс пароля
              </h1>
              <p class="text-sm text-text-secondary">
                Введите email, и мы отправим ссылку для сброса пароля
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <Input
                placeholder="Email"
                type="email"
                value={email()}
                onInput={setEmail}
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
                Отправить ссылку
              </Button>

              <div class="flex items-center justify-center">
                <A
                  href="/login"
                  class="text-xs text-text-tertiary hover:text-accent transition-colors duration-[80ms] font-mono"
                >
                  Вернуться ко входу
                </A>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
