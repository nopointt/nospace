import { Component, createResource, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { SkeletonRow } from "~/components/ui/Skeleton";
import EmptyState, { DocumentsIcon } from "~/components/ui/EmptyState";

interface Source {
  id: string;
  title: string | null;
  type: string;
  status: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

interface DocumentsTabProps {
  kbId: string;
}

function statusBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case "pending":
      return { text: "Ожидает", cls: "bg-neutral-100 text-neutral-600" };
    case "processing":
      return { text: "Обработка", cls: "bg-yellow-100 text-yellow-700" };
    case "ready":
    case "processed":
      return { text: "Готово", cls: "bg-green-100 text-green-700" };
    case "error":
    case "failed":
      return { text: "Ошибка", cls: "bg-red-100 text-red-700" };
    default:
      return { text: status, cls: "bg-neutral-100 text-neutral-600" };
  }
}

function fileIcon(mimeType: string | null): string {
  if (!mimeType) return "📎";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("csv")) return "📊";
  if (mimeType.includes("audio")) return "🎵";
  if (mimeType.includes("text") || mimeType.includes("markdown")) return "📃";
  return "📎";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DocumentsTab: Component<DocumentsTabProps> = (props) => {
  const [sources] = createResource(
    () => props.kbId,
    async (kbId) => {
      const res = await fetch(`/api/kb/${kbId}/sources`);
      if (!res.ok) throw new Error("Ошибка загрузки документов");
      const json = (await res.json()) as { data: Source[] };
      return json.data;
    },
  );

  return (
    <div>
      {/* Header with upload button */}
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <h2 class="font-semibold text-neutral-900">Документы</h2>
        <A
          href={`/kb/${props.kbId}/upload`}
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Загрузить
        </A>
      </div>

      {/* Loading */}
      <Show when={sources.loading}>
        <div class="divide-y divide-neutral-100">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </Show>

      {/* Empty */}
      <Show when={sources() && sources()!.length === 0}>
        <EmptyState
          icon={<DocumentsIcon />}
          title="Пока нет документов"
          description="Загрузите файлы, чтобы начать работу с базой знаний"
          action={
            <A
              href={`/kb/${props.kbId}/upload`}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Загрузить первый файл
            </A>
          }
        />
      </Show>

      {/* List */}
      <Show when={sources() && sources()!.length > 0}>
        <ul class="divide-y divide-neutral-100">
          <For each={sources()}>
            {(source) => {
              const badge = () => statusBadge(source.status);
              return (
                <li class="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors">
                  <span class="text-2xl">{fileIcon(source.mimeType)}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-neutral-900 truncate">
                      {source.title || source.type}
                    </p>
                    <p class="text-sm text-neutral-500">
                      {formatDate(source.createdAt)}
                    </p>
                  </div>
                  <span
                    class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${badge().cls}`}
                  >
                    {badge().text}
                  </span>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
};

export default DocumentsTab;
