use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,        // user_id
    pub tenant_id: Uuid,
    pub role: String,
    pub exp: u64,
}

pub fn generate_token(user_id: Uuid, tenant_id: Uuid, role: &str, secret: &str) -> anyhow::Result<String> {
    let exp = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() + 7 * 24 * 3600; // 7 days

    let claims = Claims { sub: user_id, tenant_id, role: role.to_string(), exp };
    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))?;
    Ok(token)
}

pub fn verify_token(token: &str, secret: &str) -> Option<Claims> {
    decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &Validation::default())
        .ok()
        .map(|d| d.claims)
}

fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("hash error: {}", e))?
        .to_string();
    Ok(hash)
}

fn verify_password(password: &str, hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default().verify_password(password.as_bytes(), &parsed).is_ok()
}

// ── Register ────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    /// tenant_id — dev only (in production this comes from invite flow)
    pub tenant_id: Option<Uuid>,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub user_id: Uuid,
    pub token: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

fn validation_error(msg: &str) -> (StatusCode, Json<ErrorResponse>) {
    (
        StatusCode::BAD_REQUEST,
        Json(ErrorResponse { error: msg.to_string() }),
    )
}

pub async fn register(
    State((pool, jwt_secret)): State<(PgPool, String)>,
    Json(body): Json<RegisterRequest>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    // REQ-010: email must contain @ and . and be ≤ 254 chars
    if !body.email.contains('@') || !body.email.contains('.') {
        return Err(validation_error("email must be a valid email address"));
    }
    if body.email.len() > 254 {
        return Err(validation_error("email must be at most 254 characters"));
    }

    // REQ-011: password must be at least 8 characters
    if body.password.len() < 8 {
        return Err(validation_error("password must be at least 8 characters"));
    }

    let tenant_id = body.tenant_id.unwrap_or_else(|| {
        "00000000-0000-0000-0000-000000000001".parse().unwrap()
    });

    let password_hash = hash_password(&body.password)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Internal server error".to_string() })))?;

    let user_id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO users (id, tenant_id, email, password_hash, role)
           VALUES (gen_random_uuid(), $1, $2, $3, 'admin')
           RETURNING id"#,
    )
    .bind(tenant_id)
    .bind(&body.email)
    .bind(&password_hash)
    .fetch_one(&pool)
    .await
    .map_err(|_| (StatusCode::CONFLICT, Json(ErrorResponse { error: "Email already registered".to_string() })))?;

    let token = generate_token(user_id, tenant_id, "admin", &jwt_secret)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Internal server error".to_string() })))?;

    Ok((StatusCode::CREATED, Json(RegisterResponse { user_id, token })))
}

// ── Login ────────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: Uuid,
    pub tenant_id: Uuid,
    pub role: String,
}

pub async fn login(
    State((pool, jwt_secret)): State<(PgPool, String)>,
    Json(body): Json<LoginRequest>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    // REQ-012: email and password must be non-empty
    if body.email.is_empty() {
        return Err(validation_error("email cannot be empty"));
    }
    if body.password.is_empty() {
        return Err(validation_error("password cannot be empty"));
    }

    let row = sqlx::query_as::<_, (Uuid, Uuid, String, String)>(
        "SELECT id, tenant_id, password_hash, role FROM users WHERE email = $1",
    )
    .bind(&body.email)
    .fetch_optional(&pool)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Internal server error".to_string() })))?
    .ok_or((StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Invalid credentials".to_string() })))?;

    let (user_id, tenant_id, password_hash, role) = row;

    if !verify_password(&body.password, &password_hash) {
        return Err((StatusCode::UNAUTHORIZED, Json(ErrorResponse { error: "Invalid credentials".to_string() })));
    }

    let token = generate_token(user_id, tenant_id, &role, &jwt_secret)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(ErrorResponse { error: "Internal server error".to_string() })))?;

    Ok(Json(LoginResponse { token, user_id, tenant_id, role }))
}
