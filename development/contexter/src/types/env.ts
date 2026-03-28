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
  GROQ_LLM_MODEL: string
  DOCLING_URL: string
  BASE_URL: string
  ENVIRONMENT: string
  // F-024: Mistral OCR cloud fallback — opt-in only
  OCR_CLOUD_FALLBACK_ENABLED?: string
  MISTRAL_API_KEY?: string
  // F-012: DeepInfra fallback provider — optional
  DEEPINFRA_API_KEY?: string
  // F-015: model split — optional, defaults applied in LlmService
  GROQ_REWRITE_MODEL?: string
  GROQ_ANSWER_MODEL?: string
  // F-025: NLI sidecar
  NLI_SIDECAR_URL?: string
  NLI_ENABLED?: string
}
