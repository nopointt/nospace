# Stage 3 Task: Axum HTTP API

Working directory: C:/Users/noadmin/nospace/development/harkly/cx-platform/

## Your role
You are the Player. Write ALL files exactly as shown. No explanations. Just write the files.

---

## STEP 1: Edit Cargo.toml — ADD these dependencies (keep existing):

```toml
axum = { version = "0.7", features = ["macros"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
```

---

## STEP 2: Write src/api/mod.rs

```rust
use axum::{
    Router,
    middleware,
};
use sqlx::PgPool;

pub mod routes;
pub mod tenant;

pub fn build_router(pool: PgPool) -> Router {
    Router::new()
        .nest("/api/v1", routes::router(pool.clone()))
        .layer(middleware::from_fn_with_state(pool, tenant::extract_tenant))
}
```

---

## STEP 3: Write src/api/tenant.rs

```rust
use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct TenantContext {
    pub tenant_id: Uuid,
}

pub async fn extract_tenant(
    State(_pool): State<PgPool>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let tenant_id = req
        .headers()
        .get("X-Tenant-ID")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<Uuid>().ok())
        .unwrap_or_else(|| {
            "00000000-0000-0000-0000-000000000001"
                .parse()
                .unwrap()
        });

    req.extensions_mut().insert(TenantContext { tenant_id });
    Ok(next.run(req).await)
}
```

---

## STEP 4: Write src/api/routes/mod.rs

```rust
use axum::{
    Router,
    routing::{get, post},
};
use sqlx::PgPool;

mod researches;

pub fn router(pool: PgPool) -> Router {
    Router::new()
        .route("/researches", post(researches::create_research))
        .route("/researches/:id/signals", get(researches::list_signals))
        .with_state(pool)
}
```

---

## STEP 5: Write src/api/routes/researches.rs

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
use crate::sources::{OsintSource, steam::SteamSource};
use crate::etl::{validate, normalize, batch_insert};
use crate::config;

#[derive(Deserialize)]
pub struct CreateResearchRequest {
    pub name: String,
    pub appid: u32,
    #[serde(default = "default_limit")]
    pub limit: usize,
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

    // Spawn ETL in background
    let pool_clone = pool.clone();
    let appid = body.appid;
    let limit = body.limit;
    tokio::spawn(async move {
        let cfg = match config::load() {
            Ok(c) => c,
            Err(_) => return,
        };
        let source = SteamSource::new(appid, &cfg.steam_base_url);
        let raw = match source.fetch(limit).await {
            Ok(r) => r,
            Err(_) => return,
        };
        let valid: Vec<_> = raw
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
```

---

## STEP 6: Write src/main.rs — replace entire file:

```rust
use clap::{Parser, Subcommand};
use tracing::info;
use uuid::Uuid;

mod config;
mod domain;
mod db;
mod sources;
mod etl;
mod api;

use sources::{OsintSource, steam::SteamSource};
use etl::{validate, normalize, batch_insert};

#[derive(Parser)]
#[command(name = "cx-platform", about = "CX OSINT Platform")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Start HTTP API server
    Serve {
        #[arg(long, default_value = "3000")]
        port: u16,
    },
    /// Collect OSINT signals for a research
    Collect {
        #[arg(long)]
        appid: u32,
        #[arg(long, help = "Tenant UUID")]
        tenant_id: Option<Uuid>,
        #[arg(long, default_value = "Research")]
        research_name: String,
        #[arg(long, default_value_t = 500)]
        limit: usize,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let cfg = config::load()?;

    tracing_subscriber::fmt()
        .with_env_filter(&cfg.log_level)
        .init();

    let pool = db::create_pool(&cfg.database_url).await?;

    match cli.command {
        Commands::Serve { port } => {
            let addr = format!("0.0.0.0:{}", port);
            info!("Starting API server on {}", addr);
            let app = api::build_router(pool);
            let listener = tokio::net::TcpListener::bind(&addr).await?;
            axum::serve(listener, app).await?;
        }
        Commands::Collect {
            appid,
            tenant_id,
            research_name,
            limit,
        } => {
            let tenant_id = tenant_id.unwrap_or(cfg.default_tenant_id);

            let research_id: Uuid = sqlx::query_scalar(
                r#"INSERT INTO researches (id, tenant_id, name, state, source_config)
                   VALUES (gen_random_uuid(), $1, $2, 'CollectingOSINT', '{}')
                   RETURNING id"#,
            )
            .bind(tenant_id)
            .bind(&research_name)
            .fetch_one(&pool)
            .await?;

            info!(appid, limit, "Starting Steam collection");

            let source = SteamSource::new(appid, &cfg.steam_base_url);
            let raw = source.fetch(limit).await?;
            info!(fetched = raw.len(), "Fetched signals from Steam");

            let valid: Vec<_> = raw
                .into_iter()
                .filter_map(|s| {
                    let n = normalize(s);
                    validate(&n).ok().map(|_| n)
                })
                .collect();

            info!(valid = valid.len(), "Signals passed validation");

            let (inserted, skipped) = batch_insert(&pool, tenant_id, research_id, valid).await?;

            sqlx::query("UPDATE researches SET state = 'ReadyForSampling' WHERE id = $1")
                .bind(research_id)
                .execute(&pool)
                .await?;

            info!(inserted, skipped, "Pipeline complete");
            println!("Collection complete: {} inserted, {} skipped", inserted, skipped);
        }
    }

    Ok(())
}
```

---

## STEP 7: Create directory src/api/routes/ if it doesn't exist, then verify all files exist:
- src/api/mod.rs
- src/api/tenant.rs
- src/api/routes/mod.rs
- src/api/routes/researches.rs
- src/main.rs (updated)

## INSTRUCTIONS
Write ALL files exactly as shown above. Use the Write tool for each file.
After writing all files, report which files were written.
