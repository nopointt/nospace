/**
 * Tests: src/lib/auth-guard.ts — requireAuth helper
 *
 * requireAuth reads event.context.userId and either returns it or
 * throws a 401 Response if absent.
 */
import { describe, it, expect } from "vitest";
import { createMockEvent } from "~/__tests__/mocks/event";
import { requireAuth } from "~/lib/auth-guard";

// ── requireAuth ───────────────────────────────────────────────────────────────

describe("requireAuth", () => {
  it("returns tenantId when userId is present in context", () => {
    const event = createMockEvent();
    (event.context as any).userId = "user-abc-123";

    const result = requireAuth(event as any);
    expect(result).toBe("user-abc-123");
  });

  it("throws a 401 Response when userId is absent", async () => {
    const event = createMockEvent();
    // No userId set

    let thrown: unknown;
    try {
      requireAuth(event as any);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    const response = thrown as Response;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("throws a 401 Response when userId is null", async () => {
    const event = createMockEvent();
    (event.context as any).userId = null;

    let thrown: unknown;
    try {
      requireAuth(event as any);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    const response = thrown as Response;
    expect(response.status).toBe(401);
  });

  it("throws a 401 Response when userId is empty string", async () => {
    const event = createMockEvent();
    (event.context as any).userId = "";

    let thrown: unknown;
    try {
      requireAuth(event as any);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(Response);
    const response = thrown as Response;
    expect(response.status).toBe(401);
  });

  it("returns the exact userId string from context", () => {
    const event = createMockEvent();
    const tenantId = "tenant-prod-01JXYZ";
    (event.context as any).userId = tenantId;

    const result = requireAuth(event as any);
    expect(result).toBe(tenantId);
  });

  it("error message is in Russian (Необходима авторизация)", async () => {
    const event = createMockEvent();

    let thrown: unknown;
    try {
      requireAuth(event as any);
    } catch (e) {
      thrown = e;
    }

    const response = thrown as Response;
    const body = await response.json();
    expect(body.error).toBe("Необходима авторизация");
  });
});
