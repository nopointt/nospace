import { createSignal, Show, type Component } from "solid-js"
import { A, useNavigate } from "@solidjs/router"
import Logo from "../components/Logo"
import Button from "../components/Button"
import Input from "../components/Input"
import { API_BASE } from "../lib/api"
import { setAuth } from "../lib/store"
import { t } from "../lib/i18n"

const Register: Component = () => {
  const navigate = useNavigate()

  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("")
  const [persona, setPersona] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [confirmPassword, setConfirmPassword] = createSignal("")
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal("")

  const validate = (): string | null => {
    if (!name().trim()) return t("register.nameRequired")
    if (!email().trim()) return t("register.emailRequired")
    if (!password()) return t("register.passwordRequired")
    if (password().length < 8) return t("register.passwordMinLength")
    if (password() !== confirmPassword()) return t("register.passwordMismatch")
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
          ...(persona() ? { persona_self_reported: persona() } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.message || data?.error || t("register.failed")
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
          : t("register.failedRetry")
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
              {t("register.title")}
            </h1>
            <p class="text-sm text-text-secondary">
              {t("register.subtitle")}
            </p>
          </div>

          {/* Fields */}
          <Show when={error()}>
            <p class="text-signal-error text-xs">{error()}</p>
          </Show>
          <div class="flex flex-col gap-4">
            <Input
              placeholder={t("register.name")}
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
            <div class="flex flex-col gap-2">
              <label class="text-sm text-text-secondary">{t("register.personaLabel")}</label>
              <select
                class="w-full h-10 px-4 text-sm bg-bg-canvas border border-border-default transition-colors duration-[80ms] outline-hidden"
                value={persona()}
                onChange={(e) => setPersona(e.currentTarget.value)}
              >
                <option value="">{t("register.personaPlaceholder")}</option>
                <option value="Разработчик / инженер">{t("register.personaOptions.developer")}</option>
                <option value="Исследователь / аналитик">{t("register.personaOptions.researcher")}</option>
                <option value="Писатель / контент-мейкер">{t("register.personaOptions.writer")}</option>
                <option value="Консультант / операции">{t("register.personaOptions.consultant")}</option>
                <option value="Другое">{t("register.personaOptions.other")}</option>
              </select>
            </div>
            <Input
              placeholder={t("register.password")}
              type="password"
              value={password()}
              onInput={setPassword}
              onKeyDown={handleKeyDown}
              autocomplete="new-password"
            />
            <Input
              placeholder={t("register.confirmPassword")}
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
              {t("register.submit")}
            </Button>

            <p class="text-[10px] text-text-tertiary leading-[1.5]">
              {t("register.agreePrefix")}
              <A href="/terms" class="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                {t("register.terms")}
              </A>
              {t("register.and")}
              <A href="/privacy" class="text-accent hover:text-accent-hover transition-colors duration-[80ms]">
                {t("register.privacy")}
              </A>
            </p>

            <div class="flex items-center justify-center">
              <span class="text-xs text-text-tertiary">
                {t("register.hasAccount")}
                <A
                  href="/login"
                  class="text-accent hover:text-accent-hover transition-colors duration-[80ms]"
                >
                  {t("register.login")}
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
