# MCP Integration Guide

Contexter exposes 12 MCP tools via Streamable HTTP (JSON-RPC on `/sse`).

## Connection

Add this MCP server to your AI tool:
```
URL: https://api.contexter.cc/sse?token=YOUR_API_TOKEN
Transport: Streamable HTTP
```

## Available Tools

### Knowledge Base Management
- `add_document` — Upload a document (text content or URL) to your knowledge base
- `list_documents` — List all documents with status, size, and chunk count
- `delete_document` — Remove a document and all its chunks
- `get_document_status` — Check processing status of a specific document

### Search & Query
- `search_knowledge` — Semantic search across your knowledge base (returns top-K relevant chunks)
- `ask_knowledge` — Full RAG query with LLM-generated answer, sources, and confidence score

### Share Management
- `create_share` — Create a share link for a document (read-only or read-write)
- `list_shares` — List all active share links
- `revoke_share` — Deactivate a share link

### Utility
- `get_formats` — List all supported file formats
- `get_usage` — Current storage usage, query count, and plan limits
- `get_health` — Service health status

## OAuth 2.1 + PKCE

For MCP clients that support OAuth, Contexter implements the full OAuth 2.1 flow with PKCE (S256 code challenge). This allows MCP clients to authenticate without exposing API tokens in URLs.

Authorization endpoint: `https://api.contexter.cc/api/oauth/authorize`
Token endpoint: `https://api.contexter.cc/api/oauth/token`
