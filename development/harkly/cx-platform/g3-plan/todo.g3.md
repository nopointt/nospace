# TASK-HARKLY-05-SECURITY — Progress

**Status:** Implementation Complete

## Rate Limiting

- [x] REQ-001: Added `governor = "0.6"` to Cargo.toml
- [x] REQ-002: Implemented Axum middleware rate limiter (60 req/min per IP)
- [x] REQ-003: Returns HTTP 429 with `Retry-After` header on limit exceeded
- [x] REQ-004: Rate limiter applied to all `/api/v1/` routes
- [x] REQ-005: IP extracted from `X-Forwarded-For` with fallback to socket addr

**Implementation:** `src/api/rate_limit.rs`

## Input Validation — POST /api/v1/researches

- [x] REQ-006: `appid` must be > 0 → 400 + `{"error": "appid must be positive"}`
- [x] REQ-007: `limit` in [1, 1000] → 400 + `{"error": "limit must be between 1 and 1000"}`
- [x] REQ-008: `name` non-empty and ≤200 chars → 400 + appropriate error
- [x] REQ-009: `reddit_query` if provided → non-empty and ≤300 chars

**Implementation:** `src/api/routes/researches.rs`

## Input Validation — POST /api/v1/auth/register

- [x] REQ-010: `email` contains `@` and `.` and ≤254 chars → 400
- [x] REQ-011: `password` ≥8 chars → 400

**Implementation:** `src/api/auth.rs`

## Input Validation — POST /api/v1/auth/login

- [x] REQ-012: `email` and `password` non-empty → 400

**Implementation:** `src/api/auth.rs`

## Build

- [x] REQ-013: `cargo check` passes with 0 errors

---

## Files Changed

1. `Cargo.toml` — Added `governor = "0.6"` dependency
2. `src/api/rate_limit.rs` — New file: rate limiting middleware
3. `src/api/mod.rs` — Integrated rate limiter into router
4. `src/api/routes/researches.rs` — Added input validation for create_research
5. `src/api/auth.rs` — Added input validation for register and login
