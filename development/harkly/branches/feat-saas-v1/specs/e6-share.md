# EPIC SPEC — E6: Share
> Tags: [export, share, pdf, markdown, download, stakeholders]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L1 |
| **Token Budget** | ~200K |
| **Depends On** | E0 (data models), E4 (artifacts generated) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | Нет автоматических actions — пользователь выбирает что экспортировать |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved (E0, E4)
- [x] Out of Scope listed

---

## Problem Statement

После того как артефакты готовы (E4), исследователю нужно поделиться результатами со стейкхолдерами. В v1 — это минимальный export: скачать Markdown или PDF, скопировать в буфер. Также нужна возможность создать shareable link (read-only публичный view артефакта). Share страница = финальный шаг в sidebar навигации, замыкает workflow.

---

## Scope

**In scope:**
- Share страница: `/app/projects/[id]/share` — обзор всех артефактов проекта с export действиями
- Export Markdown: скачать каждый артефакт как `.md` файл (реализовано в E4 API, здесь только UI)
- Export PDF: скачать каждый артефакт как `.pdf` (реализовано в E4 API)
- Export All: скачать ZIP с Markdown файлами всех артефактов
- Shareable link: создать публичный read-only URL вида `/share/[token]`
- Public share page (`/share/[token]`): отображает артефакт без авторизации
- Copy to clipboard: скопировать Markdown artifact в clipboard
- Share summary: показать какие артефакты готовы к шэрингу, какие ещё не генерировались

**Out of scope:**
- PPTX export — v2
- Audience presets (C-Suite / Product / Research mode) — v2
- Email sending артефакта — v2
- Collaboration (comments on share page) — v2
- Expiring share links — v2
- Password-protected share links — v2
- Embedding артефакта на внешний сайт — v3

---

## Share Link Architecture

### Token generation
- UUID v4 as token
- Stored in `ArtifactExport` table (add `share_token` field) OR new `ShareLink` model

### ShareLink model (new)
```prisma
model ShareLink {
  id          String   @id @default(uuid())
  artifact_id String
  token       String   @unique @default(uuid())
  created_at  DateTime @default(now())

  artifact Artifact @relation(fields: [artifact_id], references: [id], onDelete: Cascade)

  @@map("share_links")
}
```

### Public route
- `/share/[token]` — no auth required
- Loads artifact by token, renders read-only view
- Shows: artifact content + "Powered by Harkly" watermark
- No edit controls, no source links (just artifact content)

---

## UI Components & Layout

### `/app/projects/[id]/share`

**Layout:** Single column, clean summary page

**Project summary card:**
- Project title + frame type + date
- Research question (from frame)
- Corpus stats: N sources, M documents included, K extractions

**Artifacts section — for each artifact type:**
- Artifact card showing: type badge, title, generated date (or "Not generated")
- If generated: action buttons
  - "Download Markdown" → triggers download
  - "Download PDF" → triggers download
  - "Copy to clipboard" → copies Markdown to clipboard, shows toast "Copied!"
  - "Share link" → button opens ShareLinkDialog
- If not generated: "Generate in Canvas →" link

**ShareLinkDialog:**
- "Create shareable link" button
- On create: shows generated URL
- Copy URL button
- "Anyone with this link can view this artifact (read-only)"
- Revoke link button (deletes ShareLink record)
- shadcn: `Dialog`, `Input` (read-only URL), `Button`

**Export All button** (top of page):
- "Download all as ZIP" → creates ZIP of all Markdown exports
- Disabled if no artifacts generated

shadcn: `Card`, `Badge`, `Button`, `Alert`, `Dialog`, `Input`

### `/share/[token]` (Public page)

**No authentication required**

**Layout:** Minimal, no app chrome (no sidebar, no top nav)

**Header:**
- Harkly logo (small) + "Shared research artifact"
- Artifact type badge

**Content:** Artifact rendered based on type:
- Fact Pack: same table view as Canvas (read-only, no edit)
- Evidence Map: same matrix view (read-only)
- Empathy Map: same 2×2 grid (read-only)

**Footer:**
- "Created with Harkly · desk research automation"
- "Sign up" CTA link → `/register`

**Meta tags for social sharing:**
- `og:title`: artifact title
- `og:description`: first 2 lines of content
- `og:type`: article

---

## API Routes

### POST `/api/projects/[id]/artifacts/[artifactId]/share-link`
```typescript
// Body: {}
// Response 201: { share_link: ShareLink, url: string }
// Creates ShareLink record
// Returns full share URL: https://harkly.ru/share/{token}
// Auth: required
```

### DELETE `/api/projects/[id]/artifacts/[artifactId]/share-link`
```typescript
// Body: {}
// Response 200: { success: true }
// Deletes all ShareLink records for this artifact
// Auth: required
```

### GET `/api/share/[token]`
```typescript
// No auth required
// Response 200: { artifact: Artifact, project: { title: string, frame_type: string } }
// Response 404: { error: "Link not found or expired" }
```

### GET `/api/projects/[id]/artifacts/[artifactId]/export/zip`
```typescript
// No query params
// Response: ZIP file download containing all Markdown exports for this project
// Auth: required
```

---

## Clipboard Copy Implementation

```typescript
// utils/clipboard.ts
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return true
  }
  // Fallback for non-HTTPS
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  const success = document.execCommand('copy')
  document.body.removeChild(el)
  return success
}
```

Toast notification after copy: use shadcn `Sonner` toast.

---

## Mock Data (Seed Script Update)

Add to seed for "Checkout abandonment analysis":
- 1 ShareLink for the Fact Pack artifact (token: "test-share-token-123")
- This enables testing public share page at `/share/test-share-token-123`

---

## Acceptance Criteria (AC)

- [ ] **AC-601**: Share page (`/app/projects/[id]/share`) рендерится без ошибок
- [ ] **AC-602**: Для каждого сгенерированного артефакта показаны кнопки Download Markdown, Download PDF, Copy, Share link
- [ ] **AC-603**: Для несгенерированных артефактов показана ссылка "Generate in Canvas →"
- [ ] **AC-604**: "Download Markdown" скачивает корректный `.md` файл
- [ ] **AC-605**: "Download PDF" скачивает корректный `.pdf` файл
- [ ] **AC-606**: "Copy to clipboard" копирует Markdown content и показывает toast "Copied!"
- [ ] **AC-607**: "Share link" открывает ShareLinkDialog
- [ ] **AC-608**: POST `/api/projects/[id]/artifacts/[id]/share-link` создаёт ShareLink в БД
- [ ] **AC-609**: URL в ShareLinkDialog содержит `/share/{token}`
- [ ] **AC-610**: "Copy URL" в диалоге копирует URL в clipboard
- [ ] **AC-611**: "Revoke link" удаляет ShareLink из БД
- [ ] **AC-612**: `/share/[token]` доступна без авторизации (200 для валидного токена)
- [ ] **AC-613**: `/share/[invalid-token]` возвращает 404 страницу с "Link not found"
- [ ] **AC-614**: Public share page рендерит артефакт read-only (нет edit controls)
- [ ] **AC-615**: Public share page показывает "Powered by Harkly" footer с CTA
- [ ] **AC-616**: Public share page содержит корректные `og:title` и `og:description` meta теги
- [ ] **AC-617**: "Download all as ZIP" скачивает ZIP с Markdown файлами всех артефактов
- [ ] **AC-618**: "Download all as ZIP" задизаблен если нет сгенерированных артефактов
- [ ] **AC-619**: Seed share link корректно работает (`/share/test-share-token-123` рендерится)
- [ ] **AC-620**: Нет TypeScript ошибок

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Build | `bun run build` | Exit 0 |
| Share page | GET `/app/projects/:id/share` (authenticated) | 200, renders |
| Create share link | POST `/api/projects/:id/artifacts/:id/share-link` | 201, token returned |
| Public page | GET `/share/{token}` (no auth) | 200, artifact renders |
| Invalid token | GET `/share/nonexistent` | 404 page |
| Revoke link | DELETE `/api/projects/:id/artifacts/:id/share-link` | 200, token gone |
| Revoked public | GET `/share/{deleted-token}` | 404 |
| Markdown download | GET `/api/projects/:id/artifacts/:id/export?format=markdown` | File download |
| Unit tests | `bun run test` | All pass |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests: share link creation/revocation + public page token lookup
- [ ] Public page не раскрывает внутренние данные (только artifact content, no source URLs/text)
- [ ] ZIP generation не хранит временные файлы на сервере после download
- [ ] Нет `any` типов
- [ ] og: meta tags проверены через og:debugger (или аналог)
