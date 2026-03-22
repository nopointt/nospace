import { z } from "zod"

// --- Tool input schemas ---

export const SearchKnowledgeInput = z.object({
  query: z.string().min(1).describe("The search query string"),
  limit: z.number().int().min(1).max(50).default(10).optional().describe("Maximum number of results to return"),
})

export const GetDocumentInput = z.object({
  documentId: z.string().min(1).describe("Unique identifier of the document"),
})

export const ListDocumentsInput = z.object({})

// --- Tool input types ---

export type SearchKnowledgeInputType = z.infer<typeof SearchKnowledgeInput>
export type GetDocumentInputType = z.infer<typeof GetDocumentInput>
export type ListDocumentsInputType = z.infer<typeof ListDocumentsInput>

// --- Tool output types ---

export interface SearchResult {
  id: string
  content: string
  score: number
}

export interface SearchKnowledgeOutput {
  results: SearchResult[]
  total: number
}

export interface DocumentDetail {
  id: string
  name: string
  content: string
  metadata: Record<string, unknown>
}

export interface GetDocumentOutput {
  id: string
  name: string
  content: string
  metadata: Record<string, unknown>
}

export interface DocumentSummary {
  id: string
  name: string
  status: "pending" | "processing" | "ready" | "error"
  createdAt: string
}

export interface ListDocumentsOutput {
  documents: DocumentSummary[]
  total: number
}

// --- Tool descriptor ---

export interface ToolDescriptor {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

// --- Tool names ---

export const TOOL_NAMES = {
  SEARCH_KNOWLEDGE: "search_knowledge",
  GET_DOCUMENT: "get_document",
  LIST_DOCUMENTS: "list_documents",
} as const

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES]
