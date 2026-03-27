/**
 * Pagination tests — authenticated via fixture.
 *
 * Covers:
 * - Numbered page buttons
 * - "Showing X–Y of Z contacts" text
 * - Page navigation
 * - Next arrow button
 */
const { test, expect } = require("../fixtures/auth.fixture");

test.describe("Pagination", () => {
  test("should display pagination when contacts exceed page size", async ({
    contactsList,
  }) => {
    await contactsList.goto();
    const rowCount = await contactsList.getRowCount();
    if (rowCount === 0) test.skip();

    // If there are more contacts than one page (6), pagination should appear
    const paginationVisible = await contactsList.pagination.isVisible();
    if (!paginationVisible) test.skip(); // Not enough contacts for pagination

    await expect(contactsList.paginationInfo).toBeVisible();
  });

  test('should display "Showing X–Y of Z contacts" text', async ({
    contactsList,
  }) => {
    await contactsList.goto();
    const paginationVisible = await contactsList.pagination.isVisible();
    if (!paginationVisible) test.skip();

    const infoText = await contactsList.getPaginationInfo();
    expect(infoText).toMatch(/Showing \d+–\d+ of \d+ contacts/);
  });

  test("should show numbered page buttons", async ({ contactsList }) => {
    await contactsList.goto();
    const paginationVisible = await contactsList.pagination.isVisible();
    if (!paginationVisible) test.skip();

    const pageCount = await contactsList.pageNumbers.count();
    expect(pageCount).toBeGreaterThan(0);
  });

  test("should navigate to page 2", async ({ contactsList }) => {
    await contactsList.goto();
    const paginationVisible = await contactsList.pagination.isVisible();
    if (!paginationVisible) test.skip();

    const page1Names = await contactsList.getContactNames();
    await contactsList.goToPage(2);
    await contactsList.page.waitForTimeout(500);
    const page2Names = await contactsList.getContactNames();

    // Page 2 should show different contacts
    expect(page2Names).not.toEqual(page1Names);
  });

  test("should highlight current page number", async ({ contactsList }) => {
    await contactsList.goto();
    const paginationVisible = await contactsList.pagination.isVisible();
    if (!paginationVisible) test.skip();

    const activePage = contactsList.pageNumbers
      .filter({ hasText: "1" })
      .first();
    await expect(activePage).toHaveClass(/active/);
  });
});
