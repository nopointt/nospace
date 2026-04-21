import { createSignal, onCleanup } from "solid-js";
import { apiBase } from "./api";
import { getToken } from "./auth";

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

  const connect = () => {
    if (closed) return;
    const token = getToken();
    if (!token) return;
    const url = `${apiBase()}/api/live/stream?replay=${replay}&token=${encodeURIComponent(token)}`;
    es = new EventSource(url);
    es.onopen = () => {
      setConnected(true);
      retry = 1000;
    };
    es.onmessage = (e) => handle(e);
    // Caddy/SSE may use typed events
    ["trade", "price_update", "runner_state", "halt_changed", "journal"].forEach((ev) => {
      es?.addEventListener(ev, handle as EventListener);
    });
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

  const handle = (e: MessageEvent) => {
    try {
      const payload = JSON.parse(e.data) as StreamEvent;
      setEvents((prev) => [payload, ...prev].slice(0, maxBuffer));
    } catch {
      // ignore heartbeats / malformed
    }
  };

  connect();
  onCleanup(() => {
    closed = true;
    es?.close();
  });

  return { events, connected };
}
