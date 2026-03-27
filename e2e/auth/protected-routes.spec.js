/**
 * Protected routes tests — verifies unauthenticated users cannot access app pages.
 */
const { test, expect } = require("@playwright/test");

const PROTECTED_ROUTES = [
  "/",
  "/add",
  "/search",
  "/profile",
  "/settings",
  "/dashboard",
];

test.describe("Protected Routes", () => {
  for (const route of PROTECTED_ROUTES) {
    test(`should redirect ${route} to /login when unauthenticated`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForURL("**/login", { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });
  }
});
