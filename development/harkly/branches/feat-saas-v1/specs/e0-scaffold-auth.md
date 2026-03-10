# EPIC SPEC — E0: Scaffold + Auth + DB Schema
> Tags: [scaffold, auth, prisma, nextjs, supabase, yc-pg, shadcn]
> Дата: 2026-03-08
> Статус: 🟡 PLANNING
>
> **Scope note:** E0 = только техническая основа (Next.js setup, Prisma schema, Supabase auth, landing).
> Canvas Shell (infinite canvas, chat UI, multi-agent system) = отдельный эпик **E0.5** (`e0-canvas-shell.md`).
> App Layout в E0 = минимальный placeholder (`/app/[workspaceId]/page.tsx` → пустой div), полноценный shell = E0.5.

---

## Classification

| Field | Value |
|---|---|
| **GAIA Level** | L2 |
| **Token Budget** | ~250K |
| **Depends On** | — (первый эпик) |
| **Topology** | Single-Agent (Qwen) |
| **HITL Checkpoint** | После установки БД (connection strings нужны вручную) |

---

## Definition of Ready (DoR)

- [x] GAIA Level assigned
- [x] Token Budget fixed
- [x] Problem Statement written
- [x] AC finalized
- [x] Verification Gates defined
- [x] Dependencies resolved
- [x] Out of Scope listed

---

## Problem Statement

Нужен полностью настроенный Next.js 14 проект с Bun, Prisma (two datasources: YC Managed PG + Supabase), shadcn/ui, и рабочим auth flow (email/password через Supabase Auth). Это основание для всех последующих эпиков — E1-E6 не могут начаться без работающего scaffold.

---

## Scope

**In scope:**
- Next.js 14 App Router + Bun runtime
- shadcn/ui установлен и настроен (theme, dark mode)
- Prisma с двумя datasources: YC Managed PG (app data) + Supabase PG (analytics/auth metadata)
- Supabase Auth: email/password + Google OAuth
- Core data models (полная Prisma schema, все модели для E0-E6)
- Auth pages: login, register, forgot-password
- Protected route middleware (`/app/*` требует auth)
- Basic layout: root layout + app layout (sidebar placeholder + main area)
- Landing page: статичная, минимальная (header + hero + waitlist form)
- Waitlist form: email capture → сохранение в БД (таблица `WaitlistEntry`)
- Environment variables: `.env.example` с полным списком обязательных переменных
- TypeScript strict mode, ESLint, Prettier

**Out of scope:**
- Canvas Shell, infinite canvas, chat UI, agent system → **E0.5**
- App Layout (только placeholder `/app/[workspaceId]`) → E0.5 заменит его
- Реальный функционал исследований (E1-E6)
- Google OAuth реальная конфигурация (только заглушка flow)
- Email sending (welcome emails, password reset) — только Supabase Magic Link
- Платежи/Stripe
- Deployment на Vercel (infra настраивает nopoint отдельно)
- Тесты E2E (добавляются после каждого эпика)

---

## Data Models (Prisma Schema)

Файл: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

// Datasource 1: YC Managed PostgreSQL (152-ФЗ, персданные)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Datasource 2: Supabase (analytics, публичные данные)
// Используется через Supabase JS SDK напрямую (не через Prisma в v1)

// ─── AUTH ────────────────────────────────────────────────────────

model User {
  id          String   @id @default(uuid())
  supabase_id String   @unique
  email       String   @unique
  name        String?
  avatar_url  String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  workspace_members WorkspaceMember[]
  projects          ResearchProject[]
  notes             Note[]

  @@map("users")
}

// ─── WORKSPACE ───────────────────────────────────────────────────

model Workspace {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  members    WorkspaceMember[]
  projects   ResearchProject[]
  scratchpad ScratchpadItem[]

  @@map("workspaces")
}

model WorkspaceMember {
  id           String   @id @default(uuid())
  workspace_id String
  user_id      String
  role         MemberRole @default(MEMBER)
  created_at   DateTime @default(now())

  workspace Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([workspace_id, user_id])
  @@map("workspace_members")
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

// ─── SCRATCHPAD ──────────────────────────────────────────────────

model ScratchpadItem {
  id           String        @id @default(uuid())
  workspace_id String
  content_type ScratchType
  content      String
  metadata     Json?
  created_at   DateTime      @default(now())

  workspace Workspace @relation(fields: [workspace_id], references: [id], onDelete: Cascade)

  @@map("scratchpad_items")
}

enum ScratchType {
  TEXT
  URL
  FILE_REF
  NOTE
}

// ─── RESEARCH PROJECT ────────────────────────────────────────────

model ResearchProject {
  id           String        @id @default(uuid())
  workspace_id String
  owner_id     String
  title        String
  description  String?
  frame        Json?
  // frame structure: { type: FrameType, confirmed: boolean, fields: {...} }
  frame_type   FrameType?
  status       ProjectStatus @default(ACTIVE)
  created_at   DateTime      @default(now())
  updated_at   DateTime      @updatedAt

  workspace   Workspace   @relation(fields: [workspace_id], references: [id], onDelete: Cascade)
  owner       User        @relation(fields: [owner_id], references: [id])
  sources     Source[]
  documents   Document[]
  extractions Extraction[]
  artifacts   Artifact[]
  notes       Note[]

  @@map("research_projects")
}

enum FrameType {
  PICO
  SPICE
  HMW
  ISSUE_TREE
  FREE_FORM
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
  COMPLETED
}

// ─── SOURCES & DOCUMENTS ─────────────────────────────────────────

model Source {
  id          String       @id @default(uuid())
  project_id  String
  url         String?
  file_name   String?
  file_path   String?
  source_type SourceType
  status      SourceStatus @default(PENDING)
  metadata    Json?
  // metadata: { title, author, publish_date, domain, word_count }
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt

  project   ResearchProject @relation(fields: [project_id], references: [id], onDelete: Cascade)
  documents Document[]

  @@map("sources")
}

enum SourceType {
  URL
  PDF
  DOCX
  CSV
  TXT
}

enum SourceStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
}

model Document {
  id               String          @id @default(uuid())
  project_id       String
  source_id        String
  title            String?
  content          String
  word_count       Int?
  language         String?         @default("en")
  relevance_score  Float?
  screening_status ScreeningStatus @default(PENDING)
  screening_reason String?
  metadata         Json?
  created_at       DateTime        @default(now())
  updated_at       DateTime        @updatedAt

  project     ResearchProject @relation(fields: [project_id], references: [id], onDelete: Cascade)
  source      Source          @relation(fields: [source_id], references: [id], onDelete: Cascade)
  extractions Extraction[]

  @@map("documents")
}

enum ScreeningStatus {
  PENDING
  INCLUDED
  EXCLUDED
  MAYBE
  FLAGGED
}

// ─── EXTRACTION ──────────────────────────────────────────────────

model Extraction {
  id              String         @id @default(uuid())
  project_id      String
  document_id     String
  extraction_type ExtractionType
  content         String
  metadata        Json?
  // metadata: { confidence, position_start, position_end, entities: [] }
  confidence      Float?
  verified        Boolean        @default(false)
  rejected        Boolean        @default(false)
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  project  ResearchProject @relation(fields: [project_id], references: [id], onDelete: Cascade)
  document Document        @relation(fields: [document_id], references: [id], onDelete: Cascade)

  @@map("extractions")
}

enum ExtractionType {
  FACT
  METRIC
  QUOTE
  THEME
  ENTITY
  CONTRADICTION
}

// ─── ARTIFACTS ───────────────────────────────────────────────────

model Artifact {
  id            String       @id @default(uuid())
  project_id    String
  artifact_type ArtifactType
  title         String
  content       Json
  // content varies by type:
  // FACT_PACK: { facts: [{text, source_id, confidence, verified}] }
  // EVIDENCE_MAP: { topics: [{name, evidence_strength, gaps: bool, documents: []}] }
  // EMPATHY_MAP: { say: [], think: [], do: [], feel: [] }
  version       Int          @default(1)
  created_at    DateTime     @default(now())
  updated_at    DateTime     @updatedAt

  project ResearchProject @relation(fields: [project_id], references: [id], onDelete: Cascade)
  exports ArtifactExport[]

  @@map("artifacts")
}

enum ArtifactType {
  FACT_PACK
  EVIDENCE_MAP
  EMPATHY_MAP
}

model ArtifactExport {
  id          String       @id @default(uuid())
  artifact_id String
  format      ExportFormat
  file_path   String?
  created_at  DateTime     @default(now())

  artifact Artifact @relation(fields: [artifact_id], references: [id], onDelete: Cascade)

  @@map("artifact_exports")
}

enum ExportFormat {
  MARKDOWN
  PDF
  JSON
}

// ─── NOTEBOOK ────────────────────────────────────────────────────

model Note {
  id             String   @id @default(uuid())
  project_id     String
  user_id        String
  content        String
  tags           String[]
  linked_doc_ids String[]
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  project ResearchProject @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user    User            @relation(fields: [user_id], references: [id])

  @@map("notes")
}

// ─── WAITLIST ────────────────────────────────────────────────────

model WaitlistEntry {
  id         String   @id @default(uuid())
  email      String   @unique
  role       String?
  created_at DateTime @default(now())

  @@map("waitlist_entries")
}
```

---

## Project Structure

```
harkly-saas/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── app/
│   │   └── [workspaceId]/
│   │       └── page.tsx        ← PLACEHOLDER ONLY (E0.5 заменит полностью)
│   ├── (landing)/
│   │   └── page.tsx            ← Landing + waitlist
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/route.ts  ← Supabase OAuth callback
│   │   └── waitlist/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                     ← shadcn components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   └── landing/
│       └── WaitlistForm.tsx
├── lib/
│   ├── prisma.ts               ← Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts           ← browser client
│   │   └── server.ts           ← server client (cookies)
│   └── utils.ts
├── middleware.ts                ← Auth route protection
├── prisma/
│   └── schema.prisma
├── .env.example
├── package.json
└── tsconfig.json
```

**Note:** `/app/[workspaceId]/page.tsx` в E0 = пустой `<div>Canvas coming in E0.5</div>`. Middleware защищает роут. E0.5 заменит этот placeholder на полноценный canvas shell.

---

## UI Layout

### Landing page (`/`)
- Header: logo + "Sign in" button
- Hero: headline ("Desk research without the chaos") + subheadline + waitlist form (email input + submit)
- No feature sections in v1 — just waitlist capture
- shadcn components: `Button`, `Input`, `Card`

### Auth pages (`/login`, `/register`, `/forgot-password`)
- Centered card layout (max-w-sm)
- Email/password fields
- Google OAuth button (disabled in v1 with "coming soon" tooltip)
- Links between pages
- Error/success states
- shadcn: `Card`, `CardContent`, `Input`, `Button`, `Label`, `Alert`

### App workspace (`/app/[workspaceId]`)
- PLACEHOLDER только: `<div style={{width:'100vw',height:'100vh',background:'#faf8f0'}}>Canvas shell (E0.5)</div>`
- Middleware обеспечивает авторизацию
- Реальный shell реализуется в E0.5

---

## API Routes

### POST `/api/waitlist`
```typescript
// Body: { email: string }
// Response 200: { success: true }
// Response 409: { error: "Already on waitlist" }
// Response 422: { error: "Invalid email" }
```

### GET `/api/auth/callback`
```typescript
// Handles Supabase OAuth callback
// Exchanges code for session
// Redirects to /app/dashboard
```

---

## Environment Variables

```env
# YC Managed PostgreSQL
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Acceptance Criteria (AC)

- [ ] **AC-001**: `bun install` в корне проекта завершается без ошибок
- [ ] **AC-002**: `bun run dev` запускает сервер на `localhost:3000` без ошибок в консоли
- [ ] **AC-003**: `bun run build` завершается успешно (0 TypeScript errors, 0 ESLint errors)
- [ ] **AC-004**: `bunx prisma migrate dev` создаёт все таблицы в YC PG без ошибок
- [ ] **AC-005**: `bunx prisma db pull` подтверждает наличие всех 14 таблиц: users, workspaces, workspace_members, scratchpad_items, research_projects, sources, documents, extractions, artifacts, artifact_exports, notes, waitlist_entries
- [ ] **AC-006**: Landing page (`/`) рендерится, waitlist form отображается
- [ ] **AC-007**: POST `/api/waitlist` с валидным email возвращает 200 и сохраняет запись в БД
- [ ] **AC-008**: POST `/api/waitlist` с тем же email повторно возвращает 409
- [ ] **AC-009**: POST `/api/waitlist` с невалидным email возвращает 422
- [ ] **AC-010**: Страница `/login` рендерится с формой (email + password + submit)
- [ ] **AC-011**: Страница `/register` рендерится с формой (email + password + name + submit)
- [ ] **AC-012**: Регистрация нового пользователя через Supabase Auth создаёт запись в `users` таблице
- [ ] **AC-013**: Логин с валидными credentials устанавливает Supabase сессию и редиректит на `/app/dashboard`
- [ ] **AC-014**: Неавторизованный запрос на `/app/dashboard` редиректит на `/login`
- [ ] **AC-015**: Страница `/app/dashboard` рендерится для авторизованного пользователя (может быть пустой placeholder)
- [ ] **AC-016**: Logout через кнопку в user menu очищает сессию и редиректит на `/`
- [ ] **AC-017**: shadcn/ui `Button`, `Input`, `Card`, `Alert` компоненты присутствуют в `components/ui/`
- [ ] **AC-018**: Middleware (`middleware.ts`) защищает все роуты `/app/*` от неавторизованных пользователей
- [ ] **AC-019**: `.env.example` содержит все обязательные переменные с комментариями
- [ ] **AC-020**: `tsconfig.json` включает `strict: true`

---

## Verification Gates

| Шаг | Команда / Условие | Ожидаемый результат |
|---|---|---|
| Install | `bun install` | Exit 0, no errors |
| Dev server | `bun run dev` | `localhost:3000` returns 200 |
| Build | `bun run build` | Exit 0, TypeScript + ESLint clean |
| DB migrate | `bunx prisma migrate dev --name init` | Migration applied, all tables created |
| DB check | `bunx prisma db pull` | Schema matches 14 tables |
| Waitlist | `curl -X POST localhost:3000/api/waitlist -H "Content-Type: application/json" -d '{"email":"test@test.com"}'` | `{"success":true}` |
| Waitlist duplicate | Same request repeated | `{"error":"Already on waitlist"}`, status 409 |
| Login page | GET `localhost:3000/login` | 200, form renders |
| Auth guard | GET `localhost:3000/app/dashboard` (no cookie) | Redirect to `/login` |
| Unit tests | `bun run test` | All pass (waitlist route + middleware) |

---

## Definition of Done (DoD)

- [ ] Все AC выше: PASS
- [ ] Все Verification Gates: PASS
- [ ] Unit tests для `/api/waitlist` route (happy path + edge cases)
- [ ] `prisma/schema.prisma` содержит все модели из Data Models раздела
- [ ] Нет `any` типов в TypeScript
- [ ] Нет hardcoded secrets
- [ ] Файлы: ни один файл не превышает 300 строк
- [ ] `README.md` с инструкцией локального запуска
