class ContactsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator("h2", { hasText: "Contacts" });
    this.searchInput = page.locator(".search-input");
    this.contactItems = page.locator(".contact-item");
    this.emptyState = page.locator(".empty-state");
    this.pagination = page.locator(".pagination");
    this.prevButton = page.locator(".page-btn", { hasText: "Prev" });
    this.nextButton = page.locator(".page-btn", { hasText: "Next" });
    this.pageInfo = page.locator(".page-info");
  }

  async goto() {
    await this.page.goto("/");
  }

  async search(term) {
    await this.searchInput.fill(term);
  }

  async clearSearch() {
    await this.searchInput.fill("");
  }

  async getContactNames() {
    return this.contactItems.locator("h3").allTextContents();
  }

  async deleteContact(name) {
    const item = this.contactItems.filter({ hasText: name });
    await item.locator(".btn-delete").click();
  }

  async clickContact(name) {
    const item = this.contactItems.filter({ hasText: name });
    await item.click();
  }
}

module.exports = { ContactsPage };
