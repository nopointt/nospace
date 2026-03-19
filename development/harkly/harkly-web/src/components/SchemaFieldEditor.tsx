import { For, createSignal } from "solid-js";

export interface SchemaFieldData {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enumValues?: string[];
}

interface Props {
  fields: SchemaFieldData[];
  onChange: (fields: SchemaFieldData[]) => void;
}

const TYPE_OPTIONS = [
  { value: "string", label: "Строка" },
  { value: "number", label: "Число" },
  { value: "boolean", label: "Логическое" },
  { value: "date", label: "Дата" },
  { value: "enum", label: "Перечисление" },
  { value: "array", label: "Массив" },
  { value: "object", label: "Объект" },
];

export default function SchemaFieldEditor(props: Props) {
  function updateField(index: number, updates: Partial<SchemaFieldData>) {
    const updated = props.fields.map((f, i) =>
      i === index ? { ...f, ...updates } : f,
    );
    props.onChange(updated);
  }

  function removeField(index: number) {
    props.onChange(props.fields.filter((_, i) => i !== index));
  }

  function addField() {
    props.onChange([
      ...props.fields,
      { name: "", type: "string", description: "", required: false },
    ]);
  }

  return (
    <div class="space-y-3">
      <For each={props.fields}>
        {(field, index) => (
          <div class="flex gap-2 items-start p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div class="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={field.name}
                onInput={(e) => updateField(index(), { name: e.currentTarget.value })}
                placeholder="Имя поля"
                class="px-3 py-1.5 border border-neutral-300 rounded text-sm"
              />
              <select
                value={field.type}
                onChange={(e) => updateField(index(), { type: e.currentTarget.value })}
                class="px-3 py-1.5 border border-neutral-300 rounded text-sm"
              >
                <For each={TYPE_OPTIONS}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
              <input
                type="text"
                value={field.description}
                onInput={(e) => updateField(index(), { description: e.currentTarget.value })}
                placeholder="Описание"
                class="col-span-2 px-3 py-1.5 border border-neutral-300 rounded text-sm"
              />
            </div>
            <label class="flex items-center gap-1 text-xs text-neutral-600 pt-2">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => updateField(index(), { required: e.currentTarget.checked })}
              />
              Обяз.
            </label>
            <button
              onClick={() => removeField(index())}
              class="p-1.5 text-red-500 hover:text-red-700 text-sm"
              title="Удалить"
            >
              ✕
            </button>
          </div>
        )}
      </For>
      <button
        onClick={addField}
        class="w-full py-2 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 text-sm"
      >
        + Добавить поле
      </button>
    </div>
  );
}
