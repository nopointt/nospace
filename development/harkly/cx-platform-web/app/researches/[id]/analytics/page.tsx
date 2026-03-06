"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAnalytics, listSignals, type AnalyticsResponse } from "@/lib/api";

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleExportCsv() {
    // Fetch all signals and export as CSV
    const allSignals: Array<{
      id: string;
      source_type: string;
      source_url: string | null;
      content: string;
      author: string | null;
      collected_at: string;
    }> = [];
    let page = 1;
    while (true) {
      const res = await listSignals(id, page, 100);
      allSignals.push(...res.signals);
      if (allSignals.length >= res.total || res.signals.length === 0) break;
      page++;
    }
    const header = "id,source_type,author,collected_at,content\n";
    const rows = allSignals
      .map(
        (s) =>
          `${s.id},${s.source_type},"${(s.author ?? "").replace(/"/g, '""')}","${s.collected_at}","${s.content.replace(/"/g, '""').replace(/\n/g, " ")}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signals-${id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              Researches
            </Link>
            <span className="text-white/20">/</span>
            <Link href={`/researches/${id}`} className="text-white/40 hover:text-white transition-colors">
              Signals
            </Link>
            <span className="text-white/20">/</span>
            <span>Analytics</span>
          </div>
          <h1 className="text-xl font-bold">Analytics</h1>
        </div>
        <button
          onClick={handleExportCsv}
          className="text-sm border border-white/20 rounded px-4 py-1.5 hover:border-[#f2b90d] hover:text-[#f2b90d] transition-colors"
        >
          Export CSV
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <p className="text-white/40 text-sm">Loading…</p>}

      {data && (
        <div className="space-y-8">
          {/* Total */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Signals" value={data.total} />
            <StatCard label="Sources" value={data.source_breakdown.length} />
            <StatCard label="Unique Authors" value={data.top_authors.length} />
          </div>

          {/* Signals over time */}
          {data.by_date.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Signals Over Time
              </h2>
              <BarChart rows={data.by_date} />
            </section>
          )}

          <div className="grid grid-cols-2 gap-8">
            {/* Source breakdown */}
            <section>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Source Breakdown
              </h2>
              <div className="space-y-2">
                {data.source_breakdown.map((s) => (
                  <div key={s.source_type} className="flex items-center gap-3">
                    <span className="text-[#f2b90d] font-mono text-xs w-32 truncate">
                      {s.source_type}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-full bg-[#f2b90d]/60 rounded"
                        style={{
                          width: `${Math.round((s.count / data.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-8 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Top authors */}
            <section>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Top Authors
              </h2>
              <div className="space-y-2">
                {data.top_authors.slice(0, 8).map((a, i) => (
                  <div key={a.author} className="flex items-center gap-3">
                    <span className="text-white/20 text-xs w-4">{i + 1}</span>
                    <span className="text-white/70 text-sm flex-1 truncate">
                      {a.author}
                    </span>
                    <span className="text-white/40 text-xs">{a.count}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sentiment Distribution */}
          {data.sentiment && (
            <section>
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                Sentiment Distribution
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <SentimentCard
                  label="Positive"
                  count={data.sentiment.positive}
                  total={data.total}
                  color="green"
                />
                <SentimentCard
                  label="Neutral"
                  count={data.sentiment.neutral}
                  total={data.total}
                  color="gray"
                />
                <SentimentCard
                  label="Negative"
                  count={data.sentiment.negative}
                  total={data.total}
                  color="red"
                />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-white/10 rounded p-4">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#f2b90d]">{value}</p>
    </div>
  );
}

function BarChart({ rows }: { rows: { date: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count));
  const HEIGHT = 80;

  return (
    <div className="border border-white/10 rounded p-4">
      <div className="flex items-end gap-1 h-20 overflow-x-auto">
        {rows.map((r) => {
          const h = max > 0 ? Math.max(4, Math.round((r.count / max) * HEIGHT)) : 4;
          return (
            <div
              key={r.date}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              title={`${r.date}: ${r.count} signals`}
            >
              <div
                className="bg-[#f2b90d]/70 rounded-sm w-6 hover:bg-[#f2b90d] transition-colors"
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      {rows.length <= 14 && (
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {rows.map((r) => (
            <div key={r.date} className="flex-shrink-0 w-6 text-center">
              <span className="text-white/20 text-[9px]">
                {r.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentCard({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "green" | "gray" | "red";
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const colorClasses = {
    green: "border-green-500/30 bg-green-500/10 text-green-400",
    gray: "border-white/20 bg-white/5 text-white/60",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  return (
    <div className={`border rounded p-4 ${colorClasses[color]}`}>
      <p className="text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs opacity-60">{pct}%</p>
    </div>
  );
}
