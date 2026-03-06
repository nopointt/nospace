# Requirements Contract — TASK-HARKLY-05-SECURITY

**Created:** 2026-03-06
**Project:** Harkly cx-platform (Rust Axum 0.7)
**Status:** ACTIVE

---

## Task Description

Add production-grade security to cx-platform Rust backend:
1. Rate limiting — защита от brute force и abuse на всех API endpoints
2. Input validation — проверка входных данных на всех публичных эндпоинтах

---

## Requirements

### Rate Limiting
- [x] REQ-001: Добавить crate `governor = "0.6"` в Cargo.toml
- [x] REQ-002: Axum middleware rate limiter — ≤60 req/min per IP (keyed by IP)
- [x] REQ-003: Превышение лимита → HTTP 429 с заголовком `Retry-After: 60`
- [x] REQ-004: Rate limiter применяется ко всем маршрутам под `/api/v1/`
- [x] REQ-005: IP извлекается из `X-Forwarded-For` (с fallback на socket addr)

### Input Validation — POST /api/v1/researches
- [x] REQ-006: `appid` обязателен и > 0, иначе 400 + `{"error": "appid must be positive"}`
- [x] REQ-007: `limit` в диапазоне [1, 1000], иначе 400 + `{"error": "limit must be between 1 and 1000"}`
- [x] REQ-008: `name` непустой и ≤ 200 символов, иначе 400 + `{"error": "..."}`
- [x] REQ-009: `reddit_query` если задан — непустой и ≤ 300 символов

### Input Validation — POST /api/v1/auth/register
- [x] REQ-010: `email` содержит `@` и `.` и ≤ 254 символов, иначе 400
- [x] REQ-011: `password` минимум 8 символов, иначе 400

### Input Validation — POST /api/v1/auth/login
- [x] REQ-012: `email` и `password` непустые, иначе 400

### Build
- [x] REQ-013: `cargo check` проходит без ошибок (warnings допустимы)

---

## Definition of Done

- All REQ-XXX items checked off by Coach (not Player)
- `cargo check` → 0 errors
- No hardcoded secrets
- Files < 800 lines

---

## Coach Verification Checklist

- [ ] `cargo check` → 0 errors (run independently)
- [ ] Grep Cargo.toml for `governor`
- [ ] Grep mod.rs / main middleware for rate limiter
- [ ] Test 429 manually via curl (>60 rapid requests)
- [ ] Read researches.rs — check each validation REQ-006..009
- [ ] Read auth.rs — check REQ-010..012
- [ ] No hardcoded secrets
- [ ] No SQL injection vectors
