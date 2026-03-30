export const API_BASE = import.meta.env.VITE_API_URL || "https://api.contexter.cc"

interface ApiOptions {
  method?: string
  body?: FormData | string
  headers?: Record<string, string>
  token?: string
}

async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...opts.headers }

  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`
  }

  if (typeof opts.body === "string") {
    headers["Content-Type"] = "application/json"
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body,
    credentials: "include", // send better-auth session cookie cross-origin
  })

  if (res.status === 401) {
    // Token expired or invalid — clear auth and reload
    localStorage.removeItem("contexter_auth")
    window.location.href = "/"
    throw new Error("Сессия истекла — войдите снова")
  }

  if (!res.ok) {
    const text = await res.text()
    let message = text
    try { const json = JSON.parse(text); message = json.error || json.message || text } catch {}
    throw new Error(message || `Error ${res.status}`)
  }

  return res.json()
}

export function register(name?: string, email?: string) {
  return api<{ userId: string; apiToken: string; mcpUrl: string }>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email }),
    },
  )
}

export function uploadFile(file: File, token: string) {
  const form = new FormData()
  form.append("file", file)
  return api<{ documentId: string; status: string }>(
    "/api/upload",
    { method: "POST", body: form, token },
  )
}

export function uploadText(text: string, token: string) {
  return api<{ documentId: string; status: string }>(
    "/api/upload",
    {
      method: "POST",
      body: JSON.stringify({ text }),
      token,
    },
  )
}

export async function getDocumentStatus(documentId: string, token: string) {
  const raw = await api<{
    documentId: string
    fileName: string
    mimeType: string
    fileSize: number
    status: string
    error: string | null
    stages: { type: string; status: string; progress: number; error_message?: string }[]
    chunks?: number
    createdAt: string
    updatedAt?: string
  }>(`/api/status/${documentId}`, { token })

  return {
    id: raw.documentId,
    name: raw.fileName,
    mime_type: raw.mimeType,
    size: raw.fileSize,
    status: raw.status,
    stages: raw.stages,
    created_at: raw.createdAt,
  }
}

export async function listDocuments(token: string) {
  const raw = await api<{
    documents: {
      documentId: string
      fileName: string
      mimeType: string
      fileSize: number
      status: string
      chunks?: number
      createdAt: string
    }[]
    total: number
  }>("/api/status", { token })

  return {
    documents: raw.documents.map((d) => ({
      id: d.documentId,
      name: d.fileName,
      mime_type: d.mimeType,
      size: d.fileSize,
      status: d.status,
      chunk_count: d.chunks ?? 0,
      created_at: d.createdAt,
    })),
    totalChunks: raw.documents.reduce((sum, d) => sum + (d.chunks ?? 0), 0),
  }
}

export async function query(q: string, token: string) {
  const raw = await api<{
    answer: string
    sources: {
      documentId?: string
      document_name?: string
      content: string
      score: number
      source?: string
    }[]
    queryVariants?: string[]
    query_variants?: string[]
    usage?: { embeddingTokens: number; llmPromptTokens: number; llmCompletionTokens: number }
    token_usage?: { input: number; output: number }
  }>("/api/query", {
    method: "POST",
    body: JSON.stringify({ query: q }),
    token,
  })

  return {
    answer: raw.answer,
    sources: raw.sources.map((s) => ({
      content: s.content,
      document_name: s.document_name || s.documentId || "unknown",
      score: s.score,
    })),
    query_variants: raw.query_variants ?? raw.queryVariants,
    token_usage: raw.token_usage ?? (raw.usage
      ? { input: raw.usage.llmPromptTokens, output: raw.usage.llmCompletionTokens }
      : undefined),
  }
}

export async function getDocumentContent(documentId: string, token: string) {
  const raw = await api<{
    documentId: string
    fileName: string
    mimeType: string
    fileSize: number
    status: string
    createdAt: string
    chunkCount: number
    chunks: { index: number; content: string; tokenCount: number | null }[]
  }>(`/api/documents/${documentId}/content`, { token })

  return {
    id: raw.documentId,
    name: raw.fileName ?? "unknown",
    mime_type: raw.mimeType ?? "application/octet-stream",
    size: raw.fileSize ?? 0,
    status: raw.status ?? "unknown",
    created_at: raw.createdAt ?? new Date().toISOString(),
    chunkCount: raw.chunkCount ?? 0,
    chunks: raw.chunks ?? [],
  }
}

export function createShare(
  token: string,
  scope: "all" | string[] = "all",
  permission: "read" | "read_write" = "read",
) {
  return api<{ shareId: string; shareToken: string; shareUrl: string }>(
    "/api/auth/share",
    {
      method: "POST",
      body: JSON.stringify({ scope, permission }),
      token,
    },
  )
}

export function listShares(token: string) {
  return api<{ shares: { id: string; share_token: string; scope: string; permission: string; created_at: string }[] }>(
    "/api/auth/shares",
    { token },
  )
}

export function revokeShare(shareId: string, token: string) {
  return api<{ success: boolean }>(
    `/api/auth/shares/${shareId}`,
    { method: "DELETE", token },
  )
}

export function deleteDocument(documentId: string, token: string) {
  return api<{ success: boolean }>(
    `/api/status/${documentId}`,
    { method: "DELETE", token },
  )
}

export function presignUpload(
  fileName: string,
  mimeType: string,
  fileSize: number,
  token: string,
) {
  return api<{ uploadUrl: string; documentId: string; r2Key: string; expiresIn: number }>(
    "/api/upload/presign",
    { method: "POST", body: JSON.stringify({ fileName, mimeType, fileSize }), token },
  )
}

export function confirmUpload(
  data: {
    documentId: string
    r2Key: string
    fileName: string
    mimeType: string
    fileSize: number
  },
  token: string,
) {
  return api<{ documentId: string; status: string }>(
    "/api/upload/confirm",
    { method: "POST", body: JSON.stringify(data), token },
  )
}

export function uploadToR2(
  url: string,
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error("Network error during upload"))
    xhr.send(file)
  })
}
