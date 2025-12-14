# Create PostHog Provider and ClientProviders Wrapper

## Files to Modify/Create
- `src/components/providers/posthog-provider.tsx` (new)
- `src/components/providers/client-providers.tsx` (new)
- `src/app/layout.tsx` (modify)

## Implementation Details

**Note**: RootLayout is a Server Component and cannot use hooks. Create a client wrapper component.

### PostHog Provider

Create `src/components/providers/posthog-provider.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { env } from '@/lib/env';

export function PostHogProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) return;

    posthog.init(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      // Manual pageview tracking for Next.js App Router SPA navigation
      capture_pageview: false,
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;

    // Track pageviews on route change (SPA navigation)
    posthog.capture('$pageview', {
      $current_url: `${pathname}${searchParams?.toString() ? `?${searchParams}` : ''}`,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
```

### ClientProviders Wrapper

Create `src/components/providers/client-providers.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './posthog-provider';

export function ClientProviders({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </QueryClientProvider>
  );
}
```

### Update Layout

Update `src/app/layout.tsx` to use ClientProviders:

```typescript
import { ClientProviders } from '@/components/providers/client-providers';
// ... existing imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={/* existing classes */}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ClientProviders>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster position="bottom-right" />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Design Decisions

### Server vs Client Components
- RootLayout is a Server Component (default in App Router)
- Hooks like `useState` cannot be used in Server Components
- ClientProviders is a 'use client' boundary for hooks

### Manual Pageview Tracking
- `capture_pageview: false` disables automatic tracking
- Manual tracking handles Next.js App Router SPA navigation
- Pageview captured on pathname/searchParams change

### QueryClient in useState
- Prevents new QueryClient on every render
- Standard pattern for React Query in Next.js

## Acceptance Criteria
- [ ] PostHogProvider created with init logic
- [ ] PostHog client initialized on mount (if API key present)
- [ ] Pageview captured on route change (SPA navigation)
- [ ] capture_pageview: false (manual tracking)
- [ ] ClientProviders wraps QueryClient + PostHog
- [ ] QueryClient created with useState (not on every render)
- [ ] Layout updated to use ClientProviders
- [ ] ThemeProvider wraps ClientProviders (existing pattern preserved)
- [ ] App compiles (no hooks in Server Components)

## Dependencies
- Task 01 (@tanstack/react-query installed)
- Task 07 (PostHog client)
- Task 09 (env vars)
