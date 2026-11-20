import { memo } from "react"
import { View } from "react-native"
import { Text } from "@/components/ui/Text"

import { fmtPct, trendOf } from "@/lib/format"

/** Coloured % change: as plain text, or as a filled pill. */
export const PriceChange = memo(function PriceChange({
  pct,
  variant = "text",
  size = "sm",
}: {
  pct: number | null | undefined
  variant?: "text" | "pill"
  size?: "xs" | "sm" | "md"
}) {
  const t = trendOf(pct)
  const color = t === "up" ? "text-bullish" : t === "down" ? "text-bearish" : "text-muted-foreground"
  const textSize = size === "xs" ? "text-xs" : size === "md" ? "text-base" : "text-sm"
  const arrow = t === "up" ? "▲ " : t === "down" ? "▼ " : ""
  if (variant === "pill") {
    const bg = t === "up" ? "bg-bullish-bg" : t === "down" ? "bg-bearish-bg" : "bg-neutral-bg"
    return (
      <View className={`rounded-md px-2 py-0.5 ${bg}`}>
        <Text className={`${textSize} font-semibold ${color}`}>{fmtPct(pct)}</Text>
      </View>
    )
  }
  return (
    <Text className={`${textSize} font-semibold ${color}`}>
      {arrow}
      {fmtPct(pct)}
    </Text>
  )
})
