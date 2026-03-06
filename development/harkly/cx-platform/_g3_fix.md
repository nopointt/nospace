# Fix Task: Replace sqlx macros with runtime queries

## Problem
`sqlx::query!()` requires DATABASE_URL at compile time. Replace with `sqlx::query()` (runtime validation).

## Fix src/etl/store.rs — replace entire file:
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

        let result = sqlx::query(
            r#"INSERT INTO signals
               (id, tenant_id, research_id, source_type, source_url, content,
                content_hash, author, metadata, collected_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (tenant_id, content_hash) DO NOTHING"#,
        )
        .bind(tenant_id)
        .bind(research_id)
        .bind(source_type_str)
        .bind(signal.source_url)
        .bind(signal.content)
        .bind(hash)
        .bind(signal.author)
        .bind(metadata_val)
        .bind(signal.collected_at)
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

## Fix src/main.rs — replace entire file:
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
    let research_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO researches (id, tenant_id, name, state, source_config)
           VALUES (gen_random_uuid(), $1, $2, 'CollectingOSINT', '{}')
           RETURNING id"#,
    )
    .bind(tenant_id)
    .bind(&cli.research_name)
    .fetch_one(&pool)
    .await?;

    info!(appid = cli.appid, limit = cli.limit, "Starting Steam collection");

    let source = SteamSource::new(cli.appid, &cfg.steam_base_url);
    let raw = source.fetch(cli.limit).await?;
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
    Ok(())
}
```

## Instructions
Write BOTH files exactly as shown above. Nothing else.
