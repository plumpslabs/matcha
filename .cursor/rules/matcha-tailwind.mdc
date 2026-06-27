---
description: Matcha Tailwind CSS best practices — v4 vs v3
globs: ["**/*.{css,tsx,jsx,html,vue}"]
alwaysApply: false
---

# Tailwind Standards

## v4 (Current) — CSS-First Config
```css
@import "tailwindcss";
@theme { --color-primary: #3b82f6; }
```

## v3 (Legacy) — JS Config
```js
module.exports = { theme: { extend: { colors: { primary: "#3b82f6" } } } };
```

## Best Practices
- Utility-first: inline over @apply
- v4 project → no tailwind.config.js
- CSS variables for dynamic values
- Migrate old v3 snippets to v4 syntax

## Checklist
- [ ] Using `@import "tailwindcss"` (v4) not `@tailwind` directives (v3)
- [ ] Custom theme via `@theme` block in CSS, not `tailwind.config.js`
- [ ] Utility-first — minimal custom CSS
- [ ] CSS variables for dynamic/runtime values
- [ ] `@apply` only for genuinely repeated complex patterns
- [ ] Check existing tailwind.config before adding custom theme values
