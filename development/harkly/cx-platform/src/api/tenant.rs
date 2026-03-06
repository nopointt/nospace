use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::auth::verify_token;

#[derive(Clone)]
pub struct TenantContext {
    pub tenant_id: Uuid,
    pub user_id: Option<Uuid>,
    pub role: Option<String>,
}

pub async fn extract_tenant(
    State((pool, jwt_secret)): State<(PgPool, String)>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let _ = pool; // pool reserved for future DB session validation

    // 1. Try Bearer JWT
    if let Some(claims) = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .and_then(|token| verify_token(token, &jwt_secret))
    {
        req.extensions_mut().insert(TenantContext {
            tenant_id: claims.tenant_id,
            user_id: Some(claims.sub),
            role: Some(claims.role),
        });
        return Ok(next.run(req).await);
    }

    // 2. Fallback: X-Tenant-ID header (dev / CLI compat)
    let tenant_id = req
        .headers()
        .get("X-Tenant-ID")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<Uuid>().ok())
        .unwrap_or_else(|| "00000000-0000-0000-0000-000000000001".parse().unwrap());

    req.extensions_mut().insert(TenantContext {
        tenant_id,
        user_id: None,
        role: None,
    });
    Ok(next.run(req).await)
}
