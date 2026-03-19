import { test, expect } from "@playwright/test";

const BASE = "https://harkly-web.pages.dev";
const EMAIL = `nopoint-${Date.now()}@harkly.test`;
const PASSWORD = "TestPass123!";
const NAME = "nopoint";

test.describe.serial("Auth Flow", () => {
  test("1. register new user", async ({ page }) => {
    await page.goto(`${BASE}/register`);

    // Fill form
    const nameInput = page.locator("input[name='name']");
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill(NAME);
    }
    await page.fill("input[type='email'], input[name='email']", EMAIL);
    await page.fill("input[type='password']", PASSWORD);

    // Submit
    await page.getByRole("button", { name: /зарегистрироваться|создать/i }).click();
    await page.waitForTimeout(3000);

    // Check result
    const url = page.url();
    const body = await page.textContent("body");
    console.log(`Register URL: ${url}`);
    console.log(`Register body (first 300): ${body?.substring(0, 300)}`);
  });

  test("2. check user in DB via API", async ({ request }) => {
    // Try to register via API directly
    const res = await request.post(`${BASE}/api/auth/sign-up/email`, {
      data: { email: `api-${Date.now()}@harkly.test`, password: PASSWORD, name: "API Test" },
    });
    console.log(`API signup status: ${res.status()}`);
    const body = await res.text();
    console.log(`API signup response: ${body.substring(0, 500)}`);
  });

  test("3. login with registered user", async ({ request }) => {
    // Try login via API
    const res = await request.post(`${BASE}/api/auth/sign-in/email`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    console.log(`API login status: ${res.status()}`);
    const body = await res.text();
    console.log(`API login response: ${body.substring(0, 500)}`);
  });
});
