# Human

Research and set up https://lnai.sh/getting-started/introduction/. Use bun to add it to dev dependencies.For now we just want parity with the existing setup, so the instructions in CLAUDE.md should basically go in .ai/AGENTS.md and so forth. Add a mise task for running lnai sync and lnai validate, and set it up to run pre-commit. Also in the husky pre-commit it should just be one line `mise pre-commit`, and that should know all the things to run as pre-commit hooks. Let me know if I'm missing anything.

Full docs for lnai:

# LNAI Documentation

## Overview

LNAI is a command‑line tool that centralizes configuration for AI coding assistants. Developers often juggle multiple tools—Claude Code, Codex, Gemini CLI, OpenCode, Cursor, GitHub Copilot and Windsurf—each with its own format. This leads to duplication of rules, drift between configs and a maintenance burden. LNAI solves these problems by creating a single source of truth under a `.ai/` directory. The unified config includes:

- `config.json` – enables/disables tools and sets version‑control behavior
- `settings.json` – shared settings and permissions
- `AGENTS.md` – main project guidelines
- `rules/` – path‑specific instructions
- `skills/<name>/SKILL.md` – reusable task descriptions
- tool‑specific override directories (`.claude`, `.codex`, `.cursor`, `.gemini`, `.opencode`, `.copilot`, `.windsurf`) for custom files

When you run `lnai sync`, these source files are exported into native formats for each assistant. For example, `.claude/` exports `CLAUDE.md`, `.codex/` exports `config.toml`, Cursor generates `.mdc` rule files and Copilot generates `.instructions.md` files.

## Installation

### Requirements

- Node.js 22 or later
- pnpm (recommended) or npm

### Installation Methods

- **Global install**: `pnpm add -g lnai` or `npm install -g lnai`.
- **Dev dependency**: `pnpm add -D lnai` or `npm install -D lnai`.
- Verify installation with `lnai --version`.

## Quick Start

1. **Initialize configuration** – Run `lnai init` to generate `.ai/` with default files. Use `-y` to skip interactive prompts.
2. **Customize AGENTS.md** – Edit `.ai/AGENTS.md` to describe your project’s guidelines (architecture, coding style, commands, etc.).
3. **Configure settings (optional)** – Modify `.ai/settings.json` to set permissions or MCP servers. Permissions have `allow`, `ask` or `deny` lists to control operations like `Bash(git:*)` or `Bash(npm:*)`.
4. **Sync to native configs** – Run `lnai sync` to write out tool‑specific files.
5. **Validate configuration** – Use `lnai validate` to ensure configs are structurally correct.

## AGENTS.md

`AGENTS.md` is the primary instructions file. It lives at `.ai/AGENTS.md` and should contain project‑specific guidelines. Use standard Markdown; no frontmatter is required. Typical sections include:

- **Project structure & architecture** – overview of directories and packages.
- **Coding conventions** – preferred import style, naming rules, etc.
- **Technology stack & dependencies** – frameworks, languages, package managers.
- **Domain knowledge** – any context necessary for AI tools to understand the project.

A sample `AGENTS.md` might outline code style preferences (e.g., ESM imports, preferring `const` over `let`), architectural breakdown (`apps/` vs. `packages/`), and commands such as `pnpm dev` or `pnpm build`. LNAI will export `AGENTS.md` into each tool’s expected format: for Claude Code it becomes `.claude/CLAUDE.md`, for Cursor it symlinks `AGENTS.md` at project root, for Copilot it becomes `.github/copilot‑instructions.md` and for OpenCode it symlinks `AGENTS.md`.

## CLI Reference

LNAI provides three main commands:

### `lnai init`

Initializes `.ai/` configuration. Usage: `lnai init [options]`.
Options include:

| Option          | Description                            |
| --------------- | -------------------------------------- |
| `-y`, `--yes`   | Skip prompts and use defaults          |
| `--force`       | Overwrite an existing `.ai/` directory |
| `--minimal`     | Create only `config.json`              |
| `-t`, `--tools` | Enable specific tools only             |

Examples: initialize interactively; initialize non‑interactively with `-y`; create only `config.json` with `--minimal`; enable just Claude Code using `--tools claudeCode`; overwrite existing config with `--force`.

### `lnai sync`

Exports unified configuration to each tool’s native format. Usage: `lnai sync [options]`.
Options:

| Option            | Description                           |
| ----------------- | ------------------------------------- |
| `--dry-run`       | Preview changes without writing files |
| `--skip-cleanup`  | Do not delete orphaned files          |
| `-t`, `--tools`   | Sync only specified tools             |
| `-v`, `--verbose` | Show detailed output                  |

Output symbols: `+` (created), `~` (updated), `-` (deleted), `=` (unchanged). Example: `lnai sync --dry-run` previews changes; `lnai sync --tools claudeCode` syncs only Claude Code.

### `lnai validate`

Validates the structure and contents of the unified configuration. Usage: `lnai validate [options]`.
Options:

| Option          | Description                   |
| --------------- | ----------------------------- |
| `-t`, `--tools` | Validate only specified tools |

Example: `lnai validate` validates all configurations; `lnai validate --tools claudeCode` validates only Claude Code.

## Configuration Files

LNAI uses two JSON files:

### `config.json`

Located at `.ai/config.json`, it controls which tools are enabled and whether their generated files should be tracked in version control. The schema has a `tools` object where each key (e.g., `claudeCode`, `opencode`, `cursor`, `copilot`, `windsurf`, `gemini`, `codex`) contains:

- `enabled` (boolean): whether to sync configuration to the tool.
- `versionControl` (boolean): whether to commit generated files.

If `config.json` is missing, all tools are synced by default. Setting `versionControl` to `true` will commit generated files; otherwise they remain in `.gitignore`.

### `settings.json`

Located at `.ai/settings.json`, this file defines shared settings. The main sections are:

- **Permissions** – control what operations AI tools can perform. Each permission uses `Tool(pattern)` syntax where `Tool` is one of `Bash`, `Read`, `Write` or `Edit`. Levels:
  - `allow` – operation runs automatically.
  - `ask` – user confirmation required.
  - `deny` – operation is blocked.

  Example: `"allow": ["Bash(git:*)"]`, `"ask": ["Bash(npm:*)"]`, `"deny": ["Read(.env)"]`.

- **mcpServers** – define Memory Control Plane servers. Example: a `memory` server uses command `npx` and args `["-y","@anthropic/mcp-server-memory"]`.

If you omit `settings.json` the tool will use sensible defaults.

## Overrides

File overrides allow tool‑specific files to take precedence over generated content. Place override files in the appropriate directory under `.ai/`:

```
.ai/
├── .claude/       # Claude Code overrides
├── .codex/        # Codex overrides
├── .cursor/       # Cursor overrides
├── .gemini/       # Gemini CLI overrides
├── .opencode/     # OpenCode overrides
├── .windsurf/     # Windsurf overrides
└── .copilot/      # GitHub Copilot overrides
```

Each file in `.ai/.<tool>/path` is symlinked to the tool’s output directory. For example, `.ai/.claude/settings.json` replaces `.claude/settings.json`. When an override exists at the same path as a generated file, the override is used and the generated file becomes a symlink to the override. This lets you customize individual files while still benefiting from automated sync.

## Rules

Rules define path‑specific instructions for certain files or directories. They live under `.ai/rules/*.md`. Each rule file must have YAML frontmatter with a `paths` array indicating which files it applies to:

```yaml
---
paths:
  - "src/components/**/*.tsx"
---
# Component Guidelines

Components in this directory should:
  - Use functional components with hooks
  - Export a default component
  - Include TypeScript interfaces
```

The schema is simple: a `paths` array with at least one entry. Path patterns support glob syntax (e.g., `src/**/*.ts` matches all `.ts` files in `src`; `*.config.js` matches config files in the root; `**/*.test.ts` matches all test files).

### Export Mapping and Format Differences

- **Claude Code & OpenCode** – rules directory is symlinked directly into `.claude/rules/` or `.opencode/rules/`.
- **Cursor** – rules are converted to `.mdc` format with frontmatter keys `description`, `globs` and `alwaysApply`.
- **Copilot** – rules become `.github/instructions/<name>.instructions.md` with frontmatter fields `applyTo` and `description`.

## Skills

Skills represent reusable capabilities that AI tools can invoke. They are stored under `.ai/skills/<skill-name>/SKILL.md`. Each skill must have YAML frontmatter with `name` and `description`, followed by markdown content. For example:

````yaml
---
name: deploy
description: Deploy the application to production
---
# Deploy Skill
## Steps
1. Run the test suite
2. Build the application
3. Deploy to production environment

## Commands
```bash
pnpm test
pnpm build
pnpm deploy:prod
````

```

The schema requires both `name` and `description`. The directory can contain multiple skills like `deploy`, `review` or `test`, each with its own `SKILL.md` file:contentReference[oaicite:18]{index=18}. Skills are referenced by tools that support skill invocation.

## Summary

LNAI streamlines managing multiple AI coding assistants by centralizing configuration in a single `.ai/` directory. By defining project guidelines (`AGENTS.md`), enabling tools in `config.json`, setting permissions and shared options in `settings.json`, writing path‑based rules and reusable skills, and handling tool‑specific overrides, you can maintain consistency across assistants. The CLI (`lnai init`, `sync`, and `validate`) automates creation, export and verification of these configurations.
```

---

# Agent

## Goal

Set up LNAI as the single source of truth for AI assistant configs. Use `.ai/AGENTS.md` (seeded from current `CLAUDE.md`) and sync to Claude Code, Codex, Cursor, and OpenCode. Add a `mise lnai` task that runs `lnai validate` then `lnai sync`. Make Husky pre-commit a single line: `mise pre-commit`, and have `mise pre-commit` run the existing hooks plus `mise lnai`.

## Research Summary

- Current canonical instructions live in `CLAUDE.md` and `AGENTS.md` at repo root, with no `.ai/` directory yet.
- Husky pre-commit currently runs `mise fix` and `mise test:e2e`.
- `mise.toml` defines tasks for lint/format/typecheck/tests but no `pre-commit` or `lnai` task.
- LNAI expects `.ai/AGENTS.md` as the source of truth and will export tool-native formats when `lnai sync` is run.

## Implementation Approach

1. **Install lnai (dev dependency)**
   - Add `lnai` to `devDependencies` using Bun.
   - Verify `lnai --version` in the plan (optional execution later).

2. **Add `mise setup` task**
   - Add `tasks.setup` in `mise.toml` that:
     - Checks if `bun` is installed; errors with helpful message if not.
     - Runs `bun install`.
     - Runs `lnai sync`.
   - This is the one-stop command for new contributors to get started.

3. **Initialize `.ai/` configuration**
   - Run `lnai init -y` to generate `.ai/` with defaults.
   - Create/update `.ai/config.json` to enable only:
     - `claudeCode`
     - `codex`
     - `cursor`
     - `opencode`
   - Set `versionControl` to `true` only for `claudeCode` (other tools remain `false`).
   - Keep `.ai/settings.json` at defaults unless the spec requires permissions.

4. **Seed `.ai/AGENTS.md` from `CLAUDE.md`**
   - Copy the entire contents of `CLAUDE.md` into `.ai/AGENTS.md`.
   - Treat `.ai/AGENTS.md` as canonical going forward.
   - Decide whether to keep root `AGENTS.md`/`CLAUDE.md` as generated outputs:
     - Preferred: let `lnai sync` generate tool-native files and keep root files in sync.
     - If `lnai` expects symlinked outputs, ensure they match the tool’s spec.

5. **Configure overrides if needed**
   - If we must keep any tool-specific extra files (e.g., `.claude/settings.json`), place overrides in `.ai/.claude/` or `.ai/.codex/`.
   - Otherwise, rely on generated outputs only.

6. **Wire up `mise lnai` task**
   - Add a `tasks.lnai` in `mise.toml`:
     - Run `lnai validate`
     - Then `lnai sync`
   - Use a simple shell block to fail fast on validate errors.

7. **Add `mise pre-commit` task**
   - Add `tasks.pre-commit` in `mise.toml` to run:
     - `mise fix`
     - `mise test:e2e`
     - `mise lnai`
   - Keep the order consistent with the current pre-commit expectations (fix + e2e), then lnai validation/sync.

8. **Update Husky**
   - Change `.husky/pre-commit` to a single line: `mise pre-commit`.

9. **Run `lnai sync` and commit outputs**
   - After `.ai` is prepared, run `lnai sync` (via `mise lnai`).
   - Ensure generated outputs for:
     - Claude Code: `.claude/CLAUDE.md` and any rules/overrides
     - Codex: `.codex/config.toml` (per lnai)
     - Cursor: generated `.mdc` rules or `AGENTS.md` linkage (per lnai)
     - OpenCode: `.opencode/` outputs
   - Verify files are tracked in git if `versionControl` is true.

## Files & Changes

- `package.json`: add `lnai` to `devDependencies`.
- `.ai/`: new directory with `config.json`, `AGENTS.md`, optional `settings.json`.
- `.ai/AGENTS.md`: content copied from `CLAUDE.md`.
- `mise.toml`: add `tasks.setup`, `tasks.lnai`, and `tasks.pre-commit`.
- `.husky/pre-commit`: replace with `mise pre-commit`.
- Tool outputs (`.claude/`, `.codex/`, `.cursor/`, `.opencode/`): generated by `lnai sync` and committed if configured.

## Tricky/Decision Points

- **Source of truth**: `.ai/AGENTS.md` is canonical; root `CLAUDE.md` may become generated output. Avoid manual edits in generated files.
- **Cursor behavior**: LNAI may output `.mdc` rules; verify that `AGENTS.md` is mapped correctly to Cursor’s format and is version controlled.
- **Codex config**: confirm LNAI generates `.codex/config.toml` and that it matches Codex expectations.

## Validation

- `mise setup` should work on a fresh clone (after mise is available).
- `lnai validate` should pass before `lnai sync`.
- Confirm `mise pre-commit` runs: fix, test:e2e, lnai validate+sync.
- Check that generated files are present and tracked.

# Implementation
- Added `lnai` as a Bun dev dependency (updates to `package.json` and `bun.lock`).
- Created `.ai/` as the source of truth: `AGENTS.md` seeded from `CLAUDE.md`, `config.json` enabling Claude Code/Codex/Cursor/OpenCode, plus `.ai/rules/bun.md` and Claude overrides in `.ai/.claude/`.
- Added `mise` tasks: `setup` (install + sync), `lnai` (validate + sync), and `pre-commit` (fix, e2e, lnai).
- Updated `.husky/pre-commit` to a single line: `mise pre-commit`.

Notes:
- `versionControl` is set to `true` only for `claudeCode` in `.ai/config.json` per the spec plan; adjust if you want other tool outputs tracked.
- Did not run `lnai init` or `lnai sync` during implementation; the new tasks cover those steps.
