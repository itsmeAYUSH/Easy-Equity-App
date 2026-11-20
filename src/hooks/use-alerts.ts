import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { alertsApi } from "@/api/endpoints"
import { useSession } from "@/lib/auth/session"
import { haptics } from "@/lib/haptics"
import type { AppNotification, PriceAlert } from "@/lib/types"
import { qk } from "@/queries/keys"

export function usePriceAlerts() {
  const { userId } = useSession()
  return useQuery({
    queryKey: qk.priceAlerts(userId),
    queryFn: alertsApi.priceList,
    enabled: !!userId,
    staleTime: 2 * 60_000,
  })
}

export function useCreatePriceAlert() {
  const { userId } = useSession()
  const client = useQueryClient()
  return useMutation({
    mutationFn: alertsApi.priceCreate,
    onSuccess: () => {
      haptics.success()
      return client.invalidateQueries({ queryKey: qk.priceAlerts(userId) })
    },
  })
}

export function useDeletePriceAlert() {
  const { userId } = useSession()
  const client = useQueryClient()
  const key = qk.priceAlerts(userId)
  return useMutation({
    mutationFn: alertsApi.priceDelete,
    onMutate: async (id: string) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<PriceAlert[]>(key)
      client.setQueryData<PriceAlert[]>(key, (old = []) => old.filter((a) => a.id !== id))
      return { previous }
    },
    onError: (_e, _id, ctx) => ctx?.previous && client.setQueryData(key, ctx.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}

/**
 * The bell: triggered price alerts and IPO reminders. One poller (the tabs
 * layout passes `poll: true`); the badge and the list read the same cache.
 */
export function useNotifications({ poll = false }: { poll?: boolean } = {}) {
  const { userId } = useSession()
  const query = useQuery({
    queryKey: qk.notifications(userId),
    queryFn: alertsApi.notifications,
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnMount: poll ? true : false,
    refetchInterval: poll ? 2 * 60_000 : false,
  })
  const unread = (query.data ?? []).filter((n) => !n.is_read).length
  return { ...query, unread }
}

export function useMarkNotificationsRead() {
  const { userId } = useSession()
  const client = useQueryClient()
  const key = qk.notifications(userId)
  return useMutation({
    mutationFn: (id?: string) => (id ? alertsApi.markRead(id) : alertsApi.markAllRead()),
    onMutate: async (id?: string) => {
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<AppNotification[]>(key)
      client.setQueryData<AppNotification[]>(key, (old = []) =>
        old.map((n) => (!id || n.id === id ? { ...n, is_read: true } : n)),
      )
      return { previous }
    },
    onError: (_e, _id, ctx) => ctx?.previous && client.setQueryData(key, ctx.previous),
    onSettled: () => client.invalidateQueries({ queryKey: key }),
  })
}
