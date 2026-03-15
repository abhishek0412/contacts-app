const { test, expect } = require("@playwright/test");
const { ContactsPage } = require("./pages/contacts.page");

test.describe("Contact Detail", () => {
  test.beforeEach(async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.goto();
  });

  test("should navigate to contact detail on click", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    const firstName = await contactsPage.contactItems
      .first()
      .locator("h3")
      .textContent();
    await contactsPage.contactItems.first().click();

    // Should be on detail page
    await expect(page).toHaveURL(/\/contacts\/\d+/);

    // Should show contact info
    const detailCard = page.locator(".contact-detail-card");
    await expect(detailCard).toBeVisible();
    await expect(detailCard.locator("h3")).toHaveText(firstName);
  });

  test("should display avatar initials on detail page", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.contactItems.first().click();

    const avatar = page.locator(".detail-avatar");
    await expect(avatar).toBeVisible();
    const text = await avatar.textContent();
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(2);
  });

  test("should navigate back to list", async ({ page }) => {
    const contactsPage = new ContactsPage(page);
    await contactsPage.contactItems.first().click();

    const backLink = page.locator(".btn-back");
    await expect(backLink).toBeVisible();
    await backLink.click();

    await expect(page).toHaveURL("/");
  });

  test("should show 'not found' for invalid contact id", async ({ page }) => {
    await page.goto("/contacts/999999");
    await expect(page.locator("text=Contact not found")).toBeVisible();
  });
});
