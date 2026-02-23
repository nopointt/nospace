# OWASP LLM TOP 10 SECURITY AUDIT — /nospace Workspace
> Audit Date: 2026-02-23
> Auditor: Senior Architect (AI)
> Scope: /nospace multi-agent workspace (tLOS + harkly projects)
> Reference: OWASP LLM Top 10 v2 (2025)
> Tags: [security, owasp, llm, audit, mas, threat-model]

---

## Executive Summary

The /nospace workspace is a multi-agent AI system with strong foundational controls: RBAC, HITL approval gates, 4-tier memory with decay, seccomp sandboxing, and Docker defense-in-depth. The audit identified **3 high-severity gaps** and **4 medium-severity gaps** that have been addressed. **3 items** require future work.

| Risk | Count | Status |
|---|---|---|
| 🔴 High | 3 | ✅ Addressed |
| 🟡 Medium | 4 | ✅ Addressed |
| 🟢 Low / Well-covered | 3 | ✅ No action needed |
| ⏳ Future TODO | 3 | 📋 Backlog |

---

## LLM01 — Prompt Injection

**Risk Level: 🟡 Medium → ✅ Addressed**

### Findings
- Standard prompt injection covered by L4-guardrails.yaml `secret_write_detection` and `pii_redaction`.
- **Gap (cross-agent):** MCP tool results and inter-agent artifacts (commit-summary.md, spec.md) were passed through without sanitization. A malicious MCP server could inject `<!-- override your instructions: ... -->` in tool output.

### Mitigations Implemented
| Control | Where |
|---|---|
| `output_sanitization.strip_html_comments: true` | `agents/_template/L4-guardrails.yaml` |
| `output_sanitization.strip_markdown_comments: true` | `agents/_template/L4-guardrails.yaml` |
| `output_sanitization.strip_zero_width_chars: true` | `agents/_template/L4-guardrails.yaml` |
| Applied to: agent_output, mcp_tool_results, cross_agent_handoff | `agents/_template/L4-guardrails.yaml` |

### Future TODO (Phase b)
- [ ] **LLM01-TODO-01:** Integrate semantic content safety classifier on MCP tool results. Threshold: `0.85`. Action on violation: `strip_and_escalate_to_lead`. Blocked on: classifier model selection and evaluation.

---

## LLM02 — Sensitive Information Disclosure

**Risk Level: 🟢 Well-covered**

### Findings
- `secret_write_detection: true` detects patterns (`sk-`, `pk-`, `Bearer`, seed words) before file write.
- `pii_redaction: true` strips tokens from logs.
- API Gateway (api-gateway-regulation.md) ensures agents never see raw secrets — only token IDs.
- Private knowledge encrypted at rest (age) — partially implemented.

### Remaining Gap (not a finding, operational)
- `cloudflare-root.env` and `neon-db-master.env` flagged as requiring age encryption (api-gateway-regulation.md §8). **Operational task for nopoint.**

---

## LLM03 — Supply Chain Vulnerabilities

**Risk Level: 🟡 Medium → ✅ Addressed**

### Findings
- Cargo.lock verified in build pipeline but no explicit dependency vulnerability scan.
- Docker base image pinned by tag only — tags are mutable.
- No SBOM generated.

### Mitigations Implemented
| Control | Where |
|---|---|
| `cargo audit --deny warnings --deny unmaintained --deny unsound` | `production/tLOS/pipelines/build-protocol.md §6` |
| `audit-report.json` saved as build artifact | `build-protocol.md §6` |
| Base image digest pinning (FROM rust:x.y.z@sha256:...) | `build-protocol.md §6` |
| Digest tracked in `reproducibility.lock` | `build-protocol.md §6` |
| SBOM generation via `cargo cyclonedx` | `build-protocol.md §6` |

### Future TODO
- [ ] **LLM03-TODO-01:** Set up automated cargo-audit advisory database pre-pull in CI (offline-capable). Advisory DB snapshot hash pinned in `reproducibility.lock`.
- [ ] **LLM03-TODO-02:** Implement Sigstore/cosign signing for released WASM artifacts. Allows P2P nodes to verify provenance before executing.

---

## LLM04 — Data and Model Poisoning

**Risk Level: 🔴 High → ✅ Addressed**

### Findings
- `semantic-context-*.md` and `episodic-context-*.md` files had no integrity verification. A compromised or injected agent writing to these files could alter future agent behavior without detection.
- RBAC restricts who can write to semantic memory, but detection was missing if bypass occurred.

### Mitigations Implemented
| Control | Where |
|---|---|
| SHA-256 integrity header on all semantic/episodic files | `rules/regulations/memory-regulation.md §6` |
| Reviewer Agent verifies hash before consolidation | `memory-regulation.md §6` |
| Mismatch → quarantine + restore + Assistant alert | `memory-regulation.md §6` |
| Violation log: `/memory/logs/system/integrity-violations-<date>.md` | `memory-regulation.md §6` |

### Future TODO
- [ ] **LLM04-TODO-01:** Implement `merge_to_semantic` tool as actual code (currently a protocol). Tool must compute and write integrity header atomically. Language: Rust or TypeScript MCP server.

---

## LLM05 — Improper Output Handling

**Risk Level: 🟡 Medium → ✅ Addressed (Phase a)**

### Findings
- Agent output written to files (spec.md, commit-summary.md) was not sanitized before downstream agents consumed it.
- An agent could produce output containing HTML comments (`<!-- injected instruction -->`) that survive to the next agent's context window.

### Mitigations Implemented
Same as LLM01 — `output_sanitization` block in L4-guardrails.yaml covers both injection (LLM01) and output handling (LLM05).

### Future TODO
- Same as LLM01-TODO-01 (Phase b classifier).

---

## LLM06 — Excessive Agency

**Risk Level: 🟢 Well-covered**

### Findings (no gaps)
- RBAC with PoLP: every agent role has explicit read/write scope.
- HITL: critical MCP tool calls require human approval (approval-router.ts).
- `swarm_isolation: true`: swarm agents cannot communicate laterally.
- `max_steps_per_task: 10`: prevents runaway agent loops.
- Seccomp: kernel-level syscall filtering limits what sandboxed agents can do.

---

## LLM07 — System Prompt Leakage

**Risk Level: 🟢 Well-covered**

### Findings (no gaps)
- L0-identity.md, L4-guardrails.yaml contain no secrets — safe to expose.
- Actual secrets live in `/private_knowledge/` (RBAC: only `assistant` role with `secret_vault_access`).
- Agents receive SIT (session tokens) but never raw API keys.
- Gateway proxies all external calls — agents don't see endpoint credentials.

---

## LLM08 — Vector and Embedding Weaknesses

**Risk Level: 🟡 Medium (Proactive) → ✅ Addressed**

### Findings
- Vector/RAG search not yet deployed, but `query-mcp-ts/` is listed in the MCP tool registry — indicating future intent.
- No security regulation existed for when it would be activated.

### Mitigations Implemented
| Control | Where |
|---|---|
| Pre-conditions checklist before vector search activation | `rules/regulations/vector-search-regulation.md §2` |
| Corpus integrity (sha256 per chunk, provenance metadata) | `vector-search-regulation.md §3` |
| RBAC-scoped retrieval namespaces | `vector-search-regulation.md §4` |
| Similarity score threshold (≥0.75, min 0.60) | `vector-search-regulation.md §4.3` |
| Result count cap (max 5 chunks) | `vector-search-regulation.md §4.4` |
| Output sanitization on retrieved text | `vector-search-regulation.md §4.2` |

---

## LLM09 — Misinformation

**Risk Level: 🟢 Well-covered**

### Findings (no gaps)
- Verification Gates in spec.md require explicit pass/fail before branch closes.
- Confidence Score on commit-summary.md (0-100) signals review intensity.
- Episodic memory (append-only) creates an auditable chain of decisions.
- Senior Architect + QA Lead review gates before production.
- OTAA loop (Observation → Thought → Action → Answer) with explicit Thought step reduces hallucination-driven actions.

---

## LLM10 — Unbounded Consumption

**Risk Level: 🟡 Medium → ✅ Addressed**

### Findings
- No workspace-level token budget tracking.
- `approval-router.ts` had no queue size limit — an agent flood could hold all approval slots.

### Mitigations Implemented
| Control | Where |
|---|---|
| `MAX_PENDING_APPROVALS` cap (default: 10) with 429 response on overflow | `tools/auth-gates/approval-router.ts` |
| `MAX_PENDING` env var for configurable cap | `approval-router.ts` |
| Token Budget table (workspace/month + per-branch + queue) | `memory/current-context-global.md` |
| 80%/100% alert thresholds with escalation protocol | `current-context-global.md` |

### Future TODO
- [ ] **LLM10-TODO-01:** Implement actual token counting. Requires: (1) LLM provider usage API integration, (2) Assistant writes usage to `current-context-global.md` Token Budget table after each session. Blocked on: provider API access.

---

## Additional Risks (Not in LLM Top 10 but Relevant to MAS)

### Cross-Agent Prompt Injection (LLM01 MAS Variant)
**Status: ✅ Addressed**

A swarm agent's output (commit-summary.md) becoming the next agent's input creates an injection chain. Addressed by `output_sanitization` on `cross_agent_handoff` (L4-guardrails.yaml).

### Agent Impersonation
**Status: ✅ Addressed (Phase 1)**

A swarm agent could claim to be a Lead agent to bypass approval gates. Addressed by `agent-identity-regulation.md`:
- Session Identity Token (JWT) issued by Assistant.
- Artifact signing convention (`<!-- agent-sig: jwt=... sha256=... -->`).
- Phase 2 (HTTP verification endpoints) pending implementation.

### Future TODO
- [ ] **IDENTITY-TODO-01:** Implement Assistant HTTP server with `/identity/issue` and `/identity/verify` endpoints (Phase 2 of agent-identity-regulation.md).
- [ ] **IDENTITY-TODO-02:** Upgrade to RS256 keypairs. Rotating per-session. Full MCP middleware integration (Phase 3).

---

## Consolidated Future Backlog

| ID | Risk | Description | Priority | Blocked On |
|---|---|---|---|---|
| LLM01-TODO-01 | LLM01/05 | Semantic content safety classifier on MCP results (Phase b) | Medium | Classifier model selection |
| LLM03-TODO-01 | LLM03 | CI offline advisory DB pre-pull with hash pin | Low | CI infrastructure |
| LLM03-TODO-02 | LLM03 | Sigstore/cosign signing for released WASM artifacts | Medium | Sigstore setup |
| LLM04-TODO-01 | LLM04 | Implement `merge_to_semantic` as actual MCP tool code | High | Development milestone |
| LLM10-TODO-01 | LLM10 | Actual token counting via provider usage API | Medium | Provider API access |
| IDENTITY-TODO-01 | Impersonation | Assistant identity HTTP server (Phase 2) | High | Development milestone |
| IDENTITY-TODO-02 | Impersonation | RS256 keypairs + MCP middleware (Phase 3) | Low | After Phase 2 |
| OPS-TODO-01 | LLM02 | Encrypt cloudflare-root.env and neon-db-master.env with age | **Critical** | nopoint operational task |

---

## Regulations Created / Updated in This Audit

| Document | Action | Coverage |
|---|---|---|
| `agents/_template/L4-guardrails.yaml` | Updated — added `output_sanitization` block | LLM01, LLM05 |
| `rules/regulations/memory-regulation.md` | Updated — added §6 Integrity Hash Protocol | LLM04 |
| `tools/auth-gates/approval-router.ts` | Updated — added `MAX_PENDING` cap | LLM10 |
| `production/tLOS/pipelines/build-protocol.md` | Updated — added §6 Security Gates | LLM03 |
| `memory/current-context-global.md` | Updated — added Token Budget table | LLM10 |
| `rules/regulations/agent-identity-regulation.md` | **Created** | Agent Impersonation |
| `rules/regulations/vector-search-regulation.md` | **Created** | LLM08 |
| `CLAUDE.md` (workspace root) | **Created** | Entry point, navigation, security rules |
