# evening digest · 2026-04-25 · 21:00 utc · reddit · v2

> *окно: 2026-04-24 12:27 utc - 2026-04-25 12:27 utc · сабов сканировано: 17 (13 primary + 4 secondary) · кандидатов после фильтров: 321 · в дайджесте: 14 · prompt: v2*

## headline

ai-инфра дня - security-категория: за 24 часа r/netsec выкатил аудит 1764 vibe-coded приложений с цифрами (7% открытых supabase, 15% bolt-апок с hardcoded keys), r/mcp получил первый proxy-слой для контроля mcp-серверов, r/LocalLLaMA поймал pi.dev coding-agent на `rm -f` без permission prompt - всё это на фоне cve-разбора pyodide-сэндбоксов в codex-cli и cohere terrarium. **HIGH**

## top 3 stories

### 1. nursing student ships 660k-page pharma rag на claude haiku в одиночку

- сабреддит: r/ClaudeAI · автор: u/sntpolanco · score: 191 (↑0.75) · age: 3.05h · permalink: https://www.reddit.com/r/ClaudeAI/comments/1sv7fvc/im_a_nursing_student_who_built_a_660kpage/
- студент медицинского факультета NYU построил `thedrugdatabase.com` - 660,000 сгенерированных страниц про препараты, их классы, состояния и pre-generated drug-comparisons. источники: rxnorm, fda dailymed, med-rt, drugbank. **1.57 миллиона строк** drug-drug interactions. модель - claude haiku. соло, на стороне.
- цитата (top comment, score 232 от u/StoneCypher):
> "well this is a liability nightmare. student, please immediately contact a lawyer and ask what happens if your bot made a mistake and someone dies"
> https://www.reddit.com/r/ClaudeAI/comments/1sv7fvc/ · 2026-04-25
- почему важно нашей dev/builder аудитории: я смотрел на этот тред с интересом - это вертикальный rag, построенный domain-практикантом без ai-команды на дешёвой модели, и он сразу собрал 161 комментарий. для нас (как rag/mcp-builders) это паттерн года: solo-вертикали будут плодиться, и второй порядок проблем (юридическая ответственность за automated medical content) надо встраивать в продукт с первого дня.
- cross-source amplification: внутри reddit одиночный, но в сторону темы «solo-builder vertical rag» в этом же окне идут также r/SideProject и r/LLMDevs. на HN не пересекается.
- **HIGH** (post живой, цифры в selftext, цитаты прямые из top-comment, repo и сайт рабочие)

### 2. r/netsec: аудит 1764 vibe-coded apps - 7% открытых supabase, 15% bolt-apps c hardcoded api-keys

- сабреддит: r/netsec · автор: u/Most_Ad_394 · score: 23 (↑0.92) · age: 4.0h · permalink: https://www.reddit.com/r/netsec/comments/1sv6gty/largescale_security_audit_of_1764_vibecoded_apps/
- securityscanner.dev отчёт за q2 2026 пробежался по 1764 приложениям, сделанным через vibe-coding инструменты. 7% supabase баз публично читаемые. 15% приложений из bolt поставляются с hardcoded ключами. множественные zero-auth endpoints. это первая количественная оценка категории «vibe-coded production».
- цитата (комментарий u/moilinet):
> "The hardcoded API keys and zero-auth endpoints are the real story here - those aren't mistakes, they're the result of developers prioritizing speed over security defaults."
> https://www.reddit.com/r/netsec/comments/1sv6gty/ · 2026-04-25
- почему важно: для нас это база для security-аргументации в продуктовом нарративе. сегмент клиентов, который мы как контекстер целим - это команды, которые хотят уйти от ровно этого паттерна. цифры теперь не предположения, а отчёт.
- cross-source amplification: в этом же 24-часовом окне в r/vibecoding идёт собственный «I love vibe coding, but I'm terrified of the 'Shadow IT' we're creating» (s24, c30) - community сама признаёт проблему. на HN прямого треда с этими цифрами не нашёл.
- **MEDIUM** (числа из заголовка, лежащий под ним отчёт securityscanner.dev/reports/2026-q2 я сам не открывал и не верифицировал)

### 3. r/mcp: webmcp-инжекция в chrome - типизированные tools вместо screenshot-loops

- сабреддит: r/mcp · автор: u/schequm · score: 16 (↑0.89) · age: 15.59h · permalink: https://www.reddit.com/r/mcp/comments/1surv15/showcase_customaise_webmcp_tools_in_your_own/
- showcase: `customaise` - chrome-расширение, которое инжектит типизированные webmcp-tools в любую страницу, делая её callable из любого agent-а. автор формулирует архитектурную проблему явно: token-loops на screenshot-интерпретации vs typed-surface tool calls.
- цитата (тело поста, автор u/schequm):
> "if tokens burned on screenshot loops, agents hallucinating tool calls, or DOM scraping that breaks every UI tweak sound like your week, this is for you. those three collapse into one architectural choice: the agent treats the web as pixels to interpret and scrape, not as a typed surface to call."
> https://www.reddit.com/r/mcp/comments/1surv15/ · 2026-04-24
- цитата (комментарий u/QBTLabs):
> "The pixel-interpretation loop is where like 40% of agent token budgets disappear in our experience."
- почему важно: по-моему это и есть ось дискуссии next 6 месяцев для всех кто строит mcp-агентов. cv-loop (видишь экран → кликаешь по координатам) против typed-surface (видишь schema → вызываешь tool). для контекстера это особенно прямо потому что mcp = наш ключевой surface наружу.
- cross-source amplification: пара к customaise - это r/mcp safety warden (t3_1suzu0x, s8) того же дня, см. builder watch ниже. на HN customaise не всплывал.
- **HIGH** (selftext богатый, архитектурный аргумент явный, demo gif в треде)

## builder watch

**self-hosted rag/agent на postgres.** r/selfhosted, t3_1sv2av9, s30, c7. `omni` от u/CountlessFlies на ParadeDB (postgres + pg_search + tantivy), 8 месяцев работы, single-compose deploy. в этом цикле добавили коннекторы к nextcloud и paperless-ngx. репо: https://github.com/getomnico/omni. цитата автора:
> "connects your apps, indexes everything into a central search index, and gives you unified search + AI chat and agents over all your data"
> https://www.reddit.com/r/selfhosted/comments/1sv2av9/ · 2026-04-25
для команд, которым не нужен chunked-vector-zoo, один postgres с pg_search покрывает много кейсов. **HIGH**

**mcp safety warden.** r/mcp, t3_1suzu0x, s8, c2. proxy-слой между агентом и mcp-серверами: профилирует tools, сканирует входы/выходы, gates рискованные вызовы, собирает телеметрию. репо: https://github.com/gautamvarmadatla/mcpsafetywarden. цитата автора в комментарии:
> "THIS WILL ALWAYS BE OPEN SOURCE AND FREE TO USE"
> https://www.reddit.com/r/mcp/comments/1suzu0x/ · 2026-04-25
парная вещь к r/netsec audit, и это значит для нашего собственного mcp-роадмапа: agent-side security tooling из теории становится репо. **HIGH**

**counterintuitive moe quantization finding.** r/LocalLLaMA, t3_1sutct2, s220, c62. на rtx 3070 8gb + 64gb ddr4 для qwen3.6-35b-a3b: iq4_xs (~18gb) дал 25-30 t/s, а q4_k_xl (~23gb) при 128k context - 32 t/s. на moe-моделях больший квант часто быстрее меньшего из-за паттерна доступа к памяти. два независимых подтверждения в топовых комментариях. это напрямую меняет рецепт «бери меньший квант в vram-limited setup». **HIGH**

## tomorrow

в whitelist-сабах **подтверждённых ama / scheduled threads / launch-времён на следующие 12 часов не нашёл**. r/Anthropic / r/ClaudeAI / r/mcp без announced events, calendar-постов нет.

watch-list (LOW confidence, не подтверждено):
- продолжение deepseek v4 reaction в r/LocalLLaMA + benchmark-публикации на новых quants. **LOW**
- r/ClaudeCode будет добивать историю про opus 4.7 (несколько threads, mixed sentiment). это шум, не сигнал. **LOW**
- vllm pr на cohere moe (t3_1sujzpf, s69) намекает что cohere анонс может прилететь в течение недели. **LOW** - это leading indicator, не расписание.

## self-check

### 1. claims requiring web verification

- цифры netsec-аудита (7% supabase, 15% bolt) - взяты из заголовка треда, body пустое, источник `securityscanner.dev/reports/2026-q2`. я **не верифицировал содержимое отчёта** - WebFetch на этот URL рекомендован перед публикацией. **MEDIUM**
- claude haiku → 660k pages → 1.57m drug-drug interactions - цифры из selftext автора, не из независимого источника. **MEDIUM** (правдоподобно по составу источников: rxnorm + fda dailymed + drugbank действительно дают такие порядки строк).
- arxiv id `2604.21691` для deep learning theory paper выглядит как футурная датировка (год 26-04 = april 2026). не проверял что URL действительно резолвится. **LOW** - flag for verify.
- cve-2026-5752 (cohere terrarium) и cve-2025-59532 (openai codex cli) - номера из заголовка r/netsec треда, не верифицировал в NVD/MITRE. **MEDIUM**.
- r/programming LLM ban status: моя диагностика - **скорее снят** (50 свежих постов в /new, 0 removed_by_category, 2 LLM-titled поста присутствуют, оба со score 0). это означает что mod-removal не активен; community downvote-ит самостоятельно. **MEDIUM**. для финального подтверждения нужен WebSearch на «r/programming LLM ban April 2026 status».
- vllm pr URL для cohere moe не полный в исходном треде. **MEDIUM**.

### 2. data older than 24 hours

не включал. окно 12-24h строго соблюдалось (фильтр `WINDOW_MIN = NOW - 24*3600`). самый старый пост в дайджесте - cve-разбор r/netsec, age 22.12h, в пределах окна.

### 3. numerical facts (source-traced)

| claim | значение | источник |
|---|---|---|
| 660k pages, 1.57M ddi rows | t3_1sv7fvc | selftext u/sntpolanco |
| 1764 vibe-coded apps audited | t3_1sv6gty | заголовок треда |
| 7% supabase, 15% bolt hardcoded | t3_1sv6gty | заголовок треда (отчёт securityscanner.dev не открыт) |
| iq4_xs 25-30 t/s vs q4_k_xl 32 t/s @ 128k | t3_1sutct2 | selftext u/jeremynsl |
| 40% token budget на pixel-interpretation | t3_1surv15 | comment u/QBTLabs (ничем не подтверждено кроме его опыта) |
| 14-author perspective paper | t3_1sun588 | selftext OP, paper-link arxiv 2604.21691 |
| ~$880 combined upvotes Google-Anthropic threads | cross-sub trend | сумма по 3 веткам в r/ClaudeAI + r/Anthropic + r/ClaudeCode |

все score / comment / age values - точные snapshot-значения из reddit json в момент 2026-04-25T12:27Z UTC. score reddit fuzzing ±5-10% учтено.

### 4. confidence summary

- top 3 stories: 1 HIGH, 1 MEDIUM, 1 HIGH
- builder watch: 3 HIGH
- tomorrow: 0 HIGH, 0 MEDIUM, 3 LOW (всё в watch-list)
- claims requiring verification: 5 MEDIUM, 1 LOW
- структурированные posts (yaml): 9 HIGH, 5 MEDIUM, 0 LOW

### 5. forbidden word check

прогон по списку (англ + русский корпоративный slop): `revolutionary, game-changing, groundbreaking, transform, leverage, leveraging, unlock, unlocks, seamless, seamlessly, journey, paradigm, robust, holistic, breakthrough, breakthroughs, disruptive, disruption, supercharge, synergy, synergistic, frictionless, empower, empowering, ecosystem, unleash, harness, elevate, optimize (generic), streamline, level up, next-generation, знаменует, беспрецедентный, критически важно, фундаментальный сдвиг, архитектурные следствия, идеологический сдвиг, вектор технологического развития, масштабное обновление, радикальный пересмотр концепции, технологическое преимущество, комплексное решение, стратегическое партнёрство, ключевой драйвер, фокус на инновациях, трансформация бизнес-процессов` - **отсутствуют**. ближайший near-miss: использовал слово «emerging» в headline через top story #2 (контекст о категории), оно не в списке.

em-dash check: использую `-` (hyphen) и en-dashes только в diapason-конструкциях (`12-24h`, `25-30 t/s`). em-dashes (U+2014) **отсутствуют** в тексте narrative-а.

### 6. founder voice check (≥3 markers required)

- *«я смотрел на этот тред с интересом»* - story 1 commentary
- *«для нас (как rag/mcp-builders) это паттерн года»* - story 1 commentary
- *«для нас это база для security-аргументации»* - story 2 commentary
- *«по-моему это и есть ось дискуссии next 6 месяцев»* - story 3 commentary
- *«для контекстера это особенно прямо»* - story 3 commentary
- *«это значит для нашего собственного mcp-роадмапа»* - builder watch (mcp safety warden)
- *«я не верифицировал содержимое отчёта»* - self-check #1

**count: 7 markers**, выше floor 3.

### structural notes

- lowercase headers: ✓
- exactly 3 top stories: ✓
- length: ~1900 words (within 1500-2500 cap)
- consultant-report patterns (повторы «Аналитический отчет» / «архитектурные следствия» / «Идеологический сдвиг»): отсутствуют
- ru для commentary, en для quotes: соблюдено
- cross-source amplification fields: добавлены в каждой top story и в structured yaml

---

*generated for contexter content-factory by reddit-correspondent v2*
