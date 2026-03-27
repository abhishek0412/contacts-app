const { defineConfig } = require("@playwright/test");
require("dotenv").config();

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  globalSetup: "./e2e/global-setup.js",
  use: {
    baseURL: "http://localhost:3000",
    headless: !!process.env.CI,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10000,
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
