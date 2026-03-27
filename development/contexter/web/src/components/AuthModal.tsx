import { createSignal, Show, type Component } from "solid-js"
import Button from "./Button"
import Input from "./Input"
import { register } from "../lib/api"
import { setAuth } from "../lib/store"

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
  const [step, setStep] = createSignal<"form" | "done">("form")

  const [found, setFound] = createSignal(false)

  const handleSubmit = async () => {
    if (!email().trim()) {
      setError("укажите email")
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
        setError("не удалось создать аккаунт — попробуйте ещё раз")
      } else {
        setError(msg || "не удалось создать аккаунт — попробуйте ещё раз")
      }
    } finally {
      setLoading(false)
    }
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
          <div class="flex flex-col gap-3">
            <Show
              when={step() === "form"}
              fallback={
                <p class="text-sm text-signal-success">
                  {found() ? "аккаунт найден. перенаправление..." : "аккаунт создан. перенаправление..."}
                </p>
              }
            >
              <h2 class="text-[20px] font-medium text-black leading-[1.2]">
                создайте аккаунт
              </h2>
              <p class="text-sm text-text-secondary">
                ваши файлы сохранятся, и нейросеть сможет их читать
              </p>
            </Show>
          </div>

          <Show when={step() === "form"}>
            <div class="flex flex-col gap-4">
              <Input
                placeholder="email"
                type="email"
                value={email()}
                onInput={setEmail}
                error={error()}
              />
              <Input
                placeholder="имя (необязательно)"
                value={name()}
                onInput={setName}
              />
            </div>

            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading()}
              class="w-full"
            >
              продолжить
            </Button>
          </Show>
        </div>
      </div>
    </Show>
  )
}

export default AuthModal
