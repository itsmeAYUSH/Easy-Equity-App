import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { aiApi, usageApi } from "@/api/endpoints"
import { isAiPlaceholder, normalizePortfolioAnalysis, type PortfolioAnalysis } from "@/lib/ai"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import { portfolioAiLines } from "@/lib/portfolio"
import type { Holding, StockAnalysis } from "@/lib/types"
import { qk } from "@/queries/keys"

/** While the server says the AI is warming up, ask again this often. */
const WARMING_RETRY_MS = 45_000

/**
 * Options for the shared AI reports (market insights, daily digest, sectors).
 * The server caches them for everyone and refreshes Pro more often; a
 * "warming up" placeholder is treated as stale and re-asked every 45 s.
 */
type CachedQuery = { state: { data: unknown } }

function sharedAiOptions(isPro: boolean) {
  const fresh = (isPro ? 15 : 60) * 60_000
  return {
    staleTime: (q: CachedQuery) => (isAiPlaceholder(q.state.data) ? 0 : fresh),
    refetchInterval: (q: CachedQuery) => (isAiPlaceholder(q.state.data) ? WARMING_RETRY_MS : false),
    retry: false,
  } as const
}

/** AI market insights (stocks to watch, sector outlook). */
export function useMarketAnalysis() {
  const { isPro } = useSession()
  const query = useQuery({
    queryKey: qk.marketAnalysis,
    queryFn: ({ signal }) => aiApi.marketAnalysis(signal),
    ...sharedAiOptions(isPro),
  })
  return { ...query, warming: isAiPlaceholder(query.data) }
}

/** AI daily digest: executive summary, sections by market, key takeaways. */
export function useDailyDigest() {
  const { isPro } = useSession()
  const query = useQuery({
    queryKey: qk.dailyDigest,
    queryFn: ({ signal }) => aiApi.dailyDigest(signal),
    ...sharedAiOptions(isPro),
  })
  return { ...query, warming: isAiPlaceholder(query.data) }
}

/** AI sector intelligence: outlook, drivers and risks per sector. */
export function useSectorIntelligence() {
  const { isPro } = useSession()
  const query = useQuery({
    queryKey: qk.sectorAnalysis,
    queryFn: ({ signal }) => aiApi.sectorAnalysis(signal),
    ...sharedAiOptions(isPro),
  })
  const warming = isAiPlaceholder(query.data) && !(query.data?.sectors?.length ?? 0)
  return { ...query, warming }
}

/** Today's AI analyses left (free plan: the server's daily limit). Signed-in users only. */
export function useAiUsage() {
  const { userId } = useSession()
  return useQuery({
    queryKey: qk.usage(userId),
    queryFn: usageApi.get,
    enabled: !!userId,
    staleTime: 60_000,
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
  const { userId } = useSession()
  const cached = useQuery({
    queryKey: qk.stockAnalysis(symbol),
    queryFn: () => client.getQueryData<StockAnalysis>(qk.stockAnalysis(symbol)) ?? null,
    enabled: false,
    staleTime: Infinity,
  })
  const run = useMutation({
    mutationFn: () => aiApi.stockAnalysis(symbol),
    onSuccess: (data) => {
      haptics.success()
      client.setQueryData(qk.stockAnalysis(symbol), data)
    },
    onError: () => haptics.fail(),
    // The server counts the analysis: re-read what's left today.
    onSettled: () => client.invalidateQueries({ queryKey: qk.usage(userId) }),
  })
  return { data: run.data ?? cached.data ?? null, run }
}

/** Portfolio AI (Pro): diversification, sector mix and risks. Runs on demand, kept for the session. */
export function usePortfolioAnalysis() {
  const client = useQueryClient()
  const { userId } = useSession()
  const key = qk.portfolioAi(userId)
  const cached = useQuery({
    queryKey: key,
    queryFn: () => client.getQueryData<PortfolioAnalysis>(key) ?? null,
    enabled: false,
    staleTime: Infinity,
  })
  const run = useMutation({
    mutationFn: async (holdings: Holding[]) => {
      const res = await aiApi.portfolioAnalysis(portfolioAiLines(holdings))
      return normalizePortfolioAnalysis(res.result)
    },
    onSuccess: (data) => {
      haptics.success()
      client.setQueryData(key, data)
    },
    onError: () => haptics.fail(),
    onSettled: () => client.invalidateQueries({ queryKey: qk.usage(userId) }),
  })
  return { data: run.data ?? cached.data ?? null, run }
}
