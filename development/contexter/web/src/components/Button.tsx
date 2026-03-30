import type { Component, JSX } from "solid-js"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

interface ButtonProps {
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: "button" | "submit"
  class?: string
  children: JSX.Element
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed",
  secondary:
    "bg-transparent text-black border border-black hover:bg-black hover:text-white active:bg-bg-pressed",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-interactive-hover active:bg-interactive-pressed",
  danger:
    "bg-signal-error text-white hover:bg-signal-error-hover active:bg-signal-error-pressed",
}

const Button: Component<ButtonProps> = (props) => {
  const variant = () => props.variant ?? "secondary"

  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
      class={`
        inline-flex items-center justify-center gap-2
        px-4 py-2 font-mono text-sm font-medium
        transition-colors duration-[80ms] ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant()]}
        ${props.class ?? ""}
      `}
    >
      {props.loading && (
        <span class="inline-block w-3 h-3 border-2 border-current border-t-transparent animate-spin" />
      )}
      {props.children}
    </button>
  )
}

export default Button
