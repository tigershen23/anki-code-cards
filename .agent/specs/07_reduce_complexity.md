# Human

Okay, we can consider the design locked and the application feature complete at this point. Now let's take a look at the code we've written in order to accomplish it. How can we reduce the complexity? What can we improve? And overall, how can we make it so that this is a really nice, clean implementation of the problem with no fluff or anything?

Anything unnecessary? A few things I can think of based on skimming are really complex stuff. These should have explanatory comments or examples. We should make sure wherever relevant we're using the base UI components and not redoing CSS ourselves with Tailwind. You should know what is available through shadcn, and make sure you're not duplicating anything. In addition, just go through all the code like an absolute artist and expert and come up with a laundry list of improvements that could be made. Then we can go through together and filter and come up with a plan for tightening this codebase.

---

# Agent
## Goal
Reduce structural complexity and duplication across the app while keeping behavior and output stable. Refactors can be aggressive, but we avoid new tests/docs and keep the user‑visible behavior consistent with current e2e fixtures.

## Constraints (Important)
- E2E fixtures compare the clipboard HTML output as a string. The rendering output must remain byte‑for‑byte identical unless we explicitly decide to update fixtures.
- The tests select `.editor-textarea` and `.preview-code`. Keep those selectors or update tests (but you asked for no test work, so we should preserve them).
- Undo behavior must remain solid after we replace `document.execCommand`. We’ll use a modern, explicit insertion path and validate undo/redo for the editor behaviors.

## Additional Research Notes
- `render.ts` is doing five jobs in one place: cloze marker encoding/decoding, Shiki cleanup, code rendering, prose rendering, and output assembly.
- `EditorPanel` and `useKeyboardShortcuts` both implement text insertion and selection changes (duplicated `replaceRange`/`execCommand` logic).
- `useKeyboardShortcuts` repeats 10+ `useHotkeys` registrations. The library accepts an array of keys and exposes `hotkeysEvent.hotkey`, so we can consolidate while keeping the rules‑of‑hooks intact.
- `detectCodeContext` already returns `lineStart`, but call sites recompute it, suggesting cleanup opportunity.
- Unused deps in `package.json` from the template (`react-markdown`, `remark-gfm`, `next-themes`). Keep `class-variance-authority` and `tw-animate-css` per updated guidance.
- Docs reference preview modes and `OutputPanel` that are not present in code. This is documentation drift; if we keep scope to application code, we should not touch README for now.

## High-Value Cleanup Targets
- Consolidate all textarea edits into a single, well‑named module so editor behavior is readable and shared.
- Decompose the rendering pipeline into small files with clear responsibilities and shared style constants.
- Reduce hotkey boilerplate and share clipboard logic between toolbar and hotkeys.
- Standardize small UI patterns (panel headers, buttons) using shadcn/base‑ui to avoid bespoke styling where we already have primitives.

## Proposed Implementation Plan
1. **Centralize DOM text mutation into a single helper (execCommand‑free)**
   - Create `src/lib/textareaMutations.ts` with `replaceRange`, `insertText`, and `setSelection` implemented via `HTMLTextAreaElement.setRangeText`.
   - Dispatch an `InputEvent` with `inputType`/`data` so React and the browser update undo history consistently.
   - Update `EditorPanel` and `useKeyboardShortcuts` to use these helpers (no direct DOM mutation in components).
   - Validate selection ranges and undo/redo for: insert text, replace range, indent/dedent, and auto‑indent.

2. **Extract editor actions as pure functions**
   - New `src/lib/editorActions.ts` for logic like `indentSelection`, `dedentSelection`, `insertNewlineWithIndent`, `autoDedentClosing`, `insertClozeAtSelection`, `insertCommentCloze`.
   - Each action accepts `(text, selectionStart, selectionEnd)` and returns `{ text, selectionStart, selectionEnd }`.
   - `EditorPanel` uses these actions and then applies the result via `textareaMutations`. This removes complex logic from the component and makes behavior easier to reason about.
   - Use `textarea.value` as source of truth in the key handler to avoid stale state drift.

3. **Consolidate hotkeys**
   - Use one `useHotkeys` call for `mod+shift+1..9` with `keys` as an array, switch on `hotkeysEvent.hotkey` to get the cloze number.
   - Keep `mod+shift+k`, `mod+shift+/`, and `mod+enter` in a small, fixed set of hooks (constant, not conditional).
   - Move the HTML copy logic into a `useCopyHtml` hook or `copyHtml()` helper shared by Toolbar and hotkeys.

4. **Split `render.ts` into focused modules**
   - Create `src/lib/render/markers.ts` with the ZWS protocol, encoding/decoding, and marker cleanup.
   - Create `src/lib/render/code.ts` for Shiki handling and pre/code inline style templates.
   - Create `src/lib/render/prose.ts` for inline markdown transforms and paragraph wrapping.
   - Create `src/lib/render/styles.ts` for shared inline style strings so preview and output stay consistent.
   - Keep `src/lib/render.ts` as a thin orchestrator: parse blocks, map to renderer, join, and wrap.
   - Goal: preserve the exact output string (style order, punctuation, whitespace) so fixtures continue to pass.

5. **UI micro‑components to reduce duplication**
   - Introduce a `PanelHeader` component for the Editor/Preview header bars.
   - Add a shadcn‑style `Button` in `src/components/ui/button.tsx` and use it for the toolbar action to standardize on shadcn patterns (consistent with keeping `class-variance-authority`).
   - Keep `.editor-textarea` and `.preview-code` class names intact.

6. **Dependency cleanup (approved)**
   - Remove `react-markdown`, `remark-gfm`, `next-themes` if still unused after refactor.
   - Keep `class-variance-authority` and `tw-animate-css`.


## Tricky Areas / Risks
- Replacing `document.execCommand` risks undo/redo regressions. We’re intentionally moving to `setRangeText` + `InputEvent`, so we must validate undo/redo for all editor operations.
- Marker cleanup regexes are fragile. Refactor with extreme care; keep examples and ensure the marker output remains unchanged.
- E2E fixtures are strict string comparisons. Any changes to inline styles or HTML ordering will fail tests.

## Deliverable
After refactor, the codebase should read as a small set of crisp modules with clear responsibilities:
- Rendering pipeline decomposed and well‑named.
- Editor behaviors in pure functions, DOM mutations in one place.
- Hotkeys and clipboard logic centralized and minimal.
- UI components consistent with shadcn/base‑ui and minimal bespoke styling.

If you want me to emphasize any specific cleanup target or avoid any optional steps, say the word and I’ll tune the plan before implementation.

# Implementation
- Centralized textarea mutations in `src/lib/textareaMutations.ts` using `setRangeText` plus dispatched input events; editor key handling and hotkeys now apply pure action results.
- Added `src/lib/editorActions.ts` for indentation, newline, cloze, and comment-cloze actions; used `detectCodeContext` line start to avoid recomputation.
- Split rendering into focused modules under `src/lib/render/` with shared inline style constants to keep output byte‑identical.
- Consolidated hotkey bindings (array-based digit hotkeys) and shared HTML copy logic via `src/hooks/useCopyHtml.ts`.
- Standardized panel headers and buttons with `PanelHeader` and `ui/button` components.
- Removed unused dependencies from `package.json` (lockfile unchanged).
