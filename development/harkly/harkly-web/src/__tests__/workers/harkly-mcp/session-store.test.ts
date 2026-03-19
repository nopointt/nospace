/**
 * Tests for workers/harkly-mcp/src/lib/session-store.ts
 *
 * Covers:
 * - KvSessionStore.get: returns session when KV has it
 * - KvSessionStore.get: returns null for missing key
 * - KvSessionStore.get: returns null on corrupt JSON
 * - KvSessionStore.set: calls kv.put with correct key + JSON + TTL
 * - KvSessionStore.set: uses defaultTtlSeconds when no override
 * - KvSessionStore.set: uses custom ttlSeconds when provided
 * - KvSessionStore.set: stamps lastAccessed on the stored object
 * - KvSessionStore.delete: calls kv.delete with correct key
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { KvSessionStore } from "../../../../workers/harkly-mcp/src/lib/session-store";
import { createMockKVNamespace } from "../../mocks/cf-env";
import type { MockKVNamespace } from "../../mocks/cf-env";

interface McpSession {
  tenantId: string;
  clientId: string;
  subject: string;
  lastAccessed: number;
}

function makeSession(overrides: Partial<McpSession> = {}): McpSession {
  return {
    tenantId: "tenant-abc",
    clientId: "client-xyz",
    subject: "user@example.com",
    lastAccessed: 0,
    ...overrides,
  };
}

describe("KvSessionStore.get", () => {
  it("returns parsed session when KV has the key", async () => {
    const session = makeSession({ lastAccessed: 1000 });
    const kv = createMockKVNamespace();
    (kv.get as ReturnType<typeof vi.fn>).mockResolvedValue(JSON.stringify(session));

    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const result = await store.get("sess-1");

    expect(result).toEqual(session);
    expect(kv.get).toHaveBeenCalledWith("mcp:session:sess-1");
  });

  it("returns null when key does not exist in KV", async () => {
    const kv = createMockKVNamespace();
    // default mock already returns null
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const result = await store.get("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when KV value is corrupt JSON", async () => {
    const kv = createMockKVNamespace();
    (kv.get as ReturnType<typeof vi.fn>).mockResolvedValue("{not valid json{{");
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const result = await store.get("bad-session");
    expect(result).toBeNull();
  });

  it("returns null when KV returns empty string", async () => {
    const kv = createMockKVNamespace();
    (kv.get as ReturnType<typeof vi.fn>).mockResolvedValue("");
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const result = await store.get("empty-string");
    // empty string is falsy → returns null
    expect(result).toBeNull();
  });

  it("keys are namespaced with mcp:session: prefix", async () => {
    const kv = createMockKVNamespace();
    (kv.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    await store.get("my-id");
    expect(kv.get).toHaveBeenCalledWith("mcp:session:my-id");
  });
});

describe("KvSessionStore.set", () => {
  it("stores session as JSON with correct key and default TTL", async () => {
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace, 3600);
    const session = makeSession();

    await store.set("sess-2", session);

    expect(kv.put).toHaveBeenCalledTimes(1);
    const [key, value, opts] = (kv.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(key).toBe("mcp:session:sess-2");
    expect(opts).toEqual({ expirationTtl: 3600 });

    const stored = JSON.parse(value);
    expect(stored.tenantId).toBe("tenant-abc");
    expect(stored.clientId).toBe("client-xyz");
    expect(stored.subject).toBe("user@example.com");
  });

  it("stamps lastAccessed as current timestamp on set", async () => {
    const before = Date.now();
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const session = makeSession({ lastAccessed: 0 });

    await store.set("sess-ts", session);
    const after = Date.now();

    const [, value] = (kv.put as ReturnType<typeof vi.fn>).mock.calls[0];
    const stored = JSON.parse(value);
    expect(stored.lastAccessed).toBeGreaterThanOrEqual(before);
    expect(stored.lastAccessed).toBeLessThanOrEqual(after);
  });

  it("uses provided ttlSeconds override instead of default", async () => {
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace, 3600);
    const session = makeSession();

    await store.set("sess-custom-ttl", session, 900);

    const [, , opts] = (kv.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.expirationTtl).toBe(900);
  });

  it("does not mutate the original session object (immutability)", async () => {
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const session = makeSession({ lastAccessed: 42 });
    const originalLastAccessed = session.lastAccessed;

    await store.set("sess-immutable", session);

    // The original session's lastAccessed should not be changed by set()
    expect(session.lastAccessed).toBe(originalLastAccessed);
  });

  it("constructor default TTL is 3600 seconds", async () => {
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace); // no TTL arg
    await store.set("sess-default", makeSession());

    const [, , opts] = (kv.put as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.expirationTtl).toBe(3600);
  });
});

describe("KvSessionStore.delete", () => {
  it("calls kv.delete with the correct namespaced key", async () => {
    const kv = createMockKVNamespace();
    const store = new KvSessionStore(kv as unknown as KVNamespace);

    await store.delete("sess-del");

    expect(kv.delete).toHaveBeenCalledTimes(1);
    expect(kv.delete).toHaveBeenCalledWith("mcp:session:sess-del");
  });

  it("resolves without throwing even if KV returns error-like undefined", async () => {
    const kv = createMockKVNamespace();
    (kv.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const store = new KvSessionStore(kv as unknown as KVNamespace);
    await expect(store.delete("sess-x")).resolves.toBeUndefined();
  });
});

describe("KvSessionStore — round-trip", () => {
  it("set then get returns the stored session data", async () => {
    // Use a simple in-memory map to simulate KV
    const kvStore: Map<string, string> = new Map();
    const kv = createMockKVNamespace();
    (kv.put as ReturnType<typeof vi.fn>).mockImplementation((key: string, value: string) => {
      kvStore.set(key, value);
      return Promise.resolve(undefined);
    });
    (kv.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      return Promise.resolve(kvStore.get(key) ?? null);
    });

    const store = new KvSessionStore(kv as unknown as KVNamespace);
    const session = makeSession({ tenantId: "round-trip-tenant" });

    await store.set("rt-sess", session);
    const retrieved = await store.get("rt-sess");

    expect(retrieved).not.toBeNull();
    expect(retrieved!.tenantId).toBe("round-trip-tenant");
    expect(retrieved!.clientId).toBe("client-xyz");
    expect(retrieved!.subject).toBe("user@example.com");
    expect(typeof retrieved!.lastAccessed).toBe("number");
  });
});
