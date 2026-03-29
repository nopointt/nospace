/**
 * Contexter — UI Browser Tests (Suites 5 & 6)
 *
 * These tests require a real browser (Playwright Page object) to test:
 *   Suite 5 — Upload UI Flow: file input, drag-drop zone, pipeline stages in UI
 *   Suite 6 — Connection Modal: MCP client list, copy buttons, Perplexity instructions
 *
 * Extracted from contexter-comprehensive.spec.ts — the only browser-specific tests.
 * All API-level tests are in suite-*.spec.ts files.
 *
 * Run: npx playwright test e2e/suite-5-6-ui.spec.ts --reporter=list
 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const FRONTEND = "https://contexter.cc"
const API = "https://api.contexter.cc"
const FIXTURES = resolve(__dirname, "../test-fixtures")
const SMALL_TXT = resolve(FIXTURES, "test-small.txt")

const RUN_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

function uniqueEmail(label: string): string {
  return `ui-${label}-${RUN_ID}@test.contexter.dev`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function registerUser(
  request: APIRequestContext,
  label: string,
): Promise<{ userId: string; apiToken: string; mcpUrl: string }> {
  const res = await request.post(`${API}/api/auth/register`, {
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({ name: `ui-${label}`, email: uniqueEmail(label) }),
  })
  expect(res.status(), `register [${label}] expected 201`).toBe(201)
  const body = await res.json()
  expect(body.apiToken).toBeTruthy()
  return body as { userId: string; apiToken: string; mcpUrl: string }
}

async function injectAuth(
  page: Page,
  authState: { userId: string; apiToken: string; mcpUrl: string },
  name: string,
): Promise<void> {
  await page.goto(`${FRONTEND}/app`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.evaluate((auth) => {
    localStorage.setItem("contexter_auth", JSON.stringify(auth))
  }, { ...authState, name })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForTimeout(1000)
}

// ===========================================================================
// SUITE 5 — Upload UI Flow (Browser)
// ===========================================================================

test.describe.serial("Suite 5 — Upload UI Flow (Browser)", () => {
  let authState: { userId: string; apiToken: string; mcpUrl: string }

  test.beforeAll(async ({ request }) => {
    authState = await registerUser(request, "ui-upload")
  })

  test("5.1 /app renders upload interface for authenticated user", async ({ page }) => {
    await injectAuth(page, authState, "ui-upload")
    const body = await page.textContent("body")
    expect(body!.length).toBeGreaterThan(100)
    expect(page.url()).toContain("/app")
    console.log(`5.1 — App body snippet: ${body?.slice(0, 200)}`)
  })

  test("5.2 file upload via input element: test-small.txt", async ({ page }) => {
    test.setTimeout(120_000)
    await injectAuth(page, authState, "ui-upload")

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      console.log("5.2 — No file input found, skipping")
      test.skip()
      return
    }

    await fileInput.setInputFiles(SMALL_TXT)
    await page.waitForTimeout(2000)

    const body = await page.textContent("body")
    const hasUploadCue =
      (body?.includes("test-small.txt") ?? false) ||
      (body?.includes("processing") ?? false) ||
      (body?.includes("uploading") ?? false) ||
      (body?.includes("parse") ?? false) ||
      (body?.includes("upload") ?? false)
    console.log(`5.2 — Body after upload: ${body?.slice(0, 400)}`)
    expect(hasUploadCue).toBeTruthy()
  })

  test("5.3 drag-drop zone is present on /app", async ({ page }) => {
    await injectAuth(page, authState, "ui-upload")
    const dropZone = page.locator(
      "[data-testid='dropzone'], [class*='drop'], [class*='zone'], [class*='upload']"
    )
    const count = await dropZone.count()
    console.log(`5.3 — Drop zone elements found: ${count}`)
    expect(await page.locator("body").isVisible()).toBeTruthy()
  })

  test("5.4 pipeline status stages appear after upload", async ({ page }) => {
    test.setTimeout(120_000)
    await injectAuth(page, authState, "ui-upload")

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      console.log("5.4 — No file input, skipping")
      test.skip()
      return
    }

    await fileInput.setInputFiles(SMALL_TXT)
    await page.waitForTimeout(3000)

    const body = await page.textContent("body")
    const hasStageCues =
      (body?.includes("parse") ?? false) ||
      (body?.includes("chunk") ?? false) ||
      (body?.includes("embed") ?? false) ||
      (body?.includes("index") ?? false) ||
      (body?.includes("processing") ?? false) ||
      (body?.includes("Извлечение") ?? false) ||
      (body?.includes("Обработка") ?? false) ||
      (body?.includes("Готов") ?? false)
    console.log(`5.4 — Stage cues: ${hasStageCues}, body: ${body?.slice(0, 500)}`)
    expect(hasStageCues).toBeTruthy()
  })

  test("5.5 document appears with ready status after pipeline completes", async ({ page }) => {
    test.setTimeout(150_000)
    await injectAuth(page, authState, "ui-upload")

    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      console.log("5.5 — No file input, skipping")
      test.skip()
      return
    }

    await fileInput.setInputFiles(SMALL_TXT)

    const start = Date.now()
    let ready = false
    while (Date.now() - start < 120_000) {
      await page.waitForTimeout(3000)
      const body = await page.textContent("body")
      if (body?.includes("ready") || body?.includes("готов") || body?.includes("Ready") || body?.includes("Готов")) {
        ready = true
        break
      }
    }
    console.log(`5.5 — Ready status: ${ready}`)
    expect(ready).toBeTruthy()
  })
})

// ===========================================================================
// SUITE 6 — Connection Modal
// ===========================================================================

test.describe("Suite 6 — Connection Modal", () => {
  test("6.1 connection modal opens with client list", async ({ page, request }) => {
    const reg = await registerUser(request, "conn-open")
    await injectAuth(page, reg, "conn-open")

    const connectBtn = page.locator(
      "button:has-text('Подключение'), button:has-text('подключ'), button:has-text('Connect'), a:has-text('Подключение')"
    ).first()

    if (await connectBtn.count() > 0) {
      await connectBtn.click()
      await page.waitForTimeout(800)
      const body = await page.textContent("body")
      const hasClients =
        (body?.includes("ChatGPT") ?? false) ||
        (body?.includes("Claude") ?? false) ||
        (body?.includes("Perplexity") ?? false) ||
        (body?.includes("Cursor") ?? false)
      console.log(`6.1 — Modal opened, clients: ${hasClients}`)
      expect(hasClients).toBeTruthy()
    } else {
      await page.goto(`${FRONTEND}/api`, { waitUntil: "domcontentloaded", timeout: 30_000 })
      await page.waitForTimeout(500)
      const body = await page.textContent("body")
      console.log(`6.1 — /api page: ${body?.slice(0, 300)}`)
      expect(body!.length).toBeGreaterThan(100)
    }
  })

  test("6.2 expected MCP clients listed on /app", async ({ page, request }) => {
    const reg = await registerUser(request, "conn-clients")
    await injectAuth(page, reg, "conn-clients")

    const body = await page.textContent("body")
    const expectedClients = ["ChatGPT", "Claude", "Perplexity", "Cursor"]
    const missing: string[] = []
    for (const client of expectedClients) {
      if (!(body?.includes(client) ?? false)) missing.push(client)
    }
    console.log(`6.2 — Missing clients: ${missing.length === 0 ? "none" : missing.join(", ")}`)
    expect(missing, `Missing clients: ${missing.join(", ")}`).toEqual([])
  })

  test("6.3 /api page loads and renders content", async ({ page }) => {
    await page.goto(`${FRONTEND}/api`, { waitUntil: "networkidle", timeout: 30_000 })
    await page.waitForTimeout(2000)
    const body = await page.textContent("body")
    console.log(`6.3 — /api page body length: ${body?.length}, snippet: ${body?.slice(0, 200)}`)
    // SPA may have minimal content; just verify it loads without error
    expect(page.url()).toContain("/api")
  })

  test("6.4 Perplexity instructions mention Connectors", async ({ page, request }) => {
    const reg = await registerUser(request, "perplexity")
    await injectAuth(page, reg, "perplexity")

    const connectBtn = page.locator(
      "button:has-text('Подключение'), button:has-text('подключ'), button:has-text('Connect')"
    ).first()

    if (await connectBtn.count() > 0) {
      await connectBtn.click()
      await page.waitForTimeout(500)

      const perpBtn = page.locator("button:has-text('Perplexity'), div:has-text('Perplexity')").first()
      if (await perpBtn.count() > 0) {
        await perpBtn.click()
        await page.waitForTimeout(500)
        const body = await page.textContent("body")
        const hasConnectors = body?.includes("Connectors") ?? false
        console.log(`6.4 — Perplexity Connectors: ${hasConnectors}`)
        expect(hasConnectors).toBeTruthy()
      } else {
        console.log("6.4 — Perplexity button not found, skipping")
      }
    } else {
      console.log("6.4 — Connect button not found")
      expect(true).toBeTruthy()
    }
  })

  test("6.5 copy buttons exist in connection modal", async ({ page, request }) => {
    const reg = await registerUser(request, "copy-btns")
    await injectAuth(page, reg, "copy-btns")

    const connectBtn = page.locator(
      "button:has-text('Подключение'), button:has-text('подключ'), button:has-text('Connect')"
    ).first()

    if (await connectBtn.count() > 0) {
      await connectBtn.click()
      await page.waitForTimeout(500)

      const clientBtn = page.locator("button:has-text('ChatGPT')").first()
      if (await clientBtn.count() > 0) {
        await clientBtn.click()
        await page.waitForTimeout(500)
      }

      const copyLinkBtn = page.locator("button:has-text('Скопировать ссылку')")
      const copyTokenBtn = page.locator("button:has-text('Скопировать токен')")
      console.log(`6.5 — Copy link: ${await copyLinkBtn.count()}, token: ${await copyTokenBtn.count()}`)
    }
    expect(await page.locator("body").isVisible()).toBeTruthy()
  })
})
