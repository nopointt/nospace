/**
 * Tests: GET /api/debug
 * Route: src/routes/api/debug.ts
 *
 * SECURITY BUG: This endpoint exposes environment key names including
 * binding presence indicators. It should not be accessible in production.
 * Tests document the current behavior, including the exposure.
 */
import { describe, it, expect, vi } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";

// No module mocks needed — debug.ts does not import ~/lib/db or ~/lib/auth-guard

import { GET } from "~/routes/api/debug";

// ── GET /api/debug ────────────────────────────────────────────────────────────

describe("GET /api/debug", () => {
  it("returns 200 with environment diagnostic keys", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
  });

  it("returns contextKeys from event.context", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    // event.context has { bindings, cloudflare }
    expect(body.contextKeys).toBeInstanceOf(Array);
    expect(body.contextKeys).toContain("bindings");
  });

  it("returns nativeContextKeys from event.nativeEvent.context", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.nativeContextKeys).toBeInstanceOf(Array);
    expect(body.nativeContextKeys).toContain("cloudflare");
  });

  it("reports hasCloudflare=true when cloudflare context is present", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.hasCloudflare).toBe(true);
  });

  it("reports cloudflareKeys as an array when cloudflare is present", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.cloudflareKeys).toBeInstanceOf(Array);
    expect(body.cloudflareKeys).toContain("env");
  });

  it("reports hasEnv=true when env is present in cloudflare context", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.hasEnv).toBe(true);
  });

  it("documents security bug — exposes env binding names in production", async () => {
    // This is the security gap: envKeys reveals what bindings are configured.
    // In production this leaks infrastructure details (DB, R2, KV, etc.).
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    // envKeys is exposed — this should NOT be accessible in production
    expect(body.envKeys).toBeInstanceOf(Array);
    expect(body.envKeys).toContain("KB_DB");
    expect(body.envKeys).toContain("AUTH_DB");
    expect(body.envKeys).toContain("HARKLY_R2");
  });

  it("reports hasAuthDb and hasKbDb correctly based on bindings", async () => {
    const event = createMockEvent();
    const response = await GET(event as any);

    const body = await response.json();
    expect(body.hasAuthDb).toBe(true);
    expect(body.hasKbDb).toBe(true);
  });

  it("requires no authentication — accessible without session token", async () => {
    // No userId in context — endpoint is fully public, another security concern
    const event = createMockEvent();
    // Intentionally no userId
    const response = await GET(event as any);

    expect(response.status).toBe(200);
  });
});
