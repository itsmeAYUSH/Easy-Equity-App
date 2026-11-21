import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { calendarApi, marketApi } from "@/api/endpoints"
import { isMarketHours } from "@/lib/market-status"
import type { HistoryRange, Quote } from "@/lib/types"
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

/** The API answers at most 40 symbols per quotes call. */
const QUOTES_PER_CALL = 40

/**
 * Batch quotes (watchlist, portfolio, compare). Long lists are split into
 * calls of 40, so a big portfolio is still priced in full.
 */
export function useQuotes(symbols: string[]) {
  const joined = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean).join(",")
  const chunks = useMemo(() => {
    const unique = [...new Set(joined ? joined.split(",") : [])]
    const out: string[][] = []
    for (let i = 0; i < unique.length; i += QUOTES_PER_CALL) out.push(unique.slice(i, i + QUOTES_PER_CALL))
    return out
  }, [joined])

  return useQueries({
    queries: chunks.map((list) => ({
      queryKey: qk.quotes(list),
      queryFn: ({ signal }: { signal: AbortSignal }) => marketApi.quotes(list, signal),
      staleTime: 30_000,
      refetchInterval: () => (isMarketHours() ? 60_000 : false),
      placeholderData: keepPreviousData,
    })),
    combine: (results) => ({
      data: results.some((r) => r.data) ? results.flatMap((r) => r.data ?? []) : (undefined as Quote[] | undefined),
      isPending: results.some((r) => r.isPending),
      isError: results.length > 0 && results.every((r) => r.isError),
      error: results.find((r) => r.error)?.error ?? null,
      refetch: () => Promise.all(results.map((r) => r.refetch())),
    }),
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

/** ₹ per unit of USD, EUR, GBP, JPY. Daily reference rates. */
export function useForex() {
  return useQuery({
    queryKey: qk.forex,
    queryFn: ({ signal }) => marketApi.forex(signal),
    staleTime: 60 * 60_000,
  })
}

/** India macro indicators (World Bank, yearly). */
export function useMacro() {
  return useQuery({
    queryKey: qk.macro,
    queryFn: ({ signal }) => marketApi.macro(signal),
    staleTime: 12 * 60 * 60_000,
  })
}

/** Upcoming earnings (next ~2 weeks). */
export function useEarnings() {
  return useQuery({
    queryKey: qk.earnings,
    queryFn: ({ signal }) => calendarApi.earnings(signal),
    staleTime: 6 * 60 * 60_000,
    retry: false,
  })
}

export function useCommodities() {
  return useQuery({
    queryKey: qk.commodities,
    queryFn: ({ signal }) => marketApi.commodities(signal),
    staleTime: 5 * 60_000,
  })
}
