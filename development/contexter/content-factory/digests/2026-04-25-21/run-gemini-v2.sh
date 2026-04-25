#!/usr/bin/env bash
# Gemini API v2 — evening digest 2026-04-25 21:00 UTC
# Based on lessons from v1 (shallow, missed events) + Gemini API capability research
# Key changes:
#   - systemInstruction (separate from user content)
#   - temperature 0.3 (was 0.7) — fact-oriented
#   - topP 0.8 (was 0.95)
#   - maxOutputTokens 16384 (was 8192)
#   - thinkingConfig.thinkingBudget 24000 (was default)
#   - tools: [google_search, url_context]
#   - explicit topical anchors in prompt
#   - 17 specific URLs for url_context to fetch directly

set -euo pipefail

API_KEY="$(cat ~/.tLOS/gemini-api-key)"
OUT_DIR="C:/Users/noadmin/nospace/development/contexter/content-factory/digests/2026-04-25-21"
NARRATIVE="${OUT_DIR}/gemini-api-narrative-v2.md"
RAW="${OUT_DIR}/gemini-api-raw-v2.json"
REQUEST="${OUT_DIR}/gemini-api-request-v2.json"
SYSTEM_INSTRUCTION_FILE="${OUT_DIR}/gemini-system-instruction-v2.txt"
USER_CONTENT_FILE="${OUT_DIR}/gemini-user-content-v2.txt"

# === Step 1: write systemInstruction (persistent role + voice rules) ===
cat > "$SYSTEM_INSTRUCTION_FILE" <<'SYSINST_EOF'
ROLE
You are evening digest correspondent for the Contexter content factory news pipeline. Audience: developers, AI/ML engineers, indie founders, builders. Senior-technical. Privacy + OSS bias. Anti-marketing reflex.

BRAND VOICE
Cold Bauhaus (founder-led, nopoint POV). Specific and concrete, anti-corporate-speak. Russian for commentary and analysis. English for direct quotes from sources.

VOICE RULES (zero tolerance)

Lowercase headers throughout. "evening digest" not "Evening Digest" not "EVENING DIGEST".

NO em-dashes. Replace with regular dashes (-) or commas. Scan output before save.

NO consultant-report sub-headers. Specifically forbidden patterns:
- "Аналитический отчет и архитектурные следствия"
- "Идеологический сдвиг заключается в том"
- "Это знаменует отказ от парадигмы"
- "Технологическое преимущество"
- "Стратегические следствия"

Russian for synthesis/analysis/opinion. Original language for direct quotes. Don't translate quotes.

Founder voice MANDATORY. Use nopoint POV at least 3 times in narrative. Acceptable markers: "я смотрел", "я заметил", "по-моему", "на мой взгляд", "для нас (как RAG/MCP-builders)", "это значит для нашей аудитории", "у меня вопрос". NOT acceptable: "представители индустрии", "эксперты отмечают", "сообщество обсуждает" — this is corporate analyst voice.

FORBIDDEN WORDS (must NOT appear in output)

English: leverage, leveraging, unlock, unlocks, transform, transforming, seamless, seamlessly, journey, revolutionize, revolutionary, game-changing, robust, paradigm, cutting-edge, breakthrough, disruptive, disruption, supercharge, synergy, synergistic, holistic, frictionless, empower, empowering, ecosystem (vague usage), unleash, harness (verb), elevate, optimize (generic), streamline (vague), level up, next-generation.

Russian corporate slop: "знаменует", "беспрецедентный", "критически важно", "фундаментальный сдвиг", "архитектурные следствия", "Идеологический сдвиг", "вектор технологического развития", "масштабное обновление", "радикальный пересмотр концепции", "стратегическое партнёрство", "ключевой драйвер", "трансформация бизнес-процессов".

If any of these appear in output, the digest fails the quality gate.

CONFIDENCE LABELS (mandatory per major claim)

Every story, every numerical fact, every product/person/date claim must carry one of:
- HIGH: 2+ independent sources verified, fresh (<24h for news)
- MEDIUM: 1 source verified, OR 2 sources from same author/lab
- LOW: only mentioned/inferred, requires further verification

Place labels inline at end of relevant claim or block, NOT aggregated at end.

LENGTH CAP

Master narrative 1500-2500 words. Not 5000. Not 3000. Compress aggressively.

NO FABRICATION

If a fact is uncertain, write "не нашёл подтверждения" or "MEDIUM confidence + needs verify". Do NOT invent URLs, quotes, numbers, titles, dates, authors. Direct quotes must be word-for-word from source. URLs must resolve. If unsure about a number, fact-check before include OR mark LOW.

QUALITY GATES (run before producing final output)

- Lowercase headers throughout
- Zero em-dashes
- Forbidden word scan passed (English + Russian list)
- Founder voice markers >= 3
- Length 1500-2500 words
- Each story has confidence label
- Each numerical fact has source quote in self-check
- 6 self-check components present
- Tomorrow has only confirmed events OR honest "не нашёл подтверждённых"
- No "Аналитический отчет" / consultant-report patterns
- No fabricated content

If any gate fails, revise.
SYSINST_EOF

# === Step 2: write user content (task + topical anchors + URL targets) ===
cat > "$USER_CONTENT_FILE" <<'USERTEXT_EOF'
TASK: produce evening digest for 2026-04-25 21:00 UTC.

WINDOW: last 12-24 hours (from ~2026-04-24 21:00 UTC to ~2026-04-25 21:00 UTC).

FOCUS: product releases, launch announcements, signal updates in AI/dev tooling space.

# topical anchors (must check status of these — substantive activity in last 24h)

1. DeepSeek V4 release (April 24, 2026) - V4-Pro 1.6T/49B + V4-Flash 284B/13B, 1M context default, weights on HuggingFace. Look for: bench replication posts, quantization releases, integration into Ollama/vLLM, simonw + minimaxir analysis, community testing.

2. OpenAI GPT-5.5 / GPT-5.5 Pro in API (April 24, 2026) - 1M context, native MCP via Responses API, computer use, hosted shell, apply patch, Skills. Look for: pricing reactions, MCP integration tutorials, comparisons vs DeepSeek V4 / Claude Opus 4.7 / Anthropic Mythos Preview.

3. Anthropic Mythos breach status (ongoing since April 7-21) - "Discord Sleuths" group accessed via third-party contractor. Project Glasswing limited release (Amazon, Apple, JPMorgan). Look for: investigation updates, regulatory commentary (RU MOF + UK AISI), security tooling response.

4. Google to Anthropic $40B deal (April 24, 2026) - $10B at $350B valuation + $30B performance-gated, mostly cloud credits via Bloomberg. Look for: market reaction, TPU implication discussion, dependency analysis on HN/Reddit.

5. Google Cloud Next 2026 aftermath - Agent Registry, Agent Identity, Agent Sandbox, TPU 8t/8i, AI.PARSE_DOCUMENT in BigQuery. Look for: dev community evaluation, comparison vs OpenAI Workspace Agents.

6. OpenAI Workspace Agents (April 23, 2026 launch) - Codex-based, persistent context, cloud-resident, Slack/Salesforce/Drive integration. Look for: enterprise adoption signal, builder community evaluation.

You are NOT obligated to cover all 6. Only those with substantive activity in window. If anchor has no movement: note "no significant activity in 24h" and move on.

# standing topics

Always relevant:
- MCP ecosystem signals (new servers, security tooling, spec changes)
- RAG production patterns (hybrid search, chunking, eval)
- Agent framework evolution (LangGraph, CrewAI, AutoGen)
- AI security incidents
- Self-hosted OSS frontier-tier models

# specific URLs to fetch via url_context tool

You have url_context tool available. Use it to fetch up to 20 URLs directly. Recommended targets:

HN sources:
- http://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=created_at_i>1745611200,points>50&hitsPerPage=20
- https://news.ycombinator.com/news

Reddit sources (use Mozilla User-Agent in url_context):
- https://www.reddit.com/r/ClaudeAI/top.json?t=day&limit=25
- https://www.reddit.com/r/LocalLLaMA/top.json?t=day&limit=25
- https://www.reddit.com/r/MachineLearning/top.json?t=day&limit=25
- https://www.reddit.com/r/mcp/top.json?t=day&limit=25
- https://www.reddit.com/r/Rag/top.json?t=day&limit=25
- https://www.reddit.com/r/selfhosted/top.json?t=day&limit=25
- https://www.reddit.com/r/netsec/top.json?t=day&limit=25
- https://www.reddit.com/r/devops/top.json?t=day&limit=25

Lab blogs:
- https://www.anthropic.com/news
- https://openai.com/blog
- https://blog.google/technology/ai/
- https://deepmind.google/discover/blog/

Use Google Search grounding to verify specific claims (numbers, dates, product names).

# output structure (mandatory order, lowercase headers)

## headline

1 sentence, 25-40 words. Concrete subject + concrete event + concrete consequence. Not "industry shifts toward X" but "X shipped Y, Z reacted with W".

## top 3 stories

Exactly 3, fewer if not enough qualify. NEVER fabricate to fill.

For each: title in lowercase, 1-line context (source/author/score/age), 2-3 sentences substance, exact quote with URL and date, 1 line "почему важно нашей dev/builder аудитории", cross-source amplification field (also appearing in HN/Reddit/X if known), HIGH/MEDIUM/LOW confidence label.

## builder watch

1-2 unobvious technical insights for RAG/MCP/agent-tooling/AI infra. Direct quotes mandatory. If no signal: "недостаточно подтверждений в 24h окне".

## tomorrow

ONLY confirmed events with timestamps + sources. Format: "[time UTC] - [event] - [source]". If nothing confirmed: "не нашёл подтверждённых анонсов на следующие 12 часов". Speculation goes in separate "watch-list (LOW)" subsection if needed.

## self-check (6 components)

1. claims requiring web verification - bullet list with reasons + confidence levels
2. data older than 24 hours - flag with source dates
3. numerical facts - each with source URL + exact quote
4. confidence summary - count HIGH / MEDIUM / LOW
5. forbidden word check - confirm scan complete
6. founder voice check - count nopoint-POV markers used

# constraints

- No fabrication. If unsure write "не нашёл" / "MEDIUM confidence + verify".
- Headlines never use forbidden words (above list)
- No em-dashes
- Founder voice >= 3 markers
- Length 1500-2500 words

Begin now. Save final narrative to the narrative file path provided.
USERTEXT_EOF

echo "[$(date -u +%H:%M:%S)] systemInstruction + user content prepared"

# === Step 3: build request body via Python ===
PYTHONIOENCODING=utf-8 python3 -c "
import json

sys_inst = open('$SYSTEM_INSTRUCTION_FILE','r',encoding='utf-8').read()
user_text = open('$USER_CONTENT_FILE','r',encoding='utf-8').read()

body = {
    'systemInstruction': {
        'parts': [{'text': sys_inst}]
    },
    'contents': [
        {'role': 'user', 'parts': [{'text': user_text}]}
    ],
    'tools': [
        {'google_search': {}},
        {'url_context': {}}
    ],
    'generationConfig': {
        'temperature': 0.3,
        'topP': 0.8,
        'maxOutputTokens': 16384,
        'thinkingConfig': {
            'thinkingBudget': 24000
        }
    }
}

open('$REQUEST','w',encoding='utf-8').write(json.dumps(body, ensure_ascii=False))
print(f'Request body size: {len(json.dumps(body, ensure_ascii=False))} bytes')
print(f'systemInstruction tokens (approx): {len(sys_inst)//4}')
print(f'user content tokens (approx): {len(user_text)//4}')
"

echo "[$(date -u +%H:%M:%S)] Calling Gemini 2.5 Flash with v2 config (search + url_context, thinking_budget=24000)..."

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @"${REQUEST}" \
  > "${RAW}"

RESPONSE_SIZE=$(wc -c < "${RAW}")
echo "[$(date -u +%H:%M:%S)] Response received: ${RESPONSE_SIZE} bytes"

# === Step 4: extract narrative + stats ===
PYTHONIOENCODING=utf-8 python3 -c "
import json
data = json.load(open('$RAW','r',encoding='utf-8'))

try:
    text = data['candidates'][0]['content']['parts'][0]['text']
except (KeyError, IndexError) as e:
    text = f'ERROR extracting narrative: {e}\n\nRAW response (first 5000 chars):\n' + json.dumps(data, ensure_ascii=False, indent=2)[:5000]

open('$NARRATIVE','w',encoding='utf-8').write(text)

usage = data.get('usageMetadata', {})
grounding = data.get('candidates', [{}])[0].get('groundingMetadata', {})
queries = grounding.get('webSearchQueries', [])
chunks = grounding.get('groundingChunks', [])
url_ctx = data.get('candidates', [{}])[0].get('urlContextMetadata', {})
url_metadata = url_ctx.get('urlMetadata', [])

print(f'\\n=== TOKENS ===')
print(f'  prompt:     {usage.get(\"promptTokenCount\",\"n/a\")}')
print(f'  candidates: {usage.get(\"candidatesTokenCount\",\"n/a\")}')
print(f'  thoughts:   {usage.get(\"thoughtsTokenCount\",\"n/a\")}')
print(f'  total:      {usage.get(\"totalTokenCount\",\"n/a\")}')

print(f'\\n=== SEARCH QUERIES ({len(queries)}) ===')
for q in queries[:20]:
    print(f'  - {q[:120]}')

print(f'\\n=== GROUNDING CHUNKS: {len(chunks)} ===')

print(f'\\n=== URL_CONTEXT URLS FETCHED: {len(url_metadata)} ===')
for u in url_metadata[:25]:
    retrieved = u.get('retrievedUrl', u.get('urlMetadata', {}).get('retrievedUrl', ''))
    status = u.get('urlRetrievalStatus', '?')
    print(f'  - {status}: {retrieved[:120]}')

print(f'\\n=== NARRATIVE STATS ===')
print(f'  bytes: {len(text)}')
print(f'  words (approx): {len(text.split())}')
print(f'  lines: {len(text.splitlines())}')
"

echo ""
echo "[$(date -u +%H:%M:%S)] Done. Narrative: ${NARRATIVE}"
