import { createSignal, Show, type Component } from "solid-js"
import { A, useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import Button from "../components/Button"
import Input from "../components/Input"
import { API_BASE } from "../lib/api"
import { setAuth } from "../lib/store"

const Register: Component = () => {
  const navigate = useNavigate()

  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")

  const validate = (): string | null => {
    if (!name().trim()) return "Укажите имя"
    if (!email().trim()) return "Укажите email"
    if (!password()) return "Укажите пароль"
    if (password().length < 8) return "Пароль должен быть не менее 8 символов"
    if (password() !== confirmPassword()) return "Пароли не совпадают"
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name().trim(),
          email: email().trim(),
          password: password(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || "Не удалось создать аккаунт"
        )
      }

      const data = await res.json()

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
          : "Не удалось создать аккаунт — попробуйте ещё раз"
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
          <div class="flex flex-col gap-2">
            <h1 class="text-[24px] font-bold text-text-primary leading-[1.2]">
              Регистрация
            </h1>
            <p class="text-sm text-text-secondary">
              Создайте аккаунт Contexter
            </p>
          </div>

          {/* Fields */}
          <Show when={error()}>
            <p class="text-signal-error text-xs font-mono">{error()}</p>
          </Show>
          <div class="flex flex-col gap-4">
            <Input
              placeholder="Имя"
              value={name()}
              onInput={setName}
              onKeyDown={handleKeyDown}
              autocomplete="name"
            />
            <Input
              placeholder="Email"
              type="email"
              value={email()}
              onInput={setEmail}
              onKeyDown={handleKeyDown}
              autocomplete="email"
            />
            <Input
              placeholder="Пароль"
              type="password"
              value={password()}
              onInput={setPassword}
              onKeyDown={handleKeyDown}
              autocomplete="new-password"
            />
            <Input
              placeholder="Подтвердите пароль"
              type="password"
              value={confirmPassword()}
              onInput={setConfirmPassword}
              onKeyDown={handleKeyDown}
              autocomplete="new-password"
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
              Создать аккаунт
            </Button>

            <p class="text-[10px] text-text-tertiary font-mono leading-[1.5]">
              Нажимая «Создать аккаунт», вы соглашаетесь с{" "}
              <A href="/terms" class="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                Условиями использования
              </A>{" "}
              и{" "}
              <A href="/privacy" class="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                Политикой конфиденциальности
              </A>
            </p>

            <div class="flex items-center justify-center">
              <span class="text-xs text-text-tertiary font-mono">
                Уже есть аккаунт?{" "}
                <A
                  href="/login"
                  class="text-accent hover:text-accent-hover transition-colors duration-[80ms]"
                >
                  Войти
                </A>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
