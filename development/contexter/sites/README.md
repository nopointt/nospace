# contexter-sites

Monorepo for Contexter public surfaces:
- `packages/shared/` — design tokens, fonts, shared components
- `apps/vault-landing/` — deploys to vault.contexter.cc (created in P2)
- `apps/blog/` — deploys to blog.contexter.cc (created in P4)

Epic: CTX-14 (see `development/contexter/memory/contexter-astro-blog.md`)

## Setup
```
bun install
```

## Development
- `bun run dev:vault` — run vault-landing at http://localhost:4321
- `bun run dev:blog` — run blog at http://localhost:4322
