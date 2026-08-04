#!/usr/bin/env bash
set -euo pipefail

# 🍵 matcha — install.sh
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/plumpslabs/matcha/main/install.sh | bash
#   curl -fsSL ... | bash -s -- --target /path
#   ./install.sh              # from cloned repo

GH_RAW="https://raw.githubusercontent.com/plumpslabs/matcha/main"
HERE="$(cd "$(dirname "$0")" 2>/dev/null && pwd || echo "")"
CLONED=false
[ -n "$HERE" ] && [ -f "$HERE/install.sh" ] && [ -f "$HERE/skills/matcha/SKILL.md" ] && CLONED=true

TARGET="${PWD}"
f=""; for a in "$@"; do [ "$f" = "--target" ] && TARGET="$a" && break; f="$a"; done

fetch() {
  if $CLONED; then cat "$HERE/$1"; else curl -fsSL "$GH_RAW/$1"; fi
}

echo "🍵 matcha install"
echo "Target: $TARGET"
$CLONED && echo "Mode: local" || echo "Mode: remote"
echo ""

install_file() {
  local dst="$1" src="$2"
  mkdir -p "$(dirname "$dst")"
  [ -L "$dst" ] && rm -f "$dst"
  fetch "$src" > "$dst"
  echo "  ✅ $dst"
}

install_symlink() {
  local dst="$1" target="$2"
  mkdir -p "$(dirname "$dst")"
  [ -L "$dst" ] && rm -f "$dst"
  [ -d "$dst" ] && rm -rf "$dst"
  ln -sf "$target" "$dst"
  echo "  ✅ $dst → $target"
}

install_context() { install_file "$1/AGENTS.md" "AGENTS.md"; }
install_skill() { install_file "$1" "skills/matcha/SKILL.md"; }

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
  for cmd in why review audit intensity status debt; do
    install_file "$target/$cmd.md" "commands/$cmd.md"
  done
}

install_hooks() {
  local target="$1"
  mkdir -p "$target"
  for hook in matcha-shield.js matcha-post-write.js matcha-stop.js matcha-instructions.js inject-rules.js patterns.json matcha-mcp-server.js; do
    install_file "$target/$hook" "hooks/$hook"
  done
}

# ─── Platform detection ───────────────────────────────────────────────────────
PLATFORMS=""
for p in .claude .opencode .cursor .agents .clinerules .windsurf .kiro .openclaw .qoder .qwen; do
  [ -d "$TARGET/$p" ] && PLATFORMS="$PLATFORMS $p"
done
[ -z "$PLATFORMS" ] && PLATFORMS=" .agents" && mkdir -p "$TARGET/.agents"

# ─── Install to each platform ─────────────────────────────────────────────────
for p in $PLATFORMS; do
  echo "── $p ──"
  case "$p" in
    .claude | .opencode | .agents)
      install_agents "$TARGET/$p/agents"
      install_commands "$TARGET/$p/commands"
      install_skill "$TARGET/$p/skills/matcha/SKILL.md"
      [ "$p" = ".agents" ] && install_context "$TARGET"
      ;;
    .cursor | .clinerules | .kiro)
      # Files ship with repo
      ;;
    .windsurf)
      install_file "$TARGET/.windsurfrules" ".windsurfrules"
      ;;
    .openclaw | .qwen)
      install_skill "$TARGET/$p/skills/matcha/SKILL.md"
      ;;
    .qoder)
      install_context "$TARGET"
      install_agents "$TARGET/$p/agents"
      install_file "$TARGET/$p/hooks/matcha-shield.js" "hooks/matcha-shield.js"
      ;;
  esac
  echo ""
done

# ─── Install hooks + MCP server ──────────────────────────────────────────────
echo "── hooks + mcp ──"
if [ -d "$TARGET/hooks" ] || [ -d "$TARGET/.agents" ]; then
  HOOKS_DIR="$TARGET/hooks"
  mkdir -p "$HOOKS_DIR"
  install_hooks "$HOOKS_DIR"
  echo ""
  echo "  💡 MCP server available at: $HOOKS_DIR/matcha-mcp-server.js"
  echo "     Add to your MCP config:"
  echo '     { "mcpServers": { "matcha": { "command": "node", "args": ["hooks/matcha-mcp-server.js"] } } }'
fi

# ─── Safe merge settings (don't overwrite existing hooks) ─────────────────────
if [ -f "$TARGET/.claude/settings.json" ]; then
  echo ""
  echo "── safe merge settings ──"
  echo "  ℹ️  Existing .claude/settings.json detected — merging hooks (not overwriting)"
  if [ -f "$TARGET/scripts/safe-merge-settings.js" ]; then
    node "$TARGET/scripts/safe-merge-settings.js" 2>/dev/null || echo "  ⚠️  Could not merge settings — add hooks manually"
  fi
fi

echo ""
echo "🍵 matcha: install complete"
echo ""
echo "Next steps:"
echo "  1. Run  node bin/matcha.js status  to verify"
echo "  2. Configure MCP server in your AI agent (optional)"
echo "  3. Start coding with matcha! 🍵"
