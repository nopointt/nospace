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

  const handleSubmit = async () => {
    setError("")
    setLoading(true)
    try {
      const result = await register(name() || undefined, email() || undefined)
      setAuth({
        userId: result.userId,
        apiToken: result.apiToken,
        mcpUrl: result.mcpUrl,
        name: name(),
        email: email(),
      })
      setStep("done")
      setTimeout(() => {
        props.onSuccess()
        props.onClose()
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "ошибка регистрации")
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
        <div class="bg-white border border-border-default p-8 w-full max-w-sm flex flex-col gap-6 font-mono">
          <div class="flex flex-col gap-3">
            <Show
              when={step() === "form"}
              fallback={
                <p class="text-sm text-signal-success">
                  аккаунт создан. перенаправление...
                </p>
              }
            >
              <h2 class="text-[20px] font-medium text-black leading-[1.2]">
                создайте аккаунт
              </h2>
              <p class="text-sm text-text-secondary">
                чтобы сохранить загруженные файлы и дать доступ, создайте аккаунт
              </p>
            </Show>
          </div>

          <Show when={step() === "form"}>
            <div class="flex flex-col gap-4">
              <Input
                placeholder="email (необязательно)"
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
