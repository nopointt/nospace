#!/usr/bin/env bash
# Gemini API evening digest test
# Date: 2026-04-25 21:00 UTC
# Model: gemini-2.5-flash with Google Search grounding (free tier)

set -euo pipefail

API_KEY="$(cat ~/.tLOS/gemini-api-key)"
OUT_DIR="C:/Users/noadmin/nospace/development/contexter/content-factory/digests/2026-04-25-21"
OUT_FILE="${OUT_DIR}/gemini-api-narrative.md"
RAW_FILE="${OUT_DIR}/gemini-api-raw.json"
PROMPT_FILE="${OUT_DIR}/gemini-prompt.txt"

cat > "$PROMPT_FILE" <<'PROMPT_EOF'
EVENING DIGEST · 2026-04-25 · 21:00 UTC

Собери digest за последние 12-24 часа (с ~2026-04-24 21:00 UTC по ~2026-04-25 21:00 UTC) из источников ниже. Фокус: product releases, launch announcements, signal updates в AI/dev tooling space.

ИСТОЧНИКИ ДЛЯ ПОИСКА:
- Hacker News: news.ycombinator.com (используй HN Algolia API hn.algolia.com если можешь)
- Reddit: r/ClaudeAI, r/LocalLLaMA, r/MachineLearning, r/selfhosted, r/programming, r/Rag, r/mcp, r/devops, r/netsec, r/SideProject, r/artificial, r/OpenAI, r/Anthropic
- Anthropic blog: anthropic.com/news
- OpenAI blog: openai.com/blog
- Google AI blog: blog.google/technology/ai/
- Google DeepMind: deepmind.google/discover/blog/
- Lobste.rs: lobste.rs
- Dev.to: dev.to (top week tag rag, mcp, ai)
- Hugging Face Daily Papers: huggingface.co/papers
- ArXiv cs.CL, cs.IR, cs.AI
- The New Stack: thenewstack.io
- The Register: theregister.com/software/
- LangChain blog, LlamaIndex blog
- Newsletters: Hacker Newsletter, Pragmatic Engineer, Latent Space, Import AI, Lenny's Newsletter, Ben's Bites
- Twitter/X профили: @AnthropicAI, @OpenAIDevs, @swyx, @simonw, @OfficialLoganK, @mikeyk, @_catwu

# headline
Одно предложение что главное случилось.

# top 3 stories
Для каждой:
- заголовок одной строкой
- 2-3 предложения сути
- точная цитата из источника + URL + дата публикации
- почему важно нашей dev/builder аудитории (1 строка)
- связанные вторичные источники если есть

# builder watch
1-2 неочевидных события важных для RAG/MCP/agent-tooling/AI infra.
Цитаты обязательны. Если данных нет — "недостаточно подтверждений".

# tomorrow
Что ожидается в следующие 12 часов (releases, conf talks, scheduled launches). Только если источники упоминают конкретно.

# self-check
- какие claims требуют web verification? список
- какие данные >24 часов — flag explicitly
- numerical facts — точная цитата из источника
- HIGH/MEDIUM/LOW confidence labels per major claim

constraints:
- НЕ выдумывай источники
- если не уверен — "не нашёл подтверждения"
- русский для commentary, английский для цитат
- запрещённые слова: leverage / unlock / transform / seamless / journey / revolutionize / game-changing / robust / paradigm / cutting-edge / breakthrough / disruptive
- если меньше 3 stories за 12 часов — пиши сколько есть, не fabricate
- lowercase headers (cold Bauhaus voice)
- NO em-dashes
- founder voice (nopoint POV) OK
PROMPT_EOF

echo "[$(date -u +%H:%M:%S)] Building request..."

# Build JSON via python
python3 -c "
import json, sys
prompt = open('$PROMPT_FILE','r',encoding='utf-8').read()
body = {
    'contents': [{'parts': [{'text': prompt}]}],
    'tools': [{'google_search': {}}],
    'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 8192, 'topP': 0.95}
}
print(json.dumps(body, ensure_ascii=False))
" > "${OUT_DIR}/gemini-request.json"

echo "[$(date -u +%H:%M:%S)] Calling Gemini API (gemini-2.5-flash + Search grounding)..."

curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d @"${OUT_DIR}/gemini-request.json" \
  > "$RAW_FILE"

echo "[$(date -u +%H:%M:%S)] Extracting narrative..."

python3 -c "
import json, sys
data = json.load(open('$RAW_FILE','r',encoding='utf-8'))
try:
    text = data['candidates'][0]['content']['parts'][0]['text']
except (KeyError, IndexError):
    text = 'ERROR: No narrative extracted. Raw response:\n' + json.dumps(data, ensure_ascii=False, indent=2)[:3000]
open('$OUT_FILE','w',encoding='utf-8').write(text)

# Stats
usage = data.get('usageMetadata', {})
grounding = data.get('candidates', [{}])[0].get('groundingMetadata', {})
queries = grounding.get('webSearchQueries', [])
sources_count = len(grounding.get('groundingChunks', []))
print(f'Tokens: prompt={usage.get(\"promptTokenCount\",\"n/a\")} candidates={usage.get(\"candidatesTokenCount\",\"n/a\")} thoughts={usage.get(\"thoughtsTokenCount\",\"n/a\")} total={usage.get(\"totalTokenCount\",\"n/a\")}')
print(f'Search queries: {len(queries)}')
for q in queries[:10]:
    print(f'  - {q}')
print(f'Grounding sources: {sources_count}')
"

echo "[$(date -u +%H:%M:%S)] Done."
echo "  Narrative: $OUT_FILE"
echo "  Lines: $(wc -l < "$OUT_FILE")"
echo "  Bytes: $(wc -c < "$OUT_FILE")"
