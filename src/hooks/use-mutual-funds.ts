import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { mfApi } from "@/api/endpoints"
import { qk } from "@/queries/keys"

export function useFundSearch(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: qk.mfSearch(term),
    queryFn: ({ signal }) => mfApi.search(term, signal),
    enabled: term.length >= 2,
    staleTime: 60 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useFund(code: string) {
  return useQuery({
    queryKey: qk.mf(code),
    queryFn: ({ signal }) => mfApi.get(code, signal),
    enabled: !!code,
    // NAVs are published once a day.
    staleTime: 60 * 60_000,
  })
}
