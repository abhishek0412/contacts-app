const { test, expect } = require("@playwright/test");
const { ContactsPage } = require("./pages/contacts.page");

test.describe("Contact List", () => {
  let contactsPage;

  test.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  test("should display the contacts heading", async () => {
    await expect(contactsPage.heading).toBeVisible();
  });

  test("should display contacts on the page", async ({ page }) => {
    await expect(contactsPage.contactItems.first()).toBeVisible();
    const count = await contactsPage.contactItems.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
  });

  test("should show contact name and phone number", async () => {
    const firstItem = contactsPage.contactItems.first();
    await expect(firstItem.locator("h3")).toBeVisible();
    await expect(firstItem.locator("p")).toBeVisible();
  });

  test("should display avatar initials for each contact", async () => {
    const avatars = contactsPage.page.locator(".contact-avatar");
    await expect(avatars.first()).toBeVisible();
    const text = await avatars.first().textContent();
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(2);
  });

  test("should show search input", async () => {
    await expect(contactsPage.searchInput).toBeVisible();
    await expect(contactsPage.searchInput).toHaveAttribute(
      "placeholder",
      "Search contacts...",
    );
  });
});
