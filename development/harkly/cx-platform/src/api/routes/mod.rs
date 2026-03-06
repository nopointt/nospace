use axum::{
    Router,
    routing::{get, post},
};
use sqlx::PgPool;

mod researches;

pub fn router(pool: PgPool, _jwt_secret: String) -> Router {
    Router::new()
        .route("/researches", get(researches::list_researches))
        .route("/researches", post(researches::create_research))
        .route("/researches/:id/signals", get(researches::list_signals))
        .route("/researches/:id/analytics", get(researches::get_analytics))
        .with_state(pool)
}
