/**
 * TopBar tests — authenticated via fixture.
 *
 * Covers:
 * - Dynamic page title
 * - Global search bar
 * - User avatar with initials
 * - Notification bell
 */
const { test, expect } = require("../fixtures/auth.fixture");

test.describe("TopBar", () => {
  test("should show dynamic page title", async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.topbarTitle).toHaveText("Contacts");
  });

  test("should show search bar with placeholder", async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.topbarSearchInput).toBeVisible();
    await expect(contactsList.topbarSearchInput).toHaveAttribute(
      "placeholder",
      "Search anything...",
    );
  });

  test("should show notification bell", async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.topbarNotification).toBeVisible();
  });

  test("should show user avatar", async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.topbarAvatar).toBeVisible();
  });

  test("should navigate to search page on global search", async ({
    contactsList,
  }) => {
    await contactsList.goto();
    await contactsList.globalSearch("test query");
    await contactsList.page.waitForURL(/\/search\?q=test/);
  });
});
