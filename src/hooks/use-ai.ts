import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { aiApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import type { StockAnalysis } from "@/lib/types"
import { qk } from "@/queries/keys"

/** AI market insights (stocks to watch, sector outlook). Cached server-side; Pro refreshes more often. */
export function useMarketAnalysis() {
  const { isPro } = useSession()
  return useQuery({
    queryKey: qk.marketAnalysis,
    queryFn: ({ signal }) => aiApi.marketAnalysis(signal),
    staleTime: (isPro ? 15 : 60) * 60_000,
    retry: false,
  })
}

/**
 * AI stock analysis. A mutation, not a query: every run spends one of the
 * user's daily AI analyses, so it only runs when the user asks. The result is
 * kept in the query cache, so reopening the stock shows it without a re-run.
 */
export function useStockAnalysis(symbol: string) {
  const client = useQueryClient()
  const cached = useQuery({
    queryKey: qk.stockAnalysis(symbol),
    queryFn: () => client.getQueryData<StockAnalysis>(qk.stockAnalysis(symbol)) ?? null,
    enabled: false,
    staleTime: Infinity,
  })
  const run = useMutation({
    mutationFn: () => aiApi.stockAnalysis(symbol),
    onSuccess: (data) => client.setQueryData(qk.stockAnalysis(symbol), data),
  })
  return { data: run.data ?? cached.data ?? null, run }
}
