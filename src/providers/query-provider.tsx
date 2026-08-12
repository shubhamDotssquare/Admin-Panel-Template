import { useEffect, useRef } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'

import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'

/**
 * Drops every cached response when a session ends.
 *
 * Without this, signing out and signing in as someone else would serve the
 * previous account's rows from cache until each query happened to refetch —
 * a data-leak between users, not merely a stale-UI annoyance.
 *
 * It keys off the transition *into* `unauthenticated`, so a boot that starts
 * signed-out does not clear an already-empty cache on every mount.
 */
function useClearCacheOnSignOut(): void {
  const { status } = useAuth()
  const wasAuthenticated = useRef(false)

  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true
      return
    }

    if (status === 'unauthenticated' && wasAuthenticated.current) {
      wasAuthenticated.current = false
      queryClient.clear()
    }
  }, [status])
}

function QueryCacheLifecycle({ children }: { children: React.ReactNode }) {
  useClearCacheOnSignOut()
  return <>{children}</>
}

/**
 * Server-state provider.
 *
 * Mounted **inside** `AuthProvider` so it can watch the session — the client
 * itself lives in [`lib/query-client.ts`](../lib/query-client.ts) as a module
 * singleton, which is what lets non-React code reach it.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryCacheLifecycle>{children}</QueryCacheLifecycle>
    </QueryClientProvider>
  )
}
