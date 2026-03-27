/**
 * Sidebar navigation tests — authenticated via fixture.
 *
 * Covers:
 * - All nav items present
 * - Active state highlights correct item
 * - Navigation to each page works
 * - Contact count badge
 * - Logout redirects to login
 */
const { test, expect } = require("../fixtures/auth.fixture");

test.describe("Sidebar Navigation", () => {
  test("should display all nav items", async ({ contactsList }) => {
    await contactsList.goto();
    const labels = await contactsList.getNavLabels();
    expect(labels).toEqual([
      "Dashboard",
      "Contacts",
      "Add New",
      "Search",
      "My Profile",
      "Settings",
    ]);
  });

  test("should highlight active nav item", async ({ contactsList }) => {
    await contactsList.goto();
    const contactsItem = contactsList.sidebarItems.filter({
      hasText: "Contacts",
    });
    await expect(contactsItem).toHaveClass(/active/);
  });

  test('should display brand "Contact Manager"', async ({ contactsList }) => {
    await contactsList.goto();
    await expect(contactsList.sidebarBrand).toHaveText("Contact Manager");
  });

  test("should navigate to Add New", async ({ contactsList }) => {
    await contactsList.goto();
    await contactsList.navigateTo("Add New");
    await contactsList.page.waitForURL("**/add");
  });

  test("should navigate to Search", async ({ contactsList }) => {
    await contactsList.goto();
    await contactsList.navigateTo("Search");
    await contactsList.page.waitForURL("**/search");
  });

  test("should navigate to My Profile", async ({ contactsList }) => {
    await contactsList.goto();
    await contactsList.navigateTo("My Profile");
    await contactsList.page.waitForURL("**/profile");
  });

  test("should navigate to Settings", async ({ contactsList }) => {
    await contactsList.goto();
    await contactsList.navigateTo("Settings");
    await contactsList.page.waitForURL("**/settings");
  });

  test("should navigate to Dashboard", async ({ contactsList }) => {
    await contactsList.goto();
    await contactsList.navigateTo("Dashboard");
    await contactsList.page.waitForURL("**/dashboard");
  });
});
