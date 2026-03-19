import { Component, createResource, For, Show, createSignal } from "solid-js";
import { A, useLocation } from "@solidjs/router";

interface KbItem {
  id: string;
  title: string;
}

const Sidebar: Component = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = createSignal(false);

  const [kbs] = createResource(async () => {
    try {
      const res = await fetch("/api/kb");
      if (!res.ok) return [];
      const json = (await res.json()) as { data: KbItem[] };
      return json.data;
    } catch {
      return [];
    }
  });

  const isActiveKb = (id: string) => location.pathname.includes(`/kb/${id}`);

  return (
    <aside
      class="bg-neutral-50 border-r border-neutral-200 flex flex-col shrink-0 transition-all"
      classList={{
        "w-60": !collapsed(),
        "w-14": collapsed(),
      }}
    >
      {/* Toggle */}
      <div class="flex items-center justify-end p-2">
        <button
          onClick={() => setCollapsed((p) => !p)}
          class="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-400 transition-colors"
          title={collapsed() ? "Развернуть" : "Свернуть"}
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <Show
              when={collapsed()}
              fallback={
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              }
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </Show>
          </svg>
        </button>
      </div>

      {/* KB list */}
      <Show when={!collapsed()}>
        <div class="flex-1 overflow-y-auto px-3 pb-3">
          <div class="flex items-center justify-between mb-2 px-2">
            <span class="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Базы знаний
            </span>
          </div>

          <Show when={kbs.loading}>
            <div class="space-y-2 px-2">
              <div class="h-8 bg-neutral-200 rounded-lg animate-pulse" />
              <div class="h-8 bg-neutral-200 rounded-lg animate-pulse" />
            </div>
          </Show>

          <Show when={kbs() && kbs()!.length === 0}>
            <p class="text-xs text-neutral-400 px-2">Нет баз знаний</p>
          </Show>

          <nav class="space-y-0.5">
            <For each={kbs()}>
              {(kb) => (
                <A
                  href={`/kb/${kb.id}`}
                  class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors truncate"
                  classList={{
                    "bg-orange-50 text-orange-700 font-medium": isActiveKb(kb.id),
                    "text-neutral-700 hover:bg-neutral-100": !isActiveKb(kb.id),
                  }}
                >
                  <svg
                    class="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span class="truncate">{kb.title}</span>
                </A>
              )}
            </For>
          </nav>
        </div>

        {/* Create button */}
        <div class="p-3 border-t border-neutral-200">
          <A
            href="/kb"
            class="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Создать
          </A>
        </div>
      </Show>
    </aside>
  );
};

export default Sidebar;
