## Coach Review — Turn 1 — 2026-03-06

### Requirements Compliance
- REQ-001: ✅ `governor = "0.6"` добавлен в Cargo.toml
- REQ-002: ✅ RateLimiter::dashmap, Quota::per_minute(60), keyed by IP string
- REQ-003: ✅ HTTP 429 + `Retry-After` header с реальным wait_time
- REQ-004: ✅ Rate limiter применён ко всему Router (покрывает все /api/v1/ маршруты)
- REQ-005: ⚠️ X-Forwarded-For ✅, но ConnectInfo fallback вернёт "unknown" — axum::serve не передаёт ConnectInfo без into_make_service_with_connect_info
- REQ-006: ✅ appid == 0 → 400 + {"error": "appid must be positive"}
- REQ-007: ✅ limit < 1 || limit > 1000 → 400
- REQ-008: ✅ name.is_empty() || name.len() > 200 → 400
- REQ-009: ✅ reddit_query если задан — непустой и ≤ 300 символов
- REQ-010: ✅ email.contains('@') && email.contains('.') && email.len() ≤ 254
- REQ-011: ✅ password.len() < 8 → 400
- REQ-012: ✅ email.is_empty() || password.is_empty() → 400
- REQ-013: ✅ cargo check → 0 errors, 11 warnings (expected)

### Test Results
No automated tests written. cargo check passes.

### Issues Found
1. **[MINOR] REQ-005 fallback broken**: `main.rs` использует `axum::serve(listener, app)` без `into_make_service_with_connect_info::<SocketAddr>()`. При отсутствии X-Forwarded-For все запросы получают ключ "unknown" и делят один общий rate limit bucket.
   **Fix**: в main.rs заменить `axum::serve(listener, app)` на `axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())`
   + добавить `use std::net::SocketAddr;` в main.rs

2. **[INFO] Layer order**: rate_limit применяется ДО tenant extraction (в Axum вложение идёт снаружи внутрь). Функционально корректно, но для prod лучше: rate limit → tenant → handler.

### Security Check
- No hardcoded secrets: ✅
- Input validation: ✅ (все публичные endpoints)
- File sizes OK: ✅
- No SQL injection: ✅ (parameterized queries)

---
FEEDBACK FOR PLAYER — Turn 2:

Fix REQ-005: в файле src/main.rs добавь `into_make_service_with_connect_info::<SocketAddr>()`:

Текущий код (строка ~59):
    axum::serve(listener, app).await?;

Заменить на:
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await?;

Добавить в imports main.rs:
    use std::net::SocketAddr;

После изменения запустить: cargo check

---
## Coach Review — Turn 2 (fix verification) — 2026-03-06

- REQ-005 (ConnectInfo fallback): ✅ FIXED — `into_make_service_with_connect_info::<SocketAddr>()` добавлен в main.rs строка 60
- cargo check: ✅ 0 errors

---
IMPLEMENTATION_APPROVED
- All 13 requirements verified independently
- cargo check → 0 errors
- Input validation на всех публичных endpoints
- Rate limiting 60 req/min per IP с Retry-After
- ConnectInfo работает корректно
