# ADR 002: Rust strictly for MCP Servers and Tools

**Date:** 2026-02-22
**Status:** Accepted
**Context:** Historically, AI agents utilized Python bash scripts and loose system execution (`os.system()`). In a Web3/Rust native environment (tLOS), this presents severe security vulnerabilities and architectural mismatch.
**Decision:** All agent tools must be implemented as isolated Model Context Protocol (MCP) servers written in Rust. Execution must happen within Sandboxes (MicroVMs/Docker with seccomp profiles).
**Rationale:** 
- Rust's strict typing and memory safety prevents injection attacks from unpredictable LLM output.
- Aligns the tooling stack with the core tLOS kernel stack.
- Allows for strict Zero-Trust & Network Egress Control (Default-Deny) at the container level.
**Consequences:** Python is banned from the `/tools/` directory. All new tools require writing a Rust MCP manifest and setting up an isolated Docker Sandbox.
