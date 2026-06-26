---
description: Matcha Next.js coding standards
inclusion: fileMatch
fileMatchPattern: "*.tsx|*.ts"
---

# Next.js Standards

## App Router Only
- Server Components by default
- "use client" only for interactivity
- loading.tsx + error.tsx + not-found.tsx per route

## Data Fetching
- fetch directly in Server Components
- Server Actions for mutations ('use server')

## Performance
- next/image, next/font, streaming, ISR

# 🔎 Reuse check
Check next.config.ts before adding plugins
