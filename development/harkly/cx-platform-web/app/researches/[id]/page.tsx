"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { listSignals, type Signal } from "@/lib/api";

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limit = 20;

  async function load(p: number) {
    setError(null);
    try {
      const data = await listSignals(id, p, limit);
      setSignals(data.signals);
      setTotal(data.total);
      setPage(data.page);
      // Stop polling once we have data
      if (data.total > 0 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // Auto-poll every 3 seconds for up to 120 seconds
    let elapsed = 0;
    pollRef.current = setInterval(() => {
      elapsed += 3;
      if (elapsed >= 120) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        return;
      }
      load(1);
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const isPolling = pollRef.current !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
              ← Researches
            </Link>
          </div>
          <h1 className="text-xl font-bold">Signals</h1>
          <p className="text-white/40 text-xs mt-0.5 font-mono">{id}</p>
        </div>
        <div className="flex items-center gap-3">
          {isPolling && total === 0 && (
            <span className="text-yellow-400 text-xs font-mono animate-pulse">
              ● Collecting…
            </span>
          )}
          <span className="text-white/50 text-sm">{total} signals</span>
          <Link
            href={`/researches/${id}/analytics`}
            className="text-sm border border-white/20 rounded px-3 py-1 hover:border-[#f2b90d] hover:text-[#f2b90d] transition-colors"
          >
            Analytics
          </Link>
          <button
            onClick={() => load(page)}
            className="text-sm border border-white/20 rounded px-3 py-1 hover:border-[#f2b90d] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : signals.length === 0 ? (
        <div className="border border-white/10 rounded p-8 text-center">
          {isPolling ? (
            <p className="text-yellow-400/70 text-sm animate-pulse">
              Collecting signals from Steam… page will update automatically.
            </p>
          ) : (
            <p className="text-white/40 text-sm">
              No signals yet. Click Refresh to check again.
            </p>
          )}
        </div>
      ) : (
        <>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-white/40 text-left border-b border-white/10">
                <th className="pb-2 pr-4 font-normal w-28">Source</th>
                <th className="pb-2 pr-4 font-normal w-32">Author</th>
                <th className="pb-2 pr-4 font-normal">Content</th>
                <th className="pb-2 font-normal w-36 text-right">Collected</th>
              </tr>
            </thead>
              <tbody>
              {signals.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-white/5 hover:bg-white/3"
                >
                  <td className="py-2 pr-4 text-[#f2b90d] font-mono text-xs">
                    <span className="mr-2">{s.source_type}</span>
                    <SentimentBadge sentiment={s.sentiment} />
                  </td>
                  <td className="py-2 pr-4 text-white/60 truncate max-w-[8rem]">
                    {s.author ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-white/80">
                    <span title={s.content}>
                      {s.content.length > 120
                        ? s.content.slice(0, 120) + "…"
                        : s.content}
                    </span>
                  </td>
                  <td className="py-2 text-white/40 text-xs text-right whitespace-nowrap">
                    {new Date(s.collected_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="text-sm border border-white/20 rounded px-3 py-1 disabled:opacity-30 hover:border-white/40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-white/40 text-sm">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => load(page + 1)}
              disabled={page >= totalPages}
              className="text-sm border border-white/20 rounded px-3 py-1 disabled:opacity-30 hover:border-white/40 transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: number | null }) {
  if (sentiment === null || sentiment === undefined || (sentiment > -0.1 && sentiment < 0.1)) {
    return <span className="text-white/30">~</span>;
  }
  if (sentiment > 0.1) {
    return <span className="text-green-400">+</span>;
  }
  return <span className="text-red-400">−</span>;
}
