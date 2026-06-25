---
name: kuma-mcp
description: Kuma safety toolkit for AI coding agents. Use smart_grep for search, precise_diff_editor for edits, execute_safe_test for verification.
---

# Kuma MCP - Antigravity Skill

## AI Agent Usage Guidelines

Kuma MCP tools are available. Use them correctly:

### Code Search
- Use the **smart_grep** tool to search code - NOT bash grep/ripgrep manually
- smart_grep returns line numbers + context, caches results, respects .gitignore
- **Example:** smart_grep({ query: "function handleAuth", extensions: ['ts'] })

### Reading Code
- Use the **smart_file_picker** tool to read files with smart chunking
- For large files, use startLine/endLine to read specific ranges
- **Example:** smart_file_picker({ filePath: "src/index.ts", chunkStrategy: "outline" })
- **Example:** smart_file_picker({ filePath: "src/index.ts", startLine: 10, endLine: 30 })

### Editing Code
- Use the **precise_diff_editor** tool to edit files (fuzzy matching + auto-backup)
- DO NOT create Python/Node scripts to patch files; use precise_diff_editor directly
- DO NOT use bash sed/cat/awk to modify source files
- **Example:** precise_diff_editor({ filePath: "src/app.ts", edits: [{ searchBlock: "old code", replaceBlock: "new code" }] })
- **Example:** precise_diff_editor({ filePath: "src/app.ts", dryRun: true, edits: [...] })
- **Example:** precise_diff_editor({ filePath: "src/app.ts", action: "rollback" })

### Creating Files
- Use the **batch_file_writer** tool to create new files (up to 15 at once)
- **Example:** batch_file_writer({ files: [{ filePath: "src/util.ts", content: "// code", instructions: "reason for creating" }] })

### Running Tasks
- Use the **execute_safe_test** tool for test/build/lint/typecheck
- Always run typecheck after editing TypeScript files
- **Example:** execute_safe_test({ task: "typecheck" })
- **Example:** execute_safe_test({ task: "custom", customCommand: "npm run lint" })

### Code Review
- Use the **code_reviewer** tool after changes
- Supports focus: correctness, security, performance, over-engineering
- **Example:** code_reviewer({ focus: "security" })
- **Example:** code_reviewer({ files: ["src/auth.ts"], format: "json" })

### Git Operations
- Use the **git_diff** tool for structured diff output
- Use the **git_log** tool for commit history
- **Example:** git_log({ maxCount: 5 })
- **Example:** git_diff({ staged: true })

### Session Awareness
- Use the **kuma_reflect** tool to check on-track/drift/loops
- Use the **kuma_guard** tool for deeper safety checks (anti-patterns, auto-detection)
- Use the **get_session_memory** tool to recall session state
- **Example:** kuma_reflect({ goal: "refactor auth" })
- **Example:** kuma_guard({ check: "all", goal: "refactor auth" })

### LSP / Code Intelligence
- Use the **lsp_query** tool for go-to-definition, find references, type info
- **Example:** lsp_query({ filePath: "src/index.ts", line: 5, character: 10, action: "def" })
- **Example:** lsp_query({ filePath: "src/index.ts", line: 5, character: 10, action: "refs" })

### Static Analysis
- Use the **static_analysis** tool to run ESLint/TSC/Prettier/Ruff
- **Example:** static_analysis({ tool: "eslint", autoFix: true })

### Project Structure
- Use the **project_structure** tool to see project layout
- **Example:** project_structure({ depth: 2, folderOnly: true })

### Write Memory
- Use the **write_memory** tool to persist decisions and glossary
- **Example:** write_memory({ topic: "decisions", content: "## Reason for using X" })

### General Rules
- When you error, READ the error carefully before acting
- After 3+ edits without running tests, stop and verify
- If a tool fails, check the message - don't retry blindly
- Detect conventions first with the **project_conventions** tool
- **Example:** project_conventions({ forceRescan: true })

## Verification
- After edits, run execute_safe_test to verify no breakage
- Use code_reviewer for correctness/security review
- Check kuma_reflect to confirm on-track