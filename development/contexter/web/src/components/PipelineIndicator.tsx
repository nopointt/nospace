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
  mimeType?: string
}

// --- Time estimate for slow formats ---

export function getTimeEstimate(mimeType?: string): string | null {
  if (!mimeType) return null
  const m = mimeType.split(";")[0].trim()
  if (m.startsWith("audio/")) return "~10-120 с"
  if (m.startsWith("video/")) return "~1-5 мин"
  if (m === "text/x-youtube-url") return null
  if (["text/plain", "text/markdown", "text/csv", "application/json", "text/xml"].includes(m)) return null
  if (m.startsWith("image/")) return "~3-10 с"
  return "~5-30 с"
}

// --- Format group detection ---

type FormatGroup = "document" | "text" | "image" | "audio" | "video" | "youtube"

function getFormatGroup(mimeType?: string): FormatGroup {
  if (!mimeType) return "document"
  const m = mimeType.split(";")[0].trim()
  if (m.startsWith("audio/")) return "audio"
  if (m.startsWith("video/")) return "video"
  if (m.startsWith("image/")) return "image"
  if (m === "text/x-youtube-url") return "youtube"
  if (
    [
      "text/plain",
      "text/markdown",
      "text/csv",
      "application/json",
      "text/xml",
      "image/svg+xml",
      "application/vnd.oasis.opendocument.text",
    ].includes(m)
  )
    return "text"
  return "document"
}

// --- Labels ---

const PARSE_LABELS: Record<FormatGroup, string> = {
  document: "распознавание документа",
  text: "чтение файла",
  image: "распознавание изображения",
  audio: "расшифровка аудио",
  video: "извлечение и расшифровка",
  youtube: "загрузка субтитров",
}

const STAGE_LABELS: Record<string, string> = {
  chunk: "разбивка на фрагменты",
  embed: "векторизация",
  index: "сохранение",
}

function getStageLabel(stageName: string, formatGroup: FormatGroup): string {
  if (stageName === "parse") return PARSE_LABELS[formatGroup]
  return STAGE_LABELS[stageName] ?? stageName
}

// --- Short labels (mobile <640px) ---

const PARSE_LABELS_SHORT: Record<FormatGroup, string> = {
  document: "ocr",
  text: "файл",
  image: "ocr",
  audio: "аудио",
  video: "видео",
  youtube: "yt",
}

const STAGE_LABELS_SHORT: Record<string, string> = {
  chunk: "фрагм.",
  embed: "вектор.",
  index: "сохр.",
}

function getStageLabelShort(stageName: string, formatGroup: FormatGroup): string {
  if (stageName === "parse") return PARSE_LABELS_SHORT[formatGroup]
  return STAGE_LABELS_SHORT[stageName] || stageName
}

// --- Accessibility state text ---

const STATE_TEXT: Record<string, string> = {
  pending: "ожидание",
  active: "выполняется",
  running: "выполняется",
  done: "готово",
  error: "ошибка",
}

// --- State styles ---

const DOT_CLASS: Record<StageStatus, string> = {
  pending: "bg-border-default",
  active: "bg-accent animate-pulse",
  done: "bg-text-secondary",
  error: "bg-signal-error",
}

const LABEL_CLASS: Record<StageStatus, string> = {
  pending: "text-text-disabled",
  active: "text-accent font-medium",
  done: "text-text-secondary font-medium",
  error: "text-signal-error font-medium",
}

// --- Component ---

const PipelineIndicator: Component<PipelineIndicatorProps> = (props) => {
  const formatGroup = () => getFormatGroup(props.mimeType)

  return (
    <div class="flex items-center gap-0" role="status" aria-live="polite">
      <For each={props.stages}>
        {(stage, i) => {
          const prevDone = () => i() > 0 && props.stages[i() - 1].status === "done"
          return (
            <>
              {i() > 0 && (
                <div
                  class={`w-3 sm:w-6 h-px ${prevDone() ? "bg-text-secondary" : "bg-border-subtle"}`}
                  aria-hidden="true"
                />
              )}
              <div
                class="flex items-center gap-2"
                aria-label={`${getStageLabel(stage.name, formatGroup())} — ${STATE_TEXT[stage.status] || stage.status}`}
              >
                <span class={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASS[stage.status]}`} />
                <span class={`text-xs whitespace-nowrap ${LABEL_CLASS[stage.status]}`}>
                  <span class="hidden sm:inline">
                    {getStageLabel(stage.name, formatGroup())}
                  </span>
                  <span class="inline sm:hidden">
                    {getStageLabelShort(stage.name, formatGroup())}
                  </span>
                  {stage.status === "done" && stage.duration != null && (
                    <span class="font-mono text-text-tertiary font-normal ml-1">
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
