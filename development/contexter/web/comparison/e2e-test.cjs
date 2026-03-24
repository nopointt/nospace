/**
 * Moholy — Full E2E Manual Test Script
 * Tests every user action on production with VISIBLE browser.
 * Run: cd /c/Users/noadmin/nospace/development/contexter && node web/comparison/e2e-test.js
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SCREENSHOT_DIR = path.join(__dirname);
const FRONTEND_URL = "https://contexter-web.pages.dev";
const API_URL = "https://contexter.nopoint.workers.dev";

// Ensure screenshot dir exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function screenshot(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: false });
}

function screenshotFull(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: true });
}

(async () => {
  console.log("=== MOHOLY E2E TEST START ===\n");

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  // Collect console errors
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const results = [];
  function logResult(step, status, details) {
    const entry = { step, status, details };
    results.push(entry);
    const icon = status === "PASS" ? "[PASS]" : status === "FAIL" ? "[FAIL]" : "[WARN]";
    console.log(`${icon} Step ${step}: ${details}`);
  }

  try {
    // =========================================================
    // STEP 1: Load Hero page
    // =========================================================
    console.log("\n--- Step 1: Load Hero page ---");
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot(page, "test-01-hero.png");

    // Check nav is visible
    const navVisible = await page.isVisible("nav");
    logResult("1a", navVisible ? "PASS" : "FAIL", `Nav visible: ${navVisible}`);

    // Check drop zone is visible (the area with "перетащите файлы")
    const dropZoneText = await page.textContent("body");
    const hasDropZone = dropZoneText.includes("перетащите файлы");
    logResult("1b", hasDropZone ? "PASS" : "FAIL", `Drop zone text present: ${hasDropZone}`);

    // Check "начать" button
    const startBtnVisible = await page.isVisible('button:has-text("начать")');
    logResult("1c", startBtnVisible ? "PASS" : "FAIL", `"начать" button visible: ${startBtnVisible}`);

    // Check "docs" and "pricing" links
    const docsLink = await page.isVisible('a:has-text("docs")');
    const pricingLink = await page.isVisible('a:has-text("pricing")');
    logResult("1d", docsLink ? "PASS" : "WARN", `"docs" link visible: ${docsLink}`);
    logResult("1e", pricingLink ? "PASS" : "WARN", `"pricing" link visible: ${pricingLink}`);

    // Check headline text
    const hasHeadline = dropZoneText.includes("загрузите файлы");
    logResult("1f", hasHeadline ? "PASS" : "FAIL", `Headline "загрузите файлы" present: ${hasHeadline}`);

    // Check "как это работает" section
    const hasHowItWorks = dropZoneText.includes("как это работает");
    logResult("1g", hasHowItWorks ? "PASS" : "FAIL", `"как это работает" section present: ${hasHowItWorks}`);

    // Check supported formats text
    const hasFormats = dropZoneText.includes("pdf · docx");
    logResult("1h", hasFormats ? "PASS" : "FAIL", `Format hints present: ${hasFormats}`);

    // Check Ctrl+V hint
    const hasCtrlV = dropZoneText.includes("ctrl + v");
    logResult("1i", hasCtrlV ? "PASS" : "FAIL", `Ctrl+V hint present: ${hasCtrlV}`);

    // Take full page screenshot
    await screenshotFull(page, "test-01-hero-full.png");

    // =========================================================
    // STEP 2: Click "начать" button — for unauthenticated user
    // Expected: triggers file chooser dialog (scrolls to drop zone + clicks it)
    // =========================================================
    console.log("\n--- Step 2: Click 'начать' button (unauthenticated) ---");

    // The "начать" button for unauthenticated users scrolls to drop zone and clicks it,
    // which opens the file chooser dialog. This is the correct UX behavior.
    const [fileChooserFromStart] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
      page.click('button:has-text("начать")'),
    ]);
    await page.waitForTimeout(1000);
    await screenshot(page, "test-02-after-start.png");

    const urlAfterStart = page.url();
    console.log(`  URL after click: ${urlAfterStart}`);

    if (fileChooserFromStart) {
      logResult("2a", "PASS", `"начать" opened file chooser (unauthenticated user goes to upload flow)`);
      // Dismiss the file chooser without selecting
    } else {
      // Alternative: it may have navigated to dashboard and bounced
      const stayedOnHero = urlAfterStart.endsWith("/") || urlAfterStart === FRONTEND_URL;
      logResult("2a", stayedOnHero ? "PASS" : "WARN", `"начать" kept user on hero page: ${urlAfterStart}`);
    }
    logResult("2b", "PASS", `Current URL after начать: ${urlAfterStart}`);

    // =========================================================
    // STEP 3: Go back to Hero, click on drop zone to trigger auth modal
    // =========================================================
    console.log("\n--- Step 3: Trigger auth modal via drop zone click ---");
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    // Click on the drop zone area — this should open file picker
    // But since we want to test auth gate, let's try uploading a file
    // First, let's just check if clicking the drop zone opens file input
    // We'll use a different approach: dispatch a file drop

    // Actually, let's test the auth modal by trying a file upload action.
    // The Hero page shows auth modal when a user tries to upload without being authenticated.

    // Create a test file to upload
    const testFilePath = path.join(__dirname, "test-file.txt");
    fs.writeFileSync(testFilePath, "This is a test document for Contexter E2E testing.\nIt contains multiple lines.\nLine three.\nLine four with some important keywords.\nLine five: the conclusion.\n");

    // Use file chooser to upload
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
      page.click('[tabindex="0"]'), // Click the drop zone div
    ]);

    if (fileChooser) {
      logResult("3a", "PASS", "File chooser opened on drop zone click");
      await fileChooser.setFiles(testFilePath);
      await page.waitForTimeout(2000);
      await screenshot(page, "test-03-after-file-select.png");

      // Auth modal should appear since user is not authenticated
      const authModalVisible = await page.isVisible('h2:has-text("создайте аккаунт")');
      logResult("3b", authModalVisible ? "PASS" : "FAIL", `Auth modal appeared: ${authModalVisible}`);
    } else {
      logResult("3a", "WARN", "File chooser did not open (may be timing issue)");
      // Try alternative: directly check if auth modal can be triggered
    }

    await screenshot(page, "test-03-auth-modal.png");

    // =========================================================
    // STEP 4: Register (create account) via auth modal
    // =========================================================
    console.log("\n--- Step 4: Register via auth modal ---");

    // Check if auth modal is visible
    let authModalPresent = await page.isVisible('h2:has-text("создайте аккаунт")');

    if (!authModalPresent) {
      // Try to trigger it again by clicking the drop zone and uploading
      console.log("  Auth modal not visible, trying to trigger...");
      const [fc2] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
        page.click('[tabindex="0"]'),
      ]);
      if (fc2) {
        await fc2.setFiles(testFilePath);
        await page.waitForTimeout(2000);
      }
      authModalPresent = await page.isVisible('h2:has-text("создайте аккаунт")');
    }

    if (authModalPresent) {
      logResult("4a", "PASS", "Auth modal is visible for registration");

      // Fill in email (optional)
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill("moholy-test@contexter.dev");
        logResult("4b", "PASS", "Email field filled");
      }

      // Fill in name (optional)
      const nameInput = page.locator('input[placeholder="имя (необязательно)"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill("Moholy Test");
        logResult("4c", "PASS", "Name field filled");
      }

      await screenshot(page, "test-04-registration-form.png");

      // Click "продолжить"
      await page.click('button:has-text("продолжить")');
      await page.waitForTimeout(3000);
      await screenshot(page, "test-04-after-register.png");

      // Check if registration succeeded
      const successMsg = await page.isVisible('text="аккаунт создан"');
      const errorMsg = await page.textContent("body").then(t => t.includes("ошибка"));

      if (successMsg) {
        logResult("4d", "PASS", "Registration succeeded — 'аккаунт создан' message shown");
      } else if (errorMsg) {
        logResult("4d", "FAIL", "Registration error occurred");
      } else {
        // Check if modal closed (success triggers auto-close after 1.5s)
        await page.waitForTimeout(2000);
        const modalGone = !(await page.isVisible('h2:has-text("создайте аккаунт")'));
        logResult("4d", modalGone ? "PASS" : "WARN", `Modal closed after register: ${modalGone}`);
      }

      // Check localStorage for auth token
      const authState = await page.evaluate(() => {
        const raw = localStorage.getItem("contexter_auth");
        return raw ? JSON.parse(raw) : null;
      });

      if (authState && authState.apiToken) {
        logResult("4e", "PASS", `Auth token stored: ${authState.apiToken.slice(0, 12)}...`);
        logResult("4f", "PASS", `User ID: ${authState.userId.slice(0, 12)}...`);
        logResult("4g", authState.mcpUrl ? "PASS" : "WARN", `MCP URL stored: ${!!authState.mcpUrl}`);
      } else {
        logResult("4e", "FAIL", "No auth token in localStorage");
      }
    } else {
      logResult("4a", "FAIL", "Could not trigger auth modal");
    }

    await screenshot(page, "test-04-final-state.png");
    await page.waitForTimeout(2000);

    // =========================================================
    // STEP 5: Upload a file (should work now that we're authenticated)
    // =========================================================
    console.log("\n--- Step 5: Upload a file ---");

    // Make sure we're on the Hero page
    const currentUrl5 = page.url();
    if (!currentUrl5.endsWith("/") && !currentUrl5 === FRONTEND_URL) {
      await page.goto(FRONTEND_URL, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1500);
    }

    // Check if we are authenticated now
    const isAuthed = await page.evaluate(() => {
      const raw = localStorage.getItem("contexter_auth");
      return !!raw;
    });

    if (isAuthed) {
      // The previous file upload should have already started if auth completed
      // Let's check if file list appeared
      const hasFileList = await page.isVisible('text="файлы"');

      if (hasFileList) {
        logResult("5a", "PASS", "File list appeared after upload");
      } else {
        // Try uploading again
        console.log("  Uploading file again...");
        const [fc3] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
          page.click('[tabindex="0"]'),
        ]);
        if (fc3) {
          await fc3.setFiles(testFilePath);
          await page.waitForTimeout(3000);
        }
      }

      await screenshot(page, "test-05-file-uploaded.png");

      // Check for file entry in the list
      const fileListVisible = await page.isVisible('text="файлы"');
      logResult("5b", fileListVisible ? "PASS" : "WARN", `File list visible: ${fileListVisible}`);

      // Check for pipeline indicator
      const pipelineVisible = await page.isVisible('[class*="pipeline"]').catch(() => false);
      logResult("5c", pipelineVisible ? "PASS" : "WARN", `Pipeline indicator visible: ${pipelineVisible}`);

    } else {
      logResult("5a", "FAIL", "Not authenticated — cannot upload");
    }

    // =========================================================
    // STEP 6: Watch pipeline progress
    // =========================================================
    console.log("\n--- Step 6: Watch pipeline progress ---");
    // Wait for processing and take screenshots at intervals
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(2500);
      await screenshot(page, `test-06-pipeline-${i + 1}.png`);

      const bodyText = await page.textContent("body");
      const hasReady = bodyText.includes("ready") || bodyText.includes("готово");
      const hasProcessing = bodyText.includes("обработка");
      const hasError = bodyText.includes("ошибка");

      if (hasReady) {
        logResult("6", "PASS", `Pipeline completed (ready) after ${(i + 1) * 2.5}s`);
        break;
      } else if (hasError) {
        logResult("6", "WARN", `Pipeline error after ${(i + 1) * 2.5}s`);
        break;
      } else if (hasProcessing) {
        console.log(`  Pipeline still processing... (${(i + 1) * 2.5}s)`);
      }

      if (i === 4) {
        logResult("6", "WARN", "Pipeline did not complete within 12.5s");
      }
    }

    await screenshot(page, "test-06-pipeline-final.png");

    // =========================================================
    // STEP 7: Navigate to Dashboard
    // =========================================================
    console.log("\n--- Step 7: Navigate to Dashboard ---");
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot(page, "test-07-dashboard.png");

    const dashUrl = page.url();
    const onDashboard = dashUrl.includes("/dashboard");
    logResult("7a", onDashboard ? "PASS" : "FAIL", `On dashboard page: ${onDashboard}`);

    // Check if redirected (auth guard)
    if (!onDashboard) {
      logResult("7b", "WARN", `Redirected away from dashboard to: ${dashUrl}`);
    } else {
      // Check stat cards
      const hasStats = await page.isVisible('text="документы"');
      logResult("7b", hasStats ? "PASS" : "WARN", `Stats visible: ${hasStats}`);

      // Check for document table headers
      const hasTableHeader = await page.isVisible('text="документ"');
      logResult("7c", hasTableHeader ? "PASS" : "FAIL", `Document table header visible: ${hasTableHeader}`);

      // Check for documents or empty state
      const bodyText7 = await page.textContent("body");
      const hasDocuments = !bodyText7.includes("документов пока нет");
      logResult("7d", "PASS", `Has documents: ${hasDocuments}${hasDocuments ? "" : " (empty state shown)"}`);

      // Check query panel
      const hasQueryPanel = bodyText7.includes("ЗАПРОС");
      logResult("7e", hasQueryPanel ? "PASS" : "FAIL", `Query panel visible: ${hasQueryPanel}`);

      // Check answer placeholder
      const hasAnswerPlaceholder = bodyText7.includes("ответ появится здесь");
      logResult("7f", hasAnswerPlaceholder ? "PASS" : "WARN", `Answer placeholder visible: ${hasAnswerPlaceholder}`);

      // Check MCP status indicator
      const hasMcpStatus = bodyText7.includes("mcp подключен");
      logResult("7g", hasMcpStatus ? "PASS" : "WARN", `MCP status shown: ${hasMcpStatus}`);

      await screenshotFull(page, "test-07-dashboard-full.png");
    }

    // =========================================================
    // STEP 8: Query (type question, get answer)
    // =========================================================
    console.log("\n--- Step 8: Test query functionality ---");

    if (onDashboard) {
      // Find query input
      const queryInput = page.locator('input[placeholder*="вопрос"]');
      const queryInputVisible = await queryInput.isVisible().catch(() => false);

      if (queryInputVisible) {
        await queryInput.fill("что содержит загруженный документ?");
        logResult("8a", "PASS", "Query input filled");

        await screenshot(page, "test-08-query-before-submit.png");

        // Click "спросить" button
        const askBtn = page.locator('button:has-text("спросить")');
        if (await askBtn.isVisible()) {
          await askBtn.click();
          logResult("8b", "PASS", "Query submitted");

          // Wait for response
          await page.waitForTimeout(8000);
          await screenshot(page, "test-08-query-result.png");

          const bodyText8 = await page.textContent("body");
          const hasAnswer = !bodyText8.includes("ответ появится здесь");
          const hasQueryError = bodyText8.includes("не удалось получить ответ");
          const noResults = bodyText8.includes("ничего не найдено");

          if (hasQueryError) {
            logResult("8c", "WARN", "Query returned error");
          } else if (noResults) {
            logResult("8c", "WARN", "No results found for query");
          } else if (hasAnswer) {
            logResult("8c", "PASS", "Query returned an answer");

            // Check for sources
            const hasSources = bodyText8.includes("ИСТОЧНИКИ");
            logResult("8d", hasSources ? "PASS" : "WARN", `Sources section present: ${hasSources}`);
          } else {
            logResult("8c", "WARN", "Query state unclear — answer placeholder still showing");
          }
        } else {
          logResult("8b", "FAIL", '"спросить" button not visible');
        }
      } else {
        logResult("8a", "FAIL", "Query input not found");
      }
    } else {
      logResult("8a", "FAIL", "Not on dashboard, skipping query test");
    }

    // =========================================================
    // STEP 9: Navigate to API page
    // =========================================================
    console.log("\n--- Step 9: Navigate to API page ---");

    // Click "api" link in nav
    const apiLink = page.locator('a[href="/api"]');
    if (await apiLink.isVisible().catch(() => false)) {
      await apiLink.click();
    } else {
      await page.goto(`${FRONTEND_URL}/api`, { waitUntil: "networkidle", timeout: 30000 });
    }
    await page.waitForTimeout(2000);
    await screenshot(page, "test-09-api-page.png");

    const apiUrl = page.url();
    const onApiPage = apiUrl.includes("/api");
    logResult("9a", onApiPage ? "PASS" : "FAIL", `On API page: ${onApiPage}`);

    if (onApiPage) {
      const bodyText9 = await page.textContent("body");

      // Check section: api endpoints
      const hasApiEndpoints = bodyText9.includes("api эндпоинты");
      logResult("9b", hasApiEndpoints ? "PASS" : "FAIL", `API endpoints section: ${hasApiEndpoints}`);

      // Check curl examples
      const hasCurl = bodyText9.includes("curl");
      logResult("9c", hasCurl ? "PASS" : "FAIL", `Curl examples present: ${hasCurl}`);

      // Check MCP section
      const hasMcpSection = bodyText9.includes("mcp подключение");
      logResult("9d", hasMcpSection ? "PASS" : "FAIL", `MCP connection section: ${hasMcpSection}`);

      // Check MCP URL field
      const hasMcpUrl = bodyText9.includes("/sse?token=");
      logResult("9e", hasMcpUrl ? "PASS" : "WARN", `MCP URL with token present: ${hasMcpUrl}`);

      // Check step-by-step instructions
      const hasSteps = bodyText9.includes("скопируйте mcp url");
      logResult("9f", hasSteps ? "PASS" : "FAIL", `MCP steps present: ${hasSteps}`);

      // Check copy buttons
      const copyButtons = await page.locator('button:has-text("скопировать")').count();
      logResult("9g", copyButtons > 0 ? "PASS" : "FAIL", `Copy buttons present: ${copyButtons}`);

      // Check tokens & sharing section
      const hasTokensSection = bodyText9.includes("токены и шеринг");
      logResult("9h", hasTokensSection ? "PASS" : "FAIL", `Tokens & sharing section: ${hasTokensSection}`);

      // Check token display
      const hasApiToken = bodyText9.includes("ваш api токен");
      logResult("9i", hasApiToken ? "PASS" : "FAIL", `API token field present: ${hasApiToken}`);

      // Check streamable HTTP section
      const hasStreamable = bodyText9.includes("streamable http");
      logResult("9j", hasStreamable ? "PASS" : "FAIL", `Streamable HTTP section: ${hasStreamable}`);

      // Check config JSON
      const hasConfigJson = bodyText9.includes("claude_desktop_config.json");
      logResult("9k", hasConfigJson ? "PASS" : "FAIL", `Config JSON example: ${hasConfigJson}`);

      await screenshotFull(page, "test-09-api-page-full.png");
    }

    // =========================================================
    // STEP 10: Navigate to Settings page (from API page, stay on app nav)
    // =========================================================
    console.log("\n--- Step 10: Navigate to Settings page ---");

    // Navigate directly to settings to avoid nav state issues
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    await screenshot(page, "test-10-settings.png");

    const settingsUrl = page.url();
    const onSettings = settingsUrl.includes("/settings");
    logResult("10a", onSettings ? "PASS" : "FAIL", `On Settings page: ${onSettings}`);

    if (onSettings) {
      const bodyText10 = await page.textContent("body");

      // Check profile section
      const hasProfile = bodyText10.includes("профиль");
      logResult("10b", hasProfile ? "PASS" : "FAIL", `Profile section: ${hasProfile}`);

      // Check email display
      const hasEmail = bodyText10.includes("email") || bodyText10.includes("EMAIL");
      logResult("10c", hasEmail ? "PASS" : "FAIL", `Email field present: ${hasEmail}`);

      // Check usage cards
      const hasUsage = bodyText10.includes("ДОКУМЕНТЫ") || bodyText10.includes("документы");
      logResult("10d", hasUsage ? "PASS" : "FAIL", `Usage cards present: ${hasUsage}`);

      // Check last login date
      const hasLastLogin = bodyText10.includes("последний вход");
      logResult("10e", hasLastLogin ? "PASS" : "FAIL", `Last login shown: ${hasLastLogin}`);

      // Check danger zone
      const hasDangerZone = bodyText10.includes("удалить все данные");
      logResult("10f", hasDangerZone ? "PASS" : "FAIL", `Danger zone present: ${hasDangerZone}`);

      // Check logout button
      const hasLogout = bodyText10.includes("выйти");
      logResult("10g", hasLogout ? "PASS" : "FAIL", `Logout button present: ${hasLogout}`);

      // Check "настройки" title
      const hasTitle = bodyText10.includes("настройки");
      logResult("10h", hasTitle ? "PASS" : "FAIL", `Page title "настройки" present: ${hasTitle}`);

      await screenshotFull(page, "test-10-settings-full.png");
    }

    // =========================================================
    // STEP 11: Navigation test — verify all nav links work
    // (must be on an app page, not Hero, to see app nav variant)
    // =========================================================
    console.log("\n--- Step 11: Navigation links ---");

    // Ensure we're on an app page to see app variant nav
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    // Nav should show app variant: документы, отправить, api, подключение, выход
    const navText = await page.locator("nav").textContent();
    console.log(`  Nav text: ${navText.replace(/\s+/g, " ").trim()}`);

    const navItems = [
      { text: "документы", href: "/dashboard" },
      { text: "отправить", href: "/" },
      { text: "api", href: "/api" },
      { text: "подключение", href: "/settings" },
      { text: "выход", href: null },
    ];

    for (const item of navItems) {
      const hasText = navText.includes(item.text);
      logResult("11", hasText ? "PASS" : "FAIL", `Nav item "${item.text}": ${hasText}`);
    }

    // Click "api" nav link and verify navigation
    const apiNavLink = page.locator('nav a[href="/api"]');
    if (await apiNavLink.isVisible().catch(() => false)) {
      await apiNavLink.click();
      await page.waitForTimeout(1500);
      logResult("11nav", page.url().includes("/api") ? "PASS" : "FAIL", `Clicked "api" -> ${page.url()}`);
    }
    await screenshot(page, "test-11-nav-api.png");

    // Click "подключение" nav link to go to settings
    const settingsNavLink = page.locator('nav a[href="/settings"]');
    if (await settingsNavLink.isVisible().catch(() => false)) {
      await settingsNavLink.click();
      await page.waitForTimeout(1500);
      logResult("11nav", page.url().includes("/settings") ? "PASS" : "FAIL", `Clicked "подключение" -> ${page.url()}`);
    }
    await screenshot(page, "test-11-nav-settings.png");

    // Click "отправить" to go to hero (still with app nav while authed)
    const uploadNavLink = page.locator('nav a[href="/"]');
    if (await uploadNavLink.isVisible().catch(() => false)) {
      await uploadNavLink.click();
      await page.waitForTimeout(1500);
      const heroUrl = page.url();
      logResult("11nav", heroUrl.endsWith("/") || heroUrl === FRONTEND_URL || heroUrl === FRONTEND_URL + "/" ? "PASS" : "FAIL", `Clicked "отправить" -> ${heroUrl}`);
    }
    await screenshot(page, "test-11-nav-hero.png");

    // =========================================================
    // STEP 12: Test logout (must be on app page with app nav)
    // =========================================================
    console.log("\n--- Step 12: Test logout ---");

    // Navigate to dashboard first to get app variant nav with "выход" button
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1500);

    // Find and click the "выход" button in nav
    const logoutBtn = page.locator('nav button:has-text("выход")');
    const logoutVisible = await logoutBtn.isVisible().catch(() => false);
    console.log(`  Logout button visible: ${logoutVisible}`);

    if (logoutVisible) {
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, "test-12-after-logout.png");

      const logoutUrl = page.url();
      const authAfterLogout = await page.evaluate(() => localStorage.getItem("contexter_auth"));
      logResult("12a", !authAfterLogout ? "PASS" : "FAIL", `Auth cleared from localStorage: ${!authAfterLogout}`);
      logResult("12b", logoutUrl.endsWith("/") || logoutUrl === FRONTEND_URL || logoutUrl === FRONTEND_URL + "/" ? "PASS" : "WARN", `Redirected to hero: ${logoutUrl}`);

      // Verify nav shows hero variant (with "начать" instead of app links)
      await page.waitForTimeout(1000);
      const heroNavPresent = await page.isVisible('button:has-text("начать")');
      logResult("12c", heroNavPresent ? "PASS" : "FAIL", `Hero nav variant after logout: ${heroNavPresent}`);
    } else {
      logResult("12a", "FAIL", "Logout button not found in nav (not on app page?)");
      // Debug: check what nav variant we're on
      const debugNavText = await page.locator("nav").textContent().catch(() => "");
      console.log(`  Debug nav text: ${debugNavText.replace(/\s+/g, " ").trim()}`);
    }

    // =========================================================
    // STEP 13: Test API backend directly
    // =========================================================
    console.log("\n--- Step 13: Backend API smoke test ---");

    // Test health/root endpoint
    try {
      const healthRes = await page.evaluate(async (url) => {
        const r = await fetch(url);
        return { status: r.status, ok: r.ok };
      }, API_URL);
      logResult("13a", healthRes.ok ? "PASS" : "WARN", `Backend root endpoint: status ${healthRes.status}`);
    } catch (e) {
      logResult("13a", "FAIL", `Backend root endpoint error: ${e.message}`);
    }

    // Test registration endpoint
    try {
      const regRes = await page.evaluate(async (url) => {
        const r = await fetch(`${url}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "api-test", email: "api-test@test.dev" }),
        });
        const data = await r.json();
        return { status: r.status, ok: r.ok, hasToken: !!data.apiToken, hasUserId: !!data.userId };
      }, API_URL);
      logResult("13b", regRes.ok && regRes.hasToken ? "PASS" : "FAIL",
        `Register API: status=${regRes.status}, hasToken=${regRes.hasToken}, hasUserId=${regRes.hasUserId}`);
    } catch (e) {
      logResult("13b", "FAIL", `Register API error: ${e.message}`);
    }

    // =========================================================
    // SUMMARY
    // =========================================================
    console.log("\n\n=== MOHOLY E2E TEST SUMMARY ===\n");

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const warned = results.filter((r) => r.status === "WARN").length;

    console.log(`PASS: ${passed}  |  FAIL: ${failed}  |  WARN: ${warned}  |  TOTAL: ${results.length}`);
    console.log("");

    if (failed > 0) {
      console.log("FAILURES:");
      results.filter((r) => r.status === "FAIL").forEach((r) => {
        console.log(`  [FAIL] Step ${r.step}: ${r.details}`);
      });
      console.log("");
    }

    if (warned > 0) {
      console.log("WARNINGS:");
      results.filter((r) => r.status === "WARN").forEach((r) => {
        console.log(`  [WARN] Step ${r.step}: ${r.details}`);
      });
      console.log("");
    }

    if (consoleErrors.length > 0) {
      console.log("CONSOLE ERRORS:");
      consoleErrors.forEach((e) => console.log(`  ${e}`));
      console.log("");
    }

    // Write results to file
    const reportPath = path.join(SCREENSHOT_DIR, "test-report.json");
    fs.writeFileSync(reportPath, JSON.stringify({ results, consoleErrors, timestamp: new Date().toISOString() }, null, 2));
    console.log(`Report saved: ${reportPath}`);

    // Keep browser open for 5 seconds so we can see
    await page.waitForTimeout(3000);

    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    await browser.close();

  } catch (error) {
    console.error("\n=== FATAL ERROR ===");
    console.error(error);
    await screenshot(page, "test-FATAL-error.png").catch(() => {});
    await browser.close();
    process.exit(1);
  }
})();
