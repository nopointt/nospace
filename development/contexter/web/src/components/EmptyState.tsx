import { Show, type Component, type JSX } from "solid-js"

interface EmptyStateProps {
  message: string
  hint?: string
  action?: JSX.Element
}

const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center gap-4 py-12 px-4">
      <span class="text-sm text-text-primary font-mono">{props.message}</span>
      <Show when={props.hint}>
        <span class="text-xs text-text-tertiary font-mono">{props.hint}</span>
      </Show>
      <Show when={props.action}>
        {props.action}
      </Show>
    </div>
  )
}

export default EmptyState
