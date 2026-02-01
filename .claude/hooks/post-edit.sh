#!/usr/bin/env bash
# Post-edit hook: runs lint, format, and typecheck after Edit/Write operations

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool input
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only process TypeScript/JavaScript files for lint and format
if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Run lint with auto-fix
  mise lint:fix "$file_path" 2>&1 || true

  # Run format
  mise format "$file_path" 2>&1 || true
fi

# Run typecheck (project-wide, tsgo doesn't support single-file)
mise typecheck 2>&1 || true
