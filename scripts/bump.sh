#!/usr/bin/env bash
# bump.sh — Bump matcha version across all files
# Usage: ./scripts/bump.sh <new-version>
# Example: ./scripts/bump.sh 4.1.0
#
# Files updated:
#   package.json              "version": "x.y.z"
#   .claude-plugin/plugin.json "version": "x.y.z"
#   skills/matcha/SKILL.md    version: x.y.z
#   hooks/patterns.json       "version": "x.y.z" + changelog
#   hooks/inject-rules.js     version: "x.y.z"
#   hooks/matcha-mcp-server.js version: "x.y.z"
#   README.md                 badge + text references
#   INSTALL.md                version comment
#   tests/core.test.js        version assertion
#
# Note: package-lock.json and pnpm-lock.yaml update automatically
#       when running npm/pnpm install after package.json changes.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Validation ──────────────────────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo -e "${RED}Error: Missing version argument${NC}"
  echo ""
  echo "Usage: $0 <new-version>"
  echo "Example: $0 4.1.0"
  exit 1
fi

NEW_VERSION="$1"

# Validate semver format
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format '${NEW_VERSION}'${NC}"
  echo "Expected format: X.Y.Z (e.g., 4.1.0, 5.0.0-beta.1)"
  exit 1
fi

# ── Read current version ────────────────────────────────────────────────────

CURRENT_VERSION=$(cd "$ROOT_DIR" && node -p "require('./package.json').version")
NEW_TAG="v${NEW_VERSION}"

echo -e "${CYAN}🍵 matcha version bump${NC}"
echo -e "   Current: ${YELLOW}v${CURRENT_VERSION}${NC}"
echo -e "   New:     ${GREEN}${NEW_TAG}${NC}"
echo ""

# ── Dry run check ───────────────────────────────────────────────────────────

DRY_RUN=false
if [ "${2:-}" = "--dry-run" ]; then
  DRY_RUN=true
  echo -e "${YELLOW}=== DRY RUN — no files will be modified ===${NC}"
  echo ""
fi

# ── Helper: replace in file ─────────────────────────────────────────────────

replace_in_file() {
  local file="$1"
  local old="$2"
  local new="$3"
  local full_path="${ROOT_DIR}/${file}"

  if [ ! -f "$full_path" ]; then
    echo -e "  ${YELLOW}SKIP${NC}  ${file} (not found)"
    return
  fi

  if ! grep -q "$old" "$full_path" 2>/dev/null; then
    echo -e "  ${YELLOW}SKIP${NC}  ${file} (pattern not found)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${CYAN}DRY${NC}   ${file}"
    grep -n "$old" "$full_path" | head -3 | while read -r line; do
      echo -e "         ${line}"
    done
    return
  fi

  # macOS sed requires '', Linux sed requires nothing
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|${old}|${new}|g" "$full_path"
  else
    sed -i "s|${old}|${new}|g" "$full_path"
  fi

  echo -e "  ${GREEN}✓${NC}     ${file}"
}

# ── Bump all files ──────────────────────────────────────────────────────────

echo -e "${CYAN}Bumping version in files...${NC}"
echo ""

# 1. package.json
replace_in_file "package.json" "\"version\": \"${CURRENT_VERSION}\"" "\"version\": \"${NEW_VERSION}\""

# 2. .claude-plugin/plugin.json
replace_in_file ".claude-plugin/plugin.json" "\"version\": \"${CURRENT_VERSION}\"" "\"version\": \"${NEW_VERSION}\""

# 3. skills/matcha/SKILL.md
replace_in_file "skills/matcha/SKILL.md" "version: ${CURRENT_VERSION}" "version: ${NEW_VERSION}"

# 4. hooks/patterns.json — version field
replace_in_file "hooks/patterns.json" "\"version\": \"${CURRENT_VERSION}\"" "\"version\": \"${NEW_VERSION}\""

# 5. hooks/inject-rules.js
replace_in_file "hooks/inject-rules.js" "version: \"${CURRENT_VERSION}\"" "version: \"${NEW_VERSION}\""

# 6. hooks/matcha-mcp-server.js
replace_in_file "hooks/matcha-mcp-server.js" "version: \"${CURRENT_VERSION}\"" "version: \"${NEW_VERSION}\""

# 7. README.md — badge
replace_in_file "README.md" "badge/version-${CURRENT_VERSION}" "badge/version-${NEW_VERSION}"
replace_in_file "README.md" "alt=\"v${CURRENT_VERSION}\"" "alt=\"${NEW_TAG}\""

# 8. INSTALL.md — version comment
replace_in_file "INSTALL.md" "# Version: v${CURRENT_VERSION}" "# Version: ${NEW_TAG}"

# 9. tests/core.test.js — version assertion
replace_in_file "tests/core.test.js" "\"${CURRENT_VERSION}\"" "\"${NEW_VERSION}\""

# 10. docs/index.html — version in hero + footer
replace_in_file "docs/index.html" "v${CURRENT_VERSION}" "${NEW_TAG}"

echo ""

# ── Summary ─────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run complete. No files were modified.${NC}"
  echo "Run without --dry-run to apply changes."
else
  echo -e "${GREEN}✓ Version bumped to ${NEW_TAG}${NC}"
  echo ""
  echo -e "${CYAN}Next steps:${NC}"
  echo "  1. Update changelog in hooks/patterns.json"
  echo "  2. Run: node scripts/build-adapters.js"
  echo "  3. Run: npm test"
  echo "  4. Commit: git add -A && git commit -m 'release: ${NEW_TAG}'"
  echo "  5. Tag: git tag ${NEW_TAG}"
  echo "  6. Push: git push && git push --tags"
fi
