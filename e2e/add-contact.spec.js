const { test, expect } = require("@playwright/test");
const { AddContactPage } = require("./pages/add-contact.page");

test.describe("Add Contact", () => {
  let addContactPage;

  test.beforeEach(async ({ page }) => {
    addContactPage = new AddContactPage(page);
    await addContactPage.goto();
  });

  test("should display the add contact form", async () => {
    await expect(addContactPage.nameInput).toBeVisible();
    await expect(addContactPage.phoneInput).toBeVisible();
    await expect(addContactPage.submitButton).toBeVisible();
    await expect(addContactPage.submitButton).toHaveText("Add Contact");
  });

  test("should show validation error for empty name", async () => {
    await addContactPage.phoneInput.fill("1234567890");
    await addContactPage.submit();
    await expect(addContactPage.nameError).toBeVisible();
  });

  test("should show validation error for short name", async () => {
    await addContactPage.fillForm("A", "1234567890");
    await addContactPage.submit();
    await expect(addContactPage.nameError).toBeVisible();
    await expect(addContactPage.nameError).toContainText("at least 2");
  });

  test("should show validation error for short phone", async () => {
    await addContactPage.fillForm("Test User", "123");
    await addContactPage.submit();
    await expect(addContactPage.phoneError).toBeVisible();
    await expect(addContactPage.phoneError).toContainText("at least 10");
  });

  test("should show validation error for invalid phone format", async () => {
    await addContactPage.fillForm("Test User", "abcdefghij");
    await addContactPage.submit();
    await expect(addContactPage.phoneError).toBeVisible();
    await expect(addContactPage.phoneError).toContainText("Invalid");
  });

  test("should add a contact and redirect to list", async ({ page }) => {
    const name = `PW Test ${Date.now()}`;
    await addContactPage.addContact(name, "(555) 999-0000");

    // Should redirect to contacts list
    await expect(page).toHaveURL("/");

    // Should show success notification
    const notification = page.locator(".notification");
    await expect(notification).toBeVisible();
    await expect(notification).toContainText("has been added");

    // Clean up: delete the test contact via API
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
