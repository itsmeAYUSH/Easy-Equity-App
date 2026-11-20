import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

import { portfolioApi } from "@/api/endpoints"
import { useQuotes } from "@/hooks/use-market"
import { useSession } from "@/lib/auth/session"
import { toYahooSymbol } from "@/lib/format"
import { haptics } from "@/lib/haptics"
import type { Holding } from "@/lib/types"
import { qk } from "@/queries/keys"

export type HoldingRow = Holding & {
  yahoo: string
  name: string | null
  price: number | null
  dayChangePct: number | null
  invested: number
  value: number | null
  pnl: number | null
  pnlPct: number | null
}

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
  const summary = useMemo(() => {
    const bySymbol = new Map((quotes.data ?? []).map((q) => [q.symbol.toUpperCase(), q]))
    const rows: HoldingRow[] = (holdings.data ?? []).map((h) => {
      const y = toYahooSymbol(h.symbol)
      const q = bySymbol.get(y.toUpperCase())
      const invested = h.quantity * h.avg_price
      const value = q ? q.price * h.quantity : null
      const pnl = value != null ? value - invested : null
      return {
        ...h,
        yahoo: y,
        name: q?.name ?? null,
        price: q?.price ?? null,
        dayChangePct: q?.changePercent ?? null,
        invested,
        value,
        pnl,
        pnlPct: pnl != null && invested > 0 ? (pnl / invested) * 100 : null,
      }
    })
    const invested = rows.reduce((s, r) => s + r.invested, 0)
    const priced = rows.filter((r) => r.value != null)
    const value = priced.reduce((s, r) => s + (r.value ?? 0), 0) + rows.filter((r) => r.value == null).reduce((s, r) => s + r.invested, 0)
    const dayChange = priced.reduce((s, r) => {
      const pct = r.dayChangePct ?? 0
      const prev = (r.value ?? 0) / (1 + pct / 100)
      return s + ((r.value ?? 0) - prev)
    }, 0)
    return {
      rows,
      invested,
      value,
      pnl: value - invested,
      pnlPct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
      dayChange,
    }
  }, [holdings.data, quotes.data])

  return { holdings, quotes, ...summary }
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
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<Holding[]>(key)
      client.setQueryData<Holding[]>(key, (old = []) => old.filter((h) => h.id !== id))
      return { previous }
    },
    onError: (_e, _id, ctx) => ctx?.previous && client.setQueryData(key, ctx.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}
