import { createSignal, createResource, Show, For } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";

export default function RunExtraction() {
  const params = useParams();
  const [selectedSchema, setSelectedSchema] = createSignal("");
  const [running, setRunning] = createSignal(false);
  const [result, setResult] = createSignal<any>(null);
  const [error, setError] = createSignal("");

  const [schemas] = createResource(async () => {
    const res = await fetch(`/api/kb/${params.kbId}/schemas?status=confirmed`);
    const json: any = await res.json();
    return json.data ?? [];
  });

  async function runExtraction() {
    if (!selectedSchema()) return;
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/kb/${params.kbId}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemaId: selectedSchema() }),
      });
      const json: any = await res.json();
      if (!res.ok) {
        setError(json.error || "Ошибка экстракции");
      } else {
        setResult(json.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main class="max-w-3xl mx-auto p-6">
      <Title>Экстракция — Harkly</Title>
      <h1 class="text-2xl font-bold text-neutral-900 mb-6">Запустить экстракцию</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-1">Выберите схему</label>
          <select
            value={selectedSchema()}
            onChange={(e) => setSelectedSchema(e.currentTarget.value)}
            class="w-full px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="">— Выберите —</option>
            <For each={schemas() ?? []}>
              {(s: any) => <option value={s.id}>{s.name} (v{s.version})</option>}
            </For>
          </select>
        </div>

        <button
          onClick={runExtraction}
          disabled={!selectedSchema() || running()}
          class="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
        >
          {running() ? "Экстракция..." : "Запустить экстракцию"}
        </button>

        <Show when={error()}>
          <p class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error()}</p>
        </Show>

        <Show when={result()}>
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-800 font-medium">Экстракция завершена</p>
            <p class="text-sm text-green-700 mt-1">
              Обработано: {result()!.processedItems} из {result()!.totalItems} документов
            </p>
            <A href={`/kb/${params.kbId}/extractions`} class="inline-block mt-3 text-sm text-green-700 underline">
              Посмотреть результаты
            </A>
          </div>
        </Show>
      </div>
    </main>
  );
}
