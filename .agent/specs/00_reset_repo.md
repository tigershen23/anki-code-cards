# Human

This is a direct clone of another repository, and I need it to be completely reset so that just the scaffolding like formatting, dev environment, and things are around and a very basic front end. But all of the files and actual code and implementation of the old project should be gotten rid of. The old project was called `keyboard_shortcut_mapper`, and the new project should be called `anki_code_cards`. There will be a lot of destructive actions, that's ok, just don't make any changes outside this repo and make sure to bust things like caches that could be interfering in the future.

---

# Agent

Plan for reset to `anki_code_cards` (scaffolding + minimal frontend only)

1) Audit and decide what to keep as scaffolding
   - Keep: tooling/config (Bun, tsconfig, lint/format hooks, Tailwind config if still desired), dev server entry `src/index.ts`, and any baseline scripts the project should retain.
   - Remove: all feature-specific code for `keyboard_shortcut_mapper` (components, contexts, data, tests, assets, docs).
   - Inventory key files to update: `package.json`, `README.md`, `ecosystem.config.cjs`, `mise.toml`, `playwright.config.ts`, `src/index.html`, `src/frontend.tsx`, any references in `scripts/` and `tests/`.

2) Global rename / string scrub
   - Search for `keyboard_shortcut_mapper` and replace with `anki_code_cards` across the repo.
   - Update project metadata (name, description, repository/homepage URLs if present).
   - Update PM2 process name in `ecosystem.config.cjs` and any scripts referencing it.

3) Remove old application code
   - Delete `src/components/`, `src/context/`, `src/data/`, `src/hooks/`, `src/utils/`, `src/types/`, and any `src/static/` assets tied to the old UI.
   - Delete tests that encode old user flows (e.g., `tests/e2e/critical-path.spec.ts`).
   - Remove old styling files (or replace with a minimal baseline).
   - Remove styled-components if present (dependencies and any usage).

4) Add minimal “scaffold” frontend
   - Create a simple React entry in `src/frontend.tsx` (or keep current entry but replace content) that renders a single-page title only.
   - Update `src/index.html` to match a new title and minimal root structure.
   - Keep Tailwind; no styled-components. Use a minimal Tailwind v4 setup with best-practice config and a single stylesheet entry.

5) Stabilize dev/test scaffolding
   - Ensure `bun --hot src/index.ts` still serves the new frontend.
   - Add a basic smoke test (Playwright) that checks the app loads and the title renders.
   - Replace the existing `scripts/` contents with a single `scripts/healthcheck.ts` for a lightweight health check (and remove any other script files).
   - Wire `mise test:e2e` to the corresponding Bun command for Playwright.
   - Wire `mise healthcheck` to run only the single Playwright smoke test.
   - Ensure scripts and config files still reference valid paths.

6) Cleanup build artifacts/caches inside repo
   - Remove `dist/`, `build/`, `.cache/`, `.bun/` or other transient folders inside the repo if present.
   - Avoid touching anything outside this repo (per request).

7) Verify
   - Run the existing healthcheck (if still desired) to confirm the dev server and basic page render.

8) Update formatting and Tailwind config
   - Configure oxfmt Tailwind class sorting in `.oxfmtrc.json` using `experimentalTailwindcss` with the project stylesheet path, `class`/`className`, `clsx`/`cn`, and `preserveWhitespace: true`.
   - Add a Tailwind v4 config following current best practices (content globs, theme extension, and CSS entry via `@import "tailwindcss";`).

9) Update README
   - Keep README minimal with a fresh description: “Cards with beautiful code in vanilla Anki.”

Title text confirmed
- Minimal UI title: “Anki Code Cards”
