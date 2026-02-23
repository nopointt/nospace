# NAMING REGULATION — Semantic-Search-Optimized File & Directory Names
> Applies to: all files and directories under /nospace.
> Authority: Senior Architect. Review: per quarter.
> Tags: [naming, semantic-search, grep, discoverability, conventions]

---

## § 1 — Принцип

Имена файлов — это **первичные метаданные**. Они должны быть полностью информативны без чтения содержимого и оптимизированы для поиска (`grep`, семантический поиск, LLM-retrieval).

**Требования к имени:**
1. **Grep-able** — агент должен найти файл одним запросом по ключевому слову.
2. **Self-describing** — тип, домен и назначение читаются из имени без расширения.
3. **Consistent** — одна конвенция для всей системы, не per-directory.
4. **Lowercase kebab-case** — для всех файлов. Директории — то же.

---

## § 2 — Паттерны по категориям

### Regulations
```
{domain}-regulation.md
```
`memory-regulation.md`, `rbac-regulation.md`, `naming-regulation.md`

### Position Descriptions
```
{role}-pd.md
```
`cto-pd.md`, `reviewer-agent-pd.md`, `sre-lead-pd.md`

### Architecture Decision Records (ADR)
```
{NNN}-{verb}-{noun}.md
```
`001-use-git-context.md`, `002-rust-for-mcp.md`, `003-execve-in-sandbox.md`
- `{NNN}` — трёхзначный порядковый номер (001, 002...)
- `{verb}` — действие в прошедшем времени: `use`, `adopt`, `restrict`, `replace`
- `{noun}` — объект решения в kebab-case

### Memory Files
```
{type}-context-{scope}.md
```
`semantic-context-tLOS.md`, `current-context-global.md`, `episodic-context-harkly.md`
- `{type}`: `semantic` | `episodic` | `current` | `scratchpad` | `procedural`
- `{scope}`: project name или `global`

### Log Files
```
{category}-{agent-id}-{YYYY-MM-DD}.md
```
`consolidation-reviewer-2026-02-23.md`, `rbac-audit-2026-02-23.md`, `api-devops-lead-2026-02-23.md`
- `{category}`: `consolidation` | `rbac-audit` | `api` | `session` | `eval`
- Категория первой — для группировки при `ls logs/system/`

### Branch Names (в development/{p}/branches/)
```
{type}-{feature-slug}
```
`feat-actor-lifecycle`, `fix-nats-reconnect`, `refactor-kernel-memory`, `chore-deps-update`
- `{type}`: `feat` | `fix` | `refactor` | `chore` | `perf` | `test`
- Совпадает с типом коммита (conventional commits)

### Spec & Proposal Files
```
{action}-{noun}-spec.md
{action}-{noun}-proposal.md
```
`implement-actor-scheduler-spec.md`, `replace-axum-with-tower-proposal.md`

### MCP Server Manifests & Sources
```
{function}-mcp-{lang}/
```
`cargo-mcp-rust/`, `query-mcp-ts/`, `cloudflare-mcp-rust/`
- `{function}`: что делает инструмент
- `{lang}`: язык реализации

### Sandbox Environments
```
{runtime}-{purpose}-env/
```
`rust-compiler-env/`, `wasm-runner-env/`, `neon-db-env/`

### Scripts
```
{verb}-{noun}.sh
```
`build-agents.sh`, `rotate-keys.sh`, `deploy-tlos-mainnet.sh`
- Глагол в инфинитиве: `build`, `rotate`, `deploy`, `sync`, `clean`
- Никогда: `deploy.sh` (слишком generic), `script.sh`, `run.sh`

### Research Directories
```
{YYYY-MM}-{topic-slug}/
```
`2026-02-graph-databases/`, `2026-03-nats-vs-libp2p/`
- Дата первой — хронологическая сортировка автоматическая

### Research Phase Files
```
{NN}-{phase}.md
```
`01-hypothesis.md`, `02-literature.md`, `03-results.md`, `04-conclusion.md`

---

## § 3 — Tags в метаданных документа

Каждый `.md` файл ДОЛЖЕН содержать строку Tags в заголовке:
```
> Tags: [domain, type, qualifier, ...]
```

**Правила формирования тегов:**
- Минимум 2, рекомендуется 3–5.
- Теги = ключевые слова для семантического поиска этого документа.
- Берутся из существующего словаря тегов в `semantic-context-{scope}.md`. Новый тег — запись в episodic-log.
- Используй конкретные существительные: `rbac`, `memory`, `rust`, `nats` — не `system`, `misc`, `general`.

---

## § 4 — Запрещённые паттерны

| Антипаттерн | Пример | Проблема |
|---|---|---|
| Generic verb only | `deploy.sh`, `build.sh` | Не ясно что деплоить |
| `utils`, `helpers`, `misc` | `utils.md`, `helpers.ts` | Нет семантики |
| Camel/PascalCase | `MyAgent.md`, `BuildScript.sh` | Inconsistent, grep сложнее |
| Числа без контекста | `agent2.md`, `config3.yaml` | Нет порядка и смысла |
| Аббревиатуры без контекста | `ctx.md`, `sem.yaml`, `cfg.json` | Непрозрачно для LLM retrieval |
| Пробелы | `my file.md` | Ломает CLI |
| Дата без темы | `2026-02-23.md` | Нет содержания |

---

## § 5 — Специальные файлы (исключения)

| Файл | Зачем исключение |
|---|---|
| `CLAUDE.md` | Стандарт Claude Code — капитализация обязательна |
| `Dockerfile.hardened` | Docker convention — первое слово с заглавной |
| `README.md` | Ecosystem convention |
| `scratchpad.md` | Фиксированное имя по memory-regulation.md |
| `spec.md`, `commit-summary.md`, `log-raw.md` | Фиксированные имена по ветковому протоколу |

---

## § 6 — Примеры применения

```bash
# Найти все regulations
ls rules/regulations/
# → agent-conduct-regulation.md
# → memory-regulation.md
# → naming-regulation.md

# Grep по домену "consolidation" — находит лог, pd, и упоминания в ecosystem
grep -r "consolidation" /nospace --include="*.md" -l

# Все ADR по теме "rust"
ls docs/ecosystem-noadmin/adr/ | grep rust
# → 002-rust-for-mcp.md
```
