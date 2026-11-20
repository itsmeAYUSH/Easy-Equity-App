import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { watchlistApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import { toYahooSymbol } from "@/lib/format"
import { haptics } from "@/lib/haptics"
import type { WatchlistItem } from "@/lib/types"
import { qk } from "@/queries/keys"

/**
 * The user's watchlist — the same MongoDB list the website edits.
 *
 * The website stores symbols in whatever form the page had ("RELIANCE" from a
 * stock URL, "RELIANCE.NS" from search), so matching is done on the Yahoo
 * form: both count as the same stock here, exactly as on the web.
 */
export function useWatchlist() {
  const { userId } = useSession()
  const query = useQuery({
    queryKey: qk.watchlist(userId),
    queryFn: watchlistApi.list,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
  const byYahoo = useMemo(
    () => new Map((query.data ?? []).map((i) => [toYahooSymbol(i.symbol), i] as const)),
    [query.data],
  )
  const find = useCallback((symbol: string) => byYahoo.get(toYahooSymbol(symbol)), [byYahoo])
  return { ...query, find }
}

/**
 * Star / un-star with an optimistic update: the star flips the moment it's
 * tapped and rolls back (with an error buzz) only if the API says no.
 */
export function useToggleWatchlist() {
  const { userId } = useSession()
  const client = useQueryClient()
  const key = qk.watchlist(userId)

  const mutation = useMutation({
    mutationFn: async ({ symbol, add }: { symbol: string; add: boolean }): Promise<void> => {
      if (add) await watchlistApi.add(symbol)
      else await watchlistApi.remove(symbol)
    },
    onMutate: async ({ symbol, add }): Promise<{ previous: WatchlistItem[] | undefined }> => {
      haptics.tap()
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<WatchlistItem[]>(key)
      const upper = symbol.toUpperCase()
      client.setQueryData<WatchlistItem[]>(key, (old = []) =>
        add
          ? [{ id: `optimistic-${upper}`, symbol: upper, added_at: new Date().toISOString() }, ...old]
          : old.filter((i) => i.symbol.toUpperCase() !== upper),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      haptics.fail()
      if (ctx?.previous) client.setQueryData(key, ctx.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })

  /**
   * Pass the stored item when un-starring, so the exact stored symbol is
   * deleted. New stars store the exact Yahoo symbol the screen shows
   * (RELIANCE.NS, ^NSEI, BTC-USD).
   */
  const toggle = useCallback(
    (symbol: string, stored: WatchlistItem | undefined) =>
      mutation.mutate(stored ? { symbol: stored.symbol, add: false } : { symbol: symbol.toUpperCase(), add: true }),
    [mutation],
  )
  return { toggle, mutation }
}
