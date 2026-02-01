import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("renders the title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Anki Code Cards/);
    await expect(page.locator("h1")).toContainText("Anki Code Cards");
  });
});
