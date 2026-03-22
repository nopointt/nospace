#!/usr/bin/env node
/**
 * Contexter MCP Bridge — stdio server for Claude Desktop.
 * Proxies MCP tool calls to the Contexter API.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const API_BASE = process.env.CONTEXTER_API_URL || "https://contexter.nopoint.workers.dev"

const server = new Server(
  { name: "contexter", version: "0.1.0" },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_knowledge",
      description: "Search the Contexter knowledge base using natural language. Returns relevant chunks with sources.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query in natural language" },
          topK: { type: "number", description: "Number of results (default 5, max 20)" },
        },
        required: ["query"],
      },
    },
    {
      name: "list_documents",
      description: "List all documents in the Contexter knowledge base with their processing status.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "get_document",
      description: "Get details about a specific document by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          documentId: { type: "string", description: "Document ID" },
        },
        required: ["documentId"],
      },
    },
    {
      name: "upload_text",
      description: "Upload text content directly to the knowledge base. Use this to add notes, snippets, or any text data.",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Text content to upload" },
          fileName: { type: "string", description: "Name for the content (e.g. 'meeting-notes.txt')" },
        },
        required: ["content", "fileName"],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case "search_knowledge": {
        const res = await fetch(`${API_BASE}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: args.query, topK: args.topK ?? 5 }),
        })
        const data = await res.json()

        if (data.error) {
          return { content: [{ type: "text", text: `Error: ${data.error}` }] }
        }

        let text = `**Answer:** ${data.answer}\n\n`
        if (data.sources?.length > 0) {
          text += `**Sources (${data.sources.length}):**\n`
          for (const src of data.sources) {
            text += `- [${src.documentId}] (score: ${src.score.toFixed(4)}, ${src.source}): ${src.content.slice(0, 200)}...\n`
          }
        }
        return { content: [{ type: "text", text }] }
      }

      case "list_documents": {
        const res = await fetch(`${API_BASE}/api/status`)
        const data = await res.json()

        if (!data.documents || data.documents.length === 0) {
          return { content: [{ type: "text", text: "No documents in knowledge base." }] }
        }

        let text = `**Documents (${data.total}):**\n`
        for (const doc of data.documents) {
          text += `- ${doc.fileName} (${doc.mimeType}, ${(doc.fileSize / 1024).toFixed(1)} KB) — ${doc.status} — ID: ${doc.documentId}\n`
        }
        return { content: [{ type: "text", text }] }
      }

      case "get_document": {
        const res = await fetch(`${API_BASE}/api/status/${args.documentId}`)
        if (!res.ok) {
          return { content: [{ type: "text", text: `Document not found: ${args.documentId}` }] }
        }
        const data = await res.json()
        const text = `**${data.fileName}**\n- Type: ${data.mimeType}\n- Size: ${(data.fileSize / 1024).toFixed(1)} KB\n- Status: ${data.status}\n- Chunks: ${data.chunks}\n- Created: ${data.createdAt}\n${data.error ? `- Error: ${data.error}` : ""}`
        return { content: [{ type: "text", text }] }
      }

      case "upload_text": {
        const blob = new Blob([args.content], { type: "text/plain" })
        const formData = new FormData()
        formData.append("file", blob, args.fileName)

        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        })
        const data = await res.json()

        if (data.error) {
          return { content: [{ type: "text", text: `Upload error: ${data.error}` }] }
        }

        const stages = data.pipeline?.map((s) => `${s.stage}: ${s.status}${s.durationMs ? ` (${s.durationMs}ms)` : ""}`).join(", ")
        return { content: [{ type: "text", text: `Uploaded "${data.fileName}" → ${data.status}\nPipeline: ${stages}` }] }
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] }
    }
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }] }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
