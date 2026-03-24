import { createSignal, Show, type Component } from "solid-js"

interface ToastData {
  message: string
  variant: "info" | "success" | "error" | "warning"
}

const [toast, setToast] = createSignal<ToastData | null>(null)
let timeout: ReturnType<typeof setTimeout>

export function showToast(message: string, variant: ToastData["variant"] = "info", duration = 3000) {
  clearTimeout(timeout)
  setToast({ message, variant })
  timeout = setTimeout(() => setToast(null), duration)
}

const variantStyles = {
  info: "border-accent text-accent",
  success: "border-signal-success text-signal-success",
  error: "border-signal-error text-signal-error",
  warning: "border-signal-warning text-text-primary bg-signal-warning/10",
}

const Toast: Component = () => {
  return (
    <Show when={toast()}>
      {(t) => (
        <div
          class={`
            fixed bottom-6 right-6 z-[400]
            flex items-center gap-2 px-4 py-3
            bg-white border font-mono text-xs
            transition-all duration-[250ms] ease-out
            ${variantStyles[t().variant]}
          `}
        >
          <span class={`w-1.5 h-1.5 rounded-full ${
            t().variant === "info" ? "bg-accent" :
            t().variant === "success" ? "bg-signal-success" :
            t().variant === "error" ? "bg-signal-error" :
            "bg-signal-warning"
          }`} />
          {t().message}
        </div>
      )}
    </Show>
  )
}

export default Toast
