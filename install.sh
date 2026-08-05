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

# --platforms ".opencode .claude" or $MATCHA_PLATFORMS overrides auto-detection
PLATFORM_ARG=""
f=""; for a in "$@"; do [ "$f" = "--platforms" ] && PLATFORM_ARG="$a" && break; f="$a"; done
[ -z "$PLATFORM_ARG" ] && [ -n "${MATCHA_PLATFORMS:-}" ] && PLATFORM_ARG="$MATCHA_PLATFORMS"

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
install_file_if_missing() {
  local dst="$1" src="$2"
  if [ -f "$dst" ]; then
    echo "  ℹ️  $dst already exists — skipped"
  else
    install_file "$dst" "$src"
  fi
}
install_skill() {
  local dst="$1"
  mkdir -p "$dst/modules"
  install_file "$dst/SKILL.md" "skills/matcha/SKILL.md"
  for m in core project modes risk legacy; do
    install_file "$dst/modules/$m.md" "skills/matcha/modules/$m.md"
  done
}

install_agents() {
  local target="$1"
  mkdir -p "$target"
  for agent in matcha-planner matcha-finder matcha-auditor matcha-reviewer matcha-cleaner matcha-debugger; do
    install_file "$target/$agent.md" ".agents/agents/$agent.md"
  done
}

install_commands() {
  local target="$1"
  mkdir -p "$target"
  for cmd in matcha:why matcha:review matcha:audit matcha:intensity matcha:status matcha:debt matcha:markers; do
    install_file "$target/$cmd.md" "commands/$cmd.md"
  done
}

install_hooks() {
  local target="$1"
  mkdir -p "$target"
  # All hooks + their runtime dependencies (dependency graph must be complete
  # or every hook crashes on a clean install).
  for hook in matcha-shield.js matcha-post-write.js matcha-stop.js matcha-instructions.js inject-rules.js patterns.json matcha-mcp-server.js planning-gate.js danger-checks.js mode-detect.js matcha-metrics.js matcha-trigger-packs.json matcha-agy-hooks.js; do
    install_file "$target/$hook" "hooks/$hook"
  done
}

# ─── Platform detection ───────────────────────────────────────────────────────
PLATFORMS=""
if [ -n "$PLATFORM_ARG" ]; then
  for p in $PLATFORM_ARG; do
    mkdir -p "$TARGET/$p"
    PLATFORMS="$PLATFORMS $p"
  done
else
  for p in .claude .opencode .cursor .agents .clinerules .windsurf .kiro .qoder .roo .trae; do
    [ -d "$TARGET/$p" ] && PLATFORMS="$PLATFORMS $p"
  done
  [ -z "$PLATFORMS" ] && PLATFORMS=" .agents" && mkdir -p "$TARGET/.agents"
fi

# ─── Install to each platform ─────────────────────────────────────────────────
# ─── AGENTS.md + GEMINI.md + Copilot: always installed (read by every modern agent) ──
install_context "$TARGET"
install_file "$TARGET/GEMINI.md" "GEMINI.md"
install_file_if_missing "$TARGET/.github/copilot-instructions.md" ".github/copilot-instructions.md"

# ─── Install to each platform ─────────────────────────────────────────────────
for p in $PLATFORMS; do
  echo "── $p ──"
  case "$p" in
    .claude | .opencode | .agents)
      install_agents "$TARGET/$p/agents"
      install_commands "$TARGET/$p/commands"
      install_skill "$TARGET/$p/skills/matcha"
      [ "$p" = ".agents" ] && install_file "$TARGET/.agents/rules/matcha.md" ".agents/rules/matcha.md"
      [ "$p" = ".agents" ] && install_file "$TARGET/.agents/hooks.json" "hooks.json"
      [ "$p" = ".opencode" ] && install_file "$TARGET/.opencode/plugins/matcha.js" ".opencode/plugins/matcha.js"
      ;;
    .roo)
      install_file "$TARGET/.roo/rules/matcha.md" ".roo/rules/matcha.md"
      ;;
    .trae)
      install_file "$TARGET/.trae/rules/matcha.md" ".trae/rules/matcha.md"
      ;;
    .cursor)
      install_file "$TARGET/.cursor/rules/matcha.mdc" ".cursor/rules/matcha.mdc"
      ;;
    .clinerules)
      install_file "$TARGET/.clinerules/matcha.md" ".clinerules/matcha.md"
      ;;
    .kiro)
      install_skill "$TARGET/.kiro/skills/matcha"
      mkdir -p "$TARGET/.kiro/steering"
      for f in matcha.md dev-mode.md review-mode.md; do
        install_file "$TARGET/.kiro/steering/$f" ".kiro/steering/$f"
      done
      ;;
    .windsurf)
      install_file "$TARGET/.windsurfrules" ".windsurfrules"
      install_file "$TARGET/.windsurf/rules/matcha.md" ".windsurf/rules/matcha.md"
      ;;
    .qoder)
      install_file "$TARGET/.qoder/rules/matcha.md" ".qoder/rules/matcha.md"
      ;;
  esac
  echo ""
done

# ─── Install hooks + MCP server ──────────────────────────────────────────────
echo "── hooks + mcp ──"
HOOKS_DIR="$TARGET/hooks"
mkdir -p "$HOOKS_DIR"
install_hooks "$HOOKS_DIR"
echo ""

# ─── Generate MATCHA_PROJECT.md if missing ───────────────────────────────────
if [ ! -f "$TARGET/MATCHA_PROJECT.md" ]; then
  STACK_NAME="Polyglot / Generic"
  STACK_TEST="[your-test-command]"
  STACK_CHECK="[your-lint-command]"
  STACK_BUILD="[your-build-command]"

  if [ -f "$TARGET/Cargo.toml" ]; then
    STACK_NAME="Rust"; STACK_TEST="cargo test"; STACK_CHECK="cargo check"; STACK_BUILD="cargo build"
  elif [ -f "$TARGET/go.mod" ]; then
    STACK_NAME="Go"; STACK_TEST="go test ./..."; STACK_CHECK="go vet ./..."; STACK_BUILD="go build ./..."
  elif [ -f "$TARGET/pyproject.toml" ] || [ -f "$TARGET/requirements.txt" ]; then
    STACK_NAME="Python"; STACK_TEST="pytest"; STACK_CHECK="mypy ."; STACK_BUILD="python -m build"
  elif [ -f "$TARGET/pom.xml" ] || [ -f "$TARGET/build.gradle" ]; then
    STACK_NAME="Java/Kotlin"; STACK_TEST="./gradlew test"; STACK_CHECK="./gradlew check"; STACK_BUILD="./gradlew build"
  elif [ -f "$TARGET/package.json" ]; then
    RUNNER="npm"
    [ -f "$TARGET/pnpm-lock.yaml" ] && RUNNER="pnpm"
    [ -f "$TARGET/yarn.lock" ] && RUNNER="yarn"
    [ -f "$TARGET/bun.lockb" ] && RUNNER="bun"
    STACK_NAME="Node.js / JavaScript / TypeScript"; STACK_TEST="$RUNNER test"; STACK_CHECK="$RUNNER run typecheck"; STACK_BUILD="$RUNNER run build"
  fi

  cat > "$TARGET/MATCHA_PROJECT.md" <<MATCHA_PROJ_EOF
# 🍵 MATCHA_PROJECT.md — Project Constraints

## 1. Stack & Architecture
- **Language / Ecosystem:** $STACK_NAME
- **Architecture Pattern:** Pure Core Logic, High Cohesion, Low Coupling

## 2. Verification Commands
- **Typecheck / Lint:** $STACK_CHECK
- **Test Suite:** $STACK_TEST
- **Build Target:** $STACK_BUILD

## 3. Hard Rules (NEVER Violate)
- All code changes MUST pass empirical verification ($STACK_TEST).
- Zero N+1 queries, zero unhandled errors, zero silent catches.
- Strictly isolate credentials to environment variables.
- Mark deliberate shortcuts with // matcha: [reason].

## 4. Counterintuitive Patterns (Things that surprise new devs)
- [e.g., API methods return Result types — NEVER throw in service layer]
- [e.g., Named exports only, NO default exports]
- [Run @matcha-planner to scan and populate project-specific patterns]

## 5. Ask First (L3 High Risk Triggers)
- Adding new external dependencies or libraries
- Database schema changes or migrations
- Modifying security, auth, or payment boundary code
MATCHA_PROJ_EOF
  echo "  ✅ MATCHA_PROJECT.md (Auto-detected $STACK_NAME stack)"

else
  echo "  ℹ️  MATCHA_PROJECT.md already exists — kept as-is"
fi
echo ""

# ─── Scaffold session memory (live plan + rotating report archive) ───────────
MEM_PLAN="$TARGET/.agents/plan/current.md"
if [ ! -f "$MEM_PLAN" ]; then
  mkdir -p "$(dirname "$MEM_PLAN")"
  cat > "$MEM_PLAN" <<MEM_EOF
---
title: Current plan
date: $(date +%Y-%m-%d)
type: plan
agent: matcha-planner
status: active
tags: [matcha, plan]
---
# 🍵 Intent Discovery — Current Plan

> Living doc. Overwritten at every planning gate. Read at task start to resume continuity.

- **Problem:** (TBD)
- **Goals:** (TBD)
- **Success Criteria:** (TBD)
- **Assumptions:** (TBD)
- **Unknowns:** (TBD)

## Plan
- [ ] Step 1 — (TBD)

## Risks & Mitigations
- (TBD)
MEM_EOF
  echo "  ✅ .agents/plan/current.md (session memory — live plan)"
else
  echo "  ℹ️  .agents/plan/current.md already exists — kept as-is"
fi
mkdir -p "$TARGET/.agents/reports"
[ -f "$TARGET/.agents/reports/.gitkeep" ] || touch "$TARGET/.agents/reports/.gitkeep"

echo "  💡 MCP server available at: $HOOKS_DIR/matcha-mcp-server.js"
echo "     Add to your MCP config:"
echo '     { "mcpServers": { "matcha": { "command": "node", "args": ["hooks/matcha-mcp-server.js"] } } }'


# ─── Safe merge settings (don't overwrite existing hooks) ─────────────────────
# ─── Claude Code hooks: create or safe-merge settings.json ───────────────────
if [ -d "$TARGET/.claude" ]; then
  SETTINGS="$TARGET/.claude/settings.json"
  if [ ! -f "$SETTINGS" ]; then
    cat > "$SETTINGS" <<'MATCHA_EOF'
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash|Edit|Write|MultiEdit", "hooks": [ { "type": "command", "command": "node hooks/matcha-shield.js", "timeout": 5000 } ] }
    ],
    "PostToolUse": [
      { "hooks": [ { "type": "command", "command": "node hooks/matcha-post-write.js", "timeout": 3000 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node hooks/matcha-stop.js", "timeout": 5000 } ] }
    ]
  }
}
MATCHA_EOF
    echo "  ✅ $SETTINGS (created with matcha hooks)"
  else
    echo ""
    echo "── safe merge settings ──"
    echo "  ℹ️  $SETTINGS exists — merging matcha hooks (not overwriting)"
    if grep -q 'matcha-shield' "$SETTINGS" 2>/dev/null; then
      echo "  ✅ matcha hooks already present"
    else
      node -e '
        const fs = require("fs");
        const p = process.argv[1];
        let s = {};
        try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
        s.hooks = s.hooks || {};
        const push = (ev, hook) => {
          s.hooks[ev] = s.hooks[ev] || [];
          if (!s.hooks[ev].some(h => JSON.stringify(h).includes("matcha"))) s.hooks[ev].push(hook);
        };
        push("PreToolUse", { matcher: "Bash|Edit|Write|MultiEdit", hooks: [{ type: "command", command: "node hooks/matcha-shield.js", timeout: 5000 }] });
        push("PostToolUse", { hooks: [{ type: "command", command: "node hooks/matcha-post-write.js", timeout: 3000 }] });
        push("Stop", { hooks: [{ type: "command", command: "node hooks/matcha-stop.js", timeout: 5000 }] });
        fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
      ' "$SETTINGS" && echo "  ✅ merged matcha hooks into settings.json"
    fi
  fi
fi

echo ""
echo "🍵 matcha: install complete"
echo ""
echo "Next steps:"
echo "  1. Verify: ls AGENTS.md GEMINI.md hooks/matcha-shield.js"
echo "  2. Configure MCP server in your AI agent (optional)"
echo "  3. Start coding with matcha! 🍵"
