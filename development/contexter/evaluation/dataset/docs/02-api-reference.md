# Contexter API Reference

Base URL: `https://api.contexter.cc`

## Authentication

All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-api-token>
```

Obtain a token by registering: `POST /api/auth/register` with `{ "name": "Your Name" }`.

## Endpoints

### POST /api/query
Send a natural language query to your knowledge base.

**Request body:**
```json
{ "query": "What formats are supported?", "topK": 5 }
```

**Response:** JSON with `answer`, `sources`, `confidence`, `faithfulness` fields.

Rate limit: 60 queries per minute per user.

### POST /api/upload/presign
Get a presigned URL for uploading a file directly to R2 storage.

**Request body:**
```json
{ "fileName": "report.pdf", "mimeType": "application/pdf", "fileSize": 1048576 }
```

**Response:** `{ "uploadUrl": "...", "documentId": "...", "r2Key": "..." }`

### POST /api/upload/confirm
Confirm that the file has been uploaded to R2 and trigger pipeline processing.

**Request body:**
```json
{ "documentId": "...", "r2Key": "...", "fileName": "report.pdf", "mimeType": "application/pdf", "fileSize": 1048576 }
```

### GET /api/status/:documentId
Check the processing status of a document.

**Response:** Returns stages array with parse, chunk, embed, index status.

### GET /health
Health check endpoint. Returns service status for API, PostgreSQL, Redis, R2, and Groq.

### GET /health/circuits
Circuit breaker status for all external dependencies: Jina, Groq LLM, Groq Whisper, Docling.
