import { router } from "expo-router"
import { memo } from "react"
import { FlatList, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { PriceChange } from "@/components/ui/PriceChange"
import { Shimmer } from "@/components/ui/Shimmer"
import { useTickers } from "@/hooks/use-market"
import { fmtNum, fmtPrice, trendOf } from "@/lib/format"
import type { Ticker } from "@/lib/types"

const TickerTile = memo(function TickerTile({ t }: { t: Ticker }) {
  const isIndex = t.type === "index" || t.symbol.startsWith("^")
  const trend = trendOf(t.changePercent)
  return (
    <Tappable
      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: t.symbol } })}
      className="w-40 gap-2 overflow-hidden rounded-2xl border border-border bg-card p-4"
      accessibilityLabel={`${t.name}, ${fmtNum(t.price)}`}
    >
      {/* Trend stripe along the top edge. */}
      <View className={`absolute left-0 right-0 top-0 h-[3px] ${trend === "up" ? "bg-bullish" : trend === "down" ? "bg-bearish" : "bg-neutral"}`} />
      <Text numberOfLines={1} className="text-xs font-medium text-muted-foreground">
        {t.name}
      </Text>
      <Text numberOfLines={1} className="text-[17px] font-bold text-foreground">
        {isIndex ? fmtNum(t.price) : fmtPrice(t.price, t.currency ?? (t.type === "crypto" ? "USD" : "INR"))}
      </Text>
      <View className="flex-row">
        <PriceChange pct={t.changePercent} size="xs" variant="pill" />
      </View>
    </Tappable>
  )
})

/** Live index/crypto tiles. Reads the shared ticker cache; the tabs layout owns the poll. */
export function TickerStrip() {
  const { data, isPending } = useTickers()
  if (isPending && !data) {
    return (
      <View className="flex-row gap-3 px-5">
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} width={160} height={98} radius={16} />
        ))}
      </View>
    )
  }
  if (!data?.tickers.length) return null
  return (
    <FlatList
      horizontal
      data={data.tickers}
      keyExtractor={(t) => t.symbol}
      renderItem={({ item }) => <TickerTile t={item} />}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 px-5"
      initialNumToRender={4}
      windowSize={3}
    />
  )
}
