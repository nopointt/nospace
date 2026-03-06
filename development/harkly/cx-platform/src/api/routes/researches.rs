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
