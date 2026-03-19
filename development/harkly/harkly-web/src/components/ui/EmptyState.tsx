import { Component, Show } from "solid-js";
import type { JSX } from "solid-js";

interface EmptyStateProps {
  icon?: JSX.Element;
  title: string;
  description?: string;
  action?: JSX.Element;
}

/** Empty state component with icon, title, description, and optional action. */
const EmptyState: Component<EmptyStateProps> = (props) => {
  return (
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Show when={props.icon}>
        <div class="mb-4 text-neutral-300">{props.icon}</div>
      </Show>
      <h3 class="text-lg font-semibold text-neutral-900 mb-2">
        {props.title}
      </h3>
      <Show when={props.description}>
        <p class="text-neutral-600 mb-6 max-w-sm">{props.description}</p>
      </Show>
      <Show when={props.action}>{props.action}</Show>
    </div>
  );
};

export const DocumentsIcon = () => (
  <svg
    class="w-16 h-16"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

export const SchemaIcon = () => (
  <svg
    class="w-16 h-16"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>
);

export const ExtractionsIcon = () => (
  <svg
    class="w-16 h-16"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

export default EmptyState;
