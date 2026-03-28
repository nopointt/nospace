import type { Component } from "solid-js"
import { For } from "solid-js"

export type StageStatus = "pending" | "active" | "done" | "error"

export interface PipelineStage {
  name: string
  status: StageStatus
  duration?: number
  error?: string
}

interface PipelineIndicatorProps {
  stages: PipelineStage[]
}

const STAGE_LABELS: Record<string, string> = {
  parse: "Извлечение текста",
  chunk: "Разбивка на фрагменты",
  embed: "Создание индекса",
  index: "Сохранение",
  transcribe: "Расшифровка аудио",
}

const statusStyles: Record<StageStatus, { dot: string; text: string; weight: string }> = {
  pending: { dot: "bg-text-tertiary", text: "text-text-tertiary", weight: "font-normal" },
  active: { dot: "bg-accent animate-pulse", text: "text-accent", weight: "font-bold" },
  done: { dot: "bg-black", text: "text-black", weight: "font-medium" },
  error: { dot: "bg-signal-error", text: "text-signal-error", weight: "font-medium" },
}

const PipelineIndicator: Component<PipelineIndicatorProps> = (props) => {
  return (
    <div class="flex items-center gap-0">
      <For each={props.stages}>
        {(stage, i) => {
          const style = () => statusStyles[stage.status]
          return (
            <>
              {i() > 0 && (
                <div class="w-6 h-px bg-border-subtle" />
              )}
              <div class="flex items-center gap-2">
                <span class={`w-2 h-2 rounded-full shrink-0 ${style().dot}`} />
                <span class={`font-mono text-xs whitespace-nowrap ${style().text} ${style().weight}`}>
                  {STAGE_LABELS[stage.name] ?? stage.name}
                  {stage.status === "done" && stage.duration != null && (
                    <span class="text-text-tertiary font-normal ml-1">
                      {stage.duration < 1000
                        ? `${stage.duration}ms`
                        : `${(stage.duration / 1000).toFixed(1)}s`}
                    </span>
                  )}
                </span>
              </div>
            </>
          )
        }}
      </For>
    </div>
  )
}

export default PipelineIndicator
