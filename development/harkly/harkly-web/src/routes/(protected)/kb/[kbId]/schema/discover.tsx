import { createSignal, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import SchemaFieldEditor, { type SchemaFieldData } from "~/components/SchemaFieldEditor";

export default function DiscoverSchema() {
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [schemaId, setSchemaId] = createSignal("");
  const [fields, setFields] = createSignal<SchemaFieldData[]>([]);

  async function discover() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/kb/${params.kbId}/schema/discover`, { method: "POST" });
      const json: any = await res.json();
      if (!res.ok) {
        setError(json.error || "Ошибка обнаружения");
        return;
      }
      setSchemaId(json.data.id);
      setFields(
        json.data.fields.map((f: any) => ({
          name: f.name,
          type: f.type,
          description: f.description || "",
          required: !!f.required,
        })),
      );
    } catch (err: any) {
      setError(err.message || "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!schemaId()) return;

    // Save updated fields
    await fetch(`/api/kb/${params.kbId}/schemas/${schemaId()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: fields() }),
    });

    // Confirm
    await fetch(`/api/kb/${params.kbId}/schemas/${schemaId()}/confirm`, {
      method: "POST",
    });

    navigate(`/kb/${params.kbId}/schema`);
  }

  return (
    <main class="max-w-3xl mx-auto p-6">
      <Title>Обнаружить схему — Harkly</Title>
      <h1 class="text-2xl font-bold text-neutral-900 mb-6">Обнаружить схему</h1>

      <Show when={!schemaId()}>
        <p class="text-neutral-600 mb-4">
          AI проанализирует загруженные документы и предложит структуру данных.
        </p>
        <button
          onClick={discover}
          disabled={loading()}
          class="px-6 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading() ? "AI анализирует документы..." : "Обнаружить схему"}
        </button>
      </Show>

      <Show when={error()}>
        <p class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error()}</p>
      </Show>

      <Show when={schemaId()}>
        <div class="space-y-4">
          <p class="text-neutral-600">AI предложил следующую структуру. Отредактируйте при необходимости.</p>
          <SchemaFieldEditor fields={fields()} onChange={setFields} />
          <div class="flex gap-3">
            <button
              onClick={confirm}
              class="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Подтвердить схему
            </button>
            <button
              onClick={() => { setSchemaId(""); setFields([]); }}
              class="px-6 py-2.5 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              Начать заново
            </button>
          </div>
        </div>
      </Show>
    </main>
  );
}
