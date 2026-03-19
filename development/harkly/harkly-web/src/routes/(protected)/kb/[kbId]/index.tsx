import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import { createResource, createSignal, Show, Switch, Match } from "solid-js";
import ProtectedLayout from "~/components/layout/ProtectedLayout";
import DocumentsTab from "~/components/kb/DocumentsTab";
import SchemaTab from "~/components/kb/SchemaTab";
import ExtractionsTab from "~/components/kb/ExtractionsTab";

interface KbDetail {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

type TabId = "documents" | "schema" | "extractions" | "canvas";

interface TabDef {
  id: TabId;
  label: string;
  icon: () => any;
}

const TABS: TabDef[] = [
  {
    id: "documents",
    label: "Документы",
    icon: () => (
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "schema",
    label: "Схема",
    icon: () => (
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    id: "extractions",
    label: "Извлечения",
    icon: () => (
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "canvas",
    label: "Канвас",
    icon: () => (
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
  },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KbDetailPage() {
  const params = useParams<{ kbId: string }>();
  const [activeTab, setActiveTab] = createSignal<TabId>("documents");

  const [kb] = createResource(
    () => params.kbId,
    async (kbId) => {
      const res = await fetch(`/api/kb`);
      if (!res.ok) return null;
      const json = (await res.json()) as { data: KbDetail[] };
      return json.data.find((k) => k.id === kbId) ?? null;
    },
  );

  return (
    <ProtectedLayout>
      <Title>{kb()?.title || "База знаний"} — Harkly</Title>

      <div class="max-w-5xl mx-auto px-6 py-8">
        {/* Loading */}
        <Show when={kb.loading}>
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        {/* KB header */}
        <Show when={kb()}>
          <div class="mb-6">
            <A
              href="/"
              class="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
            >
              <span>←</span> Все базы знаний
            </A>
            <div class="flex items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-bold text-neutral-900">
                  {kb()!.title}
                </h1>
                <Show when={kb()!.description}>
                  <p class="mt-1 text-neutral-600">{kb()!.description}</p>
                </Show>
                <p class="mt-2 text-sm text-neutral-400">
                  Обновлено: {formatDate(kb()!.updatedAt)}
                </p>
              </div>
              <A
                href={`/kb/${params.kbId}/canvas`}
                class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-sm shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5z" />
                </svg>
                Открыть канвас
              </A>
            </div>
          </div>

          {/* Tabs */}
          <div class="border-b border-neutral-200 mb-6">
            <nav class="flex gap-1 -mb-px">
              {TABS.map((tab) => (
                <button
                  onClick={() => {
                    if (tab.id === "canvas") {
                      window.location.href = `/kb/${params.kbId}/canvas`;
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2"
                  classList={{
                    "border-orange-500 text-orange-600 bg-orange-50/50":
                      activeTab() === tab.id,
                    "border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50":
                      activeTab() !== tab.id,
                  }}
                >
                  {tab.icon()}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <Switch>
              <Match when={activeTab() === "documents"}>
                <DocumentsTab kbId={params.kbId} />
              </Match>
              <Match when={activeTab() === "schema"}>
                <SchemaTab kbId={params.kbId} />
              </Match>
              <Match when={activeTab() === "extractions"}>
                <ExtractionsTab kbId={params.kbId} />
              </Match>
            </Switch>
          </div>
        </Show>
      </div>
    </ProtectedLayout>
  );
}
