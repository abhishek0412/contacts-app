/**
 * Contact Detail page tests — authenticated via fixture.
 *
 * Each test creates its own contact via API and navigates directly
 * by ID to avoid strict mode violations from duplicate names.
 */
const { test, expect } = require("../fixtures/auth.fixture");
const { generateContact } = require("../helpers/test-data.helper");

test.describe("Contact Detail", () => {
  let contactId;
  let contactData;

  test.beforeEach(async ({ apiHelper }) => {
    contactData = generateContact();
    const created = await apiHelper.createContact(contactData);
    contactId = created.id;
  });

  test.afterEach(async ({ apiHelper }) => {
    if (contactId) {
      await apiHelper.deleteContact(contactId).catch(() => {});
    }
  });

  test("should display hero section with contact name", async ({
    contactDetail,
  }) => {
    await contactDetail.page.goto(`/contacts/${contactId}`);
    await contactDetail.hero.waitFor({ state: "visible", timeout: 10000 });

    await expect(contactDetail.heroName).toBeVisible();
    const heroText = await contactDetail.heroName.textContent();
    expect(heroText).toContain(contactData.first_name);
  });

  test("should display 4 info cards", async ({ contactDetail }) => {
    await contactDetail.page.goto(`/contacts/${contactId}`);
    await contactDetail.hero.waitFor({ state: "visible", timeout: 10000 });

    await expect(contactDetail.personalCard).toBeVisible();
    await expect(contactDetail.contactCard).toBeVisible();
    await expect(contactDetail.addressCard).toBeVisible();
    await expect(contactDetail.professionalCard).toBeVisible();
  });

  test("should navigate to edit page via Edit button", async ({
    contactDetail,
  }) => {
    await contactDetail.page.goto(`/contacts/${contactId}`);
    await contactDetail.hero.waitFor({ state: "visible", timeout: 10000 });

    await contactDetail.clickEdit();
    await contactDetail.page.waitForURL(`/contacts/${contactId}/edit`);
  });

  test("should navigate back to contacts list via back link", async ({
    contactDetail,
  }) => {
    await contactDetail.page.goto(`/contacts/${contactId}`);
    await contactDetail.hero.waitFor({ state: "visible", timeout: 10000 });

    await contactDetail.goBack();
    await expect(contactDetail.page).toHaveURL("/");
  });

  test("should show delete confirm dialog and allow cancel", async ({
    contactDetail,
  }) => {
    await contactDetail.page.goto(`/contacts/${contactId}`);
    await contactDetail.hero.waitFor({ state: "visible", timeout: 10000 });

    await contactDetail.deleteAndCancel();
    await expect(contactDetail.hero).toBeVisible();
  });
});
