import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createResource, createSignal, For, Show, onMount } from "solid-js";

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

function getStatusBadge(status: KbSource["status"]): { text: string; className: string } {
  switch (status) {
    case "pending":
      return { text: "Ожидает", className: "bg-neutral-100 text-neutral-600" };
    case "processing":
      return { text: "Обработка", className: "bg-yellow-100 text-yellow-700" };
    case "processed":
      return { text: "Готово", className: "bg-green-100 text-green-700" };
    case "failed":
      return { text: "Ошибка", className: "bg-red-100 text-red-700" };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(contentType: string): string {
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("word") || contentType.includes("document")) return "📝";
  if (contentType.includes("sheet") || contentType.includes("excel") || contentType.includes("csv")) return "📊";
  if (contentType.includes("audio")) return "🎵";
  if (contentType.includes("text") || contentType.includes("markdown")) return "📃";
  return "📎";
}

export default function KbDetailPage() {
  const [kbId, setKbId] = createSignal<string>("");
  
  const [kb] = createResource(kbId, async (id) => {
    if (!id) return null;
    const res = await fetch(`/api/kb/${id}`);
    if (!res.ok) return null;
    const json = await res.json() as { data: KbDetail };
    return json.data;
  });

  const [sources, { refetch }] = createResource(kbId, async (id) => {
    if (!id) return [];
    const res = await fetch(`/api/kb/${id}/sources`);
    if (!res.ok) return [];
    const json = await res.json() as { data: KbSource[] };
    return json.data;
  });

  onMount(() => {
    const pathParts = window.location.pathname.split("/");
    const kbIndex = pathParts.indexOf("kb") + 1;
    if (kbIndex > 0 && pathParts[kbIndex]) {
      setKbId(pathParts[kbIndex]);
    }
  });

  return (
    <main class="min-h-screen bg-neutral-50">
      <Title>{kb()?.title || "База знаний"} — Harkly</Title>

      <div class="max-w-4xl mx-auto px-6 py-8">
        <Show when={kb.loading}>
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        <Show when={kb.error}>
          <div class="text-center py-12">
            <p class="text-neutral-600">Не удалось загрузить базу знаний</p>
            <A href="/kb" class="mt-4 inline-block text-blue-600 hover:text-blue-700">
              Вернуться к списку
            </A>
          </div>
        </Show>

        <Show when={kb()}>
          <div class="mb-8">
            <A href="/kb" class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
              <span>←</span> Все базы знаний
            </A>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-bold text-neutral-900">{kb()?.title}</h1>
                <Show when={kb()?.description}>
                  <p class="mt-1 text-neutral-600">{kb()?.description}</p>
                </Show>
                <p class="mt-2 text-sm text-neutral-500">
                  Обновлено: {kb()?.updatedAt ? formatDate(kb()!.updatedAt) : "—"}
                </p>
              </div>
              <A
                href={`/kb/${kbId()}/upload`}
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Загрузить файлы
              </A>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-neutral-200">
              <h2 class="font-semibold text-neutral-900">Документы</h2>
            </div>

            <Show when={sources.loading}>
              <div class="flex items-center justify-center py-12">
                <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </Show>

            <Show when={sources() && sources()!.length === 0}>
              <div class="px-6 py-12 text-center">
                <svg class="w-12 h-12 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-neutral-600 mb-4">Пока нет документов</p>
                <A
                  href={`/kb/${kbId()}/upload`}
                  class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Загрузить первый файл
                </A>
              </div>
            </Show>

            <Show when={sources() && sources()!.length > 0}>
              <ul class="divide-y divide-neutral-100">
                <For each={sources()}>
                  {(source) => {
                    const badge = () => getStatusBadge(source.status);
                    return (
                      <li class="px-6 py-4 flex items-center gap-4 hover:bg-neutral-50 transition-colors">
                        <span class="text-2xl">{getFileIcon(source.contentType)}</span>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-neutral-900 truncate">{source.name}</p>
                          <p class="text-sm text-neutral-500">
                            Добавлен: {formatDate(source.createdAt)}
                          </p>
                        </div>
                        <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${badge().className}`}>
                          {badge().text}
                        </span>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </Show>
          </div>
        </Show>
      </div>
    </main>
  );
}
