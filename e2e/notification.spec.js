const { test, expect } = require("@playwright/test");
const { AddContactPage } = require("./pages/add-contact.page");

test.describe("Notifications", () => {
  test("should show success notification on adding a contact", async ({
    page,
  }) => {
    const addContactPage = new AddContactPage(page);
    await addContactPage.goto();

    const name = `Notify Test ${Date.now()}`;
    await addContactPage.addContact(name, "(555) 888-0000");

    const notification = page.locator(".notification");
    await expect(notification).toBeVisible();
    await expect(notification).toHaveClass(/notification-success/);
    await expect(notification).toContainText("has been added");

    // Clean up
    const response = await page.request.get("http://localhost:3001/contacts");
    const contacts = await response.json();
    const testContact = contacts.find((c) => c.name === name);
    if (testContact) {
      await page.request.delete(
        `http://localhost:3001/contacts/${testContact.id}`,
      );
    }
  });

  test("should auto-dismiss notification after timeout", async ({ page }) => {
    const addContactPage = new AddContactPage(page);
    await addContactPage.goto();

    const name = `AutoDismiss ${Date.now()}`;
    await addContactPage.addContact(name, "(555) 888-0001");

    const notification = page.locator(".notification");
    await expect(notification).toBeVisible();

    // Should auto-dismiss within 5 seconds (4s timer + buffer)
    await expect(notification).not.toBeVisible({ timeout: 6000 });

    // Clean up
    const response = await page.request.get("http://localhost:3001/contacts");
    const contacts = await response.json();
    const testContact = contacts.find((c) => c.name === name);
    if (testContact) {
      await page.request.delete(
        `http://localhost:3001/contacts/${testContact.id}`,
      );
    }
  });

  test("should close notification on manual dismiss", async ({ page }) => {
    const addContactPage = new AddContactPage(page);
    await addContactPage.goto();

    const name = `ManualClose ${Date.now()}`;
    await addContactPage.addContact(name, "(555) 888-0002");

    const notification = page.locator(".notification");
    await expect(notification).toBeVisible();

    await page.locator(".notification-close").click();
    await expect(notification).not.toBeVisible();

    // Clean up
    const response = await page.request.get("http://localhost:3001/contacts");
    const contacts = await response.json();
    const testContact = contacts.find((c) => c.name === name);
    if (testContact) {
      await page.request.delete(
        `http://localhost:3001/contacts/${testContact.id}`,
      );
    }
  });
});
