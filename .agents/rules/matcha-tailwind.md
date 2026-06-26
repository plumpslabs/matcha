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

# 🔎 Reuse check
Check existing tailwind.config before adding custom theme values
