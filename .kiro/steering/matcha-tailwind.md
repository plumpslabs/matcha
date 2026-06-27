---
description: Matcha Tailwind CSS best practices — v4 vs v3
inclusion: fileMatch
fileMatchPattern: "*.css|*.tsx|*.jsx|*.html|*.vue"
---

# Tailwind Standards

## v4 (Current) — CSS-First Config
- @import "tailwindcss" in CSS, no tailwind.config.js
- @theme block for custom values (--color-* CSS vars)

## v3 (Legacy) — JS Config
- tailwind.config.js with theme.extend
- Avoid in new projects

## Best Practices
- Utility-first: inline over @apply
- CSS variables for dynamic values

## Checklist
- [ ] v4: `@import "tailwindcss"` not `@tailwind` directives
- [ ] Theme via `@theme` block in CSS, not JS config
- [ ] Utility-first — minimal `@apply`
- [ ] CSS variables for dynamic values
- [ ] Check existing tailwind.config before adding custom values
