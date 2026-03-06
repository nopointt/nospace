# Demo Build Task: Dashboard + Auto-poll + One-command Start

## Your role
You are the Player. Write ALL files exactly as shown. Execute all shell steps. Report results.

Working dirs:
- Rust: C:/Users/noadmin/nospace/development/harkly/cx-platform/
- Next.js: C:/Users/noadmin/nospace/development/harkly/cx-platform-web/

---

## STEP 1: Add GET /api/v1/researches to Rust API

### 1a: Edit src/api/routes/mod.rs

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/routes/mod.rs:

```rust
use axum::{
    Router,
    routing::{get, post},
};
use sqlx::PgPool;

mod researches;

pub fn router(pool: PgPool) -> Router {
    Router::new()
        .route("/researches", get(researches::list_researches))
        .route("/researches", post(researches::create_research))
        .route("/researches/:id/signals", get(researches::list_signals))
        .with_state(pool)
}
```

### 1b: Add list_researches handler to src/api/routes/researches.rs

APPEND this code at the END of the file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/routes/researches.rs (after the last closing brace):

```rust

#[derive(Serialize)]
pub struct ResearchRow {
    pub id: Uuid,
    pub name: String,
    pub state: String,
    pub signal_count: i64,
}

pub async fn list_researches(
    State(pool): State<PgPool>,
    Extension(tenant): Extension<TenantContext>,
) -> Result<impl IntoResponse, StatusCode> {
    let rows = sqlx::query_as::<_, (Uuid, String, String, i64)>(
        r#"SELECT r.id, r.name, r.state, COUNT(s.id) as signal_count
           FROM researches r
           LEFT JOIN signals s ON s.research_id = r.id AND s.tenant_id = r.tenant_id
           WHERE r.tenant_id = $1
           GROUP BY r.id, r.name, r.state"#,
    )
    .bind(tenant.tenant_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let researches: Vec<ResearchRow> = rows
        .into_iter()
        .map(|(id, name, state, signal_count)| ResearchRow {
            id,
            name,
            state,
            signal_count,
        })
        .collect();

    Ok(Json(researches))
}
```

---

## STEP 2: Verify Rust compiles

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo check 2>&1 | tail -5
```
Expected: `Finished` with 0 errors.

---

## STEP 3: Update lib/api.ts — add listResearches

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/lib/api.ts:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-ID": TENANT_ID,
};

export interface Research {
  id: string;
  name: string;
  state: string;
  signal_count: number;
}

export interface CreateResearchRequest {
  name: string;
  appid: number;
  limit: number;
}

export interface CreateResearchResponse {
  id: string;
  state: string;
}

export interface Signal {
  id: string;
  source_type: string;
  source_url: string | null;
  content: string;
  author: string | null;
  collected_at: string;
}

export interface ListSignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  limit: number;
}

export async function listResearches(): Promise<Research[]> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, { headers });
  if (!res.ok) throw new Error(`GET /researches failed: ${res.status}`);
  return res.json();
}

export async function createResearch(
  body: CreateResearchRequest
): Promise<CreateResearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /researches failed: ${res.status}`);
  return res.json();
}

export async function listSignals(
  researchId: string,
  page = 1,
  limit = 20
): Promise<ListSignalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/signals?page=${page}&limit=${limit}`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET /signals failed: ${res.status}`);
  return res.json();
}
```

---

## STEP 4: Replace app/page.tsx — dashboard

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/page.tsx:

```tsx
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
```

---

## STEP 5: Create app/researches/new/ directory and page

Create directory:
```
mkdir -p "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/new"
```

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/new/page.tsx:

```tsx
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
      });
      router.push(`/researches/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Researches
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-sm">New Research</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">New Research</h1>
      <p className="text-white/50 text-sm mb-8">
        Collect OSINT signals from Steam reviews
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">
            Research Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Taxi Life Q1 2026"
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
          />
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">
            Steam App ID
          </label>
          <input
            type="number"
            value={appid}
            onChange={(e) => setAppid(e.target.value)}
            required
            placeholder="e.g. 1351240"
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
          />
          <p className="text-white/30 text-xs mt-1">
            Find at store.steampowered.com/app/XXXXXX
          </p>
        </div>

        <div>
          <label className="block text-sm text-white/60 mb-1">
            Signal Limit
          </label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            min={1}
            max={5000}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#f2b90d] text-black font-semibold py-2 px-6 rounded hover:bg-[#f2b90d]/80 disabled:opacity-50 transition-colors"
        >
          {loading ? "Starting collection…" : "Start Collection"}
        </button>
      </form>
    </div>
  );
}
```

---

## STEP 6: Update app/researches/[id]/page.tsx — add auto-poll

Replace ENTIRE file "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]/page.tsx":

```tsx
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
                    {s.source_type}
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
```

---

## STEP 7: Create start-demo.ps1 in cx-platform-web/

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/start-demo.ps1:

```powershell
# Start Harkly CX Platform Demo
# Runs Rust API on :3000 + Next.js on :3001

$RustDir = "$PSScriptRoot/../cx-platform"
$WebDir = $PSScriptRoot

Write-Host "Starting Rust API on http://localhost:3000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RustDir'; cargo run -- serve --port 3000"

Write-Host "Waiting 8 seconds for API to start..."
Start-Sleep -Seconds 8

Write-Host "Starting Next.js on http://localhost:3001 ..."
Write-Host ""
Write-Host "Demo ready at: http://localhost:3001"
Write-Host ""

Set-Location $WebDir
npm run dev
```

---

## STEP 8: Type-check Next.js

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npx tsc --noEmit 2>&1 | tail -10
```
Expected: exit code 0, no errors.

---

## REPORT:
- Step 2: cargo check result
- Step 8: tsc result
- List of all modified/created files
