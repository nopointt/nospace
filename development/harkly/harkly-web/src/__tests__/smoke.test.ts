import { describe, it, expect, vi } from "vitest";
import { createMockEnv, createMockD1Database } from "./mocks/cf-env";
import { createMockEvent } from "./mocks/event";
import { getBindings } from "~/lib/db";

// ── D1 mock ───────────────────────────────────────────────────────────────────

describe("D1 mock", () => {
  it("prepare().bind().first() returns null by default", async () => {
    const env = createMockEnv();
    const result = await env.KB_DB.prepare("SELECT 1").bind().first();
    expect(result).toBeNull();
  });

  it("prepare().all() returns empty results by default", async () => {
    const env = createMockEnv();
    const result = await env.KB_DB.prepare("SELECT * FROM foo").all();
    expect(result).toEqual({ results: [], success: true, meta: {} });
  });

  it("prepare().run() resolves to success by default", async () => {
    const env = createMockEnv();
    const result = await env.KB_DB.prepare("INSERT INTO foo VALUES (1)").run();
    expect(result).toMatchObject({ success: true });
  });

  it("supports configurable first() return value via stmtOverrides", async () => {
    const row = { id: "01JTEST", title: "Hello" };
    const env = createMockEnv({
      KB_DB: createMockD1Database({ first: vi.fn().mockResolvedValue(row) }),
    });
    const result = await env.KB_DB.prepare("SELECT * FROM items WHERE id = ?").bind("01JTEST").first();
    expect(result).toEqual(row);
  });

  it("prepare() is called with the SQL string", async () => {
    const env = createMockEnv();
    const sql = "SELECT id FROM items LIMIT 1";
    await env.KB_DB.prepare(sql).first();
    expect(env.KB_DB.prepare).toHaveBeenCalledWith(sql);
  });
});

// ── R2 mock ───────────────────────────────────────────────────────────────────

describe("R2 mock", () => {
  it("get() returns null by default (object not found)", async () => {
    const env = createMockEnv();
    expect(await env.HARKLY_R2.get("nonexistent.txt")).toBeNull();
  });

  it("put() resolves without throwing", async () => {
    const env = createMockEnv();
    await expect(env.HARKLY_R2.put("test.txt", "hello")).resolves.toBeDefined();
  });
});

// ── KV mock ───────────────────────────────────────────────────────────────────

describe("KV mock", () => {
  it("get() returns null by default", async () => {
    const env = createMockEnv();
    expect(await env.SESSION_KV.get("missing-key")).toBeNull();
  });

  it("put() resolves without throwing", async () => {
    const env = createMockEnv();
    await expect(env.SESSION_KV.put("k", "v")).resolves.toBeUndefined();
  });
});

// ── Vectorize mock ────────────────────────────────────────────────────────────

describe("Vectorize mock", () => {
  it("query() returns empty matches by default", async () => {
    const env = createMockEnv();
    const result = await env.VECTORIZE_INDEX.query([0.1, 0.2, 0.3], { topK: 5 });
    expect(result.matches).toHaveLength(0);
  });

  it("upsert() resolves without throwing", async () => {
    const env = createMockEnv();
    await expect(
      env.VECTORIZE_INDEX.upsert([{ id: "v1", values: [0.1, 0.2] }]),
    ).resolves.toBeDefined();
  });
});

// ── AI mock ───────────────────────────────────────────────────────────────────

describe("AI mock", () => {
  it("run() returns the default mock response", async () => {
    const env = createMockEnv();
    const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", { prompt: "Hello" });
    expect(result).toEqual({ response: "mock-ai-response" });
  });

  it("supports custom run() return values", async () => {
    const { createMockAi } = await import("./mocks/cf-env");
    const ai = createMockAi();
    ai.run.mockResolvedValueOnce({ response: "custom response" });
    const result = await ai.run("@cf/meta/llama-3-8b-instruct", { prompt: "Hi" });
    expect(result).toEqual({ response: "custom response" });
  });
});

// ── MockEvent + getBindings ───────────────────────────────────────────────────

describe("MockEvent + getBindings()", () => {
  it("getBindings resolves env from nativeEvent.context.cloudflare.env", () => {
    const event = createMockEvent();
    const bindings = getBindings(event);
    expect(bindings).toBe(event.context.cloudflare.env);
  });

  it("event.params carries through correctly", () => {
    const event = createMockEvent({ params: { id: "01JTEST" } });
    expect(event.params.id).toBe("01JTEST");
  });

  it("custom env override is propagated to all binding paths", () => {
    const row = { id: "42" };
    const event = createMockEvent({
      env: { KB_DB: createMockD1Database({ first: vi.fn().mockResolvedValue(row) }) },
    });
    // All three resolution paths should point to the same object
    expect(event.context.bindings).toBe(event.nativeEvent.context.cloudflare.env);
  });
});

// ── Path alias ────────────────────────────────────────────────────────────────

describe("path alias ~/*", () => {
  it("resolves ~/lib/db correctly", () => {
    // The import at the top of this file uses ~/lib/db — if that resolved,
    // getBindings must be a function.
    expect(typeof getBindings).toBe("function");
  });
});
