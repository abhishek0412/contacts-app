const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npm start",
      cwd: "./server-api",
      url: "http://localhost:3001/contacts",
      reuseExistingServer: true,
    },
    {
      command: "npm start",
      cwd: "./frontend",
      url: "http://localhost:3000",
      reuseExistingServer: true,
    },
  ],
});
