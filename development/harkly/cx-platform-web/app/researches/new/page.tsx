"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createResearch } from "@/lib/api";

export default function NewResearchPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [appid, setAppid] = useState("");
  const [limit, setLimit] = useState("500");
  const [redditQuery, setRedditQuery] = useState("");
  const [gogProductId, setGogProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createResearch({
        name,
        appid: parseInt(appid),
        limit: parseInt(limit),
        reddit_query: redditQuery.trim() || undefined,
        gog_product_id: gogProductId.trim() ? parseInt(gogProductId) : undefined,
      });
      router.push(`/researches/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="text-white/40 hover:text-white transition-colors">
          Researches
        </Link>
        <span className="text-white/20">/</span>
        <span>New</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">New Research</h1>
      <p className="text-white/50 text-sm mb-8">
        Collect OSINT signals from multiple sources
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">Research Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Taxi Life Q1 2026"
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
          />
        </div>

        <div className="border border-white/10 rounded p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Steam</p>
          <div>
            <label className="block text-sm text-white/60 mb-1">Steam App ID</label>
            <input
              type="number"
              value={appid}
              onChange={(e) => setAppid(e.target.value)}
              required
              placeholder="e.g. 1351240"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Signal Limit (total)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              min={1}
              max={5000}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>
        </div>

        <div className="border border-white/10 rounded p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Reddit <span className="text-white/20 normal-case font-normal">(optional)</span></p>
          <div>
            <label className="block text-sm text-white/60 mb-1">Search Query</label>
            <input
              type="text"
              value={redditQuery}
              onChange={(e) => setRedditQuery(e.target.value)}
              placeholder="e.g. Taxi Life game review"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>
        </div>

        <div className="border border-white/10 rounded p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">GOG <span className="text-white/20 normal-case font-normal">(optional)</span></p>
          <div>
            <label className="block text-sm text-white/60 mb-1">GOG Product ID</label>
            <input
              type="number"
              value={gogProductId}
              onChange={(e) => setGogProductId(e.target.value)}
              placeholder="e.g. 1234567890"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#f2b90d] text-black font-semibold py-2 px-6 rounded hover:bg-[#f2b90d]/80 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating…" : "Start Collection"}
        </button>
      </form>
    </div>
  );
}
