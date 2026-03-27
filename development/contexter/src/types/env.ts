import type { S3Client } from "@aws-sdk/client-s3"
import type Redis from "ioredis"

export interface Env {
  storage: S3Client
  storageBucket: string
  redis: Redis

  JINA_API_KEY: string
  GROQ_API_KEY: string
  JINA_API_URL: string
  GROQ_API_URL: string
  GROQ_LLM_MODEL: string
  DOCLING_URL: string
  BASE_URL: string
  ENVIRONMENT: string
}
