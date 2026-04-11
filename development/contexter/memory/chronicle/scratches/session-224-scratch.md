# session-scratch.md
> Active · Axis · 2026-04-01 · session 223

<!-- ENTRY:2026-04-01:CHECKPOINT:222:contexter:contexter-auth [AXIS] -->
## 2026-04-01 — checkpoint 222 [Axis]

**Decisions:**
- D-11: EN default, RU/EN toggle in navbar, localStorage persistence
- D-12: Pricing tiers: Free ($0) / Starter ($9) / Pro ($29) — based on verified unit economics (~$0.22/user/mo)
- D-13: Pre-launch support: $10 = 1 month Pro after launch. Time counts from launch day.
- D-14: Payment methods: NOWPayments (crypto, fiat needs minimal KYB) + direct bank transfer (Halyk Bank SWIFT)
- D-15: $500 goal: $50 Jina + $150 server + $300 unblock banking → Stripe
- D-16: font-mono only for code/data, Inter (font-sans) for all UI text via global inheritance
- D-17: Jina pricing: prepaid packages ($50/1B, $500/11B), NOT pay-per-use. Free = CC-BY-NC (non-commercial!)

**Files changed:**
- `web/src/lib/i18n.ts` — created i18n system (signal-based, t() helper, EN/RU)
- `web/src/lib/translations/en.ts` — ~400 translation keys
- `web/src/lib/translations/ru.ts` — ~400 translation keys
- `web/src/components/Nav.tsx` — RU/EN toggle, Upload link → /app
- `web/src/pages/Hero.tsx` — i18n, paste input field, pre-order section (crypto + bank transfer + $500 breakdown), roadmap, dynamic NOWPayments invoice via /api/billing/support
- `web/src/pages/Landing.tsx` — full i18n, pricing section (3 tiers), pre-launch section, roadmap section, Bauhaus composition fixes
- `web/src/pages/Dashboard.tsx` — i18n
- `web/src/pages/Settings.tsx` — i18n
- `web/src/pages/ApiPage.tsx` — i18n
- `web/src/pages/Login.tsx` — i18n
- `web/src/pages/Register.tsx` — i18n
- `web/src/pages/ForgotPassword.tsx` — i18n
- `web/src/pages/ResetPassword.tsx` — i18n
- `web/src/pages/VerifyEmail.tsx` — i18n
- `web/src/pages/DocumentViewer.tsx` — i18n, gap fixes
- `web/src/components/AuthModal.tsx` — i18n
- `web/src/components/ConnectionModal.tsx` — i18n, line-height/gap/padding fixes
- `web/src/components/DocumentModal.tsx` — i18n, line-height/gap fixes
- `web/src/components/Badge.tsx` — i18n, font-mono removed
- `web/src/components/Button.tsx` — font-mono removed
- `web/src/components/DropZone.tsx` — i18n, paste handling
- `web/src/components/PipelineIndicator.tsx` — i18n
- `web/src/components/ErrorState.tsx` — i18n
- `web/src/components/Logo.tsx` — text-xl → text-[20px]
- `web/src/components/Toast.tsx` — font-mono removed
- `web/src/components/Input.tsx` — font-mono removed
- `web/src/lib/api.ts` — createSupportInvoice() added
- `src/routes/billing.ts` — POST /api/billing/support endpoint (dynamic NOWPayments invoice)

**Completed:**
- i18n system + all pages/components translated (EN default)
- Paste input field replacing ctrl+v button on Hero
- Pricing section on Landing (Free/Starter/Pro)
- Pre-order section on Hero (crypto + bank transfer)
- Dynamic NOWPayments invoice via backend
- Roadmap section (Now / After launch / Growth) on both Landing + Hero
- Bauhaus audit (Bayer): 7 CRITICAL, 18 HIGH, 12 MEDIUM findings
- font-mono cleanup: 131 → 21 (only code/data)
- Composition fixes: double padding, clamp(), tracking, line-height, gaps
- Competitor analysis + audience voice research integrated into roadmap

**In progress:**
- Pre-launch section on Landing needs redesign (current layout rejected by nopoint)
- Bauhaus compliance for pre-launch + pre-order sections

**Opened:**
- NOWPayments fiat on-ramp: "minimal KYB" — nopoint to try activating in dashboard
- Landing pre-launch section: nopoint wants 2 separate blocks, properly designed through Bauhaus pipeline (Itten → Gropius with Albers verification)
- Privacy/Terms pages not translated (legal — may need separate EN versions)

**Notes:**
- Jina Free tier is CC-BY-NC — technically non-commercial only. $50 Paid tier needed for legit commercial use.
- Groq free tier: 1000 req/day Llama 70B, 6K TPM — sufficient for beta but bottleneck under load
- Bank transfer details: Gulbakhyt Onaibayeva, Halyk Bank, SWIFT HSBKKZKX, IBAN USD KZ9860100020352755551
- Deployed 12+ times this session to CF Pages

<!-- ENTRY:2026-04-01:CHECKPOINT:223:contexter:contexter-auth [AXIS] -->
## 2026-04-01 — checkpoint 223 [Axis]

**Decisions:**
- D-18: yt-dlp requires `--js-runtimes node` (not nodejs) + YouTube cookies from Firefox for anti-bot bypass
- D-19: MIME charset fix: `text/plain;charset=utf-8` → strip `;charset=*` before allowlist check
- D-20: Landing pre-launch = 2 separate sections: BetaSection (bg-canvas) + SupportSection (bg-surface)
- D-21: font-mono = Inter inheritance from global CSS, mono only for code/data (131→21 instances)

**Files changed since checkpoint 222:**
- `src/services/parsers/youtube.ts` — `--js-runtimes node`, `--cookies ./youtube-cookies.txt`
- `src/services/parsers/audio-segmenter.ts` — Russian→English error strings
- `src/routes/upload.ts` — MIME charset strip fix in resolveMimeType()
- `src/routes/billing.ts` — POST /api/billing/support endpoint
- `ops/Dockerfile` — COPY youtube-cookies.txt into image
- `web/src/pages/Landing.tsx` — BetaSection + SupportSection (split from PreLaunchSection), composition fixes, font-mono removal
- `web/src/pages/Hero.tsx` — pre-order redesign per Bauhaus spec, keyboard fix (e.code vs e.key), font-mono removal
- `web/src/pages/Upload.tsx` — full i18n, font-mono removal
- `web/src/pages/Dashboard.tsx` — full i18n
- `web/src/pages/ResetPassword.tsx` — full i18n
- `web/src/pages/ApiPage.tsx` — full i18n
- `web/src/pages/DocumentViewer.tsx` — i18n, gap fixes
- `web/src/components/DocumentModal.tsx` — i18n, line-height/gap fixes
- `web/src/components/ConnectionModal.tsx` — i18n, audit fixes
- `web/src/lib/helpers.ts` — humanizeError() Russian→English, mimeShort() "файл"→"file"
- `web/src/lib/api.ts` — Russian→English error string
- All remaining components — font-mono removal, i18n completion

**Completed:**
- ALL Russian strings removed from code (only ru.ts has Russian)
- font-mono cleanup complete (131→21, only code/data)
- Bauhaus audit fixes applied (clamp, line-height, gaps, tracking, text-bg-elevated)
- Landing composition: double padding fix, BetaSection/SupportSection split
- YouTube fix: --js-runtimes node + Firefox cookies on server
- MIME charset bug fix (TXT/JSON uploads now work)
- E2E test: 7/7 formats pass (text, txt, json, csv, md, html, youtube)
- Keyboard fix: Backspace + Russian layout in paste input

**In progress:**
- YouTube anti-bot: cookies expire in ~30 days, need refresh mechanism
- Some YouTube videos blocked by anti-bot even with cookies (IP-based)

**Opened:**
- Add stop button next to Processing badge + close (×) button on file entries
- YouTube title fetch: show video title instead of "youtube-video.url"
- Docling cold start: first request after app restart may timeout
- Privacy/Terms pages still not translated

**Notes:**
- deploy.sh SCP has intermittent issue: files don't overwrite. Manual scp + docker build --no-cache works reliably
- YouTube cookies exported from Firefox (Chrome v20 encryption blocks extraction)
- Firefox installed on machine via winget for cookie export

<!-- ENTRY:2026-04-01:CLOSE:224:contexter:contexter-auth [AXIS] -->
## 2026-04-01 — сессия 224 CLOSE [Axis]

**Decisions:**
- D-11: EN default, RU/EN toggle, localStorage persistence
- D-12: Pricing: Free ($0) / Starter ($9) / Pro ($29) — real unit economics
- D-13: Pre-launch: $10 = 1 month Pro after launch, unlimited during beta
- D-14: Payment: NOWPayments crypto + direct bank transfer (Halyk, SWIFT HSBKKZKX)
- D-15: $500 goal: $50 Jina + $150 server + $300 banking → Stripe
- D-16: font-mono only for code/data, Inter for all UI via global inheritance
- D-17: Jina pricing: prepaid $50/1B tokens, Free = CC-BY-NC non-commercial
- D-18: yt-dlp --js-runtimes node + Firefox cookies for YouTube anti-bot
- D-19: MIME charset strip fix (text/plain;charset=utf-8)
- D-20: Landing pre-launch = 2 sections: BetaSection + SupportSection
- D-21: YouTube temporarily disabled, added to roadmap with Instagram
- D-22: Docling healthcheck + depends_on + retry 4x/30s backoff
- D-23: /api page = full inline tabs, no modals
- D-24: Settings redesign: plan+usage, upgrade CTA, support section
- D-25: "Contact founder" button everywhere → Telegram @nopointsovereign

**Files changed (major):**
- `web/src/lib/i18n.ts` — i18n system created
- `web/src/lib/translations/en.ts` — ~500 keys
- `web/src/lib/translations/ru.ts` — ~500 keys
- `web/src/pages/Hero.tsx` — i18n, paste input, pre-order, roadmap, connect CTA, error auto-remove
- `web/src/pages/Landing.tsx` — full i18n, pricing 3-tier, BetaSection, SupportSection, roadmap, contact buttons
- `web/src/pages/ApiPage.tsx` — full rewrite: tabs with inline instructions, no modals
- `web/src/pages/Settings.tsx` — full rewrite: plan+usage, upgrade, support, Telegram
- `web/src/pages/Dashboard.tsx` — i18n
- `web/src/pages/Upload.tsx` — i18n, font-mono cleanup
- `web/src/pages/Login.tsx` — i18n
- `web/src/pages/Register.tsx` — i18n
- `web/src/pages/ForgotPassword.tsx` — i18n
- `web/src/pages/ResetPassword.tsx` — i18n
- `web/src/pages/VerifyEmail.tsx` — i18n
- `web/src/pages/DocumentViewer.tsx` — i18n
- `web/src/components/Nav.tsx` — RU/EN toggle, contact founder link
- `web/src/components/ConnectionModal.tsx` — i18n
- `web/src/components/DocumentModal.tsx` — i18n
- `web/src/components/Badge.tsx` — i18n, font-mono removed
- `web/src/components/Button.tsx` — font-mono removed
- `web/src/components/DropZone.tsx` — i18n
- `web/src/components/PipelineIndicator.tsx` — i18n
- `web/src/components/ErrorState.tsx` — i18n
- `web/src/components/Logo.tsx` — text-xl→text-[20px]
- `web/src/lib/helpers.ts` — humanizeError EN, mimeShort EN
- `web/src/lib/api.ts` — createSupportInvoice(), EN error
- `src/routes/billing.ts` — POST /api/billing/support
- `src/routes/upload.ts` — MIME charset strip
- `src/services/parsers/youtube.ts` — --js-runtimes node, --remote-components, --cookies
- `src/services/parsers/audio-segmenter.ts` — EN error strings
- `src/services/resilience.ts` — Docling retry 4x/30s, breaker 5 failures
- `ops/Dockerfile` — youtube-cookies.txt COPY
- `docker-compose.yml` — Docling healthcheck + app depends_on docling

**Completed:**
- i18n system + all 24 pages/components translated (EN default)
- Paste input with multimodal recognition (images, text, files, URLs)
- Pricing section: Free/Starter $9/Pro $29 based on verified unit economics
- Pre-order with dynamic NOWPayments invoice + bank transfer details
- Roadmap: Now/After launch/Growth with competitor-informed features
- Bauhaus audit: 40 findings, most applied (font-mono 131→21, clamp, line-height, gaps, tracking)
- Landing composition: BetaSection + SupportSection properly split
- YouTube fix (yt-dlp node runtime + cookies) — but YouTube disabled due to IP ban
- MIME charset bug fix (TXT/JSON uploads)
- E2E: 7/7 text formats pass
- Docling reliability: healthcheck + depends_on + retry
- /api page: full rewrite with inline tabbed instructions
- Settings: plan+usage, upgrade CTA, support
- "Contact founder" button across all pages → Telegram
- Error auto-remove from UI after 10s
- Keyboard fix: Backspace + Russian layout in paste field
- Competitor analysis + audience voice research integrated

**Opened:**
- NOWPayments fiat on-ramp: try activating in dashboard (minimal KYB)
- YouTube + Instagram: in roadmap "After launch" — needs proxy or API service
- Privacy/Terms pages not translated
- deploy.sh SCP intermittent: files don't overwrite (workaround: manual scp + docker build)
- Profile edit (name change) not implemented
- ConnectionModal still used from Hero for legacy — can be removed if /api covers all

**Notes:**
- 20+ deploys to CF Pages this session
- 3+ backend deploys to Hetzner
- Firefox installed for YouTube cookie export
- Worktree isolation bug: agent changes sometimes don't persist — do critical edits in main context
