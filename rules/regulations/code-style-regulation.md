# CODE STYLE REGULATION — AI-Agent Edition
> Applies to: all code produced by AI agents across all projects under /nospace.
> Authority: Senior Architect. Review cycle: per milestone.
> Premise: Code is written for agents to execute and agents to read. Humans review *intent*, not syntax.

---

## § 1 — Primary Principles

- **Simplicity over cleverness.** If an agent has to reason about what a function does, it is too complex. Rewrite it.
- **Explicit over implicit.** No magic. No hidden side effects. Every action is declared.
- **Single responsibility.** One function, one purpose. One module, one domain. No exceptions.
- **Fail loudly.** Errors must surface immediately with a clear message. Silent catches are forbidden.
- **Stateless by default.** Prefer pure functions. State is only introduced when unavoidable and always is isolated.

## § 2 — Structure & Size

- Files MUST stay under **400 lines**. If a file grows past this, split it before committing.
- Functions MUST stay under **30 lines**. Longer functions signal a missing abstraction.
- Nesting MUST stay under **3 levels deep**. Use early returns instead of deeply nested conditions.
- No file should do more than one job. If you cannot name a file with a single noun, it has too many jobs.

## § 3 — Contracts & Types

- Every function MUST have explicit input and output types. No untyped parameters.
- Use `unknown` for dynamic values and narrow with type guards. Never bypass type safety.
- All data shapes MUST be defined as dedicated types or interfaces — not inlined.
- API boundaries (inputs from external systems) MUST be validated at the entry point. Trust nothing incoming.

## § 4 — Error Handling

- MUST handle all error paths explicitly. No unhandled promise rejections or uncaught exceptions.
- Use typed error results (e.g., `Result<T, E>` pattern) for functions that can fail — not exceptions for control flow.
- Log the cause, the context, and the action taken. Never log "something went wrong".
- All external calls (network, FS, DB) MUST have timeout and retry logic defined.

## § 5 — Safety & Security

- NEVER trust external input. Validate and sanitize at every boundary.
- NEVER log secrets, tokens, or PII. Mask sensitive fields before any logging.
- NEVER commit environment variables or credentials. Use runtime injection.
- NEVER use `eval()`, dynamic code execution, or uncontrolled deserialization.

## § 6 — Scalability Defaults

- Design for horizontal scale from day one. No shared in-process state between workers.
- Prefer idempotent operations. The same input MUST produce the same output regardless of how many times it is called.
- All async operations MUST be cancellable and have a defined timeout.
- Avoid N+1 patterns. Batch reads are the default; single reads are the exception.

## § 7 — Agent-Readable Code

- Comments MUST explain *why*, not *what*. If the code requires a comment to explain what it does, rewrite the code.
- Function and variable names MUST be self-describing. `processUserPaymentRetry` beats `handler3`.
- MUST use consistent naming across the entire codebase. Synonyms introduce cognitive noise — pick one word per concept and stick to it.
- Use `TODO(agent): reason` for deferred work. It must include a reason, not just a task.
