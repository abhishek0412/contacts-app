const { test, expect } = require("@playwright/test");
const { ContactsPage } = require("./pages/contacts.page");

test.describe("Pagination", () => {
  let contactsPage;

  test.beforeEach(async ({ page }) => {
    contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  test("should show pagination controls", async () => {
    await expect(contactsPage.pagination).toBeVisible();
    await expect(contactsPage.prevButton).toBeVisible();
    await expect(contactsPage.nextButton).toBeVisible();
    await expect(contactsPage.pageInfo).toBeVisible();
  });

  test("should start on page 1 with Prev disabled", async () => {
    await expect(contactsPage.pageInfo).toContainText("1 /");
    await expect(contactsPage.prevButton).toBeDisabled();
  });

  test("should navigate to next page", async () => {
    const firstPageNames = await contactsPage.getContactNames();
    await contactsPage.nextButton.click();
    await expect(contactsPage.pageInfo).toContainText("2 /");

    const secondPageNames = await contactsPage.getContactNames();
    expect(secondPageNames).not.toEqual(firstPageNames);
  });

  test("should navigate back to previous page", async () => {
    await contactsPage.contactItems.first().waitFor();
    const firstPageNames = await contactsPage.getContactNames();
    await contactsPage.nextButton.click();
    await expect(contactsPage.pageInfo).toContainText("2 /");
    await contactsPage.prevButton.click();

    await expect(contactsPage.pageInfo).toContainText("1 /");
    const restoredNames = await contactsPage.getContactNames();
    expect(restoredNames).toEqual(firstPageNames);
  });

  test("should disable Next on last page", async ({ page }) => {
    // Navigate to last page
    const pageInfoText = await contactsPage.pageInfo.textContent();
    const totalPages = parseInt(pageInfoText.split("/")[1].trim());

    for (let i = 1; i < totalPages; i++) {
      await contactsPage.nextButton.click();
    }

    await expect(contactsPage.nextButton).toBeDisabled();
  });

  test("should display max 5 contacts per page", async () => {
    const count = await contactsPage.contactItems.count();
    expect(count).toBeLessThanOrEqual(5);
  });
});
