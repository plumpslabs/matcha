#!/usr/bin/env bash
set -euo pipefail

# 🍵 matcha — install.sh
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
#   curl -fsSL ... | bash -s -- --target /path --lang typescript,react
#   curl -fsSL ... | bash -s -- --profile minimal
#   ./install.sh              # from cloned repo

GH_RAW="https://raw.githubusercontent.com/plumpslabs/matcha/main"
HERE="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")"
CLONED=false
[ -n "$HERE" ] && [ -f "$HERE/install.sh" ] && [ -f "$HERE/skills/matcha/SKILL.md" ] && CLONED=true

TARGET="${PWD}"
f=""; for a in "$@"; do [ "$f" = "--target" ] && TARGET="$a" && break; f="$a"; done

ALL_LANGS="common go typescript python php java react-native react angular nextjs nestjs nuxt tanstack redis tailwind"
LANG_FILTER=""     # --lang typescript,react
PROFILE="full"     # minimal | core | full
AUTO_DETECT=false  # auto-detect from manifests

fetch() {
  if $CLONED; then cat "$HERE/$1"; else curl -fsSL "$GH_RAW/$1"; fi
}

# ─── Argument parsing ─────────────────────────────────────────────────────────
parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --target) shift 2 ;;
      --target*) TARGET="${1#--target=}"; shift ;;
      --lang)
        LANG_FILTER="$2"; AUTO_DETECT=false
        shift 2 ;;
      --lang=*)
        LANG_FILTER="${1#--lang=}"; AUTO_DETECT=false
        shift ;;
      --profile)
        PROFILE="$2"
        shift 2 ;;
      --profile=*)
        PROFILE="${1#--profile=}"
        shift ;;
      *) shift ;;
    esac
  done
}
parse_args "$@"

# ─── Language detection ───────────────────────────────────────────────────────
detect_languages() {
  local detected="common"
  [ -f "$TARGET/package.json" ] && detected="$detected typescript"
  [ -f "$TARGET/pyproject.toml" ] || [ -f "$TARGET/requirements.txt" ] || [ -f "$TARGET/setup.py" ] && detected="$detected python"
  [ -f "$TARGET/go.mod" ] && detected="$detected go"
  [ -f "$TARGET/composer.json" ] && detected="$detected php"
  [ -f "$TARGET/pom.xml" ] || [ -f "$TARGET/build.gradle" ] || [ -f "$TARGET/build.gradle.kts" ] && detected="$detected java"

  # Framework detection from package.json
  if [ -f "$TARGET/package.json" ]; then
    local deps
    deps=$(cat "$TARGET/package.json" 2>/dev/null || echo "")
    echo "$deps" | grep -q '"react"' && [[ "$deps" != *'"react-native"'* ]] && detected="$detected react"
    echo "$deps" | grep -q '"react-native"' && detected="$detected react-native"
    echo "$deps" | grep -q '"next"' && detected="$detected nextjs"
    echo "$deps" | grep -q '"@nestjs/core"' && detected="$detected nestjs"
    echo "$deps" | grep -q '"nuxt"' || echo "$deps" | grep -q '"nuxt3"' && detected="$detected nuxt"
    echo "$deps" | grep -q '"@angular/core"' && detected="$detected angular"
    echo "$deps" | grep -q '"@tanstack/react-query"' && detected="$detected tanstack"
    echo "$deps" | grep -q '"ioredis"' || echo "$deps" | grep -q '"redis"' && detected="$detected redis"
    echo "$deps" | grep -q '"tailwindcss"' && detected="$detected tailwind"
  fi
  # Config file detection for frameworks
  [ -f "$TARGET/next.config.js" ] || [ -f "$TARGET/next.config.ts" ] && [[ "$detected" != *"nextjs"* ]] && detected="$detected nextjs"
  [ -f "$TARGET/nuxt.config.ts" ] || [ -f "$TARGET/nuxt.config.js" ] && [[ "$detected" != *"nuxt"* ]] && detected="$detected nuxt"
  [ -f "$TARGET/nest-cli.json" ] && [[ "$detected" != *"nestjs"* ]] && detected="$detected nestjs"
  [ -f "$TARGET/angular.json" ] && [[ "$detected" != *"angular"* ]] && detected="$detected angular"
  [ -f "$TARGET/tailwind.config.js" ] || [ -f "$TARGET/tailwind.config.ts" ] && [[ "$detected" != *"tailwind"* ]] && detected="$detected tailwind"
  # React detection from tsx/jsx files (check root + common subdirs)
  if [[ "$detected" != *"react"* ]] && [[ "$detected" != *"react-native"* ]]; then
    ls "$TARGET"/*.tsx "$TARGET"/*.jsx 2>/dev/null | head -1 >/dev/null && detected="$detected react" && return
    ls "$TARGET"/src/*.tsx "$TARGET"/src/*.jsx 2>/dev/null | head -1 >/dev/null && detected="$detected react" && return
    ls "$TARGET"/app/*.tsx 2>/dev/null | head -1 >/dev/null && detected="$detected react" && return
    ls "$TARGET"/pages/*.tsx "$TARGET"/pages/*.jsx 2>/dev/null | head -1 >/dev/null && detected="$detected react"
  fi

  echo "$detected"
}

# ─── Profile → language resolution ───────────────────────────────────────────
resolve_langs() {
  local profile="$1"

  case "$profile" in
    minimal)
      # common + auto-detected only
      if [ -z "$LANG_FILTER" ]; then
        LANG_FILTER=$(detect_languages)
        AUTO_DETECT=true
      fi
      ;;
    core)
      # common + 1 main language (first detected or typescript)
      if [ -z "$LANG_FILTER" ]; then
        local detected=$(detect_languages)
        local first=""
        for l in $detected; do
          [ "$l" = "common" ] && continue
          first="$l" && break
        done
        [ -z "$first" ] && first="typescript"
        LANG_FILTER="common $first"
        AUTO_DETECT=true
      fi
      ;;
    full)
      # all languages (default)
      LANG_FILTER="$ALL_LANGS"
      ;;
  esac
}

resolve_langs "$PROFILE"

# ─── Warn about invalid lang values ──────────────────────────────────────────
for lang in $LANG_FILTER; do
  valid=false
  for al in $ALL_LANGS; do [ "$lang" = "$al" ] && valid=true && break; done
  $valid || echo "  ⚠ Unknown language: $lang (ignored)"
done

# ─── Platform detection ───────────────────────────────────────────────────────
PLATFORMS=""
[ -d "$TARGET/.claude" ] && PLATFORMS="$PLATFORMS claude"
[ -d "$TARGET/.opencode" ] && PLATFORMS="$PLATFORMS opencode"
[ -d "$TARGET/.cursor" ] && PLATFORMS="$PLATFORMS cursor"
[ -d "$TARGET/.agents" ] && PLATFORMS="$PLATFORMS agents"
[ -d "$TARGET/.clinerules" ] && PLATFORMS="$PLATFORMS clinerules"
[ -d "$TARGET/.windsurf" ] && PLATFORMS="$PLATFORMS windsurf"
[ -d "$TARGET/.kiro" ] && PLATFORMS="$PLATFORMS kiro"
[ -d "$TARGET/.openclaw" ] && PLATFORMS="$PLATFORMS openclaw"
[ -d "$TARGET/.qoder" ] && PLATFORMS="$PLATFORMS qoder"
[ -d "$TARGET/.qwen" ] && PLATFORMS="$PLATFORMS qwen"

if [ -z "$PLATFORMS" ]; then
  echo "  → creating .agents/ (universal format)"
  mkdir -p "$TARGET/.agents"
  PLATFORMS="agents"
fi

AGY_GLOBAL=false
[ -d "$HOME/.gemini/antigravity-cli" ] && AGY_GLOBAL=true

# ─── Install helpers ──────────────────────────────────────────────────────────
echo "🍵 matcha install"
echo "Target: $TARGET"
$CLONED && echo "Mode: local (cloned repo)" || echo "Mode: remote (fetching from GitHub)"
echo "Profile: $PROFILE"
if [ "$PROFILE" != "full" ]; then
  echo "Auto-detected: $AUTO_DETECT"
  echo "Languages: $LANG_FILTER"
fi
echo ""

install_file() {
  local dst="$1" src="$2"
  if $CLONED && [ "$(realpath "$TARGET" 2>/dev/null)" = "$(realpath "$HERE" 2>/dev/null)" ]; then
    local abs_dst abs_target
    abs_dst="$(realpath "$dst" 2>/dev/null || echo "$dst")"
    abs_target="$(realpath "$TARGET" 2>/dev/null || echo "$TARGET")"
    case "$abs_dst" in
      "$abs_target"/*)
        echo "  ⏭ $dst (repository source file — skipped)"
        return 0
        ;;
    esac
  fi
  mkdir -p "$(dirname "$dst")"
  [ -L "$dst" ] && rm -f "$dst"
  fetch "$src" > "$dst"
  echo "  ✅ $dst"
}

install_context() { install_file "$1/AGENTS.md" "AGENTS.md"; }

install_agents() {
  local target="$1"
  mkdir -p "$target"
  for agent in matcha-planner matcha-finder matcha-auditor matcha-reviewer matcha-cleaner matcha-debugger; do
    install_file "$target/$agent.md" ".claude/agents/$agent.md"
  done
}

install_commands() {
  local target="$1"
  mkdir -p "$target"
  for cmd in why review audit intensity status; do
    install_file "$target/$cmd.md" "commands/$cmd.md"
  done
}

install_skill() { install_file "$1" "skills/matcha/SKILL.md"; }

install_rules() {
  local target="$1" ext="$2" fmt="$3"
  mkdir -p "$target"
  for lang in $LANG_FILTER; do
    # Validate against allowed list
    local valid=false
    for al in $ALL_LANGS; do [ "$lang" = "$al" ] && valid=true && break; done
    $valid || continue

    local name="matcha-$lang"
    local dst="$target/$name.$ext"
    if [ "$fmt" = "cursor_mdc" ]; then
      install_file "$dst" ".cursor/rules/$name.mdc"
    elif [ "$fmt" = "kiro_steering" ]; then
      local pattern="*.$lang"
      [ "$lang" = "typescript" ] && pattern="*.ts|*.tsx|*.js|*.jsx"
      [ "$lang" = "react-native" ] && pattern="*.tsx|*.jsx"
      [ "$lang" = "react" ] && pattern="*.tsx|*.jsx"
      [ "$lang" = "angular" ] && pattern="*.ts"
      [ "$lang" = "nextjs" ] && pattern="*.tsx|*.ts"
      [ "$lang" = "nestjs" ] && pattern="*.ts"
      [ "$lang" = "nuxt" ] && pattern="*.vue|*.ts"
      [ "$lang" = "tanstack" ] && pattern="*.ts|*.tsx"
      [ "$lang" = "tailwind" ] && pattern="*.css|*.tsx|*.jsx|*.html|*.vue"
      {
        echo "---"
        echo "description: Matcha $lang coding standards and patterns"
        if [ "$lang" = "common" ]; then
          echo "inclusion: auto"
        else
          echo "inclusion: fileMatch"
          echo "fileMatchPattern: \"$pattern\""
        fi
        echo "---"
        fetch ".cursor/rules/$name.mdc" | sed '1,/^---$/d'
      } > "$dst"
      echo "  ✅ $dst"
    else
      install_file "$dst" ".agents/rules/$name.md"
    fi
  done
}

# ─── Install per platform ─────────────────────────────────────────────────────
for p in $PLATFORMS; do
  echo "── $p ──"
  case "$p" in
    claude)
      install_agents "$TARGET/.claude/agents"
      install_commands "$TARGET/.claude/commands"
      install_skill "$TARGET/.claude/skills/matcha/SKILL.md"
      install_rules "$TARGET/.claude/rules" "md" "standard_md" ;;
    opencode)
      install_agents "$TARGET/.opencode/agents"
      install_commands "$TARGET/.opencode/commands"
      install_skill "$TARGET/.opencode/skills/matcha/SKILL.md"
      install_rules "$TARGET/.opencode/rules" "md" "standard_md" ;;
    cursor)
      install_file "$TARGET/.cursor/rules/matcha-core.mdc" ".cursor/rules/matcha-core.mdc"
      install_file "$TARGET/.cursor/rules/matcha-cleanup.mdc" ".cursor/rules/matcha-cleanup.mdc"
      install_file "$TARGET/.cursor/rules/matcha-audit.mdc" ".cursor/rules/matcha-audit.mdc"
      install_file "$TARGET/.cursor/rules/matcha-review.mdc" ".cursor/rules/matcha-review.mdc"
      install_rules "$TARGET/.cursor/rules" "mdc" "cursor_mdc" ;;

    agents)
      install_agents "$TARGET/.agents/agents"
      install_commands "$TARGET/.agents/commands"
      install_rules "$TARGET/.agents/rules" "md" "standard_md"
      install_skill "$TARGET/.agents/skills/matcha/SKILL.md"
      install_context "$TARGET" ;;
    clinerules) install_rules "$TARGET/.clinerules" "md" "standard_md" ;;
    windsurf)
      install_file "$TARGET/.windsurfrules" ".windsurfrules"
      install_rules "$TARGET/.windsurf/rules" "md" "standard_md" ;;

    kiro)
      install_rules "$TARGET/.kiro/steering" "md" "kiro_steering"
      install_file "$TARGET/.kiro/steering/dev-mode.md" ".kiro/steering/dev-mode.md"
      install_file "$TARGET/.kiro/steering/review-mode.md" ".kiro/steering/review-mode.md" ;;
    openclaw)  install_skill "$TARGET/.openclaw/skills/matcha/SKILL.md" ;;
    qoder)
      # Qoder reads AGENTS.md from project root + .qoder/ for agents, rules & hooks
      install_context "$TARGET"
      install_agents "$TARGET/.qoder/agents"
      install_rules "$TARGET/.qoder/rules" "md" "standard_md"
      # Copy shield as a hooks example for Qoder
      install_file "$TARGET/.qoder/hooks/matcha-shield.js" "hooks/matcha-shield.js" ;;
    qwen)
      # Qwen Code uses .qwen/settings.json + .qwen/skills/
      install_skill "$TARGET/.qwen/skills/matcha/SKILL.md"
      # Generate default settings.json if not exists
      if [ ! -f "$TARGET/.qwen/settings.json" ]; then
        # Generate QWEN.md first (referenced by settings.json)
        if [ ! -f "$TARGET/QWEN.md" ]; then
          install_file "$TARGET/QWEN.md" "QWEN.md"
        else
          echo "  ⏭ $TARGET/QWEN.md (exists)"
        fi
        cat > "$TARGET/.qwen/settings.json" << 'JSONEOF'
{
  "version": "1.0",
  "name": "matcha",
  "description": "🍵 matcha engineering convention",
  "skills": {
    "matcha": {
      "path": "skills/matcha/SKILL.md",
      "autoLoad": true
    }
  },
  "instructions": {
    "files": ["AGENTS.md", "QWEN.md"]
  }
}
JSONEOF
        echo "  ✅ $TARGET/.qwen/settings.json (generated)"
      else
        echo "  ⏭ $TARGET/.qwen/settings.json (exists)"
        # Still try to create QWEN.md even if settings exists
        if [ ! -f "$TARGET/QWEN.md" ]; then
          install_file "$TARGET/QWEN.md" "QWEN.md"
        fi
      fi ;;
  esac
  echo ""
done

if $AGY_GLOBAL; then
  echo "── agy (global) ──"
  install_file "$HOME/.gemini/antigravity-cli/GEMINI.md" "GEMINI.md"
  install_skill "$HOME/.gemini/antigravity-cli/skills/matcha/SKILL.md"
  echo ""
fi

echo "🍵 matcha: install complete"
echo "Run /matcha:status to verify."
