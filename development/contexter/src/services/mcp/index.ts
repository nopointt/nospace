import {
  SearchKnowledgeInput,
  GetDocumentInput,
  ListDocumentsInput,
  TOOL_NAMES,
  type ToolName,
  type ToolDescriptor,
  type SearchKnowledgeOutput,
  type GetDocumentOutput,
  type ListDocumentsOutput,
} from "./types"
import { searchKnowledge, getDocument, listDocuments } from "./tools"

export type { ToolDescriptor, ToolName } from "./types"
export type { SearchKnowledgeOutput, GetDocumentOutput, ListDocumentsOutput } from "./types"
export { TOOL_NAMES } from "./types"

type ToolOutput = SearchKnowledgeOutput | GetDocumentOutput | ListDocumentsOutput

/**
 * MCP service — registers tools and routes tool calls.
 *
 * Auth integration (better-auth 1.5) is deferred — this scaffold
 * exposes the full tool surface without any auth checks.
 */
export class McpService {
  private readonly tools: Map<ToolName, ToolDescriptor>

  constructor() {
    this.tools = new Map()
    this.registerTools()
  }

  private registerTools(): void {
    this.tools.set(TOOL_NAMES.SEARCH_KNOWLEDGE, {
      name: TOOL_NAMES.SEARCH_KNOWLEDGE,
      description: "Perform semantic search over the knowledge base and return ranked results.",
      inputSchema: SearchKnowledgeInput.toJSONSchema(),
    })

    this.tools.set(TOOL_NAMES.GET_DOCUMENT, {
      name: TOOL_NAMES.GET_DOCUMENT,
      description: "Retrieve the full content and metadata of a document by its ID.",
      inputSchema: GetDocumentInput.toJSONSchema(),
    })

    this.tools.set(TOOL_NAMES.LIST_DOCUMENTS, {
      name: TOOL_NAMES.LIST_DOCUMENTS,
      description: "List all documents in the knowledge base with their current status.",
      inputSchema: ListDocumentsInput.toJSONSchema(),
    })
  }

  /** Return all registered tool descriptors. */
  getTools(): ToolDescriptor[] {
    return Array.from(this.tools.values())
  }

  /** Check whether a tool with the given name is registered. */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName as ToolName)
  }

  /**
   * Route a tool call to the appropriate handler and return the result.
   *
   * Throws if the tool name is unknown.
   * Input is validated via Zod before being passed to the handler.
   */
  handleToolCall(toolName: string, input: unknown): ToolOutput {
    switch (toolName) {
      case TOOL_NAMES.SEARCH_KNOWLEDGE: {
        const parsed = SearchKnowledgeInput.parse(input)
        return searchKnowledge(parsed)
      }

      case TOOL_NAMES.GET_DOCUMENT: {
        const parsed = GetDocumentInput.parse(input)
        return getDocument(parsed)
      }

      case TOOL_NAMES.LIST_DOCUMENTS: {
        const parsed = ListDocumentsInput.parse(input)
        return listDocuments(parsed)
      }

      default:
        throw new Error(`Unknown MCP tool: ${toolName}`)
    }
  }
}
