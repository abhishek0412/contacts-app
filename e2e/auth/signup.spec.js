/**
 * Sign Up page tests — unauthenticated.
 *
 * Covers:
 * - Sign up form renders correctly
 * - Password strength validation
 * - Password confirmation mismatch
 * - Required field validation
 * - "Already have an account?" link
 *
 * NOTE: Actual account creation is not tested here to avoid
 * creating real Firebase accounts in every test run. The login.spec.js
 * tests cover the post-signup flow with the pre-created test account.
 */
const { test, expect } = require("@playwright/test");
const { AuthPage } = require("../pages/auth.page");
const { generateUser } = require("../helpers/test-data.helper");

test.describe("Sign Up Page", () => {
  let auth;

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
    await auth.gotoSignUp();
  });

  test("should display sign up form with all fields", async () => {
    await expect(auth.displayNameInput).toBeVisible();
    await expect(auth.signUpEmailInput).toBeVisible();
    await expect(auth.signUpPasswordInput).toBeVisible();
    await expect(auth.confirmPasswordInput).toBeVisible();
    await expect(auth.createAccountButton).toBeVisible();
  });

  test("should show Create Account branding", async () => {
    await expect(auth.loginTitle).toHaveText("Create Account");
  });

  test("should show validation errors for empty form", async () => {
    await auth.createAccountButton.click();
    await expect(auth.fieldErrors.first()).toBeVisible();
  });

  test("should validate password strength", async ({ page }) => {
    const user = generateUser();
    await auth.displayNameInput.fill(user.name);
    await auth.signUpEmailInput.fill(user.email);
    await auth.signUpPasswordInput.fill("weak");
    await auth.confirmPasswordInput.fill("weak");
    await auth.createAccountButton.click();

    await expect(auth.fieldErrors.first()).toBeVisible();
  });

  test("should detect password confirmation mismatch", async ({ page }) => {
    const user = generateUser();
    await auth.displayNameInput.fill(user.name);
    await auth.signUpEmailInput.fill(user.email);
    await auth.signUpPasswordInput.fill(user.password);
    await auth.confirmPasswordInput.fill("DifferentPass1!");
    await auth.createAccountButton.click();

    await expect(auth.fieldErrors.first()).toContainText(/match/i);
  });

  test("should validate email format", async ({ page }) => {
    const user = generateUser();
    await auth.displayNameInput.fill(user.name);
    await auth.signUpEmailInput.fill("not-an-email");
    await auth.signUpPasswordInput.fill(user.password);
    await auth.confirmPasswordInput.fill(user.password);
    await auth.createAccountButton.click();

    await expect(auth.fieldErrors.first()).toBeVisible();
  });

  test("should navigate to login page via link", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /sign in|log in/i });
    await loginLink.click();
    await page.waitForURL("**/login");
  });
});
