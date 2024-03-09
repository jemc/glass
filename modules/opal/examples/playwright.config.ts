import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "playwright-test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}", // removes {projectName} and {platform} segments

  use: {
    baseURL: "http://127.0.0.1:8000",
    trace: "on-first-retry",
  },

  webServer: {
    command: "pnpm run start:examples",
    url: "http://127.0.0.1:8000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
