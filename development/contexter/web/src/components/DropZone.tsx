import { createSignal, type Component, type JSX } from "solid-js"
import { Upload } from "lucide-solid"

interface DropZoneProps {
  onFiles: (files: File[]) => void
  onText?: (text: string) => void
  disabled?: boolean
  error?: string
}

const DropZone: Component<DropZoneProps> = (props) => {
  const [isDragOver, setIsDragOver] = createSignal(false)
  let inputRef: HTMLInputElement | undefined

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    if (!props.disabled) setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (props.disabled) return
    const files = Array.from(e.dataTransfer?.files ?? [])
    if (files.length > 0) props.onFiles(files)
  }

  const handleClick = () => {
    if (!props.disabled) inputRef?.click()
  }

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement
    const files = Array.from(target.files ?? [])
    if (files.length > 0) props.onFiles(files)
    target.value = ""
  }

  const handlePaste = (e: ClipboardEvent) => {
    if (props.disabled) return
    const files = Array.from(e.clipboardData?.files ?? [])
    if (files.length > 0) {
      props.onFiles(files)
      return
    }
    const text = e.clipboardData?.getData("text/plain")
    if (text && props.onText) {
      props.onText(text)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onPaste={handlePaste}
      tabIndex={0}
      class={`
        flex flex-col items-center justify-center gap-3
        p-12 cursor-pointer transition-all duration-[80ms]
        border border-dashed
        ${props.disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${isDragOver()
          ? "border-accent border-solid border-2 bg-white"
          : "border-border-default bg-bg-surface hover:border-accent hover:bg-white"
        }
        ${props.error ? "border-signal-error" : ""}
      `}
    >
      <Upload class={`w-6 h-6 ${isDragOver() ? "text-accent scale-110" : "text-text-tertiary"} transition-all duration-[80ms]`} />
      <span class="font-mono text-sm text-text-tertiary">
        перетащите файл сюда или нажмите для выбора
      </span>
      <span class="font-mono text-[10px] text-text-disabled">
        pdf, docx, xlsx, pptx, csv, json, txt, md, изображения, аудио, видео, youtube url
      </span>
      {props.error && (
        <span class="font-mono text-[10px] text-signal-error mt-1">{props.error}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        class="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}

export default DropZone
