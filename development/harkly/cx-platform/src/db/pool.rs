use sqlx::postgres::{PgPoolOptions, PgConnectOptions};

pub async fn create_pool(database_url: &str) -> anyhow::Result<sqlx::PgPool> {
    let options: PgConnectOptions = database_url.parse()?;
    let options = options.options(vec![("search_path".to_string(), "public".to_string())]);
    
    Ok(PgPoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?)
}
