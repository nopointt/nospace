import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import type { Env } from "../types/env"
import { McpService } from "../services/mcp"

export const mcp = new Hono<{ Bindings: Env }>()

const service = new McpService()

// POST /mcp — execute a tool call
const ToolCallSchema = z.object({
  tool: z.string().min(1),
  input: z.record(z.string(), z.unknown()).optional().default({}),
})

mcp.post("/", zValidator("json", ToolCallSchema), async (c) => {
  const { tool, input } = c.req.valid("json")

  if (!service.hasTool(tool)) {
    return c.json({ error: `Unknown tool: ${tool}` }, 404)
  }

  try {
    const result = service.handleToolCall(tool, input)
    return c.json({ tool, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed"
    return c.json({ error: message }, 422)
  }
})

// GET /mcp/tools — list available tools with their schemas
mcp.get("/tools", (c) => {
  const tools = service.getTools()
  return c.json({ tools, total: tools.length })
})
