/**
 * Contacts List Page Object
 *
 * Maps to: / (root route)
 * Covers: stats cards, contact table, pagination, delete confirm dialog
 */
const { BasePage } = require("./base.page");

class ContactsListPage extends BasePage {
  constructor(page) {
    super(page);

    // Stats cards
    this.statsGrid = page.locator(".stats-grid");
    this.statsCards = page.locator(".stats-card");
    this.statTotal = this.statsCards.filter({ hasText: "Total Contacts" });
    this.statRecent = this.statsCards.filter({ hasText: "Recently Added" });
    this.statFavorites = this.statsCards.filter({ hasText: "Favorites" });
    this.statCompanies = this.statsCards.filter({ hasText: "Companies" });

    // Table
    this.sectionTitle = page.locator(".section-title");
    this.table = page.locator(".contact-table");
    this.tableHeaders = page.locator(".contact-table-th");
    this.tableRows = page.locator(".contact-table-row");
    this.emptyState = page.locator(".empty-state");

    // Pagination
    this.pagination = page.locator(".pagination");
    this.paginationInfo = page.locator(".pagination-info");
    this.pageNumbers = page.locator(".page-number");
    this.pageNext = page.locator(".page-next");

    // Confirm dialog
    this.confirmDialog = page.locator(".confirm-dialog");
    this.confirmYes = this.confirmDialog.getByRole("button", {
      name: /yes|confirm|delete/i,
    });
    this.confirmNo = this.confirmDialog.getByRole("button", {
      name: /no|cancel/i,
    });

    // Loading
    this.skeleton = page.locator(".skeleton");
    this.errorMessage = page.locator(".error-message");
  }

  get path() {
    return "/";
  }
  get pageTitle() {
    return "Contacts";
  }

  /** Get the stat value from a stat card by label. */
  async getStatValue(label) {
    const card = this.statsCards.filter({ hasText: label });
    return card.locator(".stats-value").textContent();
  }

  /** Get all contact names visible in the table. */
  async getContactNames() {
    return this.tableRows.locator(".contact-name-link span").allTextContents();
  }

  /** Get all column headers. */
  async getColumnHeaders() {
    return this.tableHeaders.allTextContents();
  }

  /** Click a contact name to navigate to detail page. */
  async clickContact(name) {
    await this.tableRows
      .filter({ hasText: name })
      .locator(".contact-name-link")
      .click();
  }

  /** Click the edit action icon for a contact. */
  async clickEditAction(name) {
    await this.tableRows
      .filter({ hasText: name })
      .locator(".action-edit")
      .click();
  }

  /** Click the view action icon for a contact. */
  async clickViewAction(name) {
    await this.tableRows
      .filter({ hasText: name })
      .locator(".action-view")
      .click();
  }

  /** Click the delete action icon for a contact. */
  async clickDeleteAction(name) {
    await this.tableRows
      .filter({ hasText: name })
      .locator(".action-delete")
      .click();
  }

  /** Confirm a pending delete action. */
  async confirmDelete() {
    await this.confirmYes.click();
  }

  /** Cancel a pending delete action. */
  async cancelDelete() {
    await this.confirmNo.click();
  }

  /** Navigate to a specific page number. */
  async goToPage(pageNum) {
    await this.pageNumbers.filter({ hasText: String(pageNum) }).click();
  }

  /** Get the pagination info text (e.g., "Showing 1–6 of 20 contacts"). */
  async getPaginationInfo() {
    return this.paginationInfo.textContent();
  }

  /** Get the count of visible table rows. */
  async getRowCount() {
    return this.tableRows.count();
  }
}

module.exports = { ContactsListPage };
