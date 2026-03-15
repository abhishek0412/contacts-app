const { test, expect } = require("@playwright/test");

test.describe("Navigation", () => {
  test("should display header with nav links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".header-title")).toBeVisible();
    await expect(page.locator(".header-title")).toContainText(
      "Contact Manager",
    );

    const navLinks = page.locator(".nav-link");
    await expect(navLinks).toHaveCount(2);
    await expect(navLinks.first()).toContainText("Contacts");
    await expect(navLinks.last()).toHaveText("Add New");
  });

  test("should show contact count badge", async ({ page }) => {
    await page.goto("/");
    const badge = page.locator(".badge");
    await expect(badge).toBeVisible();
    const count = parseInt(await badge.textContent());
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate to Add New page", async ({ page }) => {
    await page.goto("/");
    await page.locator(".nav-link", { hasText: "Add New" }).click();
    await expect(page).toHaveURL("/add");
  });

  test("should navigate back to Contacts from Add page", async ({ page }) => {
    await page.goto("/add");
    await page.locator(".nav-link", { hasText: "Contacts" }).click();
    await expect(page).toHaveURL("/");
  });

  test("should highlight active nav link", async ({ page }) => {
    await page.goto("/");
    const contactsLink = page.locator(".nav-link", { hasText: "Contacts" });
    await expect(contactsLink).toHaveClass(/active/);

    await page.goto("/add");
    const addLink = page.locator(".nav-link", { hasText: "Add New" });
    await expect(addLink).toHaveClass(/active/);
  });

  test("should navigate home when clicking the title", async ({ page }) => {
    await page.goto("/add");
    await page.locator(".header-title").click();
    await expect(page).toHaveURL("/");
  });
});
