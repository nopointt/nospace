import { Show, type Component } from "solid-js"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

const ErrorState: Component<ErrorStateProps> = (props) => {
  return (
    <div class="flex flex-col items-start gap-3 py-8 px-4">
      <p class="text-signal-error text-xs font-mono">{props.message}</p>
      <Show when={props.onRetry}>
        <button
          onClick={props.onRetry}
          class="text-accent text-xs font-mono underline bg-transparent border-0 p-0 cursor-pointer"
        >
          Повторить
        </button>
      </Show>
    </div>
  )
}

export default ErrorState
