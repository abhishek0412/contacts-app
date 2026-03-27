/**
 * Auth fixture — extends Playwright's base test with pre-authenticated pages.
 *
 * Strategy: Login ONCE per worker via a shared BrowserContext.
 * The context's IndexedDB retains Firebase auth across all pages opened from it.
 * With workers=1, this means exactly 1 Firebase login for the entire test suite.
 *
 * Usage:
 *   const { test, expect } = require('../fixtures/auth.fixture');
 *   test('should see contacts', async ({ authedPage }) => { ... });
 */

const base = require("@playwright/test");

const { ApiHelper } = require("../helpers/api.helper");
const { ContactsListPage } = require("../pages/contacts-list.page");
const { ContactDetailPage } = require("../pages/contact-detail.page");
const { ContactFormPage } = require("../pages/contact-form.page");
const { SearchPage } = require("../pages/search.page");

const test = base.test.extend({
  /**
   * Worker-scoped: one BrowserContext that stays logged in for all tests.
   * Firebase auth lives in IndexedDB which is context-scoped — every new
   * page opened from this context inherits the auth automatically.
   */
  authedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const email = process.env.E2E_EMAIL;
      const password = process.env.E2E_PASSWORD;
      if (!email || !password) {
        throw new Error("E2E_EMAIL / E2E_PASSWORD not set in .env");
      }

      // Login via UI — happens exactly once per worker
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.getByPlaceholder("you@example.com").fill(email);
      await page.getByPlaceholder("••••••••").fill(password);
      await page.getByRole("button", { name: "Sign In" }).click();

      // Wait for authenticated app to load
      await page
        .locator(".sidebar")
        .waitFor({ state: "visible", timeout: 15000 });

      // Keep this page open — closing it doesn't affect the context's IndexedDB,
      // but keeping it avoids potential garbage collection of the DB connection.
      await use(context);

      await page.close();
      await context.close();
    },
    { scope: "worker" },
  ],

  /**
   * Per-test page: opens a new tab in the already-authenticated context.
   * No login needed — Firebase picks up auth from IndexedDB automatically.
   */
  authedPage: async ({ authedContext }, use) => {
    const page = await authedContext.newPage();
    await page.goto("/");
    await page
      .locator(".sidebar")
      .waitFor({ state: "visible", timeout: 10000 });
    await use(page);
    await page.close();
  },

  // Page object fixtures — each wraps authedPage with domain-specific helpers
  contactsList: async ({ authedPage }, use) => {
    await use(new ContactsListPage(authedPage));
  },

  contactDetail: async ({ authedPage }, use) => {
    await use(new ContactDetailPage(authedPage));
  },

  contactForm: async ({ authedPage }, use) => {
    await use(new ContactFormPage(authedPage));
  },

  searchPage: async ({ authedPage }, use) => {
    await use(new SearchPage(authedPage));
  },

  /** API helper with auth token extracted from the browser session. */
  apiHelper: async ({ authedContext, playwright }, use) => {
    const page = await authedContext.newPage();

    // Extract the Firebase auth token by intercepting a real API call
    let token = null;
    await page.route("**/contacts**", async (route) => {
      const headers = route.request().headers();
      if (headers["authorization"]) {
        token = headers["authorization"].replace("Bearer ", "");
      }
      await route.continue();
    });

    // Trigger an API call to capture the token
    await page.goto("/");
    await page.locator(".sidebar").waitFor({ state: "visible", timeout: 15000 });
    // Wait for the contacts API call to fire
    await page.waitForTimeout(2000);
    await page.close();

    if (!token) {
      throw new Error("Could not extract Firebase auth token from API calls");
    }

    const request = await playwright.request.newContext();
    const helper = new ApiHelper(request, token);
    await use(helper);
    await request.dispose();
  },
});

module.exports = { test, expect: base.expect };
