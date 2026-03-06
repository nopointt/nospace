# G3 Implementation Task — Round 2

You are implementing a Rust OSINT pipeline. Working directory: C:/Users/noadmin/nospace/development/harkly/cx-platform/

All scaffold files exist as empty stubs. Fill each with working code.

## STEP 1: Edit Cargo.toml — ADD these deps (keep existing):
```
thiserror = "1"
async-trait = "0.1"
regex = "1"
urlencoding = "2"
```

## STEP 2: src/config.rs
```rust
use uuid::Uuid;

pub struct Config {
    pub database_url: String,
    pub steam_base_url: String,
    pub log_level: String,
    pub default_tenant_id: Uuid,
}

pub fn load() -> anyhow::Result<Config> {
    dotenvy::dotenv().ok();
    Ok(Config {
        database_url: std::env::var("DATABASE_URL")?,
        steam_base_url: std::env::var("STEAM_BASE_URL")
            .unwrap_or_else(|_| "https://store.steampowered.com".to_string()),
        log_level: std::env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
        default_tenant_id: std::env::var("DEFAULT_TENANT_ID")
            .unwrap_or_else(|_| "00000000-0000-0000-0000-000000000001".to_string())
            .parse()?,
    })
}
```

## STEP 3: src/domain/tenant.rs
```rust
use uuid::Uuid;
use std::fmt;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct TenantId(pub Uuid);

impl fmt::Display for TenantId {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl From<Uuid> for TenantId {
    fn from(id: Uuid) -> Self {
        TenantId(id)
    }
}

#[derive(Debug, Clone)]
pub struct Tenant {
    pub id: TenantId,
    pub name: String,
    pub billing_tier: String,
}
```

## STEP 4: src/domain/research.rs
```rust
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::domain::tenant::TenantId;
use std::fmt;

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub enum ResearchState {
    Draft,
    ConfiguringSources,
    CollectingOSINT,
    ProcessingData,
    ReadyForSampling,
    Completed,
    Archived,
}

impl fmt::Display for ResearchState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = match self {
            ResearchState::Draft => "Draft",
            ResearchState::ConfiguringSources => "ConfiguringSources",
            ResearchState::CollectingOSINT => "CollectingOSINT",
            ResearchState::ProcessingData => "ProcessingData",
            ResearchState::ReadyForSampling => "ReadyForSampling",
            ResearchState::Completed => "Completed",
            ResearchState::Archived => "Archived",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Research {
    pub id: Uuid,
    pub tenant_id: TenantId,
    pub name: String,
    pub state: ResearchState,
    pub source_config: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

pub fn new_research(tenant_id: TenantId, name: String) -> Research {
    Research {
        id: Uuid::new_v4(),
        tenant_id,
        name,
        state: ResearchState::Draft,
        source_config: serde_json::Value::Object(Default::default()),
        created_at: Utc::now(),
    }
}
```

## STEP 5: src/domain/signal.rs
```rust
use chrono::{DateTime, Utc};
use std::fmt;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum SourceType {
    SteamReview,
    RedditPost,
    WebScraping,
}

impl fmt::Display for SourceType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let s = match self {
            SourceType::SteamReview => "steam_review",
            SourceType::RedditPost => "reddit_post",
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

## STEP 6: src/domain/mod.rs
```rust
pub mod tenant;
pub mod research;
pub mod signal;

pub use tenant::{Tenant, TenantId};
pub use research::{Research, ResearchState, new_research};
pub use signal::{RawSignal, SourceType};
```

## STEP 7: src/db/pool.rs
```rust
use sqlx::postgres::PgPoolOptions;

pub async fn create_pool(database_url: &str) -> anyhow::Result<sqlx::PgPool> {
    Ok(PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?)
}
```

## STEP 8: src/db/mod.rs
```rust
pub mod pool;
pub use pool::create_pool;
```

## STEP 9: src/sources/mod.rs
```rust
use crate::domain::signal::RawSignal;
pub mod steam;

#[async_trait::async_trait]
pub trait OsintSource: Send + Sync {
    async fn fetch(&self, limit: usize) -> anyhow::Result<Vec<RawSignal>>;
    fn name(&self) -> &str;
}
```

## STEP 10: src/sources/steam.rs
```rust
use reqwest::Client;
use serde::Deserialize;
use chrono::DateTime;
use crate::domain::signal::{RawSignal, SourceType};
use super::OsintSource;
use anyhow::Result;
use tokio::time::{sleep, Duration};

#[derive(Deserialize)]
struct SteamReviewResponse {
    #[allow(dead_code)]
    success: i32,
    reviews: Vec<SteamReview>,
    cursor: String,
}

#[derive(Deserialize)]
struct SteamReview {
    recommendationid: String,
    author: SteamAuthor,
    review: String,
    timestamp_created: i64,
    voted_up: bool,
}

#[derive(Deserialize)]
struct SteamAuthor {
    steamid: String,
}

pub struct SteamSource {
    pub appid: u32,
    pub base_url: String,
    client: Client,
}

impl SteamSource {
    pub fn new(appid: u32, base_url: &str) -> Self {
        SteamSource {
            appid,
            base_url: base_url.to_string(),
            client: Client::new(),
        }
    }

    async fn fetch_page(&self, cursor: &str) -> Result<SteamReviewResponse> {
        let encoded = urlencoding::encode(cursor);
        let url = format!(
            "{}/appreviews/{}?json=1&num_per_page=100&filter=all&cursor={}",
            self.base_url, self.appid, encoded
        );
        let resp = self.client
            .get(&url)
            .send()
            .await?
            .json::<SteamReviewResponse>()
            .await?;
        Ok(resp)
    }
}

#[async_trait::async_trait]
impl OsintSource for SteamSource {
    fn name(&self) -> &str {
        "steam"
    }

    async fn fetch(&self, limit: usize) -> Result<Vec<RawSignal>> {
        let mut signals = Vec::new();
        let mut cursor = "*".to_string();
        let mut prev_cursor = String::new();

        while signals.len() < limit {
            let resp = self.fetch_page(&cursor).await?;
            if resp.reviews.is_empty() || cursor == prev_cursor {
                break;
            }
            prev_cursor = cursor.clone();
            cursor = resp.cursor.clone();

            for review in resp.reviews {
                if signals.len() >= limit {
                    break;
                }
                let collected_at = DateTime::from_timestamp(review.timestamp_created, 0)
                    .unwrap_or_else(chrono::Utc::now);
                let signal = RawSignal {
                    source_type: SourceType::SteamReview,
                    source_url: Some(format!(
                        "https://store.steampowered.com/app/{}/",
                        self.appid
                    )),
                    content: review.review,
                    author: Some(review.author.steamid),
                    metadata: serde_json::json!({
                        "voted_up": review.voted_up,
                        "recommendationid": review.recommendationid
                    }),
                    collected_at,
                };
                signals.push(signal);
            }
            sleep(Duration::from_secs(1)).await;
        }
        Ok(signals)
    }
}
```

## STEP 11: src/etl/validate.rs
```rust
use sha2::{Sha256, Digest};
use crate::domain::signal::RawSignal;

pub fn compute_hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn validate(signal: &RawSignal) -> anyhow::Result<()> {
    if signal.content.trim().len() <= 10 {
        return Err(anyhow::anyhow!("Content too short: {} chars", signal.content.len()));
    }
    Ok(())
}
```

## STEP 12: src/etl/normalize.rs
```rust
use regex::Regex;
use crate::domain::signal::RawSignal;

pub fn normalize(mut signal: RawSignal) -> RawSignal {
    let html_re = Regex::new(r"<[^>]+>").unwrap();
    let ws_re = Regex::new(r"\s+").unwrap();
    let cleaned = html_re.replace_all(&signal.content, "");
    signal.content = ws_re.replace_all(cleaned.trim(), " ").to_string();
    signal
}
```

## STEP 13: src/etl/store.rs
```rust
use sqlx::PgPool;
use uuid::Uuid;
use crate::domain::signal::RawSignal;
use crate::etl::validate::compute_hash;

pub async fn batch_insert(
    pool: &PgPool,
    tenant_id: Uuid,
    research_id: Uuid,
    signals: Vec<RawSignal>,
) -> anyhow::Result<(usize, usize)> {
    let mut inserted = 0usize;
    let mut skipped = 0usize;

    for signal in signals {
        let hash = compute_hash(&signal.content);
        let source_type_str = signal.source_type.to_string();
        let metadata_val = signal.metadata.clone();

        let result = sqlx::query!(
            r#"INSERT INTO signals
               (id, tenant_id, research_id, source_type, source_url, content,
                content_hash, author, metadata, collected_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (tenant_id, content_hash) DO NOTHING"#,
            tenant_id,
            research_id,
            source_type_str,
            signal.source_url,
            signal.content,
            hash,
            signal.author,
            metadata_val,
            signal.collected_at
        )
        .execute(pool)
        .await?;

        if result.rows_affected() > 0 {
            inserted += 1;
        } else {
            skipped += 1;
        }
    }
    Ok((inserted, skipped))
}
```

## STEP 14: src/etl/mod.rs
```rust
pub mod validate;
pub mod normalize;
pub mod store;

pub use validate::{validate, compute_hash};
pub use normalize::normalize;
pub use store::batch_insert;
```

## STEP 15: src/main.rs
```rust
use clap::Parser;
use tracing::info;
use uuid::Uuid;

mod config;
mod domain;
mod db;
mod sources;
mod etl;

use sources::{OsintSource, steam::SteamSource};
use etl::{validate, normalize, batch_insert};

#[derive(Parser)]
#[command(name = "cx-platform", about = "CX OSINT Pipeline")]
struct Cli {
    #[arg(long, help = "Steam App ID")]
    appid: u32,

    #[arg(long, help = "Tenant UUID (uses DEFAULT_TENANT_ID if not set)")]
    tenant_id: Option<Uuid>,

    #[arg(long, default_value = "Research", help = "Research name")]
    research_name: String,

    #[arg(long, default_value_t = 500, help = "Max signals to collect")]
    limit: usize,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let cfg = config::load()?;

    tracing_subscriber::fmt()
        .with_env_filter(&cfg.log_level)
        .init();

    let pool = db::create_pool(&cfg.database_url).await?;
    let tenant_id = cli.tenant_id.unwrap_or(cfg.default_tenant_id);

    // Create research record
    let research_id: Uuid = sqlx::query_scalar!(
        r#"INSERT INTO researches (id, tenant_id, name, state, source_config)
           VALUES (gen_random_uuid(), $1, $2, 'CollectingOSINT', '{}')
           RETURNING id"#,
        tenant_id,
        cli.research_name
    )
    .fetch_one(&pool)
    .await?;

    info!(appid = cli.appid, limit = cli.limit, "Starting Steam collection");

    // Fetch
    let source = SteamSource::new(cli.appid, &cfg.steam_base_url);
    let raw = source.fetch(cli.limit).await?;
    info!(fetched = raw.len(), "Fetched signals from Steam");

    // ETL: normalize then validate
    let valid: Vec<_> = raw
        .into_iter()
        .filter_map(|s| {
            let n = normalize(s);
            validate(&n).ok().map(|_| n)
        })
        .collect();

    info!(valid = valid.len(), "Signals passed validation");

    // Store
    let (inserted, skipped) = batch_insert(&pool, tenant_id, research_id, valid).await?;

    // Update research state
    sqlx::query!(
        "UPDATE researches SET state = 'ReadyForSampling' WHERE id = $1",
        research_id
    )
    .execute(&pool)
    .await?;

    info!(inserted, skipped, "Pipeline complete");
    println!("Collection complete: {} inserted, {} skipped", inserted, skipped);
    Ok(())
}
```

## INSTRUCTIONS
1. Read this file carefully
2. Implement ALL 15 steps — edit Cargo.toml and write every .rs file
3. Copy the code blocks EXACTLY as shown above into each file
4. Do not add explanations — just write the files
