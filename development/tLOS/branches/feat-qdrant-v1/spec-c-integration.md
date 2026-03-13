# SPEC C — Associative Router: wiring into claude-bridge/index.js

## Задача
Интегрировать `qdrant-client.js` в `index.js`:
1. На каждое сообщение — `searchAssociative(content)` → инжект в prompt как `<associative_context>`
2. При `agent:zep:add_fact` — также добавить факт в Qdrant global collection
3. При старте — инициализировать Qdrant и засеять global collection из pg seed facts

## Файл для изменения
`C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\index.js`

## Текущие точки интеграции в index.js

### Строка 15 (imports):
```js
const ZepClient = require('./zep-client');
```
→ Добавить ПОСЛЕ неё:
```js
const QdrantClient = require('./qdrant-client');
```

### Строки 24-29 (startup init):
```js
ZepClient.isAvailable().then(available => {
    ...
    ZepClient.ensureDomain('development-domain').then(() =>
```
→ Добавить рядом инициализацию Qdrant:
```js
QdrantClient.isAvailable().then(available => {
    if (available) {
        console.log('[tlos-claude-bridge] Qdrant available — associative routing enabled');
        QdrantClient.ensureCollection('tlos-global').catch(() => {});
    } else {
        console.warn('[tlos-claude-bridge] Qdrant unavailable — associative routing disabled');
    }
});
```

### Строки 316-318 (per-message microagents injection):
```js
    // Inject matching microagents based on message keywords
    const microagents = loadMatchingMicroagents(content);
    let fullContent = content;
```
→ Перед этим блоком добавить Associative Context:
```js
    // Associative context from Qdrant global memory
    const assocResults = await QdrantClient.searchAssociative(content, 5);
    let fullContent = content;
    if (assocResults.length > 0) {
        const assocBlock = assocResults
            .map((r, i) => `${i + 1}. [score:${r.score.toFixed(2)}] ${r.text}`)
            .join('\n');
        fullContent = `<associative_context>\n${assocBlock}\n</associative_context>\n\n${content}`;
    }
```
ВАЖНО: удалить дублирующее `let fullContent = content;` из строки 318 (microagents блок).

### Строки 527-532 (agent:zep:add_fact event):
```js
        if (parsed.type === 'agent:zep:add_fact') {
            ...
            ZepClient.addFact(domain, content, metadata).then(ok => {
```
→ Добавить после ZepClient.addFact вызова:
```js
            // Also sync to Qdrant global collection for associative routing
            QdrantClient.addGlobal(content, { domain, ...metadata }).catch(() => {});
```

## Ограничения
- НЕ трогать ZepClient, LettaClient, NATS logic
- fullContent уже объявлен выше — не переобъявлять через let во второй раз
- assocResults может быть [] (Qdrant недоступен) — в этом случае fullContent = content (ничего не меняем)
- Всё async/await — функция handleChat уже async, это OK

## Верификация
После изменений: перезапустить bridge и в логах должно появляться:
`[tlos-claude-bridge] Qdrant available — associative routing enabled`
