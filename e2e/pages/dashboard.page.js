/**
 * Dashboard Page Object
 *
 * Maps to: /dashboard
 * Covers: overview content
 */
const { BasePage } = require("./base.page");

class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.heading = page.locator("h2", { hasText: "Dashboard" });
    this.content = page.locator(".dashboard-page, .glass-card");
  }

  get path() {
    return "/dashboard";
  }
  get pageTitle() {
    return "Dashboard";
  }

  async waitForReady() {
    await super.waitForReady();
  }
}

module.exports = { DashboardPage };
