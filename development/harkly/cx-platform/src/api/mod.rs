use axum::{
    Router,
    middleware,
    routing::post,
};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;

pub mod auth;
pub mod routes;
pub mod tenant;
pub mod rate_limit;

use rate_limit::{create_rate_limiter, rate_limit_middleware};

pub fn build_router(pool: PgPool, jwt_secret: String) -> Router {
    let auth_state = (pool.clone(), jwt_secret.clone());

    let auth_routes = Router::new()
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .with_state(auth_state.clone());

    let api_routes = routes::router(pool.clone(), jwt_secret.clone());

    let rate_limiter = create_rate_limiter();

    Router::new()
        .nest("/api/v1", auth_routes.merge(api_routes))
        .layer(middleware::from_fn_with_state(
            rate_limiter.clone(),
            rate_limit_middleware,
        ))
        .layer(middleware::from_fn_with_state(
            (pool, jwt_secret),
            tenant::extract_tenant,
        ))
        .layer(CorsLayer::permissive())
}
