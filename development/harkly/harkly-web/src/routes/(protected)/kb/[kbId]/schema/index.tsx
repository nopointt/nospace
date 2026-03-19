import { createResource, For, Show } from "solid-js";
import { A, useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";

export default function SchemaList() {
  const params = useParams();
  const [schemas] = createResource(async () => {
    const res = await fetch(`/api/kb/${params.kbId}/schemas`);
    const json: any = await res.json();
    return json.data ?? [];
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "draft": return <span class="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs">Черновик</span>;
      case "confirmed": return <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">Подтверждена</span>;
      case "archived": return <span class="px-2 py-0.5 bg-neutral-200 text-neutral-500 rounded-full text-xs">Архив</span>;
      default: return null;
    }
  };

  return (
    <main class="max-w-4xl mx-auto p-6">
      <Title>Схемы — Harkly</Title>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-neutral-900">Схемы</h1>
        <A href={`/kb/${params.kbId}/schema/discover`} class="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm hover:bg-neutral-800">
          Обнаружить схему
        </A>
      </div>
      <Show when={!schemas.loading} fallback={<p class="text-neutral-500">Загрузка...</p>}>
        <Show when={schemas()?.length > 0} fallback={<p class="text-neutral-500">Нет схем. Загрузите документы и нажмите «Обнаружить схему».</p>}>
          <div class="space-y-3">
            <For each={schemas()}>
              {(schema: any) => (
                <A href={`/kb/${params.kbId}/schema/${schema.id}`} class="block p-4 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="font-medium text-neutral-900">{schema.name}</h3>
                      <p class="text-sm text-neutral-500">v{schema.version}</p>
                    </div>
                    {statusBadge(schema.status)}
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </main>
  );
}
