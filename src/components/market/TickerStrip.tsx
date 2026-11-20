import { router } from "expo-router"
import { memo } from "react"
import { FlatList, View } from "react-native"
import { Text } from "@/components/ui/Text"

import { Tappable } from "@/components/ui/Tappable"
import { PriceChange } from "@/components/ui/PriceChange"
import { Shimmer } from "@/components/ui/Shimmer"
import { useTickers } from "@/hooks/use-market"
import { fmtNum, fmtPrice } from "@/lib/format"
import type { Ticker } from "@/lib/types"

const TickerTile = memo(function TickerTile({ t }: { t: Ticker }) {
  const isIndex = t.type === "index" || t.symbol.startsWith("^")
  return (
    <Tappable
      onPress={() => router.push({ pathname: "/stock/[symbol]", params: { symbol: t.symbol } })}
      className="w-36 gap-1 rounded-2xl border border-border bg-card p-3"
      accessibilityLabel={`${t.name}, ${fmtNum(t.price)}`}
    >
      <Text numberOfLines={1} className="text-xs font-medium text-muted-foreground">
        {t.name}
      </Text>
      <Text numberOfLines={1} className="text-base font-bold text-foreground">
        {isIndex ? fmtNum(t.price) : fmtPrice(t.price, t.currency ?? (t.type === "crypto" ? "USD" : "INR"))}
      </Text>
      <PriceChange pct={t.changePercent} size="xs" />
    </Tappable>
  )
})

/** Live index/crypto tiles. Reads the shared ticker cache; the tabs layout owns the poll. */
export function TickerStrip() {
  const { data, isPending } = useTickers()
  if (isPending && !data) {
    return (
      <View className="flex-row gap-3 px-4 py-2">
        {[0, 1, 2].map((i) => (
          <Shimmer key={i} width={144} height={78} radius={16} />
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
      contentContainerClassName="gap-3 px-4 py-2"
      initialNumToRender={4}
      windowSize={3}
    />
  )
}
