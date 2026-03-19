import { Component, createResource, For, Show } from "solid-js";
import { SkeletonRow } from "~/components/ui/Skeleton";
import EmptyState, { SchemaIcon } from "~/components/ui/EmptyState";
import { A } from "@solidjs/router";

interface Schema {
  id: string;
  name: string;
  version: number;
  status: string;
  createdAt: string;
}

interface SchemaTabProps {
  kbId: string;
}

function statusBadge(status: string): { text: string; cls: string } {
  switch (status) {
    case "draft":
      return { text: "Черновик", cls: "bg-neutral-100 text-neutral-600" };
    case "confirmed":
      return { text: "Подтверждена", cls: "bg-green-100 text-green-700" };
    case "pending":
      return { text: "Ожидает", cls: "bg-yellow-100 text-yellow-700" };
    default:
      return { text: status, cls: "bg-neutral-100 text-neutral-600" };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const SchemaTab: Component<SchemaTabProps> = (props) => {
  const [schemas] = createResource(
    () => props.kbId,
    async (kbId) => {
      const res = await fetch(`/api/kb/${kbId}/schemas`);
      if (!res.ok) throw new Error("Ошибка загрузки схем");
      const json = (await res.json()) as { data: Schema[] };
      return json.data;
    },
  );

  return (
    <div>
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <h2 class="font-semibold text-neutral-900">Схемы</h2>
        <A
          href={`/kb/${props.kbId}/schema/discover`}
          class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Обнаружить
        </A>
      </div>

      <Show when={schemas.loading}>
        <div class="divide-y divide-neutral-100">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </Show>

      <Show when={schemas() && schemas()!.length === 0}>
        <EmptyState
          icon={<SchemaIcon />}
          title="Нет схем"
          description="Загрузите документы и запустите обнаружение схемы"
          action={
            <A
              href={`/kb/${props.kbId}/schema/discover`}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Обнаружить схему
            </A>
          }
        />
      </Show>

      <Show when={schemas() && schemas()!.length > 0}>
        <ul class="divide-y divide-neutral-100">
          <For each={schemas()}>
            {(schema) => {
              const badge = () => statusBadge(schema.status);
              return (
                <A
                  href={`/kb/${props.kbId}/schema/${schema.id}`}
                  class="flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition-colors"
                >
                  <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-neutral-900 truncate">
                      {schema.name}
                    </p>
                    <p class="text-sm text-neutral-500">
                      v{schema.version} — {formatDate(schema.createdAt)}
                    </p>
                  </div>
                  <span
                    class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${badge().cls}`}
                  >
                    {badge().text}
                  </span>
                </A>
              );
            }}
          </For>
        </ul>
      </Show>
    </div>
  );
};

export default SchemaTab;
