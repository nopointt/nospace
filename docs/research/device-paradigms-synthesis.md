# Device Paradigms Research — Master Synthesis
> Contexter responsive design research — Stage 1 complete
> Date: 2026-03-22
> 6 parallel Opus agents, 200+ WebSearches, 300+ sources

---

## Research Files Index

| # | File | Domain | Data points |
|---|---|---|---|
| 1 | `mobile-phone-usage-ux-research.md` | Phone ergonomics, attention, micro-moments, expectations | 40+ |
| 2 | `tablet-usage-patterns-research.md` | Tablet context, posture, consumption, multitask | 30+ |
| 3 | `mobile-navigation-patterns-research.md` | Bottom tabs vs hamburger, IA, progressive disclosure | 50+ |
| 4 | `contexter-mobile-vs-desktop-research.md` | Developer audience, B2B SaaS, desktop-first evidence | 35+ |
| 5 | `contexter-mobile-ux-competitive-analysis.md` | 8 products analyzed (Notion, ChatGPT, Perplexity, etc.) | 40+ |
| 6 | `mobile-touch-interaction-patterns-research.md` | Touch targets, gestures, file upload, forms, a11y | 60+ |

---

## Three Device Paradigms

### Phone: "One Eyeball, One Thumb" (Wroblewski)

| Dimension | Data |
|---|---|
| Grip | 49% one-handed, 36% cradle, 15% two-handed |
| Input | 75% thumb-driven |
| Natural zone | Bottom 25-40% of screen (96% tap accuracy) |
| Stretch zone | 61% accuracy, 267% slower |
| Attention | 43 seconds per screen (NNGroup, 67K sample) |
| Intent | Micro-moments: question → answer, action → result |
| Speed | 1s delay = -7% conversions |
| Session | Short, interrupted, partial attention |

**Phone = reflex device. User has a question, wants answer NOW.**

### Tablet: "Lean-Back Companion"

| Dimension | Data |
|---|---|
| Location | 74% at home, 96% living room |
| Time | Evening peak, parallel with TV |
| Posture | Lean-back, two-handed |
| Orientation | Landscape more common than phones (especially 12"+) |
| Activity | 68% entertainment, reading, browsing |
| Session | Longer than phone, relaxed exploration |
| Conversion | 3.1% (nearly matches desktop 3.9%) |
| Traffic share | Only 1.8-1.9% globally |

**Tablet = consumption + light productivity. Reading docs, exploring answers, NOT configuring APIs.**

### Desktop: "Work Station"

| Dimension | Data |
|---|---|
| Developer share | 59.2% Windows, 31.8% macOS (SO 2024) |
| B2B traffic | 68-74% desktop |
| B2B conversion | 65% higher than mobile (4.8% vs 2.9%) |
| AI tools | ChatGPT 72-75% desktop, Perplexity 59.69% desktop |
| Comprehension | Mobile = 48% of desktop for complex content (NNGroup) |
| Session | Focused, productive, full attention |

**Desktop = production. Complex tasks, configuration, analytics, full-depth work.**

---

## Strategic Verdict: Desktop-First, Mobile-Responsive

The evidence is unambiguous across all 6 research domains:

1. **B2B SaaS = desktop-primary** (68-74% traffic)
2. **Developer audience = desktop-dominant** (SO Survey)
3. **AI/RAG tools = desktop-primary** (ChatGPT 72-75%, Perplexity 59.69%)
4. **Complex content comprehension on mobile = 48% of desktop** (NNGroup)
5. **70% of users don't scroll past first third of AI response on mobile**
6. **Every comparable dev tool** (Notion, Linear, Vercel, Datadog) follows desktop-first

### But mobile is NOT optional:

- Developer Android personal use surged 17.9% → 29% (2024-2025)
- Mobile = discovery, monitoring, quick queries
- "Perplexity pattern": ask question → get short answer
- Push notifications for pipeline status
- Bottom tab bar = +58% engagement vs hamburger (industry aggregate)

---

## What Contexter Needs on Each Device

### Mobile (360-480px) — Quick Actions Only

| Screen | Mobile action | Pattern |
|---|---|---|
| **Query** | Ask question → get answer | CRITICAL. Voice input. Collapsed sources. |
| **Upload** | Button → file picker (no drag-drop) | FAB (+) button, Google Drive pattern |
| **Documents** | List with status badges | Simple list, tap to expand |
| **Pipeline status** | Progress indicator | Push notification + badge |
| **Auth** | Login/register | Standard mobile auth |
| **API** | ❌ Desktop only | Too complex for phone |
| **Settings** | ❌ Desktop only | Too complex for phone |

### Tablet (768-1024px) — Consumption + Light Productivity

| Screen | Tablet action | Pattern |
|---|---|---|
| **Query** | Full query + answer + sources panel | Master-detail layout |
| **Upload** | Drag-drop + button | Both patterns work |
| **Documents** | List + detail sidebar | Split view |
| **Chunks** | Read chunks, expand | Sidebar detail |
| **API** | Read-only, copy tokens | Simplified view |
| **Settings** | Basic settings | Simplified |

### Desktop (1024-1440px) — Full Experience

All 45 screen states as currently designed.

---

## Navigation: Bottom Tab Bar (4 items)

All research converges on bottom tabs:

| Evidence | Source |
|---|---|
| +58% engagement vs hamburger | Industry aggregate |
| +30% menu clicks | Spotify A/B test |
| +38% feature engagement | Field service app |
| +40% faster task completion | Airbnb test |
| Engagement halved with hamburger | Zeebox (reverted in 2 weeks) |
| 76% increased usage | Google survey |

**Contexter mobile tabs:** Docs | Query | Upload | Profile

- Icon + label (never icon-only — +75% engagement)
- 44pt minimum touch targets (Apple HIG)
- Active state clearly visible
- Badge for pipeline notifications

---

## Key Design Rules from Research

### Touch & Interaction
- Touch targets: 44×44pt (Apple) / 48×48dp (Material)
- Spacing: 8-12px between interactive elements
- Font: 16px minimum body text (prevents iOS zoom)
- Keyboard covers 50% portrait, 70-80% landscape

### Content
- Progressive disclosure: show essential, hide advanced
- Bottom sheets > modals (25-30% higher engagement)
- Skeleton screens > spinners (perceived 20-30% faster)
- Tabs > scrolling for content sections
- Max 3 levels of hierarchy

### Gestures (user expectations)
- Swipe left edge = back
- Pull down = refresh
- Swipe left/right on list items = actions
- Long press = context menu
- Haptic feedback: 10-20ms for confirmation

### File Upload (mobile alternatives to drag-drop)
1. Native file picker (button) — primary
2. Camera capture
3. Share sheet / Web Share Target API
4. Cloud pickers (Google Drive, Dropbox)
5. Clipboard paste
6. Voice memo → audio upload

---

## Competitive Best Practices for Contexter

| Pattern | Best-in-class | Apply to Contexter |
|---|---|---|
| Citation UX | **Perplexity** — inline numbered footnotes, source panel | Document name + section as citations |
| Voice input | **ChatGPT** — inline voice in thread | Voice query input |
| File upload | **Google Drive** — FAB (+) button | FAB for upload on mobile |
| Pipeline progress | **No one does it well** | Opportunity to be best-in-class |
| Navigation | **Linear** — customizable bottom toolbar | 4-tab bottom bar |
| Mobile scope | **All competitors** — limit mobile to core actions | Query + Upload + Docs only |

---

## Bauhaus Alignment

| Principle | Application |
|---|---|
| P-28: Form from inside outward | Start from content hierarchy, not screen size |
| P-10: Design from inner law | Mobile = reduction to essence of each screen |
| P-06: Ornament-free = purity test | If composition breaks on mobile → desktop has ornament |
| P-11: Geometric vs loose construction | Desktop = grid, Mobile = vertical flow. Both valid. |
| P-30: Rationalism from inner logic | Breakpoints where content breaks, not arbitrary pixels |
| P-16: Machine aesthetics | CSS flexbox/grid = the machine. Embrace constraints. |

---

## Proposed Breakpoints

| Token | Value | Trigger |
|---|---|---|
| `--bp-mobile` | 360px | Most common mobile viewport (11% global) |
| `--bp-tablet` | 768px | iPad portrait, content-based |
| `--bp-desktop` | 1024px | Tablet landscape / small laptop |
| `--bp-wide` | 1440px | Current desktop design |

+ Container queries for component-level adaptation (Tailwind 4 native)

---

## Next Steps

- **Stage 2:** Content architecture — map all 45 screens to device paradigms, define transformation rules
- **Stage 3:** Design in Pencil — mobile (360px) + tablet (768px) screen states
