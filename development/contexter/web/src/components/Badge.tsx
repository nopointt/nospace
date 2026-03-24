import type { Component } from "solid-js"

type BadgeVariant = "processing" | "ready" | "error" | "pending"

interface BadgeProps {
  variant: BadgeVariant
  label?: string
}

const variantStyles: Record<BadgeVariant, { border: string; dot: string; text: string; label: string }> = {
  processing: {
    border: "border-accent",
    dot: "bg-accent animate-pulse",
    text: "text-accent",
    label: "обработка",
  },
  ready: {
    border: "border-signal-success",
    dot: "bg-signal-success",
    text: "text-signal-success",
    label: "готов",
  },
  error: {
    border: "border-signal-error",
    dot: "bg-signal-error",
    text: "text-signal-error",
    label: "ошибка",
  },
  pending: {
    border: "border-border-default",
    dot: "bg-text-tertiary",
    text: "text-text-tertiary",
    label: "ожидание",
  },
}

const Badge: Component<BadgeProps> = (props) => {
  const style = () => variantStyles[props.variant]

  return (
    <span
      class={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        border font-mono text-[10px] font-medium lowercase
        ${style().border} ${style().text}
      `}
    >
      <span class={`w-1.5 h-1.5 rounded-full ${style().dot}`} />
      {props.label ?? style().label}
    </span>
  )
}

export default Badge
