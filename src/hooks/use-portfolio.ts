import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { portfolioApi } from "@/api/endpoints"
import { useQuotes } from "@/hooks/use-market"
import { useSession } from "@/lib/auth/session"
import { toYahooSymbol } from "@/lib/format"
import { haptics } from "@/lib/haptics"
import { summarizePortfolio } from "@/lib/portfolio"
import type { Holding } from "@/lib/types"
import { qk } from "@/queries/keys"

export type { HoldingRow } from "@/lib/portfolio"

export function usePortfolio() {
  const { userId } = useSession()
  const holdings = useQuery({
    queryKey: qk.portfolio(userId),
    queryFn: portfolioApi.list,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
  const yahoo = useMemo(() => (holdings.data ?? []).map((h) => toYahooSymbol(h.symbol)), [holdings.data])
  const quotes = useQuotes(yahoo)

  /** Holdings joined with live quotes, and the totals — derived once per data change. */
  const summary = useMemo(() => summarizePortfolio(holdings.data ?? [], quotes.data ?? []), [holdings.data, quotes.data])

  return { holdings, quotes, ...summary }
}

/** Dividends paid in the last 12 months on what the user holds (re-asked when holdings change). */
export function useDividends(holdings: Holding[]) {
  const { userId } = useSession()
  const holdingsKey = holdings.map((h) => `${h.symbol}:${h.quantity}`).join(",")
  return useQuery({
    queryKey: qk.dividends(userId, holdingsKey),
    queryFn: portfolioApi.dividends,
    enabled: !!userId && holdingsKey !== "",
    staleTime: 60 * 60_000,
    retry: 1,
  })
}

export function useAddHolding() {
  const { userId } = useSession()
  const client = useQueryClient()
  return useMutation({
    mutationFn: portfolioApi.add,
    onSuccess: () => {
      haptics.success()
      return client.invalidateQueries({ queryKey: qk.portfolio(userId) })
    },
  })
}

export function useRemoveHolding() {
  const { userId } = useSession()
  const client = useQueryClient()
  const key = qk.portfolio(userId)
  return useMutation({
    mutationFn: portfolioApi.remove,
    onMutate: async (id: string) => {
      haptics.tap()
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Holding[]>(key)
      client.setQueryData<Holding[]>(key, (old = []) => old.filter((h) => h.id !== id))
      return { previous }
    },
    onError: (_e, _id, ctx) => {
      haptics.fail()
      if (ctx?.previous) client.setQueryData(key, ctx.previous)
    },
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}
