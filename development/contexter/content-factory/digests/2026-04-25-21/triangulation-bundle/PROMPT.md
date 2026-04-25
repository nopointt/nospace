# Triangulation Prompt v2 — paste into Gemini chat

> **РЕЖИМ:** Gemini 3.1 Pro Preview, обычный chat (НЕ Deep Research mode).
> Deep Research auto-decompose ломает iteration по corpus. Если у тебя включён — выключи перед началом.
> **Tools:** Google Search grounding + URL Context. **Temperature:** 0.2-0.3 если можно настроить.

---

# ЕДИНСТВЕННАЯ ЗАДАЧА

В приложенном файле `CORPUS.md` находится **26 нумерованных сигналов** (#1 — #26), каждый в формате YAML-блока. Твоя единственная задача: триангулировать ровно эти 26 сигналов и вернуть 26 YAML-блоков обратно с верифицированными данными.

# СТРОГИЕ ЗАПРЕТЫ

**НЕ ДОБАВЛЯЙ новые сигналы.** Если ты находишь интересную story не из CORPUS.md (Llama 4 Scout, Project Glasswing, Anthropic Mythos, Salesforce Headless 360, Claude Design, MCP→Linux Foundation, и т.п.) — игнорируй её. Это другой пайплайн, не этот.

**НЕ ПИШИ master synthesis в этом проходе.** Никаких "Тема 1", "Тема 2", "cross-cutting themes", "suggested headline", "suggested top 3 stories", "publishable now". Только 26 YAML-блоков. Synthesis это отдельная задача отдельным промптом.

**НЕ ИЩИ темы в общем.** Если signal про DeepSeek V4 — ищи confirmation именно DeepSeek V4 release, не "AI frontier model releases April 2026 в общем".

**НЕ ВЫДУМЫВАЙ материал.** Если для какого-то signal ты не находишь corroborating sources — отметь как `LOW` или `NOT_REPRODUCIBLE` и продолжай. Не заполняй пустоту generic'ой.

**НЕ ДЕЛАЙ Deep Research расширение.** Auto-decompose в sub-questions выводит из фокуса. Один signal = один pass = один YAML блок.

# ПРОЦЕСС

```
1. Прочитай CORPUS.md
2. Найди 26 нумерованных блоков "=== SIGNAL #N ==="
3. Для каждого signal #N от 1 до 26:
   3.1 Прочитай его primary_claims
   3.2 Сделай Google Search по конкретному claim
   3.3 Сделай URL Context fetch для primary_links если есть
   3.4 Вернись с триангулированным YAML блоком
4. Output 26 блоков подряд, в порядке #1 → #26
5. Stop. НЕ продолжай в master synthesis.
```

# 5 ОСЕЙ TRIANGULATION (NARROW DEFINITIONS)

## Ось 1 — verification

Для каждого `primary_claim` в signal:
- Сделай WebSearch по точному claim
- Если есть URL — попробуй URL Context fetch
- Отметь status: `HIGH` (подтверждено 2+ независимыми) | `MEDIUM` (один источник или vendor-only) | `LOW` (только primary, нужна дополнительная верификация) | `NOT_REPRODUCIBLE` (не нашёл подтверждения)
- Список corroborating URLs ИЛИ "none found"
- Список contradictions ИЛИ "none found"
- vendor_bias_flag: `true` если только primary vendor source, `false` если есть independent

## Ось 2 — lateral context (NARROW)

**Не "найди новые истории на тему".** Это: для CONFIRMED claim в данном signal — найди 2-3 источника **обсуждающих ИМЕННО ЭТУ** конкретную story, product, paper, person.

Если нет — пиши `"no lateral context found beyond primary"`.

Примеры что считается lateral context для signal "DeepSeek V4 ships":
- ✓ Karpathy tweet про DeepSeek V4 architecture
- ✓ Latent Space podcast episode мастиgo dropped covering DeepSeek V4
- ✓ Cloudflare blog adding DeepSeek V4 to Workers AI
- ✗ "Other frontier model releases this week" (это новый research, запрещено)
- ✗ "AI hardware shift toward Huawei Ascend in general" (broad theme, запрещено)

## Ось 3 — discourse map (NARROW)

**Не "что говорят про эту тему в целом".** Это: что говорят пользователи на форумах **именно про данный signal**.

Если signal недостаточно known чтобы за пределами primary source кто-то обсуждал — пиши `"discourse limited to primary source"`.

Покрываемые площадки (если найдешь упоминание signal на этих):
- HN comment threads (помимо primary HN thread если есть)
- Reddit threads на других subreddits
- Twitter/X public threads
- Lobste.rs
- GitHub Issues / Discussions
- Mastodon (hachyderm.io)
- Bluesky
- Personal blogs (simonwillison.net, minimaxir.com, swyx.io, jvns.ca)

Структура output:
```yaml
discourse_map:
  top_arguments_pro:
    - "<argument>" + source URL
  top_arguments_contra:
    - "<argument>" + source URL
  sentiment_per_venue:
    venue_name: classification + 1 line evidence
  notable_voices:
    - "<known commentator>: <их take + URL>"
```

## Ось 4 — amplification

```yaml
amplification:
  venues_count: <integer>
  classification: single-source | multi-sub | trend | breaking-trend
  geographic_spread: us | eu | cn | ru | global
```

## Ось 5 — confidence summary

```yaml
confidence:
  overall: HIGH | MEDIUM | LOW
  weakest_link: <one phrase>
  needs_human_review: [list OR empty]
  publishable_status: at_HIGH | with_caveats | do_not_publish_yet
```

# OUTPUT TEMPLATE (replicate exactly for ALL 26 signals)

Output ровно 26 блоков, каждый в этом формате. **Никакого text между блоками.** Никаких "далее переходим к signal #N", никаких заголовков secций. Только последовательность 26 YAML-блоков.

```yaml
---
signal_id: <copy from CORPUS>
source_in_corpus: <copy>
title: <copy>

verification:
  primary_claims:
    - claim: "<exact claim from corpus>"
      status: HIGH | MEDIUM | LOW | NOT_REPRODUCIBLE
      corroborating_urls: [<list> OR "none found"]
      contradictions: [<list> OR "none found"]
      vendor_bias: <true|false + reason>
  numerical_facts_verified:
    - "<fact>": <status>

lateral_context: 
  # NARROW: only sources discussing THIS signal specifically
  - source: <name>
    url: <url>
    angle: <how it adds depth on THIS signal>
  # OR: "no lateral context found beyond primary"

discourse_map:
  top_arguments_pro: [<list> OR "limited"]
  top_arguments_contra: [<list> OR "limited"]
  sentiment_per_venue:
    hn: <classification + 1-line evidence>
    reddit: <if relevant>
    twitter_x: <if relevant>
    lobsters: <if relevant>
    github_issues: <if relevant>
    dev_to: <if relevant>
    mastodon: <if relevant>
  notable_voices: [<list> OR "none observed"]
  unique_angle: <frame НЕ в primary source OR "no unique angle observed">

amplification:
  venues_count: <integer>
  classification: single-source | multi-sub | trend | breaking-trend
  geographic_spread: us | eu | cn | ru | global

confidence:
  overall: HIGH | MEDIUM | LOW
  weakest_link: <one phrase>
  needs_human_review: [<list> OR empty]
  publishable_status: at_HIGH | with_caveats | do_not_publish_yet
---
```

# VOICE RULES (применяй в descriptive полях output: angles, evidence, weakest_link)

- Lowercase only — даже в signal_id, status тегах OK uppercase, но описательный текст lowercase
- БЕЗ эм-дашей (—). Только обычный дефис (-) или запятая.
- БЕЗ corporate slop фраз: "знаменует", "беспрецедентный", "критически важно", "фундаментальный сдвиг", "архитектурные следствия", "идеологический сдвиг", "переломный момент"
- БЕЗ AI buzzwords: leverage, leveraging, unlock, transform, seamless, journey, revolutionize, game-changing, robust, paradigm, cutting-edge, breakthrough, disruptive, supercharge, synergy, holistic, ecosystem (vague), elevate, optimize (generic), streamline (vague)
- Russian для commentary, English для прямых quotes из источников. Quotes word-for-word, не переводить.

# REFERENCE NARRATIVES в CORPUS.md

В CORPUS.md есть секция `<reference_for_voice_pattern_only>` с двумя narratives корреспондентов. Это **только для voice reference** (понять founder POV, "я смотрел / для нас / по-моему" pattern). **НЕ воспроизводи narrative — output это 26 структурированных YAML-блоков, не narrative.**

# СПИСОК 26 СИГНАЛОВ для проверки наличия

Перед началом проверь что в CORPUS.md ты видишь все 26:

| # | signal_id | type |
|---|---|---|
| 1 | hn_47884971 | DeepSeek V4 |
| 2 | hn_47892074 | Google → Anthropic $40B |
| 3 | hn_47878905 | Anthropic Claude Code post-mortem |
| 4 | hn_47894000 | OpenAI GPT-5.5 in API |
| 5 | hn_47892019 | "I cancelled Claude" Steve Yegge |
| 6 | hn_47899844 | wuphf Karpathy markdown wiki |
| 7 | hn_47897790 | Stash memory layer |
| 8 | hn_47890841 | Browser Harness Show HN |
| 9 | reddit_trend_agents_md | AGENTS.md cross-sub trend |
| 10 | reddit_trend_deepseek_v4 | DeepSeek V4 Reddit reaction |
| 11 | reddit_trend_google_anthropic_40b | $40B Reddit reaction |
| 12 | reddit_trend_agent_sandboxing | Agent sandboxing security category |
| 13 | reddit_t3_1sv7fvc | Pharma RAG nursing student |
| 14 | reddit_t3_1sv6gty | 1764 vibe-coded apps audit |
| 15 | reddit_t3_1surv15 | Customaise WebMCP |
| 16 | reddit_t3_1suzu0x | MCP Safety Warden |
| 17 | reddit_t3_1sv2av9 | Omni ParadeDB |
| 18 | reddit_t3_1surlms | Mesh Infra IDE |
| 19 | reddit_t3_1suiys0 | AGENTS.md 13 SWE books |
| 20 | reddit_t3_1sun588 | Theory of Deep Learning paper |
| 21 | reddit_t3_1suh47t | Pyodide CVE writeup |
| 22 | reddit_t3_1sunkcq | Pi.dev no sandbox |
| 23 | reddit_t3_1sutct2 | Qwen3.6 quant findings |
| 24 | reddit_t3_1suwazy | 5 LLM agents bake-off |
| 25 | reddit_t3_1suhu6z | Dnsweaver |
| 26 | reddit_t3_1sujzpf | vLLM Cohere MoE PR |

Если ты насчитал не 26 — STOP. Сообщи мне сколько нашёл и какие. Не продолжай.

# НАЧАЛО ВЫВОДА

Когда будешь готов — выведи ровно эту строку первой:

```
TRIANGULATION START · 26 signals · 2026-04-25-21
```

Затем начни с signal #1 в формате YAML блока. Затем #2. И так далее до #26. После signal #26 выведи:

```
TRIANGULATION COMPLETE · 26/26 signals processed
```

И остановись. НЕ пиши synthesis. НЕ предлагай headline. НЕ давай recommendations.
