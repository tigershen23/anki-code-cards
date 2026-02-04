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
# Filter output to only show errors for the edited file
typecheck_output=$(mise typecheck 2>&1 || true)
if [[ -n "$typecheck_output" ]]; then
  echo "$typecheck_output" | awk -v fp="$file_path" '
    index($0, fp) { printing=1 }
    printing { print; if (/^$/) printing=0 }
  '
fi
