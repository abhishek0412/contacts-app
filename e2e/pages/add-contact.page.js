class AddContactPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.locator('input[placeholder="Name"]');
    this.phoneInput = page.locator('input[placeholder="Phone Number"]');
    this.submitButton = page.locator(".btn-add");
    this.nameError = page.locator(".form-group:has(input[placeholder='Name']) .field-error");
    this.phoneError = page.locator(".form-group:has(input[placeholder='Phone Number']) .field-error");
  }

  async goto() {
    await this.page.goto("/add");
  }

  async fillForm(name, phone) {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
  }

  async submit() {
    await this.submitButton.click();
  }

  async addContact(name, phone) {
    await this.fillForm(name, phone);
    await this.submit();
  }
}

module.exports = { AddContactPage };
