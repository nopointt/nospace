# LinkedIn Profile — /in/nopoint — Drafts + Setup Checklist

> Canonical URL: https://www.linkedin.com/in/nopoint
> Status: basic profile, no bio/headline
> Purpose: professional anchor for contexter ecosystem (founder credibility, recruiter discovery, B2B reach for Contexter RAG-as-API)

---

## Headline drafts (220 char max, single line shown next to name)

### Variant 1 — direct / product-led (148 char) — RECOMMENDED

```
Building Contexter (RAG as API) and contexter-vault (secrets redaction for Claude Code) · open source · MIT · ex-freelance dev · Astana
```

### Variant 2 — problem-led / B2B angle (165 char)

```
Helping AI-heavy teams ship faster without leaking secrets · Contexter (RAG as API) + contexter-vault (Claude Code proxy) · open source · MIT · Astana
```

### Variant 3 — concise / minimal (96 char)

```
Founder, Contexter — RAG as API · contexter-vault — secrets redaction for Claude Code · MIT
```

### Variant 4 — story / philosophical (180 char)

```
I build privacy infrastructure for AI workflows. Open source, zero telemetry, on-device keys. Contexter (RAG) + contexter-vault (Claude Code proxy). Astana, KZ.
```

**Recommendation: Variant 1.** Mirrors X bio. Product-first. Search-friendly keywords (RAG, API, Claude Code, secrets, open source, MIT).

---

## About section (2600 char max — use ~600-800 for readability)

```
I build small, focused tools for developers who use AI heavily and care about not leaking their secrets.

Two products, both open source under MIT:

→ Contexter (https://contexter.cc) — RAG as an API. Upload documents, get a Streamable HTTP MCP endpoint that any LLM client (Claude Code, ChatGPT, Cursor) can query. 308 text formats, 12 retrieval tools, semantic + lexical hybrid. Free 1GB tier, Pro $29/mo for 100GB. EU-hosted, GDPR-clean.

→ contexter-vault (https://vault.contexter.cc) — local proxy that strips API keys, tokens, and other secrets from Claude Code traffic before it reaches Anthropic. Runs on your machine. Zero telemetry. Solves the GitGuardian-documented 3.2% leak rate in AI-assisted commits (vs 1.5% baseline).

Why this exists: I'm not building a startup pretending to be something else. I'm a freelancer who got tired of pasting NDA-covered code into Claude and crossing my fingers. Built the proxy for myself, then realized other people had the same fear.

Stack: Bun, TypeScript, Hono, SolidJS, Cloudflare Workers/Pages, PostgreSQL. Everything self-hostable.

Currently solo. Open to:
· Co-founder conversations (GTM/marketing especially)
· B2B inquiries (Contexter for teams)
· Security researcher review (contexter-vault threat model)
· Honest critique

Based in Astana, KZ. Working remote.
```

**Length:** ~1100 chars. Under the limit, scannable.

---

## Profile fields

| Field | Value |
|---|---|
| First name | `no` (or real first name if preferred) |
| Last name | `point` (or real surname) |
| Headline | Variant 1 above |
| Pronouns | skip (privacy) OR fill if comfortable |
| Location | `Astana, Kazakhstan` |
| Industry | `Software Development` |
| Custom URL | `linkedin.com/in/nopoint` ✓ already set |
| Profile photo | same `no` monogram as X (visual consistency) OR real photo for credibility (LinkedIn audience expects faces) |
| Cover image | 1584×396 — reuse X header design at LinkedIn dimensions |
| Open to work | OFF (founder, not job-seeking) |
| Providing services | OFF for now (post-launch can enable "Software Development" if Contexter consulting offered) |
| Contact info | Add: contexter.cc website, nopoint@contexter.cc email, github.com/nopointt, x.com/nopooint |

---

## Cover image spec (1584×396 PNG)

Same Bauhaus style as X header, different aspect ratio:

- Background: #333333 charcoal
- Left third: lowercase `nopoint` in JetBrains Mono 64px, color #F5F501
- Right two-thirds: 3-line stack
  - `contexter` — #FAFAFA 22px
  - `contexter-vault` — #FAFAFA 22px
  - `· mit · 0 deps · astana` — #999999 16px
- No other elements

**Placeholder option:** solid #333333 PNG with `nopoint` centered — ship now, redesign later.

---

## Featured section (3 items pinned at top)

After launch, pin in this order:

1. **Link** — `https://contexter.cc` (auto-fetches preview card)
2. **Link** — `https://vault.contexter.cc` (auto-fetches preview)
3. **Link** — `https://news.ycombinator.com/item?id=XXXXX` (HN Show HN thread, after T-0)

Pre-launch fill: pin only Contexter + vault landing pages.

---

## Experience section

### Current — Founder, Contexter (2025-12 → present)

**Title:** Founder
**Company:** Contexter (set up as company page later — for now type as text)
**Location:** Astana, Kazakhstan · Remote
**Description:**

```
Building two open-source tools for AI-heavy developer workflows:

→ Contexter — RAG as API (Streamable HTTP MCP, 308 formats, hybrid semantic+lexical retrieval). EU-hosted. Free 1GB / Pro $29-mo 100GB.

→ contexter-vault — local Claude Code proxy that redacts secrets before they leave the machine. Solves GitGuardian-documented 3.2% leak rate in AI-assisted commits.

Stack: Bun, TypeScript, Hono, SolidJS, Cloudflare. Both MIT.

Solo for now. Open to co-founder conversations and B2B inquiries.
```

### Previous — leave existing entries OR add a generic line

If profile has prior roles, keep them. If empty, optional:

```
Freelance Software Developer (2020 → 2025)
Various clients · Remote
Custom backend, frontend, integrations. Built the kind of stack switches that make you appreciate small focused tools.
```

---

## Skills (top 5 pinned)

1. TypeScript
2. Cloudflare Workers
3. Retrieval-Augmented Generation (RAG)
4. AI/ML Infrastructure
5. Open Source Software

(LinkedIn allows up to 50, but only 5 show on profile. Pick the 5 most aligned with Contexter pitch.)

---

## Languages

- English (Professional working)
- Russian (Native or bilingual)
- Kazakh (skip unless comfortable)

---

## What goes in posts (post-launch cadence)

LinkedIn ≠ X. Different voice. Longer-form, less ironic, more "what I learned" framing.

**Post types that work on LinkedIn:**

1. Build-in-public milestone — "Shipped X today. Here's what surprised me." Honest, not boastful.
2. Technical mini-essay — "Why we picked Bun over Node for Contexter (and where it bit us)." 800-1200 chars, no fluff.
3. Founder reflection — "Solo founder month 5. What I'd tell month 1 me." Once per month max.
4. Industry observation — "GitGuardian's 2026 secrets-sprawl report has one number that nobody is talking about." Lead with the data.

**What does NOT work on LinkedIn (avoid):**

- "Excited to announce" openings
- Emoji-heavy lists
- Humble brags ("blessed to share...")
- Pure self-promo without insight

**Cadence:** 1-2 posts per week post-launch. Quality over volume.

---

## First-week engagement strategy (no self-promo)

Day 1-2: connect with 20-30 people from existing network + 10 strategic adds (founders in adjacent space, VCs covering AI infra, developer advocates from Anthropic/Cloudflare/Vercel).

Day 3-5: comment thoughtfully on 2-3 posts per day from connections. Specific, value-additive comments. NOT "great post!" — concrete reactions.

Day 6-7: one original post — pick from post types above. Soft introduction of what you're working on, no link to product yet.

Day 8+: first product-adjacent post. Still no aggressive CTA.

**Launch post goes live at T-0** (2026-04-29) after HN submission. Different copy than X thread — long-form essay framing.

---

## T-0 launch post (LinkedIn version)

Different from X thread. Longer, more story-driven. Single post, not thread.

**Draft (1800 chars):**

```
Five months ago Anthropic asked me if they could use my Claude Code conversations for training data. I declined. Standard opt-out.

But the question stuck. Because half of what I'd typed into Claude that month was code I'd promised — in writing, NDA-covered — to keep private.

Not Claude's fault. The opt-out works. But it made me look at the Claude Code proxy chain honestly: my keystrokes → Claude Code (local) → Anthropic API (cloud) → Anthropic infra. The middle step is mine. The last two aren't.

GitGuardian's 2026 report came out a month later. AI-assisted commits leak secrets at 3.2% — more than double the 1.5% baseline. The pattern wasn't "bad developers". It was "AI tools are pattern-matchers and they pattern-match secrets right into commit messages and prompts".

So I built a thing.

contexter-vault is a local HTTP proxy. It sits between Claude Code and the Anthropic API. Every request that goes out gets scanned. AWS keys, GitHub tokens, OpenAI keys, JWTs, generic high-entropy strings — all caught and replaced with placeholders before the request leaves your machine.

Source code: github.com/nopointt/contexter-vault
Live demo: vault.contexter.cc
MIT license. Zero telemetry. One Bun binary, one config file.

I am not selling anything here. There is no SaaS tier. There is no signup. You install it, you point Claude Code at localhost, you forget about it.

What it does NOT do: prevent Anthropic from using your conversations (use opt-out for that). Block prompt injection. Redact secrets that you knowingly paste into chat (different problem, different tool).

What it DOES do: stop the keys you forgot you had in your env file from ending up in someone else's training set.

If you use Claude Code on code you can't fully share, this might be for you.

If you find a redaction the regex misses, open an issue. I want to know.
```

Edit before posting. Replace `github.com/nopointt/contexter-vault` with actual public repo URL when migrated from private (current blocker).

---

## Minimum manual time from nopoint

**Profile setup — 15 minutes:**

1. Copy Variant 1 headline into profile
2. Paste About section
3. Add/update Experience (Founder, Contexter)
4. Pin top 5 Skills
5. Update Featured section (Contexter + vault landing pages)
6. (Optional) Upload cover image placeholder
7. Add contact info (email, GitHub, X, website)

**Day 1-7 engagement — ~15 minutes/day:**

- 3-5 new connection requests with personalized note (1 line max)
- 2-3 thoughtful comments on connection posts
- (Day 6+) draft + publish first original post

**T-0 launch — 10 minutes:**

- Publish launch post (copy above, edited)
- Pin to Featured section
- Reply to first 5 comments

---

## What Axis does autonomously

- Draft all post copy, pass through Редакция
- Suggest specific connection targets weekly (founders, devs, investors in adjacent space)
- Log all published posts in `docs/gtm/external-mentions.md`
- Monitor profile views + post impressions weekly via screenshot

---

## What Axis needs from nopoint ongoing

- Screenshot of profile analytics (monthly)
- Consent before publishing any original post (drafts only from Axis)
- Decision on first/last name field — keep `no point` matching X, OR use real legal name for higher LinkedIn credibility (audience-dependent, B2B inquiries work better with real name)
