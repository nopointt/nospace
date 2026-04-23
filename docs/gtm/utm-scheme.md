# UTM Tagging Scheme — GTM-01

> Canonical UTM parameter scheme for all outbound links across GTM-01 waves.
> Every outbound link MUST carry these three UTM params.
> Source: D-GTM01-13.

## Format

```
?utm_source=<platform>&utm_medium=<channel>&utm_campaign=gtm-01-wave-<N>[&utm_content=<variant>]
```

## Fixed values

### `utm_source` — platform / surface

| Platform | utm_source |
|---|---|
| Hacker News post | `hn` |
| Hacker News comment | `hn-comment` |
| Reddit (any sub) | `reddit` |
| Reddit r/ClaudeAI | `reddit-claudeai` |
| Reddit r/LocalLLaMA | `reddit-localllama` |
| Reddit r/selfhosted | `reddit-selfhosted` |
| Reddit r/netsec | `reddit-netsec` |
| Reddit r/privacy | `reddit-privacy` |
| Reddit r/programming | `reddit-programming` |
| Reddit r/sideproject | `reddit-sideproject` |
| Twitter/X thread | `x-thread` |
| Twitter/X reply | `x-reply` |
| LinkedIn post | `linkedin-post` |
| LinkedIn DM | `linkedin-dm` |
| Indie Hackers post | `indiehackers` |
| Product Hunt | `producthunt` |
| Dev.to | `devto` |
| Hashnode | `hashnode` |
| Medium | `medium` |
| Hackernoon | `hackernoon` |
| Substack newsletter | `substack` |
| Discord (any) | `discord` |
| Claude Discord | `discord-claude` |
| LocalLLaMA Discord | `discord-localllama` |
| awesome-list repo | `awesome-<name>` (e.g. `awesome-claude-code`) |
| console.dev newsletter | `consoledev` |
| alternativeto.net | `alternativeto` |
| SaaSHub | `saashub` |
| StackShare | `stackshare` |
| Peerlist | `peerlist` |
| Uneed.best | `uneed` |
| Futurepedia | `futurepedia` |
| There's An AI For That | `theresanaiforthat` |
| Futuretools.io | `futuretools` |
| Toolify.ai | `toolify` |
| TopAI.tools | `topaitools` |
| Habr | `habr` |
| Vc.ru | `vcru` |
| Email (individual) | `email` |
| Press release | `press` |
| Influencer DM response | `influencer-<handle>` (e.g. `influencer-simonw`) |

### `utm_medium` — content type

| Content type | utm_medium |
|---|---|
| Forum / social post body | `post` |
| Comment / reply | `comment` |
| Article (blog, long-form) | `article` |
| Directory listing | `directory` |
| Newsletter | `newsletter` |
| Email (direct) | `email` |
| Documentation backlink | `docs` |
| Referral program | `referral` |
| Video description | `video` |
| Podcast show notes | `podcast` |

### `utm_campaign` — GTM wave

| Wave | utm_campaign |
|---|---|
| Pre-launch foundations (T-6..T-1) | `gtm-01-wave-0` |
| Primary launch day (T-0) | `gtm-01-wave-1` |
| Amplification (T+1..T+7) | `gtm-01-wave-2` |
| Tier 1 presence saturation (T+7..T+14) | `gtm-01-wave-3` |
| Tier 2 dev directories (T+14..T+21) | `gtm-01-wave-4` |
| Tier 3 AI directories (T+21..T+28) | `gtm-01-wave-5` |
| Long-form content (T+28..T+45) | `gtm-01-wave-6` |
| HN Show HN #2 + regional (T+45..T+60) | `gtm-01-wave-7` |
| Sustain + outreach (T+60..T+90) | `gtm-01-wave-8` |
| Thread bridging ongoing | `gtm-01-bridging` |

### `utm_content` — variant (optional, for A/B)

| Variant | utm_content |
|---|---|
| Default primary CTA | `cta-primary` |
| Secondary CTA | `cta-secondary` |
| Comparison table link | `compare` |
| Footer link | `footer` |
| Features block link | `features` |
| FAQ link | `faq` |
| Tweet 1 of thread | `t1` |
| Tweet N of thread | `tN` |
| HN title variant A | `v-a` |
| HN title variant B | `v-b` |

## Examples

### HN Show HN main post → landing

```
https://vault.contexter.cc/?utm_source=hn&utm_medium=post&utm_campaign=gtm-01-wave-1&utm_content=cta-primary
```

### r/ClaudeAI post → blog

```
https://blog.contexter.cc/why-i-built-contexter-vault/?utm_source=reddit-claudeai&utm_medium=post&utm_campaign=gtm-01-wave-1
```

### Twitter thread last tweet → GitHub

```
https://github.com/nopointt/contexter-vault?utm_source=x-thread&utm_medium=post&utm_campaign=gtm-01-wave-1&utm_content=t11
```

### awesome-claude-code PR row → landing

```
https://vault.contexter.cc/?utm_source=awesome-claude-code&utm_medium=directory&utm_campaign=gtm-01-wave-2
```

### Blog post cross-post on dev.to → original

```
https://blog.contexter.cc/why-i-built-contexter-vault/?utm_source=devto&utm_medium=article&utm_campaign=gtm-01-wave-2
```

## Rules

1. **Mandatory on every outbound link.** If the tracker is missing, add it before publish.
2. **Exactly 3 required params:** `utm_source`, `utm_medium`, `utm_campaign`. `utm_content` only for A/B splits.
3. **No spaces, no capitals.** All lowercase, dashes only.
4. **Wave consistency.** Every link posted during a wave carries that wave's campaign value. Cross-wave references reuse the wave the link was first published in.
5. **Redirect safety.** If publishing to a platform that strips query params (e.g. some short URL services), use a redirect layer (`https://contexter.cc/r/x-thread-t1` → redirects to proper UTM URL).
6. **Never reuse UTM from prior campaigns** — wave numbers are forward-only.
7. **Canonical URL is the clean one.** Server serves same page regardless of UTM, and `<link rel="canonical">` stays clean. UTM params only for analytics tracking, not for SEO.

## Implementation checklist per platform

Before first use of a platform, verify:
- [ ] Platform preserves query params in link previews
- [ ] Platform does not auto-wrap links into its own redirect (e.g. some email clients do this — may strip UTM)
- [ ] Reddit: check with old.reddit.com — sometimes strips UTM
- [ ] Twitter: t.co wrapper preserves full URL including UTM
- [ ] LinkedIn: preserves UTM in posts, may strip in DMs
- [ ] dev.to: preserves

If UTM is stripped by platform, use a branded short URL redirector.

## Analytics expectation

All UTM traffic captured by:
1. **Cloudflare Web Analytics** — shows `utm_source` breakdown in referrer report
2. **PostHog** (when CTX-11 analytics wave ships) — full UTM attribution with session tracking
3. **Manual log** — `docs/gtm/external-mentions.md` append every publication with UTM URL + platform

## Change log

- **2026-04-23:** Initial scheme locked per GTM-01 D-GTM01-13.
