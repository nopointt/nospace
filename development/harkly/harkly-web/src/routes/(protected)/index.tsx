import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createResource, createSignal, For, Show } from "solid-js";
import ProtectedLayout from "~/components/layout/ProtectedLayout";
import { SkeletonCard } from "~/components/ui/Skeleton";
import EmptyState from "~/components/ui/EmptyState";

interface KnowledgeBase {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return formatDate(dateStr);
}

export default function Dashboard() {
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [newTitle, setNewTitle] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");
  const [isCreating, setIsCreating] = createSignal(false);
  const [error, setError] = createSignal("");

  const [kbs, { refetch }] = createResource(async () => {
    const res = await fetch("/api/kb");
    if (!res.ok) throw new Error("Ошибка загрузки");
    const json = (await res.json()) as { data: KnowledgeBase[] };
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
        const errJson = (await res.json()) as { error?: string };
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
    <ProtectedLayout>
      <Title>Harkly — Данные в структуру</Title>

      <div class="max-w-5xl mx-auto px-6 py-8">
        {/* Page header */}
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900">Базы знаний</h1>
            <p class="text-neutral-500 mt-1">
              Управляйте своими проектами и данными
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Создать базу знаний
          </button>
        </div>

        {/* Create modal */}
        <Show when={showCreateForm()}>
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 class="text-xl font-bold text-neutral-900 mb-4">
                Новая база знаний
              </h2>

              <Show when={error()}>
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error()}
                </div>
              </Show>

              <form onSubmit={handleCreate} class="space-y-4">
                <div>
                  <label
                    for="title"
                    class="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Название <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTitle()}
                    onInput={(e) => setNewTitle(e.currentTarget.value)}
                    required
                    class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                    placeholder="Мои документы"
                  />
                </div>

                <div>
                  <label
                    for="description"
                    class="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Описание
                  </label>
                  <textarea
                    id="description"
                    value={newDescription()}
                    onInput={(e) => setNewDescription(e.currentTarget.value)}
                    rows={3}
                    class="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
                    placeholder="Краткое описание..."
                  />
                </div>

                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isCreating()}
                    class="flex-1 py-2.5 px-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating() ? "Создание..." : "Создать"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelCreate}
                    class="py-2.5 px-4 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Show>

        {/* Loading */}
        <Show when={kbs.loading}>
          <div class="grid gap-4 sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </Show>

        {/* Error */}
        <Show when={kbs.error}>
          <div class="text-center py-12">
            <p class="text-neutral-600 mb-4">
              Не удалось загрузить базы знаний
            </p>
            <button
              onClick={() => refetch()}
              class="text-orange-600 hover:text-orange-700 font-medium"
            >
              Попробовать снова
            </button>
          </div>
        </Show>

        {/* Empty state */}
        <Show when={kbs() && kbs()!.length === 0}>
          <EmptyState
            icon={
              <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            title="Нет баз знаний"
            description="Создайте первую базу знаний для хранения и структурирования документов"
            action={
              <button
                onClick={() => setShowCreateForm(true)}
                class="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Создать базу знаний
              </button>
            }
          />
        </Show>

        {/* KB cards */}
        <Show when={kbs() && kbs()!.length > 0}>
          <div class="grid gap-4 sm:grid-cols-2">
            <For each={kbs()}>
              {(kb) => (
                <A
                  href={`/kb/${kb.id}`}
                  class="block p-6 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
                >
                  <div class="flex items-start gap-4">
                    <div class="shrink-0 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                      <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-neutral-900 group-hover:text-orange-600 transition-colors truncate">
                        {kb.title}
                      </h3>
                      <Show when={kb.description}>
                        <p class="mt-1 text-sm text-neutral-600 line-clamp-2">
                          {kb.description}
                        </p>
                      </Show>
                      <p class="mt-3 text-sm text-neutral-400">
                        {formatRelative(kb.updatedAt)}
                      </p>
                    </div>
                  </div>
                </A>
              )}
            </For>
          </div>
        </Show>
      </div>
    </ProtectedLayout>
  );
}
