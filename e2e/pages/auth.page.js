class AuthPage {
  constructor(page) {
    this.page = page;

    // Login page selectors
    this.emailInput = page.getByPlaceholder("you@example.com");
    this.passwordInput = page.getByPlaceholder("••••••••");
    this.signInButton = page.getByRole("button", { name: "Sign In" });
    this.forgotPasswordLink = page.getByRole("button", {
      name: "Forgot password?",
    });
    this.signUpLink = page.getByRole("link", { name: "Sign up" });
    this.githubButton = page.getByRole("button", { name: /GitHub/i });
    this.googleButton = page.getByRole("button", { name: /Google/i });
    this.loginError = page.locator(".login-error");
    this.loginTitle = page.locator(".login-header h1");
    this.loginSubtitle = page.locator(".login-subtitle");
    this.rememberMe = page.getByText("Remember me");

    // Sign Up page selectors
    this.displayNameInput = page.getByPlaceholder("John Doe");
    this.signUpEmailInput = page.locator("#signup-email");
    this.signUpPasswordInput = page.locator("#signup-password");
    this.confirmPasswordInput = page.getByPlaceholder("Re-enter your password");
    this.createAccountButton = page.getByRole("button", {
      name: "Create Account",
    });
    this.signUpError = page.locator(".login-error");
    this.fieldErrors = page.locator(".field-error-text");

    // Forgot password modal
    this.forgotModal = page.locator(".modal-overlay");
    this.forgotEmailInput = page.locator("#forgot-email");
    this.sendResetButton = page.getByRole("button", {
      name: "Send Reset Link",
    });
    this.forgotCloseButton = page.locator(".modal-close");

    // Sidebar (post-login)
    this.sidebar = page.locator(".sidebar");
    this.logoutButton = page.locator(".sidebar-logout");
  }

  async gotoLogin() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoSignUp() {
    await this.page.goto("/signup");
    await this.page.waitForLoadState("networkidle");
  }

  async signIn(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(displayName, email, password) {
    await this.displayNameInput.fill(displayName);
    await this.signUpEmailInput.fill(email);
    await this.signUpPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.createAccountButton.click();
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL("**/login");
  }
}

module.exports = { AuthPage };
