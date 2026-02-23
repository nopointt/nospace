# EXPLANATION: Architecture Vision & Native-First Philosophy

**Project:** tLOS (The Last OS)
**Quadrant:** Explanation (Why we build this way)

---

## 1. Zero-Web2 Rule (The Core Axiom)

tLOS is not a web framework. It is a sovereign spatial operating system. 
The most critical architectural decision we made is the **Zero-Web2 Rule**:
> NO HTTP/REST/WebSockets between internal actors.

**Why?**
Traditional Web2 architectures rely on network boundaries that are inherently insecure, stateful, and latent. In a localized, decentralized OS, internal components (Actors) should communicate via memory-safe, strongly-typed interfaces.

**How?**
We use the WebAssembly Component Model (Witty/WIT interfaces) for 100% of internal communication. Actors are compiled to `wasm32-wasip2`.
When Actor A needs to talk to Actor B, it happens via the NATS message bus at the L1 Grid layer, not via a REST API.

## 2. The 4-Layer Concept

1. **L0 Meta:** Governance, identity, and consensus rules.
2. **L1 Grid:** The NATS mesh providing a decentralized transport layer.
3. **L2 Kernel:** Rust + Axum + Wasmtime. The heavy lifter that executes the WASM components.
4. **L3 Shell:** SolidJS canvas. The spatial interface where the user interacts.

## 3. Why Rust?

Rust provides the holy trinity for a decentralized OS:
- **Memory Safety:** No garbage collector, zero-cost abstractions, provable safety.
- **WASM Support:** First-class compilation to the WebAssembly Component Model.
- **Deterministic Compilation:** Crucial for Reproducible Builds in our CACD pipeline to ensure network consensus.

Any attempt to introduce Python, Node.js, or Go into the Kernel (L2) layer violates this vision.
