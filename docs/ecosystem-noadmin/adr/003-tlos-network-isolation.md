# ADR 003: tLOS Local Network Isolation

**Date:** 2026-03-02
**Status:** Accepted (partially implemented)

---

## Context

During security audit of the tLOS development stack, two critical vulnerabilities were identified: NATS message broker and tlos-shell-bridge WebSocket were both binding to `0.0.0.0` (all network interfaces). On a shared network (e.g. coffee shop WiFi), any machine could:

- Subscribe to `tlos.>` and read all canvas state and agent messages
- Potentially publish to `tlos.shell.*` / `tlos.fs.*` subjects (read files, execute shell commands via tlos-shell-exec)
- Connect to the WebSocket on `:3001` and inject kernel messages into the frontend

Additionally, architectural discussion surfaced a longer-term concern: the WebSocket between the SolidJS shell and tlos-shell-bridge is itself a Web2 boundary protocol with no cryptographic binding to the Tauri app instance.

---

## Decision

**Immediate (implemented 2026-03-02):**

1. NATS binds to `127.0.0.1:4222` only — via `-a 127.0.0.1` flag in `grid.ps1`
2. tlos-shell-bridge WebSocket binds to `127.0.0.1:3001` only — changed in `tlos-shell-bridge/src/server.rs`

**Deferred (production milestone):**

3. Replace WebSocket + tlos-shell-bridge with Tauri IPC (`invoke` / `emit` / `listen`) — eliminates the open port entirely, cryptographically binds frontend↔backend to the app instance
4. Migrate shell UI renderer from WebView (Chromium Blink) to egui (wgpu, Rust-native) — eliminates the browser attack surface, achieves full sovereign native rendering

---

## Rationale

### Zero-Web2 Internal Mesh
tLOS architecture principle: no HTTP/REST between internal actors. All inter-service communication goes through NATS. WebSocket and HTTP are boundary protocols — WebSocket at the frontend edge (unavoidable given WebView renderer), HTTP only to external services (NVIDIA NIM, Nostr relays, Blossom). This is "Zero-Web2 internal mesh" — the principle applies to actor-to-actor communication, not to rendering engine or external API calls.

### WebView vs egui
WebView (Chromium/Blink) is a pragmatic current choice — enables SolidJS, Tailwind, fast iteration, large ecosystem. egui (Rust-native, wgpu) is the correct production target: no browser attack surface, single binary, direct GPU, truly sovereign. The migration is estimated at ~1 dev-year and is deferred until tLOS reaches product-market fit.

### Tauri IPC vs WebSocket
Tauri's built-in IPC bridge (`@tauri-apps/api`) is cryptographically bound to the app instance — no open TCP port, no possibility of external process injection. This is the correct architecture for the WebView era and should replace the current WebSocket approach before user distribution.

---

## Known Remaining Issues (MEDIUM, not yet fixed)

| Issue | Risk | Fix |
|-------|------|-----|
| `~/.tlos/identity.key` plaintext | Key exposed if machine compromised | `chmod 600`; long-term: OS keychain |
| `~/.tlos/nim-key` plaintext (future) | API credits exposed | Same as above |
| `actor`/`version` path in patch-daemon not sanitized | Path traversal if dev key compromised | Sanitize path components before `join()` |
| `CorsLayer::permissive()` in shell-bridge | Permissive CORS, low risk at localhost | Scope to localhost origin when WebSocket replaced |

---

## Consequences

- NATS and WebSocket are no longer accessible from external network interfaces
- Development workflow unchanged (all services still on localhost)
- Production distribution requires Tauri IPC migration before release
- egui migration is a long-term architectural goal, not a blocker

---

## Files Changed

- `nospace/development/tLOS/core/grid.ps1` — `nats-server -a 127.0.0.1`
- `nospace/development/tLOS/core/kernel/tlos-shell-bridge/src/server.rs` — `127.0.0.1:{port}`
