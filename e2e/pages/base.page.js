/**
 * Base Page Object — parent class for all authenticated pages.
 *
 * Provides shared selectors for the app shell (sidebar, topbar, footer)
 * that persist across all pages. Domain page objects inherit from this
 * to avoid duplicating navigation and layout assertions.
 *
 * Design: Template Method pattern — subclasses override `path()` and `pageTitle()`
 * for consistent goto() and waitForReady() behavior.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Sidebar
    this.sidebar = page.locator(".sidebar");
    this.sidebarBrand = page.locator(".sidebar-title");
    this.sidebarNav = page.locator(".sidebar-nav");
    this.sidebarItems = page.locator(".sidebar-item");
    this.sidebarLogout = page.locator(".sidebar-logout");

    // TopBar
    this.topbar = page.locator(".topbar");
    this.topbarTitle = page.locator(".topbar-title");
    this.topbarSearchInput = page.locator(".topbar-search-input");
    this.topbarAvatar = page.locator(".topbar-avatar");
    this.topbarNotification = page.locator(".topbar-notification");

    // Footer
    this.footer = page.locator(".app-footer");
  }

  /** Override in subclass: the URL path for this page (e.g., '/', '/add') */
  get path() {
    return "/";
  }

  /** Override in subclass: the expected page title in the TopBar */
  get pageTitle() {
    return "";
  }

  /** Navigate to this page and wait for it to be ready. */
  async goto() {
    await this.page.goto(this.path);
    await this.waitForReady();
  }

  /** Wait for the page shell to be loaded. */
  async waitForReady() {
    await this.sidebar.waitFor({ state: "visible" });
    await this.topbar.waitFor({ state: "visible" });
  }

  /** Navigate via sidebar by clicking a nav item with the given label. */
  async navigateTo(label) {
    await this.sidebarItems.filter({ hasText: label }).click();
  }

  /** Perform a global search via the topbar search bar. */
  async globalSearch(query) {
    await this.topbarSearchInput.fill(query);
    await this.topbarSearchInput.press("Enter");
  }

  /** Get the current page title from the topbar. */
  async getPageTitle() {
    return this.topbarTitle.textContent();
  }

  /** Get sidebar nav item labels. */
  async getNavLabels() {
    return this.sidebarNav.locator(".sidebar-label").allTextContents();
  }

  /** Logout via sidebar button. */
  async logout() {
    await this.sidebarLogout.click();
    await this.page.waitForURL("**/login");
  }
}

module.exports = { BasePage };
