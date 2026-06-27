---
paths:
- "**/*.tsx"
- "**/*.ts"
---

# Next.js Best Practices

> This file extends [common/coding-standards.md](../common/coding-standards.md) with Next.js-specific rules.

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

## Server Actions
```typescript
// ✅ Server Actions for mutations (form handling, data changes)
'use server';
export async function createUser(formData: FormData) {
  const name = formData.get('name');
  await db.user.create({ data: { name } });
  revalidatePath('/users');
}

// ✅ With validation
async function createUser(prev: State, formData: FormData) {
  'use server';
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten() };
  await db.user.create({ data: parsed.data });
  revalidatePath('/users');
  redirect('/users/success');
}
```

## Performance
```tsx
// ✅ Image optimization
import Image from 'next/image';
<Image src="/hero.jpg" width={1200} height={600} alt="Hero" priority />

// ✅ Font optimization (no FOUT)
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], display: 'swap' });

// ✅ Streaming
// loading.tsx → auto Suspense boundary
export default function Loading() { return <Skeleton />; }
```
- Streaming: `loading.tsx` + manual `<Suspense>` for granular loading states
- ISR: `revalidate` in fetch or `generateStaticParams` with `revalidate` export
- Partial Prerendering (PPR — experimental): combine static + dynamic on same page
- Bundle analysis: `@next/bundle-analyzer` for tracking bundle size

## File Conventions
```
app/
├── (marketing)/       ← route group (no layout nesting)
│   ├── page.tsx
│   └── layout.tsx
├── dashboard/
│   ├── page.tsx
│   ├── layout.tsx     ← nested layout for dashboard only
│   ├── loading.tsx    ← loading state
│   ├── error.tsx      ← error boundary ('use client')
│   └── settings/
│       └── page.tsx
├── api/
│   └── users/
│       ├── route.ts    ← GET /api/users
│       └── [id]/
│           └── route.ts ← GET /api/users/:id
├── layout.tsx          ← root layout (required)
└── page.tsx            ← home page
```

## Middleware
```typescript
// middleware.ts — runs on every matched request
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };
```
- Edge runtime by default (fast, limited APIs)
- Use for: auth checks, redirects, i18n, geolocation
- NOT for: heavy computation, DB queries

## Checklist

- [ ] Server Components by default — `"use client"` only for interactivity
- [ ] Data fetching in Server Components, mutations in Server Actions
- [ ] Loading states via `loading.tsx` or `<Suspense>` boundaries
- [ ] Error boundaries via `error.tsx` (client component)
- [ ] Images optimized with `next/image`
- [ ] Fonts optimized with `next/font`
- [ ] Middleware for auth/redirects, not for heavy computation