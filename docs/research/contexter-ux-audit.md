# Contexter UX Audit — Full User Journey Analysis

**Date:** 2026-03-24
**Auditor:** Lead/UI_UX
**Scope:** Complete frontend codebase — Hero, Dashboard, Upload, ApiPage, Settings, ConnectionModal, AuthModal, Nav, store, api
**Method:** Static code analysis + user journey simulation for 4 personas

---

## Route Map

```
/           → Hero.tsx      (landing + upload + mini-dashboard + connection)
/upload     → Upload.tsx    (dedicated upload page)
/dashboard  → Dashboard.tsx (doc list + query panel)
/api        → ApiPage.tsx   (api docs + mcp setup + token management)
/settings   → Settings.tsx  (profile + usage + danger zone)
```

---

## Critical Bugs Found (Pre-Audit)

These are hard defects that directly break user journeys regardless of persona.

### BUG-1: Nav duplicate link — "api" and "подключение" both point to /api

```tsx
// Nav.tsx lines 55-59
<A href="/api" class={linkClass("/api")}>api</A>
<A href="/api" class={linkClass("/api")}>подключение</A>
```

Both nav items render as active simultaneously (same path). The "подключение" link was presumably meant to open `ConnectionModal` or navigate to a dedicated `/connection` page. User sees two identical entries in nav that both go to the same place. Non-technical users will be confused; developers will see it as a bug.

**Severity:** HIGH — visual confusion, broken mental model of the app.

### BUG-2: Hero shows MCP URL with YOUR_TOKEN when user is not authenticated

```tsx
// Hero.tsx line 357
const tok = () => getToken() ?? "YOUR_TOKEN"
const mcpUrl = () => `${API_BASE}/sse?token=${tok()}`
```

Section 5 (Connection) is always visible. An unauthenticated user sees the real-looking URL with the literal string `YOUR_TOKEN` embedded. They might copy it and try to use it. The auth-gated section 4 shows empty stats with a call-to-action, but section 5 shows connection instructions that cannot yet be used.

**Severity:** MEDIUM — misleading affordance.

### BUG-3: ConnectionModal initialClient defaults to "claude" (non-existent ClientId)

```tsx
// ConnectionModal.tsx line 142
const [activeTab, setActiveTab] = createSignal<ClientId>(props.initialClient ?? "claude")
```

The `ClientId` type is `"chatgpt" | "claude-web" | "claude-desktop" | "perplexity" | "cursor"`. There is no `"claude"` value. When the modal opens without `initialClient` prop, `activeTab` is set to `"claude"`, which does not match any client in the list. `activeClient()` falls back to `clients()[0]` (ChatGPT), but the tab highlight state will be wrong — no tab will appear active.

**Severity:** MEDIUM — broken tab state on first open.

### BUG-4: Dashboard empty-state "загрузить файл" links to "/" not "/upload"

```tsx
// Dashboard.tsx lines 356-358
<A href="/">
  <Button variant="primary">загрузить файл</Button>
</A>
```

The dedicated upload page is at `/upload`. The root `/` is the Hero page which also has upload functionality, but the semantic expectation (upload page) is broken and the hero page has different layout context.

**Severity:** LOW — functional but inconsistent.

### BUG-5: "запросы" stat is always 0 — never incremented persistently

In Dashboard.tsx `totalQueries` is a local `createSignal(0)` incremented per session (`setTotalQueries((prev) => prev + 1)`). In Hero.tsx the queries stat in the dashboard section is hardcoded to `[0, "запросы"]`. Settings.tsx shows `value={0}` with no data source. The stat is non-functional across all three surfaces.

**Severity:** LOW — misleading but not blocking.

### BUG-6: ApiPage unauthenticated state CTA says "начать" and navigates to /upload, but text says "войдите"

```tsx
// ApiPage.tsx lines 224-230
<p>войдите чтобы получить доступ к api</p>
<Button onClick={() => navigate("/upload")}>начать</Button>
```

The copy says "войдите" (log in) but there is no login — registration is the only auth flow, triggered by trying to upload a file. A user on the API page who is not authenticated is told to "log in" but clicking "начать" takes them to the upload page, not an auth modal. Same issue in Settings.tsx.

**Severity:** MEDIUM — misleading copy + wrong CTA destination for the context.

### BUG-7: Retry button only shown when entry.documentId exists — but upload errors happen before documentId is assigned

```tsx
// Upload.tsx lines 519-533
<Show when={entry.status === "error" && entry.error}>
  <div>
    <span>{entry.error}</span>
    <Show when={entry.documentId}>
      <Button onClick={() => handleRetry(entry.id)}>повторить</Button>
    </Show>
  </div>
</Show>
```

If the upload itself fails (network error, 4xx from API), `documentId` is null and the retry button is hidden. The user sees an error with no recovery action. `handleRetry` only polls status — it does not re-upload. So the retry function is also incomplete: it cannot recover from a failed upload, only from a failed processing stage.

**Severity:** HIGH — error state with no exit = dead end.

---

## Persona Journey Analysis

---

### Persona 1: Маша — маркетолог, 28, ChatGPT Plus

**Goal:** Upload PDF marketing reports, query them in ChatGPT.

#### Step 1 — Landing page, first impression

**PASS with concerns.**

Hero headline: "получите доступ к файлам из любой нейросети" — clear value prop.
Supporting copy explains the flow well. The "как это работает" table on the right is informative.

**Confusion point:** The page is very long (5 sections). Маша arrives and sees the headline, then immediately sees the black drop zone. She has no account yet. Nothing tells her she needs to create one before uploading. The drop zone says "перетащите файлы" with no auth hint.

**Concern:** The client badges (ChatGPT, Claude.ai, etc.) in the hero section are clickable and auth-gated — clicking them triggers AuthModal. But there is no label or affordance indicating these badges are interactive. They look decorative. A user clicking on "ChatGPT" just to read instructions will unexpectedly get an auth form.

#### Step 2 — Маша drops her PDF

**FAIL (partial).**

She drops the file. `requireAuth` fires. `AuthModal` opens.

AuthModal asks for email (optional) and name (optional). Both fields are optional. Copy says "чтобы сохранить загруженные файлы и дать доступ, создайте аккаунт." — explains the why, good.

She submits with no email. `register()` is called. Success: `setStep("done")`, 1.5s pause, `onSuccess()` fires, `onClose()` fires, the deferred upload action runs.

**Problem:** The 1.5 second auto-close feels abrupt. More importantly, after auth success and modal close, the file upload starts immediately in the background — but the upload zone on Hero page has no visible loading state for files while they upload (the file list section 3 appears only `<Show when={hasFiles()}>`, which is correct). So the visual feedback is: modal closes → file list appears with badge "pending" → transitions to "uploading" → "processing" → "ready". This is functional.

**Dead end if auth fails:** If `register()` throws (network error), `setError()` is called but the form only shows error on the email Input via `error={error()}`. The error is rendered inside the email input component, not as a prominent banner. A non-technical user may not notice it if they submitted with no email.

#### Step 3 — After upload: Dashboard section on Hero

**PASS.**

The mini-dashboard (section 4) shows stats and up to 5 docs. The doc list shows status badges. "все документы →" link to /dashboard appears when authenticated. Query box is present.

**Confusion point:** Two places to test queries exist: the inline query on Hero (section 4) and the full query panel on /dashboard. They are separate implementations with different layouts. Маша may not realize the Hero page query is fully functional.

#### Step 4 — Connection to ChatGPT

**FAIL.**

Маша needs to connect to ChatGPT Plus. The connection section on Hero (section 5) shows generic Claude Desktop config JSON. It doesn't explain ChatGPT specifically. There is a list of clickable badges for each client — but these open the ConnectionModal with the correct tab.

**Problem 1 (BUG-3):** The first time ConnectionModal opens for "chatgpt" via Hero section 1 badge, it works correctly because `initialClient` is explicitly set. But if it opens from section 5 badge without auth (not auth-gated in section 5, lines 746-748), the token in the URL will be the real token — this is actually correct, no issue here.

**Problem 2:** ChatGPT requires "Plus / Pro / Team / Enterprise". This gotcha is shown in the modal. Маша has ChatGPT Plus so she's fine. Steps are clear: 3 steps, detail text explains navigation. The URL is pre-filled with her token. PASS for the modal itself.

**Problem 3:** After following the steps, the ConnectionModal says to verify by asking "какие документы загружены?" in ChatGPT. But there's no way to verify this inside the Contexter UI. No connection status is shown. The green MCP dot in Dashboard is hardcoded (see below).

#### Step 5 — Testing it works

**FAIL.**

Dashboard.tsx has a hardcoded MCP status dot:

```tsx
// Dashboard.tsx lines 552-565
<span style={{ background: "#2E7D32" }} />  // always green
<span>mcp подключен</span>                  // always says connected
```

This is always green regardless of whether any MCP client is actually connected. Маша may assume connection is working when it is not yet set up, or may not know this status is meaningless.

**Summary for Маша:**
- Upload and auth: mostly works, minor UX rough edges
- Connection modal: works correctly
- Verification: no real feedback loop — dead end at "is it working?"

---

### Persona 2: Артём — CPO стартапа, 35, Claude Pro

**Goal:** Connect team knowledge base, share with team members.

#### Step 1 — Landing

**PASS.** Value prop is immediately clear for a technical audience.

#### Step 2 — Upload and register

**PASS.** Same as Маша. Артём uploads team docs, registers quickly.

#### Step 3 — Navigate to API page for token sharing

**FAIL (confusion point).**

Артём wants to share a read-only token with his team. He goes to /api (labeled "api" in nav). The page has three sections: api endpoints, MCP connection, and "токены и шеринг".

**Problem 1:** "Создать токен" section uses `createShare()` with `read_write` permission and calls the result a "токен". "Создать ссылку для шеринга" section also uses `createShare()` with `read` permission. The distinction between a "token" and a "sharing link" is not clear. Both produce a `shareToken` value. The UI calls one a "токен" and the other a "ссылка" but mechanically they are identical.

**Problem 2:** Both new token and new share token have this warning: "сохраните токен, он больше не будет показан". This is correct behavior, but the warning appears in a yellow border box after creation. A user who doesn't immediately copy it and then dismisses the page will lose the token. There is no re-show mechanism.

**Problem 3:** The "активные ссылки" list shows only the first 12 characters of each share token with "...". There's no way to see or copy the full token from the list. If Артём wants to give the token to a team member later, he cannot retrieve it.

**Problem 4:** "Ваш api токен" shows the primary token (from `auth()?.apiToken`). This is always visible and copyable — good. But it's in the middle of the page with no heading explaining it's the primary token vs. the created share tokens.

#### Step 4 — Team member uses the token

**DEAD END.**

There is no documented flow for what a shared token recipient does. The token they receive works with the API (POST /api/query with Bearer token), but there is no page at the Contexter web app for "I received a share link, what do I do?" The only way to use a share token is directly via API calls — which is fine for a developer team, but Артём's non-technical colleagues have no path.

**Summary for Артём:**
- Token management is functional but the token/share distinction is muddled
- Lost token = no recovery
- No onboarding path for token recipients

---

### Persona 3: Дима — студент, 20, бесплатный ChatGPT

**Goal:** Upload lecture notes (PDF/text), query them. Free ChatGPT.

#### Step 1 — Landing

**PARTIAL FAIL.**

Дима arrives, sees the landing. The hero section mentions "ChatGPT" prominently. He is excited.

**Problem:** The ConnectionModal for ChatGPT shows the gotcha: "Только Plus / Pro / Team / Enterprise планы". Дима is on free ChatGPT. He will complete the entire upload flow and only discover at the connection step that his plan is not supported.

**The landing page copy does not mention any plan requirements.** The client badge list and the "how it works" table both suggest ChatGPT works without qualification. This is a significant expectation mismatch for a large segment of users.

#### Step 2 — Upload notes

**PASS.** Upload works fine. Auth modal, register, process.

#### Step 3 — Try to connect ChatGPT

**FAIL / DEAD END.**

Дима opens ConnectionModal, selects ChatGPT, reads the steps. Gets to the gotcha: "Только Plus / Pro / Team / Enterprise планы." He has no paid plan.

There is no fallback suggestion in this state. The modal doesn't say "alternatively, try Claude.ai" or "use the API directly". Дима is stuck.

**Available alternatives Дима doesn't know about:**
- The inline query panel on Hero and Dashboard works without any MCP connection
- The API page shows curl examples that work with any HTTP client
- He could use Cursor on free plan

None of these alternatives are surfaced when the paid-plan gotcha is shown.

#### Step 4 — Uses inline query instead

**PASS (if he discovers it).**

The query panel on the Hero page (section 4) and Dashboard right panel work well. He can ask questions and get answers. But this is a "fallback" that requires him to use the Contexter web UI — which is not what he came for.

**Summary for Дима:**
- Expectation set incorrectly at landing
- Hard dead end at ChatGPT connection step
- Fallback query UI works but is not promoted as the solution

---

### Persona 4: Олег — разработчик, 32, Cursor + Claude Code

**Goal:** RAG for project documentation, connect to Cursor.

#### Step 1 — Landing

**PASS.** Cursor is listed. Олег registers, uploads docs. No friction.

#### Step 2 — API page

**PASS.** The curl examples are pre-filled with his actual token. The MCP URL is correct. He can use the API directly right away.

#### Step 3 — Cursor connection

**PASS.** ConnectionModal for Cursor is clear. Config JSON is generated correctly:

```json
{
  "mcpServers": {
    "contexter": { "url": "https://contexter.nopoint.workers.dev/sse?token=ctx_..." }
  }
}
```

The gotcha says "Cursor определяет HTTP транспорт автоматически по полю url" — correct, technically accurate.

#### Step 4 — Advanced: create separate token for Cursor vs. Claude Code

**PARTIAL FAIL.**

Олег wants separate tokens per tool for security. He goes to "создать токен" on ApiPage. Clicks the button.

**Problem:** The "создать токен" button calls `createShare(token(), "all", "read_write")`. This creates a SHARE token, not a new primary API token. The created token is a `ctx_share_...` type. The function is named `handleCreateToken` but it's actually creating a share with read_write access. The UX presents it as "creating a new token" which implies a top-level API token with full permissions. The distinction between a primary token and a share token with read_write permission may matter for the API surface (depending on backend implementation) but the UI doesn't clarify this.

#### Step 5 — Query via API

**PASS.** The curl example for querying is pre-populated with his token, accurate and usable.

**Summary for Олег:**
- Best experience of all 4 personas — the technical documentation path is solid
- Token creation semantics are unclear (share vs. primary)

---

## Cross-Cutting Issues

### AUTH-1: No session persistence signal

The auth token is stored in `localStorage` under key `contexter_auth`. There is no expiry check, no refresh mechanism, no "session expired" handling. If the backend token expires:
- API calls return 401
- The error surfaces as a toast ("не удалось загрузить документы")
- The user is shown error messages with no explanation that they need to re-authenticate
- There is no `/login` route — the only way to get a new token is to register again
- `handleLogout` in Settings calls `setAuth(null)` and redirects to `/` — but this just clears local state, the old token is still valid on the backend
- Re-registering produces a new userId and a new empty knowledge base — all previous documents are orphaned

**Fix needed:** When API returns 401, detect this in the `api()` function, call `setAuth(null)`, and navigate to `/` with an explanatory message. This is a complete auth flow gap.

### ROUTE-1: No 404 / catch-all route

`index.tsx` defines 5 routes. Any unmatched path (e.g., `/settings/profile`, `/docs/123`) renders nothing — blank white page, no error message, no navigation.

### NAV-1: No "настройки" link in navigation

Settings page exists at `/settings` but there is no nav link to it. The only way to access Settings is by knowing the URL directly. No user will find it organically. The Settings page contains important features: usage limits, "delete all data", logout.

**Logout:** Is accessible from Nav via the inline "выход" button (which appears when authenticated) — but "delete all data" and usage stats are only in Settings, which is unreachable from Nav.

### NAV-2: "начать" CTA in Nav when unauthenticated goes to "/" not "/upload"

```tsx
// Nav.tsx line 64
<Button variant="primary" onClick={() => navigate("/")}>начать</Button>
```

User is already on the root path `/`. Clicking "начать" navigates to the same page — no visible effect. A first-time visitor on `/dashboard` or `/api` who is not logged in sees "начать" in the nav and clicks it, which takes them to the Hero/upload page — this is actually correct behavior. But if they are already on `/`, it does nothing, which looks like a broken button.

### EMPTY-1: No empty state for query before any documents are uploaded

In Dashboard, the query panel is always visible even when `documents().length === 0`. A user with zero documents can type a query and get "по вашему запросу ничего не найдено" — which is technically accurate but confusing. Better to disable or hide the query panel until at least one document is ready.

### EMPTY-2: Settings shows "запросы: 0 / 100" but queries are never counted

Settings.tsx line 201: `value={0}` hardcoded for the "запросы" UsageCard. This will always show 0/100 regardless of usage. Combined with BUG-5, the "запросы" metric is completely non-functional across the entire app.

### COPY-1: Technical jargon "чанки" and "векторы" unexplained

The stats across Hero, Dashboard, and Settings show "чанки" and "векторы" as labels. These are shown to all users including non-technical ones (Маша, Дима). No tooltip, no glossary, no explanation. Маша does not know what 47 "чанки" means and whether it's good or bad.

### COPY-2: "mcp подключен" is hardcoded green — misleading

Dashboard.tsx bottom of right panel, always shows green dot + "mcp подключен". MCP connection status is not tracked by the app. This is false UI state. A user who hasn't configured MCP at all will see this as a false confirmation, or a user who misconfigured it will see it as a false positive.

### A11Y-1: Drop zone has tabIndex=0 but no visible focus indicator

Hero.tsx section 2 (black drop zone) has `tabIndex={0}` enabling keyboard focus. But there is no `:focus-visible` style — only `ring-accent ring-inset` on `dragOver()` state. Keyboard users have no visual feedback when the drop zone is focused.

**WCAG 2.1 SC 2.4.7 (Focus Visible, Level AA):** Focus indicator required.

### A11Y-2: AuthModal has no focus trap

`AuthModal` is a modal dialog. When it opens, focus is not moved into the modal. Tab navigation will continue through the background content. Pressing Escape closes the modal (not implemented — AuthModal has no Escape handler, only click-outside to close).

**WCAG 2.1 SC 2.1.2 (No Keyboard Trap, Level A):** Focus management in modal is required.
**WCAG 2.1 SC 1.3.1:** The modal uses a plain div with no `role="dialog"`, `aria-modal`, or `aria-labelledby`.

### A11Y-3: ConnectionModal has Escape handling but AuthModal does not

ConnectionModal.tsx lines 152-157: Escape key closes modal. AuthModal has no equivalent. Inconsistent keyboard behavior.

### A11Y-4: Confirm dialog (ConfirmDialog component in Dashboard) has same issues

The `ConfirmDialog` component in Dashboard.tsx is a modal-style overlay with no role, no focus trap, and no Escape handler.

### A11Y-5: Badge components contain no accessible text

Badge components show status visually. Without examining the Badge component code (not provided), but from usage context: `<Badge variant="processing" />` — if this renders only visual state without `aria-label` or a screen-reader text element, screen reader users cannot determine document status.

### MOBILE-1: Fixed 64px horizontal padding on Hero and Dashboard

```tsx
// Hero.tsx section styles: padding: "64px 64px 48px"
// Dashboard: padding: "32px 64px"
// ApiPage: px-8 lg:px-16
```

Hero and Dashboard use inline `padding: "64px"` which does not respond to viewport width. On mobile viewports (< 640px) this creates 128px of horizontal padding — content will be extremely narrow. ApiPage uses Tailwind's `px-8 lg:px-16` which is responsive. Inconsistency: some pages are mobile-aware, others are not.

### MOBILE-2: Dashboard fixed 420px right panel

Dashboard right panel: `width: "420px"` with no responsive breakpoint. On viewports < 900px the layout breaks.

---

## Issue Severity Matrix

| ID | Issue | Severity | Persona Impact |
|---|---|---|---|
| BUG-1 | Duplicate nav links both pointing to /api | HIGH | All |
| BUG-3 | ConnectionModal default tab "claude" is invalid ClientId | MEDIUM | All |
| BUG-7 | Retry button hidden when upload fails — dead end | HIGH | All |
| AUTH-1 | 401 not handled — no re-auth flow, orphaned data | HIGH | All (long-term) |
| NAV-1 | Settings page unreachable from nav | HIGH | Артём, Олег |
| BUG-2 | Section 5 MCP URL shows YOUR_TOKEN for anon users | MEDIUM | Маша, Дима |
| BUG-6 | "войдите" copy + wrong CTA on ApiPage/Settings anon state | MEDIUM | All |
| EMPTY-1 | Query panel active with 0 docs — confusing no-results | MEDIUM | Маша, Дима |
| COPY-2 | "mcp подключен" hardcoded green — false status | MEDIUM | All |
| BUG-4 | Dashboard empty state links to / not /upload | LOW | All |
| BUG-5 | Запросы stat is always 0 | LOW | All |
| EMPTY-2 | Settings запросы hardcoded 0/100 | LOW | All |
| COPY-1 | "чанки"/"векторы" jargon unexplained | MEDIUM | Маша, Дима |
| ROUTE-1 | No 404 route | LOW | All |
| NAV-2 | "начать" in nav does nothing when already on "/" | LOW | All |
| A11Y-1 | Drop zone no focus indicator | MEDIUM | Keyboard users |
| A11Y-2 | AuthModal no focus trap, no role="dialog" | MEDIUM | Screen reader + keyboard |
| A11Y-3 | AuthModal missing Escape handler | LOW | Keyboard users |
| A11Y-4 | ConfirmDialog no role, no focus trap | MEDIUM | Screen reader + keyboard |
| MOBILE-1 | Hard-coded 64px padding on Hero/Dashboard — not responsive | MEDIUM | Mobile users |
| MOBILE-2 | Dashboard 420px right panel not responsive | MEDIUM | Mobile users |

---

## Fix Recommendations (Priority Order)

### P0 — Blocking journeys

**BUG-7: Retry on upload failure.**
When `processFileUpload` fails before `documentId` is set, show a "повторить" button that calls `processFileUpload` again (not just polling). Store the original `File` reference in `FileEntry` or use a ref map keyed by entry id.

**AUTH-1: Handle 401 responses.**
In `api()` function in `api.ts`, check `res.status === 401`, call `setAuth(null)`, and navigate to `/` with a toast "сессия истекла — войдите снова". This prevents silent failure and orphaned account states.

**NAV-1: Add Settings to nav.**
Add `<A href="/settings">настройки</A>` to Nav. Or surface logout and usage limits in a user dropdown instead of a hidden page.

### P1 — Significant confusion / broken features

**BUG-1: Fix duplicate nav entries.**
"Подключение" link should either open `ConnectionModal` directly or navigate to a unique route. If the modal approach: remove the nav `<A>` and replace with a `<button onClick={() => setConnectionOpen(true)}>`. This requires lifting `connectionOpen` state or using a global signal.

**BUG-6: Fix unauthenticated state copy and CTA on ApiPage/Settings.**
Change "войдите" to "создайте аккаунт" or "загрузите первый файл". Change CTA to navigate to `/` (Hero, which has the upload zone and auth trigger) not `/upload` (which has no auth modal trigger in its nav).

**COPY-2: Remove false MCP status indicator.**
Either delete the "mcp подключен" row entirely, or implement real connection state (requires backend support). Until backend provides connection status, remove this element — a missing indicator is less harmful than a false positive one.

**EMPTY-1: Disable query panel when no documents.**
When `documents().length === 0`, show a nudge: "загрузите документы чтобы задавать вопросы" with a link to `/upload`.

### P2 — UX quality

**BUG-2: Hide Section 5 connection config for unauthenticated users**, or show it with a clear note: "после регистрации здесь появится ваш токен". Replace `YOUR_TOKEN` placeholder with an explanatory message, not a literal placeholder string.

**BUG-3: Fix ConnectionModal default tab.**
Change `props.initialClient ?? "claude"` to `props.initialClient ?? "chatgpt"` (matching the first actual tab).

**COPY-1: Add tooltips/labels to "чанки" and "векторы".**
Add a `title` attribute or small `(?)` icon with explanation: "чанки — фрагменты, на которые разбит документ для поиска".

**Дима's dead end: Add fallback suggestion in ConnectionModal ChatGPT gotcha.**
When gotcha says "Только Plus/Pro/Team/Enterprise", add: "На бесплатном плане используйте встроенный поиск на этой странице или подключите Claude.ai (Max план) или Cursor."

**TOKEN-1: Clarify token vs. share token distinction on ApiPage.**
Rename sections clearly: "Основной токен" (always visible, full access) vs. "Токены для совместного доступа" (share tokens, read-only by default). Add a short explanation of the difference.

**TOKEN-2: Add copy button to active shares list.**
Shares list shows truncated token. Add a re-copy button that shows the token wasn't saved with "если не сохранили токен, создайте новый" fallback.

### P3 — Accessibility (WCAG AA compliance)

**A11Y-2: Add focus management to AuthModal.**
On open: `autofocus` on first input or manual `focus()` call. Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the heading. Add Escape key handler.

**A11Y-4: Same fixes for ConfirmDialog.**

**A11Y-1: Add focus-visible style to Hero drop zone.**
Add CSS: `&:focus-visible { outline: 2px solid #1E3EA0; outline-offset: -2px; }` to the drop zone section.

**MOBILE-1/2: Audit responsive layout.**
Replace inline `padding: "64px"` with Tailwind responsive classes. The Dashboard right panel should collapse below the main content on mobile.

---

## Summary

The core functionality works: upload, process, query, and MCP connection instructions are all functional. The critical gaps are:

1. **No auth recovery path** — token expiry leaves users in a broken state with no way back except re-registering and losing all data.
2. **Settings page is hidden** — important account management is inaccessible from normal navigation.
3. **Upload error dead end** — upload failures have no retry mechanism.
4. **False status indicators** — the hardcoded green MCP dot erodes trust when users discover it's non-functional.
5. **Expectation mismatch for free-tier ChatGPT users** — a significant user segment discovers the product doesn't work for them at the last step of the flow.

The app is closest to production-ready for Олег (developer with Cursor) and furthest from it for Дима (student, free ChatGPT) — primarily because the product makes promises on the landing page that free-tier users cannot fulfill.
