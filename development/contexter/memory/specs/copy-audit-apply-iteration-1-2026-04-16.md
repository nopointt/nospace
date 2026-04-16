# Copy Audit Apply — ITERATION 1 (Addendum)

> Parent spec: `copy-audit-apply-2026-04-16.md`
> Iteration: 1 of 3 (Coach rejected Commit 6 scope violation + functional regression)
> Variant: **C — Hybrid** (revert c1d08ab, re-split into 3 atomic commits)
> Coach POST-REVIEW findings: 5 of 6 commits PASS, Commit 6 `c1d08ab` FAIL on scope

---

## What went wrong in original Commit 6

Original spec asked for MINIMAL edits to Settings.tsx (line 147 only) + 2 CTA keys + 1 new i18n key. Player instead rewrote the whole Settings.tsx file:
- Added `const TIER_LIMITS = { free: {...}, starter: {...}, pro: {...} }`
- Hardcoded `const limits = TIER_LIMITS.free` ← **regression**: all users see free-tier numbers (10/100/10 docs/chunks/queries), regardless of actual plan
- Added `ProfileField` component, restructured profile section layout, added plan upgrade button, support section, beta note
- Wired existing i18n keys that were already working (no new keys besides `namePlaceholder`)

**Build passes** but UI behaviorally regresses for Starter/Pro users. This is B3 violation (shortcut) and H2 (scope creep).

---

## Iteration Plan — 3 replacement commits

**Step 0:** `git revert --no-edit c1d08ab` → creates revert commit. DO NOT keep revert as final state; squash it out by `git reset --soft HEAD~1` of the revert, then re-commit cleanly.

Simpler workflow: use `git reset --soft c1d08ab~1` to un-stage `c1d08ab`, keep working-tree changes, then discard unwanted changes and stage split commits individually.

Use whichever workflow you prefer, but the FINAL state of `main` must have: original Commit 5 `ec82f16` as parent of 3 new commits (Commit 6, 7, 8).

### Commit 6 (replacement — MINIMAL, per original spec)

**Files:** `web/src/lib/translations/ru.ts` + `web/src/pages/Settings.tsx`

**Changes — exactly as original spec Commit 6:**

1. `ru.ts`:
   - `landing.pricing.starter.cta`: `"Начать"` → `"Подключить Starter"`
   - `landing.pricing.pro.cta`: `"Начать"` → `"Подключить Pro"`
   - ADD new key `settings.namePlaceholder`: `"Введите имя..."` (under `settings.*` namespace)

2. `Settings.tsx` line 147 ONLY:
   - Replace hardcoded `placeholder="Set your name..."` → `placeholder={t("settings.namePlaceholder")}`
   - **Nothing else in Settings.tsx changes.** The file must be otherwise identical to its state before c1d08ab.

**Commit message:**
```
fix(contexter/ui): ru.ts — CTA labels + Settings placeholder

Replaces "Начать" with "Подключить Starter" / "Подключить Pro" in
pricing CTAs. Adds settings.namePlaceholder key and wires Settings.tsx
line 147 from hardcoded English to i18n.

GSD-Task: CTX-10-W1-01 / Commit 6/8
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -c "Set your name" src/pages/Settings.tsx
# Expected: 0
grep -c "settings.namePlaceholder" src/lib/translations/ru.ts
# Expected: 1
grep -cE "Подключить Starter|Подключить Pro" src/lib/translations/ru.ts
# Expected: 2
# Ensure no scope creep: diff should be minimal
git diff --stat HEAD~1 -- src/pages/Settings.tsx
# Expected: 1 file changed, 1 insertion, 1 deletion (single line change)
```

### Commit 7 (NEW — Settings.tsx restructure with DYNAMIC limits)

**File:** `web/src/pages/Settings.tsx` (and possibly new i18n keys in `ru.ts` if restructure adds new labels).

**Action:**

Re-apply the restructure work from original c1d08ab (ProfileField component, profile section grid, name/ID display, plan upgrade button, support section, beta note) — **BUT with these fixes:**

1. **Dynamic TIER_LIMITS:**
   - Keep `TIER_LIMITS` constant with free/starter/pro objects
   - `const limits = TIER_LIMITS[auth().plan ?? 'free']` — use actual user plan
   - Handle null auth / missing plan field gracefully (fallback to 'free')
   - If `auth()` structure in Contexter does NOT expose `.plan` — find the canonical source (user object, subscription, supporters table) and use that
   - Do NOT hardcode `TIER_LIMITS.free`

2. **Verify actual current limits** per plan before committing. The original values before c1d08ab were:
   - docs: 50
   - chunks: 500
   - queries: 100
   - These MAY have been free-tier. Verify against backend quota config. If those values correspond to the `free` tier in current production, then `TIER_LIMITS.free = {docs: 50, chunks: 500, queries: 100}` (not 10/100/10). If they correspond to a different tier — adjust accordingly.
   - If quota values are not documented anywhere in codebase — STOP and escalate. Do NOT guess.

3. **All other restructure changes** (ProfileField, layout, plan button, support, beta) — port as-is, no change.

**Phase Zero for this commit (mandatory):**
- Before writing code, inspect `web/src/pages/Settings.tsx` at state just before c1d08ab (via `git show c1d08ab~1:web/src/pages/Settings.tsx`)
- Inspect c1d08ab's own version (`git show c1d08ab:web/src/pages/Settings.tsx`)
- Identify the exact quota values and determine which tier they belong to
- Inspect `auth()` return type / context to find canonical plan field
- Log findings in `session-scratch.md` BEFORE writing code
- If any uncertainty — STOP, escalate

**Commit message:**
```
feat(contexter/ui): Settings — dynamic tier limits + profile restructure

Adds TIER_LIMITS table for free/starter/pro quotas (docs/chunks/queries).
Reads current user plan from auth() and displays tier-appropriate limits
(previously hardcoded free-tier numbers for all users).

Restructures profile section with ProfileField component, adds plan
upgrade button, support section, beta note.

GSD-Task: CTX-10-W1-01 / Commit 7/8
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
# Dynamic lookup: TIER_LIMITS[auth...] NOT TIER_LIMITS.free
grep -nE "TIER_LIMITS" src/pages/Settings.tsx
# Expected: definition + dynamic access (e.g., TIER_LIMITS[plan])
grep -c "TIER_LIMITS\.free" src/pages/Settings.tsx
# Expected: 0 (no hardcoded free-tier access) — unless there's an intentional fallback `?? TIER_LIMITS.free` which is ok
```

**Done when:**
- [ ] `limits` is dynamically derived from user plan (no hardcoded `.free`)
- [ ] Free-tier values match pre-c1d08ab values (50/500/100 likely, verify first)
- [ ] Starter + Pro tiers have sensible values (align with backend or product)
- [ ] ProfileField + layout + plan button + support + beta preserved from c1d08ab
- [ ] Build passes
- [ ] Atomic commit with `GSD-Task: CTX-10-W1-01 / Commit 7/8` trailer

### Commit 8 (NEW — conn.cursor.s3.detail residual jargon)

**File:** `web/src/lib/translations/ru.ts`

**Action:**

Replace `conn.cursor.s3.detail`:
- Current: `"Индикатор MCP-серверов появится в чате. Спросите по документам"`
- New: `"Индикатор Contexter появится в чате. Спросите по документам"`

Rationale: `MCP-серверов` is descriptive (not a Cursor menu label like "MCP Servers" in a settings page). Cursor's actual UI shows a hammer icon; the indicator is product-agnostic. `Contexter` is more user-friendly.

**Phase Zero for this commit:**
- Quick sanity check: open the real Cursor app's "MCP Servers" config page (if accessible) — is "MCP-серверов" a translation of Cursor's actual menu label or just descriptive text?
- If unreachable — default to interpreting as descriptive (per Coach's contested finding), apply the fix.

**Commit message:**
```
fix(contexter/ui): ru.ts — cursor step text replaces MCP-серверов with Contexter

Removes residual MCP jargon in conn.cursor.s3.detail. The phrase
was descriptive, not a Cursor menu navigation label.

Inherited from pre-existing ru.ts, not caught in initial audit table.

GSD-Task: CTX-10-W1-01 / Commit 8/8
```

**Verify:**
```bash
cd /c/Users/noadmin/nospace/development/contexter/web
bun run build 2>&1 | tail -3
grep -c "MCP-серверов" src/lib/translations/ru.ts
# Expected: 0
grep -c "Индикатор Contexter появится в чате" src/lib/translations/ru.ts
# Expected: 1
```

**Done when:**
- [ ] `MCP-серверов` removed from `conn.cursor.s3.detail`
- [ ] Replacement text `Индикатор Contexter появится в чате. Спросите по документам` in place
- [ ] No other `MCP-серверов` / `MCP-сервер` residuals anywhere in `conn.*` (verify global grep)
- [ ] Build passes
- [ ] Atomic commit with `GSD-Task: CTX-10-W1-01 / Commit 8/8` trailer

---

## Final Acceptance Criteria (iteration 1)

| ID | Criterion | Verify |
|---|---|---|
| AC-1' | 8 commits total with `GSD-Task: CTX-10-W1-01` trailers (1-5 unchanged, 6-8 new) | `git log --oneline -8 \| grep "GSD-Task: CTX-10-W1-01"` → 8 lines |
| AC-2' | Build passes after EACH of the 3 new commits | `bun run build` after 6, 7, 8 |
| AC-3' | `limits` in Settings.tsx is dynamically looked up by user plan (no regression) | code grep + manual reasoning |
| AC-4' | Free-tier default values restored to pre-c1d08ab baseline (50/500/100) | `git show c1d08ab~1:web/src/pages/Settings.tsx \| grep -E "50\|500\|100"` |
| AC-5' | Zero `MCP-серверов` in ru.ts | grep |
| AC-6' | Original c1d08ab reverted (not present in `git log`, or intermediate revert commits rebased out) | `git log --oneline \| grep c1d08ab` → 0 lines (or visible as reverted) |
| AC-7' | All original Commit 1-5 SHAs preserved: `8aea2bb, a855535, 54254fd, e1ae443, ec82f16` | `git log --oneline \| grep -cE "^(8aea2bb\|a855535\|54254fd\|e1ae443\|ec82f16)"` → 5 |

---

## Escalation triggers

- Can't find canonical `auth().plan` source → STOP, ask Orchestrator
- Can't determine correct free-tier quota values → STOP, ask Orchestrator
- Cursor app's actual "MCP Servers" menu IS a proper noun that `MCP-серверов` translates → STOP, revert Commit 8 logic, leave as-is
- Revert → new-commit workflow conflicts with existing history → STOP, present git state to Orchestrator

---

## Not in scope (do NOT touch)

- Commits 1-5 (`8aea2bb..ec82f16`) — all PASS per Coach, do not modify
- `supporters.*` namespace (G1 + intentional loyalty)
- Any backend code
- Any file outside `web/src/`
