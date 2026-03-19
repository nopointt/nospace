import { vi } from "vitest";

// ── D1 ────────────────────────────────────────────────────────────────────────

export interface MockD1PreparedStatement {
  bind: ReturnType<typeof vi.fn>;
  first: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
}

export interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
  exec: ReturnType<typeof vi.fn>;
  dump: ReturnType<typeof vi.fn>;
}

function createMockD1PreparedStatement(
  overrides: Partial<Record<keyof MockD1PreparedStatement, unknown>> = {},
): MockD1PreparedStatement {
  const stmt: MockD1PreparedStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
    run: vi.fn().mockResolvedValue({ success: true, meta: {} }),
  };

  if (overrides.bind !== undefined) stmt.bind = overrides.bind as ReturnType<typeof vi.fn>;
  if (overrides.first !== undefined) stmt.first = overrides.first as ReturnType<typeof vi.fn>;
  if (overrides.all !== undefined) stmt.all = overrides.all as ReturnType<typeof vi.fn>;
  if (overrides.run !== undefined) stmt.run = overrides.run as ReturnType<typeof vi.fn>;

  return stmt;
}

export function createMockD1Database(
  stmtOverrides: Partial<Record<keyof MockD1PreparedStatement, unknown>> = {},
): MockD1Database {
  const stmt = createMockD1PreparedStatement(stmtOverrides);
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    batch: vi.fn().mockResolvedValue([{ results: [], success: true, meta: {} }]),
    exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
    dump: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  };
}

// ── R2 ────────────────────────────────────────────────────────────────────────

export interface MockR2Bucket {
  put: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  head: ReturnType<typeof vi.fn>;
  createMultipartUpload: ReturnType<typeof vi.fn>;
}

export function createMockR2Bucket(): MockR2Bucket {
  return {
    put: vi.fn().mockResolvedValue({
      key: "mock-key",
      version: "mock-version",
      size: 0,
      etag: "mock-etag",
      httpEtag: '"mock-etag"',
      checksums: {},
      uploaded: new Date(),
      httpMetadata: {},
      customMetadata: {},
    }),
    get: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ objects: [], truncated: false, cursor: undefined, delimitedPrefixes: [] }),
    head: vi.fn().mockResolvedValue(null),
    createMultipartUpload: vi.fn().mockResolvedValue({
      uploadId: "mock-upload-id",
      key: "mock-key",
    }),
  };
}

// ── KV ────────────────────────────────────────────────────────────────────────

export interface MockKVNamespace {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  getWithMetadata: ReturnType<typeof vi.fn>;
}

export function createMockKVNamespace(): MockKVNamespace {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [], list_complete: true, cursor: undefined }),
    getWithMetadata: vi.fn().mockResolvedValue({ value: null, metadata: null }),
  };
}

// ── Vectorize ─────────────────────────────────────────────────────────────────

export interface MockVectorizeIndex {
  query: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  getByIds: ReturnType<typeof vi.fn>;
  deleteByIds: ReturnType<typeof vi.fn>;
  describe: ReturnType<typeof vi.fn>;
}

export function createMockVectorize(): MockVectorizeIndex {
  return {
    query: vi.fn().mockResolvedValue({ matches: [], count: 0 }),
    upsert: vi.fn().mockResolvedValue({ mutationId: "mock-mutation-id", count: 0 }),
    getByIds: vi.fn().mockResolvedValue([]),
    deleteByIds: vi.fn().mockResolvedValue({ mutationId: "mock-mutation-id", count: 0 }),
    describe: vi.fn().mockResolvedValue({
      id: "mock-index-id",
      name: "harkly-kb",
      description: "",
      config: { dimensions: 1024, metric: "cosine" },
    }),
  };
}

// ── Workers AI ────────────────────────────────────────────────────────────────

export interface MockAi {
  run: ReturnType<typeof vi.fn>;
}

export function createMockAi(): MockAi {
  return {
    // Default: returns an empty text response matching @cf/meta/llama shape
    run: vi.fn().mockResolvedValue({ response: "mock-ai-response" }),
  };
}

// ── Queue (stub — not yet active in wrangler.toml) ───────────────────────────

export interface MockQueue {
  send: ReturnType<typeof vi.fn>;
  sendBatch: ReturnType<typeof vi.fn>;
}

export function createMockQueue(): MockQueue {
  return {
    send: vi.fn().mockResolvedValue(undefined),
    sendBatch: vi.fn().mockResolvedValue(undefined),
  };
}

// ── Complete Env factory ──────────────────────────────────────────────────────

export interface MockEnv {
  KB_DB: MockD1Database;
  AUTH_DB: MockD1Database;
  HARKLY_R2: MockR2Bucket;
  OAUTH_KV: MockKVNamespace;
  AUTH_KV: MockKVNamespace;
  SESSION_KV: MockKVNamespace;
  VECTORIZE_INDEX: MockVectorizeIndex;
  INGEST_QUEUE: MockQueue;
  AI: MockAi;
}

/**
 * Creates a fully-mocked Env object matching `src/global.d.ts`.
 *
 * Pass partial overrides to replace any binding with a custom mock:
 * ```ts
 * const env = createMockEnv({
 *   KB_DB: createMockD1Database({ first: vi.fn().mockResolvedValue({ id: '1' }) }),
 * });
 * ```
 */
export function createMockEnv(overrides: Partial<MockEnv> = {}): MockEnv {
  return {
    KB_DB: overrides.KB_DB ?? createMockD1Database(),
    AUTH_DB: overrides.AUTH_DB ?? createMockD1Database(),
    HARKLY_R2: overrides.HARKLY_R2 ?? createMockR2Bucket(),
    OAUTH_KV: overrides.OAUTH_KV ?? createMockKVNamespace(),
    AUTH_KV: overrides.AUTH_KV ?? createMockKVNamespace(),
    SESSION_KV: overrides.SESSION_KV ?? createMockKVNamespace(),
    VECTORIZE_INDEX: overrides.VECTORIZE_INDEX ?? createMockVectorize(),
    INGEST_QUEUE: overrides.INGEST_QUEUE ?? createMockQueue(),
    AI: overrides.AI ?? createMockAi(),
  };
}
