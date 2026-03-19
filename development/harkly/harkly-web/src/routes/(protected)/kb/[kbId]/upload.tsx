import { Title } from "@solidjs/meta";
import { A, useNavigate } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import FileDropZone from "~/components/FileDropZone";

interface KbSource {
  id: string;
  name: string;
  contentType: string;
  status: "pending" | "processing" | "processed" | "failed";
  createdAt: string;
  updatedAt: string;
}

interface KbDetail {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UploadState {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "indexed" | "failed";
  uploadUrl?: string;
  sourceId?: string;
  jobId?: string;
  error?: string;
}

const ACCEPTED_TYPES = [
  ".pdf", ".docx", ".csv", ".txt", ".xlsx", ".md", ".json", ".mp3", ".wav", ".m4a"
].join(",");

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Б";
  const k = 1024;
  const sizes = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getStatusBadge(status: UploadState["status"]): { text: string; className: string } {
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

export default function UploadPage() {
  const navigate = useNavigate();
  const [kbId, setKbId] = createSignal<string>("");
  const [kb] = createResource(kbId, async (id) => {
    if (!id) return null;
    const res = await fetch(`/api/kb/${id}`);
    if (!res.ok) return null;
    const json = await res.json() as { data: KbDetail };
    return json.data;
  });
  const [uploads, setUploads] = createSignal<UploadState[]>([]);
  const [isUploading, setIsUploading] = createSignal(false);
  const [pollingJobs, setPollingJobs] = createSignal<Map<string, number>>(new Map());

  const getCurrentPathKbId = () => {
    const pathParts = window.location.pathname.split("/");
    const kbIndex = pathParts.indexOf("kb") + 1;
    return kbIndex > 0 && pathParts[kbIndex] ? pathParts[kbIndex] : null;
  };

  const handleFilesSelected = (files: File[]) => {
    const newUploads: UploadState[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
    }));
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const uploadFile = async (uploadState: UploadState) => {
    try {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadState.id ? { ...u, status: "uploading" as const } : u
        )
      );

      const initResponse = await fetch(`/api/kb/${kbId()}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadState.file.name,
          contentType: uploadState.file.type || "application/octet-stream",
        }),
      });

      if (!initResponse.ok) {
        throw new Error("Не удалось инициализировать загрузку");
      }

      const { uploadUrl, sourceId, jobId } = await initResponse.json() as { uploadUrl: string; sourceId: string; jobId: string };

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadState.id ? { ...u, uploadUrl, sourceId, jobId } : u
        )
      );

      const putResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadState.file,
      });

      if (!putResponse.ok) {
        throw new Error("Не удалось загрузить файл в хранилище");
      }

      const confirmResponse = await fetch(`/api/kb/${kbId()}/upload/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      if (!confirmResponse.ok) {
        throw new Error("Не удалось подтвердить загрузку");
      }

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadState.id ? { ...u, status: "processing" as const } : u
        )
      );

      startPollingJob(uploadState.id, jobId);

    } catch (error: any) {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadState.id
            ? { ...u, status: "failed" as const, error: error.message }
            : u
        )
      );
    }
  };

  const startPollingJob = (uploadId: string, jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/kb/${kbId()}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error("Не удалось получить статус задачи");
        }

        const { status } = await response.json() as { status: string };

        if (status === "completed") {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId ? { ...u, status: "indexed" as const } : u
            )
          );
          setPollingJobs((prev) => {
            const newMap = new Map(prev);
            newMap.delete(uploadId);
            return newMap;
          });
          return;
        }

        if (status === "failed") {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === uploadId
                ? { ...u, status: "failed" as const, error: "Ошибка обработки файла" }
                : u
            )
          );
          setPollingJobs((prev) => {
            const newMap = new Map(prev);
            newMap.delete(uploadId);
            return newMap;
          });
          return;
        }

        const currentTimeout = pollingJobs().get(uploadId);
        if (currentTimeout) {
          const newTimeout = window.setTimeout(poll, 2000);
          setPollingJobs((prev) => {
            const newMap = new Map(prev);
            newMap.set(uploadId, newTimeout);
            return newMap;
          });
        }
      } catch (error) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, status: "failed" as const, error: "Ошибка проверки статуса" }
              : u
          )
        );
      }
    };

    const timeout = window.setTimeout(poll, 2000);
    setPollingJobs((prev) => {
      const newMap = new Map(prev);
      newMap.set(uploadId, timeout);
      return newMap;
    });
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const pendingUploads = uploads().filter((u) => u.status === "pending");

    for (const upload of pendingUploads) {
      await uploadFile(upload);
    }

    setIsUploading(false);
  };

  const handleRemove = (id: string) => {
    const timeout = pollingJobs().get(id);
    if (timeout) {
      clearTimeout(timeout);
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const hasPendingUploads = () => uploads().some((u) => u.status === "pending");
  const allCompleted = () =>
    uploads().length > 0 && uploads().every((u) => u.status !== "pending" && u.status !== "uploading");

  const handleGoBack = () => {
    navigate(`/kb/${kbId()}`);
  };

  if (!kbId()) {
    const id = getCurrentPathKbId();
    if (id) {
      setKbId(id);
    }
  }

  return (
    <main class="min-h-screen bg-neutral-50">
      <Title>Загрузка файлов — Harkly</Title>

      <div class="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={handleGoBack}
          class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <span>←</span> Назад к базе знаний
        </button>

        <div class="mb-6">
          <h1 class="text-2xl font-bold text-neutral-900">Загрузка файлов</h1>
          <Show when={kb()}>
            <p class="text-neutral-600 mt-1">База знаний: {kb()?.title}</p>
          </Show>
        </div>

        <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 mb-6">
          <FileDropZone onFiles={handleFilesSelected} accept={ACCEPTED_TYPES} disabled={isUploading()} />

          <div class="mt-4">
            <p class="text-sm text-neutral-500">
              Поддерживаемые форматы: PDF, DOCX, CSV, TXT, XLSX, MD, JSON, MP3, WAV, M4A
            </p>
          </div>
        </div>

        <Show when={uploads().length > 0}>
          <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h2 class="font-semibold text-neutral-900">Файлы для загрузки</h2>
            </div>
            <ul class="divide-y divide-neutral-100">
              <For each={uploads()}>
                {(upload) => {
                  const badge = () => getStatusBadge(upload.status);
                  return (
                    <li class="px-6 py-4 flex items-start gap-4">
                      <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        upload.status === "indexed" ? "bg-green-100 text-green-600" :
                        upload.status === "failed" ? "bg-red-100 text-red-600" :
                        upload.status === "uploading" || upload.status === "processing" ? "bg-blue-100 text-blue-600" :
                        "bg-neutral-100 text-neutral-600"
                      }`}>
                        {(upload.status === "uploading" || upload.status === "processing") ? (
                          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : upload.status === "indexed" ? (
                          "✓"
                        ) : upload.status === "failed" ? (
                          "✕"
                        ) : (
                          "○"
                        )}
                      </div>

                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="font-medium text-neutral-900 truncate" title={upload.file.name}>
                            {upload.file.name}
                          </p>
                          <span class="text-sm text-neutral-500 flex-shrink-0">
                            {formatFileSize(upload.file.size)}
                          </span>
                        </div>

                        <div class="flex items-center gap-2 mt-1.5">
                          <span class={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge().className}`}>
                            {badge().text}
                          </span>
                        </div>

                        <Show when={upload.error}>
                          <p class="mt-2 text-sm text-red-600">{upload.error}</p>
                        </Show>
                      </div>

                      <Show when={upload.status === "pending"}>
                        <button
                          onClick={() => handleRemove(upload.id)}
                          class="flex-shrink-0 p-1 text-neutral-400 hover:text-red-600 transition-colors"
                          title="Удалить"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </Show>
                    </li>
                  );
                }}
              </For>
            </ul>
          </div>
        </Show>

        <div class="flex items-center gap-4">
          <button
            onClick={handleUpload}
            disabled={!hasPendingUploads() || isUploading()}
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading() ? (
              <>
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Загрузка...
              </>
            ) : (
              "Загрузить"
            )}
          </button>

          <Show when={allCompleted()}>
            <button
              onClick={handleGoBack}
              class="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              К документам
            </button>
          </Show>
        </div>
      </div>
    </main>
  );
}
