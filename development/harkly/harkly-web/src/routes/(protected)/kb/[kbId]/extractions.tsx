import { createResource, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";

export default function Extractions() {
  const params = useParams();

  const [entities] = createResource(async () => {
    const res = await fetch(`/api/kb/${params.kbId}/extractions`);
    const json = await res.json();
    return json.data ?? [];
  });

  // Get columns from first entity's data
  const columns = () => {
    const rows = entities() ?? [];
    if (rows.length === 0) return [];
    try {
      const data = JSON.parse(rows[0].data);
      return Object.keys(data);
    } catch {
      return [];
    }
  };

  const confidenceBadge = (confidence: number) => {
    if (confidence > 0.8) return <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Высокая</span>;
    if (confidence > 0.5) return <span class="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">Средняя</span>;
    return <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">Низкая</span>;
  };

  function exportCsv() {
    window.open(`/api/kb/${params.kbId}/extractions?format=csv`, "_blank");
  }

  return (
    <main class="max-w-6xl mx-auto p-6">
      <Title>Результаты экстракции — Harkly</Title>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-neutral-900">Результаты экстракции</h1>
        <Show when={(entities() ?? []).length > 0}>
          <button onClick={exportCsv} class="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50">
            Экспорт CSV
          </button>
        </Show>
      </div>

      <Show when={!entities.loading} fallback={<p class="text-neutral-500">Загрузка...</p>}>
        <Show when={(entities() ?? []).length > 0} fallback={<p class="text-neutral-500">Нет результатов. Запустите экстракцию.</p>}>
          <div class="overflow-x-auto border border-neutral-200 rounded-lg">
            <table class="w-full text-sm">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="px-3 py-2 text-left text-neutral-600 font-medium">Уверенность</th>
                  <For each={columns()}>
                    {(col) => <th class="px-3 py-2 text-left text-neutral-600 font-medium">{col}</th>}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={entities() ?? []}>
                  {(entity: any) => {
                    let data: Record<string, any> = {};
                    try { data = JSON.parse(entity.data); } catch {}
                    return (
                      <tr class="border-t border-neutral-100 hover:bg-neutral-50">
                        <td class="px-3 py-2">{confidenceBadge(entity.confidence ?? 0)}</td>
                        <For each={columns()}>
                          {(col) => (
                            <td class="px-3 py-2 text-neutral-800 max-w-xs truncate">
                              {data[col] !== null && data[col] !== undefined ? String(data[col]) : "—"}
                            </td>
                          )}
                        </For>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </main>
  );
}
