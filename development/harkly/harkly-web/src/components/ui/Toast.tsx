import { Component, createSignal, For, onCleanup, Show } from "solid-js";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);

/** Add a toast notification. Auto-dismisses after 4 seconds. */
export function addToast(type: ToastItem["type"], message: string) {
  const id = Math.random().toString(36).substr(2, 9);
  setToasts((prev) => [...prev, { id, type, message }]);

  setTimeout(() => {
    dismissToast(id);
  }, 4000);
}

/** Dismiss a toast by ID. */
export function dismissToast(id: string) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

function toastBg(type: ToastItem["type"]): string {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200 text-green-800";
    case "error":
      return "bg-red-50 border-red-200 text-red-800";
    case "info":
      return "bg-blue-50 border-blue-200 text-blue-800";
  }
}

function toastIcon(type: ToastItem["type"]) {
  switch (type) {
    case "success":
      return (
        <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "error":
      return (
        <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case "info":
      return (
        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

const ToastContainer: Component = () => {
  return (
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <For each={toasts()}>
        {(toast) => (
          <div
            class={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-md transition-all animate-slide-in ${toastBg(toast.type)}`}
          >
            {toastIcon(toast.type)}
            <span class="text-sm font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              class="text-current opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </For>
    </div>
  );
};

export default ToastContainer;
