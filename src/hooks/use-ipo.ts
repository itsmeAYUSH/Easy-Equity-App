import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { ipoApi, ipoRemindersApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import type { Ipo, IpoDetailResponse } from "@/lib/ipo"
import { qk } from "@/queries/keys"

/** IPO list. The server refreshes it ~3 times a day; while it warms up it asks us to retry. */
export function useIpos() {
  const client = useQueryClient()
  return useQuery({
    queryKey: qk.ipos,
    queryFn: async ({ signal }) => {
      const data = await ipoApi.list(signal)
      // Seed each detail page's header from the list (instant open). updatedAt 0
      // marks the seed stale, so opening the page still fetches the full detail.
      for (const ipo of data.ipos) {
        if (!client.getQueryData(qk.ipo(ipo.slug))) {
          client.setQueryData<Partial<IpoDetailResponse>>(
            qk.ipo(ipo.slug),
            { ipo, detail: null, detailState: "pending", retryAfterSec: null },
            { updatedAt: 0 },
          )
        }
      }
      return data
    },
    staleTime: 10 * 60_000,
    refetchInterval: (q) => (q.state.data?.warming ? (q.state.data.retryAfterSec ?? 30) * 1000 : false),
  })
}

export function useIpo(slug: string) {
  return useQuery({
    queryKey: qk.ipo(slug),
    queryFn: ({ signal }) => ipoApi.get(slug, signal),
    enabled: !!slug,
    staleTime: 10 * 60_000,
    // Details are fetched upstream on demand; poll while the server says "pending".
    refetchInterval: (q) => {
      const d = q.state.data as IpoDetailResponse | undefined
      return d?.detailState === "pending" && d.retryAfterSec ? Math.max(d.retryAfterSec, 15) * 1000 : false
    },
  })
}

export function useIpoReminders() {
  const { userId } = useSession()
  const client = useQueryClient()
  const key = qk.ipoReminders(userId)
  const query = useQuery({
    queryKey: key,
    queryFn: ipoRemindersApi.list,
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
  const toggle = useMutation({
    mutationFn: ({ slug, on }: { slug: string; on: boolean }) =>
      on ? ipoRemindersApi.add(slug) : ipoRemindersApi.remove(slug),
    onMutate: async ({ slug, on }) => {
      haptics.tap()
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<{ slugs: string[] }>(key)
      const slugs = new Set(previous?.slugs ?? [])
      if (on) slugs.add(slug)
      else slugs.delete(slug)
      client.setQueryData(key, { slugs: [...slugs] })
      return { previous }
    },
    onError: (_e, _v, ctx) => ctx?.previous && client.setQueryData(key, ctx.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
  return { slugs: new Set(query.data?.slugs ?? []), toggle }
}

export type { Ipo }
