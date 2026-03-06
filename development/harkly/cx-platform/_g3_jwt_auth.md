# JWT Auth Task

## Your role
You are the Player. Write ALL files exactly as shown. Execute all shell steps. Report results.

Working dirs:
- Rust: C:/Users/noadmin/nospace/development/harkly/cx-platform/
- Next.js: C:/Users/noadmin/nospace/development/harkly/cx-platform-web/

---

## STEP 1: Add dependencies to Cargo.toml

In file C:/Users/noadmin/nospace/development/harkly/cx-platform/Cargo.toml,
find the line:
```
urlencoding = "2"
```
Replace with:
```
urlencoding = "2"
jsonwebtoken = "9"
argon2 = "0.5"
```

---

## STEP 2: Add jwt_secret to Config

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/config.rs:

```rust
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
```

---

## STEP 3: Create users migration

Write NEW file C:/Users/noadmin/nospace/development/harkly/cx-platform/migrations/20260305000400_004_users.sql:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'researcher',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
```

---

## STEP 4: Create src/api/auth.rs

Write NEW file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/auth.rs:

```rust
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

pub async fn register(
    State((pool, jwt_secret)): State<(PgPool, String)>,
    Json(body): Json<RegisterRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    let tenant_id = body.tenant_id.unwrap_or_else(|| {
        "00000000-0000-0000-0000-000000000001".parse().unwrap()
    });

    let password_hash = hash_password(&body.password)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

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
    .map_err(|_| StatusCode::CONFLICT)?;

    let token = generate_token(user_id, tenant_id, "admin", &jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

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
) -> Result<impl IntoResponse, StatusCode> {
    let row = sqlx::query_as::<_, (Uuid, Uuid, String, String)>(
        "SELECT id, tenant_id, password_hash, role FROM users WHERE email = $1",
    )
    .bind(&body.email)
    .fetch_optional(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    let (user_id, tenant_id, password_hash, role) = row;

    if !verify_password(&body.password, &password_hash) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = generate_token(user_id, tenant_id, &role, &jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse { token, user_id, tenant_id, role }))
}
```

---

## STEP 5: Update src/api/tenant.rs — add JWT middleware

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/tenant.rs:

```rust
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
```

---

## STEP 6: Update src/api/mod.rs — add auth routes and pass jwt_secret to state

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/mod.rs:

```rust
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

pub fn build_router(pool: PgPool, jwt_secret: String) -> Router {
    let auth_state = (pool.clone(), jwt_secret.clone());

    let auth_routes = Router::new()
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .with_state(auth_state.clone());

    let api_routes = routes::router(pool.clone(), jwt_secret.clone());

    Router::new()
        .nest("/api/v1", auth_routes.merge(api_routes))
        .layer(middleware::from_fn_with_state(
            (pool, jwt_secret),
            tenant::extract_tenant,
        ))
        .layer(CorsLayer::permissive())
}
```

---

## STEP 7: Update src/api/routes/mod.rs — pass jwt_secret

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/api/routes/mod.rs:

```rust
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
```

---

## STEP 8: Update main.rs — pass jwt_secret to build_router

In file C:/Users/noadmin/nospace/development/harkly/cx-platform/src/main.rs,
find the line:
```
            let app = api::build_router(pool);
```
Replace with:
```
            let app = api::build_router(pool, cfg.jwt_secret.clone());
```

---

## STEP 9: Run migration

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && sqlx migrate run 2>&1
```
Expected: migration 004_users applied successfully.

---

## STEP 10: Verify Rust compiles

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform && cargo check 2>&1 | tail -5
```
Expected: `Finished` with 0 errors.

---

## STEP 11: Update lib/api.ts — add auth functions and Bearer token support

Replace ENTIRE file C:/Users/noadmin/nospace/development/harkly/cx-platform-web/lib/api.ts:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Token storage ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("harkly_token");
}

export function setToken(token: string) {
  localStorage.setItem("harkly_token", token);
}

export function clearToken() {
  localStorage.removeItem("harkly_token");
}

function getHeaders(): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    base["Authorization"] = `Bearer ${token}`;
  } else {
    // dev fallback
    base["X-Tenant-ID"] = "00000000-0000-0000-0000-000000000001";
  }
  return base;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user_id: string;
  tenant_id: string;
  role: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function register(
  email: string,
  password: string,
  tenant_id?: string
): Promise<{ user_id: string; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, tenant_id }),
  });
  if (!res.ok) throw new Error(`Register failed: ${res.status}`);
  const data = await res.json();
  setToken(data.token);
  return data;
}

// ── Research ──────────────────────────────────────────────────────────────────

export interface CreateResearchRequest {
  name: string;
  appid: number;
  limit: number;
  reddit_query?: string;
  gog_product_id?: number;
}

export interface CreateResearchResponse {
  id: string;
  state: string;
}

export interface Signal {
  id: string;
  source_type: string;
  source_url: string | null;
  content: string;
  author: string | null;
  collected_at: string;
}

export interface ListSignalsResponse {
  signals: Signal[];
  total: number;
  page: number;
  limit: number;
}

export interface AnalyticsResponse {
  total: number;
  by_date: { date: string; count: number }[];
  top_authors: { author: string; count: number }[];
  source_breakdown: { source_type: string; count: number }[];
}

export async function createResearch(
  body: CreateResearchRequest
): Promise<CreateResearchResponse> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /researches failed: ${res.status}`);
  return res.json();
}

export async function listResearches(): Promise<
  { id: string; name: string; state: string; created_at: string; signal_count: number }[]
> {
  const res = await fetch(`${API_BASE}/api/v1/researches`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`GET /researches failed: ${res.status}`);
  return res.json();
}

export async function listSignals(
  researchId: string,
  page = 1,
  limit = 20
): Promise<ListSignalsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/signals?page=${page}&limit=${limit}`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`GET /signals failed: ${res.status}`);
  return res.json();
}

export async function getAnalytics(researchId: string): Promise<AnalyticsResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/researches/${researchId}/analytics`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`GET /analytics failed: ${res.status}`);
  return res.json();
}
```

---

## STEP 12: Create login page

Create directory:
```
mkdir -p "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/login"
```

Write file "C:/Users/noadmin/nospace/development/harkly/cx-platform-web/app/login/page.tsx":

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <span className="text-[#f2b90d] font-bold text-2xl tracking-tight">Harkly</span>
          <p className="text-white/40 text-sm mt-1">CX Platform</p>
        </div>

        <div className="flex border border-white/10 rounded mb-6 overflow-hidden">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm transition-colors ${
              mode === "login" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 py-2 text-sm transition-colors ${
              mode === "register" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#f2b90d]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#f2b90d] text-black font-semibold py-2 px-6 rounded hover:bg-[#f2b90d]/80 disabled:opacity-50 transition-colors"
          >
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## STEP 13: Type-check Next.js

```
cd C:/Users/noadmin/nospace/development/harkly/cx-platform-web && npx tsc --noEmit 2>&1 | tail -10
```
Expected: exit code 0.

---

## REPORT:
- Step 9: migration result
- Step 10: cargo check result
- Step 13: tsc result
- List of modified/created files
