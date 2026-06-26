# Next.js Best Practices

## App Router
```tsx
// app/layout.tsx — root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>;
}
// app/page.tsx — route
// app/api/route.ts — API route (use for proxies, not BFF)
```
- Server Components by default, `"use client"` only when needed
- Loading states: `loading.tsx`, error: `error.tsx`, not-found: `not-found.tsx`

## Data Fetching
```tsx
// ✅ Server Component — fetch directly
async function Page() { const data = await fetch('https://api.example.com').then(r => r.json()); return <div>{data}</div>; }
// ✅ For mutations: Server Actions
async function createUser(formData: FormData) { 'use server'; await db.user.create(...); }
```
- Use `fetch` with `cache: 'force-cache'` / `next: { revalidate }`
- Avoid `getServerSideProps` / `getStaticProps` — App Router only

## Performance
- Image: `next/image` with `width`/`height` or `fill`
- Fonts: `next/font` (no FOUT)
- Streaming: `loading.tsx` + `Suspense` boundaries
- ISR: `revalidate` in fetch or `generateStaticParams`

## File Conventions
```
app/
├── (marketing)/   ← route group (no layout nesting)
├── dashboard/
│   ├── page.tsx
│   └── settings/
│       └── page.tsx
├── api/
│   └── users/
│       └── route.ts
└── layout.tsx
```