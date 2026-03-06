use uuid::Uuid;

pub struct Config {
    pub database_url: String,
    pub steam_base_url: String,
    pub log_level: String,
    pub default_tenant_id: Uuid,
    pub jwt_secret: String,
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
        jwt_secret: std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "harkly-dev-secret-change-in-production".to_string()),
    })
}
