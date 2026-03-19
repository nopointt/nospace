import { createSignal, JSX, onCleanup, Show } from "solid-js";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string;
  disabled?: boolean;
}

export default function FileDropZone(props: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!props.disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (props.disabled) return;

    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      props.onFiles(files);
    }
  };

  const handleClick = () => {
    if (!props.disabled) {
      inputRef?.click();
    }
  };

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length > 0) {
      props.onFiles(files);
    }
    target.value = "";
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      class={`
        relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
        ${props.disabled
          ? "border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60"
          : isDragOver()
            ? "border-blue-500 bg-blue-50"
            : "border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={props.accept}
        multiple
        class="hidden"
        onChange={handleInputChange}
        disabled={props.disabled}
      />

      <svg
        class={`w-12 h-12 mb-4 transition-colors ${isDragOver() ? "text-blue-500" : "text-neutral-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      <p class={`text-lg font-medium mb-2 transition-colors ${isDragOver() ? "text-blue-600" : "text-neutral-700"}`}>
        {isDragOver() ? "Отпустите файлы" : "Перетащите файлы сюда"}
      </p>
      <p class="text-sm text-neutral-500">
        или нажмите для выбора
      </p>
    </div>
  );
}
