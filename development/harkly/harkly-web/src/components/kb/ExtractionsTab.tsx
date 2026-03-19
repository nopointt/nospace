import { Component, createResource, createSignal, For, Show } from "solid-js";
import { SkeletonRow } from "~/components/ui/Skeleton";
import EmptyState, { ExtractionsIcon } from "~/components/ui/EmptyState";
import { A } from "@solidjs/router";

interface Extraction {
  id: string;
  entityType: string;
  data: string;
  confidence: number | null;
  schemaId: string;
  createdAt: string;
}

interface Schema {
  id: string;
  name: string;
}

interface ExtractionsTabProps {
  kbId: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function parseData(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function confidenceColor(c: number | null): string {
  if (c === null) return "text-neutral-400";
  if (c >= 0.8) return "text-green-600";
  if (c >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

const ExtractionsTab: Component<ExtractionsTabProps> = (props) => {
  const [filterSchemaId, setFilterSchemaId] = createSignal<string>("");

  // Fetch schemas for filter dropdown
  const [schemas] = createResource(
    () => props.kbId,
    async (kbId) => {
      const res = await fetch(`/api/kb/${kbId}/schemas`);
      if (!res.ok) return [];
      const json = (await res.json()) as { data: Schema[] };
      return json.data;
    },
  );

  // Fetch extractions, re-fetch when filter changes
  const [extractions] = createResource(
    () => ({ kbId: props.kbId, schemaId: filterSchemaId() }),
    async ({ kbId, schemaId }) => {
      const url = schemaId
        ? `/api/kb/${kbId}/extractions?schemaId=${schemaId}`
        : `/api/kb/${kbId}/extractions`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Ошибка загрузки извлечений");
      const json = (await res.json()) as { data: Extraction[] };
      return json.data;
    },
  );

  // Derive table columns from first 5 rows
  const columns = () => {
    const rows = extractions() ?? [];
    const cols = new Set<string>();
    for (const row of rows.slice(0, 5)) {
      for (const key of Object.keys(parseData(row.data))) {
        cols.add(key);
      }
    }
    return Array.from(cols).slice(0, 6); // max 6 columns
  };

  return (
    <div>
      {/* Header with filter */}
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-200 gap-4">
        <h2 class="font-semibold text-neutral-900 shrink-0">Извлечения</h2>
        <div class="flex items-center gap-3">
          <Show when={schemas() && schemas()!.length > 0}>
            <select
              class="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white text-neutral-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              value={filterSchemaId()}
              onChange={(e) => setFilterSchemaId(e.currentTarget.value)}
            >
              <option value="">Все схемы</option>
              <For each={schemas()}>
                {(s) => <option value={s.id}>{s.name}</option>}
              </For>
            </select>
          </Show>
          <A
            href={`/kb/${props.kbId}/extract`}
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            Извлечь
          </A>
        </div>
      </div>

      {/* Loading */}
      <Show when={extractions.loading}>
        <div class="divide-y divide-neutral-100">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </Show>

      {/* Empty */}
      <Show when={extractions() && extractions()!.length === 0}>
        <EmptyState
          icon={<ExtractionsIcon />}
          title="Нет извлечённых данных"
          description="Подтвердите схему и запустите извлечение"
          action={
            <A
              href={`/kb/${props.kbId}/extract`}
              class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Запустить извлечение
            </A>
          }
        />
      </Show>

      {/* Table */}
      <Show when={extractions() && extractions()!.length > 0}>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-neutral-200 bg-neutral-50">
                <th class="text-left px-4 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                  Тип
                </th>
                <For each={columns()}>
                  {(col) => (
                    <th class="text-left px-4 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wider truncate max-w-[150px]">
                      {col}
                    </th>
                  )}
                </For>
                <th class="text-right px-4 py-3 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                  Уверенность
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <For each={extractions()}>
                {(row) => {
                  const data = () => parseData(row.data);
                  return (
                    <tr class="hover:bg-neutral-50 transition-colors">
                      <td class="px-4 py-3 text-neutral-900 font-medium whitespace-nowrap">
                        {row.entityType}
                      </td>
                      <For each={columns()}>
                        {(col) => (
                          <td class="px-4 py-3 text-neutral-700 truncate max-w-[150px]">
                            {String(data()[col] ?? "—")}
                          </td>
                        )}
                      </For>
                      <td class={`px-4 py-3 text-right font-mono tabular-nums ${confidenceColor(row.confidence)}`}>
                        {row.confidence !== null
                          ? `${Math.round(row.confidence * 100)}%`
                          : "—"}
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  );
};

export default ExtractionsTab;
