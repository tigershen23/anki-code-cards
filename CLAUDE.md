# Anki Code Cards

Cards with beautiful code in vanilla Anki. Built with React and Bun.

## UI Components

This project uses **shadcn/ui** with **Base UI** primitives (`@base-ui/react`). When building UI:

- Always reach for shadcn components first (`@/components/ui/*`)
- Add new shadcn components via `bunx --bun shadcn@latest add <component>`
- Components are unstyled by default — style with Tailwind utilities
- Refer to [ui.shadcn.com](https://ui.shadcn.com) for available components

## Development

### Dev Server (PM2-managed)

The dev server runs under PM2 so you don't need to manage it in a separate shell:

```bash
# Start server
mise start

# Stop server
mise stop

# Restart server
mise restart

# Tail logs
mise logs
```

### Testing

```bash
# Unit tests
mise test

# E2E sanity check test (requires dev server running via PM2)
mise test:e2e

# Quick healthcheck (~1.3s) - use frequently during development
mise healthcheck
```

### Code Quality

**Checks run automatically.** mise format, lint, and typecheck are executed automatically after file edits via agent hooks. You should never need to run these commands manually during normal development. The commands are still listed below for your reference

```bash
# Run all checks (typecheck, lint, format)
mise check

# Individual tools
mise typecheck    # Type checking with tsgo
mise lint:fix     # Linting with oxlint
mise format       # Format files with oxfmt
```

## Build Pipeline

- **Dev:** `bun --hot src/index.ts` (Bun.serve with HMR)
- **Prod:** `bun build ./src/index.html --outdir ./dist --minify`
- **Deploy:** GitHub Actions on push to master → GitHub Pages

## Key Files

| File                           | Purpose                        |
| ------------------------------ | ------------------------------ |
| `src/index.ts`                 | Dev server (Bun.serve)         |
| `src/frontend.tsx`             | React app entry                |
| `src/styles.css`               | Tailwind v4 stylesheet         |
| `ecosystem.config.cjs`         | PM2 process configuration      |
| `tests/e2e/smoke.spec.ts`      | Playwright smoke test          |

## Conventions

- When writing plans, use prose and instructions rather than code blocks
- Code should be written during the coding step, not the planning step

## Imported Rules

@.claude/rules/bun.md
