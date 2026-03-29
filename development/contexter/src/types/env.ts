import type { S3Client } from "@aws-sdk/client-s3"
import type Redis from "ioredis"

export interface Env {
  storage: S3Client
  storageBucket: string
  redis: Redis

  JINA_API_KEY: string
  GROQ_API_KEY: string
  JINA_API_URL: string
  /** Used for Whisper transcription only. Do not use for LLM chat — use GROQ_LLM_URL. */
  GROQ_API_URL: string
  /** Used for LLM chat completions (contextual prefix, RAG answer). Base URL without /chat/completions. */
  GROQ_LLM_URL: string
  GROQ_LLM_MODEL: string
  DOCLING_URL: string
  BASE_URL: string
  ENVIRONMENT: string
  // F-024: Mistral OCR cloud fallback — opt-in only
  OCR_CLOUD_FALLBACK_ENABLED?: string
  MISTRAL_API_KEY?: string
  // F-012: LLM provider chain — Groq (primary) → NIM (fallback 1) → DeepInfra (fallback 2)
  NIM_API_KEY?: string
  NIM_BASE_URL?: string       // default: https://integrate.api.nvidia.com/v1
  NIM_MODEL?: string           // default: meta/llama-3.1-70b-instruct
  DEEPINFRA_API_KEY?: string
  DEEPINFRA_MODEL?: string     // default: same as GROQ_ANSWER_MODEL
  // F-015: model split — optional, defaults applied in LlmService
  GROQ_REWRITE_MODEL?: string
  GROQ_ANSWER_MODEL?: string
  // F-025: NLI sidecar
  NLI_SIDECAR_URL?: string
  NLI_ENABLED?: string
  // Rate limit whitelist — comma-separated IPs that bypass all rate limits (for E2E tests, monitoring)
  RATE_LIMIT_WHITELIST_IPS?: string
}
