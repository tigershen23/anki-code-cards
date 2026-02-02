# Human

<!-- User requirements go here -->

---

# Agent

## Code Review Plan

A systematic walkthrough of the entire codebase to understand and verify the implementation.

### Phase 1: Core Logic (src/lib/)

#### Step 1: Review cloze.ts
- Read the `ClozeMatch` interface and understand what data we track for each cloze
- Trace through `parseClozes()` regex and verify it handles: basic clozes, hints, empty content, special characters
- Verify `isInsideCloze()` correctly detects cursor position within cloze boundaries
- Check `insertClozeAtSelection()` handles both empty and non-empty selections
- Run through `tests/cloze.test.ts` to see all edge cases covered

#### Step 2: Review parser.ts
- Understand the `Block` type and how content splits into prose vs code
- Trace the `CODE_FENCE_REGEX` pattern for detecting fenced code blocks
- Verify `normalizeLanguage()` maps all expected aliases (ts, js, react, etc.)
- Check `detectCodeContext()` correctly identifies if cursor is inside a code block
- Verify `getCommentSyntax()` returns correct comment style per language
- Run through `tests/parser.test.ts` to see parsing edge cases

#### Step 3: Review render.ts
- This is the most complex file - take time to understand the placeholder system
- Trace `extractAndReplaceClozes()`: how markers become placeholders
- Trace `restoreClozesForOutput()`: how placeholders become raw markers for Anki
- Trace `renderClozesForPreview()`: how placeholders become styled spans for each mode
- Verify `highlightCode()` strips classes and adds inline styles
- Check `renderCodeBlock()` and `renderProse()` handle the full pipeline
- Verify output HTML structure matches Anki requirements (inline styles, no classes)

### Phase 2: State Management (src/context/)

#### Step 4: Review EditorContext.tsx
- Understand the `EditorState` interface and what state is shared
- Verify Shiki initialization loads correct theme and languages
- Check the `ShikiHighlighter` interface matches what we use from Shiki
- Verify `textareaRef` is properly typed and passed through context

### Phase 3: Components (src/components/)

#### Step 5: Review EditorPanel.tsx
- Trace `handleKeyDown` for Tab behavior (insert spaces, indent/dedent)
- Trace `handleKeyDown` for Enter behavior (auto-indent after brackets)
- Verify textarea ref is connected to context for keyboard shortcuts
- Check styling uses Catppuccin theme variables

#### Step 6: Review PreviewPanel.tsx
- Verify debouncing is correctly applied to content
- Check `renderContent()` is called with correct options
- Verify cloze number selector only shows in hidden/revealed modes
- Check the loading state while Shiki initializes

#### Step 7: Review OutputPanel.tsx
- Verify debouncing matches preview panel
- Check `renderContentForOutput()` produces raw cloze markers
- Verify copy functionality uses `useCopyToClipboard` correctly
- Check expand/collapse state and styling

#### Step 8: Review Toolbar.tsx
- Verify all button handlers call correct functions
- Check `handleInsertCloze()` uses textarea ref correctly
- Check `handleInsertCommentCloze()` detects language context
- Verify `cyclePreviewMode()` cycles through all three modes
- Review help overlay content matches actual shortcuts

#### Step 9: Review MobileNotSupported.tsx
- Simple component - verify it displays correctly and uses theme

### Phase 4: Keyboard Shortcuts (src/hooks/)

#### Step 10: Review useKeyboardShortcuts.ts
- Verify all shortcuts use `mod` (not `meta` or `ctrl`) for cross-platform
- Check `enableOnFormTags: ['TEXTAREA']` is set for all shortcuts
- Verify each handler matches the toolbar button handlers
- Check no shortcuts conflict with browser defaults

### Phase 5: Styling (src/styles.css)

#### Step 11: Review styles.css
- Verify all Catppuccin Latte colors are defined as CSS variables
- Check semantic variable mapping (--background, --primary, etc.)
- Verify Tailwind theme extension exposes `ctp-*` colors
- Check editor-specific styles (textarea, preview code blocks)

### Phase 6: Tests

#### Step 12: Review test coverage
- Read through `tests/cloze.test.ts` - are all parser functions tested?
- Read through `tests/parser.test.ts` - are all block types covered?
- Check `tests/e2e/smoke.spec.ts` - does it verify the app loads?
- Identify any gaps in test coverage

### Phase 7: Integration Points

#### Step 13: Review frontend.tsx
- Verify provider hierarchy (EditorProvider wraps everything)
- Check mobile detection uses correct breakpoint
- Verify Toaster is included for notifications
- Check `useKeyboardShortcuts()` is called at correct level

#### Step 14: Review index.html
- Verify no external fonts (spec requires system monospace only)
- Check stylesheet order (output.css before styles.css)

### Phase 8: Summary

#### Step 15: Document findings
- List any bugs or issues found
- List any deviations from the original spec
- List any improvements or refactors to consider
- Verify all manual test checklist items can pass

---

## Execution Notes

- Read each file in full before moving to the next
- Take notes on anything unclear or potentially buggy
- Cross-reference with the original spec in `01_first_pass.md`
- Run `mise test` and `mise healthcheck` periodically to verify nothing breaks
