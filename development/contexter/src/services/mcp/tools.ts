import type {
  SearchKnowledgeInputType,
  GetDocumentInputType,
  ListDocumentsInputType,
  SearchKnowledgeOutput,
  GetDocumentOutput,
  ListDocumentsOutput,
} from "./types"

/**
 * Perform semantic search over the knowledge base.
 *
 * Stub implementation — returns realistic shaped data.
 * Will be wired to Vectorize + D1 in a later stage.
 */
export function searchKnowledge(input: SearchKnowledgeInputType): SearchKnowledgeOutput {
  const limit = input.limit ?? 10

  const results = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
    id: `chunk-${i + 1}`,
    content: `Relevant content matching "${input.query}" — excerpt ${i + 1}.`,
    score: Number((0.95 - i * 0.1).toFixed(2)),
  }))

  return { results, total: results.length }
}

/**
 * Retrieve the full content of a single document by ID.
 *
 * Stub implementation — returns realistic shaped data.
 * Will be wired to D1 + R2 in a later stage.
 */
export function getDocument(input: GetDocumentInputType): GetDocumentOutput {
  return {
    id: input.documentId,
    name: `Document ${input.documentId}`,
    content: `Full content of document ${input.documentId}. This is a placeholder until the real storage layer is connected.`,
    metadata: {
      sourceFormat: "pdf",
      wordCount: 142,
      charCount: 890,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * List all documents in the knowledge base.
 *
 * Stub implementation — returns realistic shaped data.
 * Will be wired to D1 in a later stage.
 */
export function listDocuments(_input: ListDocumentsInputType): ListDocumentsOutput {
  const documents = [
    {
      id: "doc-1",
      name: "Company Handbook.pdf",
      status: "ready" as const,
      createdAt: "2025-01-01T10:00:00Z",
    },
    {
      id: "doc-2",
      name: "Q4 Report.docx",
      status: "ready" as const,
      createdAt: "2025-01-02T12:30:00Z",
    },
    {
      id: "doc-3",
      name: "Meeting Notes.md",
      status: "processing" as const,
      createdAt: "2025-01-03T08:15:00Z",
    },
  ]

  return { documents, total: documents.length }
}
