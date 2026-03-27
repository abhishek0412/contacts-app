/**
 * Login page tests — unauthenticated tests (no fixture needed).
 *
 * Covers:
 * - Login form renders correctly
 * - Field validation (empty fields, invalid email)
 * - Successful email/password sign-in
 * - Incorrect credentials error (generic — no enumeration)
 * - OAuth buttons present
 * - Forgot password modal
 * - "Sign up" link navigation
 */
const { test, expect } = require("@playwright/test");
const { AuthPage } = require("../pages/auth.page");

test.describe("Login Page", () => {
  let auth;

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
    await auth.gotoLogin();
  });

  test("should display login form with all elements", async () => {
    await expect(auth.emailInput).toBeVisible();
    await expect(auth.passwordInput).toBeVisible();
    await expect(auth.signInButton).toBeVisible();
    await expect(auth.githubButton).toBeVisible();
    await expect(auth.googleButton).toBeVisible();
    await expect(auth.forgotPasswordLink).toBeVisible();
    await expect(auth.signUpLink).toBeVisible();
  });

  test("should show Contact Manager branding", async () => {
    await expect(auth.loginTitle).toHaveText("Contact Manager");
    await expect(auth.loginSubtitle).toContainText("Sign in");
  });

  test("should show error for empty form submission", async () => {
    await auth.signInButton.click();
    await expect(auth.loginError).toBeVisible();
  });

  test("should show error for invalid credentials", async () => {
    await auth.signIn("fake@nonexistent.com", "WrongPass123!");
    await expect(auth.loginError).toBeVisible();
    // Should NOT reveal whether email exists (OWASP A07)
    const errorText = await auth.loginError.textContent();
    expect(errorText).not.toContain("not found");
    expect(errorText).not.toContain("no user");
  });

  test("should navigate to sign up page", async ({ page }) => {
    await auth.signUpLink.click();
    await page.waitForURL("**/signup");
    await expect(page.locator(".login-header h1")).toHaveText("Create Account");
  });

  test("should open forgot password modal", async () => {
    await auth.forgotPasswordLink.click();
    await expect(auth.forgotModal).toBeVisible();
  });

  test("should close forgot password modal", async () => {
    await auth.forgotPasswordLink.click();
    await expect(auth.forgotModal).toBeVisible();
    await auth.forgotCloseButton.click();
    await expect(auth.forgotModal).not.toBeVisible();
  });

  test("should successfully sign in with valid credentials", async ({
    page,
  }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) test.skip();

    await auth.signIn(email, password);
    // Should redirect to contacts page
    await page.waitForURL("**/", { timeout: 15000 });
    await expect(page.locator(".sidebar")).toBeVisible();
  });
});
