import { MutationCache, QueryClient, type QueryKey } from '@tanstack/react-query'

import { isApiError } from '@/services/api-error'
import { notify } from '@/utils/toast'

/** Per-call escape hatches, read from a query's or mutation's `meta`. */
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { /** Suppress the automatic error toast. */ silent?: boolean }
    mutationMeta: {
      silent?: boolean
      /** Query key prefixes to invalidate after this mutation succeeds. */
      invalidates?: QueryKey[]
    }
  }
}

/** Network and 5xx failures are worth retrying; a 4xx will fail identically. */
const MAX_RETRIES = 2

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false

  if (isApiError(error)) {
    // A dead session cannot be retried into life, and retrying would burn the
    // refresh token the http client is already trying to use.
    if (error.isSessionEnding) return false

    // `status: 0` is the client's own network/timeout marker — always worth
    // another go. Otherwise only server-side faults are transient.
    return error.isNetwork || error.status >= 500
  }

  return false
}

/**
 * The app's `QueryClient`.
 *
 * Two defaults are deliberate and worth knowing:
 *
 * - **`refetchOnWindowFocus` is off.** An admin panel is a working surface that
 *   loses focus constantly — to a terminal, a spreadsheet, an email. Refetching
 *   every time yanks rows out from under a half-finished action.
 * - **Mutations toast on failure, queries do not.** A mutation is something the
 *   user just did, so silence would read as success; a query failure belongs in
 *   the surface that was loading (`DataTable` renders its own states), and a
 *   global toast would fire again on every background refetch. Opt out per call
 *   with `meta: { silent: true }`.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent) return
        notify.fromError(error)
      },

      // Saves every mutation repeating the same invalidation boilerplate:
      // `meta: { invalidates: [userKeys.lists()] }`.
      onSuccess: (_data, _variables, _context, mutation) => {
        const keys = mutation.meta?.invalidates
        if (!keys?.length) return

        for (const queryKey of keys) {
          void queryClient.invalidateQueries({ queryKey })
        }
      },
    }),

    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
        // Reconnecting is a real signal that cached data may be stale.
        refetchOnReconnect: true,
      },
      mutations: {
        // Retrying a non-idempotent write risks doing it twice.
        retry: false,
      },
    },
  })
}

/**
 * The single client instance.
 *
 * Exported so non-React code — the auth provider clearing cached data on
 * sign-out, say — can reach it without prop-drilling a reference.
 */
export const queryClient = createQueryClient()
