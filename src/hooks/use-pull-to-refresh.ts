import { useCallback, useState } from "react"

import { haptics } from "@/lib/haptics"

/**
 * Pull-to-refresh state that only shows the spinner for a PULL — not for
 * background refetches (binding `refreshing` to `isFetching` makes the spinner
 * pop up on every focus refetch and poll).
 */
export function usePullToRefresh(...refetchers: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    haptics.tick()
    try {
      await Promise.allSettled(refetchers.map((r) => r()))
    } finally {
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch functions are stable per query
  }, refetchers)
  return { refreshing, onRefresh }
}
