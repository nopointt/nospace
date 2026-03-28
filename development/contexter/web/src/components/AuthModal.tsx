import { createSignal, Show, onMount, type Component } from "solid-js"
import Button from "./Button"
import Input from "./Input"
import { register } from "../lib/api"
import { setAuth } from "../lib/store"
import { API_BASE } from "../lib/api"

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const AuthModal: Component<AuthModalProps> = (props) => {
  const [email, setEmail] = createSignal("")
  const [name, setName] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")
  const [step, setStep] = createSignal<"social" | "email" | "done">("social")
  const [found, setFound] = createSignal(false)

  const handleEmailSubmit = async () => {
    if (!email().trim()) {
      setError("Укажите email")
      return
    }
    setError("")
    setLoading(true)
    try {
      const result = await register(name() || undefined, email())
      setAuth({
        userId: result.userId,
        apiToken: result.apiToken,
        mcpUrl: result.mcpUrl,
        name: name(),
        email: email(),
      })
      setFound(!!(result as any).note)
      setStep("done")
      setTimeout(() => {
        props.onSuccess()
        props.onClose()
      }, 1500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg.includes("{")) {
        setError("Не удалось создать аккаунт — попробуйте ещё раз")
      } else {
        setError(msg || "Не удалось создать аккаунт — попробуйте ещё раз")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = `${API_BASE}/api/auth/google`
  }

  let telegramContainer: HTMLDivElement | undefined

  const handleTelegram = () => {
    // Load Telegram Login Widget script
    if (!telegramContainer) return
    telegramContainer.innerHTML = ""
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.setAttribute("data-telegram-login", "contexterrbot")
    script.setAttribute("data-size", "large")
    script.setAttribute("data-radius", "0")
    script.setAttribute("data-auth-url", `${API_BASE}/api/auth/telegram-redirect`)
    script.setAttribute("data-request-access", "write")
    script.async = true
    telegramContainer.appendChild(script)
  }

  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-[300] flex items-center justify-center bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) props.onClose()
        }}
      >
        <div class="bg-bg-canvas border border-border-default p-8 w-full max-w-sm flex flex-col gap-6">
          {/* Done state */}
          <Show when={step() === "done"}>
            <p class="text-sm text-signal-success">
              {found() ? "Аккаунт найден. Перенаправление..." : "Аккаунт создан. Перенаправление..."}
            </p>
          </Show>

          {/* Social login buttons */}
          <Show when={step() === "social"}>
            <div class="flex flex-col gap-3">
              <h2 class="text-[20px] font-medium text-black leading-[1.2]">
                Войти
              </h2>
              <p class="text-sm text-text-secondary">
                Ваши файлы сохранятся, и нейросеть сможет их читать
              </p>
            </div>

            <div class="flex flex-col gap-3">
              {/* Google */}
              <button
                onClick={handleGoogle}
                class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border-default bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-black"
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <div class="flex items-center gap-3 text-text-secondary text-xs">
                <div class="flex-1 h-px bg-border-default" />
                или
                <div class="flex-1 h-px bg-border-default" />
              </div>

              {/* Email fallback */}
              <button
                onClick={() => setStep("email")}
                class="w-full px-4 py-2.5 text-sm text-text-secondary hover:text-black transition-colors"
              >
                Войти через email
              </button>
            </div>
          </Show>

          {/* Email form (fallback) */}
          <Show when={step() === "email"}>
            <div class="flex flex-col gap-3">
              <button
                onClick={() => setStep("social")}
                class="text-xs text-text-secondary hover:text-black self-start"
              >
                ← Назад
              </button>
              <h2 class="text-[20px] font-medium text-black leading-[1.2]">
                Создайте аккаунт
              </h2>
            </div>

            <div class="flex flex-col gap-4">
              <Input
                placeholder="Email"
                type="email"
                value={email()}
                onInput={setEmail}
                error={error()}
              />
              <Input
                placeholder="Имя (необязательно)"
                value={name()}
                onInput={setName}
              />
            </div>

            <Button
              variant="primary"
              onClick={handleEmailSubmit}
              loading={loading()}
              class="w-full"
            >
              Продолжить
            </Button>
          </Show>
        </div>
      </div>
    </Show>
  )
}

export default AuthModal
