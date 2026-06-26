---
description: Matcha Nuxt coding standards
inclusion: fileMatch
fileMatchPattern: "*.vue|*.ts"
---

# Nuxt Standards

## Directory Structure
- pages/ (routing), components/ (auto-imported)
- composables/ (auto-imported useXxx), server/ (API)

## Data Fetching
- useAsyncData / useFetch over raw fetch (SSR-safe)
- useLazyAsyncData for non-blocking

## Auto-imports
- Composables + Components auto-imported (tree-shaken)

# 🔎 Reuse check
Check nuxt.config.ts plugins before adding modules
