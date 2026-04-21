import { createSignal, onCleanup } from "solid-js";
import { apiBase } from "./api";

export type StreamEvent = {
  event: string;
  ts: number;
  data: Record<string, unknown>;
};

export function useLiveStream(opts: { replay?: number; maxBuffer?: number } = {}) {
  const replay = opts.replay ?? 50;
  const maxBuffer = opts.maxBuffer ?? 200;
  const [events, setEvents] = createSignal<StreamEvent[]>([]);
  const [connected, setConnected] = createSignal(false);

  let es: EventSource | null = null;
  let retry = 1000;
  let closed = false;

  const handle = (e: MessageEvent) => {
    try {
      const payload = JSON.parse(e.data) as StreamEvent;
      setEvents((prev) => [payload, ...prev].slice(0, maxBuffer));
    } catch {}
  };

  const connect = () => {
    if (closed) return;
    const url = `${apiBase()}/api/live/stream?replay=${replay}`;
    es = new EventSource(url);
    es.onopen = () => {
      setConnected(true);
      retry = 1000;
    };
    es.onmessage = handle;
    ["trade", "price_update", "runner_state", "halt_changed", "journal"].forEach((ev) =>
      es?.addEventListener(ev, handle as EventListener),
    );
    es.onerror = () => {
      setConnected(false);
      es?.close();
      es = null;
      if (!closed) {
        setTimeout(connect, Math.min(retry, 30000));
        retry = Math.min(retry * 2, 30000);
      }
    };
  };

  connect();
  onCleanup(() => {
    closed = true;
    es?.close();
  });

  return { events, connected };
}
