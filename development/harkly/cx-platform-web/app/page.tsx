"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listResearches, type Research } from "@/lib/api";

export default function HomePage() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listResearches()
      .then(setResearches)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Researches</h1>
          <p className="text-white/40 text-sm mt-0.5">
            OSINT signal collection
          </p>
        </div>
        <Link
          href="/researches/new"
          className="bg-[#f2b90d] text-black font-semibold py-2 px-5 rounded hover:bg-[#f2b90d]/80 transition-colors text-sm"
        >
          + New Research
        </Link>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : researches.length === 0 ? (
        <div className="border border-white/10 rounded p-12 text-center">
          <p className="text-white/40 text-sm mb-4">No researches yet.</p>
          <Link
            href="/researches/new"
            className="text-[#f2b90d] text-sm hover:underline"
          >
            Create your first research →
          </Link>
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-white/40 text-left border-b border-white/10">
              <th className="pb-2 pr-4 font-normal">Name</th>
              <th className="pb-2 pr-4 font-normal w-28 text-right">Signals</th>
              <th className="pb-2 font-normal w-40">Status</th>
            </tr>
          </thead>
          <tbody>
            {researches.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/3"
              >
                <td className="py-3 pr-4">
                  <Link
                    href={`/researches/${r.id}`}
                    className="hover:text-[#f2b90d] transition-colors"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-right text-white/60 font-mono text-xs">
                  {r.signal_count}
                </td>
                <td className="py-3">
                  <StatusBadge state={r.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const map: Record<string, { label: string; color: string }> = {
    CollectingOSINT: { label: "Collecting…", color: "text-yellow-400" },
    ReadyForSampling: { label: "Ready", color: "text-green-400" },
    Draft: { label: "Draft", color: "text-white/40" },
  };
  const s = map[state] ?? { label: state, color: "text-white/40" };
  return (
    <span className={`text-xs font-mono ${s.color}`}>● {s.label}</span>
  );
}
