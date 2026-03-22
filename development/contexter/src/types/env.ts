export interface Env {
  DB: D1Database
  STORAGE: R2Bucket
  KV: KVNamespace
  VECTOR_INDEX: VectorizeIndex
  AI: Ai

  JINA_API_KEY: string
  GROQ_API_KEY: string
  JINA_API_URL: string
  GROQ_API_URL: string
  ENVIRONMENT: string
}
