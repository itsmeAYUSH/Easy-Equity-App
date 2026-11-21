import { View } from "react-native"

import { Text } from "@/components/ui/Text"

/** Where today's price sits between the 52-week low and high. */
export function RangeBar({
  low,
  high,
  value,
  format,
  lowLabel = "52W low",
  highLabel = "52W high",
}: {
  low: number | null | undefined
  high: number | null | undefined
  value: number | null | undefined
  format: (v: number | null | undefined) => string
  lowLabel?: string
  highLabel?: string
}) {
  if (low == null || high == null || value == null || !(high > low)) return null
  const pos = Math.max(0, Math.min(1, (value - low) / (high - low)))
  return (
    <View className="gap-2">
      <View className="h-1.5 rounded-full bg-secondary">
        <View className="h-1.5 rounded-full bg-accent/40" style={{ width: `${pos * 100}%` }} />
        <View
          className="absolute -top-[5px] h-4 w-4 rounded-full border-[3px] border-card bg-accent"
          style={{ left: `${pos * 100}%`, marginLeft: -8 }}
        />
      </View>
      <View className="flex-row justify-between">
        <View>
          <Text className="text-[11px] text-muted-foreground">{lowLabel}</Text>
          <Text className="text-xs font-semibold text-foreground">{format(low)}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-muted-foreground">{highLabel}</Text>
          <Text className="text-xs font-semibold text-foreground">{format(high)}</Text>
        </View>
      </View>
    </View>
  )
}
