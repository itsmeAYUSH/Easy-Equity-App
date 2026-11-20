import { QueryClient } from "@tanstack/react-query"

import { HttpError } from "@/api/errors"

/**
 * One QueryClient for the app, tuned for market data:
 * - staleTime 60 s: navigating between screens never refetches what is fresh.
 * - gcTime 30 min: going back to a screen paints instantly from cache.
 * - Retry only what can succeed on a second try (no answer / 5xx), never a 4xx.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: true, // = app returned to the foreground (DataProvider wires AppState)
      retry: (count, error) => count < 2 && isTransient(error),
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
    },
    mutations: {
      retry: false,
    },
  },
})

// Persisted roots (news, market, IPOs, AI insights) must outlive the persister's
// 24 h maxAge, or an idle query would be garbage-collected out of the disk cache.
for (const root of ["articles", "market", "ipo", "ai"]) {
  queryClient.setQueryDefaults([root], { gcTime: 24 * 60 * 60_000 })
}

/** A failure worth retrying: no answer at all (offline, timeout, Render cold start) or a 5xx. */
export function isTransient(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 0 || error.status >= 500
  return true
}
