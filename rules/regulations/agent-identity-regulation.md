# AGENT IDENTITY REGULATION — Per-Session JWT & Signed Handoffs
> Applies to: all agents operating under /nospace.
> Authority: Senior Architect. Review: per quarter.
> Tags: [agent-identity, jwt, signing, impersonation, authentication, mas]

---

## § 1 — Problem Statement

In a multi-agent system (MAS), agents communicate via artifacts (spec.md, commit-summary.md, MCP tool calls). Without identity verification, a compromised or injected agent can impersonate a Lead-level agent and forge high-privilege artifacts — bypassing RBAC (LLM06) and approval gates (HITL).

**Threat:** Agent Impersonation — a swarm agent crafts a message claiming to be CTO or Tech Lead, tricking downstream agents into executing unauthorized actions.

---

## § 2 — Identity Model

Each agent instance receives a **Session Identity Token (SIT)** at startup. The token:
- Proves the agent's role and instance ID.
- Is scoped to a single session (expires at session end).
- Is issued by the **Assistant Agent** (the sole identity authority).
- Is a signed JWT (HS256 minimum; RS256 preferred when key infrastructure matures).

```
┌─────────────────────────────────────────────────────────┐
│  SIT — Session Identity Token (JWT)                     │
│  Header: { alg: "HS256", typ: "JWT" }                  │
│  Payload:                                               │
│    iss: "assistant-agent"                               │
│    sub: "<agent-id>"          # e.g. "tech-lead-01"    │
│    role: "<rbac-role>"        # e.g. "tech-lead"       │
│    session_id: "<uuid>"                                 │
│    project: "<project-slug>"  # e.g. "tLOS"            │
│    iat: <unix-timestamp>                                │
│    exp: <unix-timestamp>      # session duration        │
│  Signature: HMAC-SHA256(header.payload, SESSION_SECRET) │
└─────────────────────────────────────────────────────────┘
```

---

## § 3 — Token Issuance Protocol

```
1. Agent starts → reads its L0-identity.md → sends identity claim to Assistant.
2. Assistant verifies L0-identity.md is unmodified (SHA-256 of the file).
3. Assistant issues SIT signed with SESSION_SECRET (from /private_knowledge — never exposed to agent).
4. Agent receives SIT. Stores in-memory only — NEVER writes to any file.
5. Agent attaches SIT to every outbound artifact and MCP tool call.
```

**SESSION_SECRET:**
- Stored in `/private_knowledge/context/longterm/` (age-encrypted, per api-gateway-regulation.md §8).
- Rotated every session start by Assistant.
- Never passed to any agent — only used by Assistant to sign and verify.

---

## § 4 — Artifact Signing (Cross-Agent Handoffs)

Every inter-agent artifact MUST carry a signature block at the end:

```markdown
---
<!-- agent-sig: jwt=<SIT_TOKEN> sha256=<sha256-of-content-above> -->
```

**Signing procedure (outbound agent):**
1. Finalize artifact content.
2. Compute `sha256(content_above_sig_block)`.
3. Append the `<!-- agent-sig: ... -->` line with the SIT and hash.

**Verification procedure (receiving agent):**
1. Extract `jwt` and `sha256` from the sig block.
2. Verify JWT signature with SESSION_SECRET (via Assistant — agent sends JWT to Assistant's `/verify` endpoint, receives `valid/invalid`).
3. Verify `sha256(content_above_sig_block)` matches.
4. Verify `role` in JWT payload is authorized to produce this artifact type (per RBAC).
5. **Any failure** → reject artifact, escalate to Assistant.

---

## § 5 — MCP Tool Call Authentication

All MCP tool calls from agents include the SIT in the `X-Agent-SIT` header:

```
POST /gate
X-Agent-SIT: <jwt>
Body: { tool, agent_id, justification }
```

The approval-router (`tools/auth-gates/approval-router.ts`) verifies the SIT before processing any gate request. Calls without a valid SIT are rejected with `401`.

---

## § 6 — Verification Endpoints (Assistant)

The Assistant exposes two internal endpoints for identity operations:

| Endpoint | Method | Purpose |
|---|---|---|
| `/identity/issue` | POST | Issue SIT for a new agent session |
| `/identity/verify` | POST | Verify a SIT (returns role + session_id or error) |

These endpoints are **not** exposed externally. Only agents within the /nospace network can reach them via the internal Gateway.

---

## § 7 — Revocation

A SIT is revoked when:
- Session ends (natural expiry via `exp` claim).
- nopoint or Assistant manually revokes (by blacklisting `session_id` in Assistant's in-memory revocation list).
- Integrity violation detected on any artifact signed by this SIT.

Revoked SITs are logged in `/memory/logs/system/identity-revocations-<date>.md`.

---

## § 8 — Implementation Phases

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** (current) | Policy defined, manual verification via Assistant's judgment | Active |
| **Phase 2** (next milestone) | Assistant HTTP server with `/identity/issue` and `/identity/verify` endpoints | Pending |
| **Phase 3** (maturity) | RS256 keypairs per session, rotating; full MCP middleware integration | Planned |

> Phase 1 establishes the convention and mental model. Agents SHOULD attach identity claims to artifacts even before cryptographic enforcement is in place.

---

## § 9 — Threat Covered

**Agent Impersonation:** A swarm agent or injected payload claims to be a Lead agent (CTO, Tech Lead) to bypass approval gates or escalate privileges. SIT verification prevents forged identity claims from being accepted by downstream agents or the approval-router.
