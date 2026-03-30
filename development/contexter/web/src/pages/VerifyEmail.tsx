import { createSignal, onMount, Show, type Component } from "solid-js"
import { A, useSearchParams } from "@solidjs/router"
import Logo from "../components/Logo"
import { API_BASE } from "../lib/api"

const VerifyEmail: Component = () => {
  const [searchParams] = useSearchParams()

  const [status, setStatus] = createSignal<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = createSignal("")

  const token = () => searchParams.token ?? ""

  onMount(async () => {
    const t = token()
    if (!t) {
      setErrorMessage("Ссылка для подтверждения email недействительна")
      setStatus("error")
      return
    }

    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: t }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || "Не удалось подтвердить email"
        )
      }

      setStatus("success")
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Не удалось подтвердить email — попробуйте ещё раз"
      )
      setStatus("error")
    }
  })

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

      {/* Content */}
      <div class="flex-1 flex items-start justify-center pt-16 md:pt-24 px-4">
        <div class="w-full max-w-[400px] flex flex-col gap-6">
          {/* Loading */}
          <Show when={status() === "loading"}>
            <div class="flex flex-col items-center gap-4">
              <span class="inline-block w-5 h-5 border-2 border-accent border-t-transparent animate-spin" />
              <p class="text-sm text-text-secondary font-mono">
                Подтверждаем email...
              </p>
            </div>
          </Show>

          {/* Success */}
          <Show when={status() === "success"}>
            <div class="flex flex-col gap-4">
              <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                Email подтверждён
              </h1>
              <p class="text-sm text-text-secondary leading-[1.5]">
                Ваш email успешно подтверждён. Теперь вы можете пользоваться
                всеми функциями Contexter.
              </p>
              <div class="flex items-center gap-4 mt-2">
                <A
                  href="/login"
                  class="text-xs text-accent hover:text-accent-hover transition-colors duration-[80ms] font-mono"
                >
                  Войти в аккаунт
                </A>
                <A
                  href="/app"
                  class="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-[80ms] font-mono"
                >
                  Перейти в приложение
                </A>
              </div>
            </div>
          </Show>

          {/* Error */}
          <Show when={status() === "error"}>
            <div class="flex flex-col gap-4">
              <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
                Ошибка подтверждения
              </h1>
              <p class="text-sm text-signal-error leading-[1.5]">
                {errorMessage()}
              </p>
              <p class="text-sm text-text-secondary leading-[1.5]">
                Ссылка могла истечь. Войдите в аккаунт и запросите
                новое письмо для подтверждения.
              </p>
              <div class="flex items-center gap-4 mt-2">
                <A
                  href="/login"
                  class="text-xs text-accent hover:text-accent-hover transition-colors duration-[80ms] font-mono"
                >
                  Войти в аккаунт
                </A>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
