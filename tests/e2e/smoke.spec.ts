import { expect, test } from "@playwright/test";

test.describe("Smoke", () => {
  test("renders the editor", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Anki Code Cards/);
    await expect(page.locator("textarea")).toBeVisible();
  });
});
