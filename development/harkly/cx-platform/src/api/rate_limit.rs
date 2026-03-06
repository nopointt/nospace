use axum::{
    extract::{ConnectInfo, State},
    http::{Request, StatusCode},
    middleware::Next,
    response::{Response, IntoResponse},
    body::Body,
    Json,
};
use governor::{
    Quota, RateLimiter,
    clock::{DefaultClock, Clock},
    state::keyed::DashMapStateStore,
};
use serde::Serialize;
use std::{num::NonZeroU32, sync::Arc};

type IpRateLimiter = RateLimiter<String, DashMapStateStore<String>, DefaultClock>;

#[derive(Clone)]
pub struct RateLimitState(pub Arc<IpRateLimiter>);

pub fn create_rate_limiter() -> RateLimitState {
    // 60 requests per minute
    let quota = Quota::per_minute(NonZeroU32::new(60).unwrap());
    let limiter = RateLimiter::dashmap(quota);
    RateLimitState(Arc::new(limiter))
}

fn extract_client_ip<B>(req: &Request<B>) -> String {
    // Try X-Forwarded-For header first
    if let Some(forwarded) = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
    {
        // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2, ...
        // The first one is the original client IP
        if let Some(client_ip) = forwarded.split(',').next() {
            let trimmed = client_ip.trim();
            if !trimmed.is_empty() {
                return trimmed.to_string();
            }
        }
    }

    // Fallback to socket address
    req.extensions()
        .get::<ConnectInfo<std::net::SocketAddr>>()
        .map(|ci| ci.0.ip().to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

#[derive(Serialize)]
struct RateLimitError {
    error: String,
}

pub async fn rate_limit_middleware(
    State(limiter): State<RateLimitState>,
    req: Request<Body>,
    next: Next,
) -> Response {
    let ip = extract_client_ip(&req);

    let result = limiter.0.check_key(&ip);

    if result.is_ok() {
        next.run(req).await
    } else {
        let retry_after = result
            .unwrap_err()
            .wait_time_from(DefaultClock::default().now())
            .as_secs()
            .max(1);

        (
            StatusCode::TOO_MANY_REQUESTS,
            [("Retry-After", retry_after.to_string())],
            Json(RateLimitError {
                error: "Rate limit exceeded. Try again later.".to_string(),
            }),
        )
            .into_response()
    }
}
