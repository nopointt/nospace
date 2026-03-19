import { createSignal, createResource, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import SchemaFieldEditor, { type SchemaFieldData } from "~/components/SchemaFieldEditor";

export default function SchemaEditor() {
  const params = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = createSignal(false);

  const [schema] = createResource(async () => {
    const res = await fetch(`/api/kb/${params.kbId}/schemas/${params.schemaId}`);
    const json: any = await res.json();
    return json.data;
  });

  const [fields, setFields] = createSignal<SchemaFieldData[]>([]);

  // Initialize fields when schema loads
  createResource(
    () => schema(),
    (data) => {
      if (data?.fields) {
        setFields(
          data.fields.map((f: any) => ({
            name: f.name,
            type: f.type,
            description: f.description || "",
            required: !!f.required,
          })),
        );
      }
      return data;
    },
  );

  async function save() {
    setSaving(true);
    await fetch(`/api/kb/${params.kbId}/schemas/${params.schemaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: fields() }),
    });
    setSaving(false);
  }

  async function confirm() {
    await save();
    await fetch(`/api/kb/${params.kbId}/schemas/${params.schemaId}/confirm`, {
      method: "POST",
    });
    navigate(`/kb/${params.kbId}/schema`);
  }

  return (
    <main class="max-w-3xl mx-auto p-6">
      <Title>Редактор схемы — Harkly</Title>
      <Show when={schema()} fallback={<p class="text-neutral-500">Загрузка...</p>}>
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">{schema()!.name}</h1>
        <p class="text-sm text-neutral-500 mb-6">
          Статус: {schema()!.status === "draft" ? "Черновик" : schema()!.status === "confirmed" ? "Подтверждена" : "Архив"}
        </p>

        <SchemaFieldEditor fields={fields()} onChange={setFields} />

        <div class="flex gap-3 mt-6">
          <button
            onClick={save}
            disabled={saving()}
            class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 text-sm"
          >
            {saving() ? "Сохранение..." : "Сохранить"}
          </button>
          <Show when={schema()!.status === "draft"}>
            <button
              onClick={confirm}
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Подтвердить схему
            </button>
          </Show>
        </div>
      </Show>
    </main>
  );
}
