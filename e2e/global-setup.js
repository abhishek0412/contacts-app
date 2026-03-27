/**
 * Global Setup — runs once before all tests.
 *
 * 1. Validates credentials are set
 * 2. Verifies the app is reachable
 *
 * Auth is handled per-worker in auth.fixture.js (one login per Playwright
 * worker process, shared across all tests in that worker). This keeps
 * Firebase API calls to a minimum while ensuring tokens are always fresh.
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const AUTH_DIR = path.join(__dirname, "..", ".auth");

async function globalSetup() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL and E2E_PASSWORD must be set in .env for e2e tests",
    );
  }

  // Ensure .auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Verify the app is reachable
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/login`, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    console.log("[global-setup] App reachable, credentials configured.");
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
