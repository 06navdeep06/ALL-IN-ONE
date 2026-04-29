'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { setClerkTokenGetter, api } from '@/lib/api';

function ClerkTokenBridge() {
  const { getToken, isSignedIn } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
  }, [getToken]);

  // Auto-sync user into backend DB on first sign-in
  useEffect(() => {
    if (isSignedIn && !synced.current) {
      synced.current = true;
      void api.post('/auth/sync').catch(() => {
        // Non-critical — will retry on next request
      });
    }
  }, [isSignedIn]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkTokenBridge />
      {children}
    </QueryClientProvider>
  );
}
