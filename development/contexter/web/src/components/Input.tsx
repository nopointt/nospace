import type { Component, JSX } from "solid-js"

interface InputProps {
  value?: string
  placeholder?: string
  onInput?: (value: string) => void
  onKeyDown?: (e: KeyboardEvent) => void
  type?: string
  disabled?: boolean
  error?: string
  class?: string
  ref?: (el: HTMLInputElement) => void
}

const Input: Component<InputProps> = (props) => {
  return (
    <div class={`flex flex-col gap-1 ${props.class ?? ""}`}>
      <input
        ref={props.ref}
        type={props.type ?? "text"}
        value={props.value ?? ""}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onInput={(e) => props.onInput?.(e.currentTarget.value)}
        onKeyDown={(e) => props.onKeyDown?.(e)}
        class={`
          w-full h-10 px-4 font-mono text-sm
          bg-white border transition-colors duration-[80ms]
          placeholder:text-text-disabled
          disabled:opacity-40 disabled:cursor-not-allowed
          ${props.error
            ? "border-signal-error focus:border-signal-error"
            : "border-border-default focus:border-accent focus:border-2"
          }
          outline-none
        `}
      />
      {props.error && (
        <span class="text-[10px] font-mono text-signal-error">{props.error}</span>
      )}
    </div>
  )
}

export default Input
