/**
 * Search Page Object
 *
 * Maps to: /search
 * Covers: search bar, filter chips, result cards, recent searches
 */
const { BasePage } = require("./base.page");

class SearchPage extends BasePage {
  constructor(page) {
    super(page);

    // Search bar
    this.searchInput = page.locator(".search-page-input");
    this.searchForm = page.locator(".search-page-bar");

    // Filter chips
    this.filterChips = page.locator(".filter-chip");
    this.activeFilter = page.locator(".filter-chip.active");

    // Results
    this.resultCards = page.locator(".search-result-card");
    this.resultNames = page.locator(".search-result-name");
    this.resultMeta = page.locator(".search-result-meta");
    this.matchBadge = page.locator(".search-match-badge");
    this.searchLoading = page.locator(".search-loading");
    this.emptyState = page.locator(".empty-state");

    // Recent searches
    this.recentSection = page.locator(".recent-searches");
    this.recentTitle = page.locator(".recent-title");
    this.recentItems = page.locator(".recent-item");
  }

  get path() {
    return "/search";
  }
  get pageTitle() {
    return "Search";
  }

  /** Search for a term by typing and pressing Enter. */
  async search(term) {
    await this.searchInput.fill(term);
    await this.searchInput.press("Enter");
    // Wait for results or empty state
    await this.page.waitForTimeout(500);
  }

  /** Select a filter chip by label (All, Name, Email, Phone, Company, City). */
  async selectFilter(label) {
    await this.filterChips.filter({ hasText: label }).click();
  }

  /** Get the active filter label. */
  async getActiveFilter() {
    return this.activeFilter.textContent();
  }

  /** Get all result card names. */
  async getResultNames() {
    return this.resultNames.allTextContents();
  }

  /** Get the count of result cards. */
  async getResultCount() {
    return this.resultCards.count();
  }

  /** Click a result card by contact name. */
  async clickResult(name) {
    await this.resultCards.filter({ hasText: name }).click();
  }

  /** Get recent search items. */
  async getRecentSearches() {
    return this.recentItems.allTextContents();
  }

  /** Click a recent search item. */
  async clickRecentSearch(term) {
    await this.recentItems.filter({ hasText: term }).click();
  }

  /** Clear the search input. */
  async clearSearch() {
    await this.searchInput.fill("");
  }
}

module.exports = { SearchPage };
