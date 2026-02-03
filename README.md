# Anki Code Cards

A local web app for authoring Anki Cloze deletion cards with syntax-highlighted code. Write mixed markdown + fenced code blocks, add cloze deletions via keyboard shortcuts, preview what the card will look like, and copy the final HTML to paste into Anki.

## Features

- **Syntax highlighting** via Shiki with Catppuccin Latte theme
- **Live preview** with three modes: Edit, Hidden, Revealed
- **Keyboard shortcuts** for fast cloze insertion
- **Self-contained HTML output** with inline styles (works in Anki Desktop, AnkiMobile, AnkiDroid)

## Usage

1. Write card content in the editor (left panel)
2. Use `Cmd+Shift+K` to wrap selected text in a cloze, or `Cmd+Shift+1-9` for specific cloze numbers
3. Toggle preview modes to see how the card will look during review
4. Press `Cmd+Enter` to copy the HTML
5. Paste into Anki's Text field in the HTML editor(Cloze note type)

### Keyboard Shortcuts

| Shortcut        | Action                                        |
| --------------- | --------------------------------------------- |
| `Cmd+Shift+K`   | Insert new cloze (auto-increments)            |
| `Cmd+Shift+1-9` | Insert specific cloze number                  |
| `Cmd+Shift+/`   | Insert comment cloze above current line       |
| `Cmd+Enter`     | Copy HTML to clipboard                        |
| `Cmd+Shift+P`   | Cycle preview mode (Edit → Hidden → Revealed) |
| `Tab`           | Insert 2 spaces / indent selected lines       |
| `Shift+Tab`     | Dedent selected lines                         |

## Development

### Setup

```bash
bun install
mise start
```

### Commands

```bash
mise start       # Start dev server (PM2)
mise stop        # Stop dev server
mise restart     # Restart dev server
mise logs        # Tail server logs

mise test        # Run unit tests
mise test:e2e    # Run Playwright tests
mise healthcheck # Quick sanity check (~1.3s)

mise typecheck   # Type check with tsgo
mise lint:fix    # Lint with oxlint
mise format      # Format with oxfmt
mise check       # Run all checks
```

### Tech Stack

- **Runtime:** Bun
- **Framework:** React 19
- **Styling:** Tailwind v4 + Catppuccin Latte palette
- **UI Components:** shadcn/ui with Base UI primitives
- **Syntax Highlighting:** Shiki (web bundle)
- **Keyboard Shortcuts:** react-hotkeys-hook
- **Toasts:** Sonner
- **Testing:** Bun test + Playwright
