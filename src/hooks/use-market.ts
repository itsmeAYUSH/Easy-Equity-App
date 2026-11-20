import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { marketApi } from "@/api/endpoints"
import { isMarketHours } from "@/lib/market-status"
import type { HistoryRange } from "@/lib/types"
import { qk } from "@/queries/keys"

/**
 * Live tickers (NIFTY, SENSEX, S&P, BTC …).
 *
 * Only the tabs layout passes `poll: true` (refetchInterval runs once per
 * observer); every other reader shares the cache without adding requests.
 * Polls every 60 s in NSE hours, every 5 min outside them, and not at all
 * while the app is in the background.
 */
export function useTickers({ poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: qk.tickers,
    queryFn: ({ signal }) => marketApi.tickers(signal),
    staleTime: 30_000,
    refetchOnMount: poll ? true : false,
    refetchInterval: poll ? () => (isMarketHours() ? 60_000 : 5 * 60_000) : false,
  })
}

export function useMovers() {
  return useQuery({
    queryKey: qk.movers,
    queryFn: ({ signal }) => marketApi.movers(signal),
    staleTime: 5 * 60_000,
  })
}

/** Batch quotes (watchlist, portfolio). The API caps a call at 40 symbols. */
export function useQuotes(symbols: string[]) {
  const list = symbols.slice(0, 40)
  return useQuery({
    queryKey: qk.quotes(list),
    queryFn: ({ signal }) => marketApi.quotes(list, signal),
    enabled: list.length > 0,
    staleTime: 30_000,
    refetchInterval: () => (isMarketHours() ? 60_000 : false),
    placeholderData: keepPreviousData,
  })
}

export function useHistory(symbol: string, range: HistoryRange) {
  return useQuery({
    queryKey: qk.history(symbol, range),
    queryFn: ({ signal }) => marketApi.history(symbol, range, signal),
    enabled: !!symbol,
    staleTime: range === "1D" ? 60_000 : 10 * 60_000,
    // Switching range keeps the old line on screen until the new one lands (no flash).
    placeholderData: keepPreviousData,
  })
}

/** Symbol autocomplete. Pass a debounced query; under 2 characters returns nothing. */
export function useSymbolSearch(q: string, includeCrypto = true) {
  const term = q.trim()
  return useQuery({
    queryKey: qk.search(`${includeCrypto ? "c:" : ""}${term}`),
    queryFn: ({ signal }) => marketApi.search(term, includeCrypto, signal),
    enabled: term.length >= 2,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useScreener() {
  return useQuery({
    queryKey: qk.screener,
    queryFn: ({ signal }) => marketApi.screener(signal),
    staleTime: 5 * 60_000,
  })
}

export function useFearGreed() {
  return useQuery({
    queryKey: qk.fearGreed,
    queryFn: ({ signal }) => marketApi.fearGreed(signal),
    staleTime: 30 * 60_000,
  })
}

export function useCommodities() {
  return useQuery({
    queryKey: qk.commodities,
    queryFn: ({ signal }) => marketApi.commodities(signal),
    staleTime: 5 * 60_000,
  })
}
