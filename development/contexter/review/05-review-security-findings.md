I now have a complete picture of the codebase. Let me compile all findings.

---

# Security Audit — Contexter Pre-Launch

## Findings

---

### [HIGH] — API token returned in redirect URL (Telegram + Google OAuth)

**File:** `src/routes/auth-social.ts:169`, `src/routes/auth-social.ts:290`
**Category:** security
**Description:** Both the Telegram redirect callback and the Google OAuth callback redirect the user's API token in the URL query parameter: `https://contexter.cc/app?token=${apiToken}`. API tokens in URLs are recorded in browser history, server access logs (Caddy), Referer headers when navigating away, and any analytics/monitoring scripts loaded by the frontend. This is the permanent, non-revocable API token — if Caddy or Netdata logs a request containing `?token=`, the token is persistently exposed. The `mcpUrl` in registration responses also embeds the token in the URL (`/sse?token=...`), but those are not redirect targets — this redirect is the critical exposure.

**Recommendation:** Use a short-lived (e.g., 5 minutes, single-use) session exchange code in the redirect: `?code=<random>`. The frontend exchanges the code for the API token via a POST to `/api/auth/exchange` that returns the token in the response body. Never put long-lived credentials in redirect URLs.

---

### [HIGH] — Email-based "re-registration" returns existing API token to any caller

**File:** `src/routes/auth.ts:49-65`
**Category:** security
**Description:** The registration endpoint is idempotent by design — if an email is already registered, it returns the existing user's `apiToken` and `userId` to whoever POSTs with that email. There is no ownership verification (no password, no email OTP, no rate limit on this path specifically — the rate limit is skipped for this branch at line 49-65). An attacker who knows or guesses a target's email address can retrieve their full API token by calling `POST /api/auth/register` with that email. This is effectively account takeover via email enumeration. The comment at line 56-57 acknowledges this: "TODO CTX-04: replace with proper auth" — but it remains a critical pre-launch risk.

**Recommendation:** Remove the token-return on existing-email path entirely before launch. Return `{ error: "email already registered" }` with 409, or implement a magic-link flow as the TODO suggests. If idempotency must be preserved, require email verification before returning credentials.

---

### [HIGH] — `initialize` and `tools/list` methods served without authentication on MCP endpoint

**File:** `src/routes/mcp-remote.ts:257-270`
**Category:** security
**Description:** In `handleRequest()`, the `initialize`, `notifications/initialized`, `tools/list`, and `ping` methods are handled and return successful responses regardless of whether `authCtx` is null. Only `tools/call` checks for auth. This means any unauthenticated client can call `initialize` and receive server version + protocol information, call `tools/list` and receive the complete tool schema (12 tools with their input schemas), and send batch requests mixing `initialize` with `tools/call` — the batch loop at line 193 passes the same `authCtx` to each, so auth is per-request, which is fine, but the capability and schema disclosure is unnecessary attack surface.

**Recommendation:** `initialize` and `tools/list` do not need to be public. At minimum, `tools/list` should require authentication to prevent capability enumeration by unauthenticated parties. Apply the same `if (!authCtx)` guard to `tools/list` as is applied to `tools/call`.

---

### [HIGH] — `rename_document` (MCP) does not sanitize the new name before writing to DB

**File:** `src/routes/mcp-remote.ts:825`
**Category:** security
**Description:** The `rename_document` tool accepts `newName` from the user and writes it directly to the database: `UPDATE documents SET name = ${newName}`. While Drizzle tagged templates parameterize values (preventing SQL injection), there is no length limit, no character allowlist, and no sanitization applied. The value is later returned in `get_document` responses and rendered in MCP text output. A user could set a document name to a very long string (e.g., 64 KB), causing oversized DB rows or truncation issues, or embed control characters/ANSI sequences that could cause display issues in terminals consuming MCP output. Compare with the `sanitizeFileName` function used consistently elsewhere.

**Recommendation:** Apply `sanitizeFileName()` to `newName` before the UPDATE, and add a reasonable maximum length check (e.g., 255 characters).

---

### [HIGH] — YouTube parser fetches arbitrary `baseUrl` from untrusted YouTube HTML response

**File:** `src/services/parsers/youtube.ts:97`
**Category:** security
**Description:** The `fetchTranscript` function scrapes the YouTube watch page HTML, extracts a JSON blob via regex match, parses it, and then fetches `track.baseUrl + "&fmt=json3"` where `track.baseUrl` comes directly from the parsed JSON. If the YouTube page HTML is compromised, intercepted (e.g., via a MITM in a non-TLS context), or if a specially crafted input manipulates the regex extraction, an attacker could cause the server to fetch an arbitrary URL. More concretely: `track.baseUrl` is an attacker-influenced value from external HTML — there is no validation that it resolves to `youtube.com` or `googlevideo.com`. This is a limited SSRF vector since the input URL must pass `extractVideoId` (which only accepts 11-character YouTube video IDs), but the secondary fetch target is unconstrained.

**Recommendation:** Validate that `track.baseUrl` begins with `https://` and matches `*.youtube.com` or `*.googlevideo.com` before fetching. Use a strict allowlist: `if (!track.baseUrl.startsWith("https://www.youtube.com/") && !track.baseUrl.startsWith("https://video.google.com/"))`.

---

### [HIGH] — Netdata dashboard exposed on port 19999 with no authentication

**File:** `docker-compose.yml:57`
**Category:** security
**Description:** Netdata is bound to port `19999:19999` on the host network with no authentication configured and no IP restriction. Netdata's default configuration exposes detailed system metrics, process lists, network connection counts, disk I/O per path, and in some versions allows plugin execution. This port is likely reachable from the internet on the Hetzner VM (unless a host firewall blocks it — which is not visible in this codebase). An attacker can enumerate running processes, memory usage, Docker container names, and potentially trigger Netdata actions. The container also has `SYS_PTRACE` capability and `apparmor:unconfined`.

**Recommendation:** Either (a) remove the port binding and access Netdata only via an authenticated reverse-proxy path (e.g., `https://api.contexter.cc/netdata/` behind Caddy with basic auth), or (b) configure Netdata's built-in access control (`[web]` section, `allow connections from = localhost`). Do not expose port 19999 publicly.

---

### [MEDIUM] — SVG file accepted, stored in R2 — potential XSS if served directly

**File:** `src/routes/upload.ts:49`, `src/routes/upload.ts:166`
**Category:** security
**Description:** `image/svg+xml` is in the `MIME_MAP` and `ALLOWED_MIME_TYPES`. SVG is XML that can contain `<script>` tags, event handlers, and `<foreignObject>` elements. The magic-byte validation (`validateMimeTypeByMagicBytes`) uses `file-type`, which does not detect SVG (it's a text format — the check returns `null` at line 261, allowing it through unconditionally). If uploaded SVGs are ever served with `Content-Type: image/svg+xml` from R2 (even with a presigned URL or a future viewer endpoint), the browser executes embedded JavaScript, enabling stored XSS. The current pipeline processes SVGs through `DoclingParser` which converts to markdown, so actual XSS execution depends on a serving endpoint.

**Recommendation:** Either reject SVG uploads entirely, or ensure any R2-served SVGs include `Content-Disposition: attachment` and `Content-Type: text/plain` (stripping the SVG MIME type). Do not serve SVG files with their native MIME type in any viewer endpoint. This is worth fixing before adding any document-viewing feature.

---

### [MEDIUM] — HTML file accepted and stored — passive XSS surface

**File:** `src/routes/upload.ts:45`, `src/routes/upload.ts:166`
**Category:** security
**Description:** `text/html` is in `MIME_MAP` and `ALLOWED_MIME_TYPES`. Same reasoning as SVG: if HTML files are ever served from R2 or via a preview endpoint with `Content-Type: text/html`, they render as full HTML pages in the browser, enabling stored XSS. `file-type` does not detect HTML (text format, passes magic-byte check at line 260-262). HTML is intentionally accepted for DoclingParser document conversion, but the risk surface should be bounded.

**Recommendation:** When storing HTML files in R2, always set `ContentDisposition: attachment` and override `ContentType` to `text/plain` or `application/octet-stream`. Add a comment explicitly documenting that HTML files must never be served with `text/html` from a viewer endpoint.

---

### [MEDIUM] — Magic-byte validation does not cross-check detected MIME against claimed MIME

**File:** `src/routes/upload.ts:256-271`
**Category:** security
**Description:** `validateMimeTypeByMagicBytes` checks that the detected MIME type is in `ALLOWED_MIME_TYPES` but does not verify that it matches the claimed `mimeType`. A user can upload a PNG file claiming `mimeType = "application/pdf"` — the magic-byte check will detect `image/png` (which is in `ALLOWED_MIME_TYPES`), return `null` (no error), and the file will be stored and processed as a PDF by `DoclingParser`. This is not an injection vector per se, but it enables processing-pipeline confusion and potential parser exploitation.

**Recommendation:** After detecting the MIME type via magic bytes, also verify that `detected.mime === claimedMime` (or that the claimed MIME is a reasonable alias for the detected MIME). Return an error if they diverge significantly.

---

### [MEDIUM] — `upload_document` MCP tool skips magic-byte validation

**File:** `src/routes/mcp-remote.ts:461-560`
**Category:** security
**Description:** The REST upload endpoint at `src/routes/upload.ts` calls `validateMimeTypeByMagicBytes()` before accepting a file. The `upload_document` MCP tool (which decodes base64 content) does not call this validation — it only checks for `application/octet-stream` MIME type by extension inference. An attacker with a valid API token can upload files through the MCP endpoint with mismatched or unsupported binary content without magic-byte validation. The file goes directly to R2 and into the pipeline.

**Recommendation:** Extract the magic-byte validation logic into a shared utility and call it from the MCP `upload_document` tool after base64 decoding, exactly as the REST endpoint does.

---

### [MEDIUM] — `add_context` MCP tool has no size limit on text content

**File:** `src/routes/mcp-remote.ts:402-458`
**Category:** security
**Description:** The `add_context` tool accepts arbitrary text in `args.content` with only a non-empty check (line 419). There is no maximum size limit. Compare with the REST upload endpoint which enforces 100 MB at line 160. An authenticated user can send arbitrarily large text through the MCP interface, causing unbounded memory allocation, R2 storage consumption, and pipeline CPU usage. The upload rate limit (20/hour) limits throughput but not per-request size.

**Recommendation:** Add a maximum content size check before processing: `if (content.length > 10 * 1024 * 1024) return makeResult(req.id, { ..., isError: true })`. Choose a limit consistent with the pipeline's expected document sizes.

---

### [MEDIUM] — `verifyIpnSignature` comparison is not timing-safe

**File:** `src/services/billing.ts:54-58`
**Category:** security
**Description:** `verifyIpnSignature` computes an HMAC and compares it with `===` (line 57): `return hmac === signature`. String equality in JavaScript/V8 is not constant-time — it short-circuits on the first differing character. This is a timing oracle: an attacker sending many crafted webhook bodies could in principle measure response time differences to brute-force the HMAC, though the 64-character hex HMAC-SHA512 makes this extremely difficult in practice. The risk is low but the fix is trivial.

**Recommendation:** Replace `return hmac === signature` with `return crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(signature, "hex"))`. Wrap in try/catch to handle length mismatches (different-length strings throw in `timingSafeEqual`).

---

### [MEDIUM] — Payment amount not verified server-side — webhook trust is the only gate

**File:** `src/routes/webhooks.ts:59-65`, `src/services/billing.ts:99-138`
**Category:** security
**Description:** When activating a subscription via `activateSubscription()`, the server trusts the `tier` value stored in the `payments` table (recorded at invoice creation time) and the `actually_paid` value from the webhook, but it does not verify that `actually_paid` is greater than or equal to the expected price for that tier. NOWPayments allows partial payments (under-payments), and the webhook will fire with `payment_status: finished` even for partial payments in some configurations. The `actually_paid` field (a string from the webhook) is stored but never compared to `TIERS[tier].priceUsd`.

**Recommendation:** In `activateSubscription`, before activating, verify that `parseFloat(opts.actuallyPaid)` meets a minimum threshold relative to the expected price (allow e.g., 1% underpayment for crypto volatility). If `actually_paid` is insufficient, mark the payment as `underpaid` and do not activate the subscription.

---

### [MEDIUM] — NLI sidecar runs as root inside the container

**File:** `services/nli-sidecar/Dockerfile:16`
**Category:** security
**Description:** The NLI sidecar Dockerfile has no `USER` directive. Uvicorn runs as root inside the container (the default for `python:3.11-slim`). If the FastAPI/transformers pipeline is exploited (e.g., via a malformed NLI input), the process runs with root privileges within the container. While Docker provides namespace isolation, running as root increases the blast radius of container escape vulnerabilities.

**Recommendation:** Add `RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app` and `USER appuser` before the `CMD` line.

---

### [MEDIUM] — Token in URL logged by request logger middleware

**File:** `src/index.ts:83-97`
**Category:** security
**Description:** The request logging middleware at line 89 logs `new URL(c.req.url).pathname`. This is safe — pathnames do not include query parameters. However, the MCP SSE endpoint at `/sse?token=<apiToken>` and share URLs at `/sse?share=<shareToken>` pass credentials in query parameters. The current logger only logs `pathname` (not the full URL), so tokens are not currently leaked. But this is a fragile design — if any developer adds `c.req.url` to the logger (a natural debugging step), all tokens in transit would be written to stdout/logs permanently.

**Recommendation:** This is a systemic design risk. Document in a comment at the logger that `c.req.url` must never be logged (tokens in query params). The long-term fix is the same as the first finding: move credentials out of URLs into headers or exchange codes.

---

### [MEDIUM] — Unauthenticated `tools/list` response reveals internal tool capabilities to any caller

**File:** `src/routes/mcp-remote.ts:269-270`
**Category:** security (information disclosure)
**Description:** As noted in the HIGH finding, `tools/list` is served without authentication. Beyond capability enumeration, the tool descriptions reveal internal architecture: "Search the Contexter knowledge base", "Uses base64-encoded" content format for uploads, storage of files in a knowledge base with document IDs, etc. This is the kind of recon data an attacker uses to craft targeted exploitation attempts.

**Recommendation:** Require authentication for `tools/list`. If MCP protocol semantics require it to be public, strip the `description` field from unauthenticated responses.

---

### [MEDIUM] — `oauth_state` CSRF tokens stored in Redis without namespace isolation risk

**File:** `src/routes/auth-social.ts:181`
**Category:** security
**Description:** Google OAuth state tokens are stored as `oauth_state:{state}` with 10-minute TTL. The `client_id` is not stored alongside the state. If a user initiates two simultaneous OAuth flows (unlikely but possible), the state keys are independent, which is fine. However, there is no binding between the state parameter and the user's session or browser. The state token functions purely as a CSRF token, which is correct. The gap: `handleClientRegister` also stores data under `oauth_client:{clientId}` in Redis, and both namespaces share the same Redis instance with no ACL separation. If Redis is compromised, both OAuth flow state and OAuth client registrations (which include `clientSecret`) are exposed simultaneously.

**Recommendation:** This is acceptable for a single-service deployment. Document that Redis contains security-sensitive data and ensure `requirepass` is configured (it is — see docker-compose.yml line 27). Consider adding Redis ACL rules to limit key-space access per application role when moving to a managed Redis service.

---

### [LOW] — `client_secret` returned in `client/register` response but never used for verification

**File:** `src/routes/mcp-remote.ts:882`, `src/routes/oauth.ts:84-95`
**Category:** security
**Description:** `handleClientRegister` generates and returns a `clientSecret` (line 882). The OAuth `/authorize` and `/token` endpoints never verify this secret — they only check `clientId` and `redirectUri`. The token endpoint explicitly supports `token_endpoint_auth_method: none` (index.ts line 127). The `clientSecret` is dead code that creates false confidence. Its existence in the response could mislead developers into thinking client authentication is enforced.

**Recommendation:** Remove `clientSecret` from both the generated data and the response, since it provides no security benefit and is never validated. Alternatively, if you intend to support confidential clients in future, document this explicitly and add the verification path now.

---

### [LOW] — Error messages in query route expose raw exception text to callers

**File:** `src/routes/query.ts:191`
**Category:** security
**Description:** `catch (e) { return c.json({ error: e instanceof Error ? e.message : String(e) }, 500) }` — raw exception messages from the RAG pipeline are returned directly to the API caller. These messages can include internal service URLs (Jina API error messages include their endpoint URLs), model names, token counts, and partial query text. The MCP error handler at line 842-848 has explicit sanitization for "Jina API" messages but the REST `/api/query` endpoint does not.

**Recommendation:** Apply the same sanitization used in the MCP error handler to the REST query endpoint. Return a generic `"Internal server error. Please try again."` to callers and log the full error server-side.

---

### [LOW] — `userId` slice from `crypto.randomUUID()` reduces collision resistance

**File:** `src/routes/auth.ts:91`, `src/routes/auth-social.ts:91`, `src/services/billing.ts:62`
**Category:** security
**Description:** `crypto.randomUUID().slice(0, 16)` produces 16 hexadecimal characters from a UUID. A UUIDv4 has 122 bits of entropy; slicing to 16 hex characters gives 64 bits of entropy for user IDs. The billing service `genId()` uses `crypto.randomBytes(8).toString("hex")` which also produces 64 bits. 64-bit IDs have a ~50% collision probability around 4 billion entries, which is academic for a small service — but the UUID-slice approach also depends on the UUID format (characters 0-15 include the version nibble, which is always "4", reducing entropy slightly). This is low severity but worth noting.

**Recommendation:** Use `crypto.randomBytes(8).toString("hex")` (as `genId()` in billing.ts already does) consistently for all IDs, or use the full UUID (`crypto.randomUUID()`) for user IDs where collision resistance is most important. The billing `genId()` pattern is actually cleaner — standardize on that.

---

### [LOW] — `html` MIME type accepted without `text/html` magic-byte check discrepancy

**File:** `src/routes/upload.ts:166`
**Category:** security
**Description:** `text/html` is in `ALLOWED_MIME_TYPES` via `MIME_MAP`. When `file-type` fails to detect a type (returns `undefined` for text files), the magic-byte check function returns `null` at line 261 — meaning any file can be uploaded claiming `text/html` and it will pass. This includes files that are not HTML at all (e.g., a PHP file renamed to `.html` with `Content-Type: text/html`). The pipeline processes HTML through `DoclingParser` which converts it to markdown, so active execution is not a risk in the current pipeline. The risk is to future features (viewer, preview).

**Recommendation:** For text-format types (HTML, SVG, JSON, XML), add a lightweight content-based check: verify the first 512 bytes match expected patterns (e.g., HTML starts with `<!DOCTYPE` or `<html`). This is defense-in-depth for future features.

---

### [LOW] — NLI sidecar health endpoint has no auth and is on `0.0.0.0`

**File:** `services/nli-sidecar/Dockerfile:16`, `services/nli-sidecar/server.py:66`
**Category:** security
**Description:** The uvicorn command binds to `0.0.0.0:8765`. The NLI sidecar is on the `internal` Docker network only (docker-compose.yml line 91), so it is not directly reachable from the internet. However, if Docker's network isolation is ever misconfigured or a future `ports:` entry is added, the sidecar accepts unauthenticated requests from any IP, including inference requests that load the ML model. The healthcheck and `/nli` endpoint have no authentication or rate limiting.

**Recommendation:** Bind uvicorn to `127.0.0.1` instead of `0.0.0.0`: `CMD ["uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8765"]`. Since all communication is container-to-container on the internal network, binding to localhost within the container is sufficient (Docker networking resolves container hostnames regardless of bind address, assuming the app container connects by container name).

Note: Binding to `127.0.0.1` inside a Docker container will prevent the Docker healthcheck from reaching the endpoint from outside. Either keep `0.0.0.0` with network-level isolation confirmed, or adjust the healthcheck to run inside the container.

---

## Summary Table

| # | Severity | File | Title |
|---|---|---|---|
| 1 | HIGH | `src/routes/auth-social.ts:169,290` | API token returned in redirect URL (Telegram + Google OAuth) |
| 2 | HIGH | `src/routes/auth.ts:49-65` | Email-based re-registration returns existing API token to any caller |
| 3 | HIGH | `src/routes/mcp-remote.ts:257-270` | `initialize`/`tools/list` served without authentication |
| 4 | HIGH | `src/routes/mcp-remote.ts:825` | `rename_document` does not sanitize or length-limit new name |
| 5 | HIGH | `src/services/parsers/youtube.ts:97` | Unconstrained secondary fetch of `track.baseUrl` (SSRF vector) |
| 6 | HIGH | `docker-compose.yml:57` | Netdata port 19999 exposed publicly without authentication |
| 7 | MEDIUM | `src/routes/upload.ts:49,166` | SVG upload accepted — potential XSS if served directly |
| 8 | MEDIUM | `src/routes/upload.ts:45,166` | HTML upload accepted — passive XSS surface for future viewer |
| 9 | MEDIUM | `src/routes/upload.ts:256-271` | Magic-byte check does not cross-validate detected vs. claimed MIME |
| 10 | MEDIUM | `src/routes/mcp-remote.ts:461-560` | MCP `upload_document` skips magic-byte validation |
| 11 | MEDIUM | `src/routes/mcp-remote.ts:402-458` | `add_context` MCP tool has no size limit on text content |
| 12 | MEDIUM | `src/services/billing.ts:57` | IPN signature comparison is not timing-safe |
| 13 | MEDIUM | `src/routes/webhooks.ts:59-65` | Payment amount not verified server-side |
| 14 | MEDIUM | `services/nli-sidecar/Dockerfile` | NLI sidecar runs as root |
| 15 | MEDIUM | `src/index.ts:83-97` | API token in URL at structural risk of being logged |
| 16 | MEDIUM | `src/routes/mcp-remote.ts:269-270` | `tools/list` reveals capabilities to unauthenticated callers |
| 17 | MEDIUM | `src/routes/auth-social.ts:181` | OAuth state/client secrets share Redis namespace without ACL |
| 18 | LOW | `src/routes/mcp-remote.ts:882` | `clientSecret` generated but never validated |
| 19 | LOW | `src/routes/query.ts:191` | Raw exception messages exposed to REST API callers |
| 20 | LOW | `src/routes/auth.ts:91` | UUID-slice for userId reduces entropy vs. `randomBytes(8)` |
| 21 | LOW | `src/routes/upload.ts:166` | HTML MIME type has no content-based validation |
| 22 | LOW | `services/nli-sidecar/server.py:66` | NLI sidecar binds to `0.0.0.0` |

---

**Blocking before public launch:** Findings 1, 2, 6 are the highest-priority issues. Finding 1 (token in redirect URL) and Finding 2 (email = account takeover) are authentication design issues that directly enable account compromise. Finding 6 (Netdata exposed) is a one-line firewall rule or port removal fix. Findings 3, 5, 13 are HIGH issues that should be fixed in the same sprint. The remaining MEDIUM items can be addressed in a follow-up pass.