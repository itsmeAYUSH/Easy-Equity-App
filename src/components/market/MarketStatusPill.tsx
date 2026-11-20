import { useEffect, useState } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { nseStatus } from "@/lib/market-status"

/** "Market open" / "Closed · Weekend" — re-checked every minute. */
export function MarketStatusPill() {
  const [status, setStatus] = useState(() => nseStatus())
  useEffect(() => {
    const id = setInterval(() => setStatus(nseStatus()), 60_000)
    return () => clearInterval(id)
  }, [])
  const open = status.state === "open" || status.state === "pre-open"
  return (
    <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${open ? "bg-bullish-bg" : "bg-neutral-bg"}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${open ? "bg-bullish" : "bg-neutral"}`} />
      <Text className={`text-[11px] font-semibold ${open ? "text-bullish" : "text-neutral"}`}>NSE · {status.label}</Text>
    </View>
  )
}
