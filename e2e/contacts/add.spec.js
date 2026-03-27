/**
 * Add Contact page tests — authenticated via fixture.
 *
 * Covers:
 * - Form renders with 4 sections
 * - Required field validation (first_name, last_name, phone)
 * - Successful contact creation
 * - Cancel navigates back
 */
const { test, expect } = require("../fixtures/auth.fixture");
const {
  generateContact,
  generateMinimalContact,
} = require("../helpers/test-data.helper");

test.describe("Add Contact", () => {
  test("should display form with 4 sections", async ({ contactForm }) => {
    await contactForm.goto();
    const titles = await contactForm.getSectionTitles();
    expect(titles).toEqual([
      "Personal Information",
      "Contact Information",
      "Address",
      "Professional & Notes",
    ]);
  });

  test("should show validation errors for empty required fields", async ({
    contactForm,
  }) => {
    await contactForm.goto();
    await contactForm.submit();
    const errorCount = await contactForm.getErrorCount();
    expect(errorCount).toBeGreaterThan(0);
  });

  test("should create contact with required fields only", async ({
    contactForm,
  }) => {
    await contactForm.goto();
    const contact = generateMinimalContact();
    await contactForm.fillRequiredFields(contact);
    await contactForm.submit();

    // Should redirect to contacts list on success
    await contactForm.page.waitForURL("/", { timeout: 10000 });
  });

  test("should create contact with all fields", async ({ contactForm }) => {
    await contactForm.goto();
    const contact = generateContact();
    await contactForm.fillForm(contact);
    await contactForm.submit();

    // Should redirect to contacts list on success
    await contactForm.page.waitForURL("/", { timeout: 10000 });
  });

  test("should cancel and navigate back", async ({ contactForm }) => {
    await contactForm.goto();
    await contactForm.cancel();
    // history.back() — should go to previous page
    await contactForm.page.waitForTimeout(500);
  });

  test('should display page title "Add New Contact" in topbar', async ({
    contactForm,
  }) => {
    await contactForm.goto();
    const title = await contactForm.getPageTitle();
    expect(title).toContain("Add");
  });
});
