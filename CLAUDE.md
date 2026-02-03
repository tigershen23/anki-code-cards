# Anki Code Cards

A cloze card editor for Anki with syntax-highlighted code. Built with React and Bun.

## Architecture Overview

```
src/
├── frontend.tsx          # App entry, mobile detection, providers
├── context/
│   └── EditorContext.tsx # Global state: content, preview mode, Shiki highlighter
├── components/
│   ├── EditorPanel.tsx   # Textarea with Tab/Enter handling
│   ├── PreviewPanel.tsx  # Live preview with mode switching
│   ├── OutputPanel.tsx   # Collapsible HTML output
│   ├── Toolbar.tsx       # Buttons, shortcuts help overlay
│   └── MobileNotSupported.tsx
├── hooks/
│   └── useKeyboardShortcuts.ts  # All hotkeys via react-hotkeys-hook
├── lib/
│   ├── cloze.ts          # Cloze parsing, extraction, manipulation
│   ├── parser.ts         # Split content into prose/code blocks
│   └── render.ts         # HTML generation for preview and output
└── styles.css            # Catppuccin Latte theme variables
```

## Key Concepts

### Cloze Placeholder System

The trickiest part of this codebase. Cloze markers (`{{c1::content}}`) must survive Shiki's tokenization intact. The solution:

1. **Before Shiki**: Replace cloze markers with zero-width space placeholders
2. **Run Shiki**: Tokenize the code (placeholders pass through as text)
3. **After Shiki**: Replace placeholders with either:
   - Raw cloze markers (for Anki output)
   - Styled spans (for preview rendering)

See `src/lib/render.ts` for the implementation. The placeholders use `\u200B` (zero-width space) which is invisible but survives HTML encoding.

### Preview Modes

- **Edit**: Shows cloze content with colored background and `c1` badge
- **Hidden**: Active cloze shows `[...]` or `[hint]`, others show with dashed underline
- **Revealed**: Active cloze highlighted green, others dashed underline

### Output HTML

Must be self-contained with ALL styles inline. No `<style>` blocks, no class names, no external resources. Anki processes cloze markers FIRST, then renders HTML - so markers can wrap across `<span>` tags.

## Common Pitfalls

### usehooks-ts v3 API Changes

The library renamed several hooks:

- `useDebounce` → `useDebounceValue` (returns `[value, setValue]` tuple)
- Check exports before using: `grep "export" node_modules/usehooks-ts/dist/index.d.ts`

### Shiki Type Conflicts

The `shiki/bundle/web` package has different types than the main `shiki` package. We use a minimal `ShikiHighlighter` interface in `EditorContext.tsx` to avoid conflicts:

```ts
export interface ShikiHighlighter {
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
}
```

Don't import `Highlighter` from `shiki` directly.

### Array Index Access

TypeScript strict mode flags `array[index]` as possibly undefined. Always add null checks:

```ts
// Bad
const mode = modes[nextIndex];
setMode(mode);

// Good
const mode = modes[nextIndex];
if (mode) setMode(mode);
```

### Regex Capture Groups

Capture groups from `RegExp.exec()` can be undefined even when matched. Always provide defaults:

```ts
const content = match[2] ?? "";
```

## Development

### Dev Server (PM2-managed)

```bash
mise start     # Start server
mise stop      # Stop server
mise restart   # Restart server
mise logs      # Tail logs
```

### Testing

```bash
mise test        # Unit tests (bun test)
mise test:e2e    # Playwright tests
mise healthcheck # Quick sanity (~1.3s)
```

### Code Quality

Checks run automatically via agent hooks after file edits:

```bash
mise typecheck   # tsgo --noEmit
mise lint:fix    # oxlint --fix-dangerously
mise format      # oxfmt
mise check       # All three
```

## UI Components

Uses **shadcn/ui** with **Base UI** primitives:

- Add components: `bunx --bun shadcn@latest add <component>`
- Existing: `textarea`, `sonner` (toast)
- Style with Tailwind utilities
- Catppuccin colors available as `ctp-*` (e.g., `bg-ctp-base`, `text-ctp-mauve`)

## Key Files

| File                                | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `src/lib/cloze.ts`                  | Cloze regex, parsing, position detection     |
| `src/lib/parser.ts`                 | Code fence detection, language normalization |
| `src/lib/render.ts`                 | Placeholder system, HTML generation          |
| `src/context/EditorContext.tsx`     | App state, Shiki initialization              |
| `src/hooks/useKeyboardShortcuts.ts` | All hotkey bindings                          |
| `src/styles.css`                    | Catppuccin Latte CSS variables               |
| `tests/cloze.test.ts`               | Cloze parser tests (24 tests)                |
| `tests/parser.test.ts`              | Content parser tests (21 tests)              |

## Supported Languages

Shiki is configured for: `typescript`, `tsx`, `javascript`, `jsx`, `css`, `scss`, `html`

Language aliases in parser: `ts` → typescript, `js` → javascript, `react` → tsx

## Parallel Development

Never freak out if you see changes unrelated to the changes you're making in the Git tree or otherwise. There is often parallel work happening on this repository and it's totally fine for there to be other changes. Just focus on the changes that you're making.

## Imported Rules

@.claude/rules/bun.md
