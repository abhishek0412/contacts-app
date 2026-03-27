/**
 * Contact Form Page Object
 *
 * Shared page object for both Add (/add) and Edit (/contacts/:id/edit) pages.
 * Uses mode-agnostic selectors since both pages render the same ContactForm component.
 *
 * Design: Open/Closed — one page object, two test files.
 */
const { BasePage } = require("./base.page");

class ContactFormPage extends BasePage {
  constructor(page) {
    super(page);

    // Form root
    this.form = page.locator(".contact-form");

    // Section titles (for verification)
    this.sectionTitles = page.locator(".form-section-title");

    // Personal info fields
    this.firstName = page.locator("#first_name");
    this.lastName = page.locator("#last_name");
    this.dob = page.locator("#personal\\.dob");
    this.nickname = page.locator("#personal\\.nickname");
    this.gender = page.locator("#personal\\.gender");

    // Contact info fields
    this.email = page.locator("#email");
    this.phone = page.locator("#phone");
    this.altPhone = page.locator("#personal\\.alt_phone");
    this.website = page.locator("#professional\\.website");

    // Address fields
    this.street = page.locator("#address\\.street");
    this.city = page.locator("#address\\.city");
    this.state = page.locator("#address\\.state");
    this.zip = page.locator("#address\\.zip");
    this.country = page.locator("#address\\.country");

    // Professional fields
    this.company = page.locator("#company");
    this.role = page.locator("#professional\\.role");
    this.notes = page.locator("#professional\\.notes");

    // Actions
    this.cancelButton = page.locator(".btn-cancel");
    this.submitButton = page.locator(".btn-add");

    // Errors
    this.fieldErrors = page.locator(".field-error");
  }

  get path() {
    return "/add";
  }
  get pageTitle() {
    return "Add New Contact";
  }

  /** Navigate to the edit page for a specific contact. */
  async gotoEdit(contactId) {
    await this.page.goto(`/contacts/${contactId}/edit`);
    await this.waitForReady();
  }

  /** Override: wait for the form to render. */
  async waitForReady() {
    await super.waitForReady();
    await this.form.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Fill all form fields from a contact data object.
   * Matches the structure from test-data.helper.js.
   */
  async fillForm(contact) {
    // Personal
    if (contact.first_name) await this.firstName.fill(contact.first_name);
    if (contact.last_name) await this.lastName.fill(contact.last_name);
    if (contact.personal?.dob) await this.dob.fill(contact.personal.dob);
    if (contact.personal?.nickname)
      await this.nickname.fill(contact.personal.nickname);
    if (contact.personal?.gender)
      await this.gender.selectOption(contact.personal.gender);

    // Contact info
    if (contact.email) await this.email.fill(contact.email);
    if (contact.phone) await this.phone.fill(contact.phone);
    if (contact.personal?.alt_phone)
      await this.altPhone.fill(contact.personal.alt_phone);
    if (contact.professional?.website)
      await this.website.fill(contact.professional.website);

    // Address
    if (contact.address?.street) await this.street.fill(contact.address.street);
    if (contact.address?.city) await this.city.fill(contact.address.city);
    if (contact.address?.state) await this.state.fill(contact.address.state);
    if (contact.address?.zip) await this.zip.fill(contact.address.zip);
    if (contact.address?.country)
      await this.country.fill(contact.address.country);

    // Professional
    if (contact.company) await this.company.fill(contact.company);
    if (contact.professional?.role)
      await this.role.fill(contact.professional.role);
    if (contact.professional?.notes)
      await this.notes.fill(contact.professional.notes);
  }

  /** Fill only required fields (first_name, last_name, phone). */
  async fillRequiredFields(contact) {
    await this.firstName.fill(contact.first_name);
    await this.lastName.fill(contact.last_name);
    await this.phone.fill(contact.phone);
  }

  /** Submit the form. */
  async submit() {
    await this.submitButton.click();
  }

  /** Fill and submit form in one step. */
  async addContact(contact) {
    await this.fillForm(contact);
    await this.submit();
  }

  /** Click cancel. */
  async cancel() {
    await this.cancelButton.click();
  }

  /** Get all visible field error messages. */
  async getErrors() {
    return this.fieldErrors.allTextContents();
  }

  /** Get the count of visible field errors. */
  async getErrorCount() {
    return this.fieldErrors.count();
  }

  /** Get the form section titles (for structure verification). */
  async getSectionTitles() {
    return this.sectionTitles.allTextContents();
  }
}

module.exports = { ContactFormPage };
