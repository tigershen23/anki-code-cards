# Human

All right, let's work backwards from the goal of being able to have snapshot tests where the inputs are the contents of the editor and the outputs are the outputted HTML. That's, I think, the most robust way to verify that the actual core behavior is correct. However, right now I'm worried that there's too much of a dependency on the front end to make these tests efficient.

Can you explore and outline our options for being able to write these types of tests and basically have this whole pipeline from raw editor content all the way to output HTML without introducing or rendering the full React frontend? Intermediately, we'll need to figure out what to do with the preview. I'm not sure exactly how to handle that.

And basically, we're in a very exploratory mode here, so your agent responsible. And basically we're in a very exploratory mode here. So your agent response should ask me a lot of questions and should also outline all of the options and trade-offs.

---

# Agent

## Updated Goal

Build a single Playwright E2E test that runs against the real frontend at `http://localhost:3000`, loads test fixtures from `tests_e2e/fixtures/*/`, injects each `input.md` into the editor, clicks **Copy HTML**, reads the clipboard output, sanitizes it, and compares to `expected.html`. Also perform a moderate preview sanity check per case. This should already work with the existing husky pre commit flow. Create 10 fixture folders with `input.md` populated and `expected.html` blank.

## Constraints And Assumptions

- App is already running at `http://localhost:3000` (no auto-start).
- Clipboard is the source of truth for output HTML. No output panel exists.
- Playwright is already set up in the repo.
- Pre-commit uses Husky (wire test into the existing hook).
- Fixtures live under `tests_e2e/fixtures` with numeric ordering.
- Comparison should be robust: normalize whitespace, line endings, and HTML attribute order if needed, but keep assertions meaningful.

## Research / Context To Review

- Locate the **Copy HTML** button selector and any shortcuts in UI.
- Identify preview container and core elements to assert (e.g., code blocks, cloze badges, prose markup).
- Inspect current Playwright config and existing test patterns.
- As you go, use `bunx playwright test tests_e2e/app.spec.ts` to run the test and see the results.

## Plan (High-Level)

1. **Fixture scaffolding**
   - Create `tests_e2e/fixtures/00_{name}` … `09_{name}`, in increasing order of complexity.
   - Add `input.md` for each, covering escalating features (plain prose, cloze, code block, hints, mixed prose/code, emphasis, inline code, horizontal rule, multiple clozes, nested-ish edge cases).
   - Add empty `expected.html` files.

2. **Playwright test implementation (`tests_e2e/app.spec.ts`)**
   - Open `http://localhost:3000`.
   - Discover all fixture folders (sorted numerically).
   - For each fixture:
     - Read `input.md` and `expected.html`.
     - Focus editor and inject content (clipboard paste or direct value set + input events).
     - Preview sanity check:
       - assert preview container exists and contains expected anchors:
         - presence of code block when input has code fence
         - presence of cloze badge styling/text when input contains cloze
         - non-empty rendered HTML
     - Click **Copy HTML** button.
     - Read from clipboard via Playwright with permissions.
     - Sanitize both actual and expected HTML:
       - normalize line endings `\r\n` -> `\n`
       - trim leading/trailing whitespace
       - collapse multiple spaces where safe
       - optionally normalize attribute ordering (if needed)
     - Compare and, on failure, emit a readable diff/log message (fixture name, first differing region).

3. **Clipboard permissions**
   - Configure Playwright context permissions for `clipboard-read` and `clipboard-write` on `http://localhost:3000`.
   - Use `page.evaluate(() => navigator.clipboard.readText())` or Playwright clipboard API if available.

4. **Failure output ergonomics**
   - On mismatch, include:
     - fixture name
     - sanitized expected vs actual snippet
     - hint to update `expected.html` (user will do manually)

## Sanitization Strategy (Non-Flaky But Real)

- Always normalize:
  - line endings
  - leading/trailing whitespace
  - whitespace between tags: collapse `>   <` to `><` if needed
- Avoid overly aggressive normalization that could hide real regressions.
- Only add attribute-order normalization if real diffs appear from runtime environment.

## Preview Sanity Checks (Moderate)

- Base: preview container exists and is non-empty.
- Conditional checks based on input features:
  - Code fences -> `pre`/`code` exists.
  - Cloze markers -> element containing `c1`/`c2` badge or cloze styling exists.
  - Inline code -> `code` with inline style exists.
  - Bold/italic -> `strong`/`em` exists.

## Expected File/Folder Changes

- New fixtures: `tests_e2e/fixtures/00_...` … `tests_e2e/fixtures/09_...`
  - `input.md` populated, `expected.html` blank.
- New test: `tests_e2e/app.spec.ts`

## Open Details To Confirm As We Implement

- Exact selector or accessible name for **Copy HTML** button.
- Editor element selector (textarea or contenteditable).
- Preview container selector.
