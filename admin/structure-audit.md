# nospace — Structure & Naming Audit
> Generated: 2026-03-22
> Scope: full /nospace directory against regulations

---

## 1. Какая структура используется

### 1.1 Top-Level Layout (де-факто)

```
nospace/
  .archive/          — archived materials (never-delete policy)
  admin/             — workspace administration (NEW, 2026-03-22)
  agents/            — agent role definitions + ecosystem topology
  data/              — runtime data (gitignored, empty)
  design/            — design systems (tLOS, Harkly, Contexter) + Pencil files
  development/       — all project source code (tLOS, Harkly, Contexter)
  docs/              — documentation (Diataxis framework)
  finance/           — personal finance project (Nomos)
  knowledge/         — primary source corpus (Bauhaus PDFs, persona corpus)
  marketing/         — Harkly marketing domain
  memory/            — global workspace memory
  private_knowledge/ — secrets vault (gitignored)
  production/        — deployment configs
  requirements/      — (empty, unused)
  research/          — standalone research projects
  rules/             — governance (constitution + regulations + PDs)
  temp/              — temporary files
  tools/             — internal tooling + OSS references
```

### 1.2 Принцип организации

Структура организована **по функциональному домену** (не по проекту):
- `design/` содержит дизайн-системы ВСЕХ проектов
- `docs/` содержит документацию ВСЕХ проектов
- `development/` содержит код ВСЕХ проектов
- `memory/` — только глобальная память, проектная — внутри `development/{project}/memory/`

**Исключения из этого принципа:**
- `marketing/` — только Harkly (не domain, а project-specific)
- `finance/` — только Nomos (полностью автономный проект)
- `production/` — только tLOS

### 1.3 Внутри каждого проекта

Каждый проект в `development/` следует паттерну:

```
development/{project}/
  memory/              — L1-L4 + chronicle (project-scoped)
  branches/            — feature branch specs
  rules/               — project constitution
  (source code dirs)   — varies per project
```

### 1.4 Memory System (L0-L4)

| Layer | Pattern | Scope | Example |
|---|---|---|---|
| L0 | `~/.claude/CLAUDE.md` + `MEMORY.md` | Global frozen | Rules, API keys |
| L1 | `{project}-about.md` | Project identity | `tlos-about.md` |
| L2 | `{project}-roadmap.md` | Roadmap | `tlos-roadmap.md` |
| L3 | Epic-specific file | Active work | `tlos-phase15.md` |
| L4 | `scratches/{session_id}+{N}-scratch.md` | Session | `1fdcf9a0+143-scratch.md` |
| Chronicle | `chronicle/{project}-current.md` | Append-only | `tlos-current.md` |

---

## 2. Какие правила нейминга у нас есть

Source: `rules/regulations/naming-regulation.md`

### 2.1 Базовые требования (§1-2)

| Правило | Описание |
|---|---|
| **Lowercase kebab-case** | Все файлы и директории |
| **Grep-able** | Имя находится одним поисковым запросом |
| **Self-describing** | Тип, домен и назначение читаются из имени |
| **Consistent** | Одна конвенция для всей системы |

### 2.2 Паттерны по категориям (§2)

| Категория | Паттерн | Пример |
|---|---|---|
| Regulation | `{domain}-regulation.md` | `memory-regulation.md` |
| Position Description | `{role}-pd.md` | `cto-pd.md` |
| ADR | `{NNN}-{verb}-{noun}.md` | `001-use-git-context.md` |
| Memory | `{type}-context-{scope}.md` | `semantic-context-tLOS.md` |
| Log | `{category}-{agent-id}-{YYYY-MM-DD}.md` | `consolidation-reviewer-2026-02-23.md` |
| Branch | `{type}-{feature-slug}` | `feat-actor-lifecycle` |
| Spec | `{action}-{noun}-spec.md` | `implement-actor-scheduler-spec.md` |
| MCP Server | `{function}-mcp-{lang}/` | `cargo-mcp-rust/` |
| Sandbox | `{runtime}-{purpose}-env/` | `rust-compiler-env/` |
| Script | `{verb}-{noun}.sh` | `build-agents.sh` |
| Research dir | `{YYYY-MM}-{topic-slug}/` | `2026-02-graph-databases/` |
| Research file | `{NN}-{phase}.md` | `01-hypothesis.md` |

### 2.3 Tags в метаданных (§3)

Каждый `.md` файл ДОЛЖЕН содержать: `> Tags: [domain, type, qualifier, ...]`

### 2.4 Запрещённые паттерны (§4)

- Generic names: `utils`, `helpers`, `misc`
- CamelCase/PascalCase (кроме исключений)
- Числа без контекста: `agent2.md`
- Аббревиатуры без контекста: `ctx.md`
- Пробелы в именах
- Дата без темы: `2026-02-23.md`

### 2.5 Исключения (§5)

`CLAUDE.md`, `README.md`, `Dockerfile*`, `scratchpad.md`, `spec.md`, `commit-summary.md`, `log-raw.md`

---

## 3. Соответствуем ли мы правилам — АУДИТ

### 3.1 Пробелы в именах файлов (§4 — ЗАПРЕЩЕНО)

**Статус: НАРУШЕНИЕ** — 17+ файлов с пробелами найдено.

| Файл | Расположение |
|---|---|
| `Harkly Architecture Spec.md` | `harkly/branches/feat-saas-v1/` |
| `1351240_Taxi Life_ A City Driving Simulator_*.md` (2) | `harkly/branches/feat-cx-osint-pipeline/output/` |
| `Webshare 10 proxies.txt` | `harkly/branches/feat-saas-v1/` |
| `128x128 @2x.png` (2) | `harkly-shell/`, `tLOS/core/shell/` (Tauri icon) |
| `Strategic Brief` (dir) | `tLOS/branches/feat-mcb-v1/` |
| `StoryBrand Layer.md` | `docs/tLOS/docs/brand/` |
| `Marketing Command Board (MCB).md` | `docs/tLOS/MCB/` |
| `доп запросы.xlsx`, `Новая таблица.xlsx`, `Работа с внешними ссылками.docx` | `docs/tLOS/MCB/` |
| `Источники, сводка-*.csv` | `docs/tLOS/MCB/` |
| `ты сейчас ученый...` | `docs/time oracle/` |
| `Корень боли CX_*.pdf` | `docs/harkly/` |
| `CX-исследователей_*.pdf` | `harkly/branches/feat-saas-v1/specs/` |

### 3.2 Пробелы в именах директорий (§4 — ЗАПРЕЩЕНО)

**Статус: НАРУШЕНИЕ** — 3 директории с пробелами.

| Директория |
|---|
| `docs/time oracle/` |
| `tLOS/core/dir created/` |
| `tLOS/branches/feat-site-v1/templates/spotify-visualiser/public/Aeonik TRIAL/` |

### 3.3 CamelCase/PascalCase вместо kebab-case (§4)

**Статус: ЧАСТИЧНОЕ НАРУШЕНИЕ**

**Легитимные исключения (§5):**
- `L0-identity.md`, `L1-cognition.md`, `L2-memory-config.yaml` и т.д. — layer prefixes, NOT covered by §5 but established convention
- `AGENTS.md`, `DESIGN-CODE.md`, `INSTRUCTION.md`, `MOVED.md` — uppercase documentation (gray area)

**Нарушения в workspace .md файлах:**
| Файл | Проблема |
|---|---|
| `CX_OSINT.md`, `CX_OSINT_pipeline.md`, `CX_OSINT_prompts.md` | Uppercase + underscore |
| `OSINT_framework.md` | Uppercase + underscore |
| `TECHNICAL_SPECIFICATION.md` | Uppercase + underscore (should be `technical-specification.md`) |
| `CREDENTIALS.md` | Uppercase (should be `credentials.md`) |
| `Harkly.md` | PascalCase |
| `completed_TASK-HARKLY-05-SECURITY_2026-03-06.md` | Mixed case + underscore |

**Source code (camelCase) — NOT a violation:** TypeScript/JS files follow language conventions (camelCase is standard for JS/TS). Generated Prisma models (PascalCase) are auto-generated. These are excluded from naming-regulation scope.

### 3.4 Директории с uppercase (§1: lowercase kebab-case)

**Статус: НАРУШЕНИЕ**

| Директория | Должно быть |
|---|---|
| `development/tLOS/` | `development/tlos/` |
| `docs/tLOS/` | `docs/tlos/` |
| `production/tLOS/` | `production/tlos/` |
| `docs/tLOS/BB-framework/` | `docs/tlos/bb-framework/` |
| `docs/tLOS/MCB/` | `docs/tlos/mcb/` |
| `tools/oss-reference/OpenHands/` | External repo, exclude |

> **NOTE:** `tLOS` как имя проекта используется повсюду. Переименование — breaking change для всех путей в L0-L4 memory, CLAUDE.md, и десятков ссылок. Это скорее LEGACY EXCEPTION чем ошибка, но регуляция его не покрывает.

### 3.5 Отсутствие Tags в метаданных (§3 — ОБЯЗАТЕЛЬНО)

**Статус: ЧАСТИЧНОЕ НАРУШЕНИЕ** — Tags есть в большинстве ключевых файлов, но отсутствуют в:

| Файл | Tags |
|---|---|
| `rules/regulations/agent-conduct-regulation.md` | MISSING |
| `rules/regulations/code-style-regulation.md` | MISSING |
| `memory/episodic-context-global.md` | MISSING |
| `memory/handshake-assistant.md` | MISSING |
| `memory/handshake.md` | MISSING |

(Файлы с Tags: naming-regulation, file-size-regulation, memory-regulation, context-economy, task-management, ecosystem-map, semantic-context — ОК.)

### 3.6 Generic имена (§4: запрещены `utils`, `helpers`, `misc`)

**Статус: НАРУШЕНИЕ в собственном коде, OK в external**

| Файл | Тип |
|---|---|
| `harkly-saas/src/lib/utils.ts` | OWN CODE — violation |
| `harkly-web/src/__tests__/routes/api/helpers.ts` | OWN CODE — violation |
| `harkly-shell/` — нет utils/helpers | OK |
| `contexter/` — нет utils/helpers | OK |
| `tLOS/core/` — нет utils/helpers (own code) | OK |
| `docs/research/_eval/**/utils.ts` | EXTERNAL code — exclude |
| `tools/oss-reference/**/utils.ts` | EXTERNAL repo — exclude |

### 3.7 Integrity Hash в memory файлах (memory-regulation §6)

**Статус: ПОЛНОЕ НАРУШЕНИЕ** — ни один файл semantic/episodic context не содержит `<!-- integrity: sha256:... -->` хедера.

Проверены:
- `memory/semantic-context-global.md` — NO HASH
- `memory/episodic-context-global.md` — NO HASH
- `development/tLOS/memory/semantic-context-tLOS.md` — NO HASH
- `development/tLOS/memory/episodic-context-tLOS.md` — NO HASH

### 3.8 Branch naming (§2)

**Статус: ХОРОШЕЕ СООТВЕТСТВИЕ с исключениями**

Compliant branches (pattern: `{type}-{slug}`):
- `feat-mcb-v1`, `feat-node-v1`, `feat-omnibar`, `feat-qdrant-v1` — OK
- `feat-cx-osint-pipeline`, `feat-desktop-scaffold`, `feat-saas-v1` — OK
- `qa-fix-backend`, `qa-fix-frontend` — OK
- `docker-v1` — missing type prefix (should be `feat-docker-v1` or `chore-docker-v1`)

Non-compliant:
| Branch | Проблема |
|---|---|
| `feature-name` | Generic placeholder, not a real branch |
| `l3-agents` | Missing type prefix |
| `phase-11` | Missing type prefix |
| `quality-sprint` | Missing type prefix |
| `mcb-v1` | Missing type prefix (duplicate of `feat-mcb-v1`?) |

### 3.9 Memory file naming (§2: `{type}-context-{scope}.md`)

**Статус: ЧАСТИЧНОЕ СООТВЕТСТВИЕ**

Compliant:
- `current-context-global.md`, `semantic-context-global.md`, `episodic-context-global.md` — OK
- `current-context-tLOS.md`, `semantic-context-tLOS.md`, `episodic-context-tLOS.md` — OK
- `current-context-harkly.md` — OK

Non-compliant (evolved naming, not matching §2 pattern):
| Файл | Проблема | Паттерн §2 |
|---|---|---|
| `tlos-about.md` | Project-specific format, not `{type}-context-{scope}` | Custom (L1) |
| `tlos-roadmap.md` | Same | Custom (L2) |
| `tlos-phase15.md` | Same | Custom (L3) |
| `harkly-about.md`, `harkly-roadmap.md` | Same | Custom |
| `handshake.md`, `handshake-*.md` | Deprecated but still present | N/A |
| `auto-scratch.md`, `session-scratch.md` | Session-specific | Custom (L4) |
| `codebase-map-tLOS.md` | Ad-hoc | Not in regulation |
| `enricher-status.md` | Ad-hoc | Not in regulation |
| `bug-report-2026-03-10.md` | Close to log pattern but not exact | Should be `{category}-{agent}-{date}` |
| `chronicle-tLOS.md` | Legacy, moved to `chronicle/` | N/A |

> **Вывод:** Naming regulation §2 описывает только `{type}-context-{scope}.md` паттерн, но реальная memory система эволюционировала в L1/L2/L3/L4 модель с собственными именами. Регуляция не обновлена.

### 3.10 Script naming (§2: `{verb}-{noun}.sh`)

**Статус: ЧАСТИЧНОЕ НАРУШЕНИЕ**

| Скрипт | Соответствие |
|---|---|
| `production/tLOS/deploy.sh` | VIOLATION — too generic (should be `deploy-tlos.sh`) |
| `knowledge/bauhaus-books/download.sh` | VIOLATION — too generic (should be `download-bauhaus-books.sh`) |
| `knowledge/persona-corpus/run.sh` | VIOLATION — too generic (§4: never `run.sh`) |

### 3.11 Research directory naming (§2: `{YYYY-MM}-{topic}/`)

**Статус: ХОРОШЕЕ СООТВЕТСТВИЕ**

- `2026-02-graph-databases/` — OK
- `2026-02-harkly-horizons/` — OK
- `2026-02-synthetic-consumers-silicon-sampling/` — OK

But: `docs/research/` contains flat files (not in dated dirs):
- `harkly-research-github.md`, `harkly-mvp-architecture.md`, etc. — no date prefix, not in subdirectories.

---

## 4. Сводная таблица соответствия

| Правило | Соответствие | Нарушений | Severity |
|---|---|---|---|
| Lowercase kebab-case (files) | PARTIAL | ~20 files | Medium |
| Lowercase kebab-case (dirs) | PARTIAL | `tLOS` (legacy), 3 space-dirs | High (tLOS = breaking) |
| No spaces in names | VIOLATED | 17+ files, 3 dirs | High |
| No generic names | PARTIAL | 2 own-code files | Low |
| Tags in .md headers | PARTIAL | 5 key files missing | Low |
| Memory file naming pattern | PARTIAL | Pattern evolved beyond regulation | Medium (regulation outdated) |
| Integrity hash (memory-reg §6) | FULLY VIOLATED | 0/4 files have hash | High (security) |
| Branch naming pattern | MOSTLY OK | 5 branches without type prefix | Low |
| Script naming pattern | VIOLATED | 3 scripts too generic | Low |
| Research naming pattern | PARTIAL | Flat files in docs/research/ miss dates | Low |

---

## 5. Вывод

### Что работает хорошо
1. **Regulations и PDs** — следуют паттернам `{domain}-regulation.md` и `{role}-pd.md` идеально
2. **ADRs** — `{NNN}-{verb}-{noun}.md` соблюдается
3. **Branch naming** — большинство branches корректны
4. **Design system** — чистая организация (foundations, guidelines, patterns, tokens)
5. **Memory L1/L2/L3** — консистентный паттерн `{project}-about.md` / `{project}-roadmap.md`
6. **Research dirs** — `{YYYY-MM}-{topic}/` соблюдается
7. **MCP servers** — `{function}-mcp-{lang}/` соблюдается

### Что нарушено
1. **Пробелы в именах** — историческое наследие ранних сессий, нужна миграция
2. **`tLOS` uppercase** — legacy naming, breaking change при исправлении
3. **Integrity hash отсутствует** — security requirement из memory-regulation не реализован
4. **Naming regulation устарела** — не описывает L1/L2/L3/L4 паттерн, about/roadmap/phase файлы, chronicle, scratches

### Рекомендации
1. **Обновить naming-regulation** — добавить секции для L1/L2/L3/L4/chronicle паттернов
2. **Добавить `tLOS` как legacy exception** в §5 naming-regulation
3. **Провести rename-pass** для файлов с пробелами (move to `.archive/` если не нужны)
4. **Решить вопрос integrity hash** — либо имплементировать, либо убрать из регуляции
5. **Не трогать source code naming** — JS/TS camelCase и Prisma PascalCase — language conventions
