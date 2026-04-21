import type { Component, JSX, ParentProps } from "solid-js";

type ButtonVariant = "primary" | "danger" | "ghost" | "warning";
type ButtonSize = "sm" | "md" | "lg";

export const Button: Component<
  ParentProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    onClick?: (e: MouseEvent) => void;
    type?: "button" | "submit";
    disabled?: boolean;
    title?: string;
  }>
> = (props) => {
  const v = () => props.variant ?? "primary";
  const s = () => props.size ?? "md";
  const cls = () => {
    const variants: Record<ButtonVariant, string> = {
      primary:
        "bg-[var(--color-accent)] text-[var(--color-ink-on-accent)] hover:bg-[var(--color-accent-hover)]",
      danger:
        "bg-[var(--color-danger)] text-[var(--color-ink-on-accent)] hover:bg-[var(--color-red-hover)]",
      ghost:
        "bg-transparent text-[var(--color-ink-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-elevated)]",
      warning:
        "bg-[var(--color-warning)] text-[var(--color-ink-primary)] hover:bg-[var(--color-yellow-hover)]",
    };
    const sizes: Record<ButtonSize, string> = {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-2 text-sm",
      lg: "px-4 py-3 text-base",
    };
    return `inline-flex items-center justify-center gap-2 font-medium transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed ${variants[v()]} ${sizes[s()]}`;
  };
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled}
      title={props.title}
      onClick={props.onClick}
      class={cls()}
    >
      {props.children}
    </button>
  );
};

export const Card: Component<ParentProps<{ class?: string }>> = (props) => (
  <div
    class={`bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-e-low)] p-4 ${props.class ?? ""}`}
  >
    {props.children}
  </div>
);

export const Stat: Component<{
  label: string;
  value: JSX.Element;
  sub?: JSX.Element;
  class?: string;
}> = (props) => (
  <Card class={props.class}>
    <div class="text-xs text-[var(--color-ink-secondary)] uppercase tracking-wide mb-2">
      {props.label}
    </div>
    <div class="text-2xl font-bold text-[var(--color-ink-primary)] leading-tight tabular-nums">
      {props.value}
    </div>
    {props.sub !== undefined && (
      <div class="text-xs text-[var(--color-ink-tertiary)] mt-1">{props.sub}</div>
    )}
  </Card>
);

type PillTone = "info" | "success" | "warning" | "danger" | "neutral";

export const Pill: Component<ParentProps<{ tone?: PillTone }>> = (props) => {
  const tones: Record<PillTone, string> = {
    info: "bg-[var(--color-blue)]/10 text-[var(--color-blue)]",
    success: "bg-[var(--color-green)]/10 text-[var(--color-green)]",
    warning: "bg-[var(--color-yellow)]/20 text-[var(--color-ink-primary)]",
    danger: "bg-[var(--color-red)]/10 text-[var(--color-red)]",
    neutral: "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]",
  };
  return (
    <span
      class={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${tones[props.tone ?? "neutral"]}`}
    >
      {props.children}
    </span>
  );
};

export const Table: Component<ParentProps<{ class?: string }>> = (props) => (
  <div class={`overflow-x-auto ${props.class ?? ""}`}>
    <table class="w-full text-sm tabular-nums">
      {props.children}
    </table>
  </div>
);

export const Input: Component<{
  value?: string;
  placeholder?: string;
  type?: "text" | "password" | "number";
  onInput?: (e: InputEvent & { currentTarget: HTMLInputElement }) => void;
  class?: string;
  id?: string;
  required?: boolean;
}> = (props) => (
  <input
    id={props.id}
    type={props.type ?? "text"}
    value={props.value ?? ""}
    placeholder={props.placeholder}
    required={props.required}
    onInput={props.onInput}
    class={`w-full px-3 py-2 bg-[var(--color-canvas)] border border-[var(--color-border-default)] text-[var(--color-ink-primary)] focus:border-[var(--color-accent)] focus:outline-none ${props.class ?? ""}`}
  />
);
