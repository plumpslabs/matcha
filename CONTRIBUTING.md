# 🍵 Contributing to matcha

Thanks for wanting to make matcha better!

## Philosophy

matcha is about **simple AND efficient**. Your contribution should be too.

**Do:**
- Keep changes minimal and focused
- Reuse existing patterns
- Add tests for new functionality
- Follow matcha conventions (eat your own dog food)

**Don't:**
- Add dependencies without clear justification
- Over-engineer solutions
- Break the "simple" in "Simple. Efficient. Deliberate. Never twice."

---

## Development

```bash
# Clone
git clone https://github.com/plumpslabs/matcha.git
cd matcha

# Install
npm install
# or pnpm install (preferred) — the repo uses pnpm; delete any stray `package-lock.json` that npm may have generated.

# Test
npm test

# Build adapters
```