const { test, expect } = require("@playwright/test");
const { ContactsPage } = require("./pages/contacts.page");

test.describe("Search & Filter", () => {
  let contactsPage;

  test.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  test("should filter contacts by name", async () => {
    await contactsPage.search("Jane");
    const names = await contactsPage.getContactNames();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.toLowerCase()).toContain("jane");
    }
  });

  test("should filter contacts by phone number", async () => {
    await contactsPage.search("555");
    const count = await contactsPage.contactItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show empty state for no results", async () => {
    await contactsPage.search("zzzznonexistent");
    await expect(contactsPage.emptyState).toBeVisible();
    await expect(contactsPage.emptyState).toHaveText(
      "No contacts match your search.",
    );
  });

  test("should reset to page 1 when searching", async ({ page }) => {
    // Navigate to page 2 first
    await contactsPage.nextButton.click();
    await expect(contactsPage.pageInfo).toContainText("2");

    // Search should reset to page 1
    await contactsPage.search("a");
    await expect(contactsPage.pageInfo).toContainText("1");
  });

  test("should restore full list on clearing search", async () => {
    await contactsPage.search("Jane");
    const filteredCount = await contactsPage.contactItems.count();

    await contactsPage.clearSearch();
    const fullCount = await contactsPage.contactItems.count();
    expect(fullCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
