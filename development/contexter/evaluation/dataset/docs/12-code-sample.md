# Code Examples

## JavaScript: Upload a Document

```javascript
const API = "https://api.contexter.cc"
const TOKEN = "your-api-token"

// Step 1: Get presigned URL
const presign = await fetch(`${API}/api/upload/presign`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({
    fileName: "report.pdf",
    mimeType: "application/pdf",
    fileSize: file.size,
  }),
}).then(r => r.json())

// Step 2: Upload to R2
await fetch(presign.uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "application/pdf" },
  body: file,
})

// Step 3: Confirm
await fetch(`${API}/api/upload/confirm`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({
    documentId: presign.documentId,
    r2Key: presign.r2Key,
    fileName: "report.pdf",
    mimeType: "application/pdf",
    fileSize: file.size,
  }),
})
```

## Python: Query the Knowledge Base

```python
import requests

API = "https://api.contexter.cc"
TOKEN = "your-api-token"

response = requests.post(
    f"{API}/api/query",
    headers={"Authorization": f"Bearer {TOKEN}"},
    json={"query": "What formats does Contexter support?"},
)

data = response.json()
print(f"Answer: {data['answer']}")
print(f"Sources: {len(data['sources'])} passages")
print(f"Confidence: {data.get('confidence', 'N/A')}")
```

## cURL: Check Health

```bash
curl -s https://api.contexter.cc/health | jq .
curl -s https://api.contexter.cc/health/circuits | jq .
```
