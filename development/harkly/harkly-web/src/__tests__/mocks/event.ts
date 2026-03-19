import { vi } from "vitest";
import { createMockEnv, type MockEnv } from "./cf-env";

// ── Mock Request factory ──────────────────────────────────────────────────────

export interface MockRequestOptions {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
}

export function createMockRequest(options: MockRequestOptions = {}): Request {
  const {
    method = "GET",
    url = "https://harkly.local/",
    headers = {},
    body = null,
  } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: method !== "GET" && method !== "HEAD" ? body : null,
  });
}

// ── ExecutionContext stub ─────────────────────────────────────────────────────

export interface MockExecutionContext {
  waitUntil: ReturnType<typeof vi.fn>;
  passThroughOnException: ReturnType<typeof vi.fn>;
}

export function createMockExecutionContext(): MockExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

// ── Mock Event ────────────────────────────────────────────────────────────────

/**
 * The shape SolidStart exposes to server functions / API routes.
 * Mirrors how `getBindings()` in `src/lib/db.ts` resolves the env:
 *   event.context?.bindings
 *   ?? event.context?.cloudflare?.env
 *   ?? event.nativeEvent?.context?.cloudflare?.env
 */
export interface MockEvent {
  request: Request;
  params: Record<string, string>;
  locals: Record<string, unknown>;
  context: {
    bindings: MockEnv;
    cloudflare: {
      env: MockEnv;
      context: MockExecutionContext;
    };
  };
  nativeEvent: {
    context: {
      cloudflare: {
        env: MockEnv;
        context: MockExecutionContext;
      };
    };
  };
}

export interface MockEventOverrides {
  env?: Partial<MockEnv>;
  request?: Partial<MockRequestOptions>;
  params?: Record<string, string>;
  locals?: Record<string, unknown>;
}

/**
 * Creates a fully-mocked SolidStart API event.
 *
 * The same `MockEnv` instance is placed in all three locations that
 * `getBindings()` checks, so tests work regardless of which path is used.
 *
 * ```ts
 * const event = createMockEvent({
 *   env: { KB_DB: createMockD1Database({ first: vi.fn().mockResolvedValue({ id: '1' }) }) },
 *   params: { id: '01JTEST' },
 * });
 * ```
 */
export function createMockEvent(overrides: MockEventOverrides = {}): MockEvent {
  const env = createMockEnv(overrides.env ?? {});
  const execCtx = createMockExecutionContext();
  const request = createMockRequest(overrides.request ?? {});

  const cloudflare = { env, context: execCtx };

  return {
    request,
    params: overrides.params ?? {},
    locals: overrides.locals ?? {},
    context: {
      bindings: env,
      cloudflare,
    },
    nativeEvent: {
      context: { cloudflare },
    },
  };
}
