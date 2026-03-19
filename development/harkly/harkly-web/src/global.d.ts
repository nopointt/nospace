/// <reference types="@cloudflare/workers-types" />

// Env type matching wrangler.toml bindings
interface Env {
  KB_DB: D1Database;
  AUTH_DB: D1Database;
  HARKLY_R2: R2Bucket;
  OAUTH_KV: KVNamespace;
  AUTH_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  VECTORIZE_INDEX: VectorizeIndex;
  INGEST_QUEUE: Queue;
  AI: Ai;
}

// Extend SolidStart event context with CF bindings
declare module "@solidjs/start/server" {
  interface RequestEventLocals {
    bindings: Env;
  }
}

// Cloudflare Pages event context
interface CfPagesEventContext {
  cloudflare: {
    env: Env;
    context: ExecutionContext;
  };
}
