import { test, expect } from "@playwright/test"

const TEST_NAMES = ["test-sprites", "test-tile-map", "test-tile-map-offset"]

TEST_NAMES.forEach((TEST_NAME) => {
  test(TEST_NAME, async ({ page }) => {
    await page.goto(`/#${TEST_NAME}`)
    await expect(page.locator("#view")).toHaveScreenshot()
  })
})
