const { test, expect } = require("@playwright/test");
const { ContactsPage } = require("./pages/contacts.page");

test.describe("Delete Contact", () => {
  let testContactId;

  test.beforeEach(async ({ page }) => {
    // Create a temporary contact via API for delete tests
    const response = await page.request.post("http://localhost:3001/contacts", {
      data: { name: "Delete Me", phone: "(555) 000-0000" },
    });
    const contact = await response.json();
    testContactId = contact.id;
  });

  test.afterEach(async ({ page }) => {
    // Clean up if the contact wasn't deleted
    if (testContactId) {
      await page.request
        .delete(`http://localhost:3001/contacts/${testContactId}`)
        .catch(() => {});
    }
  });

  test("should show confirmation dialog on delete click", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.goto();

    // Search for our test contact
    await contactsPage.search("Delete Me");
    await contactsPage.deleteContact("Delete Me");

    // Confirm dialog should appear
    const dialog = page.locator(".confirm-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      "Are you sure you want to delete this contact?",
    );
    await expect(page.locator(".btn-cancel")).toBeVisible();
    await expect(page.locator(".btn-confirm")).toBeVisible();
  });

  test("should cancel deletion", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.goto();

    await contactsPage.search("Delete Me");
    await contactsPage.deleteContact("Delete Me");

    // Cancel
    await page.locator(".btn-cancel").click();

    // Dialog should close, contact should still exist
    await expect(page.locator(".confirm-dialog")).not.toBeVisible();
    await expect(contactsPage.contactItems.first()).toContainText("Delete Me");
  });

  test("should delete contact on confirm", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.goto();

    await contactsPage.search("Delete Me");
    await expect(
      contactsPage.contactItems.filter({ hasText: "Delete Me" }),
    ).toBeVisible();

    await contactsPage.deleteContact("Delete Me");
    await page.locator(".btn-confirm").click();

    // Notification should appear
    const notification = page.locator(".notification");
    await expect(notification).toBeVisible();
    await expect(notification).toContainText("has been removed");

    // Contact should be gone (RTK Query refetches automatically)
    await expect(
      contactsPage.contactItems.filter({ hasText: "Delete Me" }),
    ).not.toBeVisible();

    testContactId = null; // Already deleted, skip afterEach cleanup
  });
});
