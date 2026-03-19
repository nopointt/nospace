/**
 * Shared test helpers for API route tests.
 *
 * Strategy:
 * - Mock ~/lib/db so createKbDb returns a fully-controlled mock Drizzle instance.
 * - Mock ~/lib/auth-guard so requireAuth returns a fixed tenantId or throws 401.
 * - Provide createMockDb() factory returning a chainable query-builder mock.
 */
import { vi } from "vitest";

// ── Chainable Drizzle mock ────────────────────────────────────────────────────

export type MockQueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
};

/**
 * Creates a chainable Drizzle ORM mock.
 * Every method returns `this` by default except terminal methods:
 *   - all()  → resolves []
 *   - get()  → resolves undefined
 *   - run()  → resolves { rowsAffected: 1 }
 * Array-destructuring `const [row] = await ...limit(1)` works because
 * limit() returns the builder, and callers await the builder itself — but
 * Drizzle executes on `.all()` / `.get()`. In the routes:
 *   const [schema] = await db.select().from(...).where(...).limit(1);
 * This means the promise resolves from `.limit(1)` — we make the whole
 * chain thenable so awaiting any step gives the terminal value.
 *
 * Simplest approach: make every method return the same mock object which
 * is also a thenable resolving to [].
 */
export function createMockDb(overrides: Partial<MockQueryBuilder> = {}): MockQueryBuilder & PromiseLike<any[]> {
  // Terminal values — tests override these per-scenario
  let resolveValue: any = [];

  const mock: any = {};

  const chainMethods = ["select", "insert", "update", "delete", "from", "where", "orderBy", "limit", "values", "set", "returning"];
  for (const m of chainMethods) {
    mock[m] = overrides[m as keyof MockQueryBuilder] ?? vi.fn().mockReturnValue(mock);
  }

  // Terminal methods
  mock.all = overrides.all ?? vi.fn().mockImplementation(() => Promise.resolve(resolveValue));
  mock.get = overrides.get ?? vi.fn().mockImplementation(() => Promise.resolve(resolveValue[0] ?? undefined));
  mock.run = overrides.run ?? vi.fn().mockImplementation(() => Promise.resolve({ rowsAffected: 1 }));

  // Make the whole mock thenable so `const [x] = await db.select()...limit(1)`
  // resolves to the current resolveValue.
  mock.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve(resolveValue).then(onfulfilled, onrejected);

  // Helper for tests to change the resolved value
  mock._resolveWith = (val: any) => {
    resolveValue = val;
    mock.all.mockResolvedValue(val);
    mock.get.mockResolvedValue(Array.isArray(val) ? val[0] : val);
    mock.then = (onfulfilled: any, onrejected: any) =>
      Promise.resolve(val).then(onfulfilled, onrejected);
  };

  return mock;
}

// ── Auth event helpers ────────────────────────────────────────────────────────

export const TEST_TENANT_ID = "tenant-test-01";

/**
 * Returns a minimal event context that satisfies requireAuth.
 * Merge into createMockEvent's `locals` or pass as part of the event override.
 * requireAuth reads `event.context.userId`.
 */
export function authContext(tenantId = TEST_TENANT_ID) {
  return { userId: tenantId };
}
