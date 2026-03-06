# Stage 4b Task: CORS patch + Minimal Next.js Web UI

Working directory for Rust: C:/Users/noadmin/nospace/development/harkly/cx-platform/
Working directory for Next.js: C:/Users/noadmin/nospace/development/harkly/cx-platform-web/

## Your role
You are the Player. Write ALL files exactly as shown. Execute all steps. No explanations.

---

## STEP 1: Patch src/api/mod.rs — add CORS layer

Replace the ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/mod.rs with:

```rust
use axum::{
    Router,
    middleware,
};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;

pub mod routes;
pub mod tenant;

pub fn build_router(pool: PgPool) -> Router {
    Router::new()
        .nest("/api/v1", routes::router(pool.clone()))
        .layer(middleware::from_fn_with_state(pool, tenant::extract_tenant))
        .layer(CorsLayer::permissive())
}
```

---

## STEP 2: Verify Rust still compiles

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo check 2>&1 | tail -3
```
Expected: `Finished` with 0 errors.

---

## STEP 3: Create cx-platform-web directory

```
mkdir -p C:/Users/noadmin/nospace/development/harkly/cx-platform-web
```

---

## STEP 4: Write package.json

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/package.json:

```json
{
  "name": "cx-platform-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "^18",
    "react-dom": "^18"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "postcss": "^8",
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

---

## STEP 5: Write tsconfig.json

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/tsconfig.json:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## STEP 6: Write tailwind.config.ts

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/tailwind.config.ts:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#f2b90d",
      },
    },
  },
  plugins: [],
};
export default config;
```

---

## STEP 7: Write postcss.config.js

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/postcss.config.js:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## STEP 8: Write next.config.ts

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/next.config.ts:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

---

## STEP 9: Write lib/api.ts

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/lib/api.ts:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const headers = {
  "Content-Type": "application/json",
  "X-Tenant-ID": TENANT_ID,
};

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

## STEP 10: Write app/globals.css

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/globals.css:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## STEP 11: Write app/layout.tsx

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/layout.tsx:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harkly CX Platform",
  description: "OSINT Research Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-white min-h-screen">
        <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
          <span className="text-[#f2b90d] font-bold text-lg tracking-tight">
            Harkly
          </span>
          <span className="text-white/40 text-sm">CX Platform</span>
        </header>
        <main className="px-6 py-8 max-w-4xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
```

---

## STEP 12: Write app/page.tsx

Write file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/page.tsx:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResearch } from "@/lib/api";

export default function HomePage() {
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
          {loading ? "Creating…" : "Start Collection"}
        </button>
      </form>
    </div>
  );
}
```

---

## STEP 13: Create directory app/researches/[id]/

```
mkdir -p "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]"
```

---

## STEP 14: Write app/researches/[id]/page.tsx

Write file "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/[id]/page.tsx":

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { listSignals, type Signal } from "@/lib/api";

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  async function load(p: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await listSignals(id, p, limit);
      setSignals(data.signals);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [id]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Research Signals</h1>
          <p className="text-white/40 text-xs mt-0.5 font-mono">{id}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm">{total} signals</span>
          <button
            onClick={() => load(page)}
            className="text-sm border border-white/20 rounded px-3 py-1 hover:border-[#f2b90d] transition-colors"
          >
            Refresh
          </button>
          <a
            href="/"
            className="text-sm text-[#f2b90d] hover:underline"
          >
            ← New research
          </a>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-white/40 text-sm">Loading…</p>
      ) : signals.length === 0 ? (
        <div className="border border-white/10 rounded p-8 text-center">
          <p className="text-white/40 text-sm">
            No signals yet. Collection may still be running — click Refresh in a moment.
          </p>
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

## STEP 15: Install dependencies

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npm install 2>&1 | tail -5
```

---

## STEP 16: Type-check

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npx tsc --noEmit 2>&1 | tail -10
```
Expected: no errors (or only next-env.d.ts not found — that's OK before first build).

---

## REPORT after all steps:
- Step 2: cargo check result
- Step 15: npm install result
- Step 16: tsc output
- List all files created in cx-platform-web/
