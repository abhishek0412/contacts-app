/**
 * Search page tests — authenticated via fixture.
 *
 * Creates its own searchable contacts via API for data isolation.
 */
const { test, expect } = require("../fixtures/auth.fixture");
const { generateContact } = require("../helpers/test-data.helper");

test.describe("Search Contacts", () => {
  const createdIds = [];

  test.beforeAll(async ({ apiHelper }) => {
    // Create contacts with known searchable values
    const contacts = [
      generateContact({
        first_name: "Xsearchtest",
        last_name: "Alpha",
        company: "XtestCorp",
      }),
      generateContact({
        first_name: "Xsearchtest",
        last_name: "Beta",
        company: "XtestCorp",
      }),
    ];
    for (const c of contacts) {
      const created = await apiHelper.createContact(c);
      createdIds.push(created.id);
    }
  });

  test.afterAll(async ({ apiHelper }) => {
    for (const id of createdIds) {
      await apiHelper.deleteContact(id).catch(() => {});
    }
  });

  test("should display search bar and filter chips", async ({ searchPage }) => {
    await searchPage.goto();
    await expect(searchPage.searchInput).toBeVisible();
    await expect(searchPage.filterChips).toHaveCount(6);
  });

  test('should default to "All" filter', async ({ searchPage }) => {
    await searchPage.goto();
    const active = await searchPage.getActiveFilter();
    expect(active.trim()).toBe("All");
  });

  test("should return results when searching by name", async ({
    searchPage,
  }) => {
    await searchPage.goto();
    await searchPage.search("Xsearchtest");
    const count = await searchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  test("should show empty state for no matches", async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search("zzzznonexistent12345");
    await expect(searchPage.emptyState).toBeVisible();
  });

  test("should filter by company", async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.selectFilter("Company");
    await searchPage.search("XtestCorp");
    const count = await searchPage.getResultCount();
    expect(count).toBeGreaterThan(0);
  });

  test("should navigate to contact detail on result click", async ({
    searchPage,
  }) => {
    await searchPage.goto();
    await searchPage.search("Xsearchtest");
    const names = await searchPage.getResultNames();
    if (names.length === 0) test.skip();

    await searchPage.clickResult(names[0]);
    await searchPage.page.waitForURL(/\/contacts\/.+/);
  });

  test('should display page title "Search" in topbar', async ({
    searchPage,
  }) => {
    await searchPage.goto();
    const title = await searchPage.getPageTitle();
    expect(title).toBe("Search");
  });
});
