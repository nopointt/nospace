# Sources Tier 1 Task: Reddit + GOG Reviews

## Your role
You are the Player. Write ALL files exactly as shown. Execute all shell steps. Report results.

Working dirs:
- Rust: C:/Users/noadmin/nospace/development/harkly/cx-platform/
- Next.js: C:/Users/noadmin/nospace/development/harkly/cx-platform-web/

---

## STEP 1: Add GogReview to SourceType enum

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/domain/signal.rs:

```rust
use chrono::{DateTime, Utc};
use std::fmt;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SourceType {
    SteamReview,
    RedditPost,
    GogReview,
    WebScraping,
}

impl fmt::Display for SourceType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = match self {
            SourceType::SteamReview => "steam_review",
            SourceType::RedditPost => "reddit_post",
            SourceType::GogReview => "gog_review",
            SourceType::WebScraping => "web_scraping",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RawSignal {
    pub source_type: SourceType,
    pub source_url: Option<String>,
    pub content: String,
    pub author: Option<String>,
    pub metadata: serde_json::Value,
    pub collected_at: DateTime<Utc>,
}
```

---

## STEP 2: Create Reddit source

Write NEW file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/sources/reddit.rs:

```rust
use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct RedditListing {
    data: RedditListingData,
}

#[derive(Deserialize)]
struct RedditListingData {
    children: Vec<RedditChild>,
    after: Option<String>,
}

#[derive(Deserialize)]
struct RedditChild {
    data: RedditPost,
}

#[derive(Deserialize)]
struct RedditPost {
    id: String,
    title: String,
    selftext: String,
    author: String,
    created_utc: f64,
    subreddit: String,
    permalink: String,
    url: String,
}

pub struct RedditSource {
    pub query: String,
    client: Client,
}

impl RedditSource {
    pub fn new(query: &str) -> Self {
        let client = Client::builder()
            .user_agent("harkly-cx-platform/0.1 (research tool)")
            .build()
            .unwrap_or_default();
        RedditSource {
            query: query.to_string(),
            client,
        }
    }
}

#[async_trait::async_trait]
impl OsintSource for RedditSource {
    fn name(&self) -> &str {
        "reddit"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut after: Option<String> = None;

        while signals.len() < limit {
            let mut url = format!(
                "https://www.reddit.com/search.json?q={}&sort=new&limit=100&type=link",
                urlencoding::encode(&self.query)
            );
            if let Some(ref cursor) = after {
                url.push_str(&format!("&after={}", cursor));
            }

            let resp = self.client
                .get(&url)
                .send()
                .await?
                .json::<RedditListing>()
                .await?;

            if resp.data.children.is_empty() {
                break;
            }

            let next_after = resp.data.after.clone();

            for child in resp.data.children {
                if signals.len() >= limit {
                    break;
                }
                let post = child.data;
                let content = if post.selftext.trim().is_empty() {
                    post.title.clone()
                } else {
                    format!("{}\n\n{}", post.title, post.selftext)
                };
                let collected_at = DateTime::from_timestamp(post.created_utc as i64, 0)
                    .unwrap_or_else(chrono::Utc::now);
                signals.push(RawSignal {
                    source_type: SourceType::RedditPost,
                    source_url: Some(format!("https://reddit.com{}", post.permalink)),
                    content,
                    author: Some(post.author),
                    metadata: serde_json::json!({
                        "id": post.id,
                        "subreddit": post.subreddit,
                        "url": post.url
                    }),
                    collected_at,
                });
            }

            match next_after {
                Some(cursor) => after = Some(cursor),
                None => break,
            }
            sleep(Duration::from_millis(500)).await;
        }

        Ok(signals)
    }
}
```

---

## STEP 3: Create GOG source

Write NEW file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/sources/gog.rs:

```rust
use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct GogReviewsResponse {
    items: Vec<GogReviewItem>,
    #[serde(default)]
    pages: u32,
}

#[derive(Deserialize)]
struct GogReviewItem {
    id: String,
    title: Option<String>,
    description: String,
    rating: Option<u32>,
    date: String,
    author: GogAuthor,
}

#[derive(Deserialize)]
struct GogAuthor {
    username: String,
}

pub struct GogSource {
    pub product_id: u32,
    client: Client,
}

impl GogSource {
    pub fn new(product_id: u32) -> Self {
        GogSource {
            product_id,
            client: Client::new(),
        }
    }
}

#[async_trait::async_trait]
impl OsintSource for GogSource {
    fn name(&self) -> &str {
        "gog"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut page = 1u32;

        loop {
            let url = format!(
                "https://reviews.gog.com/v1/products/{}/reviews?order=date:desc&limit=100&page={}",
                self.product_id, page
            );

            let resp = self.client
                .get(&url)
                .send()
                .await?
                .json::<GogReviewsResponse>()
                .await?;

            if resp.items.is_empty() {
                break;
            }

            for item in resp.items {
                if signals.len() >= limit {
                    break;
                }
                let content = match &item.title {
                    Some(t) if !t.is_empty() => format!("{}\n\n{}", t, item.description),
                    _ => item.description.clone(),
                };
                let collected_at = DateTime::parse_from_rfc3339(&item.date)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());
                signals.push(RawSignal {
                    source_type: SourceType::GogReview,
                    source_url: Some(format!(
                        "https://www.gog.com/game/{}", self.product_id
                    )),
                    content,
                    author: Some(item.author.username),
                    metadata: serde_json::json!({
                        "id": item.id,
                        "rating": item.rating
                    }),
                    collected_at,
                });
            }

            if signals.len() >= limit || page >= resp.pages.max(1) {
                break;
            }
            page += 1;
            sleep(Duration::from_millis(500)).await;
        }

        Ok(signals)
    }
}
```

---

## STEP 4: Update sources/mod.rs

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/sources/mod.rs:

```rust
use crate::domain::signal::RawSignal;
pub mod steam;
pub mod reddit;
pub mod gog;

#[async_trait::async_trait]
pub trait OsintSource: Send + Sync {
    async fn fetch(&self, limit: usize) -> anyhow::Result<Vec<RawSignal>>;
    fn name(&self) -> &str;
}
```

---

## STEP 5: Update create_research handler

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/routes/researches.rs:

```rust
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::tenant::TenantContext;
use crate::sources::{OsintSource, steam::SteamSource, reddit::RedditSource, gog::GogSource};
use crate::etl::{validate, normalize, batch_insert};
use crate::config;

#[derive(Deserialize)]
pub struct CreateResearchRequest {
    pub name: String,
    pub appid: u32,
    #[serde(default = "default_limit")]
    pub limit: usize,
    /// Optional: Reddit search query (e.g. "Taxi Life game")
    pub reddit_query: Option<String>,
    /// Optional: GOG product ID for reviews
    pub gog_product_id: Option<u32>,
}

fn default_limit() -> usize { 500 }

#[derive(Serialize)]
pub struct CreateResearchResponse {
    pub id: Uuid,
    pub state: String,
}

#[derive(Deserialize)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_page_size")]
    pub limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_page_size() -> i64 { 20 }

#[derive(Serialize)]
pub struct SignalRow {
    pub id: Uuid,
    pub source_type: String,
    pub source_url: Option<String>,
    pub content: String,
    pub author: Option<String>,
    pub collected_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize)]
pub struct ListSignalsResponse {
    pub signals: Vec<SignalRow>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
}

pub async fn create_research(
    State(pool): State<PgPool>,
    Extension(tenant): Extension<TenantContext>,
    Json(body): Json<CreateResearchRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let tenant_id = tenant.tenant_id;

    let research_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO researches (id, tenant_id, name, state, source_config)
           VALUES (gen_random_uuid(), $1, $2, 'CollectingOSINT', '{}')
           RETURNING id"#,
    )
    .bind(tenant_id)
    .bind(&body.name)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Collect sources list
    let pool_clone = pool.clone();
    let appid = body.appid;
    let limit = body.limit;
    let reddit_query = body.reddit_query.clone();
    let gog_product_id = body.gog_product_id;

    tokio::spawn(async move {
        let cfg = match config::load() {
            Ok(c) => c,
            Err(_) => return,
        };

        // Per-source limit: split evenly among active sources
        let source_count = 1
            + if reddit_query.is_some() { 1 } else { 0 }
            + if gog_product_id.is_some() { 1 } else { 0 };
        let per_source = (limit / source_count).max(50);

        let mut all_raw = Vec::new();

        // Steam (always)
        let steam = SteamSource::new(appid, &cfg.steam_base_url);
        if let Ok(raw) = steam.fetch(per_source).await {
            all_raw.extend(raw);
        }

        // Reddit (optional)
        if let Some(ref query) = reddit_query {
            let reddit = RedditSource::new(query);
            if let Ok(raw) = reddit.fetch(per_source).await {
                all_raw.extend(raw);
            }
        }

        // GOG (optional)
        if let Some(product_id) = gog_product_id {
            let gog = GogSource::new(product_id);
            if let Ok(raw) = gog.fetch(per_source).await {
                all_raw.extend(raw);
            }
        }

        let valid: Vec<_> = all_raw
            .into_iter()
            .filter_map(|s| {
                let n = normalize(s);
                validate(&n).ok().map(|_| n)
            })
            .collect();

        let _ = batch_insert(&pool_clone, tenant_id, research_id, valid).await;

        let _ = sqlx::query(
            "UPDATE researches SET state = 'ReadyForSampling' WHERE id = $1",
        )
        .bind(research_id)
        .execute(&pool_clone)
        .await;
    });

    Ok((
        StatusCode::CREATED,
        Json(CreateResearchResponse {
            id: research_id,
            state: "CollectingOSINT".to_string(),
        }),
    ))
}

pub async fn list_signals(
    State(pool): State<PgPool>,
    Extension(tenant): Extension<TenantContext>,
    Path(research_id): Path<Uuid>,
    Query(params): Query<PaginationParams>,
) -> Result<impl IntoResponse, StatusCode> {
    let tenant_id = tenant.tenant_id;
    let offset = (params.page - 1) * params.limit;

    let total: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM signals WHERE tenant_id = $1 AND research_id = $2",
    )
    .bind(tenant_id)
    .bind(research_id)
    .fetch_one(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let rows = sqlx::query_as::<_, (Uuid, String, Option<String>, String, Option<String>, chrono::DateTime<chrono::Utc>)>(
        r#"SELECT id, source_type, source_url, content, author, collected_at
           FROM signals
           WHERE tenant_id = $1 AND research_id = $2
           ORDER BY collected_at DESC
           LIMIT $3 OFFSET $4"#,
    )
    .bind(tenant_id)
    .bind(research_id)
    .bind(params.limit)
    .bind(offset)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let signals = rows
        .into_iter()
        .map(|(id, source_type, source_url, content, author, collected_at)| SignalRow {
            id,
            source_type,
            source_url,
            content,
            author,
            collected_at,
        })
        .collect();

    Ok(Json(ListSignalsResponse {
        signals,
        total,
        page: params.page,
        limit: params.limit,
    }))
}

pub async fn list_researches(
    State(pool): State<PgPool>,
    Extension(tenant): Extension<TenantContext>,
) -> Result<impl IntoResponse, StatusCode> {
    let tenant_id = tenant.tenant_id;

    let rows = sqlx::query_as::<_, (Uuid, String, String, chrono::DateTime<chrono::Utc>, i64)>(
        r#"SELECT r.id, r.name, r.state, r.created_at,
                  COUNT(s.id) as signal_count
           FROM researches r
           LEFT JOIN signals s ON s.research_id = r.id AND s.tenant_id = r.tenant_id
           WHERE r.tenant_id = $1
           GROUP BY r.id, r.name, r.state, r.created_at
           ORDER BY r.created_at DESC"#,
    )
    .bind(tenant_id)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    #[derive(Serialize)]
    struct ResearchRow {
        id: Uuid,
        name: String,
        state: String,
        created_at: chrono::DateTime<chrono::Utc>,
        signal_count: i64,
    }

    let researches: Vec<ResearchRow> = rows
        .into_iter()
        .map(|(id, name, state, created_at, signal_count)| ResearchRow {
            id,
            name,
            state,
            created_at,
            signal_count,
        })
        .collect();

    Ok(Json(researches))
}

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

## STEP 6: Verify Rust compiles

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo check 2>&1 | tail -5
```
Expected: `Finished` with 0 errors.

---

## STEP 7: Update lib/api.ts — add reddit_query and gog_product_id to CreateResearchRequest

In file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/lib/api.ts,
find:
```
export interface CreateResearchRequest {
  name: string;
  appid: number;
  limit: number;
}
```
Replace with:
```
export interface CreateResearchRequest {
  name: string;
  appid: number;
  limit: number;
  reddit_query?: string;
  gog_product_id?: number;
}
```

---

## STEP 8: Update app/researches/new/page.tsx — add Reddit and GOG fields

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/researches/new/page.tsx:

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
```

---

## STEP 9: Type-check Next.js

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npx tsc --noEmit 2>&1 | tail -10
```
Expected: exit code 0.

---

## REPORT:
- Step 6: cargo check result
- Step 9: tsc result
- List of modified/created files
