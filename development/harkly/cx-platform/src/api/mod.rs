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
