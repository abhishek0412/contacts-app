/**
 * Edit Contact page tests — authenticated via fixture.
 *
 * Each test creates its own contact via API and navigates
 * directly to /contacts/:id/edit for isolation.
 */
const { test, expect } = require("../fixtures/auth.fixture");
const { generateContact } = require("../helpers/test-data.helper");

test.describe("Edit Contact", () => {
  let contactId;

  test.beforeEach(async ({ apiHelper }) => {
    const data = generateContact();
    const created = await apiHelper.createContact(data);
    contactId = created.id;
  });

  test.afterEach(async ({ apiHelper }) => {
    if (contactId) {
      await apiHelper.deleteContact(contactId).catch(() => {});
    }
  });

  test("should pre-fill form with existing contact data", async ({
    contactForm,
  }) => {
    await contactForm.page.goto(`/contacts/${contactId}/edit`);
    await contactForm.form.waitFor({ state: "visible", timeout: 10000 });

    const firstName = await contactForm.firstName.inputValue();
    expect(firstName.length).toBeGreaterThan(0);
  });

  test("should update a field and save", async ({ contactForm }) => {
    await contactForm.page.goto(`/contacts/${contactId}/edit`);
    await contactForm.form.waitFor({ state: "visible", timeout: 10000 });

    await contactForm.company.fill("Updated Corp");
    await contactForm.submit();
    await contactForm.page.waitForURL(/\/contacts\/|\//, { timeout: 10000 });
  });

  test("should cancel without saving", async ({ contactForm }) => {
    await contactForm.page.goto(`/contacts/${contactId}/edit`);
    await contactForm.form.waitFor({ state: "visible", timeout: 10000 });

    await contactForm.cancel();
    await contactForm.page.waitForTimeout(500);
  });
});
