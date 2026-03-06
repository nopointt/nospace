# Analytics Screen Task

## Your role
You are the Player. Write ALL files exactly as shown. Execute all shell steps. Report results.

Working dirs:
- Rust: C:/Users/noadmin/nospace/development/harkly/cx-platform/
- Next.js: C:/Users/noadmin/nospace/development/harkly/cx-platform-web/

---

## STEP 1: Add analytics endpoint to Rust routes

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
        .route("/researches/:id/analytics", get(researches::get_analytics))
        .with_state(pool)
}
```

### 1b: Append analytics handler to src/api/routes/researches.rs

APPEND the following code at the END of file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/routes/researches.rs (after the last closing brace):

```rust

#[derive(Serialize)]
pub struct ByDateRow {
    pub date: String,
    pub count: i64,
}

#[derive(Serialize)]
pub struct AuthorRow {
    pub author: String,
    pub count: i64,
}

#[derive(Serialize)]
pub struct SourceRow {
    pub source_type: String,
    pub count: i64,
}

#[derive(Serialize)]
pub struct AnalyticsResponse {
    pub total: i64,
    pub by_date: Vec<ByDateRow>,
    pub top_authors: Vec<AuthorRow>,
    pub source_breakdown: Vec<SourceRow>,
}

pub async fn get_analytics(
    State(pool): State<PgPool>,
    Extension(tenant): Extension<TenantContext>,
    Path(research_id): Path<Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let tenant_id = tenant.tenant_id;

    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM signals WHERE tenant_id = $1 AND research_id = $2",
    )
    .bind(tenant_id)
    .bind(research_id)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let by_date_rows = sqlx::query_as::<_, (String, i64)>(
        r#"SELECT TO_CHAR(DATE(collected_at), 'YYYY-MM-DD') as date, COUNT(*) as count
           FROM signals
           WHERE tenant_id = $1 AND research_id = $2
           GROUP BY DATE(collected_at)
           ORDER BY DATE(collected_at) ASC"#,
    )
    .bind(tenant_id)
    .bind(research_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let top_author_rows = sqlx::query_as::<_, (String, i64)>(
        r#"SELECT COALESCE(author, 'Unknown') as author, COUNT(*) as count
           FROM signals
           WHERE tenant_id = $1 AND research_id = $2
           GROUP BY author
           ORDER BY count DESC
           LIMIT 10"#,
    )
    .bind(tenant_id)
    .bind(research_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let source_rows = sqlx::query_as::<_, (String, i64)>(
        r#"SELECT source_type, COUNT(*) as count
           FROM signals
           WHERE tenant_id = $1 AND research_id = $2
           GROUP BY source_type
           ORDER BY count DESC"#,
    )
    .bind(tenant_id)
    .bind(research_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AnalyticsResponse {
        total,
        by_date: by_date_rows
            .into_iter()
            .map(|(date, count)| ByDateRow { date, count })
            .collect(),
        top_authors: top_author_rows
            .into_iter()
            .map(|(author, count)| AuthorRow { author, count })
            .collect(),
        source_breakdown: source_rows
            .into_iter()
            .map(|(source_type, count)| SourceRow { source_type, count })
            .collect(),
    }))
}
```

---

## STEP 2: Verify Rust compiles

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo check 2>&1 | tail -5
```
Expected: `Finished` with 0 errors.

---

## STEP 3: Add getAnalytics to lib/api.ts

APPEND the following at the END of file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/lib/api.ts:

```ts

export interface AnalyticsResponse {
  total: number;
  by_date: { date: string; count: number }[];
  top_authors: { author: string; count: number }[];
  source_breakdown: { source_type: string; count: number }[];
}

export async function getAnalytics(researchId: string): Promise<AnalyticsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/analytics`,
    { headers }
  );
  if (!res.ok) throw new Error(`GET /analytics failed: ${res.status}`);
  return res.json();
}
```

---

## STEP 4: Create analytics page

Create directory:
```
mkdir -p "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]/analytics"
```

Write file "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]/analytics/page.tsx":

```tsx
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
```

---

## STEP 5: Add Analytics link to signals page

In file "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]/page.tsx",
find the line that contains:
```
          <button
            onClick={() => load(page)}
```
Replace it with:
```
          <Link
            href={`/researches/${id}/analytics`}
            className="text-sm border border-white/20 rounded px-3 py-1 hover:border-[#f2b90d] hover:text-[#f2b90d] transition-colors"
          >
            Analytics
          </Link>
          <button
            onClick={() => load(page)}
```

Also make sure `Link` is imported at the top of the file. The file already has `import Link from "next/link";` — no change needed there.

---

## STEP 6: Type-check

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npx tsc --noEmit 2>&1 | tail -10
```
Expected: exit code 0.

---

## REPORT:
- Step 2: cargo check result
- Step 6: tsc result
- List of modified/created files
