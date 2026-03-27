/**
 * Contact List page tests — authenticated via fixture.
 *
 * Tests that interact with specific rows create their own 
 * uniquely-named contacts via API for data isolation.
 */
const { test, expect } = require("../fixtures/auth.fixture");
const { generateMinimalContact } = require("../helpers/test-data.helper");

test.describe("Contact List", () => {
  test("should display stats cards", async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.statsGrid).toBeVisible();
    await expect(contactsList.statsCards).toHaveCount(4);
    await expect(contactsList.statTotal).toBeVisible();
    await expect(contactsList.statRecent).toBeVisible();
    await expect(contactsList.statFavorites).toBeVisible();
    await expect(contactsList.statCompanies).toBeVisible();
  });

  test("should display table with correct column headers", async ({
    contactsList,
  }) => {
    await contactsList.goto();
    const headers = await contactsList.getColumnHeaders();
    expect(headers).toEqual(["Name", "Email", "Phone", "Company", "Actions"]);
  });

  test("should display contacts in table rows", async ({ contactsList }) => {
    await contactsList.goto();
    const rowCount = await contactsList.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should show "All Contacts" section title', async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.sectionTitle).toHaveText("All Contacts");
  });

  test("should navigate to contact detail on name click", async ({
    apiHelper,
    contactsList,
  }) => {
    const data = generateMinimalContact();
    const created = await apiHelper.createContact(data);
    const fullName = `${data.first_name} ${data.last_name}`;

    // Full reload to bust RTK Query cache after API creation
    await contactsList.page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await contactsList.page.reload({ waitUntil: 'networkidle' });
    await contactsList.tableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    await contactsList.clickContact(fullName);
    await contactsList.page.waitForURL(/\/contacts\/.+/);

    await apiHelper.deleteContact(created.id).catch(() => {});
  });

  test("should navigate to edit on edit action click", async ({
    apiHelper,
    contactsList,
  }) => {
    const data = generateMinimalContact();
    const created = await apiHelper.createContact(data);
    const fullName = `${data.first_name} ${data.last_name}`;

    // Full reload to bust RTK Query cache after API creation
    await contactsList.page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await contactsList.page.reload({ waitUntil: 'networkidle' });
    await contactsList.tableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    await contactsList.clickEditAction(fullName);
    await contactsList.page.waitForURL(/\/contacts\/.+\/edit/);

    await apiHelper.deleteContact(created.id).catch(() => {});
  });

  test("should show confirm dialog on delete action click", async ({
    apiHelper,
    contactsList,
  }) => {
    const data = generateMinimalContact();
    const created = await apiHelper.createContact(data);
    const fullName = `${data.first_name} ${data.last_name}`;

    // Full reload to bust RTK Query cache after API creation
    await contactsList.page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await contactsList.page.reload({ waitUntil: 'networkidle' });
    await contactsList.tableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    await contactsList.clickDeleteAction(fullName);
    await expect(contactsList.confirmDialog).toBeVisible();

    await contactsList.cancelDelete();
    await apiHelper.deleteContact(created.id).catch(() => {});
  });

  test("should cancel delete and keep contact", async ({
    apiHelper,
    contactsList,
  }) => {
    const data = generateMinimalContact();
    const created = await apiHelper.createContact(data);
    const fullName = `${data.first_name} ${data.last_name}`;

    // Full reload to bust RTK Query cache after API creation
    await contactsList.page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await contactsList.page.reload({ waitUntil: 'networkidle' });
    await contactsList.tableRows.first().waitFor({ state: 'visible', timeout: 10000 });
    const countBefore = await contactsList.getRowCount();

    await contactsList.clickDeleteAction(fullName);
    await contactsList.cancelDelete();
    await expect(contactsList.confirmDialog).not.toBeVisible();
    const countAfter = await contactsList.getRowCount();
    expect(countAfter).toBe(countBefore);

    await apiHelper.deleteContact(created.id).catch(() => {});
  });

  test('should display page title "Contacts" in topbar', async ({
    contactsList,
  }) => {
    await contactsList.goto();
    const title = await contactsList.getPageTitle();
    expect(title).toBe("Contacts");
  });
});
