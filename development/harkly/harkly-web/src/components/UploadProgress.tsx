import { Show } from "solid-js";

type UploadStatus = "pending" | "uploading" | "processing" | "indexed" | "failed";

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  status: UploadStatus;
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getStatusBadge(status: UploadStatus): { text: string; className: string } {
  switch (status) {
    case "pending":
      return { text: "Ожидает", className: "bg-neutral-100 text-neutral-600" };
    case "uploading":
      return { text: "Загрузка...", className: "bg-blue-100 text-blue-700" };
    case "processing":
      return { text: "Обработка...", className: "bg-yellow-100 text-yellow-700" };
    case "indexed":
      return { text: "Готово", className: "bg-green-100 text-green-700" };
    case "failed":
      return { text: "Ошибка", className: "bg-red-100 text-red-700" };
  }
}

function getStatusIcon(status: UploadStatus): string {
  switch (status) {
    case "pending":
      return "○";
    case "uploading":
      return "↗";
    case "processing":
      return "⚙";
    case "indexed":
      return "✓";
    case "failed":
      return "✕";
  }
}

export default function UploadProgress(props: UploadProgressProps) {
  const badge = () => getStatusBadge(props.status);

  return (
    <div class="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
      <div class="flex items-start gap-3">
        <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          props.status === "indexed" ? "bg-green-100 text-green-600" :
          props.status === "failed" ? "bg-red-100 text-red-600" :
          props.status === "uploading" ? "bg-blue-100 text-blue-600" :
          props.status === "processing" ? "bg-yellow-100 text-yellow-600" :
          "bg-neutral-100 text-neutral-600"
        }`}>
          {props.status === "uploading" || props.status === "processing" ? (
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            getStatusIcon(props.status)
          )}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-medium text-neutral-900 truncate" title={props.fileName}>
              {props.fileName}
            </p>
            <span class="text-sm text-neutral-500 flex-shrink-0">
              {formatFileSize(props.fileSize)}
            </span>
          </div>

          <div class="flex items-center gap-2 mt-1.5">
            <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge().className}`}>
              {badge().text}
            </span>
          </div>

          <Show when={props.error}>
            <p class="mt-2 text-sm text-red-600">
              {props.error}
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}
