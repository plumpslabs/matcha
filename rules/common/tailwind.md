# Tailwind CSS Best Practices

## v4 vs v3 — Critical Differences

| Feature | v3 (Old) | v4 (Current) |
|---------|----------|--------------|
| Setup | `tailwind.config.js` | `@theme` in CSS |
| Entry | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| Custom values | `theme.extend.colors` in config | `--color-*` in `@theme` block |
| Variants | `hover:`, `dark:` in template | Same + arbitrary variants with `@variant` |
| Plugins | `require('@tailwindcss/forms')` | Import in CSS |

## v4 — CSS-First Config
```css
/* ✅ v4 — CSS-first */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --font-display: "Inter", sans-serif;
  --breakpoint-xs: 30rem;
}
```

```js
// ❌ v3 — JS config (don't use in v4 projects)
module.exports = {
  theme: { extend: { colors: { primary: "#3b82f6" } } },
};
```

## Common Patterns
```html
<!-- ✅ Utility-first -->
<button class="bg-blue-500 hover:bg-blue-700 px-4 py-2 rounded">

<!-- ❌ Custom CSS when utility exists -->
<style>.btn { @apply bg-blue-500 px-4 py-2 rounded; }</style>
```

- Use `@apply` sparingly — prefer inline utilities
- Use `@layer` for custom component styles
- Use CSS variables (`--color-*`) for dynamic values
- Check v4 migration before copy-pasting old v3 snippets
