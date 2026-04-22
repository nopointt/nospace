---
# contexter-astro-blog.md — CTX-14 Astro Blog + Vault Landing Infrastructure
> Layer: L3 | Epic: CTX-14 | Status: 🔶 IN PROGRESS (decisions locked, spec pending)
> Created: 2026-04-22 (session 5, axis/vault-shared)
> Owner: Contexter project. Consumer: V-09 vault launch (posts #1-#3 publish here).
---

## Goal

Ship two new Cloudflare Pages subdomains under `contexter.cc`:

1. **`vault.contexter.cc`** — product landing для `contexter-vault` npm package (install CTA, features, comparison, FAQ, link to GitHub + docs)
2. **`blog.contexter.cc`** — Contexter-wide blog, hosts vault launch posts + future Contexter content

Both dark-mode-by-default, theme toggle (3-state system/light/dark), dev-friendly aesthetic matching Contexter brand.

## Scope Boundaries

**IN scope:**
- New monorepo at `development/contexter/sites/` with Bun workspaces
- Shared design tokens, fonts, components, layouts in `packages/shared/`
- Two Astro apps: `apps/vault-landing/` + `apps/blog/`
- SolidJS islands (existing framework in Contexter ecosystem)
- MDX content collections with Zod schema
- RSS + sitemap + JSON-LD per post
- OG image generation build-time
- Multi-author structure
- Two CF Pages deployments
- DNS records for subdomains

**OUT of scope (explicitly excluded):**
- Main `contexter.cc` — ZERO изменений. Existing Vite SPA at `development/contexter/landing/` not touched
- Migration of Dashboard/Upload/Viewer/Api/Settings pages
- Backend changes (Contexter API, auth, billing)
- CMS backend (content is git-versioned MDX)
- Light-theme-primary variant of new subdomains (dark is default + only toggle, no light-first)

## Active Decisions (locked)

| ID | Decision |
|---|---|
| **D-CTX14-01** | Deploy as two subdomains: `vault.contexter.cc` + `blog.contexter.cc`. NOT subpath under main domain. |
| **D-CTX14-02** | Monorepo at `development/contexter/sites/` using Bun workspaces. `packages/shared` + `apps/vault-landing` + `apps/blog`. |
| **D-CTX14-03** | Stack: Astro 5 (static output) + SolidJS islands via `@astrojs/solid-js` + Tailwind CSS 4 + MDX. |
| **D-CTX14-04** | Two separate CF Pages projects (`vault-contexter-cc` + `blog-contexter-cc`). Each builds one app from monorepo, custom domain на соответствующий subdomain. |
| **D-CTX14-05** | Theme default = dark. 3-state toggle (`system/light/dark`) in shared Header component. Persistence via `localStorage["contexter-theme"]` + inline `<script>` в `<head>` для no-FOUC. |
| **D-CTX14-06** | Main `contexter.cc` NOT TOUCHED. Existing Vite SPA at `development/contexter/landing/` не имеет никаких правок в этом эпике. |
| **D-CTX14-07** | Dark palette: canvas `#333333`, surface `#404040`, elevated `#4D4D4D`, pressed `#595959`, accent `#F5F501`, text primary `#FAFAFA`, text secondary `#CCCCCC`, text tertiary `#999999`, text disabled `#666666`, border subtle `#4D4D4D`, border default `#595959`, border strong `#808080`, error `#FF6B6B`, success `#66BB6A`, warning `#FFB300`, info `#F5F501`. |
| **D-CTX14-08** | Light palette: **mirror ALL tokens** from existing Contexter design system at `development/contexter/landing/src/index.css` @theme block (canvas `#FAFAFA`, text 4-step hierarchy `#0A0A0A/#333333/#666666/#999999`, bg 4-step `#FAFAFA/#F2F2F2/#E5E5E5/#D9D9D9`, border 3-step `#E5E5E5/#CCCCCC/#808080`, interactive hover/pressed `#F2F2F2/#D9D9D9`, signals `#D32F2F/#2E7D32/#F2C200/#1E3EA0`, accent `#1E3EA0`). Player reads existing CSS in P1 and copies ALL @theme tokens verbatim as light-mode base. Доступен для user override через toggle. |
| **D-CTX14-09** | Fonts: Inter (body, 400/500/700) + JetBrains Mono (code/accent display, 400/500/700) self-hosted WOFF2 subset (Latin + Cyrillic). Без Google Fonts CDN. |
| **D-CTX14-10** | Analytics: Cloudflare Web Analytics (CF Pages one-click enable). Privacy-first, no cookies, no GA4. |
| **D-CTX14-11** | RSS/Atom feed for `blog.contexter.cc` at `/rss.xml`. JSON feed at `/feed.json`. Link exposed from header `<link rel="alternate">`. |
| **D-CTX14-12** | Multi-author structure via Zod collection schema `authors/{slug}.json` with fields: name, bio, avatar (optional), github (optional), twitter (optional), website (optional). nopoint — первый автор. |
| **D-CTX14-13** | Cross-post strategy: primary publish on `blog.contexter.cc/vault/{slug}`, 48h delay cross-post на dev.to/Medium/Hashnode с `rel=canonical` → original URL. |
| **D-CTX14-14** | Primary CTA на `vault.contexter.cc`: `npm install -g contexter-vault` copy-button + "View on GitHub" link. Secondary: "Read the blog" → blog.contexter.cc. |
| **D-CTX14-15** | SEO: sitemap.xml auto-generated (`@astrojs/sitemap`), robots.txt explicit allow, Open Graph + Twitter Card meta per page, JSON-LD `BlogPosting` schema per post, canonical URLs. |
| **D-CTX14-16** | Build target: static HTML only. No SSR / no edge runtime / no server components. All dynamic behavior client-side (Solid islands). |
| **D-CTX14-17** | Pre-commit: TypeScript check (`bunx astro check`) passes + `bunx tsc --noEmit` clean. Content collections schema validation catches broken frontmatter. |
| **D-CTX14-18** | No hard deadline. Standard G3 pace: discovery → spec → Domain Lead audit → Player+Coach по фазам → QA. |

## Architecture

### Repository structure

```
development/contexter/sites/          ← new directory, monorepo root
├── package.json                       ← root, { "workspaces": ["packages/*", "apps/*"] }
├── bun.lock
├── tsconfig.base.json                 ← shared TS config
├── .gitignore
├── README.md
├── packages/
│   └── shared/                        ← design system + common components
│       ├── package.json
│       ├── src/
│       │   ├── tokens.css             ← :root (light) + [data-theme="dark"] overrides
│       │   ├── fonts/
│       │   │   ├── inter-400.woff2
│       │   │   ├── inter-500.woff2
│       │   │   ├── inter-700.woff2
│       │   │   ├── jetbrains-mono-400.woff2
│       │   │   ├── jetbrains-mono-500.woff2
│       │   │   └── jetbrains-mono-700.woff2
│       │   ├── components/
│       │   │   ├── Header.astro       ← logo + nav + theme toggle
│       │   │   ├── Footer.astro       ← copyright + links
│       │   │   ├── ThemeToggle.astro  ← 3-state system/light/dark
│       │   │   ├── CodeBlock.astro    ← Shiki syntax highlight wrapper
│       │   │   ├── Callout.astro      ← info/warn/success callout boxes
│       │   │   └── SEO.astro          ← meta tags component
│       │   ├── layouts/
│       │   │   ├── BaseLayout.astro   ← html/head/body scaffold
│       │   │   ├── MarketingLayout.astro  ← for vault-landing pages
│       │   │   └── BlogPostLayout.astro   ← for blog posts
│       │   └── lib/
│       │       ├── theme.ts           ← localStorage + prefers-color-scheme logic
│       │       ├── seo.ts             ← OG/JSON-LD helper functions
│       │       └── types.ts           ← shared TypeScript types
│       └── tsconfig.json
├── apps/
│   ├── vault-landing/                 ← deploys to vault.contexter.cc
│   │   ├── package.json
│   │   ├── astro.config.mjs
│   │   ├── tsconfig.json
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   └── og-default.png
│   │   └── src/
│   │       ├── pages/
│   │       │   └── index.astro        ← landing page
│   │       ├── components/            ← landing-specific sections
│   │       │   ├── Hero.astro
│   │       │   ├── HowItWorks.astro
│   │       │   ├── Features.astro
│   │       │   ├── Comparison.astro
│   │       │   ├── FAQ.astro
│   │       │   ├── InstallCTA.astro
│   │       │   └── islands/
│   │       │       └── CopyInstallCmd.tsx  ← Solid island
│   │       └── content/
│   │           └── faq.json           ← FAQ questions data
│   └── blog/                          ← deploys to blog.contexter.cc
│       ├── package.json
│       ├── astro.config.mjs
│       ├── tsconfig.json
│       ├── public/
│       │   └── favicon.svg
│       └── src/
│           ├── content/
│           │   ├── config.ts          ← Zod collection schemas
│           │   ├── posts/
│           │   │   └── 2026-04-27-why-i-built-contexter-vault.mdx
│           │   └── authors/
│           │       └── nopoint.json
│           ├── pages/
│           │   ├── index.astro        ← blog listing (paginated)
│           │   ├── [...slug].astro    ← individual post
│           │   ├── rss.xml.ts
│           │   ├── feed.json.ts
│           │   ├── tag/[tag].astro    ← tag filter
│           │   └── author/[slug].astro ← author profile
│           └── components/
│               ├── PostCard.astro
│               ├── TagBadge.astro
│               └── AuthorBio.astro
```

### Stack versions

| Package | Version | Source |
|---|---|---|
| `astro` | ^5 latest | npm |
| `@astrojs/solid-js` | latest | npm |
| `@astrojs/tailwind` | latest | npm |
| `@astrojs/mdx` | latest | npm |
| `@astrojs/rss` | latest | npm |
| `@astrojs/sitemap` | latest | npm |
| `@astrojs/check` | latest | npm |
| `tailwindcss` | ^4 | npm |
| `solid-js` | ^1.9 | npm |
| `@fontsource/inter` | ^5 | npm (для initial setup, потом копируем WOFF2 в shared/fonts/) |
| `@fontsource/jetbrains-mono` | ^5 | npm (same) |
| `shiki` | latest | bundled with Astro |
| `satori` | ^0.10 | npm — HTML→SVG for build-time OG images |
| `sharp` | ^0.33 | npm — SVG→PNG rasterization |
| `astro-og-canvas` | ^2 | npm — optional convenience wrapper over satori+sharp (evaluate in P5a) |

**NOTE:** `@vercel/og` EXPLICITLY EXCLUDED — requires edge runtime APIs incompatible with Astro static output (D-CTX14-16). Build-time OG must use `satori + sharp` via Astro endpoint with `export const prerender = true`.

### Routing

**vault.contexter.cc:**
- `/` → vault landing
- `/docs` → link to GitHub README (external)
- `/blog` → link to `blog.contexter.cc` (external)
- `/robots.txt`, `/sitemap.xml`

**blog.contexter.cc:**
- `/` → blog listing (10 per page, pagination)
- `/{slug}` → individual post
- `/tag/{tag}` → tag filter
- `/author/{slug}` → author profile
- `/rss.xml`, `/feed.json`
- `/robots.txt`, `/sitemap.xml`

### Deployment

**Two separate CF Pages projects:**

| Project | Domain | Build command | Output dir | Source path |
|---|---|---|---|---|
| `vault-contexter-cc` | `vault.contexter.cc` | `cd apps/vault-landing && bun run build` | `apps/vault-landing/dist` | `development/contexter/sites/` (monorepo root) |
| `blog-contexter-cc` | `blog.contexter.cc` | `cd apps/blog && bun run build` | `apps/blog/dist` | `development/contexter/sites/` (monorepo root) |

Both projects use monorepo root as build source so `packages/shared/` resolvable via workspaces.

**DNS (Cloudflare):**
- `vault.contexter.cc` → CNAME → `vault-contexter-cc.pages.dev`
- `blog.contexter.cc` → CNAME → `blog-contexter-cc.pages.dev`
- Proxied через CF (orange cloud) для HTTPS + CDN caching

## Phases

### P1 — Monorepo scaffold + shared package (Wave 0, blocking)

**Action:**
- Create `development/contexter/sites/` with root `package.json` + Bun workspaces config (`{ "workspaces": ["packages/*", "apps/*"] }`)
- Create `packages/shared/package.json` with `"name": "@contexter/shared"`, `"exports": { ".": "./src/index.ts", "./styles": "./src/tokens.css", "./fonts/*": "./src/fonts/*" }`, peerDeps: astro, solid-js, tailwindcss
- Install `@fontsource/inter` + `@fontsource/jetbrains-mono` in `packages/shared` (for WOFF2 source files only, CSS not imported)
- **WOFF2 extraction (critical for AC-10 no-CDN):** copy font files from `node_modules/@fontsource/inter/files/*-latin-*.woff2` + `*-cyrillic-*.woff2` (weights 400/500/700) to `packages/shared/src/fonts/`. Same for `jetbrains-mono`. Expected: ≥12 .woff2 files.
- Create `packages/shared/src/tokens.css`:
  - `@import "tailwindcss";`
  - `@theme { }` block with LIGHT palette — mirror ALL tokens from `development/contexter/landing/src/index.css` @theme verbatim (26 tokens)
  - `[data-theme="dark"] { }` block with DARK palette per D-CTX14-07 (override ALL 15+ light tokens with dark equivalents, same variable names)
  - `@variant dark (.dark &);` — Tailwind 4 class-based dark mode
  - Manual `@font-face` declarations (6 Inter + 6 JetBrains Mono) with `src: url('./fonts/xxx.woff2') format('woff2');` — NO `@fontsource/*/400.css` imports (those hit CDN).
- Create `packages/shared/src/components/{Header,Footer,ThemeToggle}.astro` + `ThemeToggle.tsx` (Solid island, use `onMount` not `createEffect`)
- Create `packages/shared/src/layouts/BaseLayout.astro`: inline `<script is:inline>` as FIRST head child reading `localStorage["contexter-theme"]` → toggle `.dark` on `<html>` BEFORE any CSS loads (no-FOUC)
- Create `packages/shared/src/index.ts` exporting Header, Footer, BaseLayout, ThemeToggle
- Each downstream app's `astro.config.mjs` will include `vite: { optimizeDeps: { exclude: ['@contexter/shared'] } }` (this is a note for P2/P4, not P1 action)
- TypeScript base config (`tsconfig.base.json`) + `.gitignore` + README.md
- Run: `cd development/contexter/sites && bun install`

**Verify (run all 5, must pass before commit):**
```bash
cd /c/Users/noadmin/nospace/development/contexter/sites

# V1: workspace install
bun install 2>&1 | tail -3
# Expected: "Done in Xs" no errors

# V2: shared package TS check
bun run -C packages/shared tsc --noEmit 2>&1 || echo "SKIP if no TS files yet"
# Expected: no output OR SKIP

# V3: fonts extracted (>= 12 files)
ls packages/shared/src/fonts/ | grep -c "\.woff2$"
# Expected: 12 or more

# V4: no CDN font references
grep -rE "fonts\.googleapis|fonts\.gstatic|use\.typekit|cdn\.jsdelivr|@fontsource/[a-z-]+/[0-9]" packages/shared/src/
# Expected: no output

# V5: dark palette + variant in tokens.css
grep -cE 'data-theme="dark"|@variant dark' packages/shared/src/tokens.css
# Expected: 2 or more
```

**Done when:**
- [ ] All 5 verify commands pass exit 0
- [ ] `packages/shared/src/tokens.css` содержит full light palette (~26 tokens mirrored) + dark palette override
- [ ] ≥12 WOFF2 files в `packages/shared/src/fonts/` (Latin + Cyrillic subsets only)
- [ ] `@font-face` declarations use relative `./fonts/` paths (no CDN)
- [ ] ThemeToggle island uses `onMount` not `createEffect` (SolidJS+Astro SSR safety)
- [ ] Inline head script for no-FOUC is FIRST child of `<head>` in BaseLayout
- [ ] `@contexter/shared` package has proper `exports` field
- [ ] Commit `feat(ctx14-p1): monorepo scaffold + shared package` + `GSD-Task: CTX-14 P1`

### P2 — vault-landing app shell

**Action:**
- Create `apps/vault-landing/` Astro app
- Configure `astro.config.mjs` with Solid + Tailwind + MDX integrations, `site: 'https://vault.contexter.cc'`
- Import shared package via workspace
- Build empty landing page that renders Header + Footer + ThemeToggle correctly

**Verify:**
```bash
cd apps/vault-landing
bun run build 2>&1 | tail -3
# Expected: "built in Xs", no errors
bun run preview &
sleep 3
curl -s http://localhost:4321/ | grep -o '<title>[^<]*</title>' | head -1
# Expected: something containing "Contexter Vault" or similar
kill %1 2>/dev/null
```

**Done when:**
- [ ] `bun run build` completes без errors
- [ ] HTML output содержит correct meta tags (OG + Twitter + canonical)
- [ ] Theme toggle работает в preview (dark default + switches к light + system)
- [ ] Header + Footer из shared package рендерятся

### P3 — vault-landing content

**Content brief (anchors for copy — Player may refine phrasing but must hit these anchors):**

*Hero:*
- Headline: `contexter-vault` (JetBrains Mono, accent color on dark)
- Subheading: "redact secrets from Claude Code before they leave your machine"
- Primary CTA: `npm install -g contexter-vault` (copy-button island)
- Secondary CTA: "View on GitHub" → `https://github.com/nopointt/contexter-vault`
- Tertiary: "Read the blog" → `https://blog.contexter.cc` (inline link, smaller)

*HowItWorks (3 steps):*
1. `contexter-vault init` — creates AES-256-GCM vault at `~/.contexter-vault/`, registers Claude Code hooks, sets `ANTHROPIC_BASE_URL=http://127.0.0.1:9277`
2. `contexter-vault add stripe-key` — encrypt secret into vault, assign `<<VAULT:name>>` placeholder
3. `claude chat` — proxy redacts placeholder values in outbound, substitutes back at tool execution time. Anthropic never sees the raw secret.

*Features (4 items, one paragraph each):*
1. **NDA-first design** — vault covers client credentials you're contractually obligated to protect. Your freelance work doesn't breach NDAs by default
2. **Zero runtime dependencies** — Bun + Node crypto. 500 lines of TypeScript. Auditable in an evening
3. **AES-256-GCM local vault** — key never leaves your machine. No cloud account, no telemetry, no sync service
4. **Works transparently** — uses the documented `ANTHROPIC_BASE_URL` env var. Same integration pattern as enterprise LLM gateways (Portkey, LiteLLM)

*Comparison (table, 4 columns — Feature, contexter-vault, raw env var, mitmproxy):*
- "Secrets redacted from prompts" — ✓ / ✗ / needs custom script
- "Zero-config install" — ✓ / ✓ / ✗ (CA install, per-app scripts)
- "Anthropic ToS clean" — ✓ / ✓ / ambiguous
- "Works with Claude Code CLI" — ✓ / partial (you strip manually) / ✓
- "Works with Claude Desktop app" — planned v0.3 / ✗ / ✓
- "Local AES-256-GCM vault" — ✓ / ✗ / ✗
- "Open source MIT" — ✓ / n/a / ✓

*FAQ (6 questions, data-driven from `content/faq.json`):*
1. Will Anthropic ban me for using this? → No. `ANTHROPIC_BASE_URL` is officially documented env var for LLM gateway setups. All auth headers forwarded unchanged. Usage attributable to your Anthropic account.
2. What's the performance overhead? → Negligible. Proxy adds <5ms per request. Streaming throughput unchanged.
3. How is this different from `dotenv`? → `dotenv` loads secrets into your shell where they can be read by anything. vault keeps secrets encrypted at rest, redacts them from network traffic, and substitutes only at exec time.
4. Does it work with Claude Desktop app? → Not in v0.2. v0.3 planned with HTTPS MITM + self-signed CA.
5. What if I leak the vault file? → AES-256-GCM encrypted. Key stored separately at `~/.contexter-vault/vault.key`. Both needed to decrypt. Use disk encryption as outer layer.
6. Is this replacing Claude Code itself? → No. It sits between Claude Code and Anthropic API. Transparent proxy. Claude Code works exactly as before.

*InstallCTA (bottom of page, bright yellow accent):*
- Single command: `npm install -g contexter-vault`
- Below: `contexter-vault init && contexter-vault start`
- Copy button on each (Solid island)
- Total setup time message: "30 seconds from install to redaction"

**Action:**
- Implement Hero section per content brief above (JetBrains Mono for headline, Inter for body, bright yellow accent on dark background, 0px corners, no shadows)
- Implement HowItWorks section (3-step flow, numbered, code snippets in monospace)
- Implement Features section per 4-item spec
- Implement Comparison table (use `<table>` with design system tokens, 4 columns, 7 rows)
- Implement FAQ section (data-driven from `apps/vault-landing/src/content/faq.json` with 6 Q&A items)
- Implement InstallCTA section (yellow #F5F501 accent on dark, two copy-buttons via Solid islands)
- Each section uses spacing tokens from shared (4px atom, 0-12 scale)
- Mobile layout: single column below 768px, stack sections, CTAs full-width
- Dark + light theme both render correctly (toggle in Header works)

**Verify:**
```bash
# Visual regression — compare Playwright screenshot to Pencil export (if exists)
# OR manual visual review via preview URL
cd apps/vault-landing && bun run build && bun run preview
# Manual: open http://localhost:4321/ in browser, tab through all sections, toggle theme
```

**Done when:**
- [ ] Вся страница в dark (default) + light рендерится без visual regressions
- [ ] Copy button на `npm install -g contexter-vault` работает (clipboard API)
- [ ] Все секции имеют правильные spacing tokens из shared/tokens.css
- [ ] Mobile layout (<768px) работает
- [ ] Lighthouse score 95+ на всех 4 метриках

### P4 — blog app shell + content collections

**Action:**
- Create `apps/blog/` Astro app
- Configure `astro.config.mjs` аналогично vault-landing
- Create content collection `posts` with Zod schema (title, description, pubDate, tags, author, draft, canonical, coverImage)
- Create content collection `authors` with schema (name, bio, avatar, github, twitter, website)
- Create `authors/nopoint.json`
- Shell pages: blog listing (empty), individual post route

**Verify:**
```bash
cd apps/blog
bun run build 2>&1 | tail -3
# Expected: no content collection validation errors
```

**Done when:**
- [ ] `bun run build` completes
- [ ] Content collection types auto-generated (`.astro/content.d.ts`)
- [ ] `nopoint.json` author validates against schema
- [ ] Blog listing renders (empty state если нет постов)

### P5 — blog post rendering + SEO

**Action:**
- Import blog post #1 (`2026-04-27-why-i-built-contexter-vault.mdx`) from finalized v9-launch-assets.md Section 5
- Implement BlogPostLayout with typography tokens + syntax highlighting
- Implement SEO meta (OG image build-time, Twitter Card, JSON-LD BlogPosting, canonical URL)
- Implement RSS feed generation
- Implement sitemap
- Implement tag pages + author profile pages

**Verify:**
```bash
cd apps/blog && bun run build
# Check RSS output
cat dist/rss.xml | head -20
# Expected: valid XML with <item> for the post

# Check sitemap
cat dist/sitemap-index.xml
# Expected: valid sitemap

# Validate JSON-LD
curl -s http://localhost:4321/why-i-built-contexter-vault | grep -A 20 'application/ld+json'
# Expected: BlogPosting schema with author, datePublished, headline
```

**Done when:**
- [ ] Blog post renders correctly в dark + light mode
- [ ] Code blocks имеют syntax highlight через Shiki
- [ ] RSS validates (W3C RSS validator OR `npx rss-parser` test)
- [ ] JSON-LD validates (Google Rich Results Test manually)
- [ ] OG image генерируется per-post (build-time, unique per slug)
- [ ] Canonical URL correct

### P6 — Deployment

**Action:**
- Create two CF Pages projects in Cloudflare dashboard
- Configure build commands, output dirs, environment
- Push branch, verify preview URL builds
- Add custom domains (vault.contexter.cc + blog.contexter.cc) в CF Pages project settings
- Add CNAME records в Cloudflare DNS
- Enable Cloudflare Web Analytics on both projects
- Verify HTTPS works, security headers correct

**Verify:**
```bash
# После cutover:
curl -sI https://vault.contexter.cc | grep -E "^(HTTP|server|content-type|x-frame)"
curl -sI https://blog.contexter.cc | grep -E "^(HTTP|server|content-type|x-frame)"

# Expected: 200, text/html, HTTPS works, CF edge serving

# Verify blog post accessible
curl -s https://blog.contexter.cc/why-i-built-contexter-vault | grep -o '<h1[^>]*>[^<]*</h1>'
# Expected: <h1>Why I built contexter-vault — redacting secrets before Claude Code sees them</h1>
```

**Done when:**
- [ ] Both subdomains respond 200 HTTPS
- [ ] Content renders identically to local preview
- [ ] CF Web Analytics enabled (verify в dashboard)
- [ ] RSS feed accessible at `blog.contexter.cc/rss.xml`
- [ ] sitemap accessible at both domains
- [ ] PR merged to `main`

## Acceptance Criteria

| ID | Criterion | Verify |
|---|---|---|
| AC-1 | `vault.contexter.cc` serves landing page with working install CTA | `curl -sI https://vault.contexter.cc` returns 200 |
| AC-2 | `blog.contexter.cc` serves blog index + blog post #1 | `curl -s https://blog.contexter.cc/why-i-built-contexter-vault` returns HTML with correct title |
| AC-3 | Dark theme default, toggle works system/light/dark | Manual browser test: clean localStorage, page defaults dark. Toggle cycles 3 states. Selection persists across reload. |
| AC-4 | RSS feed valid | `curl -s https://blog.contexter.cc/rss.xml` parses as valid RSS 2.0 |
| AC-5 | Sitemaps valid | `curl -s https://*/sitemap-index.xml` parses |
| AC-6 | Lighthouse 95+ на Performance / Accessibility / Best Practices / SEO | Lighthouse CLI run, screenshots attached to PR |
| AC-7 | CF Web Analytics enabled | Dashboard shows incoming data после 24h |
| AC-8 | Main `contexter.cc` не затронут | `curl -s https://contexter.cc` returns the same HTML hash as before CTX-14 start |
| AC-9 | Pre-commit: `astro check` + `tsc --noEmit` clean | `cd apps/* && bunx astro check && bunx tsc --noEmit` exit 0 |
| AC-10 | No external font CDN used | `grep -r "fonts.googleapis.com" apps/ packages/` returns no matches |

## Dependencies

- ✅ `contexter-vault@0.2.0` published on npm (V-09 depends on this for vault.contexter.cc CTA)
- ✅ GitHub repo `nopointt/contexter-vault` live (for "View on GitHub" link)
- ✅ Contexter existing CF Pages + DNS setup (adding two new subdomain records)
- ⬜ Blog post #1 finalized (already drafted in `contexter-vault-v9-launch-assets.md`, needs import to MDX)
- ⬜ Inter + JetBrains Mono WOFF2 files (download from @fontsource packages at P1)

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Bun workspaces + Astro integration has edge cases | MED | Prototype in P1 with minimal shared package. If issue — fallback to npm workspaces. |
| Solid islands не рендерятся correctly в Astro | MED | Astro officially supports Solid via `@astrojs/solid-js`. If issue — fallback к ванильному JS или React islands. |
| OG image generation build-time slow | LOW | @vercel/og tested на 100+ sites. Budget 3-5s per page. |
| Theme toggle flash on first paint | LOW | Inline head script runs before DOM paint. Tested pattern from Tailwind docs / Astro docs. |
| CF Pages 2 projects from one monorepo complicates CI | LOW | CF Pages supports monorepo source with custom build command path. Each project independent. |
| Content collection schema changes break existing posts | LOW | Schema locked в P4, post migrations are manual MDX edits. |
| DNS propagation delay during cutover | LOW | CF DNS typically <5min. Test via `dig @1.1.1.1 vault.contexter.cc` before announcing. |
| Lighthouse 95+ hard to hit on dark OG images | LOW | Static HTML + zero JS default = baseline Lighthouse 100. Only JS = theme toggle inline + one island for copy button. |

## Write Authority

| File | Owner |
|---|---|
| `memory/contexter-astro-blog.md` (this L3) | Axis |
| `memory/contexter-roadmap.md` — CTX-14 row | Axis |
| `development/contexter/sites/**` | G3 Player (backend-developer or gropius) during implementation. Coach reviews. |
| `blog/content/posts/*.mdx` | nopoint (post content) + Axis (fact-check via `contexter-vault check --surface blog`) |
| `blog/content/authors/*.json` | Axis |
| `packages/shared/src/tokens.css` | Axis + G3 Player. Locked D-CTX14-07/08 values. |

## Decision Log (append-only)

- **2026-04-22 (session 5):** CTX-14 opened. 18 D-CTX14 decisions locked. Monorepo + two subdomain deploys chosen over subpath + over full migration. Dark default + theme toggle finalized. Stack = Astro 5 + Solid islands + Tailwind 4 + MDX. Main contexter.cc explicitly out of scope. Next: Domain Lead audit of this spec → G3 Player+Coach per phase.
