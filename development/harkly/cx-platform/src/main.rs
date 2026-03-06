use clap::{Parser, Subcommand};
use tracing::info;
use uuid::Uuid;
use std::net::SocketAddr;

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
            let app = api::build_router(pool, cfg.jwt_secret.clone());
            let listener = tokio::net::TcpListener::bind(&addr).await?;
            axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await?;
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
