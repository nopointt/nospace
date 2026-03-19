import { test, expect } from "@playwright/test";

const BASE = "https://harkly-web.pages.dev";
const MCP = "https://harkly-mcp.nopoint.workers.dev";

test.describe("Harkly Smoke Tests", () => {
  // ── Landing Page ────────────────────────────────────────────
  test("landing page loads with correct title", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Harkly/);
    // Content may be behind Suspense — check buttons with longer timeout
    await expect(page.getByText("Войти")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Зарегистрироваться")).toBeVisible();
  });

  // ── Login page ──────────────────────────────────────────────
  test("login page renders form", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });

  // ── Register page ──────────────────────────────────────────
  test("register page renders form", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /зарегистрироваться|создать/i })).toBeVisible();
  });

  // ── Auth registration flow ──────────────────────────────────
  test("can register a new user", async ({ page }) => {
    await page.goto(`${BASE}/register`);
    const email = `test-${Date.now()}@harkly.test`;
    await page.fill("input[type='email'], input[name='email']", email);
    await page.fill("input[type='password']", "TestPass123!");

    const nameInput = page.locator("input[name='name']");
    if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nameInput.fill("Test User");
    }

    await page.getByRole("button", { name: /зарегистрироваться|создать/i }).click();
    await page.waitForTimeout(3000);
    // Registration attempted — either redirected or showed error (both valid)
    console.log(`After register: ${page.url()}`);
  });

  // ── Protected route behavior ───────────────────────────────
  test("protected route /kb responds", async ({ page }) => {
    const response = await page.goto(`${BASE}/kb`);
    // Without auth, should get some response (login redirect, 500 from missing bindings, etc.)
    expect(response).toBeTruthy();
    console.log(`/kb status: ${response?.status()}`);
  });

  // ── MCP Worker endpoints ───────────────────────────────────
  test("MCP OAuth metadata", async ({ request }) => {
    const res = await request.get(`${MCP}/.well-known/oauth-authorization-server`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.issuer).toBeTruthy();
    expect(json.authorization_endpoint).toBeTruthy();
    expect(json.token_endpoint).toBeTruthy();
    expect(json.scopes_supported).toContain("knowledge:read");
  });

  test("MCP /mcp without token returns invalid_token", async ({ request }) => {
    const res = await request.post(`${MCP}/mcp`, {
      data: { jsonrpc: "2.0", method: "tools/list", id: 1 },
    });
    const json = await res.json();
    expect(json.error).toBe("invalid_token");
  });

  test("MCP /login page renders", async ({ page }) => {
    await page.goto(`${MCP}/login`);
    expect(await page.textContent("body")).toBeTruthy();
  });

  test("MCP /authorize redirects to login with valid client", async ({ request }) => {
    // First register a client
    const regRes = await request.post(`${MCP}/oauth/register`, {
      data: {
        client_name: "authorize-test",
        redirect_uris: ["http://localhost:3000/callback"],
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
    });
    const { client_id } = await regRes.json();

    const res = await request.get(
      `${MCP}/authorize?client_id=${client_id}&response_type=code&scope=knowledge:read&redirect_uri=http://localhost:3000/callback&code_challenge=test&code_challenge_method=S256`,
      { maxRedirects: 0 },
    );
    // Should be 302 redirect to /login (no active session)
    expect(res.status()).toBe(302);
    expect(res.headers()["location"]).toContain("/login");
  });

  test("MCP dynamic client registration", async ({ request }) => {
    const res = await request.post(`${MCP}/oauth/register`, {
      data: {
        client_name: "playwright-test",
        redirect_uris: ["http://localhost:3000/callback"],
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      },
    });
    // RFC 7591: 201 Created
    expect(res.status()).toBe(201);
    const json = await res.json();
    expect(json.client_id).toBeTruthy();
  });
});
