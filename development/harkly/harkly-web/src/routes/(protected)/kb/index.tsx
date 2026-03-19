import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";

interface KnowledgeBase {
  id: string;
  title: string;
  description: string | null;
  docCount?: number;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function KbListPage() {
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [newTitle, setNewTitle] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");
  const [isCreating, setIsCreating] = createSignal(false);
  const [error, setError] = createSignal("");

  const [kbs, { refetch }] = createResource(async () => {
    const res = await fetch("/api/kb");
    if (!res.ok) throw new Error("Ошибка загрузки");
    const json = await res.json() as { data: KnowledgeBase[] };
    return json.data;
  });

  const handleCreate = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!newTitle().trim()) {
      setError("Название обязательно");
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle().trim(),
          description: newDescription().trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json() as { error?: string };
        throw new Error(errJson.error || "Ошибка создания базы знаний");
      }

      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
      refetch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setNewTitle("");
    setNewDescription("");
    setError("");
  };

  return (
    <main class="min-h-screen bg-neutral-50">
      <Title>Базы знаний — Harkly</Title>

      <div class="max-w-4xl mx-auto px-6 py-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-2xl font-bold text-neutral-900">Базы знаний</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Создать базу знаний
          </button>
        </div>

        <Show when={showCreateForm()}>
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 class="text-xl font-bold text-neutral-900 mb-4">Новая база знаний</h2>

              <Show when={error()}>
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error()}
                </div>
              </Show>

              <form onSubmit={handleCreate} class="space-y-4">
                <div>
                  <label for="title" class="block text-sm font-medium text-neutral-700 mb-1">
                    Название <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTitle()}
                    onInput={(e) => setNewTitle(e.currentTarget.value)}
                    required
                    class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Мои документы"
                  />
                </div>

                <div>
                  <label for="description" class="block text-sm font-medium text-neutral-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    id="description"
                    value={newDescription()}
                    onInput={(e) => setNewDescription(e.currentTarget.value)}
                    rows={3}
                    class="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    placeholder="Краткое описание базы знаний..."
                  />
                </div>

                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isCreating()}
                    class="flex-1 py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating() ? "Создание..." : "Создать"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelCreate}
                    class="py-2.5 px-4 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        <Show when={kbs.loading}>
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        <Show when={kbs.error}>
          <div class="text-center py-12">
            <p class="text-neutral-600 mb-4">Не удалось загрузить базы знаний</p>
            <button
              onClick={() => refetch()}
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              Попробовать снова
            </button>
          </div>
        </Show>

        <Show when={kbs() && kbs()!.length === 0}>
          <div class="text-center py-16">
            <svg class="w-16 h-16 mx-auto text-neutral-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h2 class="text-lg font-semibold text-neutral-900 mb-2">Нет баз знаний</h2>
            <p class="text-neutral-600 mb-6">Создайте первую базу знаний для хранения документов</p>
            <button
              onClick={() => setShowCreateForm(true)}
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Создать базу знаний
            </button>
          </div>
        </Show>

        <Show when={kbs() && kbs()!.length > 0}>
          <div class="grid gap-4 sm:grid-cols-2">
            <For each={kbs()}>
              {(kb) => (
                <A
                  href={`/kb/${kb.id}`}
                  class="block p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all group"
                >
                  <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-colors">
                      📚
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                        {kb.title}
                      </h3>
                      <Show when={kb.description}>
                        <p class="mt-1 text-sm text-neutral-600 line-clamp-2">
                          {kb.description}
                        </p>
                      </Show>
                      <div class="mt-3 flex items-center gap-4 text-sm text-neutral-500">
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {kb.docCount ?? 0} док.
                        </span>
                        <span>Обновлено {formatDate(kb.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>
      </div>
    </main>
  );
}
