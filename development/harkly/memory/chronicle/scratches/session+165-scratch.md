# e73f69ce+165-scratch.md
> Placeholder · last processed checkpoint: #163

<!-- ENTRY:2026-03-18:CLOSE:165:harkly:harkly-design-ui [AXIS] -->
## 2026-03-18 — сессия 165 CLOSE [Axis]

**Decisions:**
- Harkly design system created: 19 docs in `design/harkly/`, Bauhaus RAG validated (20 queries)
- Spatial paradigm: frames on canvas, not dashboard. Omnibar = primary not only input.
- Green for success = Klee over Mondrian. Warm grays = Kandinsky temperature over Mondrian non-color.
- Bauhaus RAG (Qdrant, 10K vectors, Jina v4 + reranker v3) registered as design expertise source
- F1 Источники fully designed: 6 artboards (default + 5 interaction states)
- Architecture docs restructured: branches/ → architecture/. Brand docs consolidated in brand/.
- Pencil Card → Frame renamed. Naming convention doc created.

**Files changed:**
- `design/harkly/*.md` (19 files) — full design system docs
- `design/harkly/harkly-ui.pen` — F1 Sources (6 artboards), Card→Frame rename
- `design/tlos-ui.pen` — tLOS Pencil reference copy
- `development/harkly/architecture/` (3 files) — arch docs moved from branches/
- `development/harkly/brand/` (4 files) — values, omnibar-primacy, ui-language-ru, brand-overview
- `development/harkly/memory/harkly-about.md` — L1 updated (brand, design system, paths)
- `development/harkly/memory/harkly-roadmap.md` — L2 updated (reference restructured)
- `development/harkly/memory/harkly-design-ui.md` — L3 updated (required reading, F1 IDs)
- `~/.claude/projects/.../memory/MEMORY.md` — L0 updated (stack, brand, omnibar)
- `~/.claude/projects/.../memory/project_harkly_*.md` — 3 memory files updated

**Completed:**
- [x] Harkly design system: foundations, guidelines (7), patterns (5), components inventory
- [x] Bauhaus RAG validation: 12 initial queries + 20 validation queries
- [x] Brand docs validation against design system (5 conflicts found, all resolved)
- [x] F1 Sources: default + Files Open + Telegram Open + Auth Flow + Chat Expand + Add Source
- [x] Architecture restructure: branches/ → architecture/
- [x] L0-L3 full audit: 15 issues found and fixed
- [x] Pencil naming convention established

**Opened:**
- [ ] F2 Сырые данные — next floor to design (no UX research exists, need to conduct or design from spec)
- [ ] F3-F5 — empty shells, pending design
- [ ] Omnibar → reusable component (still one-off frames)
- [ ] --signal-warning-bg + --signal-warning-text tokens (FINER F-badge hardcode)

**Notes:**
- Bauhaus RAG Qdrant needs fastembed installed for hybrid search (dense-only works)
- harkly-ui.pen has hidden nodes from old dashboard F1 layout (enabled:false, not deleted)
- Old arch docs archived in development/harkly/archive/
