---
description: Matcha TanStack (Query, Router, Start) coding standards
inclusion: fileMatch
fileMatchPattern: "*.ts|*.tsx"
---

# TanStack Standards

## TanStack Query
- Type queryKey + queryFn, staleTime over refetchInterval
- Query keys: ["entity"], ["entity", id]
- Optimistic: onMutate → onError → onSettled

## TanStack Router
- Type-safe routes with validateSearch
- Loader integrated with Query

## TanStack Start
- Server functions ("use server"), SSR + streaming

# 🔎 Reuse check
Search existing query hooks before adding new ones
