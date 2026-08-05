#!/usr/bin/env bash
# bump.sh — Bump matcha version across all files
# Usage: ./scripts/bump.sh <new-version>
# Example: ./scripts/bump.sh 4.1.0
#
# This script uses REGEX patterns to find version strings in each file,
# so it works even if files have drifted out of sync with package.json.
#
# Files updated:
#   package.json              "version": "x.y.z"
#   plugin.json               "version": "x.y.z" (AGY/Gemini plugin manifest)
#   gemini-extension.json     "version": "x.y.z" (Gemini extension manifest)
#   .claude-plugin/plugin.json "version": "x.y.z"
#   skills/matcha/SKILL.md    metadata.version: x.y.z (agentskills spec-compliant)
#   hooks/patterns.json       "version": "x.y.z"
#   hooks/inject-rules.js     version: "x.y.z"
#   hooks/matcha-mcp-server.js version: "x.y.z"
#   README.md                 badge + text references
#   INSTALL.md                version comment
#   tests/core.test.js        version assertion
#   docs/index.html           version badge
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
  echo "Expected format: X.Y.Z (e.g., 4.1.0, 5.0.0)"
  exit 1
fi

# ── Read current version ────────────────────────────────────────────────────

CURRENT_VERSION=$(cd "$ROOT_DIR" && node -p "require('./package.json').version")
NEW_TAG="v${NEW_VERSION}"

# Semver regex pattern — matches any x.y.z version string
# Used as fallback when CURRENT_VERSION pattern is not found
SV='[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*'

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

# ── Helper: sed wrapper (macOS/Linux compat) ────────────────────────────────

do_sed() {
  local file="$1"
  local pattern="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

# ── Helper: replace version in file ─────────────────────────────────────────
# Uses a CONTEXT-AWARE regex pattern so it only replaces the version string
# in the correct context (e.g. "version": "x.y.z") rather than relying on
# an exact CURRENT_VERSION match that breaks when files drift.

replace_version() {
  local file="$1"
  local context_pattern="$2"  # sed regex with capture group for context
  local replacement="$3"      # replacement with backreference
  local full_path="${ROOT_DIR}/${file}"

  if [ ! -f "$full_path" ]; then
    echo -e "  ${YELLOW}SKIP${NC}  ${file} (not found)"
    return
  fi

  if ! grep -qE "$(echo "$context_pattern" | sed 's|\\(||g; s|\\)||g; s|\\1||g')" "$full_path" 2>/dev/null; then
    echo -e "  ${YELLOW}SKIP${NC}  ${file} (pattern not found)"
    return
  fi

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${CYAN}DRY${NC}   ${file}"
    return
  fi

  do_sed "$full_path" "s|${context_pattern}|${replacement}|g"
  echo -e "  ${GREEN}✓${NC}     ${file}"
}

# ── Helper: simple exact replace (legacy compat) ────────────────────────────

replace_exact() {
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
    return
  fi

  do_sed "$full_path" "s|${old}|${new}|g"
  echo -e "  ${GREEN}✓${NC}     ${file}"
}

# ── Bump all files ──────────────────────────────────────────────────────────

echo -e "${CYAN}Bumping version in files...${NC}"
echo ""

# 1. package.json — "version": "x.y.z"
replace_version "package.json" \
  "\"version\": \"${SV}\"" \
  "\"version\": \"${NEW_VERSION}\""

# 2. plugin.json (AGY/Gemini plugin manifest)
replace_version "plugin.json" \
  "\"version\": \"${SV}\"" \
  "\"version\": \"${NEW_VERSION}\""

# 3. gemini-extension.json (Gemini extension manifest)
replace_version "gemini-extension.json" \
  "\"version\": \"${SV}\"" \
  "\"version\": \"${NEW_VERSION}\""

# 4. .claude-plugin/plugin.json
replace_version ".claude-plugin/plugin.json" \
  "\"version\": \"${SV}\"" \
  "\"version\": \"${NEW_VERSION}\""

# 4. skills/matcha/SKILL.md — version: x.y.z (YAML frontmatter)
replace_version "skills/matcha/SKILL.md" \
  "version: ${SV}" \
  "version: ${NEW_VERSION}"

# 5. hooks/patterns.json — "version": "x.y.z"
replace_version "hooks/patterns.json" \
  "\"version\": \"${SV}\"" \
  "\"version\": \"${NEW_VERSION}\""

# 6. hooks/inject-rules.js — version: "x.y.z"
replace_version "hooks/inject-rules.js" \
  "version: \"${SV}\"" \
  "version: \"${NEW_VERSION}\""

# 7. hooks/matcha-mcp-server.js — version: "x.y.z"
replace_version "hooks/matcha-mcp-server.js" \
  "version: \"${SV}\"" \
  "version: \"${NEW_VERSION}\""

# 8. README.md — badge image src + alt
replace_version "README.md" \
  "badge/version-${SV}" \
  "badge/version-${NEW_VERSION}"
replace_version "README.md" \
  "alt=\"v${SV}\"" \
  "alt=\"${NEW_TAG}\""

# 9. INSTALL.md — version comment
replace_version "INSTALL.md" \
  "# Version: v${SV}" \
  "# Version: ${NEW_TAG}"

# 10. tests/core.test.js — version assertion strings
replace_version "tests/core.test.js" \
  "\"${SV}\"" \
  "\"${NEW_VERSION}\""

# 11. docs/index.html — version in badge span + any other refs
replace_version "docs/index.html" \
  "v${SV}" \
  "${NEW_TAG}"

echo ""

# ── Verification ────────────────────────────────────────────────────────────

echo -e "${CYAN}Verifying all files are at ${NEW_TAG}...${NC}"
echo ""

STALE_COUNT=0
check_version() {
  local file="$1"
  local full_path="${ROOT_DIR}/${file}"
  if [ ! -f "$full_path" ]; then return; fi
  # Check for any semver that is NOT the new version
  local stale
  stale=$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+' "$full_path" | grep -v "^${NEW_VERSION}$" | grep -v '^4\.0\.0$' | head -1 || true)
  if [ -n "$stale" ]; then
    echo -e "  ${RED}STALE${NC} ${file} — found ${stale} (expected ${NEW_VERSION})"
    STALE_COUNT=$((STALE_COUNT + 1))
  else
    echo -e "  ${GREEN}✓${NC}     ${file}"
  fi
}

if [ "$DRY_RUN" = false ]; then
  check_version "package.json"
  check_version "plugin.json"
  check_version "gemini-extension.json"
  check_version ".claude-plugin/plugin.json"
  check_version "skills/matcha/SKILL.md"
  check_version "hooks/patterns.json"
  check_version "hooks/inject-rules.js"
  check_version "hooks/matcha-mcp-server.js"
  check_version "tests/core.test.js"
  echo ""

  if [ "$STALE_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  ${STALE_COUNT} file(s) still have stale versions!${NC}"
    echo ""
  fi
fi

# ── Summary ─────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run complete. No files were modified.${NC}"
  echo "Run without --dry-run to apply changes."
else
  echo -e "${GREEN}✓ Version bumped to ${NEW_TAG}${NC}"
  echo ""
  echo -e "${CYAN}Next steps:${NC}"
  echo "  1. Run: npm run build:check"
  echo "  2. Run: npm test"
  echo "  3. Commit: git add -A && git commit -m 'release: ${NEW_TAG}'"
  echo "  4. Tag: git tag ${NEW_TAG}"
  echo "  5. Push: git push && git push --tags"
fi
