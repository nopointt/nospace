/**
 * Tests for workers/harkly-mcp/src/handlers/default.ts
 *
 * The defaultHandler uses:
 * - env.OAUTH_PROVIDER.parseAuthRequest()
 * - getAuth(env.AUTH_DB).api.getSession()
 * - renderConsentPage / renderLoginPage (HTML renderers)
 *
 * We mock better-auth, workers-oauth-provider, and the UI renderers
 * to keep tests isolated from those dependencies.
 *
 * Covers:
 * - GET /authorize without session → redirect to /login
 * - GET /authorize with session → render consent page (200 HTML)
 * - GET /authorize OAUTH_PROVIDER throws → 500 JSON error
 * - GET /login → render login page (200 HTML)
 * - GET /login with next param → next is passed through
 * - Unknown route → 404
 * - Non-GET /login → 404
 * - POST /authorize/confirm deny → redirect with error=access_denied
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks (must be hoisted before imports) ─────────────────────────────

vi.mock("../../../../workers/harkly-mcp/src/lib/auth", () => ({
  getAuth: vi.fn(),
}));

vi.mock("../../../../workers/harkly-mcp/src/handlers/consent-ui", () => ({
  renderConsentPage: vi.fn().mockReturnValue("<html>consent</html>"),
}));

vi.mock("../../../../workers/harkly-mcp/src/handlers/login-ui", () => ({
  renderLoginPage: vi.fn().mockReturnValue("<html>login</html>"),
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { defaultHandler } from "../../../../workers/harkly-mcp/src/handlers/default";
import { getAuth } from "../../../../workers/harkly-mcp/src/lib/auth";
import { renderConsentPage } from "../../../../workers/harkly-mcp/src/handlers/consent-ui";
import { renderLoginPage } from "../../../../workers/harkly-mcp/src/handlers/login-ui";
import { createMockD1Database } from "../../mocks/cf-env";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface MockOAuthProvider {
  parseAuthRequest: ReturnType<typeof vi.fn>;
  completeAuthorization: ReturnType<typeof vi.fn>;
}

function createMockOAuthProvider(): MockOAuthProvider {
  return {
    parseAuthRequest: vi.fn().mockResolvedValue({
      clientId: "test-client",
      scope: ["knowledge:read"],
      redirectUri: "https://client.example.com/callback",
    }),
    completeAuthorization: vi.fn().mockResolvedValue({
      redirectTo: "https://client.example.com/callback?code=abc",
    }),
  };
}

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    AUTH_DB: createMockD1Database(),
    KB_DB: createMockD1Database(),
    OAUTH_PROVIDER: createMockOAuthProvider(),
    ...overrides,
  };
}

function makeCtx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any;
}

function makeRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, options);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("defaultHandler — GET /login", () => {
  beforeEach(() => {
    vi.mocked(renderLoginPage).mockReturnValue("<html>login</html>");
  });

  it("returns 200 with HTML content-type", async () => {
    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/login");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
  });

  it("calls renderLoginPage with default next=/authorize", async () => {
    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/login");
    await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(renderLoginPage).toHaveBeenCalledWith("/authorize");
  });

  it("calls renderLoginPage with custom next param", async () => {
    const env = makeEnv();
    const next = encodeURIComponent("https://mcp.harkly.io/authorize?client_id=x");
    const req = makeRequest(`https://mcp.harkly.io/login?next=${next}`);
    await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(renderLoginPage).toHaveBeenCalledWith(
      "https://mcp.harkly.io/authorize?client_id=x",
    );
  });

  it("returns the HTML string produced by renderLoginPage", async () => {
    vi.mocked(renderLoginPage).mockReturnValue("<html>custom login</html>");
    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/login");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());
    const body = await res.text();
    expect(body).toBe("<html>custom login</html>");
  });
});

describe("defaultHandler — unknown route → 404", () => {
  it("returns 404 for unrecognized path", async () => {
    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/totally-unknown");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(res.status).toBe(404);
  });

  it("returns 404 for POST /login", async () => {
    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/login", { method: "POST", body: "" });
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(res.status).toBe(404);
  });
});

describe("defaultHandler — GET /authorize without session → redirect to /login", () => {
  it("redirects to /login when user has no session", async () => {
    const mockAuth = {
      api: { getSession: vi.fn().mockResolvedValue(null) },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/authorize?client_id=test-client");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(res.status).toBe(302);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("next=");
  });
});

describe("defaultHandler — GET /authorize with session → consent page", () => {
  it("returns 200 HTML consent page when user is authenticated", async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: "user-1", email: "user@example.com" },
        }),
      },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);
    vi.mocked(renderConsentPage).mockReturnValue("<html>consent page</html>");

    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/authorize?client_id=test-client");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    const body = await res.text();
    expect(body).toBe("<html>consent page</html>");
  });

  it("passes clientId, scopes, and userEmail to renderConsentPage", async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: "user-2", email: "alice@example.com" },
        }),
      },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const env = makeEnv({
      OAUTH_PROVIDER: {
        parseAuthRequest: vi.fn().mockResolvedValue({
          clientId: "my-client",
          scope: ["knowledge:read", "knowledge:write"],
          redirectUri: "https://client.example.com/cb",
        }),
        completeAuthorization: vi.fn(),
      },
    });

    const req = makeRequest("https://mcp.harkly.io/authorize?client_id=my-client");
    await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(renderConsentPage).toHaveBeenCalledWith({
      clientId: "my-client",
      scopes: ["knowledge:read", "knowledge:write"],
      userEmail: "alice@example.com",
    });
  });
});

describe("defaultHandler — GET /authorize OAUTH_PROVIDER throws → 500", () => {
  it("returns 500 JSON when parseAuthRequest throws", async () => {
    const mockAuth = {
      api: { getSession: vi.fn().mockResolvedValue(null) },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const env = makeEnv({
      OAUTH_PROVIDER: {
        parseAuthRequest: vi.fn().mockRejectedValue(new Error("Invalid OAuth state")),
        completeAuthorization: vi.fn(),
      },
    });

    const req = makeRequest("https://mcp.harkly.io/authorize");
    const res = await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(res.status).toBe(500);
    const json = await res.json() as any;
    expect(json.error).toBe("authorize_error");
    expect(json.detail).toContain("Invalid OAuth state");
  });
});

describe("defaultHandler — POST /authorize/confirm deny", () => {
  it("redirects with error=access_denied when action=deny", async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: "user-1", email: "user@example.com" },
        }),
      },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const formData = new FormData();
    formData.append("action", "deny");

    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/authorize/confirm", {
      method: "POST",
      body: formData,
    });

    const res = await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(res.status).toBe(302);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("error=access_denied");
  });
});

describe("defaultHandler — POST /authorize/confirm approve", () => {
  it("redirects to completeAuthorization redirectTo when action=approve", async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue({
          user: { id: "user-approve", email: "approve@example.com" },
        }),
      },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const formData = new FormData();
    formData.append("action", "approve");

    const env = makeEnv({
      OAUTH_PROVIDER: {
        parseAuthRequest: vi.fn().mockResolvedValue({
          clientId: "approve-client",
          scope: ["knowledge:read"],
          redirectUri: "https://client.example.com/callback",
        }),
        completeAuthorization: vi.fn().mockResolvedValue({
          redirectTo: "https://client.example.com/callback?code=final-code",
        }),
      },
    });

    const req = makeRequest("https://mcp.harkly.io/authorize/confirm", {
      method: "POST",
      body: formData,
    });

    const res = await defaultHandler.fetch!(req, env as any, makeCtx());

    expect(res.status).toBe(302);
    const location = res.headers.get("Location") ?? "";
    expect(location).toBe("https://client.example.com/callback?code=final-code");
  });
});

describe("defaultHandler — POST /authorize/confirm session expired", () => {
  it("returns 401 when session is missing on confirm", async () => {
    const mockAuth = {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
      handler: vi.fn(),
    };
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    const formData = new FormData();
    formData.append("action", "approve");

    const env = makeEnv();
    const req = makeRequest("https://mcp.harkly.io/authorize/confirm", {
      method: "POST",
      body: formData,
    });

    const res = await defaultHandler.fetch!(req, env as any, makeCtx());
    expect(res.status).toBe(401);
  });
});
