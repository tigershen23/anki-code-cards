/**
 * E2E fixture runner: validates preview/output HTML against golden files.
 *
 * Why: ensures rendering changes don't silently break Anki output formatting.
 */
import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Fixture = {
  name: string;
  order: number;
  input: string;
  expected: string;
  features: {
    hasCodeFence: boolean;
    hasCloze: boolean;
    hasInlineCode: boolean;
    hasBold: boolean;
    hasItalic: boolean;
    hasHr: boolean;
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesRoot = path.join(__dirname, "fixtures");

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function sanitizeHtml(value: string): string {
  let sanitized = normalizeLineEndings(value).trim();
  sanitized = sanitized.replace(/>\s+</g, "><");
  sanitized = sanitized.replace(/[ \t]+\n/g, "\n");
  return sanitized;
}

function getFeatures(input: string): Fixture["features"] {
  return {
    hasCodeFence: /```/.test(input),
    hasCloze: /{{c\d+::/.test(input),
    hasInlineCode: /`[^`]+`/.test(input),
    hasBold: /\*\*[^*]+\*\*/.test(input),
    hasItalic: /(^|[^*])\*[^*\n]+\*(?!\*)/.test(input),
    hasHr: /^---$/m.test(input),
  };
}

function normalizeInput(value: string): string {
  // Strip trailing whitespace/newlines so fixture files with a final newline
  // don't introduce an extra <br> at the end of rendered HTML.
  return value.replace(/\s+$/, "");
}

function loadFixtures(): Fixture[] {
  if (!fs.existsSync(fixturesRoot)) {
    throw new Error(`Fixtures folder not found: ${fixturesRoot}`);
  }

  const entries = fs.readdirSync(fixturesRoot, { withFileTypes: true });
  const fixtures = entries
    .filter((entry) => entry.isDirectory() && /^\d+_/.test(entry.name))
    .map((entry) => {
      const order = Number.parseInt(entry.name.split("_")[0] ?? "0", 10);
      const inputPath = path.join(fixturesRoot, entry.name, "input.md");
      const expectedPath = path.join(fixturesRoot, entry.name, "expected.html");

      if (!fs.existsSync(inputPath)) {
        throw new Error(`Missing input.md for fixture: ${entry.name}`);
      }
      if (!fs.existsSync(expectedPath)) {
        throw new Error(`Missing expected.html for fixture: ${entry.name}`);
      }

      const input = fs.readFileSync(inputPath, "utf8");
      const expected = fs.readFileSync(expectedPath, "utf8");

      return {
        name: entry.name,
        order,
        input,
        expected,
        features: getFeatures(input),
      } satisfies Fixture;
    })
    .sort((a, b) => a.order - b.order);

  if (fixtures.length === 0) {
    throw new Error("No fixtures found under tests_e2e/fixtures");
  }

  return fixtures;
}

function formatMismatch(name: string, expected: string, actual: string): string {
  const maxSnippet = 180;
  const length = Math.max(expected.length, actual.length);
  let diffIndex = 0;
  while (diffIndex < length && expected[diffIndex] === actual[diffIndex]) {
    diffIndex += 1;
  }

  const start = Math.max(0, diffIndex - 40);
  const end = Math.min(length, diffIndex + maxSnippet);
  const expectedSnippet = expected.slice(start, end);
  const actualSnippet = actual.slice(start, end);

  return [
    `Fixture ${name} HTML mismatch at index ${diffIndex}.`,
    "Expected snippet:",
    expectedSnippet || "(empty)",
    "Actual snippet:",
    actualSnippet || "(empty)",
    "Hint: update tests_e2e/fixtures/<case>/expected.html with the clipboard output.",
  ].join("\n");
}

test.describe("App E2E", () => {
  test("runs fixtures through the editor", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://localhost:3000",
    });

    const fixtures = loadFixtures();

    for (const fixture of fixtures) {
      await test.step(`fixture ${fixture.name}`, async () => {
        await page.goto("/");

        // Dismiss FTU popover if open by clicking outside
        const infoPopover = page.getByTestId("info-popover");
        if (await infoPopover.isVisible({ timeout: 500 }).catch(() => false)) {
          await page.mouse.click(10, 10);
          await expect(infoPopover).not.toBeVisible();
        }

        const editor = page.locator("textarea.editor-textarea");
        await expect(editor).toBeVisible();
        const normalizedInput = normalizeInput(fixture.input);
        await editor.fill(normalizedInput);
        await expect(editor).toHaveValue(normalizedInput);

        const preview = page.locator(".preview-code");
        await preview.waitFor({ state: "visible" });

        await expect
          .poll(async () => (await preview.innerHTML()).trim(), {
            message: `Preview did not render for fixture ${fixture.name}`,
          })
          .not.toBe("");

        if (fixture.features.hasCodeFence) {
          await expect(preview.locator("pre").first()).toBeVisible();
          await expect(preview.locator("pre code").first()).toBeVisible();
        }

        if (fixture.features.hasCloze) {
          await expect(preview.locator("span", { hasText: /c\d+/ }).first()).toBeVisible();
        }

        if (fixture.features.hasInlineCode) {
          await expect(preview.locator("p code").first()).toBeVisible();
        }

        if (fixture.features.hasBold) {
          await expect(preview.locator("strong").first()).toBeVisible();
        }

        if (fixture.features.hasItalic) {
          await expect(preview.locator("em").first()).toBeVisible();
        }

        if (fixture.features.hasHr) {
          await expect(preview.locator("hr").first()).toBeVisible();
        }

        await page.getByRole("button", { name: "Copy HTML" }).click();

        await expect
          .poll(async () => page.evaluate(() => navigator.clipboard.readText()), {
            message: `Clipboard did not populate for fixture ${fixture.name}`,
          })
          .not.toBe("");

        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        const actual = sanitizeHtml(clipboardText ?? "");
        const expected = sanitizeHtml(fixture.expected);

        if (expected.length === 0) {
          throw new Error(
            `Fixture ${fixture.name} expected.html is empty. Fill it with the clipboard output before committing.`,
          );
        }

        if (actual !== expected) {
          throw new Error(formatMismatch(fixture.name, expected, actual));
        }
      });
    }
  });
});
