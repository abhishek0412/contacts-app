/**
 * Contact Detail Page Object
 *
 * Maps to: /contacts/:id
 * Covers: hero section, info grid (4 cards), edit/delete actions, back link
 */
const { BasePage } = require("./base.page");

class ContactDetailPage extends BasePage {
  constructor(page) {
    super(page);

    // Navigation
    this.backLink = page.locator(".btn-back-link");

    // Hero section
    this.hero = page.locator(".contact-hero");
    this.heroAvatar = page.locator(".hero-avatar");
    this.heroName = page.locator(".hero-name");
    this.heroRole = page.locator(".hero-role");
    this.heroEmail = page.locator(".hero-email");
    this.heroPhone = page.locator(".hero-phone");
    this.heroBadge = page.locator(".hero-badge");
    this.editButton = page.locator(".btn-hero-edit");
    this.deleteButton = page.locator(".btn-hero-delete");

    // Info grid — 4 cards
    this.infoGrid = page.locator(".info-grid");
    this.personalCard = this.infoGrid
      .locator(".info-card")
      .filter({ hasText: "Personal Information" });
    this.contactCard = this.infoGrid
      .locator(".info-card")
      .filter({ hasText: "Contact Information" });
    this.addressCard = this.infoGrid
      .locator(".info-card")
      .filter({ hasText: "Address" });
    this.professionalCard = this.infoGrid
      .locator(".info-card")
      .filter({ hasText: "Professional & Notes" });

    // Confirm dialog (for delete)
    this.confirmDialog = page.locator(".confirm-dialog");
    this.confirmYes = this.confirmDialog.getByRole("button", {
      name: /yes|confirm|delete/i,
    });
    this.confirmNo = this.confirmDialog.getByRole("button", {
      name: /no|cancel/i,
    });

    // Error state
    this.notFound = page.locator("text=Contact not found");
  }

  get path() {
    return "/contacts";
  }
  get pageTitle() {
    return "Contact Detail";
  }

  /** Navigate to a specific contact detail page. */
  async gotoContact(id) {
    await this.page.goto(`/contacts/${id}`);
    await this.waitForReady();
  }

  /** Override: also wait for the hero section. */
  async waitForReady() {
    await super.waitForReady();
    await this.hero.waitFor({ state: "visible", timeout: 10000 });
  }

  /** Click Edit button. */
  async clickEdit() {
    await this.editButton.click();
  }

  /** Click Delete button and confirm. */
  async deleteAndConfirm() {
    await this.deleteButton.click();
    await this.confirmYes.click();
    await this.page.waitForURL("/");
  }

  /** Click Delete button and cancel. */
  async deleteAndCancel() {
    await this.deleteButton.click();
    await this.confirmNo.click();
  }

  /** Click the "← Back to Contacts" link. */
  async goBack() {
    await this.backLink.click();
    await this.page.waitForURL("/");
  }

  /** Get the full name from the hero section. */
  async getHeroName() {
    return this.heroName.textContent();
  }

  /** Get a specific field value from an info card. */
  async getInfoField(cardLocator, fieldLabel) {
    const field = cardLocator
      .locator(".info-field")
      .filter({ hasText: fieldLabel });
    return field.locator(".info-value").textContent();
  }

  /** Get personal info fields. */
  async getPersonalInfo() {
    return {
      firstName: await this.getInfoField(this.personalCard, "First Name"),
      lastName: await this.getInfoField(this.personalCard, "Last Name"),
    };
  }

  /** Get contact info fields. */
  async getContactInfo() {
    return {
      email: await this.getInfoField(this.contactCard, "Email"),
      phone: await this.getInfoField(this.contactCard, "Phone"),
    };
  }
}

module.exports = { ContactDetailPage };
