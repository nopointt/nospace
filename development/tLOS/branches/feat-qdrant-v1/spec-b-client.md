# SPEC B — qdrant-client.js

## Задача
Создать `qdrant-client.js` — клиент для Qdrant с Associative Routing.

## Файл для создания
`C:\Users\noadmin\nospace\development\tLOS\core\kernel\tlos-claude-bridge\qdrant-client.js`

## Архитектура
- Qdrant REST API на `http://localhost:6333`
- Embeddings через liteLLM `http://localhost:4000/v1/embeddings` (model: `text-embedding-ada-002` → NIM Matryoshka 1536-dim)
- Zero external deps (Node.js 18+ fetch only)
- Zero throws — каждая функция возвращает null/false/[] при ошибке
- Главная коллекция: `tlos-global` (всё важное из всех доменов)

## Константы
```js
const QDRANT_URL = 'http://localhost:6333';
const LITELLM_URL = 'http://localhost:4000';
const EMBED_MODEL = 'text-embedding-ada-002';
const EMBED_DIMS = 1536;
const GLOBAL_COLLECTION = 'tlos-global';
const CACHE_TTL_MS = 30_000;
```

## Функции (все async, все zero-throw)

### isAvailable()
- GET `{QDRANT_URL}/healthz` с timeout 3s, 30s cache
- Возвращает boolean

### ensureCollection(name, dims = EMBED_DIMS)
- PUT `{QDRANT_URL}/collections/{name}`
- Body: `{ vectors: { size: dims, distance: "Cosine" }, on_disk_payload: true }`
- Идемпотентно: если коллекция уже существует (409) — OK, возвращает true
- При ошибке — возвращает false

### getEmbedding(text)
- POST `{LITELLM_URL}/v1/embeddings` { model, input: text.slice(0,8000) }
- Timeout 15s
- Возвращает number[] или null

### upsert(collection, id, vector, payload = {})
- PUT `{QDRANT_URL}/collections/{collection}/points`
- Body: `{ points: [{ id, vector, payload }] }`
- id должен быть числом (uint64) или uuid string
- Возвращает boolean

### search(collection, queryText, limit = 5, filter = null)
- Embed queryText → vector
- POST `{QDRANT_URL}/collections/{collection}/points/search`
- Body: `{ vector, limit, with_payload: true, filter: filter || undefined }`
- Возвращает массив `{ id, score, payload }` или []

### addGlobal(text, payload = {})
- Добавить в коллекцию GLOBAL_COLLECTION
- id = детерминированный числовой хэш из text (чтобы не дублировать)
- Реализация хэша: простой djb2 или FNV-1a в пределах Number.MAX_SAFE_INTEGER
- Payload добавить поле `text` и `added_at` (ISO timestamp)
- Возвращает boolean

### searchAssociative(queryText, limit = 5)
- Убедиться что коллекция GLOBAL_COLLECTION существует (ensureCollection)
- search(GLOBAL_COLLECTION, queryText, limit)
- Возвращает массив `{ id, score, text, payload }` где text из payload.text
- При ошибке или пустом результате — возвращает []

## module.exports
```js
module.exports = {
  isAvailable,
  ensureCollection,
  upsert,
  addGlobal,
  search,
  searchAssociative,
};
```

## Верификация (выполнить после написания)
```bash
cd /c/Users/noadmin/nospace/development/tLOS/core/kernel/tlos-claude-bridge
node -e "
const Q = require('./qdrant-client');
(async () => {
  console.log('avail:', await Q.isAvailable());
  console.log('addGlobal:', await Q.addGlobal('tLOS is a sovereign spatial OS built with SolidJS + Tauri', {source:'test'}));
  const r = await Q.searchAssociative('spatial OS SolidJS', 3);
  console.log('search results:', r.length, r[0]?.score?.toFixed(3));
  process.exit(0);
})();
"
```
Ожидаемый результат: avail: true, addGlobal: true, search results: 1 (или больше), score > 0.3
