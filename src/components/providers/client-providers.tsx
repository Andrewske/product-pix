'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostHogProvider } from './posthog-provider';

export function ClientProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
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