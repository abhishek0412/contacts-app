/**
 * Delete Contact tests — authenticated via fixture.
 *
 * Each test creates its own contact via API for isolation,
 * then navigates by ID (not by name) to avoid strict mode violations.
 */
const { test, expect } = require("../fixtures/auth.fixture");
const { generateMinimalContact } = require("../helpers/test-data.helper");

test.describe("Delete Contact", () => {
  test("should delete contact from list view", async ({
    apiHelper,
    contactsList,
  }) => {
    const data = generateMinimalContact();
    const created = await apiHelper.createContact(data);
    const fullName = `${data.first_name} ${data.last_name}`;

    await contactsList.goto();
    await contactsList.page.waitForTimeout(500);

    const countBefore = await contactsList.getRowCount();
    await contactsList.clickDeleteAction(fullName);
    await expect(contactsList.confirmDialog).toBeVisible();
    await contactsList.confirmDelete();
    await contactsList.page.waitForTimeout(1000);

    const countAfter = await contactsList.getRowCount();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test("should cancel delete from list view", async ({
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

    const countAfter = await contactsList.getRowCount();
    expect(countAfter).toBe(countBefore);

    // Cleanup
    await apiHelper.deleteContact(created.id);
  });
});
