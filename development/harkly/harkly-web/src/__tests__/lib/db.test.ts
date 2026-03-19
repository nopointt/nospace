/**
 * Tests: src/lib/db.ts — getBindings helper
 *
 * getBindings resolves CF bindings from three fallback paths:
 *   1. event.context.bindings
 *   2. event.context.cloudflare.env
 *   3. event.nativeEvent.context.cloudflare.env
 */
import { describe, it, expect } from "vitest";
import { createMockEnv } from "~/__tests__/mocks/cf-env";
import { getBindings } from "~/lib/db";

// ── getBindings ───────────────────────────────────────────────────────────────

describe("getBindings", () => {
  it("extracts bindings from event.context.bindings (primary path)", () => {
    const env = createMockEnv();
    const event = {
      context: {
        bindings: env,
        cloudflare: { env: createMockEnv() },
      },
      nativeEvent: {
        context: {
          cloudflare: { env: createMockEnv() },
        },
      },
    };

    const result = getBindings(event as any);
    // Should return the primary path binding — same reference
    expect(result).toBe(env);
  });

  it("falls back to event.context.cloudflare.env when bindings is absent", () => {
    const env = createMockEnv();
    const event = {
      context: {
        // no bindings property
        cloudflare: { env },
      },
      nativeEvent: {
        context: {
          cloudflare: { env: createMockEnv() },
        },
      },
    };

    const result = getBindings(event as any);
    expect(result).toBe(env);
  });

  it("falls back to event.nativeEvent.context.cloudflare.env as last resort", () => {
    const env = createMockEnv();
    const event = {
      context: {
        // no bindings, no cloudflare
      },
      nativeEvent: {
        context: {
          cloudflare: { env },
        },
      },
    };

    const result = getBindings(event as any);
    expect(result).toBe(env);
  });

  it("throws an error when no bindings path is available", () => {
    const event = {
      context: {},
      nativeEvent: { context: {} },
    };

    expect(() => getBindings(event as any)).toThrow(
      "CF bindings not available",
    );
  });

  it("throws when event.context is undefined", () => {
    const event = { context: undefined, nativeEvent: { context: {} } };

    expect(() => getBindings(event as any)).toThrow();
  });

  it("returned binding has the expected CF binding keys", () => {
    const env = createMockEnv();
    const event = {
      context: { bindings: env },
      nativeEvent: { context: { cloudflare: { env: createMockEnv() } } },
    };

    const result = getBindings(event as any);
    expect(result).toHaveProperty("KB_DB");
    expect(result).toHaveProperty("AUTH_DB");
    expect(result).toHaveProperty("HARKLY_R2");
    expect(result).toHaveProperty("INGEST_QUEUE");
  });
});
