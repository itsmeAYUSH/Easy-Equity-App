/**
 * React Query for React Native, set up the way TanStack's docs recommend,
 * plus a cache that survives restarts:
 *
 * - focusManager follows AppState: coming back to the app refetches stale
 *   data, and nothing polls while the app is in the background.
 * - onlineManager follows expo-network: queries pause offline and resume on
 *   reconnect, instead of failing.
 * - Persisted cache: news, tickers, movers and IPOs are saved to storage and
 *   shown instantly on the next launch while fresh data loads. Per-user data
 *   is never saved (queries/keys.ts → shouldPersistQuery).
 */
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { focusManager, onlineManager } from "@tanstack/react-query"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import * as Network from "expo-network"
import { useEffect, type ReactNode } from "react"
import { AppState, Platform, type AppStateStatus } from "react-native"

import { isAiPlaceholder } from "@/lib/ai"
import { storage } from "@/lib/storage"
import { queryClient } from "@/queries/client"
import { shouldPersistQuery } from "@/queries/keys"

const persister = createAsyncStoragePersister({
  storage,
  key: "easyequity.query-cache.v1",
  throttleTime: 2_000,
})

/** Bump when a persisted response shape changes, so old caches are dropped. */
const CACHE_BUSTER = "2"

function syncFocus(status: AppStateStatus) {
  if (Platform.OS !== "web") focusManager.setFocused(status === "active")
}

const isReachable = (state: Network.NetworkState) => state.isConnected !== false && state.isInternetReachable !== false

export function DataProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sub = AppState.addEventListener("change", syncFocus)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (Platform.OS === "web") return // the browser's online/offline events already drive it
    return onlineManager.setEventListener((setOnline) => {
      Network.getNetworkStateAsync()
        .then((state) => setOnline(isReachable(state)))
        .catch(() => {})
      const sub = Network.addNetworkStateListener((state) => setOnline(isReachable(state)))
      return () => sub.remove()
    })
  }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: CACHE_BUSTER,
        maxAge: 24 * 60 * 60_000,
        dehydrateOptions: {
          // An AI "warming up" placeholder is never saved: the next launch asks again.
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" && shouldPersistQuery(q.queryKey) && !isAiPlaceholder(q.state.data),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
