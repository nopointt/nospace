# Press Kit — contexter-vault

> Last updated: 2026-04-23
> Canonical home: https://vault.contexter.cc
> Source: https://github.com/nopointt/contexter-vault
> npm: https://www.npmjs.com/package/contexter-vault

## One-line pitch (30 words)

contexter-vault is a local HTTP proxy that redacts API keys, client credentials, and secrets from Claude Code conversations before they leave your machine. Zero runtime dependencies, AES-256-GCM vault, MIT-licensed.

## Paragraph pitch (100 words)

contexter-vault sits between Claude Code and the Anthropic API as a local proxy. It scans every outbound message for registered secrets, swaps them for `<<VAULT:name>>` placeholders, and substitutes real values back only when a tool needs them at execution time. Anthropic only ever sees redacted prompts. The vault is a single AES-256-GCM encrypted file stored at `~/.contexter-vault/`, with the key on the user's machine. Zero runtime dependencies (TypeScript on Bun, 500 lines). MIT-licensed. Works transparently via the documented `ANTHROPIC_BASE_URL` env variable, same pattern as enterprise LLM gateways like Portkey or LiteLLM.

## Founder quote (short)

> "I want Anthropic's models to keep getting better, and I'm fine contributing my data to that, on my terms. The vault makes those terms explicit."
> — nopoint, solo developer

## Founder quote (long)

> "The thing I lose sleep over is client code. I do freelance work and the contracts I sign prohibit sharing the codebase with third-party AI services. Every time I paste an error log into Claude Code, a client token could go to Anthropic. contexter-vault turns that contract clause into a runtime guarantee — values I register in the vault never leave my machine, period."
> — nopoint

## Key facts

- **License:** MIT
- **Runtime:** Bun ≥1.0 on macOS, Linux, Windows
- **Dependencies:** 0 runtime dependencies (only `@types/bun` devDep)
- **Code size:** ~500 lines of TypeScript
- **Encryption:** AES-256-GCM via `node:crypto`
- **Vault location:** `~/.contexter-vault/`
- **Default port:** 9277 (configurable via `CONTEXT_VAULT_PORT`)
- **Integration:** `ANTHROPIC_BASE_URL` env var (officially documented by Anthropic)
- **Version:** 0.2.0 (2026-04-21)
- **Audit:** Full source in ~500 LOC, auditable in under an evening

## Tagline variants

- Short: "redact secrets from Claude Code"
- Medium: "redact secrets from Claude Code before they leave your machine"
- Developer: "a 500-line proxy that keeps client credentials out of your AI prompts"
- Security: "AES-256-GCM vault + transparent redaction for Claude Code"

## Differentiators

- Works with the `ANTHROPIC_BASE_URL` path Anthropic itself documents for gateways (Portkey, LiteLLM, Nexus)
- Not a SaaS, no cloud account, no telemetry
- Vault data never leaves the user's machine
- Transparent to Claude Code — no workflow change
- Open source, auditable, MIT

## What it is not

- Not a replacement for Claude Code
- Not a general AI model gateway (single integration: Anthropic)
- Not a secrets vault like HashiCorp Vault or 1Password (local file, single user, no team features)
- Does not redact arbitrary pasted source code (only values explicitly added to the vault)
- v0.2 does not work with Claude Desktop (planned for v0.3 via HTTPS MITM)

## Usage snippet

```bash
bun install -g contexter-vault
contexter-vault init
contexter-vault start
# Claude Code now talks to localhost:9277 which redacts secrets
# before forwarding to api.anthropic.com
contexter-vault add stripe-key  # encrypts secret, returns <<VAULT:stripe-key>>
```

## Assets

- Logo SVG: `brand/press-kit/logo.svg` (TBD)
- Logo PNG 1024×1024: `brand/press-kit/logo-1024.png` (TBD)
- Screenshots: `brand/press-kit/screenshots/` (TBD — init flow, vault list, redacted SSE view, blog post OG)
- Social card template: 1200×630 PNG (TBD)

## Press / media contact

- Email: `nopoint@contexter.cc`
- GitHub: https://github.com/nopointt
- Twitter/X: https://x.com/nopooint
- LinkedIn: https://www.linkedin.com/in/nopoint/

## Related links

- Blog post #1 (origin story + NDA angle): https://blog.contexter.cc/why-i-built-contexter-vault/
- npm package: https://www.npmjs.com/package/contexter-vault
- GitHub repo: https://github.com/nopointt/contexter-vault
- RSS feed: https://blog.contexter.cc/rss.xml
